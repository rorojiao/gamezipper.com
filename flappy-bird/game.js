'use strict';

// ─── Canvas Setup ─────────────────────────────────────────────────────────────
const canvas = document.getElementById('c');
const ctx    = canvas.getContext('2d');

// Logical game dimensions (portrait, 9:16)
const GAME_W = 360;
const GAME_H = 640;

function resize() {
  const maxW = Math.min(window.innerWidth,  440);
  const maxH = window.innerHeight - 60;
  const scale = Math.min(maxW / GAME_W, maxH / GAME_H);
  canvas.width  = GAME_W;
  canvas.height = GAME_H;
  canvas.style.width  = (GAME_W * scale) + 'px';
  canvas.style.height = (GAME_H * scale) + 'px';
}
resize();
window.addEventListener('resize', resize);

// ─── Audio (Web Audio API) ────────────────────────────────────────────────────
let _actx = null;
function ac() {
  if (!_actx) _actx = new (window.AudioContext || window.webkitAudioContext)();
  if (_actx.state === 'suspended') _actx.resume();
  return _actx;
}

function tone(freq, type, dur, vol = 0.25, freqEnd = null) {
  try {
    const a = ac();
    const o = a.createOscillator();
    const g = a.createGain();
    o.connect(g); g.connect(a.destination);
    o.type = type;
    o.frequency.setValueAtTime(freq, a.currentTime);
    if (freqEnd) o.frequency.exponentialRampToValueAtTime(freqEnd, a.currentTime + dur);
    g.gain.setValueAtTime(vol, a.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, a.currentTime + dur);
    o.start(); o.stop(a.currentTime + dur);
  } catch(_) {}
}

function sfxFlap()  { tone(440, 'square',   0.08, 0.12, 520); }
function sfxScore() { tone(880, 'sine',     0.15, 0.18, 1100); }
function sfxDie()   { tone(220, 'sawtooth', 0.35, 0.22, 55);  }

// ─── State ────────────────────────────────────────────────────────────────────
const S = { MENU: 0, PLAY: 1, DEAD: 2 };
let state = S.MENU;

let score    = 0;
let highScore = parseInt(localStorage.getItem('fb_hs') || '0', 10);
let frameN   = 0;   // increments every update (~60/s)
let deadTimer = 0;

// ─── Bird ─────────────────────────────────────────────────────────────────────
const BIRD_W = 30, BIRD_H = 22;
let bird = { x: 70, y: GAME_H / 2, vy: 0 };

const GRAVITY    =  0.42;
const FLAP_VEL  = -8.5;
const MAX_FALL  =  13;

function resetBird() {
  bird.y  = GAME_H / 2;
  bird.vy = 0;
}

function flap() {
  if (state === S.MENU) { startGame(); return; }
  if (state === S.DEAD) {
    if (deadTimer > 45) resetGame();
    return;
  }
  bird.vy = FLAP_VEL;
  sfxFlap();
}

// ─── Pipes ────────────────────────────────────────────────────────────────────
let pipes     = [];
let pipeSpeed = 2.2;
let pipeTimer = 0;

const PIPE_W    = 52;
const PIPE_GAP  = 178;   // base gap (shrinks with difficulty)
const PIPE_SPAWN = 110;  // frames between pipe spawns

// Colour palette cycles through these pipe colours
const PIPE_PALETTES = [
  { top: '#39d353', bot: '#27a33f', rim: '#5dff70' },  // green
  { top: '#ff5252', bot: '#c62828', rim: '#ff8a80' },  // red
  { top: '#40c4ff', bot: '#0288d1', rim: '#80d8ff' },  // blue
  { top: '#ffca28', bot: '#f57f17', rim: '#ffe57f' },  // amber
  { top: '#ab47bc', bot: '#6a1b9a', rim: '#e040fb' },  // purple
  { top: '#26a69a', bot: '#00796b', rim: '#80cbc4' },  // teal
];
let paletteIdx = 0;

