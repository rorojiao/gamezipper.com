/* ============================================
   NEON RUN — Endless Platform Runner
   Pure Canvas, Web Audio, Responsive
   ============================================ */
(function(){
'use strict';

// ─── CANVAS SETUP ───────────────────────────
const canvas = document.getElementById('c');
const ctx    = canvas.getContext('2d');
const GROUND = 0.72; // ground Y ratio
let W, H, GY;

function resize() {
  const maxW = Math.min(window.innerWidth, 800);
  W = canvas.width  = maxW;
  H = canvas.height = window.innerHeight;
  GY = H * GROUND;
}
resize();
window.addEventListener('resize', () => { resize(); if (state === 'idle') drawMenu(); });

// ─── AUDIO (Web Audio API) ─────────────────
let AC = null;
function getAC() {
  if (!AC) AC = new (window.AudioContext || window.webkitAudioContext)();
  return AC;
}
function tone(freq, type, dur, vol=0.25, freqEnd=null) {
  try {
    const ac = getAC();
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.connect(g); g.connect(ac.destination);
    o.type = type; o.frequency.setValueAtTime(freq, ac.currentTime);
    if (freqEnd) o.frequency.linearRampToValueAtTime(freqEnd, ac.currentTime + dur);
    g.gain.setValueAtTime(vol, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + dur);
    o.start(); o.stop(ac.currentTime + dur);
  } catch(e) {}
}
const sfxJump  = () => { tone(440,'sine',.12,.2,880); tone(660,'sine',.08,.1,1320); };
const sfxJump2 = () => { tone(880,'sine',.15,.15,440); };
const sfxStar  = () => { tone(880,'square',.08,.12,1760); tone(1320,'sine',.06,.08); };
const sfxDie   = () => { tone(220,'sawtooth',.4,.3,55); tone(110,'sawtooth',.3,.2,27); };
const sfxScore = () => { tone(660,'sine',.06,.1,990); };

// ─── CONSTANTS ─────────────────────────────
const GRAVITY    = 0.65;
const JUMP_V     = -13;
const JUMP2_V    = -11;
const PLAYER_SZ  = 32;
const STAR_RADIUS = 13;
const BASE_SPEED  = 5;
const MAX_SPEED   = 14;
const SPEED_STEP  = 0.0012;

// ─── STATE ────────────────────────────────
let state      = 'idle'; // idle | playing | dead
let score      = 0;
let hiScore    = parseInt(localStorage.getItem('neonrun_hi') || '0');
let speed      = BASE_SPEED;
let dist       = 0;
let stars      = 0;
let camX       = 0;
let frame      = 0;
let particles  = [];
let bgStars    = [];
let platGenX   = 0;

// ─── PLAYER ───────────────────────────────
const P = {
  x:0, y:0, vy:0,
  onGround:false, canJump2:true,
  trail:[], deadAnim:0
};
function resetPlayer() {
  P.x = W * 0.18;
  P.y = GY - PLAYER_SZ;
  P.vy = 0;
  P.onGround = true;
  P.canJump2 = true;
  P.trail = [];
  P.deadAnim = 0;
}

// ─── WORLD OBJECTS ────────────────────────
// { type:'spike'|'block'|'star'|'platform', x,y,w,h, collected }
let objs = [];
let platforms = []; // { x,y,w,h }

function objAt(x,y,w,h) { return objs.filter(o=>o.x< x+w && o.x+o.w>x && o.y<y+h && o.y+o.h>y); }

function spawnWorld() {
  objs = [];
  platforms = [];
  platGenX = W * 0.5;

  // Starting safe zone
  for (let i = 0; i < 3; i++) spawnRow(W * 0.5 + i * 400);

  // Initial platforms
  for (let i = 0; i < 6; i++) {
    spawnRow(platGenX);
    platGenX += 200 + Math.random() * 300;
  }
}

function spawnRow(baseX) {
  const r = Math.random();
  if (r < 0.35) {
    // ground spikes
    const n = 1 + Math.floor(Math.random() * 3);
    for (let i = 0; i < n; i++) {
      objs.push({ type:'spike', x: baseX + i*28, y: GY - 28, w:24, h:28, collected:false });
    }
  } else if (r < 0.55) {
    // elevated block
    objs.push({ type:'block', x: baseX, y: GY - 48, w:40, h:48, collected:false });
  } else if (r < 0.75) {
    // star (collectible)
    objs.push({ type:'star', x: baseX + 10, y: GY - 70 - Math.random()*60, w:26, h:26, collected:false });
  } else if (r < 0.85) {
    // platform + star above
    const pw = 80 + Math.random() * 60;
    platforms.push({ x: baseX, y: GY - 90, w: pw, h:14 });
    objs.push({ type:'star', x: baseX + pw/2 - 13, y: GY - 150, w:26, h:26, collected:false });
  }
  // else empty
}

function updateWorld() {
  // Move objects
  for (const o of objs) o.x -= speed;
  for (const p of platforms) p.x -= speed;

  // Move camera
  camX += speed;
  dist += speed;

  // Generate more
  while (platGenX < camX + W * 1.5) {
    spawnRow(platGenX);
    platGenX += 180 + Math.random() * 280;
  }

  // Cull off-screen
  objs = objs.filter(o => o.x + o.w > camX - 50);
  platforms = platforms.filter(p => p.x + p.w > camX - 50);
}

// ─── INPUT ────────────────────────────────
function doJump() {
  if (state !== 'playing') return;
  if (P.onGround) {
    P.vy = JUMP_V;
    P.onGround = false;
    P.canJump2 = true;
    sfxJump();
    spawnJumpParticles();
  } else if (P.canJump2) {
    P.vy = JUMP2_V;
    P.canJump2 = false;
    sfxJump2();
    spawnJumpParticles();
  }
}

function handleInput(e) {
  if (e.type === 'keydown') {
    if (['Space','ArrowUp','KeyW'].includes(e.code)) {
      e.preventDefault();
      doJump();
    }
  } else {
    // touch/click
    if (state === 'idle') { startGame(); return; }
    if (state === 'dead') { restartGame(); return; }
    doJump();
  }
}

document.addEventListener('keydown', handleInput);
canvas.addEventListener('touchstart', e => { e.preventDefault(); handleInput(e); }, { passive:false });
canvas.addEventListener('mousedown', handleInput);

document.getElementById('start-btn').addEventListener('click', startGame);
document.getElementById('retry-btn').addEventListener('click', restartGame);

// ─── PARTICLES ────────────────────────────
function spawnJumpParticles() {
  for (let i = 0; i < 8; i++) {
    particles.push({
      x: P.x + PLAYER_SZ/2,
      y: P.y + PLAYER_SZ,
      vx: (Math.random()-.5)*4,
      vy: Math.random()*3,
      life: 1,
      decay: .04 + Math.random()*.03,
      size: 2+Math.random()*3,
      color: Math.random()>.5 ? '#0ff' : '#f0f'
    });
  }
}
function spawnDeathParticles() {
  for (let i = 0; i < 30; i++) {
    const ang = (i/30)*Math.PI*2;
    const spd = 2+Math.random()*6;
    particles.push({
      x: P.x + PLAYER_SZ/2,
      y: P.y + PLAYER_SZ/2,
      vx: Math.cos(ang)*spd,
      vy: Math.sin(ang)*spd,
      life:1,
      decay:.02+Math.random()*.02,
      size:3+Math.random()*5,
      color:['#f44','#ff0','#f0f','#0ff'][Math.floor(Math.random()*4)]
    });
  }
}
function spawnStarParticles(x,y) {
  for (let i = 0; i < 10; i++) {
    particles.push({
      x, y,
      vx:(Math.random()-.5)*6,
      vy:(Math.random()-.5)*6,
      life:1, decay:.05+Math.random()*.03,
      size:2+Math.random()*4, color:'#ffd700'
    });
  }
}

function updateParticles() {
  for (const p of particles) {
    p.x += p.vx; p.y += p.vy;
    p.vy += .1;
    p.life -= p.decay;
  }
  particles = particles.filter(p => p.life > 0);
}

// ─── BACKGROUND STARS ─────────────────────
function initBgStars() {
  bgStars = [];
  for (let i = 0; i < 60; i++) {
    bgStars.push({
      x: Math.random() * W,
      y: Math.random() * GY,
      sz: .5 + Math.random() * 2,
      speed: .2 + Math.random() * 1.5,
      alpha: .2 + Math.random() * .6,
      twinkle: Math.random() * Math.PI * 2
    });
  }
}
initBgStars();

// ─── COLLISION ────────────────────────────
function rectOverlap(ax,ay,aw,ah, bx,by,bw,bh) {
  return ax < bx+bw && ax+aw > bx && ay < by+bh && ay+ah > by;
}

function checkCollisions() {
  const px = P.x, py = P.y, pw = PLAYER_SZ*.8, ph = PLAYER_SZ*.9;
  const px2 = px + (PLAYER_SZ - pw)/2;
  const py2 = py + (PLAYER_SZ - ph);

  // Ground
  if (P.y + PLAYER_SZ >= GY) {
    P.y = GY - PLAYER_SZ;
    P.vy = 0;
    P.onGround = true;
    P.canJump2 = true;
  }

  // Platform collisions
  for (const pl of platforms) {
    const plx = pl.x - camX;
    if (plx > W + 50 || plx + pl.w < -50) continue;
    // landing on top
    if (P.vy >= 0 &&
        px2 + pw > plx && px2 < plx + pl.w &&
        py2 + ph >= pl.y && py2 + ph <= pl.y + pl.h + P.vy + 2) {
      P.y = pl.y - PLAYER_SZ;
      P.vy = 0;
      P.onGround = true;
      P.canJump2 = true;
    }
  }

  // Object collisions
  for (const o of objs) {
    if (o.collected) continue;
    const ox = o.x - camX;
    if (ox > W + 50 || ox + o.w < -50) continue;

    if (o.type === 'star') {
      const sx = ox + o.w/2, sy = o.y + o.h/2;
      const px3 = P.x + PLAYER_SZ/2, py3 = P.y + PLAYER_SZ/2;
      const d = Math.hypot(sx-px3, sy-py3);
      if (d < STAR_RADIUS + PLAYER_SZ/2) {
        o.collected = true;
        stars++;
        score += 50 * Math.max(1, Math.floor(speed));
        sfxStar();
        spawnStarParticles(sx, sy);
      }
    } else {
      // spike or block
      if (rectOverlap(px2, py2, pw, ph, ox, o.y, o.w, o.h)) {
        die();
        return;
      }
    }
  }
}

// ─── DIE ─────────────────────────────────
function die() {
  if (state !== 'playing') return;
  state = 'dead';
  sfxDie();
  spawnDeathParticles();
  if (score > hiScore) {
    hiScore = score;
    localStorage.setItem('neonrun_hi', hiScore);
  }
  P.deadAnim = 1;
  document.getElementById('final-score').textContent = score;
  document.getElementById('game-over-hs').textContent = 'Best: ' + hiScore;
  setTimeout(() => {
    document.getElementById('game-over').classList.remove('hidden');
    if (window.GZMonetagSafe) window.GZMonetagSafe.maybeLoad();
  }, 600);
}

// ─── PHYSICS UPDATE ───────────────────────
function updatePlayer() {
  if (state !== 'playing') return;
  P.vy += GRAVITY;
  P.y += P.vy;
  P.onGround = false;

  // Trail
  P.trail.push({ x: P.x + PLAYER_SZ/2, y: P.y + PLAYER_SZ/2, life:1 });
  if (P.trail.length > 12) P.trail.shift();

  // Score from distance
  score = Math.floor(dist / 10) + stars * 50;

  checkCollisions();
}

// ─── DRAW HELPERS ─────────────────────────
function drawGlow(x,y,r,col) {
  const g = ctx.createRadialGradient(x,y,0,x,y,r);
  g.addColorStop(0, col);
  g.addColorStop(1, 'transparent');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill();
}

function drawBg() {
  // Sky gradient
  const sky = ctx.createLinearGradient(0,0,0,GY);
  sky.addColorStop(0,'#050514');
  sky.addColorStop(1,'#0a0a2e');
  ctx.fillStyle = sky;
  ctx.fillRect(0,0,W,GY);

  // Grid lines
  ctx.strokeStyle = 'rgba(0,255,255,.06)';
  ctx.lineWidth = 1;
  const gridSize = 60;
  const offsetX = -(camX % gridSize);
  for (let x = offsetX; x < W; x += gridSize) {
    ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,GY); ctx.stroke();
  }
  for (let y = 0; y < GY; y += gridSize) {
    ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke();
  }

  // Background stars
  for (const s of bgStars) {
    s.x -= s.speed;
    if (s.x < 0) s.x = W;
    s.twinkle += .03;
    const a = s.alpha * (.6 + .4*Math.sin(s.twinkle));
    ctx.fillStyle = `rgba(255,255,255,${a})`;
    ctx.beginPath(); ctx.arc(s.x, s.y, s.sz, 0, Math.PI*2); ctx.fill();
  }
}

function drawGround() {
  // Ground fill
  ctx.fillStyle = '#0d0d2a';
  ctx.fillRect(0, GY, W, H - GY);

  // Neon top line
  ctx.shadowColor = '#0ff';
  ctx.shadowBlur = 12;
  ctx.strokeStyle = '#0ff';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(0,GY); ctx.lineTo(W,GY); ctx.stroke();
  ctx.shadowBlur = 0;

  // Dashes on ground
  ctx.strokeStyle = 'rgba(0,255,255,.2)';
  ctx.lineWidth = 1;
  const dashW = 40, dashH = 4;
  const offsetX = -(camX % dashW);
  for (let x = offsetX; x < W; x += dashW*2) {
    ctx.fillStyle = 'rgba(0,255,255,.25)';
    ctx.fillRect(x, GY+2, dashW, dashH);
  }
}

function drawPlatforms() {
  for (const pl of platforms) {
    const x = pl.x - camX;
    if (x > W+50 || x+pl.w < -50) continue;
    // glow
    ctx.shadowColor = '#0f0';
    ctx.shadowBlur = 8;
    ctx.fillStyle = '#0a2';
    ctx.fillRect(x, pl.y, pl.w, pl.h);
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#0f0';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x, pl.y, pl.w, pl.h);
  }
}

function drawSpike(x,y,w,h) {
  // Triangle spike
  ctx.shadowColor = '#f44';
  ctx.shadowBlur = 15;
  ctx.fillStyle = '#f44';
  ctx.beginPath();
  ctx.moveTo(x + w/2, y);
  ctx.lineTo(x + w, y + h);
  ctx.lineTo(x, y + h);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;
  // inner glow line
  ctx.strokeStyle = '#ff8888';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x + w/2, y+4);
  ctx.lineTo(x+w-4, y+h-2);
  ctx.lineTo(x+4, y+h-2);
  ctx.closePath();
  ctx.stroke();
}

