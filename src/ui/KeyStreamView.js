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
        this.columnOverlays    = new Map(); // fullName -> overlay element
        
        // Track note range for dynamic row height calculation
        this.minMidi = DISPLAY_LOW_MIDI;
        this.maxMidi = DISPLAY_HIGH_MIDI;
        
        // Debounce timer for resize
        this._resizeTimer = null;

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

        // Play now guide line - vertical line at 15% from left
        this.playNowLine = document.createElement('div');
        this.playNowLine.style.cssText = `
            position:absolute; left:15%; top:0; bottom:0; width:1.5px;
            background:rgba(255,255,255,0.3); z-index:8; pointer-events:none;
            box-shadow:0 0 8px rgba(255,255,255,0.4);
        `;

        this.element.appendChild(this.canvas);
        this.element.appendChild(this.pianoCanvas);
        this.element.appendChild(this.playNowLine);
        this.element.appendChild(this.hitLine);
        this.container.appendChild(this.element);

        this._resizeObserver = new ResizeObserver(() => this._scheduleResize());
        this._resizeObserver.observe(this.element);
        this._onResize();
        this._startRenderLoop();
    }

    _onResize() {
        const w = this.element.clientWidth  || 800;
        const h = this.element.clientHeight || 220;
        
        // Calculate note range (padded)
        const noteRange = this.maxMidi - this.minMidi + 1;
        
        // Calculate row height dynamically: containerHeight / (noteRange + 6 for padding)
        this.ROW_HEIGHT = h / (noteRange + 6);
        
        this.canvas.width  = w;
        this.canvas.height = h;
        this.pianoCanvas.width  = this.PIANO_GUIDE_WIDTH;
        this.pianoCanvas.height = h;
        
        this._drawPianoGuide();
    }
    
    _scheduleResize() {
        // Debounce resize handler (wait 100ms after last resize event)
        if (this._resizeTimer) {
            clearTimeout(this._resizeTimer);
        }
        this._resizeTimer = setTimeout(() => {
            this._onResize();
        }, 100);
    }

    setSong(song) {
        this.notes = [];
        this.currentTime = 0;
        this.activeNotes.clear();
        
        // Reset note range
        this.minMidi = DISPLAY_HIGH_MIDI;
        this.maxMidi = DISPLAY_LOW_MIDI;

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
                // Track note range
                this.minMidi = Math.min(this.minMidi, midi);
                this.maxMidi = Math.max(this.maxMidi, midi);
            });
        });

        this.notes.sort((a, b) => a.startTime - b.startTime);
        
        // Add padding to note range (3 semitones above and below)
        this.minMidi = Math.max(DISPLAY_LOW_MIDI, this.minMidi - 3);
        this.maxMidi = Math.min(DISPLAY_HIGH_MIDI, this.maxMidi + 3);
        
        // Recalculate row height based on new note range
        this._onResize();
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
                                isLeft, isBlackKey(note.midi), isActive, proximity, note.noteName);
        }
    }

    _drawNoteBlock(ctx, x, y, w, h, isLeft, isBlack, isActive, proximity, noteName) {
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

        // Draw key labels inside the bar
        this._drawKeyLabel(ctx, x, y, w, h, noteName);
    }

    _getKeyboardShortcut(noteName) {
        if (!this.mappingEngine) return null;
        
        const layoutManager = this.mappingEngine.getLayoutManager();
        if (!layoutManager) return null;
        if (!layoutManager) return null;
        
        let layout = layoutManager.getActiveLayout();
        
        // If active layout is piano layout, get its delegate (keyboard layout)
        if (layout && layout.delegate) {
            layout = layout.delegate;
        }
        
        if (!layout || !layout.whiteKeys || !layout.blackKeys) return null;
        
        const defaultOctave = 4;
        const allKeys = [...layout.whiteKeys, ...layout.blackKeys];
        
        for (const keyCode of allKeys) {
            const noteInfo = layout.map(keyCode, defaultOctave, {});
            if (noteInfo && noteInfo.fullName === noteName) {
                return keyCode;
            }
        }
        
        return null;
    }

    _drawKeyLabel(ctx, x, y, w, h, noteName) {
        // Show labels if bar is wide enough (width >= 20px)
        if (!noteName || w < 20) return;
        
        const shortcut = this._getKeyboardShortcut(noteName);
        
        // Clip text to stay within bar bounds
        ctx.save();
        ctx.beginPath();
        ctx.rect(x, y, w, h);
        ctx.clip();
        
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.font = 'bold 9px sans-serif';
        
        if (w >= 30 && shortcut) {
            // Bar is wide enough: show shortcut to the left, note name centered
            const displayKey = this._getDisplayKey(shortcut);
            // Draw shortcut on the left side (at 25% from left)
            ctx.fillText(displayKey, x + w * 0.25, y + h / 2);
            // Draw note name centered
            ctx.fillText(noteName, x + w / 2, y + h / 2);
        } else {
            // Bar too narrow: show note name centered only
            ctx.fillText(noteName, x + w / 2, y + h / 2);
        }
        
        ctx.restore();
    }

    _getDisplayKey(keyCode) {
        // Convert key code to display-friendly format
        if (keyCode.startsWith('Key')) return keyCode.slice(3);
        if (keyCode.startsWith('Digit')) return keyCode.slice(5);
        return keyCode;
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

        // Draw horizontal lines for each note in dynamic range
        for (let midi = this.minMidi; midi <= this.maxMidi; midi++) {
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
        // Use dynamic note range (minMidi to maxMidi) for Y position calculation
        const noteRange = this.maxMidi - this.minMidi;
        // Guard against division by zero when note range is zero
        if (noteRange <= 0) return h / 2;
        const fraction = 1 - (midi - this.minMidi) / noteRange;
        return fraction * h;
    }

    /**
     * Show vertical column glow at hit line when a key is pressed
     * @param {string} fullName - Note name like "C4", "C#4"
     */
    highlightColumn(fullName, hand = null) {
        if (!this.element) return;
        
        // Parse note to determine hand/color
        // If hand is not provided, use MIDI position: notes >= 60 (middle C) = right hand
        const midi = noteNameToMidi(fullName);
        const isLeft = hand === 'left' || (hand !== 'right' && midi !== null && midi < 60);
        const hue = isLeft ? 185 : 270;
        
        // Check if we already have an overlay for this note
        let overlay = this.columnOverlays.get(fullName);
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.style.cssText = `
                position:absolute; left:${this.HIT_X - 1}px; top:0; bottom:0; width:4px;
                background:linear-gradient(to bottom, 
                    hsla(${hue},100%,60%,0) 0%,
                    hsla(${hue},100%,60%,0.5) 20%,
                    hsla(${hue},100%,60%,0.5) 80%,
                    hsla(${hue},100%,60%,0) 100%);
                z-index:9; pointer-events:none;
                box-shadow:0 0 12px hsla(${hue},100%,60%,0.6);
                transition:opacity 0.08s ease-out;
            `;
            this.element.appendChild(overlay);
            this.columnOverlays.set(fullName, overlay);
        }
        
        overlay.style.opacity = '1';
        // Reset the clearing flag since we're showing the overlay
        overlay._isClearing = false;
    }

    /**
     * Hide vertical column glow when key is released
     * @param {string} fullName - Note name like "C4", "C#4"
     */
    clearColumn(fullName) {
        const overlay = this.columnOverlays.get(fullName);
        if (overlay) {
            overlay.style.opacity = '0';
            // Mark as clearing so timeout won't incorrectly remove if re-highlighted
            overlay._isClearing = true;
            // Remove overlay after fade out to prevent DOM bloat
            setTimeout(() => {
                if (overlay._isClearing && overlay.parentNode) {
                    overlay.remove();
                    this.columnOverlays.delete(fullName);
                }
            }, 500);
        }
    }

    destroy() {
        if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
        if (this._resizeObserver) this._resizeObserver.disconnect();
        if (this._resizeTimer) clearTimeout(this._resizeTimer);
        // Clean up column overlays
        this.columnOverlays.forEach(overlay => overlay.remove());
        this.columnOverlays.clear();
        // Clean up playNowLine
        this.playNowLine?.remove();
        this.element?.remove();
    }
}
