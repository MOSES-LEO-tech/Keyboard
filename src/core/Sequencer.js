export class Sequencer {
    constructor(audioEngine, stateManager) {
        this.audioEngine = audioEngine;
        this.stateManager = stateManager;

        this.isPlaying    = false;
        this.currentSong  = null;

        // Time tracking
        this.startTime  = 0;
        this.songTime   = 0;

        this.events = [];
        this.cursor = 0;

        // Lookahead scheduler
        this.lookAheadTime    = 0.1;
        this.scheduleInterval = 25;
        this.timerID          = null;
        this.lastFrameTime    = 0;

        // Settings
        this.speed      = 1.0;
        this.isWaitMode = true;
        this.autoPlay   = false;
        this.difficulty = 'hard';

        /**
         * handAssist: which hand the computer plays automatically
         * 'none'  — player must play both hands
         * 'left'  — computer plays left hand, player plays right
         * 'right' — computer plays right hand, player plays left
         */
        this.handAssist = 'none';

        // Notes the player must play (right hand, or left, depending on assist)
        this.targetNotes = new Set();

        this.onNoteRequired = null;
        this.totalEvents    = 0;

        if (this.stateManager) {
            this.stateManager.subscribe(state => {
                if (typeof state.speed === 'number') this.speed = state.speed;
                this.isWaitMode = state.waitMode;
                this.autoPlay   = state.autoPlay;

                if (state.handAssist !== undefined && state.handAssist !== this.handAssist) {
                    this.handAssist = state.handAssist;
                    if (this.currentSong) this.reloadSong();
                }

                if (state.difficulty !== this.difficulty) {
                    this.difficulty = state.difficulty;
                    if (this.currentSong) this.reloadSong();
                }
            });

            const s = this.stateManager.getState();
            this.speed      = s.speed      || 1.0;
            this.isWaitMode = s.waitMode;
            this.autoPlay   = s.autoPlay;
            this.difficulty = s.difficulty || 'hard';
            this.handAssist = s.handAssist || 'none';
        }
    }

    // ─────────────────────────────────────────────
    //  Song loading
    // ─────────────────────────────────────────────

    loadSong(song) {
        this.currentSong = song;
        this.events      = this.parseSong(song);
        this.reset();
    }

    reloadSong() {
        if (this.currentSong) {
            const wasPlaying = this.isPlaying;
            this.stop();
            this.events = this.parseSong(this.currentSong);
            if (wasPlaying) this.play();
        }
    }

    /**
     * parseSong — converts song tracks into a flat, sorted event list.
     *
     * Each event now carries a `hand` property so the scheduler can
     * decide whether to auto-play it (assist) or wait for the player.
     */
    parseSong(song) {
        let events = [];
        const secondsPerBeat = 60 / song.bpm;
        const isEasy     = this.difficulty === 'easy';
        const isBeginner = this.difficulty === 'beginner';

        // Group notes by start time (for chord detection + beginner simplification)
        const notesByTime = new Map();

        song.tracks.forEach(track => {
            const hand = track.hand || 'right';

            // Difficulty filter: easy/beginner drop the left hand entirely
            if ((isBeginner || isEasy) && hand === 'left') return;

            track.notes.forEach(note => {
                const startTime = note.start * secondsPerBeat;
                if (!notesByTime.has(startTime)) notesByTime.set(startTime, []);
                notesByTime.get(startTime).push({ ...note, hand });
            });
        });

        // Process groups
        notesByTime.forEach((notes, startTime) => {
            let notesToKeep = notes;

            // Beginner: keep only highest pitch note per chord
            if (isBeginner && notes.length > 1) {
                notesToKeep = [notes.reduce((prev, curr) =>
                    this._midiNumber(curr.note) > this._midiNumber(prev.note) ? curr : prev
                )];
            }

            notesToKeep.forEach(note => {
                const duration = note.duration * secondsPerBeat;

                events.push({
                    type: 'noteOn',
                    note: note.note,
                    hand: note.hand,
                    time: startTime,
                    velocity: 0.8
                });

                events.push({
                    type: 'noteOff',
                    note: note.note,
                    hand: note.hand,
                    time: startTime + duration
                });
            });
        });

        this.totalEvents = events.filter(e => e.type === 'noteOn').length;
        return events.sort((a, b) => a.time - b.time);
    }

    _midiNumber(noteName) {
        const notes = { 'C':0,'C#':1,'D':2,'D#':3,'E':4,'F':5,'F#':6,'G':7,'G#':8,'A':9,'A#':10,'B':11 };
        const m = noteName.match(/([A-G]#?)(\d)/);
        if (m) return notes[m[1]] + (parseInt(m[2]) + 1) * 12;
        return 60;
    }

    // ─────────────────────────────────────────────
    //  Transport
    // ─────────────────────────────────────────────

    play() {
        if (!this.currentSong || this.isPlaying) return;
        if (this.audioEngine?.context?.state !== 'running') {
            this.audioEngine.context.resume();
        }
        this.isPlaying     = true;
        this.lastFrameTime = this.audioEngine.context.now();
        this.schedule();
    }

    pause() {
        this.isPlaying = false;
        clearTimeout(this.timerID);
    }

    stop() {
        this.isPlaying = false;
        this.songTime  = 0;
        this.cursor    = 0;
        this.targetNotes.clear();
        clearTimeout(this.timerID);
        if (window.app?.mainStream) window.app.mainStream.update(0);
    }

    reset() { this.stop(); }

    setWaitMode(enabled)  { this.isWaitMode = enabled; }
    setAutoPlay(enabled)  { this.autoPlay = enabled; }
    setHandAssist(hand)   { this.handAssist = hand; }

    // ─────────────────────────────────────────────
    //  Player input — called when user plays a note
    // ─────────────────────────────────────────────

    advance(noteName) {
        if (!this.isWaitMode || !this.isPlaying) return;

        if (noteName && this.targetNotes.has(noteName)) {
            this.targetNotes.delete(noteName);
            // When all required notes played, sequencer resumes automatically on next tick
        }
    }

    // ─────────────────────────────────────────────
    //  Scheduler
    // ─────────────────────────────────────────────

    schedule() {
        if (!this.isPlaying) return;

        const currentTime = this.audioEngine.context.now();
        const delta       = currentTime - this.lastFrameTime;
        this.lastFrameTime = currentTime;
        const safeDelta   = Math.min(delta, 0.1);

        // ── 1. Are we blocked waiting for player? ──
        if (this.isWaitMode && !this.autoPlay && this.targetNotes.size > 0) {
            if (window.app?.mainStream) window.app.mainStream.update(this.songTime);
            this.timerID = setTimeout(() => this.schedule(), this.scheduleInterval);
            return;
        }

        // ── 2. Time advancement + blocker detection ──
        let targetTime = this.songTime + safeDelta * this.speed;
        let hitBlocker = false;

        while (this.cursor < this.events.length) {
            const event = this.events[this.cursor];
            if (event.time > targetTime + 0.0001) break;

            if (event.type === 'noteOn' && this.isWaitMode && !this.autoPlay) {
                // Is this note one the PLAYER must play?
                const playerMustPlay = this._playerMustPlay(event.hand);

                if (playerMustPlay) {
                    hitBlocker = true;
                    this.songTime = event.time;
                    this.targetNotes.add(event.note);

                    // Grab simultaneous chord notes (within 20ms)
                    let look = this.cursor + 1;
                    while (look < this.events.length) {
                        const next = this.events[look];
                        if (next.type === 'noteOn' && Math.abs(next.time - event.time) < 0.02) {
                            if (this._playerMustPlay(next.hand)) {
                                this.targetNotes.add(next.note);
                            }
                            look++;
                        } else break;
                    }

                    if (this.onNoteRequired) this.onNoteRequired(Array.from(this.targetNotes));
                    this.cursor = look;
                    break;
                } else {
                    // Assisted hand noteOn — auto-play it immediately, don't block
                    this._scheduleNote(event, currentTime, 0);
                    this.cursor++;
                }
            } else {
                // NoteOff or autoPlay mode — pass through
                break;
            }
        }

        if (!hitBlocker) this.songTime = targetTime;

        // Update visuals
        if (window.app?.mainStream) window.app.mainStream.update(this.songTime);

        // ── 3. Lookahead audio scheduling ──
        if (!hitBlocker) {
            const scheduleUntil = this.songTime + this.lookAheadTime * this.speed;
            let peekCursor = this.cursor;

            while (peekCursor < this.events.length) {
                const event = this.events[peekCursor];
                if (event.time > scheduleUntil) break;

                // Stop lookahead if we'd hit a player blocker
                if (event.type === 'noteOn' && this.isWaitMode && !this.autoPlay
                    && this._playerMustPlay(event.hand)) {
                    break;
                }

                const timeDelta   = event.time - this.songTime;
                const realDelay   = Math.max(0, timeDelta / this.speed);

                this._scheduleNote(event, currentTime, realDelay);
                this.cursor++;
                peekCursor++;
            }
        }

        // ── 4. Loop / finish ──
        if (this.cursor < this.events.length || this.isPlaying) {
            this.timerID = setTimeout(() => this.schedule(), this.scheduleInterval);
        } else {
            this.isPlaying = false;
            console.log('Song finished');
            if (this.stateManager?.getState().loop) {
                this.stop();
                this.play();
            }
        }
    }

    /**
     * Returns true if the player is responsible for playing this hand.
     * With no assist: player plays everything.
     * With left assist: computer plays left, player plays right only.
     * With right assist: computer plays right, player plays left only.
     */
    _playerMustPlay(hand) {
        if (this.handAssist === 'none')  return true;
        if (this.handAssist === 'left')  return hand === 'right'; // assist left → player plays right
        if (this.handAssist === 'right') return hand === 'left';  // assist right → player plays left
        return true;
    }

    _scheduleNote(event, currentAudioTime, realDelay) {
        const absoluteTime = currentAudioTime + realDelay;
        if (event.type === 'noteOn') {
            this.audioEngine.handleNote({
                type:     'noteOn',
                fullName: event.note,
                velocity: event.velocity ?? 0.8,
                time:     absoluteTime
            });
        } else {
            this.audioEngine.handleNote({
                type:     'noteOff',
                fullName: event.note,
                time:     absoluteTime
            });
        }
    }
}
