import { NOTES } from '../utils/noteUtils.js';

export class KeyStreamView {
    constructor(container, mappingEngine) {
        this.container = container;
        this.mappingEngine = mappingEngine;
        this.element = null;
        this.strip = null;
        this.notes = [];
        this.currentTime = 0;
        this.pixelsPerSecond = 300; // Restore zoom level for clarity
        this.laneHeight = 55; // Increased for better separation

        this.init();
    }

    init() {
        this.element = document.createElement('div');
        this.element.className = `key-stream-container main-stream`;
        this.element.innerHTML = `
            <div class="hit-marker"></div>
            <div class="stream-strip" id="stream-strip"></div>
        `;

        this.container.appendChild(this.element);
        this.strip = this.element.querySelector('#stream-strip');
    }

    setSong(song) {
        this.notes = [];
        this.strip.innerHTML = '';
        this.pixelsPerSecond = 300;
        const secondsPerBeat = 60 / song.bpm;

        // Collect all notes from all tracks
        const allNotes = [];
        song.tracks.forEach(track => {
            track.notes.forEach(note => {
                allNotes.push({
                    ...note,
                    trackHand: track.hand || 'right', // Default to right if unknown
                    startTime: note.start * secondsPerBeat,
                    endTime: (note.start + note.duration) * secondsPerBeat
                });
            });
        });

        allNotes.sort((a, b) => a.startTime - b.startTime);

        // Smart Spacing Logic (Lanes)
        // Hand Zones:
        // Left Hand: Lanes 0, 1, 2
        // Right Hand: Lanes 3, 4, 5
        const lhLanes = [-1, -1, -1];
        const rhLanes = [-1, -1, -1];

        allNotes.forEach(note => {
            const block = document.createElement('div');
            const isLeft = note.trackHand === 'left';

            block.className = `stream-block ${isLeft ? 'left-hand-block' : 'right-hand-block'}`;
            if (isLeft) block.classList.add('glow-lh');
            else block.classList.add('glow-rh');

            block.dataset.note = note.note;

            const keyLabel = this.getKeyLabel(note.note);
            block.innerHTML = `
                <div class="block-key">${keyLabel}</div>
                <div class="block-note">${note.note}</div>
            `;

            // Find a free lane in appropriate zone
            let laneIndex = 0;
            const targetLanes = isLeft ? lhLanes : rhLanes;

            // Try to find a lane that fits
            // If all full, just use last one (overlap) or mod?
            // Simple approach: Iterate 0-2
            let chosenLane = 0;
            for (let i = 0; i < targetLanes.length; i++) {
                if (targetLanes[i] <= note.startTime + 0.05) {
                    chosenLane = i;
                    break;
                }
                chosenLane = i;
            }

            targetLanes[chosenLane] = note.endTime;

            // Calculate Visual Top Offset
            // Lane Height = 55
            // LH Zone (Top): 0-2 -> Offset 15 + (0..2 * 55)
            // RH Zone (Bottom): 3-5 -> Offset 15 + (3..5 * 55) (Visually separated)

            const zoneOffset = isLeft ? 0 : 3;
            const finalLaneForRender = chosenLane + zoneOffset;

            const zoneGap = isLeft ? 0 : 20; // Extra gap for RH

            const topOffset = 15 + (finalLaneForRender * this.laneHeight) + zoneGap;

            block.style.left = `${note.startTime * this.pixelsPerSecond}px`;
            const width = Math.max(40, (note.endTime - note.startTime) * this.pixelsPerSecond);
            block.style.width = `${width}px`;
            block.style.top = `${topOffset}px`;

            if (note.note.includes('#')) block.classList.add('black-note');

            this.strip.appendChild(block);
            this.notes.push({ time: note.startTime, el: block, note: note.note });
        });
    }

    getKeyLabel(noteName) {
        const layoutManager = this.mappingEngine.getLayoutManager();
        const layout = layoutManager.layouts.get('keyboard');

        const pcKeys = [...layout.whiteKeys, ...layout.blackKeys];
        for (const code of pcKeys) {
            const m = layout.map(code, 4, { shiftKey: false });
            const mShift = layout.map(code, 4, { shiftKey: true });

            if ((m && m.fullName === noteName) || (mShift && mShift.fullName === noteName)) {
                let label = code.replace('Key', '').replace('Digit', '');

                const symbolMap = {
                    'Equal': '=',
                    'Minus': '-',
                    'BracketLeft': '[',
                    'BracketRight': ']',
                    'Backslash': '\\',
                    'Semicolon': ';',
                    'Quote': "'",
                    'Comma': ',',
                    'Period': '.',
                    'Slash': '/',
                    'Backquote': '`'
                };

                return symbolMap[label] || label;
            }
        }
        return noteName;
    }

    update(time) {
        this.currentTime = time;
        const centerOffset = 200; // Hit line position
        const translate = centerOffset - (time * this.pixelsPerSecond);
        this.strip.style.transform = `translateX(${translate}px)`;
    }

    clearHighlights() {
        this.strip.querySelectorAll('.stream-block').forEach(b => b.classList.remove('active'));
    }

    highlight(noteName) {
        const tolerance = 0.2; // s
        const active = this.notes.find(n =>
            n.note === noteName &&
            Math.abs(n.time - this.currentTime) < tolerance
        );

        if (active) active.el.classList.add('active');
    }
}
