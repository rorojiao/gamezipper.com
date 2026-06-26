# Phase 0 — Market Research (Round 45)

## Date: 2026-06-26

## Methodology
Analyzed all 425 live games in GameZipper catalog (342 puzzle). Searched for
uncovered, high-demand puzzle mechanics using 5-axis scoring (1-5 each, /25 total).
3-layer overlap gate verified: (1) no thematic overlap, (2) no mechanical overlap,
(3) no keyword overlap in games-data.js.

## Candidates Scored

### 1. Bowling Master (top-down bowling puzzle) — 23/25 ✅ SELECTED
- Market gap 5: Zero bowling games in 425-game catalog. Bowling is one of the
  top casual game genres (100M+ downloads on mobile: Bowling King, PBA Bowling,
  Strike! By Belunder). Completely uncovered.
- Search volume 4: "bowling game", "10 pin bowling", "strike", "bowl", "bowling
  king" — strong evergreen terms, consistent year-round demand.
- Monetization 4: Level-based, short satisfying sessions, pin-clearing objective
  creates replay compulsion, perfect for interstitial between levels.
- Feasibility 5: Canvas + ball roll physics + pin collision (elastic) + aim/power
  control. Standard 2D physics, well-understood, single-file friendly. ~40KB.
- Zero-overlap 5: Genuinely no bowling mechanic anywhere. Pin Master is pinball,
  Pull the Pin is pin-pulling, Peg Blast is peg ricochet. None reproduce bowling's
  roll-ball-knock-pins-chain-reaction mechanic.

### Rejected this round
- Pool/Billiards Puzzle — 24/25 score BUT thematic overlap with existing Pool
  Billiards (sports cat, /pool/). Rejected to avoid brand dilution.
- Hook Puzzle — 23/25 but low search volume (2), minimalist aesthetic hard to
  monetize.
- Ring Toss — 23/25 but lower search volume (3), overlaps with aim-throw family.
- Backgammon — 22/25 but 2-player strategy, not solo puzzle.
- Mancala — 20/25, lower search volume and monetization potential.

## Decision
**Bowling Master** selected as next puzzle game. Slug: bowling-master.
Category: puzzle. Emoji: 🎳

