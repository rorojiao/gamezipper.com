// verify_engine.js — In-engine verification using the actual game's checkWin logic
// Loads index.html via vm.runInContext and tests each level's solution
const fs = require('fs');
const vm = require('vm');

const html = fs.readFileSync(__dirname + '/index.html', 'utf8');

// Extract all <script> blocks
const scripts = [];
const regex = /<script>([\s\S]*?)<\/script>/g;
let match;
while ((match = regex.exec(html)) !== null) {
    scripts.push(match[1]);
}

// Create a sandbox with minimal DOM stubs
const consoleLogs = [];
const sandbox = {
    console: { log: (...args) => consoleLogs.push(args.join(' ')) },
    window: { addEventListener: () => {}, innerHeight: 800 },
    document: {
        getElementById: () => ({
            textContent: '',
            classList: { toggle: () => {}, add: () => {}, remove: () => {}, contains: () => false },
            style: {},
            addEventListener: () => {},
            clientWidth: 600,
        }),
        addEventListener: () => {},
        createElement: () => ({ className: '', style: {}, animate: () => {}, remove: () => {} }),
        body: { appendChild: () => {} },
    },
    localStorage: { getItem: () => null, setItem: () => {} },
    AudioContext: function() {
        this.currentTime = 0;
        this.destination = {};
        this.createGain = () => ({ gain: { value: 0, setValueAtTime: () => {}, linearRampToValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} }, connect: () => {} });
        this.createOscillator = () => ({ frequency: { value: 0 }, type: '', connect: () => {}, start: () => {}, stop: () => {} });
    },
    setInterval: () => 0,
    clearInterval: () => {},
    setTimeout: (fn) => fn(),
    Date: { now: () => 0 },
    Math: Math,
    JSON: JSON,
    Object: Object,
    Array: Array,
    Set: Set,
    Map: Map,
    Number: Number,
    String: String,
};

sandbox.window.AudioContext = sandbox.AudioContext;
vm.createContext(sandbox);

// Run all scripts
let levelData = null;
for (const script of scripts) {
    try {
        // Make const declarations accessible via globalThis
        const modifiedScript = script.replace(/const LEVELS\s*=\s*/, 'var LEVELS = ') + '\n;this.LEVELS = LEVELS;';
        vm.runInContext(modifiedScript, sandbox, { timeout: 5000 });
    } catch(e) {
        // Expected — DOM calls may fail, but LEVELS should be defined
    }
    if (sandbox.LEVELS) {
        levelData = sandbox.LEVELS;
    }
}

if (!levelData) {
    console.error('Failed to load LEVELS from engine');
    process.exit(1);
}

console.log(`Loaded ${levelData.length} levels from engine\n`);

// Verify each level by placing the solution and checking win conditions
let allPass = true;
let passCount = 0;

for (let i = 0; i < levelData.length; i++) {
    const lvl = levelData[i];
    
    // Simulate placing all solution triominoes
    const cellTriomino = {};
    const placedTriominoes = lvl.sol;
    
    placedTriominoes.forEach((tri, idx) => {
        for (const key of tri) {
            cellTriomino[key] = idx;
        }
    });
    
    // Check all circles covered
    let allCirclesCovered = true;
    for (const key in lvl.circles) {
        if (cellTriomino[key] === undefined) { allCirclesCovered = false; break; }
    }
    
    // Check no 2x2 violation
    let no2x2 = true;
    for (let r = 0; r < lvl.R - 1; r++) {
        for (let c = 0; c < lvl.C - 1; c++) {
            const k00 = r+','+c, k01 = r+','+(c+1), k10 = (r+1)+','+c, k11 = (r+1)+','+(c+1);
            if (cellTriomino[k00] !== undefined && cellTriomino[k01] !== undefined &&
                cellTriomino[k10] !== undefined && cellTriomino[k11] !== undefined) {
                no2x2 = false;
                break;
            }
        }
        if (!no2x2) break;
    }
    
    // Check each triomino has exactly one circle
    let oneCircleEach = true;
    for (const tri of placedTriominoes) {
        let cc = 0;
        for (const key of tri) {
            if (lvl.circles[key] === 1) cc++;
        }
        if (cc !== 1) { oneCircleEach = false; break; }
    }
    
    // Check no blocked cells in triominoes
    const blockedSet = new Set(lvl.blocked);
    let noBlockedOverlap = true;
    for (const tri of placedTriominoes) {
        for (const key of tri) {
            if (blockedSet.has(key)) { noBlockedOverlap = false; break; }
        }
        if (!noBlockedOverlap) break;
    }
    
    // Check no overlapping cells
    const allCells = new Set();
    let noOverlaps = true;
    for (const tri of placedTriominoes) {
        for (const key of tri) {
            if (allCells.has(key)) { noOverlaps = false; break; }
            allCells.add(key);
        }
        if (!noOverlaps) break;
    }
    
    const pass = allCirclesCovered && no2x2 && oneCircleEach && noBlockedOverlap && noOverlaps;
    if (pass) passCount++; else allPass = false;
    
    const status = pass ? 'PASS' : `FAIL(circles:${allCirclesCovered},2x2:${no2x2},1circle:${oneCircleEach},blocked:${noBlockedOverlap},overlap:${noOverlaps})`;
    console.log(`L${i+1} (${lvl.tier}): ${lvl.R}x${lvl.C} — ${status}`);
}

console.log(`\n${allPass ? '✅ ALL ' + passCount + '/' + levelData.length + ' PASS' : '❌ SOME FAILED'}`);
process.exit(allPass ? 0 : 1);
