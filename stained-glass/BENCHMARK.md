# Stained Glass Puzzle Game — Competitive Benchmark Analysis

**Date:** June 11, 2026  
**Analyst:** Hermes Agent  
**Subject:** Grid-based coloring puzzle where players color cells in a grid so no two adjacent (edge-sharing) cells share the same color, with number clues restricting valid colors.

---

## Executive Summary

The "Stained Glass" grid coloring puzzle occupies a niche within the broader logic puzzle market. The core mechanic—coloring cells so no two adjacent cells share the same color, guided by number clues—is related to the **Four Color Theorem** and shares DNA with several Nikoli-style logic puzzles. We identified and analyzed **7 competing implementations** across web, mobile, and PC platforms, examining their game systems, visual design, mechanics, and monetization strategies.

---

## 1. Competitor Overview

### Competitor A: Puzzle-XXX Network (Simon Tatham-style Online Puzzles)
**Representative sites:** puzzle-yin-yang.com, puzzle-lits.com, puzzle-norinori.com, puzzle-kurodoko.com, puzzle-aquarium.com, puzzle-loop.com

| Attribute | Details |
|---|---|
| **Platform** | Web (browser), iOS App, Android App |
| **Developer** | Independent (community-driven, open web platform) |
| **Puzzle Types** | 40+ puzzle types including Yin-Yang, LITS, Norinori, Kurodoko, Aquarium, Slitherlink, Hitori, etc. |
| **Number of Puzzles** | Procedurally generated — unlimited supply per size/difficulty |
| **Price** | Free (ad-supported); Patreon for ad removal |
| **URL** | puzzle-yin-yang.com, puzzle-lits.com, etc. (one subdomain per puzzle type) |

### Competitor B: Sagrada (Board Game / Digital Edition)
| Attribute | Details |
|---|---|
| **Platform** | Board game (2017), Digital on Steam (2020 by Dire Wolf Digital), iOS, Android |
| **Developer** | Floodgate Games (physical), Dire Wolf Digital (digital) |
| **Designers** | Adrian Adamescu, Daryl Andrews |
| **Players** | 1–4 players |
| **Price** | ~$10.50 USD on Steam |
| **URL** | store.steampowered.com (App ID: 1226200) |

### Competitor C: Glass Masquerade Series (Onyx Lute)
| Attribute | Details |
|---|---|
| **Platform** | Steam (PC), iOS, Android |
| **Developer** | Onyx Lute |
| **Entries** | Glass Masquerade (2016), Glass Masquerade 2: Illusions (2019), Glass Masquerade 4: Constellations (2025) |
| **Price** | ~$5.60 USD per entry; DLC packs ~$2.30 |
| **URL** | store.steampowered.com |

### Competitor D: Nonogram Color — Logic Puzzle (Easybrain)
| Attribute | Details |
|---|---|
| **Platform** | Android, iOS |
| **Developer** | Easybrain |
| **Rating** | 4.6 stars, 90K+ reviews, 10M+ downloads |
| **Price** | Free (ad-supported, in-app purchases) |
| **Last Updated** | June 2026 |
| **URL** | play.google.com (ID: com.easybrain.nonogram.color) |

### Competitor E: Conceptis Puzzles
| Attribute | Details |
|---|---|
| **Platform** | Web, iOS, Android |
| **Developer** | Conceptis Ltd. |
| **Puzzle Types** | 15+ types including Pic-a-Pix, Fill-a-Pix, Link-a-Pix, Sudoku, Nurikabe, Hitori, etc. |
| **Number of Puzzles** | Weekly releases; hundreds of puzzles per type |
| **Price** | Free weekly puzzles; subscription for full archive |
| **URL** | conceptispuzzles.com |

### Competitor F: RoGlass
| Attribute | Details |
|---|---|
| **Platform** | Steam (PC) |
| **Developer** | Independent |
| **Release** | September 2024 |
| **Price** | ~$11.00 USD |
| **URL** | store.steampowered.com |

