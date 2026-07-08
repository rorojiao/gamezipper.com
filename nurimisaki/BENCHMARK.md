# Nurimisaki — Competitive Benchmark

## Game: Nurimisaki (ぬりみさき)

**Origin**: Nikoli Co., Ltd. (Japan), first published 2019
**Type**: Number-placement / shading logic puzzle
**Catalog Status**: Zero-gap verified (grep=0 for `nurimisaki`, `nurimisaki puzzle`, `cape painting puzzle`)

## Rules

1. Grid contains some numbered cells (clues)
2. Paint remaining cells WHITE (filled) or BLACK (empty sea)
3. Each numbered cell: the number = the count of consecutive WHITE cells
   visible in **at least one** orthogonal direction (up/down/left/right),
   extending from the cell adjacent to the numbered cell until a black
   cell or grid boundary
4. All WHITE cells must form a **single connected region** (4-directional)
5. Numbered cells are themselves WHITE

## Competitive Analysis

| Feature | Nikoli Original | Puzzle-Web Clones | GameZipper Nurimisaki |
|---------|----------------|-------------------|----------------------|
| Grid size | 10×10 typical | 5×5 to 15×15 | 5×5 to 9×9 (30 levels) |
| Difficulty tiers | Single | 3 (Easy/Med/Hard) | 5 (Beginner→Expert) |
| Hint system | None | Basic | 3 hints/level |
| Save progress | None | localStorage | localStorage |
| Music/SFX | None | Minimal | Web Audio API BGM + SFX |
| Mobile support | Limited | Responsive | Touch + Canvas |
| Star ratings | None | Some | 3-star system |
| Keyboard nav | None | Rare | Full (arrows + paint) |

## Unique Selling Points

1. **Only browser-playable Nurimisaki** — Nikoli's 2019 puzzle is nearly absent
   from web game portals. Zero-gap verified.
2. **Progressive difficulty** — 5 tiers from 5×5 Beginner to 9×9 Expert
3. **Procedural Web Audio music** — ambient chord progression unique to this game
4. **Canvas rendering** — smooth paint animation, violation highlighting
5. **Full accessibility** — keyboard navigation, screen-reader H1, ARIA labels

## SEO Keywords

- Primary: `nurimisaki`, `nurimisaki puzzle`, `cape painting puzzle`
- Secondary: `nikoli puzzle online`, `shading logic puzzle`, `number visibility puzzle`
- Long-tail: `play nurimisaki free online`, `nurimisaki puzzle browser game`

## Art Direction

- **Icon**: Stylized grid with numbered cell and visible ray lines (cool blue/teal palette)
- **OG Image**: Puzzle grid mid-solve with "Nurimisaki" title overlay
- **In-game palette**: Deep navy background, cyan/teal white cells, charcoal black cells,
  amber accent for numbered clues

## Music Direction

- **BGM**: Ambient E minor progression (Em → Cmaj7 → G → Am) with soft pad
- **SFX**: Paint (soft click), Erase (dampened thud), Error (low buzz), Hint (chime), Win (fanfare)
