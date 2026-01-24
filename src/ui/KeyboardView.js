import { NOTES } from '../utils/noteUtils.js';

export class UI {
    constructor(stateManager) {
        this.stateManager = stateManager;
        this.container = document.getElementById('keyboard-container');
        this.statusBar = document.getElementById('status-bar');
        this.keys = new Map(); 
        
        // We need access to the current layout to know what to render
        // This is usually passed from App or via State. 
        // For now, we'll listen to state changes and assume App updates state.
        // But MappingEngine owns LayoutManager. 
        // We might need to ask MappingEngine or LayoutManager for the visual model.
        // Let's assume we can get it from window.app for now or passed in.
        
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
    }

    updateControls(state) {
        const els = {
            octave: document.getElementById('octave-display'),
            instrument: document.getElementById('instrument-select'),
            mode: document.getElementById('mode-select'),
            layout: document.getElementById('layout-select'),
            sustain: document.getElementById('sustain-indicator')
        };
        
        if (els.octave) els.octave.innerText = state.octave;
        if (els.instrument) els.instrument.value = state.instrument;
        if (els.mode) els.mode.value = state.mode;
        if (els.layout) els.layout.value = state.layout;
        if (els.sustain) els.sustain.innerText = state.sustain ? 'Sustain: On' : 'Sustain: Off';
    }

    renderControls() {
        if (!this.statusBar) return;
        
        this.statusBar.innerHTML = `
            <div id="load-status">Loading piano samples…</div>
            <div id="sustain-indicator">Sustain: Off</div>
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
        
        // Retrieve Visual Model from LayoutManager via App global (hacky but effective for now)
        // Ideally MappingEngine passes this.
        const layoutManager = window.app.mapping.getLayoutManager();
        const layout = layoutManager.layouts.get('keyboard');
        const model = layout.getVisualModel();

        model.rows.forEach(row => {
            const rowDiv = document.createElement('div');
            rowDiv.className = 'keyboard-row';
            
            row.forEach(keyCode => {
                const keyDiv = document.createElement('div');
                keyDiv.className = `key-cap ${keyCode.startsWith('Digit') ? 'black-cap' : 'white-cap'}`;
                keyDiv.innerText = this.getKeyLabel(keyCode);
                keyDiv.dataset.code = keyCode;
                
                this.keys.set(keyCode, keyDiv); // Store by KeyCode for lookup
                
                const down = (e) => {
                    e.preventDefault();
                    const octave = this.stateManager.getState().octave || 4;
                    const info = layoutManager.getNoteFromKey(keyCode, octave);
                    if (!info) return;
                    this.dispatchNote('noteOn', { fullName: info.fullName, originalKey: keyCode });
                };
                const up = (e) => {
                    e.preventDefault();
                    const octave = this.stateManager.getState().octave || 4;
                    const info = layoutManager.getNoteFromKey(keyCode, octave);
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
        // Simple formatter
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
