// verify_engine.js — In-engine structural verification
// Extracts LEVELS array from index.html source text and validates structure
const fs = require('fs');

const html = fs.readFileSync('/home/msdn/gamezipper.com/statue-park/index.html', 'utf8');

// Extract LEVELS JSON from the source (it's inside an IIFE so can't use VM eval)
const levelsMatch = html.match(/LEVELS=(\[\{[\s\S]*?\}\]);/);
if (!levelsMatch) {
    console.log('ERROR: Cannot extract LEVELS array from index.html');
    process.exit(1);
}

let LEVELS;
try {
    LEVELS = JSON.parse(levelsMatch[1]);
} catch (e) {
    console.log('ERROR: LEVELS JSON parse failed: ' + e.message);
    process.exit(1);
}

console.log('LEVELS loaded: ' + LEVELS.length + ' levels');

// Verify each level has required fields and valid data
let allOk = true;
for (const lv of LEVELS) {
    const issues = [];
    if (!lv.R || !lv.C) issues.push('MISSING R/C');
    if (!lv.shapes || lv.shapes.length === 0) issues.push('MISSING shapes');
    if (!lv.black || lv.black.length === 0) issues.push('MISSING black');
    if (!lv.white || lv.white.length === 0) issues.push('MISSING white');
    if (!lv.tier) issues.push('MISSING tier');
    
    // Validate cells within grid bounds
    for (const [r, c] of lv.black) {
        if (r < 0 || r >= lv.R || c < 0 || c >= lv.C) issues.push('BLACK OUT OF BOUNDS: ' + r + ',' + c);
    }
    for (const [r, c] of lv.white) {
        if (r < 0 || r >= lv.R || c < 0 || c >= lv.C) issues.push('WHITE OUT OF BOUNDS: ' + r + ',' + c);
    }
    
    // Check no overlap between black and white
    const blackSet = new Set(lv.black.map(c => c[0] + ',' + c[1]));
    for (const [r, c] of lv.white) {
        if (blackSet.has(r + ',' + c)) issues.push('OVERLAP at ' + r + ',' + c);
    }
    
    // Verify solution exists
    if (!lv.solution || lv.solution.length !== 5) issues.push('MISSING/INVALID solution');
    
    if (issues.length > 0) {
        allOk = false;
        console.log('L' + lv.id + ' ' + lv.tier + ': ' + issues.join(', '));
    }
}

// Verify tier distribution
const tiers = {};
LEVELS.forEach(lv => { tiers[lv.tier] = (tiers[lv.tier] || 0) + 1; });
console.log('\nTier distribution:');
Object.keys(tiers).forEach(t => console.log('  ' + t + ': ' + tiers[t]));

// Verify shape names
const allShapes = new Set();
LEVELS.forEach(lv => lv.shapes.forEach(s => allShapes.add(s)));
console.log('\nShapes used: ' + Array.from(allShapes).join(', '));

console.log('\n' + (allOk ? 'ALL LEVELS STRUCTURALLY VALID ✓' : 'SOME LEVELS HAVE ISSUES ✗'));
process.exit(allOk ? 0 : 1);
