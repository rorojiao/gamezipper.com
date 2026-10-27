# R336 (2026-10-27) — an advertised count that disagrees with the shipped catalog, and three verdict fields that disagree with what they measure

**Tick scope**: GameZipper duplicate-mechanic elimination + site-wide quality convergence.
**Result**: 0 actionable duplicates (4 clusters adjudicated DISTINCT) · **1 P1 content defect fixed** · **3 P2 test-gate defects fixed** · zero_issue streak reset to 0.

---

## 1. The P1 — `dosun-fuwari` advertised 48 levels and shipped 42

### The shape

`levels.json` shipped three fields:

```json
{ "levels": [ ...42 main levels... ], "daily": [ ...6 daily levels... ], "total": 48, "rules": "..." }
```

and the page advertised that `total` as a MAIN-campaign size **plus** a daily feature on top:

| location | copy (before) |
|---|---|
| `<meta name="description">` | `48 handcrafted levels plus daily challenge` |
| `<meta property="og:description">` | `48 levels + daily challenge` |
| `<meta name="twitter:description">` | `48 levels free online` |
| VideoGame JSON-LD `description` | `48 handcrafted levels plus daily challenge` |
| FAQPage answer | `48 handcrafted levels and a daily challenge` |
| `js/games-data.js` catalog `desc` | `48 handcrafted levels plus daily challenge` |

Because `total = len(levels) + len(daily) = 42 + 6`, the claim was wrong **twice over**: the campaign was overstated by 6 levels, and the 6 daily entries were counted once in the 48 and then described again as a separate bonus.

### The proof (production, not inference)

A cache-busted Kachilu probe of the live page, clicking the game's own `#btnLevels` button:

```
lvlBtns   : 42
tiers     : ["Tutorial","Easy","Medium","Hard","Expert"]
dailyBtn  : true
```

42 level buttons. A player counting the buttons sees 42 while the page says 48.

### The fix

Advertise **42** in all six locations, and correct `levels.json` `total: 48 → 42` so the field stops summarising an array it does not describe. The `levels` / `daily` / `rules` payloads are **deep-equal to HEAD** (verified field by field) — the diff is one line in the JSON and five lines of copy.

### New detector D18 — `.audit/r336-d18-daily-total.js`

Flags a game whose `levels.json` `total > len(levels)` while the page advertises that inflated total as *"levels + daily"*.

**Negative test (both directions)**:

```
against the PRE-FIX copy (total=48 + pre-fix index.html):
  dosun-fuwari  advertises 48 levels but ships 42 main (6 daily folded in) -> overstates by 6
against the FIXED tree:
  (none)
```

> ⚠️ **The first negative-test attempt silently proved nothing.** The copy was made with the *post-fix* `index.html`, so the detector correctly did not fire — which is exactly what exposed the mistake. The R334 lesson ("a hardcoded absolute ROOT silently disables a gate's own calibration") has a sibling here: **a negative test must use the pre-fix DATA, not just a copy of the tree.** Had the copy been made with the post-fix file, the detector would have looked broken rather than the test being wrong.

### Detector scope note (important for the next sweep)

D18 is **narrow by construction**: only **3** of 466 games ship the `{levels,total,daily}` JSON shape. The 463 games that build their catalog inline have **no claim-vs-catalog gate at all**. The first D17 implementation was a static regex reader and produced 22 candidate mismatches — **20 of them false**:

- `beat-battle` ships `var LEVELS=[...13...]` **plus** `var _LV2=[...17...]` **plus** `LEVELS=LEVELS.concat(_LV2)` → a static reader sees 13 and reports "claims 30, ships 13". A live probe showed the real count is 30.
- `fireboy-watergirl`, `tower-stacker-3d`, `liquid-connect`, `treasure-dig`, `tower-of-hanoi` populate `LEVELS` at runtime → a static reader sees 0.
- `train-tracks` generates 30 levels from a 30-entry config table at runtime → the VM probe mis-read it as 1.

**Rule**: a level-count gate must read the catalog the way the ENGINE builds it, or it will manufacture phantom findings. Prefer the game's own per-game verifier (which already loads the catalog) over any site-wide static scan.

---

## 2. Three test-gate defects with one shared root

All three are the same shape: **a field that reports on a fact but is not wired to the thing that decides the verdict.**

### R336-P2a — `cube-pop`: a PASS verdict printed next to a non-empty `fails[]`

```js
if (ok) solved.push(lv); else fails.push('L' + lv + ' objectives not met');   // <- raw push
...
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + ': ' + info); } };  // <- increments fail
```

The per-level notes went into the **assertion channel** without going through the assertion. Output:

```json
{"pass":4,"fail":0,"total":4,"verdict":"PASS","fails":["L5 objectives not met","L11 objectives not met"]}
```

