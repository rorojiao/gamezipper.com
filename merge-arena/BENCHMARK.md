# BENCHMARK.md — Competitive Analysis: "Merge Arena" Puzzle Game

> Generated: June 13, 2026
> Game: Merge Arena — merge units + deploy to defend against enemy waves

## Selected Game: Merge Arena

**Slug**: merge-arena
**Genre**: Merge strategy + wave defense puzzle
**Score**: D=4, S=5, R=5, F=5, Z=5 = 24/25

## Competitive References

### 1. Stick Merge (TinyDobbins / Poki)
- 50 weapon tiers, 2→1 merge
- Active shooting gallery combat
- Stick figure minimalist art
- Cover-based enemies with ragdoll physics
- Coins per kill, survival bonuses, board expansion

### 2. Merge Arena (EasyCats / Poki)
- 3D colorful cartoon style
- Units: Knights, Archers, Mages, Gigantic Knights
- Auto-battle after deployment
- Treasury passive income, PvP via keys
- Grid-based merge + battlefield deployment

### 3. Apocalypse Merge (ParaTataTeam)
- Post-apocalyptic zombie theme
- 10+ troop types, wave-based zombie combat
- Dual-field deployment (two lanes)
- Boss encounters every few waves
- Criticized for content reuse and excessive ads

### 4. LUDUS (Mobile)
- Merge + auto-chess PvP
- Merge level 3 unlocks special skills
- Buffing system with adjacent tiles
- Card collection mechanic

## Our Game Design

### Core Mechanic
- **Merge Phase**: Drag identical units together on a grid to merge into stronger units
- **Deploy Phase**: Place merged units on a battlefield to defend against waves
- **Active Combat**: Player can tap to trigger special abilities during combat
- **Loop**: Merge → Deploy → Battle → Earn coins → Recruit → Repeat

### Differentiators from Competitors
1. Active combat layer (player triggers specials, not pure auto-battle)
2. 6 unique unit classes (Warrior, Archer, Mage, Healer, Bomber, Shield)
3. Boss every 5 waves with unique mechanics
4. Daily challenges + achievement system
5. Permanent upgrade tree

### Required Systems (from competitive analysis)
- Scoring: Points per kill, wave clear bonus, combo multiplier
- 30 levels (5 chapters × 6 waves each)
- 6 unit types with 5 merge tiers each
- Enemy types: Slime, Goblin, Skeleton, Orc, Dragon, Boss
- Power-ups: Hint (auto-merge), Shuffle, Bomb (clear slot)
- Progress save: localStorage with version
- Tutorial: Interactive first-wave guide
- Sound: Web Audio API procedural BGM + 6+ SFX types
- Animations: Merge sparkle, combat hits, boss entrance, victory confetti

### Art Style
- Colorful cartoon fantasy (inspired by Merge Arena 3D but rendered 2D)
- Dark gradient background (GameZipper style)
- Neon accent colors for unit tiers
- Rounded UI panels with glass-morphism

### Music Style
- Fantasy adventure BGM (loops 2-3 min)
- Upbeat during combat, ambient during merge phase
- Web Audio API procedural generation
