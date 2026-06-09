# Tentai Show (Galaxies) — Competitive Benchmark

## Game Overview
Tentai Show (天体ショー), also known as **Galaxies** or **Spiral Galaxies**, is a binary-determination logic puzzle by Nikoli. Players divide a grid into rotationally symmetric regions (180°), each centered on a dot.

## Key Competitors

### 1. Simon Tatham's Galaxies (Dominant Free)
- Platform: Web + Android (1M+ downloads, 5.0★)
- Features: Infinite procedural puzzles, auto-highlighting completed regions, undo/redo, solve button
- Weaknesses: No gamification, no sound, plain visuals, no tutorial, no mobile touch optimization
- Score formula: None (pure logic, no scoring)

### 2. Conceptis Sym-a-Pix (Premium)
- Platform: Web, iOS, Android (10K+ downloads)
- Features: Picture reveal on completion, colored dots/regions, Basic/Advanced logic tiers, weekly new puzzles, tutorials
- Weaknesses: Paywalled content, niche reach
- Score formula: Timer-based, organized by size/difficulty

### 3. puzzle-galaxies.com (SEO Leader)
- Platform: Web, iOS, Android
- Features: 8 grid sizes, Daily/Weekly/Monthly challenges, Timer, Hall of Fame, Statistics, 15 languages
- Weaknesses: Basic visuals, no sound, ad-heavy
- Score formula: Timer + leaderboard

## Systems to Implement (Competitive Parity)

### Core Mechanics ✅
- Grid divided into 180° rotationally symmetric regions
- Each region contains exactly one dot (center of symmetry)
- Click/tap to draw walls between cells
- Auto-highlight completed regions

### Scoring System
- Timer-based scoring (faster = higher score)
- Move counter (fewer moves = bonus)
- Star rating per level (1-3 stars)
- Best score tracking (localStorage)
- Combo bonus for consecutive correct placements

### Progression System
- 25+ levels across 5 difficulty tiers
- Grid sizes: 5×5, 7×7, 10×10, 12×12, 15×15
- Difficulty curve: fewer dots → more complex regions
- Level unlock progression
- Overall progress percentage

### Tutorial System
- Interactive guided tutorial (Level 1)
- Step-by-step explanation of rules
- Highlight valid/invalid moves
- Skip option for experienced players

### Hint System
- "Check progress" button (highlight errors)
- "Hint" button (reveal one region border)
- Hints limited per level (earn more by completing levels)

### Visual Design
- Dark gradient background (GameZipper style)
- Neon/glowing dots for galaxy centers
- Galaxy-themed particle effects on region completion
- Animated region fill when correctly formed
- Screen shake on error
- Celebration animation on level complete

### Audio
- Web Audio API procedural BGM (space/ambient theme)
- Click sound (wall toggle)
- Success sound (region completed)
- Error sound (invalid placement)
- Level complete fanfare
- Combo sound (consecutive correct placements)

### Save System
- localStorage with version number
- Current level progress
- Best scores per level
- Stars earned per level
- Settings (sound, music, hints remaining)

### SEO
- JSON-LD (VideoGame + FAQPage + HowTo)
- og:title, og:description, og:image
- Canonical URL
- Analytics tracking

## Level Data Design
- Levels defined as grid configurations with dot positions
- Each level validated: exactly one unique solution exists
- Difficulty progression:
  - Tier 1 (Levels 1-5): 5×5 grid, 3-4 dots
  - Tier 2 (Levels 6-10): 7×7 grid, 5-6 dots
  - Tier 3 (Levels 11-15): 7×7 grid, 7-8 dots
  - Tier 4 (Levels 16-20): 10×10 grid, 8-10 dots
  - Tier 5 (Levels 21-25): 12×12 grid, 10-12 dots
