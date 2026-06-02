# Coin Pusher — Benchmark & Competitive Analysis

## Game Concept

2D top-down (slight perspective) coin pusher arcade game. Player drops coins onto a moving pusher tray that sweeps forward/backward. Coins that fall off the front edge are collected as winnings. Prize tokens (diamonds, gems, tickets, bill validators) fall in periodically as bonus rewards. The pusher physics creates satisfying chain reactions where one coin can push many others.

## Competitors Analyzed

### 1. Coin Dozer (by Game Circus / Voodoo)
- **Downloads**: 100M+ on Play Store, 4.6★ rating
- **Core Mechanic**: Drop coins onto a moving pusher, collect prizes
- **Scoring**: Prizes, tickets, bill validators, gem stacks
- **Progression**: Multiple machines with different themes
- **Key Features**: Daily bonuses, multiple coin types, casino-style flair, gem stacks, prize counters

### 2. Coin Pusher Vegas / Coin Pusher Master
- **Downloads**: 50M+ combined
- **Core Mechanic**: Drop coins to push other coins off the edge
- **Scoring**: Win coins that fall off, redeem for prizes
- **Progression**: Multiple pusher machines, daily challenges
- **Key Features**: Las Vegas aesthetic, slot machine mini-games, scratch cards, scratch-off tickets

### 3. RACCOIN (Steam 2026, indie hit)
- **Downloads**: N/A (Steam, indie hit)
- **Core Mechanic**: Roguelike + coin pusher — strategy-driven coin placement
- **Scoring**: Win coins to buy upgrades
- **Progression**: Meta-progression with deckbuilding
- **Key Features**: Skill stops, skill shots, deep strategy, multi-coin types

### 4. Cosy Coin Pusher (itch.io)
- **Downloads**: Indie browser hit
- **Core Mechanic**: Lo-fi coin pusher with carnival gimmicks
- **Scoring**: Collect coins, plan drops
- **Progression**: Skill-based progression
- **Key Features**: ASMR/lo-fi aesthetic, no paywalls, calm gameplay, house mechanics

### 5. Pusher Master - Coin Fest (iOS)
- **Downloads**: 10M+
- **Core Mechanic**: Coin pusher with boosters
- **Scoring**: Boosters (Giant Coins, coin walls), daily challenges
- **Progression**: Multiple machines, fresh bonuses daily
- **Key Features**: Vegas-style attractions, spinning wheels, slot machines

## Target Features for GameZipper Version

### Core Systems
- [x] Pusher tray oscillates left-right (sinusoidal motion, 2s cycle)
- [x] Drop coins by tapping/clicking — aim a vertical laser/indicator, then drop
- [x] Coin physics: gravity, coin-coin collision, friction on tray
- [x] Coins that fall off the front edge → counted as winnings
- [x] Prize tokens (gems, diamonds, lottery tickets, bill validators) interspersed
- [x] Skill stops (centered) to allow precise placement
- [x] Coin wallet with starting balance + free coins refill over time
- [x] 5+ pusher machines (themed: Classic Arcade, Vegas, Space, Treasure, Royal)
- [x] Win streak / total coins earned indicators
- [x] localStorage save (versioned) — coins, unlocks, best balance, lifetime winnings
- [x] Tutorial (first drop) — explains aim/tap mechanic
- [x] Pause/resume, settings, sound toggles

### Boosts & Power-ups
- [x] **Giant Coin** — pushes 3-5 coins at once (rare, free every 5 minutes)
- [x] **Coin Wall** — drops a vertical line of coins (unlocks at level 10)
- [x] **Magnet** — pulls nearest prize to edge (unlocks at level 15)
- [x] **Free Coins** — bonus 100 coins timer (every 60s)

### Audio
- [x] Web Audio API synthesized "coin clink" on coin-coin collision
- [x] "Drop" sound on coin release
- [x] "Clink" sound on coin-prize collision
- [x] "Big win" sound on prize collection
- [x] BGM: Lo-fi chill (oscillator-based loop)
- [x] Pusher motor hum (constant low ambient)
- [x] Volume toggle, music toggle in settings

### Visual
- [x] Dark gradient background (deep blue → black)
- [x] Neon accent colors (gold for coins, cyan for prizes, magenta for rare)
- [x] Multiple coin denominations: bronze (1), silver (5), gold (25), diamond (100)
- [x] Pusher animation: smooth left/right oscillation
- [x] Coin drop indicator: vertical aim line
- [x] Coin shadow on tray surface
- [x] Particle burst on big win
- [x] Screen shake on giant coin drop
- [x] Coin counter animates (count-up) on collection
- [x] Top-bar HUD: coin balance, level, score
- [x] Win popup: "PRIZE COLLECTED! +500"

### Game Flow
- Main menu: Choose machine, view stats, settings
- Gameplay: Drop coins, collect winnings, unlock boosts
- Between drops: Show coin balance, last prize, free timer
- Level complete: Reach coin target (e.g., 5000 coins) → unlock next machine

### Technical
- [x] Canvas-based rendering, 60fps
- [x] Responsive: desktop (1280x720) and mobile (390x844)
- [x] Touch support: touch-action:none on canvas, pointer events
- [x] Mobile-first: large drop zone (min 100px), giant drop button
- [x] Delta-time independent physics
- [x] Frame-rate independent logic
- [x] Memory leak-free cleanup
- [x] Single HTML file, no external deps except CDN fonts

### Levels / Progression
- **Level 1: Classic Arcade** — easy, lots of coins, slow pusher, 1 coin denomination
- **Level 2: Silver Stack** — 2 denominations, faster pusher
- **Level 3: Gold Rush** — 3 denominations, prizes appear
- **Level 4: Vegas Nights** — neon theme, bill validators appear
- **Level 5: Royal Vault** — diamond prizes, 4 denominations, fastest pusher
- **Level 6: Endless** — all features unlocked, infinite coins, leaderboard

### Monetization / Retention
- Total coins earned (lifetime)
- Best balance (high score)
- Machine unlocks
- Daily streak indicator
- Free coins timer (encourage return)
- Prizes collected: counter

### SEO & Metadata
- Title: Play Coin Pusher Online Free - Vegas Arcade Coin Dozer | GameZipper
- Description: Drop coins, push prizes off the edge, win big in this free online coin pusher arcade game. No download, no signup. 6 themed machines, big wins, satisfying physics.
- JSON-LD: VideoGame + FAQPage + HowTo + BreadcrumbList
- og:image, twitter:card
- Canonical: https://gamezipper.com/coin-pusher/

## Themed Machines
1. **Classic Arcade** — Wood, copper, red felt, traditional look
2. **Silver Stack** — Chrome, silver, modern industrial
3. **Gold Rush** — Gold accents, brown leather, prospector vibe
4. **Vegas Nights** — Neon pink/cyan/purple, marquee lights
5. **Royal Vault** — Deep purple, gold leaf, royal crest
6. **Space Station** — Cyan/teal, stars, sci-fi aesthetic

## Technical Stack
- Single HTML file
- Canvas 2D rendering
- Web Audio API for all sounds (procedural, no external files)
- localStorage for save state (versioned)
- Google Fonts: Orbitron + Inter
- All English UI
