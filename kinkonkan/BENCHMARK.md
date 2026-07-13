# Kin-Kon-Kan Benchmark

## Competitors

### 1. Nikoli Official (ja.nikoli.co.jp/kinkonkan/)
- Source: https://www.nikoli.co.jp/ja/puzzles/kinkonkan/
- Difficulty: 5x5 to 10x10 grids
- Features: Daily puzzle, PDF printable, no online solver
- Rules: One diagonal mirror per room, beam reflection count on letter pairs
- Missing: No mobile app, no browser version

### 2. Janko.at (janko.at/Raetsel/Kinkonkan/)
- Source: https://www.janko.at/Raetsel/Kinkonkan/
- Difficulty: 150 puzzles
- Features: Solve online, instructions DE/EN/JA, no hints
- Rules: Same as Nikoli, letter pairs with reflection count
- Missing: No hints, no difficulty progression, no undo

### 3. puzz.link (puzz.link/p?kinkonkan/)
- Source: https://puzz.link/p?kinkonkan/
- Difficulty: User-created levels
- Features: Play online, pzprv3 engine
- Rules: Same mechanics
- Missing: No hints, no star ratings

## Gap Analysis

| Feature | Nikoli | Janko | puzz.link | Our Game |
|---------|--------|-------|-----------|----------|
| Browser version | ❌ | ✅ | ✅ | ✅ |
| Mobile-friendly | ❌ | ⚠️ | ⚠️ | ✅ |
| Hints | ❌ | ❌ | ❌ | ✅ (3/level) |
| Undo/Redo | ❌ | ❌ | ❌ | ✅ |
| Star ratings | ❌ | ❌ | ❌ | ✅ |
| Level select | ❌ | ❌ | ⚠️ | ✅ (by tier) |
| BGM/SFX | ❌ | ❌ | ❌ | ✅ |
| Progress save | ❌ | ❌ | ❌ | ✅ |
| Auto-check | ❌ | ❌ | ❌ | ✅ |
| Keyboard support | ❌ | ❌ | ❌ | ✅ |
| SEO/Structured Data | ❌ | ❌ | ❌ | ✅ |
| Monetization | ❌ | ❌ | ❌ | ✅ |

## Unique Selling Points

1. **Full mobile experience**: Touch targets >= 36px, responsive canvas
2. **Hint system**: 3 hints per level, reveals correct mirror location
3. **Progress tracking**: LocalStorage save + level unlock
4. **Audio feedback**: Web Audio API BGM + 6 SFX types
5. **Quality assurance**: 30 levels with 3-method verification
6. **Accessibility**: Keyboard shortcuts, screen reader friendly

## Technical Stack

- Rendering: HTML5 Canvas (2D context)
- Input: Pointer Events (mouse + touch), Keyboard shortcuts
- Audio: Web Audio API (procedural generation, no external files)
- Storage: LocalStorage for progress and settings
- SEO: JSON-LD VideoGame + FAQPage + BreadcrumbList
- Monetization: Monetag MultiTag (banner, native, interstitial)

## Level Structure

- Beginner (Tier 1): 5x5, 6 levels, letter pairs A-C, mirrors 3-5
- Easy (Tier 2): 6x6, 6 levels, letter pairs A-D, mirrors 5-7
- Medium (Tier 3): 7x7, 6 levels, letter pairs A-E, mirrors 7-9
- Hard (Tier 4): 8x8, 6 levels, letter pairs A-F, mirrors 9-11
- Expert (Tier 5): 9x9, 6 levels, letter pairs A-G, mirrors 11-13

Total: 30 levels with unique solutions verified.