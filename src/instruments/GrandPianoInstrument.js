import { BaseInstrument } from './BaseInstrument.js';

/**
 * GrandPianoInstrument
 * Uses the same high-quality Salamander samples as PianoInstrument
 * but with a concert-hall audio chain: longer reverb, subtle compression,
 * and a wider stereo image — giving it a more premium feel.
 */
export class GrandPianoInstrument extends BaseInstrument {
    constructor() {
        super();

        this.eq = new Tone.EQ3({ low: 1, mid: -0.5, high: 0.5 });

        this.compressor = new Tone.Compressor({
            threshold: -20,
            ratio: 3,
            attack: 0.003,
            release: 0.25,
            knee: 6
        });

        // Long concert-hall reverb
        this.reverb = new Tone.Reverb({
            decay: 4.0,
            preDelay: 0.08,
            wet: 0.3
        });

        this._reverbReady = false;

        this.sampler = new Tone.Sampler({
            urls: {
                'A0':'A0.mp3','C1':'C1.mp3','D#1':'Ds1.mp3','F#1':'Fs1.mp3',
                'A1':'A1.mp3','C2':'C2.mp3','D#2':'Ds2.mp3','F#2':'Fs2.mp3',
                'A2':'A2.mp3','C3':'C3.mp3','D#3':'Ds3.mp3','F#3':'Fs3.mp3',
                'A3':'A3.mp3','C4':'C4.mp3','D#4':'Ds4.mp3','F#4':'Fs4.mp3',
                'A4':'A4.mp3','C5':'C5.mp3','D#5':'Ds5.mp3','F#5':'Fs5.mp3',
                'A5':'A5.mp3','C6':'C6.mp3','D#6':'Ds6.mp3','F#6':'Fs6.mp3',
                'A6':'A6.mp3','C7':'C7.mp3','D#7':'Ds7.mp3','F#7':'Fs7.mp3',
                'A7':'A7.mp3','C8':'C8.mp3'
            },
            release: 2.5,
            baseUrl: 'https://tonejs.github.io/audio/salamander/',
            onload: () => {
                console.log('[GrandPiano] Samples loaded');
                window.dispatchEvent(new CustomEvent('samples-loaded', { detail: { instrument: 'grand-piano' } }));
            }
        });

        this.sampler.chain(this.eq, this.compressor, this.reverb);
        this.output = this.reverb;
    }

    connect(destination) {
        this.reverb.disconnect();
        this.reverb.connect(destination);
    }

    disconnect() { this.reverb.disconnect(); }

    noteOn(note, velocity = 1, time) {
        const now = time || Tone.now();
        if (!this._reverbReady) {
            this.reverb.generate();
            this._reverbReady = true;
        }
        // Gentle velocity curve for expressive dynamics
        const vel = Math.pow(velocity, 0.9);
        this.sampler.triggerAttack(note, now, vel);
    }

    noteOff(note, time) {
        this.sampler.triggerRelease(note, time || Tone.now());
    }

    setRoom(amount) {
        const a = Math.min(1, Math.max(0, amount));
        this.reverb.wet.value = 0.15 + a * 0.35;
        this.reverb.decay = 2.5 + a * 3.5;
    }

    dispose() {
        this.sampler.dispose();
        this.eq.dispose();
        this.compressor.dispose();
        this.reverb.dispose();
    }
}
