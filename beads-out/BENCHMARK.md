# Competitive Benchmark: Beads Out Puzzle Game

> **Date:** June 13, 2026  
> **Project:** "Beads Out" for GameZipper.com  
> **Target Platform:** Single-file HTML5 Canvas, browser-based, free-to-play  
> **Team:** GameZipper Tools  

---

## Executive Summary

This benchmark analyzes 5 direct and adjacent competitors in the bead/string/color-sort puzzle space. The primary competitor is **Beads Out by VOODOO** (mobile, 1M+ downloads, #27 grossing). Our GameZipper version must differentiate with a **constraint-satisfaction, string-clearing mechanic** (tap beads in sequence on strings) rather than VOODOO conveyor-belt sorting approach, while targeting the browser/HTML5 market where no direct equivalent exists.

**Key Insight:** The mobile market is saturated with color-sort and conveyor-mechanic bead games. The browser/HTML5 space has a gap -- no polished bead-on-string puzzle exists. Our game fills this gap with a darker aesthetic, deeper puzzle logic, and ad-light monetization.

---

## Competitor 1: Beads Out (VOODOO)

| Attribute | Detail |
|---|---|
| **Publisher** | VOODOO (developer: GoGames, package com.gogames.sandsout) |
| **Platform** | iOS App Store, Google Play |
| **Downloads** | 1,000,000+ total; ~510K in last 30 days (early 2026) |
| **Rating** | Mixed -- originally ~3-4 stars, user backlash after difficulty rescaling |
| **Rank** | #27 grossing (puzzle category) |
| **Monetization** | Free-to-play with interstitial ads (Voodoo standard); IAP likely for ad removal |

### Core Mechanic
Players collect colored beads from a **conveyor belt** and place them into **color-matched boxes**. Each box requires 2 full sets of matching-color beads to fill. Timing and tap-order determine success.

### Game Systems
- **Levels:** 600+ levels (growing to 1200+ in 2026 updates)
- **Mechanics Introduced Over Time:**
  - **Normal boxes** -- fill with 2 sets of same-color beads
  - **Half Boxes** -- boxes that split capacity, requiring precise timing
  - **Carriers** -- moving platforms that transport beads, adding logistics complexity
  - **Beads Race** -- competitive/racing feature added in 2026 update
- **Progression:** Linear level sequence with difficulty spikes ("Hard" and "Super Hard" bottlenecks). Level classifications were removed in a controversial update.
- **Scoring:** Pass/fail per level (implicit -- no explicit score display reported)
- **Tutorial:** Simple -- first few levels teach conveyor tapping and box matching
- **Powerups/Boosters:** Not prominently documented; likely ad-reward-based hints
- **Achievements:** Not documented as a major feature

### Art Style
- **Visual:** Colorful, casual mobile aesthetic. Bright saturated bead colors (red, blue, green, yellow, purple, orange) on clean white/light backgrounds. 3D-styled glossy bead rendering. Minimalist UI with large tap targets.
- **Animation:** Smooth conveyor movement, satisfying bead-drop physics, celebratory fill animations.

### Music and Sound
- **Music:** Upbeat, minimalist casual-game loops (standard Voodoo catalog). Short, looping electronic tracks.
- **SFX:** Satisfying pop and clink bead-placement sounds. ASMR-adjacent audio design.

### Key Numbers
| Metric | Value |
|---|---|
| Total levels | 600-1200+ |
| Bead colors | ~6 base colors |
| Beads per box | 2 sets (exact count per set varies) |
| Time per level | 30-90 seconds |
| Update frequency | Monthly+ (new mechanics added regularly) |

### Strengths (to learn from)
- Satisfying core loop (sort -> fill -> celebrate)
- Massive content volume (600+ levels)
- Strong ASMR/satisfying audio-visual design
- Regular content updates

### Weaknesses (to exploit)
- Difficulty spikes frustrate players (removed level classifications)
- Ads-heavy (standard Voodoo monetization)
- Mechanically shallow at core -- sorting/timing, not deep puzzle logic
- No browser/web version
- No string/thread mechanics

---

## Competitor 2: Unpuzzle: Tap Away Puzzle Game (HYPERCELL)

| Attribute | Detail |
|---|---|
| **Publisher** | HYPERCELL (also released as TapTap LLC on some stores) |
| **Platform** | iOS App Store, Google Play, CrazyGames (browser) |
| **Downloads** | 10,000,000+ total (Android); 1M+ on alternate listing |
| **Rating** | 4.68/5 (67,000 ratings) -- very strong |
| **Monetization** | Free-to-play with ads; IAP for boosters/ad removal |

### Core Mechanic
Tap 3D blocks in the direction they are pointing to slide them off the board. Clear all blocks to complete the level. Only blocks with an unobstructed path can be removed.

### Game Systems
- **Levels:** 1,000+ levels (two versions: original ~1000+; updated version with even more)
- **Mechanics:**
  - **Directional blocks** -- each block has an arrow showing which way it slides out
  - **3D rotation** -- rotate the entire structure to find blocks you can tap
  - **Boosters** -- power-ups to clear stuck blocks or shuffle
  - **Parking Jam mode** -- added car-parking sub-game variant
- **Progression:** Linear, gradual difficulty increase. No explicit difficulty labels.
- **Scoring:** Pass/fail per level with optional star ratings
- **Tutorial:** Minimal -- first 5 levels teach core tap-away mechanic
- **Powerups:** Boosters to remove single blocks, undo moves, auto-solve
- **Achievements:** Not prominently featured
- **Offline play:** Supported

### Art Style
- **Visual:** Clean 3D rendered blocks on neutral backgrounds. Minimalist color palette -- mostly pastel/muted tones. Wooden block textures in original; mixed materials in later updates. Low visual noise.
- **Animation:** Smooth sliding animations, satisfying whoosh on block removal. Structure gently rotates with swipe gestures.

### Music and Sound
- **Music:** Ambient, relaxing background loops. Very low-key, almost meditative.
- **SFX:** Gentle wood-on-wood sliding sounds, soft pop on removal. Stress-relief oriented audio.

### Key Numbers
| Metric | Value |
|---|---|
| Total levels | 1,000+ |
| Time per level | 15-120 seconds |
| Block types | 3-4 directional variants |
| Boosters | 3 types (shuffle, undo, auto-remove) |

### Strengths
- Extremely satisfying core mechanic (ASMR appeal)
- Massive level count
- Clean, calming visual design
- Browser version exists on CrazyGames
- 10M+ downloads prove massive market demand

### Weaknesses
- Mechanically simple -- no deep logic/constraint satisfaction
- Can feel repetitive after many levels
- Browser version is a port, not optimized for web

---

## Competitor 3: Beads Sort 3D: Jam Puzzle / Beads Jam 3D (GamesTown / Tripoly)

| Attribute | Detail |
|---|---|
| **Publisher** | GamesTown (iOS), Tripoly / SortPuzzle (Android variants) |
| **Platform** | iOS App Store, Google Play |
| **Downloads** | New release (Dec 2025); growing rapidly |
| **Rating** | Early ratings ~3.0/5 (few ratings so far) |
| **Monetization** | Free-to-play with ads |

### Core Mechanic
Dismantle 3D bead objects piece by piece by untangling strings of colorful beads, then sort the freed beads by color into matching containers. Inspired by screw/bolt/nut puzzles but with bead aesthetics.

### Game Systems
- **Levels:** Hundreds of brain-teasing levels (exact count not specified)
- **Mechanics:**
  - **Dismantle** -- tap beads on 3D objects to remove them in sequence
  - **Unravel** -- pull bead strings apart (string constraint mechanic)
  - **Sort** -- place beads into color-matched containers
  - **ASMR satisfaction** -- core design pillar
- **Progression:** Linear, increasing complexity of bead objects
- **Scoring:** Pass/fail, satisfying completion animations
- **Powerups:** Not documented; likely hint/skip systems
- **Features:** No time limit, offline play, relaxing gameplay

### Art Style
- **Visual:** 3D rendered colorful beads on dark/neutral backgrounds. Beads have glossy, gem-like appearance. Objects include jewelry, flowers, and decorative shapes made of beads. ASMR aesthetic -- soft lighting, satisfying colors.
- **Animation:** Beads roll and tumble when freed, strings stretch and snap. Celebratory particle effects on level completion.

### Music and Sound
- **Music:** Soft ambient/electronic loops. Calming, meditative.
- **SFX:** ASMR bead sounds -- clicking, rolling, sorting sounds. String-tension release audio.

### Key Numbers
| Metric | Value |
|---|---|
| Total levels | Hundreds (exact TBD) |
| Bead colors | 6-8 colors |
| Time per level | 30-120 seconds |
| Constraint type | String/thread untangling |

### Strengths
- Closest mechanic to our beads-on-strings concept
- Strong ASMR/satisfying design
- 3D visuals are visually striking
- Thread/untangle mechanic adds depth

### Weaknesses
- New, unproven -- few ratings/reviews
- Primarily a dismantle-sort game, not pure constraint-satisfaction
- Mobile-only, no browser version
- Heavy ad monetization likely

---

## Competitor 4: String Theory (DrewVGames)

| Attribute | Detail |
|---|---|
| **Publisher** | DrewVGames (Andrew Viesta) |
| **Platform** | iOS App Store, Steam (.99), itch.io |
| **Downloads** | Small indie release; niche audience |
| **Rating** | Positive Steam reviews (small count) |
| **Monetization** | Premium (paid) on Steam; free with IAP on iOS |

### Core Mechanic
Draw lines (strings) between pegs on a grid to create closed loops that fill with color, matching a given target pattern. Spatial reasoning + pattern matching puzzle.

### Game Systems
- **Levels:** 65+ handcrafted puzzles
- **Modes:** Campaign, Daily Challenges, Free Play, Level Editor (planned)
- **Mechanics:**
  - **Loop creation** -- draw strings between pegs to form colored regions
  - **Pattern matching** -- match target color arrangement
  - **Multiple colors** -- different colored strings create different colored fills
- **Progression:** Handcrafted level sequence, increasing complexity
- **Scoring:** Pattern accuracy (binary match/not-match)
- **Tutorial:** Integrated into early levels
- **Powerups:** None -- pure logic puzzle
- **Achievements:** Not documented

### Art Style
- **Visual:** Clean 2D geometric design. Colorful pegs and lines on dark or neutral backgrounds. Minimalist, almost mathematical aesthetic. Grid-based layout.
- **Animation:** Lines draw smoothly, regions fill with color on loop completion.

### Music and Sound
- **Music:** Ambient electronic. Contemplative, slightly spacey.
- **SFX:** Minimal -- soft click on peg placement, gentle confirmation sounds.

### Key Numbers
| Metric | Value |
|---|---|
| Total levels | 65+ |
| Daily challenges | Infinite (procedural) |
| Colors | 4-6 |
| Time per level | 1-10 minutes |

### Strengths
- Deep, thoughtful puzzle design
- Clean visual presentation
- Level editor extends replayability
- Closest string puzzle concept to ours

### Weaknesses
- Very small level count (65 vs our 20+)
- Niche, low downloads
- No browser version
- Premium pricing limits audience

---

## Competitor 5: String Theory Remastered / String Theory (LunarGames / Armor Games)

| Attribute | Detail |
|---|---|
| **Publisher** | LunarGames (Armor Games portal), Team Semicolon (Kongregate) |
| **Platform** | Browser (Poki, Armor Games, Kongregate), mobile |
| **Downloads** | Browser portal plays -- moderate traffic |
| **Rating** | Positive community ratings on portal sites |
| **Monetization** | Free (browser portal ads) |

### Core Mechanic
Manipulate physics-based strings/lines by clicking and dragging to guide a colored circle (orb) to an exit target. Strings can bend, break, or be rigid.

### Game Systems
- **Levels:** 20+ levels (classic browser version)
- **Mechanics:**
  - **Draggable strings** -- click and drag to reshape lines
  - **Physics simulation** -- orb rolls along strings, affected by gravity
  - **String types** -- normal (flexible), rigid (rotating), breakable, fixed (obstacles)
  - **Neon geometry** -- visual theme
- **Progression:** Linear level sequence, physics-based difficulty ramp
- **Scoring:** Binary completion (reach the exit)
- **Tutorial:** First levels introduce string manipulation
- **Powerups:** None
- **Achievements:** Portal-specific (Kongregate badges)

### Art Style
- **Visual:** Neon-on-dark geometric aesthetic. Vibrant colored lines and orbs against deep dark backgrounds. Retro-futuristic, Tron-like feel.
- **Animation:** Physics-driven orb movement, elastic string deformation, satisfying bounce and roll.

### Music and Sound
- **Music:** Electronic/ambient. Synthy, spacey loops.
- **SFX:** Bouncy physics sounds, string tension/release audio.

### Key Numbers
| Metric | Value |
|---|---|
| Total levels | ~20 (browser) |
| String types | 4 (flexible, rigid, breakable, fixed) |
| Time per level | 30-180 seconds |

### Strengths
- Browser-native (closest distribution model to ours)
- String manipulation is directly relevant
- Dark aesthetic is proven in this genre
- Physics-based satisfaction

### Weaknesses
- Very small level count
- Dated design (classic Flash-era)
- Physics-based, not constraint-satisfaction logic
- Low production values

---

## Competitive Landscape Summary

| Game | Core Mechanic | Platform | Levels | Downloads | Art Style | Depth |
|---|---|---|---|---|---|---|
| **Beads Out (VOODOO)** | Conveyor sort beads into boxes | Mobile | 600+ | 1M+ | Colorful casual 3D | Low (timing/reflex) |
| **Unpuzzle (HYPERCELL)** | Tap away directional 3D blocks | Mobile + Browser | 1,000+ | 10M+ | Clean minimal 3D | Low-Medium (spatial) |
| **Beads Sort 3D** | Dismantle/unravel bead strings, sort by color | Mobile | Hundreds | New release | ASMR 3D beads | Medium (untangle + sort) |
| **String Theory (DrewV)** | Draw loops on pegs to match patterns | Mobile, Steam | 65+ | Small indie | Clean 2D geometric | High (logic/pattern) |
| **String Theory Remastered** | Manipulate physics strings to guide orb | Browser | ~20 | Moderate | Neon-on-dark | Medium (physics) |

---

## GameZipper Beads Out -- Design Decision and Differentiation Strategy

### Our Unique Position

Our game occupies a **blue-ocean niche**: a constraint-satisfaction bead-on-string puzzle with browser-native delivery and dark-gradient aesthetics. No existing competitor combines all three elements.

### Core Mechanic (Differentiated)
**Tap colored beads in the correct sequence on intersecting strings to clear all strings from the board.**

This is fundamentally different from:
- VOODOO Beads Out: we are NOT a conveyor-sorting game
- Unpuzzle: we are NOT a block-tapping game
- Beads Sort 3D: we are NOT a dismantle-and-sort game
- String Theory: we are NOT a loop-drawing or physics game

Our mechanic is **pure constraint-satisfaction logic**: beads are threaded on strings that intersect/cross. You must determine and tap the correct order to clear all strings without creating deadlocks. Think untangle meets logic puzzle.

### Design Specifications (Informed by Benchmark)

| Aspect | Decision | Rationale |
|---|---|---|
| **Platform** | Single-file HTML5 Canvas | No competitor has a polished browser bead-string puzzle |
| **Theme** | Dark gradient background (#1a1a2e -> #16213e -> #0f3460) | Differentiates from VOODOO bright casual look; aligns with String Theory Remastered proven dark aesthetic |
| **Levels** | 20+ handcrafted levels | Matches String Theory browser version; exceeds it with constraint-satisfaction depth |
| **Art Style** | Glossy beads with glow effects on dark strings | Combines ASMR bead aesthetic (Beads Sort 3D) with dark theme (String Theory Remastered) |
| **Scoring** | Stars (1-3) per level + par system (optimal moves) | Lighter than VOODOO pass/fail; adds replayability via par challenge |
| **Tutorial** | First 3 levels with animated guides | Matches industry standard (VOODOO, Unpuzzle both use ~5 intro levels) |
| **Progression** | Linear unlock with difficulty labels (Easy/Medium/Hard) | Avoids VOODOO mistake of removing difficulty classifications |
| **Powerups** | Hint (highlights valid next bead), Undo, Reset | Matches Unpuzzle booster model; essential for stuck players |
| **Achievements** | Level completion stars, streak bonuses, par achievements | Adds depth without mobile IAP complexity |
| **Music** | Ambient electronic loops (Web Audio API synthesized) | Proven by String Theory and Unpuzzle; low file-size for single HTML |
| **Sound FX** | Satisfying bead-click sounds, string-clear chime, level-complete jingle | ASMR satisfaction is critical -- all bead games prioritize this |
| **Monetization** | Minimal (GameZipper site-level ads, no in-game ads) | Major differentiator from VOODOO ad-heavy model |

### Bead and String Design

| Element | Specification |
|---|---|
| **Bead colors** | 6 colors: Red, Blue, Green, Yellow, Purple, Orange |
| **Bead rendering** | Glossy spheres with radial gradient + highlight spot + soft glow |
| **String rendering** | Curved lines with subtle gradient, slight glow on dark background |
| **Board size** | 5x5 to 8x8 grid intersections (scales with level) |
| **Strings per level** | 3-8 strings (increasing with difficulty) |
| **Beads per string** | 2-5 beads (increasing with difficulty) |

### Level Progression Design

| Level Range | Difficulty | New Mechanic Introduced |
|---|---|---|
| 1-3 | Tutorial | Basic tap-to-clear single strings |
| 4-8 | Easy | 2-string intersections, must clear in order |
| 9-13 | Easy-Medium | 3-string crossings, some beads block others |
| 14-18 | Medium | 4+ strings, beads shared between strings |
| 19-23 | Medium-Hard | Chain dependencies, dead-end traps |
| 24-28 | Hard | Full 8-string boards, multi-dependency |
| 29-30+ | Expert | Timed bonus levels, par challenges |

### Scoring Formula (Proposed)

Star 1: Complete the level
Star 2: Complete in par moves or fewer
Star 3: Complete in par moves AND par time or faster

Base Score = 1000 per level
Time Bonus = max(0, (par_time - actual_time)) x 10
Move Bonus = max(0, (par_moves - actual_moves)) x 50

### Key Differentiators vs. Competition

1. **vs. Beads Out (VOODOO):** Logic-based constraint satisfaction vs. reflex-based sorting. Dark aesthetic vs. bright casual. No ads vs. ad-heavy. Browser vs. mobile-only.

2. **vs. Unpuzzle:** String/bead theme vs. block theme. Constraint-satisfaction logic vs. spatial-directional tapping. Handcrafted puzzle design vs. procedural mass content.

3. **vs. Beads Sort 3D:** Pure logic puzzle vs. ASMR dismantle game. Dark sophisticated aesthetic vs. colorful toy-like. Browser-native vs. mobile-only.

4. **vs. String Theory (DrewV):** Bead/string physicality vs. abstract geometric loops. Casual-friendly vs. niche logic. More levels with progression vs. 65 puzzles.

5. **vs. String Theory Remastered:** Constraint-satisfaction logic vs. physics simulation. Modern bead aesthetic vs. retro neon. Structured progression vs. bare-bones.

---

## Appendix: Sources

- AppBrain: Beads Out (com.gogames.sandsout) -- 1M+ downloads
- AppBrain: Unpuzzle (com.taptapgames.unpuzzle) -- 10M+ downloads, 4.68/5 rating
- beads-out.com -- Complete walkthrough for 600+ levels
- beadsout.org -- Level solutions and mechanics guide
- trickystorywalkthrough.com -- Beads Out walkthrough levels 1-1200+
- Uptodown -- Beads Out review and description
- App Store -- Beads Sort 3D: Jam Puzzle (GamesTown, Dec 2025)
- Google Play -- Bead String Puzzle (GameAtom)
- itch.io -- String Theory by DrewVGames
- Steam -- String Theory (DrewVGames, Mar 2024)
- Poki -- String Theory Remastered
- CrazyGames -- Unpuzzle: Tap Away Puzzle Game
- Armor Games -- String Theory (LunarGames)

---

*Generated by GameZipper competitive research pipeline -- June 2026*
