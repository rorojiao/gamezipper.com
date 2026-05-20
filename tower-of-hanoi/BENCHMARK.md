# Tower of Hanoi — Competitive Benchmark

## Competitors Analyzed

### 1. tower-of-hanoi.com (Classic Web)
- **Disks**: 3-9 selectable
- **Systems**: Move counter, timer
- **Missing**: No undo, no hints, no stars, no levels, no save progress, no sound, no tutorial

### 2. SilverGames Tower of Hanoi (3.7★, 196 votes)
- **Disks**: 3-8
- **Systems**: Move counter, difficulty selection
- **Missing**: No scoring, no hints, no auto-solve, no progress, no achievements

### 3. Math Playground Tower of Hanoi
- **Disks**: 3-7
- **Systems**: Move counter, educational focus
- **Missing**: No scoring, no stars, no themes, very basic visuals

### 4. Mobile App (华军软件园 v1.24)
- **Systems**: Multiple difficulty modes, massive levels, endless mode
- **Missing**: No auto-solve demo, no achievements

## Systems to Implement (Must-Have)

| System | Implementation |
|--------|---------------|
| **Level System** | Levels 1-20: disks 3→3, 3→4, 4→4, 4→5, 5→5... up to 8 disks. Each disk count appears twice (learn + master) |
| **Move Counter** | Track moves, display optimal (2^n - 1) |
| **Star Rating** | 3★ = optimal, 2★ = ≤1.5x optimal, 1★ = completed |
| **Timer** | Per-level timer, best time tracking |
| **Auto-Solve Demo** | Animated recursive solution visualization |
| **Undo System** | Full undo stack, unlimited undos |
| **Hint System** | Highlight next optimal move (costs no penalty, but no star) |
| **Progress Save** | localStorage with version field, save best stars/moves/time per level |
| **Tutorial** | First-time interactive tutorial on 3-disk puzzle |
| **Sound** | Web Audio API: pick-up, place, invalid move, level complete, star earned, BGM |
| **Theme System** | 3 visual themes (Neon, Wooden, Cosmic) |
| **Statistics** | Total moves, total time, levels completed, best streak |
| **Smooth Animations** | Disk lift, arc movement, drop with bounce, celebration particles |

## Difficulty Curve
- Level 1-2: 3 disks (7 moves optimal) — Tutorial
- Level 3-4: 4 disks (15 moves optimal)
- Level 5-6: 5 disks (31 moves optimal)
- Level 7-8: 6 disks (63 moves optimal)
- Level 9-10: 7 disks (127 moves optimal)
- Level 11-12: 7 disks with move limit
- Level 13-14: 8 disks (255 moves optimal)
- Level 15-16: 8 disks with time challenge
- Level 17-20: Mixed challenges (color memory, reverse goal, limited undos)

## Unique Selling Points vs Competitors
1. **Auto-solve visualization** — none of the competitors have this
2. **Hint system** — shows optimal next move
3. **Challenge modes** — not just basic puzzles, but time/move limits
4. **Theme system** — visual variety
5. **Statistics & achievements** — tracking progress
6. **Web Audio BGM + SFX** — polished audio feedback
