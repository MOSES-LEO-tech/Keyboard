import { BaseInstrument } from './BaseInstrument.js';

const CDN = 'https://cdn.jsdelivr.net/gh/nbrosowsky/tonejs-instruments@master/samples/organ/';

/**
 * OrganInstrument — real pipe organ samples from the VSO2 library
 */
export class OrganInstrument extends BaseInstrument {
    constructor() {
        super();

        this.chorus = new Tone.Chorus(1.5, 2.5, 0.3).start();
        this.vibrato = new Tone.Vibrato(5, 0.1);
        this.reverb = new Tone.Reverb({ decay: 2.5, preDelay: 0.05, wet: 0.2 });
        this._reverbReady = false;

        this.sampler = new Tone.Sampler({
            urls: {
                'A2':'A2.mp3','A3':'A3.mp3','A4':'A4.mp3',
                'B2':'B2.mp3','B3':'B3.mp3','B4':'B4.mp3',
                'C3':'C3.mp3','C4':'C4.mp3','C5':'C5.mp3',
                'D3':'D3.mp3','D4':'D4.mp3','D5':'D5.mp3',
                'E3':'E3.mp3','E4':'E4.mp3','E5':'E5.mp3',
                'F3':'F3.mp3','F4':'F4.mp3',
                'G3':'G3.mp3','G4':'G4.mp3'
            },
            release: 0.3,
            baseUrl: CDN,
            onload: () => {
                console.log('[Organ] Samples loaded');
                window.dispatchEvent(new CustomEvent('samples-loaded', { detail: { instrument: 'organ' } }));
            },
            onerror: () => this._fallback()
        });

        this.sampler.chain(this.chorus, this.vibrato, this.reverb);
        this.output = this.reverb;
    }

    _fallback() {
        console.warn('[Organ] Samples failed, using synth fallback');
        this.sampler = new Tone.PolySynth(Tone.AMSynth, {
            harmonicity: 3,
            oscillator: { type: 'sine' },
            envelope: { attack: 0.01, decay: 0.2, sustain: 0.8, release: 1.2 },
            modulation: { type: 'sine' },
            modulationEnvelope: { attack: 0.01, decay: 0.2, sustain: 0.8, release: 1.2 }
        });
        this.sampler.chain(this.chorus, this.vibrato, this.reverb);
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

    dispose() {
        this.sampler.dispose(); this.chorus.dispose();
        this.vibrato.dispose(); this.reverb.dispose();
    }
}
