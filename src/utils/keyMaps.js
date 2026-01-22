// Standard QWERTY Piano Layout
// Maps physical key codes to musical notes (semitone offsets from C)

export const KEY_MAP = {
    // Lower Octave (Z X C V...)
    'IntlBackslash': { note: 'B', offset: -1 }, // Left of Z on ISO
    'KeyZ': { note: 'C', offset: 0 },
    'KeyS': { note: 'C#', offset: 1 },
    'KeyX': { note: 'D', offset: 2 },
    'KeyD': { note: 'D#', offset: 3 },
    'KeyC': { note: 'E', offset: 4 },
    'KeyV': { note: 'F', offset: 5 },
    'KeyG': { note: 'F#', offset: 6 },
    'KeyB': { note: 'G', offset: 7 },
    'KeyH': { note: 'G#', offset: 8 },
    'KeyN': { note: 'A', offset: 9 },
    'KeyJ': { note: 'A#', offset: 10 },
    'KeyM': { note: 'B', offset: 11 },
    'Comma': { note: 'C', offset: 12 }, // Next C
    'KeyL': { note: 'C#', offset: 13 },
    'Period': { note: 'D', offset: 14 },
    'Semicolon': { note: 'D#', offset: 15 },
    'Slash': { note: 'E', offset: 16 },
    'Quote': { note: 'F', offset: 17 }, // Extended

    // Upper Octave (Q W E R...)
    'Backquote': { note: 'A', offset: 9 }, // Extended Left (~)
    'Digit1': { note: 'A#', offset: 10 }, // Extended Left (1)
    'Tab': { note: 'B', offset: 11 }, // Extended Left (Tab)
    'KeyQ': { note: 'C', offset: 12 },
    'Digit2': { note: 'C#', offset: 13 },
    'KeyW': { note: 'D', offset: 14 },
    'Digit3': { note: 'D#', offset: 15 },
    'KeyE': { note: 'E', offset: 16 },
    'KeyR': { note: 'F', offset: 17 },
    'Digit5': { note: 'F#', offset: 18 },
    'KeyT': { note: 'G', offset: 19 },
    'Digit6': { note: 'G#', offset: 20 },
    'KeyY': { note: 'A', offset: 21 },
    'Digit7': { note: 'A#', offset: 22 },
    'KeyU': { note: 'B', offset: 23 },
    'KeyI': { note: 'C', offset: 24 },
    'Digit9': { note: 'C#', offset: 25 },
    'KeyO': { note: 'D', offset: 26 },
    'Digit0': { note: 'D#', offset: 27 },
    'KeyP': { note: 'E', offset: 28 },
    'BracketLeft': { note: 'F', offset: 29 },
    'Equal': { note: 'F#', offset: 30 },
    'BracketRight': { note: 'G', offset: 31 },
    'Backslash': { note: 'G#', offset: 32 } // Extended Right
};

export const MODIFIER_KEYS = {
    'ShiftLeft': 'SHIFT',
    'ShiftRight': 'SHIFT',
    'ControlLeft': 'CTRL',
    'ControlRight': 'CTRL',
    'AltLeft': 'ALT',
    'AltRight': 'ALT'
};