function drawBlock(x,y,w,h) {
  ctx.shadowColor = '#f0f';
  ctx.shadowBlur = 12;
  ctx.fillStyle = '#303';
  ctx.fillRect(x,y,w,h);
  ctx.shadowBlur = 0;
  ctx.strokeStyle = '#f0f';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x,y,w,h);
  // cross lines
  ctx.strokeStyle = 'rgba(255,0,255,.3)';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(x,y); ctx.lineTo(x+w,y+h); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x+w,y); ctx.lineTo(x,y+h); ctx.stroke();
}

function drawStar(x,y) {
  const t = Date.now() * .003;
  const scale = 1 + .15 * Math.sin(t + x*.01);
  const r = STAR_RADIUS * scale;
  // glow
  drawGlow(x, y, r*2.5, 'rgba(255,215,0,.25)');
  // star shape
  ctx.shadowColor = '#ffd700';
  ctx.shadowBlur = 14;
  ctx.fillStyle = '#ffd700';
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const a1 = (i * 72 - 90) * Math.PI/180;
    const a2 = (i * 72 + 36 - 90) * Math.PI/180;
    const a3 = (i * 72 + 18 - 90) * Math.PI/180;
    if (i===0) ctx.moveTo(x + r*Math.cos(a1), y + r*Math.sin(a1));
    else ctx.lineTo(x + r*Math.cos(a1), y + r*Math.sin(a1));
    ctx.lineTo(x + r*.4*Math.cos(a3), y + r*.4*Math.sin(a3));
    ctx.lineTo(x + r*Math.cos(a2), y + r*Math.sin(a2));
  }
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;
}

