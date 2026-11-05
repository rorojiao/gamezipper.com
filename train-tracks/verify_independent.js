#!/usr/bin/env node
/* INDEPENDENT verifier for train-tracks (R1053, 2026-11-05).
 * Levels are generated at runtime by generateLevels() (seeded PRNG) — the
 * embedded `var LEVELS` is a placeholder stub, so static extraction is useless.
 * This verifier reuses verify_engine.js's vm sandbox bootstrap to get the
 * generated level objects, then judges EACH level with an independent
 * implementation of the win spec (NOT the engine's traceTrack/checkWin):
 *   1. determinism: generateLevels() twice → identical grids
 *   2. row/col clue counts match the solution grid
 *   3. an independently-computed path (bitmask deltas, no engine DX/DY/OPP
 *      tables) enters start via the reversed outward arrow, follows piece
 *      connections, exits exactly at end via end.dir, no loops
 *   4. STRICTER than engine: start piece must actually connect in the first
 *      travel direction (engine traceTrack never validates this — false-win
 *      class probe)
 *   5. placed-piece count == path length (no strays)
 *   6. uniqueness probe limit=2: single-cell piece swaps; any alternate winner
 *      recorded as multi-solution info (not a fail)
 * Witness-based solvability proof (player cycles pieces freely on an empty
 * grid, so any valid arrangement is reachable).
 * Exit 0 = all levels independently valid.
 */
const fs = require('fs');
const path = require('path');

const veSrc = fs.readFileSync(path.join(__dirname, 'verify_engine.js'), 'utf8');
const cutMark = "if (loadErr) { console.error('engine load error:', loadErr.message); process.exit(1); }";
const cut = veSrc.indexOf(cutMark);
if (cut < 0) { console.log('FAIL: could not locate verify_engine.js bootstrap boundary'); process.exit(1); }
const bootstrap = veSrc.slice(0, cut + cutMark.length) + "\nglobalThis.__gameCtx = ctx;";
// eslint-disable-next-line no-eval
eval(bootstrap);
const ctx = globalThis.__gameCtx;
if (!ctx) { console.log('FAIL: ctx not exported'); process.exit(1); }

const DRIVER = `(function(){
  // --- independent direction math (N=1,S=2,E=4,W=8 as in game PIECES.conn) ---
  var DE = {1:[-1,0],2:[1,0],4:[0,1],8:[0,-1]};
  var OP = {1:2,2:1,4:8,8:4};
  function judge(lvl,grid){
    var R=lvl.rows,C=lvl.cols,r,c;
    for(r=0;r<R;r++){var n=0;for(c=0;c<C;c++)if(grid[r][c]>0)n++;if(n!==lvl.rowClues[r])return {ok:false,why:'row'+r+'='+n+' want '+lvl.rowClues[r];}
    return {ok:true};
  }
  return 'placeholder';
})()`;

