# Backgammon Game Benchmark

**Game:** Backgammon  
**Target Platform:** gamezipper.com (browser-based HTML5 game)  
**Rendering:** HTML5 Canvas with Web Audio API  
**Storage:** localStorage for progress/statistics  
**Target Audience:** English-speaking casual gamers

---

## 1. Game Overview

Backgammon is a two-player strategy board game where players race to move all 15 checkers around the board and bear them off before their opponent. It combines luck (dice rolls) with strategy (move planning).

---

## 2. Core Mechanics

### 2.1 Board Layout

- **24 Points** arranged in 4 quadrants (also called "tables" or "rails")
- **2 Inner/Home Boards** (points 1-6 for each player)
- **2 Outer Boards** (points 7-12 for each player)
- **Bar** in the center separating the two sides
- **Bear-off Areas** on each side of the board

```
Point numbering (White's perspective):
Outer Board:  24  23  22  21  20  19
Inner Board: 13  14  15  16  17  18

Bar separates

Outer Board:  12  11  10   9   8   7
Inner Board:   6   5   4   3   2   1
```

### 2.2 Starting Position

| Point | Count | Player |
|-------|-------|--------|
| 24    | 2     | White  |
| 13    | 5     | White  |
| 8     | 3     | White  |
| 6     | 5     | Black  |
| 19    | 5     | Black  |
| 17    | 2     | Black  |

- White starts moving from point 24 toward point 1
- Black starts moving from point 13 toward point 24 (clockwise vs anti-clockwise)

### 2.3 Movement Rules

1. **Dice Roll:** Two dice rolled each turn (1-6 each)
2. **Valid Moves:** 
   - Move one checker by die value 1
   - Move one checker by die value 2
   - Move same checker by sum of both dice
   - Use each die value once (cannot reuse)
3. **Doubles:** Roll same number on both dice = 4 moves of that value
4. **Direction:** 
   - White: moves from point 24 → 1 (clockwise)
   - Black: moves from point 13 → 24 (counter-clockwise)
5. **Valid Destination:** Point must be:
   - Empty, OR
   - Have 1+ of own checkers, OR
   - Have exactly 1 opponent checker (hit)

### 2.4 Hitting and Blots

- **Blot:** A point with only 1 checker (exposed)
- **Hit:** Landing on opponent's blot sends their checker to the bar
- **Re-enter:** Checker on bar must re-enter opponent's home board (points 19-24 for White, 1-6 for Black) before other moves
- Re-enter uses dice value to select entry point

### 2.5 Bearing Off

- Can only bear off when ALL 15 checkers are in home board (points 1-6 for each player)
- Bear off by rolling die matching checker position (or higher)
- If no checker on rolled number, must move a higher-numbered checker
- If no valid bear-off moves, must move within home board

### 2.6 Winning Conditions

| Condition | Description | Points |
|-----------|-------------|--------|
| **Single** | Win (opponent bore off at least 1) | 1 |
| **Gammon** | Win with opponent having borne off 0 | 2 |
| **Backgammon** | Win with opponent having 0 borne off AND still in your home board | 3 |

---

## 3. Game Modes

### 3.1 Single Player vs AI
- **Primary mode** for gamezipper.com
- Three difficulty levels (see Section 4)
- Player can be White or Black

### 3.2 Local 2-Player
- Hot-seat mode for two players on same device
- Turn indicator clearly shows whose turn

### 3.3 Online Multiplayer (NOT implementing)
- Reference only: VIP Backgammon, Backgammon Galaxy, Backgammon Arena
- Would require: server infrastructure, matchmaking, real-time sync
- Future consideration for platform expansion

---

## 4. AI Difficulty Levels

### 4.1 Easy
- **Strategy:** Random valid moves from available options
- **Thinking:** Immediate, no lookahead
- **Error Rate:** ~40% suboptimal moves
- **Target:** Casual players, beginners learning rules
- **Pip Count:** Not optimized

### 4.2 Medium
- **Strategy:** Basic positional evaluation
- **Considerations:**
  - Avoid leaving blots
  - Prefer making points (2+ checkers)
  - Basic racing (pips) awareness
- **Thinking:** 1-2 move lookahead
- **Error Rate:** ~20% suboptimal moves
- **Target:** Intermediate players

### 4.3 Hard
- **Strategy:** Advanced positional and racing evaluation
- **Considerations:**
  - Priming (creating 6-prime walls)
  - Timing (race equity calculation)
  - Cubeless equity
  - gammon/backgammon awareness
