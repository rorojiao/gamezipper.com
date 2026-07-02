# BENCHMARK: Color Switch vs Competitors

## Game: Color Switch (#521)
**Type**: Arcade/Tap-Timing Game
**Core Mechanic**: Vertical scroll, ball bounces, tap to jump, pass through matching color

---

## Competitor Analysis

### 1. **Color Switch (Original - Fortafy Games)**
- **Downloads**: 100M+ (Android + iOS)
- **Platform**: Mobile (iOS/Android)
- **Rating**: 4.3/5 (Google Play)
- **Core Loop**: Ball bounces, tap to jump, change color on bounce, pass through matching color
- **Levels**: 50+ levels in campaign + endless mode
- **Difficulty**: Very steep, requires precise timing
- **Monetization**: Ads (interstitial every 3-5 deaths) + IAP ($0.99 to remove ads)
- **Strengths**: Simple concept, addictive, clear progression
- **Weaknesses**: Very hard, many players quit early, outdated graphics

### 2. **Color Switch 2 (Sequels)**
- **Features**: Better graphics, power-ups, new obstacle types
- **Monetization**: Aggressive ads (interstitial + rewarded video)
- **Performance**: Higher file size (~80MB)

### 3. **Geometry Dash (RobTop Games)**
- **Downloads**: 200M+ (all platforms)
- **Type**: Rhythm-based platformer, similar tap-timing
- **Strengths**: Music sync, community levels, editor
- **Weaknesses**: Much more complex, side-scrolling, not pure color match
- **Monetization**: $1.99 premium (no ads)

### 4. **Bounce Master (Tap Tap Games)**
- **Type**: Vertical bounce, similar mechanics
- **Downloads**: 10M+
- **Rating**: 4.0/5
- **Strengths**: Cleaner UI, fewer ads, easier early levels
- **Weaknesses**: Less polished than Color Switch original

### 5. **Ball Hop (Ketchapp)**
- **Type**: Vertical stack jump, similar feel
- **Downloads**: 50M+
- **Strengths**: Very simple, instant replay, fast load
- **Weaknesses**: No color mechanic, pure timing

---

## Gap Analysis for GameZipper Version

| Feature | Competitor | Our Opportunity |
|---------|-----------|-----------------|
| **File Size** | 80MB+ (mobile apps) | **40-50KB single-file HTML5** - instant load, no download |
| **Platform** | Mobile only (iOS/Android) | **Cross-platform** - browser, mobile, desktop, tablet |
| **Difficulty Curve** | Very steep, 50%+ quit L1-10 | **5 tiers, gradual difficulty** - tutorial → master |
| **Level Count** | 50+ levels | **30 levels** (6 per tier) - focused, replayable |
| **Ads Integration** | Aggressive interstitials | **Monetag non-intrusive** - banner/native + interstitial on pause |
| **Accessibility** | Touch only, no desktop | **Touch + Click** - works on all devices |
| **Offline Play** | Yes (downloaded app) | **Yes** (single-file HTML5, no network) |
| **Performance** | Native app (60fps) | **Canvas 2D (60fps optimized)** - lazy load, efficient rendering |
| **SEO** | N/A (app store) | **Full SEO** - meta tags, OG images, structured data |
| **Social** | Limited (leaderboards) | **Social sharing** - OG images, direct URL sharing |

---

## Key Mechanics to Implement

### Core Loop (from Color Switch original)
```
1. Ball starts at bottom, auto-bounces on platforms
2. Tap anywhere → ball jumps upward (additive to bounce)
3. Ball bounces on platform → color changes
4. Obstacle rings/bars rotate/move vertically
5. Ball collides with same color → pass through
6. Ball collides with different color → fail (restart level)
7. Reach finish line (top of level) → level complete
```

