#!/usr/bin/env node
/**
 * Independent Stostone level verifier.
 * Re-implements all rules from scratch (no shared code with gen.py).
 * Verifies: gravity (column count), region clues, connectivity, cross-adjacency.
 */

const fs = require('fs');

const rules = {
    // Rule 1: Shade some cells
    // Rule 2: Number in region = exact shade count; unnumbered = at least 1
    // Rule 3: Shaded cells per region = orthogonally connected
    // Rule 4: No cross-region orthogonal adjacency between shaded cells
    // Rule 5: Each column has exactly N/2 shaded cells (gravity)
};

function neighbors4(i, n) {
    const r = Math.floor(i / n), c = i % n;
    const result = [];
    if (r > 0) result.push(i - n);
    if (r < n - 1) result.push(i + n);
    if (c > 0) result.push(i - 1);
    if (c < n - 1) result.push(i + 1);
    return result;
}

function isConnected(cells, n) {
    if (cells.length <= 1) return true;
    const cs = new Set(cells);
    const visited = new Set([cells[0]]);
    const queue = [cells[0]];
    while (queue.length > 0) {
        const cell = queue.shift();
        for (const ni of neighbors4(cell, n)) {
            if (cs.has(ni) && !visited.has(ni)) {
                visited.add(ni);
                queue.push(ni);
            }
        }
    }
    return visited.size === cells.length;
}

function verifyLevel(level) {
    const { n, nr, g, c, s, tier, lvl } = level;
    const half = n / 2;
    const errors = [];

    // Check grid consistency
    if (g.length !== n * n) {
        errors.push(`Grid size ${g.length} != ${n * n}`);
        return { valid: false, errors };
    }

    // Check all cells have valid region
    for (let i = 0; i < n * n; i++) {
        if (g[i] < 0 || g[i] >= nr) {
            errors.push(`Cell ${i} has invalid region ${g[i]}`);
        }
    }

    // Rule 5: Each column has exactly N/2 shaded cells
    for (let col = 0; col < n; col++) {
        let count = 0;
        for (let row = 0; row < n; row++) {
            if (s[row * n + col] === 1) count++;
        }
        if (count !== half) {
            errors.push(`Column ${col} has ${count} shaded cells, expected ${half}`);
        }
    }

    // Rule 2 + 3: Region clue check and connectivity
    for (let r = 0; r < nr; r++) {
        const regionCells = [];
        const shadedCells = [];
        for (let i = 0; i < n * n; i++) {
            if (g[i] === r) {
                regionCells.push(i);
                if (s[i] === 1) shadedCells.push(i);
            }
        }

        // At least 1 shaded
        if (shadedCells.length === 0) {
            errors.push(`Region ${r} has 0 shaded cells (must have at least 1)`);
        }

        // Clue check
        if (c[r] !== null && c[r] !== undefined) {
            if (shadedCells.length !== c[r]) {
                errors.push(`Region ${r} has ${shadedCells.length} shaded, clue says ${c[r]}`);
            }
        }

        // Connectivity
        if (shadedCells.length > 0 && !isConnected(shadedCells, n)) {
            errors.push(`Region ${r} shaded cells not connected`);
        }
    }

    // Rule 4: No cross-region adjacency
    for (let i = 0; i < n * n; i++) {
        if (s[i] === 1) {
            for (const ni of neighbors4(i, n)) {
                if (g[ni] !== g[i] && s[ni] === 1) {
                    const r1 = Math.floor(i / n), c1 = i % n;
                    const r2 = Math.floor(ni / n), c2 = ni % n;
                    errors.push(`Cross-region adjacency: (${r1},${c1}) reg ${g[i]} <-> (${r2},${c2}) reg ${g[ni]}`);
                }
            }
        }
    }

    return {
        valid: errors.length === 0,
        errors,
        info: `${n}x${n}, ${nr} regions, ${shadedCount(s)} shaded, ${clueCount(c)} clues`
    };
}

function shadedCount(s) {
    return s.filter(x => x === 1).length;
}

function clueCount(c) {
    return c.filter(x => x !== null && x !== undefined).length;
}

