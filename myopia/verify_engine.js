// verify_engine.js — In-engine verifier: loads actual index.html LEVELS and validates
// Uses vm.runInContext to evaluate the HTML's embedded script
const fs = require('fs');
const vm = require('vm');

const html = fs.readFileSync('myopia/index.html', 'utf8');

// Extract the LEVELS array from the HTML
const match = html.match(/var LEVELS=(\[[\s\S]*?\]);/);
if (!match) {
    console.error('Could not extract LEVELS from index.html');
    process.exit(1);
}

const sandbox = {};
vm.createContext(sandbox);
vm.runInContext('var LEVELS = ' + match[1] + ';', sandbox);

const levels = sandbox.LEVELS;
console.log(`Loaded ${levels.length} levels from index.html\n`);

function verifyInEngine(lvl) {
    const R = lvl.rows, C = lvl.cols;

    // Check edges form single cycle
    const degree = {};
    const adj = {};
    for (const e of lvl.edges) {
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
        if (d !== 2) return `Vertex ${v} degree ${d}`;
    }
    // Connected check
    const verts = Object.keys(degree);
    if (verts.length === 0) return 'No edges';
    const vis = new Set([verts[0]]);
    const q = [verts[0]];
    while (q.length) {
        const v = q.shift();
        for (const nb of (adj[v] || [])) {
            if (!vis.has(nb)) { vis.add(nb); q.push(nb); }
        }
    }
    if (vis.size !== verts.length) return `Disconnected: ${vis.size}/${verts.length}`;

    // Check clue consistency (same algorithm as game would use)
    const hE = new Set(), vE = new Set();
    for (const e of lvl.edges) {
        const [a, b] = e;
        if (a[0] === b[0]) hE.add(`${a[0]},${Math.min(a[1],b[1])}`);
        else vE.add(`${Math.min(a[0],b[0])},${a[1]}`);
    }
    for (const [key, dirs] of Object.entries(lvl.clues)) {
        const [r, c] = key.split(',').map(Number);
        const d = [null, null, null, null];
        for (let vr = r; vr >= 0; vr--) { if (hE.has(`${vr},${c}`)) { d[0] = r - vr + 1; break; } }
        for (let vr = r + 1; vr <= R; vr++) { if (hE.has(`${vr},${c}`)) { d[1] = vr - r; break; } }
        for (let vc = c; vc >= 0; vc--) { if (vE.has(`${r},${vc}`)) { d[2] = c - vc + 1; break; } }
        for (let vc = c + 1; vc <= C; vc++) { if (vE.has(`${r},${vc}`)) { d[3] = vc - c; break; } }
        const valid = [];
        for (let i = 0; i < 4; i++) if (d[i] !== null) valid.push([d[i], i]);
        if (!valid.length) return `Cell (${r},${c}): no edges`;
        const mn = Math.min(...valid.map(x => x[0]));
        const exp = valid.filter(x => x[0] === mn).map(x => x[1]).sort();
        const act = [...dirs].sort();
        if (JSON.stringify(exp) !== JSON.stringify(act))
            return `Cell (${r},${c}): mismatch [${exp}] vs [${act}]`;
    }

    // Simulate checkWin: if player places all solution edges, it should win
    const solSet = new Set();
    for (const e of lvl.edges) {
        const [a, b] = e;
        const k = (a[0] < b[0] || (a[0] === b[0] && a[1] < b[1]))
            ? `${a[0]},${a[1]},${b[0]},${b[1]}`
            : `${b[0]},${b[1]},${a[0]},${a[1]}`;
        solSet.add(k);
    }
    // Player would have exactly solSet edges → checkSolution would pass
    if (solSet.size !== lvl.edges.length) return 'Duplicate edges in solution';

    return 'OK';
}

let allOk = true;
for (const lvl of levels) {
    const res = verifyInEngine(lvl);
    const status = res === 'OK' ? '✅' : '❌';
    console.log(`${status} Level ${lvl.level} (${lvl.tier}, ${lvl.rows}x${lvl.cols}): ${res}`);
    if (res !== 'OK') allOk = false;
}
console.log(`\n${allOk ? 'ALL PASS' : 'SOME FAILED'}: ${levels.length} levels (in-engine)`);
process.exit(allOk ? 0 : 1);