function spawnPipe() {
  const minGap = Math.max(130, PIPE_GAP - score * 1.2);
  const gap    = minGap + Math.random() * 40;
  const cx     = GAME_W + PIPE_W;
  const minY   = 70, maxY = GAME_H - 70 - gap;
  const gapY   = minY + Math.random() * (maxY - minY);
  const spd    = Math.min(4.5, pipeSpeed + score * 0.025);
  const pal   = PIPE_PALETTES[paletteIdx % PIPE_PALETTES.length];
  paletteIdx++;
  pipes.push({ x: cx, gapY, gap, speed: spd, pal, scored: false });
}

// ─── Stars (background) ───────────────────────────────────────────────────────
const STARS = Array.from({ length: 80 }, () => ({
  x:  Math.random() * GAME_W,
  y:  Math.random() * (GAME_H * 0.72),
  r:  0.5 + Math.random() * 1.4,
  br: Math.random(),          // brightness base
  bs: 0.005 + Math.random() * 0.01, // blink speed
}));

// ─── Ground scroll ────────────────────────────────────────────────────────────
let groundX = 0;
const GROUND_H = 70;
const GROUND_Y = GAME_H - GROUND_H;

// ─── Game Control ─────────────────────────────────────────────────────────────
function startGame() {
  state     = S.PLAY;
  score     = 0;
  pipes     = [];
  pipeTimer = 60;  // first pipe after 1 second
  paletteIdx = 0;
  pipeSpeed  = 2.2;
  resetBird();
}

function resetGame() {
  state      = S.MENU;
  score      = 0;
  pipes      = [];
  pipeTimer  = 0;
  deadTimer  = 0;
  groundX    = 0;
  paletteIdx  = 0;
  pipeSpeed   = 2.2;
  resetBird();
}

function die() {
  state     = S.DEAD;
  deadTimer = 0;
  if (score > highScore) {
    highScore = score;
    localStorage.setItem('fb_hs', highScore);
  }
  sfxDie();
  if (typeof window.GZMonetagSafe !== 'undefined') {
    window.GZMonetagSafe.maybeLoad();
  }
}

// ─── Input ────────────────────────────────────────────────────────────────────
function onAction(e) {
  if (e) e.preventDefault();
  flap();
}

canvas.addEventListener('click',      onAction);
canvas.addEventListener('touchstart', onAction, { passive: false });
document.addEventListener('keydown', e => {
  if (e.code === 'Space' || e.code === 'ArrowUp') { e.preventDefault(); flap(); }
});

// ─── Collision ────────────────────────────────────────────────────────────────
function birdRect() {
  return {
    x: bird.x - BIRD_W / 2 + 4,
    y: bird.y - BIRD_H / 2 + 3,
    w: BIRD_W - 8,
    h: BIRD_H - 6,
  };
}

function pipeRects(p) {
  return [
    { x: p.x, y: 0,           w: PIPE_W, h: p.gapY },           // top shaft
    { x: p.x, y: p.gapY + p.gap, w: PIPE_W, h: GAME_H - p.gapY - p.gap }, // bottom shaft
  ];
}

function overlaps(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x &&
         a.y < b.y + b.h && a.y + a.h > b.y;
}

function checkCollisions() {
  const br = birdRect();
  // ceiling / floor
  if (bird.y - BIRD_H / 2 < 0 || bird.y + BIRD_H / 2 > GROUND_Y) return true;
  // pipes
  for (const p of pipes) {
    for (const pr of pipeRects(p)) {
      if (overlaps(br, pr)) return true;
    }
  }
  return false;
}

