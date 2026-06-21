# Windmill Sudoku — Competitive Benchmark

## Game Overview
**Windmill Sudoku** is a multi-grid overlapping Sudoku variant featuring 5 standard 9×9 grids arranged in a pinwheel/X pattern.

## Layout Design
- **Center grid**: positioned at board offset (6,6) to (14,14)
- **NW grid**: board (0,0) to (8,8) — shares Center's top-left box (box 0)
- **NE grid**: board (0,12) to (8,20) — shares Center's top-right box (box 2)
- **SW grid**: board (12,0) to (20,8) — shares Center's bottom-left box (box 6)
- **SE grid**: board (12,12) to (20,20) — shares Center's bottom-right box (box 8)
- **Combined board**: 21×21 cells (369 unique cells after removing 36 shared-cell duplicates)
- **4 shared 3×3 boxes**: each shared between Center and one diagonal grid

## Differentiation from Existing Games
| Variant | Grids | Shared Boxes | Shape | On GZ? |
|---------|-------|-------------|-------|--------|
| Standard Sudoku | 1 | N/A | Single 9×9 | ✅ |
| Killer Sudoku | 1 | Cage sums | Single 9×9 | ✅ |
| X-Sudoku | 1 | Diagonals | Single 9×9 | ✅ |
| Twodoku | 2 | 1 box (edge) | 9×15 | ✅ (#401) |
| Triple Doku | 3 | 2 boxes (edge) | 9×21 | ✅ (#403) |
| Butterfly Sudoku | 4 | 4 boxes (corner) | 15×15 | ✅ (#402) |
| **Samurai Sudoku** | 5 | 4 boxes (edge-center) | Cross/+ (21×21) | ✅ (#399) |
| **Windmill Sudoku** | 5 | 4 boxes (corner) | X/pinwheel (21×21) | **This game** |

### Key difference from Samurai
Samurai's outer grids share **edge-center** boxes (boxes 1,3,5,7) with the center, forming a **plus/cross** shape.
Windmill's diagonal grids share **corner** boxes (boxes 0,2,6,8) with the center, forming an **X/pinwheel** shape.
This creates a distinct visual experience and constraint topology.

## Systems Implemented
1. **5-grid board rendering** on Canvas with 21×21 combined layout
2. **Cell ownership system**: cells belong to 1 or 2 grids; shared cells highlighted
3. **Multi-grid validation**: entries checked against ALL grids the cell belongs to
4. **27 levels** across 6 tiers (4 Beg/4 Easy/5 Med/5 Hard/5 Expert/4 Master)
5. **Digit input pad** (1-9 + erase)
6. **Notes mode** (pencil marks)
7. **Hints** (3 per level, using constraint-based valid digit detection)
8. **Undo** (full move history)
9. **Check** (validates all entries, highlights errors)
10. **Reset** (confirm dialog)
11. **Timer** (per-level, saved to localStorage)
12. **Mistake tracking**
13. **Progress saving** (localStorage with version field)
14. **Level selection** grid with completion tracking
15. **Web Audio API**: procedural SFX (click, place, error, win) + ambient BGM pad
16. **Sound toggle**
17. **Keyboard input** (1-9, Backspace, N for notes, Ctrl+Z for undo)
18. **Responsive design**: adaptive cell sizing for desktop/mobile
19. **SEO**: 3 JSON-LD schemas (VideoGame, FAQPage, BreadcrumbList), meta tags, canonical URL
20. **AdSense** integration
21. **Win overlay** with star rating (based on mistakes)

## Level Verification
All 27 levels verified by independent Node.js solver:
- 27/27 center grids: UNIQUE solution
- 27/27 NW grids: UNIQUE solution
- 27/27 NE grids: UNIQUE solution
- 27/27 SW grids: UNIQUE solution
- 27/27 SE grids: UNIQUE solution
- 27/27 shared boxes: consistent between Center and diagonal grids
- Total: 135/135 grids verified (5 × 27)

## Art Assets
- icon.png (512×512): pinwheel design with 4 colored blades + center circle
- og-image.png (1200×630): mini windmill board + title text + branding

## Theme
Warm amber/rose palette on dark navy background (#14080a → #3d1a28 gradient)
Accent colors: #f59e0b (amber), #fb7185 (rose), #fbbf24 (gold)