**The gate is not a no-op** — the `levels-won` assertion (`solved.length >= N-3`, a 3-level allowance for the random board) does drive the verdict and the exit code. Proven by negative test: raising the threshold to `N+1` produces `FAIL` and **exit 1**. The defect is that the failure *information* was written where the assertion *decision* lives.

Fix: the bot's misses now go to `extra.unwon`, with a note that each level gets **12 fresh random boards**, so a miss is a *stochastic bot miss*, not a *proven-unwinnable level*. `fails[]` carries only the gate's own text.

### R336-P2b — `train-tracks`: the note states the opposite of what the gate measured

The verifier printed `verdict=PASS 30/30` while its own note said:

> *"engine traceTrack() bug: … so in-engine checkWin never fires"*

Both cannot be true. The engine already carries the fix at `index.html:1239`:

```js
var dir = OPP[lvl.start.dir]; // FIX: entry arrow points OUTWARD (toward source); travel direction is its opposite
```

and **the FIX and the stale note landed in the same commit** (`8a663ba3e5`).

Probed against the **engine's own** `checkWin()` / `traceTrack()` through the shipped harness (no rule re-implementation): `checkWin()` returns true on **30/30** levels and `traceTrack()` returns a non-null path on **30/30**. The note was stale, not the verdict.

> **Lesson**: when a fix and a note describing the pre-fix state land in the same commit, the note becomes a lie that no test catches — because the test asserts the *behaviour* and the note asserts nothing. A verifier's `note` is part of its output and must be re-derived whenever the engine changes.

### R336-P2c — the site-wide verifier gate fabricated **94 phantom failures**

The gate recorded each verifier's verdict with:

```bash
verdict=$(printf '%s' "$out" | grep -oiE 'VERDICT[^"]{0,40}|PASS[^"]{0,20}|FAIL[^"]{0,20}' | tail -1 | …)
```

`grep -o` with `-i` is **case-insensitive** and the pattern is unbounded, so on a JSON line it matched the **key** `"fails":[]` — not a verdict at all.

Measured on the shipped `.audit/r335-verifier-gate.tsv`:

```
94 of 210 rows (45%) carried the false "fails" verdict
```

12 of the 94 were re-run individually: **all 12 report `"verdict":"PASS"`.** The gate's *exit-code* column was always right; only the human-readable column lied — and that TSV is read by every later sweep, so it manufactures phantom findings on healthy games.

Fix (both `r333-` and `r335-verifier-gate.sh`):

```bash
verdict=$(printf '%s' "$out" | grep -oE '"verdict"[[:space:]]*:[[:space:]]*"[A-Za-z]+"' | tail -1 | grep -oE '"[A-Za-z]+"$' | tr -d '"')
if [ -z "$verdict" ]; then
  verdict=$(printf '%s' "$out" | grep -oE '"fail"[[:space:]]*:[[:space:]]*[0-9]+' | tail -1 | grep -oE '[0-9]+$')
  if [ -z "$verdict" ]; then verdict="rc=$rc"; else verdict="fail=$verdict"; fi
fi
```

Verified on 4 real games: `OLD=fails → NEW=PASS` for drift-boss / threes / text-twist; same-game unchanged.

> **Generalisation**: a substring search for a verdict word is not a verdict parser. Machine-readable output has a machine-readable verdict field — read it by name, case-sensitively, anchored to the key. A regex that can match a **key** will eventually match a key whose name happens to contain a verdict word.

---

## 3. Cluster adjudication — 0 actionable duplicates

Three nomination detectors were re-run and **all three converged on already-adjudicated clusters** (the leaper family and the sudoku variants), so no detector-driven candidate remained. The cluster was then adjudicated rule-by-rule from the source.

| cluster | members | verdict |
|---|---|---|
| match-3 / group removal | jewel-crush, cube-pop, same-game, triple-match-3d, nyt-tiles, tile-dynasty, mahjong-dimensions | **ALL DISTINCT** |
| rhythm | neon-dash, magic-tiles, beat-battle | **ALL DISTINCT** |
| water sort | magic-sort, pocket-sort, goods-sort | **ALL DISTINCT** |
| untangle | pin-master, zip-tie | **DISTINCT** |

### match-3 / group removal — why every pair is a different game

| game | allowed action | win condition |
|---|---|---|
| jewel-crush | **swap** an adjacent pair; match 3+ in a row/column; specials (striped / colour-bomb / wrapped) | level **objectives** within a **move limit** |
| cube-pop | **tap** a connected group of 2+ same-coloured cubes (no swapping); specials by group **size** (5-6 rocket, 7-8 bomb, 9+ mega); **crates with HP** | **objective quotas** within a move limit |
| same-game | **click** a connected group of 2+ same-coloured tiles on a **seeded** board; score `(n-2)²`; **no move limit** | a **star threshold** (s1/s2/s3) + a +500 board-clear bonus + a leftover-tiles penalty |
| triple-match-3d | **tap 3 identical objects in a 7-slot tray** — no adjacency requirement at all | empty the tray |
| nyt-tiles | **tap any two tiles** sharing a visual **layer** element (4 independent layers/tile) | wipe every layer of every tile |
| tile-dynasty | **mahjong solitaire** — pair matching on a layered board | clear the board |
| mahjong-dimensions | **rotate a 3D cube** of mahjong tiles | clear the cube |

