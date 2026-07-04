# Black — Competitive Benchmark

## Game Overview
- **Name:** Black
- **Series:** Bart Bonte color puzzle series (7th and final entry)
- **Predecessors:** Yellow (#536), Blue (#538), Green (#540), Orange (#541), Purple (#545), Red (#547)
- **Original author:** Bart Bonte (bartbonte.com)
- **App Store downloads:** 5M+
- **Category:** Casual brain teaser / color puzzle

## Rule Set
- **Goal:** Turn the entire screen BLACK
- **30 levels** across 6 tiers, each with a DIFFERENT mechanism
- **Black palette:**
  - Primary: #212121
  - Dark: #0a0a0a
  - Card: #1a1a1a
  - Accent: #424242
  - Light accent: #616161
  - Body bg: #050505

## Distinct Mechanics (no overlap with Yellow/Blue/Green/Orange/Purple/Red)

### T1: BEGINNER (1-5)
1. TAP center orb 8 times (consecutive, increasing pulse)
2. DRAG brightness slider 0→100% (screen darkens)
3. HOLD to charge shadow meter (fill within time limit)
4. SPIN two dials simultaneously to align 0°
5. MEMORIZE then recreate a 2x2 dark/light pattern

### T2: EASY (6-10)
6. RUB a glowing crystal to dim it to black
7. TAP grid cells in descending numeric order (5→1)
8. CONNECT 4 shadow nodes with paths (no crossing)
9. COUNT heartbeats via audio rhythm — tap when N beats
10. DRAG black curtain across screen left→right

### T3: NORMAL (11-15)
11. SOLVE lights-out puzzle on 3x3 grid (toggle neighbors)
12. MIX light beams — rotate prisms to cancel colors → black
13. TYPE the word "BLACK" using shuffled keyboard
14. SWIPE right 7 times to "eclipse" the sun (animation)
15. FOLLOW Simon-says with increasing length (up to 5)

### T4: HARD (16-20)
16. DECRYPT a Caesar cipher (shift 3) to find the answer
17. BALANCE a scale — add/remove weights to reach zero
18. TRACE a path through a dark maze by memory
19. FIND the hidden clickable pixel (invisible element)
20. SORT shapes by size descending into bins

### T5: EXPERT (21-25)
21. CONSTELLATION — connect numbered stars 1→N to form black hole
22. MIRROR ROOM — tap spots where reflected image shows a gap
23. TIMING — tap exactly when two moving orbs overlap
24. LOCK — drag tumblers to correct positions based on clues
25. MORSE CODE — translate ·- ·-·· ·- -·-·- to text → "BLACK"

### T6: MASTER (26-30)
26. LIGHTS-OUT 4x4 grid — solve XOR toggle puzzle
27. COLOR WHEEL — spin to find the single black segment
28. SEQUENCE — two-rule pattern (alternating shape + size)
29. HEXADECIMAL — 0xFF = ? (tap the answer 255)
30. FINAL — tap all 7 shadow nodes in order within 4 seconds

## Monetization
- Interstitial ads between tier transitions
- Banner ad at bottom (non-blocking)
- Hint system (free, 3-second cooldown)

## Technical
- Pure DOM/JS (no Canvas needed for most levels)
- Single-file HTML5
- ~35-45KB expected size
- Pointer events for touch/mouse
- Web Audio API for SFX + ambient BGM
- LocalStorage for progress
