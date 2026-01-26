import { BaseInstrument } from './BaseInstrument.js';

export class BassInstrument extends BaseInstrument {
    constructor() {
        super();
        this.synth = new Tone.MonoSynth({
            oscillator: { type: 'sawtooth' },
            filter: { type: 'lowpass', rolloff: -24 },
            envelope: { attack: 0.01, decay: 0.2, sustain: 0.6, release: 0.8 },
            filterEnvelope: { attack: 0.01, decay: 0.2, sustain: 0.2, release: 0.5, baseFrequency: 60, octaves: 3, exponent: 2 }
        });
        this.compressor = new Tone.Compressor({ threshold: -12, ratio: 3, attack: 0.01, release: 0.1 });
        this.eq = new Tone.EQ3(3, 0, -4);
        this.synth.chain(this.eq, this.compressor);
        this.output = this.compressor;
    }

    noteOn(note, velocity = 1, time) {
        const now = time || Tone.now();
        this.synth.triggerAttack(note, now, Math.min(1, Math.max(0, velocity)));
    }

    noteOff(note, time) {
        const now = time || Tone.now();
        this.synth.triggerRelease(now);
    }

    setBrightness(amount) {
        const a = Math.min(1, Math.max(0, amount));
        const cutoff = 80 + a * 1200;
        this.synth.filter.frequency.rampTo(cutoff, 0.1);
    }

    dispose() {
        this.synth.dispose();
        this.compressor.dispose();
        this.eq.dispose();
    }
}
