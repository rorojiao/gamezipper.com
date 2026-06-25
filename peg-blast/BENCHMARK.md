# BENCHMARK — Peg Blast (#441)

## Target Game
Peg Blast — Peggle-style aim-and-bounce peg-clearing puzzle (generic / IP-safe clone of the Peggle mechanic).

## Top Competitor: Peggle / Peggle Blast (PopCap / EA)
- **Franchise scale:** Peggle series 50M+ lifetime downloads. Peggle Blast (mobile,
  EA/PopCap 2014) was a top-grossing free-to-play title; still actively played &
  searched in 2025-2026.
- **Core loop:** Aim cannon at top → launch ball → ball falls under gravity &
  bounces off pegs → every peg hit is "lit" → when ball settles/exits, lit pegs are
  removed → goal is to clear ALL orange target pegs before running out of balls.
- **Peg types:** blue (normal, +points), orange (target — must clear to win), green
  (free-ball bonus), purple (score multiplier / power peg), plus gray wall-pegs
  (indestructible obstacles that add bounce complexity).
- **Ball economy:** 10 balls per level; ball landing in the moving bucket at the
  bottom = free ball; green peg also grants a free ball.
- **Scoring:** base points per peg, style points (long shots, trick shots), score
  multiplier increases as orange peg count drops (fewer remaining = higher mult).
- **Modes:** 30+ handcrafted levels across themed tiers, increasing orange-peg
  counts & obstacle layouts; level select with star ratings.

## Features Peg Blast MUST Match (parity checklist)
- [x] Aim cannon with live trajectory preview arc (simulated bounces)
- [x] Gravity ball physics with circle-peg ricochet reflection
- [x] Peg types: blue / orange (target) / green (free ball) / purple (score) / gray (wall)
- [x] Clear-all-orange-pegs win condition
- [x] 10 balls per level (Peggle default)
- [x] Moving score bucket at bottom → catch = free ball
- [x] Score multiplier scaling as orange count drops
- [x] Style points (long-shot bonus)
- [x] 30 handcrafted levels across 6 tiers (5 each), escalating difficulty
- [x] Level select grid with star ratings (1-3 by balls/score)
- [x] Hints (suggested aim highlight)
- [x] Achievements
- [x] Web Audio API procedural music + SFX (peg hit, bucket catch, win, lose, launch)
- [x] Save progress to localStorage
- [x] Mobile touch + keyboard + mouse, responsive canvas
- [x] Pause / restart / menu

## Monetization Plan
- Interstitial ad slot between levels (monetag-manager.js #gz-ad-below-game)
- Rewarded-ad hook for "+3 balls" on lose screen (placeholder for now)
- Short sessions → high ad frequency viable

## Differentiation from existing portfolio
- Plinko Drop (drop-only, no aim) vs Peg Blast (skill aim + ricochet) — distinct
- Marble Shooter (straight-line chain) vs Peg Blast (gravity bounce) — distinct
- Peg Solitaire (jump-remove board) vs Peg Blast (physics cannon) — distinct

Conclusion: strong uncovered, high-demand, IP-safe mechanic. Proceed to build.
