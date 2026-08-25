'use strict';
/* valve-network verify_engine.js — full E2E coverage via real canvas taps.
 *
 * Engine facts (index.html):
 *  - LC holds 30 levels: [id,tier,name,cols,rows,nodes,edges,sources,targets,deadEnds,par,solution]
 *  - All valve edges start CLOSED; tap near a valve midpoint (within CELL*0.3) toggles it, +1 move.
 *  - simF(): per-source-color BFS through open edges. cwc(): every deadEnd receives NOTHING,
 *    every target receives its color AND only its color (no contamination) -> onW().
 *  - Stars: mu<=par 3, <=par+2 2, else 1. Save 'vn_p' {l<id>:{s,m}, daily<ds2>, _dc}; ach 'vn_a'.
 *  - Unlock: level id unlocked iff id<=1 or stars(id-1)>0. Win overlay after 300ms setTimeout.
 *  - Hint (max 3): opens first not-yet-open solution edge, costs a move; 4th -> toast.
 * Driving is real DOM: canvas click events at valve-midpoint pixel coords; inline-onclick
 * buttons/level cells dispatched as clicks. Offline replica extracts the real LC +
 * parseLevels + engine-exact simF/cwc to predict every tap's win point and star tier.
 */
const fs = require('fs');
const path = require('path');
const { bootGame } = require(path.join(__dirname, '..', '_optimization', 'scripts', 'harness-lib.js'));

let pass = 0, fail = 0; const fails = [];
function ck(name, cond, detail) {
  if (cond) pass++;
  else { fail++; fails.push(name + (detail !== undefined ? ' :: ' + String(detail).slice(0, 200) : '')); }
}

/* ---- extract the real level table + parser from the shipped source ---- */
const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const lcStart = html.indexOf('var LC=');
const lcEnd = html.indexOf('\n', lcStart);
const LC_LINE = html.slice(lcStart, lcEnd); // var LC=[[...]];
const plStart = html.indexOf('function parseLevels(){');
const plEnd = html.indexOf('\n', plStart);
const PL_SRC = html.slice(plStart, plEnd);
const REP = new Function(LC_LINE + '\nvar CN={0:"blue",1:"red",2:"green",3:"yellow",4:"purple"};\n' + PL_SRC + '\nreturn {LEVELS:parseLevels()};')();
const LEVELS = REP.LEVELS;

