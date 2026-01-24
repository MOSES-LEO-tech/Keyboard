import { KeyboardLayout } from './KeyboardLayout.js';

export class PianoLayout {
    constructor() {
        this.name = 'piano';
        this.delegate = new KeyboardLayout();
    }

    map(keyCode, currentOctave, modifiers) {
        // Delegate mapping to KeyboardLayout to ensure same logic
        return this.delegate.map(keyCode, currentOctave, modifiers);
    }

    // Returns data needed to render the view
    getVisualModel() {
        return {
            type: 'piano',
            // Piano view logic is mostly static (octaves), handled by renderer
            // But we could pass range here
            startOctave: 1,
            endOctave: 8
        };
    }
}
