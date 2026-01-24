export class Visualizer {
    constructor(container, mappingEngine) {
        this.container = container;
        this.mappingEngine = mappingEngine;
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.notes = []; // { note, time, duration, ... }
        this.currentTime = 0;
        this.lookAhead = 3; // Seconds to see ahead
        this.speed = 100; // Pixels per second (will be dynamic based on height)
        this.running = false;

        this.init();
    }

    init() {
        this.canvas.className = 'visualizer-overlay';
        // Insert before keyboard container so it's behind/above keys? 
        // Actually, we want it ON TOP or aligned with piano.
        // Let's assume it overlays the whole screen or just the piano area.
        // For now, absolute positioning over the keyboard container.

        this.canvas.style.position = 'absolute';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        this.canvas.style.pointerEvents = 'none'; // Click through
        this.canvas.style.zIndex = '50';

        // We need to append to keyboard container, but keyboard container clears innerHTML often.
        // Better to append to a wrapper relative to keyboard.
        // Let's rely on UI to place it. For now, assume passed container is stable.
        this.container.appendChild(this.canvas);

        window.addEventListener('resize', () => this.resize());
        this.resize();
        this.loop();
    }

    resize() {
        const rect = this.container.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
    }

    setSong(song) {
        // Flatten song to renderable notes
        this.notes = [];
        const secondsPerBeat = 60 / song.bpm;

        song.tracks.forEach(track => {
            track.notes.forEach(note => {
                this.notes.push({
                    name: note.note,
                    startTime: note.start * secondsPerBeat,
                    endTime: (note.start + note.duration) * secondsPerBeat,
                    color: track.instrument === 'piano' ? '#00f3ff' : '#bc13fe'
                });
            });
        });

        this.notes.sort((a, b) => a.startTime - b.startTime);
    }

    setTime(time) {
        this.currentTime = time;
    }

    loop() {
        if (!this.running) {
            requestAnimationFrame(() => this.loop());
            return;
        }

        // Clear
        const w = this.canvas.width;
        const h = this.canvas.height;
        this.ctx.clearRect(0, 0, w, h);

        // Draw Notes
        // We only draw notes that are within [currentTime, currentTime + lookAhead]
        // Y position: 0 (top) is currentTime + lookAhead
        // Y position: h (bottom/keys) is currentTime

        // Actually, falling means:
        // Top: Future
        // Bottom: Present (Hit Line)

        const pixelsPerSecond = h / this.lookAhead;

        // Get key positions from Mapping/Layout?
        // This is tricky. We need the X coordinates of the specific keys.
        // We can query the DOM keys?
        const layoutManager = this.mappingEngine.getLayoutManager();
        // Assuming Piano View is active.
        // DOM keys have data-note="C4".

        this.notes.forEach(note => {
            // Check visibility
            if (note.endTime < this.currentTime || note.startTime > this.currentTime + this.lookAhead) {
                return;
            }

            // Calculate Y
            // Start (Top)
            const timeUntilStart = note.startTime - this.currentTime;
            const timeUntilEnd = note.endTime - this.currentTime;

            // Map time to Y
            // 0s delta -> Bottom (h)
            // lookAhead delta -> Top (0)

            const startY = h - (timeUntilStart * pixelsPerSecond);
            const endY = h - (timeUntilEnd * pixelsPerSecond);
            // Note bar length
            const barHeight = startY - endY;

            // Calculate X
            const keyEl = document.querySelector(`.key[data-note="${note.name}"]`);
            if (keyEl) {
                const rect = keyEl.getBoundingClientRect();
                const containerRect = this.canvas.getBoundingClientRect();
                const x = rect.left - containerRect.left;
                const width = rect.width;

                // Draw
                this.ctx.fillStyle = note.color;
                // Add Glow
                this.ctx.shadowBlur = 10;
                this.ctx.shadowColor = note.color;

                // Rect (X, Y, W, H)
                // Y is really endY (top of note bar in screen space)
                // Height is barHeight

                // We want the 'active' part to be at the bottom when time=0
                // So at time=startTime, the bottom of the block hits the bottom of screen.

                // When note is playing (currentTime > startTime), it should slide off screen?
                // Visualizer usually hits a "receptor" line.

                // Let's say keyboard is at bottom (h).
                // Note Y = h - (timeUntilHit * speed)
                // If note lasts 1s, the "tail" is higher up.

                const noteBottomY = h - (timeUntilStart * pixelsPerSecond);
                const noteTopY = h - (timeUntilEnd * pixelsPerSecond);

                this.ctx.fillRect(x, noteTopY, width, noteBottomY - noteTopY);

                this.ctx.shadowBlur = 0;
            }
        });

        requestAnimationFrame(() => this.loop());
    }

    start() {
        this.running = true;
        this.resize(); // Ensure size
    }

    stop() {
        this.running = false;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
}
