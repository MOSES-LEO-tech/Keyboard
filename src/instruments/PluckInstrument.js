import { BaseInstrument } from './BaseInstrument.js';

const CDN = 'https://cdn.jsdelivr.net/gh/nbrosowsky/tonejs-instruments@master/samples/guitar-nylon/';

/**
 * PluckInstrument — real nylon guitar samples
 */
export class PluckInstrument extends BaseInstrument {
    constructor() {
        super();

        this.reverb = new Tone.Reverb({ decay: 1.8, preDelay: 0.04, wet: 0.2 });
        this._reverbReady = false;

        this.sampler = new Tone.Sampler({
            urls: {
                'A2':'A2.mp3','A3':'A3.mp3','A4':'A4.mp3','A5':'A5.mp3',
                'B2':'B2.mp3','B3':'B3.mp3','B4':'B4.mp3',
                'C3':'C3.mp3','C4':'C4.mp3','C5':'C5.mp3',
                'D2':'D2.mp3','D3':'D3.mp3','D4':'D4.mp3','D5':'D5.mp3',
                'E2':'E2.mp3','E3':'E3.mp3','E4':'E4.mp3',
                'F2':'F2.mp3','F3':'F3.mp3','F4':'F4.mp3',
                'G2':'G2.mp3','G3':'G3.mp3','G4':'G4.mp3'
            },
            release: 0.8,
            baseUrl: CDN,
            onload: () => {
                console.log('[Pluck] Samples loaded');
                window.dispatchEvent(new CustomEvent('samples-loaded', { detail: { instrument: 'pluck' } }));
            },
            onerror: () => this._fallback()
        });

        this.sampler.chain(this.reverb);
        this.output = this.reverb;
    }

    _fallback() {
        console.warn('[Pluck] Samples failed, using synth fallback');
        this.sampler = new Tone.PolySynth(Tone.Synth, {
            oscillator: { type: 'triangle' },
            envelope: { attack: 0.005, decay: 0.15, sustain: 0.0, release: 0.15 }
        });
        this.sampler.chain(this.reverb);
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
        this.reverb.wet.value = 0.05 + a * 0.3;
    }

    dispose() { this.sampler.dispose(); this.reverb.dispose(); }
}
