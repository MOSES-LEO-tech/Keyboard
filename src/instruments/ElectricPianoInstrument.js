import { BaseInstrument } from './BaseInstrument.js';

export class ElectricPianoInstrument extends BaseInstrument {
    constructor() {
        super();
        this.poly = new Tone.PolySynth(Tone.FMSynth, {
            harmonicity: 3,
            modulationIndex: 10,
            oscillator: { type: 'sine' },
            modulation: { type: 'triangle' },
            envelope: { attack: 0.01, decay: 0.2, sustain: 0.3, release: 1.6 },
            modulationEnvelope: { attack: 0.01, decay: 0.2, sustain: 0.2, release: 1.6 }
        });
        this.chorus = new Tone.Chorus(1.5, 3, 0.5).start();
        this.chorus.wet.value = 0.3;
        this.tremolo = new Tone.Tremolo(4, 0.3).start();
        this.tremolo.wet.value = 0.2;
        this.poly.chain(this.chorus, this.tremolo);
        this.output = this.tremolo;
    }

    noteOn(note, velocity = 1, time) {
        const now = time || Tone.now();
        this.poly.triggerAttack(note, now, velocity);
    }

    noteOff(note, time) {
        const now = time || Tone.now();
        this.poly.triggerRelease(note, now);
    }

    dispose() {
        this.poly.dispose();
        this.chorus.dispose();
        this.tremolo.dispose();
    }

    setBrightness(amount) {
        const a = Math.min(1, Math.max(0, amount));
        const modIndex = 5 + a * 20;
        const harmonicity = 2 + a * 3;
        this.poly.set({ modulationIndex: modIndex, harmonicity });
        this.chorus.wet.value = 0.1 + a * 0.6;
    }
}