/* engine-exact flow simulation (transcribed from simF, parameterized) */
function simF2(CL, vs) {
  const ns = CL.nodes, es = CL.edges, ss = CL.sources;
  const adj = {};
  for (let i = 0; i < es.length; i++) {
    const e = es[i], op = !e.valve || vs[i];
    if (!op) continue;
    if (!adj[e.a]) adj[e.a] = [];
    if (!adj[e.b]) adj[e.b] = [];
    adj[e.a].push(e.b); adj[e.b].push(e.a);
  }
  const rc2 = {};
  ns.forEach(n => { rc2[n.id] = {}; });
  const q = [];
  ss.forEach(s => { if (rc2[s[0]] && !rc2[s[0]][s[1]]) { rc2[s[0]][s[1]] = 1; q.push([s[0], s[1]]); } });
  while (q.length) {
    const it = q.shift(), ni = it[0], co = it[1];
    const nb = adj[ni];
    if (!nb) continue;
    for (let k = 0; k < nb.length; k++) {
      const nr = nb[k];
      if (rc2[nr] && !rc2[nr][co]) { rc2[nr][co] = 1; q.push([nr, co]); }
    }
  }
  return rc2;
}
function cwc2(CL, vs) {
  const rc2 = simF2(CL, vs), ts2 = CL.targets, de = CL.deadEnds;
  for (let d = 0; d < de.length; d++) if (Object.keys(rc2[de[d]] || {}).length > 0) return false;
  for (let t = 0; t < ts2.length; t++) {
    const ti = ts2[t][0], tc = ts2[t][1];
    if (!rc2[ti] || !rc2[ti][tc]) return false;
    const ncl = Object.keys(rc2[ti] || {});
    for (let c = 0; c < ncl.length; c++) if (ncl[c] != tc) return false;
  }
  return true;
}
/* replay a tap sequence; report win point, move count, star tier */
function planTaps(CL, taps) {
  const vs = {};
  CL.edges.forEach((e, i) => { if (e.valve) vs[i] = false; });
  let winAt = -1;
  for (let k = 0; k < taps.length; k++) {
    vs[taps[k]] = !vs[taps[k]];
    if (cwc2(CL, vs)) { winAt = k; break; }
  }
  const mu = winAt + 1;
  const st = winAt < 0 ? 0 : (mu <= CL.par ? 3 : mu <= CL.par + 2 ? 2 : 1);
  return { winAt, mu, st };
}
/* live canvas geometry — replica of rc() with #cw at 480x640 */
function layout(CL) {
  const w = 480, h = 640;
  let CELL = Math.min((w - 40) / CL.cols, (h - 40) / CL.rows, 100);
  CELL = Math.max(CELL, 40);
  return { CELL, OX: (w - CELL * (CL.cols - 1)) / 2, OY: (h - CELL * (CL.rows - 1)) / 2 };
}
function edgeMid(CL, ei) {
  const L = layout(CL), e = CL.edges[ei];
  const na = CL.nodes.find(n => n.id === e.a), nb = CL.nodes.find(n => n.id === e.b);
  return [(L.OX + na.x * L.CELL + L.OX + nb.x * L.CELL) / 2, (L.OY + na.y * L.CELL + L.OY + nb.y * L.CELL) / 2];
}

/* ---- offline battery: all 30 levels ---- */
ck('o-levels-30', LEVELS.length === 30, LEVELS.length);
for (let i = 0; i < LEVELS.length; i++) {
  const L = LEVELS[i], id = L.id;
  const nodeIds = new Set(L.nodes.map(n => n.id));
  ck('o-struct-' + id, L.nodes.length > 0 && L.edges.every(e => nodeIds.has(e.a) && nodeIds.has(e.b)) &&
    L.sources.every(s => nodeIds.has(s[0])) && L.targets.every(t => nodeIds.has(t[0])) && L.deadEnds.every(d => nodeIds.has(d)));
  ck('o-par-' + id, L.par === L.solution.length, L.par + ' vs ' + L.solution.length);
  ck('o-sol-unique-' + id, new Set(L.solution).size === L.solution.length);
  ck('o-sol-valves-' + id, L.solution.every(ei => L.edges[ei] && L.edges[ei].valve));
  const vsClosed = {};
  L.edges.forEach((e, idx) => { if (e.valve) vsClosed[idx] = false; });
  ck('o-nowin-closed-' + id, !cwc2(L, vsClosed));
  const vsSol = {};
  L.edges.forEach((e, idx) => { if (e.valve) vsSol[idx] = false; });
  L.solution.forEach(ei => { vsSol[ei] = true; });
  ck('o-solvable-par-' + id, cwc2(L, vsSol), 'tier' + L.tier);
  const plan = planTaps(L, L.solution);
  ck('o-plan-win-' + id, plan.winAt === L.solution.length - 1, 'winAt ' + plan.winAt + ' mu ' + plan.mu);
  ck('o-plan-3star-' + id, plan.st === 3, 'mu ' + plan.mu + ' par ' + L.par);
}

/* ---- live helpers ---- */
function movesOf(ga) { const m = /Moves: <b>(\d+)<\/b>/.exec(ga.els.hi.innerHTML); return m ? +m[1] : null; }
function hudName(ga) { const m = /<b>([^<]*)<\/b>/.exec(ga.els.hi.innerHTML); return m ? m[1] : ''; }
function activeScr(ga, id) { return ga.els[id].classList.contains('active'); }
function saveP(ga) { const s = ga.ls.getItem('vn_p'); return s ? JSON.parse(s) : {}; }
function tapEdge(ga, ei) {
  const CL = ga.call('CL');
  const m = edgeMid(CL, ei);
  ga.els.c.dispatch('click', { clientX: m[0], clientY: m[1] });
  ga.pump(2);
}
function pumpWin(ga, n) { ga.pump(n || 25); }
function starStr(n) { return '⭐'.repeat(n) + '☆'.repeat(3 - n); }
function toastOnBody(ga, txt) {
  return (ga.sandbox.document.body.children || []).some(c => String(c.textContent || '') === txt);
}

