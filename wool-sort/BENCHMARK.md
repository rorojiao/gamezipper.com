# Wool Sort — Competitor Benchmark

## Selected Date
2026-06-07

## Selected Game
**Wool Sort** — yarn-ball tube sort puzzle (single-file HTML5)

## Top 3 Direct Competitors

### 1. Wool Mania - Sort Puzzle 3D (CrazyGames)
- Mechanic: drag-and-drop colorful wool/yarn pieces into 3D boards; connect to right pegs
- Features: knots, limited moves, multi-hole challenges
- Level count: 100+ levels across 3 difficulty modes
- Visual: 3D isometric balls-on-rod boards, pastel palette
- Monetization: ad-driven (rewards on extra moves / tube)

### 2. Wool Sort: Yarn Color Puzzle (FreeH5Games / Gamx.fun)
- Mechanic: move wool balls between glass tubes to group by color (3D-stack-tube)
- Features: 50 levels, 3 difficulty modes, satisfying boing animations
- Visual: top-down tube board, ball-stack physics
- Monetization: rewarded video for moves

### 3. Stitch Sort: Wool and Yarn (Google Play)
- Mechanic: match vibrant yarn threads to craft dazzling art (looser "screw"-style)
- Features: hundreds of levels, fusion of screw + wool coloring
- Visual: 3D vivid, multi-color yarn
- Monetization: ad-driven hybrid

## Synthesized Design for GameZipper Wool Sort

### Core Mechanic
- 2D top-down canvas (NOT 3D — single file requirement, smaller bundle, faster load)
- Tube/rod columns (3-6 tubes per level)
- Stacked balls of yarn/wool in 4-6 colors
- Click/drag a ball from a tube → drops into adjacent tube
- Win when each tube holds balls of one color only (or empty)

### Systems (parity with all 3 competitors)
- 30+ levels across 3 difficulty tiers (Easy 1-10, Medium 11-20, Hard 21-30)
- Star ratings (1-3 stars based on move count vs par)
- Undo button
- Reset level button
- Skip-ad-for-hint button (or unlimited hints with cooldown)
- Tube-add power-up (rare drop on Hard)
- Progress save (level cleared, stars per level, current level)
- Tutorial modal on first play
- Local leaderboard via best-time-per-level
- Sound on/off toggle
- 5+ procedural SFX (drop, success, fail, level-clear, button)
- Procedural BGM (warm acoustic, lo-fi)
- Animated ball-drop with bouncy easing
- Confetti / particle burst on level clear
- Pause menu

### Visual Style
- Dark GameZipper gradient (purple/teal/black)
- Yarn balls as soft gradient circles with highlight + drop shadow
- Glass tubes as translucent vertical bars
- 3D-feel: subtle perspective on tube tops, drop shadows
- Cozy color palette: 6 wool colors (rose, peach, gold, mint, sky, lavender)
- Smooth 200ms transitions on ball movement
- text-shadow for headers

### Difficulty Curve
- L1-10: 4 colors, 3 tubes, <5 balls per color (Easy — onboarding)
- L11-20: 5 colors, 4 tubes, 6-7 balls per color (Medium)
- L21-30: 6 colors, 5-6 tubes, 8+ balls per color, 1-2 empty tubes (Hard)

### Level Integrity Validation
- Every level must be solvable: each non-empty tube must end with one color only
- BFS over states to verify all 30 levels have solutions
- Min 1 solution per level, max moves tracked for star rating

## Why This Wins
1. **Trending mechanic** — wool sort/yarn sort is top-10 on CrazyGames/Poki/Y8 in 2026
2. **Zero overlap with GZ** — Magic Sort is water, Sushi Stack is 3D rotation
3. **Strong retention** — color sorting has 70%+ D1 retention on hyper casual
4. **S-grade ad inventory** — 30 levels × 5-10 plays to clear = high ad exposure
5. **Feasibility** — single-file Canvas + DOM, ~30KB, no external assets needed

## Quality Standards
- 30KB+ index.html
- 4 JSON-LD blocks
- localStorage v1
- Touch + mouse + keyboard
- 60fps animation
- All English UI
- Mobile 390x844 responsive
