import { NOTES } from '../utils/noteUtils.js';

export class LearnMode {
    constructor(stateManager) {
        this.stateManager = stateManager;
        this.name = 'learn';
        // Simple C Major scale for now
        this.targetScale = ['C', 'D', 'E', 'F', 'G', 'A', 'B']; 
    }

    enter() {
        console.log('Entered Learn Mode');
        // Notify UI to highlight the scale
        // In a real app, we'd have a specific "Guide" state
    }

    handleNote(noteEvent) {
        // Filter: Only allow notes in the scale
        // noteEvent.note is "C" or "C#" etc.
        const noteName = noteEvent.note; 
        
        if (this.targetScale.includes(noteName)) {
            return noteEvent; // Allow
        } else {
            // Block (return null or modified event)
            if (noteEvent.type === 'noteOn') {
                console.log(`Wrong note: ${noteName}`);
                // Optional: Play a "thud" sound or visual error
            }
            return null; // Block sound
        }
    }

    exit() {
        // Cleanup
    }
}