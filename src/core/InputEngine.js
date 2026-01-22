export class InputEngine {
    constructor(stateManager) {
        this.stateManager = stateManager;
        this.activeKeys = new Set();
        this.onEvent = null; // Callback for downstream engines
        this.init();
    }

    init() {
        console.log('InputEngine initialized');
        window.addEventListener('keydown', this.handleKeyDown.bind(this));
        window.addEventListener('keyup', this.handleKeyUp.bind(this));
        
        // Handle losing focus to prevent stuck keys
        window.addEventListener('blur', this.reset.bind(this));
    }

    setEventHandler(callback) {
        this.onEvent = callback;
    }

    handleKeyDown(event) {
        // Ignore repeats
        if (event.repeat) return;
        
        // Track key
        const code = event.code;
        if (this.activeKeys.has(code)) return; // Double safety
        
        this.activeKeys.add(code);
        
        this.emit('keydown', code, event);
    }

    handleKeyUp(event) {
        const code = event.code;
        this.activeKeys.delete(code);
        this.emit('keyup', code, event);
    }

    reset() {
        // Release all keys if window loses focus
        this.activeKeys.forEach(code => {
            this.emit('keyup', code, null);
        });
        this.activeKeys.clear();
    }

    emit(type, code, originalEvent) {
        if (this.onEvent) {
            this.onEvent({
                type: type,
                code: code,
                originalEvent: originalEvent,
                inputTime: performance.now()
            });
        }
    }
}