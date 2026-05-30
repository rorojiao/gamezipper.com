# Plinko — Competitive Benchmark

## Game Overview
**Name:** Plinko  
**Slug:** plinko  
**Category:** Casual / Arcade  
**Mechanic:** Drop a ball from the top of a peg board; it bounces off pegs with physics and lands in scoring slots at the bottom.  

## Market Analysis
- **Plinko** is one of the most iconic casual games — originally from "The Price Is Right" TV show
- **Peggle** (PopCap/EA): 50M+ players, legendary casual hit with RPG elements
- **Plinko gambling games**: Massive traffic on crypto casinos (Stake, Roobet), 100K+ daily players
- **Poki**: Multiple Plinko clones with 1M+ plays each
- **No quality browser Plinko** exists on GameZipper (pinball = flippers, peg-solitaire = jumping, NOT Plinko)

## Competitor Analysis

| Feature | Peggle (PopCap) | Crypto Plinko | Casual Browser |
|---------|-----------------|---------------|----------------|
| Physics | Advanced (realistic bounce) | Simple (randomized) | Basic |
| Scoring | Multiplier zones | Risk/reward slots | Simple slots |
| Levels | 55+ levels with targets | Single board | Unlimited |
| Power-ups | 10+ types | None | Rare |
| Progression | Character leveling | Bet amounts | High score |
| Monetization | Premium + IAP | Real money gambling | Ads |

## GameZipper Plinko Design

### Core Mechanics
1. **Peg Board**: 8-12 rows of pegs, triangular/diamond pattern
2. **Ball Drop**: Tap/click at top to choose drop position (left/right)
3. **Physics**: Ball bounces off pegs with realistic 2D physics (angle reflection + small randomness)
4. **Scoring Slots**: Bottom slots with different point values (center = highest)
5. **Multiple Balls**: Player gets 10 balls per round, aim to maximize total score

### Game Modes
1. **Classic Mode**: Standard Plinko with 10 balls, target score
2. **Challenge Mode**: Hit specific slots to clear levels (30 levels)
3. **Peggle Mode**: Clear all orange pegs with limited balls (10 levels)

### Features
- Responsive Canvas rendering
- Web Audio SFX (ball bounce, slot landing, level complete)
- Web Audio ambient BGM
- 3-star rating per level (target scores)
- localStorage progress save
- Touch + mouse + keyboard support
- Dark neon theme (#0a0a1a background, gradient pegs)
- Monetag ad integration

### Level Design
- 30 levels across 3 modes (10 each)
- Peg patterns: Standard, Diamond, Hourglass, Funnel, Spiral
- Increasing complexity: more pegs, moving pegs, bumpers, multipliers
- 3-star targets per level

### SEO
- Keywords: plinko, peggle, ball drop, peg board, casual game
- JSON-LD: VideoGame, FAQPage, HowTo, BreadcrumbList
