# Who Is? — Competitive Benchmark

## Competitors Analyzed
1. **Who Is? (Unico Studio / Poki)** — #4 most popular puzzle on Poki, 4.1⭐
2. **Who Is? 2 Brain Puzzle & Chats** — Sequel with chat/narrative mechanics
3. **Brain Test: Tricky Puzzles** — 275+ levels, same genre, 100M+ downloads
4. **Detective Loupe Puzzle** — Poki featured, magnifying glass clue mechanic

## Core Mechanics (Who Is? by Unico Studio)
- Over 100 tricky scenarios requiring deductive reasoning
- Choice-based scenarios: "Who is an imposter?", "Who is lying?"
- Hidden object finding levels
- Point-and-click interaction with characters/objects
- Cartoon/illustrated visual style
- Progressive difficulty
- Hint system for challenging puzzles
- Satisfying "aha!" moments

## Systems to Implement
| System | Competitor Feature | Our Implementation |
|--------|-------------------|-------------------|
| Levels | 100+ scenarios | 40+ unique detective puzzles |
| Puzzle Types | Choice, find, drag, tap, swipe | Multi-type: identify, find clue, drag evidence, tap hidden |
| Hint System | Progressive hints | 3 hints per level, coin-purchase extra |
| Scoring | Star rating per level | 3-star system (no hints = 3★) |
| Progress | Level unlock sequence | Sequential unlock + chapter system |
| Tutorial | First 3 levels guided | Interactive tutorial for first puzzle |
| Sound | Background music + SFX | Web Audio procedural BGM + SFX |
| Ads | Between levels | Analytics tracking for ad placement |
| Save | localStorage progress | Full progress save with version |
| Visual Style | Cartoon, colorful, expressive characters | Dark neon GameZipper style with character silhouettes |

## Level Design Categories
1. **Who is lying?** — Choose between characters based on visual clues
2. **Who is the imposter?** — Spot differences in group
3. **Find the hidden object** — Tap to discover clues
4. **Who did it?** — Deduce culprit from evidence
5. **What is wrong?** — Spot anomalies in scenes
6. **Who needs help?** — Identify person in distress

## Score Formula
- Base: 100 points per level
- Time bonus: up to 50 points (faster = more)
- Hint penalty: -25 per hint used
- Stars: 0 hints = 3★, 1 hint = 2★, 2+ hints = 1★

## Key Differentiators vs GZ Brain Out
- Brain Out = physics manipulation, lateral thinking
- Who Is = character-based detective logic, social deduction, visual clue reading
- Different art style (characters vs objects)
- More narrative/story feel per puzzle
