/* =========================================
   ALIEN WHACK — Space Reflex Game
   Pure HTML5 Canvas, Web Audio API
   ========================================= */

(function(){
  'use strict';

  // ---- Canvas setup ----
  var canvas = document.getElementById('c');
  var ctx = canvas.getContext('2d');
  var wrap = document.getElementById('canvas-wrap');

  function resize() {
    var rect = wrap.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
    return { w: rect.width, h: rect.height };
  }

  var size = resize();
  window.addEventListener('resize', function(){ size = resize(); });

  // ---- Audio (Web Audio API) ----
  var audioCtx = null;
  function getAudio() {
    if (!audioCtx) {
      try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e){}
    }
    return audioCtx;
  }

  function playTone(freq, type, duration, volume, startTime) {
    var ac = getAudio();
    if (!ac) return;
    try {
      var osc = ac.createOscillator();
      var gain = ac.createGain();
      osc.type = type || 'sine';
      osc.frequency.setValueAtTime(freq, startTime || ac.currentTime);
      gain.gain.setValueAtTime(volume || 0.3, startTime || ac.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, (startTime || ac.currentTime) + duration);
      osc.connect(gain);
      gain.connect(ac.destination);
      osc.start(startTime || ac.currentTime);
      osc.stop((startTime || ac.currentTime) + duration);
    } catch(e){}
  }

  function playHit() { playTone(880, 'square', 0.1, 0.2); playTone(1320, 'sine', 0.08, 0.15); }
  function playGold() { playTone(523, 'sine', 0.15, 0.25); playTone(659, 'sine', 0.15, 0.25); playTone(784, 'sine', 0.15, 0.25); }
  function playBomb() { playTone(120, 'sawtooth', 0.3, 0.3); playTone(80, 'sawtooth', 0.4, 0.2); }
  function playMiss() { playTone(200, 'sine', 0.1, 0.1); }
  function playGameOver() {
    var ac = getAudio();
    if (!ac) return;
    [523, 392, 330, 262].forEach(function(f, i) {
      playTone(f, 'sine', 0.3, 0.25, ac.currentTime + i * 0.15);
    });
  }

  // ---- Game constants ----
  var ROWS = 3, COLS = 3;
  var GAME_DURATION = 60;
  var HOLE_RADIUS_RATIO = 0.38; // ratio to cell half-size
  var ALIEN_RADIUS_RATIO = 0.28;
  var POP_DURATION = 1800; // ms alien stays visible
  var COMBO_MAX = 5; // hits needed for 2x

  // ---- Game state ----
  var score = 0;
  var best = parseInt(localStorage.getItem('alienWhackBest') || '0', 10);
  var timeLeft = GAME_DURATION;
  var gameRunning = false;
  var gameOverShown = false;
  var combo = 0;
  var combo2x = false;

  // ---- Particles ----
  var particles = [];

  function createParticles(x, y, color, count) {
    for (var i = 0; i < count; i++) {
      var angle = (Math.PI * 2 / count) * i + Math.random() * 0.5;
      var speed = 2 + Math.random() * 4;
      particles.push({
        x: x, y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        decay: 0.03 + Math.random() * 0.03,
        r: 2 + Math.random() * 4,
        color: color
      });
    }
  }

  function updateParticles() {
    for (var i = particles.length - 1; i >= 0; i--) {
      var p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.1;
      p.life -= p.decay;
      if (p.life <= 0) particles.splice(i, 1);
    }
  }

  function drawParticles() {
    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      ctx.globalAlpha = p.life;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * p.life, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  // ---- Aliens (holes) ----
  var holes = [];

  function initHoles() {
    holes = [];
    var availW = size.w - 40;
    var availH = size.h - 40;
    var cellW = availW / COLS;
    var cellH = availH / ROWS;
    for (var r = 0; r < ROWS; r++) {
      for (var c = 0; c < COLS; c++) {
        var cx = 20 + cellW * (c + 0.5);
        var cy = 20 + cellH * (r + 0.5);
        holes.push({
          row: r, col: c,
          cx: cx, cy: cy,
          cellW: cellW, cellH: cellH,
          alien: null, // { type, t, progress }
          popTimer: 0,
          occupied: false
        });
      }
    }
  }

  function getSpeedMultiplier() {
    // Speed increases as time runs out
    var elapsed = GAME_DURATION - timeLeft;
    return 1 + elapsed * 0.025; // up to ~2.5x at end
  }

  function spawnAlien() {
    if (!gameRunning) return;
    // Pick empty hole
    var empty = holes.filter(function(h){ return !h.occupied; });
    if (empty.length === 0) return;
    var h = empty[Math.floor(Math.random() * empty.length)];

    // Type distribution: 70% normal, 20% gold, 10% bomb
    var rand = Math.random();
    var type = 'normal';
    if (rand > 0.9) type = 'bomb';
    else if (rand > 0.7) type = 'gold';

    // Spawn rate scales with time
    var speed = getSpeedMultiplier();
    var baseDelay = 900;
    var delay = Math.max(400, baseDelay / speed);

    h.alien = { type: type, t: 0, delay: delay, maxDelay: delay };
    h.occupied = true;
  }

  function updateAliens(dt) {
    for (var i = 0; i < holes.length; i++) {
      var h = holes[i];
      if (!h.alien) continue;
      h.alien.t += dt;
      if (h.alien.t >= h.alien.maxDelay) {
        // Time's up — alien escapes (counts as miss for combo)
        if (h.alien.type !== 'bomb') {
          // Miss resets combo
          combo = 0;
          updateComboUI();
        }
        h.alien = null;
        h.occupied = false;
      }
    }
  }

  // ---- Drawing ----

  function drawAlienShape(x, y, radius, type) {
    var scale = radius / 40; // normalize to 40px reference

    ctx.save();
    ctx.translate(x, y);

    if (type === 'bomb') {
      // Bomb: dark circle with skull-like face
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      var grad = ctx.createRadialGradient(0, -radius*0.3, 0, 0, 0, radius);
      grad.addColorStop(0, '#555');
      grad.addColorStop(1, '#111');
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.strokeStyle = '#ff4444';
      ctx.lineWidth = 2 * scale;
      ctx.stroke();

      // Fuse
      ctx.beginPath();
      ctx.moveTo(0, -radius);
      ctx.quadraticCurveTo(radius*0.3, -radius*1.3, radius*0.2, -radius*1.5);
      ctx.strokeStyle = '#888';
      ctx.lineWidth = 2 * scale;
      ctx.stroke();
      // Spark
      ctx.beginPath();
      ctx.arc(radius*0.2, -radius*1.5, 3*scale, 0, Math.PI*2);
      ctx.fillStyle = '#fbbf24';
      ctx.fill();

      // Eyes
      ctx.fillStyle = '#ff4444';
      ctx.beginPath(); ctx.arc(-radius*0.3, -radius*0.1, radius*0.12, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(radius*0.3, -radius*0.1, radius*0.12, 0, Math.PI*2); ctx.fill();
      // Angry mouth
      ctx.beginPath();
      ctx.arc(0, radius*0.25, radius*0.3, 0.1*Math.PI, 0.9*Math.PI);
      ctx.strokeStyle = '#ff4444';
      ctx.lineWidth = 2*scale;
      ctx.stroke();

    } else if (type === 'gold') {
      // Gold alien: golden glowing creature
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      var grad = ctx.createRadialGradient(-radius*0.2, -radius*0.2, 0, 0, 0, radius);
      grad.addColorStop(0, '#fff7a0');
      grad.addColorStop(0.4, '#fbbf24');
      grad.addColorStop(1, '#d97706');
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 2 * scale;
      ctx.stroke();

      // Glow effect
      ctx.shadowColor = '#fbbf24';
      ctx.shadowBlur = 15 * scale;

      // Eyes
      ctx.fillStyle = '#000';
      ctx.beginPath(); ctx.ellipse(-radius*0.28, -radius*0.1, radius*0.15, radius*0.18, 0, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(radius*0.28, -radius*0.1, radius*0.15, radius*0.18, 0, 0, Math.PI*2); ctx.fill();
      // Eye shine
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(-radius*0.22, -radius*0.15, radius*0.06, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(radius*0.34, -radius*0.15, radius*0.06, 0, Math.PI*2); ctx.fill();

      // Mouth
      ctx.strokeStyle = '#92400e';
      ctx.lineWidth = 2*scale;
      ctx.beginPath();
      ctx.arc(0, radius*0.2, radius*0.2, 0.15*Math.PI, 0.85*Math.PI);
      ctx.stroke();

      // Antennae
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 2*scale;
      for (var side = -1; side <= 1; side += 2) {
        ctx.beginPath();
        ctx.moveTo(side * radius*0.4, -radius*0.8);
        ctx.quadraticCurveTo(side * radius*0.7, -radius*1.3, side * radius*0.3, -radius*1.4);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(side * radius*0.3, -radius*1.4, 3*scale, 0, Math.PI*2);
        ctx.fillStyle = '#fbbf24';
        ctx.fill();
      }

    } else {
      // Normal alien: green classic whack-a-mole alien
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      var grad = ctx.createRadialGradient(-radius*0.2, -radius*0.2, 0, 0, 0, radius);
      grad.addColorStop(0, '#6ee7b7');
      grad.addColorStop(0.5, '#10b981');
      grad.addColorStop(1, '#047857');
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.strokeStyle = '#34d399';
      ctx.lineWidth = 2 * scale;
      ctx.stroke();

      // Eyes
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(-radius*0.28, -radius*0.1, radius*0.18, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(radius*0.28, -radius*0.1, radius*0.18, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#000';
      ctx.beginPath(); ctx.arc(-radius*0.22, -radius*0.08, radius*0.1, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(radius*0.34, -radius*0.08, radius*0.1, 0, Math.PI*2); ctx.fill();
      // Eye shine
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(-radius*0.18, -radius*0.12, radius*0.04, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(radius*0.38, -radius*0.12, radius*0.04, 0, Math.PI*2); ctx.fill();

      // Mouth
      ctx.strokeStyle = '#065f46';
      ctx.lineWidth = 2*scale;
      ctx.beginPath();
      ctx.arc(0, radius*0.2, radius*0.25, 0.15*Math.PI, 0.85*Math.PI);
      ctx.stroke();

      // Antennae
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2*scale;
      for (var side = -1; side <= 1; side += 2) {
        ctx.beginPath();
        ctx.moveTo(side * radius*0.4, -radius*0.8);
        ctx.quadraticCurveTo(side * radius*0.7, -radius*1.2, side * radius*0.3, -radius*1.35);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(side * radius*0.3, -radius*1.35, 3*scale, 0, Math.PI*2);
        ctx.fillStyle = '#34d399';
        ctx.fill();
      }
    }

    ctx.restore();
  }

  function drawHole(cx, cy, halfW, halfH) {
    var rx = halfW * 0.85;
    var ry = halfH * 0.55;
    var r = Math.min(rx, ry);

    // Hole background (dark)
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(cx, cy + ry * 0.15, rx, ry, 0, 0, Math.PI * 2);
    var grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    grad.addColorStop(0, '#000');
    grad.addColorStop(0.7, '#0a0a1e');
    grad.addColorStop(1, '#1a1a3e');
    ctx.fillStyle = grad;
    ctx.fill();

    // Hole rim
    ctx.strokeStyle = 'rgba(167,139,250,0.4)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Subtle glow around hole
    ctx.beginPath();
    ctx.ellipse(cx, cy + ry * 0.15, rx + 4, ry + 4, 0, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(167,139,250,0.15)';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();
  }

  function getAlienProgress(h) {
    if (!h.alien) return 0;
    var t = h.alien.t;
    var d = h.alien.maxDelay;
    var halfVis = d * 0.15;
    if (t < halfVis) {
      // Pop in
      return t / halfVis;
    } else if (t > d - halfVis) {
      // Pop out
      return (d - t) / halfVis;
    }
    return 1;
  }

  function drawAll() {
    var availW = size.w - 40;
    var availH = size.h - 40;
    var cellW = availW / COLS;
    var cellH = availH / ROWS;
    var halfW = cellW / 2;
    var halfH = cellH / 2;
    var alienR = Math.min(cellW, cellH) * ALIEN_RADIUS_RATIO;

    // Background
    ctx.clearRect(0, 0, size.w, size.h);

    // Grid dots (space grid)
    for (var r = 0; r <= ROWS; r++) {
      for (var c = 0; c <= COLS; c++) {
        var px = 20 + cellW * c;
        var py = 20 + cellH * r;
        ctx.beginPath();
        ctx.arc(px, py, 2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(167,139,250,0.2)';
        ctx.fill();
      }
    }

    // Draw holes
    for (var i = 0; i < holes.length; i++) {
      var h = holes[i];
      if (h.alien) {
        var prog = getAlienProgress(h);
        if (prog > 0) {
          var alienY = h.cy + (halfH - alienR) * (1 - prog);
          ctx.save();
          ctx.globalAlpha = Math.min(1, prog * 2);
          drawHole(h.cx, h.cy, halfW, halfH);
          ctx.restore();

          if (prog > 0.3) {
            var scale = Math.min(1, prog);
            ctx.save();
            ctx.globalAlpha = Math.min(1, (prog - 0.3) / 0.7);
            ctx.translate(h.cx, alienY);
            ctx.scale(scale, scale);
            drawAlienShape(0, 0, alienR, h.alien.type);
            ctx.restore();
          }
        }
      } else {
        drawHole(h.cx, h.cy, halfW, halfH);
      }
    }

    // Particles
    drawParticles();
  }

  // ---- Input handling ----
  function handleHit(clientX, clientY) {
    if (!gameRunning) return;
    var rect = canvas.getBoundingClientRect();
    var scaleX = size.w / rect.width;
    var scaleY = size.h / rect.height;
    var mx = (clientX - rect.left) * scaleX;
    var my = (clientY - rect.top) * scaleY;

    var availW = size.w - 40;
    var availH = size.h - 40;
    var cellW = availW / COLS;
    var cellH = availH / ROWS;
    var halfW = cellW / 2;
    var halfH = cellH / 2;
    var alienR = Math.min(cellW, cellH) * ALIEN_RADIUS_RATIO;

    var hit = false;
    for (var i = 0; i < holes.length; i++) {
      var h = holes[i];
      if (!h.alien) continue;
      var prog = getAlienProgress(h);
      if (prog < 0.3) continue;

      var alienY = h.cy + (halfH - alienR) * (1 - prog);
      var dx = mx - h.cx;
      var dy = my - alienY;
      var dist = Math.sqrt(dx*dx + dy*dy);

      if (dist < alienR * 1.4) {
        hit = true;
        var type = h.alien.type;
        var pts = 0;
        var color = '#fff';

        if (type === 'bomb') {
          pts = -2;
          color = '#ff4444';
          playBomb();
          combo = 0;
          combo2x = false;
        } else if (type === 'gold') {
          pts = combo2x ? 6 : 3;
          color = '#fbbf24';
          playGold();
          combo++;
          if (combo >= COMBO_MAX) {
            combo2x = true;
            showComboPop(h.cx, alienY, '2x BONUS!');
          }
        } else {
          pts = combo2x ? 2 : 1;
          color = '#34d399';
          playHit();
          combo++;
          if (combo >= COMBO_MAX) {
            combo2x = true;
            showComboPop(h.cx, alienY, '2x BONUS!');
          }
        }

        score += pts;
        if (score < 0) score = 0;
        score = Math.max(0, score);
        updateScoreUI();

        createParticles(h.cx, alienY, color, 12);
        h.alien = null;
        h.occupied = false;
        updateComboUI();
        break;
      }
    }

    if (!hit) {
      // Missed — play subtle sound, reset combo only if they tapped a hole
      var tappedHole = false;
      for (var j = 0; j < holes.length; j++) {
        var hj = holes[j];
        var dx2 = mx - hj.cx;
        var dy2 = my - hj.cy;
        var dist2 = Math.sqrt(dx2*dx2 + dy2*dy2);
        var holeRx = halfW * 0.85;
        var holeRy = halfH * 0.55;
        if (dist2 < Math.max(holeRx, holeRy) * 1.1) {
          tappedHole = true;
          break;
        }
      }
      if (tappedHole) {
        playMiss();
        combo = 0;
        combo2x = false;
        updateComboUI();
      }
    }
  }

  function showComboPop(x, y, text) {
    var wrap2 = document.getElementById('canvas-wrap');
    var el = document.createElement('div');
    el.className = 'combo-pop';
    el.textContent = text;
    var rect = canvas.getBoundingClientRect();
    var scaleX = rect.width / size.w;
    var scaleY = rect.height / size.h;
    el.style.left = (x * scaleX) + 'px';
    el.style.top = (y * scaleY) + 'px';
    wrap2.appendChild(el);
    setTimeout(function(){ if(el.parentNode) el.parentNode.removeChild(el); }, 800);
  }

  canvas.addEventListener('click', function(e) {
    handleHit(e.clientX, e.clientY);
  });
  canvas.addEventListener('touchstart', function(e) {
    e.preventDefault();
    var t = e.changedTouches[0];
    handleHit(t.clientX, t.clientY);
  }, { passive: false });

  // ---- UI updates ----
  function updateScoreUI() {
    document.getElementById('score').textContent = score;
  }

  function updateTimerUI() {
    var el = document.getElementById('timer');
    el.textContent = Math.ceil(timeLeft);
    if (timeLeft <= 10) {
      el.style.color = '#ff6b6b';
    } else {
      el.style.color = '';
    }
  }

  function updateComboUI() {
    document.getElementById('combo-count').textContent = combo;
    var pct = Math.min(100, (combo / COMBO_MAX) * 100);
    document.getElementById('combo-bar').style.width = pct + '%';
    if (combo2x) {
      document.getElementById('combo-bar').style.background = 'linear-gradient(90deg,#fbbf24,#ff6b6b)';
    } else {
      document.getElementById('combo-bar').style.background = 'linear-gradient(90deg,#a78bfa,#fbbf24)';
    }
  }

  // ---- Game flow ----
  var lastTs = 0;
  var timerAccum = 0;
  var spawnAccum = 0;
  var spawnInterval = 900;

  function gameLoop(ts) {
    if (!lastTs) lastTs = ts;
    var dt = Math.min(ts - lastTs, 50); // cap delta
    lastTs = ts;

    if (gameRunning) {
      // Timer
      timerAccum += dt;
      if (timerAccum >= 1000) {
        timerAccum -= 1000;
        timeLeft--;
        updateTimerUI();
        if (timeLeft <= 0) {
          endGame();
          return;
        }
      }

      // Spawn aliens
      var speed = getSpeedMultiplier();
      spawnInterval = Math.max(350, 900 / speed);
      spawnAccum += dt;
      if (spawnAccum >= spawnInterval) {
        spawnAccum -= spawnInterval;
        spawnAlien();
        // Sometimes spawn 2 at once at higher speeds
        if (speed > 1.5 && Math.random() < 0.3) {
          setTimeout(function(){ spawnAlien(); }, 100);
        }
      }

      updateAliens(dt);
      updateParticles();
    }

    drawAll();
    if (gameRunning || particles.length > 0) {
      requestAnimationFrame(gameLoop);
    }
  }

  function startGame() {
    score = 0;
    timeLeft = GAME_DURATION;
    combo = 0;
    combo2x = false;
    gameRunning = true;
    gameOverShown = false;
    particles = [];
    lastTs = 0;
    timerAccum = 0;
    spawnAccum = 0;
    spawnInterval = 900;

    updateScoreUI();
    updateTimerUI();
    updateComboUI();
    document.getElementById('timer').style.color = '';
    document.getElementById('game-over').style.display = 'none';
    document.getElementById('start-btn').textContent = '🎮 PLAYING...';
    document.getElementById('start-btn').style.pointerEvents = 'none';

    initHoles();
    requestAnimationFrame(gameLoop);

    // First spawn after 500ms
    setTimeout(function(){ spawnAlien(); }, 500);
  }

  function endGame() {
    gameRunning = false;
    playGameOver();

    if (score > best) {
      best = score;
      localStorage.setItem('alienWhackBest', best);
    }

    document.getElementById('go-score').textContent = 'Score: ' + score;
    document.getElementById('go-best').textContent = 'Best: ' + best;
    var msgs = [
      'Great reflexes, space warrior!',
      'Alien hunters never quit!',
      'The galaxy is proud of you!',
      'Your aim is out of this world!',
      'Ready for another round?'
    ];
    document.getElementById('go-msg').textContent = msgs[Math.floor(Math.random() * msgs.length)];

    document.getElementById('game-over').style.display = 'flex';
    document.getElementById('start-btn').textContent = '🚀 START GAME';
    document.getElementById('start-btn').style.pointerEvents = '';
    document.getElementById('best').textContent = best;

    // Trigger monetag ad
    if (window.GZMonetagSafe) {
      window.GZMonetagSafe.maybeLoad();
    }
  }

  // ---- Init ----
  document.getElementById('best').textContent = best;
  initHoles();
  requestAnimationFrame(gameLoop); // idle loop for bg draw

  document.getElementById('start-btn').addEventListener('click', function() {
    if (!gameRunning) startGame();
  });
  document.getElementById('play-again-btn').addEventListener('click', function() {
    startGame();
  });

})();
