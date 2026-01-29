export class Sequencer {
    constructor(audioEngine, stateManager) {
        this.audioEngine = audioEngine;
        this.stateManager = stateManager;

        this.isPlaying = false;
        this.currentSong = null;

        // Time tracking
        this.startTime = 0;
        this.songTime = 0; // Current position in song (Seconds)

        this.events = []; // Sorted List
        this.cursor = 0;

        // Lookahead
        this.lookAheadTime = 0.1;
        this.scheduleInterval = 25;
        this.timerID = null;

        // Settings
        this.speed = 1.0;
        this.isWaitMode = true;
        this.difficulty = 'hard';
        // AutoPlay is now essentially "Play Mode" vs "Learn Mode", but we keep flag for Hybrid
        this.autoPlay = false;

        this.targetNotes = new Set();
        this.onNoteRequired = null;

        if (this.stateManager) {
            this.stateManager.subscribe(state => {
                if (typeof state.speed === 'number') this.speed = state.speed;
                this.isWaitMode = state.waitMode;
                this.autoPlay = state.autoPlay;

                // If difficulty changes, we might need to re-parse current song?
                if (state.difficulty !== this.difficulty) {
                    this.difficulty = state.difficulty;
                    if (this.currentSong) this.reloadSong();
                }
            });
            const s = this.stateManager.getState();
            this.speed = s.speed || 1.0;
            this.isWaitMode = s.waitMode;
            this.autoPlay = s.autoPlay;
            this.difficulty = s.difficulty || 'hard';
        }
    }

    setWaitMode(enabled) {
        this.isWaitMode = enabled;
    }

    setAutoPlay(enabled) {
        this.autoPlay = enabled;
    }

    reloadSong() {
        if (this.currentSong) {
            const wasPlaying = this.isPlaying;
            this.stop();
            this.events = this.parseSong(this.currentSong);
            if (wasPlaying) this.play();
        }
    }

    loadSong(song) {
        this.currentSong = song;
        this.events = this.parseSong(song);
        this.reset();
    }

    parseSong(song) {
        let events = [];
        const secondsPerBeat = 60 / song.bpm;
        const isEasy = this.difficulty === 'easy';
        const isBeginner = this.difficulty === 'beginner';

        // 1. Density Filter Map (Group notes by start time to handle chords)
        const notesByTime = new Map(); // startTime -> [notes]

        song.tracks.forEach(track => {
            // Only filter left hand tracks for beginner/easy modes
            if ((isBeginner || isEasy) && track.hand === 'left') return;

            track.notes.forEach(note => {
                const startTime = note.start * secondsPerBeat;

                if (!notesByTime.has(startTime)) notesByTime.set(startTime, []);
                notesByTime.get(startTime).push({
                    ...note,
                    track
                });
            });
        });

        // 2. Process Groups (Chord Reduction for Beginner Mode only)
        notesByTime.forEach((notes, startTime) => {
            let notesToKeep = notes;

            // Only simplify chords for beginner mode
            if (isBeginner && notes.length > 1) {
                // Keep only the highest pitch note for beginner
                notesToKeep = [notes.reduce((prev, curr) => {
                    return this.getMidiNumber(curr.note) > this.getMidiNumber(prev.note) ? curr : prev;
                })];
            }

            notesToKeep.forEach(note => {
                const duration = note.duration * secondsPerBeat;
                events.push({
                    type: 'noteOn',
                    note: note.note,
                    time: startTime,
                    velocity: 0.8
                });

                events.push({
                    type: 'noteOff',
                    note: note.note,
                    time: startTime + duration
                });
            });
        });

        // Store total events for progress tracking
        this.totalEvents = events.filter(e => e.type === 'noteOn').length;

        return events.sort((a, b) => a.time - b.time);
    }

    getMidiNumber(noteName) {
        const notes = { 'C': 0, 'C#': 1, 'D': 2, 'D#': 3, 'E': 4, 'F': 5, 'F#': 6, 'G': 7, 'G#': 8, 'A': 9, 'A#': 10, 'B': 11 };
        const match = noteName.match(/([A-G]#?)(\d)/);
        if (match) {
            return notes[match[1]] + (parseInt(match[2]) + 1) * 12;
        }
        return 60; // Default to C4
    }

    play() {
        if (!this.currentSong) return;
        if (this.isPlaying) return;

        if (this.audioEngine && this.audioEngine.context.state !== 'running') {
            this.audioEngine.context.resume();
        }

        this.isPlaying = true;
        this.lastFrameTime = this.audioEngine.context.now();
        this.schedule();
    }

    pause() {
        this.isPlaying = false;
        clearTimeout(this.timerID);
    }

    stop() {
        this.isPlaying = false;
        this.songTime = 0;
        this.cursor = 0;
        this.targetNotes.clear();
        clearTimeout(this.timerID);
        if (window.app.mainStream) window.app.mainStream.update(0);
    }

    reset() {
        this.stop();
    }

    advance(noteName) {
        console.log('[Sequencer] 🔄 advance() called with:', noteName, '| isWaitMode:', this.isWaitMode, '| isPlaying:', this.isPlaying, '| targetNotes:', Array.from(this.targetNotes));
        if (!this.isWaitMode || !this.isPlaying) {
            console.log('[Sequencer] ⚠️ advance() early return - waitMode or isPlaying is false');
            return;
        }

        if (noteName && this.targetNotes.has(noteName)) {
            this.targetNotes.delete(noteName);
            console.log('[Sequencer] ✅ Removed', noteName, '| remaining:', Array.from(this.targetNotes));
            // If empty, the schedule loop (running in background) will notice and resume time
        } else if (!noteName) {
            console.log('[Sequencer] ❌ advance() called without noteName - targetNotes not cleared!');
        } else {
            console.log('[Sequencer] ❌ Note not in targetNotes:', noteName);
        }
    }

    schedule() {
        if (!this.isPlaying) return;

        const currentTime = this.audioEngine.context.now();
        const delta = currentTime - this.lastFrameTime;
        this.lastFrameTime = currentTime;
        const safeDelta = Math.min(delta, 0.1);

        // 1. Check ALREADY BLOCKED
        if (this.isWaitMode && !this.autoPlay && this.targetNotes.size > 0) {
            // We are blocked. Do not advance time. Do not schedule audio.
            // Just update visual loop (to keep static) and loop.
            if (window.app.mainStream) window.app.mainStream.update(this.songTime);
            this.timerID = setTimeout(() => this.schedule(), this.scheduleInterval);
            return;
        }

        // 2. TIME ADVANCEMENT (Collision Detection)
        // We want to move from songTime -> targetTime
        let targetTime = this.songTime + (safeDelta * this.speed);
        let hitBlocker = false;

        // Check if any NoteOn event lies exactly in [songTime ... targetTime]
        // We peek at the cursor.
        // Important: We might have multiple simultaneous notes.
        while (this.cursor < this.events.length) {
            const event = this.events[this.cursor];

            // If event is beyond our target frame time, we are safe to advance fully.
            // Use a tiny epsilon for float precision
            if (event.time > targetTime + 0.0001) {
                break;
            }

            // Event is within this time step!
            if (event.type === 'noteOn' && this.isWaitMode && !this.autoPlay) {
                // IT IS A BLOCKER
                hitBlocker = true;

                // Clamp time exactly to the note
                this.songTime = event.time;
                this.targetNotes.add(event.note);

                // Check for chords (simultaneous notes)
                let lookAheadCursor = this.cursor + 1;
                while (lookAheadCursor < this.events.length) {
                    const nextEvent = this.events[lookAheadCursor];
                    if (nextEvent.type === 'noteOn' && Math.abs(nextEvent.time - event.time) < 0.02) {
                        this.targetNotes.add(nextEvent.note);
                        lookAheadCursor++;
                    } else {
                        break;
                    }
                }

                // Trigger Guidance
                if (this.onNoteRequired) this.onNoteRequired(Array.from(this.targetNotes));

                // We advance the cursor past these notes so we don't process them again as collisions
                // BUT we do NOT play them.
                this.cursor = lookAheadCursor;

                // Stop processing events
                break;
            } else {
                // It's a NoteOff or we are in AutoPlay mode.
                // We should handle it? 
                // Actually, if we handle it here, we duplicate the "Lookahead" logic below.
                // Better approach: 
                // If it's NOT a blocker, we leave it for the Lookahead scheduler to pick up?
                // NO. The Lookahead scheduler relies on `cursor`.
                // If we advance `songTime` past the event, the lookahead scheduler (which looks at songTime + lookahead)
                // might think it's already "past".

                // Correct logic:
                // If it's NOT a blocker, we ignore it here. We just let time advance.
                // The lookahead scheduler below will see "Oh, songTime is X, and this event is X - delta", play it immediately.
                break;
                // Actually, if we break, we stop checking for blockers behind this note?
                // If `event.time` < `targetTime`, and it's NOT a blocker (e.g. NoteOff),
                // we technically "pass" it. 
                // But we don't need to do anything specific for Time Advancement other than detecting the blocker.
            }
        }

        if (!hitBlocker) {
            this.songTime = targetTime;
        }

        // Update Visuals
        if (window.app.mainStream) {
            window.app.mainStream.update(this.songTime);
        }

        // 3. AUDIO SCHEDULING (Lookahead)
        if (!hitBlocker) {
            const scheduleUntilParams = this.songTime + (this.lookAheadTime * this.speed);

            // Create a temp cursor to peek ahead without moving the main cursor permanently
            // UNLESS we play the note.
            let peekCursor = this.cursor;

            while (peekCursor < this.events.length) {
                const event = this.events[peekCursor];

                if (event.time > scheduleUntilParams) break;

                // Event is in lookahead window
                if (event.type === 'noteOn' && this.isWaitMode && !this.autoPlay) {
                    // It's a future blocker! 
                    // Do NOT play it. 
                    // Do NOT increment main cursor (we need strictly collision detect it in next frame)
                    // Stop scheduling.
                    break;
                }

                // Playable Event
                const timeDelta = event.time - this.songTime;
                const realDelay = Math.max(0, timeDelta / this.speed);
                const absoluteTime = currentTime + realDelay;

                if (event.type === 'noteOn') {
                    this.audioEngine.handleNote({
                        type: 'noteOn',
                        fullName: event.note,
                        velocity: event.velocity,
                        time: absoluteTime
                    });
                } else {
                    this.audioEngine.handleNote({
                        type: 'noteOff',
                        fullName: event.note,
                        time: absoluteTime
                    });
                }

                // We processed it, so we can advance main cursor
                this.cursor++;
                peekCursor++;
            }
        }

        // Loop
        if (this.cursor < this.events.length || this.isPlaying) {
            this.timerID = setTimeout(() => this.schedule(), this.scheduleInterval);
        } else {
            this.isPlaying = false;
            console.log("Song Finished");
            if (this.stateManager.getState().loop) {
                this.stop();
                this.play();
            }
        }
    }
}
