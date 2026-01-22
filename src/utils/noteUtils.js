// Musical constants and helpers

export const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export function getNoteFromOffset(baseOctave, offset) {
    const totalSemis = (baseOctave * 12) + offset;
    const octave = Math.floor(totalSemis / 12);
    const noteIndex = totalSemis % 12;
    return {
        note: NOTES[noteIndex],
        octave: octave,
        fullName: `${NOTES[noteIndex]}${octave}`,
        midi: totalSemis + 12 // MIDI C4 is 60. If baseOctave is 4 (C4), offset 0 -> 48 + 12 = 60.
    };
}

export function getFrequency(note, octave) {
    // A4 = 440Hz
    // MIDI A4 = 69
    const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const noteIndex = notes.indexOf(note);
    if (noteIndex === -1) return 0;
    
    const semitonesFromC4 = (octave - 4) * 12 + (noteIndex - 9); // -9 because A is index 9
    // Actually easier: calculate distance from A4
    // MIDI number calculation
    const midi = (octave + 1) * 12 + noteIndex;
    const frequency = 440 * Math.pow(2, (midi - 69) / 12);
    return frequency;
}
