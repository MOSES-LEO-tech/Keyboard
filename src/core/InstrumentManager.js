import { PianoInstrument } from '../instruments/PianoInstrument.js';
import { GrandPianoInstrument } from '../instruments/GrandPianoInstrument.js';
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
        this.instances = new Map(); // Store instantiated instruments
        this.registry = new Map();  // Store factory functions

        // Register factory functions for lazy instantiation
        this.register('piano', () => new PianoInstrument());
        this.register('piano-bright', () => new PianoInstrument({ profile: 'bright' }));
        this.register('piano-soft', () => new PianoInstrument({ profile: 'soft' }));
        this.register('piano-dark', () => new PianoInstrument({ profile: 'dark' }));
        this.register('piano-warm', () => new PianoInstrument({ profile: 'warm' }));
        this.register('piano-felt', () => new PianoInstrument({ profile: 'felt' }));
        this.register('piano-cinematic', () => new PianoInstrument({ profile: 'cinematic' }));
        this.register('upright-piano', () => new PianoInstrument({ profile: 'upright' }));
        this.register('piano-honkytonk', () => new PianoInstrument({ profile: 'honkytonk' }));

        // Grand Piano (enhanced samples with concert hall reverb)
        this.register('grand-piano', () => new GrandPianoInstrument());

        this.register('electric-piano', () => new ElectricPianoInstrument());
        this.register('organ', () => new OrganInstrument());
        this.register('strings', () => new StringsInstrument());
        this.register('pad', () => new PadInstrument());
        this.register('bass', () => new BassInstrument());
        this.register('pluck', () => new PluckInstrument());

        // Default
        this.switchTo('piano');
    }

    register(name, factory) {
        this.registry.set(name, factory);
    }

    switchTo(name) {
        if (!this.registry.has(name)) {
            console.warn(`Instrument ${name} not found in registry.`);
            return;
        }

        // Lazy instantiation
        if (!this.instances.has(name)) {
            const factory = this.registry.get(name);
            this.instances.set(name, factory());
            console.log(`Instantiated instrument: ${name}`);
        }

        const newInstrument = this.instances.get(name);

        // Disconnect old
        if (this.currentInstrument && this.currentInstrument !== newInstrument) {
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
