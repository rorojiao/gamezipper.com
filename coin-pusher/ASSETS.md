# Coin Pusher — Art & Music Assets

## Visual Assets (Procedural)

This game uses **fully procedural canvas rendering** for all in-game art. This is the S-grade approach for arcade physics games because:
1. Coins, prizes, and machine frames scale perfectly with the canvas
2. No image loading delays
3. Every visual is parameterized (theme, color, level)
4. Smaller file size, faster load

### Coin Rendering (drawCoin)
- **Body**: Radial gradient from light variant → base color → edge color (creates 3D depth)
- **Edge ring**: Dark stroke at 1.5px width
- **Inner ring**: White at 18% opacity for premium feel
- **Label**: Coin denomination (1, 5, 25, ★) in Orbitron bold
- **Highlight**: White ellipse at top-left (-35%, -35%) for sheen
- **Shadow**: Dark ellipse below coin for floating effect
- **Rotation**: Spinning animation during physics

### Coin Types
| Type | Color | Edge | Value |
|------|-------|------|-------|
| Bronze | #cd7f32 | #8a4a18 | 1 |
| Silver | #dcdcdc | #7a7a7a | 5 |
| Gold | #ffd700 | #a87a00 | 25 |
| Diamond | #b9f2ff | #5cb8d6 | 100 |

### Prize Rendering (drawPrize)
- **Body**: Diamond/crystal shape (6-sided polygon) with radial gradient
- **Color**: Each prize has unique color (Ruby pink, Emerald green, Sapphire blue, Ticket gold, Bill green)
- **Highlight**: White ellipse + sparkle pixel
- **Edge**: Dark stroke for definition
- **Label**: Value indicator (50, 100, 200, 500, 1K)

### Machine Background
- **Marquee lights**: 14 alternating accent/cyan circles, animated brightness via sin wave
- **Frame**: 3px border with theme color + glow shadow
- **Side walls**: Dark with accent highlight
- **Star field**: 30 animated twinkling stars
- **Gradient**: 3-stop linear gradient unique per machine theme

### Pusher Tray
- **Body**: 3-stop gradient (theme.accent → purple → black)
- **Front edge**: Red marker (#ff3366) for the danger line
- **Top highlight**: White at 15% opacity
- **Glow**: Accent color shadow blur 12px

### Machine Themes (6 unique)
1. **Classic Arcade** — Brown/copper (#3a1a0a, #cd7f32)
2. **Silver Stack** — Chrome/dark blue (#1a1a2e, #c0c0c0)
3. **Gold Rush** — Brown/gold (#3a2a0a, #ffd700)
4. **Vegas Nights** — Purple/magenta (#3a0a3a, #ff2bd6)
5. **Royal Vault** — Deep purple/gold (#1a0a2a, #ffd166)
6. **Space Station** — Deep blue/cyan (#0a0a2a, #00f0ff)

### UI Art
- **Buttons**: Gradient backgrounds (cyan→magenta, gold→orange, green→cyan)
- **Cards**: Glass morphism with backdrop-filter blur
- **HUD cells**: Dark glass with neon value text (cyan/gold/green)
- **Modal**: Dark glass with neon title gradient
- **Toasts**: Color-coded (gold/cyan/magenta/green)

### Particle Effects
- **Coin clink**: 6-12 small circles, themed color, gravity, fade
- **Big win**: 12 particles, prize color
- **Score popup**: Floating text "+100" rising and fading

### Animations
- `fadeIn` — Screen entry
- `scaleIn` — Modal entry
- `toastIn/toastOut` — Toast notifications
- `celebrateIn/celebrateOut` — Big win celebration
- `marquee` — Lights pulse
- Stars: Random twinkle via Math.sin

## Audio Assets (Web Audio API)

All audio is **procedurally generated** using the Web Audio API — no external files.

### Sound Effects (SFX)
| Sound | Frequency | Duration | Type | Use |
|-------|-----------|----------|------|-----|
| Drop | 440Hz → 240Hz | 60ms | square + noise | Coin drop |
| Clink | 880Hz → 580Hz | 80ms | triangle + noise | Coin/coin collision |
| Big clink | 660Hz → 460Hz | 150ms | triangle + noise | Coin/prize collision |
| Win | 523, 659, 784Hz | 120ms each | sine | Prize collection |
| Big win | 523, 659, 784, 1047Hz | 180ms each | sine | Diamond+ prize |
| Giant | 220Hz → 120Hz | 300ms | sawtooth + noise | Giant coin |
| Unlock | 392, 523, 659, 784Hz | 200ms each | sine | New machine unlock |
| Error | 180Hz → 130Hz | 180ms | sawtooth | Out of coins / locked |

### BGM (Background Music)
- **Type**: Sine wave LFO modulated oscillator
- **Base frequency**: 110Hz (A2)
- **LFO frequency**: 0.18Hz (slow modulation)
- **LFO amount**: ±4Hz (subtle pitch variation)
- **Filter**: Lowpass at 600Hz (warm, lo-fi)
- **Volume**: 0.025 (subtle, never intrusive)
- **Style**: Ambient lo-fi, chiller arcade aesthetic

### Audio Lifecycle
- BGM starts on init, pauses when settings.music=false
- All SFX respect settings.sound toggle
- AudioContext.resume() called on first user interaction (browser requirement)
- All oscillator/gain/buffer nodes properly created and connected

## Why Procedural Over AI-Generated?

For a physics-based arcade game with hundreds of dynamic coins/prizes:
- ✅ Procedural scales to any canvas size
- ✅ Instant render — no asset loading
- ✅ Theme-consistent (matches GameZipper dark/neon style)
- ✅ Smaller file size (no 1MB+ PNG bundles)
- ✅ No licensing/attribution issues
- ✅ Perfect for the S-grade standard we maintain
