export class LessonMode {
    constructor(stateManager) {
        this.stateManager = stateManager;
        this.name = 'lesson';
    }

    enter() {
        console.log('Entered Lesson Mode');
        // Sequencer should be loaded and isWaitMode handled by Sequencer itself
        // But we need to listen for notes to advance the sequencer
    }

    handleNote(noteEvent) {
        if (noteEvent.type === 'noteOn') {
            const noteName = noteEvent.fullName; // e.g. "C4"

            // Check against sequencer
            if (window.app.sequencer && window.app.sequencer.isPlaying) {
                window.app.sequencer.advance(noteName);
            }
        }

        return noteEvent; // Always allow sound in lesson mode (so user hears what they play)
    }

    exit() {
        if (window.app.sequencer) {
            window.app.sequencer.stop();
        }
    }
}
