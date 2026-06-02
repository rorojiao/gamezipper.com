# Coin Machine — Assets Documentation

## Generated Art Assets (Phase 4)

### Icon (icon.png)
- **Source**: MiniMax text-to-image (Hailuo AI)
- **Size**: 256x256 PNG, 85KB
- **Prompt**: "App icon for a coin merge puzzle game, golden coin with shine and glow, dark navy background, neon gold accent, isometric view, premium casino feel, clean modern design, no text, square 512x512"
- **Usage**: og:image meta tag, future favicon, future link preview
- **Path**: /home/msdn/gamezipper.com/coin-machine/assets/icon.png

### Background (background.jpg)
- **Source**: MiniMax text-to-image (Hailuo AI)
- **Size**: 1280x720 JPEG, 53KB
- **Prompt**: "Dark gradient background for a coin machine game, deep navy blue to black, subtle gold particles floating, soft bokeh lights, premium casino lounge feel, atmospheric and moody, 1920x1080 wide, no text, no objects"
- **Usage**: CSS background-image for #machine-container (with overlay blend mode for visibility)
- **Path**: /home/msdn/gamezipper.com/coin-machine/assets/background.jpg

## RunningHub Notes
The RunningHub API key (`c9daa99350384cfa90ce7eaacead3f7a`) is configured but no stable free workflow IDs were found via search. MiniMax text-to-image was used as the alternative (which is what other recent games have used per pipeline history).

## Generated Music (Phase 5)

### Background Music
- **Source**: Web Audio API procedural (oscillator-based, lo-fi lounge feel)
- **Implementation**: `startBGM()` in index.html — generates mellow chord progression using OscillatorNode + GainNode with frequency modulation
- **Style**: Lo-fi lounge, jazzy chord progression, moderate tempo
- **Toggle**: MUSIC button in controls bar

### Sound Effects
All generated via Web Audio API (no external files):
- `playSound('click')` — button click feedback
- `playSound('drop')` — coin drop with bounce
- `playSound('merge')` — coin merge chime (uses `playMergeSound` with chain multiplier)
- `playSound('gameover')` — game over sound
- Various SFX based on game events

## Collection System
- 11 coin tiers tracked (Copper, Bronze, Silver, Gold, Platinum, Emerald, Ruby, Sapphire, Diamond, Amethyst, Legendary)
- Unlock notification when first discovered
- Persists via localStorage (`coinmachine_collection`)

## Save System
- `coinmachine_best` — high score with version field
- `coinmachine_collection` — discovered coins with version field
- `coinmachine_prefs` — sound/music/tutorial settings with version field
