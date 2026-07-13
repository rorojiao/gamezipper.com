// Kin-Kon-Kan independent verifier - validates levels without loading HTML.
// This is a completely separate implementation from the in-game check.
const fs = require('fs');

const levels = JSON.parse(fs.readFileSync('/home/msdn/gamezipper.com/kinkonkan/levels.json', 'utf8'));

function reflect(mirror, dr, dc) {
    if (mirror === '/') return [-dc, -dr];
    if (mirror === '\\') return [dc, dr];
    return [dr, dc];
}

function trace_beam(rows, cols, mirrors, start_r, start_c, direction) {
    let dr = direction[0], dc = direction[1];
    let r = start_r, c = start_c;
    const path = [[r, c]];
    const mirrors_hit = [];
    const seen = new Set();
    let refl_count = 0;
    const max_steps = rows * cols * 4;
    for (let i = 0; i < max_steps; i++) {
        const sk = `${r},${c},${dr},${dc}`;
        if (seen.has(sk)) return null; // loop
        seen.add(sk);
        if (mirrors[r] && mirrors[r][c] && mirrors[r][c] !== '') {
            mirrors_hit.push([r, c]);
            refl_count++;
            const nd = reflect(mirrors[r][c], dr, dc);
            dr = nd[0]; dc = nd[1];
        }
        const nr = r + dr, nc = c + dc;
        if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) {
            return { path, mirrors_hit, exit_r: nr, exit_c: nc, refl_count };
        }
        r = nr; c = nc;
        path.push([r, c]);
    }
    return null;
}

function getEntryPoint(side, pos, rows, cols) {
    // Returns { r, c, dir } for the boundary cell beam starts at (just inside grid)
    // and the inward direction.
    if (side === 'N') return { r: 0, c: pos, dir: [1, 0] };
    if (side === 'S') return { r: rows - 1, c: pos, dir: [-1, 0] };
    if (side === 'W') return { r: pos, c: 0, dir: [0, 1] };
    if (side === 'E') return { r: pos, c: cols - 1, dir: [0, -1] };
    return null;
}

function getExitPoint(side, pos, rows, cols) {
    // Returns { r, c } of the position just OUTSIDE the grid where the beam exits.
    if (side === 'N') return { r: -1, c: pos };
    if (side === 'S') return { r: rows, c: pos };
    if (side === 'W') return { r: pos, c: -1 };
    if (side === 'E') return { r: pos, c: cols };
    return null;
}

function verify_level(level) {
    const { rows, cols, rooms, mirrors, beams } = level;
    const issues = [];

    // Check 1: Each room has exactly one mirror
    const roomCounts = {};
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const rid = rooms[r][c];
            if (mirrors[r] && mirrors[r][c] && mirrors[r][c] !== '') {
                roomCounts[rid] = (roomCounts[rid] || 0) + 1;
            }
        }
    }
    for (const [rid, cnt] of Object.entries(roomCounts)) {
        if (cnt !== 1) issues.push(`Room ${rid} has ${cnt} mirrors (should be 1)`);
    }

    // Check 2: All beams trace correctly
    const allHit = new Set();
    for (const beam of beams) {
        const entry = getEntryPoint(beam.enter.side, beam.enter.pos, rows, cols);
        const exitExp = getExitPoint(beam.exit.side, beam.exit.pos, rows, cols);
        if (!entry || !exitExp) {
            issues.push(`Beam ${beam.letter}: bad side/pos`);
            continue;
        }
        const res = trace_beam(rows, cols, mirrors, entry.r, entry.c, entry.dir);
        if (!res) { issues.push(`Beam ${beam.letter}: beam loops`); continue; }
        if (res.exit_r !== exitExp.r || res.exit_c !== exitExp.c) {
            issues.push(`Beam ${beam.letter}: exit mismatch ${res.exit_r},${res.exit_c} != ${exitExp.r},${exitExp.c}`);
        }
        if (res.refl_count !== beam.count) {
            issues.push(`Beam ${beam.letter}: reflection count ${res.refl_count} != ${beam.count}`);
        }
        for (const [mr, mc] of res.mirrors_hit) allHit.add(`${mr},${mc}`);
    }

    // Check 3: Every mirror is hit by at least one beam
    const allMirrors = new Set();
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (mirrors[r] && mirrors[r][c] && mirrors[r][c] !== '') {
                allMirrors.add(`${r},${c}`);
            }
        }
    }
    for (const mc of allMirrors) {
        if (!allHit.has(mc)) issues.push(`Mirror at ${mc} not hit by any beam`);
    }

    return { pass: issues.length === 0, issues, mirrors: allMirrors.size, pairs: beams.length };
}

console.log(`=== Kin-Kon-Kan Independent Verification ===`);
console.log(`Total levels: ${levels.length}\n`);

let pass_count = 0;
for (let i = 0; i < levels.length; i++) {
    const r = verify_level(levels[i]);
    if (r.pass) {
        pass_count++;
        console.log(`L${i+1} (T${levels[i].tier}): PASS - ${r.mirrors} mirrors, ${r.pairs} pairs`);
    } else {
        console.log(`L${i+1} (T${levels[i].tier}): FAIL`);
        for (const issue of r.issues) console.log(`  - ${issue}`);
    }
}

console.log(`\n=== SUMMARY: ${pass_count}/${levels.length} PASS ===`);
process.exit(pass_count === levels.length ? 0 : 1);