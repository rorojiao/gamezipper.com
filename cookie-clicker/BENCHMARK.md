# Cookie Clicker — Competitive Benchmark

## Competitor Analysis

### 1. Cookie Clicker (Original by Orteil, 2013)
- **URL**: cookieclicker.ee / cookieclicker.tech
- **Stats**: 100M+ visits, cultural phenomenon, spawned entire idle game genre
- **Core Loop**: Click cookie → earn cookies → buy buildings → earn cookies passively → buy upgrades → repeat
- **Key Systems**:
  - **Buildings (19 types)**: Cursor, Grandma, Farm, Mine, Factory, Bank, Temple, Wizard Tower, Shipment, Alchemy Lab, Portal, Time Machine, Antimatter Condenser, Prism, Chancemaker, Fractal Engine, Javascript Console, Idleverse, Cortex Baker
  - **Upgrades**: 500+ upgrades (building multipliers, click multipliers, special effects)
  - **Achievements**: 600+ achievements (shadow, normal, tiered)
  - **Prestige System**: Heavenly Chips (reset for permanent multiplier)
  - **Golden Cookie**: Random bonus events (frenzy, lucky, click frenzy)
  - **Mini-games**: Each building has a mini-game at higher levels
  - **Stats Panel**: Cookies per second, total baked, all-time records
  - **News Ticker**: Flavor text at bottom
  - **Save System**: Auto-save to localStorage, export/import
- **Art Style**: Hand-drawn pixel art, warm browns/creams, whimsical
- **Music**: Minimal, optional
- **UX Patterns**: Satisfying number animation, building icons pulse on purchase, screen shake on achievements

### 2. Cookie Clicker 2 (Mobile, 2021)
- **Platform**: iOS/Android
- **Key additions**: 3D cookie, particle effects, prestige trees, offline earnings
- **Monetization**: IAP for golden cookies, prestige currency

### 3. Clicker Heroes (2014)
- **Stats**: Massive web following, spawned idle RPG subgenre
- **Core Loop**: Click monsters → earn gold → hire heroes → progress through zones → prestige
- **Key Systems**: Hero upgrades with abilities, skill tree, ascension/prestige, raid bosses
- **Difference from Cookie Clicker**: Progress-based (zones) vs pure numbers

### 4. Adventure Capitalist (2015)
- **Stats**: 100M+ downloads
- **Core Loop**: Buy businesses → earn money → hire managers → automate → prestige
- **Key Systems**: 12 businesses, managers (auto-collect), upgrades, multipliers, angel investors (prestige)
- **Art Style**: Flat cartoon business icons, clean UI

### 5. Antimatter Dimensions (2017)
- **Core Loop**: Buy dimensions → produce antimatter → unlock new dimensions → prestige layers
- **Key Systems**: Infinite challenge modes, 8+ prestige layers, automation, unique mechanics per layer
- **Difference**: Deeper prestige system, more mathematical

## Systems to Implement (Sorted by Priority)

### Tier 1 — Must Have
| System | Description | Cookie Clicker Reference |
|--------|-------------|------------------------|
| **Click Mechanic** | Click to earn, satisfying feedback | Core mechanic |
| **Cookie Counter** | Large animated number, CPS display | Top left display |
| **Buildings (10)** | Cursor, Grandma, Farm, Mine, Factory, Bank, Temple, Portal, Time Machine, Lab | 10 core buildings (not all 19) |
| **Upgrades** | Per-building + global multipliers | 50+ upgrades |
| **Prestige** | Reset for permanent bonus | Heavenly Chips |
| **Golden Cookie** | Random bonus events | Frenzy, Lucky, Click Frenzy |
| **Save/Load** | localStorage auto-save | Export/import optional |
| **Stats** | Total cookies, CPS, play time | Bottom panel |

### Tier 2 — Should Have
| System | Description |
|--------|-------------|
| **Achievements** | 30+ achievements for milestones |
| **News Ticker** | Flavor text messages |
| **Building Milestones** | Visual changes at 10/25/50/100 |
| **Number Formatting** | Scientific notation for large numbers |
| **Offline Earnings** | Calculate earnings while away |
| **Settings** | Sound, particles, notifications |

### Tier 3 — Nice to Have
| System | Description |
|--------|-------------|
| **Mini-games** | Per-building mini-game |
| **Seasonal Events** | Halloween, Christmas themes |
| **Sugar Lumps** | Secondary currency for special upgrades |
| **Tooltips** | Detailed building/upgrade descriptions |

## Technical Specs for GameZipper Implementation

### Economy Design
- **Cookie Value**: Start at 1 per click
- **Building Costs**: Exponential growth (base_cost * 1.15^owned)
- **Building CPS**: Each building has base CPS, multiplied by upgrades
- **Upgrade Costs**: Linear/exponential tiers
- **Prestige**: Gain chips = floor(total_cookies_earned / 1e12)^0.5, each chip = +1% CPS
- **Golden Cookie**: Random spawn 60-180s, effects: Frenzy (7x CPS, 77s), Lucky (13x CPS or 10% bank), Click Frenzy (777x click for 13s)

### Number Formatting
- Below 1M: comma-separated (999,999)
- 1M-999.99M: X.XX million
- 1B-999.99B: X.XX billion
- 1T+: X.XX trillion, then quadrillion, quintillion, etc.

### Buildings (10)
| # | Name | Base Cost | Base CPS | Icon Concept |
|---|------|-----------|----------|-------------|
| 0 | Cursor | 15 | 0.1 | Arrow pointer |
| 1 | Grandma | 100 | 1 | Grandmother |
| 2 | Farm | 1,100 | 8 | Wheat field |
| 3 | Mine | 12,000 | 47 | Pickaxe |
| 4 | Factory | 130,000 | 260 | Gear |
| 5 | Bank | 1,400,000 | 1,400 | Dollar sign |
| 6 | Temple | 20,000,000 | 7,800 | Pyramid |
| 7 | Portal | 330,000,000 | 44,000 | Swirl |
| 8 | Time Machine | 5.1B | 260,000 | Clock |
| 9 | Antimatter | 75B | 1,600,000 | Atom |

### Upgrades (Per Building — 5 tiers each = 50 total)
Each building gets upgrades at milestones: 1, 10, 25, 50, 100 owned
- Each doubles that building's CPS
- Additional 10 global upgrades (click power, global CPS multiplier)

### Achievements (30+)
- "Click" achievements: 1, 100, 1K, 10K, 100K, 1M clicks
- "Building" achievements: Own 1, 10, 25, 50, 100 of each type
- "CPS" achievements: Reach 100, 1K, 10K, 100K CPS
- "Total baked" achievements: 1M, 1B, 1T total cookies
- "Prestige" achievements: Prestige 1, 5, 10 times
- "Golden Cookie" achievements: Click 1, 10, 50 golden cookies

## Visual Style for GameZipper
- **Theme**: Warm bakery colors (browns, creams, golden) with neon accents
- **Cookie**: Large, centered, rotating/pulsing animation on click
- **Buildings**: CSS-drawn icons or SVG with purchase animation
- **Particles**: Cookie crumbs fly out on click
- **Background**: Dark gradient with subtle cookie-themed pattern
- **Font**: Clean sans-serif for numbers (monospace for counters)
