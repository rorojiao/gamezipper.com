# FreeCell Solitaire — Competitive Benchmark

## Top Competitors
1. **Microsoft FreeCell** (Microsoft Solitaire Collection) — 35M monthly active players, Windows bundled, gold standard
2. **Solitaire.com** (TripleDot Studios) — Cleanest browser FreeCell, unlimited undo, hint system, responsive
3. **247 FreeCell** — Multiple variants (Double FreeCell, Baker's Game, Eight Off), daily challenges

## Core Mechanics
- 52 cards (1 standard deck), ALL face-up from start — no hidden information
- 8 tableau columns: first 4 = 7 cards, last 4 = 6 cards (52 total)
- 4 Free Cells (top-left): single-card temporary storage
- 4 Foundation piles (top-right): build Ace → King by suit
- NO stock/waste pile — all cards visible from deal

## Card Movement Rules
- **Tableau**: Build DOWN by ALTERNATING COLORS (red on black, black on red)
- **Foundation**: Build UP by SAME SUIT (A, 2, 3... K)
- **Free Cells**: Store any single card temporarily
- **Supermove Formula**: Max movable cards = (N+1) × 2^M
  - N = empty free cells, M = empty tableau columns
  - Example: 2 empty cells + 1 empty column = 3 × 2 = 6 cards max

## Game Number System
- Microsoft original: #1 to #32,000 (deterministic LCG seed)
- Extended: #1 to #1,000,000
- Same number = identical deal across all platforms
- Formula: `seed = (seed * 214013 + 2531011) mod 2^31`
- 99.999% of deals are solvable (only #11982 in original 32K is confirmed unsolvable)

## Systems to Implement
- **Game Number Selection**: Input field to pick specific deals (#1-#999,999), random button
- **Hint System**: Highlight one valid move when player is stuck, cycle through available moves
- **Unlimited Undo**: Full move history stack, no penalty for undo
- **Auto-Move to Foundation**: Safe auto-move (when all cards of opposite color with lower rank are already on foundation)
- **Auto-Complete**: When all cards are face-up and ordered, auto-cascade to foundations
- **Scoring**: Start at 0, +10 per card to foundation, time bonus (max 1000 - elapsed seconds), +500 win bonus
- **Win Detection**: All 52 cards on foundation = win
- **Statistics**: Games played/won, win %, best time, current streak, best streak, total moves
- **Timer**: Elapsed time display, paused when game not active
- **Tutorial**: First-time overlay explaining free cells, foundations, supermoves
- **Settings**: Sound toggle, timer toggle, auto-complete toggle
- **New Game**: Random game button + game number input
- **Restart**: Restart current game with confirmation

## Difficulty Modes
FreeCell is inherently 1 difficulty (all cards visible). Difficulty comes from game number choice:
- **Easy**: Game #1-#10000 (most are solvable with basic strategy)
- **Medium**: Random game selection
- **Hard**: Known difficult games (some have very narrow solution paths)

No explicit difficulty selector needed — the game number system IS the difficulty system.

## Visual Style
- Dark gradient background (GameZipper standard: #0a0a1a → #1a1a2e)
- Green felt tableau area (subtle)
- Card rendering: White cards with colored suits (♠♣ black, ♥♦ red), rounded corners
- Smooth card move animations (200ms ease-out)
- Neon glow on valid drop targets
- Selected card raised with shadow
- Glass-morphism panels for menus/modals
- Victory animation: cards cascade with particle effects

## Audio
- **BGM**: Relaxing ambient chord loop (Web Audio API, matching Solitaire.com feel)
- **SFX** (7 types):
  1. Card deal (shuffle sound)
  2. Card move/flip (short click)
  3. Card to foundation (satisfying "ding")
  4. Invalid move (soft error buzz)
  5. Win fanfare (ascending melody)
  6. Button click (UI feedback)
  7. Undo (reverse swoosh)

## SEO Targets
- "freecell", "freecell solitaire", "freecell online", "play freecell free", "free cell", "freecell game"
- Title: "Play FreeCell Solitaire Online Free - Classic Card Game | GameZipper"
- Desc: "Play FreeCell Solitaire online free. Classic card game with unlimited undo, hints, auto-complete, and game number selection. No download required."

## Key Differentiators vs GZ Existing Games
- Klondike Solitaire = stock/waste piles, 7 tableau, face-down cards
- FreeCell = all face-up, 4 free cells, 4 foundations, NO stock pile, strategic (not luck-based)
- Spider Solitaire = 2 decks, 10 columns, stock deals rows, sequence removal
- FreeCell = 1 deck, 8 columns, no stock, foundation building
