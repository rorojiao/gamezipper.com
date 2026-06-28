# Procedural Art Assets for Sum Swipe

## Icon SVG (512x512)
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0f0f0f;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#1a1a2e;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="tile-gradient-1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#ff00ff;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#00ffff;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="tile-gradient-2" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#00ff88;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#ffff00;stop-opacity:1" />
    </linearGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  <rect width="512" height="512" fill="url(#bg-gradient)" rx="32" />
  
  <!-- Title -->
  <text x="256" y="80" text-anchor="middle" font-family="Arial, sans-serif" font-size="48" font-weight="bold" fill="#ffffff" letter-spacing="4">SUM SWIPE</text>
  
  <!-- Grid of tiles -->
  <g filter="url(#glow)">
    <!-- Row 1 -->
    <rect x="60" y="120" width="90" height="90" rx="12" fill="url(#tile-gradient-1)" opacity="0.9" />
    <text x="105" y="175" text-anchor="middle" font-family="Arial, sans-serif" font-size="36" font-weight="bold" fill="#0f0f0f">7</text>
    
    <rect x="165" y="120" width="90" height="90" rx="12" fill="url(#tile-gradient-2)" opacity="0.7" />
    <text x="210" y="175" text-anchor="middle" font-family="Arial, sans-serif" font-size="36" font-weight="bold" fill="#0f0f0f">3</text>
    
    <rect x="270" y="120" width="90" height="90" rx="12" fill="url(#tile-gradient-1)" opacity="0.5" />
    <text x="315" y="175" text-anchor="middle" font-family="Arial, sans-serif" font-size="36" font-weight="bold" fill="#0f0f0f">9</text>
    
    <rect x="375" y="120" width="90" height="90" rx="12" fill="url(#tile-gradient-2)" opacity="0.9" />
    <text x="420" y="175" text-anchor="middle" font-family="Arial, sans-serif" font-size="36" font-weight="bold" fill="#0f0f0f">4</text>
    
    <!-- Row 2 -->
    <rect x="60" y="225" width="90" height="90" rx="12" fill="url(#tile-gradient-2)" opacity="0.6" />
    <text x="105" y="280" text-anchor="middle" font-family="Arial, sans-serif" font-size="36" font-weight="bold" fill="#0f0f0f">2</text>
    
    <rect x="165" y="225" width="90" height="90" rx="12" fill="url(#tile-gradient-1)" opacity="0.8" />
    <text x="210" y="280" text-anchor="middle" font-family="Arial, sans-serif" font-size="36" font-weight="bold" fill="#0f0f0f">8</text>
    
    <rect x="270" y="225" width="90" height="90" rx="12" fill="url(#tile-gradient-2)" opacity="0.9" />
    <text x="315" y="280" text-anchor="middle" font-family="Arial, sans-serif" font-size="36" font-weight="bold" fill="#0f0f0f">1</text>
    
    <rect x="375" y="225" width="90" height="90" rx="12" fill="url(#tile-gradient-1)" opacity="0.7" />
    <text x="420" y="280" text-anchor="middle" font-family="Arial, sans-serif" font-size="36" font-weight="bold" fill="#0f0f0f">5</text>
    
    <!-- Row 3 -->
    <rect x="60" y="330" width="90" height="90" rx="12" fill="url(#tile-gradient-1)" opacity="0.7" />
    <text x="105" y="385" text-anchor="middle" font-family="Arial, sans-serif" font-size="36" font-weight="bold" fill="#0f0f0f">6</text>
    
    <rect x="165" y="330" width="90" height="90" rx="12" fill="url(#tile-gradient-2)" opacity="0.8" />
    <text x="210" y="385" text-anchor="middle" font-family="Arial, sans-serif" font-size="36" font-weight="bold" fill="#0f0f0f">4</text>
    
    <rect x="270" y="330" width="90" height="90" rx="12" fill="url(#tile-gradient-1)" opacity="0.9" />
    <text x="315" y="385" text-anchor="middle" font-family="Arial, sans-serif" font-size="36" font-weight="bold" fill="#0f0f0f">9</text>
    
    <rect x="375" y="330" width="90" height="90" rx="12" fill="url(#tile-gradient-2)" opacity="0.6" />
    <text x="420" y="385" text-anchor="middle" font-family="Arial, sans-serif" font-size="36" font-weight="bold" fill="#0f0f0f">3</text>
  </g>
  
  <!-- Swipe arrow -->
  <path d="M 100 440 Q 150 400 200 420 T 300 430 T 400 440" stroke="#00ff88" stroke-width="4" fill="none" filter="url(#glow)" opacity="0.8" />
  <polygon points="400,440 380,430 380,450" fill="#00ff88" filter="url(#glow)" />