// Brute-force uniqueness check (independent implementation)
function checkUnique(level) {
    const { n, nr, g, c } = level;
    const half = n / 2;
    let solutionCount = 0;
    let firstSolution = null;

    // Generate all column patterns (combinations of half rows from n)
    function combinations(arr, k) {
        if (k === 0) return [[]];
        if (arr.length < k) return [];
        const [first, ...rest] = arr;
        return [
            ...combinations(rest, k - 1).map(c => [first, ...c]),
            ...combinations(rest, k)
        ];
    }

    const allPats = combinations([...Array(n).keys()], half);

    // Filter valid patterns per column (no same-column cross-region adjacency)
    const colPats = [];
    const colPatRegions = [];
    for (let col = 0; col < n; col++) {
        const valid = [];
        const regions = [];
        for (const pat of allPats) {
            let ok = true;
            for (const r of pat) {
                const cell = r * n + col;
                const rid = g[cell];
                if (pat.includes(r - 1)) {
                    if (g[(r - 1) * n + col] !== rid) { ok = false; break; }
                }
            }
            if (ok) {
                valid.push(pat);
                const deltas = {};
                for (const r of pat) {
                    const rid = g[r * n + col];
                    deltas[rid] = (deltas[rid] || 0) + 1;
                }
                regions.push(deltas);
            }
        }
        colPats.push(valid);
        colPatRegions.push(regions);
    }

    function crossOK(col, pat, prevPat) {
        for (const r of pat) {
            if (prevPat.includes(r)) {
                if (g[r * n + (col - 1)] !== g[r * n + col]) return false;
            }
        }
        return true;
    }

    const regionCells = [];
    for (let r = 0; r < nr; r++) regionCells.push([]);
    for (let i = 0; i < n * n; i++) regionCells[g[i]].push(i);

    function checkFinal(shade) {
        for (let r = 0; r < nr; r++) {
            const shaded = regionCells[r].filter(i => shade[i] === 1);
            if (shaded.length === 0) return false;
            if (c[r] !== null && c[r] !== undefined && shaded.length !== c[r]) return false;
            if (!isConnected(shaded, n)) return false;
        }
        return true;
    }

    function backtrack(col, regCounts, prevPat, shade) {
        if (solutionCount >= 2) return;
        if (col >= n) {
            if (checkFinal(shade)) {
                solutionCount++;
                if (!firstSolution) firstSolution = [...shade];
            }
            return;
        }

        for (let pi = 0; pi < colPats[col].length; pi++) {
            const pat = colPats[col][pi];
            if (col > 0 && !crossOK(col, pat, prevPat)) continue;

            const deltas = colPatRegions[col][pi];
            const newCounts = [...regCounts];
            let ok = true;
            for (const [rid, delta] of Object.entries(deltas)) {
                newCounts[rid] += delta;
                if (c[rid] !== null && c[rid] !== undefined && newCounts[rid] > c[rid]) {
                    ok = false; break;
                }
            }
            if (!ok) continue;

            // Future feasibility
            const remaining = n - col - 1;
            for (let r = 0; r < nr; r++) {
                if (c[r] !== null && c[r] !== undefined) {
                    const need = c[r] - newCounts[r];
                    if (need < 0 || need > remaining * half) { ok = false; break; }
                }
            }
            if (!ok) continue;

            for (const r of pat) shade[r * n + col] = 1;
            backtrack(col + 1, newCounts, pat, shade);
            for (const r of pat) shade[r * n + col] = 0;
        }
    }

    backtrack(0, new Array(nr).fill(0), null, new Array(n * n).fill(0));
    return { count: solutionCount, unique: solutionCount === 1 };
}

// Main
const data = JSON.parse(fs.readFileSync('stostone/levels.json', 'utf8'));
const levels = data.levels || data;

console.log(`Verifying ${levels.length} Stostone levels...\n`);

let allValid = true;
let allUnique = true;

for (const level of levels) {
    const result = verifyLevel(level);
    const tierName = `${level.tier} L${level.lvl}`;
    const n = level.n;

    if (result.valid) {
        const uniq = checkUnique(level);
        if (uniq.unique) {
            console.log(`✅ ${tierName} (${n}x${n}, ${level.nr} regions, ${clueCount(level.c)} clues): VALID + UNIQUE`);
        } else {
            console.log(`❌ ${tierName} (${n}x${n}): VALID but ${uniq.count} solutions (NOT UNIQUE)`);
            allUnique = false;
        }
    } else {
        console.log(`❌ ${tierName} (${n}x${n}): INVALID`);
        for (const err of result.errors) {
            console.log(`   ${err}`);
        }
        allValid = false;
    }
}

console.log();
if (allValid && allUnique) {
    console.log(`✅ ALL ${levels.length} LEVELS PASS (valid + unique)`);
} else {
    if (!allValid) console.log(`❌ Some levels are INVALID`);
    if (!allUnique) console.log(`❌ Some levels are NOT UNIQUE`);
    process.exit(1);
}