### Competitor G: Simon Tatham's Portable Puzzle Collection
| Attribute | Details |
|---|---|
| **Platform** | Web (JS/WASM), Windows, Linux (native binaries) |
| **Developer** | Simon Tatham |
| **Puzzle Types** | 40+ small desktop puzzle games |
| **Number of Puzzles** | Procedurally generated — infinite |
| **Price** | Free, open-source |
| **URL** | chiark.greenend.org.uk/~sgtatham/puzzles/ |

---

## 2. Detailed Game Mechanics Comparison

### 2.1 Most Directly Related Puzzle Types

| Puzzle Type | Source | Core Rule | Grid Sizes | Number of Colors |
|---|---|---|---|---|
| **Stained Glass** (our game) | — | Color cells; no adjacent same color; number clues restrict colors | TBD | Multiple |
| **Yin-Yang** | Puzzle Network / Nikoli | Color all cells black or white; both colors must be orthogonally connected; no 2×2 same-color blocks | 6×6 to 25×25 | 2 (black/white) |
| **LITS** | Puzzle Network / Nikoli | Place one tetromino per region; no matching adjacent tetrominoes; all shaded cells connected; no 2×2 blocks | 6×6 to 20×20 | 2 (shaded/unshaded) |
| **Kurodoko** | Puzzle Network / Nikoli | Shade cells guided by number clues (visible count); no adjacent black cells; all white cells connected | 5×5 to 20×20 | 2 (black/white) |
| **Norinori** | Puzzle Network / Nikoli | Exactly 2 shaded cells per region; shaded cells form dominoes; dominoes can't touch orthogonally | 6×6 to 20×20 | 2 (shaded/unshaded) |
| **Aquarium** | Puzzle Network | Fill aquarium regions with water; numbers show row/column counts | 6×6 to 15×15 | 2 (water/empty) |
| **Sagrada** | Floodgate Games | Place colored dice on 4×5 grid; no adjacent same color OR number; space restrictions on board | 4×5 (20 spaces) | 5 colors + 6 pip values |
| **Four Color Theorem** | Mathematical concept | Color any planar map using at most 4 colors so no adjacent regions share a color | Variable | 4 |

### 2.2 Key Mechanic Observations

- **Binary vs. Multi-color:** Most Nikoli-style puzzles use only 2 "colors" (shaded/unshaded). The Stained Glass concept of using **3–5+ distinct colors** with adjacency constraints is a significant differentiator in the logic puzzle space.
- **Clue Types Observed:**
  - **Number clues in cells** (Kurodoko, Nurikabe) — numbers indicating visible cells or island sizes
  - **Number clues outside grid** (Nonogram, Aquarium) — row/column counts
  - **Region-based constraints** (LITS, Norinori) — rules applied per pre-defined region
  - **Color/pip restrictions on cells** (Sagrada) — individual cells pre-marked with required color or number
  - **Pre-placed starting cells** (Yin-Yang) — some cells pre-filled to seed the puzzle
- **Adjacency Definitions:** All competitors define adjacency as **orthogonal** (sharing an edge), with some also restricting diagonal adjacency (Sagrada restricts orthogonal only for color/number matching but allows diagonal adjacency).

---

## 3. Game Systems Analysis

### 3.1 Puzzle Network Sites (puzzle-XXX.com)

| System | Implementation |
|---|---|
| **Scoring** | Timer-based (displayed as MM:SS); no explicit score formula |
| **Hints** | None built-in; video tutorials available for learning techniques |
| **Achievements** | Hall of Fame; Statistics page tracking solves |
| **Tutorials** | Rules displayed on page; Video Tutorial links |
| **Progress Saving** | Account-based login; puzzle state saved per browser session |
| **Leaderboards** | Hall of Fame for fastest solvers |
| **Difficulty Levels** | Easy / Normal / Hard per grid size |
| **Daily/Weekly/Monthly** | Special puzzles at each cadence; Daily, Weekly, Monthly |
| **Monetization** | Ad-supported; Patreon for ad removal; mobile apps on iOS/Android |
| **Social** | Feedback form; Share button for specific puzzles |
| **Undo/Redo** | Full undo/redo support with Ctrl+Z / Ctrl+Y |
| **Tools** | Zoom, Rotate, Black/Cross/Blank/Color marking tools |
| **Print** | Mass Print feature for offline solving |

