# Brain Out Tricky Puzzle — Competitor Benchmark

## Competitor 1: Brain Out (by Focus Apps)
- **Downloads**: 100M+ on Google Play
- **Levels**: 200+ levels across multiple chapters
- **Core Mechanic**: "Think outside the box" lateral thinking puzzles that break common sense
- **Puzzle Types**: Math tricks, hidden objects, device interaction (shake/tilt), drag & drop, text manipulation, visual illusions
- **Art Style**: Simple hand-drawn doodle style, black outlines on white, playful and humorous
- **Systems**:
  - Hints system (watch ad for hint)
  - Star rating per level (1-3 stars based on time/attempts)
  - Level select with progress tracking
  - No scoring per se — binary pass/fail per puzzle
  - Chapters with themes
- **Music**: Simple playful background music, quirky sound effects on interactions

## Competitor 2: Brain Test: Tricky Puzzles (by Unico Studio)
- **Downloads**: 100M+ on Google Play
- **Levels**: 275+ levels
- **Core Mechanic**: Similar lateral thinking, but with more narrative/story elements
- **Puzzle Types**: Drag elements to unexpected places, tap hidden objects, combine items, shake device, reverse thinking
- **Art Style**: Quirky cartoon characters, colorful, expressive animations
- **Systems**:
  - Hint system
  - Character reactions (funny animations on wrong answers)
  - Story chapters connecting puzzles
  - Daily challenge mode
- **Key Difference**: More character-driven, story elements between puzzles

## Competitor 3: Brain Out: Can You Pass It? (Web variants)
- **Platform**: Browser-based HTML5 versions
- **Levels**: Typically 30-50 levels for web versions
- **Mechanics**: Simplified for browser (no device shake/tilt), focus on click/drag/typed answers
- **Art**: Simple vector graphics, clean UI

## Key Systems to Implement

### 1. Puzzle Types (must include variety):
- **Math tricks**: "What's 1+2+3...?" with hidden tricks
- **Hidden objects**: Find something hidden in the scene
- **Drag & drop**: Move elements to unexpected locations
- **Text manipulation**: Click on specific text/words
- **Visual illusions**: Things aren't what they seem
- **Reverse thinking**: The obvious answer is wrong
- **Multi-step**: Combine multiple interactions
- **Timed challenges**: Some puzzles need speed
- **Sequence puzzles**: Tap in correct order
- **Size manipulation**: Drag to resize, or elements change size
- **Color puzzles**: Match or find specific colors
- **Physics tricks**: Use gravity, balance

### 2. Core Systems:
- Level select screen with progress (locked/unlocked/completed)
- Stars per level (1-3 based on hints used)
- Hint system (3 free hints, earn more)
- Progress save (localStorage)
- Tutorial/intro for first puzzle
- Celebration animation on level complete
- "Wrong answer" feedback animation

### 3. UI/UX:
- Clean, playful visual style
- Each puzzle has a question/prompt at top
- Interactive area in center
- Hint button (top right)
- Level navigation (arrows)
- Star display

### 4. Difficulty Curve:
- Levels 1-5: Very easy, teach mechanics (tap, drag, think differently)
- Levels 6-15: Easy-medium, introduce new puzzle types
- Levels 16-25: Medium, require more creative thinking
- Levels 26-30+: Hard, multi-step solutions

### 5. Audio:
- Playful BGM
- Click/tap sound effects
- Correct answer celebration sound
- Wrong answer "buzz" sound
- Hint reveal sound

## Art Direction
- Style: Hand-drawn doodle / cartoon sketch style
- Colors: Bright, playful palette on clean background
- Elements: Simple shapes with expressive details
- UI: Rounded, friendly, colorful buttons