Same verbs ("match", "clear"), different mechanics. `same-game` is the instructive one: it looks like `cube-pop` until you notice the win condition is a **score threshold on a seeded board with no move limit**, whereas cube-pop's is **quota objectives under a move limit with destructible crates** — a different problem to solve, not a re-skin.

### The other three

- **rhythm**: `neon-dash` = a rhythm **platformer** (tap/hold to jump, fly, flip). `magic-tiles` = tap the **black** tiles in time with a procedurally generated song (30+ songs, 5 chapters). `beat-battle` = a **4-lane duel** against an AI with a health bar to drain. Different verb, different target, different failure condition.
- **water sort**: `magic-sort` = **pour** water between tubes (220,000 puzzles, 1,000+ tiers). `pocket-sort` = fill a **slot** with matching coins to **merge** them upward (30 levels). `goods-sort` = match 3 identical items onto **shelves** (25 levels). Different verb, different goal.
- **untangle**: `pin-master` = tap pins **in order** to drop metal plates. `zip-tie` = **drag** nodes to untangle crossing wires. Different verb and different goal.

**No deletion, no redirect.** No keeper/loser decision was needed because no pair met the bar ("same win condition AND same allowed actions, with only assets or copy changed").

---

## 4. Also verified this tick

- **Catalog atomic consistency**: 466 live / 466 unique slugs / no duplicate names / itemlist 466+466 / sitemap complete / test-library 466 / every live slug has an `index.html` / `data-count` 466 / 11 cat-counts match the GAMES per-cat counts. `sync-game-counts.sh` → **ALL IN SYNC**; `sync-user-visible-text.sh` → **0 stale numbers**.
- **Verifier regression gate**: re-ran over the live catalog — **0 non-zero exit codes**, **0 cwd-shadow mismatches** (own-dir rc == repo-root rc for every verifier). The gate's *verdict column* was the defect (R336-P2c), not its exit codes.
- **Blog listing (R335 open lead)**: 307 files in `blog/` = **306 posts + the index**; `blog.html` and `blog/index.html` each link all 306, **0 broken links**; `index.html`'s "306 game tips & guides" is correct against the disk. The "207 vs 298" figure R335 recorded no longer describes the tree — **not a defect**.
- **R335 open lead (a)**: the count-drift class extended to all `blog/*.html` + root `*.html` — **0 files** carry a 3-digit game-count claim ≠ 466.

---

## 5. MEMORY (R336)

- **A count claim that folds the daily pool into the main-campaign count is a DOUBLE count, and the fix is not "add the daily to the number".** `total = len(levels) + len(daily)` plus the phrase "N levels **plus** a daily challenge" advertises the daily twice. Read the data's *shape*, not just the number: if `total > len(levels)`, the advertised total is inflated by exactly `len(daily)`.
- **A level-count gate must read the catalog the way the ENGINE builds it.** A static regex reader produced 22 candidates of which **20 were false** — because it could not see `LEVELS=LEVELS.concat(_LV2)` (13+17=30) nor a runtime-populated `LEVELS`. Prefer the game's own verifier (it already loads the catalog) over any site-wide static scan.
- **A negative test must use the pre-fix DATA.** A copy of the tree made *after* the fix will not fire the detector, and the fault looks like the detector. The first D18 negative test did exactly this and the "detector is broken" reading was wrong.
- **A verifier's `note` is part of its output and asserts nothing.** `train-tracks` printed `PASS 30/30` beside a note claiming `checkWin never fires`, and the fix plus the stale note landed in the same commit. Re-derive a note whenever the engine changes; a stale note is a lie no test catches.
- **Never substring-match a machine-readable verdict.** `grep -oiE '…|FAIL…'` matched the JSON **key** `"fails":[]` and put **94 phantom failures** into the gate TSV that every later sweep reads. Read the `"verdict"` field by name, case-sensitively, anchored to the key.
- **A field that reports on a fact is not the field that decides the verdict.** `cube-pop` pushed per-level notes into the assertion channel without going through the assertion, so `PASS` and a non-empty `fails[]` shipped in the same line. Keep the *report* and the *decision* in separate channels.
- **The three detectors agreeing on the same already-adjudicated clusters is a SIGNAL, not a result.** When D9 rule-prose, fingerprint2 full-logic and win-sig all return only the leaper family and the sudoku variants, the detector is measuring what it was built to measure and there is nothing new — spend the tick on a surface those detectors do not cover (count claims, gate reporting fields, catalog shapes) instead of re-reading the same pairs for the 90th time.
