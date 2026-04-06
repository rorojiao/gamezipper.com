/**
 * Slope Game — 2D Canvas pseudo-3D rolling ball
 * Cyberpunk / neon aesthetic
 */
'use strict';

const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');

// DOM refs
const scoreValEl = document.getElementById('score-val');
const bestValEl = document.getElementById('best-val');
const finalScoreEl = document.getElementById('final-score');
const finalBestEl = document.getElementById('final-best');
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const btnStart = document.getElementById('btn-start');
const btnRestart = document.getElementById('btn-restart');
const soundBtn = document.getElementById('sound-btn');

// ─── STATE ────────────────────────────────────────────────
let W, H;
let gameState = 'start'; // start | playing | dead
let score = 0;
let bestScore = parseInt(localStorage.getItem('slope_best') || '0');
let speed = 3;           // forward speed (road scroll rate)
let speedMax = 14;
let playerX = 0;         // -1..1 relative to road center
let playerVX = 0;
let roadZ = 0;           // virtual Z scroll offset
let frameCount = 0;
let deathTimer = 0;
let invincible = 0;      // invincibility frames after respawn
let slowMo = 0;          // slow-motion frames on death
let soundOn = localStorage.getItem('slope_sound') !== 'off';

bestValEl.textContent = bestScore;

// ─── AUDIO (Web Audio API) ───────────────────────────────
let audioCtx = null;
function getAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}

function playSound(type) {
  if (!soundOn) return;
  try {
    const ac = getAudio();
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.connect(gain);
    gain.connect(ac.destination);
    const now = ac.currentTime;
    if (type === 'coin') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(1760, now + 0.08);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.start(now); osc.stop(now + 0.15);
    } else if (type === 'crash') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.4);
      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc.start(now); osc.stop(now + 0.4);
    } else if (type === 'boost') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(1200, now + 0.2);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.start(now); osc.stop(now + 0.25);
    }
  } catch(e) {}
}

soundBtn.textContent = soundOn ? '🔊' : '🔇';
soundBtn.addEventListener('click', () => {
  soundOn = !soundOn;
  localStorage.setItem('slope_sound', soundOn ? 'on' : 'off');
  soundBtn.textContent = soundOn ? '🔊' : '🔇';
  if (soundOn) try { getAudio().resume(); } catch(e) {}
});

// ─── ROAD & PERSPECTIVE ──────────────────────────────────
// Road is a 3D-tunnel projection on 2D canvas
// Horizon at ~38% from top, vanishing point centered

// Perspective constants (recalculated on resize)
let HORIZON, VP_X, ROAD_WIDTH_HORIZON, ROAD_WIDTH_BOTTOM;
let LANE_LEFT, LANE_RIGHT; // road edge x at bottom

function recalcPerspective() {
  HORIZON = H * 0.38;
  VP_X = W * 0.5;
  ROAD_WIDTH_HORIZON = W * 0.08;
  ROAD_WIDTH_BOTTOM = W * 0.9;
  // Interpolate road edges from horizon to bottom
  LANE_LEFT  = VP_X - ROAD_WIDTH_BOTTOM / 2;
  LANE_RIGHT = VP_X + ROAD_WIDTH_BOTTOM / 2;
}

// Convert (roadX in -1..1, roadZ in worldZ) → screen (x, y, scale)
function project(roadX, roadZ) {
  // roadZ wraps around a loop length
  const ZLOOP = 1200;
  const z = ((roadZ % ZLOOP) + ZLOOP) % ZLOOP;
  // perspective: z=0 is bottom, z=ZLOOP is horizon
  const t = z / ZLOOP; // 0=bottom, 1=horizon
  const y = HORIZON + (H - HORIZON) * (1 - t) * (1 - t);
  const roadHalfW = ROAD_WIDTH_HORIZON + (ROAD_WIDTH_BOTTOM - ROAD_WIDTH_HORIZON) * Math.pow(1 - t, 1.4);
  const x = VP_X + roadX * roadHalfW;
  const scale = Math.pow(1 - t, 1.2);
  return { x, y, scale, t, roadHalfW };
}

