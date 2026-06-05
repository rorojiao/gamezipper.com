## Count Master - Competitive Benchmark

### Overview
Count Master (also known as Crowd Runner, Join Clash) is a hyper-casual game where players control a crowd of stickmen running through gates with math operations. The genre has 500M+ combined downloads across multiple clones.

### Key Competitors

#### 1. Count Masters (Voodoo)
- Downloads: 100M+ on Google Play alone
- Core: Stickman crowd auto-runs, player taps to choose lane at gates
- Gates: x2, +10, -5, ÷2 operations
- Boss fights: Every few levels, remaining stickmen vs boss
- Monetization: Interstitial ads, rewarded ads for continues/skins
- Levels: 100+, with increasing gate count per level
- Difficulty: Gates get trickier (smaller positive gains, bigger negatives)

#### 2. Crowd Runner
- Similar mechanic, 50M+ downloads
- Adds obstacles (walls to dodge, moving barriers)
- Power-ups: Shield, Magnet, 2x multiplier pickup
- Visual: More colorful, 3D characters

#### 3. Join Clash (Supercell)
- 10M+ downloads
- Endless runner variant with crowd merging
- PvP element: compete against AI crowds

#### 4. Arrow Fest
- 50M+ downloads (Voodoo)
- Math gates but with arrows instead of stickmen
- Simpler mechanic: just numbers, no character physics

### Systems to Implement (S-Grade)

| System | Description | Priority |
|--------|-------------|----------|
| Core Running | Auto-run on 3-lane road, 2.5D perspective | MUST |
| Math Gates | x2, +N, -N, ÷N operations on crowd count | MUST |
| Boss Fights | Crowd count vs boss strength every 5th level | MUST |
| 30 Levels | 6 tiers, 5 levels each | MUST |
| Power-ups | Shield, Magnet, Double | MUST |
| Skins | 6 unlockable stickman colors | MUST |
| Combo System | Consecutive positive choices build multiplier | MUST |
| 3-Star Rating | Based on remaining stickmen % vs start | MUST |
| Tutorial | Overlay arrows for first 2 levels | MUST |
| Settings | Sound/music toggle | MUST |
| Save System | localStorage with version field | MUST |
| Particles | Burst on gate pass, celebration on win | MUST |
| BGM | Web Audio procedural, scene-based | MUST |
| SFX | 6 sounds (gate pass, fail, combo, boss, victory, click) | MUST |
| Responsive | Desktop + mobile | MUST |
| SEO | JSON-LD, meta tags, analytics | MUST |

### Difficulty Progression (6 Tiers)

| Tier | Levels | Gates | Features |
|------|--------|-------|----------|
| 1. Starter | 1-5 | 2 per level | Simple + and x operations only, no boss |
| 2. Easy | 6-10 | 3 per level | Introduce - operations, first boss at L10 |
| 3. Medium | 11-15 | 4 per level | ÷ operations, obstacles on road |
| 4. Hard | 16-20 | 5 per level | Trickier math (÷3, -50%), power-ups introduced |
| 5. Expert | 21-25 | 5+obstacles | Multiple boss fights, negative combos |
| 6. Master | 26-30 | 6+obstacles+boss | All mechanics, maximum difficulty |

### Art Style
- 2.5D pseudo-3D road perspective
- Stickman characters (simple geometric)
- Dark gradient background (#0a0a1a to #1a1a3a)
- Neon gates: green (+, x), red (-, ÷), blue (neutral)
- Particle effects for crowd changes
- Glass-morphism UI panels

### Music Style
- Title: Ambient electronic pads
- Gameplay: Energetic rhythmic (120 BPM)
- Boss: Tension building
- Win: Victory fanfare
