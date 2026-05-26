# Rubik's Cube Web Games Competitive Benchmark

## Executive Summary

This benchmark analyzes four major Rubik's Cube browser games to inform feature decisions for a new competitive offering:
- **Coolmath Games Rubik's Cube** (coolmathgames.com/0-rubiks-cube)
- **Ruwix.com Online Rubik's Cube Simulator** (ruwix.com)
- **GRubiks - Google's Rubik's Cube** (gubikscube.web.app) - Note: site appears to be **discontinued/delisted**
- **Rubiks-Cube-Solver.com** (rubiks-cube-solver.com)

---

## 1. Feature Comparison Table

| Feature | Coolmath Games | Ruwix.com | GRubiks | rubiks-cube-solver.com |
|---------|---------------|-----------|---------|------------------------|
| **3D Rendering** | CSS 3D transforms | WebGL (Three.js likely) | Discontinued | Canvas 2D / WebGL hybrid |
| **Cube Sizes** | 3x3 only | 2x2, 3x3, 4x4, 5x5, 6x6 | N/A | 3x3 only |
| **Timer** | Yes | Yes | N/A | No |
| **Move Counter** | No | Yes | N/A | No |
| **Scramble Generator** | Yes | Yes | N/A | Yes |
| **Solve Helper / Solver** | No | No | N/A | Yes (camera-based) |
| **Algorithm Guide** | No | Yes (CFMOP, OLL, PLL) | N/A | Yes (step-by-step) |
| **Undo/Redo** | No | Yes | N/A | No |
| **Pattern Modes** | No | Yes (checkerboard, cross patterns) | N/A | No |
| **Mobile Touch Controls** | Basic swipe | Gesture-based face rotation | N/A | Camera + tap |
| **Desktop Controls** | Click/drag | Click + keyboard | N/A | Click |
| **UI Style** | Playful, minimal, cartoon | Educational, detailed | N/A | Tool-focused, utilitarian |
| **Monetization** | Ad-supported (Coolmath premium) | Ad-supported / freemium | N/A | Freemium (premium solver) |
| **Social Features** | None | Leaderboard (basic) | N/A | None |
| **Best Times Storage** | No | LocalStorage | N/A | No |

---

## 2. Must-Have Features (MVP)

Based on this competitive analysis, an MVP should include:

### Core Interactivity
- **3D WebGL rendering** with smooth 60fps rotation and face turns
- **Click + drag** face rotation (desktop)
- **Swipe gesture** face rotation (mobile)
- **Scramble generator** with configurable move count (20-25 moves standard)
- **Timer** starting on first move, stopping on solve
- **Move counter** displayed during solve

### UX Essentials
- **Visual feedback**: face colors highlight on hover, smooth animations
- **Responsive layout**: works on desktop and mobile without horizontal scroll
- **Keyboard shortcuts**: U/D/L/R/F/B + ' for clockwise/counterclockwise
- **Instant reset** to solved state
- **New scramble** button

### Solve Support
- **Hint system**: show next correct move
- **Undo** last move (essential for learning)
- **Step-back** to beginning

### Persistence
- **Best time** stored in LocalStorage
- **Session history** of solve times

---

## 3. Nice-to-Have Features

These differentiate a good product from a great one:

### Advanced Features
- **Multiple cube sizes**: 2x2, 3x3, 4x4 (high demand from power users)
- **Algorithm library**: beginner method (CFOP), OLL/PLL trainer
- **Pattern modes**: checkerboard, cube-in-cube, cross patterns
- **Achievements**: sub-60, sub-30, first solve, etc.
- **Practice modes**: focus on specific algorithm groups (F2L, OLL, PLL)

### Technical Differentiators
- **Voice control** (emerging UX pattern)
- **AR solve** using device camera (rubiks-cube-solver.com does this)
- **Ghost cube** overlay showing target state
- **Speed analysis**: break down solve into F2L/LL/ CROSS phases
- **3D replay** playback of solve

### Social/Engagement
- **Leaderboard** (global or friends)
- **Daily challenge** scrambles
- **Share results** as image/card
- **Progression system** (badges, ranks)

---

## 4. Recommended Feature Set for Our Game

### Phase 1: Core MVP (Recommended to Build First)
```
- 3D WebGL cube (Three.js) with realistic textures
- 3x3 only (simplest to perfect)
- Click-drag face rotation
- Touch swipe for mobile
- Keyboard shortcuts (U D L R F B)
- Scramble button (20-move standard)
- Timer + move counter
- Undo last move
- Reset to solved
- Best time (LocalStorage)
- Clean, modern dark theme UI
```

### Phase 2: Enhanced (After Core Launch)
```
- 2x2, 4x4, 5x5 cube sizes
- Algorithm guide / beginner tutorial
- Pattern modes
- Daily challenge scrambles
- Best times leaderboard
- Firstsolve achievement + more badges
```

### Phase 3: Advanced (Differentiator)
```
- Solve helper (hint next move)
- Phase analysis (CROSS, F2L, LL breakdown)
- 3D replay of solves
- Voice commands
- AR solve mode
```

---

## 5. Competitive Gap Analysis

| Competitor | Strength | Gap We Can Fill |
|-----------|----------|----------------|
| **Coolmath Games** | Simple, fast load, kid-friendly | No timer/move counter, only 3x3 |
| **Ruwix.com** | Comprehensive features, multiple sizes, algorithm guide | Dated UI, complex for beginners, ads-heavy |
| **GRubiks** | Google brand, likely polished | **DISCONTINUED** - opportunity exists |
| **rubiks-cube-solver.com** | Camera AR solver is innovative | 2D only, confusing UI, poor 3D |

**Key Opportunity**: No competitor offers a modern, polished 3D experience with timer + move counter + hint system + clean UI. Ruwix has features but is dated. We can own the "modern trainer" position.

---

## 6. Technical Stack Recommendations

Based on competitor analysis:

- **Rendering**: Three.js (WebGL) - powers Ruwix, industry standard
- **Controls**: Hammer.js for gesture recognition OR custom touch handlers
- **State Management**: Simple vanilla JS (cube state is 54 facelets array)
- **Persistence**: LocalStorage for times/preferences
- **Animations**: GSAP or Three.js built-in for smooth face rotations
- **Monetization**: Optional premium for 4x4+ sizes, ads for free tier

---

## 7. Sources & Research

- Coolmath Games Rubik's Cube: https://www.coolmathgames.com/0-rubiks-cube
- Ruwix Online Simulator: https://ruwix.com/the-rubiks-cube/
- GRubiks (Google): https://gubikscube.web.app - **SITE DISCONTINUED**
- Rubik's Cube Solver: https://rubiks-cube-solver.com
- Additional competitor intelligence from web search 2024-2025

---

*Last Updated: May 2026*
*Note: GRubiks (Google) appears to be delisted/discontinued - the Firebase hosting shows "Site Not Found" and Wayback Machine shows limited archive data. This may represent an opportunity to capture displaced users seeking a Google-branded experience.*
