# Sokoban Game Competitive Benchmark

## Project Context
- **Game**: Sokoban (推箱子)
- **Type**: Browser-based HTML5 Canvas puzzle game
- **Target Audience**: 欧美 (Western) market
- **Visual Style**: Dark/neon GameZipper style
- **Project Path**: `/home/msdn/gamezipper.com/sokoban/`

---

## 1. Top Sokoban Browser Games

### 1.1 CrazyGames - Sokoban
| Attribute | Value |
|-----------|-------|
| **Rating** | 8.4/10 (300 votes) |
| **Levels** | 20 challenging levels |
| **Developer** | Reinout Stevens |
| **Release Date** | September 2018 |
| **Technology** | HTML5 |
| **Platforms** | Browser (desktop, mobile), CrazyGames App |
| **Price** | Free |

**Features:**
- Move counter saved per level
- Undo moves feature
- Replay any level
- Goal tile highlighting (press H)
- Controls: Arrow keys/WASD, U=undo, R=restart, H=highlight

### 1.2 Poki - Jelly Sokoban
| Attribute | Value |
|-----------|-------|
| **Rating** | 4.0/5 (31,765 votes) |
| **Levels** | ~600 puzzles |
| **Developer** | Beedo Games |
| **Technology** | Unity/HTML5 |
| **Platforms** | Browser, Poki App |

**Features:**
- Colorful jelly-themed graphics
- 3D-style visuals
- Mobile-optimized touch controls
- Nearly 600 levels (massive content library)

### 1.3 Other Notable Browser Variants
- **BoxRob Series** (Poki): Robot-themed Sokoban with 3D graphics
- **Box Kid Puzzles** (Poki): Kid-friendly block pushing
- **SimpleSokoban.com**: Minimalist classic implementation
- **Sokoban Online**: Web-based with community levels

---

## 2. Popular Sokoban Mobile Apps

### iOS App Store Data
| App Name | Rating | Votes |
|----------|--------|-------|
| Classical Sokoban+puzzle game | 4.53 | 611 |
| Simply PushBox | 4.71 | 369 |
| Sokoban Puzzle Game | 4.78 | 9 |
| Sokoban Push Puzzle | 4.50 | 52 |
| Sokoban Touch | 4.00 | 9 |

### Android Market Observations
- Most Sokoban apps are free with ads
- "Sokoban Classic" style apps dominate rankings
- Typical monetization: interstitial ads + optional premium removal

---

## 3. Key Game Features Analysis

### 3.1 Level Count & Difficulty Progression

| Game | Total Levels | Difficulty Progression |
|------|-------------|----------------------|
| CrazyGames Sokoban | 20 | Linear, increasing complexity |
| Jelly Sokoban | ~600 | Tiered packs, gradual difficulty |
| Original Sokoban (1982) | 20 | Linear, designed by experts |
| Microban Level Set | 149 | Graded A-D (easy to expert) |

**Benchmark Finding**: 
- Entry-level games: 10-30 levels
- Mid-tier games: 50-150 levels  
- Premium games: 500+ levels
- **Recommendation for GameZipper**: Start with 50-100 levels, expandable architecture

### 3.2 Undo/Redo Systems

| Implementation | Availability |
|---------------|-------------|
| CrazyGames Sokoban | U key = unlimited undo |
| Jelly Sokoban | Full undo support |
| Mobile apps | Almost universal undo |
| Classic implementations | Often limited or none |

**Industry Standard**: Unlimited undo is now expected. Redo less common but valued.

### 3.3 Star Rating Systems

| Pattern | Description |
|---------|-------------|
| Move-based | 3 stars = par moves, 2 = 1.5x par, 1 = completed |
| Time-based | Faster completion = more stars |
| Push efficiency | Fewer pushes = higher rating |
| Combined | Mix of moves + time |

**Typical 3-Star Scale (Sokoban Touch)**:
- 3 stars: Optimal/efficient solution
- 2 stars: Good solution within放宽 limits
- 1 star: Level completed

### 3.4 Hint Systems

| Game | Hint Type |
|------|-----------|
| CrazyGames | Goal tile highlighting (H key) |
| Jelly Sokoban | Visual cues on goals |
| Mobile apps | Pay-for-hints, level skip |

**Observation**: Hint systems vary widely. Most browser games offer basic visual hints; premium hints are monetization opportunities.

### 3.5 Level Editor

| Status | Games |
|--------|-------|
| Built-in editor | Sokoban 2 (1984), many modern variants |
| Import levels | Community submissions, standard formats |
| No editor | Most casual browser games |

**Standard Format**: `.sok` or text-based level definitions

### 3.6 Visual Themes/Styles

| Theme | Characteristics | Market |
|-------|-----------------|--------|
| Classic/Retro | Pixel art, simple colors | Niche/retro fans |
| Neon/Cyberpunk | Dark bg, glowing elements | Modern casual |
| 3D Isometric | Depth, shadows | Popular on mobile |
| Cute/Jelly | Soft colors, characters | Casual market |
| Minimalist | Clean, geometric | Puzzle purists |

**GameZipper Direction**: Dark/neon aligns with Jelly Sokoban's success on Poki and modern visual trends.

### 3.7 Controls

| Input Method | Platforms | Notes |
|--------------|-----------|-------|
| Arrow keys | Desktop | Standard |
| WASD | Desktop | Alternative |
| Touch/swipe | Mobile | Swipe or tap direction |
| D-pad buttons | Mobile | On-screen controls |
| Keyboard shortcuts | Both | U=undo, R=restart, H=hint |

