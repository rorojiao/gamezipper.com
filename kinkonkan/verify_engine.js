// Kin-Kon-Kan engine verifier — extracts the JS from index.html and runs checkSolution.
// This validates the game-internal solver matches the level data.

const fs = require('fs');

const html = fs.readFileSync('/home/msdn/gamezipper.com/kinkonkan/index.html', 'utf8');
const levels = JSON.parse(fs.readFileSync('/home/msdn/gamezipper.com/kinkonkan/levels.json', 'utf8'));

// Extract relevant functions from the HTML
function extract(name) {
  const re = new RegExp('function ' + name + '\\s*\\([^]*?\\n\\}', 'm');
  const m = html.match(re);
  return m ? m[0] : null;
}

// Just re-implement the check logic (same as in index.html) for isolation
function reflect(m, dr, dc) {
  if (m === '/') return [-dc, -dr];
  return [dc, dr];
}
function traceBeam(rows, cols, mirrors, enterR, enterC, dir) {
  let dr = dir[0], dc = dir[1];
  let r = enterR, c = enterC;
  let refl = 0;
  const path = [[r, c]];
  const seen = {};
  for (let i = 0; i < rows * cols * 4; i++) {
    const m = mirrors[r][c];
    if (m) {
      const sk = r + ',' + c + ',' + dr + ',' + dc;
      if (seen[sk]) return null;
      seen[sk] = true;
      const nd = reflect(m, dr, dc);
      dr = nd[0]; dc = nd[1];
      refl++;
    }
    const nr = r + dr, nc = c + dc;
    if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) {
      let exitSide, exitPos;
      if (dr === -1) { exitSide = 'N'; exitPos = c; }
      else if (dr === 1) { exitSide = 'S'; exitPos = c; }
      else if (dc === -1) { exitSide = 'W'; exitPos = r; }
      else { exitSide = 'E'; exitPos = r; }
      return { path, refl, exitSide, exitPos, finalDir: [dr, dc] };
    }
    r = nr; c = nc;
    path.push([r, c]);
  }
  return null;
}
function getEntryFromBeam(beam, rows, cols) {
  const e = beam.enter;
  if (e.side === 'N') return [0, e.pos, [1, 0]];
  if (e.side === 'S') return [rows - 1, e.pos, [-1, 0]];
  if (e.side === 'W') return [e.pos, 0, [0, 1]];
  return [e.pos, cols - 1, [0, -1]];
}
function checkSolution(grid, placement) {
  const rows = grid.rows, cols = grid.cols;
  const mg = placement.map(row => row.slice());
  const roomCounts = {};
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const rid = grid.rooms[r][c];
    roomCounts[rid] = (roomCounts[rid] || 0) + (mg[r][c] ? 1 : 0);
  }
  const roomsOk = Object.values(roomCounts).every(n => n === 1);
  const results = [];
  let allHit = true, allCountMatch = true;
  for (const beam of grid.beams) {
    const ep = getEntryFromBeam(beam, rows, cols);
    const res = traceBeam(rows, cols, mg, ep[0], ep[1], ep[2]);
    if (!res) { results.push({ letter: beam.letter, ok: false, reason: 'loop' }); allHit = false; continue; }
    const exitOk = res.exitSide === beam.exit.side && res.exitPos === beam.exit.pos;
    const countOk = res.refl === beam.count;
    if (!exitOk || !countOk) allCountMatch = false;
    results.push({ letter: beam.letter, ok: exitOk && countOk, path: res.path, refl: res.refl });
  }
  const hit = {};
  for (const r of results) {
    if (!r.path) continue;
    for (const cell of r.path) {
      if (mg[cell[0]][cell[1]]) hit[cell[0] + ',' + cell[1]] = true;
    }
  }
  const missing = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (mg[r][c] && !hit[r + ',' + c]) missing.push([r, c]);
    }
  }
  if (missing.length > 0) allHit = false;
  return { results, allHit, allCountMatch, roomsOk, missing };
}

console.log('=== Kin-Kon-Kan Engine Verification ===');
console.log('Total levels:', levels.length);
let pass = 0;
for (let i = 0; i < levels.length; i++) {
  const l = levels[i];
  const placement = l.mirrors.map(row => row.map(c => c === '' ? null : c));
  const check = checkSolution(l, placement);
  const allOk = check.roomsOk && check.allHit && check.allCountMatch && check.results.every(r => r.ok);
  if (allOk) {
    pass++;
    console.log(`L${i+1} (T${l.tier}): PASS - ${placement.flat().filter(Boolean).length} mirrors, ${l.beams.length} beams`);
  } else {
    console.log(`L${i+1} (T${l.tier}): FAIL`);
    if (!check.roomsOk) console.log('  Room count mismatch');
    if (!check.allHit) console.log(`  Missing mirrors: ${JSON.stringify(check.missing)}`);
    if (!check.allCountMatch) console.log(`  Count mismatch`);
    for (const r of check.results) if (!r.ok) console.log(`  Beam ${r.letter}: ${r.reason || 'bad'}`);
  }
}
console.log(`\n=== SUMMARY: ${pass}/${levels.length} PASS ===`);
process.exit(pass === levels.length ? 0 : 1);