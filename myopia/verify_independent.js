// verify_independent.js — Independent Node.js verifier for Myopia levels
// Re-checks: (1) edges form single simple cycle, (2) clues match nearest-segment logic
const fs = require('fs');

const levels = JSON.parse(fs.readFileSync('myopia/levels.json', 'utf8'));

function verifyLevel(lvl) {
    const R = lvl.rows, C = lvl.cols;
    const edges = lvl.edges;
    const clues = lvl.clues;

    // Build edge set
    const eset = new Set();
    for (const e of edges) {
        const [a, b] = e;
        const dr = Math.abs(a[0] - b[0]), dc = Math.abs(a[1] - b[1]);
        if (!((dr === 1 && dc === 0) || (dr === 0 && dc === 1))) {
            return `Non-adjacent edge: ${a}-${b}`;
        }
        const key = a[0] < b[0] || (a[0] === b[0] && a[1] < b[1])
            ? `${a[0]},${a[1]},${b[0]},${b[1]}`
            : `${b[0]},${b[1]},${a[0]},${a[1]}`;
        eset.add(key);
    }

    // Check single simple cycle: every vertex degree 2
    const degree = {};
    const adj = {};
    for (const e of edges) {
        const [a, b] = e;
        const ak = `${a[0]},${a[1]}`, bk = `${b[0]},${b[1]}`;
        degree[ak] = (degree[ak] || 0) + 1;
        degree[bk] = (degree[bk] || 0) + 1;
        if (!adj[ak]) adj[ak] = [];
        if (!adj[bk]) adj[bk] = [];
        adj[ak].push(bk);
        adj[bk].push(ak);
    }
    for (const [v, d] of Object.entries(degree)) {
        if (d !== 2) return `Vertex ${v} has degree ${d}`;
    }

    // Connected?
    const vertices = Object.keys(degree);
    if (vertices.length === 0) return 'No edges';
    const visited = new Set();
    const queue = [vertices[0]];
    visited.add(vertices[0]);
    while (queue.length > 0) {
        const v = queue.shift();
        for (const nb of (adj[v] || [])) {
            if (!visited.has(nb)) {
                visited.add(nb);
                queue.push(nb);
            }
        }
    }
    if (visited.size !== vertices.length) {
        return `Not connected: ${visited.size}/${vertices.length}`;
    }

    // Build h_edges and v_edges
    const hEdges = new Set(); // (vr, vc)
    const vEdges = new Set(); // (vr, vc)
    for (const e of edges) {
        const [a, b] = e;
        if (a[0] === b[0]) {
            const vc = Math.min(a[1], b[1]);
            hEdges.add(`${a[0]},${vc}`);
        } else {
            const vr = Math.min(a[0], b[0]);
            vEdges.add(`${vr},${a[1]}`);
        }
    }

    // Verify clues
    for (const [key, dirs] of Object.entries(clues)) {
        const [r, c] = key.split(',').map(Number);
        const dists = [null, null, null, null]; // up, down, left, right

        // UP
        for (let vr = r; vr >= 0; vr--) {
            if (hEdges.has(`${vr},${c}`)) { dists[0] = r - vr + 1; break; }
        }
        // DOWN
        for (let vr = r + 1; vr <= R; vr++) {
            if (hEdges.has(`${vr},${c}`)) { dists[1] = vr - r; break; }
        }
        // LEFT
        for (let vc = c; vc >= 0; vc--) {
            if (vEdges.has(`${r},${vc}`)) { dists[2] = c - vc + 1; break; }
        }
        // RIGHT
        for (let vc = c + 1; vc <= C; vc++) {
            if (vEdges.has(`${r},${vc}`)) { dists[3] = vc - c; break; }
        }

        const valid = [];
        for (let i = 0; i < 4; i++) if (dists[i] !== null) valid.push([dists[i], i]);
        if (valid.length === 0) return `Cell (${r},${c}): no edges found`;
        const minD = Math.min(...valid.map(v => v[0]));
        const expected = valid.filter(v => v[0] === minD).map(v => v[1]).sort((a,b)=>a-b);
        const actual = [...dirs].sort((a,b)=>a-b);
        if (JSON.stringify(expected) !== JSON.stringify(actual)) {
            return `Cell (${r},${c}): expected [${expected}], got [${actual}]`;
        }
    }
    return 'OK';
}

let allOk = true;
for (const lvl of levels) {
    const res = verifyLevel(lvl);
    const status = res === 'OK' ? '✅' : '❌';
    console.log(`${status} Level ${lvl.level} (${lvl.tier}): ${res}`);
    if (res !== 'OK') allOk = false;
}
console.log(`\n${allOk ? 'ALL PASS' : 'SOME FAILED'}: ${levels.length} levels`);
process.exit(allOk ? 0 : 1);
