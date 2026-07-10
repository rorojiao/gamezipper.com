// Playtest: replay solution through engine logic to verify checkWin works.
const fs = require('fs');
const path = require('path');

const DIRS = [[-1,0],[1,0],[0,-1],[0,1]];

function loadHtml(html) {
    const m = html.match(/const LEVELS\s*=\s*(\[.*?\]);/s);
    if (!m) throw new Error('LEVELS not found');
    return JSON.parse(m[1]);
}

// Simulate the engine's checkValidStep
function checkValidStep(fromR, fromC, toR, toC, R, C, windCells, windBands) {
    const toKey = `${toR},${toC}`;
    if (windCells[toKey]) {
        const [wdr, wdc] = windCells[toKey];
        const dr = toR-fromR, dc = toC-fromC;
        if (dr !== wdr || dc !== wdc) return false;
    }
    const dr = toR-fromR, dc = toC-fromC;
    for (const k in windBands) {
        const [wdr, wdc, band] = windBands[k];
        if (band.has(toKey)) {
            if (dr === -wdr && dc === -wdc) return false;
            if (dr !== wdr || dc !== wdc) {
                const nr = toR+wdr, nc = toC+wdc;
                if (nr<0 || nr>=R || nc<0 || nc>=C) return false;
                if (windCells[`${nr},${nc}`]) return false;
            }
            break;
        }
    }
    return true;
}

function playtest(level) {
    const R = level.r, C = level.c;
    const winds = {};
    for (const [r, c, dr, dc] of level.winds) {
        winds[`${r},${c}`] = [dr, dc];
    }
    const windBands = {};
    for (const k in winds) {
        const [wr, wc] = k.split(',').map(Number);
        const [dr, dc] = winds[k];
        const band = new Set();
        let r = wr+dr, c = wc+dc;
        while (r>=0 && r<R && c>=0 && c<C && !winds[`${r},${c}`]) {
            band.add(`${r},${c}`);
            r += dr; c += dc;
        }
        windBands[k] = [dr, dc, band];
    }

    const sol = level.sol;
    let valid = true;
    let visited = new Set();
    visited.add('0,0');

    for (let i = 1; i < sol.length; i++) {
        const [fr, fc] = sol[i-1];
        const [tr, tc] = sol[i];
        const dr = tr-fr, dc = tc-fc;
        if (Math.abs(dr)+Math.abs(dc) !== 1) { valid = false; break; }
        if (visited.has(`${tr},${tc}`)) { valid = false; break; }
        if (!checkValidStep(fr, fc, tr, tc, R, C, winds, windBands)) { valid = false; break; }
        visited.add(`${tr},${tc}`);
    }
    // Check closure
    if (valid) {
        const [lr, lc] = sol[sol.length-1];
        if (Math.abs(lr-0)+Math.abs(lc-0) !== 1) valid = false;
    }
    // Check coverage
    if (valid && visited.size !== R*C) valid = false;
    return valid;
}

function main() {
    const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
    const levels = loadHtml(html);
    let pass = 0, fail = 0;
    for (let i = 0; i < levels.length; i++) {
        const L = levels[i];
        const ok = playtest(L);
        if (ok) {
            console.log(`Level ${i+1} (${L.tier}): playtest OK`);
            pass++;
        } else {
            console.log(`Level ${i+1} (${L.tier}): playtest FAILED`);
            fail++;
        }
    }
    console.log(`\n${pass}/${levels.length} pass, ${fail} fail`);
    process.exit(fail > 0 ? 1 : 0);
}

main();