/**
 * Basketball Shoot - Pure Canvas 2D Arcade Game
 * Drag-to-aim slingshot mechanic, physics projectile, scoring system
 */
(function () {
  'use strict';

  // ─── Constants ───────────────────────────────────────────────────
  var GAME_DURATION = 60;
  var GRAVITY = 0.45;
  var AIR_DRAG = 0.992;
  var BALL_R = 22;
  var RIM_R = 6;
  var NET_HEIGHT = 36;
  var BACKBOARD_H = 70;
  var STREAK_BONUS = 2;

  // ─── Canvas & Context ────────────────────────────────────────────
  var canvas = document.getElementById('c');
  var ctx = canvas.getContext('2d');
  var W, H;
  var scale = 1;

  // ─── Game State ──────────────────────────────────────────────────
  var score = 0;
  var bestScore = parseInt(localStorage.getItem('bs_best') || '0', 10);
  var streak = 0;
  var timeLeft = GAME_DURATION;
  var gameState = 'start'; // start | playing | over
  var timerInterval = null;

  // ─── Ball State ──────────────────────────────────────────────────
  var ball = { x: 0, y: 0, vx: 0, vy: 0, visible: true, flying: false };
  var hoop = { x: 0, y: 0, rimLeft: 0, rimRight: 0, backboardX: 0, backboardY: 0 };

  // ─── Particles ────────────────────────────────────────────────────
  var particles = [];
  var scorePopups = [];

  // ─── Input ───────────────────────────────────────────────────────
  var dragging = false;
  var dragStart = { x: 0, y: 0 };
  var dragCurrent = { x: 0, y: 0 };
  var touchId = null;

  // ─── Audio ────────────────────────────────────────────────────────
  var AudioCtx = window.AudioContext || window.webkitAudioContext;
  var audioCtx = null;

  function getAudioCtx() {
    if (!audioCtx) audioCtx = new AudioCtx();
    return audioCtx;
  }

  function playSound(type) {
    try {
      var ac = getAudioCtx();
      var osc = ac.createOscillator();
      var gain = ac.createGain();
      osc.connect(gain);
      gain.connect(ac.destination);
      var t = ac.currentTime;
      if (type === 'shoot') {
        osc.frequency.setValueAtTime(300, t);
        osc.frequency.exponentialRampToValueAtTime(150, t + 0.15);
        gain.gain.setValueAtTime(0.25, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
        osc.start(t); osc.stop(t + 0.15);
      } else if (type === 'swish') {
        osc.frequency.setValueAtTime(600, t);
        osc.frequency.exponentialRampToValueAtTime(1200, t + 0.1);
        gain.gain.setValueAtTime(0.3, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
        osc.start(t); osc.stop(t + 0.2);
      } else if (type === 'rim') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(200, t);
        osc.frequency.exponentialRampToValueAtTime(100, t + 0.08);
        gain.gain.setValueAtTime(0.15, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
        osc.start(t); osc.stop(t + 0.08);
      } else if (type === 'miss') {
        osc.frequency.setValueAtTime(200, t);
        osc.frequency.exponentialRampToValueAtTime(80, t + 0.3);
        gain.gain.setValueAtTime(0.15, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
        osc.start(t); osc.stop(t + 0.3);
      } else if (type === 'streak') {
        [0, 0.08, 0.16].forEach(function (delay, i) {
          var o = ac.createOscillator();
          var g = ac.createGain();
          o.connect(g); g.connect(ac.destination);
          o.frequency.setValueAtTime([523, 659, 784][i], t + delay);
          g.gain.setValueAtTime(0.2, t + delay);
          g.gain.exponentialRampToValueAtTime(0.001, t + delay + 0.12);
          o.start(t + delay); o.stop(t + delay + 0.12);
        });
      } else if (type === 'gameover') {
        [0, 0.15, 0.3].forEach(function (delay, i) {
          var o = ac.createOscillator();
          var g = ac.createGain();
          o.connect(g); g.connect(ac.destination);
          o.frequency.setValueAtTime([392, 330, 262][i], t + delay);
          g.gain.setValueAtTime(0.2, t + delay);
          g.gain.exponentialRampToValueAtTime(0.001, t + delay + 0.25);
          o.start(t + delay); o.stop(t + delay + 0.25);
        });
      }
    } catch (e) {}
  }

  // ─── Resize ──────────────────────────────────────────────────────
  function resize() {
    var wrap = canvas.parentElement || document.body;
    var rect = canvas.getBoundingClientRect();
    W = rect.width;
    H = rect.height;
    scale = window.devicePixelRatio || 1;
    canvas.width = W * scale;
    canvas.height = H * scale;
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    resetBall();
    if (gameState === 'playing') positionHoop();
  }

  // ─── Position Hoop ────────────────────────────────────────────────
  function positionHoop() {
    var minX = W * 0.28;
    var maxX = W * 0.72;
    var minY = H * 0.12;
    var maxY = H * 0.30;
    hoop.x = minX + Math.random() * (maxX - minX);
    hoop.y = minY + Math.random() * (maxY - minY);
    hoop.rimLeft = hoop.x - 38;
    hoop.rimRight = hoop.x + 38;
    hoop.backboardX = hoop.x + 55;
    hoop.backboardY = hoop.y - 25;
  }

  // ─── Reset Ball ───────────────────────────────────────────────────
  function resetBall() {
    ball.x = W * 0.5;
    ball.y = H * 0.78;
    ball.vx = 0;
    ball.vy = 0;
    ball.flying = false;
    ball.visible = true;
  }

  // ─── Particles ────────────────────────────────────────────────────
  function spawnParticles(x, y, count, color) {
    for (var i = 0; i < count; i++) {
      var angle = Math.random() * Math.PI * 2;
      var speed = 1 + Math.random() * 4;
      particles.push({
        x: x, y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        life: 1.0,
        decay: 0.02 + Math.random() * 0.03,
        size: 3 + Math.random() * 4,
        color: color || '#fbbf24'
      });
    }
  }

  function spawnSwishParticles() {
    var cx = hoop.x;
    var cy = hoop.y + NET_HEIGHT * 0.5;
    for (var i = 0; i < 20; i++) {
      var angle = -Math.PI * 0.5 + (Math.random() - 0.5) * 1.2;
      var speed = 2 + Math.random() * 5;
      particles.push({
        x: cx + (Math.random() - 0.5) * 30,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1.0,
        decay: 0.025 + Math.random() * 0.02,
        size: 3 + Math.random() * 5,
        color: ['#fbbf24', '#f59e0b', '#fcd34d'][Math.floor(Math.random() * 3)]
      });
    }
  }

  function updateParticles() {
    for (var i = particles.length - 1; i >= 0; i--) {
      var p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.15;
      p.life -= p.decay;
      if (p.life <= 0) particles.splice(i, 1);
    }
  }

  function drawParticles() {
    particles.forEach(function (p) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  // ─── Score Popups ────────────────────────────────────────────────
  function spawnPopup(x, y, text, color) {
    scorePopups.push({ x: x, y: y, text: text, color: color || '#fff', life: 1.0, vy: -2 });
  }

  function updatePopups() {
    for (var i = scorePopups.length - 1; i >= 0; i--) {
      var p = scorePopups[i];
      p.y += p.vy;
      p.life -= 0.025;
      if (p.life <= 0) scorePopups.splice(i, 1);
    }
  }

  function drawPopups() {
    scorePopups.forEach(function (p) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.font = 'bold 24px Segoe UI, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 8;
      ctx.fillText(p.text, p.x, p.y);
      ctx.restore();
    });
  }

  // ─── Draw Basketball ──────────────────────────────────────────────
  function drawBall(x, y, r) {
    // Shadow
    ctx.save();
    ctx.globalAlpha = 0.25;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.ellipse(x + 3, y + r * 0.8, r * 0.85, r * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Ball body gradient
    var grad = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r);
    grad.addColorStop(0, '#ff8c42');
    grad.addColorStop(0.5, '#e85d04');
    grad.addColorStop(1, '#9d4100');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();

    // Seam lines
    ctx.strokeStyle = 'rgba(80, 30, 0, 0.7)';
    ctx.lineWidth = 1.8;
    // Horizontal seam
    ctx.beginPath();
    ctx.arc(x, y, r * 0.72, 0, Math.PI * 2);
    ctx.stroke();
    // Vertical seam
    ctx.beginPath();
    ctx.arc(x, y, r * 0.72, Math.PI * 0.5, Math.PI * 1.5);
    ctx.stroke();
    // Curved seams
    ctx.beginPath();
    ctx.arc(x - r * 0.22, y, r * 0.82, -Math.PI * 0.38, Math.PI * 0.38);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x + r * 0.22, y, r * 0.82, Math.PI - Math.PI * 0.38, Math.PI + Math.PI * 0.38);
    ctx.stroke();

    // Highlight
    ctx.save();
    ctx.globalAlpha = 0.35;
    var hl = ctx.createRadialGradient(x - r * 0.35, y - r * 0.35, 0, x - r * 0.2, y - r * 0.2, r * 0.6);
    hl.addColorStop(0, 'rgba(255,255,255,0.8)');
    hl.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = hl;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // ─── Draw Hoop ────────────────────────────────────────────────────
  function drawHoop() {
    var hx = hoop.x;
    var hy = hoop.y;
    var rL = hoop.rimLeft;
    var rR = hoop.rimRight;
    var bbX = hoop.backboardX;
    var bbY0 = hoop.backboardY;
    var bbY1 = hoop.backboardY + BACKBOARD_H;

    // Backboard
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 2;
    ctx.fillRect(bbX - 6, bbY0, 12, BACKBOARD_H);
    ctx.strokeRect(bbX - 6, bbY0, 12, BACKBOARD_H);
    // Backboard target square
    ctx.strokeStyle = 'rgba(255,100,100,0.5)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(bbX - 18, hy - 22, 24, 28);

    // Rim
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = RIM_R * 2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(rL, hy);
    ctx.lineTo(rR, hy);
    ctx.stroke();

    // Rim highlight
    ctx.strokeStyle = '#fca5a5';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(rL, hy - RIM_R);
    ctx.lineTo(rR, hy - RIM_R);
    ctx.stroke();

    // Net (simple lines)
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = 1.2;
    var netSegments = 7;
    for (var i = 0; i <= netSegments; i++) {
      var t = i / netSegments;
      var nx = rL + (rR - rL) * t;
      ctx.beginPath();
      ctx.moveTo(nx, hy);
      // Slight inward curve
      var sag = Math.sin(t * Math.PI) * 10;
      ctx.quadraticCurveTo(nx + (hx - nx) * 0.3, hy + NET_HEIGHT * 0.6, hx, hy + NET_HEIGHT);
      ctx.stroke();
    }
    // Horizontal net lines
    for (var j = 1; j <= 3; j++) {
      var ny = hy + (NET_HEIGHT / 4) * j;
      var shrink = j * 3;
      ctx.beginPath();
      ctx.moveTo(rL + shrink, ny);
      ctx.lineTo(rR - shrink, ny);
      ctx.stroke();
    }
  }

  // ─── Draw Aiming Guide ───────────────────────────────────────────
  function drawAimingLine() {
    if (!dragging || ball.flying) return;
    var dx = dragStart.x - dragCurrent.x;
    var dy = dragStart.y - dragCurrent.y;
    var len = Math.sqrt(dx * dx + dy * dy);
    if (len < 5) return;
    var maxLen = 160;
    var clampedLen = Math.min(len, maxLen);
    var power = clampedLen / maxLen;
    var angle = Math.atan2(dy, dx);
    var endX = ball.x + Math.cos(angle) * clampedLen * 0.8;
    var endY = ball.y + Math.sin(angle) * clampedLen * 0.8;

    // Dashed trajectory preview
    ctx.save();
    ctx.setLineDash([6, 6]);
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(ball.x, ball.y);
    ctx.lineTo(endX, endY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Arrow head
    var arrowAngle = angle;
    var arrowSize = 10;
    ctx.fillStyle = 'rgba(251, 191, 36, 0.8)';
    ctx.beginPath();
    ctx.moveTo(endX, endY);
    ctx.lineTo(endX - arrowSize * Math.cos(arrowAngle - 0.4), endY - arrowSize * Math.sin(arrowAngle - 0.4));
    ctx.lineTo(endX - arrowSize * Math.cos(arrowAngle + 0.4), endY - arrowSize * Math.sin(arrowAngle + 0.4));
    ctx.closePath();
    ctx.fill();

    // Power indicator
    var barW = 80;
    var barH = 8;
    var barX = ball.x - barW / 2;
    var barY = ball.y + BALL_R + 12;
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(barX, barY, barW, barH);
    var fillW = barW * power;
    var powerColor = power > 0.7 ? '#ef4444' : power > 0.4 ? '#f59e0b' : '#22c55e';
    ctx.fillStyle = powerColor;
    ctx.fillRect(barX, barY, fillW, barH);
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barW, barH);

    ctx.restore();
  }

  // ─── Draw Court Background ────────────────────────────────────────
  function drawBackground() {
    // Sky gradient
    var sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#0a1628');
    sky.addColorStop(0.5, '#0f2847');
    sky.addColorStop(1, '#1a3a6b');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    // Court floor
    var floorY = H * 0.88;
    var floorGrad = ctx.createLinearGradient(0, floorY, 0, H);
    floorGrad.addColorStop(0, '#2d1b0e');
    floorGrad.addColorStop(1, '#1a0f07');
    ctx.fillStyle = floorGrad;
    ctx.fillRect(0, floorY, W, H - floorY);

    // Court lines
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, floorY);
    ctx.lineTo(W, floorY);
    ctx.stroke();

    // Three-point arc (decorative)
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 3;
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    ctx.arc(W / 2, floorY, W * 0.35, Math.PI, 0);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  // ─── Collision Detection ─────────────────────────────────────────
  function checkRimCollision() {
    var rL = hoop.rimLeft;
    var rR = hoop.rimRight;
    var hy = hoop.y;
    var rimTop = hy - RIM_R;
    var rimBot = hy + RIM_R;

    // Check left rim
    var dxL = ball.x - rL;
    var dyL = ball.y - hy;
    var distL = Math.sqrt(dxL * dxL + dyL * dyL);
    if (distL < BALL_R + RIM_R) {
      var nx = dxL / distL;
      var ny = dyL / distL;
      var overlap = BALL_R + RIM_R - distL;
      ball.x += nx * overlap;
      ball.y += ny * overlap;
      var dot = ball.vx * nx + ball.vy * ny;
      ball.vx -= 1.5 * dot * nx;
      ball.vy -= 1.5 * dot * ny;
      ball.vx *= 0.6;
      ball.vy *= 0.6;
      playSound('rim');
      return true;
    }

    // Check right rim
    var dxR = ball.x - rR;
    var dyR = ball.y - hy;
    var distR = Math.sqrt(dxR * dxR + dyR * dyR);
    if (distR < BALL_R + RIM_R) {
      var nxR = dxR / distR;
      var nyR = dyR / distR;
      var overlapR = BALL_R + RIM_R - distR;
      ball.x += nxR * overlapR;
      ball.y += nyR * overlapR;
      var dotR = ball.vx * nxR + ball.vy * nyR;
      ball.vx -= 1.5 * dotR * nxR;
      ball.vy -= 1.5 * dotR * nyR;
      ball.vx *= 0.6;
      ball.vy *= 0.6;
      playSound('rim');
      return true;
    }

    return false;
  }

  function checkBackboardCollision() {
    var bbX = hoop.backboardX - 6;
    var bbY0 = hoop.backboardY;
    var bbY1 = hoop.backboardY + BACKBOARD_H;
    if (ball.x + BALL_R > bbX && ball.x - BALL_R < bbX + 12 &&
        ball.y + BALL_R > bbY0 && ball.y - BALL_R < bbY1) {
      ball.x = bbX - BALL_R;
      ball.vx = -ball.vx * 0.55;
      playSound('rim');
      return true;
    }
    return false;
  }

  var scoredThisShot = false;
  var passedRim = false;

  function checkScore() {
    var rL = hoop.rimLeft;
    var rR = hoop.rimRight;
    var hy = hoop.y;
    var netBottom = hy + NET_HEIGHT;

    // Ball passed through the rim going downward
    if (!scoredThisShot && ball.vy > 0) {
      if (ball.x > rL + BALL_R * 0.3 && ball.x < rR - BALL_R * 0.3) {
        if (ball.y > hy - 5 && ball.y < netBottom) {
          scoredThisShot = true;
          // Check if swish (didn't touch rim)
          var isSwish = !ball.hitRimThisShot;
          var pts = isSwish ? 3 : 2;
          streak++;
          var bonus = streak > 1 ? STREAK_BONUS * (streak - 1) : 0;
          var total = pts + bonus;
          score += total;
          document.getElementById('score-val').textContent = score;

          if (isSwish) {
            playSound('swish');
            spawnSwishParticles();
            spawnPopup(ball.x, ball.y - 30, 'SWISH! +' + total, '#fbbf24');
          } else {
            playSound('shoot');
            spawnParticles(ball.x, ball.y, 12, '#fbbf24');
            spawnPopup(ball.x, ball.y - 30, '+' + total, '#fff');
          }

          if (streak > 1) {
            playSound('streak');
            document.getElementById('streak').textContent = '🔥 ' + streak + 'x Streak!';
            document.getElementById('streak').classList.add('show');
          }

          // Trigger hoop reposition after short delay
          setTimeout(function () {
            if (gameState === 'playing') {
              positionHoop();
              resetBall();
              scoredThisShot = false;
              passedRim = false;
              ball.hitRimThisShot = false;
            }
          }, 600);
        }
      }
    }

    // Ball out of bounds or fell below court
    if (ball.y > H + 60 || ball.x < -60 || ball.x > W + 60) {
      if (!scoredThisShot) {
        streak = 0;
        document.getElementById('streak').classList.remove('show');
        playSound('miss');
      }
      scoredThisShot = false;
      passedRim = false;
      ball.hitRimThisShot = false;
      resetBall();
      if (gameState === 'playing') positionHoop();
    }
  }

  // ─── Game Loop ────────────────────────────────────────────────────
  function updateBall() {
    if (!ball.flying) return;
    ball.hitRimThisShot = ball.hitRimThisShot || false;
    ball.vy += GRAVITY;
    ball.vx *= AIR_DRAG;
    ball.vy *= AIR_DRAG;
    ball.x += ball.vx;
    ball.y += ball.vy;

    if (checkBackboardCollision()) {}
    if (checkRimCollision()) ball.hitRimThisShot = true;
    checkScore();
  }

  function render() {
    ctx.clearRect(0, 0, W, H);
    drawBackground();
    drawHoop();

    if (ball.visible) {
      drawBall(ball.x, ball.y, BALL_R);
    }

    drawParticles();
    drawPopups();
    if (gameState === 'playing') drawAimingLine();
  }

  function gameLoop() {
    if (gameState !== 'playing') return;
    updateBall();
    updateParticles();
    updatePopups();
    render();
    requestAnimationFrame(gameLoop);
  }

  // ─── Start / End Game ─────────────────────────────────────────────
  function startGame() {
    score = 0;
    streak = 0;
    timeLeft = GAME_DURATION;
    scoredThisShot = false;
    passedRim = false;
    particles = [];
    scorePopups = [];
    ball.hitRimThisShot = false;
    document.getElementById('score-val').textContent = '0';
    document.getElementById('best-val').textContent = bestScore;
    document.getElementById('streak').classList.remove('show');
    document.getElementById('overlay').style.display = 'none';
    document.getElementById('timer').classList.remove('low');
    resize();
    positionHoop();
    gameState = 'playing';
    startTimer();
    gameLoop();
  }

  function startTimer() {
    clearInterval(timerInterval);
    timerInterval = setInterval(function () {
      timeLeft--;
      var el = document.getElementById('timer-val');
      if (el) el.textContent = timeLeft;
      var timerEl = document.getElementById('timer');
      if (timeLeft <= 10) {
        timerEl.classList.add('low');
      }
      if (timeLeft <= 0) {
        clearInterval(timerInterval);
        endGame();
      }
    }, 1000);
  }

  function endGame() {
    gameState = 'over';
    playSound('gameover');
    if (score > bestScore) {
      bestScore = score;
      localStorage.setItem('bs_best', bestScore);
    }
    var overlay = document.getElementById('overlay');
    overlay.style.display = 'flex';
    overlay.innerHTML =
      '<h2>Time\'s Up!</h2>' +
      '<div class="final-score">' + score + '</div>' +
      '<div class="best-label">Best: ' + bestScore + '</div>' +
      '<button class="btn" id="restart-btn">Play Again</button>' +
      '<button class="btn btn-share" id="share-score-btn" onclick="shareScore(' + score + ')">Share Score</button>';
    setTimeout(function(){ document.getElementById('restart-btn').addEventListener('click', startGame); }, 50);

    // Trigger Monetag ad
    if (window.GZMonetagSafe) {
      window.GZMonetagSafe.maybeLoad();
    }
  }

  function showStartScreen() {
    var overlay = document.getElementById('overlay');
    overlay.style.display = 'flex';
    overlay.innerHTML =
      '<h2>🏀 Basketball Shoot</h2>' +
      '<div class="how-to">' +
        '<div class="emoji">🎯</div>' +
        '<p><b>Drag</b> the ball to aim (slingshot style)</p>' +
        '<p><b>Release</b> to shoot</p>' +
        '<p>🏀 Basket = <b>2 pts</b> | Swish = <b>3 pts</b></p>' +
        '<p>🔥 Streak bonuses for consecutive shots!</p>' +
      '</div>' +
      '<div class="sub">60 seconds — score as many baskets as you can!</div>' +
      '<button class="btn" id="start-btn">Start Game</button>';
    setTimeout(function(){ document.getElementById('start-btn').addEventListener('click', startGame); }, 50);
  }

  // ─── Input Handling ──────────────────────────────────────────────
  function getEventPos(e) {
    var rect = canvas.getBoundingClientRect();
    if (e.touches && e.touches.length > 0) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }

  function onDragStart(e) {
    if (gameState !== 'playing') return;
    if (ball.flying) return;
    e.preventDefault();
    var pos = getEventPos(e);
    var dx = pos.x - ball.x;
    var dy = pos.y - ball.y;
    if (Math.sqrt(dx * dx + dy * dy) < BALL_R * 2.5) {
      dragging = true;
      dragStart.x = pos.x;
      dragStart.y = pos.y;
      dragCurrent.x = pos.x;
      dragCurrent.y = pos.y;
    }
  }

  function onDragMove(e) {
    if (!dragging) return;
    e.preventDefault();
    var pos = getEventPos(e);
    dragCurrent.x = pos.x;
    dragCurrent.y = pos.y;
  }

  function onDragEnd(e) {
    if (!dragging) return;
    e.preventDefault();
    dragging = false;
    var dx = dragStart.x - dragCurrent.x;
    var dy = dragStart.y - dragCurrent.y;
    var len = Math.sqrt(dx * dx + dy * dy);
    if (len < 10) return;
    var maxLen = 160;
    var power = Math.min(len, maxLen) / maxLen;
    var angle = Math.atan2(dy, dx);
    var speed = power * 22;
    ball.vx = Math.cos(angle) * speed;
    ball.vy = Math.sin(angle) * speed;
    ball.flying = true;
    scoredThisShot = false;
    ball.hitRimThisShot = false;
    playSound('shoot');
  }

  canvas.addEventListener('mousedown', onDragStart);
  canvas.addEventListener('mousemove', onDragMove);
  canvas.addEventListener('mouseup', onDragEnd);
  canvas.addEventListener('mouseleave', onDragEnd);
  canvas.addEventListener('touchstart', onDragStart, { passive: false });
  canvas.addEventListener('touchmove', onDragMove, { passive: false });
  canvas.addEventListener('touchend', onDragEnd, { passive: false });

  // ─── Init ────────────────────────────────────────────────────────
  window.addEventListener('resize', resize);
  document.getElementById('best-val').textContent = bestScore;
  resize();
  showStartScreen();

  // Render loop for start/over states
  function idleLoop() {
    if (gameState !== 'playing') {
      updateParticles();
      updatePopups();
      render();
    }
    requestAnimationFrame(idleLoop);
  }
  idleLoop();

})();
