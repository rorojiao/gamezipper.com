# Renzoku (Sum Line) — Competitor Benchmark

## Selected Game
**Renzoku** (連珠, "continuous beads/balls") — Nikoli-published logic puzzle invented in 1998 by Nikoli staff. Place digits in every white cell such that **same-numbered cells that are orthogonally adjacent must form a consecutive run whose length equals the number itself** (e.g., all 3s adjacent in a line must form an unbroken run of exactly three 3s; isolated 1s are valid singletons; pairs of 2s must be 2 cells; etc.). Givens anchor the puzzle.

## Core Mechanic
1. Rectangular grid of white cells (with some prefilled clue digits)
2. Fill every cell with a digit 1-N (where N is the grid size)
3. **Renzoku Rule**: For every orthogonally-adjacent pair of same-number cells, those same-number cells must form a consecutive run of exactly that many cells. Concretely:
   - A run of N same digits must have length N (cells connected orthogonally)
   - Two runs of same number MUST NOT share a cell or be adjacent (orthogonally) — otherwise they would merge into a longer run.
4. No two same-number cells from different runs may be orthogonally adjacent.
5. Row and column may have repeated numbers as long as adjacency rule holds.

## Competitors

### Simon Tatham's Portable Puzzle Collection
- Includes "Nurikabe" but NOT Renzoku specifically
- Has Fillomino (similar concept but uses polyomino regions)
- Weakness: No web version, ugly UI, no progression

### Nikoli (nikoli.co.jp)
- Premium paid iOS/Android app + Nintendo Switch
- Official Renzoku puzzles, hand-crafted weekly
- Weakness: Paid, no free web version

### Conceptis Puzzles
- Has "Killer Sudoku" but not Renzoku per se
- Some Fillomino variants online
- Weakness: Limited Renzoku-specific content

### pzv.jp / janko.at
- janko.at (DE/EN/JA) hosts Renzoku rules and free puzzles
- Daily Renzoku puzzles available
- Weakness: German site primarily, sparse English UI

### Cross+A (cross-plus-a.com)
- Desktop puzzle suite with Renzoku support
- Many puzzle types but no web version
- Weakness: Paid only, no browser play

## GameZipper Differentiation
- **Free browser play**, no download, no signup
- 30 levels across 5 tiers (4x4 Beginner → 7x7 Expert)
- Mobile-first responsive design
- Hint system (3 per level), 3-star ratings, level select
- Web Audio ambient BGM + SFX
- JSON-LD SEO (VideoGame + FAQPage + BreadcrumbList)

## Validation Rules (must be enforced)
1. Every white cell has a digit 1..N (N = grid size)
2. For each (number, run) of orthogonally connected same-digits: run length MUST equal the digit
3. Two different runs of same number MUST NOT be orthogonally adjacent (else they merge)
4. No empty cells
5. Number placement respects adjacency structure (clue-given digits count toward their runs)