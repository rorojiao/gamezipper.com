# Logic Gates Puzzle — Competitive Benchmark

## Target Competitors

### 1. Circuit Scramble (circuitscramble.com)
- **Levels**: 135+ levels, endless mode, level creator
- **Systems**: Score, star rating (1-3), hints, level creator, progress save
- **Gates**: AND, OR, NOT, XOR, NAND, NOR, XNOR
- **Mechanic**: Given inputs and desired output, place correct gates in circuit
- **Art Style**: Clean circuit board aesthetic, neon blue/green
- **Music**: Minimal electronic

### 2. CircuitGates / CircuitGates2 (plays.org)
- **Levels**: 20+20 stages, progressive difficulty
- **Systems**: Toggle inputs, switch component (CircuitGates2), sequential puzzles
- **Gates**: AND, OR, NOT, XOR
- **Mechanic**: Toggle input switches to activate/deactivate circuits
- **Art Style**: Circuit board, glowing wires, colorful gates
- **Music**: Electronic ambient

### 3. Logic Gates (SilverGames/Y8)
- **Levels**: Multiple stages
- **Systems**: Signal flow puzzle, guide signals to turn on green light
- **Mechanic**: Route signals through gate networks
- **Art Style**: Simple circuit board, neon colors

### 4. Circuit Snap (circuitsnapgame.com)
- **Systems**: Combine wires + gates + sub-circuits, progressive unlock
- **Mechanic**: Build circuits from basic gates to complex functionality
- **Art Style**: Modern flat design

### 5. Logic Gates (Google Play - Neurotock)
- **Levels**: 50 levels, increasing difficulty
- **Systems**: Truth tables, theoretical info, progress tracking
- **Gates**: All standard gates with educational info

## Required Systems for S-Grade Game

| System | Description | Priority |
|--------|-------------|----------|
| **Core Mechanics** | Place gates on grid, connect inputs→gates→output to match target truth table | MUST |
| **Gate Types** | AND, OR, NOT, XOR (core 4) + NAND, NOR, XNOR (advanced) | MUST |
| **Level System** | 30+ levels with progressive difficulty, 6 chapters | MUST |
| **Tutorial** | Interactive tutorial explaining each gate type with truth tables | MUST |
| **Hint System** | 3 hints per level, show correct gate placement | MUST |
| **Score System** | Stars (1-3) based on gates used (fewer = more stars), level completion bonus | MUST |
| **Progress Save** | localStorage with version field, save best stars per level | MUST |
| **Signal Animation** | Visual signal flow through wires (animated pulses) | MUST |
| **Gate Visuals** | Color-coded gates with symbols, glowing when active | MUST |
| **Sound Effects** | Gate place, signal flow, level complete, error, button click | MUST |
| **BGM** | Ambient electronic, Web Audio procedural | MUST |
| **Achievements** | First completion, perfect stars, speed run, all chapters | SHOULD |
| **Level Select** | Chapter map with lock/unlock, star display | MUST |
| **Responsive** | Desktop + mobile touch support | MUST |

## Difficulty Progression (30 levels, 6 chapters)

| Chapter | Levels | Gates | Grid Size | Concept |
|---------|--------|-------|-----------|---------|
| 1: Basics | 1-5 | AND, OR | 3x3 | Single gate, 2 inputs |
| 2: Negation | 6-10 | +NOT | 3x4 | Introduce NOT, invert signals |
| 3: XOR Logic | 11-15 | +XOR | 4x4 | Exclusive OR, comparisons |
| 4: Combined | 16-20 | All core 4 | 4x5 | Multi-gate circuits |
| 5: Advanced | 21-25 | +NAND, NOR | 5x5 | Compound gates |
| 6: Master | 26-30 | +XNOR | 5x6 | Complex circuits, 3+ inputs |

## Art Direction
- Dark circuit board background (deep navy/black with PCB trace pattern)
- Neon accent colors: Cyan (AND), Green (OR), Red (NOT), Purple (XOR)
- Glowing signal animation (bright pulse traveling through wires)
- Clean modern UI with glass-morphism panels
- Gate icons: Standard IEEE symbols rendered on canvas

## Music Direction
- Ambient electronic, mysterious
- Soft synthesizer pads, gentle arpeggios
- Subtle circuit-like rhythmic elements
- Volume control + mute toggle
