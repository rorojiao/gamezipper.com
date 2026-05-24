# Hidden Object Games - Competitive Benchmark Report

**Game Category:** Hidden Object / Hidden Object Adventure
**Benchmark Date:** 2026-05-24
**Target Spec:** Single-file HTML5 Canvas game, 30+ levels, 5+ themed categories, procedural drawing, ~50-70KB
**Sources Analyzed:** Poki, CrazyGames, Hidden4Fun, Yandex Games, Wellgames, G5 Games

---

## 1. Executive Summary

Hidden Object is a well-established browser game category with proven player retention and monetization. The genre centers on finding specific items hidden within illustrated scenes under time pressure. Key differentiators include scene artwork quality, hint system generosity, scoring depth, and progression hooks (level unlocks, achievements, daily puzzles). For a procedural Canvas-drawn implementation, the genre is highly achievable.

---

## 2. Top Hidden Object Games Analyzed

### Game 1: Hidden Objects by Morion Studio (CrazyGames)
- **Rating:** 9.0/10 (5,595 ratings) | April 2024
- **Description:** Beautifully crafted interiors concealing diverse items
- **Features:** Clean illustrated scenes, click-to-find mechanics, themed rooms, hint system, progress tracking
- **Monetization:** Ad-supported free-to-play

### Game 2: Where Is? Find Hidden Objects by Unico Studio (Poki)
- **Likes:** 13.3K | 4.3K dislikes
- **Description:** Scavenger hunt with vibrant pictures, multiple worlds, timed mode
- **Features:** Click/tap select, timed mode, multiple themed worlds, cross-platform

### Game 3: Hidden Objects: Island Secrets by Taming (CrazyGames)
- **Description:** Magic and time intertwine in a thrilling adventure
- **Features:** Story progression, themed levels, unlock new areas

### Game 4: Hidden Object: Clues and Mysteries (CrazyGames)
- **Description:** Charmingly illustrated cozy scenes with hidden secrets
- **Features:** Cozy aesthetic, mystery narrative

### Game 5: Scavenger Hunt - Hidden Items (CrazyGames)
- **Description:** Search unique levels, uncover treasures, unlock areas
- **Features:** Detective theme, level progression, unlock system

### Game 6: Find Me: Lost Objects (CrazyGames)
- **Description:** Octo the Octopus quest through underwater and space realms
- **Features:** Character-driven, multiple themed environments

### Game 7: Find It: Hidden Object Puzzle (CrazyGames)
- **Description:** Relaxing detective-style hidden item search
- **Features:** Clever camouflage, beautiful scenes

### Games 8-10 (Hidden4Fun platform):
- **Misty Peaks:** Mountain village, bamboo, clouds
- **Legacy of the City:** Hidden alleys, mystery adventure
- **Grandma and Me:** Cozy home/family setting

---

## 3. Level Structure

### 3.1 Typical Level Counts
| Game Type | Levels |
|-----------|--------|
| Casual hidden object | 20-50 |
| Story-driven adventure | 30-100+ |
| Mobile with map progression | 100+ |
| **Target for GameZipper** | **30+** |

### 3.2 Objects Per Level
| Difficulty | Objects |
|------------|---------|
| Easy/Early | 5-8 |
| Medium | 8-12 |
| Hard/Late | 12-20 |
| Extreme | 20-30 |

Most browser games use 8-12 objects per level as sweet spot for 60-120 second rounds.

### 3.3 Time Limits
| Mode | Time |
|------|------|
| Zen mode | No limit |
| Standard | 90-180s |
| Hard | 60-120s |
| Timed Challenge | 30-60s |

Common pattern: 120 seconds for 8-10 objects (~12-15s per object).

---

## 4. Scene Types and Categories

### 4.1 Common Categories Found

| Category | Examples | Frequency |
|----------|----------|-----------|
| Nature/Forest | Woods, gardens, farms | Very Common |
| City/Urban | Streets, shops, malls | Very Common |
| Mystery/Horror | Haunted houses, mansions | Common |
| Beach/Island | Tropical, ocean scenes | Common |
| Cozy/Home | Kitchens, bedrooms | Very Common |
| Adventure/Exotic | Temples, mountains | Common |
| Fantasy/Magical | Enchanted forests | Common |
| Seasonal | Christmas, Halloween | Periodic |

### 4.2 Target: 6 Themed Categories for GameZipper
1. Cozy Home / Kitchen
2. Garden / Nature
3. City / Shop
4. Beach / Island
5. Mystery / Mansion
6. Fantasy Forest

---

## 5. Difficulty Progression

### 5.1 Scaling Methods
| Method | Early | Late |
|--------|-------|------|
| Objects | 5-6 | 15-25 |
| Object size | Large | Small |
| Time limit | 180s | 60s |
| Scene density | Clean | Cluttered |
| Color contrast | High | Low |

### 5.2 Progression Curve
- Levels 1-5: Tutorial, 5-6 objects, 180s
- Levels 6-15: Standard, 8-10 objects, 120s
- Levels 16-25: Complex, 12-15 objects, 90s
- Levels 26-30+: Expert, 15-20 objects, 60-75s

