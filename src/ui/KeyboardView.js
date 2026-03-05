import { NOTES } from '../utils/noteUtils.js';
import { SongSelectView } from './SongSelectView.js';
import { SongBrowserView } from './SongBrowserView.js';
import { KeyStreamView } from './KeyStreamView.js';

export class UI {
    constructor(stateManager, mappingEngine, songService, midiService, libraryService) {
        this.stateManager = stateManager;
        this.mappingEngine = mappingEngine;
        this.songService = songService;
        this.midiService = midiService;
        this.libraryService = libraryService;
        this.container = document.getElementById('keyboard-container');
        this.statusBar = document.getElementById('status-bar');
        this.keys = new Map();
        this.mainStream = null; // Unified Stream

        this.init();
    }

    init() {
        console.log('UI initialized');

        this.renderControls();

        // Subscribe to updates
        this.stateManager.subscribe(state => {
            this.updateControls(state);
            if (this.currentLayoutName !== state.layout) {
                this.renderKeyboard(state.layout);
            }
        });

        // Initial render
        const initialState = this.stateManager.getState();
        this.renderKeyboard(initialState.layout || 'piano');

        // Update load status when samples are ready
        window.addEventListener('samples-loaded', () => {
            const el = document.getElementById('load-status');
            if (el) el.innerText = 'Ready';
        });

        // Shift Indicator
        const toggleShift = (isActive) => {
            const el = document.getElementById('shift-indicator');
            if (el) {
                el.innerText = isActive ? 'Shift: ON' : 'Shift: Off';
                el.style.opacity = isActive ? '1' : '0.3';
                el.style.fontWeight = isActive ? 'bold' : 'normal';
                el.style.color = isActive ? '#0ff' : 'inherit';
            }
        };
        window.addEventListener('keydown', e => { if (e.key === 'Shift') toggleShift(true); });
        window.addEventListener('keyup', e => { if (e.key === 'Shift') toggleShift(false); });
    }

    updateControls(state) {
        const els = {
            octave: document.getElementById('octave-display'),
            instrument: document.getElementById('instrument-select'),
            mode: document.getElementById('mode-select'),
            layout: document.getElementById('layout-select'),
            labelMode: document.getElementById('label-select'),
            sustain: document.getElementById('sustain-indicator'),
            waitMode: document.getElementById('wait-mode-toggle'),
            speed: document.getElementById('speed-slider'),
            speedVal: document.getElementById('speed-value'),
            difficulty: document.getElementById('difficulty-select'),
            handAssist: document.getElementById('hand-assist-select')
        };

        if (els.waitMode) els.waitMode.checked = state.waitMode;
        if (els.octave) els.octave.innerText = state.octave;
        if (els.instrument) els.instrument.value = state.instrument;
        if (els.mode) els.mode.value = state.mode;
        if (els.layout) els.layout.value = state.layout;
        if (els.labelMode) els.labelMode.value = state.labelMode;
        if (els.sustain) els.sustain.innerText = state.sustain ? 'Sustain: On' : 'Sustain: Off';

        if (els.speed) {
            els.speed.value = state.speed;
            els.speedVal.innerText = `${Math.round(state.speed * 100)}%`;
        }
        if (els.difficulty) els.difficulty.value = state.difficulty;
        if (els.handAssist && state.handAssist) els.handAssist.value = state.handAssist;

        this.updateLabels();
    }

