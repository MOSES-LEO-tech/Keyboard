export class StateManager {
    constructor() {
        this.state = {
            octave: 4,
            instrument: 'piano',
            mode: 'free_play',
            layout: 'piano',
            sustain: false,
            volume: 2.5,
            labelMode: 'both' // 'pc', 'note', 'both'
        };
        this.listeners = [];
        this.loadPrefs();
        this.init();
    }

    init() {
        console.log('StateManager initialized');
    }

    getState() {
        return this.state;
    }

    subscribe(callback) {
        this.listeners.push(callback);
    }

    setState(newState) {
        this.state = { ...this.state, ...newState };
        this.savePrefs();
        this.notify();
    }

    notify() {
        this.listeners.forEach(cb => cb(this.state));
    }

    loadPrefs() {
        try {
            const raw = localStorage.getItem('kk.prefs');
            if (!raw) return;
            const prefs = JSON.parse(raw);
            const merge = {};
            if (typeof prefs.octave === 'number') merge.octave = prefs.octave;
            if (typeof prefs.volume === 'number') merge.volume = prefs.volume;
            if (typeof prefs.instrument === 'string') merge.instrument = prefs.instrument;
            if (typeof prefs.layout === 'string') merge.layout = prefs.layout;
            if (typeof prefs.mode === 'string') merge.mode = prefs.mode;
            this.state = { ...this.state, ...merge };
        } catch (e) { }
    }

    savePrefs() {
        try {
            const prefs = {
                octave: this.state.octave,
                volume: this.state.volume,
                instrument: this.state.instrument,
                layout: this.state.layout,
                mode: this.state.mode
            };
            localStorage.setItem('kk.prefs', JSON.stringify(prefs));
        } catch (e) { }
    }
}
