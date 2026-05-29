# BoxRob Competitive Benchmark Report

## 1. BoxRob Game Series (7Spot Games)

> Note: The task mentioned KeyGames, but the BoxRob series is created by **7Spot Games** (Lithuanian developer). KeyGames may be a publisher. The developer behind both code and level design is forum user d954mas.

### Game Overview

**BoxRob** is a physics-based forklift puzzle-platformer. The player controls a robot driving a flexible forklift in a warehouse environment. The core loop is: drive to boxes, pick them up with the forklift arm, transport them, and drop them into designated cargo slots on a truck.

**Platforms**: Desktop + Mobile (Poki, CrazyGames, direct HTML5)
**Engine**: Defold with Box2D physics (confirmed by Defold blog "The making of BoxRob")
**Build Size**: ~1.91 MB total (HTML5). Textures 1.20 MB, audio 1.33 MB, scripts 216 KB, level data 63 KB, fonts 46 KB.

---

### BoxRob 1
- **URL**: https://poki.com/en/g/boxrob
- **Developer**: 7Spot Games (code/levels: d954mas)
- **Rating**: 4.2 / 5 (307,424 votes)
- **Like/Dislike**: 248.5K / 59.0K
- **Levels**: 20 base + 1 bonus = 21 total
- **Development**: Commit 03.05.2021, prototype done 17.07.2021, soft launch 22.09.2021

### BoxRob 2
- **URL**: https://poki.com/en/g/boxrob-2
- **Developer**: 7Spot Games
- **Rating**: 4.2 / 5 (162,458 votes)
- **Like/Dislike**: 131.0K / 31.5K
- **Levels**: 20 base + 1 bonus = 21 total
- **New mechanic**: Conveyor belts
- **Released**: 19.10.2021 (alongside BoxRob 3)

### BoxRob 3
- **URL**: https://poki.com/en/g/boxrob-3
- **Developer**: 7Spot Games
- **Rating**: 4.2 / 5 (134,568 votes)
- **Like/Dislike**: 108.3K / 26.3K
- **Levels**: 20 base + 1 bonus = 21 total
- **Released**: 19.10.2021

### Total Level Count
**BoxRob series total: 63 levels** (3 parts × 20 base levels + 3 bonus levels = 63)

---

### Core Mechanics

**Controls** (identical across all 3 games):
- Move Left/Right: `A` / `D` keys
- Jump: `W` key
- Pick up boxes: Tap or left mouse button click (click near the forklift arm)

**Physics & Movement**:
- Box2D physics engine (Defold built-in)
- The forklift has realistic physics: momentum, tilting, weight distribution
- Boxes have rounded corners — they can bounce and roll to corners
- Boxes can shake loose if forklift moves too fast over bumps
- Must position forklift stable/level before attempting box pick-up
- Special maneuvers exist beyond basic moves (discovered through experimentation in later levels)
- Cargo can fall off if not careful — retry is required

**Level Structure**:
- Collect all boxes scattered across the level
- Drop each box into designated cargo slots on the truck
- Boxes can be stacked on top of each other inside the truck
- When entering a truck, the forklift arm extends forward to push boxes in
- Progressive difficulty: easy driving → platforming challenges → complex puzzles with special moves
- Special moves or specific sequences required in advanced levels
- Invisible walls exist as level design elements
- Survey-level strategy recommended before starting

**Visual Setting**: Warehouse/industrial environment with a truck to load

**Bonus Levels**:
- Unlock by collecting 60 stars across base levels
- Bonus level: collect all stars within a certain time
- Truck exists in bonus level but is off-screen (game logic requires it)

**Level Editor**:
- Tiled (open-source tile map editor) used to create levels
- Exported to .lua → converted to .json for the game
- Levels stored as JSON (~63 KB total for all 63 levels)

---

## 2. Competitor Games

### 2.1 Jelly Sokoban (Beedo Games)
- **URL**: https://poki.com/en/g/jelly-sokoban
- **Rating**: 4.0 / 5 (31,795 votes)
- **Like/Dislike**: 23.6K / 8.2K
- **Puzzles**: ~600 levels
- **Controls**: Arrow keys — move jelly squares
- **Genre**: Classic Sokoban — push blocks onto marked spots
- **Visual**: Colorful 3D jelly/cube aesthetic
- **Tags**: Puzzle, Brain, 3D, Funny, Unity
- **Scoring**: Level count only, no star system

### 2.2 Truck Loader Series (7Spot Games)
The same developer as BoxRob. 5 games in the series:
- Truck Loader (4.2 rating, 78,773 votes)
- Truck Loader 2
- Truck Loader 3
- Truck Loader 4
- Truck Loader 5
- **URL**: https://poki.com/en/g/truck-loader
- **Mechanic**: Magnetic crane instead of forklift arm; load cargo boxes onto truck
- **Controls**: A/D move, W jump, click to activate magnet
- **Physics-based puzzles** with magnetic attraction/repulsion
- **Scoring**: Pass/fail + high score sharing