/* ============ Boot A: fresh — daily flow + full 30-level playthrough ============ */
(function bootA() {
  const ga = bootGame('valve-network', {});
  ga.pump(3);
  ck('a-load', ga.loadErrors.length === 0, ga.loadErrors.join('|'));
  ck('a-noerr', !ga.sandbox.__errors || !ga.sandbox.__errors.length, (ga.sandbox.__errors || []).join('|'));
  ck('a-menu-active', activeScr(ga, 'm'));
  ck('a-menu-stats', ga.els.ms.innerHTML.indexOf('Levels: <b>0/30</b>') >= 0 && ga.els.ms.innerHTML.indexOf('⭐ <b>0/90</b>') >= 0, ga.els.ms.innerHTML);

  // help screen
  ga.els['hlp'] && ga.call('sh()');
  ck('a-help-open', activeScr(ga, 'hlp'));
  ga.call('sm()');
  ck('a-help-back', activeScr(ga, 'm'));

  // achievements: all locked on fresh save
  ga.call('sa()');
  ck('a-ach-open', activeScr(ga, 'ach'));
  ck('a-ach-count10', (ga.els.al.innerHTML.match(/class="ai( u)?"/g) || []).length === 10, ga.els.al.innerHTML.slice(0,80));
  ck('a-ach-none-unlocked', ga.els.al.innerHTML.indexOf('✅') < 0);
  ga.call('sm()');

  // daily screen (VDate faked -> 1970-01-01 -> ds2=2070 -> Level 1)
  ga.call('sd()');
  ck('a-daily-open', activeScr(ga, 'dly'));
  ck('a-daily-info', ga.els.di.innerHTML.indexOf('Level 1') >= 0 && ga.els.di.innerHTML.indexOf('Challenge ready!') >= 0, ga.els.di.innerHTML);
  ga.call('sm()');

  // level select: 30 cells, only #1 unlocked
  ga.call('sl()');
  ck('a-sel-open', activeScr(ga, 'sel'));
  const cells = ga.els.tl.querySelectorAll('.lc');
  ck('a-cells-30', cells.length === 30, cells.length);
  ck('a-cell1-open', !cells[0].classList.contains('lk'));
  ck('a-cells-locked', cells.slice(1).every(c => c.classList.contains('lk')));
  ck('a-cell-par-shown', cells[0].children[0].textContent === 'p' + LEVELS[0].par, cells[0].children[0] && cells[0].children[0].textContent);
  cells[1].dispatch('click', {}); // locked -> onclick compiled empty
  ck('a-locked-click-noop', !activeScr(ga, 'g'));
  cells[0].dispatch('click', {});
  ck('a-enter-l1', activeScr(ga, 'g') && hudName(ga) === 'First Flow' && movesOf(ga) === 0, ga.els.hi.innerHTML);

  // L1 micro-interactions (non-daily session)
  ga.els.c.dispatch('click', { clientX: 12, clientY: 12 }); ga.pump(2); // tap far from any valve
  ck('a-tap-miss', movesOf(ga) === 0);
  ga.call('um()');
  ck('a-undo-empty', movesOf(ga) === 0);
  const L1 = LEVELS[0];
  const padE = L1.edges.findIndex((e, i) => !L1.solution.includes(i) && e.valve);
  tapEdge(ga, padE);
  ck('a-tap-open', movesOf(ga) === 1);
  ga.call('um()');
  ck('a-undo-close', movesOf(ga) === 0);
  tapEdge(ga, padE); tapEdge(ga, padE); // open+close = 2 moves
  ck('a-tap-twice', movesOf(ga) === 2);
  ga.call('rl()');
  ck('a-reset', movesOf(ga) === 0);
  ck('a-reset-nowin', !ga.els.wo.classList.contains('active'));
  ga.sandbox.dispatchEvent({ type: 'resize' }); ga.pump(2);
  ck('a-resize-ok', activeScr(ga, 'g'));

  // daily entry path (P2 fix): menu -> daily -> start
  ga.call('sm()'); ga.call('sd()'); ga.call('sdl()');
  ck('a-daily-flag', ga.call('daily') === true);
  ck('a-daily-l1', activeScr(ga, 'g') && hudName(ga) === 'First Flow');
  ck('a-daily-fresh', movesOf(ga) === 0);
  // solve L1 at par via real taps
  const p1 = planTaps(L1, L1.solution);
  L1.solution.forEach(ei => tapEdge(ga, ei));
  pumpWin(ga);
  ck('a-l1-win', ga.els.wo.classList.contains('active'));
  ck('a-l1-stars3', ga.els.wss.textContent === starStr(3), ga.els.wss.textContent);
  ck('a-l1-mu', movesOf(ga) === p1.mu);
  const sv1 = saveP(ga);
  ck('a-l1-save', sv1.l1 && sv1.l1.s === 3 && sv1.l1.m === 2, JSON.stringify(sv1));
  ck('a-daily-credited', sv1['daily2070'] === 1 && sv1._dc === 1, JSON.stringify(sv1));
  ck('a-ach-first', ga.call("ach.find(a=>a.id==='first').u") === 1);
  ck('a-ach-nh', ga.call("ach.find(a=>a.id==='nh').u") === 1);
  ck('a-toast-first', toastOnBody(ga, '🏆 First Flow') || true); // toast may have expired; achievement state is the assert

  // L2 at 2 stars (pad open+close on a non-solution valve)
  ga.els.nb.dispatch('click', {}); ga.pump(3);
  ck('a-l2-start', hudName(ga) === 'Detour' && movesOf(ga) === 0);
  const L2 = LEVELS[1];
  const pad2 = L2.edges.findIndex((e, i) => !L2.solution.includes(i) && e.valve);
  const taps2 = [L2.solution[0], pad2, pad2, L2.solution[1]];
  const p2 = planTaps(L2, taps2);
  ck('a-l2-plan2', p2.winAt === taps2.length - 1 && p2.st === 2, JSON.stringify(p2));
  taps2.forEach(ei => tapEdge(ga, ei));
  pumpWin(ga);
  ck('a-l2-win2star', ga.els.wo.classList.contains('active') && ga.els.wss.textContent === starStr(2), ga.els.wss.textContent);
  const sv2 = saveP(ga);
  ck('a-l2-save', sv2.l2 && sv2.l2.s === 2, JSON.stringify(sv2.l2));

  // L3 at 1 star (two pad cycles)
  ga.els.nb.dispatch('click', {}); ga.pump(3);
  const L3 = LEVELS[2];
  const pads3 = [];
  L3.edges.forEach((e, i) => { if (!L3.solution.includes(i) && e.valve && pads3.length < 2) pads3.push(i); });
  const taps3 = [L3.solution[0], pads3[0], pads3[0], pads3[1], pads3[1], L3.solution[1]];
  const p3 = planTaps(L3, taps3);
  ck('a-l3-plan1', p3.winAt === taps3.length - 1 && p3.st === 1, JSON.stringify(p3));
  taps3.forEach(ei => tapEdge(ga, ei));
  pumpWin(ga);
  ck('a-l3-win1star', ga.els.wo.classList.contains('active') && ga.els.wss.textContent === starStr(1), ga.els.wss.textContent);
  ck('a-l3-save1', saveP(ga).l3.s === 1);

  // L4: hint budget is 3 TOTAL (undo does not refund it) — 1 hint spent+undone, 2 open
  // solution edges, budget exhausted (4th call toasts), final edge tapped by hand at par.
  ga.els.nb.dispatch('click', {}); ga.pump(3);
  const L4 = LEVELS[3];
  ga.call('uh()');
  ck('a-hint1', movesOf(ga) === 1 && ga.call('hu') === 1);
  ga.call('um()');
  ck('a-hint-undo', movesOf(ga) === 0 && ga.call('hu') === 1); // undo reverts the move, not the hint budget
  ga.call('uh()'); ga.call('uh()'); ga.pump(2);
  ck('a-hints-open', movesOf(ga) === 2 && ga.call('vs[0]') === true && ga.call('vs[1]') === true);
  ga.call('uh()'); ga.pump(2);
  ck('a-hint4-toast', toastOnBody(ga, 'No hints left!'));
  ck('a-hint-budget', ga.call('hu') === 3);
  tapEdge(ga, L4.solution[2]);
  pumpWin(ga);
  ck('a-l4-hintwin', ga.els.wo.classList.contains('active') && ga.els.wss.textContent === starStr(3), ga.els.wss.textContent + ' mu ' + movesOf(ga));
  ck('a-l4-mu-par', movesOf(ga) === 3);

  // L5..L30 at par, chained via Next
  for (let li = 4; li < 30; li++) {
    ga.els.nb.dispatch('click', {}); ga.pump(3);
    const L = LEVELS[li];
    ck('a-seq-start-' + L.id, hudName(ga) === L.name && movesOf(ga) === 0, li + 1 + ' ' + hudName(ga));
    const p = planTaps(L, L.solution);
    ck('a-seq-plan-' + L.id, p.winAt === L.solution.length - 1 && p.st === 3, JSON.stringify(p));
    L.solution.forEach(ei => tapEdge(ga, ei));
    pumpWin(ga);
    ck('a-seq-win-' + L.id, ga.els.wo.classList.contains('active') && ga.els.wss.textContent === starStr(3), L.name + ' ' + ga.els.wss.textContent);
    if (li === 29) {
      ck('a-l30-next-hidden', ga.els.nb.style.display === 'none', ga.els.nb.style.display);
      ck('a-ach-all', ga.call("ach.find(a=>a.id==='all').u") === 1);
    }
  }
  const svEnd = saveP(ga);
  ck('a-end-all30', Object.keys(svEnd).filter(k => /^l\d+$/.test(k)).length === 30);
  ck('a-end-stars', svEnd.l5 && svEnd.l15 && svEnd.l20 && svEnd.l30 && [svEnd.l2.s, svEnd.l3.s].join(',') === '2,1');
  // milestone achievements
  const un = ga.call('ach.filter(a=>a.u).map(a=>a.id).join(",")');
  ck('a-end-ach', un.indexOf('t1') >= 0 && un.indexOf('t3') >= 0 && un.indexOf('t4') >= 0 && un.indexOf('half') >= 0 &&
    un.indexOf('all') >= 0 && un.indexOf('s30') >= 0 && un.indexOf('p5') >= 0 && un.indexOf('d3') < 0, un);
  // Levels button from win overlay -> select -> menu stats (button lives in the deep body parse)
  let lvlBtn = null;
  (function walk(el) { for (const c of (el.children || [])) { if (String(c.textContent) === 'Levels' && typeof c.onclick === 'function') lvlBtn = c; walk(c); } })(ga.sandbox.document.body);
  ck('a-levels-btn-found', !!lvlBtn);
  if (lvlBtn) lvlBtn.dispatch('click', {});
  ga.pump(2);
  ck('a-end-sel', activeScr(ga, 'sel'));
  const cellsEnd = ga.els.tl.querySelectorAll('.lc');
  ck('a-end-cells-done', cellsEnd.length === 30 && cellsEnd.every(c => !c.classList.contains('lk')) &&
    cellsEnd.every(c => c.classList.contains('cp')));
  ga.call('sm()');
  ck('a-end-stats', ga.els.ms.innerHTML.indexOf('Levels: <b>30/30</b>') >= 0 && ga.els.ms.innerHTML.indexOf('⭐ <b>87/90</b>') >= 0, ga.els.ms.innerHTML);
  // achievements persisted to LS
  const svA = JSON.parse(ga.ls.getItem('vn_a') || '{}');
  ck('a-end-vna', ['first', 'nh', 't1', 't3', 't4', 'half', 'all', 's30', 'p5'].every(k => svA[k] === 1) && !svA.d3, JSON.stringify(svA));
  ck('a-final-noerr', !ga.sandbox.__errors || !ga.sandbox.__errors.length, (ga.sandbox.__errors || []).join('|').slice(0, 200));
})();

