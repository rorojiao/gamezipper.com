# Anti-Knight Sudoku — Competitive Benchmark

## Game Overview
Anti-Knight Sudoku is a Sudoku variant combining standard Sudoku rules with a
chess-derived constraint: **no two cells a knight's move apart may contain the
same digit.** A knight moves in an L-shape: (±1, ±2) or (±2, ±1) — up to 8
target cells per position.

## Market Position
- **Search demand**: High — "anti-knight sudoku" is a popular variant on
  Logic Masters Germany, Cracking the Cryptic YouTube channel, and
  sudoku-tournament circuits.
- **GZ coverage**: Zero (no anti-knight-sudoku/ directory exists)
- **Differentiator**: Most online anti-knight puzzles are single-puzzle PDFs or
  forum posts. We ship 27 unique-solution puzzles with full UI, hints, notes,
  and tier progression — a complete product.

## Competitive Analysis

### Competitor 1: Cracking the Cryptic (YouTube + Sudoku Pad app)
- Mechanics: Anti-knight as one of many variant rules in hand-crafted puzzles
- Monetization: App purchase + Patreon
- Our edge: Free, browser-based, no sign-up, 27 progressive levels

### Competitor 2: Logic Masters Germany (logic-masters.de)
- Mechanics: Community-published puzzles, anti-knight common constraint
- Format: PDF/printable or web solver
- Our edge: Polished mobile-first UI, star ratings, daily challenge, tutorial

### Competitor 3: Sudoku.com / NYTSudoku (variant sections)
- Mechanics: Standard sudoku primarily; variants as special events
- Our edge: Dedicated anti-knight focus with difficulty curve

## Systems to Implement (matching Anti-King template)
1. **27 levels, 6 tiers**: Beginner/Easy/Medium (6×6), Hard/Expert/Master (9×9)
2. **Standard Sudoku rules**: rows, columns, boxes each contain 1..N once
3. **Anti-Knight constraint**: no two cells a knight's move apart share a digit
4. **Knight-move highlight**: selecting a cell glows its knight-peers
5. **Notes mode**: pencil in candidates
6. **Hint system**: reveal a correct digit
7. **Undo / Erase**: full move history
8. **Timer + Star ratings**: 3-star based on speed + no mistakes/hints
9. **Daily challenge**: seeded puzzle of the day
10. **localStorage progress**: versioned save state
11. **3-step tutorial**: first-visit onboarding
12. **Web Audio BGM + SFX**: procedural ambient music + interaction sounds
13. **Procedural art**: icon.png + og-image.png via PIL
14. **Full SEO**: JSON-LD (VideoGame + FAQPage + HowTo + BreadcrumbList)

## Technical Notes
- 4×4 anti-knight IS feasible (knight constraint is weaker than king), but we
  use 6×6 for Beginner for consistency with Anti-King tier structure.
- Knight moves in a 6×6 grid: corner cells have 2 knight-peers, edge cells
  have 3-4, center cells have up to 8. This makes the constraint meaningful but
  less restrictive than anti-king on small grids.
- 9×9 anti-knight is the standard competitive format and works well.

## Theme
- **Color palette**: Deep teal/silver (vs Anti-King's purple/gold) for visual
  distinction. Primary: #0a2a35 (deep teal), accent: #4ecdc4 (bright teal),
  highlight: silver/cyan glow for knight-peers.
- **Icon concept**: Chess knight silhouette with sudoku grid overlay, teal neon.
