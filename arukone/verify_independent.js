#!/usr/bin/env node
/**
 * Arukone verifier — independent implementation (R1191 rewrite).
 * Reads arukone/levels.json (NOT index.html) and verifies each level is solvable
 * with a unique solution under strict chain semantics: pair = simple orthogonal
 * path A->B, no crossing/stepping on other pairs' clue cells, full W*H coverage.
 * Different data source + driver from verify_engine.js for cross-validation.
 * Timeout => incomplete => FAIL (never a proof).
 */
const fs = require('fs');
const path = require('path');

function countSolutions(N, pairs, cap, deadline) {
    const K = pairs.length;
    const E = new Map();
    const key = (r, c) => r + ',' + c;
    for (let pid = 0; pid < K; pid++) {
        E.set(key(pairs[pid][0][0], pairs[pid][0][1]), pid);
        E.set(key(pairs[pid][1][0], pairs[pid][1][1]), pid);
    }
    const occupied = new Set();
    const order = [...Array(K).keys()].sort((a, b) =>
        (Math.abs(pairs[a][0][0] - pairs[a][1][0]) + Math.abs(pairs[a][0][1] - pairs[a][1][1])) -
        (Math.abs(pairs[b][0][0] - pairs[b][1][0]) + Math.abs(pairs[b][0][1] - pairs[b][1][1])));
    let count = 0;

    function nbrs(r, c) {
        const out = [];
        if (r > 0) out.push([r - 1, c]);
        if (r < N - 1) out.push([r + 1, c]);
        if (c > 0) out.push([r, c - 1]);
        if (c < N - 1) out.push([r, c + 1]);
        return out;
    }

    function reachable(pid) {
        const [a, b] = pairs[pid];
        const tk = key(b[0], b[1]);
        const seen = new Set([key(a[0], a[1])]);
        const stack = [[a[0], a[1]]];
        while (stack.length) {
            const [r, c] = stack.pop();
            for (const [nr, nc] of nbrs(r, c)) {
                const k = key(nr, nc);
                if (seen.has(k) || occupied.has(k)) continue;
                if (E.has(k) && k !== tk) continue;
                if (k === tk) return true;
                seen.add(k); stack.push([nr, nc]);
            }
        }
        return false;
    }

    function dfs(idx, interiors) {
        if (count >= cap) return true;
        if (Date.now() > deadline) return false;
        if (idx === K) {
            if (2 * K + interiors === N * N) count++;
            return true;
        }
        const pid = order[idx];
        const [a, b] = pairs[pid];
        const cur = [a];
        const inPath = new Set([key(a[0], a[1])]);
        function walk() {
            if (count >= cap) return true;
            if (Date.now() > deadline) return false;
            const [r, c] = cur[cur.length - 1];
            if (r === b[0] && c === b[1]) {
                if (cur.length >= 2) {
                    const added = [];
                    for (let i = 1; i < cur.length - 1; i++) { const k = key(cur[i][0], cur[i][1]); occupied.add(k); added.push(k); }
                    let ok = true;
                    for (let q = idx + 1; q < K && ok; q++) ok = reachable(order[q]);
                    const res = ok ? dfs(idx + 1, interiors + cur.length - 2) : true;
                    for (const k of added) occupied.delete(k);
                    return res;
                }
                return true;
            }
            for (const [nr, nc] of nbrs(r, c)) {
                const k = key(nr, nc);
                if (inPath.has(k) || occupied.has(k)) continue;
                if (E.has(k) && k !== key(b[0], b[1])) continue;
                cur.push([nr, nc]); inPath.add(k);
                const res = walk();
                cur.pop(); inPath.delete(k);
                if (!res) return false;
            }
            return true;
        }
        return walk();
    }

    const complete = dfs(0, 0);
    return { count, complete };
}

function main() {
    const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'levels.json'), 'utf-8'));
    const levels = data.levels;
    if (!Array.isArray(levels) || levels.length === 0) {
        console.error('EMPTY_LEVELS');
        process.exit(1);
    }
    let passed = 0, failed = 0;
    for (const lv of levels) {
        const N = lv.r;
        if (N !== lv.c) { console.log(`L${lv.i}: FAIL non-square`); failed++; continue; }
        const pairs = lv.p.map(p => [[p[0][0], p[0][1]], [p[1][0], p[1][1]]]);
        const t0 = Date.now();
        const res = countSolutions(N, pairs, 2, t0 + 240000);
        if (res.count === 1 && res.complete) passed++;
        else {
            failed++;
            console.log(`L${lv.i}: FAIL solutions=${res.count} complete=${res.complete}`);
        }
    }
    console.log(`verify_independent.js: ${passed}/${levels.length} PASS`);
    process.exit(failed === 0 ? 0 : 1);
}
main();
