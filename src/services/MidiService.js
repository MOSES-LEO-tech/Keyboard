/* global Midi */
export class MidiService {
    async parseMidiFile(file) {
        const arrayBuffer = await file.arrayBuffer();
        const midi = new Midi(arrayBuffer);

        // Extract basic metadata
        const title = midi.name || file.name.replace('.mid', '').replace('.midi', '');
        const bpm = midi.header.tempos[0]?.bpm || 120;

        // Convert tracks
        // Heuristic to find the "lead" track:
        // 1. Pick the track with the most notes.
        // 2. Or the highest average pitch.
        // For now, let's keep it simple: 
        // Track 0 is 'lead', others are 'accompaniment'.

        const tracks = midi.tracks.map((midiTrack) => {
            // Heuristic to detect hand:
            // 1. Calculate average MIDI pitch
            const avgPitch = midiTrack.notes.reduce((sum, n) => sum + n.midi, 0) / (midiTrack.notes.length || 1);

            // Middle C is 60 (C4)
            // Anything significantly above 60 is usually Right Hand.
            // But sometimes bass tracks reach C4. Let's use 60 as a threshold for average.
            const hand = avgPitch >= 60 ? 'right' : 'left';

            return {
                role: 'lead', // MIDI imports are primary playable tracks
                hand: hand,
                instrument: this.mapInstrument(midiTrack.instrument.number),
                notes: midiTrack.notes.map(n => ({
                    note: n.name,
                    start: this.secondsToBeats(n.time, bpm),
                    duration: this.secondsToBeats(n.duration, bpm)
                }))
            };
        });

        return {
            id: `midi_${Date.now()}`,
            title: title,
            bpm: Math.round(bpm),
            difficulty: 'Custom',
            tracks: tracks
        };
    }

    secondsToBeats(seconds, bpm) {
        return (seconds * bpm) / 60;
    }

    mapInstrument(midiNumber) {
        // Simple mapping for now
        // Standard MIDI numbers: 0-7 are Pianos, 8-15 Chromatic Perc, 16-23 Organ, 24-31 Guitar, etc.
        if (midiNumber <= 7) return 'piano';
        if (midiNumber >= 24 && midiNumber <= 31) return 'electric-piano'; // Fallback to epiano for guitars
        return 'piano'; // Default fallback
    }
}