### 3.2 Sagrada (Digital Edition)

| System | Implementation |
|---|---|
| **Scoring** | Points from public + private objective cards; deduction for empty spaces; bonus for favor tokens |
| **Hints** | Tool cards allow rule-bending (paid with favor tokens) |
| **Achievements** | Steam Achievements (34 tracked) |
| **Tutorials** | In-game tutorial; rule book |
| **Progress Saving** | Steam Cloud saves |
| **Leaderboards** | Steam Leaderboards |
| **Difficulty Levels** | Window complexity ratings 3–6 |
| **Game Modes** | Solo, 2-player, 3-player, 4-player (AI opponents) |
| **Expansions** | 3 expansions: Passion, Life, Glory |
| **Art Style** | Stained glass art; colorful translucent dice representing glass pieces |
| **Music** | Ambient, meditative soundtrack |
| **Monetization** | Premium purchase (~$10.50); DLC available |

### 3.3 Glass Masquerade

| System | Implementation |
|---|---|
| **Scoring** | Time-based completion |
| **Hints** | Visual preview of completed artwork |
| **Achievements** | Steam Achievements |
| **Tutorials** | Implicit (drag-and-drop jigsaw mechanics) |
| **Progress Saving** | Steam Cloud |
| **Gameplay** | Stained-glass-themed jigsaw puzzle — place glass pieces to complete artwork |
| **Art Style** | Art deco stained glass illustrations; vibrant translucent colors |
| **Music** | Relaxing ambient/jazz-influenced soundtrack |
| **Entries** | 3 main games + 2 DLC packs |
| **Puzzles per game** | ~25–30 unique stained glass artworks per entry |
| **Monetization** | Premium purchase per entry; DLC packs |

### 3.4 Nonogram Color (Easybrain)

| System | Implementation |
|---|---|
| **Scoring** | Completion tracking; lives for errors |
| **Hints** | Purchasable hints (reveal cells); extra lives |
| **Achievements** | Daily Challenge trophies; seasonal event postcards |
| **Tutorials** | In-app interactive tutorial |
| **Progress Saving** | Cloud sync; offline support |
| **Difficulty Levels** | Progressive — puzzles increase in size and complexity |
| **Daily Content** | Daily Challenges with unique awards |
| **Seasonal Events** | Themed puzzles with animated postcards as rewards |
| **Grid Sizes** | 5×5 up to 20×20+ |
| **Colors** | Multi-color nonograms (2–10+ colors per puzzle) |
| **Monetization** | Free-to-play with ads; in-app purchases for hints/lives/ad removal |
| **Visual Style** | Clean, modern, colorful pixel art aesthetic |
| **Rating** | 4.6★ (90K reviews), 10M+ downloads |

### 3.5 Conceptis Puzzles

| System | Implementation |
|---|---|
| **Scoring** | Time tracked; no global leaderboard |
| **Hints** | Step-by-step solving assistance |
| **Achievements** | None |
| **Tutorials** | Interactive rules and techniques pages |
| **Progress Saving** | Account-based; progress synced across web and mobile |
| **Difficulty Levels** | Varies by puzzle type; typically Easy/Medium/Hard/Weekly bonus |
| **Content Cadence** | New puzzles released weekly (every Friday) |
| **Monetization** | Free puzzles weekly; subscription ($2.99–$4.99/month) for archive access |
| **Platforms** | Web, iOS apps (per puzzle type), Android apps |
| **Visual Style** | Clean, professional, black-and-white grid style |

---

## 4. Visual & Art Style Comparison

| Competitor | Art Style | Color Palette | Theme |
|---|---|---|---|
| **Puzzle Network** | Minimal, functional grid | Black/white + accent colors for regions | Pure logic, no thematic dressing |
| **Sagrada** | Stained glass cathedral windows | 5 vibrant translucent dice colors | Cathedral/stained glass art |
| **Glass Masquerade** | Art deco stained glass illustrations | Rich jewel tones, translucent effects | Decorative glass art gallery |
| **Nonogram Color** | Clean, modern, bright pixel art | Multi-color; vivid and cheerful | Casual mobile gaming aesthetic |
| **Conceptis** | Professional, minimalist grids | Black/white, functional | Classic newspaper puzzle style |
| **RoGlass** | Stained glass window crafting | Rich glass colors | Artisan glass-making theme |
| **Simon Tatham** | Ultra-minimal, functional | Monochrome default; configurable | Pure puzzle, no decoration |

