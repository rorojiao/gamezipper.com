// Detour Engine Verifier - loads actual index.html game logic via vm.runInContext
const vm = require('vm');
const fs = require('fs');

const html = fs.readFileSync('/home/msdn/gamezipper.com/detour/index.html', 'utf8');

// Extract the main game script
const scripts = html.match(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g);
let gameCode = '';
for (const block of scripts) {
    const code = block.replace(/<\/?script[^>]*>/g, '');
    if (code.length > 10000) { gameCode = code; break; }
}

if (!gameCode) { console.log('ERROR: No game script found'); process.exit(1); }

// Also load the levels data separately
const levelsRaw = fs.readFileSync('/home/msdn/gamezipper.com/detour/levels.json', 'utf8');
const LEVELS = JSON.parse(levelsRaw);

// Minimal DOM mock
function El() {
    return {
        textContent: '', style: {}, classList: { add: ()=>{}, remove: ()=>{}, toggle: ()=>{}, contains: ()=>false },
        addEventListener: ()=>{}, removeEventListener: ()=>{}, appendChild: ()=>{},
        querySelectorAll: ()=>[], getBoundingClientRect: ()=>({left:0,top:0}),
        innerHTML: '', className: '', width: 500, height: 500,
        clientWidth: 480, clientHeight: 800, offsetWidth: 480, offsetHeight: 800,
        dataset: {}, getContext: ()=>({ clearRect:()=>{}, fillRect:()=>{}, strokeRect:()=>{}, beginPath:()=>{},
            moveTo:()=>{}, lineTo:()=>{}, stroke:()=>{}, fill:()=>{}, arc:()=>{}, fillText:()=>{},
            set fillStyle(v){}, set strokeStyle(v){}, set lineWidth(v){}, set textAlign(v){}, set textBaseline(v){}, set font(v){}, set lineCap(v){} })
    };
}

const ctx = {
    window: {
        devicePixelRatio: 1, addEventListener: ()=>{},
        localStorage: { getItem: ()=>null, setItem: ()=>{} },
        innerWidth: 480, innerHeight: 800
    },
    document: {
        getElementById: El, querySelectorAll: ()=>[], createElement: El,
        head: { appendChild: ()=>{} }, body: { appendChild: ()=>{} },
        readyState: 'complete', addEventListener: ()=>{}
    },
    console, setTimeout: ()=>{}, setInterval: ()=>0, clearInterval: ()=>{}, cancelAnimationFrame: ()=>{},
    AudioContext: function(){ return { currentTime:0, sampleRate:44100, state:'running', createBuffer:()=>({getChannelData:()=>new Float32Array(100)}), createBufferSource:()=>({connect:()=>{},start:()=>{},loop:false}), createBiquadFilter:()=>({connect:()=>{},type:'',frequency:{value:0},Q:{value:0}}), createGain:()=>({connect:()=>{},gain:{value:0,setValueAtTime:()=>{},linearRampToValueAtTime:()=>{},exponentialRampToValueAtTime:()=>{}}}), destination:{}, resume:()=>{}, close:()=>{} }; },
    webkitAudioContext: function(){ return {}; },
    requestAnimationFrame: ()=>1,
    Math, JSON, Date, parseInt, parseFloat, isNaN, Array, Object, String, Number, Boolean, RegExp,
    isNaN: isNaN
};
vm.createContext(ctx);

// Load the game code
try {
    // Remove DOMContentLoaded listener setup (won't fire in Node.js)
    let code = gameCode.replace(/document\.addEventListener\('DOMContentLoaded',\s*init\);?/, '');
    // Remove click listener for audio init
    code = code.replace(/document\.addEventListener\('click'[\s\S]*?\}, \{ once: true \}\);?/, '');
    
    vm.runInContext(code, ctx);
    console.log('Game code loaded successfully');
} catch(e) {
    console.log('ERROR loading game code:', e.message);
    process.exit(1);
}

// Now test each level
const DR = [-1, 0, 1, 0];
const DC = [0, 1, 0, -1];
let pass = 0, fail = 0;

for (let i = 0; i < LEVELS.length; i++) {
    const lv = LEVELS[i];
    
    // Verify solution is valid Hamiltonian cycle with matching turn counts
    try {
        // Check all cells have 2 connections
        let allValid = true;
        let reason = '';
        
        for (let r = 0; r < lv.rows && allValid; r++) {
            for (let c = 0; c < lv.cols && allValid; c++) {
                if (lv.solution[r][c].length !== 2) {
                    allValid = false; reason = `Cell (${r},${c}) has ${lv.solution[r][c].length} connections`;
                    break;
                }
                for (const d of lv.solution[r][c]) {
                    const nr = r + DR[d], nc = c + DC[d];
                    if (nr < 0 || nr >= lv.rows || nc < 0 || nc >= lv.cols) {
                        allValid = false; reason = `Cell (${r},${c}) direction ${d} out of bounds`;
                        break;
                    }
                    const opp = (d + 2) % 4;
                    if (!lv.solution[nr][nc].includes(opp)) {
                        allValid = false; reason = `Connection mismatch at (${r},${c})→(${nr},${nc})`;
                        break;
                    }
                }
            }
        }
        
        if (!allValid) {
            fail++; console.log(`L${i+1} T${lv.tier}: FAIL - ${reason}`);
            continue;
        }
        
        // Verify turn counts match clues
        const turnCounts = {};
        for (let r = 0; r < lv.rows; r++) {
            for (let c = 0; c < lv.cols; c++) {
                const conns = lv.solution[r][c].slice().sort((a,b)=>a-b);
                const isTurn = (conns[0] + 2) % 4 !== conns[1];
                if (isTurn) {
                    const rid = lv.regions[r][c];
                    turnCounts[rid] = (turnCounts[rid] || 0) + 1;
                }
            }
        }
        
        for (const rid in lv.clues) {
            const clue = lv.clues[rid];
            if (clue !== null && clue !== undefined) {
                if ((turnCounts[rid] || 0) !== clue) {
                    allValid = false;
                    reason = `Region ${rid}: expected ${clue} turns, got ${turnCounts[rid] || 0}`;
                    break;
                }
            }
        }
        
        if (allValid) {
            pass++;
            console.log(`L${i+1} T${lv.tier}: PASS (${lv.rows}x${lv.cols})`);
        } else {
            fail++;
            console.log(`L${i+1} T${lv.tier}: FAIL - ${reason}`);
        }
    } catch(e) {
        fail++;
        console.log(`L${i+1} T${lv.tier}: FAIL - ${e.message}`);
    }
}

console.log(`\n${pass}/${LEVELS.length} PASS${fail ? ` (${fail} FAILED)` : ''}`);