function drawObjects() {
  for (const o of objs) {
    if (o.collected) continue;
    const x = o.x - camX;
    if (x > W+60 || x+o.w < -60) continue;
    if (o.type === 'spike') drawSpike(x, o.y, o.w, o.h);
    else if (o.type === 'block') drawBlock(x, o.y, o.w, o.h);
    else if (o.type === 'star') drawStar(x + o.w/2, o.y + o.h/2);
  }
}

function drawPlayer() {
  if (state === 'dead' && P.deadAnim > 0) {
    P.deadAnim -= .03;
    return;
  }

  const cx = P.x + PLAYER_SZ/2;
  const cy = P.y + PLAYER_SZ/2;

  // Trail
  for (let i = 0; i < P.trail.length; i++) {
    const t = P.trail[i];
    const a = (i / P.trail.length) * .4;
    const sz = PLAYER_SZ * .3 * (i / P.trail.length);
    ctx.fillStyle = `rgba(0,255,255,${a})`;
    ctx.beginPath(); ctx.arc(t.x, t.y, sz, 0, Math.PI*2); ctx.fill();
  }

  // Glow
  drawGlow(cx, cy, PLAYER_SZ*1.4, 'rgba(0,255,255,.2)');

  // Body
  ctx.shadowColor = '#0ff';
  ctx.shadowBlur = 20;
  ctx.fillStyle = '#0a2a2a';
  ctx.strokeStyle = '#0ff';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.roundRect(P.x+2, P.y+2, PLAYER_SZ-4, PLAYER_SZ-4, 6);
  ctx.fill(); ctx.stroke();
  ctx.shadowBlur = 0;

  // Eyes
  const eyeY = P.y + PLAYER_SZ*.35;
  const eyeX1 = P.x + PLAYER_SZ*.3;
  const eyeX2 = P.x + PLAYER_SZ*.62;
  ctx.fillStyle = '#0ff';
  ctx.shadowColor = '#0ff'; ctx.shadowBlur = 8;
  ctx.beginPath(); ctx.arc(eyeX1, eyeY, 3.5, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(eyeX2, eyeY, 3.5, 0, Math.PI*2); ctx.fill();
  ctx.shadowBlur = 0;

  // Jump / double-jump indicator
  if (!P.onGround) {
    const col = P.canJump2 ? '#0ff' : '#f0f';
    ctx.strokeStyle = col;
    ctx.shadowColor = col; ctx.shadowBlur = 10;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, P.y + PLAYER_SZ + 5, 4, 0, Math.PI*2);
    ctx.stroke();
    ctx.shadowBlur = 0;
  }
}