### 5.3 Hint System
| Aspect | Standard |
|--------|----------|
| Hints per level | 2-3 |
| Recharge | 30-60 seconds |
| Watch ad | Instant refill |

Recommended for GameZipper: 3 hints, 1 recharge per 60s, or watch ad (30s).

---

## 6. Scoring System

### 6.1 Points Structure
| Component | Points |
|-----------|--------|
| Base per object | 50-100 |
| Time bonus | +10-20 per remaining second |
| Combo (3+ streak) | +10% per consecutive find |
| Perfect clear | +500 (no hints, no misses) |

### 6.2 Combo Multipliers
| Streak | Multiplier |
|--------|------------|
| 3 in a row | 1.1x |
| 5 in a row | 1.25x |
| 10 in a row | 1.5x (max 2x) |

### 6.3 Recommended Scoring for GameZipper
- Base: 100 pts per object
- Time: remaining_seconds x 10
- Combo: 1.1x per consecutive (cap 2x)
- Perfect: +500 bonus

---

## 7. Monetization and Ad Patterns

### 7.1 Ad Placement
| Location | Type | Frequency |
|----------|------|-----------|
| Between levels | Interstitial | Every 2-5 levels |
| Level complete | Rewarded (hints) | On-demand |
| Game over | Interstitial | Every failure |
| Pause menu | Banner/video | Persistent |

### 7.2 Rewarded Ads
| Reward | Duration |
|--------|----------|
| Hint refill | 15-30 sec |
| +30 seconds | 15 sec |
| 2x score | 30 sec |

### 7.3 Recommended Strategy
- No ads during gameplay
- Interstitial every 3 levels
- Rewarded: Hint refill, bonus time

---

## 8. Key Features

### 8.1 Essential (Core Loop)
- Zoom/Pan (pinch/scroll, 1.5x-2x)
- Magnifying glass cursor
- Object list (bottom bar)
- Timer with warning
- Progress bar (X/Y found)
- Hint button with counter
- Pause menu
- Scene transitions (300ms fade)

### 8.2 Engagement Features
- Daily Puzzle (1 per day)
- Achievements (5-10 badges)
- Star rating (1-3 per level)
- Coins/currency
- Level select / replay
- Sound effects toggle

### 8.3 Recommended for GameZipper
**Must Have:** 30 levels, 6 categories, timer, hints, scoring, pause, level select
**Should Have:** Daily puzzle, stars, achievements, object list states
**Nice to Have:** Zoom/pan, combo visuals, particles

---

## 9. UI/UX Patterns

### 9.1 Object List
Recommended: Bottom bar, horizontal scroll, icon + name for each target

### 9.2 Progress Display
| Element | Position | Style |
|---------|----------|-------|
| Timer | Top center | Circular countdown |
| Progress | Below timer | X/Y objects |
| Level | Top left | Level number |
| Score | Top right | Running total |

### 9.3 Scene Transitions
Fade to black (300ms) -> Scene change -> Fade in (300ms)

### 9.4 Level Complete Screen
Star rating (1-3), score breakdown, time bonus, combo bonus, total, next/replay buttons

### 9.5 Time Is Up Screen
Objects found count, score, retry button, optional hint refill via ad

---

## 10. Technical Implementation

### 10.1 Procedural Canvas Drawing
| Element | Approach |
|---------|----------|
| Background | Layered gradients, bezier curves |
| Objects | Geometric shapes + gradients |
| Camouflage | Same color family as background |
| Categories | Different palettes + shapes per theme |
| Zoom | Canvas scale transform |

### 10.2 Object Hiding Techniques
| Technique | Early Levels | Late Levels |
|-----------|-------------|-------------|
| Size | 30-50px | 15-25px |
| Color contrast | High | Low |
| Occlusion | Minimal | Heavy |
| Shape complexity | Simple | Complex |

---

## 11. Target Spec Alignment

| Spec | Benchmark | Recommendation |
|------|-----------|----------------|
| 30+ levels | 20-100 typical | 30 fits standard |
| 5+ categories | 7+ found | Use 6 categories |
| Canvas-drawn | Fully achievable | No external assets |
| Timer | 60-180s | 60-120s range |
| Hints | 2-3 per level | 3 with recharge |
| Scoring | pts+time+combo | Implement all |
| Daily puzzle | Common | Include |
| Achievements | Common | 5-10 badges |
| 50-70KB | Single-file | Lean code |

---

## 12. Recommended GameZipper Spec Summary

- **Levels:** 30
- **Categories:** 6 (Home, Nature, City, Beach, Mansion, Fantasy)
- **Objects:** 8-12 per level (scales 5 to 20)
- **Time:** 120s standard (scales 180s to 60s)
- **Hints:** 3 per level, 1 recharge/60s or watch ad
- **Scoring:** 100 base + time bonus + combo (max 2x) + perfect (+500)
- **Ads:** None during play, interstitial every 3 levels, rewarded hints/time
- **Features:** Zoom/pan, daily puzzle, 10 achievements, star ratings

---

*Sources: Poki.com, CrazyGames.com, Hidden4Fun.org, Yandex Games, Wellgames.com, G5.com*
