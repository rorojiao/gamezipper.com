// Kin-Kon-Kan independent verifier - validates levels without loading HTML
const fs = require('fs');

const levels = JSON.parse(fs.readFileSync('/home/msdn/gamezipper.com/kinkonkan/levels.json', 'utf8'));

function reflect(mirror, dr, dc) {
    if (mirror === '/') {
        return [-dc, -dr];
    } else if (mirror === '\\') {
        return [dc, dr];
    }
    return [dr, dc];
}

function trace_beam(rows, cols, mirrors, start_r, start_c, direction) {
    let dr = direction[0], dc = direction[1];
    let r = start_r, c = start_c;
    const path = [(r,c)];
    const mirrors_hit = [];
    const seen_states = new Set();
    let refl_count = 0;
    const max_steps = rows * cols * 4;
    
    for (let i = 0; i < max_steps; i++) {
        const state = `${r},${c},${dr},${dc}`;
        if (seen_states.has(state)) {
            return null; // Loop detected
        }
        seen_states.add(state);
        
        if (mirrors[r] && mirrors[r][c] && mirrors[r][c] !== '') {
            mirrors_hit.push([r,c]);
            refl_count++;
            const [nr, nc] = reflect(mirrors[r][c], dr, dc);
            dr = nr; dc = nc;
        }
        
        r += dr;
        c += dc;
        
        if (r < 0 || r >= rows || c < 0 || c >= cols) {
            return { path, mirrors_hit, exit_r: r, exit_c: c, refl_count };
        }
        
        path.push([r,c]);
    }
    
    return null; // Exceeded max steps
}

function verify_level(level, idx) {
    const { rows, cols, rooms, mirrors, beams } = level;
    let all_pass = true;
    const issues = [];
    
    // Check 1: Each room has exactly one mirror
    const mirror_count_per_room = {};
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const rid = rooms[r][c];
            if (mirrors[r] && mirrors[r][c] && mirrors[r][c] !== '') {
                mirror_count_per_room[rid] = (mirror_count_per_room[rid] || 0) + 1;
            }
        }
    }
    
    for (const [rid, count] of Object.entries(mirror_count_per_room)) {
        if (count !== 1) {
            all_pass = false;
            issues.push(`Room ${rid} has ${count} mirrors (should be 1)`);
        }
    }
    
    // Convert beam entry/exit from (side, pos) to (r, c, dir)
    function sidePosToRCDir(side, pos, entering) {
        // N: top row, S: bottom row, W: left col, E: right col
        if (side === 'N') {
            return entering ? { r: 0, c: pos, dir: [1, 0] } : { r: -1, c: pos, dir: [-1, 0] };
        } else if (side === 'S') {
            return entering ? { r: rows-1, c: pos, dir: [-1, 0] } : { r: rows, c: pos, dir: [1, 0] };
        } else if (side === 'W') {
            return entering ? { r: pos, c: 0, dir: [0, 1] } : { r: pos, c: -1, dir: [0, -1] };
        } else if (side === 'E') {
            return entering ? { r: pos, c: cols-1, dir: [0, -1] } : { r: pos, c: cols, dir: [0, 1] };
        }
        return null;
    }
    
    // Check 2: All beams are valid
    for (const beam of beams) {
        const { letter, enter, exit, count } = beam;
        const entry = sidePosToRCDir(enter.side, enter.pos, true);
        const exit_expected = sidePosToRCDir(exit.side, exit.pos, false);
        
        if (!entry || !exit_expected) {
            all_pass = false;
            issues.push(`Beam ${letter}: invalid side/pos`);
            continue;
        }
        
        const result = trace_beam(rows, cols, mirrors, entry.r, entry.c, entry.dir);
        
        if (!result) {
            all_pass = false;
            issues.push(`Beam ${letter}: beam loops`);
            continue;
        }
        
        // Check exit matches
        if (result.exit_r !== exit_expected.r || result.exit_c !== exit_expected.c) {
            all_pass = false;
            issues.push(`Beam ${letter}: exit mismatch (${result.exit_r},${result.exit_c}) != (${exit_expected.r},${exit_expected.c})`);
        }
        
        // Check reflection count matches
        if (result.refl_count !== count) {
            all_pass = false;
            issues.push(`Beam ${letter}: reflection count ${result.refl_count} != ${count}`);
        }
    }
    
    // Check 3: Every mirror is hit by at least one beam
    const mirror_cells = new Set();
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (mirrors[r] && mirrors[r][c] && mirrors[r][c] !== '') {
                mirror_cells.add(`${r},${c}`);
            }
        }
    }
    
    const hit_mirrors = new Set();
    for (const beam of beams) {
        const entry = sidePosToRCDir(beam.enter.side, beam.enter.pos, true);
        if (entry) {
            const result = trace_beam(rows, cols, mirrors, entry.r, entry.c, entry.dir);
            if (result) {
                for (const [mr, mc] of result.mirrors_hit) {
                    hit_mirrors.add(`${mr},${mc}`);
                }
            }
        }
    }
    
    for (const mc of mirror_cells) {
        if (!hit_mirrors.has(mc)) {
            all_pass = false;
            issues.push(`Mirror at ${mc} not hit by any beam`);
        }
    }
    
    return { pass: all_pass, issues, mirrors: mirror_cells.size, pairs: beams.length };
}

console.log(`=== Kin-Kon-Kan Independent Verification ===`);
console.log(`Total levels: ${levels.length}\n`);

let pass_count = 0;
for (let i = 0; i < levels.length; i++) {
    const result = verify_level(levels[i], i);
    if (result.pass) {
        pass_count++;
        console.log(`L${i+1} (T${levels[i].tier}): PASS - ${result.mirrors} mirrors, ${result.pairs} pairs`);
    } else {
        console.log(`L${i+1} (T${levels[i].tier}): FAIL`);
        for (const issue of result.issues) {
            console.log(`  - ${issue}`);
        }
    }
}

console.log(`\n=== SUMMARY: ${pass_count}/${levels.length} PASS ===`);
process.exit(pass_count === levels.length ? 0 : 1);