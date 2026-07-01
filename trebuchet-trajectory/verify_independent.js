#!/usr/bin/env node
/**
 * Independent Node.js verifier for Trebuchet Trajectory.
 * Re-implements projectile physics from scratch (no shared code with gen_levels.py).
 * Verifies: (1) each level has exactly ONE combo hitting target, (2) solution combo is the hitter.
 */
const fs = require('fs');

const G = 9.81;
const SCALE = 18;
const CANVAS_W = 360;
const GROUND_Y = 280;
const LAUNCH_X = 35;
const LAUNCH_Y = 240;
const TARGET_H = 18;

function simulate(v0, thetaDeg, obstacles) {
    const theta = thetaDeg * Math.PI / 180;
    const vx = v0 * Math.cos(theta);
    const vy = v0 * Math.sin(theta);
    let t = 0;
    const dt = 0.003;
    let prevX = LAUNCH_X, prevY = LAUNCH_Y;

    while (t < 8.0) {
        t += dt;
        const newX = LAUNCH_X + vx * t * SCALE;
        const newY = LAUNCH_Y - (vy * t - 0.5 * G * t * t) * SCALE;

        if (newY >= GROUND_Y) {
            const frac = (newY - prevY) !== 0 ? (GROUND_Y - prevY) / (newY - prevY) : 1.0;
            const gx = prevX + frac * (newX - prevX);
            return [gx, GROUND_Y, false];
        }
        if (newX > CANVAS_W + 5 || newX < -5) {
            return [newX, Math.min(newY, GROUND_Y), false];
        }
        for (const obs of obstacles) {
            if (newX >= obs.x && newX <= obs.x + obs.w &&
                newY >= obs.y && newY <= obs.y + obs.h) {
                return [newX, newY, true];
            }
        }
        prevX = newX;
        prevY = newY;
    }
    return [newX ?? LAUNCH_X, newY ?? LAUNCH_Y, false];
}

function countHitters(landings, tx, ty) {
    let cnt = 0;
    let hitter = null;
    for (const [key, val] of Object.entries(landings)) {
        const [lx, ly, blocked] = val;
        if (blocked) continue;
        if (Math.abs(lx - tx) < 12 && Math.abs(ly - ty) < TARGET_H) {
            cnt++;
            if (hitter === null) hitter = key;
        }
    }
    return [cnt, hitter];
}

const levels = JSON.parse(fs.readFileSync('levels.json', 'utf8'));
let allPass = true;
let uniqueCount = 0;
let validCount = 0;

console.log('='.repeat(70));
console.log('Independent Node.js Verifier — Trebuchet Trajectory');
console.log('='.repeat(70));

for (const lv of levels) {
    // Enumerate all combos
    const landings = {};
    for (let p = 0; p < lv.n_power; p++) {
        for (let a = 0; a < lv.n_angle; a++) {
            const v0 = lv.v_list[p];
            const theta = lv.a_list[a];
            const [lx, ly, blocked] = simulate(v0, theta, lv.obstacles);
            landings[`${p},${a}`] = [lx, ly, blocked];
        }
    }

    const [cnt, hitter] = countHitters(landings, lv.target_x, lv.target_y);
    const solKey = `${lv.solution_power},${lv.solution_angle}`;
    const isUnique = cnt === 1;
    const solValid = hitter === solKey;

    if (isUnique) uniqueCount++;
    if (solValid) validCount++;
    if (!isUnique || !solValid) allPass = false;

    const status = (isUnique && solValid) ? '✅' : '❌';
    console.log(`  L${String(lv.level).padStart(2)} T${lv.tier} | h=${cnt} | u=${isUnique} | v=${solValid} | sol=(${lv.solution_power},${lv.solution_angle}) | tgt=(${lv.target_x},${lv.target_y}) ${status}`);
}

console.log('='.repeat(70));
console.log(`RESULTS: ${uniqueCount}/30 unique, ${validCount}/30 solution valid`);
console.log(`Overall: ${allPass ? '✅ ALL PASS' : '❌ FAILURES'}`);
console.log('='.repeat(70));
process.exit(allPass ? 0 : 1);
