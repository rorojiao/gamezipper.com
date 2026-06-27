# Wood Turning — BENCHMARK.md (Competitive Analysis)

## Game Overview
Wood Turning — a satisfying ASMR craft puzzle where players carve a spinning block of wood on a lathe to match a target silhouette.

- **Inspiration**: "Woodturning" by Infinity Games (50M+ downloads, Google Play), "Wood Shop" by Lion Studios (10M+)
- **Core Loop**: A cylindrical wood block spins on a lathe. The player drags a carving tool across the spinning surface, removing material. The goal is to match a target profile/silhouette as closely as possible.
- **Satisfaction Drivers**: Smooth material removal, wood-shaving particles, satisfying "click" when hitting the target depth, the reveal of the finished object.

## Top Competitors Analyzed

| Source | Format | Features | Monetization | Session |
|--------|--------|----------|--------------|---------|
| **Woodturning** (Infinity Games) | Mobile | 3D lathe, carving tools, target silhouette overlay, match % scoring, progressive levels, unlockable woods | Interstitial + rewarded | 3-8 min |
| **Wood Shop** (Lion Studios) | Mobile | Slice/carve mechanic, multiple tool types, customer orders, 100+ levels | Interstitial + IAP | 3-6 min |
| **Carve Master 3D** | Mobile | 3D carving, paint finish, sell to customers | Rewarded video | 4-8 min |
| **Web clones** (various) | HTML5 | Basic carve-to-match, limited levels, poor polish | Display ads | 1-3 min |

## Required Systems (S-Tier Standard)

1. ✅ **Core carving mechanic** — touch/drag to remove material from spinning wood cylinder
2. ✅ **Side-profile view** — wood block shown as a radial cross-section (left=axis, right=surface)
3. ✅ **Target silhouette** — ghost outline of the goal shape overlaid for guidance
4. ✅ **Match-percentage scoring** — real-time calculation of how close carved profile matches target (0-100%)
5. ✅ **30 levels across 5 tiers** — progressive complexity:
   - Tier 1 (Beginner): Simple symmetric shapes (cylinder, cone, bowl)
   - Tier 2 (Easy): Slightly tapered shapes (vase, goblet base)
   - Tier 3 (Medium): Multi-curve profiles (chess pawn, lamp base)
   - Tier 4 (Hard): Intricate designs (ornate vase, candlestick)
   - Tier 5 (Master): Complex asymmetric (decorative spindle, art piece)
6. ✅ **Star rating** — 3 stars based on match % (≥95%=3★, ≥85%=2★, ≥70%=1★)
7. ✅ **Undo** — revert last carving stroke
8. ✅ **Wood shaving particles** — satisfying visual feedback on carve
9. ✅ **Reveal animation** — finished piece rotates to show full 3D form on completion
10. ✅ **Procedural audio** — Web Audio API: lathe hum, carving scrape, completion chime
11. ✅ **Daily challenge** — date-seeded random shape
12. ✅ **Achievements** (8) — first carve, 3-star, complete a tier, daily streak, etc.
13. ✅ **localStorage progress** — level completion, stars, achievements
14. ✅ **Mobile-first responsive** — touch + mouse
15. ✅ **Dark neon theme** — GameZipper aesthetic (amber/wood tones on dark gradient)

## Level Design Blueprint
| Tier | Levels | Grid Complexity | Shape Type |
|------|--------|----------------|------------|
| 1 (Beginner) | 1-6 | 16 radial segments | Cylinder, Cone, Bowl, Disc, Spool, Egg |
| 2 (Easy) | 7-12 | 20 segments | Vase, Goblet, Lamp, Bottle, Bell, Urn |
| 3 (Medium) | 13-18 | 24 segments | Chess Pawn, Candle, Cup, Gourd, Martini, Pear |
| 4 (Hard) | 19-24 | 28 segments | Ornate Vase, Candlestick, Decanter, Onion, Tower, Lotus |
| 5 (Master) | 25-30 | 32 segments | Decorative Spindle, Art Vase, Royal Scepter, Spiral, Dragon, Crown |

## Technical Approach
- **Representation**: Wood profile = array of radial depths (0 = full radius, 1 = carved to center)
- **Carving**: Mouse/touch drag sets a "tool depth" — all segments under the tool path get carved to that depth (can only remove material, never add)
- **Target**: Pre-defined profile array per level
- **Match calc**: `100 - (sum(|carved[i] - target[i]|) / n * scaleFactor)`
- **Rendering**: Canvas 2D — draw wood texture as filled path, target as dashed outline, shavings as particles

## Differentiation vs. Competitors
1. **No download, no signup** — instant browser play (most competitors are app-only)
2. **Dark neon aesthetic** — distinct from competitors' bright/white themes
3. **Full sound design** — most web clones have no audio
4. **30 handcrafted levels** — most web clones have 5-10 generic levels
5. **Daily challenge + achievements** — retention features missing from web clones
6. **Procedural wood-grain texture** — visual polish competitors lack
