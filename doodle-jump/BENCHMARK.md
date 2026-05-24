# Doodle Jump — Competitor Benchmark

## Target Game
**Doodle Jump** by Lima Sky — 50M+ mobile downloads, classic vertical platformer, Poki featured

## Core Competitors

### 1. Doodle Jump (Original)
- **Mechanics**: Tilt/arrow keys to move horizontally, auto-bounce on platforms, shoot monsters (nose tap)
- **Power-ups**: Jetpack (fly up), Springs (super bounce), Propeller Hat (slow fly), UFO (full-screen fly)
- **Platform Types**: Normal (green), Moving (blue), Breakable (brown), Vanishing (white)
- **Obstacles**: Monsters (shoot or avoid), Black holes (instant death), UFOs
- **Themes**: Classic, Space, Soccer, Halloween, Christmas, Ninja, Rainforest, Easter
- **Scoring**: Height-based, best score tracked
- **Session**: Endless until fall, quick restart

### 2. IcyTower / Hyper Hippo
- **Mechanics**: Similar vertical jumping, combo multipliers
- **Features**: Character customization, unlockable skins, combo system
- **Scoring**: Height + combo multiplier

### 3. Ninja Jump / Mega Jump
- **Mechanics**: Coins collection + power-ups, character upgrades
- **Features**: Multiple characters, upgrade shop, coin-based progression

## Systems to Implement
1. **Core**: Auto-bounce on platforms, horizontal movement (tilt/arrow/touch)
2. **Platform Types**: Normal, Moving, Breakable, Vanishing, Spring
3. **Power-ups**: Jetpack, Propeller Hat, Springs
4. **Obstacles**: Monsters, UFOs/aliens
5. **Shooting**: Tap to shoot projectiles at monsters
6. **Scoring**: Height-based score, best score (localStorage), star milestones
7. **Difficulty**: Platform spacing increases, more monsters, more breakable platforms at height
8. **Theme**: Notebook/doodle art style with hand-drawn aesthetic
9. **Sound**: Web Audio BGM + SFX (bounce, shoot, power-up, death, monster)
10. **Mobile**: Touch controls (tilt or drag), responsive canvas
11. **Analytics**: GameZipper tracking pixel
12. **SEO**: Full structured data, meta tags, canonical URL

## Score Formula
- Base: 1 point per platform height unit
- Monster killed: +50 bonus
- Power-up collected: +100 bonus
- Spring bounce: 3x height points during spring