### Design Pattern Observation
The most commercially successful logic puzzle apps use a **clean, modern, slightly playful aesthetic** with smooth animations. Stained glass-themed games (Sagrada, Glass Masquerade, RoGlass) all leverage **rich, saturated jewel tones** and **translucent glass effects** with ambient soundtracks, positioning themselves as relaxing, meditative experiences.

---

## 5. Music & Sound Style

| Competitor | Music | Sound Effects |
|---|---|---|
| **Puzzle Network** | None | Minimal click sounds |
| **Sagrada** | Ambient, meditative, gentle | Dice placement sounds; glass click effects |
| **Glass Masquerade** | Relaxing ambient/jazz; atmospheric | Glass clinking; satisfying placement sounds |
| **Nonogram Color** | Optional gentle BGM | Cell fill sounds; completion chime |
| **Conceptis** | None | Minimal |
| **Simon Tatham** | None | None (pure silent puzzle) |

### Recommendation for Stained Glass
Given the theme, **ambient, meditative music** with **glass-themed sound effects** (tapping, clicking, resonance) would align well with competitor norms. This is consistent across all stained glass-themed titles.

---

## 6. Difficulty Progression & Scoring Formulas

### 6.1 Grid Size Progression (Puzzle Network Standard)

```
Level 1:  5×5 or 6×6    (Tutorial / Beginner)
Level 2:  7×7 or 8×8    (Easy)
Level 3:  10×10          (Normal)
Level 4:  15×15          (Hard)
Level 5:  20×20          (Expert)
Level 6:  25×25–25×30    (Master)
```

### 6.2 Difficulty Tiers Per Size

Most competitors offer **Easy / Normal / Hard** variants at each grid size, typically by:
- Adding/removing pre-filled clue cells
- Increasing the constraint density
- Reducing the number of given starting values

### 6.3 Scoring Patterns Observed

| Competitor | Scoring Approach | Formula Pattern |
|---|---|---|
| **Puzzle Network** | Time-based | Display solve time; rank in Hall of Fame |
| **Sagrada** | Objective-based | Sum of: public objectives + private objectives − empty spaces + favor tokens |
| **Glass Masquerade** | Time-based | Faster completion = better |
| **Nonogram Color** | Completion + streaks | Track daily streaks; error penalties via life system |
| **Conceptis** | Time-based | Track time; no explicit score formula |

### Common Scoring Formula Elements
1. **Base points** for puzzle completion
2. **Time bonus** (faster = more points)
3. **Error penalty** (wrong moves reduce score or cost lives)
4. **Streak multiplier** (consecutive daily solves)
5. **Hint penalty** (using hints reduces final score)
6. **Size multiplier** (larger grids worth more)

---

## 7. Monetization Models

| Model | Used By | Revenue Potential |
|---|---|---|
| **Free + Ads + IAP** | Nonogram Color, Puzzle Network | High (10M+ downloads model) |
| **Premium Purchase** | Sagrada, Glass Masquerade | Medium ($5–15 per sale) |
| **Freemium + Subscription** | Conceptis | Recurring revenue |
| **Free/Open Source** | Simon Tatham | None (community project) |
| **Ad-supported + Patreon** | Puzzle Network | Low-medium |

### IAP Price Points (from Easybrain/Nonogram):
- **Hints:** ~$0.99–$2.99 for hint packs
- **Ad removal:** ~$2.99–$4.99
- **Extra lives:** ~$0.99 for bundles
- **Season pass:** ~$4.99–$9.99

---

## 8. Feature Matrix

