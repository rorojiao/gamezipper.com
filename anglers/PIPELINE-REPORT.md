# Anglers — Pipeline Report (R84, 2026-07-09)

## Summary
- **Game**: Anglers (🎣) — Nikoli-style path drawing puzzle
- **Slug**: `/anglers/`
- **Levels**: 30 (5 tiers × 6 levels each)
- **Status**: ✅ SHIPPED — committed (947e201198), pushed to main

## Phase 0: Market Research
- ✅ Zero-gap verified: `anglers`, `tsuribari`, `fishing-path`, `fish-path`, `hook-line` — all 0 in games-data.js
- ✅ Nikoli classic (釣り針), path-drawing + counting hybrid
- ✅ Adjacent puzzles (Numberlink, Flow Free, Hashi) exist but none use "numbered border angler + variable catch" mechanic

## Phase 1: Candidate Selection
- Selected **Anglers** over Araf (which had unsolvable uniqueness issues on small grids)
- Araf's exact-size constraint (size-1, size+1) yielded 0% unique-solution rate on 4×4–8×7 grids
- Anglers uses reverse-construction: paths placed first → guaranteed solvable

## Phase 2: Competitive Benchmark
- Nikoli magazine (print) exists; sparse digital presence
- No Simon Tatham / Puzzle Baron equivalent
- BENCHMARK.md written (23/25 score)

## Phase 3: Game Development
- **Mechanic**: Numbered anglers on border. Drag to draw orthogonal non-crossing paths. Each angler catches exactly their number of fish.
- **30 levels**: Beginner 5×5 K=2 → Easy 6×5 K=2 → Medium 6×6 K=3 → Hard 7×6 K=3 → Expert 8×7 K=4
- **Reverse-construction generation**: paths placed first via random walk, anglers/fish derived from paths
- **Canvas engine**: drag-to-draw path, fish emoji rendering, angler numbered circles, path bridges
- **Web Audio**: ambient BGM (Cmaj7→Fmaj7→Am7→G) + drag/catch/win SFX
- **Systems**: hints (3/level), undo, restart, 3-star ratings, level select, keyboard (U/H/R/Esc), localStorage save, win overlay, confetti

## Phase 4: Art Assets
- ✅ icon.png (512×512) — PIL-generated grid with 2 angler paths + fish
- ✅ og-image.jpg (1200×630) — grid preview + marketing text

## Phase 5: Music (Web Audio API inline)
- ✅ Ambient chord progression: Cmaj7 → Fmaj7 → Am7 → G (6s interval)
- ✅ SFX: drag (sine 440Hz), catch fish (triangle 660Hz), win chord (C-E-G arpeggio)

## Phase 6: Level Verification (4-method)
- ✅ **Python BFS** (verify_independent.py): 30/30 VALID — paths connected, fish counts correct, all fish caught
- ✅ **Node.js BFS** (verify_independent.js): 30/30 VALID — same checks, independent implementation
- ✅ **In-engine Node.js** (verify_engine.js): 30/30 VALID — loads actual index.html LEVELS, runs isComplete()
- ✅ **Playtest** (playtest.js): 30/30 PASS — stored solutions pass engine validation
- Note: Anglers uses reverse-construction (paths placed first), guaranteeing solvability by design. Multiple valid solutions may exist (acceptable for path-drawing puzzles, like Numberlink/Flow Free).

## Phase 7: QA Testing
- ✅ 50/50 code-level checks passed (qa_checklist.js)
- ✅ HTML structure, OG/Twitter, JSON-LD (VideoGame/HowTo/FAQPage/BreadcrumbList), gz-sr-only H1
- ✅ Game engine: Canvas, pointer events, Web Audio, localStorage, keyboard
- ✅ Game features: hint/undo/restart/menu/music/sound/win-overlay/3-star/level-select
- ✅ SEO content: How to Play, Tips, About, Related Games
- ✅ Ad integration: adsterra, monetag, footer, analytics

## Phase 8: Register + Deploy
- ✅ games-data.js: 593→594 live entries (599 total, 1 new anglers entry)
- ✅ itemlist-schema.js: rebuilt (594 live items)
- ✅ index.html: game-count 593→594, cat-count All 593→594 + Puzzle 505→506, H1 updated
- ✅ manifest.json: 593→594
- ✅ sitemap.xml: +anglers entry
- ✅ Git committed (947e201198) + pushed to main

## Phase 9: Final Report
- **Game**: Anglers (#594)
- **Mechanic**: Path drawing from border anglers to catch fish
- **Verification**: 4-method (Python + Node + engine + playtest), 30/30 pass
- **QA**: 50/50 checks
- **Deploy**: ✅ live on gamezipper.com/anglers/
