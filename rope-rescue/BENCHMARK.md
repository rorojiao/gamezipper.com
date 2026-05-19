# Rope Rescue Puzzle Game - Competitive Benchmark

**Version:** 1.0  
**Date:** May 2026  
**Purpose:** Guide development of a complete HTML5 Canvas rope rescue puzzle game

---

## Executive Summary

The rope-cutting/rescue puzzle genre has produced multiple hit games with 100M+ combined downloads. Core appeal: simple swipe-to-cut mechanics with physics-based problem solving. Key differentiators in successful titles include level variety, difficulty progression, and satisfying physics feedback.

**Target Game Specs:**
- 30+ levels across 5 tiers
- Verlet integration rope physics
- Swipe/draw rope cutting
- Physics obstacles (swings, bounces, gravity)
- 3-star rating system
- Hint system
- Undo/restart
- Guided tutorial (first 3 levels)
- Web Audio BGM + SFX
- Canvas procedural art (colorful, cartoon)
- Responsive (desktop + mobile)

---

## 1. Competitor Analysis

### 1.1 Rescue Cut - Rope Puzzle

**Overview:**
- **Developer:** ITI inc.
- **Downloads:** 100M+
- **Rating:** 4.0 (486K reviews)
- **Platforms:** Android, Windows
- **Genre:** Rope-cutting physics puzzle

**Core Mechanics:**
- Simple swipe gesture cuts ropes
- Character (man) tied up in room, must be rescued
- Physics-based rope simulation with gravity
- Single-finger swipe control for cutting
- Multiple ropes per level with strategic cutting order required

**Level Structure:**
- 400+ levels (based on YouTube walkthrough content showing levels 351-400)
- Levels increase in complexity through combination of:
  - Multiple ropes with different tension states
  - Swinging obstacles (blades, spikes)
  - Multiple characters to rescue
  - Moving platforms
  - Limited cuts (sometimes restricted to 1-2 cuts)

**Systems:**
- No explicit star system visible
- No hint system identified
- No tutorial - immediate gameplay
- Progress saves automatically
- Heavy ad integration (major complaint)
- In-app purchases for ad removal

**Art Style:**
- 2D stylized cartoon graphics
- Simple character designs
- Room-based level backgrounds
- Clean, minimalist visual approach
- Animated reactions when character is saved or fails

**Sound:**
- Basic sound effects for cutting
- Character vocalizations
- No persistent BGM identified

**Key Differentiators:**
- Massive level count (400+)
- "Room escape" visual theme
- One-cut puzzles in early levels
- Blade/spike hazards add danger element
- Simple, accessible controls

**Weaknesses (from user reviews):**
- Excessive ads (most common complaint)
- Levels become repetitive after 800+
- Too easy - lack of difficulty curve
- Level recycling/repetition noted

---

### 1.2 Love Pins

**Overview:**
- **Developer:** Supersonic Studios LTD
- **Downloads:** 50M+
- **Rating:** 4.2 (69K reviews)
- **Platforms:** Android, Windows
- **Genre:** Pin-pulling puzzle (similar mechanic, different theme)

**Core Mechanics:**
- Pull pins in correct order to solve puzzle
- Bring boy and girl characters together
- Physics-based pin removal triggers chain reactions
- Strategic pin order is key - wrong order causes failure

**Level Structure:**
- 200+ levels noted
- Difficulty increases through:
  - More pins to manage
  - Hazards (spikes, gaps)
  - Multiple characters
  - Timing-sensitive solutions
- User complaint: levels repeat after ~100-150

**Systems:**
- No explicit star rating system
- No hint system
- Progress auto-saves
- In-app purchases available
- "Offline" labeled capability

**Art Style:**
- Colorful 2D cartoon graphics
- Distinct boy/girl characters with animations
- Cute character reactions
- Simple backgrounds
- Character "dances" when reunited (noted in reviews)

**Sound:**
- Basic SFX
- No persistent BGM mentioned

**Key Differentiators:**
- Pin-pulling vs rope-cutting (different input)
- Romance theme (boy meets girl)
- Character animations and reactions
- Supersonic's polish and production values

**Weaknesses:**
- Levels repeat after ~100-150
- Too easy - 2-5 seconds per level
- Excessive ads
- Limited challenge

