# Screw Jam — Competitive Benchmark

## Target Game: Screw Jam (Nuts & Bolts Puzzle)

### Competitor Analysis

#### 1. Nuts & Bolts Jam (CyberNex Studios / Playgama)
- **Core Mechanic**: Unscrew bolts from wooden boards, match by color, drop plates
- **Levels**: 100+ levels
- **Systems**: Color matching, plate physics (gravity), hint system, undo
- **Art**: Colorful wood textures, 3D-ish bolts, warm palette
- **Music**: Calming ambient

#### 2. Screw Jam Puzzle (Poki)
- **Core Mechanic**: Unscrew bolts in correct order, plates fall when all bolts removed
- **Levels**: Hundreds of levels
- **Systems**: Star rating, move counter, undo, hints, daily challenges
- **Art**: Clean 2D, colorful bolts, wooden boards
- **Music**: Satisfying click sounds

#### 3. Nuts & Bolts: Screw Jam (App Store — 6499494830)
- **Downloads**: Top charts, hundreds of thousands
- **Core Mechanic**: Remove screws in correct order to escape the board
- **Levels**: Hundreds with regular updates
- **Systems**: Progressive difficulty, hints, undo, achievements
- **Art**: Wood + metal theme, realistic bolts

#### 4. Screw Out: Bolts and Nuts (CrazyGames)
- **Core Mechanic**: Unscrew bolts from various shapes, sort by color into containers
- **Levels**: Unlimited levels
- **Systems**: Customization, global leaderboard, regular updates
- **Art**: Metal/industrial aesthetic

### Systems to Implement (Must-Have)

| System | Priority | Description |
|--------|----------|-------------|
| **Color-coded bolts** | CRITICAL | 4-5 bolt colors, match to colored holes |
| **Plate physics** | CRITICAL | Plates fall when all bolts removed, gravity simulation |
| **Level progression** | CRITICAL | 40+ levels, progressive difficulty |
| **Move counter** | HIGH | Count unscrew actions, star rating based on moves |
| **Hint system** | HIGH | Highlight next optimal bolt to remove |
| **Undo** | HIGH | Undo last unscrew action |
| **Progress save** | HIGH | localStorage with level completion |
| **Tutorial** | HIGH | First 3 levels as guided tutorial |
| **Star rating** | MEDIUM | 1-3 stars per level based on moves |
| **Sound effects** | CRITICAL | Unscrew, plate drop, success, fail sounds |
| **BGM** | MEDIUM | Calming/ambient procedural music |
| **Animations** | CRITICAL | Unscrew animation, plate fall, completion celebration |

### Level Design Curve

| Phase | Levels | Plates | Bolt Colors | Mechanics |
|-------|--------|--------|-------------|-----------|
| Tutorial | 1-5 | 1-2 | 2 | Basic unscrew, one plate |
| Easy | 6-15 | 2-3 | 3 | Multiple plates, ordering matters |
| Medium | 16-25 | 3-4 | 4 | Interlocking plates, wrong order = stuck |
| Hard | 26-35 | 4-5 | 4-5 | Complex interlocking, limited hints |
| Expert | 36-40 | 5-6 | 5 | Multi-layer puzzles, tight ordering |

### Core Game Loop
1. Player sees wooden board with colored bolts
2. Tap a bolt to unscrew it (satisfying animation)
3. Bolt moves to color-matched hole at bottom
4. When all bolts removed from a plate, plate falls with gravity
5. Goal: Remove ALL plates from the board
6. Challenge: Wrong bolt order can block plates from falling
7. Star rating: fewer moves = more stars

### Art Direction
- Dark wood board background with grain texture
- Metallic/colored bolts (red, blue, green, yellow, purple)
- Neon accent glow on interactive elements
- Particle effects on unscrew and plate drop
- Smooth CSS animations throughout
