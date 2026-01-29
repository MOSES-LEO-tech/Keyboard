export class GuidedMode {
    constructor(stateManager, sequencer, ui) {
        this.stateManager = stateManager;
        this.sequencer = sequencer;
        this.ui = ui;
        this.name = 'guided';
        this.isWaitingForNote = false;
        this.currentTargetNotes = [];
        this.onNoteRequired = null; // Callback for UI updates
        this.onWrongNote = null; // Callback for wrong note feedback
    }

    enter() {
        console.log('[GuidedMode] 🔵 Entered Guided Mode');
        this.isWaitingForNote = false;
        this.currentTargetNotes = [];

        // Setup sequencer callbacks
        this.setupSequencerCallbacks();

        // Show guided indicator
        this.ui.showGuidedIndicator('Press any key to start');
    }

    setupSequencerCallbacks() {
        if (this.sequencer) {
            // Save reference to GuidedMode's callback for potential chaining
            const guidedCallback = (notes) => {
                console.log('[GuidedMode] 🎵 Note required (GuidedMode callback):', notes);
                this.currentTargetNotes = Array.isArray(notes) ? notes : [notes];
                this.isWaitingForNote = true;
                console.log('[GuidedMode] ✅ currentTargetNotes updated to:', this.currentTargetNotes);

                // Update UI - highlight on keyboard
                this.ui.highlightNextNote(this.currentTargetNotes);

                if (this.onNoteRequired) {
                    this.onNoteRequired(this.currentTargetNotes);
                }

                // Show message for chords vs single notes
                if (this.currentTargetNotes.length > 1) {
                    this.ui.showGuidedIndicator('Play these notes together');
                } else {
                    this.ui.showGuidedIndicator('Play the highlighted note');
                }
            };

            this.sequencer.onNoteRequired = guidedCallback;
            console.log('[GuidedMode] ✅ Sequencer callback set up');
        }
    }

    handleNote(noteEvent) {
        if (noteEvent.type === 'noteOn') {
            const playedNote = noteEvent.fullName;
            console.log('[GuidedMode] ⌨️ Note played:', playedNote, '| waiting:', this.isWaitingForNote, '| targetNotes:', this.currentTargetNotes);

            if (this.isWaitingForNote) {
                console.log('[GuidedMode] 🔍 Checking note - playedNote:', JSON.stringify(playedNote), '| targetNotes:', JSON.stringify(this.currentTargetNotes));
                // Check if correct note (handles chords)
                const isMatch = this.currentTargetNotes.includes(playedNote);
                console.log('[GuidedMode] 🔍 includes() result:', isMatch);

                if (isMatch) {
                    // Remove from waiting list
                    const index = this.currentTargetNotes.indexOf(playedNote);
                    this.currentTargetNotes.splice(index, 1);

                    console.log('[GuidedMode] ✅ Correct! Remaining:', this.currentTargetNotes);

                    // Show correct feedback
                    this.ui.showCorrectNote(playedNote);

                    // If all notes in chord/group are played, advance
                    if (this.currentTargetNotes.length === 0) {
                        this.isWaitingForNote = false;
                        console.log('[GuidedMode] ➡️ All notes played, advancing...');
                        if (this.sequencer) {
                            this.sequencer.advance(playedNote); // Pass the note name
                        }
                        this.ui.showGuidedIndicator('Good! Next note...');
                    } else {
                        // Still waiting for more notes in the chord
                        this.ui.showGuidedIndicator('Keep holding...');
                    }

                    return noteEvent; // Allow sound
                } else {
                    // Wrong note - block sound and show feedback
                    console.log('[GuidedMode] ❌ Wrong note:', playedNote, '| expected:', this.currentTargetNotes);
                    this.ui.showWrongNote(playedNote);

                    if (this.onWrongNote) {
                        this.onWrongNote(playedNote);
                    }

                    // Play error sound
                    this.playErrorSound();

                    return null; // Block sound
                }
            } else {
                // Not waiting - allow free play
                return noteEvent;
            }
        }

        // Allow noteOff events through
        return noteEvent;
    }

    playErrorSound() {
        // Play a subtle error sound using the audio engine
        if (window.app && window.app.audio) {
            try {
                // Create a short low-frequency beep
                const ctx = window.app.audio.context;
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();

                osc.type = 'sine';
                osc.frequency.setValueAtTime(150, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.1);

                gain.gain.setValueAtTime(0.1, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

                osc.connect(gain);
                gain.connect(ctx.destination);

                osc.start(ctx.currentTime);
                osc.stop(ctx.currentTime + 0.1);
            } catch (e) {
                console.error('[GuidedMode] Error playing sound:', e);
            }
        }
    }

    exit() {
        console.log('[GuidedMode] 🔴 Exiting Guided Mode');
        this.isWaitingForNote = false;
        this.currentTargetNotes = [];

        // Cleanup UI
        this.ui.clearHighlights();
        this.ui.hideGuidedIndicator();
        this.ui.hideProgressBar();

        // Stop sequencer
        if (this.sequencer) {
            this.sequencer.stop();
        }
    }
}
