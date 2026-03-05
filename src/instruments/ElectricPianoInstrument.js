import { BaseInstrument } from './BaseInstrument.js';

/**
 * ElectricPianoInstrument
 * Uses the same Salamander-adjacent base but with an FM-flavoured audio chain —
 * chorus + tremolo give the classic Wurlitzer/Rhodes feel.
 * Falls back to FMSynth if samples fail.
 */
export class ElectricPianoInstrument extends BaseInstrument {
    constructor() {
        super();

        this.chorus  = new Tone.Chorus(2, 3.5, 0.5).start();
        this.chorus.wet.value = 0.4;
        this.tremolo = new Tone.Tremolo(5, 0.25).start();
        this.tremolo.wet.value = 0.3;
        this.reverb  = new Tone.Reverb({ decay: 2.0, preDelay: 0.05, wet: 0.15 });
        this._reverbReady = false;

        // Use Salamander samples pitched down / treated via EQ for e-piano colour
        this.sampler = new Tone.Sampler({
            urls: {
                'A0':'A0.mp3','C1':'C1.mp3','D#1':'Ds1.mp3','F#1':'Fs1.mp3',
                'A1':'A1.mp3','C2':'C2.mp3','D#2':'Ds2.mp3','F#2':'Fs2.mp3',
                'A2':'A2.mp3','C3':'C3.mp3','D#3':'Ds3.mp3','F#3':'Fs3.mp3',
                'A3':'A3.mp3','C4':'C4.mp3','D#4':'Ds4.mp3','F#4':'Fs4.mp3',
                'A4':'A4.mp3','C5':'C5.mp3','D#5':'Ds5.mp3','F#5':'Fs5.mp3',
                'A5':'A5.mp3','C6':'C6.mp3','D#6':'Ds6.mp3','F#6':'Fs6.mp3',
                'A6':'A6.mp3','C7':'C7.mp3'
            },
            release: 1.2,
            baseUrl: 'https://tonejs.github.io/audio/salamander/',
            onload: () => {
                console.log('[ElectricPiano] Samples loaded');
                window.dispatchEvent(new CustomEvent('samples-loaded', { detail: { instrument: 'electric-piano' } }));
            },
            onerror: () => this._fallback()
        });

        this.sampler.chain(this.chorus, this.tremolo, this.reverb);
        this.output = this.reverb;
    }

    _fallback() {
        console.warn('[ElectricPiano] Samples failed, using FMSynth fallback');
        this.sampler = new Tone.PolySynth(Tone.FMSynth, {
            harmonicity: 3, modulationIndex: 10,
            oscillator: { type: 'sine' },
            modulation: { type: 'triangle' },
            envelope: { attack: 0.01, decay: 0.2, sustain: 0.3, release: 1.6 },
            modulationEnvelope: { attack: 0.01, decay: 0.2, sustain: 0.2, release: 1.6 }
        });
        this.sampler.chain(this.chorus, this.tremolo, this.reverb);
    }

    connect(destination) { this.reverb.disconnect(); this.reverb.connect(destination); }
    disconnect() { this.reverb.disconnect(); }

    noteOn(note, velocity = 1, time) {
        const now = time || Tone.now();
        if (!this._reverbReady) { this.reverb.generate(); this._reverbReady = true; }
        this.sampler.triggerAttack(note, now, velocity);
    }

    noteOff(note, time) { this.sampler.triggerRelease(note, time || Tone.now()); }

    setBrightness(amount) {
        const a = Math.min(1, Math.max(0, amount));
        this.chorus.wet.value = 0.2 + a * 0.5;
        this.tremolo.frequency.value = 3 + a * 6;
    }

    dispose() {
        this.sampler.dispose(); this.chorus.dispose();
        this.tremolo.dispose(); this.reverb.dispose();
    }
}
