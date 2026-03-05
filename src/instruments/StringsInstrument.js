import { BaseInstrument } from './BaseInstrument.js';

const CDN = 'https://cdn.jsdelivr.net/gh/nbrosowsky/tonejs-instruments@master/samples/violin/';

/**
 * StringsInstrument — real violin samples (VSO2), polyphonic
 */
export class StringsInstrument extends BaseInstrument {
    constructor() {
        super();

        this.chorus = new Tone.Chorus(1.8, 2.5, 0.4).start();
        this.reverb = new Tone.Reverb({ decay: 3.5, preDelay: 0.1, wet: 0.35 });
        this._reverbReady = false;

        this.sampler = new Tone.Sampler({
            urls: {
                'A3':'A3.mp3','A4':'A4.mp3','A5':'A5.mp3',
                'B4':'B4.mp3','B5':'B5.mp3',
                'C4':'C4.mp3','C5':'C5.mp3',
                'D4':'D4.mp3','D5':'D5.mp3',
                'E4':'E4.mp3','E5':'E5.mp3',
                'F4':'F4.mp3','F5':'F5.mp3',
                'G4':'G4.mp3','G5':'G5.mp3'
            },
            release: 2.0,
            baseUrl: CDN,
            onload: () => {
                console.log('[Strings] Samples loaded');
                window.dispatchEvent(new CustomEvent('samples-loaded', { detail: { instrument: 'strings' } }));
            },
            onerror: () => this._fallback()
        });

        this.sampler.chain(this.chorus, this.reverb);
        this.output = this.reverb;
    }

    _fallback() {
        console.warn('[Strings] Samples failed, using synth fallback');
        this.sampler = new Tone.PolySynth(Tone.Synth, {
            oscillator: { type: 'sawtooth' },
            envelope: { attack: 0.3, decay: 0.2, sustain: 0.7, release: 2.5 }
        });
        this.sampler.chain(this.chorus, this.reverb);
    }

    connect(destination) { this.reverb.disconnect(); this.reverb.connect(destination); }
    disconnect() { this.reverb.disconnect(); }

    noteOn(note, velocity = 1, time) {
        const now = time || Tone.now();
        if (!this._reverbReady) { this.reverb.generate(); this._reverbReady = true; }
        this.sampler.triggerAttack(note, now, velocity);
    }

    noteOff(note, time) { this.sampler.triggerRelease(note, time || Tone.now()); }

    setRoom(amount) {
        const a = Math.min(1, Math.max(0, amount));
        this.reverb.wet.value = 0.15 + a * 0.4;
        this.reverb.decay = 2.5 + a * 3.0;
    }

    dispose() {
        this.sampler.dispose(); this.chorus.dispose(); this.reverb.dispose();
    }
}
