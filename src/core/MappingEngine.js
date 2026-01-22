import { LayoutManager } from '../layouts/LayoutManager.js';
import { PianoLayout } from '../layouts/PianoLayout.js';
import { KeyboardLayout } from '../layouts/KeyboardLayout.js';

export class MappingEngine {
    constructor(stateManager) {
        this.stateManager = stateManager;
        this.onNote = null; // Callback for audio engine
        
        // Initialize Layout System
        this.layoutManager = new LayoutManager(stateManager);
        this.layoutManager.registerLayout('piano', new PianoLayout());
        this.layoutManager.registerLayout('keyboard', new KeyboardLayout());
        
        // Default to piano
        this.layoutManager.switchTo('piano');

        this.init();
    }

    init() {
        console.log('MappingEngine initialized with Layout System');
    }

    setNoteHandler(callback) {
        this.onNote = callback;
    }

    handleInput(event) {
        const { type, code } = event;

        if (code === 'Space') {
            if (type === 'keydown') this.stateManager.setState({ sustain: true });
            else this.stateManager.setState({ sustain: false });
            return;
        }

        if (type === 'keydown' && code === 'KeyZ') {
            const current = this.stateManager.getState().octave || 4;
            if (current > 1) this.stateManager.setState({ octave: current - 1 });
            return;
        }
        if (type === 'keydown' && code === 'KeyX') {
            const current = this.stateManager.getState().octave || 4;
            if (current < 7) this.stateManager.setState({ octave: current + 1 });
            return;
        }

        const velBase = 0.8;
        const velocity = event.originalEvent
            ? (event.originalEvent.ctrlKey ? 1 : (event.originalEvent.shiftKey ? 0.6 : velBase))
            : velBase;

        // Delegate mapping to Active Layout
        const currentOctave = this.stateManager.getState().octave || 4;
        const noteInfo = this.layoutManager.getNoteFromKey(code, currentOctave);

        if (!noteInfo) return; // Not a mapped key in current layout

        const noteEvent = {
            type: type === 'keydown' ? 'noteOn' : 'noteOff',
            originalKey: code,
            inputTime: event.inputTime,
            velocity,
            ...noteInfo
        };

        // Emit to Audio Engine (and UI via StateManager if needed)
        if (this.onNote) {
            this.onNote(noteEvent);
        }
    }
    
    // Helper to expose layout manager to App/UI if needed
    getLayoutManager() {
        return this.layoutManager;
    }
}