### Design Decisions
- **Camera Follow**: Smooth interpolation, 100px padding above ball
- **Color Set**: 4 colors per tier (simplifies logic, easier to distinguish)
  - T1: Neon (pink #FF6B9D, blue #4D9EFF, green #50E3C2, yellow #FFD93D)
  - T2: Candy (red #FF6B6B, purple #9B59B6, orange #F39C12, teal #1ABC9C)
  - T3: Galaxy (cyan #00D2D3, magenta #FF6F91, lime #7BED9F, gold #F9CA24)
  - T4: Industrial (slate #34495E, copper #D35400, steel #7F8C8D, bronze #A0522D)
  - T5: Cosmic (rainbow cycling, neon #FF007F, #00FF7F, #7F00FF, #FFFF00)
- **Obstacle Types**:
  - Static rings (beginner)
  - Rotating rings (easy/normal)
  - Moving vertical bars (normal/hard)
  - Multi-color rings (hard)
  - Pulsing rings (master)
- **Platform Types**:
  - Static platforms (bouncers)
  - Moving platforms (hard/master)
  - Color-specific platforms (only one color bounces, others pass through)
- **Ball Physics**:
  - Gravity: 0.5px/frame²
  - Bounce force: -12px/frame (upward)
  - Jump force: -10px/frame (tap)
  - Max velocity: 15px/frame (terminal velocity)

---

## Difficulty Curve Design

| Tier | Level | Colors | Obstacles | Scroll Speed | Par Time | Notes |
|------|-------|--------|-----------|--------------|----------|-------|
| Beginner | 1-6 | 4 | Static rings only | 2px/f | 30s | Tutorial: 1 tap per bounce, straight path |
| Easy | 7-12 | 4 | + Rotating rings (slow) | 3px/f | 45s | Timing practice, introduce angle jumping |
| Normal | 13-18 | 4 | + Moving bars | 4px/f | 60s | Precision timing, multi-ring passages |
| Hard | 19-24 | 4 | + Multi-color rings | 5px/f | 80s | Complex patterns, narrow gaps, memorization |
| Master | 25-30 | 4-5 | + Pulsing + moving platforms | 6px/f | 120s | Extreme precision, reflex-based, almost TAS |

**Star Ratings (Par-based):**
- 3★: ≤ Par time (perfect run, no mistakes)
- 2★: ≤ 1.5× Par (solid run, 1-2 mistakes)
- 1★: ≤ 2× Par (complete level, many mistakes)
- 0★: > 2× Par (failed to meet expectations)

---

## Monetization Strategy (Monetag)

### Ad Placement
- **Banner (110120)**: Fixed at bottom (gameplay continues), 320×50px
- **Native (110121)**: Recommended games panel on level-complete screen
- **Interstitial (110122)**: Show on fail > 5 deaths in same level OR level-complete (not both)

### Ad Timing
- Never interrupt gameplay (no mid-level interstitials)
- No ads on tutorial levels (1-3)
- Maximum 1 interstitial per 3 minutes of playtime

---

## Technical Performance Budget

| Metric | Target | Rationale |
|--------|--------|-----------|
| File Size | 40-50KB | Canvas physics + simple rendering |
| Load Time | < 2s (3G) | Single-file, no external deps |
| FPS | 60fps | Canvas 2D, requestAnimationFrame |
| Touch Latency | < 50ms | pointerdown event, preventDefault |
| Memory | < 30MB | No textures, Canvas-drawn shapes only |
| Battery | < 5%/min | Efficient rendering, no background work |

---

## Competitive Advantage Summary

**What makes our Color Switch better than competitors:**

1. **Instant Access** - No app store download, open in browser, play immediately
2. **Gradual Difficulty** - Tutorial → master curve, not impossible from L1
3. **Clean Ad Experience** - Monetag non-intrusive, no forced video ads
4. **Cross-Platform** - Works on phone, tablet, desktop (touch + click)
5. **SEO-Friendly** - Discoverable via search, shareable URLs
6. **Performance** - 40KB vs 80MB mobile apps, faster load, less data
7. **Free Forever** - No IAP, no premium version, completely free

**Target Audience:**
- Mobile players (casual, 15-45 age, 60/40 M/F)
- Browser gamers (desktop/laptop)
- Students (quick break game)
- Commuters (offline play, no internet needed after load)

**Expected Engagement:**
- Session length: 5-15 minutes
- Retention D1: 25% (typical for puzzle/arcade)
- Retention D7: 12%
- Avg levels completed: 8-12 before churn
- Return rate: 30% (replay favorite levels)