</svg>
```

## CSS Tile Styles

```css
/* Base tile */
.tile {
  background: linear-gradient(135deg, #2a2a4a 0%, #1a1a2e 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  font-weight: bold;
  color: #ffffff;
  transition: all 0.3s ease;
  cursor: pointer;
  user-select: none;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
}

/* Hover state */
.tile:hover {
  transform: scale(1.05);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.4);
}

/* Selected state (neon glow) */
.tile.selected {
  background: linear-gradient(135deg, #ff00ff 0%, #00ffff 100%);
  color: #0f0f0f;
  transform: scale(1.1);
  box-shadow: 0 0 20px rgba(255, 0, 255, 0.6), 0 0 40px rgba(0, 255, 255, 0.4);
  animation: pulse-glow 1.5s infinite alternate;
}

@keyframes pulse-glow {
  from {
    box-shadow: 0 0 20px rgba(255, 0, 255, 0.6), 0 0 40px rgba(0, 255, 255, 0.4);
  }
  to {
    box-shadow: 0 0 30px rgba(255, 0, 255, 0.8), 0 0 60px rgba(0, 255, 255, 0.6);
  }
}

/* Target tile (hint) */
.tile.target {
  background: linear-gradient(135deg, #00ff88 0%, #ffff00 100%);
  color: #0f0f0f;
  border: 2px solid #00ff88;
}

/* Wrong selection */
.tile.wrong {
  background: linear-gradient(135deg, #ff4444 0%, #ff0000 100%);
  animation: shake 0.5s ease;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
}

/* Success burst */
.tile.success {
  background: linear-gradient(135deg, #00ff88 0%, #ffff00 100%);
  animation: success-burst 0.6s ease;
}

@keyframes success-burst {
  0% { transform: scale(1); }
  50% { transform: scale(1.3); }
  100% { transform: scale(1.1); }
}
```

## UI Elements

### Progress Bar
```css
.progress-bar {
  width: 100%;
  height: 8px;
  background: linear-gradient(90deg, #2a2a4a 0%, #1a1a2e 100%);
  border-radius: 4px;
  overflow: hidden;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.5);
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #ff00ff 0%, #00ffff 100%);
  border-radius: 4px;
  transition: width 0.3s ease;
  box-shadow: 0 0 10px rgba(0, 255, 255, 0.5);
}
```

### Star Rating
```css
.star {
  font-size: 24px;
  color: #4a4a4a;
  transition: all 0.3s ease;
  cursor: pointer;
}

.star.active {
  color: #ffff00;
  text-shadow: 0 0 10px rgba(255, 255, 0, 0.6);
}

.star:hover {
  transform: scale(1.2);
}
```

### HUD (Heads-Up Display)
```css
.hud {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  background: linear-gradient(135deg, rgba(42, 42, 74, 0.9) 0%, rgba(26, 26, 46, 0.9) 100%);
  border-radius: 12px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(10px);
}

.hud-text {
  font-family: 'Arial', sans-serif;
  font-size: 18px;
  font-weight: bold;
  color: #ffffff;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}

.hud-value {
  font-family: 'Arial', sans-serif;
  font-size: 24px;
  font-weight: bold;
  color: #00ff88;
  text-shadow: 0 0 10px rgba(0, 255, 136, 0.6);
}

.hud-value.wrong {
  color: #ff4444;
  text-shadow: 0 0 10px rgba(255, 68, 68, 0.6);
}
```

## Particle Effects (Canvas-based)

```javascript
// Confetti particles on win
class Particle {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.size = Math.random() * 8 + 4;
    this.speedX = (Math.random() - 0.5) * 10;
    this.speedY = (Math.random() - 0.5) * 10;
    this.gravity = 0.3;
    this.life = 1.0;
  }

  update() {
    this.x += this.speedX;
    this.y += this.speedY;
    this.speedY += this.gravity;
    this.life -= 0.02;
    this.size *= 0.98;
  }

  draw(ctx) {
    ctx.globalAlpha = this.life;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1.0;
  }
}
```

## Usage

1. **Icon**: Embed SVG in `<img src="data:image/svg+xml;base64,...">` or use inline SVG
2. **Tile CSS**: Add `.tile` class to HTML div elements
3. **UI Elements**: Apply classes to HTML elements
4. **Particles**: Instantiate Particle class in canvas animation loop

All assets are procedural - no external images needed, keeping file size minimal (< 50KB gzipped).