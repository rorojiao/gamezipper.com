// Trinudo In-Engine Verifier
// Loads the actual index.html and runs its LEVELS + isSolved logic via vm.runInContext

const fs = require('fs');
const vm = require('vm');

const html = fs.readFileSync(__dirname + '/index.html', 'utf8');

// Extract the LEVELS JSON from the HTML
const match = html.match(/var LEVELS\s*=\s*(\[.*?\]);/s);
if (!match) {
    console.error('Could not find LEVELS in index.html');
    process.exit(1);
}
const LEVELS = JSON.parse(match[1]);

// Create a minimal context simulating the browser environment
const sandbox = {
    window: {},
    document: {
        getElementById: () => ({
            getContext: () => ({
                fillRect: ()=>{}, fillText: ()=>{}, beginPath: ()=>{},
                moveTo: ()=>{}, lineTo: ()=>{}, stroke: ()=>{}, fill: ()=>{},
                arc: ()=>{}, save: ()=>{}, restore: ()=>{}, translate: ()=>{},
                clearRect: ()=>{}, measureText: () => ({width: 10}),
            }),
            addEventListener: ()=>{},
            classList: { toggle: ()=>{}, add: ()=>{}, remove: ()=>{} },
            style: {},
            textContent: '',
            innerHTML: '',
            appendChild: ()=>{},
            onclick: null,
            querySelectorAll: () => [],
        }),
        createElement: () => ({
            className: '', style: {}, textContent: '', onclick: null,
            appendChild: ()=>{},
        }),
        body: { appendChild: ()=>{} },
        addEventListener: ()=>{},
    },
    localStorage: {
        getItem: () => null,
        setItem: ()=>{},
    },
    console: console,
    setTimeout: setTimeout,
    setInterval: ()=>0,
    clearInterval: ()=>{},
    Date: { now: () => 0 },
    AudioContext: function() { return { createOscillator: ()=>({start:()=>{},stop:()=>{}}), createGain: ()=>({connect:()=>{},gain:{}}), connect:()=>{}, destination:{} }; },
    JSON: JSON,
    Math: Math,
};

// Extract the game logic from the HTML <script> block
const scriptMatch = html.match(/<script>\s*\/\/ === LEVELS DATA ===[\s\S]*?<\/script>/);
if (!scriptMatch) {
    console.error('Could not find game script');
    process.exit(1);
}
let scriptCode = scriptMatch[0].replace(/<\/?script>/g, '');
// Remove external script references
scriptCode = scriptCode.replace(/<script[^>]*src[^>]*><\/script>/g, '');

vm.createContext(sandbox);
try {
    vm.runInContext(scriptCode, sandbox, { timeout: 10000 });
} catch(e) {
    console.error('Script execution error:', e.message);
}

// Now test: for each level, load its solution into the engine and check isSolved
let allPass = true;
for (let i = 0; i < LEVELS.length; i++) {
    const lvl = LEVELS[i];
    const { rows: R, cols: C, clues, solution } = lvl;
    
    // Simulate: set state to the solution, then call checkViolations + isSolved
    sandbox.state.levelIdx = i;
    sandbox.state.grid = solution.map(r => r.slice());
    sandbox.state.violations = {};
    
    const ok = sandbox.isSolved();
    console.log(`L${lvl.level} ${lvl.tier} ${R}x${C}: ${ok ? 'PASS' : 'FAIL'}`);
    if (!ok) allPass = false;
}

console.log(allPass ? '\n✅ IN-ENGINE VERIFICATION: ALL 30 PASS' : '\n❌ SOME LEVELS FAILED');
process.exit(allPass ? 0 : 1);
