L30 verdict: SOLVABLE

All commands below run in /tmp/gz-sugar-l30/sugar-sugar. No network, new dependencies,
commits, pushes, game edits or gate edits were used. Node's existing canvas/input
harness runs the real game code; no browser was launched.

Changes

- solver_strong.js: replace the coprime-stride product sampler with deterministic
  per-cup coordinate descent and partial-credit ranking. Retain the exact physics
  self-tests, supply proof, engine replay, capture/alignment and recorded battery.
  Export the existing helpers for reproducible offline experiments. The old
  SS_SEARCH_MS tier0 cutoff is replaced by finite sweep/refinement bounds.
- staged_search.js: isolated-route ranking, eight fixed restarts, batched complete
  single-coordinate sweeps, strict ascent, caching, and explicit exhaustion state.
- wall_routes.js: bounded wall-endpoint waypoint grids and rail variants. These
  enrich the catalog, but were not needed to construct the final solution.
- refine_plan.js: finite point grids with partial credit over fixed counterexample
  streams; all 96 cases must pass before a candidate leaves this stage.
- solutions.json: add L30 in the existing shape; 8 strokes, 19 points,
  releaseFrames=0, robustness={seedsPassed:96,seedsTried:96,rate:1}.
  L12/L24/L29 entries are deep-equal to the original; no shape changes.
- solver_results.json: final three-channel proofs for L12/L24/L29/L30.
- refine_l30.js and evidence-l30/: experiment driver, initial search state,
  reproducible refinement driver, tests, negative control and full raw logs.

Search that closed the level

The original catalogs plus an empty-route option were 60 x 109 x 11 x 267.
Eight restarts completed 76 coordinate sweeps, evaluating 5,758 tuples in 129 s
(130 s whole process). Best tuple: [55,1,6,263], fills 21/12,10/15,12/12,16/10.
Three pair neighbourhoods (1,2), (0,2), (2,3) were fully exhausted: 1,199 + 660 +
2,937 = 4,796 plans, with no improvement. A fourth pair scan was interrupted to
prioritize route geometry; it is NOT claimed exhausted, and its partial simulation
count was not retained. No claim about exhausting the 17M product is made.

A finite downhill endpoint/waypoint grid found a single-seed all-cup winner after
113 evaluations; its first battery was only 10/96. The exploratory grid continued
without a robustness gradient and was replaced by counterexample-guided refinement.
Its exact starting plan is retained in refine-progress.json.

The closing refinement evaluated 1000 distinct geometries, ran 7687 physics
simulations including batteries, and passed on its third grid pass with 14 fixed
counterexample cases accumulated. First run: 53.104 s. Independent deterministic
repeat: 54.838 s, identical 1,000 geometries / 7,687 simulations and
byte-identical candidate output. This is the strategy that closed L30; the pair
scans and richer wall catalog did not produce the final plan.

Reproduce the closing search from its retained initial frontier

    node evidence-l30/run-refine.js
    SS_LEVELS=30 SS_CANDIDATES=/tmp/gz-sugar-l30/sugar-sugar/evidence-l30/candidate.json node solver_strong.js

Closing-search output (first run)

boot ok dims=464x464 levels=30
self-test ok: simStatic === shipped simulate (3 plans x 3 seeds, bitwise)
refine battery 56/96 sims=1017
refine counterexample 424242/127
refine battery 64/96 sims=1498
refine counterexample 987654/200
refine pass 1 cases=5 score=494.64000000000004 sims=1619
refine battery 64/96 sims=1785
refine counterexample 987654/127
refine battery 64/96 sims=2398
refine counterexample 987654/63
refine battery 94/96 sims=3167
refine counterexample 7/200
refine battery 93/96 sims=3680
refine counterexample 271828/127
refine battery 93/96 sims=5028
refine counterexample 31337/0
refine pass 2 cases=10 score=496.82666666666665 sims=5269
refine battery 91/96 sims=5555
refine counterexample 99/7
refine battery 95/96 sims=5916
refine counterexample 60601/0
refine battery 89/96 sims=6985
refine counterexample 13/7
refine battery 94/96 sims=7394
refine counterexample 4242/7
refine battery 96/96 sims=7687
robust refinement done true 53104