// ─── OBSTACLES & GEMS ────────────────────────────────────
const ZLOOP = 1200;
let obstacles = [];  // { z, lane(-1..1), type, alive }
let gems = [];      // { z, lane(-1..1), alive, collected }
let nextObstacleZ = 0;
let nextGemZ = 0;
const OBSTACLE_INTERVAL_MIN = 80;
const OBSTACLE_INTERVAL_MAX = 200;
const GEM_INTERVAL = 180;

function spawnObstacle() {
  const lane = (Math.random() * 2 - 1) * 0.82; // -0.82..0.82
  const z = roadZ + ZLOOP - 20;
  obstacles.push({ z, lane, type: Math.random() < 0.3 ? 'wall' : 'block', alive: true });
}

function spawnGem() {
  const lane = (Math.random() * 2 - 1) * 0.75;
  const z = roadZ + ZLOOP - 30;
  gems.push({ z, lane, alive: true, collected: false, flash: 0 });
}

function resetWorld() {
  obstacles = [];
  gems = [];
  nextObstacleZ = roadZ + 200 + Math.random() * 100;
  nextGemZ = roadZ + 150;
  // pre-spawn
  for (let i = 0; i < 8; i++) spawnObstacle();
  for (let i = 0; i < 5; i++) spawnGem();
}

// ─── PARTICLES ────────────────────────────────────────────
let particles = [];

function spawnParticles(x, y, color, count) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const spd = 1 + Math.random() * 4;
    particles.push({
      x, y,
      vx: Math.cos(angle) * spd,
      vy: Math.sin(angle) * spd,
      life: 1,
      decay: 0.03 + Math.random() * 0.04,
      size: 2 + Math.random() * 3,
      color
    });
  }
}

// ─── TRAIL ────────────────────────────────────────────────
let trail = [];

function resetGame() {
  score = 0;
  speed = 3;
  playerX = 0;
  playerVX = 0;
  roadZ = 0;
  frameCount = 0;
  deathTimer = 0;
  slowMo = 0;
  invincible = 0;
  particles = [];
  trail = [];
  resetWorld();
}

// ─── INPUT ────────────────────────────────────────────────
let keys = { left: false, right: false };
let tiltX = 0; // -1..1 from device orientation
let touchLeft = false, touchRight = false;

document.addEventListener('keydown', e => {
  if (e.key === 'ArrowLeft'  || e.key === 'a' || e.key === 'A') keys.left  = true;
  if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.right = true;
  if (e.key === ' ' || e.key === 'Enter') {
    if (gameState === 'start') startGame();
    else if (gameState === 'dead') restartGame();
  }
});
document.addEventListener('keyup', e => {
  if (e.key === 'ArrowLeft'  || e.key === 'a' || e.key === 'A') keys.left  = false;
  if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.right = false;
});

// Touch controls
canvas.addEventListener('touchstart', e => {
  e.preventDefault();
  for (const t of e.changedTouches) {
    if (t.clientX < W * 0.5) touchLeft = true;
    else touchRight = true;
  }
  if (gameState === 'start') startGame();
  else if (gameState === 'dead') restartGame();
}, { passive: false });

canvas.addEventListener('touchend', e => {
  e.preventDefault();
  touchLeft = false; touchRight = false;
  for (const t of e.changedTouches) {
    if (t.clientX < W * 0.5) touchLeft = false;
    else touchRight = false;
  }
}, { passive: false });

canvas.addEventListener('touchmove', e => { e.preventDefault(); }, { passive: false });

// Device orientation (mobile tilt)
window.addEventListener('deviceorientation', e => {
  if (e.gamma !== null) {
    tiltX = Math.max(-1, Math.min(1, e.gamma / 25));
  }
});

btnStart.addEventListener('click', startGame);
btnRestart.addEventListener('click', restartGame);