**Recommendation**: Support all input methods for maximum accessibility.

### 3.8 Save/Progress Systems

| Method | Implementation |
|--------|---------------|
| LocalStorage | Browser standard, persists locally |
| Cloud save | Premium feature, cross-device |
| Progress indicators | Level select with completion markers |
| Per-level stats | Moves, time, stars saved |

### 3.9 Timer/Move Counter Systems

| Feature | Usage |
|---------|-------|
| Move counter | Almost universal - saves per level |
| Timer | Optional, for speedrunners |
| Push counter | Sometimes separate from steps |
| Best score tracking | Motivates replay |

**CrazyGames Implementation**: Each level saves movement counts for personal best tracking.

---

## 4. Core Sokoban Mechanics Standards

### 4.1 Grid Sizes

| Size | Classification | Common Use |
|------|---------------|------------|
| 6x6 | Small/tiny | Tutorial, kids |
| 7x7 | Small | Easy levels |
| 8x8 | Medium | Standard beginner |
| 9x9 | Medium | Intermediate |
| 10x10 | Standard | Most common |
| 11x11 | Large | Advanced |
| 12x12 | Large/expert | Expert levels |
| 13x13+ | Very large | Rare, extreme |

**Industry Standard**: 8x8 to 10x10 grids most common in modern implementations.

### 4.2 Box/Goal Counts

| Box Count | Difficulty | Notes |
|-----------|------------|-------|
| 1-2 | Tutorial | Very easy |
| 3 | Easy | Beginner friendly |
| 4 | Medium | Standard |
| 5 | Hard | Requires planning |
| 6-8 | Expert | Near-impossible for some |
| 9+ | Extreme | Only for masters |

**Key Rule**: Number of boxes always equals number of goals (fundamental Sokoban constraint).

### 4.3 Standard Level Sets

| Level Set | Levels | Author | Characteristics |
|-----------|--------|--------|------------------|
| Original | 20 | Hiroyuki Imabayashi | The classic, moderate difficulty |
| Microban | 149 | David Skinner | Graded difficulty, popular |
| Microban II | 50 | David Skinner | Continues progression |
| Scandinavian | 22 | Aymeric du Peloux | Art-themed |
| Sasquatch | 52 | David Skinner | Large grids |
| Laboratory | 100+ | various | Technical/difficult |

**Level Format Standard** (text-based):
```
#####
#.@.#
#.$.#
#..###
#*$.#
#..@.#
#####
```
Legend: `#`=wall, `.`=goal, `@`=player, `$`=box, `*`=box on goal, `+`=player on goal

---

## 5. Revenue/Monetization Patterns

### 5.1 Browser Game Monetization

| Model | Implementation | Frequency |
|-------|---------------|-----------|
| Display ads | Banner/interstitial | Very common |
| Rewarded video | Hint skip, continue | Common |
| Affiliate | Game recommendations | Standard |
| Premium version | Ad-free, extra levels | Rare |

### 5.2 Mobile App Monetization

| Model | Implementation |
|-------|---------------|
| Free + ads | Standard, ad-supported |
| Premium ($1-5) | One-time purchase |
| IAP for hints | Currency-based hint system |
| Season passes | Level packs |
| Subscription | Premium game bundles |

### 5.3 Industry Observations

- Sokoban games rarely achieve top-grossing status
- Casual puzzle genre is saturated
- Differentiation through visual style and UX
- Level quality matters more than quantity for retention
- Undo/hint monetization is common in mobile

---

## 6. Strategic Recommendations for GameZipper

### 6.1 Feature Priority Matrix

| Feature | Priority | Effort | Impact |
|---------|----------|--------|--------|
| Core Sokoban mechanics | P0 | High | Essential |
| Touch + keyboard controls | P0 | Medium | Mobile reach |
| 50+ well-designed levels | P0 | High | Content |
| Move counter + undo | P0 | Low | Core UX |
| LocalStorage save | P1 | Low | Retention |
| Star rating system | P1 | Low | Replay value |
| Dark/neon visual theme | P1 | Medium | Brand alignment |
| Goal highlighting | P2 | Low | Accessibility |
| Level select UI | P2 | Medium | Navigation |
| Level editor (future) | P3 | High | Community |

### 6.2 Technical Specifications

| Spec | Recommendation |
|------|----------------|
| Grid size range | 7x7 to 10x10 |
| Level count (launch) | 50 levels |
| Level count (expandable) | 100+ via content updates |
| Box count per level | 2-5 typical |
| Save system | LocalStorage |
| Input | Arrow/WASD + touch |
| Target frame rate | 60 FPS |

### 6.3 Competitive Differentiation

1. **Dark/neon visual style** - Stand out from retro clones
2. **Smooth animations** - Polished feel vs. basic implementations
3. **Touch-first design** - Better than keyboard-only competitors
4. **Undo granularity** - Instant, unlimited undo
5. **Progress sync** - LocalStorage persistence
6. **Level quality** - Fewer, well-crafted levels vs. many mediocre ones

---

## 7. References & Sources

- CrazyGames Sokoban: https://www.crazygames.com/game/sokoban
- Jelly Sokoban (Poki): https://poki.com/en/g/jelly-sokoban
- Sokoban Wikipedia: https://en.wikipedia.org/wiki/Sokoban
- iOS App Store search data (May 2025)
- GameZipper internal game standards

---

*Document Version: 1.0*  
*Generated: May 2025*  
*Author: GameZipper Research Agent*