- **Thinking:** Full rollout simulation (3-ply+)
- **Error Rate:** ~5% suboptimal moves
- **Target:** Experienced players

---

## 5. Systems to Implement

### 5.1 Doubling Cube (Optional/Configurable)
- **Values:** 1, 2, 4, 8, 16, 32, 64
- **Initial Position:** Center of board (value = 1)
- **Offer:** Either player can offer before rolling
- **Accept/Reject:** Opponent decides
- **Implementation:** Toggle in settings (default OFF for beginners)
- **Display:** Show current cube value prominently

### 5.2 Score Tracking (Match Points)
- Match length configurable (e.g., first to 5, 7, 9 points)
- Current match score displayed
- Game points breakdown (single/gammon/backgammon)
- localStorage persistence for ongoing matches

### 5.3 Undo Move
- Button to undo last move (per turn)
- Undo AI moves if player requests
- Maximum 1 undo per turn
- Not allowed after dice rolled for next turn

### 5.4 Tutorial System
- First-launch tutorial overlay
- Step-by-step walkthrough:
  1. Roll dice
  2. Select/move checker
  3. Hitting explanation
  4. Bearing off explanation
  5. Goal of game
- "Skip Tutorial" option
- Settings to replay tutorial later

### 5.5 Move Validation & Highlighting
- **Legal move indicators:** Highlight all valid destination points when checker selected
- **Color coding:**
  - Green glow: safe moves
  - Yellow glow: moves leaving blot
  - Red pulse: illegal destination
- **Auto-highlight:** After dice roll, highlight checkers that can move

### 5.6 Bar Management
- Visual indication when checker on bar
- Prompt to re-enter before other moves
- Auto-reenter animation when space available

### 5.7 Pip Count Display
- Real-time pip count for both players
- Definition: Sum of (checker position × count)
- Lower pip count = ahead in race
- Display in player info panel

### 5.8 Match Statistics
- Track per session:
  - Games won/lost
  - Single/Gammon/Backgammon wins
  - Average pip count
  - Win streak
- Persist to localStorage
- Display on "Statistics" screen

---

## 6. Visual Style