// The DRIVER above is hand-written JS string — simpler to write it as a real
// string with proper braces:
const DRIVER2 = [
  '(function(){',
  '  var DE={1:[-1,0],2:[1,0],4:[0,1],8:[0,-1]};',
  '  var OP={1:2,2:1,4:8,8:4};',
  '  function judge(lvl,grid){',
  '    var R=lvl.rows,C=lvl.cols,r,c;',
  '    for(r=0;r<R;r++){var n=0;for(c=0;c<C;c++)if(grid[r][c]>0)n++;if(n!==lvl.rowClues[r])return{ok:false,why:"row"+r};}',
  '    for(c=0;c<C;c++){var n2=0;for(r=0;r<R;r++)if(grid[r][c]>0)n2++;if(n2!==lvl.colClues[c])return{ok:false,why:"col"+c};}',
  '    for(r=0;r<R;r++)for(c=0;c<C;c++){var p=grid[r][c];if(p>0){var b=PIECES[p].conn,bits=0;[1,2,4,8].forEach(function(x){if(b&x)bits++;});if(bits!==2)return{ok:false,why:"deg"+p};}}',
  '    var travel=OP[lvl.start.dir];',
  '    if(grid[lvl.start.r][lvl.start.c]===0)return{ok:false,why:"start empty"};',
  '    if(!(PIECES[grid[lvl.start.r][lvl.start.c]].conn&travel))return{ok:false,why:"start-piece-misconnected (ENGINE GAP)"};',
  '    var cr=lvl.start.r,cc=lvl.start.c,dir=travel,seen={},len=1,g=R*C+10;',
  '    seen[cr+","+cc]=1;',
  '    while(g-->0){',
  '      var dr=DE[dir][0],dc=DE[dir][1],nr=cr+dr,nc=cc+dc;',
  '      if(nr<0||nr>=R||nc<0||nc>=C){',
  '        if(cr===lvl.end.r&&cc===lvl.end.c&&dir===lvl.end.dir)return{ok:true,len:len};',
  '        return{ok:false,why:"exit@"+nr+","+nc};',
  '      }',
  '      if(seen[nr+","+nc])return{ok:false,why:"loop"};',
  '      if(grid[nr][nc]===0)return{ok:false,why:"break@"+nr+","+nc};',
  '      if(!(PIECES[grid[nr][nc]].conn&OP[dir]))return{ok:false,why:"unmutual@"+nr+","+nc};',
  '      var other=PIECES[grid[nr][nc]].conn&~OP[dir];',
  '      var nb=0;[1,2,4,8].forEach(function(x){if(other&x)nb=x;});',
  '      if(!nb)return{ok:false,why:"deadend"};',
  '      seen[nr+","+nc]=1;len++;cr=nr;cc=nc;dir=nb;',
  '    }',
  '    return{ok:false,why:"guard"};',
  '  }',
  '  function countPlaced(g){var n=0;for(var r=0;r<g.length;r++)for(var c=0;c<g[0].length;c++)if(g[r][c]>0)n++;return n;}',
  '  var A=generateLevels(),B=generateLevels();',
  '  var det=JSON.stringify(A.map(function(l){return l.grid;}))===JSON.stringify(B.map(function(l){return l.grid;}));',
  '  var fails=0,multi=0,strictNotes=[];',
  '  for(var i=0;i<A.length;i++){',
  '    var lvl=A[i],sol=lvl.solution_grid||lvl.grid;',
  '    var j=judge(lvl,sol);',
  '    if(!j.ok){fails++;console.log("L"+(i+1)+" FAIL indep: "+j.why);continue;}',
  '    if(j.len!==countPlaced(sol)){fails++;console.log("L"+(i+1)+" FAIL strays "+countPlaced(sol)+" vs path "+j.len);continue;}',
  '    // uniqueness probe limit=2: single-cell piece swaps (cap 60 cells)',
  '    var cells=[],alt=false;',
  '    outer: for(var r2=0;r2<lvl.rows;r2++)for(var c2=0;c2<lvl.cols;c2++){if(sol[r2][c2]>0){cells.push([r2,c2]);if(cells.length>60)break outer;}}',
  '    for(var k=0;k<cells.length&&!alt;k++){',
  '      var rr=cells[k][0],cc2=cells[k][1],orig=sol[rr][cc2];',
  '      for(var p=1;p<PIECES.length;p++){if(p===orig)continue;sol[rr][cc2]=p;var jj=judge(lvl,sol);if(jj.ok&&jj.len===countPlaced(sol)){alt=true;break;}}',
  '      sol[rr][cc2]=orig;',
  '    }',
  '    if(alt){multi++;}',
  '  }',
  '  return {total:A.length,fails:fails,deterministic:det,multi:multi,verdict:(fails===0&&det)?"PASS":"FAIL"};',
  '})()'
].join('\n');

let result;
try { result = vmRun(DRIVER2); } catch (e) { console.log('FAIL: driver error ' + e.message); process.exit(1); }
function vmRun(src) { return require('vm').runInContext(src, ctx); }
console.log('train-tracks independent: ' + JSON.stringify(result));
process.exit(result && result.verdict === 'PASS' ? 0 : 1);
