export class ModeController {
    constructor(stateManager) {
        this.stateManager = stateManager;
        this.currentMode = null;
        this.modes = {};
        
        // Subscribe to state changes to switch modes
        this.stateManager.subscribe(state => {
            this.switchMode(state.mode);
        });
    }

    registerMode(name, modeInstance) {
        this.modes[name] = modeInstance;
    }

    switchMode(modeName) {
        if (this.currentMode && this.currentMode.name === modeName) return;

        if (this.currentMode) {
            this.currentMode.exit();
        }

        const newMode = this.modes[modeName];
        if (newMode) {
            console.log(`Switching to mode: ${modeName}`);
            this.currentMode = newMode;
            this.currentMode.enter();
        }
    }

    // Intercept and process notes based on active mode
    processNote(noteEvent) {
        if (this.currentMode) {
            return this.currentMode.handleNote(noteEvent);
        }
        return noteEvent; // Pass through if no mode logic
    }
}