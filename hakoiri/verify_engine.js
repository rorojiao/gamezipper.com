// In-engine verification: load the actual game HTML and test checkWin()
const fs = require('fs');
const vm = require('vm');

const html = fs.readFileSync('index.html', 'utf8');
const m = html.match(/<script>([\s\S]*?)<\/script>/g);
let gameCode = '';
let maxLen = 0;
m.forEach(block => {
    const code = block.replace(/<\/?script[^>]*>/g, '');
    if (code.length > maxLen) { maxLen = code.length; gameCode = code; }
});

// Minimal mock
function El() {
    return {
        textContent: '', style: {}, classList: { add: ()=>{}, remove: ()=>{}, contains: ()=>false, toggle: ()=>{} },
        addEventListener: ()=>{}, appendChild: ()=>{}, querySelectorAll: ()=>[],
        getBoundingClientRect: ()=>({left:0, top:0, width:400, height:400}),
        innerHTML: '', className: '', onclick: null,
        clientWidth: 480, clientHeight: 800, offsetWidth: 480, offsetHeight: 800,
        getContext: ()=>({
            fillRect: ()=>{}, strokeRect: ()=>{}, beginPath: ()=>{}, moveTo: ()=>{},
            lineTo: ()=>{}, arc: ()=>{}, closePath: ()=>{}, fill: ()=>{}, stroke: ()=>{},
            fillStyle: '', strokeStyle: '', lineWidth: 0
        })
    };
}

const ctx = {
    window: {
        devicePixelRatio: 1, innerWidth: 480, innerHeight: 800,
        addEventListener: ()=>{}, AudioContext: function(){}, webkitAudioContext: function(){},
        localStorage: { getItem: ()=>null, setItem: ()=>{} }
    },
    document: {
        getElementById: El, querySelector: ()=>null, querySelectorAll: ()=>[],
        createElement: El, addEventListener: ()=>{},
        head: { appendChild: ()=>{} }, body: { appendChild: ()=>{} },
        readyState: 'complete'
    },
    console, setTimeout: setTimeout, setInterval: ()=>0, clearInterval: ()=>{}, clearTimeout: ()=>{},
    requestAnimationFrame: ()=>0, cancelAnimationFrame: ()=>{},
    localStorage: { getItem: ()=>null, setItem: ()=>{} },
    AudioContext: function(){}, webkitAudioContext: function(){},
    Date: Date, Math: Math, JSON: JSON, Object: Object, Array: Array,
    parseInt: parseInt, parseFloat: parseFloat
};
ctx.window.localStorage = ctx.localStorage;

vm.createContext(ctx);
try {
    vm.runInContext(gameCode, ctx);
} catch(e) {
    console.log('Load error:', e.message);
    process.exit(1);
}

// Test checkWin on each level
let pass = 0;
for (let i = 0; i < 30; i++) {
    try {
        ctx.loadLevel(i);
        // Fill grid with solution
        for (let r = 0; r < ctx.state.rows; r++) {
            for (let c = 0; c < ctx.state.cols; c++) {
                ctx.state.grid[r][c] = ctx.state.solution[r][c];
            }
        }
        const result = ctx.checkWin();
        if (result) pass++;
        else console.log(`L${i+1}: checkWin returned false`);
    } catch(e) {
        console.log(`L${i+1}: ERROR - ${e.message}`);
    }
}
console.log(`\nIn-engine verification: ${pass}/30 PASS`);
