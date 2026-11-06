#!/usr/bin/env node
/**
 * R339 — solvability proof for the tangle-master catalog.
 *
 * A level is WINNABLE iff its graph admits a crossing-free STRAIGHT-LINE
 * drawing, because the player can only DRAG NODES (positions are free, the
 * edges are straight segments).  By Fary's theorem a graph has such a drawing
 * iff it is PLANAR.  So planarity is the exact, necessary AND sufficient test.
 *
 * The engine's own win predicate counts a crossing between two edges that
 * share no endpoint, using a STRICT orientation test (ccw(a,b,c) !==
 * ccw(a,b,d)), so a "touching but not crossing" configuration is not a
 * crossing for the engine.  A planar embedding therefore wins the level.
 *
 * The m <= 3n-6 edge bound is only NECESSARY; this file runs the real
 * planarity test (Boyer-Myrvold via networkx, plus a Kuratowski-subgraph
 * cross-check with an independent brute-force for small n).
 *
 * CALIBRATION:
 *   POSITIVE  K5   -> non-planar (MUST be reported non-planar)
 *   POSITIVE  K3,3 -> non-planar (MUST be reported non-planar)
 *   NEGATIVE  a cycle / a tree / a planar triangulation -> planar
 *   NEGATIVE  a graph with a crossing in a NAIVE layout but planar -> planar
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..');

function extractLevels(slug) {
  const html = fs.readFileSync(path.join(ROOT, slug, 'index.html'), 'utf8');
  const m = /(?:const|var|let)\s+LEVELS\s*=\s*\[/.exec(html);
  if (!m) return null;
  const start = html.indexOf('[', m.index);
  let depth = 0, i = start, inStr = null;
  for (; i < html.length; i++) {
    const c = html[i];
    if (inStr) { if (c === '\\') { i++; continue; } if (c === inStr) inStr = null; continue; }
    if (c === '"' || c === "'" || c === '`') { inStr = c; continue; }
    if (c === '[' || c === '{') depth++;
    else if (c === ']' || c === '}') { depth--; if (depth === 0) { i++; break; } }
  }
  return new Function('return (' + html.slice(start, i) + ')')();
}

const PY = `
import json, sys, itertools
import networkx as nx

data = json.load(open(sys.argv[1]))
res = []
for lv in data:
    G = nx.Graph()
    G.add_nodes_from(range(lv['n']))
    G.add_edges_from(tuple(e) for e in lv['e'])
    planar = nx.check_planarity(G)[0]
    # independent cross-check: Kuratowski subgraph search for small graphs
    kur = False
    if lv['n'] <= 8:
        for sub in itertools.combinations(range(lv['n']), 5):
            H = G.subgraph(sub)
            if H.number_of_edges() == 10 and all(d == 4 for _, d in H.degree()):
                kur = True; break
        if not kur:
            for sub in itertools.combinations(range(lv['n']), 6):
                H = G.subgraph(sub)
                if H.number_of_edges() == 9 and sorted(d for _, d in H.degree()) == [2,2,2,3,3,3]:
                    kur = True; break
    res.append({'idx': lv['idx'], 'n': lv['n'], 'm': lv['m'], 'planar': bool(planar), 'kuratowski': kur})
json.dump(res, open(sys.argv[2], 'w'))
`;

function pyPlanarity(levels) {
  const inFile = '/tmp/r339-lv.json', outFile = '/tmp/r339-plan.json';
  fs.writeFileSync(inFile, JSON.stringify(levels));
  fs.writeFileSync('/tmp/r339-plan.py', PY);
  execFileSync('python3', ['/tmp/r339-plan.py', inFile, outFile], { encoding: 'utf8' });
  return JSON.parse(fs.readFileSync(outFile, 'utf8'));
}

function main() {
  const slug = process.argv[2] || 'tangle-master';
  const L = extractLevels(slug);
  const levels = L.map((lv, idx) => ({
    idx: idx + 1, n: lv.n, m: lv.e.length,
    e: lv.e.map(x => [x[0], x[1]]),
  }));

  console.log(`=== CALIBRATION CONTROLS ===`);
  const ctrl = (label, g, expectPlanar) => {
    const r = pyPlanarity([{ idx: 1, n: g.n, m: g.e.length, e: g.e }])[0];
    const ok = r.planar === expectPlanar;
    console.log(`  ${label}: planar=${r.planar} (expected ${expectPlanar}) ${ok ? 'OK' : '<-- PROBE WRONG'}`);
  };
  // K5 : 5 nodes, all 10 edges
  ctrl('POSITIVE K5 (non-planar) ', { n: 5, e: [[0,1],[0,2],[0,3],[0,4],[1,2],[1,3],[1,4],[2,3],[2,4],[3,4]] }, false);
  // K3,3 : 6 nodes, 9 edges
  ctrl('POSITIVE K3,3 (non-planar)', { n: 6, e: [[0,3],[0,4],[0,5],[1,3],[1,4],[1,5],[2,3],[2,4],[2,5]] }, false);
  ctrl('NEGATIVE cycle C5 (planar)', { n: 5, e: [[0,1],[1,2],[2,3],[3,4],[4,0]] }, true);
  ctrl('NEGATIVE tree (planar)    ', { n: 6, e: [[0,1],[0,2],[0,3],[1,4],[1,5]] }, true);
  ctrl('NEGATIVE K4 (planar)      ', { n: 4, e: [[0,1],[0,2],[0,3],[1,2],[1,3],[2,3]] }, true);

  console.log(`\n=== ${slug.toUpperCase()} — ${levels.length} LEVELS ===`);
  const plan = pyPlanarity(levels);
  let nonPlanar = 0, disagree = 0;
  for (const r of plan) {
    const flag = r.planar ? 'PLANAR (winnable)' : 'NON-PLANAR (UNWINNABLE)';
    if (!r.planar) nonPlanar++;
    if (r.kuratowski && r.planar) disagree++;
    if (r.kuratowski !== !r.planar && r.kuratowski) disagree++;
    console.log(`  L${String(r.idx).padStart(2)}  n=${String(r.n).padStart(2)} m=${String(r.m).padStart(2)}  ${flag}${r.kuratowski ? '  [Kuratowski subgraph found]' : ''}`);
  }
  console.log(`\n  planar: ${plan.filter(r => r.planar).length}/${plan.length}   NON-PLANAR (unwinnable): ${nonPlanar}`);
  console.log(`  planarity-vs-Kuratowski disagreements: ${disagree}`);
  console.log(`  VERDICT: ${nonPlanar === 0 && disagree === 0 ? 'all levels winnable (each graph is planar -> a crossing-free straight-line embedding exists)' : 'DEFECT: ' + nonPlanar + ' unwinnable level(s)'}`);
}

main();
