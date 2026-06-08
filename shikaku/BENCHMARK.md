# Shikaku — Competitive Benchmarking Report

## Game Selection
- **Game**: Shikaku (also "Shikaku Nanore", "Rectangles", "Divide by Box")
- **Score**: 20/25 (Tier 1 candidate)
- **Origin**: Invented by Yoshinao Anpuku (Kyoto University, 1989), published by Nikoli

## Standard Rules
1. Divide grid into rectangular/square pieces
2. Each piece contains exactly one number
3. Number = area (cell count) of that rectangle
4. Every cell covered, no gaps/overlaps
5. Only orthogonal rectangles allowed

## Key Competitors
| Competitor | Platform | Grid Sizes | Key Features |
|---|---|---|---|
| puzzle-shikaku.com | Web | 5×5 to 25×25 | Daily, HoF leaderboard, MO3/AO5/AO12 speedrun metrics |
| shikaku.ch | Web | Variable | Daily + global leaderboard, strategy guide, no signup |
| shikaku.games | Web | 8×8+ | 3-tier daily challenges, archived leaderboards |
| Fill Shikaku (Voodoo) | Mobile | Progressive | Level-based, touch drawing |
| Shikaku Pro | iOS | Various | 2,500 levels, 100 worlds, NO ADS, calming music |
| Rectangles | iOS | Various | Pixel art rewards, no timer, hints, undo |

## Must-Have Features
1. Undo/Redo — critical for logic puzzles
2. Interactive tutorial — first-time players
3. Progress save — localStorage with version
4. Touch-friendly rectangle drawing — swipe/drag
5. Error indication — visual feedback on violations
6. Timer — optional but expected
7. Hints system — help when stuck
8. Multiple grid sizes — 5×5 to 20×20
9. Star rating per puzzle
10. Statistics tracking

## Scoring Formula
```
Score = 1000 × GridMultiplier × TimeMultiplier × AccuracyMultiplier
GridMultiplier = (W × H) / 25
TimeMultiplier = max(0.5, 1.0 - SolveTime/ParTime)
AccuracyMultiplier = max(0.5, 1.0 - 0.05×Errors)
```

## Difficulty Progression
| Tier | Grid | Puzzles | Par Time |
|---|---|---|---|
| Tutorial | 4×4, 5×5 | 10 | 60s |
| Easy | 5×5, 6×6, 7×7 | 30 | 120s |
| Medium | 8×8, 9×9, 10×10 | 50 | 300s |
| Hard | 12×12, 15×15 | 30 | 600s |
| Expert | 18×18, 20×20 | 20 | 1200s |

## Market Gaps (Our Advantages)
- No competitor has ALL: daily + hints + undo + leaderboard + rewards + audio
- No dark mode in any competitor
- Only Shikaku Pro has calming music
- Poor mobile undo is common complaint
- No completion rewards at scale (only Rectangles has pixel art)
