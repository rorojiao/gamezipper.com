# Einstein's Riddle — Competitor Benchmark

## Game Overview
**Genre**: Logic grid puzzle (Zebra Puzzle)
**Core Mechanic**: Deduce 5 attributes per house (color, nationality, drink, pet, smoke) from ~15 clues. 1 unique solution per puzzle.
**Target Audience**: Puzzle enthusiasts, casual brain-trainers, ages 16+.

## Competitors Analyzed

### 1. Brainzilla (brainzilla.com/logic/zebra/einsteins-riddle)
- Classic 5×5 grid (5 attributes × 5 houses)
- 15+ clues per puzzle
- Mark cells as ✓/✗ manually
- Single hardcoded puzzle
- Plain HTML, no animation, no scoring

### 2. Cognitive Train (cognitivetrain.com/zebra-puzzle)
- 80 puzzles across 3/4/5 house variants
- Timer + leaderboard
- Hints system
- Auto-solve on conflict
- Clean modern UI

### 3. Human Benchmark (kuakua.app/games/einstein-riddle)
- Single 5-house puzzle
- Click cell to mark answer
- Shows wrong cells red on submit
- "Skill rating" 0-100
- Step-by-step hint unlock

### 4. Aha! Puzzles (ahapuzzles.com/logic/zebra/einsteins-puzzle)
- 5 attributes × 5 houses
- Plain grid, click to place chips
- No timer/scoring

### 5. Zero Star Games (zerostargames.com/games/einsteins-riddle)
- 5×5 grid
- Single "name" attribute swaps between nationality/pet/drink etc.
- Pretty CSS styling

## Feature Benchmark Matrix

| Feature | Brainzilla | Cognitive Train | Aha | **GameZipper Target** |
|---------|:---:|:---:|:---:|:---:|
| Multiple puzzles (30+) | ✗ | ✓ | ✗ | **✓ 30 puzzles** |
| 3-house / 4-house variants | ✗ | ✓ | ✗ | **✓ Tiered** |
| Auto-check progress | ✗ | ✓ | ✗ | **✓** |
| Hint system | ✗ | ✓ | ✗ | **✓ 3 hints/lvl** |
| Undo/Reset | ✗ | ✓ | ✗ | **✓** |
| Score / stars | ✗ | ✓ | ✗ | **✓ 3-star** |
| Timer | ✗ | ✓ | ✗ | **✓** |
| Mistake counter | ✗ | ✓ | ✗ | **✓** |
| localStorage save | ✗ | ✓ | ✗ | **✓** |
| Sound effects | ✗ | ✗ | ✗ | **✓ Web Audio** |
| Background music | ✗ | ✗ | ✗ | **✓ procedural** |
| Tutorial | ✗ | ✗ | ✗ | **✓ 4-step** |
| Mobile touch | partial | ✓ | partial | **✓ full** |
| Custom art / theming | ✗ | ✗ | ✗ | **✓ Mystery Estate** |
| Achievement / streak | ✗ | ✗ | ✗ | **✓ 5 achievements** |
| Gameplay analytics | ✗ | partial | ✗ | **✓** |
| SEO schema.org | ✗ | ✓ | ✗ | **✓ 4 blocks** |
| Ad integration | ✗ | ✓ | ✗ | **✓ Monetag** |

## Game Design Specs (GZ Einstein's Riddle)

### Puzzles (30 total)
- **Tier 1** (Levels 1-10): 3 houses × 3 attributes — Beginner
- **Tier 2** (Levels 11-20): 4 houses × 4 attributes — Intermediate
- **Tier 3** (Levels 21-30): 5 houses × 5 attributes — Expert (the classic)

### Attributes (per tier)
- **3-house**: Color, Nationality, Pet
- **4-house**: + Drink
- **5-house**: + Smoke

### Visuals: "Mystery Estate"
- Detective noir aesthetic: dark wood desk, golden lamp light, fog windows
- Color palette: deep navy (#0a1628), brass (#d4af37), ivory (#f4e9d8), accent crimson (#c0392b)
- Wooden cards for each house, parchment for clues
- Detective magnifier icon as cursor hover

### Core Systems
1. **5×5 grid (or N×N)**: houses as columns, attributes as rows
2. **Click cycle**: empty → ✓ → ✗ → empty
3. **Submit** button: validates against solution
4. **Hint** button: highlights one correct cell (3 hints per puzzle)
5. **Undo** (50 moves) + Reset
6. **3-star rating**: 3★ no mistakes, 2★ ≤2 mistakes, 1★ completed
7. **Timer**: counts up; bonus stars for speed (tier 3)
8. **Mistake counter**: wrong cells turn red
9. **localStorage** save with version field
10. **Achievements**: First Solve, Perfect Run (5 in a row), Speed Demon, No Hints, Master (tier 3)

### Difficulty Curve
- T1: 6-8 clues, multiple starts
- T2: 9-12 clues, one clear start
- T3: 13-16 clues, classic Einstein complexity

## Technical Approach
- **Puzzle Generation**: Hand-curated 30 puzzles (verified by Python solver before commit) — 100% guaranteed unique solutions
- **Solver**: Python script validates every puzzle has exactly 1 solution
- **Grid Renderer**: HTML table + CSS, click handlers
- **State**: localStorage `einsteinRiddle_v1` with full state
- **No external assets** — all visual, all audio procedural
- **Single file**: `index.html` self-contained

## Quality Bar (S-grade)
- 30 solvable puzzles across 3 tiers
- 5+ procedural SFX
- Procedural BGM (jazz-noir, low-fi detective loop)
- 4 JSON-LD blocks (VideoGame, FAQPage, HowTo, BreadcrumbList)
- Tutorial + skip
- Full mobile touch
- 60fps animations
- 0 external deps
