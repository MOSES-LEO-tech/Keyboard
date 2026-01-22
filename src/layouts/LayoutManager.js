export class LayoutManager {
    constructor(stateManager) {
        this.stateManager = stateManager;
        this.currentLayout = null;
        this.layouts = new Map();

        // Subscribe to state changes if layout is stored in state
        this.stateManager.subscribe(state => {
            if (state.layout && state.layout !== (this.currentLayout ? this.currentLayout.name : null)) {
                this.switchTo(state.layout);
            }
        });
    }

    registerLayout(name, layoutInstance) {
        layoutInstance.name = name;
        this.layouts.set(name, layoutInstance);
    }

    switchTo(name) {
        if (!this.layouts.has(name)) {
            console.warn(`Layout ${name} not found.`);
            return;
        }
        
        this.currentLayout = this.layouts.get(name);
        console.log(`Switched to layout: ${name}`);
        
        // Notify StateManager so UI can update? 
        // Or assumes StateManager triggered this.
        // If triggered manually, we should update state.
        const currentState = this.stateManager.getState();
        if (currentState.layout !== name) {
            this.stateManager.setState({ layout: name });
        }
    }

    getActiveLayout() {
        return this.currentLayout;
    }

    // Proxy method to get note from key
    getNoteFromKey(keyCode, currentOctave) {
        if (!this.currentLayout) return null;
        return this.currentLayout.map(keyCode, currentOctave);
    }
}
