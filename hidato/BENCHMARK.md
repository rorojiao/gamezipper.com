# Hidato — Competitive Benchmark

Last updated: 2026-06-07

## Top 3 Competitors Analyzed

### 1. hidato.com
- **Core**: The official Hidato site by Dr. Gyora Benedek (inventor)
- **Levels**: 6x6 beginner, 8x8 normal, 10x10 expert, 12x12 master + daily puzzle
- **Systems**: Daily challenge, level select, hints, undo, timer, auto-check
- **Style**: Clean white background with blue numbered cells, classic puzzle-magazine feel
- **Music**: none
- **Strengths**: Authoritative source, official puzzles, daily engagement
- **Weaknesses**: Looks dated (2010-era), no audio, weak mobile experience

### 2. Puzzlemadness.co.uk/yajilin (Hidato adjacent: number-chain puzzles)
- **Levels**: Daily Hidato 6x6 → 12x12
- **Systems**: Daily challenge, printable PDFs, level select, hint system
- **Style**: Modern light/dark theme, gradient header
- **Music**: none
- **Strengths**: Daily retention mechanic, print-share
- **Weaknesses**: Ads, not full game UX

### 3. 100 Logic Games - Time Killers (App Store)
- **Levels**: 12 Hidato levels, handcrafted
- **Systems**: Multi-puzzle magazine, hint system, achievements
- **Style**: Modern mobile UI, clean typography
- **Music**: Light ambient
- **Strengths**: Modern UI, mobile-first touch
- **Weaknesses**: Limited Hidato content, hidden behind app paywall

---

## Systems to Implement (S-Grade Parity)

| System | Source | Priority |
|--------|--------|----------|
| 5x5, 6x6, 7x7, 8x8, 9x9, 10x10 grids | hidato.com, 100 Logic | Must |
| Procedural puzzle generator with unique-solution guarantee | hidato.com | Must |
| 30+ handcrafted solvables (procedural seed) | hidato.com | Must |
| 8-directional adjacency (orthogonal + diagonal) | hidato.com | Must |
| Start + end numbers pre-filled (1 and N) | hidato.com | Must |
| Hint system (highlight a correct cell) | All | Must |
| Undo / Redo | All | Must |
| Reset puzzle | All | Must |
| Timer + best time per level | All | Must |
| Star rating (1-3 based on time/no-hint) | 100 Logic | Must |
| Auto-check (highlight cells that don't chain) | hidato.com | Must |
| localStorage v1 (hidatoV1) — progress, best, stars | GameZipper standard | Must |
| Daily Challenge (deterministic seed from date) | hidato.com | Must |
| Tier system: Easy/Medium/Hard/Expert | hidato.com | Must |
| Level select grid | GameZipper standard | Must |
| Tutorial modal (5 steps: Welcome, Rule, Adjacency, Clues, Solve) | GameZipper standard | Must |
| BGM (procedural ambient via Web Audio API) | GameZipper S-Grade | Must |
| SFX: click/place, conflict, undo, hint, win, level-clear | GameZipper S-Grade | Must |
| Touch optimization, mobile-first responsive | GameZipper standard | Must |
| Dark gradient + neon accent GameZipper look | GameZipper standard | Must |
| 4 JSON-LD blocks (VideoGame, FAQPage, HowTo, BreadcrumbList) | GameZipper standard | Must |
| Custom 512x512 icon.png | PIL (Pillow generated) | Must |
| og:title, og:description, og:image, canonical URL | GameZipper standard | Must |

---

## Difficulty Curve (30 levels, 4 tiers)

- **Easy (5x5-6x6)**: Levels 1-8 — sparse blanks, chain 1→25/36
- **Medium (7x7-8x8)**: Levels 9-16 — moderate blanks, 1 and N given + extras
- **Hard (9x9)**: Levels 17-24 — fewer given cells, harder topology
- **Expert (10x10)**: Levels 25-30 — sparse clues, multi-step logic

## Visual Style Direction
- **Dark ocean-to-twilight gradient** (deep navy → indigo → cyan)
- **Neon cyan/orange number cells** when active
- **Animated connection lines** between consecutively placed numbers
- **Glowing pulse** on the most recent number placed
- **Glassy panels** for UI (modals, hint button, level select)
- **Animated wave particles** on win

## Sound Direction
- **BGM**: Ambient electronic, mysterious, slow tempo, soft synth pads + gentle piano (procedural via Web Audio API)
- **SFX**: Soft "place" bell, "conflict" buzz, glassy "win" chime, "undo" swoosh, "hint" zap

## Puzzle Generation Strategy
- Generate random snake path (Hamiltonian-like path on grid) for unique-solution base
- Carve some cells empty for solver
- Pre-fill 1 and N always
- For larger grids: pre-fill ~30-40% of cells
- For smaller grids: pre-fill ~50-60% of cells
- Validate solvability via solver attempt
