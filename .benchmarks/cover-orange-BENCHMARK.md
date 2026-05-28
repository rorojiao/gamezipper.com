# Cover Orange — Competitive Benchmark Report

> **Game Genre:** Physics-based puzzle (protect-from-hazard subgenre)
> **Date:** 2026-05-29
> **Purpose:** Benchmark competitor analysis for Cover Orange-style game development

---

## 1. Cover Orange — Franchise Overview

| Attribute | Details |
|---|---|
| **Developer** | FDG Entertainment / Johnny-K (originally Flash) |
| **Original Release** | October 21, 2009 (Adobe Flash) |
| **Mobile Release** | November 16, 2010 (iOS), later Android |
| **Total Plays** | 170+ million online plays |
| **Store Rating** | 4.6 stars (Google Play, 42K+ reviews), 1M+ downloads |
| **Monetization** | Free-to-play with ads + in-app purchases |

---

## 2. Core Game Rules & Mechanics

### 2.1 Primary Objective
Protect cute orange characters from deadly acid rain cloud by strategically placing objects to create protective shelters.

### 2.2 Gameplay Loop
1. **Observe** — Player sees level layout, orange positions, available objects
2. **Place** — Drag and drop objects from inventory onto the stage
3. **Trigger** — Last placed object activates the evil rain cloud
4. **Survive** — Cloud drops acid rain; oranges must stay dry
5. **Score** — Earn stars based on performance

### 2.3 Star Rating System (3-Star Maximum)
| Star | Criteria |
|---|---|
| Star 1 | Complete the level (keep all oranges alive) |
| Star 2 | Place all elements within a time limit (speed bonus) |
| Star 3 | Find and tap a hidden star during acid rain downpour |

### 2.4 Object Types
- Wooden boxes/crates — Standard building blocks
- Triangular blocks/wedges — Ramps and angled surfaces
- Wooden planks — Long flat surfaces for bridges/roofs
- Wheels — Rolling objects affected by gravity
- Spiked balls — Can destroy ice blocks
- Bombs — Explosive objects that alter terrain
- Trampolines — Bounce objects into position
- Glass blocks — Breakable transparent blocks

### 2.5 Physics Features
- Realistic gravity — Objects fall, tumble, settle naturally
- Collision detection — Objects stack, slide, interact
- Momentum & rolling — Round objects roll on slopes
- Material properties — Different friction, weight, durability per type
- Chain reactions — Object interactions trigger cascading effects
- Destructible elements — Ice breaks, glass shatters

### 2.6 Level Structure
- Levels organized into episodes/worlds with unique themes
- Progressive difficulty: simple shelter → complex multi-step puzzles
- Each level has a "Eureka Moment" — key insight for solution
- Multiple valid solutions per level (encourages replay)
- Failure: orange falls off stage OR orange gets hit by acid rain

---

## 3. Direct Competitors

| Game | Core Mechanic | Similarity | Key Differentiator |
|---|---|---|---|
| Save the Snail | Place objects to shield from hazards | Very High | Snail characters, nature theme |
| Save the Dog genre | Freehand draw to protect from bees | High | Drawing vs object placement |
| RainGuard | Draw lines to protect from rain | Extremely High | Open-source, near-clone |
| Help the Monkey | Draw lines to protect monkey | Very High | Unity template |
| Where's My Water? | Dig to guide water to alligator | Medium | Fluid physics |
| Feed Me Oil | Place objects to guide oil flow | Medium | Liquid physics |
| Sprinkle | Aim water cannon to fight fires | Medium | Water physics |

---

## 4. Recommended Features for GameZipper Version

**Must Have:**
- Drag-and-drop object placement
- 2D physics (gravity, collision, material properties)
- 3-star rating system
- 30+ levels across themed episodes
- Cute character design
- Progressive difficulty with "Eureka Moment" design
- Responsive design (mobile + desktop)
- Rain particle system
- Tutorial system
- Score + best score tracking
- Sound effects (Web Audio API)

**Should Have:**
- Speed bonus star
- Hidden collectible star per level
- Daily challenge mode
- Undo last placement
- Episode/world theming

**Nice to Have:**
- Freehand draw mode for custom barriers
- Water/fluid physics hazards
- Chain reaction puzzles
- Character customization
