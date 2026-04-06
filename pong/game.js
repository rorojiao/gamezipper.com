/* Pong Game - Neon Retro Arcade Style */
(function(){
  'use strict';

  // ── Audio (Web Audio API synthesizer) ───────────────────────────────────
  var audioCtx = null;
  function getAudioCtx() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
  }

  var muted = false;
  function synth(freq, dur, type, vol, ramp) {
    if (muted) return;
    try {
      var ac = getAudioCtx();
      var now = ac.currentTime;
      var osc = ac.createOscillator();
      var gain = ac.createGain();
      osc.type = type || 'sine';
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(vol || 0.3, now);
      if (ramp !== false) gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
      osc.connect(gain);
      gain.connect(ac.destination);
      osc.start(now);
      osc.stop(now + dur);
    } catch(e) {}
  }

  function playSound(name) {
    if (muted) return;
    switch(name) {
      case 'hit':    synth(300, 0.08, 'sine', 0.5); synth(600, 0.06, 'sine', 0.3, false); break;
      case 'wall':   synth(200, 0.1, 'triangle', 0.3); break;
      case 'score':  synth(440, 0.15, 'square', 0.4); setTimeout(function(){ synth(330, 0.25, 'square', 0.4); }, 150); break;
      case 'win':    [523,659,784,1047].forEach(function(f,i){ setTimeout(function(){ synth(f, 0.15, 'sine', 0.6); }, i*120); }); break;
      case 'lose':   synth(300, 0.2, 'sawtooth', 0.4); setTimeout(function(){ synth(200, 0.3, 'sawtooth', 0.4); }, 200); break;
    }
  }

  // ── Canvas Setup ───────────────────────────────────────────────────────
  var canvas = document.getElementById('c');
  var ctx = canvas.getContext('2d');

  // High-DPI canvas sizing
  function resizeCanvas() {
    var wrap = document.getElementById('canvas-wrap');
    var w = wrap.clientWidth;
    var h = Math.round(w * 2 / 3);
    var dpr = window.devicePixelRatio || 1;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.scale(dpr, dpr);
    return { w: w, h: h };
  }

  var W, H;
  function updateSize() { var r = resizeCanvas(); W = r.w; H = r.h; }

  // ── Game State ──────────────────────────────────────────────────────────
  var STATE = { MENU: 0, PLAYING: 1, OVER: 2 };
  var state = STATE.MENU;

  var difficulty = 1; // 1=easy, 2=medium, 3=hard
  var diffNames  = ['EASY', 'MEDIUM', 'HARD'];
  var diffSpeeds = [0.035, 0.055, 0.08];  // AI reaction speed

  var WIN_SCORE = 11;

  var p1Score = 0, p2Score = 0;
  var round = 0;
  var roundSpeed = 1;

  // Paddle dims (fraction of canvas height)
  var PAD_H_FRAC = 0.18;
  var PAD_W = 10;
  var PAD_MARGIN = 16;

  var pad1Y, pad2Y; // top of paddle
  var ballX, ballY, ballVX, ballVY;
  var ballR = 8;

  // Particles
  var particles = [];

  // Trail
  var trail = [];
  var MAX_TRAIL = 18;

  // ── Paddle & Ball Init ─────────────────────────────────────────────────
  function initPositions() {
    var padH = H * PAD_H_FRAC;
    pad1Y = H / 2 - padH / 2;
    pad2Y = H / 2 - padH / 2;
    resetBall();
  }

  function resetBall() {
    ballX = W / 2;
    ballY = H / 2;
    var baseSpeed = (3.5 + round * 0.25) * roundSpeed;
    var angle = (Math.random() * 0.5 + 0.25) * Math.PI * (Math.random() < 0.5 ? 1 : -1);
    var dirX = Math.random() < 0.5 ? 1 : -1;
    var dirY = (Math.random() - 0.5) * 1.2;
    ballVX = dirX * baseSpeed * Math.cos(angle);
    ballVY = dirY * baseSpeed;
  }

  // ── Particles ───────────────────────────────────────────────────────────
  function spawnParticles(x, y, color, count) {
    for (var i = 0; i < count; i++) {
      var angle = Math.random() * Math.PI * 2;
      var speed = 1 + Math.random() * 3;
      particles.push({
        x: x, y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        decay: 0.03 + Math.random() * 0.03,
        size: 2 + Math.random() * 3,
        color: color
      });
    }
  }

  function updateParticles() {
    for (var i = particles.length - 1; i >= 0; i--) {
      var p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.05; // slight gravity
      p.life -= p.decay;
      if (p.life <= 0) particles.splice(i, 1);
    }
  }

  function drawParticles() {
    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
  }

  // ── Input ───────────────────────────────────────────────────────────────
  var keys = {};
  var touchDragging = false;
  var touchPad1Y = null; // touch offset from pad1 center

  document.addEventListener('keydown', function(e) {
    keys[e.code] = true;
    if (['ArrowUp','ArrowDown','KeyW','KeyS','Space'].indexOf(e.code) !== -1) e.preventDefault();
  });
  document.addEventListener('keyup', function(e) { keys[e.code] = false; });

  // Touch on canvas — drag player paddle
  canvas.addEventListener('touchstart', function(e) {
    e.preventDefault();
    var t = e.touches[0];
    var rect = canvas.getBoundingClientRect();
    var tx = t.clientX - rect.left;
    var ty = t.clientY - rect.top;
    // Scale to canvas coords
    var scaleX = W / rect.width;
    var scaleY = H / rect.height;
    tx *= scaleX; ty *= scaleY;
    // Only drag if near player paddle (left 40%)
    if (tx < W * 0.45) {
      touchDragging = true;
      var padH = H * PAD_H_FRAC;
      touchPad1Y = ty - (pad1Y + padH / 2);
    }
  }, { passive: false });

  canvas.addEventListener('touchmove', function(e) {
    e.preventDefault();
    if (!touchDragging) return;
    var t = e.touches[0];
    var rect = canvas.getBoundingClientRect();
    var ty = (t.clientY - rect.top) * (H / rect.height);
    var padH = H * PAD_H_FRAC;
    pad1Y = ty - touchPad1Y - padH / 2;
    pad1Y = Math.max(0, Math.min(H - padH, pad1Y));
  }, { passive: false });

  canvas.addEventListener('touchend', function(e) {
    touchDragging = false;
    touchPad1Y = null;
  }, { passive: false });

  // ── AI ─────────────────────────────────────────────────────────────────
  function updateAI() {
    var padH = H * PAD_H_FRAC;
    var center = pad2Y + padH / 2;
    var target = ballY;
    // Only react if ball is coming toward AI
    if (ballVX < 0) return;
    var speed = diffSpeeds[difficulty - 1] * H;
    var diff = target - center;
    if (Math.abs(diff) > speed) {
      pad2Y += diff > 0 ? speed : -speed;
    }
    pad2Y = Math.max(0, Math.min(H - padH, pad2Y));
  }

  // ── Ball Physics ────────────────────────────────────────────────────────
  var pad1X, pad2X;

  function updatePhysics() {
    var padH = H * PAD_H_FRAC;
    pad1X = PAD_MARGIN;
    pad2X = W - PAD_MARGIN - PAD_W;

    // Keyboard input
    var moveSpeed = H * 0.007 * 60;
    if (keys['ArrowUp'] || keys['KeyW']) pad1Y -= moveSpeed;
    if (keys['ArrowDown'] || keys['KeyS']) pad1Y += moveSpeed;
    pad1Y = Math.max(0, Math.min(H - padH, pad1Y));

    updateAI();

    // Trail
    trail.push({ x: ballX, y: ballY });
    if (trail.length > MAX_TRAIL) trail.shift();

    ballX += ballVX;
    ballY += ballVY;

    // Wall collision (top/bottom)
    if (ballY - ballR < 0) {
      ballY = ballR;
      ballVY = Math.abs(ballVY);
      playSound('wall');
      spawnParticles(ballX, ballR, '#00ffcc', 6);
    }
    if (ballY + ballR > H) {
      ballY = H - ballR;
      ballVY = -Math.abs(ballVY);
      playSound('wall');
      spawnParticles(ballX, H - ballR, '#00ffcc', 6);
    }

    // Paddle 1 collision (left)
    if (ballVX < 0 &&
        ballX - ballR < pad1X + PAD_W &&
        ballX + ballR > pad1X &&
        ballY > pad1Y - ballR &&
        ballY < pad1Y + padH + ballR) {
      ballX = pad1X + PAD_W + ballR;
      var relY = (ballY - pad1Y) / padH; // 0..1
      var angle = (relY - 0.5) * Math.PI * 0.55;
      var speed = Math.sqrt(ballVX * ballVX + ballVY * ballVY) * 1.02;
      ballVX = Math.cos(angle) * speed;
      ballVY = Math.sin(angle) * speed;
      playSound('hit');
      spawnParticles(ballX, ballY, '#00ffcc', 10);
    }

    // Paddle 2 collision (right)
    if (ballVX > 0 &&
        ballX + ballR > pad2X &&
        ballX - ballR < pad2X + PAD_W &&
        ballY > pad2Y - ballR &&
        ballY < pad2Y + padH + ballR) {
      ballX = pad2X - ballR;
      var relY = (ballY - pad2Y) / padH;
      var angle = (relY - 0.5) * Math.PI * 0.55;
      var speed = Math.sqrt(ballVX * ballVX + ballVY * ballVY) * 1.02;
      ballVX = -Math.cos(angle) * speed;
      ballVY = Math.sin(angle) * speed;
      playSound('hit');
      spawnParticles(ballX, ballY, '#ff4466', 10);
    }

    // Scoring
    if (ballX + ballR < 0) {
      p2Score++;
      playSound('score');
      round++;
      roundSpeed = 1 + round * 0.04;
      document.getElementById('p2-score').textContent = p2Score;
      spawnParticles(0, ballY, '#ff4466', 20);
      if (p2Score >= WIN_SCORE) { endGame(false); return; }
      resetBall();
    }
    if (ballX - ballR > W) {
      p1Score++;
      playSound('score');
      round++;
      roundSpeed = 1 + round * 0.04;
      document.getElementById('p1-score').textContent = p1Score;
      spawnParticles(W, ballY, '#00ffcc', 20);
      if (p1Score >= WIN_SCORE) { endGame(true); return; }
      resetBall();
    }
  }

  // ── Rendering ───────────────────────────────────────────────────────────
  function drawCourt() {
    // Background
    ctx.fillStyle = '#05050f';
    ctx.fillRect(0, 0, W, H);

    // Center line (dashed)
    ctx.setLineDash([8, 10]);
    ctx.strokeStyle = 'rgba(0,255,204,0.2)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(W / 2, 0);
    ctx.lineTo(W / 2, H);
    ctx.stroke();
    ctx.setLineDash([]);

    // Center circle
    ctx.strokeStyle = 'rgba(0,255,204,0.15)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(W / 2, H / 2, 40, 0, Math.PI * 2);
    ctx.stroke();

    // Center dot
    ctx.fillStyle = 'rgba(0,255,204,0.3)';
    ctx.beginPath();
    ctx.arc(W / 2, H / 2, 4, 0, Math.PI * 2);
    ctx.fill();

    // Outer border glow
    ctx.strokeStyle = 'rgba(0,255,204,0.1)';
    ctx.lineWidth = 3;
    ctx.strokeRect(2, 2, W - 4, H - 4);
  }

  function drawPaddle(x, y, w, h, color) {
    ctx.shadowColor = color;
    ctx.shadowBlur = 18;
    ctx.fillStyle = color;
    // Rounded rect
    var r = Math.min(w, h, 6);
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
    ctx.fill();
    ctx.shadowBlur = 0;

    // Inner highlight
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.fillRect(x + 2, y + 2, 2, h - 4);
  }

  function drawBall() {
    // Trail
    for (var i = 0; i < trail.length; i++) {
      var t = trail[i];
      var alpha = (i / trail.length) * 0.4;
      var size = ballR * (i / trail.length) * 0.8;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#00ffcc';
      ctx.shadowColor = '#00ffcc';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(t.x, t.y, size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;

    // Ball
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 16;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(ballX, ballY, ballR, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Ball glow ring
    ctx.strokeStyle = 'rgba(0,255,204,0.6)';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#00ffcc';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(ballX, ballY, ballR + 3, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  function drawScoreDisplay() {
    // Big neon scores rendered on canvas (mid-game)
    if (state !== STATE.PLAYING) return;
    ctx.font = 'bold ' + Math.round(H * 0.08) + 'px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    ctx.shadowColor = '#00ffcc';
    ctx.shadowBlur = 15;
    ctx.fillStyle = '#00ffcc';
    ctx.globalAlpha = 0.12;
    ctx.fillText(p1Score, W * 0.25, H * 0.05);

    ctx.shadowColor = '#ff4466';
    ctx.fillStyle = '#ff4466';
    ctx.fillText(p2Score, W * 0.75, H * 0.05);
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
  }

  function render() {
    drawCourt();
    var padH = H * PAD_H_FRAC;
    drawPaddle(pad1X, pad1Y, PAD_W, padH, '#00ffcc');
    drawPaddle(pad2X, pad2Y, PAD_W, padH, '#ff4466');
    drawBall();
    drawParticles();
    drawScoreDisplay();
  }

  // ── Game Loop ───────────────────────────────────────────────────────────
  var lastTime = 0;
  function gameLoop(ts) {
    if (state === STATE.PLAYING) {
      updatePhysics();
      updateParticles();
    }
    render();
    lastTime = ts;
    requestAnimationFrame(gameLoop);
  }

  // ── Game Control ────────────────────────────────────────────────────────
  function startGame() {
    p1Score = 0; p2Score = 0; round = 0; roundSpeed = 1;
    particles = []; trail = [];
    document.getElementById('p1-score').textContent = '0';
    document.getElementById('p2-score').textContent = '0';
    document.getElementById('overlay').classList.add('hidden');
    state = STATE.PLAYING;
    initPositions();
  }

  function endGame(playerWon) {
    state = STATE.OVER;
    playSound(playerWon ? 'win' : 'lose');

    // Monetag ad
    if (window.GZMonetagSafe) {
      window.GZMonetagSafe.maybeLoad();
    }

    var overlay = document.getElementById('overlay');
    document.getElementById('overlay-title').textContent = playerWon ? 'YOU WIN!' : 'GAME OVER';
    document.getElementById('overlay-sub').textContent = 'Classic Arcade Tennis';
    document.getElementById('overlay-final').style.display = 'block';
    document.getElementById('overlay-final').innerHTML =
      'Final Score<br><span style="color:#00ffcc;font-size:1.4em">' + p1Score + '</span> — <span style="color:#ff4466;font-size:1.4em">' + p2Score + '</span>';
    document.getElementById('diff-btns').style.display = 'flex';
    document.getElementById('start-btn').textContent = 'PLAY AGAIN';
    overlay.classList.remove('hidden');
  }

  function setDiff(d) {
    difficulty = d;
    document.getElementById('diff-display').textContent = diffNames[d - 1];
    document.querySelectorAll('.diff-btn').forEach(function(btn, i) {
      btn.className = 'diff-btn' + (i + 1 === d ? ' active-' + ['easy','medium','hard'][i] : '');
    });
  }

  function toggleMute() {
    muted = !muted;
    document.getElementById('mute-btn').textContent = muted ? '🔇 Muted' : '🔊 Sound';
  }

  // ── Init ────────────────────────────────────────────────────────────────
  function init() {
    updateSize();
    initPositions();
    // Draw initial frame
    render();

    window.addEventListener('resize', function() {
      updateSize();
      initPositions();
    });

    // Start loop
    requestAnimationFrame(gameLoop);
  }

  init();

  // ── Expose API ─────────────────────────────────────────────────────────
  window.game = {
    start: startGame,
    setDiff: setDiff,
    toggleMute: toggleMute
  };

})();