function startGame() {
  if (getAudio().state === 'suspended') getAudio().resume();
  startScreen.classList.add('hidden');
  gameState = 'playing';
  resetGame();
}

function restartGame() {
  gameOverScreen.classList.remove('active');
  resetGame();
  gameState = 'playing';
}

// ─── RESIZE ───────────────────────────────────────────────
function resize() {
  W = canvas.width  = window.innerWidth;
  H = canvas.height = window.innerHeight;
  recalcPerspective();
}
window.addEventListener('resize', resize);
resize();

// ─── UPDATE ───────────────────────────────────────────────
const ROAD_HALF = 0.9; // max playerX before dying

function update() {
  if (gameState !== 'playing') return;

  frameCount++;
  invincible = Math.max(0, invincible - 1);

  // Speed ramp
  if (frameCount % 300 === 0 && speed < speedMax) speed += 0.3;

  // Input
  let moveInput = 0;
  if (keys.left  || touchLeft)  moveInput -= 1;
  if (keys.right || touchRight) moveInput += 1;
  moveInput += tiltX * 0.9;

  // Player physics
  const accel = 0.055;
  const friction = 0.88;
  const maxVX = 0.07;
  playerVX += moveInput * accel;
  playerVX *= friction;
  playerVX = Math.max(-maxVX, Math.min(maxVX, playerVX));
  playerX += playerVX;
  playerX = Math.max(-ROAD_HALF, Math.min(ROAD_HALF, playerX));

  // Ball rolling tilt
  const ballTiltX = playerVX * 8;

  // Forward scroll
  roadZ += speed;

  // Score = distance
  score = Math.floor(roadZ / 10);
  scoreValEl.textContent = score;

  // Trail
  const ballProj = project(playerX, 0);
  trail.push({ x: ballProj.x, y: ballProj.y, age: 0 });
  if (trail.length > 25) trail.shift();
  trail.forEach(t => t.age++);

  // Spawn
  if (roadZ >= nextObstacleZ) {
    spawnObstacle();
    nextObstacleZ = roadZ + OBSTACLE_INTERVAL_MIN + Math.random() * (OBSTACLE_INTERVAL_MAX - OBSTACLE_INTERVAL_MIN);
    // decrease interval as speed increases
    const speedFactor = Math.max(0.5, 1 - (speed - 3) / (speedMax - 3) * 0.4);
    nextObstacleZ = roadZ + (OBSTACLE_INTERVAL_MIN + Math.random() * (OBSTACLE_INTERVAL_MAX - OBSTACLE_INTERVAL_MIN)) * speedFactor;
  }
  if (roadZ >= nextGemZ) {
    spawnGem();
    nextGemZ = roadZ + GEM_INTERVAL + Math.random() * 80;
  }

  // Collision with obstacles
  if (invincible <= 0) {
    for (const obs of obstacles) {
      if (!obs.alive) continue;
      const dz = ((roadZ - obs.z) % ZLOOP + ZLOOP) % ZLOOP;
      if (dz < 30) {
        const dx = Math.abs(playerX - obs.lane);
        if (dx < 0.22) {
          // crash
          triggerDeath();
          return;
        }
      }
    }
  }

  // Collect gems
  for (const gem of gems) {
    if (gem.collected || !gem.alive) continue;
    const dz = ((roadZ - gem.z) % ZLOOP + ZLOOP) % ZLOOP;
    if (dz < 25) {
      const dx = Math.abs(playerX - gem.lane);
      if (dx < 0.2) {
        gem.collected = true;
        gem.flash = 1;
        score += 50;
        playSound('coin');
        const gp = project(gem.lane, gem.z);
        spawnParticles(gp.x, gp.y, '#00ffc8', 12);
      }
    }
  }

  // Cull old obstacles
  obstacles = obstacles.filter(o => {
    const dz = ((roadZ - o.z) % ZLOOP + ZLOOP) % ZLOOP;
    return dz < ZLOOP * 0.85;
  });
  gems = gems.filter(g => {
    const dz = ((roadZ - g.z) % ZLOOP + ZLOOP) % ZLOOP;
    return dz < ZLOOP * 0.85;
  });

  // Particles
  for (const p of particles) {
    p.x += p.vx; p.y += p.vy;
    p.vy += 0.1;
    p.life -= p.decay;
  }
  particles = particles.filter(p => p.life > 0);

  // Fall off edge?
  if (Math.abs(playerX) >= ROAD_HALF) {
    triggerDeath();
  }
}

