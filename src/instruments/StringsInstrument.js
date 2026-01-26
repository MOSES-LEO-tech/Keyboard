import { BaseInstrument } from './BaseInstrument.js';

export class StringsInstrument extends BaseInstrument {
    constructor() {
        super();
        this.poly = new Tone.PolySynth(Tone.Synth, {
            oscillator: { type: 'sawtooth' },
            envelope: { attack: 0.3, decay: 0.2, sustain: 0.7, release: 2.5 }
        });
        this.chorus = new Tone.Chorus(1.8, 2.5, 0.5).start();
        this.reverb = new Tone.Reverb({ decay: 3.0, preDelay: 0.15, wet: 0.3 });
        this.poly.chain(this.chorus, this.reverb);
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
        this.reverb.wet.value = 0.1 + a * 0.4;
        this.reverb.decay = 2.0 + a * 3.0;
    }

    setBrightness(amount) {
        const a = Math.min(1, Math.max(0, amount));
        this.chorus.wet.value = 0.1 + a * 0.6;
    }

    dispose() {
        this.poly.dispose();
        this.chorus.dispose();
        this.reverb.dispose();
    }
}