    updateLabels() {
        const state = this.stateManager.getState();
        const layoutManager = this.mappingEngine.getLayoutManager();
        const refLayout = layoutManager.layouts.get('keyboard');
        const isPianoView = this.currentLayoutName === 'piano';
        const modifiers = { shiftKey: this.isShiftActive || false };
        const octave = state.octave || 4;

        if (isPianoView) {
            this.keys.forEach((el, noteFullName) => {
                let content = '';
                if (state.labelMode === 'note' || state.labelMode === 'both') {
                    content += `<div class="note-name">${noteFullName}</div>`;
                }
                if (state.labelMode === 'pc' || state.labelMode === 'both') {
                    const pcKeys = [...refLayout.whiteKeys, ...refLayout.blackKeys];
                    let mappedKey = null;
                    for (const code of pcKeys) {
                        const m = refLayout.map(code, octave, modifiers);
                        if (m && m.fullName === noteFullName) {
                            mappedKey = this.getKeyLabel(code);
                            break;
                        }
                    }
                    if (mappedKey) {
                        content += `<div class="pc-key">${mappedKey}</div>`;
                    }
                }
                el.innerHTML = content;
            });

        } else {
            this.keys.forEach((el, code) => {
                const mapping = refLayout.map(code, octave, modifiers);
                let top = '';
                let bottom = '';
                if (state.labelMode === 'pc' || state.labelMode === 'both') {
                    top = this.getKeyLabel(code);
                }
                if (state.labelMode === 'note' || state.labelMode === 'both') {
                    if (mapping) bottom = mapping.note + mapping.octave;
                }
                el.innerHTML = `
                    <div style="font-size: 0.7em; opacity: 0.8">${top}</div>
                    <div style="font-weight: bold">${bottom}</div>
                `;
            });
        }
    }

