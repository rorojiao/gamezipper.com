# Futoshiki — Competitor Benchmark

## Selected Game
**Futoshiki** (a.k.a. "More or Less") — Japanese inequality logic puzzle. Fill a Latin square (each digit 1..N once per row/column) while respecting < and > inequality signs between adjacent cells.

## Competitor Survey (2026-06-07)

### 1. puzzle-futoshiki.com
- 5x5 default grid; cells with < > signs between them
- Daily puzzle; difficulty: Easy → Hard
- Number pad input, conflict highlighting
- Undo, eraser, hint, pencil-mark notes
- Timer, statistics, best time per difficulty

### 2. futoshiki.com (Futoshiki Online)
- 4x4, 5x5, 6x6, 7x7, 8x8, 9x9 grids
- New daily puzzle + archive
- Hint reveals single cell
- Win check + victory screen
- Mobile-friendly number pad

### 3. futoshiki.puzzlebaron.com
- Printable + online; 4x4, 5x5, 6x6, 7x7, 9x9
- Step-by-step solution reveal
- 5 difficulty levels

## Core Systems Required (S-grade benchmark)
| System | Required | Notes |
|--------|----------|-------|
| Grid sizes | 4x4, 5x5, 6x6, 7x7, 9x9 | Progressive difficulty |
| Latin square rule | yes | Each digit 1..N once per row/column |
| Inequality signs | yes | < and > between cells, click to cycle |
| Conflict highlight | yes | Red on duplicate row/column, broken inequality |
| Undo | yes | Full history stack |
| Hint | yes | Reveals a single correct cell (limited) |
| Notes mode | yes | Pencil marks (small digits in corners) |
| Timer | yes | Per puzzle; best time saved |
| Daily challenge | yes | Same puzzle for everyone, leaderboard |
| 30+ puzzles | yes | 5 per size + 5 daily = 30+ |
| Win celebration | yes | Confetti + best-time display |
| Star rating | yes | 1-3 stars by time (par time per difficulty) |
| Sound feedback | yes | Click, place, conflict, win SFX |
| Progress save | yes | localStorage v1, per-size best times |
| Tutorial | yes | First-launch modal, skippable |
| Theme | yes | Dark gradient + neon accent |

## Numbered Level Plan (30 levels)
- Tier 1 — 4x4 (10 levels, par 60-180s)
- Tier 2 — 5x5 (10 levels, par 90-300s)
- Tier 3 — 6x6 (5 levels, par 180-420s)
- Tier 4 — 7x7 (5 levels, par 240-540s)

## Visual Style
- Dark gradient background (#0a0e27 → #1a1f3a)
- Neon accent: cyan (#00d9ff) for input, magenta (#ff006e) for conflict
- Rounded cell tiles with subtle glassmorphism
- < and > signs as elegant SVG arrows between cells

## Music/SFX
- BGM: ambient electronic, mysterious, slow tempo (Web Audio API procedural)
- SFX: click, place, conflict (descending), undo, hint, win
