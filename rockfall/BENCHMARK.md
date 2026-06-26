# Competitive Benchmark — Rockfall (Boulder-Dash-style gravity puzzle)

## Round 45 Market Research (2026-06-26)
Queue was empty after Magnet Drop (#442); mandatory Phase 0 research run.

## Gap verification (catalog = 423 games)
Confirmed UNCOVERED after checking every adjacent title:
- `chroma-zen` = I-Love-Hue gradient restore (NOT this)
- `hex-block` = hex 1010 block-fit (NOT this)
- `grow-worm` = magnet-guided body growth (NOT this)
- `territory-draw` = Qix/Xonix territory carve (NOT this)
- `gravity-drop` = physics block-drop column puzzle (NOT this)
- `gravity-orbit` = satellite orbit guide (NOT this)
- `aqua-digger` = fluid/water dig routing (NOT this)
- `boulder-dash / rockfall / gem-digger / crystal-miner` = ALL MISSING ✅

## Selected: Rockfall — 21/25
- Market gap 5: turn-based gravity-boulder dig-&-collect mechanic (Boulder Dash / Repton
  / Crystal Mines family) is COMPLETELY uncovered. aqua-digger is water-fluid dig; no
  falling-boulder + gem-collect + push physics exists anywhere in catalog.
- Search volume 3: "boulder dash", "dig game", "gem digger", "gravity puzzle",
  "rockfall" — classic evergreen nostalgia + satisfying modern hook.
- Monetization 3: level-based, short sessions, "collect all gems" objective + undo
  creates retry compulsion; interstitial between levels + rewarded (extra hint).
- Feasibility 5: grid + gravity settle (well-understood) + push + canvas. Zero per-
  level art (procedural tiles). Turn-based settle = clean logic puzzle, no real-time AI.
- Zero-overlap 5: gravity-boulder-collect-gems is mechanically unique. IP-safe
  generic name "Rockfall".

## Top competitor: Boulder Dash (First Star, 1984 / 30th Anniversary 2014)
Sold millions across 20+ platforms; Steam "Boulder Dash 30th Anniversary" still sells.
- Dig through dirt; boulders fall with gravity + roll off obstacles
- Collect required gems → exit door opens → reach exit to clear the cave
- Don't get crushed by falling boulders
- Magic walls (boulder → gem converter), amoeba, fireflies/butterflies (enemies)
- Push boulders sideways into empty space (Sokoban-like, adds puzzle depth)
- Multiple caves (levels) with escalating difficulty

## Core mechanics to match
- Turn-based grid movement (arrow/WASD/swipe); moving into dirt digs it
- Gravity settle after every move: boulders/gems fall straight down; if blocked and
  "falling", roll left/right onto an empty lower cell
- Push: move into a boulder/gem shoves it one cell if the cell beyond is empty
- Crush: a boulder/gem falling into the player's cell = lose (undo to retry)
- Collect all gems → exit opens → step on exit = win
- Star rating by gems + move efficiency; undo; hint; level select; achievements
- Magic wall tier-3+ (boulder passing through converts to gem)
- 30 handcrafted levels (6 tiers × 5), escalating layouts + hazards

## Monetization
- Interstitial between levels (Monetag, site-wide wired)
- Rewarded "hint" ad (ops fallback)
- Banner slot

## Our positioning
- Same proven Boulder Dash core loop, turn-based puzzle framing (cleaner than real-time)
- 30 handcrafted caves across 6 tiers
- Free, no download, mobile-first, instant-play browser, undo + hints for accessibility