function triggerDeath() {
  gameState = 'dead';
  playSound('crash');
  slowMo = 15;

  // Big particle burst
  const bp = project(playerX, 0);
  spawnParticles(bp.x, bp.y, '#ff3d6b', 30);
  spawnParticles(bp.x, bp.y, '#ffcc00', 20);

  if (score > bestScore) {
    bestScore = score;
    localStorage.setItem('slope_best', bestScore);
    bestValEl.textContent = bestScore;
  }

  finalScoreEl.textContent = score;
  finalBestEl.textContent = bestScore;

  setTimeout(() => {
    gameOverScreen.classList.add('active');
    if (window.GZMonetagSafe) window.GZMonetagSafe.maybeLoad();
  }, 600);
}

// ─── DRAW ─────────────────────────────────────────────────

// Glow helper
function glow(color, blur) {
  ctx.shadowColor = color;
  ctx.shadowBlur = blur;
}
function noGlow() {
  ctx.shadowBlur = 0;
}

// Draw a glowing line
function drawLine(x1, y1, x2, y2, color, width, glowBlur) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  glow(color, glowBlur);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  noGlow();
  ctx.restore();
}

// Draw filled glowing rect
function drawGlowRect(x, y, w, h, fill, glowColor, glowBlur) {
  ctx.save();
  ctx.fillStyle = fill;
  glow(glowColor, glowBlur);
  ctx.fillRect(x, y, w, h);
  noGlow();
  ctx.restore();
}

// Draw background with star field
let stars = [];
function initStars() {
  stars = [];
  for (let i = 0; i < 180; i++) {
    stars.push({
      x: Math.random() * W, y: Math.random() * H,
      size: Math.random() * 1.5,
      alpha: Math.random(),
      speed: 0.2 + Math.random() * 0.8
    });
  }
}
initStars();

function drawBackground() {
  // Deep space gradient
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0,   '#050510');
  grad.addColorStop(0.35,'#0a0a2e');
  grad.addColorStop(0.6, '#12124a');
  grad.addColorStop(1,   '#1a0a3a');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Stars
  for (const s of stars) {
    const twinkle = 0.5 + 0.5 * Math.sin(frameCount * 0.05 + s.x);
    ctx.globalAlpha = s.alpha * twinkle;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(s.x, s.y, s.size, s.size);
    if (gameState === 'playing') {
      s.y += s.speed * (speed / 3);
      if (s.y > HORIZON) { s.y = 0; s.x = Math.random() * W; }
    }
  }
  ctx.globalAlpha = 1;

  // Horizon glow
  const hGrad = ctx.createLinearGradient(0, HORIZON - 60, 0, HORIZON + 20);
  hGrad.addColorStop(0, 'rgba(0,255,200,0)');
  hGrad.addColorStop(0.5, 'rgba(0,255,200,0.06)');
  hGrad.addColorStop(1, 'rgba(0,255,200,0)');
  ctx.fillStyle = hGrad;
  ctx.fillRect(0, HORIZON - 60, W, 80);
}

