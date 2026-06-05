Build a complete, commercial-quality HTML5 game: Glass Rush 3D

## Game Concept
3D first-person endless runner where a glowing energy ball blasts through crystalline tunnels, smashing glass and crystal obstacles. The ball auto-travels forward through a procedural tunnel; the player TAPS or SWIPES to tilt the ball left/right/up/down to line up with smashes, dodge spikes, and collect glowing orbs. Pseudo-3D rendered via Canvas 2D z-projection (no WebGL, no Three.js — single file, 60fps).

## Game Design (欧美用户口味)
- Aesthetic: crystalline neon — deep navy/indigo background, cyan/blue/purple/magenta accent, glass shard particles
- Single-file HTML at /home/msdn/gamezipper.com/glass-rush-3d/index.html (self-contained, no external JS deps; CDN fonts OK)
- Canvas full-window, 60fps target
- Mobile-first: touch-action:none on canvas, large tap targets (min 44px)
- Responsive: desktop (1280x720) and mobile (390x844)
- All English UI, NO Chinese text
- Title: "Glass Rush 3D — Tap to Smash Through Crystal Tunnels"

## Core Gameplay Loop
1. Ball flies forward through tunnel at constant speed (tier scales speed)
2. Tunnel is composed of z-projected rectangular segments forming a curving corridor
3. Obstacles spawn ahead: glass walls (smash for points + combo), moving slabs, rotating prisms, spike traps (instant death), low ceilings (must crouch/tap-bottom)
4. Glowing orbs float in path — collect for coins
5. Tap left/right side → ball tilts toward that side; tap top → jump; tap bottom → crouch
6. Streak counter builds multiplier; missing an orb or hitting a spike resets streak
7. Each level: 30 seconds survival + 5 required smash count → completion
8. Boss-tier levels: every 5 levels, special arena with rotating crystal patterns

## Levels & Difficulty
- 30 levels total, 6 per tier (Starter / Classic / Challenge / Expert / Master)
- Each level has a unique seed → mulberry32 seeded level generation
- Level data: {tier, seed, durationSec, requiredSmashes, speedMult, obstacleDensity, orbCount, powerUpAvailable}
- Difficulty progression: speed 1.0 → 1.8, density 0.5 → 1.0, required smashes 5 → 20
- All 30 levels must be COMPLETABLE — validate level data integrity
- Unlocked sequentially: clear level N to unlock N+1 (with a "skip for 50 coins" option)

## Systems Required
1. **Score System**: basePoints (smash=10, combo bonus, orb=5) × tierMultiplier (1-5) × streakMultiplier (1.5x/2x/3x/5x at 5/10/20/40)
2. **Coin System**: collect orbs; spend on power-ups and skin unlocks
3. **Combo System**: visual counter, audio escalation, particle intensification
4. **Power-ups** (3, randomly dropped):
   - Slow-Mo (4s, ball time scaled to 0.5x, easier to navigate)
   - Multi-Ball (6s, 2 additional ball clones travel alongside, hit anything → bonus)
   - Magnet (6s, orbs curve toward ball)
5. **6 Skins** unlockable by coins: Cyan (default free), Magma (200), Forest (300), Violet (400), Sunset (500), Cosmic (750)
6. **12 Achievements**:
   - First Smash, Smash 100, Smash 500, Smash 1000
   - 5x Combo, 10x Combo, 20x Combo
   - No-Hit Level (1, 5, 10)
   - All Powerups Used, All Skins Owned
   - All Levels Complete
7. **Tutorial** (4 steps, skippable):
   - Step 1: Tap to tilt
   - Step 2: Smash glass walls
   - Step 3: Build combo
   - Step 4: Use power-ups
8. **Progress Save** (localStorage):
   - `glassRush3D.save.v3` = {level, bestScore, coins, achievements:{...}, unlockedSkins:[...], settings:{...}, stats:{totalSmashes,totalOrbs,...}}
9. **Settings**: sound on/off, music on/off, vibration on/off, reset progress button
10. **Daily Challenge**: seeded by date, score posted to local leaderboard (top 10 best)

## Obstacle Types (6)
1. **Glass Wall** (smashable, single tap = shatter) — most common
2. **Moving Slab** (slides left-right/up-down in lane)
3. **Rotating Prism** (4-arm crystal rotating, must time passage through gap)
4. **Spike Trap** (instant death, must avoid)
5. **Light Barrier** (timed on/off, must pass during off-phase)
6. **Low Ceiling** (must crouch; ball jumps over if no ceiling)