    renderControls() {
        if (!this.statusBar) return;

        // Shift Listener
        const toggleShift = (isActive) => {
            this.isShiftActive = isActive;
            const el = document.getElementById('shift-indicator');
            if (el) {
                el.innerText = isActive ? 'Shift: ON' : 'Shift: Off';
                el.style.opacity = isActive ? '1' : '0.3';
                el.style.fontWeight = isActive ? 'bold' : 'normal';
                el.style.color = isActive ? '#0ff' : 'inherit';
            }
            this.updateLabels();
        };
        window.addEventListener('keydown', e => { if (e.key === 'Shift' && !this.isShiftActive) toggleShift(true); });
        window.addEventListener('keyup', e => { if (e.key === 'Shift') toggleShift(false); });

        this.statusBar.innerHTML = `
            <div id="loading-status" style="display:none">Loading...</div>
            <div id="sustain-indicator">Sustain: Off</div>
            <div id="shift-indicator" style="opacity: 0.3">Shift: Off</div>
            <div class="controls">
                <!-- SPEED -->
                <div class="control-group">
                    <label>Speed:</label>
                    <input id="speed-slider" type="range" min="0.25" max="2.0" step="0.05" value="1.0" />
                    <span id="speed-value" style="width: 40px; text-align:right">100%</span>
                </div>
                 <!-- DIFFICULTY -->
                <div class="control-group">
                    <label>Difficulty:</label>
                    <select id="difficulty-select">
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard" selected>Hard</option>
                    </select>
                </div>

                <div class="control-group">
                    <label>Layout:</label>
                    <select id="layout-select">
                        <option value="piano">Piano View</option>
                        <option value="keyboard">Keyboard View</option>
                    </select>
                </div>
                <div class="control-group">
                     <label>Labels:</label>
                    <select id="label-select">
                        <option value="both">Both</option>
                        <option value="pc">PC Keys</option>
                        <option value="note">Notes</option>
                    </select>
                </div>
                <div class="control-group">
                    <label>Mode:</label>
                    <select id="playback-mode-select">
                        <option value="practice">Practice (Wait)</option>
                        <option value="listen">Listen (Auto)</option>
                    </select>
                </div>
                <!-- REMOVED OLD WAIT TOGGLE -->
                
                <div class="control-group">
                    <label>Assist:</label>
                    <select id="hand-assist-select">
                        <option value="none">Both Hands</option>
                        <option value="left">Assist Left &#9995;</option>
                        <option value="right">Assist Right &#x1F91A;</option>
                    </select>
                </div>
                
                <div class="control-group">
                    <button id="btn-play-pause" style="width: 40px; font-size: 1.2em;">▶</button>
                </div>
                <div class="control-group">
                    <button id="btn-learn-song" style="color: var(--accent-primary); border-color: var(--accent-primary);">♫ Learn Song</button>
                </div>
                 <div class="control-group">
                    <label>Inst:</label>
                    <select id="instrument-select">
                        <option value="piano">Piano</option>
                        <option value="piano-bright">Piano (Bright)</option>
                        <option value="piano-soft">Piano (Soft)</option>
                        <option value="grand-piano">Grand Piano</option>
                        <option value="electric-piano">E. Piano</option>
                        <option value="organ">Organ</option>
                        <option value="strings">Strings</option>
                        <option value="pad">Pad</option>
                        <option value="bass">Bass</option>
                        <option value="pluck">Pluck</option>
                    </select>
                </div>
                <div class="control-group">
                    <label>Octave:</label>
                    <span id="octave-display">4</span>
                    <button id="octave-down">-</button>
                    <button id="octave-up">+</button>
                </div>
            </div>
        `;

        // Bind events
        document.getElementById('layout-select').addEventListener('change', (e) => {
            this.stateManager.setState({ layout: e.target.value });
            e.target.blur();
        });
        document.getElementById('label-select').addEventListener('change', (e) => {
            this.stateManager.setState({ labelMode: e.target.value });
            e.target.blur();
        });
        document.getElementById('instrument-select').addEventListener('change', (e) => {
            this.stateManager.setState({ instrument: e.target.value });
            e.target.blur();
        });
        document.getElementById('octave-down').addEventListener('click', () => {
            const current = this.stateManager.getState().octave;
            if (current > 1) this.stateManager.setState({ octave: current - 1 });
        });
        document.getElementById('octave-up').addEventListener('click', () => {
            const current = this.stateManager.getState().octave;
            if (current < 7) this.stateManager.setState({ octave: current + 1 });
        });

        // New Controls
        document.getElementById('speed-slider').addEventListener('input', (e) => {
            const s = parseFloat(e.target.value);
            document.getElementById('speed-value').innerText = `${Math.round(s * 100)}%`;
            this.stateManager.setState({ speed: s });
        });
        document.getElementById('difficulty-select').addEventListener('change', (e) => {
            this.stateManager.setState({ difficulty: e.target.value });
            e.target.blur();
        });

        // Hand Assist
        const assistSelect = document.getElementById("hand-assist-select");
        if (assistSelect) {
            assistSelect.value = this.stateManager.getState().handAssist || "none";
            assistSelect.addEventListener("change", (e) => {
                const val = e.target.value;
                this.stateManager.setState({ handAssist: val });
                if (window.app && window.app.sequencer) window.app.sequencer.setHandAssist(val);
                e.target.blur();
            });
        }

        // Play Pause
        const btnPlay = document.getElementById('btn-play-pause');
        if (btnPlay) {
            btnPlay.addEventListener('click', () => {
                const seq = window.app.sequencer;
                if (!seq) return;

                if (seq.isPlaying) {
                    seq.pause();
                    btnPlay.innerText = '▶';
                } else {
                    seq.play();
                    btnPlay.innerText = '⏸';
                }
            });
        }

        // Playback Mode (Practice vs Listen)
        const modeSelect = document.getElementById('playback-mode-select');
        if (modeSelect) {
            // Set initial value based on state
            const s = this.stateManager.getState();
            if (s.autoPlay) modeSelect.value = 'listen';
            else modeSelect.value = 'practice';

            modeSelect.addEventListener('change', (e) => {
                const mode = e.target.value;
                if (mode === 'listen') {
                    this.stateManager.setState({ waitMode: false, autoPlay: true });
                    window.app.sequencer.setWaitMode(false);
                    window.app.sequencer.setAutoPlay(true);
                } else {
                    this.stateManager.setState({ waitMode: true, autoPlay: false });
                    window.app.sequencer.setWaitMode(true);
                    window.app.sequencer.setAutoPlay(false);
                }
                e.target.blur();
            });
        }

        /*
        // Wait Mode (Removed in favor of Mode Select)
        document.getElementById('wait-mode-toggle').addEventListener('change', (e) => {
             this.stateManager.setState({ waitMode: e.target.checked });
            window.app.sequencer.setWaitMode(e.target.checked);
        });
        */

        // Song Select
        const btnLearn = document.getElementById('btn-learn-song');
        if (btnLearn) {
            btnLearn.addEventListener('click', () => {
                const view = new SongBrowserView(
                    document.body,
                    this.songService,
                    this.libraryService,
                    this.midiService,
                    (song) => {
                        console.log('Selected song:', song);
                        this.clearTargetHighlights();
                        this.hideGuidedIndicator();
                        this.hideProgressBar();
                        if (window.app.mainStream) window.app.mainStream.clearHighlights();

                        // Switch to guided mode for practice
                        window.app.mode.switchMode('guided');
                        window.app.sequencer.loadSong(song);
                        if (window.app.mainStream) window.app.mainStream.setSong(song);

                        // Enable wait mode by default for guided mode
                        this.stateManager.setState({ waitMode: true, autoPlay: false });
                        window.app.sequencer.setWaitMode(true);
                        window.app.sequencer.setAutoPlay(false);

                        // Setup Note Required Hook with new on-key guidance
                        // ONLY for non-guided modes (GuidedMode handles its own callback)
                        if (window.app.mode.name !== 'guided') {
                            window.app.sequencer.onNoteRequired = (noteNames) => {
                                this.clearTargetHighlights();

                                // Ensure noteNames is an array
                                const notes = Array.isArray(noteNames) ? noteNames : [noteNames];

                                // Show on-key guidance
                                this.highlightNextNote(notes);

                                // Show guided indicator
                                if (notes.length > 1) {
                                    this.showGuidedIndicator('Play these notes together');
                                } else {
                                    this.showGuidedIndicator('Play the highlighted note');
                                }

                                // Update progress bar
                                if (window.app.sequencer.totalEvents) {
                                    const current = window.app.sequencer.cursor || 0;
                                    this.updateProgressBar(current, window.app.sequencer.totalEvents);
                                }
                            };
                        } else {
                            console.log('[KeyboardView] Skipping onNoteRequired setup - GuidedMode will handle it');
                        }

                        // Show initial progress bar
                        const totalNotes = song.tracks.reduce((sum, t) => sum + t.notes.length, 0);
                        this.showProgressBar(0, totalNotes, song.title);

                        window.app.sequencer.play();
                    });
                view.render();
            });
        }
    }

