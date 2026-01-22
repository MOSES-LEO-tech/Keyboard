export class BaseInstrument {
    constructor() {
        if (this.constructor === BaseInstrument) {
            throw new Error("Abstract classes can't be instantiated.");
        }
        this.output = null; // The Tone.js node to connect to the rest of the chain
    }

    connect(destination) {
        if (this.output) {
            this.output.connect(destination);
        }
    }

    disconnect() {
        if (this.output) {
            this.output.disconnect();
        }
    }

    noteOn(note, velocity = 1, time) {
        throw new Error("Method 'noteOn()' must be implemented.");
    }

    noteOff(note, time) {
        throw new Error("Method 'noteOff()' must be implemented.");
    }

    dispose() {
        // Cleanup resources
    }
}
