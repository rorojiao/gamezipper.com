// T-Rex Runner — Chrome Dino Style Game
// Controls: Space/Up=Jump, Down=Duck

var canvas = document.getElementById('c');
var ctx = canvas.getContext('2d');

var W, H;
function resize() {
  W = canvas.width = window.innerWidth;
  H = canvas.height = window.innerHeight;
}
resize();
window.addEventListener('resize', resize);

// Mobile check
var isMobile = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
var jumpBtn, duckBtn;

function setupMobileButtons() {
  if (document.getElementById('jump-btn')) return;
  ['jump-btn','duck-btn'].forEach(function(id) {
    var btn = document.createElement('button');
    btn.id = id;
    btn.style.cssText = 'position:fixed;bottom:20px;z-index:200;width:80px;height:80px;border-radius:50%;border:2px solid rgba(255,255,255,0.4);background:rgba(0,0,0,0.5);color:#fff;font-size:24px;cursor:pointer;display:none;';
    if (id === 'jump-btn') { btn.style.left = '20px'; btn.textContent = '▲'; }
    else { btn.style.right = '20px'; btn.textContent = '▼'; }
    document.body.appendChild(btn);
  });
  jumpBtn = document.getElementById('jump-btn');
  duckBtn = document.getElementById('duck-btn');
  jumpBtn.addEventListener('touchstart', function(e) { e.preventDefault(); doJump(); });
  duckBtn.addEventListener('touchend', function(e) { e.preventDefault(); duckRelease(); });
}
if (isMobile) setupMobileButtons();
window.addEventListener('resize', setupMobileButtons);

// Game state
var score = 0;
var highScore = parseInt(localStorage.getItem('trex-high') || '0');
var speed = 6;
var groundY;
var gameOver = false;
var started = false;
var nightMode = false;
var nightTimer = 0;
var frameCount = 0;

function getGroundY() { return H * 0.78; }
groundY = getGroundY();

// Dinosaur
var dino = {
  x: 80,
  y: 0,
  w: 44,
  h: 48,
  vy: 0,
  jumping: false,
  ducking: false,
  dead: false,
  runFrame: 0,
  runTimer: 0
};

function getDinoY() {
  return groundY - (dino.ducking ? 28 : dino.h);
}

// Obstacles
var obstacles = [];
var obstacleTimer = 0;
var minObstacleGap = 80;

// Stars (night mode)
var stars = [];
for (var i = 0; i < 40; i++) {
  stars.push({ x: Math.random() * 1920, y: Math.random() * 300, r: Math.random() * 1.5 + 0.5, twinkle: Math.random() * Math.PI * 2 });
}

// Clouds
var clouds = [];
for (var ci = 0; ci < 4; ci++) {
  clouds.push({ x: Math.random() * 1920, y: 60 + Math.random() * 120, w: 80 + Math.random() * 60, speed: 0.3 + Math.random() * 0.4 });
}

// Input
var keys = {};
document.addEventListener('keydown', function(e) {
  if (['Space','ArrowUp','ArrowDown','KeyW','KeyS'].indexOf(e.code) > -1) e.preventDefault();
  keys[e.code] = true;
  if (!started && !gameOver) { startGame(); }
  if (gameOver && e.code === 'Space') restart();
});
document.addEventListener('keyup', function(e) {
  keys[e.code] = false;
  if (e.code === 'ArrowDown' || e.code === 'KeyS') dino.ducking = false;
});

// Touch jump
document.addEventListener('touchstart', function(e) {
  if (e.target.tagName === 'BUTTON') return;
  if (!started && !gameOver) { startGame(); }
  else if (gameOver) restart();
  else doJump();
});

function doJump() {
  if (!dino.jumping && !dino.ducking && started) {
    dino.jumping = true;
    dino.vy = -16;
  }
}

function duckRelease() {
  dino.ducking = false;
}

// Keyboard duck
function handleInput() {
  if (keys['ArrowDown'] || keys['KeyS']) {
    if (!dino.jumping) dino.ducking = true;
  } else {
    dino.ducking = false;
  }
  if ((keys['Space'] || keys['ArrowUp'] || keys['KeyW']) && !dino.jumping && !dino.ducking && started) {
    doJump();
  }
}

