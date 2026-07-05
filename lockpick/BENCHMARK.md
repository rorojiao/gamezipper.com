# Phase 2: Competitive Benchmark — Lockpick

## Top Competitors

### 1. Skyrim/Fallout Lockpicking (Bethesda)
- **Platform**: AAA RPG (console/PC)
- **Mechanic**: Rotate tension wrench + adjust pick angle. Pin sweet spots found by feel/rotation resistance.
- **Visual**: Cross-section of lock cylinder, pin positions visible.
- **Monetization**: Part of $60 game. Lockpicking is 1 of many mechanics.
- **Why it works**: Tactile satisfaction of "click" feedback. Risk/reward: pick can break.
- **Takeaway**: Our game should replicate the pin-click satisfaction with audio+visual feedback.

### 2. Lockpicking Simulator (Steam indie)
- **Platform**: Steam ($5-10)
- **Mechanic**: Realistic pin tumbler picking. Tension wrench + individual pin lifting.
- **Features**: Multiple lock types (pin tumbler, wafer, tubular, dimple).
- **Takeaway**: Progressive lock complexity is the natural difficulty curve.

### 3. TikTok Lockpick Challenge (social trend)
- **Platform**: Mobile video
- **Mechanic**: IRL lockpicking, satisfying "click" sounds, transparent practice locks.
- **Audience**: 100M+ views under #lockpick, #lockpicking
- **Takeaway**: Audio feedback is CRITICAL. The "click" is the dopamine hit.

### 4. "Pick the Lock" mobile games (Google Play)
- **Platform**: Mobile (Android)
- **Mechanic**: Simplified timing-based lockpicking — tap when pick aligns with gap.
- **Downloads**: Various 1-10M range across multiple clones.
- **Monetization**: Interstitial ads between locks, rewarded video for hints.
- **Takeaway**: Casual players want quick satisfaction (3-5 seconds per pin), not realism.

## Feature Differentiation

| Feature | Our Lockpick | Competitors |
|---------|-------------|-------------|
| Browser-based | ✅ | ❌ (most are app/PC only) |
| 30 progressive levels | ✅ | Varies |
| 5 lock types (padlock→digital) | ✅ | Usually 1 type |
| 3-star time scoring | ✅ | Some |
| Hint system | ✅ | Rare |
| Audio "click" feedback | ✅ | All |
| Canvas cross-section visual | ✅ | AAA games only |
| No download needed | ✅ | ❌ (competitors need install) |
| SEO optimized | ✅ | ❌ |

## Visual Design Reference

- **Lock cylinder**: Cross-section view, gold/brass body, steel pins
- **Pick**: Thin metal tool, rotates around center pivot
- **Tension wrench**: L-shaped tool at bottom of keyway
- **Pins**: Spring-loaded, colored by position (driver=gold, key=silver)
- **Shear line**: Horizontal dotted line — pins must align here
- **Background**: Dark workshop ambiance, wood texture, warm lighting
- **UI**: Top bar (level, stars, timer), bottom bar (hint, undo, menu)

## Monetization Strategy

- **Ad placements**: Interstitial after every 5 levels (Monetag interstitial zone 110122)
- **Rewarded video**: Hint reveals (watch ad → see sweet spot glow)
- **Banner**: Bottom banner during level select (Monetag banner zone 110120)
- **Native ads**: Between level tiers in level select grid

## Key Design Decisions

1. **Pin finding by feel**: Player rotates pick, each pin has a "binding" feel (slight resistance). When pin reaches shear line → "CLICK" sound + pin stays up.
2. **Tension mechanic**: Hold tension wrench (mouse/touch hold). Too much tension = pins won't set. Too little = pins fall back.
3. **Pick rotation**: Rotate pick left/right to find each pin's sweet spot. This is the core skill.
4. **Progressive complexity**:
   - T1: 3 pins, wide sweet spots, no tension management
   - T2: 5 pins, narrower sweet spots, tension matters
   - T3: Combination dial — rotate dial, listen for clicks at correct numbers
   - T4: Warded lock — trace path through maze-like wards
   - T5: Electronic — memorize and repeat light/sound sequence
5. **Failure**: Pick breaks after 3 wrong attempts. Reset level.
6. **Audio**: Critical. Multiple click sounds (pin set, pin spring, pick scrape, lock open).