    clearTargetHighlights() {
        this.keys.forEach(el => el.classList.remove('target-note', 'next-note', 'chord-note', 'correct-note', 'wrong-note'));
    }

    // --- On-Key Guidance Methods ---
    highlightNextNote(noteNames) {
        console.log('[UI] 🎹 highlightNextNote called with:', noteNames);

        // Clear all highlights first
        this.clearTargetHighlights();

        // Highlight the target notes
        if (!Array.isArray(noteNames)) {
            noteNames = [noteNames];
        }

        console.log('[UI] 🎯 Highlighting notes:', noteNames);

        noteNames.forEach(noteName => {
            const el = this.keys.get(noteName);
            if (el) {
                el.classList.add(noteNames.length > 1 ? 'chord-note' : 'next-note');
                console.log('[UI] ✅ Highlighted key:', noteName);
            } else {
                console.warn('[UI] ⚠️ Key not found for note:', noteName);
            }
        });
    }

    clearHighlights() {
        this.keys.forEach(el => {
            el.classList.remove('next-note', 'chord-note', 'correct-note', 'wrong-note');
        });
    }

    showCorrectNote(noteName) {
        const el = this.keys.get(noteName);
        if (el) {
            el.classList.add('correct-note');
            setTimeout(() => el.classList.remove('correct-note'), 300);
        }
    }

    showWrongNote(noteName) {
        const el = this.keys.get(noteName);
        if (el) {
            el.classList.add('wrong-note');
            setTimeout(() => el.classList.remove('wrong-note'), 300);
        }
    }

    showGuidedIndicator(message) {
        // Remove existing indicator
        const existing = document.querySelector('.guided-indicator');
        if (existing) existing.remove();

        const indicator = document.createElement('div');
        indicator.className = 'guided-indicator';
        indicator.innerHTML = `<span class="dot"></span>${message || 'Play the highlighted note'}`;
        document.body.appendChild(indicator);

        return indicator;
    }

    hideGuidedIndicator() {
        const existing = document.querySelector('.guided-indicator');
        if (existing) existing.remove();
    }

