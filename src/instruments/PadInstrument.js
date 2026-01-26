import { BaseInstrument } from './BaseInstrument.js';

export class PadInstrument extends BaseInstrument {
    constructor() {
        super();
        this.poly = new Tone.PolySynth(Tone.DuoSynth, {
            voice0: {
                oscillator: { type: 'sawtooth' },
                envelope: { attack: 0.5, decay: 0.3, sustain: 0.8, release: 3.0 }
            },
            voice1: {
                oscillator: { type: 'square' },
                envelope: { attack: 0.6, decay: 0.3, sustain: 0.7, release: 3.2 }
            }
        });
        this.filter = new Tone.Filter(1200, 'lowpass', 0.7);
        this.reverb = new Tone.Reverb({ decay: 4.5, preDelay: 0.2, wet: 0.4 });
        this.delay = new Tone.FeedbackDelay('8n', 0.2);
        this.poly.chain(this.filter, this.delay, this.reverb);
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
        const freq = 800 + a * 3000;
        this.filter.frequency.rampTo(freq, 0.2);
        this.delay.feedback.rampTo(0.1 + a * 0.3, 0.2);
    }

    setRoom(amount) {
        const a = Math.min(1, Math.max(0, amount));
        this.reverb.wet.value = 0.2 + a * 0.5;
        this.reverb.decay = 3.0 + a * 3.0;
    }

    dispose() {
        this.poly.dispose();
        this.filter.dispose();
        this.reverb.dispose();
        this.delay.dispose();
    }
}
