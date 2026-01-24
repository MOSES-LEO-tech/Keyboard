
import { KeyboardLayout } from '../src/layouts/KeyboardLayout.js';

const layout = new KeyboardLayout();
const baseOctave = 4;

console.log('--- Testing White Keys (Sequential) ---');
const whiteTests = ['KeyQ', 'KeyP', 'KeyA', 'KeyL', 'KeyZ', 'Slash'];
whiteTests.forEach(key => {
    const result = layout.map(key, baseOctave, { shiftKey: false });
    console.log(`${key} -> ${result ? result.fullName : 'null'}`);
});

console.log('\n--- Testing Black Keys (Standard) ---');
const blackTests = ['Digit1', 'Digit2', 'Digit5', 'Digit6', 'Equal'];
blackTests.forEach(key => {
    const result = layout.map(key, baseOctave, { shiftKey: false });
    console.log(`${key} -> ${result ? result.fullName : 'null'}`);
});

console.log('\n--- Testing Black Keys (Shifted) ---');
blackTests.forEach(key => {
    const result = layout.map(key, baseOctave, { shiftKey: true });
    console.log(`Shift + ${key} -> ${result ? result.fullName : 'null'}`);
});