// Draw the road surface
function drawRoad() {
  // Draw road bands from horizon to bottom
  const NUM_SEGMENTS = 60;
  for (let i = NUM_SEGMENTS - 1; i >= 0; i--) {
    const t0 = i / NUM_SEGMENTS;
    const t1 = (i + 1) / NUM_SEGMENTS;
    const p0 = project(0, roadZ + (1 - t0) * ZLOOP * 0.4);
    const p1 = project(0, roadZ + (1 - t1) * ZLOOP * 0.4);
    if (p0.y < HORIZON) continue;

    // Alternating dark strips for depth
    const stripAlpha = 0.04 + (i % 2) * 0.03;
    const roadColor = i % 2 === 0 ? `rgba(20,20,60,${stripAlpha})` : `rgba(10,10,40,${stripAlpha})`;
    const left0  = VP_X - p0.roadHalfW;
    const right0 = VP_X + p0.roadHalfW;
    const left1  = VP_X - p1.roadHalfW;
    const right1 = VP_X + p1.roadHalfW;

    ctx.beginPath();
    ctx.moveTo(left0,  p0.y);
    ctx.lineTo(right0, p0.y);
    ctx.lineTo(right1, p1.y);
    ctx.lineTo(left1,  p1.y);
    ctx.closePath();
    ctx.fillStyle = roadColor;
    ctx.fill();
  }

  // Road edge lines (neon)
  for (let i = 0; i < NUM_SEGMENTS; i++) {
    const t0 = i / NUM_SEGMENTS;
    const t1 = (i + 1) / NUM_SEGMENTS;
    const p0 = project(0, roadZ + (1 - t0) * ZLOOP * 0.4);
    const p1 = project(0, roadZ + (1 - t1) * ZLOOP * 0.4);
    if (p0.y < HORIZON) continue;

    const left0  = VP_X - p0.roadHalfW;
    const right0 = VP_X + p0.roadHalfW;
    const left1  = VP_X - p1.roadHalfW;
    const right1 = VP_X + p1.roadHalfW;

    const alpha = Math.pow(1 - t0, 0.8) * 0.9;
    const edgeColor = `rgba(0,255,200,${alpha})`;
    const lw = Math.max(0.5, p0.scale * 2);

    drawLine(left0, p0.y, left1, p1.y, edgeColor, lw, 8 * p0.scale);
    drawLine(right0, p0.y, right1, p1.y, edgeColor, lw, 8 * p0.scale);
  }

  // Center dashes
  for (let i = 0; i < NUM_SEGMENTS; i++) {
    const t0 = i / NUM_SEGMENTS;
    const t1 = (i + 1) / NUM_SEGMENTS;
    if (i % 4 >= 2) continue;
    const p0 = project(0, roadZ + (1 - t0) * ZLOOP * 0.4);
    const p1 = project(0, roadZ + (1 - t1) * ZLOOP * 0.4);
    if (p0.y < HORIZON) continue;
    const alpha = Math.pow(1 - t0, 0.5) * 0.25;
    drawLine(VP_X, p0.y, VP_X, p1.y, `rgba(0,200,255,${alpha})`, Math.max(0.3, p0.scale * 1.2), 4 * p0.scale);
  }
}

// Draw obstacle
function drawObstacle(obs) {
  const dz = ((roadZ - obs.z) % ZLOOP + ZLOOP) % ZLOOP;
  if (dz > ZLOOP * 0.5) return; // too far behind
  const proj = project(obs.lane, obs.z);
  if (proj.y < HORIZON) return;
  const size = 18 * proj.scale;
  if (size < 1) return;

  const isWall = obs.type === 'wall';
  const mainColor = isWall ? '#ff3d6b' : '#ff6b35';
  const glowColor = isWall ? '#ff3d6b' : '#ff9500';

  ctx.save();
  glow(glowColor, 15 * proj.scale);
  ctx.fillStyle = mainColor;
  if (isWall) {
    // Wall: tall rectangle
    const w = size * 2.2;
    const h = size * 2.8;
    ctx.fillRect(proj.x - w / 2, proj.y - h, w, h);
    // Inner highlight
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.fillRect(proj.x - w / 2 + size * 0.2, proj.y - h + size * 0.2, w * 0.6, size * 0.4);
  } else {
    // Block: cube-ish (3 faces)
    const s = size * 1.5;
    // Front face
    ctx.fillStyle = mainColor;
    ctx.fillRect(proj.x - s / 2, proj.y - s, s, s);
    // Top face (lighter)
    ctx.fillStyle = 'rgba(255,150,80,0.5)';
    ctx.beginPath();
    ctx.moveTo(proj.x - s / 2, proj.y - s);
    ctx.lineTo(proj.x - s / 4, proj.y - s - size * 0.5);
    ctx.lineTo(proj.x + s / 4, proj.y - s - size * 0.5);
    ctx.lineTo(proj.x + s / 2, proj.y - s);
    ctx.fill();
    // Right face (darker)
    ctx.fillStyle = 'rgba(200,60,0,0.5)';
    ctx.beginPath();
    ctx.moveTo(proj.x + s / 2, proj.y - s);
    ctx.lineTo(proj.x + s / 4, proj.y - s - size * 0.5);
    ctx.lineTo(proj.x + s / 4, proj.y - size * 0.5);
    ctx.lineTo(proj.x + s / 2, proj.y);
    ctx.fill();
  }
  noGlow();
  ctx.restore();
}

