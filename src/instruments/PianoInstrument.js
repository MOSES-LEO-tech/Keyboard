import { BaseInstrument } from './BaseInstrument.js';

export class PianoInstrument extends BaseInstrument {
    constructor(options = {}) {
        super();
        const profile = options.profile || 'normal';

        const settingsMap = {
            normal: {
                eq: { low: 0, mid: 0, high: 0 },
                reverb: { decay: 2.5, preDelay: 0.1, wet: 0.2 }
            },
            bright: {
                eq: { low: -1, mid: 0, high: 3 },
                reverb: { decay: 2.3, preDelay: 0.08, wet: 0.18 }
            },
            soft: {
                eq: { low: 1, mid: 1, high: -2 },
                reverb: { decay: 2.8, preDelay: 0.1, wet: 0.25 },
                filter: { type: 'lowpass', freq: 1200, q: 0.7 }
            },
            dark: {
                eq: { low: 2, mid: 1, high: -3 },
                reverb: { decay: 2.2, preDelay: 0.08, wet: 0.15 },
                filter: { type: 'lowpass', freq: 1000, q: 0.7 }
            },
            warm: {
                eq: { low: 1.5, mid: 0.5, high: -1 },
                reverb: { decay: 2.4, preDelay: 0.09, wet: 0.18 }
            },
            cinematic: {
                eq: { low: 1, mid: -1, high: 1 },
                reverb: { decay: 4.0, preDelay: 0.2, wet: 0.35 }
            },
            felt: {
                eq: { low: -1, mid: -1, high: -4 },
                reverb: { decay: 3.0, preDelay: 0.15, wet: 0.3 },
                filter: { type: 'lowpass', freq: 900, q: 0.7 }
            },
            upright: {
                eq: { low: 0.5, mid: 1, high: -0.5 },
                reverb: { decay: 1.8, preDelay: 0.08, wet: 0.2 }
            },
            honkytonk: {
                eq: { low: -2, mid: 0, high: 4 },
                reverb: { decay: 1.6, preDelay: 0.05, wet: 0.15 }
            }
        };
        const s = settingsMap[profile] || settingsMap.normal;

        // Create EQ and Reverb first
        this.eq = new Tone.EQ3(s.eq.low, s.eq.mid, s.eq.high);
        this.reverb = new Tone.Reverb(s.reverb);
        if (s.filter) {
            this.filter = new Tone.Filter(s.filter.freq, s.filter.type, -12);
            this.filter.Q.value = s.filter.q ?? 0.7;
        }
        this._reverbReady = false;

        // Try to create Tone.Sampler with online samples
        let useSampler = true;
        try {
            this.sampler = new Tone.Sampler({
                urls: {
                    "A0": "A0.mp3", "C1": "C1.mp3", "D#1": "Ds1.mp3", "F#1": "Fs1.mp3",
                    "A1": "A1.mp3", "C2": "C2.mp3", "D#2": "Ds2.mp3", "F#2": "Fs2.mp3",
                    "A2": "A2.mp3", "C3": "C3.mp3", "D#3": "Ds3.mp3", "F#3": "Fs3.mp3",
                    "A3": "A3.mp3", "C4": "C4.mp3", "D#4": "Ds4.mp3", "F#4": "Fs4.mp3",
                    "A4": "A4.mp3", "C5": "C5.mp3", "D#5": "Ds5.mp3", "F#5": "Fs5.mp3",
                    "A5": "A5.mp3", "C6": "C6.mp3", "D#6": "Ds6.mp3", "F#6": "Fs6.mp3",
                    "A6": "A6.mp3", "C7": "C7.mp3", "D#7": "Ds7.mp3", "F#7": "Fs7.mp3",
                    "A7": "A7.mp3", "C8": "C8.mp3"
                },
                release: 1,
                baseUrl: "https://tonejs.github.io/audio/salamander/",
                onload: () => {
                    console.log("Piano Samples Loaded!");
                    window.dispatchEvent(new CustomEvent('samples-loaded', { detail: { instrument: 'piano' } }));
                },
                onerror: (err) => {
                    console.warn('Piano samples failed to load, falling back to synth');
                    useSampler = false;
                }
            });
        } catch (error) {
            useSampler = false;
        }

        if (useSampler && this.sampler) {
            // Set up audio chain for Sampler
            if (this.filter) {
                this.sampler.chain(this.eq, this.filter, this.reverb);
            } else {
                this.sampler.chain(this.eq, this.reverb);
            }
            this.output = this.sampler;
        } else {
            // Fallback to PolySynth
            this.sampler = new Tone.PolySynth(Tone.Synth, {
                volume: -8,
                oscillator: { type: 'triangle' },
                envelope: { attack: 0.05, decay: 0.1, sustain: 0.3, release: 1 }
            });
            // For PolySynth, we use a simpler chain - just EQ and reverb
            this.sampler.chain(this.eq, this.reverb);
            this.output = this.sampler;
        }
    }

    connect(destination) {
        this.reverb.disconnect();
        this.reverb.connect(destination);
    }

    disconnect() {
        this.reverb.disconnect();
    }

    noteOn(note, velocity = 1, time) {
        const now = time || Tone.now();
        if (!this._reverbReady) {
            this.reverb.generate();
            this._reverbReady = true;
        }
        this.sampler.triggerAttack(note, now, velocity);
    }

    noteOff(note, time) {
        const now = time || Tone.now();
        this.sampler.triggerRelease(note, now);
    }

    dispose() {
        this.sampler.dispose();
        this.eq.dispose();
        this.reverb.dispose();
    }

    setRoom(amount) {
        const a = Math.min(1, Math.max(0, amount));
        this.reverb.wet.value = 0.05 + a * 0.25;
        this.reverb.decay = 0.8 + a * 2.2;
    }
}