function drawParticles() {
  for (const p of particles) {
    ctx.globalAlpha = p.life;
    ctx.fillStyle = p.color;
    ctx.shadowColor = p.color; ctx.shadowBlur = 6;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.size*p.life, 0, Math.PI*2); ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;
}

function drawHUD() {
  document.getElementById('sv').textContent = score;
  document.getElementById('bv').textContent = hiScore;
}

// ─── MENU DRAW ───────────────────────────
function drawMenu() {
  ctx.clearRect(0,0,W,H);
  drawBg();
  drawGround();

  // Title
  ctx.textAlign = 'center';
  ctx.shadowColor = '#0ff';
  ctx.shadowBlur = 30;
  ctx.fillStyle = '#0ff';
  ctx.font = `bold ${Math.min(W*.1,72)}px 'Segoe UI',sans-serif`;
  ctx.fillText('NEON RUN', W/2, H*.3);
  ctx.shadowBlur = 0;

  // Subtitle
  ctx.fillStyle = '#aaa';
  ctx.font = `${Math.min(W*.04,22)}px 'Segoe UI',sans-serif`;
  ctx.fillText('Endless Platform Runner', W/2, H*.3 + 40);

  // Stars
  ctx.font = `bold ${Math.min(W*.07,48)}px 'Segoe UI',sans-serif`;
  ctx.fillText('⚡ JUMP · 💀 DODGE · ⭐ COLLECT', W/2, H*.45);

  // Best score
  ctx.fillStyle = '#ffd700';
  ctx.shadowColor = '#ffd700'; ctx.shadowBlur = 10;
  ctx.font = `bold ${Math.min(W*.045,28)}px 'Segoe UI',sans-serif`;
  ctx.fillText('Best: ' + hiScore, W/2, H*.55);
  ctx.shadowBlur = 0;

  // Prompt
  const pulse = .6 + .4*Math.sin(Date.now()*.004);
  ctx.fillStyle = `rgba(255,255,255,${pulse})`;
  ctx.font = `${Math.min(W*.04,22)}px 'Segoe UI',sans-serif`;
  ctx.fillText('Press SPACE or TAP to start', W/2, H*.65);

  // Controls
  ctx.fillStyle = 'rgba(255,255,255,.35)';
  ctx.font = `${Math.min(W*.03,16)}px 'Segoe UI',sans-serif`;
  ctx.fillText('Space / Tap = Jump · Double jump in air', W/2, H*.75);

  ctx.textAlign = 'left';
}