## Visual Style
- Background: deep navy gradient (#0a0e2a → #1a1040) with subtle moving star-field
- Tunnel: 8 z-projected quads forming curving corridor; walls have crystal facet pattern
- Ball: glowing cyan circle with rotating energy ring; size grows slightly with combo
- Particles:
  - Glass shatter: 8-12 triangle shards with rotation + alpha fade
  - Spark trail: 4-6 small white dots behind ball when combo > 5
  - Orb collection: expanding ring + radial dots
  - Power-up: floating icon with rotation + glow
- HUD: top bar (score, best, level, coins), bottom bar (lives/power-up indicator)
- Menus: gradient background, glass-morphism cards, neon borders

## Audio (Web Audio API procedural — no external files)
- **BGM**: 16s seamless loop, ambient pads (sine+sawtooth) with arpeggio + sub-bass
  - Menu scene: minor key, slow, mysterious
  - Game scene: same base + faster rhythmic element
  - Game-over scene: dimmed pads, slow heartbeat
- **SFX** (9 procedural):
  - smash (white-noise burst + pitch-down)
  - combo_chime (rising arpeggio)
  - spike_hit (low thump + noise)
  - level_complete (3-note major chord)
  - game_over (descending 3 notes)
  - button_click (short high blip)
  - hover (very short low blip)
  - orb_collect (sparkle arpeggio)
  - powerup_use (rising sweep)

## Technical Requirements
- Single file: glass-rush-3d/index.html (self-contained, no external deps except CDN fonts)
- Canvas 2D rendering (no WebGL)
- Frame-rate independent logic (delta time)
- mulberry32 seeded RNG for level generation
- Single cleanup entry point: `cleanup()` called on page hide / navigation
- All timers tracked (setTimeout/setInterval IDs) and cleared on cleanup
- All event listeners (touch/mouse/keyboard) tracked and removed on cleanup
- requestAnimationFrame loop with cancellation on cleanup
- Audio context: lazy init on first user gesture; suspend on hidden
- Duplicate-click prevention on buttons
- Save state with version field ("v3")
- All 30 levels must be COMPLETABLE — validate at load time

## Quality Standards
- No memory leaks: cleanup listeners, rAF, audio nodes on exit
- Touch support: touch-action:none on canvas, pointer events preferred
- Resize handler: debounced canvas resize on window resize
- Pause on visibility change (background tab)

## Analytics & SEO
- <script src='https://site-analytics.cap.1ktower.com/hit?s=gamezipper.com&p=glass-rush-3d'></script>
- JSON-LD structured data blocks (4):
  1. VideoGame schema
  2. FAQPage schema (3-5 Q&A)
  3. HowTo schema (3-step how to play)
  4. BreadcrumbList schema
- og:title, og:description, og:image, og:url
- twitter:card, twitter:title, twitter:description
- Canonical URL: https://gamezipper.com/glass-rush-3d/
- overflow-x:hidden and user-select:none on body
- viewport meta with maximum-scale=1
- Title: "Play Glass Rush 3D Online Free — Smash Through Crystal Tunnels | GameZipper"
- Meta description: ~155 chars
- H1 in main content, semantic HTML

## Visual Style Restrictions
- Dark gradient background, neon accent colors (cyan, magenta, purple)
- text-shadow for titles (NEVER -webkit-text-stroke)
- Rounded corners (border-radius), subtle box-shadows, glass-morphism panels
- Smooth CSS transitions (cubic-bezier)
- Emoji-free title (use SVG or text)

## Placeholder image refs
- Reference `icon.png` and `og.png` paths (will be created in Phase 4)
- For now, use canvas-rendered placeholder OR empty src — do NOT inline base64 large images
- The game MUST be fully functional WITHOUT external images; images are enhancement

## File target
/home/msdn/gamezipper.com/glass-rush-3d/index.html — target 50-100KB, S-grade quality

## Required Functions (verify exist)
- init()
- render() / update()
- cleanup()
- loadLevel(n)
- startGame() / endGame() / pauseGame()
- spawnObstacle() / spawnOrb() / spawnPowerup()
- updateCombo(streak)
- showTutorial(step)
- saveProgress() / loadProgress()
- playSFX(name) / playBGM(scene)
- showMenu() / showLevelSelect() / showSettings() / showAchievements()
- showLevelComplete(score) / showGameOver(score, best)

## CRITICAL
- Complete file in one pass
- ALL English UI, NO Chinese
- ALL 30 levels hand-tuned seeds
- Procedural Web Audio BGM and 9 SFX (no external audio files)
- Do NOT include Chinese characters anywhere
- Do NOT use -webkit-text-stroke
- Do NOT use external image files (all canvas-rendered or referenced paths)
- Ensure file is FULLY functional standalone

Write the complete file to /home/msdn/gamezipper.com/glass-rush-3d/index.html
