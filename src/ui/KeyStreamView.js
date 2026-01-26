export class KeyStreamView {
    constructor(container, mappingEngine, hand = 'right') {
        this.container = container;
        this.mappingEngine = mappingEngine;
        this.hand = hand; // 'left' or 'right'
        this.element = null;
        this.strip = null;
        this.notes = [];
        this.currentTime = 0;
        this.pixelsPerSecond = 150;

        this.init();
    }

    init() {
        this.element = document.createElement('div');
        this.element.className = `key-stream-container ${this.hand}-stream`;
        this.element.innerHTML = `
            <div class="stream-label">${this.hand === 'left' ? 'LH' : 'RH'}</div>
            <div class="hit-marker"></div>
            <div class="stream-strip" id="stream-strip"></div>
        `;

        this.container.appendChild(this.element);
        this.strip = this.element.querySelector('#stream-strip');
    }

    setSong(song) {
        this.notes = [];
        this.strip.innerHTML = '';
        const secondsPerBeat = 60 / song.bpm;

        const lanes = [];

        const filteredNotes = [];
        song.tracks.forEach(track => {
            if (track.hand && track.hand !== this.hand) return;
            track.notes.forEach(note => {
                filteredNotes.push({
                    ...note,
                    startTime: note.start * secondsPerBeat,
                    endTime: (note.start + note.duration) * secondsPerBeat
                });
            });
        });

        filteredNotes.sort((a, b) => a.startTime - b.startTime);

        filteredNotes.forEach(note => {
            const block = document.createElement('div');
            block.className = 'stream-block';
            block.dataset.note = note.note;

            const keyLabel = this.getKeyLabel(note.note);
            block.innerHTML = `
                <div class="block-key">${keyLabel}</div>
                <div class="block-note">${note.note}</div>
            `;

            let laneIndex = 0;
            // Robust stacking: find first lane where previous note doesn't overlap this one's start
            while (lanes[laneIndex] > (note.startTime + 0.05)) {
                laneIndex++;
            }
            lanes[laneIndex] = note.endTime;

            const laneHeight = 35;
            const topOffset = 5 + (laneIndex * laneHeight);

            block.style.left = `${note.startTime * this.pixelsPerSecond}px`;
            block.style.width = `${Math.max(45, (note.endTime - note.startTime) * this.pixelsPerSecond)}px`;
            block.style.top = `${topOffset}px`;

            if (note.note.includes('#')) block.classList.add('black-note');

            this.strip.appendChild(block);
            this.notes.push({ time: note.startTime, el: block, note: note.note });
        });

        this.notes.sort((a, b) => a.time - b.time);
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

                // Human-friendly symbols
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
                    'Slash': '/'
                };

                return symbolMap[label] || label;
            }
        }
        return '?';
    }

    update(time) {
        this.currentTime = time;
        const offset = 100 - (time * this.pixelsPerSecond);
        this.strip.style.transform = `translateX(${offset}px)`;
    }

    clearHighlights() {
        this.strip.querySelectorAll('.stream-block').forEach(b => b.classList.remove('active'));
    }

    highlight(noteName) {
        const active = this.notes.find(n => n.note === noteName && Math.abs(n.time - this.currentTime) < 0.5);
        if (active) active.el.classList.add('active');
    }
}
