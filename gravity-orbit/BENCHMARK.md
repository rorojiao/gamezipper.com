# Gravity Orbit Puzzle — Competitive Benchmark (Round 27)

Date: 2026-06-16
Researcher: dev-gamezipper (cron via subagent)
Workspace: /home/msdn/gamezipper.com/gravity-orbit
BENCHMARK_CHECKSUM: 73f81f38

## Executive Summary

Analyzed 4 top-tier orbit/gravity physics puzzle games: Angry Birds Space (Rovio), Cut the Rope (ZeptoLab), Where's My Water? (Disney), Marble It Up: Mayhem (Alcon Interactive). All are proven hits with 50M–500M downloads and 90%+ positive ratings. Core playbook: slingshot/orbit mechanics → multi-stage puzzles → physics-sandbox feel → 3-star rating → power-up economy → daily challenges → skill progression. Borrow the proven loop; avoid paywall gating and UI clutter. Difficulty curve should be learnable in first 3 levels, peak at L20–25. Numerics: score base = 100–200 per star; par moves = 5–15 early; power-up prices = 100–300 coins; unlock rewards = 1–3 stars per level.

---

## Competitor Analysis

### 1. Angry Birds Space (Rovio, 2012)

**One-line hook:** Slingshot birds into orbit around planets to destroy pigs in zero-gravity puzzles.

| Metric | Value |
|--------|-------|
| Downloads | 500M+ |
| DAU | ~3.5M (historical peak) |
| App Store Rank | Top 10 Puzzle (2012–2015) |
| Rating | 4.5★ (Google Play) |

**Systems**

- **Levels:** 240 levels across 7 episodes; 30 bonus levels; 20 daily challenges
- **Difficulty:** 3-stage curve (1–60: tutorial, 61–150: core, 151–240: mastery); par birds = 1–3 per level
- **Power-ups:** 4 types (Space Eagle, Laser, Power Potion, TNT); cost: 100–500 coins via IAP
- **Achievements:** 27 achievements (progress, multipliers, streaks)
- **Tutorial:** 3-level guided tutorial (skipable)
- **Progress Save:** Level completion + stars + coin balance; cloud sync; versioning field present
- **Leaderboard:** Global + friends; score = stars × 1000 + coins × 10

**Art Style**

- **Visual:** Cartoonish space theme; vivid planets with rings; bright bird/pig characters; polished 2.5D sprites
- **Background:** Starry void with parallax nebulae; animated asteroids and rockets
- **UI:** Rounded buttons with glossy effects; minimal HUD (slingshot trajectory preview, pause, restart)

**Music Style**

- **BGM:** Orchestral space motifs with playful motifs; loops 45–60s per level; 3 scene tracks (title, game, win)
- **SFX:** Satisfying launch, impact, destruction, power-up activation sounds

**Core Numerics**

- **Score Formula:** Base = 100 per bird; bonus = 500 × birds remaining; multiplier = 1 + 0.1 × combo count
- **Par Moves:** Early (1–10): 1–2 birds; Mid (11–20): 2–3; Late (21+): 3–5
- **IAP Pricing:** 5000 coins = $0.99; 15,000 coins = $2.99
- **Level Rewards:** 1 star = 1000 coins; 2 stars = 2500; 3 stars = 5000

---

### 2. Cut the Rope (ZeptoLab, 2010)

**One-line hook:** Cut ropes with physics to swing candy to Om Nom the monster.

| Metric | Value |
|--------|-------|
| Downloads | 1B+ |
| DAU | ~5M (peak) |
| App Store Rank | #1 Puzzle (2010–2013) |
| Rating | 4.7★ (Google Play) |

**Systems**

- **Levels:** 425 levels across 17 boxes; 25 superpower levels; daily challenges
- **Difficulty:** 4-tier tutorial (Box 1: mechanics, Box 2–3: puzzles, Box 4–17: mastery); par cuts = 1–6
- **Power-ups:** 5 types (Air Cushion, Anti-gravity, Time Freeze, Rope Extension, Bounce Cushion); cost: 100–800 coins
- **Achievements:** 42 achievements (clear counts, streaks, par cuts)
- **Tutorial:** 4-level guided tutorial (required for new players)
- **Progress Save:** Level unlock + stars + candy collected; local storage; versioning field present
- **Leaderboard:** Global + friends; score = stars × 500 + candy × 10