// Draw gem
function drawGem(gem) {
  if (gem.collected && gem.flash <= 0) return;
  const dz = ((roadZ - gem.z) % ZLOOP + ZLOOP) % ZLOOP;
  if (dz > ZLOOP * 0.5) return;
  const proj = project(gem.lane, gem.z);
  if (proj.y < HORIZON) return;
  const size = 12 * proj.scale;
  if (size < 1) return;

  const pulse = 0.7 + 0.3 * Math.sin(frameCount * 0.15);

  ctx.save();
  glow('#00ffc8', 20 * proj.scale * pulse);
  // Diamond shape
  ctx.fillStyle = gem.collected ? `rgba(0,255,200,${gem.flash})` : '#00ffc8';
  ctx.beginPath();
  ctx.moveTo(proj.x, proj.y - size * 1.4);
  ctx.lineTo(proj.x + size, proj.y - size * 0.7);
  ctx.lineTo(proj.x, proj.y);
  ctx.lineTo(proj.x - size, proj.y - size * 0.7);
  ctx.closePath();
  ctx.fill();
  // Inner shine
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.beginPath();
  ctx.moveTo(proj.x, proj.y - size * 1.2);
  ctx.lineTo(proj.x + size * 0.4, proj.y - size * 0.8);
  ctx.lineTo(proj.x, proj.y - size * 0.5);
  ctx.lineTo(proj.x - size * 0.4, proj.y - size * 0.8);
  ctx.closePath();
  ctx.fill();
  noGlow();
  ctx.restore();

  if (!gem.collected) gem.flash = pulse;
  else gem.flash = Math.max(0, gem.flash - 0.05);
}

// Draw player ball
function drawBall() {
  if (gameState === 'dead') return;
  const proj = project(playerX, 0);
  const r = 14 * proj.scale;
  if (r < 2) return;

  const flicker = invincible > 0 ? (Math.floor(frameCount / 4) % 2 === 0 ? 0.3 : 1) : 1;

  ctx.save();
  ctx.globalAlpha = flicker;

  // Ball shadow
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(proj.x + 3 * proj.scale, proj.y + 2 * proj.scale, r * 1.1, r * 0.4, 0, 0, Math.PI * 2);
  ctx.fill();

  // Ball glow
  glow('#00ffc8', 20 * proj.scale);

  // Ball gradient
  const grad = ctx.createRadialGradient(
    proj.x - r * 0.3, proj.y - r * 0.35, r * 0.1,
    proj.x, proj.y, r
  );
  grad.addColorStop(0,   '#ffffff');
  grad.addColorStop(0.2, '#aaffee');
  grad.addColorStop(0.5, '#00ffc8');
  grad.addColorStop(1,   '#0066aa');

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(proj.x, proj.y, r, 0, Math.PI * 2);
  ctx.fill();

  // Rolling indicator ring
  const rollAngle = roadZ * 0.08;
  ctx.strokeStyle = 'rgba(255,255,255,0.3)';
  ctx.lineWidth = r * 0.15;
  ctx.beginPath();
  ctx.arc(proj.x, proj.y, r * 0.65, rollAngle, rollAngle + Math.PI * 1.5);
  ctx.stroke();

  noGlow();
  ctx.restore();
}

