# Spider Solitaire — Competitive Benchmark

## Top Competitors
1. **Microsoft Spider Solitaire** (Microsoft Solitaire Collection) — Gold standard
2. **spidersolitaire.co.za** — Popular browser version
3. **thesolitaire.com** — 100+ solitaire games, Spider featured prominently

## Core Mechanics
- 104 cards (2 standard decks)
- 10 tableau columns: first 4 columns have 6 cards (5 face-down + 1 face-up), last 6 have 5 cards (4 face-down + 1 face-up)
- 50 remaining cards in stock (5 deals of 10 cards)
- Build down by rank (K→Q→J→...→A), same suit sequences can be moved as a group
- Complete K→A same-suit sequence auto-removed to foundation
- Win when all 8 sequences removed

## Difficulty Modes
- **1 Suit (Easy)**: All Spades — beginners, most games winnable
- **2 Suits (Medium)**: Spades + Hearts — moderate challenge
- **4 Suits (Hard)**: All 4 suits — expert level, very challenging

## Systems to Implement
- **Scoring**: 500 base - 1 per move, +100 per completed suit. Bonus for fewer moves.
- **Hint system**: Highlight valid moves when stuck
- **Undo**: Full undo stack (unlimited)
- **Auto-complete**: Detect when game is won, auto-remove remaining sequences
- **Statistics**: Games played/won, win %, best score, current streak, best streak
- **Timer**: Optional timer display
- **Tutorial**: First-time player walkthrough
- **New Game / Restart**: Confirmed restart with stats warning
- **Settings**: Sound toggle, auto-complete toggle, timer toggle

## Visual Style
- Dark gradient background (GameZipper standard)
- Smooth card animations (deal, move, complete sequence)
- Neon accent for selected/valid moves
- Card rendering with proper suits (♠♥♦♣)
- Glass-morphism panels

## Audio
- BGM: Relaxing ambient (Web Audio or MiniMax)
- SFX: Card deal, card move, card flip, sequence complete, win fanfare, button click, error

## SEO Targets
- "spider solitaire", "spider solitaire free", "spider solitaire online", "spider solitaire 1 suit", "spider solitaire 2 suit", "spider solitaire 4 suit"
