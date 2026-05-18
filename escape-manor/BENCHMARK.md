# Escape Manor - Competitive Benchmark

## Game Overview
- **Slug**: `escape-manor`
- **Type**: Point-and-click escape room puzzle game
- **Target**: 30 levels (rooms), inventory system, hint system, star ratings
- **Platform**: Browser (HTML5, single-file, Canvas-based)

## Competitive Analysis

### 1. Fear Response (Poki #1)
- **Plays**: 301K+ likes, #1 escape/horror on Poki
- **Mechanic**: Point-and-click exploration, horror atmosphere, puzzle solving
- **Levels**: Multiple chapters within single game
- **Monetization**: Ad-supported (Poki platform)
- **Art**: 3D graphics, dark horror aesthetic
- **Key Takeaway**: Horror atmosphere drives engagement; exploration-based (no explicit hints)

### 2. The Room (Fireproof Games)
- **Sales**: 11.5M+ across franchise, BAFTA winner
- **Mechanic**: Manipulate 3D puzzle boxes with hidden compartments
- **Levels**: 4-8 multi-stage puzzles per game
- **Monetization**: Premium ($5/title), NO ads
- **Art**: Victorian-era, dark mysterious, high-quality 3D
- **Key Takeaway**: Intricate mechanical puzzles + narrative through notes/letters

### 3. Forgotten Hill Series
- **Platform**: Browser (Poki) + Mobile
- **Mechanic**: Point-and-click adventure, inventory-based puzzles
- **Levels**: 5 chapters per game, multiple rooms per chapter
- **Monetization**: Freemium with ads
- **Art**: Hand-drawn 2D, surreal/horror aesthetic
- **Key Takeaway**: Inventory system essential, item combination puzzles, dark storyline

## Escape Manor Game Design Specification

### Core Mechanic
Point-and-click escape room: Explore rooms, find hidden objects, solve puzzles, collect keys/items, unlock doors to escape.

### Room/Level Structure (30 rooms across 5 chapters)
- **Chapter 1: The Entrance Hall** (Rooms 1-6) - Easy introduction, basic find-key-unlock-door
- **Chapter 2: The Library** (Rooms 7-12) - Book codes, cipher puzzles, hidden switches
- **Chapter 3: The Kitchen** (Rooms 13-18) - Pattern matching, combination locks, ingredient puzzles
- **Chapter 4: The Laboratory** (Rooms 19-24) - Chemical mixing, circuit puzzles, sequence memory
- **Chapter 5: The Tower** (Rooms 25-30) - Complex multi-step puzzles, final escape

### Puzzle Types
1. **Find hidden objects** - Tap to reveal items behind furniture/decorations
2. **Code/combination locks** - Find clues elsewhere in room, enter correct code
3. **Item combination** - Combine inventory items (e.g., key + lockpick)
4. **Pattern matching** - Reproduce a pattern shown briefly
5. **Slider puzzles** - Rearrange tiles to form image
6. **Sequence puzzles** - Press buttons/switches in correct order
7. **Jigsaw/key placement** - Place items in correct slots
8. **Word/cipher puzzles** - Decode messages using found cipher keys

### Systems to Implement
1. **Inventory System**: Bottom bar showing collected items, tap to select/use
2. **Hint System**: 3 hints per room (costs stars), progressive reveal
3. **Star Rating**: 3 stars per room based on time + hints used
   - 3 stars: Complete under par time, no hints
   - 2 stars: Complete under extended time, 1 hint
   - 1 star: Complete with any conditions
4. **Progress Save**: localStorage with version field, saves current room + stars
5. **Timer**: Optional visible timer, par time per room
6. **Tutorial**: First room has guided tutorial overlays
7. **Chapter Select**: Unlock chapters progressively
8. **Room Map**: Visual map of rooms within chapter

### Interaction Design
- **Tap to examine**: Tap objects to zoom in / get description
- **Tap to collect**: Tap interactive items to add to inventory
- **Drag to use**: Drag inventory item to hotspots
- **Swipe to navigate**: Swipe left/right to move between connected rooms
- **Pinch to zoom**: On mobile, pinch to zoom into areas

### Art Direction
- **Style**: Dark Victorian manor, hand-painted aesthetic (procedural CSS/SVG)
- **Colors**: Deep purples, dark browns, amber candlelight accents
- **UI**: Parchment/leather textures for inventory, ornate frames
- **Atmosphere**: Flickering candlelight effects, cobwebs, dust particles

### Audio Design
- **BGM**: Mysterious ambient, cello/string pads, subtle clock ticking
- **SFX**: Door creak, key jingle, lock click, item pickup, hint reveal, room complete fanfare
- **All via Web Audio API (procedural)**

### SEO & Meta
- **Title**: Play Escape Manor Online Free - Room Escape Puzzle Game | GameZipper
- **Description**: Explore mysterious rooms, find hidden objects, solve puzzles, and escape the manor! 30 challenging rooms across 5 chapters.
- **Tags**: escape room, puzzle, point and click, hidden objects, brain teaser

### Monetization
- Monetag MultiTag: 110120 (banner), 110121 (native), 110122 (interstitial)
- Interstitial between chapters (every 6 rooms)
- Banner at bottom during gameplay
