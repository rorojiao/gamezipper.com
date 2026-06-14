# BENCHMARK.md — Seating Puzzle Competitive Analysis

## Selected Game: Seating Puzzle (slug: seating-puzzle)
**Mechanic**: Constraint-satisfaction seating — arrange dinner guests around tables based on their preferences

## Competitor Benchmarks

### 1. Is This Seat Taken? (Jaleo)
- **Rank**: #2 Best Puzzle Mobile Games 2026 (gaming.net)
- **Core mechanic**: Seat guests at restaurant tables. Each guest has constraints (won't sit next to enemies, must face window, etc.)
- **Systems**: Level progression, hint system, daily challenge, star ratings
- **Monetization**: Ads + hint purchases
- **Art style**: Cozy illustrated 2D, warm palette
- **Music**: Light jazz/lo-fi ambience
- **Key insight**: Each level has EXACTLY ONE valid arrangement — players deduce it

### 2. A Little to the Left (Max Infer)
- **Rank**: Top 6 Puzzle Mobile 2026
- **Core mechanic**: Sort/arrange objects to satisfy hidden aesthetic rules
- **Systems**: Daily puzzle, 100+ levels, star ratings, cats interrupting
- **Art style**: Hand-drawn cozy illustrations
- **Music**: Gentle acoustic/guitar
- **Key insight**: Deduction + ASMR satisfaction

### 3. Unpacking (Witch Beam)
- **Rank**: Award-winning (BAFTA, IGF)
- **Core mechanic**: Arrange belongings in rooms as you unpack boxes
- **Systems**: Story progression, zen mode, achievement system
- **Art style**: Pixel art isometric
- **Key insight**: Spatial reasoning + emotional storytelling

## Systems to Implement (S-grade requirement)

| System | Priority | Details |
|--------|----------|---------|
| Core constraint engine | P0 | Guest placement + constraint checking |
| Level system | P0 | 25+ levels, 5 difficulty tiers |
| Drag-and-drop | P0 | Touch + mouse, smooth animations |
| Constraint feedback | P0 | Visual indicators (satisfied/violated) |
| Star rating | P1 | Based on moves used |
| Hint system | P1 | Show a correct placement (limited) |
| Undo | P1 | Step-by-step undo |
| Progress save | P1 | localStorage with version |
| Tutorial | P1 | First 3 levels guided |
| Sound effects | P1 | Web Audio API procedural |
| BGM | P2 | Procedural ambient music |
| Daily challenge | P2 | Procedural puzzle |
| Score/Best | P1 | localStorage best scores |
| Particle effects | P2 | Celebration on level complete |

## Constraint Types (Progressive Difficulty)

| Tier | Constraints | Complexity |
|------|-------------|------------|
| Tutorial (1-3) | 1-2 per guest | "Sit next to friend" only |
| Easy (4-8) | 2-3 per guest | + "Don't sit next to enemy" |
| Medium (9-15) | 3-4 per guest | + "Face direction" preferences |
| Hard (16-22) | 4-5 per guest | + "Near/far from table feature" |
| Expert (23-25) | 5+ per guest | Multiple tables, conflicting |

## Visual Style
- Dark gradient background (GameZipper style)
- Neon accent colors for constraints (green=satisfied, red=violated)
- Guest cards with emoji avatars
- Rounded table shapes with glow effects
- Glass-morphism UI panels
- Smooth transitions and particle celebrations

## Music Style
- Ambient electronic, cozy, warm
- Gentle piano + soft synth pads
- Moderate tempo
- Procedural via Web Audio API

## Scoring Formula
- Stars: 3 stars = solved with ≤ optimal moves, 2 = ≤ optimal+3, 1 = solved
- Score: base 1000 - (moves * 10) + (time bonus)
- Best score saved per level in localStorage
