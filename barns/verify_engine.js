// verify_engine.js — In-engine verification of Barns level-pack
// Barns rule: draw rectangles partitioning the grid such that each room has exactly 1 circle.
// Each level: {tier, N, c:[decimal-encoded (x,y) as x*10+y], r:[[x0,y0,w,h], ...]}
const fs = require('fs');
const extractLevels = require('../.audit/gz-extract-levels.js');
const LEVELS = extractLevels('barns');
console.log(`Loaded ${LEVELS.length} levels from index.html\n`);

let pass = 0, fail = 0;
for (let idx = 0; idx < LEVELS.length; idx++) {
    const L = LEVELS[idx];
    const N = L.N;
    // Decode circles using game's actual algorithm: x=floor(c/10), y=c%10
    const circles = L.c.map(c => ({ x: Math.floor(c / 10), y: c % 10 }));
    const rects = L.r;
    let ok = true;
    let reason = '';
    // 1. Each rect is within grid
    for (const [x0, y0, w, h] of rects) {
        if (x0 < 0 || y0 < 0 || x0 + w > N || y0 + h > N || w <= 0 || h <= 0) {
            ok = false; reason = `rect [${x0},${y0},${w},${h}] out of bounds`; break;
        }
    }
    // 2. Rects partition grid exactly
    if (ok) {
        const cov = new Array(N * N).fill(0);
        for (const [x0, y0, w, h] of rects) {
            for (let y = y0; y < y0 + h; y++)
                for (let x = x0; x < x0 + w; x++) cov[y * N + x]++;
        }
        for (let i = 0; i < N * N; i++) {
            if (cov[i] !== 1) { ok = false; reason = `cell ${i} cov=${cov[i]} (not 1)`; break; }
        }
    }
    // 3. Each rect contains exactly 1 circle
    if (ok) {
        for (const [x0, y0, w, h] of rects) {
            let cnt = 0;
            for (const c of circles) {
                if (x0 <= c.x && c.x < x0 + w && y0 <= c.y && c.y < y0 + h) cnt++;
            }
            if (cnt !== 1) { ok = false; reason = `rect [${x0},${y0},${w},${h}] has ${cnt} circles (not 1)`; break; }
        }
    }
    if (ok) pass++;
    else { fail++; console.log(`L${idx+1} (${L.tier}, N=${N}): FAIL — ${reason}`); }
}
console.log(`\n=== ${pass}/${LEVELS.length} PASS, ${fail} FAIL ===`);
if (fail > 0) process.exit(1);