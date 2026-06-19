# BENCHMARK — Penalty Shootout

## Competitive Analysis

### 1. Penalty Shooters 2 (Poki)
- **Plays/month**: Millions (top-50 on Poki)
- **Format**: Alternating shooter + goalkeeper, best-of-5, then sudden death
- **Visual**: Side view of goal, cartoon style, simple 2D
- **Mechanics**: Click to aim, power bar, goalkeeper auto-dive or player-controlled
- **Teams**: 32+ national teams with colored kits
- **Monetization**: Interstitial ads between matches
- **Why popular**: Simple controls, quick matches (2-3 min), tournament progression

### 2. 3D Free Kick (Various publishers)
- **Plays/month**: High
- **Format**: Free kick only (wall + goalkeeper)
- **Mechanics**: Swipe to aim + curve, ball curves around wall
- **Visual**: 3D perspective from behind ball
- **Key innovation**: Curve/spin mechanic (swipe in arc)
- **Retention**: Level progression with increasing wall/difficulty

### 3. Penalty Champs 21
- **Format**: Tournament bracket, 16 teams
- **Mechanics**: Click goal area to aim, timing bar for power, goalkeeper auto-dive
- **Visual**: Top-down-ish perspective
- **Features**: Team stats, bracket display, stats tracking

## Feature Benchmark Matrix

| Feature | Penalty Shooters 2 | 3D Free Kick | Penalty Champs 21 | Our Game |
|---------|-------------------|--------------|-------------------|----------|
| Aim + Power | ✅ Click | ✅ Swipe | ✅ Click+timing | ✅ Drag (aim+power) |
| Curve/Spin | ❌ | ✅ Swipe arc | ❌ | ✅ Drag arc |
| Goalkeeper control | ✅ Player | ❌ AI only | ❌ AI only | ✅ Player (save phase) |
| Tournament bracket | ✅ | ❌ | ✅ 16-team | ✅ 8-team bracket |
| Team selection | ✅ 32+ | ❌ | ✅ 16 | ✅ 8 national teams |
| Sudden death | ✅ | ❌ | ✅ | ✅ |
| Difficulty levels | ❌ | ✅ Levels | ❌ | ✅ Easy/Normal/Hard AI |
| Sound effects | ✅ Basic | ✅ | ✅ | ✅ Web Audio procedural |
| Stats tracking | ❌ | ❌ | ✅ | ✅ localStorage |
| Best score | ❌ | ✅ | ❌ | ✅ Win streak + trophies |

## Our Differentiation
1. **Full curve/spin mechanic** — only 3D Free Kick has this, we bring it to penalty format
2. **Player-controlled goalkeeping** — Penalty Shooters has it, others don't
3. **Tournament + stats** — combined progression not seen in competitors
4. **Procedural stadium atmosphere** — crowd, net physics, celebration effects
