# Pack Master — Complete Game Specification

## Game Overview
**Title**: Pack Master
**Slug**: pack-master
**Category**: puzzle
**Tags**: ["spatial", "packing", "suitcase", "travel", "drag-drop"]
**Description**: Pack your suitcase perfectly! Fit travel items (clothing, electronics, toiletries, shoes) into the suitcase without overlap. 30 levels, 5 difficulty tiers, star ratings. No download.

## Core Mechanics
- **Top-down suitcase view**: Rectangular container (varies by level)
- **Drag-and-drop items**: Touch and mouse support via Pointer Events
- **Collision detection**: Items cannot overlap or exceed bounds
- **Item rotation**: 90° rotation for better fit
- **Level complete**: All items fit successfully
- **Star ratings**: 1 star (complete), 2 stars (≤30s), 3 stars (≤20s + ≥10% unused space bonus)

## Level Structure (30 levels, 5 tiers)

### Tier 1 (Levels 1-6): Introduction
- Suitcase size: 200×150
- Items: 3-4 simple rectangles (t-shirts, socks)
- No rotation needed
- Tutorial overlay on first level

### Tier 2 (Levels 7-12): Basic shapes
- Suitcase size: 220×170
- Items: 5-6 items (L-shapes, T-shirts, pants)
- Optional rotation
- Introduce fragile items (toiletries — must not overlap other fragile items)

### Tier 3 (Levels 13-18): Complex shapes
- Suitcase size: 240×190
- Items: 7-8 items (shoes, laptops, irregular shapes)
- Rotation required for optimal fit
- Weight limits (total weight ≤ max)

### Tier 4 (Levels 19-24): Tight fits
- Suitcase size: 220×200
- Items: 9-10 items, awkward shapes
- Minimal unused space allowed
- Bonus for optimal packing (≥15% unused space = extra star)

### Tier 5 (Levels 25-30): Master challenges
- Suitcase size: 250×220
- Items: 11-12 items, very awkward shapes
- Must use rotation, weight limits, fragile constraints
- Time pressure (60s limit for 3-star)

## Item Types (8 base shapes)

1. **T-shirt** (rectangle 60×40): Basic clothing, light weight
2. **Pants** (rectangle 70×50): Larger clothing, medium weight
3. **Socks** (rectangle 30×30): Small, can be paired
4. **Laptop** (rectangle 90×60): Large, heavy, fragile
5. **Phone** (rectangle 50×30): Small electronic, fragile
6. **Toiletry bag** (rectangle 50×50): Medium, fragile
7. **Shoes** (L-shape 70×50 with notch): Awkward shape, heavy
8. **Bottle** (circle 30×30): Round shape, fragile, cannot be placed next to other bottles

## Power-ups
- **Hint** (3 per game): Show one valid placement for current item
- **Shuffle** (2 per game): Rearrange all placed items randomly
- **Undo** (unlimited): Undo last move

## Scoring
- **Stars**: 1-3 per level (see Level Complete criteria)
- **Total score**: Sum of all stars
- **Best time**: Track per level

## Technical Requirements

### HTML Structure
- Single file (index.html)
- Semantic tags (header, main, canvas, footer)
- Meta tags for SEO (title, description, og:, canonical)
- Structured data (VideoGame, FAQPage, HowTo, BreadcrumbList)
- Site analytics pixel (site-analytics.cap.1ktower.com)

