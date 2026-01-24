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

        // Octave Switching (Left/Right)
        if (type === 'keydown' && code === 'ArrowLeft') {
            const current = this.stateManager.getState().octave || 4;
            if (current > 1) this.stateManager.setState({ octave: current - 1 });
            return;
        }
        if (type === 'keydown' && code === 'ArrowRight') {
            const current = this.stateManager.getState().octave || 4;
            if (current < 7) this.stateManager.setState({ octave: current + 1 });
            return;
        }

        // Volume Control (Up/Down)
        if (type === 'keydown' && code === 'ArrowUp') {
            const current = this.stateManager.getState().volume ?? 2.5; // Default 2.5 if undefined
            if (current < 5) this.stateManager.setState({ volume: Math.min(5, current + 0.5) });
            return;
        }
        if (type === 'keydown' && code === 'ArrowDown') {
            const current = this.stateManager.getState().volume ?? 2.5;
            if (current > 0) this.stateManager.setState({ volume: Math.max(0, current - 0.5) });
            return;
        }

        const velBase = 0.8;
        const velocity = event.originalEvent
            ? (event.originalEvent.ctrlKey ? 1 : (event.originalEvent.shiftKey ? 0.6 : velBase))
            : velBase;

        // Delegate mapping to Active Layout
        const currentOctave = this.stateManager.getState().octave || 4;
        const modifiers = {
            shiftKey: event.originalEvent?.shiftKey || false,
            ctrlKey: event.originalEvent?.ctrlKey || false,
            altKey: event.originalEvent?.altKey || false
        };
        const noteInfo = this.layoutManager.getNoteFromKey(code, currentOctave, modifiers);

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
