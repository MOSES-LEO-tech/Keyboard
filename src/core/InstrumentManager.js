import { PianoInstrument } from '../instruments/PianoInstrument.js';
import { ElectricPianoInstrument } from '../instruments/ElectricPianoInstrument.js';

export class InstrumentManager {
    constructor(audioContext, destination) {
        this.context = audioContext;
        this.destination = destination;
        this.currentInstrument = null;
        this.instruments = new Map();
        
        // Pre-register core instruments
        this.registerInstrument('piano', new PianoInstrument());
        this.registerInstrument('piano-bright', new PianoInstrument({ profile: 'bright' }));
        this.registerInstrument('piano-soft', new PianoInstrument({ profile: 'soft' }));
        this.registerInstrument('electric-piano', new ElectricPianoInstrument());
        
        // Default
        this.switchTo('piano');
    }

    registerInstrument(name, instrumentInstance) {
        this.instruments.set(name, instrumentInstance);
    }

    switchTo(name) {
        if (!this.instruments.has(name)) {
            console.warn(`Instrument ${name} not found.`);
            return;
        }

        const newInstrument = this.instruments.get(name);
        
        // Disconnect old
        if (this.currentInstrument) {
            this.currentInstrument.disconnect();
        }

        // Connect new
        newInstrument.connect(this.destination);
        this.currentInstrument = newInstrument;
        console.log(`Switched to instrument: ${name}`);
    }

    getCurrent() {
        return this.currentInstrument;
    }
}
