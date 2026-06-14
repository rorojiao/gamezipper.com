Build a complete, commercial-quality HTML5 game called "Metro Lines" — a real-time subway/transit simulation puzzle inspired by Mini Metro.

## GAME CONCEPT
The player designs metro lines connecting geometric-shape stations across a growing city. Trains run on the lines, carrying passengers (also shapes) to their matching-shape destinations. Stations overcrowd if passengers wait too long → game over. Manage limited lines/trains/carriages. Weekly upgrades. Endless + 22 hand-crafted scenario levels.

## CORE MECHANICS (must implement ALL)

### Stations
- 8 shape types: circle, triangle, square, star, diamond, pentagon, cross, gem
- Each station is one shape, drawn bold with thick dark outline and white fill
- Stations spawn over time at semi-random positions (spread out, min distance between them)
- Each station has a passenger queue (max 6). At 6, station is "full"; a 7th passenger triggers an overcrowd countdown (~20s). When countdown hits 0 → game over.
- Show small overcrowd timer ring around overcrowded stations (turns from yellow→red)

### Passengers
- Tiny shapes that appear at stations
- Each passenger wants to reach a station matching its shape
- Passenger boards any train on a line that can reach a matching-shape station
- Boards only if train has capacity. Trains hold 6, carriages add +3 each.

