import { BaseInstrument } from './BaseInstrument.js';

export class GrandPianoInstrument extends BaseInstrument {
    constructor(options = {}) {
        super();
        console.log('[GrandPiano] Initializing grand piano');

        const profile = options.profile || 'concert';

        // Master gain for volume control
        this.masterGain = new Tone.Gain(0.7);

        // Main piano synth using AM synthesis for realistic piano tone
        this.piano = new Tone.PolySynth(Tone.AMSynth, {
            harmonicity: 2.01, // Slightly off for realism
            oscillator: { type: 'sine' },
            envelope: {
                attack: 0.01,
                decay: 0.4,
                sustain: 0.35,
                release: 1.2
            },
            modulationEnvelope: {
                attack: 0.01,
                decay: 0.3,
                sustain: 0.25,
                release: 1
            }
        });

        // Second layer for body/warmth
        this.warmLayer = new Tone.PolySynth(Tone.Synth, {
            oscillator: { type: 'sine' },
            envelope: {
                attack: 0.02,
                decay: 0.6,
                sustain: 0.5,
                release: 1.8
            }
        });

        // Compressor for controlled dynamics
        this.compressor = new Tone.Compressor({
            threshold: -18,
            ratio: 3,
            attack: 0.005,
            release: 0.25
        });

        // Concert hall reverb
        this.reverb = new Tone.Reverb({
            decay: 2.5,
            preDelay: 0.04,
            wet: 0.2
        });

        // EQ for tonal shaping
        this.eq = new Tone.EQ3({
            low: 1.5,
            mid: 0,
            high: 0.5
        });

        // Connect audio chain
        this.piano.connect(this.compressor);
        this.warmLayer.connect(this.compressor);
        this.compressor.connect(this.eq);
        this.eq.connect(this.reverb);
        this.reverb.connect(this.masterGain);
        this.output = this.masterGain;

        // Generate reverb asynchronously
        this._reverbReady = false;
        this._reverbGenerating = false;

        this._profile = profile;
        console.log('[GrandPiano] Grand piano initialized');
    }

    async _ensureReverb() {
        if (this._reverbReady) return;
        if (this._reverbGenerating) return;

        this._reverbGenerating = true;
        try {
            await this.reverb.generate();
            this._reverbReady = true;
            console.log('[GrandPiano] Reverb generated');
        } catch (err) {
            console.warn('[GrandPiano] Reverb generation failed:', err);
        } finally {
            this._reverbGenerating = false;
        }
    }

    connect(destination) {
        this.masterGain.disconnect();
        this.masterGain.connect(destination);
    }

    disconnect() {
        this.masterGain.disconnect();
    }

    noteOn(note, velocity = 1, time) {
        const now = time || Tone.now();

        this._ensureReverb();

        // Velocity curve for natural response
        const velCurve = Math.pow(velocity, 1.5);

        // Play both layers
        this.piano.triggerAttack(note, now, velCurve);
        this.warmLayer.triggerAttack(note, now, velCurve * 0.5);
    }

    noteOff(note, time) {
        const now = time || Tone.now();
        this.piano.triggerRelease(note, now);
        this.warmLayer.triggerRelease(note, now);
    }

    setRoom(amount) {
        const a = Math.min(1, Math.max(0, amount));
        this.reverb.wet.value = 0.1 + a * 0.3;
        this.reverb.decay = 1.5 + a * 2.5;
    }

    setBrightness(amount) {
        const a = Math.min(1, Math.max(0, amount));
        this.piano.set({ harmonicity: 2 + a * 0.5 });
        this.eq.high.value = 0 + a * 2;
    }

    setIntensity(amount) {
        const a = Math.min(1, Math.max(0, amount));
        this.piano.set({ modulationIndex: 2 + a * 4 });
    }

    dispose() {
        this.piano.dispose();
        this.warmLayer.dispose();
        this.compressor.dispose();
        this.eq.dispose();
        this.reverb.dispose();
        this.masterGain.dispose();
    }
}
