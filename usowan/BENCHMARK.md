# Usowan — Competitive Benchmark

## Source
- **Official Nikoli EN**: https://www.nikoli.co.jp/en/puzzles/usowan/
- **Type**: Shading puzzle with liar clues
- **Also known as**: ウソワン (Usowan)

## Rules (from Nikoli official)
1. Fill in (color) cells under the following rules.
2. Cells containing numbers cannot be colored.
3. The number shows how many colored cells are next to a cell, vertically and horizontally (orthogonal neighbors).
4. **However, in each rectangle bordered by bold lines (room), there is one (and only one) wrong number** (showing a wrong colored cell number).
5. Colored cells cannot connect horizontally or vertically (orthogonally adjacent colored cells forbidden).
6. White cells must not be separated by colored cells (all white cells form one connected group).

## Mechanic Summary
- Grid divided into rectangular rooms (bold borders)
- Numbered clue cells indicate count of orthogonal black neighbors
- Exactly ONE clue per room is a LIAR (wrong count)
- Black cells may not be orthogonally adjacent
- All white cells must be connected (single region)

## Competitive Landscape
- No online browser implementation exists (grep=0 verified)
- Nikoli has print puzzles only
- This will be the FIRST browser-playable Usowan game

## Game Design
- Click to toggle cell: empty → black → empty
- Numbered cells are fixed (not toggleable)
- Room borders drawn as thick lines
- "Liar" clue marked with subtle indicator after solving
- Hint: reveals one correct black cell
- 3 hints per level, 3-star rating
- 30 levels across 5 difficulty tiers
