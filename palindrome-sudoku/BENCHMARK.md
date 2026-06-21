# Palindrome Sudoku — Competitive Benchmark

## Game Overview
**Palindrome Sudoku** is a Sudoku variant where specific grey-shaded cells form palindrome sequences. The digits along these grey paths must read the same forwards and backwards. Popularized by Cracking the Cryptic and Logic Masters Germany.

## Rules
1. Standard Sudoku: each row, column, and 3x3 box contains 1-9 exactly once
2. **Palindrome constraint**: grey cells form paths. Reading digits along the path from either end yields the same sequence (palindrome). E.g., grey path [r1c1, r2c1, r3c1] with values [5, 3, 5] is valid (5-3-5 reads same both ways).
3. Multiple palindrome regions may appear in a single puzzle.

## Competitive Analysis

### 1. Cracking the Cryptic (YouTube + apps)
- **Platform**: YouTube channel + iOS/Android apps
- **Levels**: App has 50+ hand-crafted puzzles per variant pack
- **Systems**: Hint system (multi-level), check progress, timer, pencil marks, auto-save
- **Art**: Clean digital Sudoku board, minimal aesthetic
- **Music**: Ambient/none
- **Difficulty**: Expert-level hand-crafted puzzles
- **Key takeaway**: Pencil marks and multi-level hint system are essential UX

### 2. Logic Masters Germany
- **Platform**: Web (puzzle database)
- **Levels**: User-submitted, thousands available
- **Systems**: Solution checker, timer, manual entry
- **Art**: Basic grid, functional
- **Difficulty**: Full range from beginner to extreme
- **Key takeaway**: Community-driven content, variety of palindrome configurations

### 3. Sudoku.com (variant section)
- **Platform**: Web + mobile
- **Levels**: Progression-based, unlock tiers
- **Systems**: Daily challenge, streak tracking, hints, mistakes counter, notes mode
- **Art**: Modern, colorful, polished animations
- **Music**: Light ambient BGM + sound effects
- **Key takeaway**: Gamification (streaks, daily challenge) drives retention

## Systems to Implement (S-grade parity)

| System | Priority | Implementation |
|--------|----------|----------------|
| Level progression (unlock tiers) | P0 | 27 levels, 6 tiers, complete-to-unlock |
| Cell selection + number input | P0 | Click cell → number pad / keyboard |
| Pencil marks (notes mode) | P0 | Toggle, multi-candidate per cell |
| Undo/Erase | P0 | Full undo stack |
| Hint system | P1 | Reveal one correct cell |
| Timer + best time | P1 | Per-level localStorage |
| Tutorial | P0 | First-time overlay explaining palindrome rule |
| Daily challenge | P1 | Random level seeded by date |
| Sound effects | P0 | Web Audio API procedural |
| BGM | P1 | Web Audio API ambient loop |
| Win celebration | P1 | Confetti particle animation |
| Progress save | P0 | localStorage with version field |
| Error highlighting | P1 | Red flash on wrong placement |
| Settings (sound toggle) | P1 | Persisted in localStorage |

## Art Direction
- **Theme**: Mirror/reflection concept (palindrome = symmetry)
- **Background**: Dark gradient (#0a0e27 → #1a1f3a)
- **Accent**: Teal-cyan (#00d4aa) — distinct from all existing GZ Sudoku variants
- **Palindrome cells**: Semi-transparent grey overlay with subtle border
- **Style**: Glass-morphism panels, neon highlights, rounded corners

## Music Direction
- Ambient electronic, mysterious, ethereal
- Slow tempo, soft synthesizer pads
- Reflective of the "mirror" palindrome theme
