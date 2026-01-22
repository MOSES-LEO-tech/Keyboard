export class FreePlayMode {
    constructor(stateManager) {
        this.stateManager = stateManager;
        this.name = 'free_play';
    }

    enter() {
        console.log('Entered Free Play Mode');
        // Clear any specific UI guides
        this.stateManager.setState({ scaleLock: null });
    }

    handleNote(noteEvent) {
        // Pass everything through
        return noteEvent;
    }

    exit() {
        // Cleanup
    }
}