function startGame() {
  started = true;
  if (isMobile && jumpBtn) jumpBtn.style.display = 'block';
  if (isMobile && duckBtn) duckBtn.style.display = 'block';
}

function restart() {
  score = 0;
  speed = 6;
  gameOver = false;
  started = true;
  obstacles = [];
  obstacleTimer = 0;
  dino.y = 0;
  dino.jumping = false;
  dino.ducking = false;
  dino.dead = false;
  dino.vy = 0;
  document.getElementById('game-over-screen').classList.remove('active');
  if (isMobile && jumpBtn) jumpBtn.style.display = 'block';
  if (isMobile && duckBtn) duckBtn.style.display = 'block';
}

// Obstacle types
var CACTI = [
  { w: 18, h: 40, type: 'small' },
  { w: 26, h: 50, type: 'medium' },
  { w: 34, h: 56, type: 'large' }
];

function spawnObstacle() {
  var r = Math.random();
  var type;
  if (r < 0.55) {
    type = CACTI[Math.floor(Math.random() * CACTI.length)];
  } else {
    type = { w: 46, h: 44, type: 'pterodactyl', flyHigh: Math.random() > 0.5 };
  }
  obstacles.push({
    x: W + 50,
    y: type.type === 'pterodactyl'
      ? (type.flyHigh ? groundY - 100 : groundY - 55)
      : groundY - type.h,
    w: type.w,
    h: type.h,
    type: type.type,
    flyHigh: type.flyHigh
  });
}

function update() {
  if (!started || gameOver) return;
  frameCount++;
  handleInput();

  // Gravity
  if (dino.jumping) {
    dino.vy += 0.7;
    dino.y += dino.vy;
    if (dino.y >= 0) { dino.y = 0; dino.jumping = false; dino.vy = 0; }
  }

  // Running animation
  if (!dino.jumping && !dino.ducking) {
    dino.runTimer++;
    if (dino.runTimer > 6) { dino.runTimer = 0; dino.runFrame = 1 - dino.runFrame; }
  }

  // Score
  score += 0.1;
  if (Math.floor(score) % 100 === 0 && Math.floor(score) > 0) {
    speed = Math.min(16, 6 + Math.floor(score / 100) * 0.4);
  }

  // Night cycle
  nightTimer++;
  if (nightTimer > 600 && !nightMode) {
    nightMode = true;
    setTimeout(function() { nightMode = false; nightTimer = 0; }, 5000);
  }

  // Spawn obstacles
  obstacleTimer++;
  var gap = minObstacleGap + Math.random() * 120;
  if (obstacleTimer > gap / (speed / 6)) {
    spawnObstacle();
    obstacleTimer = 0;
  }

  // Update obstacles
  for (var i = obstacles.length - 1; i >= 0; i--) {
    obstacles[i].x -= speed;
    if (obstacles[i].x < -100) obstacles.splice(i, 1);
  }

  // Update clouds
  clouds.forEach(function(c) {
    c.x -= c.speed;
    if (c.x < -200) { c.x = W + 100; c.y = 60 + Math.random() * 120; }
  });

  // Collision
  var dY = getDinoY();
  var dinoBox = {
    x: dino.x + 8,
    y: dY + 6,
    w: dino.w - 16,
    h: (dino.ducking ? 28 : dino.h) - 8
  };
  for (var j = 0; j < obstacles.length; j++) {
    var o = obstacles[j];
    var oBox = { x: o.x + 4, y: o.y + 4, w: o.w - 8, h: o.h - 8 };
    if (dinoBox.x < oBox.x + oBox.w && dinoBox.x + dinoBox.w > oBox.x &&
        dinoBox.y < oBox.y + oBox.h && dinoBox.y + dinoBox.h > oBox.y) {
      triggerGameOver();
      return;
    }
  }

  // Update score display
  document.getElementById('score-val').textContent = Math.floor(score);
  if (score > highScore) {
    highScore = Math.floor(score);
    localStorage.setItem('trex-high', highScore);
  }
  document.getElementById('best-val').textContent = highScore;
}

