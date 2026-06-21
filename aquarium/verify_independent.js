// Independent Aquarium verifier — DIFFERENT implementation from gen.py
// Reads levels.json, re-derives row clues from the claimed solution, then
// brute-forces ALL water-level assignments per cage to confirm exactly ONE
// matches the clues. Independent of gen.py's solver logic.
const fs = require('fs');

const data = JSON.parse(fs.readFileSync('levels.json', 'utf8'));
let allOk = true;
let t0 = Date.now();

for (const lvl of data.levels) {
    const { n, cages, rowClues, solution } = lvl;
    // 1. verify claimed solution reproduces the row clues
    const derived = new Array(n).fill(0);
    for (let i = 0; i < cages.length; i++) {
        const h = solution[i];
        for (const [r, c] of cages[i]) {
            if (r >= h) derived[r] += 1;
        }
    }
    const clueMatch = derived.every((v, r) => v === rowClues[r]);

    // 2. enumerate ALL solutions (brute force over cage water-levels)
    //    possible h per cage = [rmin..rmax+1]
    const spans = cages.map(cg => {
        let rmin = Infinity, rmax = -Infinity;
        for (const [r] of cg) { if (r < rmin) rmin = r; if (r > rmax) rmax = r; }
        return [rmin, rmax];
    });
    // per-cage contribution: map h -> rowCountVec (length n)
    const contrib = cages.map((cg, i) => {
        const m = {};
        for (let h = spans[i][0]; h <= spans[i][1] + 1; h++) {
            const vec = new Array(n).fill(0);
            for (const [r] of cg) if (r >= h) vec[r]++;
            m[h] = vec;
        }
        return m;
    });
    const possibleHs = cages.map((cg, i) => {
        const arr = [];
        for (let h = spans[i][0]; h <= spans[i][1] + 1; h++) arr.push(h);
        return arr;
    });

    let nsol = 0;
    let foundSol = null;
    // iterative cartesian product with pruning (avoid recursion limits)
    const cur = new Array(n).fill(0);
    const idx = new Array(cages.length).fill(-1);
    const chosen = new Array(cages.length);
    let ptr = 0;
    idx[0] = -1;
    while (ptr >= 0) {
        idx[ptr]++;
        if (idx[ptr] >= possibleHs[ptr].length) {
            // backtrack: undo whatever was added for this ptr (none yet) and go up
            ptr--;
            if (ptr >= 0) {
                // undo choice at ptr
                const hOld = chosen[ptr];
                const vec = contrib[ptr][hOld];
                for (let r = 0; r < n; r++) cur[r] -= vec[r];
                idx[ptr] = idx[ptr]; // will be incremented next loop
            }
            continue;
        }
        // apply choice at ptr
        const h = possibleHs[ptr][idx[ptr]];
        const vec = contrib[ptr][h];
        let valid = true;
        for (let r = 0; r < n; r++) {
            cur[r] += vec[r];
            if (cur[r] > rowClues[r]) { valid = false; }
        }
        if (valid) {
            chosen[ptr] = h;
            if (ptr === cages.length - 1) {
                // leaf: check exact match
                if (cur.every((v, r) => v === rowClues[r])) {
                    nsol++;
                    if (nsol === 1) foundSol = chosen.slice();
                    if (nsol >= 2) { /* non-unique; stop early */ ptr = -1; break; }
                }
                // undo and continue to next idx at this ptr
                for (let r = 0; r < n; r++) cur[r] -= vec[r];
                // stay at ptr, idx will increment
            } else {
                ptr++;
                idx[ptr] = -1;
            }
        } else {
            // undo the over-budget addition
            for (let r = 0; r < n; r++) cur[r] -= vec[r];
            // loop will increment idx[ptr]
        }
    }

    const uniq = nsol === 1;
    const ok = clueMatch && uniq;
    if (!ok) allOk = false;
    console.log(`L${String(lvl.level).padStart(2)} ${lvl.tier.padEnd(9)} n=${n} cages=${cages.length} clueMatch=${clueMatch} nsol=${nsol} ${ok ? 'OK' : 'FAIL'}`);
}
console.log(`\n${allOk ? '✅ ALL ' + data.levels.length + ' LEVELS UNIQUE+VALID' : '❌ FAILURES DETECTED'} (${Date.now() - t0}ms)`);
process.exit(allOk ? 0 : 1);
