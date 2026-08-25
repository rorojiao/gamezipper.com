// offline Hotaru Beam solver probe v2 — matches ENGINE semantics exactly:
//   circles degree 2 (any sides), all circles connected, numbered circles:
//   dot edge exists + walk from dot dir stops at first circle with bends === num.
// Clean model: single simple cycle (or path) through all circles, interiors circle-free.
'use strict';
const fs = require('fs');
const src = fs.readFileSync('hotaru-beam/index.html', 'utf8');
const levSrc = src.slice(src.indexOf('var LEVELS=['), src.indexOf('];', src.indexOf('var LEVELS=[')) + 2);
const LEVELS = new Function('return ' + levSrc.replace('var LEVELS=', ''))();
const DIRS = { up: [-1, 0], down: [1, 0], left: [0, -1], right: [0, 1] };
const DIRLIST = [[-1, 0], [1, 0], [0, -1], [0, 1]];

function solveLevel(lv) {
  const R = lv.gridR, C = lv.gridC;
  const N = lv.circles.length;
  const circleAt = {}; lv.circles.forEach((ci, i) => circleAt[ci.r + ',' + ci.c] = i);
  const ek = (r1, c1, r2, c2) => (r1 > r2 || (r1 === r2 && c1 > c2)) ? ek(r2, c2, r1, c1) : r1 + ',' + c1 + '-' + r2 + ',' + c2;
  // enumerate segments: simple paths between circles, interior circle-free, both views recorded
  const S = {}; // S[a+'>'+b] = [{edges, interior:[nodes], dirA, bendsA}]
  const MAXLEN = 2 * (R + C) + 6;
  for (let a = 0; a < N; a++) {
    const A = lv.circles[a];
    for (const [dr0, dc0] of DIRLIST) {
      const fr = A.r + dr0, fc = A.c + dc0;
      if (fr < 0 || fr > R || fc < 0 || fc > C) continue;
      let expansions = 0;
      const stack = [{ r: fr, c: fc, pdr: dr0, pdc: dc0, bends: 0, nodes: [A.r + ',' + A.c, fr + ',' + fc], edges: [ek(A.r, A.c, fr, fc)] }];
      while (stack.length && expansions < 300000) {
        const st = stack.pop(); expansions++;
        const k = st.r + ',' + st.c;
        if (circleAt[k] !== undefined) {
          const b = circleAt[k];
          if (b !== a) {
            const interior = st.nodes.slice(1, -1);
            const sig = st.edges.slice().sort().join('|');
            // view from a: dirA=[dr0,dc0], bendsA=st.bends
            // view from b: reverse walk
            let bendsB = 0, pdx = null;
            for (let i = st.nodes.length - 1; i > 0; i--) {
              const p1 = st.nodes[i].split(','), p0 = st.nodes[i - 1].split(',');
              const d0 = +p0[0] - +p1[0], d1 = +p0[1] - +p1[1];
              if (pdx !== null && (d0 !== pdx[0] || d1 !== pdx[1])) bendsB++;
              pdx = [d0, d1];
            }
            const lastD = pdx; // first step dir from b toward a
            (S[a + '>' + b] = S[a + '>' + b] || []).push({ edges: st.edges, interior, dirFrom: [dr0, dc0], bendsFrom: st.bends, sig });
            (S[b + '>' + a] = S[b + '>' + a] || []).push({ edges: st.edges, interior, dirFrom: lastD, bendsFrom: bendsB, sig });
          }
          continue;
        }
        if (st.edges.length >= MAXLEN) continue;
        for (const [dr, dc] of DIRLIST) {
          const nr = st.r + dr, nc = st.c + dc;
          if (nr < 0 || nr > R || nc < 0 || nc > C) continue;
          const nk = nr + ',' + nc;
          if (st.nodes.includes(nk)) continue;
          const nb = st.bends + ((dr !== st.pdr || dc !== st.pdc) ? 1 : 0);
          stack.push({ r: nr, c: nc, pdr: dr, pdc: dc, bends: nb, nodes: st.nodes.concat([nk]), edges: st.edges.concat([ek(st.r, st.c, nr, nc)]) });
        }
      }
    }
  }
  const dotDir = ci => DIRS[ci.dir];
  // LIFO enumeration surfaces maximal wiggles first — sort short-first so the DFS
  // finds compact solutions before burning the search budget on dead subtrees
  for (const k in S) S[k].sort((a, b) => a.edges.length - b.edges.length);
  // tails: simple paths from a circle with NO circles, ending at a non-circle node
  const T = []; // T[circleIdx] = [{edges, interior, dirFrom, bendsFrom, sig}]
  for (let a = 0; a < N; a++) {
    const A = lv.circles[a];
    const out = [];
    for (const [dr0, dc0] of DIRLIST) {
      const fr = A.r + dr0, fc = A.c + dc0;
      if (fr < 0 || fr > R || fc < 0 || fc > C) continue;
      const stack = [{ r: fr, c: fc, pdr: dr0, pdc: dc0, bends: 0, nodes: [A.r + ',' + A.c, fr + ',' + fc], edges: [ek(A.r, A.c, fr, fc)] }];
      let exp = 0;
      while (stack.length && out.length < 3000 && exp < 150000) {
        const st = stack.pop(); exp++;
        out.push({ edges: st.edges, interior: st.nodes.slice(1, -1), dirFrom: [dr0, dc0], bendsFrom: st.bends, sig: st.edges.slice().sort().join('|'), len: st.edges.length });
        if (st.edges.length >= MAXLEN) continue;
        for (const [dr, dc] of DIRLIST) {
          const nr = st.r + dr, nc = st.c + dc;
          if (nr < 0 || nr > R || nc < 0 || nc > C) continue;
          const nk = nr + ',' + nc;
          if (st.nodes.includes(nk) || circleAt[nk] !== undefined) continue;
          stack.push({ r: nr, c: nc, pdr: dr, pdc: dc, bends: st.bends + ((dr !== st.pdr || dc !== st.pdc) ? 1 : 0), nodes: st.nodes.concat([nk]), edges: st.edges.concat([ek(st.r, st.c, nr, nc)]) });
        }
      }
    }
    T.push(out.sort((a, b) => a.edges.length - b.edges.length));
  }
  function circleOk(ci, links) { // links = [{dirFrom,bendsFrom,isTail}] viewed FROM the circle
    if (ci.num < 0) return true;
    const d = dotDir(ci);
    for (const L of links) {
      if (L.isTail) continue; // trace into a tail dead-ends; tail side can never satisfy
      if (L.dirFrom[0] === d[0] && L.dirFrom[1] === d[1] && L.bendsFrom === ci.num) {
        // dot side must not ALSO be offered by a tail (engine walks dot edge first)
        return true;
      }
    }
    return false;
  }
  function tailDotClash(ci, tail) { // if the tail leaves in the dot direction, traceBeam walks it and dead-ends
    if (ci.num < 0) return false;
    const d = dotDir(ci);
    return tail.dirFrom[0] === d[0] && tail.dirFrom[1] === d[1];
  }
  // assembly DFS: chain of circles starting at circle 0; close into a cycle, or cap with tails
  const inChain = new Array(N).fill(false); inChain[0] = true;
  const chain = [0];
  const usedEdges = new Set(), usedNodes = new Set();
  const chosen = []; // records chosen for links chain[i]->chain[i+1] (from chain[i] view)
  const getFromView = (me, other, sig) => {
    for (const x of (S[me + '>' + other] || [])) if (x.sig === sig) return x;
    return null;
  };
  function dfs(inTail) { // inTail = tail feeding circle 0 (or null for cycle attempts)
    const cur = chain[chain.length - 1];
    if (chain.length === N) {
      // shape A: cycle cur -> 0 (only when no tail)
      if (!inTail) {
        for (const r of (S[cur + '>' + 0] || [])) {
          if (!r.edges.every(e => !usedEdges.has(e))) continue;
          if (!r.interior.every(n => !usedNodes.has(n))) continue;
          const curCI = lv.circles[cur];
          const inRecCur = chain.length >= 2 ? getFromView(cur, chain[chain.length - 2], chosen[chosen.length - 1].sig) : null;
          if (!circleOk(curCI, [inRecCur, r].map(x => x && { dirFrom: x.dirFrom, bendsFrom: x.bendsFrom, isTail: false }))) continue;
          const zeroCI = lv.circles[0];
          const links0 = [getFromView(0, cur, r.sig), getFromView(0, chain[1], chosen[0].sig)].map(x => x && { dirFrom: x.dirFrom, bendsFrom: x.bendsFrom, isTail: false });
          if (!circleOk(zeroCI, links0)) continue;
          return { edges: chosen.concat([r]).flatMap(x => x.edges), shape: 'cycle' };
        }
      }
      // shape B: path — requires tails at BOTH ends (circle 0's degree needs the in-tail)
      if (!inTail) return null;
      for (const t of T[cur]) {
        if (!t.edges.every(e => !usedEdges.has(e))) continue;
        if (!t.interior.every(n => !usedNodes.has(n))) continue;
        const curCI = lv.circles[cur];
        const inRecCur = chain.length >= 2 ? getFromView(cur, chain[chain.length - 2], chosen[chosen.length - 1].sig) : null;
        const links = [];
        if (inRecCur) links.push({ dirFrom: inRecCur.dirFrom, bendsFrom: inRecCur.bendsFrom, isTail: false });
        links.push({ dirFrom: t.dirFrom, bendsFrom: t.bendsFrom, isTail: true });
        if (!circleOk(curCI, links)) continue;
        if (tailDotClash(curCI, t)) continue;
        // circle 0's links: inTail (if any) + first chain link
        const zeroCI = lv.circles[0];
        const links0 = [];
        if (inTail) links0.push({ dirFrom: inTail.dirFrom, bendsFrom: inTail.bendsFrom, isTail: true });
        const out0 = getFromView(0, chain[1], chosen[0].sig);
        if (out0) links0.push({ dirFrom: out0.dirFrom, bendsFrom: out0.bendsFrom, isTail: false });
        if (!circleOk(zeroCI, links0)) continue;
        if (inTail && tailDotClash(zeroCI, inTail)) continue;
        return { edges: inTail.edges.concat(chosen.flatMap(x => x.edges), t.edges), shape: 'path+tails' };
      }
      return null;
    }
    for (let nxt = 0; nxt < N; nxt++) {
      if (inChain[nxt]) continue;
      for (const r of (S[cur + '>' + nxt] || [])) {
        if (!r.edges.every(e => !usedEdges.has(e))) continue;
        if (!r.interior.every(n => !usedNodes.has(n))) continue;
        let okCur = true;
        if (chain.length >= 2) {
          const inRecCur = getFromView(cur, chain[chain.length - 2], chosen[chosen.length - 1].sig);
          okCur = circleOk(lv.circles[cur], [inRecCur, r].map(x => x && { dirFrom: x.dirFrom, bendsFrom: x.bendsFrom, isTail: false }));
        } else if (inTail) {
          const zeroCI = lv.circles[0];
          const out0 = getFromView(0, nxt, r.sig);
          okCur = circleOk(zeroCI, [{ dirFrom: inTail.dirFrom, bendsFrom: inTail.bendsFrom, isTail: true }, { dirFrom: out0.dirFrom, bendsFrom: out0.bendsFrom, isTail: false }]) && !tailDotClash(zeroCI, inTail);
        }
        if (!okCur) continue;
        inChain[nxt] = true; chain.push(nxt); chosen.push(r);
        r.edges.forEach(e => usedEdges.add(e)); r.interior.forEach(n => usedNodes.add(n));
        const res = dfs(inTail);
        if (res) return res;
        r.edges.forEach(e => usedEdges.delete(e)); r.interior.forEach(n => usedNodes.delete(n));
        chain.pop(); chosen.pop(); inChain[nxt] = false;
      }
    }
    return null;
  }
  let sol = dfs(null);
  if (!sol) { // try path shapes with a tail into circle 0
    for (const t of T[0]) {
      t.edges.forEach(e => usedEdges.add(e)); t.interior.forEach(n => usedNodes.add(n));
      sol = dfs(t);
      t.edges.forEach(e => usedEdges.delete(e)); t.interior.forEach(n => usedNodes.delete(n));
      if (sol) break;
    }
  }
  if (!sol) return { fail: 'no clean solution (segs: ' + Array.from({ length: N }, (_, i) => Object.keys(S).filter(k => k.startsWith(i + '>')).reduce((s, k) => s + S[k].length, 0)).join(',') + ')' };
  const edges = {};
  for (const e of sol.edges) edges[e] = true;
  const v = validate(lv, edges);
  if (!v.ok) return { fail: 'validator: ' + v.why + ' shape=' + sol.shape };
  return { ok: true, edges: Object.keys(edges), shape: sol.shape };
}

