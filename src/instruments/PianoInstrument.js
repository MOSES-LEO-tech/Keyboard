import { BaseInstrument } from './BaseInstrument.js';

export class PianoInstrument extends BaseInstrument {
    constructor(options = {}) {
        super();
        const profile = options.profile || 'normal';
        
        // Salamander Grand Piano Samples (Lightweight subset)
        this.sampler = new Tone.Sampler({
            urls: {
                "A0": "A0.mp3",
                "C1": "C1.mp3",
                "D#1": "Ds1.mp3",
                "F#1": "Fs1.mp3",
                "A1": "A1.mp3",
                "C2": "C2.mp3",
                "D#2": "Ds2.mp3",
                "F#2": "Fs2.mp3",
                "A2": "A2.mp3",
                "C3": "C3.mp3",
                "D#3": "Ds3.mp3",
                "F#3": "Fs3.mp3",
                "A3": "A3.mp3",
                "C4": "C4.mp3",
                "D#4": "Ds4.mp3",
                "F#4": "Fs4.mp3",
                "A4": "A4.mp3",
                "C5": "C5.mp3",
                "D#5": "Ds5.mp3",
                "F#5": "Fs5.mp3",
                "A5": "A5.mp3",
                "C6": "C6.mp3",
                "D#6": "Ds6.mp3",
                "F#6": "Fs6.mp3",
                "A6": "A6.mp3",
                "C7": "C7.mp3",
                "D#7": "Ds7.mp3",
                "F#7": "Fs7.mp3",
                "A7": "A7.mp3",
                "C8": "C8.mp3"
            },
            release: 1,
            baseUrl: "https://tonejs.github.io/audio/salamander/",
            onload: () => {
                console.log("Piano Samples Loaded!");
                window.dispatchEvent(new CustomEvent('samples-loaded', { detail: { instrument: 'piano' } }));
            }
        });

        const eqSettings = {
            normal: { low: 0, mid: 0, high: 0 },
            bright: { low: -1, mid: 0, high: 3 },
            soft: { low: 1, mid: 1, high: -2 }
        }[profile];
        this.eq = new Tone.EQ3(eqSettings.low, eqSettings.mid, eqSettings.high);

        this.reverb = new Tone.Reverb({
            decay: 2.5,
            preDelay: 0.1,
            wet: 0.2
        }).toDestination();
        this.reverb.generate();

        this.sampler.chain(this.eq, this.reverb);
        this.output = this.sampler;
    }

    connect(destination) {
        // We override connect to ensure the reverb chain is respected.
        // Or we can connect sampler -> reverb -> destination.
        // BaseInstrument.connect connects this.output to destination.
        // If this.output is sampler, we bypass reverb if we use base connect.
        
        // Let's set this.output to the last node in our internal chain?
        // But Reverb is global-ish.
        
        // For now, let's just chain: Sampler -> Reverb -> Destination
        // And if the Manager calls connect, we connect Reverb to Destination.
        
        // However, Reverb is expensive to disconnect/reconnect sometimes.
        // Let's just keep it simple:
        this.reverb.disconnect();
        this.reverb.connect(destination);
    }

    disconnect() {
        this.reverb.disconnect();
    }

    noteOn(note, velocity = 1, time) {
        const now = time || Tone.now();
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