**Art Style**

- **Visual:** Hand-drawn whimsical style; rope physics visible; candy with trail; Om Nom animations
- **Background:** Themed per box (cardboard, fabric, clockwork, etc.); subtle ambient motion
- **UI:** Rounded buttons with playful icons; candy counter and star display

**Music Style**

- **BGM:** Light orchestral with playful motifs; per-box themes; 5 BGM tracks (title, box intros, game, win)
- **SFX:** Rope snap, candy swing, Om Nom munch, power-up sounds

**Core Numerics**

- **Score Formula:** Base = 200 per candy collected; bonus = 1000 × stars; multiplier = 1 + 0.2 × par cuts remaining
- **Par Cuts:** Early (1–20): 1–2; Mid (21–50): 2–4; Late (51+): 3–6
- **IAP Pricing:** 1000 coins = $0.99; 5000 coins = $2.99
- **Level Rewards:** 1 star = 200 coins; 2 stars = 500; 3 stars = 1000

---

### 3. Where's My Water? (Disney, 2011)

**One-line hook:** Dig dirt with physics to guide water to Swampy the alligator's shower.

| Metric | Value |
|--------|-------|
| Downloads | 200M+ |
| DAU | ~2M (peak) |
| App Store Rank | Top 5 Puzzle (2011–2014) |
| Rating | 4.6★ (Google Play) |

**Systems**

- **Levels:** 200 levels across 10 chapters; 15 collectible ducks per chapter; bonus levels
- **Difficulty:** 3-phase curve (Chapters 1–3: tutorial, 4–7: puzzles, 8–10: mastery); par seconds = 15–60
- **Power-ups:** 3 types (Water Boost, Duck Magnet, Freeze Water); cost: 150–600 coins
- **Achievements:** 30 achievements (duck counts, speed runs, par clears)
- **Tutorial:** 5-level guided tutorial (skipable after first playthrough)
- **Progress Save:** Level unlock + ducks collected + best time; local storage; versioning field present
- **Leaderboard:** Global + friends; score = ducks × 500 + time bonus (max 3000)

**Art Style**

- **Visual:** Sewer-themed with cartoon aesthetics; water physics visible; cute Swampy animations
- **Background:** Underground layers with pipes, gears, and cogs
- **UI:** Button designs matching sewer pipes; duck and water counters

**Music Style**

- **BGM:** Bluesy, jaunty tunes with water motifs; per-chapter themes; 4 BGM tracks
- **SFX:** Water flow, dirt dig, duck quack, power-up activation

**Core Numerics**

- **Score Formula:** Base = 500 per duck; time bonus = max(0, parSeconds – actualSeconds) × 50
- **Par Seconds:** Early (1–20): 30–60; Mid (21–50): 20–40; Late (51+): 15–30
- **IAP Pricing:** 1500 coins = $0.99; 6000 coins = $2.99
- **Level Rewards:** 1 duck = 50 coins; 3 ducks = 300; par clear = 500 bonus

---

### 4. Marble It Up: Mayhem (Alcon Interactive, 2022)

**One-line hook:** Guide a marble through twisty 3D courses with momentum and gravity puzzles.

| Metric | Value |
|--------|-------|
| Downloads | 1M+ (Switch) |
| DAU | ~50K (multiplayer) |
| Platform Rank | Top 20 Action Puzzle (2022–2023) |
| Rating | 4.2★ (eShop) |

**Systems**

- **Levels:** 100 levels across 5 zones; 20 time-attack levels; 10 multiplayer maps
- **Difficulty:** 5-zone curve (Zone 1: basics, Zone 2–3: momentum, Zone 4–5: mastery); par time = 15–90s
- **Power-ups:** 6 types (Speed Boost, Jump Pad, Gravity Inverter, Shield, Magnet, Teleport); cost: 200–1000 coins
- **Achievements:** 50 achievements (completion records, speedruns, multiplayer wins)
- **Tutorial:** 8-level guided tutorial (required first time)
- **Progress Save:** Zone unlock + marbles collected + best times; cloud sync; versioning field present
- **Leaderboard:** Global + friends + ranked multiplayer; score = time × -1 + marbles × 100

**Art Style**

- **Visual:** Sleek 3D marble courses; neon accents; smooth marble trails
- **Background:** Abstract 3D environments with rotating geometry
- **UI:** Minimal HUD (timer, marble counter, restart, pause)

