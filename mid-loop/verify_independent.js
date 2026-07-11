#!/usr/bin/env node
/*
 * Mid-Loop independent verifier (Node.js — Method 2: structural).
 * Re-implements the structural check in JavaScript, independent of Python.
 */
const fs = require('fs');

const levels = JSON.parse(fs.readFileSync('levels.json', 'utf8'));
let allOk = true;

for (const lvl of levels) {
    const R = lvl.rows, C = lvl.cols;
    const dots = lvl.dots.map(d => [d[0], d[1]]);
    const sol = lvl.solution.map(v => [v[0], v[1]]);
    const VR = R + 1, VC = C + 1;
    let ok = true, msg = 'valid';
    // Check vertices in grid
    for (const v of sol) {
        if (v[0] < 0 || v[1] < 0 || v[0] >= VR || v[1] >= VC) {
            ok = false; msg = `vertex ${v} out of grid`; break;
        }
    }
    // Check edges adjacent + simple cycle
    if (ok) {
        const n = sol.length;
        for (let i = 0; i < n && ok; i++) {
            const a = sol[i], b = sol[(i+1)%n];
            if (Math.abs(a[0]-b[0]) + Math.abs(a[1]-b[1]) !== 1) {
                ok = false; msg = `non-adjacent edge ${a}->${b}`; break;
            }
        }
        if (ok && new Set(sol.map(v => v.join(','))).size !== n) {
            ok = false; msg = 'repeated vertex';
        }
    }
    // All dots on cycle
    if (ok) {
        const solSet = new Set(sol.map(v => v.join(',')));
        for (const d of dots) {
            if (!solSet.has(d.join(','))) {
                ok = false; msg = `dot ${d} not on cycle`; break;
            }
        }
    }
    // Each dot valid midpoint
    if (ok) {
        const n = sol.length;
        const edges = new Set();
        for (let i = 0; i < n; i++) {
            const a = sol[i], b = sol[(i+1)%n];
            const k = [Math.min(a[0],b[0]), Math.min(a[1],b[1]), Math.max(a[0],b[0]), Math.max(a[1],b[1])].join(',');
            edges.add(k);
        }
        const adj = {};
        for (let i = 0; i < n; i++) {
            adj[sol[i].join(',')] = [sol[(i-1+n)%n], sol[(i+1)%n]];
        }
        for (const d of dots) {
            const [prev, nxt] = adj[d.join(',')];
            const d1 = [prev[0]-d[0], prev[1]-d[1]];
            const d2 = [nxt[0]-d[0], nxt[1]-d[1]];
            if (d1[0]+d2[0] !== 0 || d1[1]+d2[1] !== 0) {
                ok = false; msg = `dot ${d} is a turn`; break;
            }
            function count(direction) {
                let cur = d, L = 0;
                while (true) {
                    const nx = [cur[0]+direction[0], cur[1]+direction[1]];
                    const e = [Math.min(cur[0],nx[0]), Math.min(cur[1],nx[1]), Math.max(cur[0],nx[0]), Math.max(cur[1],nx[1])].join(',');
                    if (!edges.has(e)) break;
                    L++;
                    const [p, q] = adj[nx.join(',')];
                    const other = p === cur || (p[0]===cur[0]&&p[1]===cur[1]) ? q : p;
                    // Wait — need proper comparison. Let me redo:
                    const pIsCur = p[0]===cur[0] && p[1]===cur[1];
                    const otherN = pIsCur ? q : p;
                    const d3 = [otherN[0]-nx[0], otherN[1]-nx[1]];
                    if (d3[0] !== direction[0] || d3[1] !== direction[1]) break;
                    cur = nx;
                }
                return L;
            }
            const l1 = count(d1), l2 = count(d2);
            if (l1 !== l2 || l1 < 1) {
                ok = false; msg = `dot ${d} unequal extent (${l1} vs ${l2})`; break;
            }
        }
    }
    const status = ok ? 'VALID' : `INVALID: ${msg}`;
    console.log(`L${lvl.index} ${lvl.tier} ${R}x${C}: ${status}`);
    if (!ok) allOk = false;
}
console.log(`\n${allOk ? 'ALL 30 LEVELS STRUCTURALLY VALID (Node.js)' : 'SOME LEVELS INVALID'}`);
process.exit(allOk ? 0 : 1);
