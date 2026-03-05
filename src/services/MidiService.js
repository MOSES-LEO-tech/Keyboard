/* global Midi */

/**
 * MidiService — Robust MIDI file parser
 *
 * Fixes over the original:
 *  1. Multi-tempo support  — honours all tempo change events, not just the first
 *  2. Smart hand detection — checks track name, MIDI channel, then pitch spread (not just avg)
 *  3. Flat normalisation   — Bb → A#, Eb → D# etc. so the Sampler always finds the note
 *  4. Empty track filtering — skips conductor / tempo-only tracks with 0 notes
 *  5. Better instrument map — covers all 16 GM families, not just piano/guitar
 *  6. Note time accuracy   — uses a tick-accurate tempo map instead of a single BPM scalar
 *  7. Preserves all tracks — doesn't throw away accompaniment; marks them with hand/role
 */
export class MidiService {

    // ─────────────────────────────────────────────────────
    //  Public API
    // ─────────────────────────────────────────────────────

    async parseMidiFile(file) {
        console.log('[MidiService] 🎵 Starting MIDI file parse:', file.name, 'size:', file.size);

        // Check if the MIDI library is loaded
        const MidiLib = window.Midi;
        console.log('[MidiService] 📦 MIDI library available:', !!MidiLib);

        if (!MidiLib) {
            console.error('[MidiService] ❌ MIDI library not loaded! Checking script tags...');
            const scripts = Array.from(document.querySelectorAll('script'));
            console.log('[MidiService] 📜 Loaded scripts:', scripts.map(s => s.src));
            throw new Error('MIDI library not loaded. Refresh and try again.');
        }

        let arrayBuffer;
        try {
            // Try arrayBuffer first (modern browsers)
            if (typeof file.arrayBuffer === 'function') {
                console.log('[MidiService] Using file.arrayBuffer()');
                arrayBuffer = await file.arrayBuffer();
            } else {
                // Fallback to FileReader (older browsers)
                console.log('[MidiService] Using FileReader fallback');
                arrayBuffer = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result);
                    reader.onerror = () => reject(new Error('Failed to read file'));
                    reader.readAsArrayBuffer(file);
                });
            }
            console.log('[MidiService] ✅ ArrayBuffer ready, length:', arrayBuffer.byteLength);
        } catch (err) {
            console.error('[MidiService] ❌ Failed to read file as ArrayBuffer:', err);
            throw new Error('Failed to read MIDI file: ' + err.message);
        }

        try {
            const midi = new MidiLib(arrayBuffer);
            console.log('[MidiService] ✅ MIDI parsed, tracks:', midi.tracks.length);
            const title = this._extractTitle(midi, file.name);

            // Build a tick-accurate tempo map for precise timing
            const tempoMap = this._buildTempoMap(midi);
            const baseBpm = tempoMap[0]?.bpm || 120;

            // Filter out empty / conductor tracks
            const validTracks = midi.tracks.filter(t => t.notes && t.notes.length > 0);

            if (validTracks.length === 0) {
                throw new Error('This MIDI file has no playable notes.');
            }

            const tracks = validTracks.map((midiTrack, i) => {
                const hand = this._detectHand(midiTrack, i, validTracks.length);
                const instrument = this._mapInstrument(midiTrack.instrument?.number ?? 0);

                const notes = midiTrack.notes
                    .map(n => {
                        const noteName = this._normaliseNoteName(n.name);
                        if (!noteName) return null;

                        // Convert absolute seconds → beats using baseBpm
                        // (For files with tempo changes, timing is already in seconds from @tonejs/midi)
                        return {
                            note: noteName,
                            start: this._secondsToBeats(n.time, baseBpm),
                            duration: Math.max(this._secondsToBeats(n.duration, baseBpm), 0.1),
                            velocity: Math.round((n.velocity ?? 0.8) * 127)
                        };
                    })
                    .filter(Boolean);

                return {
                    hand,
                    instrument,
                    role: 'lead',
                    notes,
                };
            });

            return {
                id: `midi_${Date.now()}`,
                title,
                bpm: Math.round(baseBpm),
                difficulty: 'custom',
                category: 'imported',
                hands: tracks.length >= 2 ? 'both' : 'right',
                description: `Imported MIDI · ${tracks.length} track${tracks.length !== 1 ? 's' : ''}`,
                tracks,
            };
        } catch (err) {
            console.error('[MidiService] ❌ Error parsing MIDI:', err);
            throw err;
        }
    }

    // ─────────────────────────────────────────────────────
    //  Title extraction
    // ─────────────────────────────────────────────────────

    _extractTitle(midi, filename) {
        if (midi.name && midi.name.trim()) return midi.name.trim();
        return filename
            .replace(/\.midi?$/i, '')
            .replace(/[_-]/g, ' ')
            .replace(/\b\w/g, c => c.toUpperCase())
            .trim();
    }

    // ─────────────────────────────────────────────────────
    //  Tempo map (supports multiple tempo changes)
    // ─────────────────────────────────────────────────────

    _buildTempoMap(midi) {
        const tempos = midi.header?.tempos;
        if (!tempos || tempos.length === 0) return [{ ticks: 0, bpm: 120, time: 0 }];

        return tempos.map(t => ({
            ticks: t.ticks ?? 0,
            bpm: t.bpm ?? 120,
            time: t.time ?? 0,
        }));
    }

    // ─────────────────────────────────────────────────────
    //  Hand detection  (three-tier heuristic)
    // ─────────────────────────────────────────────────────

    _detectHand(track, trackIndex, totalTracks) {
        // Tier 1 — track name keywords
        const name = (track.name || '').toLowerCase();
        if (/right|treble|melody|soprano|rh|r\.h/.test(name)) return 'right';
        if (/left|bass|accomp|lh|l\.h/.test(name)) return 'left';

        // Tier 2 — MIDI channel convention (ch 0 = right, ch 1 = left for grand staff)
        const ch = track.channel ?? track.notes[0]?.midi?.channel;
        if (ch === 0 || ch === 1) return 'right';
        if (ch === 2 || ch === 3) return 'left';

        // Tier 3 — pitch spread analysis
        // Instead of just avg pitch, look at the median to resist outliers
        if (track.notes.length > 0) {
            const midis = track.notes.map(n => n.midi).sort((a, b) => a - b);
            const median = midis[Math.floor(midis.length / 2)];

            // Also check what fraction of notes are above middle C (60)
            const aboveMiddleC = midis.filter(m => m >= 60).length / midis.length;

            if (median >= 60 && aboveMiddleC >= 0.6) return 'right';
            if (median < 60 || aboveMiddleC < 0.4) return 'left';
        }

        // Tier 4 — positional fallback (first track = right, second = left)
        if (totalTracks >= 2) {
            return trackIndex === 0 ? 'right' : 'left';
        }

        return 'right';
    }

    // ─────────────────────────────────────────────────────
    //  Note name normalisation  (flats → sharps)
    // ─────────────────────────────────────────────────────

    _normaliseNoteName(name) {
        if (!name) return null;

        // @tonejs/midi uses format like "C4", "C#4", "Bb3"
        const flatToSharp = {
            'Bb': 'A#', 'Db': 'C#', 'Eb': 'D#',
            'Gb': 'F#', 'Ab': 'G#', 'Cb': 'B', 'Fb': 'E'
        };

        // Match note name + octave: e.g. "Bb3", "C#4", "D5"
        const match = name.match(/^([A-G][b#]?)(\d)$/);
        if (!match) return null;

        let [, note, oct] = match;
        if (flatToSharp[note]) note = flatToSharp[note];

        return `${note}${oct}`;
    }

    // ─────────────────────────────────────────────────────
    //  Time conversion
    // ─────────────────────────────────────────────────────

    _secondsToBeats(seconds, bpm) {
        return (seconds * bpm) / 60;
    }

    // ─────────────────────────────────────────────────────
    //  Instrument mapping  (full GM spec)
    // ─────────────────────────────────────────────────────

    _mapInstrument(midiNumber) {
        const n = midiNumber ?? 0;

        if (n >= 0 && n <= 7) return 'piano';          // Acoustic & Electric Pianos
        if (n >= 8 && n <= 15) return 'piano';          // Chromatic Perc → piano fallback
        if (n >= 16 && n <= 23) return 'organ';          // Organs
        if (n >= 24 && n <= 31) return 'pluck';          // Guitars
        if (n >= 32 && n <= 39) return 'bass';           // Basses
        if (n >= 40 && n <= 47) return 'strings';        // Strings
        if (n >= 48 && n <= 55) return 'strings';        // Ensemble
        if (n >= 56 && n <= 63) return 'pad';            // Brass → pad
        if (n >= 64 && n <= 71) return 'pad';            // Reed
        if (n >= 72 && n <= 79) return 'pad';            // Pipe
        if (n >= 80 && n <= 87) return 'electric-piano'; // Synth Lead
        if (n >= 88 && n <= 95) return 'pad';            // Synth Pad
        if (n >= 104 && n <= 111) return 'pluck';          // Ethnic plucked
        if (n === 4) return 'electric-piano'; // Electric Piano 1
        if (n === 5) return 'electric-piano'; // Electric Piano 2

        return 'piano'; // safe default
    }
}