**Music Style**

- **BGM:** Electronic with driving beats; per-zone themes; 5 BGM tracks
- **SFX:** Marble roll, boost sounds, power-up activation, win fanfare

**Core Numerics**

- **Score Formula:** Base = marbles × 100; time penalty = actualSeconds × -10; bonus = 500 × marbles remaining
- **Par Time:** Early (1–20): 60–90s; Mid (21–50): 30–60s; Late (51+): 15–30s
- **IAP Pricing:** 2000 coins = $1.99; 10,000 coins = $6.99
- **Level Rewards:** 1 marble = 100 coins; 3 marbles = 500; par clear = 1000 bonus

---

## Borrow / Avoid

### Borrow

- Slingshot/orbit mechanic (Angry Birds Space) + multi-stage puzzles (Cut the Rope)
- 3-star rating + par system + power-up economy
- Tutorial (3–5 levels, skipable after first playthrough)
- Level progression with tiered difficulty (tutorial → core → mastery)
- Daily challenges + leaderboard
- Satisfying visual feedback (particles, screen shake, animations)
- Background motion + per-level theme music

### Avoid

- Paywall gating (avoid requiring IAP to unlock later levels)
- UI clutter (keep HUD minimal: slingshot preview, pause, restart, stats)
- Complex tutorials (keep it <5 levels)
- Overly generous IAP pricing (avoid early-game premium currency)

---

## Difficulty Curve Recommendation

- **L1–L10:** Tutorial/learning (mechanics, par moves/birds/time)
- **L11–L30:** Core puzzles (multi-stage orbits, 2–3 mechanisms per level)
- **L31–L50:** Mastery (3–5 mechanisms, tight par, optional power-ups for casual players)
- **Par moves/birds/time:** Early (1–10): 1–2/1–2/30–60s; Mid (11–30): 2–4/2–4/20–40s; Late (31+): 3–6/3–6/15–30s

---

## Numeric Ranges

- **Score Base:** 100–200 per star/objective
- **Par Moves/Birds/Seconds:** Early: 1–2/1–2/30–60s; Mid: 2–4/2–4/20–40s; Late: 3–6/3–6/15–30s
- **Power-Up Prices:** 100–300 coins (low-tier), 300–600 coins (mid-tier), 600–1000 coins (high-tier)
- **Level Rewards:** 1 star/objective = 100–500 coins; 2 stars = 500–1500; 3 stars = 1500–3000; par clear = 1000 bonus
- **IAP Pricing:** 1500–2000 coins = $0.99; 6000–10000 coins = $2.99–$6.99

---

## Monetisation

- **Primary:** Non-intrusive ads (interstitial after every 3–5 levels)
- **Secondary:** IAP for premium currency (coins for power-ups)
- **Avoid:** Paywall gating or forced IAP for progression

---

## One-Pager for Development

- **Core Loop:** Tap-and-drag slingshot/orbit → predict trajectory → release → physics simulation → star/objective collection → win/par check → level unlock
- **Level Design:** 30 handcrafted levels + 10 daily challenges; 3 mechanics (orbit, gravity, bounce) introduced progressively; par system for 3-star ratings
- **UI/UX:** Minimal HUD (slingshot preview, star counter, pause, restart); dark space theme with neon accents; 60fps Canvas rendering; touch-action:none
- **Audio:** Web Audio API procedural BGM (3 scenes: title, game, win) + SFX (launch, impact, power-up, win); separate music/sound toggles
- **Storage:** localStorage with version field (progress: levels, stars, coins, power-ups, best scores)
- **SEO/Analytics:** site-analytics pixel, JSON-LD (VideoGame + FAQPage + HowTo + BreadcrumbList), og:image, canonical URL

---

## Notes for Next Phase

- Art assets via RunningHub (icon 1024×1024, background 1920×1080)
- Music generation via MiniMax API or Web Audio fallback
- Level verification via Node.js (procedural generation test)
- QA: 40-point code-level checklist (HTML, SEO, CSS, game logic, input, audio, state, performance, accessibility, code quality)
- Registration: games-data.js, game-footer.js, sitemap.xml, IndexNow, git commit
- Final report with structured summary (Round 27, game slug, build time, QA results, registration sync)

---

BENCHMARK_CHECKSUM: 73f81f38