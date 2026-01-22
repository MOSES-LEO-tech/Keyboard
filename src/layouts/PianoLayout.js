import { KEY_MAP } from '../utils/keyMaps.js';
import { getNoteFromOffset } from '../utils/noteUtils.js';

export class PianoLayout {
    constructor() {
        this.name = 'piano';
    }

    map(keyCode, currentOctave) {
        const mapping = KEY_MAP[keyCode];
        if (!mapping) return null;

        const noteInfo = getNoteFromOffset(currentOctave, mapping.offset);
        return {
            ...noteInfo,
            // Add visual info if needed
            visualKey: mapping.note // 'C', 'C#' etc for highlighting
        };
    }

    // Returns data needed to render the view
    getVisualModel() {
        return {
            type: 'piano',
            // Piano view logic is mostly static (octaves), handled by renderer
            // But we could pass range here
            startOctave: 3,
            endOctave: 7
        };
    }
}