Proof output

boot ok dims=464x464 levels=30
self-test ok: simStatic === shipped simulate (3 plans x 3 seeds, bitwise)
physics pool: 8 workers; all bitwise self-tests passed
L30 tier1 band: 1 (top 6/6, worst kept 0/6) t=96ms
L30 gauntlet best: 48/48 gen=search-frontier t=397ms
L30 engine try1 gen=search-frontier won=true fills=12/12,15/15,12/12,10/10
L30 capture-run won=true engFrame~232 sim=win@f232 align@589
L30 SOLVABLE — engine x2 + capture/exact-stream win@f232 (d0) + recorded battery 96/96
L30 => SOLVABLE (level budget 1.2s, sims 151)
=== sugar-sugar strong solver — per-level verdicts (L30) ===
level | name            | verdict         | gauntlet | engine | evidence
30    | Ultimate Sugar  | SOLVABLE        | 96/96    | x2 won | strokes=8, replay: engine x2 + sim 96/96
{"counts":{"SOLVABLE":1,"UNSOLVABLE":0,"STILL-UNPROVEN":0},"allSettled":true,"out":"/tmp/gz-sugar-l30/sugar-sugar/solver_results.json","durS":2}

The first real-engine win, capture-run, second fresh engine win and 96/96 battery
all passed. Capture run: engine frame 232, exact LCG sim frame 232, alignment 589,
frame difference 0. Solver recorded ENGINE-captured geometry, not merely proposals.
Final code was also run using:

    SS_LEVELS=12,24,29,30 node solver_strong.js

boot ok dims=464x464 levels=30
self-test ok: simStatic === shipped simulate (3 plans x 3 seeds, bitwise)
physics pool: 8 workers; all bitwise self-tests passed
L12 tier1 band: 1 (top 6/6, worst kept 0/6) t=92ms
L12 gauntlet best: 48/48 gen=recorded t=501ms
L12 engine try1 gen=recorded won=true fills=35/35
L12 capture-run won=true engFrame~268 sim=win@f268 align@503
L12 SOLVABLE — engine x2 + capture/exact-stream win@f268 (d0) + recorded battery 96/96
L12 => SOLVABLE (level budget 2.3s, sims 151)
L24 tier1 band: 1 (top 6/6, worst kept 0/6) t=38ms
L24 gauntlet best: 48/48 gen=recorded t=265ms
L24 engine try1 gen=recorded won=true fills=15/15,15/15,15/15
L24 capture-run won=true engFrame~438 sim=win@f437 align@1753
L24 SOLVABLE — engine x2 + capture/exact-stream win@f437 (d1) + recorded battery 96/96
L24 => SOLVABLE (level budget 1.2s, sims 151)
L29 tier1 band: 1 (top 6/6, worst kept 0/6) t=72ms
L29 gauntlet best: 48/48 gen=recorded t=262ms
L29 engine try1 gen=recorded won=true fills=12/12,12/12,12/12,12/12
L29 capture-run won=true engFrame~696 sim=win@f696 align@3051
L29 SOLVABLE — engine x2 + capture/exact-stream win@f696 (d0) + recorded battery 96/96
L29 => SOLVABLE (level budget 1.1s, sims 151)
L30 tier1 band: 1 (top 6/6, worst kept 0/6) t=42ms
L30 gauntlet best: 48/48 gen=recorded t=254ms
L30 engine try1 gen=recorded won=true fills=12/12,15/15,12/12,10/10
L30 capture-run won=true engFrame~248 sim=win@f247 align@4351
L30 SOLVABLE — engine x2 + capture/exact-stream win@f247 (d1) + recorded battery 96/96
L30 => SOLVABLE (level budget 0.9s, sims 151)
=== sugar-sugar strong solver — per-level verdicts (L12,L24,L29,L30) ===
level | name            | verdict         | gauntlet | engine | evidence
12    | Cascade         | SOLVABLE        | 96/96    | x2 won | strokes=2, replay: engine x2 + sim 96/96
24    | Complex Routing | SOLVABLE        | 96/96    | x2 won | strokes=6, replay: engine x2 + sim 96/96
29    | Grand Finale    | SOLVABLE        | 96/96    | x2 won | strokes=6, replay: engine x2 + sim 96/96
30    | Ultimate Sugar  | SOLVABLE        | 96/96    | x2 won | strokes=8, replay: engine x2 + sim 96/96
{"counts":{"SOLVABLE":4,"UNSOLVABLE":0,"STILL-UNPROVEN":0},"allSettled":true,"out":"/tmp/gz-sugar-l30/sugar-sugar/solver_results.json","durS":7}