    showProgressBar(currentNote, totalNotes, songTitle) {
        // Remove existing progress bar
        const existing = document.querySelector('.song-progress-container');
        if (existing) existing.remove();

        const progress = document.createElement('div');
        progress.className = 'song-progress-container';
        progress.innerHTML = `
            <div class="song-progress-bar">
                <div class="song-progress-fill" style="width: ${(currentNote / totalNotes) * 100}%"></div>
            </div>
            <div class="song-progress-info">
                <span>${songTitle}</span>
                <span>${currentNote}/${totalNotes} notes</span>
            </div>
        `;
        document.body.appendChild(progress);

        return progress;
    }

    updateProgressBar(currentNote, totalNotes) {
        const fill = document.querySelector('.song-progress-fill');
        const info = document.querySelector('.song-progress-info span:last-child');
        if (fill) {
            fill.style.width = `${(currentNote / totalNotes) * 100}%`;
        }
        if (info) {
            info.textContent = `${currentNote}/${totalNotes} notes`;
        }
    }

    hideProgressBar() {
        const existing = document.querySelector('.song-progress-container');
        if (existing) existing.remove();
    }


    async renderKeyboard(layoutName) {
        this.currentLayoutName = layoutName;
        this.container.innerHTML = '';
        this.keys.clear();

        if (layoutName === 'keyboard') {
            this.renderComputerKeyboard();
        } else {
            await this.renderPianoKeyboard();
        }

        // Initialize Unified Key Stream Display
        let streamParent = document.getElementById('streams-wrapper');
        if (!streamParent) {
            streamParent = document.createElement('div');
            streamParent.id = 'streams-wrapper';
            this.statusBar.after(streamParent);
        } else {
            streamParent.innerHTML = '';
        }

        this.mainStream = new KeyStreamView(streamParent, this.mappingEngine);
        window.app.mainStream = this.mainStream;

        this.updateLabels();
    }

    renderPianoKeyboard() {
        return new Promise((resolve) => {
            const keyboard = document.createElement('div');
            keyboard.className = 'keyboard piano-layout';

            const startOctave = 3;
            const endOctave = 7;
            import('../utils/noteUtils.js').then(({ NOTES }) => {
                for (let oct = startOctave; oct < endOctave; oct++) {
                    NOTES.forEach((note) => {
                        this.createPianoKey(note, oct, keyboard);
                    });
                }
                this.createPianoKey('C', endOctave, keyboard);
                this.container.appendChild(keyboard);
                resolve();
            });
        });
    }

    createPianoKey(note, octave, parent) {
        const isBlack = note.includes('#');
        const key = document.createElement('div');
        key.className = `key ${isBlack ? 'black' : 'white'}`;
        key.dataset.note = `${note}${octave}`;

        if (!isBlack) {
            key.innerHTML = `<span class="note-label">${note}${octave}</span>`;
        }

        const fullName = `${note}${octave}`;
        const down = (e) => {
            e.preventDefault();
            this.dispatchNote('noteOn', { fullName, originalKey: null });
        };
        const up = (e) => {
            e.preventDefault();
            this.dispatchNote('noteOff', { fullName, originalKey: null });
        };
        key.addEventListener('mousedown', down);
        key.addEventListener('mouseup', up);
        key.addEventListener('mouseleave', up);
        key.addEventListener('touchstart', down, { passive: false });
        key.addEventListener('touchend', up, { passive: false });

        this.keys.set(`${note}${octave}`, key);
        parent.appendChild(key);
    }