| Feature | Puzzle Network | Sagrada | Glass Masquerade | Nonogram Color | Conceptis | Simon Tatham |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| Grid coloring | ✓ | ✓ | — | ✓ | ✓ | ✓ |
| Adjacency constraint | ✓ | ✓ | — | — | ✓ | ✓ |
| Number clues | ✓ | ✓ | — | ✓ | ✓ | ✓ |
| Multiple colors | — | ✓ | — | ✓ | — | — |
| Undo/Redo | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Hints | — | ✓ (tools) | ✓ | ✓ | ✓ | — |
| Timer | ✓ | ✓ | ✓ | ✓ | ✓ | — |
| Daily puzzles | ✓ | — | — | ✓ | ✓ | — |
| Leaderboards | ✓ | ✓ | — | — | — | — |
| Achievements | — | ✓ (34) | ✓ | ✓ | — | — |
| Progress saving | ✓ | ✓ | ✓ | ✓ | ✓ | — |
| Offline play | ✓ | ✓ | ✓ | ✓ | — | ✓ |
| Mobile app | ✓ | ✓ | — | ✓ | ✓ | — |
| Web version | ✓ | — | — | — | ✓ | ✓ |
| Multiplayer | — | ✓ (1–4) | — | — | — | — |
| Tutorials | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Print support | ✓ | — | — | — | ✓ | ✓ |

---

## 9. Key Differentiation Opportunities

Based on this competitive analysis, the following opportunities exist for the Stained Glass puzzle game:

### 9.1 Unique Mechanics (Under-served)
- **Multi-color adjacency constraint** (3–5 colors) is very rare in competitors. Most Nikoli-style puzzles use only 2 states (shaded/unshaded). Sagrada uses 5 colors but is a dice-drafting game, not a pure logic puzzle.
- **Number clues restricting specific colors** — this combines the clue-given constraint of Kurodoko/Nurikabe with multi-color mechanics. No direct competitor was found doing this exact combination.
- **Pure logic approach** (no randomness) vs. Sagrada's dice-drafting — there is room for a purely deductive stained glass coloring puzzle.

### 9.2 Feature Gaps to Fill
| Gap | Details |
|---|---|
| **Stained glass theme + pure logic** | Glass Masquerade is jigsaw; Sagrada is dice-drafting; nobody does stained-glass-themed pure logic coloring |
| **Progressive color count** | Start with 2–3 colors, increase to 5+ as difficulty rises |
| **Rich visual feedback** | Stained glass visual effect when puzzle is complete (like a real stained glass window lighting up) |
| **Mobile-first design** | Most Nikoli-style puzzle sites are desktop-first; mobile apps are often ports |

### 9.3 Recommended Feature Set
Based on competitor patterns:

| Priority | Feature | Rationale |
|---|---|---|
| **P0** | Procedural puzzle generation | Unlimited content (Puzzle Network model) |
| **P0** | Undo/Redo | Universal across all competitors |
| **P0** | Timer + personal best tracking | Standard engagement driver |
| **P0** | Progressive difficulty (grid size + color count) | Puzzle Network standard |
| **P1** | Daily puzzles with streaks | Nonogram Color's most engaging feature |
| **P1** | Hint system (with penalty) | Expected by mobile puzzle audiences |
| **P1** | Error highlighting | Nonogram Color uses "lives"; Puzzle Network uses immediate validation |
| **P1** | Stained glass visual completion effect | Unique differentiator |
| **P2** | Achievements / badges | Sagada (34 achievements), Nonogram (trophies) |
| **P2** | Leaderboards | Puzzle Network Hall of Fame model |
| **P2** | Offline support | Nonogram Color, Sagrada, Simon Tatham all support this |
| **P3** | Level editor / sharing | Conceptis has "Specific puzzle" feature |
| **P3** | Print support | Puzzle Network and Conceptis both offer this |

---

## 10. Recommended Difficulty Progression

Based on competitor patterns:

| Level | Grid Size | Colors | Clue Density | Notes |
|---|---|---|---|---|
| 1 | 4×4 | 2 | High (60%+ given) | Tutorial |
| 2 | 5×5 | 2–3 | Medium-High | Beginner |
| 3 | 6×6 | 3 | Medium | Easy |
| 4 | 8×8 | 3–4 | Medium | Normal |
| 5 | 10×10 | 4 | Medium-Low | Hard |
| 6 | 12×12 | 4–5 | Low | Expert |
| 7 | 15×15 | 5 | Low | Master |
| 8 | 20×20 | 5+ | Very Low | Grandmaster |

