# Tents (Tents and Trees) - Competitive Benchmark

## Selected Game
**Tents** (slug: `tents`) — Nikoli logic puzzle, "place one tent per tree, no touching tents"
Score: 22/25 (market demand 4, SEO gap 5, retention 5, feasibility 5, zero-overlap 3)

## Top 3 Competitors

### 1. Frozax "Tents and Trees Puzzles" (Android)
- Downloads: 1M+, Rating: 4.7 (53.8K reviews)
- Features: Thousands of levels, dark mode, unlimited hints, daily levels, multiple themes, offline, auto-save
- Grid sizes: 6x6 to 14x14+ (12x18 non-square variants)
- Monetization: Ads + IAP coin economy (2 coins/level, packs 40-250 coins)

### 2. Simon Tatham's "Tents" (Web/Desktop)
- Free, open-source, no ads
- Presets: 8x8 Easy/Tricky, 10x10 Easy/Tricky, 15x15 Easy/Tricky + Custom
- Features: Undo/redo, save/load, seedable generator, solve button, keyboard nav

### 3. Tapcake "Tents and Trees: Puzzle game" (Android)
- Downloads: 10K+, Rating: 4.2
- Features: Thousands of levels, multiple themes (Japan/Egypt/Greece/Cats), hints+undo, tutorial
- Unique: tent-tree connection visualization lines

## Core Mechanics (Canonical Rules)
1. Place exactly as many tents as trees
2. Each tent is orthogonally adjacent to its tree (may be adjacent to multiple trees)
3. No two tents touch (including diagonally)
4. Row/column tent counts must match given numbers
5. Each puzzle has exactly one unique solution

## Game Features to Implement
- 30 handcrafted levels (5x5 → 12x12, 5 tiers of 6 levels each)
- Row/column count clues
- Tap to place: empty → tent → grass → empty cycle
- Tent-tree connection lines (Tapcake-style)
- Hint system (reveals one correct placement)
- Undo stack
- Timer + best time per level (localStorage)
- 3-star rating (based on time)
- Tutorial for first-time players
- Daily challenge (seeded by date)
- Level select with progress tracking
- Dark gradient theme (GameZipper style)
- Web Audio BGM + SFX

## Grid Size Progression
- Tier 1 (L1-6): 5x5 grids
- Tier 2 (L7-12): 6x6 grids
- Tier 3 (L13-18): 8x8 grids
- Tier 4 (L19-24): 10x10 grids
- Tier 5 (L25-30): 12x12 grids

## Monetization
- Monetag ads (banner + interstitial on level complete)
- No IAP needed for browser game

## Visual Style
- Dark gradient background (GameZipper neon style)
- Trees: Canvas-drawn stylized trees (dark green circles with brown trunks)
- Tents: Orange/yellow triangular tents
- Grass marks: Small green dots
- Grid: Subtle gridlines on dark background
- Count highlights: Green when satisfied, red when exceeded