    renderComputerKeyboard() {
        const keyboard = document.createElement('div');
        keyboard.className = 'keyboard computer-layout';
        const layoutManager = this.mappingEngine.getLayoutManager();
        const layout = layoutManager.layouts.get('keyboard');
        const model = layout.getVisualModel();

        model.rows.forEach(row => {
            const rowDiv = document.createElement('div');
            rowDiv.className = 'keyboard-row';

            row.forEach(keyCode => {
                const isBlack = layout.blackKeys.includes(keyCode);
                const keyDiv = document.createElement('div');
                keyDiv.className = `key-cap ${isBlack ? 'black-cap' : 'white-cap'}`;
                const mapping = layout.map(keyCode, 4);
                keyDiv.innerText = mapping ? mapping.note : this.getKeyLabel(keyCode);
                keyDiv.dataset.code = keyCode;
                this.keys.set(keyCode, keyDiv);

                // Event Listeners (omitted for brevity, same as before)
                const down = (e) => {
                    e.preventDefault();
                    const octave = this.stateManager.getState().octave || 4;
                    const modifiers = { shiftKey: e.shiftKey };
                    const info = layoutManager.getNoteFromKey(keyCode, octave, modifiers);
                    if (!info) return;
                    this.dispatchNote('noteOn', { fullName: info.fullName, originalKey: keyCode });
                };
                const up = (e) => {
                    e.preventDefault();
                    const octave = this.stateManager.getState().octave || 4;
                    const modifiers = { shiftKey: e.shiftKey };
                    const info = layoutManager.getNoteFromKey(keyCode, octave, modifiers);
                    if (!info) return;
                    this.dispatchNote('noteOff', { fullName: info.fullName, originalKey: keyCode });
                };
                keyDiv.addEventListener('mousedown', down);
                keyDiv.addEventListener('mouseup', up);
                keyDiv.addEventListener('mouseleave', up);
                keyDiv.addEventListener('touchstart', down, { passive: false });
                keyDiv.addEventListener('touchend', up, { passive: false });

                rowDiv.appendChild(keyDiv);
            });
            keyboard.appendChild(rowDiv);
        });
        this.container.appendChild(keyboard);
    }

    getKeyLabel(code) {
        if (code.startsWith('Key')) return code.replace('Key', '');
        if (code.startsWith('Digit')) return code.replace('Digit', '');

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
        return symbolMap[code] || code;
    }

    handleNoteEvent(event) {
        const isActive = event.type === 'noteOn';

        if (this.currentLayoutName === 'piano') {
            const key = this.keys.get(event.fullName);
            if (key) {
                if (isActive) key.classList.add('active');
                else key.classList.remove('active');
            }
        } else {
            // Keyboard View
            if (event.originalKey) {
                const key = this.keys.get(event.originalKey);
                if (key) {
                    if (isActive) {
                        key.classList.add('active');
                        key.classList.remove('target-note');
                    } else {
                        key.classList.remove('active');
                    }
                }
            }
        }
        // Always check piano keys too
        const pianoKey = this.keys.get(event.fullName);
        if (pianoKey && isActive) {
            pianoKey.classList.remove('target-note');
        }
    }

    dispatchNote(type, { fullName, originalKey }) {
        const noteEvent = {
            type,
            fullName,
            originalKey,
            inputTime: performance.now()
        };
        const processed = window.app.mode.processNote(noteEvent);
        if (processed) {
            window.app.audio.handleNote(processed);
            this.handleNoteEvent(processed);
        }
    }

    // DEBUG: Test function - call window.app.ui.testGuidedModeAdvance() from console
    testGuidedModeAdvance() {
        console.log('[DEBUG] Testing GuidedMode advance...');
        const mode = window.app.mode;
        console.log('[DEBUG] Current mode:', mode.currentMode?.name);

        if (mode.currentMode?.name === 'guided') {
            console.log('[DEBUG] Manually calling sequencer.advance()...');
            window.app.sequencer.advance('C4');
        } else {
            console.log('[DEBUG] Not in guided mode, skipping advance test');
        }
    }

    // DEBUG: Test function - call window.app.ui.testGuidedModeHandleNote() from console
    testGuidedModeHandleNote(noteName = 'C4') {
        console.log('[DEBUG] Testing GuidedMode.handleNote with:', noteName);
        const mode = window.app.mode;
        console.log('[DEBUG] Current mode:', mode.currentMode?.name);

        if (mode.currentMode?.name === 'guided') {
            const noteEvent = {
                type: 'noteOn',
                fullName: noteName,
                inputTime: performance.now()
            };
            const result = mode.currentMode.handleNote(noteEvent);
            console.log('[DEBUG] handleNote result:', result);
        } else {
            console.log('[DEBUG] Not in guided mode, cannot test');
        }
    }
}
