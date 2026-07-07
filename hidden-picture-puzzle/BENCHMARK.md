# Hidden Picture Puzzle — Competitive Benchmark

## Concept
Player is given a list of items to find in a cluttered, hand-drawn scene. Tapping each hidden object clears it from the list. Timer / star rating based on completion time. 30 levels, escalating difficulty.

## Top Competitors Analyzed

### 1. Hidden Folks (Adriaan de Jongh, 2017) — Benchmark
- **Mechanic**: Hand-drawn black-and-white scenes, target list with silhouettes (not names)
- **Why it works**:
  - No time pressure → exploration feel
  - Audio: ambient bird chirps, wind, water — every interactive element has tactile SFX
  - Levels are scrollable (panning reveals more)
  - Items blend into background texture, not separate from scene
- **Take for our version**: silhouette-hint target list (aesthetic + accessibility), tactile SFX per find
- **Risk**: full hand-drawn art is a huge asset cost → use procedurally-generated SVG scenes + procedural hidden-object placement

### 2. June's Journey (Wooga, 2018) — Mobile #1 hidden-object
- **Mechanic**: Photo-realistic scenes, timed rounds (3-star based on speed), hint system
- **Why it works**: strong narrative skin, social/clan features, daily streaks
- **Take for our version**: 3-star rating per level (3★ = under target time, 2★ = under par×1.5, 1★ = solved), daily streak counter
- **Risk**: photo realism requires real art — we use procedurally-drawn canvas scenes instead

### 3. Hidden Through Time (Crazy Monkey Studios, 2020) — Tier-2
- **Mechanic**: Cartoon scene, hint magnifier reveals area
- **Why it works**: hint mechanic prevents rage-quit on hard levels
- **Take**: 3 hints per level, regenerates on replay
- **Risk**: cartoon art cost

### 4. I Spy / Where's Waldo (Classic)
- **Mechanic**: Photographic scenes, list of item names
- **Why it works**: pure visual scan, no special hardware needed
- **Take**: minimal art (CSS shapes) — focus on puzzle structure

## Our Differentiation

| Competitor weakness | Our answer |
|---------------------|------------|
| Static camera | Pan/scroll across wide scenes |
| Photo-real art (huge cost) | Procedurally-drawn SVG/Canvas scenes |
| Single difficulty curve | 5 tiers × 6 levels = 30 levels with curve |
| No replay value | Hidden object positions randomized per level |
| No haptic feedback | Web Audio SFX per click + find + miss |

## Our Mechanic Specifics

### Core Loop
1. **Title**: "Hidden Picture Puzzle — Find What You Seek"
2. **Menu**: Play / How to Play / Stats
3. **Level Select**: 30 levels in 5 tiers (Beginner → Master)
4. **Gameplay**:
   - Scene rendered (procedural SVG/Canvas, ~100 objects placed)
   - Target list shows 5-10 silhouettes + names
   - Click any object on scene → if matches target → check off + SFX + counter
   - Wrong click → "miss" SFX, light penalty (no timer damage)
   - Find all → star rating calculated, "Next" button enabled
5. **Progression**: 3★ unlocks next; <3★ but solved → unlocks next with reduced stars

### Difficulty Curve (5 tiers × 6 levels)
- **T1 Beginner**: 100 objects, 3 targets, no timer, large target icons
- **T2 Easy**: 150 objects, 4 targets, 60s soft timer, medium target icons
- **T3 Medium**: 200 objects, 5 targets, 45s soft timer, smaller icons
- **T4 Hard**: 250 objects, 6 targets, 30s soft timer, small icons
- **T5 Master**: 300 objects, 7 targets, 20s soft timer, tiny icons

### Levels (30 levels)
- **Procedurally generated** each level: random scene type (forest/beach/city/space/candy) + seed
- **Hidden objects**: random placement within scene, must avoid edge overlap
- **Verification**: per level, BFS checks each target has a unique position reachable (no occlusion)

## Visual Design

### Aesthetic
- **Palette**: warm parchment + dark teal accents (Hidden Folks-inspired)
- **Style**: SVG line art + flat color fills, slight texture overlay
- **Font**: serif for headings (game-feel), sans-serif for UI

### Scene Generation
- **Background**: SVG path noise + color blocks
- **Foreground objects**: 50-300 simple shapes (circles, rects, paths) with random colors from palette
- **Hidden targets**: 5-10 specific shape-color combos, listed in target panel

## Audio Design (Web Audio API procedural)
- **BGM**: gentle ambient pad, ~30s loop, pentatonic major scale
- **Find SFX**: bright bell ping (triangle wave 880Hz, 200ms decay)
- **Miss SFX**: dull thud (sine 220Hz, 100ms)
- **Level complete**: ascending arpeggio C-E-G-C
- **Star earned**: subtle chime

## Mobile-First
- Touch targets ≥44px
- Pinch-zoom on canvas (or button zoom)
- Two-finger pan
- Bottom target list sticky

## SEO / Schema
- VideoGame schema (name, description, genre, image)
- HowTo schema (5 steps: open, find targets, click, complete, next level)
- FAQPage (5 Q&A about mechanics)
- BreadcrumbList

## Risks & Mitigations
1. **Procedural scene quality** — use hand-tuned color palettes + shape libraries, not pure random
2. **Object clickability** — hit-test circles around each object; small tap tolerance ±5px
3. **Hidden object discoverability** — silhouette hints in target list reduce frustration
4. **Performance** — limit scene to 300 objects, use SVG groups + canvas overlay for click layer

## Summary
S-tier viability: ✅ 23/25
- Strong evergreen mechanic (proven by Hidden Folks, June's Journey)
- 100% procedural art (no asset cost)
- Mobile-friendly (touch, no hardware needs)
- Infinite replay via randomized seeds
- Clean separation: scene render + click layer + target list