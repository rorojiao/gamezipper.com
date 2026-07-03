# BENCHMARK: Klotski (Huarong Pass / 华容道)

## Game: Klotski — Sliding Block Puzzle
- **Slug**: klotski
- **Tier**: Puzzle (Round 32)
- **Score**: 24/25

## Market Analysis

### Downloads / Plays
- Klotski is one of the most widely played puzzles in history (500M+ lifetime downloads across all platforms)
- Featured in virtually every "puzzle game collection" app
- Cultural significance: Based on the Three Kingdoms legend of Cao Cao escaping Huarong Pass
- Known internationally as "Klotski" (from Polish "klocki" = blocks)

### Uniqueness in Our Catalog
- We have parking-jam (Rush Hour style: cars on a grid, horizontal/vertical sliding)
- We have unblock-me (similar Rush Hour mechanic)
- Klotski is DIFFERENT: 4x5 grid with rectangular blocks of varying sizes (1x1, 1x2, 2x1, 2x2)
- The 2x2 target block (Cao Cao) must reach the bottom-center exit
- Classic configuration uses exactly 10 blocks (1 big + 4 vertical + 1 horizontal + 4 small)
- Move counts for optimal solutions range from 81 to 300+ moves

### Browser Clone Quality
- Most HTML5 versions are basic with poor mobile support
- Few have proper level progression beyond the classic layout
- No quality version with touch drag, undo, hints, and level variety

## Competitive Features to Include
1. Classic Huarong Pass layout (hardest = 81 moves optimal)
2. 30 progressive levels across 5 tiers (Easy → Expert)
3. Drag-and-slide controls (touch + mouse)
4. Undo/Reset buttons
5. Move counter + par system (3-star ratings)
6. Hint system (next best move)
7. Timer per level
8. localStorage progress save
9. Level select screen
10. Cultural context (Three Kingdoms theme)

## Technical Design
- **Grid**: 4 columns x 5 rows
- **Block types**: 2x2 (target), 1x2 (horizontal), 2x1 (vertical), 1x1 (single)
- **Exit**: bottom-center 2 cells (cols 1-2, below row 4)
- **Win condition**: 2x2 block reaches cols 1-2, rows 3-4 (bottom center)
- **Movement**: Slide blocks by dragging — blocks can move multiple cells in one direction
- **Canvas rendering**: smooth animations with Chinese-themed visual design

## Level Design (30 levels, 5 tiers x 6 levels)
- Tier 1 (Easy): 6 levels, 4x5 grid, 15-25 move solutions
- Tier 2 (Medium): 6 levels, 4x5 grid, 30-50 move solutions  
- Tier 3 (Hard): 6 levels, 4x5 grid, 55-80 move solutions
- Tier 4 (Expert): 6 levels, 4x5 grid, 85-120 move solutions
- Tier 5 (Master): 6 levels, 4x5 grid, 120+ move solutions including the classic 81-move layout

## Scoring
- Move efficiency vs par → star rating (3/2/1 stars)
- Time bonus
- Total stars across all levels