### 2.3 Mini Train (7Spot Games)
- **URL**: https://poki.com/en/g/mini-train
- **Genre**: Physics-based puzzle
- **Mechanic**: Fill gaps with shapes for train to pass; drag-and-drop
- **Visual**: Colorful 2D graphics
- **Tags**: Physics, Puzzle, Brain

### 2.4 Odd Bot Out (7Spot Games)
- **URL**: https://poki.com/en/g/odd-bot-out
- **Mechanic**: Guide a robot through platformer puzzles
- **Style**: Similar warehouse/robot aesthetic

### 2.5 Shape Fold Series (7Spot Games)
- **URL**: https://poki.com/en/g/shape-fold
- **Mechanic**: Fold shapes to solve puzzles
- **Tags**: Physics, Puzzle, Brain

### 2.6 Other Sokoban-Style Games on Poki
- Multiple "Sokoban" clones exist on Poki with varying quality
- Jelly Sokoban (Beedo) is the highest quality Sokoban-style on Poki with ~600 puzzles

---

## 3. Box-Pushing Puzzle Game Mechanics Analysis

### Physics Model

There are two distinct physics models in this genre:

**A. Forklift/Arm Model (BoxRob, Truck Loader)**
- Continuous movement on 2D platformer plane
- Vehicle can jump (BoxRob)
- Pick-up is click/tap proximity-based (not grid-based)
- Boxes have physics weight — can slide, fall, bounce, shake loose
- Requires stable positioning before pick-up
- NOT snap-to-grid — free positioning
- Box2D physics drives all object movement

**B. Classic Sokoban Model (Jelly Sokoban)**
- Grid-based movement
- Push one block at a time
- Cannot pull blocks, only push
- Target destinations are grid-marked spots
- UNDO is typically available (critical feature)
- Grid-snapped movement

### Platformer Elements in BoxRob
- Multi-direction movement (A/D)
- Jump ability (W)
- Platforming over gaps and obstacles
- Crane/arm mechanical interaction
- Conveyor belts (BoxRob 2)
- Invisible walls as level design element
- No gravity flip or other exotic mechanics

### Box Pick-up Mechanic
- Click near forklift to grab box (proximity-based, not grid)
- Box attaches to forklift arm
- Can carry one box at a time
- Forklift arm extends forward when entering truck to push boxes in
- Must position correctly before releasing

---

## 4. Feature Analysis of Top Competitors

### Star Ratings / Level Progression
- **BoxRob series**: No star rating — primarily pass/fail level completion. Bonus levels unlocked by collecting 60 stars across base levels.
- **Jelly Sokoban**: Pass/fail, ~600 levels with sequential unlock
- **Truck Loader series**: Same pass/fail model as BoxRob

### Hint Systems
- No hints in BoxRob or competitors reviewed
- Jelly Sokoban: No hints

### Undo Systems
- Classic Sokoban games typically have unlimited undo
- BoxRob/Truck Loader: **No undo** — must restart level if you drop a box wrong

### Controls (Keyboard + Touch)
- **BoxRob**: A/D + W (keyboard), Tap/click (mouse/touch) — fully dual-control
- **Jelly Sokoban**: Arrow keys only (desktop-focused, no touch controls)
- **Truck Loader**: A/D + W + click — same dual control as BoxRob

### Scoring
- **BoxRob**: High score sharing — distance traveled = score (time/speed bonus)
- **Jelly Sokoban**: Level count only (no star system)
- **Truck Loader**: Pass/fail + high score sharing

### Level Select
- BoxRob: Sequential progression with bonus level unlock
- Jelly Sokoban: Level grid with locked/unlocked states

---

## 5. Art Style Reference

### BoxRob Series
- **Style**: 2D cartoon/illustrated warehouse setting
- **Character**: Robot driving a yellow/orange forklift
- **Colors**: Industrial palette — grays, yellows, oranges, with colored boxes
- **Boxes**: Distinct colored cargo boxes (can be stacked, rounded corners for bounce)
- **Truck**: Cargo truck with designated slots (off-screen in bonus levels)
- **Environment**: Factory/warehouse platforming levels
- **UI**: Clean minimal UI with level indicator

### Jelly Sokoban
- **Style**: Colorful 3D jelly/cube aesthetic
- **Colors**: Bright saturated jelly-block colors
- **Background**: Clean minimal 3D environments
- **Note**: Unity game, not pure HTML5

### Truck Loader
- **Style**: Similar industrial 2D to BoxRob
- **Crane**: Magnetic crane arm (blue/industrial)

### Mini Train
- **Style**: Colorful 2D with cartoon train
- **Colors**: Bright primary and secondary colors

### Summary: Recommended Art Direction for GameZipper Clone
- 2D cartoon style (like BoxRob) — achievable in single HTML5 Canvas file
- Industrial/warehouse theme with a forklift or crane
- Colorful cargo boxes for visual variety
- Clean UI with level indicator, restart button, pause
- Avoid 3D — too heavy for single-file HTML5 Canvas
- Target a cohesive color palette: industrial grays + warm yellows/oranges + colorful boxes

---

## 6. Scoring Systems and Difficulty Progression

