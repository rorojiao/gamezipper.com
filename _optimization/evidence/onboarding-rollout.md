# First-Visit "How to Play" Onboarding Rollout — 9 Puzzle Games

Date: 2026-08-16
Scope: `amibo`, `cross-the-streams`, `evolomino`, `link-a-pix`, `nuritwin`, `snake-pit`, `star-loom`, `sukima`, `triplace`

## Implementation (identical pattern in all 9 files)

- Injected right before the final `</body>` (after all game engine scripts): one comment marker, one scoped `<style>`, one overlay `<div>`, one IIFE `<script>`. No game engine code touched, no external dependencies.
- First visit only: shows if `localStorage["gz_ob_<slug>"]` is absent (all localStorage access wrapped in try/catch). Any close path (button / ESC / backdrop click) writes the key, so the user is never nagged twice. On subsequent loads the overlay markup is removed from the DOM immediately.
- Card: game name (small uppercase), "How to Play" title (#5b8def accent), bulleted rules, full-width button "Got it — Let's play!". Backdrop `rgba(10,10,22,.82)`, card `#1a1a2e` with `#2a2a4a` border, radius 16px, `z-index:999999`, max-width 420px / 92vw on mobile.
- While open, a capture-phase keydown listener stops game hotkeys from firing and ESC closes the overlay.
- Element ids are prefixed `gz-ob-<slug>` to avoid collisions; storage keys use `gz_ob_<slug>` with underscores.

Rules below were derived from each game's engine verification code (`checkSolution` / `checkWin` / `canPlace` / drag-commit logic), not from marketing copy. Notably, **Evolomino's** site FAQ ("blocks grow 1,2,3… in a chain") contradicts the actual levels — a script over all 30 levels confirmed every arrow is a 1×3 block (arrow cell + 2 cells it points at) whose union equals the unique solution; the onboarding copy follows the implementation.

## Rule copy as shipped (English)

### amibo — injected at line 827 of `amibo/index.html` (key `gz_ob_amibo`)
1. Drag across cells to draw a horizontal or vertical line segment (✏️ Draw / 🧽 Erase modes).
2. Each numbered circle must touch the END of a line exactly that many cells long.
3. Every line must cross at least one other line of the same length.
4. Lines may not overlap other same-direction lines or run through number circles.
5. Press ✓ / Enter to check your answer; 💡 Hint places one correct line (3 per level).

### cross-the-streams — line 917 of `cross-the-streams/index.html` (key `gz_ob_cross_the_streams`)
1. The numbers beside each row and above each column give the lengths of its consecutive shaded runs, in order.
2. All shaded cells must form one single connected group.
3. No 2×2 block may be fully shaded.
4. ⬛ Fill shades cells, ❌ marks known-empty cells, ⬜ Erase clears them; press ✅ Check (C) to verify (3 hints per level).

### evolomino — line 476 of `evolomino/index.html` (key `gz_ob_evolomino`)
1. Each arrow grows a 1×3 block: shade the arrow's own cell plus the two cells it points at.
2. Every arrow is used exactly once — shade only cells that belong to some arrow's block.
3. Use ⬛ Block / ✏️ Erase; ✓ Check (Enter) compares your grid with the unique solution.
4. 💡 Hint (3 per level) fills in one correct cell.

### link-a-pix — line 373 of `link-a-pix/index.html` (key `gz_ob_link_a_pix`)
1. Tap a number, then drag cell-by-cell to its matching twin to draw a path between them.
2. The number equals the path's total length in cells, counting both endpoints.
3. Paths run horizontally / vertically only and may not cross or overlap other paths.
4. Connect every pair to finish the picture. 💡 Hint (3 per level) auto-draws one pair.

### nuritwin — line 332 of `nuritwin/index.html` (key `gz_ob_nuritwin`)
1. Shade cells so every outlined region holds exactly TWO connected blocks of equal size.
2. A number inside a region gives the size of both of that region's blocks.
3. All shaded cells must form one connected group across the whole grid.
4. No 2×2 area may be fully shaded (it turns red). Click to shade, right-click to erase; auto-check runs as you go.

### snake-pit — line 918 of `snake-pit/index.html` (key `gz_ob_snake_pit`)
1. Paint every cell so the grid splits into one-cell-wide snake paths, each at least 2 cells long.
2. The palette shows every snake in the level — pick a color and drag to paint its cells.
3. A number means its snake has exactly that many cells; a circle marks one end of a snake.
4. A snake may never touch itself, even diagonally; two equal-length snakes can't share an edge.
5. Fill the whole grid, then press ✓ Check.

### star-loom — line 630 of `star-loom/index.html` (key `gz_ob_star_loom`)
1. Tap one star, then a second, to draw a chord between them; tap the same pair again to remove it.
2. Each star's number is exactly how many chords must touch it.
3. Every star must end up connected — no isolated stars.
4. Each level has one unique solution; 💡 Hint reveals a correct chord.

### sukima — line 925 of `sukima/index.html` (key `gz_ob_sukima`)
1. Drag across 3 connected cells (or just tap a cell) to place a triomino — straight or L-shaped.
2. Every triomino must cover exactly ONE circle; a circle can never be split between pieces.
3. Black cells are walls and can never be covered.
4. No 2×2 area may be fully covered, even by different pieces.
5. 🧽 Erase removes a whole piece; 💡 Hint (3 per level) places one correct piece.

### triplace — line 817 of `triplace/index.html` (key `gz_ob_triplace`)
1. Divide every empty cell into connected 3-cell pieces (triominoes).
2. Draw mode adds cells to the current piece; New Piece starts a fresh one; Erase removes a whole piece.
3. Black cells are walls and can never be covered.
4. A number on a wall counts the straight 1×3 pieces it sees to its RIGHT and BELOW it.
5. Win when every cell sits in a 3-cell piece and all numbers match (auto-check is on).

## Modified files (9) + backups

- `amibo/index.html`, `cross-the-streams/index.html`, `evolomino/index.html`, `link-a-pix/index.html`, `nuritwin/index.html`, `snake-pit/index.html`, `star-loom/index.html`, `sukima/index.html`, `triplace/index.html`
- Pre-modification backups: `_optimization/state/backup/<slug>-index.pre-onboarding.html` (all 9 confirmed present)
- Nothing else in the repo was modified; no git commits made.

## Verification

### 1. Static validation (node) — PASS for all 9 files
- HTML tag balance checker (script/style raw content masked, comments stripped): 0 errors per file.
- All inline `<script>` blocks (game engine + injected overlay) compiled with `vm.Script`: 0 syntax errors. JSON-LD data blocks excluded as non-executable.
- Overlay block confirmed present after all game scripts, immediately before the final `</body>`.

### 2. Runtime spot-check (Playwright, bundled chromium — no system Chrome) — PASS
Served from repo root at `http://127.0.0.1:8765`. Three games: `amibo`, `nuritwin` (has its own load-time title overlay — stacking case), `triplace` (largest file).

Per game: fresh context → overlay visible with correct game name / "How to Play" / rule count / button → screenshot → click "Got it — Let's play!" → overlay + style node removed from DOM → `localStorage` key written → reload → overlay does not reappear → screenshot. Game canvas present and zero injection-related page errors in all three.

Extra checks: ESC closes and persists (amibo), backdrop click closes and persists (amibo), mobile 390px viewport card width 358px ≤ 92vw (nuritwin).

### Screenshots
- `_optimization/evidence/amibo/onboarding-before.png` / `onboarding-after.png`
- `_optimization/evidence/nuritwin/onboarding-before.png` / `onboarding-after.png` / `onboarding-mobile.png` (390×844)
- `_optimization/evidence/triplace/onboarding-before.png` / `onboarding-after.png`

(before = overlay shown on first visit; after = game visible, overlay gone and not reappearing after reload)
