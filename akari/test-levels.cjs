const fs = require("fs");
const html = fs.readFileSync("/home/msdn/gamezipper.com/akari/index.html", "utf8");

// Extract LEVELS array using bracket matching
const start = html.indexOf("var LEVELS=[");
if (start === -1) { console.log("ERROR: No LEVELS array found"); process.exit(1); }

let depth = 0, end = -1;
for (let i = start + 11; i < html.length; i++) {
  if (html[i] === '[') depth++;
  else if (html[i] === ']') {
    depth--;
    if (depth === 0) { end = i + 1; break; }
  }
}

if (end === -1) { console.log("ERROR: Could not find end of LEVELS array"); process.exit(1); }

const levelsStr = html.substring(start + 11, end);
const LEVELS = eval(levelsStr);

console.log("Total levels found: " + LEVELS.length);

let totalPass = 0, totalFail = 0;

for (let li = 0; li < LEVELS.length; li++) {
  const lv = LEVELS[li];
  const size = lv.size;
  const tier = Math.floor(li / 6) + 1;
  const walls = lv.walls;
  const solution = lv.solution;

  const wallMap = {};
  for (const w of walls) wallMap[w[0] * 100 + w[1]] = w[2];

  const solSet = new Set();
  for (const b of solution) solSet.add(b[0] * 100 + b[1]);

  let solOnWall = false;
  for (const b of solution) {
    if (wallMap[b[0] * 100 + b[1]] !== undefined) solOnWall = true;
  }

  let solOOB = false;
  for (const b of solution) {
    if (b[0] < 0 || b[0] >= size || b[1] < 0 || b[1] >= size) solOOB = true;
  }

  function canSee(b1, b2) {
    if (b1[0] === b2[0]) {
      const minC = Math.min(b1[1], b2[1]), maxC = Math.max(b1[1], b2[1]);
      for (let c = minC + 1; c < maxC; c++) {
        if (wallMap[b1[0] * 100 + c] !== undefined) return false;
      }
      return true;
    }
    if (b1[1] === b2[1]) {
      const minR = Math.min(b1[0], b2[0]), maxR = Math.max(b1[0], b2[0]);
      for (let r = minR + 1; r < maxR; r++) {
        if (wallMap[r * 100 + b1[1]] !== undefined) return false;
      }
      return true;
    }
    return false;
  }

  let conflicts = 0;
  for (let i = 0; i < solution.length; i++) {
    for (let j = i + 1; j < solution.length; j++) {
      if (canSee(solution[i], solution[j])) conflicts++;
    }
  }

  let wallViolations = 0;
  for (const w of walls) {
    const num = parseInt(w[2]);
    if (isNaN(num)) continue;
    let adjCount = 0;
    for (const d of [[-1,0],[1,0],[0,-1],[0,1]]) {
      const nr = w[0]+d[0], nc = w[1]+d[1];
      if (nr >= 0 && nr < size && nc >= 0 && nc < size && solSet.has(nr*100+nc)) adjCount++;
    }
    if (adjCount !== num) wallViolations++;
  }

  const illuminated = new Set();
  for (const b of solution) {
    illuminated.add(b[0]*100+b[1]);
    for (let c = b[1]-1; c >= 0; c--) { if (wallMap[b[0]*100+c]!==undefined) break; illuminated.add(b[0]*100+c); }
    for (let c = b[1]+1; c < size; c++) { if (wallMap[b[0]*100+c]!==undefined) break; illuminated.add(b[0]*100+c); }
    for (let r = b[0]-1; r >= 0; r--) { if (wallMap[r*100+b[1]]!==undefined) break; illuminated.add(r*100+b[1]); }
    for (let r = b[0]+1; r < size; r++) { if (wallMap[r*100+b[1]]!==undefined) break; illuminated.add(r*100+b[1]); }
  }

  let unlitCount = 0;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (wallMap[r*100+c]===undefined && !illuminated.has(r*100+c)) unlitCount++;
    }
  }

  const issues = [];
  if (solOnWall) issues.push("BULB_ON_WALL");
  if (solOOB) issues.push("BULB_OOB");
  if (conflicts > 0) issues.push("CONFLICTS("+conflicts+")");
  if (wallViolations > 0) issues.push("WALL_VIOLATIONS("+wallViolations+")");
  if (unlitCount > 0) issues.push("UNLIT("+unlitCount+")");
  if (!solution || solution.length === 0) issues.push("NO_SOLUTION");

  const status = issues.length === 0 ? "OK" : "FAIL";
  console.log("  L" + String(li+1).padStart(2) + " (" + size + "x" + size + " T" + tier + "): bulbs=" + solution.length + " walls=" + walls.length + " " + status + (issues.length ? " " + issues.join(", ") : ""));
  
  if (issues.length === 0) totalPass++;
  else totalFail++;
}

console.log("\n" + totalPass + "/" + LEVELS.length + " levels VALID");
if (totalFail > 0) process.exit(1);
