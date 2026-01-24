export class KeyboardLayout {
    constructor() {
        this.name = 'keyboard';
        // Define a grid-based mapping (Row-Major)
        // This is a simple chromatic mapping across rows for speed/gaming
        this.keyGrid = {
            // Row 1 (ZXCV...)
            'KeyZ': { note: 'C', octaveOffset: 0 },
            'KeyX': { note: 'D', octaveOffset: 0 },
            'KeyC': { note: 'E', octaveOffset: 0 },
            'KeyV': { note: 'F', octaveOffset: 0 },
            'KeyB': { note: 'G', octaveOffset: 0 },
            'KeyN': { note: 'A', octaveOffset: 0 },
            'KeyM': { note: 'B', octaveOffset: 0 },
            
            // Row 2 (ASDF...) - Black keys or upper harmony?
            // Let's make it a chromatic grid for now or stick to Piano layout but visualized as keyboard?
            // The prompt says: "Grid-based (QWERTY rows), Logical clusters"
            
            // Simple mapping: 
            // Z-M: White keys C3-B3
            // S,D,G,H,J: Black keys
            
            'KeyS': { note: 'C#', octaveOffset: 0 },
            'KeyD': { note: 'D#', octaveOffset: 0 },
            'KeyG': { note: 'F#', octaveOffset: 0 },
            'KeyH': { note: 'G#', octaveOffset: 0 },
            'KeyJ': { note: 'A#', octaveOffset: 0 },

            // Row 3 (QWER...) - Next Octave
            'KeyQ': { note: 'C', octaveOffset: 1 },
            'KeyW': { note: 'D', octaveOffset: 1 },
            'KeyE': { note: 'E', octaveOffset: 1 },
            'KeyR': { note: 'F', octaveOffset: 1 },
            'KeyT': { note: 'G', octaveOffset: 1 },
            'KeyY': { note: 'A', octaveOffset: 1 },
            'KeyU': { note: 'B', octaveOffset: 1 },

            'Digit1': { note: 'C#', octaveOffset: 1 },
            'Digit2': { note: 'D#', octaveOffset: 1 },
            'Digit3': { note: 'F#', octaveOffset: 1 },
            'Digit4': { note: 'G#', octaveOffset: 1 },
            'Digit5': { note: 'A#', octaveOffset: 1 },
            'Digit6': { note: 'C#', octaveOffset: 2 },
            'Digit7': { note: 'D#', octaveOffset: 2 },
            'Digit8': { note: 'F#', octaveOffset: 2 },
            'Digit9': { note: 'G#', octaveOffset: 2 },
            'Digit0': { note: 'A#', octaveOffset: 2 },
        };
    }

    map(keyCode, currentOctave) {
        const mapping = this.keyGrid[keyCode];
        if (!mapping) return null;

        return {
            note: mapping.note,
            octave: currentOctave + mapping.octaveOffset,
            fullName: mapping.note + (currentOctave + mapping.octaveOffset)
        };
    }

    getVisualModel() {
        return {
            type: 'keyboard',
            rows: [
                ['Digit1','Digit2','Digit3','Digit4','Digit5','Digit6','Digit7','Digit8','Digit9','Digit0'],
                ['KeyQ','KeyW','KeyE','KeyR','KeyT','KeyY','KeyU','KeyI','KeyO','KeyP'],
                ['KeyA','KeyS','KeyD','KeyF','KeyG','KeyH','KeyJ','KeyK','KeyL'],
                ['KeyZ','KeyX','KeyC','KeyV','KeyB','KeyN','KeyM']
            ]
        };
    }
}