// Draw trail
function drawTrail() {
  if (gameState === 'dead') return;
  for (let i = 0; i < trail.length; i++) {
    const t = trail[i];
    const alpha = (1 - t.age / 30) * 0.35;
    if (alpha <= 0) continue;
    const r = (1 - t.age / 30) * 8;
    ctx.save();
    ctx.globalAlpha = alpha;
    glow('#00ffc8', 6);
    ctx.fillStyle = '#00ffc8';
    ctx.beginPath();
    ctx.arc(t.x, t.y, r, 0, Math.PI * 2);
    ctx.fill();
    noGlow();
    ctx.restore();
  }
}

// Draw particles
function drawParticles() {
  for (const p of particles) {
    ctx.save();
    ctx.globalAlpha = p.life;
    glow(p.color, 8 * p.life);
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    noGlow();
    ctx.restore();
  }
}

// Draw scanline / vignette overlay
function drawOverlay() {
  // Vignette
  const vig = ctx.createRadialGradient(W/2, H/2, H * 0.3, W/2, H/2, H * 0.9);
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(0,0,0,0.55)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, W, H);

  // Scanlines
  ctx.save();
  ctx.globalAlpha = 0.03;
  for (let y = 0; y < H; y += 3) {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, y, W, 1);
  }
  ctx.restore();
}

// Draw speed indicator
function drawSpeedBar() {
  const barW = 80;
  const barH = 6;
  const bx = W - 20 - barW;
  const by = 60;
  const progress = (speed - 3) / (speedMax - 3);

  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(bx - 1, by - 1, barW + 2, barH + 2);
  const barGrad = ctx.createLinearGradient(bx, 0, bx + barW, 0);
  barGrad.addColorStop(0, '#00ffc8');
  barGrad.addColorStop(0.6, '#ffcc00');
  barGrad.addColorStop(1, '#ff3d6b');
  ctx.fillStyle = barGrad;
  ctx.fillRect(bx, by, barW * progress, barH);

  ctx.fillStyle = 'rgba(0,255,200,0.6)';
  ctx.font = `${Math.round(9 * (W / 400))}px Orbitron, sans-serif`;
  ctx.textAlign = 'right';
  ctx.fillText('SPEED', W - 20, by - 4);
  ctx.restore();
}

// ─── MAIN LOOP ────────────────────────────────────────────
function draw() {
  ctx.clearRect(0, 0, W, H);
  drawBackground();

  if (gameState === 'playing' || gameState === 'dead') {
    drawRoad();

    // Sort obstacles & gems by Z (far to near)
    const allThings = [
      ...obstacles.map(o => ({ type: 'obs', data: o, z: ((roadZ - o.z) % ZLOOP + ZLOOP) % ZLOOP })),
      ...gems.map(g => ({ type: 'gem', data: g, z: ((roadZ - g.z) % ZLOOP + ZLOOP) % ZLOOP }))
    ];
    allThings.sort((a, b) => b.z - a.z);

    for (const thing of allThings) {
      if (thing.type === 'obs') drawObstacle(thing.data);
      else drawGem(thing.data);
    }

    drawTrail();
    drawBall();
    drawParticles();
    drawSpeedBar();
  }

  drawOverlay();
}

let lastTime = 0;
function loop(timestamp) {
  const dt = Math.min(timestamp - lastTime, 50);
  lastTime = timestamp;

  if (gameState === 'playing') {
    update();
  } else if (gameState === 'dead') {
    // slow-mo particles
    if (slowMo > 0) {
      slowMo--;
      for (const p of particles) { p.x += p.vx * 0.3; p.y += p.vy * 0.3; p.life -= p.decay * 0.5; }
      particles = particles.filter(p => p.life > 0);
    }
    // update gem flash
    for (const gem of gems) { if (gem.flash > 0) gem.flash -= 0.03; }
  }

  draw();
  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
