# Slice It All — Competitor Benchmark

## Top 3 Competitors

### 1. Slice It All! (Voodoo, mobile, 2020+)
- **Core**: Tap/click to flip a knife, slice all obstacles cleanly through every level
- **Levels**: 80+ levels, 6 worlds
- **Systems**: 3-star rating per level, knife skins, no-fail levels for video ads, daily challenges
- **Controls**: Single tap = flip 180°, knife rotates and falls
- **Obstacles**: Pencils, pipes, anvils, ropes, glass, bombs, balls, planks
- **Failure**: Knife collides unsliced / hits bomb / stops on obstacle

### 2. Slice Master (CrazyGames, 2023)
- **Core**: Hurl knife to chop towers/apples/coins. Precision-based arcade
- **Levels**: 100+ increasingly complex 3D levels
- **Systems**: 3-star rating, fruits as collectibles, combo system, power-ups
- **Mechanic**: Hold + release = throw trajectory
- **Visuals**: 3D low-poly colorful, satisfying particle effects

### 3. Knife Hit (Voodoo-style hyper-casual)
- **Core**: Throw knives at spinning logs without hitting existing knives
- **Levels**: Endless + world-based progression
- **Systems**: Knife unlocks, daily missions, level completion %

## Synthesis for Our Game

**Mechanic**: Knife flies forward automatically. Tap to flip. Must cleanly slice all obstacles (pencils, ropes, planks, bombs, glass). Touching unsliced obstacle = game over.

**Systems to implement**:
1. 30 levels, 5 difficulty tiers (Starter / Classic / Challenge / Expert / Master)
2. 3-star rating per level (1-star = complete, 2-star = clean slices, 3-star = no-hits)
3. Combo system (consecutive clean slices multiply score)
4. 6 unlockable knife skins (Default / Gold / Crystal / Flame / Shadow / Galaxy)
5. 3 power-ups: Magnet (auto-flip when in range), Shield (1 free hit), Slow-Mo (2x slow physics)
6. 12 achievements
7. Tutorial (3 steps, skippable)
8. Progress save (localStorage v3)
9. Best score + total stars shown on home
10. Sound on/off + reset progress

**Visuals**: Dark gradient (purple → indigo), neon cyan/magenta knife glow, particle trails, sliced pieces fly off with physics.

**Audio**: Procedural Web Audio BGM (driving synth pulse 110 BPM) + 12 SFX (flip, slice, perfect, fail, level_complete, star_earn, button_click, hover, powerup_collect, combo, knife_land, shield_break).

**Difficulty curve**:
- Tier 1 (Lv 1-6): 1 obstacle, 3-star easy, slow speed
- Tier 2 (Lv 7-12): 2 obstacles, varied heights, medium speed
- Tier 3 (Lv 13-18): 2-3 obstacles, bombs introduced, faster
- Tier 4 (Lv 19-24): 3 obstacles, moving pieces, fast
- Tier 5 (Lv 25-30): 4+ obstacles, complex layouts, expert speed, multiple skin unlocks

**Score formula**:
- Clean slice: +100 × tier multiplier (1-5)
- Combo (2+ in air without flipping): +50 per slice
- 3-star: <2 flips used (perfect = 1)
- Power-up used: -1 star from that level
