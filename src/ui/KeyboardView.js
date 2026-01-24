import { NOTES } from '../utils/noteUtils.js';

export class UI {
    constructor(stateManager, mappingEngine) {
        this.stateManager = stateManager;
        this.mappingEngine = mappingEngine;
        this.container = document.getElementById('keyboard-container');
        this.statusBar = document.getElementById('status-bar');
        this.keys = new Map();

        this.init();
    }

    init() {
        console.log('UI initialized');
        this.renderControls();

        // Subscribe to updates
        this.stateManager.subscribe(state => {
            this.updateControls(state);
            // If layout changes, re-render keyboard
            // We need to know if layout changed.
            // Ideally StateManager provides prev state or diff.
            // For now, we'll just check against a stored value or re-render if needed.
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

        // Visual Shift Indicator logic
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
            sustain: document.getElementById('sustain-indicator')
        };

        if (els.octave) els.octave.innerText = state.octave;
        if (els.instrument) els.instrument.value = state.instrument;
        if (els.mode) els.mode.value = state.mode;
        if (els.layout) els.layout.value = state.layout;
        if (els.labelMode) els.labelMode.value = state.labelMode;
        if (els.sustain) els.sustain.innerText = state.sustain ? 'Sustain: On' : 'Sustain: Off';

        // State updates often imply label updates (e.g. Octave change, Label Mode change)
        this.updateLabels();
    }

    updateLabels() {
        const state = this.stateManager.getState();
        const layoutManager = this.mappingEngine.getLayoutManager();
        // Use keyboard layout as the reference for PC keys (since PianoLayout delegates anyway)
        const refLayout = layoutManager.layouts.get('keyboard');

        // Current Rendered Mode
        const isPianoView = this.currentLayoutName === 'piano';

        // Current Modifiers/Octave
        const modifiers = { shiftKey: this.isShiftActive || false };
        const octave = state.octave || 4;

        if (isPianoView) {
            // PIANO VIEW LABEL LOGIC
            // Clear all special labels first (keep basic note labels if we want?)
            this.keys.forEach((el, noteFullName) => {
                // If labelMode is 'note' or 'both', show note label?
                // The basic note label is usually static (C4).
                // Let's assume we overwrite innerText or specific label container.

                let content = '';
                // 1. Note Label
                if (state.labelMode === 'note' || state.labelMode === 'both') {
                    content += `<div class="note-name">${noteFullName}</div>`;
                }

                // 2. PC Key Label (Reverse Lookup)
                if (state.labelMode === 'pc' || state.labelMode === 'both') {
                    // Check if any PC key maps to this noteFullName given current octave/shift
                    const pcKeys = [...refLayout.whiteKeys, ...refLayout.blackKeys];
                    let mappedKey = null;

                    for (const code of pcKeys) {
                        const m = refLayout.map(code, octave, modifiers);
                        if (m && m.fullName === noteFullName) {
                            mappedKey = this.getKeyLabel(code);
                            break; // Stop at first match
                        }
                    }

                    if (mappedKey) {
                        content += `<div class="pc-key">${mappedKey}</div>`;
                    }
                }
                el.innerHTML = content;
            });

        } else {
            // KEYBOARD VIEW LABEL LOGIC
            this.keys.forEach((el, code) => {
                const mapping = refLayout.map(code, octave, modifiers);

                let top = '';
                let bottom = '';

                // Top: PC Key
                if (state.labelMode === 'pc' || state.labelMode === 'both') {
                    top = this.getKeyLabel(code);
                }

                // Bottom: Note
                if (state.labelMode === 'note' || state.labelMode === 'both') {
                    if (mapping) bottom = mapping.note + mapping.octave; // e.g. C#4
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

        // Listeners
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
                <div class="control-group">
                    <label>Room:</label>
                    <input id="room-slider" type="range" min="0" max="1" step="0.01" value="0.2" />
                </div>
                <div class="control-group">
                    <label>Brightness:</label>
                    <input id="brightness-slider" type="range" min="0" max="1" step="0.01" value="0.5" />
                </div>
                <div class="control-group">
                    <label>Layout:</label>
                    <select id="layout-select">
                        <option value="piano">Piano View</option>
                        <option value="keyboard">Keyboard View</option>
                    </select>
                </div>
                <div class="control-group">
                    <label>Mode:</label>
                    <select id="mode-select">
                        <option value="free_play">Free Play</option>
                        <option value="learn">Learn (C Major)</option>
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
                    <label>Instrument:</label>
                    <select id="instrument-select">
                        <option value="piano">Piano</option>
                        <option value="piano-bright">Piano (Bright)</option>
                        <option value="piano-soft">Piano (Soft)</option>
                        <option value="electric-piano">Electric Piano</option>
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

        document.getElementById('mode-select').addEventListener('change', (e) => {
            this.stateManager.setState({ mode: e.target.value });
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
        document.getElementById('room-slider').addEventListener('input', (e) => {
            const v = parseFloat(e.target.value);
            window.app.audio.setRoom(v);
        });
        document.getElementById('brightness-slider').addEventListener('input', (e) => {
            const v = parseFloat(e.target.value);
            window.app.audio.setBrightness(v);
        });

        document.getElementById('octave-down').addEventListener('click', () => {
            const current = this.stateManager.getState().octave;
            if (current > 1) this.stateManager.setState({ octave: current - 1 });
        });

        document.getElementById('octave-up').addEventListener('click', () => {
            const current = this.stateManager.getState().octave;
            if (current < 7) this.stateManager.setState({ octave: current + 1 });
        });
    }

    renderKeyboard(layoutName) {
        this.currentLayoutName = layoutName;
        this.container.innerHTML = '';
        this.keys.clear();

        if (layoutName === 'keyboard') {
            this.renderComputerKeyboard();
        } else {
            this.renderPianoKeyboard();
        }
        // Initial label update
        this.updateLabels();
    }

    renderPianoKeyboard() {
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

        // Retrieve Visual Model
        const layoutManager = this.mappingEngine.getLayoutManager();
        const layout = layoutManager.layouts.get('keyboard');
        const model = layout.getVisualModel();

        model.rows.forEach(row => {
            const rowDiv = document.createElement('div');
            rowDiv.className = 'keyboard-row';

            row.forEach(keyCode => {
                // Determine styling based on layout definitions
                const isBlack = layout.blackKeys.includes(keyCode);

                const keyDiv = document.createElement('div');
                keyDiv.className = `key-cap ${isBlack ? 'black-cap' : 'white-cap'}`;

                // Determine Label (Note Name)
                // We use a base octave of 4 just to get the Note Name (C, C#, etc)
                const mapping = layout.map(keyCode, 4);
                keyDiv.innerText = mapping ? mapping.note : this.getKeyLabel(keyCode);

                keyDiv.dataset.code = keyCode;

                this.keys.set(keyCode, keyDiv);

                const down = (e) => {
                    e.preventDefault();
                    const octave = this.stateManager.getState().octave || 4;
                    // Pass current modifiers from the DOM event if available, or rely on InputEngine?
                    // The UI click event doesn't carry keyboard modifiers usually unless we check e.shiftKey
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
        return code;
    }

    setNoteState(noteOrCode, isActive) {
        // If in Piano mode, we look up by Note Name (C4)
        // If in Keyboard mode, we look up by Key Code? 
        // Actually, App passes us "fullName" (C4) usually.
        // But MappingEngine knows the Key Code too. 

        // Problem: If I press 'Z', I get 'C4'. 
        // In Piano View, I want C4 to light up.
        // In Keyboard View, I want 'Z' to light up.

        // We need the mapping info here.
        // Let's rely on the fact that we might receive both or we lookup.

        // Current implementation in App.js:
        // ui.setNoteState(processedEvent.fullName, isActive);

        if (this.currentLayoutName === 'piano') {
            const key = this.keys.get(noteOrCode);
            if (key) {
                if (isActive) key.classList.add('active');
                else key.classList.remove('active');
            }
        } else {
            // Reverse lookup needed? Or pass KeyCode from App?
            // App.js should pass the original event code too if possible.
            // Let's modify App.js to pass the whole event object.
        }
    }

    // Updated method signature to accept event
    handleNoteEvent(event) {
        const isActive = event.type === 'noteOn';

        if (this.currentLayoutName === 'piano') {
            const key = this.keys.get(event.fullName); // e.g. C4
            if (key) {
                if (isActive) key.classList.add('active');
                else key.classList.remove('active');
            }
        } else {
            // Keyboard View: Use originalKey code
            if (event.originalKey) {
                const key = this.keys.get(event.originalKey);
                if (key) {
                    if (isActive) key.classList.add('active');
                    else key.classList.remove('active');
                }
            }
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
}