function triggerGameOver() {
  gameOver = true;
  dino.dead = true;
  started = false;
  document.getElementById('final-score').textContent = Math.floor(score);
  document.getElementById('final-best').textContent = highScore;
  document.getElementById('game-over-screen').classList.add('active');
  document.getElementById('gz-cta').style.display = 'block';
  if (isMobile && jumpBtn) jumpBtn.style.display = 'none';
  if (isMobile && duckBtn) duckBtn.style.display = 'none';
}

// Drawing helpers
function drawDino(x, y, ducking, dead, frame) {
  ctx.save();
  ctx.translate(x, y);
  if (dead) {
    // X eyes
    ctx.fillStyle = nightMode ? '#fff' : '#535353';
    ctx.fillRect(10, 12, 12, 12);
    ctx.fillStyle = nightMode ? '#ff4444' : '#fff';
    ctx.fillRect(12, 14, 3, 3); ctx.fillRect(17, 14, 3, 3);
    ctx.fillRect(12, 17, 3, 3); ctx.fillRect(17, 17, 3, 3);
    ctx.fillStyle = nightMode ? '#fff' : '#535353';
    ctx.fillRect(8, 28, 30, 3);
  } else if (ducking) {
    // Ducking pose
    ctx.fillStyle = nightMode ? '#fff' : '#535353';
    ctx.fillRect(0, 4, 60, 24); // long body
    ctx.fillRect(48, 0, 12, 28); // head forward
    ctx.fillRect(52, 6, 8, 6); // eye white
    ctx.fillStyle = nightMode ? '#fff' : '#000';
    ctx.fillRect(54, 8, 3, 3); // pupil
    // leg stub
    ctx.fillStyle = nightMode ? '#fff' : '#535353';
    ctx.fillRect(10, 24, 10, 8);
    ctx.fillRect(34, 24, 10, 8);
  } else {
    // Running pose
    ctx.fillStyle = nightMode ? '#fff' : '#535353';
    // body
    ctx.fillRect(6, 16, 26, 28);
    // head
    ctx.fillRect(18, 0, 26, 22);
    // eye
    ctx.fillStyle = nightMode ? '#fff' : '#000';
    ctx.fillRect(36, 6, 6, 6);
    ctx.fillStyle = nightMode ? '#000' : '#fff';
    ctx.fillRect(38, 8, 3, 3);
    ctx.fillStyle = nightMode ? '#fff' : '#535353';
    // mouth line
    ctx.fillRect(26, 14, 18, 3);
    // arms
    ctx.fillRect(0, 26, 10, 4);
    ctx.fillRect(4, 28, 6, 4);
    // legs
    var leg1y = frame === 0 ? 42 : 46;
    var leg2y = frame === 0 ? 46 : 42;
    ctx.fillRect(10, leg1y, 8, 10);
    ctx.fillRect(22, leg2y, 8, 10);
  }
  ctx.restore();
}

function drawCactus(obs) {
  ctx.fillStyle = nightMode ? '#aaa' : '#377e1c';
  var x = obs.x, y = obs.y, w = obs.w, h = obs.h;
  // Main stem
  ctx.fillRect(x + w * 0.35, y, w * 0.3, h);
  // Arms
  ctx.fillRect(x, y + h * 0.25, w * 0.35, h * 0.12);
  ctx.fillRect(x, y + h * 0.25, w * 0.15, h * 0.4);
  ctx.fillRect(x + w * 0.65, y + h * 0.4, w * 0.35, h * 0.12);
  ctx.fillRect(x + w * 0.85, y + h * 0.4, w * 0.15, h * 0.35);
  // Spines
  ctx.fillStyle = nightMode ? '#fff' : '#2a6014';
  ctx.fillRect(x + w * 0.35 - 2, y - 2, 4, 4);
  ctx.fillRect(x + w * 0.35 + w * 0.3 - 2, y - 2, 4, 4);
  ctx.fillRect(x + w * 0.35 - 2, y + h - 2, 4, 4);
  ctx.fillRect(x + w * 0.35 + w * 0.3 - 2, y + h - 2, 4, 4);
}