---

### 1.3 Save the Boy: Rescue Puzzle

**Overview:**
- **Developer:** Game District IT Solutions
- **Downloads:** 1M+
- **Rating:** 4.4 (1.6K reviews)
- **Platforms:** Android
- **Genre:** Rope-cutting physics puzzle

**Core Mechanics:**
- Cut ropes to release boy character
- Guide character to exit door
- Physics-based movement after cutting
- Strategic rope-cutting order required

**Level Structure:**
- Multiple levels with increasing difficulty
- Each level requires different strategy
- Obstacles and hazards introduced progressively

**Systems:**
- Finger swipe/touch controls
- Progress saving
- In-app purchases
- Ads integration

**Art Style:**
- Cartoon-style graphics
- Boy character design
- Room/exit door objectives
- Clean visual style

**Sound:**
- Basic sound effects
- No major BGM noted

**Key Differentiators:**
- Exit door as objective (different win condition visualization)
- "Bear" enemy character noted in reviews
- Less polished than Rescue Cut

---

### 1.4 Cut the Rope (Reference/Ancestor)

**Overview:**
- **Original Release:** 2010 (ZeptoLab)
- **Downloads:** 100M+ historically
- **Genre:** Physics puzzle with rope/constraint mechanics
- **Mechanic:** Cut rope to drop candy to Om Nom character

**Key Contributions to Genre:**
- Popularized physics-based rope/constraint puzzles
- Star rating system (3 stars based on score)
- Sequential level unlocks
- Collectible elements (stars)
- Tutorial integration

**Why It's Relevant:**
- Established core mechanics that inspired Rescue Cut/Love Pins
- Proved physics puzzle genre viability
- Star rating became industry standard

---

## 2. Genre Comparison

| Feature | Rescue Cut | Love Pins | Save the Boy | Target Game |
|---------|-----------|-----------|--------------|-------------|
| **Core Mechanic** | Cut rope | Pull pin | Cut rope | Cut rope |
| **Downloads** | 100M+ | 50M+ | 1M+ | - |
| **Levels** | 400+ | 200+ | 100+ | 30+ |
| **Star Rating** | No | No | No | Yes (3-star) |
| **Hint System** | No | No | No | Yes |
| **Undo/Restart** | Implicit (restart) | Implicit | Implicit | Yes |
| **Tutorial** | None | None | None | First 3 levels |
| **Physics System** | Verlet-like | Simplified | Basic | Verlet integration |
| **Obstacles** | Blades, spikes | Spikes | Various | Swings, bounces, spikes |
| **Art Style** | Stylized 2D | Cartoon 2D | Cartoon 2D | Procedural Canvas |
| **BGM** | None | Minimal | Minimal | Web Audio BGM |
| **Responsive** | Mobile-first | Mobile-first | Mobile-first | Desktop + Mobile |

---

## 3. Monetization Patterns in Genre

### 3.1 Ad-Based Monetization (Primary)

**Interstitial Ads:**
- Displayed between levels
- Most common complaint in all competitor reviews
- Users tolerate if gameplay is strong
- "Play in airplane mode" workaround commonly suggested

**Rewarded Ads:**
- Extra hints
- Skip difficult levels
- Currency/rewards
- Less intrusive than interstitials

**Ad Frequency Impact:**
- Heavy ads = negative reviews
- Players suggest ad removal IAP
- Balance needed: ads necessary for F2P but excessive alienates

### 3.2 In-App Purchases

**Common IAP Tiers:**
- Ad removal ($1-5 typical)
- Hint packs
- Level skip passes
- Cosmetic packs

### 3.3 Session Length Patterns

**Short Sessions (30 sec - 2 min):**
- One-cut puzzles complete in seconds
- Players progress rapidly
- Good for mobile commute use case
- Challenge: monetization windows are brief

**Retention Concern:**
- Players blast through levels quickly
- Without content depth, churn fast
- Level recycling (Love Pins, Rescue Cut) is a band-aid

### 3.4 Retention Mechanics

**What Works:**
1. **Level unlock progression** - dopamine from new content
2. **Star rating** - replayability for better score
3. **Hint system** - prevents hard-stuck abandonment
4. **Difficulty curve** - easy start, gradual challenge
5. **Novel obstacles** - new mechanics keep interest