---

## 11. Recommended Scoring Formula

Based on observed patterns across competitors:

```
Base Score = Grid Cells × 10
Time Bonus = max(0, (Par Time − Actual Time)) × 5
Error Penalty = Errors × 50
Hint Penalty = Hints Used × 100
Size Multiplier = Grid Size / 5 (e.g., 10×10 = 2.0x)

Final Score = (Base Score + Time Bonus − Error Penalty − Hint Penalty) × Size Multiplier
```

### Star Rating
- ⭐⭐⭐ (3 stars): No errors, no hints, under par time
- ⭐⭐ (2 stars): ≤2 errors, no hints, or slightly over par time
- ⭐ (1 star): Puzzle completed (any condition)

---

## 12. Market Positioning

| Dimension | Our Position | Nearest Competitor |
|---|---|---|
| **Theme** | Stained glass window art | Glass Masquerade (jigsaw), Sagrada (dice) |
| **Mechanic** | Pure logic coloring + number clues | Puzzle Network's Yin-Yang/LITS (binary only) |
| **Platform** | Web (primary), mobile | Puzzle Network (web), Nonogram Color (mobile) |
| **Content** | Procedurally generated | Puzzle Network, Simon Tatham |
| **Monetization** | TBD (freemium recommended) | Nonogram Color model |
| **Audience** | Casual puzzle fans, logic enthusiasts | Overlap with Nonogram, Sudoku, Nikoli audiences |

### Competitive Advantage Summary
The Stained Glass puzzle game fills a **specific gap** in the market: a **stained-glass-themed, multi-color grid coloring logic puzzle** with number clues. No existing product combines all three of:
1. Stained glass visual theme
2. Multi-color adjacency constraints (3–5+ colors)
3. Pure logic/deduction gameplay with number clues

---

## Appendix A: Sources

- Wikipedia: Four Color Theorem — https://en.wikipedia.org/wiki/Four_color_theorem
- Wikipedia: Sagrada (board game) — https://en.wikipedia.org/wiki/Sagrada_(board_game)
- Wikipedia: LITS — https://en.wikipedia.org/wiki/LITS
- Wikipedia: Nikoli (publisher) — https://en.wikipedia.org/wiki/Nikoli_(publisher)
- Puzzle Yin-Yang — https://www.puzzle-yin-yang.com/
- Puzzle LITS — https://www.puzzle-lits.com/
- Puzzle Norinori — https://www.puzzle-norinori.com/
- Puzzle Kurodoko — https://www.puzzle-kurodoko.com/
- Puzzle Aquarium — https://www.puzzle-aquarium.com/
- Puzzle Slitherlink — https://www.puzzle-loop.com/
- Simon Tatham's Puzzles — https://www.chiark.greenend.org.uk/~sgtatham/puzzles/
- Conceptis Puzzles — https://www.conceptispuzzles.com/
- Nikoli Puzzles — https://www.nikoli.co.jp/en/puzzles/
- Steam Store Search (stained glass puzzle) — https://store.steampowered.com/search/?term=stained+glass+puzzle
- Google Play: Nonogram Color — https://play.google.com/store/apps/details?id=com.easybrain.nonogram.color

## Appendix B: Related Nikoli Puzzle Types with Grid Coloring

| Puzzle | Mechanic | Colors | Clue Type |
|---|---|---|---|
| LITS | Place tetromino in regions; no matching adjacent | 2 | Region borders |
| Yin-Yang | Color all cells; connectivity + no 2×2 | 2 | Pre-filled cells |
| Kurodoko | Shade cells by visibility numbers | 2 | Number in cells |
| Norinori | 2 shaded cells per region; domino rules | 2 | Region borders |
| Nurikabe | Shade cells to form islands | 2 | Number in cells |
| Hitori | Shade cells so no duplicate numbers in rows/columns | 2 | Number in cells |
| Heyawake | Shade cells in rooms; row/column constraints | 2 | Number in rooms |
