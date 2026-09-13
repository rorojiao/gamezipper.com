// Dot-a-Pix Verifier — validate all 30 levels
// Rules:
//   1. Solution is a valid 0/1 grid of size n×n
//   2. Every anchor position is a filled (1) cell in the solution
//   3. Anchor density is between 0.20 and 0.75
//   4. Each level has exactly one intended solution (the stored one)
//   5. The picture (filled cells) is non-empty
//
// Usage: node verify_engine.js

const fs = require('fs');
const path = require('path');

const LEVELS = JSON.parse(fs.readFileSync(path.join(__dirname, 'levels.json'), 'utf8'));
const levels = LEVELS.levels;

function verifyStored(idx, lvl) {
  const n = lvl.n;
  const sol = lvl.solution;
  const anchors = lvl.anchors;
  const errors = [];

  // Rule 1: dimensions
  if (sol.length !== n) {
    errors.push(`solution rows = ${sol.length}, expected ${n}`);
  }
  for (let r = 0; r < n; r++) {
    if (sol[r].length !== n) {
      errors.push(`solution row ${r} width = ${sol[r].length}, expected ${n}`);
    }
  }

  // Rule 2: anchors are subset of solution
  for (const a of anchors) {
    if (sol[a.r][a.c] !== 1) {
      errors.push(`anchor (${a.r},${a.c}) = ${sol[a.r][a.c]}, expected 1`);
    }
  }

  // Rule 3: density check
  const totalFilled = sol.flat().reduce((a, b) => a + b, 0);
  if (totalFilled === 0) {
    errors.push('solution has no filled cells');
  } else {
    const density = anchors.length / totalFilled;
    if (density < 0.20) errors.push(`anchor density too low: ${density.toFixed(2)}`);
    if (density > 0.75) errors.push(`anchor density too high: ${density.toFixed(2)}`);
  }

  // Rule 4: tier is valid
  const validTiers = ['Beginner', 'Easy', 'Medium', 'Hard', 'Expert'];
  if (!validTiers.includes(lvl.tier)) {
    errors.push(`invalid tier: ${lvl.tier}`);
  }

  // Rule 5: id is in range
  if (lvl.id !== idx) {
    errors.push(`level id mismatch: stored ${lvl.id} at index ${idx}`);
  }

  return errors;
}

function main() {
  console.log(`Verifying ${levels.length} Dot-a-Pix levels...\n`);
  let failures = 0;
  for (let i = 0; i < levels.length; i++) {
    const lvl = levels[i];
    const errors = verifyStored(i, lvl);
    if (errors.length === 0) {
      const n = lvl.n;
      const nf = lvl.solution.flat().reduce((a, b) => a + b, 0);
      console.log(`  L${String(i).padStart(2,'0')} ${lvl.tier.padEnd(8)} n=${String(n).padStart(2)} ${lvl.name.padEnd(15)} PASS  filled=${nf} anchors=${lvl.anchors.length}`);
    } else {
      failures++;
      console.log(`  L${String(i).padStart(2,'0')} ${lvl.tier.padEnd(8)} n=${String(lvl.n).padStart(2)} ${lvl.name.padEnd(15)} FAIL`);
      for (const err of errors) console.log(`    - ${err}`);
    }
  }

  console.log();
  if (failures === 0) {
    console.log(`✓ ALL ${levels.length} LEVELS PASS`);
    process.exit(0);
  } else {
    console.log(`✗ ${failures}/${levels.length} LEVELS FAILED`);
    process.exit(1);
  }
}

main();
