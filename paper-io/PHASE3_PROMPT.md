Build a complete, commercial-quality S-grade HTML5 game: Paper.io territory-capture game.

## Game Concept
You are a colored square in a closed arena. Move around to expand your territory by leaving a colored trail outside your base, then returning home to fill in the trail. Avoid getting your trail cut by enemies (or yourself). Cut enemy trails to kill them. Capture 60%+ of the map to clear a level. 30 levels with progressive AI difficulty.

## File output
Write a single file: /home/msdn/gamezipper.com/paper-io/index.html (self-contained, no external deps except Google Fonts CDN).

## Core Mechanics
1. **Arena**: Grid-based, e.g. 50×50 logical tiles, fills viewport with letterbox.
2. **Player**: Square block, WASD/Arrow keys + touch swipe / on-screen joystick on mobile.
3. **Trail**: When player moves OUTSIDE own territory, leave a colored ribbon.
4. **Fill**: When player returns to OWN territory, the entire open trail fills in (becomes permanent territory).
5. **Death conditions**: 
   - Active trail crossed by self → dies
   - Active trail crossed by enemy → enemy kills you, you respawn at random edge with a small starter territory
6. **AI bots**: 2-6 bots per level with simple pathfinding (move toward unclaimed area, avoid trails). On death, respawn at a random edge.
7. **Skull pickups**: spawn every 8 sec, captured by passing over them, +50 score.

## Level System (30 levels)
Levels 1-10: 2 bots, slow AI, small map, NO power-ups
Levels 11-20: 4 bots, normal AI, medium map, NO power-ups
Levels 21-30: 6 bots, fast AI, large map, power-ups enabled (Speed Boost, Shield, Bomb)

Each level:
- Goal: capture >=60% of map area to win (3 stars if >=80%, 2 stars if >=70%, 1 star if >=60%)
- Timer: 180s for 1-10, 120s for 11-20, 90s for 21-30
- Map sizes: 40x40, 50x50, 60x60 tiles

## Power-ups (levels 21-30 only)
- **Speed Boost** (gold, 3 sec, +60% speed)
- **Shield** (blue, 3 sec, trail cannot be cut, no self-cross death)
- **Bomb** (red, instant on pickup, clears all enemy active trails in 6-tile radius → kills them)

## Game Systems (must all be implemented)

### 1. Scoring & Combo
- +10 per tile captured
- +50 per skull collected
- +100 per kill
- Combo multiplier: chain captures within 5 sec → 1x → 2x → 3x → 5x (resets on death or 5s without capture)
- Star bonus on level complete

### 2. LocalStorage Progress
- key: `paperio_save_v1`
- fields: {version:1, unlockedLevel:1, levelStars:{1:0..3,...}, achievements:{}, bestScore:0, currentSkin:0, settings:{sound:true,music:true,grid:true}}
- Save on every level complete and achievement unlock
- Load on game start
- Reset all button (with confirm)

### 3. Achievements (10)
- FIRST_BLOOD: capture 1 tile
- HALF_WORLD: capture 50% in one level
- COMBO_5X: reach 5x combo
- KILLER_10: kill 10 bots in total
- POWER_USER: use all 3 power-up types
- NEMESIS: kill 3 bots in one level
- NO_DAMAGE: clear a level without dying
- LEVEL_10: clear level 10
- LEVEL_20: clear level 20
- LEVEL_30: clear level 30

### 4. Skins (12 unlockable)
- Player color changes per skin, unlocked at levels 1, 3, 5, 8, 11, 14, 17, 20, 23, 26, 29, 30
- Skin selector in main menu

### 5. Tutorial
- 3-step overlay on level 1 only: "Move with WASD/Arrows", "Return to your color to capture trail", "Avoid your own trail"
- Skippable with "Skip" button or Esc

