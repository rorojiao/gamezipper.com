// Phase 6: Independent Node.js BFS verification for Tile Paint levels
// Verifies uniqueness: each puzzle has EXACTLY 1 solution
const fs = require('fs');

const html = fs.readFileSync('/home/msdn/gamezipper.com/tile-paint/index.html', 'utf8');
const m = html.match(/var LEVELS=(\[.*?\]);/);
if (!m) { console.log('ERROR: No LEVELS data found'); process.exit(1); }
const LEVELS = JSON.parse(m[1]);

function solveCount(rowClues, colClues, limit) {
    limit = limit || 2;
    const rows = rowClues.length;
    const cols = colClues.length;

    // Precompute row patterns
    const rowPatterns = [];
    for (let r = 0; r < rows; r++) {
        const rc = rowClues[r];
        if (rc > cols) return 0;
        const patterns = [];
        // Generate combinations using recursive
        function gen(start, remaining, mask) {
            if (remaining === 0) { patterns.push(mask); return; }
            for (let i = start; i <= cols - remaining; i++) {
                gen(i + 1, remaining - 1, mask | (1 << i));
            }
        }
        gen(0, rc, 0);
        rowPatterns.push(patterns);
    }

    const colCounts = new Array(cols).fill(0);
    let solutions = 0;

    function backtrack(r) {
        if (solutions >= limit) return;
        if (r === rows) {
            for (let c = 0; c < cols; c++) {
                if (colCounts[c] !== colClues[c]) return;
            }
            solutions++;
            return;
        }
        const remainingRows = rows - r - 1;
        for (const mask of rowPatterns[r]) {
            if (solutions >= limit) return;
            let feasible = true;
            for (let c = 0; c < cols; c++) {
                if (mask & (1 << c)) colCounts[c]++;
                if (colCounts[c] > colClues[c]) feasible = false;
                else if (colCounts[c] + remainingRows < colClues[c]) feasible = false;
            }
            if (feasible) backtrack(r + 1);
            for (let c = 0; c < cols; c++) {
                if (mask & (1 << c)) colCounts[c]--;
            }
        }
    }
    backtrack(0);
    return solutions;
}

console.log('Verifying ' + LEVELS.length + ' levels...\n');

let allValid = true;
let allUnique = true;

for (let i = 0; i < LEVELS.length; i++) {
    const lv = LEVELS[i];
    const tier = Math.floor(i / 6) + 1;

    // 1. Verify clue consistency
    let rowOk = true, colOk = true;
    for (let r = 0; r < lv.rows; r++) {
        let cnt = 0;
        for (let c = 0; c < lv.cols; c++) cnt += lv.solution[r * lv.cols + c];
        if (cnt !== lv.rowClues[r]) rowOk = false;
    }
    for (let c = 0; c < lv.cols; c++) {
        let cnt = 0;
        for (let r = 0; r < lv.rows; r++) cnt += lv.solution[r * lv.cols + c];
        if (cnt !== lv.colClues[c]) colOk = false;
    }

    // 2. Verify uniqueness
    const count = solveCount(lv.rowClues, lv.colClues, 2);
    const unique = (count === 1);

    const status = (rowOk && colOk && unique) ? 'OK' : 'FAIL';
    if (status === 'FAIL') { allValid = false; allUnique = false; }

    console.log('L' + (i+1) + ' T' + tier + ' ' + lv.rows + 'x' + lv.cols +
        ' clues=' + (rowOk&&colOk ? 'OK' : 'MISMATCH') +
        ' unique=' + (unique ? 'YES('+count+')' : 'NO('+count+')') +
        ' ' + status);
}

console.log('\n=== RESULT ===');
console.log('Levels: ' + LEVELS.length + '/30');
console.log('Clue consistency: ' + (allValid ? 'ALL OK' : 'HAS MISMATCH'));
console.log('Uniqueness: ' + (allUnique ? 'ALL UNIQUE' : 'HAS DUPLICATES'));
console.log(allValid && allUnique ? 'ALL PASS' : 'SOME FAILED');