**What Fails:**
1. **Level repetition** - kills long-term engagement
2. **Excessive difficulty without help** - players abandon
3. **No progress feeling** - need visible advancement
4. **Excessive ads** - primary churn driver

---

## 4. Addictive Design Patterns

### 4.1 Session Rhythm

**Ideal Session Structure:**
- Level selection (3-5 level chunk)
- 30-90 second play per level
- Interstitial ad every 3-5 levels
- Completion celebration/feedback

### 4.2 Progression Systems

**Unlock Tiers:**
- Tier 1: Tutorial (Levels 1-3)
- Tier 2: Basic mechanics (Levels 4-9)
- Tier 3: Intermediate (Levels 10-18)
- Tier 4: Advanced (Levels 19-26)
- Tier 5: Expert (Levels 27-33)

**Star Thresholds:**
- 1 Star: Complete level (reach goal)
- 2 Stars: Complete + efficiency (fewer cuts/less time)
- 3 Stars: Optimal solution (defined criteria)

### 4.3 Difficulty Escalation

**Tier 1 (Tutorial):**
- Single rope, direct cut
- No hazards
- Guaranteed success with any cut

**Tier 2 (Basic):**
- 2-3 ropes
- Simple obstacle avoidance
- One correct solution

**Tier 3 (Intermediate):**
- Multiple ropes with dependencies
- Swinging obstacles
- Timing-based elements

**Tier 4 (Advanced):**
- Complex multi-rope setups
- Moving hazards
- Limited cuts (strategic planning required)

**Tier 5 (Expert):**
- All mechanics combined
- Precise timing required
- Multiple-step solutions

---

## 5. Technical Implementation Guide

### 5.1 Rope Physics (Verlet Integration)

**Point Mass System:**
- Rope represented as chain of point masses
- Each point has position, previous position (velocity implicit)
- Constraint distances between adjacent points

**Update Loop:**
```
for each point:
  velocity = position - previousPosition
  previousPosition = position
  position = position + velocity + gravity * dt * dt
```

**Constraint Solving:**
- Iterate multiple times per frame
- Move points to satisfy distance constraints
- Keep anchor points fixed

### 5.2 Cutting Mechanic

**Line-Segment Intersection:**
- Track swipe as line segment
- For each rope segment, check intersection
- On intersection: split rope at that point

**Swipe Detection:**
- Touch/mouse down: record start point
- Touch/mouse move: draw line, check intersections
- Touch/mouse up: finalize cut

### 5.3 Collision Detection

**Circle-Based Collision:**
- Characters and obstacles as circles
- Rope points vs circle distance check
- Resolve by pushing point out + velocity response

**Hazard Types:**
- Static spikes (instant fail on contact)
- Swinging blades (arc motion)
- Bouncy surfaces (velocity reflection)
- Moving platforms (animated position offset)

### 5.4 Win/Lose Conditions

**Win:**
- Character reaches goal zone (exit door)
- Physics body enters trigger area

**Lose:**
- Character hits hazard
- Character falls off screen
- Timeout (optional)

### 5.5 Level Data Structure

```javascript
level = {
  id: 1,
  tier: 1,
  stars: { one: 0, two: 1, three: 2 }, // cuts needed for stars
  anchors: [{ x, y }],
  ropes: [
    { points: [{x,y}...], attachedTo: [0, 5] },
  ],
  characters: [{ x, y, radius }],
  hazards: [{ type: 'spike'|'blade'|'bouncer', x, y, ... }],
  goal: { x, y, width, height },
  hint: 'Cut the rope when it swings left'
}
```

---

## 6. Audio Design

### 6.1 BGM (Background Music)

**Style:** Upbeat, casual, loopable
**Tempo:** 100-120 BPM
**Characteristics:**
- Short loop (8-16 bars)
- Play continuously during gameplay
- Mute option for mobile users
- Generated via Web Audio oscillators (no external files)

**Implementation:**
- Simple oscillator-based melody
- Layered pads for atmosphere
- Low CPU impact

### 6.2 SFX (Sound Effects)

