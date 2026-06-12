# Going Balls — Competitive Benchmark

**Date:** 2026-06-12  
**Researcher:** dev-gamezipper (Camoufox live scrape)

---

## 1. Going Balls (Supersonic Studios / pronetis)

| Dimension | Data |
|-----------|------|
| Android Downloads | 100M+ |
| Rating | 4.2★ (963K reviews) |
| Last Updated | Jun 8 2026 |
| Mechanic | Swipe to accelerate/brake a ball through 3D obstacle courses; one-touch casual runner |
| Levels | 1000+ (player reports content recycles around L5000) |
| Controls | One-finger swipe: forward = accelerate, back = brake, L/R = steer |
| Physics | Realistic ball physics with momentum, gravity on ramps, bounce |
| Ball Skins | 100+ unlockable skins (sports, animals, emoji themes) via coins or ads |
| Coins | Scattered through levels, used for skins |
| Power-ups | Shield, Magnet (coin attraction), Double Coins — limited use per run |
| Monetization | Heavy interstitial ads (post-level, mid-level at gates), rewarded ads for revive/skins; in-app purchases: remove ads ($2.99), coin packs |
| Art Style | Low-poly 3D, colorful pastel, clean and minimal |
| Music | Upbeat electronic/EDM loop, 15-20s cycle |
| SFX | Ball bounce, crash, coin collect, gate open, skin unlock jingle |
| Progression | Linear level sequence, world themes every ~50 levels (forest, city, space, etc.) |
| Social | No global leaderboard, no multiplayer; local best time tracking |
| Player Complaints | Excessive ads (1 per 30-60s), content recycling after L1000, occasional physics glitches |

## 2. Run Race 3D — Fun Parkour Game (CASUAL AZUR GAMES / ex-Good Job Games)

| Dimension | Data |
|-----------|------|
| Android Downloads | 100M+ |
| Rating | 4.2★ (1.42M reviews) |
| Mechanic | Side-scrolling runner with multiplayer bot opponents; tap to jump between lanes/platforms |
| Levels | 500+ procedurally varied |
| Controls | Tap to jump; auto-run forward |
| Features | Multiplayer bot races, character skins, level-based progression |
| Monetization | Interstitial ads, rewarded ads for continues; IAP for ad removal |
| Art Style | 3D low-poly, bright colors, blocky characters |
| Social | Pseudo-multiplayer (bot opponents appearing as other players) |

## 3. Jelly Shift — Obstacle Course (SayGames)

| Dimension | Data |
|-----------|------|
| Android Downloads | 100M+ |
| Rating | 4.3★ (334K reviews) |
| Mechanic | Swipe up/down to change jelly shape (tall/flat) to fit through obstacle gaps |
| Levels | 500+ |
| Controls | Swipe vertical: up = tall, down = flat |
| Features | Jelly skins, color themes, boss levels every 10 stages |
| Monetization | Interstitial ads between levels, rewarded ads for continues |
| Art Style | Glossy jelly/fruit aesthetic, neon trails |
| Social | No multiplayer |

## 4. Roller Splat! (VOODOO / Neon Play)

| Dimension | Data |
|-----------|------|
| Android Downloads | 10M+ (iOS: 4.4★ 140K reviews) |
| Rating | 3.6★ Android / 4.4★ iOS |
| Mechanic | Swipe to roll a paint ball through a maze, painting all paths to complete level |
| Levels | 200+ |
| Controls | Swipe directional to roll ball |
| Features | Color unlocks, level packs, minimal UI |
| Monetization | Interstitial ads every few levels; IAP for ad removal |
| Art Style | Clean white backgrounds, colorful paint trails, minimal |
| Social | No multiplayer |

## 5. Rollance: Adventure Balls (CASUAL AZUR GAMES)

| Dimension | Data |
|-----------|------|
| Position | Google Play #1 "Similar to Going Balls" |
| Mechanic | Ball rolling through obstacle courses with stunt ramps; very close to Going Balls |
| Key Differentiator | More emphasis on stunt/trick elements (loop-the-loops, half-pipes) |

---

## Strategic Takeaways for GameZipper Implementation

### What to include (proven demand):
1. **One-touch controls**: Swipe/hold to accelerate, release to brake — simple and addictive
2. **3D-perspective 2D rendering**: Use Canvas 2D with pseudo-3D (vanishing point) for depth illusion — no need for real 3D
3. **Ball skins**: 20+ unlockable visual styles (coins → skin purchase)
4. **Coin collection**: Scattered through levels for progression economy
5. **Power-ups**: Shield, Magnet, Double Coins — 3 types minimum
6. **30 levels minimum**: 5 themes/worlds (6 levels each), difficulty ramps from flat courses to narrow bridges and gaps
7. **Level rating**: 1-3 stars based on completion time + coins collected
8. **Progressive difficulty**: Wide paths → narrow bridges → moving obstacles → gaps + ramps
9. **Sound effects**: Bounce, crash, coin, power-up, level complete jingle (Web Audio)
10. **BGM**: Upbeat electronic loop (Web Audio procedural)

### What to skip (reduce scope):
- Real 3D rendering (use 2D Canvas with perspective trick)
- Multiplayer/bot opponents (adds complexity, not core to single-player appeal)
- 1000+ levels (30 levels sufficient for launch, can add more later)

### Key differentiator for GZ version:
- **Pseudo-3D perspective**: Vanishing-point rendering on 2D Canvas creates visual depth without WebGL
- **Satisfying physics**: Ball momentum, gravity on slopes, bounce on landings
- **Clean neon aesthetic**: Dark background + neon ball trail (matches GZ dark theme)
- **No forced ads**: Monetag banners only, no interstitial during gameplay

### Game Design Parameters:
- **Grid**: 5-lane width (player can be in lanes 1-5)
- **View**: Top-down angled (30-45°) for depth perception
- **Ball speed**: Increases with hold duration, max speed capped
- **Level length**: 15-30 seconds each at normal speed
- **Star thresholds**: 1★ = complete, 2★ = collect 50%+ coins, 3★ = collect 80%+ coins + fast time
