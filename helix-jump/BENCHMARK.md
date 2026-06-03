# Helix Jump - Competitive Benchmark Document

**Game:** Helix Jump
**Slug:** helix-jump
**Platform:** Single-file HTML5 Canvas (GameZipper.com)
**Target Audience:** US/EU casual gamers
**Document Version:** 1.0
**Date:** June 2026

---

## 1. Executive Summary

Helix Jump is one of the most addictive hyper-casual arcade games of the past decade, with the original "Helix Jump" by Voodoo surpassing **500M+ downloads** and consistently ranking in the top 10 casual charts since 2018. The genre is characterized by a falling ball that drops through a series of rotating helical platforms, requiring players to time their taps to spin the helix and guide the ball through gaps to reach the bottom.

This benchmark analyzes the top 4 competitors in the Helix Jump space: **Helix Jump (Voodoo)**, **Helix Stack Jump (CrazyGames)**, **Color Helix: Smash Jump (Playgama/GreeMead)**, and **Helix Jump 2 (Voodoo sequel)**.

### Why Helix Jump is a strong GZ gap pick
- **Zero overlap**: GameZipper has 227 games but **NO Helix Jump** equivalent
- **Massive SEO volume**: "helix jump", "helix jump 2", "color helix jump" all 100K+ monthly searches
- **High session length**: 30s-3min per run, perfect for ads
- **Single-file Canvas implementation**: ideal fit
- **S-tier retention**: "one more try" loop with leaderboards

---

## 2. Competitor Comparison Table

| Feature | Helix Jump (Voodoo) | Helix Stack Jump | Color Helix: Smash Jump | Helix Jump 2 |
|---------|---------------------|------------------|-------------------------|--------------|
| **Perspective** | 3D vertical falling | 3D vertical falling | 3D vertical with color | 3D vertical falling |
| **Mechanic** | Tap to rotate helix 90° | Tap to rotate helix | Tap to rotate + color match | Tap to rotate + power-ups |
| **Platforms** | ~30-50 levels (endless-feel) | ~20-40 levels | Color-graded 30 levels | 100+ levels with bosses |
| **Camera** | Side view, follows ball | Same | Same + color tween | Same + zoom on bosses |
| **Scoring** | 1 pt per platform passed | 1 pt + combo for streaks | Points × color streak | Points + bonuses |
| **Power-ups** | None (vanilla) | None | Color bomb | Speed boost, slow-mo, shield |
| **Lives/Continues** | 1 continue via ad | 1 ad continue | 2 continues | 3 continues |
| **Obstacles** | Red zones (instant death) | Same + spikes | Same + red/black gaps | Red zones + moving obstacles |
| **Difficulty Curve** | Accelerates every 5 levels | Linear ramp | Steep jumps every 10 levels | Stage-based |
| **Visual Style** | Neon glow, dark bg, simple | Bright gradient | Color-saturated VFX | Polished 3D particles |
| **Music/SFX** | Bouncy synth + thud | Bouncy + chimes | EDM + whoosh | Orchestral + impact |
| **Leaderboard** | None | Local + global | Local + global | Local + global |
| **Skin/Themes** | 6+ ball skins | 4 themes | 12+ color skins | 20+ ball skins |
| **Monetization** | Interstitial every 2 deaths + rewarded | Interstitial + rewarded | Rewarded heavily | All of the above |
| **Tap Feedback** | Haptic + rotate animation | Same | Color burst | Particles + screen shake |
| **Game Over** | Fall to void OR hit red | Same | Same | Same + boss collision |
| **Tutorial** | 5s overlay, skippable | Same | Same | Same |

---

## 3. Feature Matrix: Must-Have vs Nice-to-Have

### Must-Have (MVP for Helix Jump on GZ)

| Feature | Priority | Notes |
|---------|----------|-------|
| 3D-look vertical falling ball | Critical | Pseudo-3D via Canvas perspective transform |
| Tap/click to rotate helix 90° | Critical | Core one-button mechanic |
| Helix platforms with gaps | Critical | Each level has rotating segments |
| Red "death" zones | Critical | Must avoid or game over |
| Score = platforms passed | Critical | Drives replay |
| Combo multiplier (consecutive passes) | High | Adds depth |
| Procedural helix generation per run | Critical | Fresh feel each play |
| Camera follows ball smoothly | Critical | Visual flow |
| Death animation (shatter particles) | High | Dopamine hit |
| Best score (localStorage) | Critical | Retention |
| Touch + mouse + keyboard space | Critical | Cross-platform |
| 60fps animations | High | Quality perception |
| Restart button | Critical | Flow |
| Main menu → Game → Game Over flow | Critical | Standard loop |
| Mobile responsive (portrait 390x844 + landscape) | Critical | Helix is portrait-friendly |
| Sound effects: tap, pass, die, score | High | Feedback |
| Neon/dark gradient visual style | High | Genre standard |