Required gate baseline

    node verify_engine.js

sugar-sugar: 29/30 levels via real drawn-line physics: FAIL
{"pass":45,"fail":2,"total":47,"verdict":"FAIL","fails":["level-30-won: no sim-passing plan (bot-limited)","all-30-levels: 30:no-plan"],"extra":{"levels":"29/30","durS":54,"notes":"HONEST-FAIL (bot-limited; engine physics clean — the deterministic physics port matches the engine step-for-step, no P0/P1 found): 30:no-plan. policy plans: 24, static plans: 2; failed-level fills: L9pol:7/15,27/15,56/15|3/15,33/15,54/15 L12pol:13/35|18/35 L19pol:0/35|1/35 L24pol:0/15,0/15,0/15|0/15,0/15,0/15 L29pol:29/12,2/12,9/12,30/12|35/12,0/12,10/12,34/12 L30pol:1/12,0/15,0/12,0/10|0/12,0/15,1/12,0/10; static-gen>5s: 30; retries=0; 3-star=29/30; menu/toolbar buttons are inline onclick (harness stubs) — nav via real level cards + engine globals; cw auto=464"}}

Required positive gate (exit 0)

    node verify_engine.js

sugar-sugar: 30/30 levels via real drawn-line physics: PASS
{"pass":47,"fail":0,"total":47,"verdict":"PASS","fails":[],"extra":{"levels":"30/30","durS":51,"notes":"policy plans: 24, static plans: 2; failed-level fills: L9pol:7/15,27/15,56/15|3/15,33/15,54/15 L12pol:13/35|18/35 L19pol:0/35|1/35 L24pol:0/15,0/15,0/15|0/15,0/15,0/15 L29pol:29/12,2/12,9/12,30/12|35/12,0/12,10/12,34/12 L30pol:1/12,0/15,0/12,0/10|0/12,0/15,1/12,0/10; static-gen>5s: ; retries=0; 3-star=30/30; menu/toolbar buttons are inline onclick (harness stubs) — nav via real level cards + engine globals; cw auto=464"}}

Required replay (exit 0)

    node replay_plans.js

self-test ok: simStatic === shipped simulate (3 plans x 3 seeds, bitwise)
replay_plans: asserting 4 SOLVABLE plans from solutions.json
L12 "Cascade" | engine: WON f264 | exact-stream: win@f264 align@101 | battery: 96/96 | REPLAY-OK
L24 "Complex Routing" | engine: WON f422 | exact-stream: win@f421 align@503 | battery: 96/96 | REPLAY-OK
L29 "Grand Finale" | engine: WON f686 | exact-stream: win@f686 align@949 | battery: 96/96 | REPLAY-OK
L30 "Ultimate Sugar" | engine: WON f226 | exact-stream: win@f225 align@1355 | battery: 96/96 | REPLAY-OK
ALL REPLAYS OK

Mandatory negative control and restoration (driver exit 0)

    node evidence-l30/negative-control.js

The script saves the exact solutions.json bytes, applies only:

    solutions["30"].strokes[0].forEach(p => p.x += 40)

It runs node verify_engine.js, restores in a finally block, then runs the same gate
again and asserts the expected exits and verdicts. Actual output:

Perturbation: solutions["30"].strokes[0].forEach(p => p.x += 40)
node verify_engine.js -> exit 1 [evidence-l30/negative-gate.log]
{"pass":45,"fail":2,"total":47,"verdict":"FAIL","fails":["level-30-won: no sim-passing plan (bot-limited)","all-30-levels: 30:no-plan"],"extra":{"levels":"29/30","durS":54,"notes":"HONEST-FAIL (bot-limited; engine physics clean — the deterministic physics port matches the engine step-for-step, no P0/P1 found): 30:no-plan. policy plans: 24, static plans: 2; failed-level fills: L9pol:7/15,27/15,56/15|3/15,33/15,54/15 L12pol:13/35|18/35 L19pol:0/35|1/35 L24pol:0/15,0/15,0/15|0/15,0/15,0/15 L29pol:29/12,2/12,9/12,30/12|35/12,0/12,10/12,34/12 L30pol:1/12,0/15,0/12,0/10|0/12,0/15,1/12,0/10; static-gen>5s: 30; retries=0; 3-star=29/30; menu/toolbar buttons are inline onclick (harness stubs) — nav via real level cards + engine globals; cw auto=464"}}
Restored solutions.json byte-for-byte
node verify_engine.js -> exit 0 [evidence-l30/restored-gate.log]
{"pass":47,"fail":0,"total":47,"verdict":"PASS","fails":[],"extra":{"levels":"30/30","durS":51,"notes":"policy plans: 24, static plans: 2; failed-level fills: L9pol:7/15,27/15,56/15|3/15,33/15,54/15 L12pol:13/35|18/35 L19pol:0/35|1/35 L24pol:0/15,0/15,0/15|0/15,0/15,0/15 L29pol:29/12,2/12,9/12,30/12|35/12,0/12,10/12,34/12 L30pol:1/12,0/15,0/12,0/10|0/12,0/15,1/12,0/10; static-gen>5s: ; retries=0; 3-star=30/30; menu/toolbar buttons are inline onclick (harness stubs) — nav via real level cards + engine globals; cw auto=464"}}
PASS: L30 perturbation rejected; exact restoration passes 30/30

Additional validation

    node evidence-l30/check-search.js
    sha256sum -c evidence-l30/immutable.sha256
    git diff --check

PASS: fractional scoring, satisfied-cup priority, finite coordinate search finds joint solution
index.html: OK
verify_engine.js: OK

Verified: final solutions.json is byte-identical to the input of the restored
30/30 gate run. Repeated search candidate is deep-equal to the proven engine
geometry. Existing solution entries 12/24/29 are intact. All spawned physics
workers were terminated. No browser was launched; the only observed Chrome-name
process was an unrelated, 16-day-old Orca crashpad handler and was left untouched.

Remaining limits

No required deliverable is outstanding. SOLVABLE meets the existing engine + exact
stream + 96-case standard; the finite battery is not a theorem over every possible
RNG stream. The geometric descent is local search, not an unsolvability proof.
The unused fourth pair scan and exploratory single-seed grid are honestly reported
above; their unretained partial counts are excluded from the precise closing-stage
metrics. No data-level UNSOLVABLE claim is made.

Experience handoff

Partial fills exposed the route gradient; fixed finite coordinate sweeps established
local optima. After one seed wins, refine against failing seed/offset counterexamples
rather than treating every single-seed win as equally good. Only store engine-read
geometry after all existing proof channels pass. This structured Markdown is the
local handoff; no remote knowledge-store writes were attempted under the task's
no-network/worktree-only constraints.

Diff (tracked files)

 sugar-sugar/solutions.json      | 103 +++++++
 sugar-sugar/solver_results.json | 596 ++++++++++++++++++++++++++++++++++++----
 sugar-sugar/solver_strong.js    | 225 +++++----------
 3 files changed, 711 insertions(+), 213 deletions(-)

Wall-route geometry validation: boot ok dims=464x464 levels=30
self-test ok: simStatic === shipped simulate (3 plans x 3 seeds, bitwise)
PASS: 1536 wall-route stroke variants are bounded and strictly downhill

Total task wall time: approximately 24 minutes.
