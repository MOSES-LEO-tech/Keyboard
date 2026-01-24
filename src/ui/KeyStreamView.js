export class KeyStreamView {
    constructor(container, mappingEngine) {
        this.container = container;
        this.mappingEngine = mappingEngine;
        this.element = null;
        this.strip = null;
        this.notes = [];
        this.currentTime = 0;
        this.pixelsPerSecond = 150; // Scrolling speed

        this.init();
    }

    init() {
        this.element = document.createElement('div');
        this.element.className = 'key-stream-container';
        this.element.innerHTML = `
            <div class="hit-marker"></div>
            <div class="stream-strip" id="stream-strip"></div>
        `;

        // Find a good place for it. Above the keyboard.
        // We'll let UI class handle the placement if needed, but for now:
        this.container.prepend(this.element);
        this.strip = this.element.querySelector('#stream-strip');
    }

    setSong(song) {
        this.notes = [];
        this.strip.innerHTML = '';
        const secondsPerBeat = 60 / song.bpm;

        song.tracks.forEach(track => {
            track.notes.forEach(note => {
                const startTime = note.start * secondsPerBeat;
                const duration = note.duration * secondsPerBeat;

                const block = document.createElement('div');
                block.className = 'stream-block';
                block.dataset.note = note.note;

                // Get Key Label if possible
                const keyLabel = this.getKeyLabel(note.note);
                block.innerHTML = `
                    <div class="block-key">${keyLabel}</div>
                    <div class="block-note">${note.note}</div>
                `;

                // Position based on time
                // We'll move the WHOLE strip, but blocks need initial offsets
                block.style.left = `${startTime * this.pixelsPerSecond}px`;
                block.style.width = `${Math.max(40, duration * this.pixelsPerSecond - 4)}px`;

                if (note.note.includes('#')) block.classList.add('black-note');

                this.strip.appendChild(block);
                this.notes.push({ time: startTime, el: block, note: note.note });
            });
        });

        this.notes.sort((a, b) => a.time - b.time);
    }

    getKeyLabel(noteName) {
        // Simple lookup from the current layout mapping if available
        const layoutManager = this.mappingEngine.getLayoutManager();
        const layout = layoutManager.layouts.get('keyboard');

        // This is a bit slow to do per label, but it's only on song load.
        // We search for a key that maps to this note at octave 4 (standard base)
        const pcKeys = [...layout.whiteKeys, ...layout.blackKeys];
        for (const code of pcKeys) {
            const m = layout.map(code, 4, { shiftKey: false });
            const mShift = layout.map(code, 4, { shiftKey: true });

            // Check note name match (strip octave? or keep?)
            // Usually internal notes are fullName (C4). 
            // layout.map returns fullName.
            if ((m && m.fullName === noteName) || (mShift && mShift.fullName === noteName)) {
                return code.replace('Key', '').replace('Digit', '');
            }
        }
        return '?';
    }

    update(time) {
        this.currentTime = time;
        // Scroll the strip
        // Current Time hits the Hit Marker (left side or center?)
        // Let's say hit marker is at 100px from left.
        const offset = 100 - (time * this.pixelsPerSecond);
        this.strip.style.transform = `translateX(${offset}px)`;

        // Highlight active notes in the strip? 
        // We can do that by checking time vs note.time.
    }

    clearHighlights() {
        this.strip.querySelectorAll('.stream-block').forEach(b => b.classList.remove('active'));
    }

    highlight(noteName) {
        // Find the block closest to current time that matches noteName
        const active = this.notes.find(n => n.note === noteName && Math.abs(n.time - this.currentTime) < 0.5);
        if (active) active.el.classList.add('active');
    }
}
