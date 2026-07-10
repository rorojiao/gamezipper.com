// Independent Node.js verifier for Nagareru levels.
// Reimplements Ham cycle + solver without any Python deps.
// Reads levels.json and verifies each level has exactly one solution.
const fs = require('fs');

const DIRS = [[-1,0],[1,0],[0,-1],[0,1]];

function loadNxt(level) {
    const nxt = {};
    for (const [r, c, nr, nc] of level.loop) {
        nxt[`${r},${c}`] = [nr, nc];
    }
    return nxt;
}

function loadWinds(level) {
    const winds = {};
    for (const [r, c, dr, dc] of level.winds) {
        winds[`${r},${c}`] = [dr, dc];
    }
    return winds;
}

function verifyLoop(level) {
    const R = level.rows, C = level.cols;
    const nxt = loadNxt(level);
    // Check len
    if (Object.keys(nxt).length !== R*C) return false;
    // Check adjacency
    for (const k in nxt) {
        const [r, c] = k.split(',').map(Number);
        const [nr, nc] = nxt[k];
        if (Math.abs(nr-r) + Math.abs(nc-c) !== 1) return false;
    }
    // Check cycle
    let cur = '0,0'; const visited = new Set();
    for (let i = 0; i < R*C+1; i++) {
        visited.add(cur); cur = nxt[cur].join(',');
        if (cur === '0,0') break;
    }
    return visited.size === R*C;
}

function solveNagareru(level, timeLimitMs = 5000) {
    const R = level.rows, C = level.cols;
    const winds = loadWinds(level);
    const windSet = new Set(Object.keys(winds));

    // Compute wind bands
    const windBands = {};
    for (const k in winds) {
        const [wr, wc] = k.split(',').map(Number);
        const [dr, dc] = winds[k];
        const band = new Set();
        let r = wr+dr, c = wc+dc;
        while (r>=0 && r<R && c>=0 && c<C && !windSet.has(`${r},${c}`)) {
            band.add(`${r},${c}`);
            r += dr; c += dc;
        }
        windBands[k] = [dr, dc, band];
    }

    let solutionsCount = 0;
    const startTime = Date.now();

    function dfs(cur, visited, path) {
        if (Date.now() - startTime > timeLimitMs) return false;
        if (solutionsCount >= 2) return false;
        if (visited.size === R*C) {
            const [r, c] = cur.split(',').map(Number);
            if (Math.abs(0-r)+Math.abs(0-c) === 1) {
                solutionsCount++;
                return true;
            }
            return false;
        }
        const [r, c] = cur.split(',').map(Number);
        const candidates = [];
        for (const [dr, dc] of DIRS) {
            const nr = r+dr, nc = c+dc;
            if (nr<0 || nr>=R || nc<0 || nc>=C) continue;
            const nKey = `${nr},${nc}`;
            if (visited.has(nKey)) continue;
            // wind cell entry
            if (windSet.has(nKey)) {
                const wd = winds[nKey];
                if (dr !== wd[0] || dc !== wd[1]) continue;
            }
            // wind band check
            let bad = false;
            for (const k in windBands) {
                const [wdr, wdc, band] = windBands[k];
                if (band.has(nKey)) {
                    if (dr === -wdr && dc === -wdc) { bad = true; break; }
                    if (dr !== wdr || dc !== wdc) {
                        const nextR = nr + wdr, nextC = nc + wdc;
                        if (nextR<0 || nextR>=R || nextC<0 || nextC>=C || windSet.has(`${nextR},${nextC}`)) {
                            bad = true; break;
                        }
                    }
                    break;
                }
            }
            if (bad) continue;
            candidates.push([nr, nc, dr, dc]);
        }
        // Warnsdorff
        candidates.sort((a,b) => {
            const da = DIRS.reduce((acc, [ddx, ddy]) => {
                const nr = a[0]+ddx, nc = a[1]+ddy;
                if (nr<0||nr>=R||nc<0||nc>=C) return acc;
                return acc + (visited.has(`${nr},${nc}`) ? 0 : 1);
            }, 0);
            const db = DIRS.reduce((acc, [ddx, ddy]) => {
                const nr = b[0]+ddx, nc = b[1]+ddy;
                if (nr<0||nr>=R||nc<0||nc>=C) return acc;
                return acc + (visited.has(`${nr},${nc}`) ? 0 : 1);
            }, 0);
            return db - da;
        });
        for (const [nr, nc, dr, dc] of candidates) {
            const nKey = `${nr},${nc}`;
            visited.add(nKey); path.push([nr, nc]);
            if (dfs(nKey, visited, path)) return true;
            path.pop(); visited.delete(nKey);
        }
        return false;
    }

    dfs('0,0', new Set(['0,0']), [[0,0]]);
    return solutionsCount;
}

function main() {
    const levels = JSON.parse(fs.readFileSync('levels.json', 'utf8'));
    let pass = 0, fail = 0;
    for (let i = 0; i < levels.length; i++) {
        const L = levels[i];
        const validLoop = verifyLoop(L);
        if (!validLoop) {
            console.log(`Level ${i+1} (${L.tier_name}): BAD LOOP`);
            fail++; continue;
        }
        const nsol = solveNagareru(L, 10000);
        if (nsol === 1) {
            console.log(`Level ${i+1} (${L.tier_name}, ${L.rows}x${L.cols}, ${L.winds.length} winds): UNIQUE ✓`);
            pass++;
        } else {
            console.log(`Level ${i+1} (${L.tier_name}): ${nsol} solutions (expected 1)`);
            fail++;
        }
    }
    console.log(`\n${pass}/${levels.length} pass, ${fail} fail`);
    process.exit(fail > 0 ? 1 : 0);
}

main();