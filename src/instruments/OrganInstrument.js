import { BaseInstrument } from './BaseInstrument.js';

export class OrganInstrument extends BaseInstrument {
    constructor() {
        super();
        this.poly = new Tone.PolySynth(Tone.AMSynth, {
            harmonicity: 3,
            detune: 0,
            oscillator: { type: 'sine' },
            envelope: { attack: 0.01, decay: 0.2, sustain: 0.8, release: 1.2 },
            modulation: { type: 'sine' },
            modulationEnvelope: { attack: 0.01, decay: 0.2, sustain: 0.8, release: 1.2 }
        });
        this.chorus = new Tone.Chorus(1.5, 2.5, 0.3).start();
        this.vibrato = new Tone.Vibrato(5, 0.15);
        this.reverb = new Tone.Reverb({ decay: 2.0, preDelay: 0.05, wet: 0.15 });
        this.poly.chain(this.chorus, this.vibrato, this.reverb);
        this.output = this.reverb;
    }

    noteOn(note, velocity = 1, time) {
        const now = time || Tone.now();
        this.poly.triggerAttack(note, now, velocity);
    }

    noteOff(note, time) {
        const now = time || Tone.now();
        this.poly.triggerRelease(note, now);
    }

    setBrightness(amount) {
        const a = Math.min(1, Math.max(0, amount));
        const depth = 0.05 + a * 0.25;
        const freq = 4 + a * 4;
        this.vibrato.depth = depth;
        this.vibrato.frequency.value = freq;
        this.chorus.wet.value = 0.1 + a * 0.5;
    }

    setRoom(amount) {
        const a = Math.min(1, Math.max(0, amount));
        this.reverb.wet.value = 0.05 + a * 0.3;
        this.reverb.decay = 1.2 + a * 2.0;
    }

    dispose() {
        this.poly.dispose();
        this.chorus.dispose();
        this.vibrato.dispose();
        this.reverb.dispose();
    }
}
