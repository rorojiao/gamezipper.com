# BENCHMARK.md — Spin Rogue (slot-roguelike)

Selected Round 26, 2026-06-16. Score 23/25. True GZ gap (grep confirmed 0 slot/symbol-machine/roguelike-slot).

## Reference Titles

### 1. Luck be a Landlord (TrampolineTales, 2021 Steam / 2024 mobile)
- Grid: 3x4 (expands). 50+ symbols across 5 rarities (Common → Very Rare → Ultra Rare).
- Symbols have effect rules. Examples:
  - Coin: +1 coin
  - Flower: +0, but adjacent Bees get +1 each
  - Bee: +1 coin for each adjacent Flower
  - Ore: +1, +2 with Diver, +1 with Miner
  - Diver: +2 for each Ore on board
  - Hex: adjacent symbols lose 1 coin
  - Fungus: copies the value of an adjacent symbol
  - Wildcard / Mystery
- Each floor has escalating rent: floor 1 rent ~5, scaling ~+20% per floor, ~20 floors.
- Shop between spins: Add symbol (costs coins), Remove symbol (costs coins), Reroll symbols (costs coins), Lock symbol (free).
- Items: passive effects (e.g., "every 3 spins, +1 to all symbols", "rent reduced by 10%").
- Final boss: Landlord (very high rent).
- UI: spinning reel animation, glowing symbols on synergy, coin counter, rent progress bar.
- Persistence: run state saved per floor.

### 2. Balatro (LocalThunk, 2024) — poker roguelike
- Proves "familiar mechanic + roguelike depth = breakout hit" formula.
- Takeaway: synergy-driven scoring + escalating difficulty + shop meta = high retention.

### 3. Peglin (Red Nexus, 2022) — peg-pinball roguelike
- Roguelike structure over a casual mechanic. Confirms genre appeal.

## Systems to Replicate (S-grade parity)
1. ✅ 3x3 symbol grid (mobile-clean; original is 3x4 — 3x3 reads better on 390x844)
2. ✅ Spin mechanic with reel animation + random symbol placement
3. ✅ Symbol effect engine: ~28 symbols across 5 rarities, with adjacency/global synergy rules
4. ✅ Coin payout computation per spin (process all symbols, sum coin deltas)
5. ✅ Escalating rent curve across 15 floors
6. ✅ Shop between spins: Add / Remove / Reroll / Lock (coin costs)
7. ✅ Items: 8 passive items with board-wide effects
8. ✅ Rarity-weighted symbol pool
9. ✅ Run persistence (localStorage, version field) — current floor, coins, board, inventory, best floor reached
10. ✅ Win/lose: lose when can't pay rent (coins < rent after final spin of a floor); win after clearing floor 15 (Landlord)
11. ✅ Daily Challenge (seeded RNG) — extra retention
12. ✅ Tutorial: 3-step onboarding, skippable
13. ✅ Sound: Web Audio API procedural — spin whir, coin ding per symbol pay, synergy chime, rent-due alarm, shop click, win fanfare, lose buzzer
14. ✅ Particle/screen-shake feedback on big payouts
15. ✅ Best floor + total wins leaderboard (local)

## Score Formula
- Per spin: for each cell, evaluate symbol.rule(board, position) → coin delta. Sum all deltas. Coins += sum.
- After N spins (N=3 default, decreases to 1 on boss floor), if coins < rent → game over.
- Each floor: rent = round(baseRent * (1.18 ^ floor)). baseRent = 5.

## Numeric Balance Targets
- Floor 1 rent: 5 (achievable in 3 spins with default board ~2 coins/spin)
- Floor 7 rent: ~17 (requires built synergy)
- Floor 15 (Landlord): ~61 (requires optimized synergy board)
- Symbols cost: Common 3, Uncommon 6, Rare 10, VeryRare 16, UltraRare 25
- Reroll cost: 1 (escalates +1 per use per floor)
- Remove cost: 3

## Visual Style
- Dark gradient background (deep purple/indigo → black), neon gold/cyan accents
- Symbols rendered as emoji-style glyphs on glassmorphism tiles (rounded 16px, subtle inner glow)
- Slot reel: vertical blur scroll during spin, snap-stop with bounce ease
- Coin counter: large gold number top-center, ticks up with each pay
- Rent bar: red gradient fill, pulses when ≥80% full
- NO -webkit-text-stroke; use text-shadow for titles
- Emoji-free title: "SPIN ROGUE"

## SEO
- Title: "Play Spin Rogue Online Free - Slot Machine Roguelike | GameZipper"
- Slug: spin-rogue
- Meta: "Spin Rogue — a free slot machine roguelike. Build synergies, beat the rent, climb 15 floors. No download, play instantly in your browser."
- Keywords: slot roguelike, spin game, symbol puzzle, casino puzzle, luck be a landlord clone, free slot game

## Known Pitfalls
- Symbol effect engine must be deterministic given board state (no RNG in payout — only in spin shuffle + shop)
- All coins kept as integers (floor after multiplication)
- Lock must persist across reroll
- Daily challenge seed must reproduce identical symbol pool order