### 6. UI Screens
- Main menu (Play, Levels, Skins, Achievements, Settings, How to Play)
- Level select (grid of 30 levels with star display, locked = gray)
- In-game HUD (Level #, Time left, Score, Combo multiplier, % captured, kills)
- Pause menu (P key or button → Resume, Restart, Quit)
- Level complete (Stars earned, Score, Next Level, Replay, Menu)
- Game over (Retry, Menu)
- All-30-complete celebration screen

### 7. Audio (Web Audio API procedural - NO external files)
- BGM: dark synthwave loop, 2 patterns (menu + game), crossfade on state change
- SFX:
  - move-tick (subtle, every 4 frames while moving)
  - capture-tile (chime, pitch varies with combo)
  - capture-fill (longer chime on loop closure)
  - death (descend)
  - kill (fanfare)
  - powerup-pickup (sparkle)
  - level-complete (triumph)
  - button-click (click)
  - button-hover (soft tick)
  - shield-break (crackle)
  - bomb (explosion)

### 8. Visual Polish
- Dark gradient background (GameZipper: deep purple #1a0a2e → navy #0a1a2e)
- Player: 0.7×0.7 tile, rounded corners 4px, subtle shadow
- Trail: ribbon 0.4 tile wide, alpha 0.7
- Territory: solid color, slight border 1px
- AI bots: different shape (diamond or circle)
- Skulls: 16×16 rotating sprite, can be drawn as 💀 emoji or procedural skull shape
- Power-ups: glowing circle with inner symbol (⚡ 🛡 💣)
- Grid lines: optional, toggleable
- Particle effects: capture (8 small squares burst), death (shatter), power-up (16 sparkles), level-complete (50 confetti)
- Screen shake on death (200ms, amplitude 8)
- Smooth camera: none needed (arena fits viewport), but add subtle zoom-pulse on big captures

### 9. Mobile Support
- Touch: detect swipe direction, OR on-screen joystick at bottom-left (40px radius, 60px from edge)
- Pause / Pause button at top-right
- Layout adapts: portrait → smaller map, controls at bottom; landscape → full map
- Tap-to-start and tap-to-move fallback

## Technical Requirements
- Canvas 2D rendering, 60fps
- Delta-time based game loop
- Single cleanup function `cleanup()` that cancels all rAF, audio nodes, event listeners, timers
- No memory leaks: arrays of trails/particles cleared on restart
- All level data inline in a `LEVELS` array of 30 objects
- Touch events use `touch-action:none` on canvas

## SEO & Analytics
- `<title>Play Paper.io Online Free - Capture Territory & Conquer the Arena | GameZipper</title>`
- `<meta name="description" content="Free online Paper.io territory-capture game. Expand your area, cut enemy trails, and dominate 30 levels. Play instantly in your browser — no download.">`
- `<link rel="canonical" href="https://gamezipper.com/paper-io/">`
- og:title, og:description, og:type=website, og:image (use a 1200x630 dark gradient with "Paper.io" text — draw it inline as data: URL OR omit og:image)
- JSON-LD structured data: VideoGame + FAQPage + HowTo + BreadcrumbList
- `<script src="https://site-analytics.cap.1ktower.com/hit?s=gamezipper.com&p=paper-io"></script>`
- `body { overflow-x:hidden; user-select:none; }`
- text-shadow for titles (NEVER -webkit-text-stroke)
- Rounded corners, subtle shadows, glass-morphism panels (rgba(255,255,255,0.05) bg, backdrop-filter blur)

## Quality Standards
- Single cleanup entry point
- All timers tracked and cancelled on cleanup
- All event listeners removed on cleanup
- Duplicate-click prevention on menu buttons
- Save state with version field
- All 30 levels must be completable (validate the level data programmatically in console)
- 0 console errors

## Code structure (suggested)
```javascript
const LEVELS = [ /* 30 level objects */ ];
const SKINS = [ /* 12 colors */ ];
const ACHIEVEMENTS = { /* 10 items */ };
const POWERUPS = { /* 3 types */ };

const state = {
  screen: 'menu', // menu | levels | skins | achievements | settings | tutorial | playing | paused | complete | gameover | finalwin
  level: 1,
  player: { x, y, vx, vy, color, alive, trail: [], powerup: null, powerupTimer: 0 },
  bots: [ /* {x,y,vx,vy,color,alive,trail,startX,startY,aiType} */ ],
  territory: Uint8Array, // 0=none, 1=player, 2..7=bots
  score: 0,
  combo: 1,
  comboTimer: 0,
  kills: 0,
  skulls: [],
  powerups: [],
  particles: [],
  startTime: 0,
  captured: 0, // % area
  ...
};

function init() { /* load save, build menu, attach listeners */ }
function startLevel(n) { /* setup arena, spawn player + bots, reset state */ }
function update(dt) { /* move player by input, move bots by AI, check trail collisions, spawn pickups, update particles */ }
function render() { /* draw bg, territory, trails, entities, HUD, particles */ }
function loop() { /* rAF + delta time */ }
function cleanup() { /* tear down all listeners, audio, timers */ }
function save() { /* localStorage */ }
function load() { /* localStorage */ }
function checkAchievement(id) { /* unlock + toast */ }
```

## Critical Details
- **Trail rendering**: use `ctx.lineWidth = 0.4*tile; ctx.strokeStyle = playerColor + alphaHex;` along trail waypoints
- **Territory filling**: when player re-enters own territory, flood-fill from player position through trail tiles, marking them as owned
- **Self-crossing detection**: each frame check if player position is over an open trail tile → death
- **Enemy cross detection**: each frame check if any bot position is over player's open trail → player dies, bot score +100
- **Bot AI**: 
  - If on own territory: pick random direction toward unclaimed area
  - If on open trail: head straight back to own territory
  - If enemy trail detected nearby: avoid it
  - With 30% chance, do an aggressive expansion toward largest unclaimed region
- **Map border**: player + bots bounce off arena walls (set vx/vy to 0 on hit)
- **Starter territory**: 3×3 tile patch at random corner for player + each bot
- **Respawn**: on death, spawn at random unused corner with 3×3 starter patch

## File size target
S-grade → 50-80KB minimum, comprehensive code, no shortcuts.

## Output
Just write the file. Don't explain. The file must be a complete, working, runnable HTML game.
