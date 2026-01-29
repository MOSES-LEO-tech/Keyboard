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
        console.log('[ModeController] Attempting to switch to:', modeName, '| current:', this.currentMode?.name);
        if (this.currentMode && this.currentMode.name === modeName) {
            console.log('[ModeController] Already in that mode, skipping');
            return;
        }

        if (this.currentMode) {
            console.log('[ModeController] Exiting current mode:', this.currentMode.name);
            this.currentMode.exit();
        }

        const newMode = this.modes[modeName];
        if (newMode) {
            console.log(`[ModeController] ✅ Switching to mode: ${modeName}`);
            this.currentMode = newMode;
            this.currentMode.enter();
        } else {
            console.log(`[ModeController] ❌ Mode not found: ${modeName}`);
        }
    }

    // Intercept and process notes based on active mode
    processNote(noteEvent) {
        console.log('[ModeController] processNote called:', noteEvent.type, '| currentMode:', this.currentMode?.name);
        if (this.currentMode) {
            const result = this.currentMode.handleNote(noteEvent);
            console.log('[ModeController] handleNote result:', result);
            return result;
        }
        console.log('[ModeController] No mode, passing through');
        return noteEvent; // Pass through if no mode logic
    }
}