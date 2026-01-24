import { InputEngine } from './core/InputEngine.js';
import { MappingEngine } from './core/MappingEngine.js';
import { AudioEngine } from './core/AudioEngine.js';
import { StateManager } from './core/StateManager.js';
import { ModeController } from './core/ModeController.js';
import { FreePlayMode } from './modes/FreePlayMode.js';
import { LearnMode } from './modes/LearnMode.js';
import { UI } from './ui/KeyboardView.js';

console.log('Keyboard-Keyboard initializing...');

// Initialize Core Modules
const stateManager = new StateManager();
const modeController = new ModeController(stateManager);
const audioEngine = new AudioEngine(stateManager);
const mappingEngine = new MappingEngine(stateManager);
const inputEngine = new InputEngine(stateManager);
const ui = new UI(stateManager, mappingEngine);

// Register Modes
modeController.registerMode('free_play', new FreePlayMode(stateManager));
modeController.registerMode('learn', new LearnMode(stateManager));

// Set initial mode
modeController.switchMode('free_play');

// Wire up the signal flow: Input -> Mapping -> Mode -> Audio
inputEngine.setEventHandler((event) => {
    mappingEngine.handleInput(event);
});

mappingEngine.setNoteHandler((noteEvent) => {
    // Pass through Mode Controller
    const processedEvent = modeController.processNote(noteEvent);

    if (processedEvent) {
        console.log('Playing Note:', processedEvent);
        audioEngine.handleNote(processedEvent);

        // Update UI
        // Use new handler that respects layout and event data
        ui.handleNoteEvent(processedEvent);
    }
});

// For debugging in console
window.app = {
    input: inputEngine,
    mapping: mappingEngine,
    audio: audioEngine,
    state: stateManager,
    mode: modeController,
    ui: ui
};