// ─── Update ───────────────────────────────────────────────────────────────────
function update() {
  frameN++;

  if (state === S.PLAY) {
    // Bird physics
    bird.vy = Math.min(bird.vy + GRAVITY, MAX_FALL);
    bird.y += bird.vy;

    // Spawn pipes
    pipeTimer--;
    if (pipeTimer <= 0) {
      spawnPipe();
      pipeTimer = PIPE_SPAWN;
    }

    // Move & score pipes
    for (let i = pipes.length - 1; i >= 0; i--) {
      const p = pipes[i];
      p.x -= p.speed;

      // Score: bird centre passes pipe centre
      if (!p.scored && bird.x > p.x + PIPE_W / 2) {
        p.scored = true;
        score++;
        sfxScore();
        if (score % 5 === 0) pipeSpeed = Math.min(4.5, pipeSpeed + 0.15);
      }

      // Remove off-screen pipes
      if (p.x + PIPE_W < 0) pipes.splice(i, 1);
    }

    // Collision
    if (checkCollisions()) { die(); return; }

  } else if (state === S.DEAD) {
    deadTimer++;
    // Bird falls a little then freezes
    if (bird.vy < MAX_FALL) {
      bird.vy += GRAVITY * 0.6;
      bird.y  += bird.vy;
    }
    if (bird.y + BIRD_H / 2 > GROUND_Y) { bird.y = GROUND_Y - BIRD_H / 2; bird.vy = 0; }
  }

  // Ground scroll (always, for ambiance)
  if (state !== S.MENU) groundX = (groundX + (state === S.PLAY ? pipeSpeed : 0.8)) % 36;
}

// ─── Draw helpers ─────────────────────────────────────────────────────────────
function rrect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawPipe(p) {
  const pal = p.pal;
  const sx  = p.x, sw = PIPE_W;

  // ── Top pipe (hangs from ceiling) ──
  const topH = p.gapY;
  const rimH = 22, rimW = sw + 12;

  // Cap
  ctx.fillStyle = pal.rim;
  rrect(sx - 6, topH - rimH, rimW, rimH, 5);
  ctx.fill();

  // Shaft
  const gradT = ctx.createLinearGradient(sx, 0, sx + sw, 0);
  gradT.addColorStop(0,   pal.top + 'bb');
  gradT.addColorStop(0.3, pal.top);
  gradT.addColorStop(0.7, pal.top);
  gradT.addColorStop(1,   pal.top + '88');
  ctx.fillStyle = gradT;
  ctx.fillRect(sx, 0, sw, topH - rimH);

  // Shaft edge highlight
  ctx.fillStyle = pal.rim + '55';
  ctx.fillRect(sx, 0, 5, topH - rimH);

  // ── Bottom pipe ──
  const botY = p.gapY + p.gap;
  const botH = GROUND_Y - botY;

  // Shaft
  const gradB = ctx.createLinearGradient(sx, 0, sx + sw, 0);
  gradB.addColorStop(0,   pal.bot + 'bb');
  gradB.addColorStop(0.3, pal.bot);
  gradB.addColorStop(0.7, pal.bot);
  gradB.addColorStop(1,   pal.bot + '88');
  ctx.fillStyle = gradB;
  ctx.fillRect(sx, botY + rimH, sw, botH - rimH);

  // Cap
  ctx.fillStyle = pal.rim;
  rrect(sx - 6, botY, rimW, rimH, 5);
  ctx.fill();

  // Shaft edge highlight
  ctx.fillStyle = pal.rim + '44';
  ctx.fillRect(sx, botY + rimH, 5, botH - rimH);
}

