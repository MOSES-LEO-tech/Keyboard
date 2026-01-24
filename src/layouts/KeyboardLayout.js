export class KeyboardLayout {
    constructor() {
        this.name = 'keyboard';

        // Define White Keys Sequence (Q->P, A->L, Z->M)
        this.whiteKeys = [
            'KeyQ', 'KeyW', 'KeyE', 'KeyR', 'KeyT', 'KeyY', 'KeyU', 'KeyI', 'KeyO', 'KeyP', 'BracketLeft', 'BracketRight', // Row 2
            'KeyA', 'KeyS', 'KeyD', 'KeyF', 'KeyG', 'KeyH', 'KeyJ', 'KeyK', 'KeyL', 'Semicolon', 'Quote',                 // Row 3
            'KeyZ', 'KeyX', 'KeyC', 'KeyV', 'KeyB', 'KeyN', 'KeyM', 'Comma', 'Period', 'Slash'                            // Row 4
        ];

        // Define Black Keys Sequence (Row 1)
        this.blackKeys = [
            'Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6', 'Digit7', 'Digit8', 'Digit9', 'Digit0', 'Minus', 'Equal'
        ];

        // Standard C Major Scale Intervals to map index to Note
        // 0=C, 1=D, 2=E, 3=F, 4=G, 5=A, 6=B
        this.whiteNotes = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
        // Black notes map: 0=C#, 1=D#, 2=F#, 3=G#, 4=A#
        this.blackNotes = ['C#', 'D#', 'F#', 'G#', 'A#'];
    }

    /**
     * Maps a key press to a note.
     * @param {string} keyCode 
     * @param {number} currentOctave 
     * @param {object} modifiers { shiftKey: boolean }
     */
    map(keyCode, currentOctave, modifiers = {}) {
        // 1. Check White Keys
        const whiteIndex = this.whiteKeys.indexOf(keyCode);
        if (whiteIndex !== -1) {
            // Treat white keys as a continuous sequence
            const totalWhiteIndex = whiteIndex + (modifiers.shiftKey ? this.whiteKeys.length : 0);

            // Calculate octave shift based on 7 notes per octave
            const octaveOffset = Math.floor(totalWhiteIndex / 7);
            const noteIndex = totalWhiteIndex % 7;
            const noteName = this.whiteNotes[noteIndex];

            // Adjust base octave. Let's start Q at C of currentOctave - 1? Or currentOctave?
            // User asked for "manuals". Let's align Q with C3 (if base is 4) or similar.
            // Let's stick to: Q starts at C(base-1).
            const finalOctave = (currentOctave - 1) + octaveOffset;

            return {
                note: noteName,
                octave: finalOctave,
                fullName: noteName + finalOctave
            };
        }

        // 2. Check Black Keys
        const blackIndex = this.blackKeys.indexOf(keyCode);
        if (blackIndex !== -1) {
            // Pattern of black keys in an octave: 5 black keys (C#, D#, F#, G#, A#)
            // But user mapped 1,2,3...12 sequentially.
            // 1=C#, 2=D#, 3=F#, 4=G#, 5=A# ... 6=C#(next), etc.

            // If Shift is pressed, we offset by the length of the blackKeys row (12 keys)
            // effectively acting like a "Page 2" of black keys.
            // However, typical octave only has 5 black keys. 12 keys cover > 2 octaves.

            // Let's treat the black key row as a continuous chromatic sequence of accidents.
            const totalBlackIndex = blackIndex + (modifiers.shiftKey ? this.blackKeys.length : 0);

            const octaveOffset = Math.floor(totalBlackIndex / 5);
            const noteIndex = totalBlackIndex % 5;
            const noteName = this.blackNotes[noteIndex];

            const finalOctave = (currentOctave - 1) + octaveOffset;

            return {
                note: noteName,
                octave: finalOctave,
                fullName: noteName + finalOctave
            };
        }

        return null; // Not mapped
    }

    getVisualModel() {
        return {
            type: 'keyboard',
            rows: [
                this.blackKeys,
                this.whiteKeys.slice(0, 12),
                this.whiteKeys.slice(12, 23),
                this.whiteKeys.slice(23)
            ]
        };
    }
}