**Essential SFX:**
- Rope cut: Quick "snap" sound (noise burst + filter)
- Character saved: Positive chime/celebration
- Character hurt: Brief negative sound
- Level complete: Success jingle
- Button press: UI click
- Hint activated: Sparkle/magic sound

**Implementation:**
- Web Audio API generated sounds
- No external audio files needed
- Procedural synthesis for all effects

---

## 7. UI/UX Requirements

### 7.1 Screen Flow

```
Title Screen
    |
    v
Level Select (Tier-based)
    |
    v
Gameplay (per level)
    |
    v
Win/Lose Modal --> Level Select or Retry
```

### 7.2 Level Select UI

**Grid Layout:**
- 5 tiers with visual separation
- Level numbers in cells
- Star display (0-3) per level
- Lock icon for unplayed tiers
- Current progress highlighted

### 7.3 In-Game HUD

**Minimal Overlay:**
- Level number (top-left)
- Cut counter (if limited)
- Hint button (top-right)
- Pause/menu button (top-right)
- Undo button (bottom-left)
- Restart button (bottom-right)

### 7.4 Responsive Design

**Mobile:**
- Touch swipe to cut
- Full-screen canvas
- Large touch targets for UI

**Desktop:**
- Mouse drag to cut
- Keyboard shortcuts (R=restart, U=undo, H=hint)
- Resizable window

---

## 8. Key Differentiators for Target Game

### 8.1 Advantages Over Competitors

1. **Star Rating System** - Adds replayability (competitors lack this)
2. **Hint System** - Prevents hard-stuck abandonment
3. **Undo Function** - Reduces frustration, allows experimentation
4. **Guided Tutorial** - Smoother onboarding than competitors
5. **Verlet Physics** - More realistic rope behavior than simplified physics
6. **No Ads in Core Loop** - Clean experience (can monitize differently)

### 8.2 Content Strategy

**30+ Levels Breakdown:**
- Tier 1 (Tutorial): Levels 1-3 (guided, simple)
- Tier 2 (Easy): Levels 4-9 (6 levels)
- Tier 3 (Medium): Levels 10-18 (9 levels)
- Tier 4 (Hard): Levels 19-26 (8 levels)
- Tier 5 (Expert): Levels 27-33 (7 levels)

**New Mechanic Introduction:**
- Levels 1-3: Basic cutting
- Level 4-6: Multiple ropes
- Level 7-9: Swinging obstacles introduced
- Level 10-12: Bouncy surfaces
- Level 13-15: Moving platforms
- Level 16+: All mechanics combined with increasing complexity

---

## 9. Success Metrics (参考指标)

### 9.1 Engagement Targets

- Average session length: 5-10 minutes
- Levels completed per session: 5-15
- Day 1 retention: >60%
- Day 7 retention: >30%
- Day 30 retention: >10%

### 9.2 Quality Indicators

- Crash-free rate: >99.5%
- Load time: <3 seconds
- 60 FPS on mid-range devices
- Touch response: <16ms

---

## 10. Risk Factors

### 10.1 Market Saturation

- Many rope-cutting clones exist
- Need visual polish and feel to stand out
- Physics must feel "right" - cheap physics kills immersion

### 10.2 Content Depth

- 30 levels is minimal for retention
- Consider 100+ levels for full release
- Level recycling (like competitors) damages reputation

### 10.3 Monetization Balance

- Ads are primary F2P revenue but damage experience
- Consider premium positioning or cosmetic-only IAP
- Player-first monetization builds goodwill

---

## Appendix A: Competitor App IDs

| Game | Package ID | App Store |
|------|-----------|-----------|
| Rescue Cut | com.app.rescuecut | Google Play |
| Love Pins | jp.icepop.steppuzzle | Google Play |
| Save the Boy | com.playspare.save.the.boy.rescue | Google Play |

## Appendix B: Reference Resources

- Adjust: Puzzle Game Strategies (adjust.com/blog/puzzle-games-trends-strategies)
- Mobile Game Monetization Models (adapty.io, superscale.com)
- Retention Benchmarks (segwise.ai)
- Verlet Integration Physics (classic gamedev techniques)

---

*Document prepared for GameZipper automated game pipeline - Phase 2 competitive benchmark*
