# BENCHMARK.md — Goods Sort Challenge: Competitive Analysis

**Date:** June 12, 2026  
**Genre:** Shelf-based goods sorting / triple-match 3D puzzle games

## Competitors Analyzed
1. Goods Sort™ (Shinrays Games) - 10M+ downloads, 4.8★
2. Goods Puzzle: Sort Challenge™ (FALCON GAMES) - **50M+ downloads**, 4.6★ (market leader)
3. Goods Puzzle: 3D Sorting Games (Guru Puzzle) - 10M+ downloads, **4.9★** (highest rated)
4. Super Sort® (Peak Plus / Peak Games) - 1M+ downloads, 4.8★, **3000+ levels**

## Core Mechanics to Implement
- **Triple Match on Shelves**: Select/drag items, match 3 identical to clear
- **Shelf Grid Layout**: Multiple shelves with items, some slots blocked
- **Timer**: Creates urgency, with Freeze power-up
- **Progressive Difficulty**: More items, tighter time, obstacles at higher levels
- **Combo System**: Consecutive matches earn bonus multipliers

## Power-ups (4 types minimum)
1. **Shuffle** - Rearrange all items on shelves
2. **Hint** - Highlight a valid match
3. **Freeze** - Pause timer for 15 seconds
4. **Undo** - Reverse last move
5. **Extra Shelf** - Add temporary shelf space (bonus)

## Scoring System
- Base points per triple match
- Combo multiplier for consecutive matches
- Time bonus for finishing quickly
- Star rating (1-3 stars per level)

## Level Design Target: 25 levels minimum (S-grade)
- Tutorial levels (1-3): Guided, no timer
- Easy (4-10): Simple layouts, generous timer
- Medium (11-18): More items, tighter timer
- Hard (19-23): Obstacles, many item types
- Expert (24-25): Maximum challenge

## Art Style
- Bright, colorful items (emoji-style for Canvas rendering)
- Dark gradient background (GameZipper style)
- Neon accent colors
- Glass-morphism panels
- Satisfying animations (items popping, particles)

## Audio
- Web Audio API procedural generation
- BGM: Calm, ambient electronic
- SFX: Click, match, combo, complete, fail, power-up

## Key Differentiators (Browser Game)
- Mouse + touch support
- No forced ads
- Fast loading (single file)
- Dark neon aesthetic (different from mobile competitors' bright 3D)
