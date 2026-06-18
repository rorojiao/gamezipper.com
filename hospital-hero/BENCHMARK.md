# Hospital Hero — Competitive Benchmark

## Selected Slug: `hospital-hero`
**Concept**: Doctor Time-Management Puzzle (Papa's Freezeria × My Perfect Hotel lineage, hospital-themed)
**Round**: R36 | **Score**: 22/25 (D4 S5 R4 F4 Z5)

## Top Competitors Analyzed

### 1. Happy Clinic (Nordcurrent, 2015-2025)
- 50M+ downloads Google Play, top-50 casual chart 6+ years
- Core: drag patients to beds, doctor auto-treats, multiple departments (Pharmacy, X-Ray, Surgery, Maternity)
- 100+ levels, daily challenges, staff upgrades (nurse speed, doctor count, bed count)
- Monetization: gems for speed-ups, watch-ad-revive
- Art: cartoon bright, isometric hospital, character portraits
- Music: cheerful acoustic loop

### 2. Hospital Dash (SayGames, 2022-2024)
- 10M+ downloads, hyper-casual time-management
- Simpler: tap patient → tap matching colored bed → doctor auto-treats → collect cash
- 50 levels, upgrade path: bed speed, doctor speed, queue size
- Bright 2D top-down, color-coded departments

### 3. My Perfect Hotel (SayGames, 2023-2025) — reference for idle hook
- 100M+ downloads, #1 casual chart 18+ months
- Pattern: assign guests → clean rooms → collect cash → upgrade
- We adapt this loop to hospital (assign patients → treat → discharge → upgrade)

## Systems to Replicate (S-grade checklist)

| System | Competitor | Our Implementation |
|--------|-----------|-------------------|
| Patient queue with patience timer | All 3 | ✓ Patient spawn + decreasing patience bar |
| Color-coded departments | Happy Clinic, Hospital Dash | ✓ 3 departments (General/Blue, Emergency/Red, Surgery/Purple) |
| Bed assignment via tap | Hospital Dash | ✓ Tap patient → auto-route to free matching bed |
| Doctor auto-treatment | Happy Clinic | ✓ Doctor visits bed, treatment progress bar fills |
| Cash earning per patient | All 3 | ✓ Per-patient payout + combo multiplier |
| Day/level progression | Happy Clinic (100+ levels) | ✓ 26 days with target cash + time limit |
| Upgrade shop | All 3 | ✓ Bed count, doctor speed, extra doctor, new dept unlock |
| Star rating | Happy Clinic | ✓ 3★ = beat target × 1.5; 2★ = beat target; 1★ = clear day |
| Save progress | All 3 | ✓ localStorage with version, day progress + total stars + upgrades |
| Tutorial | Happy Clinic | ✓ First-day tooltips, skippable |
| Sound feedback | All 3 | ✓ Web Audio: door chime, cash, treatment tick, level complete |
| Combo system | Hospital Dash | ✓ Consecutive successful discharges within 3s = bonus |
| Patience penalty | Happy Clinic | ✓ Patient leaves angry if patience hits 0 (lose potential cash) |

## Difficulty Curve (26 days)
- Day 1-5: 1 dept (General), 2-6 beds, slow spawns, target $80-360
- Day 6-10: unlock Emergency (2nd dept), 6-8 beds, target $450-880
- Day 11-15: unlock Surgery (3rd dept), 8-12 beds, target $1000-1680
- Day 16-20: faster spawns, multi-dept patients, target $1900-2980
- Day 21-26: full chaos, target $3300-5300

## Scoring Formula
- Base payout per patient: dept.base ($10 General, $15 Emergency, $25 Surgery)
- Treatment speed bonus: faster treatment = +20% payout
- Combo multiplier: +10% per consecutive discharge (cap 3×)
- Patience bonus: full patience = +25%

## Art Style Reference
- Dark gradient bg (GameZipper brand), neon department colors
- Bed icons as rounded rectangles with dept color tint
- Patient as circle avatar with patience ring
- Doctor as circle with stethoscope emoji overlay (or procedural shape)

## Music Reference
- Happy Clinic-style: light marimba/xylophone loop, 100-110 BPM
- We synthesize via Web Audio: triangle wave melody + sine pad
