// beat-battle verify_engine.js
// Rule: each level is a rhythm game with N notes. Notes are at beat timings
// within a song of `beats` total beats at `bpm` BPM. Player must hit notes
// within OK_WIN=0.22 beats. With a perfect autoplay, all notes can be hit.
//
// Structural checks:
// - Each level's notes are within 0..beats range
// - All lanes are in 0..3
// - At least 1 note (solvable)
// - Notes are time-sorted (engine sorts but pre-sort is expected)

const fs = require('fs');
const path = require('path');
const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const m = html.match(/(?:const|var|let)\s+LEVELS\s*=\s*(\[[\s\S]*?\])\s*;/);
if (!m) { console.error('FAIL: cannot extract LEVELS'); process.exit(1); }
const LEVELS = eval('(' + m[1] + ')');

let pass = 0, fail = 0;
const fails = [];
for (let i = 0; i < LEVELS.length; i++) {
  const L = LEVELS[i];
  const lanes = new Set();
  let allInRange = true;
  let sortedOK = true;
  for (let j = 0; j < L.notes.length; j++) {
    const n = L.notes[j];
    lanes.add(n.lane);
    if (n.lane < 0 || n.lane > 3) allInRange = false;
    if (n.t < 0 || n.t > L.beats) allInRange = false;
    if (j > 0 && L.notes[j].t < L.notes[j-1].t) sortedOK = false;
  }
  const ok = allInRange && sortedOK && L.notes.length >= 1 && L.bpm >= 60 && L.bpm <= 200;
  if (ok) pass++;
  else { fail++; fails.push({ i: i+1, name: L.name, allInRange, sortedOK, noteCount: L.notes.length, lanes: [...lanes] }); }
}
console.log(`beat-battle: PASS ${pass}/${LEVELS.length} (${LEVELS.length} songs)`);
for (const f of fails) console.log('  FAIL', JSON.stringify(f));
if (fail > 0) process.exit(1);
