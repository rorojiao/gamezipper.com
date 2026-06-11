# Draw Bridge Puzzle — Competitive Benchmark

**Date:** 2026-06-12  
**Category:** Physics drawing puzzle  
**Candidate Score:** 21/25

## Top 3 Competitors

### 1. Draw Bridge Puzzle: Brain Game (Bravestars Global Publishing)
- **Downloads:** 50M+
- **Rating:** 4.3★ (31.4K reviews)
- **Core Mechanic:** Draw lines/bridges to help character cross gaps. Physics simulation with gravity.
- **Levels:** 100+ levels, progressive difficulty
- **Scoring:** Star-based rating per level (1-3 stars based on ink usage)
- **Monetization:** Very ad-aggressive (banner + interstitial + rewarded), IAP for ad removal
- **Art Style:** Colorful cartoon, simple character (stick figure or simple blob)
- **Key Systems:** Hint system, undo, level select with chapter progression
- **Weakness:** Called "shameless ad farm" by users, too many ads

### 2. Build a Bridge! (BoomBit Games)
- **Downloads:** 10M+
- **Rating:** 4.4★ (524K reviews)
- **Award:** Google Play Most Innovative 2017
- **Core Mechanic:** Engineer bridges using limited materials, test with vehicle crossing
- **Levels:** 86+ levels across multiple environments (city, canyon, beach, mountains)
- **Scoring:** 3-star per level (based on materials used, vehicle survival)
- **Monetization:** IAP for coins/hints, rewarded ads for hints
- **Art Style:** 3D low-poly with physics sandbox feel
- **Key Systems:** Material variety (wood, steel, cables), vehicle physics, stress visualization
- **Weakness:** Complex for casual players, older title (2017)

### 3. Draw the Bridge (FreezeNova)
- **Downloads:** 1M+
- **Rating:** 3.9★ (4.18K reviews)
- **Core Mechanic:** Draw paths/bridges to guide cars across gaps
- **Levels:** Multiple chapters with varying themes
- **Scoring:** Pass/fail with optional star collection
- **Monetization:** Ads between levels
- **Art Style:** Simple 2D colorful
- **Key Systems:** Basic draw mechanics, car physics
- **Weakness:** Lower quality, fewer features

## Genre Patterns

| Feature | Leader Pattern | Our Implementation |
|---------|---------------|-------------------|
| Drawing mechanic | Free-draw with ink limit | Free-draw with ink budget per level |
| Physics | Simple gravity + collision | Canvas 2D physics: gravity, slope detection, character slides along drawn lines |
| Scoring | 3-star (ink efficiency) | 3-star: ink used vs par, + bonus stars |
| Levels | 100+ (too many) | 30 levels, 5 tiers of 6, carefully designed |
| Chapters/Themes | 5-10 themes | 5 themes: Forest, Desert, Ice, Lava, Space |
| Hints | Show partial bridge | Show optimal path ghost |
| Undo | Full undo stack | Undo last stroke + clear all |
| Ads | Aggressive interstitials | Monetag interstitial on level complete only |
| Sound | Simple effects | Web Audio BGM + 6 SFX types |

## Market Gaps (Our Opportunity)

1. **Named chapters/worlds** — Most competitors just have numbered levels. We'll have themed worlds.
2. **Clean ad experience** — Competitors are "ad farms". We'll show interstitial only on level complete, not mid-gameplay.
3. **Browser-based** — All top competitors are mobile-only. No quality browser clone exists.
4. **Ink budget scoring** — 3-star system tied to ink efficiency adds replay value.
5. **Daily challenge** — None of the top 3 have this.
6. **Progressive mechanics** — Introduce new elements per tier (moving platforms, breakable ground, wind).

## Design Spec for GameZipper

**Slug:** draw-bridge  
**Type:** Physics drawing puzzle  
**Canvas:** 2D Canvas with custom physics (gravity, slope, collision)  
**Levels:** 30 levels across 5 tiers (6 per tier)  
**Mechanics:**
- Free-draw bridge lines with mouse/touch
- Character (ball/vehicle) rolls along drawn lines using gravity
- Must reach the flag/goal on the other side
- Limited ink budget per level (less ink = more stars)

**Tier Mechanics:**
- T1 (L1-6): Simple gaps, straight bridges
- T2 (L7-12): Wider gaps, obstacles mid-air
- T3 (L13-18): Moving platforms
- T4 (L19-24): Breakable platforms
- T5 (L25-30): Wind + combined mechanics

**Scoring:** 3 stars per level based on ink usage vs par
**Power-ups:** Hint (show optimal path), Undo, Clear
**Save:** localStorage with version field
**BGM:** Web Audio ambient chord loop
**SFX:** Draw, Success, Fail, Star earned, Level complete, Button click
