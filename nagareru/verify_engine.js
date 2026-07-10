// In-engine verifier: load actual index.html LEVELS data and verify unique solution.
const fs = require('fs');
const path = require('path');

const DIRS = [[-1,0],[1,0],[0,-1],[0,1]];

function loadHtml(html) {
    // Extract LEVELS const from HTML
    const m = html.match(/const LEVELS\s*=\s*(\[.*?\]);/s);
    if (!m) throw new Error('LEVELS not found in HTML');
    // Replace undefined JSON-ish (single quotes) with valid JSON
    let s = m[1];
    // Try parsing directly
    return JSON.parse(s);
}

function solveNagareru(level, timeLimitMs = 5000) {
    const R = level.r, C = level.c;
    const winds = {};
    for (const [r, c, dr, dc] of level.winds) {
        winds[`${r},${c}`] = [dr, dc];
    }
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
            if (windSet.has(nKey)) {
                const wd = winds[nKey];
                if (dr !== wd[0] || dc !== wd[1]) continue;
            }
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
    const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
    const levels = loadHtml(html);
    let pass = 0, fail = 0;
    for (let i = 0; i < levels.length; i++) {
        const L = levels[i];
        const nsol = solveNagareru(L, 8000);
        if (nsol === 1) {
            console.log(`Level ${i+1} (${L.tier}, ${L.r}x${L.c}, ${L.winds.length} winds): UNIQUE ✓`);
            pass++;
        } else {
            console.log(`Level ${i+1} (${L.tier}): ${nsol} solutions (expected 1)`);
            fail++;
        }
    }
    console.log(`\n${pass}/${levels.length} pass, ${fail} fail`);
    process.exit(fail > 0 ? 1 : 0);
}

main();