### BoxRob Difficulty Curve
1. **Early Levels**: Simple driving — just collect boxes and drive to truck slots
2. **Mid Levels**: Platforming challenges — gaps, obstacles, elevated platforms
3. **Advanced Levels**: Special maneuvers required — forklift tricks discovered through experimentation
4. **Expert Levels**: Precise sequences, multiple boxes, tight delivery windows, invisible walls, stacked box puzzles

### Jelly Sokoban
- ~600 levels, progressive difficulty
- Grid-based Sokoban difficulty scaling (open rooms → tight corridors → complex multi-box solutions)

### Scoring Models Found
- **BoxRob**: Distance traveled = score, speed bonus, shareable high scores
- **Jelly Sokoban**: Level count only (no star system)
- **Truck Loader**: Same as BoxRob — pass/fail + high score sharing

### Time Pressure
- Some levels have "tight delivery windows" where retry-time affects optimal completion
- Bonus levels have explicit time limits
- No explicit countdown in basic levels

---

## 7. GameZipper Clone — Feature Recommendations

Based on competitive analysis, the GameZipper BoxRob clone should target:

### Must-Have Features
1. **40+ levels** with progressive difficulty (matching task requirement; BoxRob has 63)
2. **Keyboard controls**: A/D + W + Click
3. **Touch controls**: On-screen D-pad + action button (mobile)
4. **Forklift with arm**: Physics-based pick-up and drop
5. **Cargo boxes**: Colored, physics-enabled (bounce, stack)
6. **Truck with cargo slots**: Target destinations
7. **Level restart**: Instant restart button
8. **Pass/fail**: Level complete when all boxes delivered

### Recommended Features
1. **Star rating**: 1-3 stars based on time or moves (BoxRob has no stars — this differentiates)
2. **Move counter**: Track efficiency
3. **Level select**: Visual grid of unlocked/locked levels
4. **Undo button**: For mistakes (BoxRob doesn't have it — adding this is a UX win)
5. **Sound effects**: Box pick-up, drop, engine, level complete, crash
6. **Simple BGM**: Upbeat warehouse/machine music
7. **Conveyor belts**: BoxRob 2 introduced these — add as a mechanic
8. **Invisible walls**: Level design element used in BoxRob

### Nice-to-Have Features
1. **Hint system**: Show a suggested path for stuck players
2. **Particle effects**: Box landing, dust from forklift wheels
3. **Animated forklift arm**: Visual feedback on pick-up/drop
4. **Level completion celebration**: Simple animation
5. **Box stacking**: Allow boxes to stack on each other in truck
6. **Bonus levels**: Unlock with star collection, time-pressure mode

### Visual Style Target
- 2D Canvas, cartoon industrial theme
- Yellow forklift robot, colored cargo boxes
- Gray/brown warehouse platforms
- Clean minimal UI (level number, restart, pause, stars)
- No 3D — keep it light for single-file HTML5

### Level Count Target
- **40 levels minimum** (as per task)
- BoxRob reference: 63 levels across 3 parts
- Progressive difficulty across 4 difficulty tiers:
  - Early: 10 levels (simple collection)
  - Mid: 10 levels (platforming)
  - Advanced: 10 levels (special maneuvers, conveyor belts)
  - Expert: 10+ levels (precise sequences, stacked boxes)

### Technical Implementation Notes
- Single HTML5 file with Canvas rendering
- Box2D-style 2D physics (custom lightweight implementation, ~216 KB of BoxRob's scripts)
- Keyboard + touch event handling
- Level data as JSON array embedded in file (~63 KB for 63 levels of BoxRob)
- localStorage for progress/stars/moves save
- Web Audio API for sound effects
- requestAnimationFrame game loop
- Tiled level editor for content creation (export to JSON)

---

## 8. Key Takeaways

1. **BoxRob is NOT by KeyGames** — it's by 7Spot Games (Lithuanian dev). KeyGames may be a publisher.
2. **BoxRob has 63 levels total** (3 parts × 20 + 3 bonus). The task asks for 40+ — well within range.
3. **BoxRob core mechanic** is a forklift/arm pick-up in a platformer world — unique among Poki physics puzzle games.
4. **Box2D physics** drives all movement — boxes can bounce, stack, and shake loose.
5. **No undo in BoxRob** — this is a friction point. Adding undo would improve UX significantly.
6. **No star ratings in BoxRob** — adding 1-3 star ratings would differentiate the GameZipper clone.
7. **Bonus levels** (unlocked via star collection, time-pressure mode) add replay value.
8. **Truck Loader series** (same dev) uses a magnetic crane — similar feel, different mechanic.
9. **Jelly Sokoban** (600 puzzles) sets the bar for puzzle depth; BoxRob-style has less puzzles but more varied gameplay.
10. **Mobile + Desktop** is required — BoxRob has both, so the clone must support touch + keyboard.
11. **1.91 MB total build** for BoxRob — lightweight enough for single-file HTML5.
12. **BoxRob 2 introduced conveyor belts** — consider adding as a level mechanic variety.

---

*Research date: May 2026*
*Sources: Poki.com (BoxRob 1/2/3, Jelly Sokoban, Truck Loader), CPSGames.org, Defold blog (The making of BoxRob)*
