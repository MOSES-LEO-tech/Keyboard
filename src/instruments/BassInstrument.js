import { BaseInstrument } from './BaseInstrument.js';

const CDN = 'https://cdn.jsdelivr.net/gh/nbrosowsky/tonejs-instruments@master/samples/bass-electric/';

/**
 * BassInstrument — real electric bass samples
 * Note: the bass-electric library labels its samples one octave HIGH
 * (E2.mp3 is actually an E1), so we map them with corrected octave keys.
 */
export class BassInstrument extends BaseInstrument {
    constructor() {
        super();

        this.compressor = new Tone.Compressor({ threshold: -12, ratio: 4, attack: 0.01, release: 0.1 });
        this.eq = new Tone.EQ3(4, 0, -3);

        this.sampler = new Tone.Sampler({
            urls: {
                // The CDN files say E2/A2/D2/G2 but actually sound at E1/A1/D1/G1
                // Tone.Sampler pitch-shifts to fill gaps, so map file → actual pitch
                'E1':'E2.mp3','A1':'A2.mp3','D2':'D3.mp3','G2':'G3.mp3',
                'E2':'E3.mp3','A2':'A3.mp3','D3':'D4.mp3','G3':'G4.mp3',
                'B1':'B2.mp3','C2':'C3.mp3','F2':'F3.mp3',
                'A3':'A4.mp3','B3':'B4.mp3'
            },
            release: 1.0,
            baseUrl: CDN,
            onload: () => {
                console.log('[Bass] Samples loaded');
                window.dispatchEvent(new CustomEvent('samples-loaded', { detail: { instrument: 'bass' } }));
            },
            onerror: () => this._fallback()
        });

        this.sampler.chain(this.eq, this.compressor);
        this.output = this.compressor;
    }

    _fallback() {
        console.warn('[Bass] Samples failed, using synth fallback');
        this.sampler = new Tone.MonoSynth({
            oscillator: { type: 'sawtooth' },
            filter: { type: 'lowpass', rolloff: -24 },
            envelope: { attack: 0.01, decay: 0.2, sustain: 0.6, release: 0.8 },
            filterEnvelope: { attack: 0.01, decay: 0.2, sustain: 0.2, release: 0.5, baseFrequency: 60, octaves: 3 }
        });
        this.sampler.chain(this.eq, this.compressor);
    }

    connect(destination) { this.compressor.disconnect(); this.compressor.connect(destination); }
    disconnect() { this.compressor.disconnect(); }

    noteOn(note, velocity = 1, time) {
        this.sampler.triggerAttack(note, time || Tone.now(), Math.min(1, Math.max(0, velocity)));
    }

    noteOff(note, time) {
        // MonoSynth fallback uses triggerRelease() without note; Sampler needs note
        try { this.sampler.triggerRelease(note, time || Tone.now()); } catch(e) {
            try { this.sampler.triggerRelease(time || Tone.now()); } catch(_) {}
        }
    }

    dispose() { this.sampler.dispose(); this.compressor.dispose(); this.eq.dispose(); }
}