### 6.1 Board Design
- **Texture:** Dark wood grain (mahogany/walnut blend)
- **Point colors:** Dark brown and cream/tan alternating
- **Board border:** Dark wood frame with subtle bevel
- **Background:** Dark gradient (#1a1a2e to #16213e) - GameZipper dark theme

### 6.2 Checkers
- **White checkers:** Cream/off-white with subtle shading
- **Black checkers:** Dark brown (not pure black) with glossy highlight
- **Size:** Large enough to show stacked count
- **Stacking:** Show count number when > 5
- **Selected state:** Glowing outline (neon cyan for White, neon magenta for Black)

### 6.3 Dice
- **Color:** Ivory/cream with dark dots
- **Animation:** 3D tumbling roll animation (canvas)
- **Display:** Show result prominently beside board
- **Doubles indicator:** Highlight with special glow

### 6.4 Doubling Cube
- **Position:** Right side of board center
- **Appearance:** White cube with red numerals
- **Current value:** Large display
- **Available actions:** Glow when can offer

### 6.5 UI Elements
- **Font:** Clean sans-serif (Inter, Roboto)
- **Buttons:** Rounded, GameZipper accent colors
- **Panels:** Semi-transparent dark panels
- **Icons:** Minimal, modern line icons
- **Accent colors:** Cyan (#00d4ff) and magenta (#ff00aa) neon

### 6.6 Layout
```
+------------------------------------------+
|            GAMEZIPPER BACKGAMMON          |
+------------------------------------------+
|  [Menu]  [New Game ▼]  [Settings]        |
+------------------------------------------+
|                                          |
|  White: 5 pts  |  Black: 3 pts  |  Cube:2|
|                                          |
|         +------------------------+      |
|         |                        |      |
|         |      CANVAS BOARD      |      |
|         |                        |      |
|         +------------------------+      |
|                                          |
|  [Undo]  [Roll Dice]  [Resign]          |
|                                          |
|  White Pip: 167    Black Pip: 142        |
+------------------------------------------+
```

---

## 7. Audio

### 7.1 Sound Effects (Web Audio API)

| Event | Sound Description | Duration |
|-------|-------------------|----------|
| Dice roll | Bone/clatter sound | 0.3s |
| Dice stop | Soft thud | 0.1s |
| Checker move | Wood slide | 0.2s |
| Checker hit | Impact thud | 0.3s |
| Re-enter from bar | Plop sound | 0.2s |
| Bear off | Chip click | 0.15s |
| Invalid move | Soft buzz | 0.2s |
| Doubling cube offer | Alert tone | 0.4s |
| Game win | Victory chime (ascending) | 1.0s |
| Game loss | Descending tone | 0.8s |

### 7.2 Audio Implementation
- Procedurally generated via Web Audio API oscillators
- Volume control in settings
- Mute toggle accessible during play
- No background music (keeps focus on game)

---

## 8. Mobile UX

### 8.1 Touch Interactions
- **Tap checker:** Select (show legal moves)
- **Tap destination:** Move selected checker
- **Tap elsewhere:** Deselect
- **Double-tap:** Auto-play best move
- **Swipe dice:** Animate re-roll (costs nothing, just visual)

### 8.2 Touch Targets
- **Minimum size:** 44x44 pixels (Apple HIG)
- **Checkers:** Large enough for thumb tap
- **Dice area:** Separate from board, easy to "tap to roll"
- **Buttons:** Full-width on mobile, adequate spacing

### 8.3 Responsive Design
- Portrait mode: Board scrollable or zoomed view
- Landscape mode: Full board visible
- Breakpoint at 768px width
- Board scales to fit viewport maintaining aspect ratio

### 8.4 Visual Feedback
- Ripple effect on tap
- Checker lift animation when selected
- Smooth scroll for bear-off area
- Progress indicator during AI "thinking"

---

## 9. Key Numerical Values

| Parameter | Value |
|-----------|-------|
| Board points | 24 |
| Checkers per player | 15 |
| Dice | 2 (d6, values 1-6) |
| Starting checkers on point 24 (White) | 2 |
| Starting checkers on point 13 (White) | 5 |
| Starting checkers on point 8 (White) | 3 |
| Starting checkers on point 6 (Black) | 5 |
| Starting checkers on point 19 (Black) | 5 |
| Starting checkers on point 17 (Black) | 2 |
| Doubles multiplier | 4x (2 of same = 4 moves) |
| Points for single win | 1 |
| Points for gammon | 2 |
| Points for backgammon | 3 |
| Max doubling cube value | 64 |

---

## 10. Technical Specifications

### 10.1 Technology Stack
- **Single HTML file** with embedded CSS and JavaScript
- **HTML5 Canvas** for board rendering
- **Web Audio API** for sound effects
- **localStorage** for persistence
- **No external dependencies** (self-contained)

### 10.2 File Structure (Single HTML)
```
backgammon.html
├── <style> - All CSS embedded
├── <canvas> - Game board rendering
├── <div> UI overlays
└── <script> - All game logic embedded
    ├── GameState class
    ├── BoardRenderer class
    ├── AIController class
    ├── AudioManager class
    ├── StorageManager class
    └── EventHandlers
```

### 10.3 Performance Targets
- 60 FPS board animation
- < 16ms per frame
- < 100ms AI move calculation (medium)
- Instant response to user input

---

## 11. Competitor Analysis Summary

### 247 Backgammon (247games.com)
- Simple, clean interface
- Difficulty selection (Easy/Medium/Hard)
- Doubling cube available
- No account required
- Mobile-responsive

### VIP Backgammon (vipbackgammon.com)
- Premium aesthetic
- Blog with strategy tips
- Social features (friend lists)
- Tournament mode
- Larger visual flourishes

### Backgammon by MobilityWare (iOS/Android)
- 10M+ downloads
- Multiple board themes
- AI with skill levels
- Achievements system
- Tutorial included

### Backgammon Lord of the Board (iOS/Android)
- 50M+ downloads
- GameCenter/Google Play integration
- Stakes and rewards
- Chat functionality
- Season events

**Key Differentiator for gamezipper.com:**
- Clean, fast, no-frills implementation
- Strong tutorial for beginners
- Immediate play (no loading screens)
- Dark theme consistent with GameZipper brand
- Focus on single-player vs AI excellence

---

## 12. Implementation Priority

### Phase 1 (MVP)
1. Board rendering (Canvas)
2. Dice rolling
3. Basic movement
4. Turn management
5. Win detection
6. Single player vs Easy AI

### Phase 2
1. Medium/Hard AI
2. Move validation highlighting
3. Bar/re-enter logic
4. Bearing off
5. Sound effects

### Phase 3
1. Tutorial system
2. Match scoring
3. Statistics tracking
4. Undo feature
5. Settings menu

### Phase 4 (Optional)
1. Doubling cube
2. Multiple board themes
3. Achievements

---

*Document Version: 1.0*  
*Last Updated: May 2026*  
*For: Claude Code Implementation*
