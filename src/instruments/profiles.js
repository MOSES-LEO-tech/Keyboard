export const INSTRUMENTS = {
    piano: {
        name: 'Piano',
        type: 'basic', // Uses standard AudioEngine logic
        waveform: 'triangle',
        attack: 0.01,
        decay: 0.3,
        sustain: 0.4,
        release: 0.4,
        gain: 0.4
    },
    synth: {
        name: 'Synth',
        type: 'basic',
        waveform: 'sawtooth',
        attack: 0.05,
        decay: 0.1,
        sustain: 0.6,
        release: 0.3,
        gain: 0.2
    },
    pluck: {
        name: 'Pluck',
        type: 'basic',
        waveform: 'square',
        attack: 0.005,
        decay: 0.1,
        sustain: 0.0, // Percussive
        release: 0.1,
        gain: 0.3
    }
};