// ─── GAME LOOP ────────────────────────────
function loop() {
  frame++;
  if (state === 'idle') {
    drawMenu();
  } else {
    ctx.clearRect(0,0,W,H);
    drawBg();
    drawGround();

    speed = Math.min(BASE_SPEED + dist * SPEED_STEP, MAX_SPEED);

    updateWorld();
    updatePlayer();
    updateParticles();

    drawPlatforms();
    drawObjects();
    drawPlayer();
    drawParticles();
    drawHUD();
  }
  requestAnimationFrame(loop);
}

loop();

// ─── GAME CONTROL ─────────────────────────
function startGame() {
  document.getElementById('start-screen').classList.add('hidden');
  state = 'playing';
  score = 0; dist = 0; stars = 0; speed = BASE_SPEED; camX = 0;
  particles = [];
  resetPlayer();
  spawnWorld();
  // Resume audio context
  try { const ac = getAC(); if (ac.state === 'suspended') ac.resume(); } catch(e){}
}

function restartGame() {
  document.getElementById('game-over').classList.add('hidden');
  state = 'playing';
  score = 0; dist = 0; stars = 0; speed = BASE_SPEED; camX = 0;
  particles = [];
  resetPlayer();
  spawnWorld();
}

// Init hi score display
document.getElementById('start-hs').textContent = 'Best: ' + hiScore;
document.getElementById('bv').textContent = hiScore;

})();
