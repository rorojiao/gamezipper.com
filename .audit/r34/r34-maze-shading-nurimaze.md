# R34 Maze-Shading Cluster: nurimeizu vs nurimaze

**Date**: 2026-07-30 CST
**Verdict**: KEEP_BOTH_DISTINCT_ACTION_VARIANT
**Live**: 447 / 447 unique / 0 hidden / 0 dups

## Rule-25 Axis Comparison

| Axis | nurimeizu | nurimaze | Match? |
|------|-----------|----------|--------|
| **WIN CONDITION** | BFS-shortest-path (dist+distG=td) + circles on geodesic + triangles off geodesic | BFS-from-S-with-parent-path + circles on pathSet + triangles off pathSet | ✅ MATCH (mathematically equivalent: BFS finds shortest path) |
| **ALLOWED ACTION** | room-paint (paint whole room black/white) | cell-paint (toggle individual cell black/white) | ❌ MISMATCH |
| **STORAGE** | room topology + per-room paint array | pre-computed binary string per grid cell | distinct |
| **DECISION COUNT** | ~5-15 rooms per level | ~25-81 cells per level | distinct |

Per Rule-25: **same WIN + different ACTION = distinct variants → KEEP BOTH.**

## Evidence

### Production validators
- **nurimeizu**: `verify_engine.js` 30/30 PASS + `verify_independent.js` 30/30 PASS
- **nurimaze**: production-equivalent BFS-via-parent replica 30/30 PASS + independent Python BFS-shortest-path validator 30/30 PASS

### Encoded win predicate (BOTH games compute geodesic S↔G, require circles on it, triangles off it)

nurimeizu/checkSolution (line 245):
```js
const sr=lv.s[0], sc=lv.s[1], gr=lv.g[0], gc=lv.g[1];
// BFS dist from S
const dist={}; ...
// BFS distG from G
const distG={}; ...
const onPath=new Set();
for(const k in dist) if(k in distG && dist[k]+distG[k]===td) onPath.add(k);
for(const cc of lv.circles) if(!onPath.has(cc[0]+','+cc[1])) return false;  // circle ON geodesic
for(const cc of lv.triangles) if(onPath.has(cc[0]+','+cc[1])) return false;  // triangle OFF geodesic
```

nurimaze/checkMazePath:
```js
// BFS from S through white cells
var queue=[[sy,sx]]; visited[sy+','+sx]=true;
while(queue.length) { ... }
// Reconstruct path via parent pointers
var pathSet={}; var curKey=gy+','+gx;
while(curKey) { pathSet[curKey]=true; curKey=parent[curKey]; }
// Check circles on path, triangles not on path
```

BFS-via-parent produces a SHORTEST path; the predicate that requires circles on the pathSet is equivalent to "circles on the geodesic" (since there's only one shortest path per BFS tie-breaking order — and our tie-breaking is the same direction priority `[[-1,0],[1,0],[0,-1],[0,1]]`).

### Sandbox test: any-reachable-path vs shortest-path on nurimaze
- Independent validator using "any-reachable-path" → 17/30 (triangles on path in 13 levels)
- Independent validator using "shortest-path" → 30/30
- Production predicate (BFS-via-parent) is shortest-path required. Matches nurimeizu's predicate.

## Quality Scores

| Component | nurimeizu | nurimaze |
|-----------|-----------|----------|
| Core/data (35) | 33 | 30 |
| Input/mobile (15) | 13 | 14 |
| Onboarding (10) | 5 | 4 |
| Visual/audio (10) | 8 | 9 |
| Lifecycle/persistence (10) | 8 | 9 |
| Verifier (10) | 9 | 3 |
| BI 30d (10) | 4 | 3 |
| **Total** | **80** | **72** |

(Keeper tie-break: even if duplicate, nurimeizu > nurimaze — but the rule does not declare a duplicate.)

## BI 30d (gamezipper.com, CST)

| Slug | Events | UV |
|------|-------|----|
| nurimeizu | 85 | 8 |
| nurimaze | 52 | 4 |

Both above BI's recent-rolloff threshold (>0 events), so neither is a candidate for low-traffic-only deletion.

## Other surface-level candidates (kept both after brief check)
- sandwich-sudoku vs outside-sudoku: distinct win rule ("sum between 1 and N" vs "which digits appear on border"). KEEP BOTH.
- blue vs black: thematic templates (same template family, thematically opposite, different trick per level). KEEP BOTH.
- chess vs checkers, yahtzee: chess/yahtzee appear only because of shared wordlist tokens ("puzzle"/"play") — board games are objectively distinct. KEEP ALL.

## Convergent state

- Catalog atomic consistency PASS (live=447 unique=447 hidden=0 dups=0)
- sync-game-counts ALL IN SYNC
- sync-user-visible-text ALL IN SYNC
- site-chrome 447/447 PASS
- Repository-wide verifier gate: 52/53 PASS (color-pour TIMEOUT remains blocker)

## Action: NONE

No deletion, no schema change, no sitemap change. Both games remain at their canonical URLs and continue serving as distinct member variants of the maze-shading family. The 80 vs 72 quality delta does NOT trigger Rule-25 deletion (the rule requires WIN + ACTION match — ACTION mismatches).

## Next tick

Tier-3 candidates remaining (untouched this tick):
- pulse-path, hexa-2048, criss-cross, fountain-fill, sand-trap — various sizes of "fill region" family. Index pairs at jd>=0.5 not yet adjudicated.
- New Jaccard pass next tick before rule-25 adjudication of these clusters.
