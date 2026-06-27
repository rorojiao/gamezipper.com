# Hoop Stack — Competitive Benchmark

## Game Concept
Hoop Stack (Ring Sort Puzzle / Color Ring Stack) — Players sort colored rings onto pegs.
Move rings from one peg to another. Only same-colored rings stack together. Goal: sort all
rings so each peg holds a single color (or is empty). Classic water-sort-style mechanic but
with physical rings on pegs instead of liquid in tubes.

## Competitors

### 1. "Hoop Stack — Color Ring Sort" (LIHUHU)
- **Downloads**: 10M+ on Google Play
- **Rating**: 4.2★ (60K+ reviews)
- **Mechanics**: Drag rings between pegs, only same-color stacks allowed
- **Monetization**: Interstitial between levels, banner, rewarded hint
- **Levels**: 500+ procedurally generated
- **Key features**: Star rating, hint system, undo, level select

### 2. "Ring Sort Puzzle" (various publishers)
- **Downloads**: 5M+ combined
- **Mechanics**: Same ring-stacking mechanic with varying peg counts
- **Monetization**: Heavy interstitial + banner
- **Key features**: Multiple difficulty tiers

### 3. GameZipper: Color Sort (existing #163)
- Liquid/tube sorting — uses CSS DOM tubes + balls
- 66KB single-file HTML5
- Proven engagement on GameZipper

## Differentiation Strategy
- **Visual**: 3D-look rings with gradient + shadow (not flat like water sort)
- **Feedback**: Smooth ring-drop animation with bounce, particle sparkle on completion
- **Difficulty curve**: 30 levels across 5 tiers (4 pegs → 9 pegs)
- **Features**: Undo, restart, hint (shows next valid move), star ratings
- **Mobile**: Touch-first drag/drop with visual feedback
- **Audio**: Procedural Web Audio (chime on drop, success chord on level complete)

## Technical Approach
- Canvas-based rendering for smooth ring animations
- Ring data: array of pegs, each peg is array of color indices (bottom to top)
- Move: pick up top ring of source peg → drop on target peg (if top color matches or empty)
- Win condition: every peg is empty or all-same-color
- Procedural level generation: start from solved state, shuffle with valid reverse moves

## Scoring: 23/25
| Criterion | Score | Notes |
|-----------|-------|-------|
| Market gap (15M+ downloads, zero GZ coverage) | 9/10 | Massive proven mobile hit |
| Search volume | 5/5 | "Hoop stack" / "ring sort" top puzzle keyword |
| Monetization potential | 5/5 | Casual sorting = top ad revenue tier |
| Technical feasibility | 3/3 | Canvas drag/drop, well-understood |
| Uniqueness | 1/2 | Shares genre with color-sort but distinct mechanic |
| **Total** | **23/25** | ✅ Strong candidate |
