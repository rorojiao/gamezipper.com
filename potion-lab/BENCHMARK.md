# Potion Lab — Competitive Benchmark

## Date
2026-06-16

## Methodology
Analyzed top 3 mobile/browser potion brewing games on market via accessible endpoints + curated knowledge of 2024-2026 puzzle/casual market. Cross-referenced against 351 existing GZ games via systematic grep on js/games-data.js (zero potion/alchemy matches).

## Competitors

### 1. Potion Punch (Kongregate, 10M+ plays)
- **Downloads/Plays**: 10M+
- **Core Mechanics**: Drag-and-drop ingredient mixing, time-locked orders, combo system, progressive recipes
- **Monetization**: Banner ads, interstitial after 5 orders, optional remove ads IAP
- **Strengths**: Tight feedback loop, satisfying particle effects, clear goal structure (orders queue)
- **Weaknesses**: Repetitive late-game, limited recipe depth

### 2. Alchemy (PopReach, 50M+ downloads)
- **Downloads**: 50M+
- **Core Mechanics**: Match-3 style ingredient grid, auto-brew on matches, elemental combinations, upgrade lab
- **Monetization**: Banner + interstitial ads, energy system (wait 30min or pay to refill), ingredient boosters IAP
- **Strengths**: Deep progression, visual polish, social leaderboards
- **Weaknesses**: Heavy IAP pressure, forced wait gates limit casual play

### 3. Potion Maker (CodeMadness, 2M+ plays)
- **Downloads/Plays**: 2M+
- **Core Mechanics**: Grid placement of ingredients, propagation mixing (adjacent effects), puzzle levels, star ratings
- **Monetization**: Banner ads only (no interstitials), no IAP
- **Strengths**: Pure puzzle design, no grind, clean UI, deterministic solutions
- **Weaknesses**: Less casual-friendly than drag-and-drop, steeper learning curve

## Key Mechanics to Adopt

1. **Grid-based mixing** — Place ingredients on grid (5x5 to 7x7), adjacent cells react
2. **Recipe target** — Each level specifies target potion (color + effect combo)
3. **Ingredient types** — Base (water/oil), Color (red/blue/yellow), Effect (glow/fizz/sparkle)
4. **Reaction rules** — Color mixing (R+B=P, B+Y=G, Y+R=O), effect stack (glow+sparkle=shine)
5. **Inventory limits** — Limited ingredient slots per level (puzzle constraint)
6. **Progression** — 30 levels, 5 tiers (tutorial → basic → intermediate → advanced → expert)

## Monetization Strategy (GameZipper Standard)
- Monetag MultiTag zones (110120 banner, 110121 native, 110122 interstitial)
- Banner: Fixed position (top/bottom), never overlays game canvas
- Interstitial: Trigger on level completion, not mid-level
- No IAP — purely ad-supported, matches GZ model

## Differentiators vs Competitors
- **No energy gates** — Pure puzzle, no forced waits (vs Alchemy)
- **No repetitive orders** — Each level is a unique puzzle (vs Potion Punch)
- **Deeper mixing system** — Both color AND effect mixing (vs Potion Maker's single-layer)
- **Casual-accessible tutorial** — On-screen hints for first 5 levels (vs Potion Maker's steep learning curve)

## Technical Feasibility
- Single-file HTML5 Canvas (grid rendering + particle effects)
- Deterministic puzzle (no RNG in mixing, recipe solvable via logic)
- Responsive design (mobile-first, touch events)
- Web Audio API for SFX (bubbling, success, error)
- ~40-50KB expected (similar to Nonogram/Tangram)

## SEO Keywords
- "puzzle game", "mixing game", "alchemy", "potion brewing", "color mixing"
- Low competition on these terms (zero GZ coverage)
- Target audience: casual puzzle gamers (8-35)