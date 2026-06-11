# BENCHMARK.md — Draw Bridge Puzzle Competitor Analysis

## Executive Summary

7 primary competitors analyzed in the "draw bridge / drawing physics puzzle" genre.

**Genre splits into 3 sub-genres:**
1. **Draw-to-Bridge / Path Drawing** (direct) — Draw lines to create paths/bridges for vehicles
2. **Draw-to-Protect / Shield Drawing** (adjacent) — Draw lines to shield characters from threats
3. **Lateral Thinking / Brain Teaser** (spiritual) — Unconventional interaction puzzles

---

## Key Competitors

### Draw Bridge — Puzzle Game (Eureka Studio)
- **Downloads:** High | **Rating:** 4.5+
- **Core:** Draw a single swipe path; fragile car drives along it and breaks easily from bumps
- **Levels:** 100+ | **Stars:** ⭐⭐⭐ based on efficiency
- **Art:** 2D cartoon/stickman, Japanese kawaii humor
- **Key:** "Fragile car" mechanic — high-stakes precision drawing

### Draw Bridge Puzzle (Bravestars Games)
- **Downloads:** 50M+ | **Key feature:** "Unlimited answers" per level
- **Levels:** 100+ | No time limit
- **Art:** Colorful 2D cartoon, polished

### Save the Doge (Miracle Games)
- **Downloads:** 80M+ | **Stars:** ⭐⭐⭐ ink efficiency
- **Levels:** Hundreds across chapters
- **Tutorial:** Industry-best — Level 1 impossible to lose, animated finger guides
- **Key:** Observe behavior after drawing (bees interact with shield)

### Happy Glass (Lion Studios)
- **Downloads:** Very High | **Stars:** ⭐⭐⭐ ink efficiency
- **Levels:** 700+ | Draw lines to redirect water into glass
- **Key:** Ink-based scoring creates dual challenge

### Brain It On! (Orbital Nine)
- **Core:** Freeform drawing — ANY shape becomes physics object
- **Stars:** ⭐⭐⭐ | Community levels + level editor
- **Key:** True freeform physics, social solution sharing

---

## Design Decisions for Draw Bridge Puzzle

### Scoring: 3-Star Precision System
- Less ink/shorter path = more stars
- Drives replay and engagement

### Tutorial: Save the Doge Pattern
- Level 1: impossible to lose
- Animated finger guides
- First 3-8 levels introduce ALL core mechanics one at a time

### Level Design Philosophy
- Non-linear difficulty — intersperse easy "relief" levels
- Multiple valid solutions per level
- Obstacle escalation: Single gap → Moving obstacles → Multiple hazards → Combined threats
- Minimum 30 levels at launch

### Art Direction
- 2D cartoon with stickman/minimalist style
- Character personality (fragile car) for emotional investment
- Clean backgrounds, neon accents (GameZipper dark theme)

### Systems to Implement
1. ✅ 3-star scoring (ink efficiency)
2. ✅ Level progression with star-based unlocking
3. ✅ Hint system (show partial solution)
4. ✅ Progress save (localStorage with version)
5. ✅ Tutorial levels (first 5 levels)
6. ✅ Satisfying fail animations
7. ✅ Sound effects (Web Audio API)
8. ✅ BGM (Web Audio API procedural)
9. ✅ Responsive (desktop + mobile)
10. ✅ Touch support

---

*Generated: June 12, 2026 | gamezipper.com*