function drawBird() {
  const x = bird.x, y = bird.y;
  const t = frameN * 0.18;
  const wingAngle = state === S.PLAY
    ? (bird.vy < 0 ? -0.45 : 0.3 + Math.sin(t) * 0.15)
    : 0.2;

  ctx.save();
  ctx.translate(x, y);

  // Slight rotation based on velocity
  const rot = state === S.PLAY
    ? Math.max(-0.5, Math.min(0.7, bird.vy * 0.055))
    : 0.7;
  ctx.rotate(rot);

  // Body
  ctx.fillStyle = '#ffe033';
  ctx.beginPath();
  ctx.ellipse(0, 0, BIRD_W / 2, BIRD_H / 2, 0, 0, Math.PI * 2);
  ctx.fill();

  // Body outline
  ctx.strokeStyle = '#e6a800';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Wing
  ctx.save();
  ctx.rotate(wingAngle);
  ctx.fillStyle = '#ffd000';
  ctx.beginPath();
  ctx.ellipse(-4, 2, 9, 5, -0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#c89000';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();

  // Eye white
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(8, -4, 6, 0, Math.PI * 2);
  ctx.fill();
  // Pupil
  ctx.fillStyle = '#111';
  ctx.beginPath();
  ctx.arc(10, -4, 3.5, 0, Math.PI * 2);
  ctx.fill();
  // Eye shine
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(11, -5.5, 1.5, 0, Math.PI * 2);
  ctx.fill();

  // Beak
  ctx.fillStyle = '#ff6b35';
  ctx.beginPath();
  ctx.moveTo(12, 2);
  ctx.lineTo(22, 5);
  ctx.lineTo(12, 9);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#c44d1a';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.restore();
}

function drawGround() {
  // Dark ground
  ctx.fillStyle = '#1a3a1a';
  ctx.fillRect(0, GROUND_Y, GAME_W, GROUND_H);

  // Grass stripe
  ctx.fillStyle = '#2d5a2d';
  ctx.fillRect(0, GROUND_Y, GAME_W, 10);

  // Scrolling dashes
  ctx.fillStyle = '#3a7a3a';
  const dashW = 36, dashH = 6;
  for (let gx = -groundX; gx < GAME_W + dashW; gx += dashW) {
    ctx.fillRect(gx, GROUND_Y + 10, dashW - 4, dashH);
  }

  // Ground bottom edge
  ctx.fillStyle = '#0f2a0f';
  ctx.fillRect(0, GAME_H - 8, GAME_W, 8);
}

function drawStars() {
  for (const s of STARS) {
    const blink = 0.5 + 0.5 * Math.sin(frameN * s.bs + s.br * 10);
    const alpha = (0.3 + s.br * 0.5) * blink;
    ctx.fillStyle = `rgba(255,255,240,${alpha.toFixed(2)})`;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawMoon() {
  // Moon body
  const mx = GAME_W - 55, my = 55, mr = 28;
  ctx.fillStyle = '#fffde7';
  ctx.beginPath();
  ctx.arc(mx, my, mr, 0, Math.PI * 2);
  ctx.fill();
  // Moon craters
  ctx.fillStyle = '#e8e5c0';
  [[8,-6,6],[-4,8,4],[14,5,3]].forEach(([dx,dy,r]) => {
    ctx.beginPath();
    ctx.arc(mx+dx, my+dy, r, 0, Math.PI * 2);
    ctx.fill();
  });
  // Glow
  const grd = ctx.createRadialGradient(mx, my, mr * 0.5, mx, my, mr * 2.5);
  grd.addColorStop(0, 'rgba(255,253,220,0.15)');
  grd.addColorStop(1, 'rgba(255,253,220,0)');
  ctx.fillStyle = grd;
  ctx.beginPath();
  ctx.arc(mx, my, mr * 2.5, 0, Math.PI * 2);
  ctx.fill();
}

function drawHUD() {
  // Score shadow
  ctx.fillStyle = '#000';
  ctx.font = 'bold 44px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(score, GAME_W / 2 + 2, 62);
  // Score
  ctx.fillStyle = '#fff';
  ctx.fillText(score, GAME_W / 2, 60);

  // High score badge (top-right)
  ctx.font = '13px system-ui, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.fillText('BEST ' + highScore, GAME_W - 14, 24);
}

function drawMenuScreen() {
  // Title
  ctx.textAlign = 'center';

  // Subtitle shadow
  ctx.fillStyle = '#000';
  ctx.font = 'bold 14px system-ui, sans-serif';
  ctx.fillText('RETRO ARCADE EDITION', GAME_W / 2 + 1, GAME_H / 2 - 85);

  ctx.font = 'bold 40px system-ui, sans-serif';
  ctx.fillStyle = '#000';
  ctx.fillText('FLAPPY BIRD', GAME_W / 2 + 2, GAME_H / 2 - 52);

  ctx.fillStyle = '#ffe033';
  ctx.fillText('FLAPPY BIRD', GAME_W / 2, GAME_H / 2 - 54);

  // Tap hint
  const blink = 0.5 + 0.5 * Math.sin(frameN * 0.05);
  ctx.font = '16px system-ui, sans-serif';
  ctx.fillStyle = `rgba(255,255,255,${(0.4 + blink * 0.5).toFixed(2)})`;
  ctx.fillText('TAP  /  SPACE  TO  START', GAME_W / 2, GAME_H / 2 + 10);

  // High score
  if (highScore > 0) {
    ctx.font = '14px system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255,220,100,0.75)';
    ctx.fillText('BEST: ' + highScore, GAME_W / 2, GAME_H / 2 + 38);
  }

  // Controls hint
  ctx.font = '12px system-ui, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.fillText('SPACE · CLICK · TAP', GAME_W / 2, GAME_H / 2 + 60);
}

function drawDeadScreen() {
  // Dim overlay
  ctx.fillStyle = 'rgba(0,0,20,0.55)';
  ctx.fillRect(0, 0, GAME_W, GAME_H);

  const cy = GAME_H / 2;

  // Panel
  ctx.fillStyle = 'rgba(10,5,40,0.9)';
  rrect(GAME_W / 2 - 130, cy - 95, 260, 195, 18);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.textAlign = 'center';

  ctx.font = 'bold 22px system-ui, sans-serif';
  ctx.fillStyle = '#ff5252';
  ctx.fillText('GAME OVER', GAME_W / 2, cy - 58);

  // Score
  ctx.font = '15px system-ui, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.fillText('SCORE', GAME_W / 2, cy - 24);
  ctx.font = 'bold 40px system-ui, sans-serif';
  ctx.fillStyle = '#ffe033';
  ctx.fillText(score, GAME_W / 2, cy + 20);

  // Best
  const isNew = score >= highScore && score > 0;
  ctx.font = '13px system-ui, sans-serif';
  ctx.fillStyle = isNew ? '#6bff8a' : 'rgba(255,255,255,0.5)';
  ctx.fillText(isNew ? '★ NEW BEST! ★' : 'BEST: ' + highScore, GAME_W / 2, cy + 50);

  // Restart hint
  if (deadTimer > 45) {
    const blink2 = 0.5 + 0.5 * Math.sin(frameN * 0.08);
    ctx.font = '14px system-ui, sans-serif';
    ctx.fillStyle = `rgba(255,255,255,${(0.35 + blink2 * 0.5).toFixed(2)})`;
    ctx.fillText('TAP TO PLAY AGAIN', GAME_W / 2, cy + 82);
  }
}

// ─── Main Draw ────────────────────────────────────────────────────────────────
function draw() {
  // Sky gradient background
  const sky = ctx.createLinearGradient(0, 0, 0, GAME_H);
  sky.addColorStop(0,   '#0a0a2e');
  sky.addColorStop(0.5, '#12113a');
  sky.addColorStop(1,   '#1a1040');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, GAME_W, GAME_H);

  drawMoon();
  drawStars();

  // Pipes (behind bird)
  for (const p of pipes) drawPipe(p);

  // Ground
  drawGround();

  // Bird
  drawBird();

  // HUD
  if (state === S.PLAY) drawHUD();

  // Overlays
  if (state === S.MENU) drawMenuScreen();
  if (state === S.DEAD) drawDeadScreen();
}

// ─── Game Loop ────────────────────────────────────────────────────────────────
function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

loop();