function drawPterodactyl(obs) {
  ctx.fillStyle = nightMode ? '#aaa' : '#7a7a7a';
  var x = obs.x, y = obs.y;
  // Body
  ctx.fillRect(x + 10, y + 16, 28, 14);
  // Head
  ctx.fillRect(x + 32, y + 12, 14, 12);
  // Beak
  ctx.fillStyle = nightMode ? '#ffaaaa' : '#c0392b';
  ctx.fillRect(x + 42, y + 16, 10, 5);
  // Eye
  ctx.fillStyle = nightMode ? '#fff' : '#000';
  ctx.fillRect(x + 38, y + 14, 4, 4);
  // Wings - animate
  var wingFrame = Math.floor(frameCount / 8) % 2;
  ctx.fillStyle = nightMode ? '#aaa' : '#7a7a7a';
  if (wingFrame === 0) {
    ctx.fillRect(x, y + 4, 36, 8);
    ctx.fillRect(x + 4, y + 0, 28, 8);
  } else {
    ctx.fillRect(x, y + 22, 36, 8);
    ctx.fillRect(x + 4, y + 26, 28, 8);
  }
  // Tail
  ctx.fillRect(x, y + 20, 14, 6);
}

function drawCloud(c) {
  ctx.fillStyle = nightMode ? 'rgba(100,100,140,0.4)' : 'rgba(255,255,255,0.6)';
  ctx.beginPath();
  ctx.ellipse(c.x, c.y, c.w / 2, 18, 0, 0, Math.PI * 2);
  ctx.ellipse(c.x - c.w * 0.3, c.y + 8, c.w / 3, 14, 0, 0, Math.PI * 2);
  ctx.ellipse(c.x + c.w * 0.3, c.y + 8, c.w / 3, 14, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawMoon() {
  ctx.fillStyle = '#f5f5dc';
  ctx.beginPath();
  ctx.arc(W * 0.8, 80, 35, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = nightMode ? '#1a1a3a' : '#e0e0c0';
  ctx.beginPath();
  ctx.arc(W * 0.8 + 10, 75, 30, 0, Math.PI * 2);
  ctx.fill();
}

function draw() {
  // Background
  if (nightMode) {
    ctx.fillStyle = '#0d0d1a';
    ctx.fillRect(0, 0, W, H);
    // Stars
    stars.forEach(function(s) {
      s.twinkle += 0.05;
      var alpha = 0.5 + 0.5 * Math.sin(s.twinkle);
      ctx.fillStyle = 'rgba(255,255,255,' + alpha + ')';
      ctx.beginPath();
      ctx.arc((s.x % W), s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });
    drawMoon();
  } else {
    // Sky gradient
    var grad = ctx.createLinearGradient(0, 0, 0, H * 0.6);
    grad.addColorStop(0, '#87CEEB');
    grad.addColorStop(1, '#e0f0ff');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
  }

  // Ground
  ctx.fillStyle = nightMode ? '#2a2a3a' : '#d4c5a9';
  ctx.fillRect(0, groundY, W, H - groundY);
  // Ground line
  ctx.fillStyle = nightMode ? '#555' : '#8B7355';
  ctx.fillRect(0, groundY, W, 3);

  // Clouds
  clouds.forEach(drawCloud);

  // Obstacles
  obstacles.forEach(function(o) {
    if (o.type === 'pterodactyl') drawPterodactyl(o);
    else drawCactus(o);
  });

  // Dinosaur
  drawDino(dino.x, getDinoY(), dino.ducking, dino.dead, dino.runFrame);

  // Score on canvas (backup, main score shown in HTML overlay)
  if (started) {
    ctx.fillStyle = nightMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.5)';
    ctx.font = 'bold 20px monospace';
    ctx.fillText('HI ' + String(highScore).padStart(5, '0') + '  ' + String(Math.floor(score)).padStart(5, '0'), W - 220, 40);
  }
}

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

// Init high score display
document.getElementById('best-val').textContent = highScore;

gameLoop();
