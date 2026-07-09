// In-engine verifier: loads index.html, extracts LEVELS, verifies checkWin logic
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

// Extract LEVELS
const m = html.match(/const LEVELS\s*=\s*(\[[\s\S]*?\]);/);
if (!m) { console.error('Cannot extract LEVELS'); process.exit(1); }
const LEVELS = JSON.parse(m[1]);

const DIRS4 = [[-1,0],[1,0],[0,-1],[0,1]];

function blackEndpoints(R, C, grid, dirs, br, bc) {
    let count = 0;
    for (const [dr, dc] of DIRS4) {
        const nr = br + dr, nc = bc + dc;
        if (nr < 0 || nr >= R || nc < 0 || nc >= C) continue;
        if (grid[nr][nc] === 1) continue;
        const pd = dirs[nr][nc];
        if (dc !== 0 && pd === 'H') count++;
        if (dr !== 0 && pd === 'V') count++;
    }
    return count;
}

function computeSegments(R, C, grid, dirs) {
    const visited = Array(R).fill(null).map(() => new Array(C).fill(false));
    const segments = [];
    const segIds = Array(R).fill(null).map(() => new Array(C).fill(-1));
    for (let r = 0; r < R; r++) {
        for (let c = 0; c < C; c++) {
            if (grid[r][c] === 1 || visited[r][c]) continue;
            const d = dirs[r][c];
            if (!d || d === '?') continue;
            const seg = [];
            if (d === 'H') {
                let cc = c;
                while (cc >= 0 && grid[r][cc] === 0 && dirs[r][cc] === 'H') cc--;
                cc++;
                while (cc < C && grid[r][cc] === 0 && dirs[r][cc] === 'H') { seg.push([r, cc]); cc++; }
            } else {
                let rr = r;
                while (rr >= 0 && grid[rr][c] === 0 && dirs[rr][c] === 'V') rr--;
                rr++;
                while (rr < R && grid[rr][c] === 0 && dirs[rr][c] === 'V') { seg.push([rr, c]); rr++; }
            }
            const sid = segments.length;
            for (const [sr, sc] of seg) { visited[sr][sc] = true; segIds[sr][sc] = sid; }
            segments.push(seg);
        }
    }
    return { segments, segIds };
}

// Exact replica of engine's checkWin function
function checkWin(level, playerDirs) {
    const R = level.rows, C = level.cols;
    const grid = level.grid;
    
    for (let r = 0; r < R; r++) {
        for (let c = 0; c < C; c++) {
            if (grid[r][c] === 0 && playerDirs[r][c] === '?') return false;
        }
    }
    
    const { segments, segIds } = computeSegments(R, C, grid, playerDirs);
    
    for (const [r, c, v] of level.whiteClues) {
        const sid = segIds[r][c];
        if (sid < 0) return false;
        if (segments[sid].length !== v) return false;
    }
    
    const seenSeg = {};
    for (const [r, c] of level.whiteClues) {
        const sid = segIds[r][c];
        if (seenSeg[sid]) return false;
        seenSeg[sid] = true;
    }
    
    for (const [r, c, v] of level.blackClues) {
        if (blackEndpoints(R, C, grid, playerDirs, r, c) !== v) return false;
    }
    
    return true;
}

let pass = 0, fail = 0;
for (let i = 0; i < LEVELS.length; i++) {
    const lvl = LEVELS[i];
    const sol = lvl.solution;
    
    const playerDirs = [];
    for (let r = 0; r < lvl.rows; r++) {
        playerDirs.push([]);
        for (let c = 0; c < lvl.cols; c++) {
            playerDirs[r].push(sol[r][c] || '?');
        }
    }
    
    const win = checkWin(lvl, playerDirs);
    if (win) {
        pass++;
        console.log(`L${i+1} ${lvl.rows}x${lvl.cols} ENGINE PASS`);
    } else {
        fail++;
        console.log(`L${i+1} ${lvl.rows}x${lvl.cols} ENGINE FAIL`);
    }
}

console.log(`\n${pass}/${LEVELS.length} engine-verified, ${fail} fail`);
process.exit(fail > 0 ? 1 : 0);
