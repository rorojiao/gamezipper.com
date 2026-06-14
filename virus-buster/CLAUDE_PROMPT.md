Build a complete, commercial-quality HTML5 game: Virus Buster — a Dr. Mario style falling-capsule color-matching puzzle game. Two-cell capsules (pill halves) fall into an 8×16 grid; rotate and position them so 4+ same-color objects (capsule halves OR viruses) line up horizontally/vertically to clear. Clear ALL viruses to win the level.

## Competitor Benchmark (from BENCHMARK.md — full parity required)
Implement EVERY system below:
- 8 wide × 16 tall playfield grid (classic Dr. Mario proportions)
- Capsules = 2-cell pieces, each half one of 3 colors (RED #ff3b5c / YELLOW #ffd23f / BLUE #4d9bff). Random color pair per piece.
- Viruses (germs) = pre-placed single cells scattered bottom-weighted in lower 2/3 of grid; 3 colors. Clear ALL to win.
- Movement: move left/right 1 cell; soft-drop (hold down); hard-drop (space) = instant lock.
- Rotation: 4 states (horizontal R-L → vertical T-B → horizontal L-R → vertical B-T). Up arrow / X to rotate.
- Lock: piece locks when it can't fall further.
- Match rule: ≥4 same-color contiguous cells in a row OR column → all vanish simultaneously.
- Cascade/chain: after a clear, orphaned capsule halves fall (gravity per column), then re-scan. Chain = bonus score multiplier (×2, ×3, …).
- Next-piece preview panel.
- Virus count scales per level (L1: 4 viruses → L22: 80 viruses). Fall interval decreases with level.
- 3 speeds (LOW/MED/HIGH) selectable on menu, affects fall tick.
- Scoring: base per cleared cell (100) + chain multiplier + remaining-virus bonus on level clear.
- Progress save: localStorage key "virusBuster_v1" — {highScore, unlockedLevel, speedSetting, soundOn}. Version field included.
- Tutorial overlay on first run (one-time, skippable): explains move/rotate/drop/match with arrows.
- Pause (Esc/Space on menu-pause): modal overlay with resume/quit.
- Hint system: press H to flash a suggested placement for current piece.
- 22 hand-tuned levels with increasing virus counts + decreasing fall speed.

## Sound (Web Audio API procedural — NO external files)
- SFX: rotate (short blip), move (tick), lock (thunk), clear (rising arpeggio pitched UP per chain depth), virus-clear sparkle, game-over (descending), level-clear fanfare, button hover/click.
- Procedural BGM: ambient puzzle loop using OscillatorNode + GainNode, slow tempo synth pads, toggleable mute.
- Master gain + mute toggle.

## Technical Requirements
- Single file: /home/msdn/gamezipper.com/virus-buster/index.html (self-contained, no external deps except Google Fonts CDN)
- Canvas-based rendering, smooth 60fps, requestAnimationFrame, delta-time logic
- Responsive: desktop (1280×720) and mobile (390×844). Canvas scales to fit.
- Touch support: touch-action:none on canvas, pointer events for drag-left/drag-right to move, tap to rotate, swipe-down to drop. Min 44px tap targets.
- Mobile-first: large on-screen buttons (◀ ROTATE ▶ + DROP) visible on touch devices.

## Game Design (欧美用户口味)
- Clean modern UI, dark gradient background (#0a0e27 → #1a1f3a), neon accent colors
- Satisfying feedback: particle burst on clear, screen shake on big chains, combo popups, glow on matched cells
- Progressive difficulty across 22 levels
- Score + best score (localStorage)
- ALL English UI, NO Chinese text anywhere
- Emoji-free title text (but in-game germs drawn as cute round characters with eyes)

## Quality Standards (S-grade)
- Single cleanup() entry point for all exit paths; cancels rAF, audio nodes, listeners
- All timers/Intervals tracked and cancelled on cleanup
- No memory leaks
- Duplicate-click prevention on buttons
- Save state with version field
- ALL 22 levels must be winnable — validate virus placement is always clearable (not isolated under permanent blocks)
- Grid is fully clearable by design: viruses only ever occupy cells; capsules can always reach them via gravity

## Analytics & SEO
- Include exactly: <script src='https://site-analytics.cap.1ktower.com/hit?s=gamezipper.com&p=virus-buster'></script> in <head>
- JSON-LD structured data: VideoGame + FAQPage (3 Q&As) + BreadcrumbList + HowTo (how to play, 5 steps)
- og:title, og:description, og:image, twitter:card
- Canonical URL: https://gamezipper.com/virus-buster/
- overflow-x:hidden and user-select:none on body
- Title tag: Play Virus Buster Online Free - Dr Mario Style Pill Puzzle | GameZipper
- Meta description: Play Virus Buster online free. Drop rotating capsules to match colors and eliminate viruses in this Dr Mario style puzzle. 22 levels, chain combos, no download!

## Visual Style
- Dark gradient background, neon accent colors
- Smooth CSS transitions/animations
- text-shadow for titles (NEVER -webkit-text-stroke)
- Rounded corners, subtle shadows, glass-morphism panels
- Germs drawn as cute round blobs with white eyes; capsules as glossy two-tone pills
- Emoji-free title

Write the COMPLETE game to /home/msdn/gamezipper.com/virus-buster/index.html. Target 35-60KB. Make it fully playable end-to-end with all 22 levels, all systems, sound, and polish.
