# Jigsaw Puzzle — Competitive Benchmark

## Competitors Analyzed

### 1. Microsoft Jigsaw (Windows/Web)
- **Modes**: Classic, Jigsaw Jam, Daily Challenges
- **Pieces**: Up to 600 pieces, 6 difficulty settings
- **Images**: Hundreds of HD images across categories (animals, architecture, landscape, nature, patterns)
- **Features**: Daily challenges, achievements, create custom puzzles
- **Scoring**: Time-based + star rating
- **Download**: 100M+ across platforms

### 2. Poki Jigsaw Puzzle
- **Puzzles**: 100,000+ different puzzles, thousands of collections
- **Features**: Shuffle, preview image, toggle borders, sound toggle
- **UI**: Beautiful graphics, easy gameplay, categorized images
- **Monetization**: Ads between puzzles

### 3. Jigsaw Explorer
- **Features**: Pauseable timer, auto-rearrange loose pieces, full screen
- **Mechanics**: Drag and drop, piece snapping, edge detection
- **UX**: Clean interface, piece tray on sides

### 4. Arkadium Jigsaw
- **Timer**: 8-minute timed mode
- **Scoring**: Points based on speed and accuracy
- **Hints**: Preview available

### 5. Favorite Puzzles (CrazyGames)
- **Images**: Wide selection of beautiful images
- **UX**: Ultimate puzzle-solving experience
- **Categories**: Nature, animals, art, cities

### 6. TheJigsawPuzzles.com
- **Features**: Puzzle of the Day, full screen, multiple cuts
- **Pieces**: 6 to 1008 pieces
- **Community**: Large user base, daily engagement

---

## Systems to Implement (S-Grade)

### Core Gameplay
- [x] Drag-and-drop puzzle pieces from tray to board
- [x] Piece snapping (snap when close to correct position)
- [x] Edge piece highlighting
- [x] Piece rotation (for Hard+ difficulties)
- [x] Zoom and pan for larger puzzles
- [x] Shuffle pieces in tray

### Difficulty System (5 tiers, 20+ puzzles)
| Difficulty | Grid | Pieces | Rotation | Time Target |
|---|---|---|---|---|
| Easy | 4×3 | 12 | No | 2 min |
| Medium | 5×4 | 20 | No | 4 min |
| Hard | 6×5 | 30 | Optional | 6 min |
| Expert | 8×6 | 48 | Yes | 10 min |
| Master | 10×7 | 70 | Yes | 15 min |

### Scoring System
- Base score: 1000 × difficulty_multiplier
- Time bonus: max(0, (time_target - elapsed) × 10)
- Hint penalty: -50 per hint used
- Star rating: 3★ (< 50% time), 2★ (< 100% time), 1★ (completed)
- Best score saved per puzzle

### Progression System
- 20+ unique puzzles across 5 difficulty tiers (4+ per tier)
- Puzzles unlock sequentially within each tier
- Completion percentage tracked
- Total stars collected as meta-progression

### Hint System
- Preview: Show reference image (free, toggleable)
- Edge Highlight: Highlight all edge pieces (-50 score)
- Auto-Place: Automatically place one correct piece (-100 score)

### Save System (localStorage)
- Current puzzle state (placed pieces, timer)
- Completed puzzles + best scores + star ratings
- Settings (sound, difficulty preference)
- Version field for migration

### Tutorial
- First-time interactive tutorial on Easy puzzle
- Highlight draggable area, demonstrate snap, explain hints
- Skip button available

### Sound System (Web Audio API)
- Piece pickup sound
- Piece snap/correct placement sound
- Piece wrong placement sound
- Hint usage sound
- Level complete celebration fanfare
- Button hover/click sounds
- BGM: Relaxing ambient/lo-fi

### Visual Polish
- Procedurally generated puzzle images (landscapes, patterns, art)
- Smooth piece dragging with shadow
- Snap animation (scale bounce)
- Completion confetti/particle celebration
- Piece tray with scroll on mobile
- Dark theme with neon accents (GameZipper style)
- Loading animation while image generates

### Categories (20 puzzles)
1. **Nature** (4): Sunset, Mountain, Ocean, Forest
2. **Abstract** (4): Geometric, Gradient, Fractal, Mosaic
3. **City** (4): Skyline, Bridge, Street, Park
4. **Art** (4): Still Life, Landscape Painting, Pattern, Color Field
5. **Seasonal** (4): Spring, Summer, Autumn, Winter

---

## SEO Keywords
- "jigsaw puzzle", "free jigsaw puzzle online", "jigsaw puzzle game"
- "puzzle pieces", "online jigsaw", "daily jigsaw puzzle"
- "free puzzle games", "brain training puzzle"