### CSS
- BEM naming convention
- Dark theme (#0a0a1a background)
- Responsive design (mobile-first, 320px-1200px)
- Touch-friendly (touch-action:none, user-select:none)
- No external CSS files

### JavaScript
- Canvas rendering (requestAnimationFrame loop)
- Pointer Events (pointerdown, pointermove, pointerup, pointercancel)
- Collision detection (AABB with rotation)
- Web Audio API for SFX and BGM
- localStorage for progress/save
- Cleanup function (cancelAnimationFrame, beforeunload handler)

### Level Data Format
```javascript
var LEVELS = [
  {
    cols: 10, rows: 8,  // Grid size (for snap-to-grid)
    width: 200, height: 150,  // Suitcase dimensions in px
    items: [
      { type: 'tshirt', x: 0, y: 0, w: 60, h: 40, rotated: false, weight: 1, fragile: false },
      // ... more items
    ],
    parTime: 20,  // Target time for 3 stars
    bonusSpace: 10  // Bonus threshold (% unused space)
  },
  // ... 30 levels
];
```

### Audio
- **SFX** (Web Audio oscillators):
  - Rustle (white noise filter)
  - Zipper (modulated sawtooth)
  - Snap (short burst)
  - Win fanfare (major chord arpeggio)
  - Error buzz (descending sawtooth)
  - Pickup (rising sine)
- **BGM**: Procedural ambient travel music (Web Audio)
  - Scene-based: title, game, win
  - Chord progressions: Cmaj - Amin - Fmaj - Gmaj
  - Per-scene note patterns

### Art Assets (Procedural Canvas)
- **Suitcase**: Rectangle with stitching pattern
- **Items**: Drawn with basic shapes + labels
  - T-shirt: Rectangle with collar
  - Pants: Rectangle with waistband
  - Shoes: L-shape with shoe outline
  - Laptop: Rectangle with screen
  - Phone: Small rectangle with screen
  - Toiletry bag: Rectangle with zipper
  - Bottle: Circle with cap
  - Socks: Small rectangle with ribbing
- **Background**: Gradient dark theme
- **UI**: Clean buttons, star icons (Canvas-drawn 5-point stars)

## QA Checklist (40 points)
1. **HTML & SEO (6)**: Meta tags, structured data, analytics pixel, canonical URL, og: tags
2. **CSS & Responsive (5)**: Dark theme, responsive canvas, touch targets ≥36px, no hardcoded widths, overflow hidden
3. **Game Logic (7)**: Collision detection, rotation, level solvable, win condition, scoring, 3-star, hints
4. **Input Handling (3)**: Pointer events, prevent default touch, handle pointer cancel
5. **Audio (4)**: Lazy AudioContext, SFX types, separate music toggle, graceful fallback
6. **State Management (4)**: localStorage progress, level unlock, best times, tutorial
7. **Performance (3)**: No memory leaks, efficient rendering, fast level load
8. **Accessibility (4)**: Window resize, no div/0, positive grid sizes, valid colors
9. **Code Quality (4)**: No console.log, no TODO/FIXME, organized sections, no external deps
10. **Game-specific (4)**: 30 levels, 5 tiers, item rotation, weight/fragile mechanics

## Deployment Requirements
- **Path**: /home/msdn/gamezipper.com/pack-master/index.html
- **Size**: ~50KB (similar to Fill The Fridge)
- **Browser compatibility**: Chrome, Firefox, Safari, Edge (desktop + mobile)
- **Performance**: First-screen load <3s

## Monetag Ads
- **Banner (zone 110120)**: Bottom of screen, non-blocking
- **Interstitial (zone 110122)**: Between levels, optional skip after 5s

## Deliverables
1. Complete single-file HTML game at /home/msdn/gamezipper.com/pack-master/index.html
2. 30 handcrafted levels (all solvable)
3. All mechanics working (drag-drop, rotate, collision, win, stars, power-ups)
4. Web Audio BGM and SFX
5. Procedural Canvas art (no external assets)
6. SEO meta tags and structured data
7. localStorage save system
8. Responsive design (mobile-first)
9. Touch + mouse support
10. Monetag ad integration

## Success Criteria
- File size ≤60KB
- All 30 levels solvable
- 40/40 QA checks pass
- JavaScript syntax valid (node --check passes)
- English UI only (no Chinese characters in UI)
- No emoji in Canvas rendering (use geometric shapes)
- Cleanup function present (cancelAnimationFrame, beforeunload)
- No console.log in production code
- No external dependencies (all self-contained)

Build the game NOW.