### Nice-to-Have (Stretch)

| Feature | Priority | Notes |
|---------|----------|-------|
| Ball skin selection (5+ skins) | Medium | Persistence + replay value |
| Power-ups (slow-mo, shield) | Medium | Adds variety |
| Color-cycling helix (Color Helix style) | Medium | Visual delight |
| Global leaderboard (mock) | Low | Local-only is fine |
| Achievement system (10 levels) | Medium | Retention |
| Daily challenge seed | Low | Streak hook |
| Particle trail on ball | Medium | Polish |
| Haptic feedback on tap | Low | Mobile only |

---

## 4. Scoring Formulas (derived from competitors)

- **Per platform passed**: +1 base point
- **Combo multiplier**: starts at ×1, +0.5 per consecutive pass within 0.8s, caps at ×5
- **Level bonus**: every 10 platforms = +50 bonus
- **Color streak** (if implemented): matching ball color to helix color = ×2 for that platform
- **High score**: persisted in localStorage `helix_jump_v1_highscore`

---

## 5. Difficulty Curve (30+ levels, designed)

| Level Range | Gap Width | Rotation Speed | Red Zone Density | Speed Multiplier |
|-------------|-----------|----------------|------------------|------------------|
| 1-5 | 50% | 1.0x | 0% | 1.0x |
| 6-10 | 40% | 1.1x | 10% | 1.0x |
| 11-15 | 35% | 1.2x | 20% | 1.15x |
| 16-20 | 30% | 1.3x | 30% | 1.25x |
| 21-25 | 25% | 1.4x | 40% | 1.35x |
| 26-30 | 20% | 1.5x | 50% | 1.5x |

Procedural variation per run keeps every attempt fresh while the meta-level difficulty is the win condition.

---

## 6. SFX & BGM Requirements

- **BGM**: Energetic synthwave / EDM, 90-120 BPM, loop-friendly
- **Tap sound**: short bouncy "tick" (Web Audio API, sine 800Hz, 60ms decay)
- **Pass sound**: soft "whoosh" (filtered noise, 200ms)
- **Score combo**: ascending chime (sine 600→1200Hz, 200ms)
- **Death sound**: low boom + shatter (sawtooth 100Hz, 300ms + white noise burst)
- **Level complete**: bright arpeggio (3-note major chord)

---

## 7. Visual Style Guide

- **Background**: Dark gradient (deep purple → black), with subtle radial pulse from center
- **Helix platforms**: Neon cyan / magenta / yellow alternating, with white emissive edge
- **Death zones**: Bright red with dark red border, slight pulse animation
- **Ball**: Bright orange/pink with glow trail
- **UI**: Glassmorphism panels, white text with subtle text-shadow
- **Particles**: Ball trail (small white), death burst (red shards), score pickup (yellow stars)

---

## 8. Files to Produce

- `/home/msdn/gamezipper.com/helix-jump/index.html` (self-contained, ≥30KB)
- `/home/msdn/gamezipper.com/helix-jump/icon.png` (RunningHub generated, 512x512)
- `/home/msdn/gamezipper.com/helix-jump/og-image.png` (RunningHub generated, 1200x630)
- All images embedded as base64 in index.html (single-file architecture)

---

## 9. Acceptance Criteria

- [ ] All 30 levels completable (no impossible levels)
- [ ] All S-grade checklist items from pipeline prompt met
- [ ] Score system works (base + combo + bonus)
- [ ] Game over → restart flow works
- [ ] localStorage high score persists
- [ ] Sound toggle works
- [ ] Touch + mouse + space key all work
- [ ] Mobile portrait + landscape both render correctly
- [ ] 60fps on modern devices
- [ ] No memory leaks on cleanup
- [ ] JSON-LD, OG tags, analytics, canonical URL all present
- [ ] Art assets from RunningHub embedded
- [ ] BGM + 5+ SFX programmatically generated
