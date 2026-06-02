# Magic Tiles — Benchmark & Competitive Analysis

## Game Concept
4-lane piano rhythm game. Black tiles fall down 4 lanes synchronized to a beat. Tap each black tile as it reaches the bottom of the screen (within the hit window). Missing a tile ends the song. Multiple procedurally generated songs with progressive difficulty. Web Audio API synthesizes piano tones in real-time.

## Competitors Analyzed

### 1. Magic Tiles 3 (Magic Piano Tiles, by SayGames)
- **Downloads**: 1B+ on Play Store, 1B+ on App Store
- **Core Mechanic**: 4 lanes (or 6 in "Piano" mode), tap black tiles as they reach the hit zone
- **Scoring**: Combo system, perfect/good/miss judgment, score per tap
- **Progression**: Endless mode (songs) + level mode (campaign)
- **Key Features**: Massive song library, ranking leaderboard, multiple game modes (Classic, Rush, Zen), tile animations, satisfying tap effects

### 2. Piano Tiles 2 (by Cheetah Mobile)
- **Downloads**: 500M+
- **Core Mechanic**: Tap only BLACK tiles, avoid white tiles (4 lanes)
- **Scoring**: Combo multiplier, 1-3 star rating per song
- **Progression**: 1000+ songs across countries
- **Key Features**: World tour theme, multiple difficulty levels

### 3. Tiles & Tales / Beatstar
- **Downloads**: 100M+ combined
- **Core Mechanic**: Tap/swipe tiles to the rhythm of popular songs
- **Scoring**: Hit accuracy, perfect/good timing windows
- **Progression**: Song collection unlockable
- **Key Features**: Multiple music genres, real licensed songs (Beatstar)

### 4. Duet / Tap Tap Builder
- **Downloads**: 50M+
- **Core Mechanic**: Single tap rhythm
- **Scoring**: Precision + combo
- **Progression**: Level-based
- **Key Features**: Single-finger gameplay, minimal UI

## Target Features for GameZipper Version

### Core Systems
- [x] 4-lane falling tiles mechanic (black tiles on dark background)
- [x] 30+ procedurally generated songs across 5 difficulty tiers
- [x] Hit window timing system: Perfect / Good / Miss judgments
- [x] Combo multiplier (increases per consecutive Perfect)
- [x] Score system (base 100/tile, perfect +50, good +20, miss 0)
- [x] 3-star rating per song based on accuracy %
- [x] Progression save (localStorage with version, per-song best score)
- [x] Tutorial system (first song guided: "Tap black tiles!")
- [x] Endless mode (infinite song)
- [x] Pause/resume support
- [x] Restart song button

### Audio
- [x] Web Audio API synthesized piano tones (multiple note frequencies)
- [x] Multiple note octaves (C3-C5 range)
- [x] BGM generated procedurally (melodic patterns per song)
- [x] Tap sound effects (note triggers)
- [x] Combo sound (rising pitch as combo grows)
- [x] Miss sound (low buzz)
- [x] Volume toggle, music toggle in settings

### Visual
- [x] Dark gradient background (deep blue → black)
- [x] Neon accent colors (cyan/magenta/gold for tiles)
- [x] Falling tile animation (smooth physics, 60fps)
- [x] Hit zone glow at bottom of each lane
- [x] Tap flash effect (lane lights up)
- [x] Score popup animation ("+100", "PERFECT!", "COMBO x10")
- [x] Particle burst on Perfect hit
- [x] Screen shake on Miss
- [x] Song progress bar (3 dots showing verse/chorus/bridge)
- [x] Smooth UI transitions, glass-morphism overlays

### Technical
- [x] Canvas-based rendering, 60fps
- [x] Responsive: desktop (1280x720) and mobile (390x844)
- [x] Touch support: touch-action:none on canvas, pointer events
- [x] Mobile-first: large tap targets (lane height min 100px)
- [x] Delta time independent tile movement
- [x] Frame-rate independent logic

## Songs (Procedurally Generated)
Each song is a sequence of tile patterns timed to a BPM. Examples:
- **Easy (80-100 BPM)**: 4 tiles per beat, single lane
- **Medium (100-120 BPM)**: 8 tiles per bar, alternating lanes
- **Hard (120-140 BPM)**: 16 tiles per bar, syncopated patterns
- **Expert (140-180 BPM)**: dense patterns, both hands
- **Master (180+ BPM)**: extreme speed, all lanes

Songs organized as "Chapters" with progressive difficulty. Chapter names:
- Chapter 1: "First Notes" (Easy)
- Chapter 2: "Gentle Melody" (Easy-Medium)
- Chapter 3: "Piano Lesson" (Medium)
- Chapter 4: "Concert Hall" (Hard)
- Chapter 5: "Virtuoso" (Expert)

## Monetization / Retention
- Star collection drives chapter unlock
- High score per song (localStorage)
- Best combo per song
- Total stars progress indicator
- Daily streak / "play today" indicator (optional)

## Technical Stack
- Single HTML file, no external deps except Google Fonts
- Canvas 2D rendering
- Web Audio API for all sounds (no external audio files)
- localStorage for save state (versioned)
