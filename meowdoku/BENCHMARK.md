# BENCHMARK.md — Meowdoku Competitor Analysis

## Primary Competitors
1. **Meowdoku!** (Oakever Games) — #1 App Store, N-Queens variant with cat theme
2. **Sudoku Mine** (Stanley Lam) — True Sudoku×Minesweeper hybrid, 9×9 grid
3. **Sudoku Mines Master** (AYM) — Hardcore N-Queens variant
4. **Puzzle Cats** (MobilityWare) — Cat puzzle collection, 20K+ puzzles
5. **Sudoku Cats** (Soren) — Steam game, 120 levels, 24 cats

## Core Mechanics to Implement
- **N-Queens / Star Battle family**: Place exactly 1 cat per colored region, 1 per row, 1 per column
- **Diagonal adjacency rule**: Cats cannot touch diagonally
- **X markers**: Mark ruled-out cells
- **Pure logic**: Every puzzle has unique solution, no guessing

## Systems to Benchmark
- **Level System**: 200+ levels in 5 difficulty tiers (Easy/Medium/Hard/Expert/Master)
- **Scoring**: Points + time bonus + combo + star rating (1-3 stars)
- **Hearts/Lives**: 3-5 per attempt, generous refill
- **Hints**: Limited basic hints, watch ad for more
- **Daily Challenge**: New puzzle daily with streak rewards + global leaderboard
- **Cat Collection**: 30+ unlockable cats with unique appearances
- **Achievements**: 50+ milestones
- **Tutorial**: Layered — rules introduced one at a time through early levels
- **Progress Save**: localStorage with version, offline play
- **Sound**: Web Audio API procedural — meow sounds, purr, satisfying placement sounds

## Art Style
- Minimalist, soft pastel colors for grid regions
- Cute cat sprites (procedural or RunningHub-generated)
- Dark gradient background (GameZipper style)
- Clean, distraction-free visual design

## Music Style
- Calm, relaxing ambient — soft synthesizer pads, gentle piano
- Lo-fi cat-themed chill music

## Key Differentiators vs Competitors
1. Browser-based (no install needed)
2. More levels than Meowdoku (200 vs 60)
3. Cat collection system (Meowdoku lacks this)
4. Full achievement system (Meowdoku lacks this)
5. Star rating + scoring (Meowdoku lacks explicit scoring)
6. Free, no aggressive ads