### Lines
- 7 line colors: red (#e74c3c), blue (#3498db), yellow (#f1c40f), green (#2ecc71), purple (#9b59b6), orange (#e67e22), pink (#e84393)
- Player draws a line by dragging from one station to another (pointer/touch events)
- A line is an ordered list of stations forming a path. Lines auto-route with right-angle/45° bends (not straight diagonals) for that clean metro-map look — use an L-shaped or staircase path between consecutive stations.
- Lines can be extended by dragging from either endpoint to a new station
- Lines can be shortened by dragging an endpoint back / right-click to remove last segment
- A station can be on multiple lines (interchange)
- Lines cannot cross through other stations (a station is only on a line if explicitly connected)

### Trains
- Each train is assigned to one line and travels along it
- Train moves at constant speed along the line path (sum of segment lengths)
- At each station on its line, train stops briefly (~0.4s): drops off passengers whose destination is this station's shape, picks up waiting passengers whose destination is reachable via this line
- "Reachable" = there's a matching-shape station somewhere on this line (or via interchange — but keep it simple: passenger boards if a matching station exists on this line OR any line that shares a station with this line, i.e. reachable via interchange). Implement a simple reachability: a passenger at station S with shape-destination D will board a train if following any line from S eventually reaches a D-shaped station.
- Train reverses direction at line endpoints (ping-pong along the line)
- Train capacity: 6 passengers default, +3 per carriage attached

### Weekly Upgrades
- Every 30 seconds of real time = one "week"
- At week boundary, pause and show upgrade modal: choose 1 of these available options:
  - +1 new line (if lines available)
  - +1 train (place on a line)
  - +1 carriage (attach to a train)
  - +1 bridge (allows lines to cross the river)
- Player picks one, game resumes

### Rivers (Medium+ tiers)
- A river band crosses the map. Lines must use a "bridge" to cross it. Each bridge is a consumable resource (start with 2, earn more via upgrades).

### Game Over
- When any station's overcrowd timer expires
- Show game over modal: score (passengers delivered), high score, retry button

### Scoring
- +1 point per passenger delivered
- Combo: deliver 5 passengers within 4 seconds → +2 bonus each
- Star rating on scenario levels: 1★ = met objective, 2★ = met + no station ever overcrowded, 3★ = met + delivered 120% of target

## LEVELS (22 scenario levels + endless)
Define levels in a `LEVELS` array. Each level:
```
{ id:1, tier:"Tutorial", name:"First Connection", shapes:["circle","triangle","square"], startStations:[{x,y,shape}], spawnInterval:8, spawnShapes:["circle","triangle","square"], startLines:2, startTrains:2, startCarriages:0, objective:{type:"deliver", count:15}, rivers:false, timeLimit:null, mapW:1280, mapH:720 }
```
Objective types: "deliver" (deliver N passengers), "survive" (survive T seconds), "connect" (connect N stations on a single line).
- Tiers: Tutorial (L1-4), Easy (L5-9), Medium (L10-14), Hard (L15-19), Expert (L20-22)
- Progressive difficulty: more shapes, faster spawn, fewer resources, rivers in Medium+
- After tutorial, Endless mode unlocks (procedural, no objective, survive as long as possible)

## UI / SCREENS
- **Title screen**: game name "Metro Lines" (text-shadow, NO -webkit-text-stroke), subtitle "Design the city's subway", Play button, Level Select button, How to Play button, Endless button (locked until tutorial done), mute toggle. Dark gradient background with animated metro lines drifting.
- **Level select**: grid of 22 level cards grouped by tier, showing stars earned, lock icon if previous not completed.
- **Game HUD**: score (top-left), high score, timer/week indicator, mute button, pause button, lines/trains/carriages inventory (top-right), pause button.
- **Pause overlay**: Resume, Restart, Quit to menu.
- **Upgrade modal**: 2-4 option cards (icon + label), click to choose.
- **Level complete modal**: stars earned, score, Next/Retry/Menu buttons.
- **Game over modal**: score, high score, Retry/Menu.

## ALL-ENGLISH UI. NO CHINESE TEXT ANYWHERE.

## TECHNICAL REQUIREMENTS
- Single self-contained file: `metro-lines/index.html` (no external deps except Google Fonts Inter)
- Canvas 2D rendering, 60fps, delta-time based logic
- Responsive: works desktop 1280×720 and mobile 390×844 (canvas scales to fit, coordinate system fixed at design resolution)
- Touch support: touch-action:none on canvas, pointer events (pointerdown/move/up), min 44px tap targets
- Mobile-first layout
- `cleanup()` function that cancels all rAF, timers, audio nodes, removes listeners — single exit point for all exit paths (game over, quit, restart, level change)
- Track all setTimeout/setInterval IDs and rAF id; cancel in cleanup
- Duplicate-click prevention
- Save state with version field in localStorage: `metrolines_save_v1` = { levelProgress:{id:stars}, highScores:{}, endlessHigh:0, muted:bool, tutorialSeen:bool, version:1 }
- Procedural audio via Web Audio API (no external sound files):
  - BGM: ambient soft-synth pad loop (2-3 oscillators, slow LFO, lowpass filter, gentle) — start on first user gesture, toggle with mute
  - SFX: station-spawn chime, passenger-delivered blip (short sine), overcrowd-warning (rising square tone), upgrade-chime (major arpeggio), level-complete fanfare, game-over (descending tone), button-click (short click)
  - All SFX via small helper functions creating oscillator+gain envelopes

## SEO + ANALYTICS (in <head>)
- `<script src="https://site-analytics.cap.1ktower.com/hit?s=gamezipper.com&p=metro-lines"></script>`
- JSON-LD structured data: VideoGame (name, description, genre, platform Browser, applicationCategory Game, offers price 0) + FAQPage (3 Q&As about how to play) + BreadcrumbList (Home > Puzzle > Metro Lines)
- Meta: og:title "Play Metro Lines Online Free - Design Your Subway", og:description, og:type=website, twitter:card
- `<link rel="canonical" href="https://gamezipper.com/metro-lines/">`
- Title tag: "Play Metro Lines Online Free - Subway Building Puzzle | GameZipper"
- body: overflow-x:hidden, user-select:none, -webkit-tap-highlight-color:transparent, touch-action:manipulation
- Favicon as inline SVG (metro "M" in a circle)

## VISUAL STYLE
- Dark gradient background for menus: linear-gradient(135deg, #0f0c29, #302b63, #24243e) with neon accent glows
- Game playfield: clean light background (#f5f3ee) like real metro maps, OR dark (#1a1a2e) — use dark to match GZ style: #16182d with subtle grid
- Stations: white fill (#ffffff), dark outline (#16182d) 4px thick, shape drawn with crisp edges
- Lines: 7px thick, rounded line caps and joins, the 7 line colors listed above
- Trains: rounded rectangles in line color with slight darker outline, small
- Passengers: 8px shapes at station perimeter, colored by destination or just dark
- text-shadow for all titles (NEVER -webkit-text-stroke)
- Rounded corners (12-16px), subtle shadows, glass-morphism on modals (backdrop-filter blur)
- Smooth CSS transitions on buttons (0.15s ease)
- Particle burst when a passenger is delivered (small expanding circles)
- Subtle pulse on overcrowded stations

## ROBUSTNESS (CRITICAL)
- Validate every level: if startStations is empty or objective impossible, skip gracefully
- Trains must never NaN-position: clamp speed, handle zero-length lines (skip)
- If a line has <2 stations, it has no trains and no path
- Passenger reachability: recompute when lines change (don't crash if station removed)
- All arrays checked for emptiness before access
- requestAnimationFrame loop guarded against running after cleanup (use a `running` flag)
- Audio context created lazily on first user gesture (browsers require this), resume() if suspended

## FILE STRUCTURE
Everything in one file metro-lines/index.html:
- <head>: meta, SEO, JSON-LD, inline <style>
- <body>: <canvas id="game">, then single <script> with all game logic

Start the file with <!DOCTYPE html> and end with </html>. Make it COMPLETE and WORKING — not a skeleton. Target 40-70KB. Every system must actually function: drawing lines works, trains move, passengers flow, overcrowding triggers, upgrades work, all 22 levels are defined and playable, save/load works, audio plays.

Read the BENCHMARK.md in this directory for full system parity requirements. Implement ALL systems listed there.
