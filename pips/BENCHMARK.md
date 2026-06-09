# BENCHMARK.md — Pips (Domino-Region Logic Puzzle)

## Target Game: Pips
- **Slug**: pips
- **Core**: Place dominoes on a grid with colored regions, each having a math condition. All dominoes must be used, all conditions satisfied.
- **Competitors**: NYT Pips (gold standard), dotio (premium S-grade), PlayPips.app (free clone)

## Key Systems to Implement

### Core Gameplay
- Grid with colored regions + condition symbols (=, ≠, >N, <N, sum, blank)
- 2×1 domino tiles with pip dots (0-6)
- Drag-drop placement + rotation (90°)
- Cross-region dominoes (one domino can span two regions)
- Real-time validation (red highlight on violated regions)
- Win detection (all placed + all conditions met)
- Undo/Redo (unlimited)
- Remove placed domino (click to return to tray)

### Content & Progression
- 30+ handcrafted puzzles across 4 difficulties (Easy/Medium/Hard/Expert)
- Daily puzzle (date-seeded)
- Grid sizes: 3×4 → 8×8+

### Scoring & Motivation
- Completion timer
- Star rating (1-3 stars based on time/hints used)
- Streak tracking
- Statistics dashboard (games played, avg time, best streak)
- Achievement system (20+ achievements)

### Tutorial & Onboarding
- Interactive tutorial for first-time players
- Condition reference modal (accessible anytime)
- Progressive teaching in early levels

### Hints & Assistance
- 3-stage progressive hints (highlight region → highlight cell → reveal domino)
- Region completion indicator (checkmark when satisfied)
- Pip counter (sum helper per region)

### Accessibility
- Color blind mode
- Sound toggle
- Dark gradient background (GameZipper style)

### Audio
- Domino place snap sound
- Domino rotate click
- Domino remove sound
- Error tone
- Win celebration chime
- BGM (ambient, procedural via Web Audio API)

## Visual Style
- Dark gradient background (GameZipper standard)
- Colored regions with distinct colors
- Classic 2×1 domino tiles with pip dots
- Condition symbols in region corners
- Clean sans-serif typography
- Glass-morphism panels for menus/modals
- Neon accent highlights
- Smooth animations (place, rotate, celebrate)

## SEO
- Title: "Play Pips Online Free - Domino Logic Puzzle | GameZipper"
- JSON-LD: VideoGame + FAQPage + HowTo
- Analytics pixel included

## Technical
- Single file: pips/index.html
- Canvas-based rendering, 60fps
- Responsive: desktop + mobile
- Touch support
- localStorage progress save with version field
- Web Audio API for all sound
