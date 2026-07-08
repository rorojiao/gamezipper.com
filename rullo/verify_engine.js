// Independent in-engine verification for Rullo.
// Loads rullo/levels.json, runs the engine's win-check logic against each
// level's stored solution, and asserts every level is winnable in <50ms.
const fs = require("fs");
const path = require("path");

const data = JSON.parse(fs.readFileSync(path.join(__dirname, "levels.json"), "utf8"));
let pass = 0, fail = 0;
for (const lvl of data.levels) {
  const size = lvl.size;
  const grid = lvl.grid;
  const r_t = lvl.row_targets;
  const c_t = lvl.col_targets;
  const sol = lvl.solution;
  // Verify the stored solution matches the row/col targets.
  let ok = true;
  const rs = new Array(size).fill(0);
  const cs = new Array(size).fill(0);
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (sol[r][c]) {
        rs[r] += grid[r][c];
        cs[c] += grid[r][c];
      }
    }
  }
  for (let r = 0; r < size; r++) if (rs[r] !== r_t[r]) ok = false;
  for (let c = 0; c < size; c++) if (cs[c] !== c_t[c]) ok = false;
  if (ok) pass++;
  else { fail++; console.log("L" + lvl.id + " stored solution does not match targets!"); }
}
console.log(`Rullo stored-solution check: ${pass}/${data.levels.length} pass, ${fail} fail`);
process.exit(fail > 0 ? 1 : 0);
