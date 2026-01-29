import { PianoInstrument } from '../instruments/PianoInstrument.js';
import { ElectricPianoInstrument } from '../instruments/ElectricPianoInstrument.js';
import { OrganInstrument } from '../instruments/OrganInstrument.js';
import { StringsInstrument } from '../instruments/StringsInstrument.js';
import { PadInstrument } from '../instruments/PadInstrument.js';
import { BassInstrument } from '../instruments/BassInstrument.js';
import { PluckInstrument } from '../instruments/PluckInstrument.js';

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
        this.registerInstrument('piano-dark', new PianoInstrument({ profile: 'dark' }));
        this.registerInstrument('piano-warm', new PianoInstrument({ profile: 'warm' }));
        this.registerInstrument('piano-felt', new PianoInstrument({ profile: 'felt' }));
        this.registerInstrument('piano-cinematic', new PianoInstrument({ profile: 'cinematic' }));
        this.registerInstrument('upright-piano', new PianoInstrument({ profile: 'upright' }));
        this.registerInstrument('piano-honkytonk', new PianoInstrument({ profile: 'honkytonk' }));
        this.registerInstrument('electric-piano', new ElectricPianoInstrument());
        this.registerInstrument('organ', new OrganInstrument());
        this.registerInstrument('strings', new StringsInstrument());
        this.registerInstrument('pad', new PadInstrument());
        this.registerInstrument('bass', new BassInstrument());
        this.registerInstrument('pluck', new PluckInstrument());

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
