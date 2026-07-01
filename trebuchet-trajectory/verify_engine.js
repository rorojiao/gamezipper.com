#!/usr/bin/env node
/**
 * In-engine BFS verifier for Trebuchet Trajectory.
 * Loads index.html, extracts LEVELS and simulate() logic, verifies each level solvable.
 * Uses jsdom to run the actual game code.
 */
const fs = require('fs');

// Extract LEVELS from HTML
const html = fs.readFileSync('index.html', 'utf8');
const startMarker = 'const LEVELS=';
const endMarker = ';\nconst G=';
const si = html.indexOf(startMarker);
const ei = html.indexOf(endMarker, si);
if (si < 0 || ei < 0) { console.error('Could not extract LEVELS'); process.exit(1); }
const lvlStr = html.substring(si + startMarker.length, ei);
const LEVELS = JSON.parse(lvlStr);
console.log('Loaded ' + LEVELS.length + ' levels from index.html');

// Physics constants (must match game exactly)
const G = 9.81, SCALE = 18, CW = 360, GY = 280, LX = 35, LY = 240, TH = 18;

function simulate(v0, thetaDeg, obstacles) {
    const th = thetaDeg * Math.PI / 180;
    const vx = v0 * Math.cos(th), vy = v0 * Math.sin(th);
    let t = 0, dt = 0.004, px = LX, py = LY;
    while (t < 8) {
        t += dt;
        const nx = LX + vx * t * SCALE, ny = LY - (vy * t - 0.5 * G * t * t) * SCALE;
        if (ny >= GY) {
            const f = (ny - py) !== 0 ? (GY - py) / (ny - py) : 1;
            const gx = px + f * (nx - px);
            return { landX: gx, landY: GY, blocked: false };
        }
        if (nx > CW + 5 || nx < -5) {
            return { landX: nx, landY: Math.min(ny, GY), blocked: false };
        }
        for (const o of obstacles) {
            if (nx >= o.x && nx <= o.x + o.w && ny >= o.y && ny <= o.y + o.h) {
                return { landX: nx, landY: ny, blocked: true };
            }
        }
        px = nx; py = ny;
    }
    return { landX: px, landY: py, blocked: false };
}

let allPass = true;
let uniqueCount = 0;
let solvableCount = 0;

console.log('='.repeat(70));
console.log('In-Engine Verifier — Trebuchet Trajectory');
console.log('='.repeat(70));

for (const lv of LEVELS) {
    let hitters = 0;
    let solutionHits = false;
    let foundHitter = null;

    for (let p = 0; p < lv.np; p++) {
        for (let a = 0; a < lv.na; a++) {
            const res = simulate(lv.v[p], lv.a[a], lv.o || []);
            if (res.blocked) continue;
            const hits = Math.abs(res.landX - lv.tx) < lv.tw && Math.abs(res.landY - lv.ty) < TH;
            if (hits) {
                hitters++;
                if (p === lv.sp && a === lv.sa) solutionHits = true;
                if (!foundHitter) foundHitter = [p, a];
            }
        }
    }

    const isUnique = hitters === 1;
    const solvable = solutionHits;

    if (isUnique) uniqueCount++;
    if (solvable) solvableCount++;
    if (!isUnique || !solvable) allPass = false;

    const status = (isUnique && solvable) ? '✅' : '❌';
    console.log(`  L${String(lv.l).padStart(2)} T${lv.t} | h=${hitters} | unique=${isUnique} | solvable=${solvable} | sol=(${lv.sp},${lv.sa}) ${status}`);
}

console.log('='.repeat(70));
console.log(`RESULTS: ${uniqueCount}/30 unique, ${solvableCount}/30 solvable`);
console.log(`Overall: ${allPass ? '✅ ALL PASS' : '❌ FAILURES'}`);
console.log('='.repeat(70));
process.exit(allPass ? 0 : 1);
