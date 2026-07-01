# Trebuchet Trajectory — Counterweight Siege Puzzle

## Mechanic

**Two-dial projectile physics puzzle:**
- **POWER** dial (counterweight mass): determines launch velocity v₀
- **ANGLE** dial (launch angle θ): determines trajectory direction

Launch → projectile follows parabolic arc → must land on target pad.
Tier-dependent obstacles (walls, ceilings) constrain valid trajectories.

## Physics Model

```
v₀ = base + power_idx × step    (launch speed)
θ  = 20° + angle_idx × 5°       (launch angle, 20°–75°)

x(t) = v₀ cos(θ) t
y(t) = v₀ sin(θ) t − ½ g t²

Landing: t_land = 2 v₀ sin(θ) / g
Range:   R = v₀² sin(2θ) / g
MaxHt:   H = v₀² sin²(θ) / (2g)
```

## Differentiation

| Existing Game | Mechanic | How Trebuchet Differs |
|---|---|---|
| Spectrometer Calibrate | Independent per-dial modular arithmetic | **Coupled** 2-parameter physics (power×angle interact) |
| Centrifuge Separation | Single-parameter (RPM) density sorting | **Dual-parameter** ballistic trajectory optimization |
| Sling Smash / Slingshot | Drag-to-aim elastic launch (skill) | **Parameter-setting** counterweight siege (logic puzzle) |
| Interferometer Align | Path-accumulation optical alignment | **Projectile** physics, not optical path |

**Core novelty:** The two dials COUPLE through projectile physics.
Changing power affects BOTH range AND height. Changing angle affects direction AND range.
No existing game has this coupled-physics parameter optimization.

## Tier Design (30 levels)

| Tier | Levels | Power Positions | Angle Positions | Combos | Obstacles |
|------|--------|-----------------|-----------------|--------|-----------|
| 1 | L1-5 | 4 | 6 | 24 | Open field |
| 2 | L6-10 | 6 | 8 | 48 | Elevated target |
| 3 | L11-15 | 8 | 10 | 80 | + Wall |
| 4 | L16-20 | 8 | 12 | 96 | + Wall + height |
| 5 | L21-25 | 10 | 12 | 120 | + Ceiling |
| 6 | L26-30 | 12 | 12 | 144 | + Wall + Ceiling + Gap |

## Uniqueness Guarantee

For each level:
1. Simulate ALL (power × angle) combos through obstacles
2. Record valid landing points (clears obstacles)
3. Select target at a landing point hit by EXACTLY ONE combo
4. Verify: no other combo lands within tolerance

## Procedural Audio (Web Audio API)
- creak: arm winding (power change)
- click: angle notch (angle change)
- whoosh: launch
- thud: landing/miss
- triumph: target hit + level complete
- error: invalid launch