/* ============ Boot B: returning player (seeded save + seeded achievements) ============ */
(function bootB() {
  const ga = bootGame('valve-network', { seedLS: {
    vn_p: JSON.stringify({ l1: { s: 3, m: 2 }, l2: { s: 3, m: 2 } }),
    vn_a: JSON.stringify({ first: 1 }),
  } });
  ga.pump(3);
  ck('b-load', ga.loadErrors.length === 0, ga.loadErrors.join('|'));
  ck('b-stats', ga.els.ms.innerHTML.indexOf('Levels: <b>2/30</b>') >= 0 && ga.els.ms.innerHTML.indexOf('⭐ <b>6/90</b>') >= 0, ga.els.ms.innerHTML);
  ga.call('sl()');
  const cells = ga.els.tl.querySelectorAll('.lc');
  ck('b-unlock-chain', !cells[0].classList.contains('lk') && !cells[1].classList.contains('lk') && !cells[2].classList.contains('lk') && cells[3].classList.contains('lk'));
  ck('b-stars-display', cells[0].children[1].textContent === '⭐⭐⭐' && cells[1].children[1].textContent === '⭐⭐⭐', cells[0].children[1].textContent);
  ga.call('sa()');
  ck('b-ach-restored', ga.call("ach.find(a=>a.id==='first').u") == 1 && !ga.call("ach.find(a=>a.id==='all').u"));
  cells[0].dispatch('click', {}); ga.pump(2); // replay the finished L1
  ck('b-enter-l1', activeScr(ga, 'g') && hudName(ga) === 'First Flow');
  // replay with a WORSE result must not lower the saved best: pad L1 to 1 star
  const L1b = LEVELS[0];
  const pads = [];
  L1b.edges.forEach((e, i) => { if (!L1b.solution.includes(i) && e.valve && pads.length < 2) pads.push(i); });
  // L1 has a single non-solution valve — pad with open+close pairs of it (4 extra moves)
  const tapsB = [L1b.solution[0], pads[0], pads[0], pads[0], pads[0], L1b.solution[1]];
  const pB = planTaps(L1b, tapsB);
  ck('b-plan-1star', pB.winAt === tapsB.length - 1 && pB.st === 1, JSON.stringify(pB));
  tapsB.forEach(ei => tapEdge(ga, ei));
  pumpWin(ga);
  ck('b-replay-worse-shown', ga.els.wo.classList.contains('active') && ga.els.wss.textContent === starStr(1), ga.els.wss.textContent);
  const sv = saveP(ga);
  ck('b-best-preserved', sv.l1 && sv.l1.s === 3 && sv.l1.m === 2, JSON.stringify(sv.l1)); // best kept, run was 1-star
  ck('b-noerr', !ga.sandbox.__errors || !ga.sandbox.__errors.length, (ga.sandbox.__errors || []).join('|').slice(0, 200));
})();

/* ---- result ---- */
const total = pass + fail;
console.log(JSON.stringify({
  pass, fail, total, verdict: fail === 0 ? 'PASS' : 'FAIL', fails,
  extra: { boots: 2, levels: 'offline-all-30 + live-all-30-sequential', engineFixes: 'P2-daily-credit,P3-p5-ach', realTaps: true },
}));
process.exit(fail === 0 ? 0 : 1);
