#!/usr/bin/env node
/**
 * R333: determine the CORRECT dot coordinates for kropki-sudoku.
 *
 * Convention (canonical Kropki): a dot sits ON THE GRID LINE between two
 * adjacent cells.
 *   - horizontal dot hdots[r][c] is between cell (r,c) and (r,c+1)
 *   - vertical   dot vdots[r][c] is between cell (r,c) and (r+1,c)
 *
 * With cellRect(r,c) = {x: c*cell, y: r*cell, s: cell}:
 *   horizontal dot centre = ((c+1)*cell, r*cell + cell/2)
 *   vertical   dot centre = (c*cell + cell/2, (r+1)*cell)
 *
 * The shipped drawDots() uses:
 *   horizontal = ((c+1)*cell + cell/2, r*cell + cell/2)   <-- shifted by cell/2 in X
 *   vertical   = (c*cell + cell/2, (r+1)*cell + cell/2)   <-- shifted by cell/2 in Y
 * i.e. both land at the CENTRE of a cell, not on the line.
 *
 * This script prints the exact deltas so the fix is derived, not guessed.
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

const raw = fs.readFileSync(path.join(ROOT, 'kropki-sudoku/index.html'), 'utf8');

// pull the two coordinate expressions straight out of the shipped source
const fn = raw.slice(raw.indexOf('function drawDots()'), raw.indexOf('function cellRect'));
const hx = fn.match(/const x = \(c \+ 1\) \* G\.cell \+ G\.cell \/ 2;/);
const hy = fn.match(/const y = r \* G\.cell \+ G\.cell \/ 2;/);
const vx = fn.match(/const x = c \* G\.cell \+ G\.cell \/ 2;/);
const vy = fn.match(/const y = \(r \+ 1\) \* G\.cell \+ G\.cell \/ 2;/);
console.log('shipped horizontal x :', hx ? hx[0] : 'NOT FOUND');
console.log('shipped horizontal y :', hy ? hy[0] : 'NOT FOUND');
console.log('shipped vertical   x :', vx ? vx[0] : 'NOT FOUND');
console.log('shipped vertical   y :', vy ? vy[0] : 'NOT FOUND');
console.log();

// correct maths
console.log('CORRECT horizontal dot centre : ((c+1)*cell, r*cell + cell/2)   <- on the vertical grid line');
console.log('CORRECT vertical   dot centre : (c*cell + cell/2, (r+1)*cell)   <- on the horizontal grid line');
console.log();
console.log('DELTA horizontal x = +cell/2 (lands on the centre of cell column c+1 instead of the line)');
console.log('DELTA vertical   y = +cell/2 (lands on the centre of cell row r+1 instead of the line)');
console.log();

// sanity: the grid lines are drawn at x = c*cell and y = r*cell (from drawBoard)
const db = raw.slice(raw.indexOf('function drawBoard()'), raw.indexOf('function hasConflict'));
const lx = db.match(/ctx\.moveTo\(x,0\); ctx\.lineTo\(x,G\.n\*G\.cell\)/);
console.log('grid lines are at x = c*cell :', !!lx);
const lx2 = db.match(/var x = [^\n;]*G\.cell[^\n;]*;/g);
console.log('grid line x expressions:', lx2 ? lx2.slice(0, 3) : '(not matched)');