function validate(lv, edges) {
  const circleSet = {}; lv.circles.forEach((c, i) => circleSet[c.r + ',' + c.c] = i);
  const adj = {};
  for (const k in edges) {
    const p = k.split(/[-,]/); const r1 = +p[0], c1 = +p[1], r2 = +p[2], c2 = +p[3];
    const a = r1 + ',' + c1, b = r2 + ',' + c2;
    (adj[a] = adj[a] || []).push(b); (adj[b] = adj[b] || []).push(a);
  }
  for (const ci of lv.circles) if ((adj[ci.r + ',' + ci.c] || []).length !== 2) return { ok: false, why: 'degree' };
  const start = lv.circles[0].r + ',' + lv.circles[0].c;
  const seen = { [start]: 1 }, q = [start];
  while (q.length) for (const n of (adj[q.shift()] || [])) if (!seen[n]) { seen[n] = 1; q.push(n); }
  for (const ci of lv.circles) if (!seen[ci.r + ',' + ci.c]) return { ok: false, why: 'connectivity' };
  const ek = (r1, c1, r2, c2) => (r1 > r2 || (r1 === r2 && c1 > c2)) ? ek(r2, c2, r1, c1) : r1 + ',' + c1 + '-' + r2 + ',' + c2;
  for (const ci of lv.circles) {
    if (ci.num < 0) continue;
    const d = DIRS[ci.dir], fr = ci.r + d[0], fc = ci.c + d[1];
    if (!edges[ek(ci.r, ci.c, fr, fc)]) return { ok: false, why: 'no dot edge' };
    let cr = fr, cc = fc, pdr = d[0], pdc = d[1], bends = 0, steps = 0;
    const vis = { [ci.r + ',' + ci.c]: 1, [cr + ',' + cc]: 1 };
    while (steps++ < 500) {
      const k = cr + ',' + cc;
      if (circleSet[k] !== undefined) { if (bends !== ci.num) return { ok: false, why: 'bends ' + bends + '!=' + ci.num }; break; }
      const nx = (adj[k] || []).filter(n => !vis[n]);
      if (nx.length !== 1) return { ok: false, why: 'walk branch/dead' };
      const p = nx[0].split(','); const nr = +p[0], nc = +p[1];
      const ndr = nr - cr, ndc = nc - cc;
      if (ndr !== pdr || ndc !== pdc) bends++;
      vis[nx[0]] = 1; cr = nr; cc = nc; pdr = ndr; pdc = ndc;
    }
  }
  return { ok: true };
}

let okc = 0, failc = 0;
const t0 = Date.now();
const allSolutions = {};
const only = process.argv[2] ? process.argv[2].split(',').map(Number) : null;
for (const lv of LEVELS) {
  if (only && !only.includes(lv.id)) continue;
  const tl = Date.now();
  process.stdout.write('L' + lv.id + ' (r' + lv.gridR + 'xc' + lv.gridC + ', ' + lv.circles.length + 'circles) ... ');
  const r = solveLevel(lv);
  if (r.ok) { okc++; allSolutions[lv.id] = r.edges; console.log('OK ' + r.shape + ' edges=' + r.edges.length + ' [' + (Date.now() - tl) + 'ms]'); }
  else { failc++; console.log('FAIL:', r.fail, '[' + (Date.now() - tl) + 'ms]'); }
}
console.log('TOTAL ok=' + okc + ' fail=' + failc + ' in ' + ((Date.now() - t0) / 1000).toFixed(1) + 's');
if (okc === LEVELS.length) fs.writeFileSync('hotaru-beam/_solutions.json', JSON.stringify(allSolutions));
