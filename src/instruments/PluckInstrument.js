import { BaseInstrument } from './BaseInstrument.js';

export class PluckInstrument extends BaseInstrument {
    constructor() {
        super();
        this.poly = new Tone.PolySynth(Tone.Synth, {
            oscillator: { type: 'triangle' },
            envelope: { attack: 0.005, decay: 0.12, sustain: 0.0, release: 0.12 }
        });
        this.reverb = new Tone.Reverb({ decay: 1.6, preDelay: 0.05, wet: 0.2 });
        this.poly.chain(this.reverb);
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

    setRoom(amount) {
        const a = Math.min(1, Math.max(0, amount));
        this.reverb.wet.value = 0.05 + a * 0.25;
        this.reverb.decay = 1.0 + a * 1.2;
    }

    dispose() {
        this.poly.dispose();
        this.reverb.dispose();
    }
}
