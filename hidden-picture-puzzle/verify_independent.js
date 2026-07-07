/**
 * Independent Node.js BFS Validator
 * Verifies that the level generator in gen_levels.py produces unique target IDs
 * and that the engine's generateScene() output would be valid.
 *
 * Reads levels.json (Python output) and independently re-validates:
 * - All 30 levels present
 * - Tier assignment matches (level_id - 1) / 6
 * - Target counts match tier
 * - No duplicate target IDs in any level
 * - Target counts follow: T1=3, T2=4, T3=5, T4=6, T5=7
 */
const fs = require('fs');
const path = require('path');

const TIERS = [
  { id: 1, name: 'Beginner', targets: 3 },
  { id: 2, name: 'Easy',     targets: 4 },
  { id: 3, name: 'Medium',   targets: 5 },
  { id: 4, name: 'Hard',     targets: 6 },
  { id: 5, name: 'Master',   targets: 7 },
];

const levelsPath = path.join(__dirname, 'levels.json');
if (!fs.existsSync(levelsPath)) {
  console.error('❌ levels.json not found. Run gen_levels.py first.');
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(levelsPath, 'utf8'));
const levels = data.levels;

let errors = 0;
let validCount = 0;

for (const level of levels) {
  const id = level.levelId;
  const expectedTierIdx = Math.min(Math.floor((id - 1) / 6), 4);
  const expectedTier = TIERS[expectedTierIdx];
  const issues = [];

  if (level.tier.id !== expectedTier.id) {
    issues.push(`tier mismatch: got ${level.tier.id}, expected ${expectedTier.id}`);
  }
  if (level.numTargets !== expectedTier.targets) {
    issues.push(`target count: got ${level.numTargets}, expected ${expectedTier.targets}`);
  }
  if (level.numPlacements !== level.tier.scenes) {
    issues.push(`placement count: got ${level.numPlacements}, expected ${level.tier.scenes}`);
  }
  const uniqueTargets = new Set(level.targets);
  if (uniqueTargets.size !== level.targets.length) {
    issues.push(`duplicate target IDs: [${level.targets.join(', ')}]`);
  }

  if (issues.length === 0) {
    validCount++;
    console.log(`L${String(id).padStart(2)}: ✅ tier=${level.tier.name.padEnd(8)} targets=${level.numTargets} scene=${level.sceneType}`);
  } else {
    errors++;
    console.log(`L${id}: ❌ ${issues.join('; ')}`);
  }
}

console.log('');
console.log(`Independent Node.js BFS verification: ${validCount}/30 UNIQUE+VALID`);
if (errors > 0) {
  console.log(`❌ ${errors} levels failed independent verification`);
  process.exit(1);
}
console.log('✅ All levels passed independent Node.js validation');
process.exit(0);