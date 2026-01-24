import { InstrumentManager } from './InstrumentManager.js';

export class AudioEngine {
    constructor(stateManager) {
        this.stateManager = stateManager;
        this.context = null;
        this.masterGain = null;
        this.limiter = null;
        this.instrumentManager = null;
        this.isInitialized = false;
        this.latencies = [];
        this.latencyCount = 0;
        this.sustain = false;
        this.sustainedNotes = new Set();

        this.init();
    }

    async init() {
        console.log('AudioEngine: Initializing Tone.js...');

        // Wait for Tone.js to be available (if loaded via CDN async)
        if (typeof Tone === 'undefined') {
            console.error('Tone.js library not found! Make sure it is included in index.html');
            return;
        }

        this.context = Tone.context;

        // Master Chain
        this.limiter = new Tone.Limiter(-1).toDestination();
        this.masterGain = new Tone.Gain(this.stateManager.getState().volume ?? 2.5);
        this.masterGain.connect(this.limiter);

        // Instrument Manager
        this.instrumentManager = new InstrumentManager(this.context, this.masterGain);

        // Subscribe to State Changes (instrument, sustain)
        this.stateManager.subscribe(state => {
            if (state.instrument) {
                this.instrumentManager.switchTo(state.instrument);
            }
            if (typeof state.volume === 'number') {
                // Smooth ramp to new volume
                if (this.masterGain) {
                    this.masterGain.gain.rampTo(state.volume, 0.1);
                }
            }
            const newSustain = !!state.sustain;
            if (newSustain !== this.sustain) {
                if (this.sustain && !newSustain) {
                    const inst = this.instrumentManager.getCurrent();
                    if (inst) {
                        this.sustainedNotes.forEach(n => inst.noteOff(n));
                    }
                    this.sustainedNotes.clear();
                }
                this.sustain = newSustain;
            }
        });

        this.isInitialized = true;
    }

    async resumeContext() {
        if (Tone.context.state !== 'running') {
            await Tone.start();
            console.log('Audio Context Resumed');
        }
    }

    async handleNote(noteEvent) {
        if (!this.isInitialized) return;
        try {
            await this.resumeContext();
        } catch (e) {
            console.error('Error resuming audio context', e);
            return;
        }

        const instrument = this.instrumentManager.getCurrent();
        if (!instrument) {
            console.warn('No current instrument to play note', noteEvent);
            return;
        }

        if (noteEvent.type === 'noteOn') {
            if (noteEvent.inputTime) {
                const latency = performance.now() - noteEvent.inputTime;
                this.latencies.push(latency);
                this.latencyCount++;
                if (this.latencies.length > 200) this.latencies.shift();
                if (this.latencyCount % 20 === 0) {
                    const sorted = [...this.latencies].sort((a, b) => a - b);
                    const median = sorted[Math.floor(sorted.length / 2)] || 0;
                    const p95 = sorted[Math.floor(sorted.length * 0.95)] || 0;
                    console.log(`Latency: median ${median.toFixed(1)}ms, p95 ${p95.toFixed(1)}ms`);
                }
            }
            this.sustainedNotes.delete(noteEvent.fullName);
            console.log('NoteOn', noteEvent.fullName, 'vel', noteEvent.velocity);
            instrument.noteOn(noteEvent.fullName, noteEvent.velocity ?? 1);
        } else if (noteEvent.type === 'noteOff') {
            if (this.sustain) {
                this.sustainedNotes.add(noteEvent.fullName);
            } else {
                console.log('NoteOff', noteEvent.fullName);
                instrument.noteOff(noteEvent.fullName);
            }
        }
    }

    setRoom(amount) {
        const inst = this.instrumentManager.getCurrent();
        if (inst && typeof inst.setRoom === 'function') {
            inst.setRoom(amount);
        }
    }

    setBrightness(amount) {
        const inst = this.instrumentManager.getCurrent();
        if (inst && typeof inst.setBrightness === 'function') {
            inst.setBrightness(amount);
        }
    }
}
