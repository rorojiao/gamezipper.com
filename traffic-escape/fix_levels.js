// Fix traffic-escape LEVELS — align target with exit, avoid overlap with other cars
const fs = require('fs');
const path = require('path');

const FILE = path.resolve(__dirname, '..', 'traffic-escape/index.html');
let src = fs.readFileSync(FILE, 'utf8');

const m = src.match(/var LEVELS = (\[[\s\S]*?\]);/);
if (!m) { console.error('NO MATCH'); process.exit(1); }
let LEVELS;
try { LEVELS = eval(m[1]); } catch(e) { console.error('EVAL ERR:', e.message); process.exit(1); }
console.log('Loaded', LEVELS.length, 'levels');

function carCells(car) {
  const cells = [];
  for (let i = 0; i < car.len; i++) {
    const d = car.dir;
    if (d === 'right') cells.push([car.row, car.col - i]);
    else if (d === 'left') cells.push([car.row, car.col + i]);
    else if (d === 'down') cells.push([car.row - i, car.col]);
    else if (d === 'up') cells.push([car.row + i, car.col]);
  }
  return cells;
}

function occupiedByOthers(cars, excludeId) {
  const occ = new Set();
  for (const c of cars) {
    if (c.id === excludeId) continue;
    for (const cell of carCells(c)) {
      occ.add(cell[0] + ',' + cell[1]);
    }
  }
  return occ;
}

function fixedLevels() {
  const result = [];
  for (const lvl of LEVELS) {
    const newLvl = JSON.parse(JSON.stringify(lvl));
    const targetIdx = newLvl.cars.findIndex(c => c.isTarget);
    if (targetIdx === -1) { result.push(newLvl); continue; }
    const target = newLvl.cars[targetIdx];
    const ex = newLvl.exit;
    const others = newLvl.cars.filter(c => !c.isTarget);

    // Try each row/col position for target that aligns with exit's primary axis
    let placed = false;
    if (ex.dir === 'left' || ex.dir === 'right') {
      // Need target.row = ex.row. Find free col with body cells (ex.row, col), (ex.row, col-1) unoccupied.
      for (let col = 0; col < lvl.cols; col++) {
        const cells = carCells({ row: ex.row, col, len: target.len, dir: target.dir });
        // Bounds check
        if (cells.some(([r, c]) => r < 0 || r >= lvl.rows || c < 0 || c >= lvl.cols)) continue;
        const occ = occupiedByOthers(newLvl.cars, target.id);
        if (cells.every(([r, c]) => !occ.has(r + ',' + c))) {
          target.row = ex.row;
          target.col = col;
          placed = true;
          break;
        }
      }
      // If ex.row was already used by original, keep it even if cells overlap (player will move others first)
      if (!placed) {
        target.row = ex.row;
      }
    } else {
      // Need target.col = ex.col. Find free row.
      for (let row = 0; row < lvl.rows; row++) {
        const cells = carCells({ row, col: ex.col, len: target.len, dir: target.dir });
        // Bounds check
        if (cells.some(([r, c]) => r < 0 || r >= lvl.rows || c < 0 || c >= lvl.cols)) continue;
        const occ = occupiedByOthers(newLvl.cars, target.id);
        if (cells.every(([r, c]) => !occ.has(r + ',' + c))) {
          target.row = row;
          target.col = ex.col;
          placed = true;
          break;
        }
      }
      if (!placed) {
        target.col = ex.col;
      }
    }
    result.push(newLvl);
  }
  return result;
}

function jsCar(car) {
  const parts = [];
  for (const k of Object.keys(car)) {
    let v = car[k];
    if (typeof v === 'string') v = `'${v.replace(/'/g, "\\'")}'`;
    else if (typeof v === 'boolean') v = v ? 'true' : 'false';
    parts.push(`${k}:${v}`);
  }
  return '{' + parts.join(',') + '}';
}

function jsLevel(lvl) {
  return `{name:'${lvl.name}',tier:${lvl.tier},cols:${lvl.cols},rows:${lvl.rows},exit:{row:${lvl.exit.row},col:${lvl.exit.col},dir:'${lvl.exit.dir}'},cars:[${lvl.cars.map(jsCar).join(',')}],par:${lvl.par},hint:'${lvl.hint || ''}'}`;
}

const fixed = fixedLevels();
const outArr = fixed.map(jsLevel).join(',\n');
const newSrc = src.replace(/var LEVELS = \[[\s\S]*?\];/, 'var LEVELS = [\n' + outArr + '\n];');
fs.writeFileSync(FILE, newSrc);
console.log('Wrote', fixed.length, 'fixed levels to', FILE);