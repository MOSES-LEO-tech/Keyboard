/**
 * KeyStreamView — Piano Roll Display
 *
 * A Synthesia-style piano roll where:
 * - Notes scroll from right to left (time = horizontal axis)
 * - Vertical position = pitch (higher pitch = higher on screen)
 * - Left hand = teal/cyan, Right hand = purple/violet
 * - Mini piano guide on the left edge
 * - Notes glow as they approach the hit line
 */

const CHROMATIC = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// Display range: C2 (midi 36) to C8 (midi 96) = 60 semitones
const DISPLAY_LOW_MIDI  = 36;
const DISPLAY_HIGH_MIDI = 96;
const TOTAL_SEMITONES   = DISPLAY_HIGH_MIDI - DISPLAY_LOW_MIDI;

function noteNameToMidi(noteName) {
    const match = noteName.match(/^([A-G][b#]?)(\d)$/);
    if (!match) return null;
    let [, name, octStr] = match;
    const oct = parseInt(octStr);
    const flatMap = { 'Bb': 'A#', 'Db': 'C#', 'Eb': 'D#', 'Gb': 'F#', 'Ab': 'G#' };
    if (flatMap[name]) name = flatMap[name];
    const idx = CHROMATIC.indexOf(name);
    if (idx === -1) return null;
    return (oct + 1) * 12 + idx;
}

function isBlackKey(midi) {
    return [1, 3, 6, 8, 10].includes(midi % 12);
}

export class KeyStreamView {
    constructor(container, mappingEngine) {
        this.container      = container;
        this.mappingEngine  = mappingEngine;
        this.notes          = [];
        this.currentTime    = 0;
        this.pixelsPerSecond = 280;
        this.PIANO_GUIDE_WIDTH = 36;
        this.HIT_X             = 220;
        this.ROW_HEIGHT        = 0;
        this.activeNotes       = new Set();
        this.animFrameId       = null;

        this.init();
    }

    init() {
        this.element = document.createElement('div');
        this.element.className = 'key-stream-container main-stream';
        this.element.style.cssText = `
            position: relative; width: 100%; height: 100%;
            background: #0a0a0f; overflow: hidden;
        `;

        this.canvas = document.createElement('canvas');
        this.canvas.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;';
        this.ctx = this.canvas.getContext('2d');

        this.pianoCanvas = document.createElement('canvas');
        this.pianoCanvas.style.cssText = `position:absolute;top:0;left:0;width:${this.PIANO_GUIDE_WIDTH}px;height:100%;z-index:5;`;
        this.pianoCtx = this.pianoCanvas.getContext('2d');

        this.hitLine = document.createElement('div');
        this.hitLine.style.cssText = `
            position:absolute; left:${this.HIT_X}px; top:0; bottom:0; width:2px;
            background:linear-gradient(to bottom, transparent, rgba(255,255,255,0.6) 20%,
            rgba(255,255,255,0.6) 80%, transparent); z-index:10; pointer-events:none;
        `;

        this.element.appendChild(this.canvas);
        this.element.appendChild(this.pianoCanvas);
        this.element.appendChild(this.hitLine);
        this.container.appendChild(this.element);

        this._resizeObserver = new ResizeObserver(() => this._onResize());
        this._resizeObserver.observe(this.element);
        this._onResize();
        this._startRenderLoop();
    }

    _onResize() {
        const w = this.element.clientWidth  || 800;
        const h = this.element.clientHeight || 220;
        this.canvas.width  = w;
        this.canvas.height = h;
        this.pianoCanvas.width  = this.PIANO_GUIDE_WIDTH;
        this.pianoCanvas.height = h;
        this.ROW_HEIGHT = h / TOTAL_SEMITONES;
        this._drawPianoGuide();
    }

    setSong(song) {
        this.notes = [];
        this.currentTime = 0;
        this.activeNotes.clear();

        const secondsPerBeat = 60 / song.bpm;

        song.tracks.forEach(track => {
            const hand = track.hand || 'right';
            track.notes.forEach(note => {
                const midi = noteNameToMidi(note.note);
                if (midi === null) return;
                this.notes.push({
                    midi,
                    noteName: note.note,
                    startTime: note.start * secondsPerBeat,
                    endTime:   (note.start + note.duration) * secondsPerBeat,
                    hand,
                });
            });
        });

        this.notes.sort((a, b) => a.startTime - b.startTime);
    }

    _startRenderLoop() {
        const loop = () => {
            this._render();
            this.animFrameId = requestAnimationFrame(loop);
        };
        this.animFrameId = requestAnimationFrame(loop);
    }

    update(time) {
        this.currentTime = time;
    }

    highlight(noteName) {
        const midi = noteNameToMidi(noteName);
        if (midi !== null) this.activeNotes.add(midi);
    }

    clearHighlights() {
        this.activeNotes.clear();
    }

    _render() {
        const ctx = this.ctx;
        const w   = this.canvas.width;
        const h   = this.canvas.height;
        if (!w || !h) return;

        ctx.clearRect(0, 0, w, h);
        this._drawBackground(ctx, w, h);
        this._drawGridLines(ctx, w, h);
        this._drawNotes(ctx, w, h);
    }

    _drawBackground(ctx, w, h) {
        ctx.fillStyle = '#0a0a0f';
        ctx.fillRect(0, 0, w, h);

        // Black key row tint
        for (let midi = DISPLAY_LOW_MIDI; midi < DISPLAY_HIGH_MIDI; midi++) {
            if (isBlackKey(midi)) {
                const y = this._midiToY(midi, h);
                ctx.fillStyle = 'rgba(0,0,0,0.3)';
                ctx.fillRect(this.PIANO_GUIDE_WIDTH, y - this.ROW_HEIGHT * 0.5,
                             w - this.PIANO_GUIDE_WIDTH, this.ROW_HEIGHT);
            }
        }

        // Octave lines + labels at C notes
        for (let midi = DISPLAY_LOW_MIDI; midi <= DISPLAY_HIGH_MIDI; midi++) {
            if (midi % 12 === 0) {
                const y = this._midiToY(midi, h) + this.ROW_HEIGHT * 0.5;
                ctx.beginPath();
                ctx.moveTo(this.PIANO_GUIDE_WIDTH, y);
                ctx.lineTo(w, y);
                ctx.strokeStyle = 'rgba(255,255,255,0.1)';
                ctx.lineWidth = 1;
                ctx.stroke();

                const oct = Math.floor(midi / 12) - 1;
                ctx.fillStyle = 'rgba(255,255,255,0.15)';
                ctx.font = '9px monospace';
                ctx.fillText('C' + oct, this.PIANO_GUIDE_WIDTH + 5, y - 2);
            }
        }
    }

    _drawGridLines(ctx, w, h) {
        const beatWidth = this.pixelsPerSecond * 0.5;
        const offset    = (this.currentTime * this.pixelsPerSecond) % beatWidth;

        ctx.strokeStyle = 'rgba(255,255,255,0.035)';
        ctx.lineWidth = 1;
        for (let x = this.HIT_X - offset; x < w; x += beatWidth) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, h);
            ctx.stroke();
        }
    }

    _drawNotes(ctx, w, h) {
        const visibleStart = this.currentTime - (this.HIT_X - this.PIANO_GUIDE_WIDTH) / this.pixelsPerSecond;
        const visibleEnd   = this.currentTime + (w - this.HIT_X) / this.pixelsPerSecond + 2;

        for (const note of this.notes) {
            if (note.endTime < visibleStart) continue;
            if (note.startTime > visibleEnd)  break;

            const isLeft   = note.hand === 'left';
            const isActive = this.activeNotes.has(note.midi);

            const x1    = this.HIT_X + (note.startTime - this.currentTime) * this.pixelsPerSecond;
            const x2    = this.HIT_X + (note.endTime   - this.currentTime) * this.pixelsPerSecond;
            const noteW = Math.max(x2 - x1, 4);
            const y     = this._midiToY(note.midi, h);
            const rh    = Math.max(this.ROW_HEIGHT - 1.5, 3);

            // Proximity glow (within 0.6s of hit line)
            const dist      = Math.abs(note.startTime - this.currentTime);
            const proximity = Math.max(0, 1 - dist / 0.6);

            this._drawNoteBlock(ctx, x1, y - rh * 0.5, noteW, rh,
                                isLeft, isBlackKey(note.midi), isActive, proximity);
        }
    }

    _drawNoteBlock(ctx, x, y, w, h, isLeft, isBlack, isActive, proximity) {
        const radius = Math.min(h * 0.45, 4);

        // Right hand = purple (hue 270), Left hand = teal (hue 185)
        const hue  = isLeft ? 185 : 270;
        const sat  = 88;
        let   lig  = isBlack ? 42 : (isLeft ? 52 : 58);
        if (isActive) lig = Math.min(lig + 18, 80);
        const glowLig = lig + proximity * 14;

        // Shadow / glow
        ctx.shadowColor = `hsla(${hue},100%,65%,${0.1 + proximity * 0.55})`;
        ctx.shadowBlur  = 4 + proximity * 18;

        // Gradient fill
        const grad = ctx.createLinearGradient(x, y, x, y + h);
        grad.addColorStop(0, `hsl(${hue},${sat}%,${glowLig}%)`);
        grad.addColorStop(1, `hsl(${hue},${sat}%,${lig - 12}%)`);
        ctx.fillStyle = grad;

        this._roundRect(ctx, x, y, w, h, radius);
        ctx.fill();

        ctx.shadowBlur  = 0;
        ctx.shadowColor = 'transparent';

        // Highlight stripe at top
        ctx.fillStyle = `rgba(255,255,255,${0.1 + proximity * 0.1})`;
        ctx.beginPath();
        ctx.rect(x + radius, y, w - radius * 2, Math.min(h * 0.28, 3));
        ctx.fill();

        // Border
        ctx.strokeStyle = `hsla(${hue},80%,80%,0.22)`;
        ctx.lineWidth = 0.75;
        this._roundRect(ctx, x, y, w, h, radius);
        ctx.stroke();
    }

    _roundRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    }

    _drawPianoGuide() {
        const ctx = this.pianoCtx;
        const w   = this.PIANO_GUIDE_WIDTH;
        const h   = this.pianoCanvas.height;
        if (!w || !h) return;

        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = '#111118';
        ctx.fillRect(0, 0, w, h);

        for (let midi = DISPLAY_LOW_MIDI; midi < DISPLAY_HIGH_MIDI; midi++) {
            const y    = this._midiToY(midi, h);
            const rh   = this.ROW_HEIGHT;
            const keyH = Math.max(rh - 1, 1);
            const keyY = y - rh * 0.5;
            const isB  = isBlackKey(midi);
            const isC  = (midi % 12 === 0);

            ctx.fillStyle = isB ? '#181820' : '#252530';
            ctx.fillRect(0, keyY, w - 1, keyH);

            if (isC) {
                // White dot to mark C notes
                ctx.fillStyle = 'rgba(255,255,255,0.45)';
                ctx.beginPath();
                ctx.arc(7, keyY + keyH * 0.5, 2.5, 0, Math.PI * 2);
                ctx.fill();
            }

            // Row divider
            ctx.fillStyle = '#0a0a0f';
            ctx.fillRect(0, keyY + keyH, w, 1);
        }

        // Right border line
        ctx.fillStyle = 'rgba(255,255,255,0.07)';
        ctx.fillRect(w - 1, 0, 1, h);
    }

    _midiToY(midi, h) {
        const fraction = 1 - (midi - DISPLAY_LOW_MIDI) / TOTAL_SEMITONES;
        return fraction * h;
    }

    destroy() {
        if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
        if (this._resizeObserver) this._resizeObserver.disconnect();
        this.element?.remove();
    }
}
