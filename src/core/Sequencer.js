export class Sequencer {
    constructor(audioEngine) {
        this.audioEngine = audioEngine;
        this.isPlaying = false;
        this.currentSong = null;
        this.startTime = 0;
        this.playbackRate = 1;
        this.loop = false;
        this.events = []; // Flattened list of {time, note, type}
        this.cursor = 0; // Index in events

        // Timer
        this.timerID = null;

        this.isWaitMode = true;
        this.targetNotes = new Set();
        this.onNoteRequired = null;
    }

    setWaitMode(enabled) {
        this.isWaitMode = enabled;
    }

    loadSong(song) {
        this.currentSong = song;
        this.events = this.parseSong(song);
        this.reset();
    }

    // Convert track structure to linear event list
    parseSong(song) {
        const events = [];
        const secondsPerBeat = 60 / song.bpm;

        song.tracks.forEach(track => {
            track.notes.forEach(note => {
                const startTime = note.start * secondsPerBeat;
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

        return events.sort((a, b) => a.time - b.time);
    }

    play() {
        if (!this.currentSong) return;
        if (this.isPlaying) return;

        this.isPlaying = true;
        this.startTime = this.audioEngine.context.now() - (this.pausedAt || 0);
        this.schedule();
    }

    pause() {
        this.isPlaying = false;
        this.pausedAt = this.audioEngine.context.now() - this.startTime;
        cancelAnimationFrame(this.timerID);
    }

    stop() {
        this.isPlaying = false;
        this.pausedAt = 0;
        this.cursor = 0;
        this.targetNotes.clear();
        cancelAnimationFrame(this.timerID);
    }

    reset() {
        this.stop();
    }

    // Advance when a correct note is hit
    advance(noteName) {
        if (!this.isWaitMode || !this.isPlaying) return;

        if (this.targetNotes.has(noteName)) {
            this.targetNotes.delete(noteName);

            // If all target notes for this time slice are hit, resume
            if (this.targetNotes.size === 0) {
                // Adjust startTime to current context time relative to the event we just passed
                const eventTime = this.events[this.cursor - 1].time;
                this.startTime = this.audioEngine.context.now() - eventTime;
                this.schedule();
            }
        }
    }

    schedule() {
        if (!this.isPlaying) return;

        const currentTime = this.audioEngine.context.now() - this.startTime;

        // Update Horizontal Stream
        if (window.app.keyStream) {
            window.app.keyStream.update(currentTime);
        }

        const lookAhead = 0.05; // Tighten lookahead for wait mode

        while (this.cursor < this.events.length) {
            const event = this.events[this.cursor];

            if (event.time <= currentTime + lookAhead) {
                if (event.type === 'noteOn') {
                    // Check for Wait Mode
                    if (this.isWaitMode) {
                        this.targetNotes.add(event.note);
                        this.cursor++;
                        if (this.onNoteRequired) this.onNoteRequired(event.note);
                        return; // Exit schedule loop and wait for advance()
                    }

                    this.audioEngine.handleNote({
                        type: 'noteOn',
                        fullName: event.note,
                        velocity: event.velocity
                    });
                } else {
                    this.audioEngine.handleNote({
                        type: 'noteOff',
                        fullName: event.note
                    });
                }

                this.cursor++;
            } else {
                break;
            }
        }

        if (this.cursor < this.events.length) {
            this.timerID = requestAnimationFrame(this.schedule.bind(this));
        } else {
            this.isPlaying = false;
            console.log("Song Finished");
        }
    }
}
