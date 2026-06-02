# Chain Reaction — Assets

## Visual Assets

### icon.png (OG Image)
- 512x512 PNG, 38KB
- Generated via Python PIL
- Depicts: dark gradient background, cyan/magenta/gold neon atoms, central explosion, shockwave rings, grid lines
- Used as: og:image meta tag, social media share preview

### icon.svg
- Vector source file (4.5KB)
- SVG version for responsive rendering
- Same composition as icon.png

## In-Game Art (Canvas-Rendered)

All game art is procedurally rendered via HTML5 Canvas 2D — NO image dependencies, keeping the game as a single self-contained file:

### Color Palette (Neon)
- Background: `#0a0a1a` (deep midnight)
- Background gradient: `#1a0033` → `#0a0e27`
- Player atoms: `#00d4ff` (cyan) with `#00a8cc` glow
- Enemy atoms: `#ff3366` (hot pink) with `#cc2952` glow
- Explosion: `#ffcc00` (gold) with `#fff8cc` highlights
- Neutral grid: `#333355` (dim)
- Accent (UI): `#ffcc00` (gold)
- Success: `#00ff88` (mint)
- Danger: `#ff4444` (red)

### Visual Effects
- Particle system (12+ particles per explosion, color-matched)
- Shockwave rings (3 concentric circles expanding from impact)
- Pulsing glow on primed cells (scale + opacity animation)
- Screen shake on impact (4px magnitude, 200ms decay)
- Smooth trail effects on chain reactions
- Star rating (3 stars with gold fill animation)
- Glass-morphism panels (rgba(15,15,40,0.95))

## Audio Assets (Web Audio API — All Procedural)

### BGM (Background Music)
- Generated via Web Audio API OscillatorNode + GainNode + BiquadFilterNode
- Ambient electronic style, slow tempo (~60 BPM)
- A minor pentatonic scale (A, C, E, F notes)
- Sine wave + low-pass filter for soft pad feel
- Continuous loop while playing state

### SFX (Sound Effects)
All synthesized via Web Audio API on-the-fly:
- **Atom place**: 600Hz square wave, 60ms decay
- **Chain reaction**: ascending 800→1600Hz, 150ms
- **Cascade**: 1000Hz triangle + white noise burst
- **Win**: C-E-G-C major chord arpeggio
- **Lose**: descending dissonant tone
- **Button click**: 1200Hz sine, 30ms
- **Level select**: 800Hz soft beep, 100ms

### Audio Controls
- Sound toggle (SFX on/off) — persisted in localStorage
- Music toggle (BGM on/off) — persisted in localStorage
- Volume controlled via GainNode master gain (0.5 base)

## Asset Generation Note

This game uses **100% procedural rendering** (Canvas + Web Audio) for maximum portability and zero external dependencies. The icon.png is the only binary asset, generated locally via PIL to serve as the OG social share image. This approach matches the GameZipper S-grade standard of single-file games.
