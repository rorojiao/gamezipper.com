# Spectrometer Calibrate — Diffraction Grating Dispersion Puzzle

## Concept
Calibrate an optical spectrometer by rotating diffraction gratings to disperse
white light into spectral lines and align each line onto its target detector.

## Core Mechanism (DIFFERENTIATED)
**Grating Equation Dispersion** — each grating has N angular positions. Rotating
the grating changes the diffraction angle β according to `n·λ = d·(sin α + sin β)`.
Each grating dial moves a specific spectral line (color) along the detector arc.
Players rotate K grating dials to co-align all K spectral lines onto their target
detector positions simultaneously.

### Differentiation from existing optical game (Interferometer Align)
| Feature | Interferometer | Spectrometer Calibrate |
|---------|---------------|----------------------|
| **Physics** | Path-difference accumulation (Michelson) | Grating dispersion (diffraction) |
| **What you adjust** | Mirror stage positions (linear) | Grating rotation angles (rotational) |
| **Goal** | Constructive interference (OPD ≡ 0 mod λ) | Spectral line → detector alignment |
| **Visual** | Laser beam + fringes | Rainbow spectrum + detector array |
| **Math** | Cumulative sum mod P | Per-dial independent mod N |
| **Keywords** | interferometer/fringe/OPD | spectrometer/diffraction/grating/spectral |

### Differentiation from other mechanical games
- vs **Sextant**: vernier scale CO-ALIGNMENT (3 arcs → 1 point) vs grating DISPERSION (K gratings → K detectors)
- vs **Orrery/Antikythera**: COUPLED gear ratios (one crank drives all) vs INDEPENDENT gratings (each dial is standalone)
- vs **Resonance Lock**: CRT-based oscillator PHASE vs grating ANGLE dispersion
- vs **Gyroscope**: TORQUE precession vs ROTATIONAL diffraction

## Puzzle Structure
- **Dials**: K grating dials (K = 2..5), each with N positions (N = 6..12)
- **Target**: Each dial's spectral line must reach its detector target position
- **Move**: Click dial to rotate ±1 position (mod N)
- **Solution**: net_rotation[i] ≡ target_offset[i] (mod N) for each dial independently
- **Unique solutions** verified via counting DP (independent per-dial)

## Level Tiers (30 levels)
| Tier | Levels | Dials (K) | Positions (N) | Par (max clicks) |
|------|--------|-----------|---------------|-------------------|
| 1    | 1-5    | 2         | 6             | 6                 |
| 2    | 6-10   | 2         | 8             | 8                 |
| 3    | 11-15  | 3         | 8             | 12                |
| 4    | 16-20  | 3         | 10            | 15                |
| 5    | 21-25  | 4         | 10            | 20                |
| 6    | 26-30  | 5         | 12            | 30                |

## Visual Design
- Dark lab background with starfield-like detector array
- Central white light source → prism-like diffraction grating → rainbow fan of spectral lines
- Each spectral line is a colored beam ending in a glowing dot on a detector arc
- Target positions marked with dashed circles
- When a line reaches its target, it glows green + chime
- All aligned → victory pulse + spectrum rainbow flash

## Audio
- Web Audio API procedural: click (grating rotate), align (chime), win (arpeggio), error (buzz)

## Art
- icon.png: spectrometer with rainbow spectrum fan
- og-image.jpg: wide lab scene with diffraction grating dispersing light
