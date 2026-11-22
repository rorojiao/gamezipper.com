#!/usr/bin/env node
/**
 * Arukone (Number Link) in-engine verifier — R1191 rewrite.
 * Loads LEVELS from index.html and proves each level has EXACTLY 1 solution under
 * strict chain semantics identical to the in-page engine: each pair is a simple
 * orthogonal path A->B; paths may not touch other pairs' clue cells or each other;
 * all W*H cells covered. Cap=2 solution search; deadline exhaustion => incomplete
 * => FAIL (timeout is never treated as proof).
 */
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf-8');
const match = html.match(/var LEVELS=(\[.*?\]);\n/s);
if (!match) {
    console.error('Could not extract LEVELS from index.html');
    process.exit(1);
}
const levelsData = JSON.parse(match[1]);
if (!Array.isArray(levelsData) || levelsData.length === 0) {
    console.error('EMPTY_LEVELS');
    process.exit(1);
}

function countSolutions(N, pairs, cap, deadline) {
    const K = pairs.length;
    const E = new Map();
    for (let pid = 0; pid < K; pid++) {
        E.set(pairs[pid][0][0] + ',' + pairs[pid][0][1], pid);
        E.set(pairs[pid][1][0] + ',' + pairs[pid][1][1], pid);
    }
    const occupied = new Set();
    const order = [...Array(K).keys()].sort((a, b) =>
        (Math.abs(pairs[a][0][0] - pairs[a][1][0]) + Math.abs(pairs[a][0][1] - pairs[a][1][1])) -
        (Math.abs(pairs[b][0][0] - pairs[b][1][0]) + Math.abs(pairs[b][0][1] - pairs[b][1][1])));
    let count = 0;

    function key(r, c) { return r + ',' + c; }

    function neighbors(r, c, out) {
        out.length = 0;
        if (r > 0) out.push(r - 1, c);
        if (r < N - 1) out.push(r + 1, c);
        if (c > 0) out.push(r, c - 1);
        if (c < N - 1) out.push(r, c + 1);
        return out;
    }

    function reachable(pid) {
        const ar = pairs[pid][0][0], ac = pairs[pid][0][1];
        const br = pairs[pid][1][0], bc = pairs[pid][1][1];
        const seen = new Set([key(ar, ac)]);
        const q = [[ar, ac]];
        while (q.length) {
            const [r, c] = q.pop();
            for (let d = 0; d < 4; d++) {
                const nr = r + (d === 0 ? -1 : d === 1 ? 1 : 0);
                const nc = c + (d === 2 ? -1 : d === 3 ? 1 : 0);
                if (nr < 0 || nr >= N || nc < 0 || nc >= N) continue;
                const k = key(nr, nc);
                if (seen.has(k) || occupied.has(k)) continue;
                if (E.has(k) && k !== key(br, bc)) continue;
                if (k === key(br, bc)) return true;
                seen.add(k); q.push([nr, nc]);
            }
        }
        return false;
    }

    function dfs(idx, placedInteriors) {
        if (count >= cap) return true;
        if (Date.now() > deadline) return false;
        if (idx === order.length) {
            if (2 * K + placedInteriors === N * N) count++;
            return true;
        }
        const pid = order[idx];
        const ar = pairs[pid][0][0], ac = pairs[pid][0][1];
        const br = pairs[pid][1][0], bc = pairs[pid][1][1];
        const pathArr = [[ar, ac]];
        const pset = new Set([key(ar, ac)]);

        function walk() {
            if (count >= cap) return true;
            if (Date.now() > deadline) return false;
            const r = pathArr[pathArr.length - 1][0];
            const c = pathArr[pathArr.length - 1][1];
            if (r === br && c === bc) {
                if (pathArr.length >= 2) {
                    for (let i = 1; i < pathArr.length - 1; i++) occupied.add(key(pathArr[i][0], pathArr[i][1]));
                    let ok = true;
                    for (let q = idx + 1; q < order.length && ok; q++) ok = reachable(order[q]);
                    let res = ok ? dfs(idx + 1, placedInteriors + pathArr.length - 2) : true;
                    for (let i = 1; i < pathArr.length - 1; i++) occupied.delete(key(pathArr[i][0], pathArr[i][1]));
                    return res;
                }
                return true;
            }
            for (let d = 0; d < 4; d++) {
                const nr = r + (d === 0 ? -1 : d === 1 ? 1 : 0);
                const nc = c + (d === 2 ? -1 : d === 3 ? 1 : 0);
                if (nr < 0 || nr >= N || nc < 0 || nc >= N) continue;
                const k = key(nr, nc);
                if (pset.has(k) || occupied.has(k)) continue;
                if (E.has(k) && k !== key(br, bc)) continue;
                pathArr.push([nr, nc]); pset.add(k);
                const res = walk();
                pathArr.pop(); pset.delete(k);
                if (!res) return false;
            }
            return true;
        }
        return walk();
    }

    const complete = dfs(0, 0);
    return { count, complete };
}

let passed = 0, failed = 0;
for (const lv of levelsData) {
    // Compact format: [i, tier, r, c, pairs, solution]
    const N = lv[2];
    const rawPairs = lv[4];
    const pairs = rawPairs.map(p => [[p[0], p[1]], [p[2], p[3]]]);
    const t0 = Date.now();
    const res = countSolutions(N, pairs, 2, t0 + 240000);
    if (res.count === 1 && res.complete) passed++;
    else {
        failed++;
        console.log(`L${lv[0]}: FAIL solutions=${res.count} complete=${res.complete}`);
    }
}
console.log(`verify_engine.js: ${passed}/${levelsData.length} PASS`);
process.exit(failed === 0 ? 0 : 1);
