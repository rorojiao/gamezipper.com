// Dessert Blast - Pure H5 Version (no wx-adapter, no module system)
(function() {
'use strict';

// ===== CONFIG =====
var GRID = 8;
var DESSERT_NAMES = ['🍩', '🍰', '🍫', '🍮', '🧁'];
var SHAPES = [
  [[1]],
  [[1,1]],[[1],[1]],
  [[1,1,1]],[[1],[1],[1]],
  [[1,1],[1,0]],[[1,1],[0,1]],[[0,1],[1,1]],[[1,0],[1,1]],
  [[1,1,1,1]],[[1],[1],[1],[1]],
  [[1,1],[1,1]],
  [[1,1,1],[1,0,0]],[[1,1,1],[0,0,1]],
  [[1,0],[1,0],[1,1]],[[0,1],[0,1],[1,1]],
  [[1,1,1,1,1]],[[1],[1],[1],[1],[1]],
  [[1,1,1],[0,1,0]],
  [[1,1,0],[0,1,1]],
  [[0,1,1],[1,1,0]],
];

var THEMES = {
  dessert: { name:'Dessert', colors:['#FF6B9D','#9B59B6','#A0522D','#F4D03F','#48C9B0'], light:['#FF9EBF','#C39BD3','#CD853F','#F9E77F','#7DDFCA'], dark:['#CC3366','#6C3483','#6D3419','#D4AC0D','#1A9C85'], bg:'#0D1B2A', boardBg:'#0a1628', border:'#FFD740', unlocked:true },
  fruit:   { name:'Fruit', colors:['#FF4444','#FF8C00','#FFD700','#32CD32','#4169E1'], light:['#FF7777','#FFB040','#FFE740','#66E066','#6A99F1'], dark:['#CC1111','#CC6600','#CCB000','#1A9C1A','#2A4FBB'], bg:'#1A0A2E', boardBg:'#2A1A3E', border:'#FF6B35', unlocked:false, unlockBy:'streak_day3' },
  space:   { name:'Space', colors:['#00D4FF','#8B5CF6','#EC4899','#10B981','#F59E0B'], light:['#40E4FF','#AA88FF','#F480BB','#40D9A8','#FFB840'], dark:['#0099BB','#5B2CC6','#BB1166','#0A8055','#C07000'], bg:'#0A0A20', boardBg:'#151535', border:'#00D4FF', unlocked:false, unlockBy:'streak_day6' },
  ocean:   { name:'Ocean', colors:['#0EA5E9','#06B6D4','#14B8A6','#6366F1','#F472B6'], light:['#40C5FF','#40D6E8','#40D8C8','#8888FF','#FF99CC'], dark:['#0A7ABB','#048A9E','#0A8A7A','#4040CC','#CC4088'], bg:'#0C1929', boardBg:'#132B43', border:'#38BDF8', unlocked:false, unlockBy:'streak_day7' },
  neon:    { name:'Neon', colors:['#FF0080','#00FF80','#8000FF','#FFFF00','#00FFFF'], light:['#FF40A0','#40FFA0','#A040FF','#FFFF40','#40FFFF'], dark:['#CC0060','#00CC60','#6000CC','#CCCC00','#00CCCC'], bg:'#0A0A0A', boardBg:'#1A1A1A', border:'#FF0080', unlocked:false, unlockBy:'score_5000' },
};

var ACHIEVEMENTS = [
  {id:'first_clear', name:'First Sweet', desc:'First clear', icon:'🍬', check: function(s) { return s.totalClears >= 1; }},
  {id:'clear_10', name:'Pastry Chef', desc:'Clear 10 rows', icon:'👨‍🍳', check: function(s) { return s.totalClears >= 10; }},
  {id:'clear_100', name:'Dessert Master', desc:'Clear 100 rows', icon:'🎂', check: function(s) { return s.totalClears >= 100; }},
  {id:'clear_500', name:'Legendary Baker', desc:'Clear 500 rows', icon:'👑', check: function(s) { return s.totalClears >= 500; }},
  {id:'combo_2', name:'Double Clear', desc:'Clear 2 rows at once', icon:'✌️', check: function(s) { return s.maxCombo >= 2; }},
  {id:'combo_3', name:'Triple Combo', desc:'Clear 3 rows at once', icon:'🔥', check: function(s) { return s.maxCombo >= 3; }},
  {id:'combo_4', name:'Quad Combo!', desc:'Clear 4+ rows at once', icon:'💥', check: function(s) { return s.maxCombo >= 4; }},
  {id:'score_500', name:'Sweet Start', desc:'Score 500 in one game', icon:'⭐', check: function(s) { return s.bestScore >= 500; }},
  {id:'score_2000', name:'Candy Whirlwind', desc:'Score 2000 in one game', icon:'🌟', check: function(s) { return s.bestScore >= 2000; }},
  {id:'score_5000', name:'Dessert Storm', desc:'Score 5000 in one game', icon:'💫', check: function(s) { return s.bestScore >= 5000; }},
  {id:'score_10000', name:'10K Legend', desc:'Score 10000 in one game', icon:'🏆', check: function(s) { return s.bestScore >= 10000; }},
  {id:'games_10', name:'Regular', desc:'Play 10 games', icon:'🎮', check: function(s) { return s.totalGames >= 10; }},
  {id:'games_50', name:'Loyal Fan', desc:'Play 50 games', icon:'❤️', check: function(s) { return s.totalGames >= 50; }},
  {id:'streak_3', name:'3-Day Streak', desc:'Login 3 days in a row', icon:'📅', check: function(s) { return s.streak >= 3; }},
  {id:'streak_7', name:'Weekly Streak', desc:'Login 7 days in a row', icon:'🔥', check: function(s) { return s.streak >= 7; }},
];

var SIGNIN_REWARDS = [
  {day:1, reward:'+50 pts', score:50},
  {day:2, reward:'+100 pts', score:100},
  {day:3, reward:'🍇Fruit Theme', score:0, theme:'fruit'},
  {day:4, reward:'+200 pts', score:200},
  {day:5, reward:'+300 pts', score:300},
  {day:6, reward:'🚀Space Theme', score:0, theme:'space'},
  {day:7, reward:'+500 pts+🌊Ocean', score:500, theme:'ocean'},
];

var TUTORIAL_STEPS = [
  { text: '👆 Drag blocks to empty spaces', yRatio: 0.55 },
  { text: '✨ Fill a row or column to clear', yRatio: 0.35 },
  { text: '⚠️ Game ends when no blocks can fit', yRatio: 0.60 },
];

// ===== SAVE =====
var save = {
  _stats: null,
  _signIn: null,

  getStats: function() {
    if (!this._stats) {
      try {
        this._stats = JSON.parse(localStorage.getItem('dessert-stats') || '{}');
      } catch(e) { this._stats = {}; }
      if (!this._stats.totalClears) {
        this._stats = { totalClears:0, maxCombo:0, bestScore:0, totalGames:0, totalScore:0, totalTime:0, streak:0, lastLogin:'', unlockedAch:[], unlockedThemes:['dessert'] };
      }
    }
    return this._stats;
  },

  saveStats: function() {
    try { localStorage.setItem('dessert-stats', JSON.stringify(this._stats)); } catch(e) {}
  },

  getBest: function() {
    return parseInt(localStorage.getItem('dessert-blast-best') || '0');
  },

  setBest: function(v) {
    try { localStorage.setItem('dessert-blast-best', '' + v); } catch(e) {}
  },

  getSignIn: function() {
    if (!this._signIn) {
      try {
        this._signIn = JSON.parse(localStorage.getItem('dessert-signin') || '{}');
      } catch(e) { this._signIn = {}; }
      if (!this._signIn.lastDate) this._signIn = { lastDate:'', streak:0, claimed:false };
    }
    return this._signIn;
  },

  saveSignIn: function() {
    try { localStorage.setItem('dessert-signin', JSON.stringify(this._signIn)); } catch(e) {}
  },

  get: function(key) { try { return localStorage.getItem(key) || ''; } catch(e) { return ''; } },
  set: function(key, val) { try { localStorage.setItem(key, val); } catch(e) {} },

  getMuted: function() { return localStorage.getItem('dessert-muted') === '1'; },
  setMuted: function(v) { try { localStorage.setItem('dessert-muted', v ? '1' : '0'); } catch(e) {} },

  getTheme: function() { return localStorage.getItem('dessert-theme') || 'dessert'; },
  setTheme: function(v) { try { localStorage.setItem('dessert-theme', v); } catch(e) {} },

  getTutorialDone: function() { return localStorage.getItem('dessert-tutorial-done') === '1'; },
  setTutorialDone: function() { try { localStorage.setItem('dessert-tutorial-done', '1'); } catch(e) {} },
};

// ===== SOUND =====
var _soundMuted = false;

var sound = {
  init: function(muted) { _soundMuted = !!muted; },
  setMuted: function(m) { _soundMuted = m; },
  isMuted: function() { return _soundMuted; },

  play: function(type) {
    if (_soundMuted) return;
    this.vibrate(type);
  },

  vibrate: function(type) {
    try {
      if (type === 'combo' || type === 'gameover') {
        if (navigator.vibrate) navigator.vibrate(400);
      } else {
        if (navigator.vibrate) navigator.vibrate(15);
      }
    } catch(e) {}
  }
};

// ===== RENDERER =====
var _rCanvas = null;
var _rCtx = null;
var _rW = 0;
var _rH = 0;
var _rDpr = 1;

var renderer = {
  init: function() {
    _rCanvas = document.getElementById('gameCanvas');
    _rCtx = _rCanvas.getContext('2d');
    _rW = window.innerWidth;
    _rH = window.innerHeight;
    _rDpr = window.devicePixelRatio || 1;
    _rCanvas.width = _rW * _rDpr;
    _rCanvas.height = _rH * _rDpr;
    _rCtx.scale(_rDpr, _rDpr);
    return { canvas: _rCanvas, ctx: _rCtx, w: _rW, h: _rH, dpr: _rDpr };
  },

  getCanvas: function() { return _rCanvas; },
  getCtx: function() { return _rCtx; },
  getWidth: function() { return _rW; },
  getHeight: function() { return _rH; },

  clear: function(color) {
    _rCtx.fillStyle = color || '#0D1B2A';
    _rCtx.fillRect(0, 0, _rW, _rH);
  },

  roundRect: function(x, y, w, h, r) {
    _rCtx.beginPath();
    _rCtx.moveTo(x + r, y);
    _rCtx.lineTo(x + w - r, y);
    _rCtx.quadraticCurveTo(x + w, y, x + w, y + r);
    _rCtx.lineTo(x + w, y + h - r);
    _rCtx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    _rCtx.lineTo(x + r, y + h);
    _rCtx.quadraticCurveTo(x, y + h, x, y + h - r);
    _rCtx.lineTo(x, y + r);
    _rCtx.quadraticCurveTo(x, y, x + r, y);
    _rCtx.closePath();
  },

  drawDessertCell: function(x, y, size, colorIdx, theme) {
    var colors = theme.colors;
    var light = theme.light;
    var dark = theme.dark;
    var padding = size * 0.08;
    var cx = x + padding;
    var cy = y + padding;
    var cs = size - padding * 2;
    var r = cs * 0.2;

    var grad = _rCtx.createLinearGradient(cx, cy, cx + cs, cy + cs);
    grad.addColorStop(0, light[colorIdx]);
    grad.addColorStop(0.3, colors[colorIdx]);
    grad.addColorStop(0.6, colors[colorIdx]);
    grad.addColorStop(1, dark[colorIdx]);
    
    this.roundRect(cx, cy, cs, cs, r);
    _rCtx.fillStyle = grad;
    _rCtx.fill();

    _rCtx.fillStyle = 'rgba(255,255,255,0.45)';
    _rCtx.beginPath();
    _rCtx.ellipse(cx + cs * 0.35, cy + cs * 0.25, cs * 0.2, cs * 0.12, 0, 0, Math.PI * 2);
    _rCtx.fill();

    this.roundRect(cx, cy + cs * 0.85, cs, cs * 0.15, r * 0.5);
    _rCtx.fillStyle = 'rgba(0,0,0,0.2)';
    _rCtx.fill();
  },

  drawText: function(text, x, y, opts) {
    opts = opts || {};
    _rCtx.save();
    _rCtx.font = (opts.bold ? 'bold ' : '') + (opts.size || 16) + 'px sans-serif';
    _rCtx.fillStyle = opts.color || '#FFF';
    _rCtx.textAlign = opts.align || 'center';
    _rCtx.textBaseline = opts.baseline || 'middle';
    if (opts.shadow) {
      _rCtx.shadowColor = opts.shadowColor || 'rgba(0,0,0,0.5)';
      _rCtx.shadowBlur = opts.shadowBlur || 4;
      _rCtx.shadowOffsetY = opts.shadowOffsetY || 2;
    }
    _rCtx.fillText(text, x, y);
    _rCtx.restore();
  },

  drawButton: function(x, y, w, h, text, opts) {
    opts = opts || {};
    var r = opts.radius || 12;
    var gradColors = opts.gradient || ['#6DD834', '#5CBF2A'];
    var borderColor = opts.border || '#2a5a10';

    this.roundRect(x, y + 4, w, h, r);
    _rCtx.fillStyle = borderColor;
    _rCtx.fill();

    var grad = _rCtx.createLinearGradient(x, y, x, y + h);
    grad.addColorStop(0, gradColors[0]);
    grad.addColorStop(1, gradColors[1]);
    this.roundRect(x, y, w, h, r);
    _rCtx.fillStyle = grad;
    _rCtx.fill();

    this.drawText(text, x + w / 2, y + h / 2, {
      size: opts.fontSize || 18, bold: true, color: opts.textColor || '#FFF',
      shadow: true
    });

    return { x: x, y: y, w: w, h: h };
  },

  measureText: function(text, size) {
    _rCtx.save();
    _rCtx.font = 'bold ' + size + 'px sans-serif';
    var m = _rCtx.measureText(text);
    _rCtx.restore();
    return m.width;
  }
};

// ===== PARTICLES =====
var _particles = [];

var particles = {
  init: function(ctx) { },

  spawn: function(x, y, color, count, type) {
    count = count || 5;
    type = type || 'chunk';
    for (var i = 0; i < count; i++) {
      var p = { x: x, y: y, color: color, type: type, life: 1, rotation: Math.random() * Math.PI * 2, rotSpeed: (Math.random() - 0.5) * 0.4 };
      var angle = Math.random() * Math.PI * 2;
      if (type === 'chunk') {
        var speed = Math.random() * 18 + 8;
        p.vx = Math.cos(angle) * speed; p.vy = Math.sin(angle) * speed - 4;
        p.gravity = 0.6; p.size = Math.random() * 8 + 4; p.decay = 0.015;
      } else if (type === 'spark') {
        var speed = Math.random() * 25 + 12;
        p.vx = Math.cos(angle) * speed; p.vy = Math.sin(angle) * speed;
        p.gravity = 0.1; p.size = Math.random() * 3 + 1; p.decay = 0.04;
      } else if (type === 'ring') {
        p.vx = 0; p.vy = 0; p.gravity = 0; p.size = 5;
        p.maxSize = Math.random() * 60 + 40; p.decay = 0.035;
      } else if (type === 'star') {
        var speed = Math.random() * 6 + 2;
        p.vx = Math.cos(angle) * speed; p.vy = Math.sin(angle) * speed - 3;
        p.gravity = 0.05; p.size = Math.random() * 6 + 3; p.decay = 0.012;
      }
      _particles.push(p);
    }
  },

  spawnExplosion: function(x, y, color) {
    this.spawn(x, y, color, 12, 'chunk');
    this.spawn(x, y, color, 15, 'spark');
    this.spawn(x, y, '#FFD740', 1, 'ring');
    this.spawn(x, y, color, 4, 'star');
  },

  spawnMega: function(x, y, colors) {
    for (var i = 0; i < colors.length; i++) {
      this.spawn(x, y, colors[i], 8, 'chunk');
      this.spawn(x, y, colors[i], 10, 'spark');
      this.spawn(x, y, colors[i], 3, 'star');
    }
    this.spawn(x, y, '#FFD740', 1, 'ring');
    this.spawn(x, y, '#FFF', 1, 'ring');
  },

  update: function() {
    for (var i = _particles.length - 1; i >= 0; i--) {
      var p = _particles[i];
      p.x += p.vx; p.vy += p.gravity; p.y += p.vy;
      p.vx *= 0.98; p.life -= p.decay; p.rotation += p.rotSpeed;
      if (p.type === 'ring') p.size += (p.maxSize - p.size) * 0.15;
      if (p.life <= 0) _particles.splice(i, 1);
    }
  },

  draw: function(ctx) {
    for (var i = 0; i < _particles.length; i++) {
      var p = _particles[i];
      if (p.life <= 0) continue;
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.type === 'ring' ? p.life * 0.6 : p.life);
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);

      if (p.type === 'chunk') {
        ctx.fillStyle = p.color;
        var s = p.size * p.life;
        ctx.fillRect(-s/2, -s/2, s, s);
      } else if (p.type === 'spark') {
        ctx.fillStyle = '#FFF';
        var s = p.size * p.life;
        ctx.beginPath(); ctx.arc(0, 0, s, 0, Math.PI * 2); ctx.fill();
      } else if (p.type === 'ring') {
        ctx.strokeStyle = p.color; ctx.lineWidth = 3 * p.life;
        ctx.beginPath(); ctx.arc(0, 0, p.size, 0, Math.PI * 2); ctx.stroke();
      } else if (p.type === 'star') {
        ctx.fillStyle = p.color;
        var s = p.size * p.life;
        ctx.beginPath();
        for (var j = 0; j < 5; j++) {
          var a = (j * 72 - 90) * Math.PI / 180;
          var a2 = (j * 72 + 36 - 90) * Math.PI / 180;
          if (j === 0) ctx.moveTo(Math.cos(a) * s, Math.sin(a) * s);
          else ctx.lineTo(Math.cos(a) * s, Math.sin(a) * s);
          ctx.lineTo(Math.cos(a2) * s * 0.4, Math.sin(a2) * s * 0.4);
        }
        ctx.closePath(); ctx.fill();
      }
      ctx.restore();
    }
  },

  hasParticles: function() { return _particles.length > 0; },
  clear: function() { _particles = []; }
};

// ===== SCENE MANAGER =====
var _scenes = {};
var _currentScene = null;
var _currentName = '';

var sceneManager = {
  register: function(name, scene) { _scenes[name] = scene; },

  switchTo: function(name, data) {
    if (_currentScene && _currentScene.onExit) _currentScene.onExit();
    _currentScene = _scenes[name];
    _currentName = name;
    if (_currentScene && _currentScene.onEnter) _currentScene.onEnter(data);
  },

  getCurrentName: function() { return _currentName; },
  getCurrent: function() { return _currentScene; },

  update: function(dt) {
    if (_currentScene && _currentScene.update) _currentScene.update(dt);
  },

  draw: function(ctx) {
    if (_currentScene && _currentScene.draw) _currentScene.draw(ctx);
  },

  onTouchStart: function(e) {
    if (_currentScene && _currentScene.onTouchStart) _currentScene.onTouchStart(e);
  },
  onTouchMove: function(e) {
    if (_currentScene && _currentScene.onTouchMove) _currentScene.onTouchMove(e);
  },
  onTouchEnd: function(e) {
    if (_currentScene && _currentScene.onTouchEnd) _currentScene.onTouchEnd(e);
  }
};

// ===== HOME SCENE =====
var _homeButtons = [];
var _homeIconButtons = [];
var _homeW, _homeH;

var homeScene = {
  onEnter: function() {
    _homeW = renderer.getWidth();
    _homeH = renderer.getHeight();
    this._buildButtons();
  },

  _buildButtons: function() {
    var cx = _homeW / 2;
    var bw = 220, bh = 48;
    var startY = _homeH * 0.48;
    _homeButtons = [
      { x: cx - bw/2, y: startY, w: bw, h: bh, text: '▶️ Classic Mode', action: 'classic', gradient: ['#6DD834','#5CBF2A'], border: '#2a5a10' },
      { x: cx - bw/2, y: startY + 64, w: bw, h: bh, text: '📅 Daily Challenge', action: 'daily', gradient: ['#4A90D9','#357ABD'], border: '#1a4a80' },
    ];
    var iconSize = 48, iconGap = 16;
    var icons = [
      { emoji: '🏆', action: 'achievements' },
      { emoji: '🎨', action: 'themes' },
      { emoji: '📊', action: 'stats' },
      { emoji: sound.isMuted() ? '🔇' : '🔊', action: 'mute' },
    ];
    var totalW = icons.length * iconSize + (icons.length - 1) * iconGap;
    var startX = cx - totalW / 2;
    _homeIconButtons = [];
    for (var i = 0; i < icons.length; i++) {
      _homeIconButtons.push({
        x: startX + i * (iconSize + iconGap),
        y: startY + 140,
        w: iconSize, h: iconSize,
        emoji: icons[i].emoji,
        action: icons[i].action
      });
    }
  },

  draw: function(ctx) {
    var theme = THEMES[save.getTheme()] || THEMES.dessert;
    renderer.clear(theme.bg);

    renderer.drawText('🍰 Dessert Blast', _homeW / 2, _homeH * 0.2, { size: Math.min(48, _homeW * 0.12), bold: true, color: '#FFD700', shadow: true, shadowColor: 'rgba(255,215,0,0.5)', shadowBlur: 20 });
    renderer.drawText('Dessert Blast', _homeW / 2, _homeH * 0.2 + 40, { size: 16, color: 'rgba(255,255,255,0.6)' });

    var stats = save.getStats();
    var best = stats.bestScore || save.getBest();
    renderer.drawText('🏆 Best Score: ' + best, _homeW / 2, _homeH * 0.35, { size: 18, bold: true, color: '#FFD740', shadow: true });

    for (var i = 0; i < _homeButtons.length; i++) {
      var b = _homeButtons[i];
      renderer.drawButton(b.x, b.y, b.w, b.h, b.text, { gradient: b.gradient, border: b.border });
    }

    for (var i = 0; i < _homeIconButtons.length; i++) {
      var ib = _homeIconButtons[i];
      var rctx = renderer.getCtx();
      rctx.save();
      rctx.fillStyle = 'rgba(255,255,255,0.1)';
      rctx.beginPath();
      rctx.arc(ib.x + ib.w/2, ib.y + ib.h/2, ib.w/2, 0, Math.PI * 2);
      rctx.fill();
      rctx.strokeStyle = 'rgba(255,215,64,0.3)';
      rctx.lineWidth = 2;
      rctx.stroke();
      rctx.restore();
      renderer.drawText(ib.emoji, ib.x + ib.w/2, ib.y + ib.h/2, { size: 22 });
    }

    var signIn = save.getSignIn();
    if (signIn.streak > 0) {
      renderer.drawText('📅 Login Streak: Day ' + signIn.streak + '', _homeW / 2, _homeH * 0.85, { size: 14, color: 'rgba(255,255,255,0.7)' });
    }
  },

  onTouchStart: function(e) {
    var t = e.touches[0];
    var tx = t.clientX, ty = t.clientY;

    for (var i = 0; i < _homeButtons.length; i++) {
      var b = _homeButtons[i];
      if (tx >= b.x && tx <= b.x + b.w && ty >= b.y && ty <= b.y + b.h) {
        sound.play('click');
        if (b.action === 'classic') {
          sceneManager.switchTo('game', { mode: 'classic' });
        } else if (b.action === 'daily') {
          sceneManager.switchTo('game', { mode: 'daily' });
        }
        return;
      }
    }

    for (var i = 0; i < _homeIconButtons.length; i++) {
      var ib = _homeIconButtons[i];
      var dx = tx - (ib.x + ib.w/2), dy = ty - (ib.y + ib.h/2);
      if (dx*dx + dy*dy <= (ib.w/2)*(ib.w/2)) {
        if (ib.action === 'mute') {
          var m = !sound.isMuted();
          sound.setMuted(m);
          save.setMuted(m);
          ib.emoji = m ? '🔇' : '🔊';
          if (!m) sound.play('click');
        } else if (ib.action === 'achievements') {
          sceneManager.switchTo('achievements');
        } else if (ib.action === 'themes') {
          sceneManager.switchTo('themes');
        } else if (ib.action === 'stats') {
          sceneManager.switchTo('stats-view');
        }
        return;
      }
    }
  }
};

// ===== GAME SCENE =====
var grid = [];
var score = 0;
var best = 0;
var candidates = [];
var dragging = null;
var gameMode = 'classic';
var dailyRng = null;
var revivalUsed = false;
var gameStartTime = 0;
var gameActive = false;
var gameOver = false;

var _w, _h, _boardX, _boardY, _boardSize, _cellSize;
var _candY, _hudH = 50;
var _theme;

var _clearAnim = null;
var _comboText = null;
var _scorePop = null;
var _shakeTime = 0;
var _shakeIntensity = 0;
var _flashAlpha = 0;
var _shockwaves = [];

var _previewCells = [];
var _previewValid = false;

var _touchOffsetY = -60;

var _goButtons = [];

function seededRandom(seed) {
  var s = seed;
  return function() {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function getRandom() {
  if (gameMode === 'daily' && dailyRng) return dailyRng();
  return Math.random();
}

function calcLayout() {
  _w = renderer.getWidth();
  _h = renderer.getHeight();
  _boardSize = Math.min(_w * 0.92, (_h - _hudH - 100) * 0.65);
  _cellSize = _boardSize / GRID;
  _boardX = (_w - _boardSize) / 2;
  _boardY = _hudH + 10;
  _candY = _boardY + _boardSize + 15;
  _theme = THEMES[save.getTheme()] || THEMES.dessert;
}

function initGrid() {
  grid = [];
  for (var r = 0; r < GRID; r++) {
    grid[r] = [];
    for (var c = 0; c < GRID; c++) grid[r][c] = 0;
  }
}

function generateCandidates() {
  candidates = [];
  var attempts = 0;
  var hasPlaceable = false;
  while (!hasPlaceable && attempts < 20) {
    candidates = [];
    for (var i = 0; i < 3; i++) {
      var shape = SHAPES[Math.floor(getRandom() * SHAPES.length)];
      var color = Math.floor(getRandom() * 5);
      candidates.push({ shape: shape, color: color, used: false });
    }
    for (var i = 0; i < candidates.length; i++) {
      if (canPlaceAnywhere(candidates[i].shape)) { hasPlaceable = true; break; }
    }
    attempts++;
  }
  if (!hasPlaceable) {
    var smallShapes = SHAPES.filter(function(s) { return s.length === 1 && s[0].length === 1; });
    if (smallShapes.length === 0) smallShapes = [[[1]]];
    for (var i = 0; i < 3; i++) {
      candidates[i] = { shape: smallShapes[Math.floor(getRandom() * smallShapes.length)], color: Math.floor(getRandom() * 5), used: false };
    }
  }
}

function canPlace(shape, row, col) {
  for (var r = 0; r < shape.length; r++) {
    for (var c = 0; c < shape[0].length; c++) {
      if (!shape[r][c]) continue;
      var gr = row + r, gc = col + c;
      if (gr < 0 || gr >= GRID || gc < 0 || gc >= GRID) return false;
      if (grid[gr][gc] !== 0) return false;
    }
  }
  return true;
}

function canPlaceAnywhere(shape) {
  for (var r = -(shape.length - 1); r < GRID; r++) {
    for (var c = -(shape[0].length - 1); c < GRID; c++) {
      if (canPlace(shape, r, c)) return true;
    }
  }
  return false;
}

function isGameOverCheck() {
  for (var i = 0; i < candidates.length; i++) {
    if (candidates[i].used) continue;
    if (canPlaceAnywhere(candidates[i].shape)) return false;
  }
  return true;
}

function placePiece(shape, row, col, color, candIdx) {
  var cellCount = 0;
  for (var r = 0; r < shape.length; r++) {
    for (var c = 0; c < shape[0].length; c++) {
      if (!shape[r][c]) continue;
      grid[row + r][col + c] = color + 1;
      cellCount++;
    }
  }
  score += cellCount;
  candidates[candIdx].used = true;
  sound.play('place');
  checkAndClearLines();
}

function checkAndClearLines() {
  var rowsToClear = [];
  var colsToClear = [];
  for (var r = 0; r < GRID; r++) {
    var full = true;
    for (var c = 0; c < GRID; c++) { if (grid[r][c] === 0) { full = false; break; } }
    if (full) rowsToClear.push(r);
  }
  for (var c = 0; c < GRID; c++) {
    var full = true;
    for (var r = 0; r < GRID; r++) { if (grid[r][c] === 0) { full = false; break; } }
    if (full) colsToClear.push(c);
  }

  var totalLines = rowsToClear.length + colsToClear.length;
  if (totalLines === 0) { afterClear(); return; }

  var lineScore = 10 * totalLines * totalLines;
  score += lineScore;

  var stats = save.getStats();
  stats.totalClears += totalLines;
  if (totalLines > stats.maxCombo) stats.maxCombo = totalLines;
  save.saveStats();

  var cellSet = {};
  for (var i = 0; i < rowsToClear.length; i++) {
    for (var c = 0; c < GRID; c++) cellSet[rowsToClear[i] * GRID + c] = true;
  }
  for (var i = 0; i < colsToClear.length; i++) {
    for (var r = 0; r < GRID; r++) cellSet[r * GRID + colsToClear[i]] = true;
  }
  var clearCells = Object.keys(cellSet).map(function(k) { return parseInt(k); });

  for (var i = 0; i < clearCells.length; i++) {
    var r = Math.floor(clearCells[i] / GRID), c = clearCells[i] % GRID;
    var cx = _boardX + c * _cellSize + _cellSize / 2;
    var cy = _boardY + r * _cellSize + _cellSize / 2;
    var ci = grid[r][c] - 1;
    if (ci >= 0) particles.spawnExplosion(cx, cy, _theme.colors[ci]);
  }

  if (totalLines >= 3) {
    particles.spawnMega(_boardX + _boardSize / 2, _boardY + _boardSize / 2, _theme.colors);
    for (var ei = 0; ei < totalLines; ei++) {
      var ex = _boardX + Math.random() * _boardSize;
      var ey = _boardY + Math.random() * _boardSize;
      particles.spawnExplosion(ex, ey, _theme.colors[ei % _theme.colors.length]);
    }
  }

  var msgs = ['', '✨ Nice!', '×2 Great!', '×3 Amazing!', '×4 Incredible!', '×5 LEGENDARY!'];
  _comboText = { text: totalLines >= 5 ? msgs[5] : (msgs[totalLines] || msgs[1]), progress: 0 };
  _scorePop = { text: '+' + lineScore, progress: 0 };

  _shakeTime = 0;
  _shakeIntensity = totalLines >= 4 ? 20 : totalLines >= 3 ? 14 : totalLines >= 2 ? 10 : 6;
  
  _flashAlpha = totalLines >= 3 ? 0.5 : totalLines >= 2 ? 0.3 : 0.15;
  for (var si = 0; si < rowsToClear.length; si++) {
    _shockwaves.push({ x: _boardX + _boardSize / 2, y: _boardY + rowsToClear[si] * _cellSize + _cellSize / 2, r: 0, alpha: 0.6 });
  }
  for (var si = 0; si < colsToClear.length; si++) {
    _shockwaves.push({ x: _boardX + colsToClear[si] * _cellSize + _cellSize / 2, y: _boardY + _boardSize / 2, r: 0, alpha: 0.6 });
  }

  if (totalLines >= 2) sound.play('combo');
  else sound.play('clear');

  _clearAnim = { cells: clearCells, progress: 0 };
  setTimeout(function() {
    for (var i = 0; i < clearCells.length; i++) {
      var r = Math.floor(clearCells[i] / GRID), c = clearCells[i] % GRID;
      grid[r][c] = 0;
    }
    _clearAnim = null;
    afterClear();
  }, 400);
}

function afterClear() {
  updateBest();
  if (candidates.every(function(c) { return c.used; })) generateCandidates();
  if (isGameOverCheck()) doGameOver();
}

function updateBest() {
  if (gameMode === 'daily') {
    var key = 'dessert-daily-best-' + new Date().toISOString().slice(0,10);
    var db = parseInt(save.get(key) || '0');
    if (score > db) save.set(key, '' + score);
    best = Math.max(score, db);
  } else {
    if (score > best) { best = score; save.setBest(best); }
  }
}

function doGameOver() {
  gameActive = false;
  gameOver = true;
  
  var elapsed = Math.floor((Date.now() - gameStartTime) / 1000);
  var stats = save.getStats();
  stats.totalTime = (stats.totalTime || 0) + elapsed;
  stats.totalGames++;
  stats.totalScore = (stats.totalScore || 0) + score;
  if (score > stats.bestScore) stats.bestScore = score;
  save.saveStats();
  sound.play('gameover');

  var cx = _w / 2;
  var bw = 200, bh = 44;
  _goButtons = [
    { x: cx - bw/2, y: _h * 0.55, w: bw, h: bh, text: 'Play Again', action: 'restart', gradient: ['#6DD834','#5CBF2A'], border: '#2a5a10' },
    { x: cx - bw/2, y: _h * 0.55 + 60, w: bw, h: bh, text: '🏠 Main Menu', action: 'menu', gradient: ['#4A90D9','#357ABD'], border: '#1a4a80' },
  ];
  if (!revivalUsed) {
    _goButtons.unshift({ x: cx - bw/2, y: _h * 0.55 - 60, w: bw, h: bh, text: '📺 Watch Ad to Revive?', action: 'revival', gradient: ['#FFD740','#F4B400'], border: '#B8860B', textColor: '#333' });
  }
}

function doRevival() {
  revivalUsed = true;
  gameOver = false;
  gameActive = true;
  for (var r = 0; r < GRID; r++) {
    for (var c = 0; c < GRID; c++) {
      if (r < 2 || r >= GRID - 2 || c < 2 || c >= GRID - 2) {
        if (grid[r][c] > 0) {
          var cx = _boardX + c * _cellSize + _cellSize / 2;
          var cy = _boardY + r * _cellSize + _cellSize / 2;
          particles.spawn(cx, cy, '#FFD740', 3, 'chunk');
          grid[r][c] = 0;
        }
      }
    }
  }
  if (candidates.every(function(c) { return c.used; })) generateCandidates();
}

function getGridPos(tx, ty, shape) {
  var col = Math.round((tx - _boardX) / _cellSize - shape[0].length / 2);
  var row = Math.round((ty - _boardY) / _cellSize - shape.length / 2);
  return {
    row: Math.max(0, Math.min(GRID - shape.length, row)),
    col: Math.max(0, Math.min(GRID - shape[0].length, col))
  };
}

function isOverBoard(tx, ty) {
  return tx >= _boardX && tx <= _boardX + _boardSize && ty >= _boardY && ty <= _boardY + _boardSize;
}

function drawHUD(ctx) {
  ctx.fillStyle = 'rgba(13,27,42,0.85)';
  ctx.fillRect(0, 0, _w, _hudH);
  ctx.fillStyle = 'rgba(255,215,0,0.4)';
  ctx.fillRect(0, _hudH - 2, _w, 2);

  renderer.drawText('🍰 Dessert Blast', 80, _hudH / 2, { size: 18, bold: true, color: '#FFD700', shadow: true, align: 'left' });
  renderer.drawText('' + score, _w - 80, _hudH / 2 - 8, { size: 22, bold: true, color: '#FFF', shadow: true });
  renderer.drawText('🏆 ' + best, _w - 80, _hudH / 2 + 12, { size: 12, color: '#FFD740' });
}

function drawBoard(ctx) {
  var shakeX = 0, shakeY = 0;
  if (_shakeTime < 0.4 && _shakeIntensity > 0) {
    var decay = 1 - _shakeTime / 0.4;
    shakeX = (Math.random() - 0.5) * _shakeIntensity * decay;
    shakeY = (Math.random() - 0.5) * _shakeIntensity * decay;
  }

  ctx.save();
  ctx.translate(shakeX, shakeY);

  var pad = 4;
  var grad = ctx.createLinearGradient(_boardX - pad, _boardY - pad, _boardX + _boardSize + pad, _boardY + _boardSize + pad);
  grad.addColorStop(0, _theme.border);
  grad.addColorStop(0.5, '#B8860B');
  grad.addColorStop(1, _theme.border);
  renderer.roundRect(_boardX - pad, _boardY - pad, _boardSize + pad * 2, _boardSize + pad * 2, 10);
  ctx.fillStyle = grad;
  ctx.fill();

  renderer.roundRect(_boardX, _boardY, _boardSize, _boardSize, 7);
  ctx.fillStyle = _theme.boardBg;
  ctx.fill();

  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 1;
  for (var r = 0; r <= GRID; r++) {
    ctx.beginPath();
    ctx.moveTo(_boardX, _boardY + r * _cellSize);
    ctx.lineTo(_boardX + _boardSize, _boardY + r * _cellSize);
    ctx.stroke();
  }
  for (var c = 0; c <= GRID; c++) {
    ctx.beginPath();
    ctx.moveTo(_boardX + c * _cellSize, _boardY);
    ctx.lineTo(_boardX + c * _cellSize, _boardY + _boardSize);
    ctx.stroke();
  }

  for (var r = 0; r < GRID; r++) {
    for (var c = 0; c < GRID; c++) {
      if (grid[r][c] > 0) {
        var clearing = false;
        if (_clearAnim) {
          for (var k = 0; k < _clearAnim.cells.length; k++) {
            if (_clearAnim.cells[k] === r * GRID + c) { clearing = true; break; }
          }
        }
        if (clearing) {
          ctx.save();
          ctx.globalAlpha = 1 - _clearAnim.progress;
          var scale = 1 + _clearAnim.progress * 0.5;
          var pcx = _boardX + c * _cellSize + _cellSize / 2;
          var pcy = _boardY + r * _cellSize + _cellSize / 2;
          ctx.translate(pcx, pcy);
          ctx.scale(scale, scale);
          ctx.translate(-pcx, -pcy);
          renderer.drawDessertCell(_boardX + c * _cellSize, _boardY + r * _cellSize, _cellSize, grid[r][c] - 1, _theme);
          ctx.restore();
        } else {
          renderer.drawDessertCell(_boardX + c * _cellSize, _boardY + r * _cellSize, _cellSize, grid[r][c] - 1, _theme);
        }
      }
    }
  }

  for (var i = 0; i < _previewCells.length; i++) {
    var pc = _previewCells[i];
    ctx.fillStyle = _previewValid ? 'rgba(80,255,80,0.25)' : 'rgba(255,50,50,0.2)';
    ctx.fillRect(_boardX + pc.c * _cellSize, _boardY + pc.r * _cellSize, _cellSize, _cellSize);
  }

  ctx.restore();
}

function drawCandidates(ctx) {
  if (gameOver) return;
  var miniSize = Math.min(_cellSize * 0.5, 16);
  var totalW = 0;
  var widths = [];
  for (var i = 0; i < candidates.length; i++) {
    var cand = candidates[i];
    var w = cand.shape[0].length * (miniSize + 1);
    widths.push(w);
    totalW += w;
  }
  totalW += (candidates.length - 1) * 20;
  var sx = (_w - totalW) / 2;

  for (var i = 0; i < candidates.length; i++) {
    var cand = candidates[i];
    if (dragging && dragging.index === i) { sx += widths[i] + 20; continue; }
    ctx.save();
    if (cand.used) ctx.globalAlpha = 0.15;
    var rows = cand.shape.length, cols = cand.shape[0].length;
    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        if (cand.shape[r][c]) {
          renderer.drawDessertCell(sx + c * (miniSize + 1), _candY + r * (miniSize + 1), miniSize, cand.color, _theme);
        }
      }
    }
    ctx.restore();
    sx += widths[i] + 20;
  }
}

function drawDragGhost(ctx) {
  if (!dragging) return;
  ctx.save();
  ctx.globalAlpha = 0.8;
  var cand = candidates[dragging.index];
  var ghostSize = Math.min(_cellSize, 40);
  var rows = cand.shape.length, cols = cand.shape[0].length;
  var gw = cols * ghostSize, gh = rows * ghostSize;
  var gx = dragging.tx - gw / 2, gy = dragging.ty - gh / 2 + _touchOffsetY;
  for (var r = 0; r < rows; r++) {
    for (var c = 0; c < cols; c++) {
      if (cand.shape[r][c]) {
        renderer.drawDessertCell(gx + c * ghostSize, gy + r * ghostSize, ghostSize, cand.color, _theme);
      }
    }
  }
  ctx.restore();
}

function drawGameOver(ctx) {
  if (!gameOver) return;
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.fillRect(0, 0, _w, _h);

  renderer.drawText('Game Over', _w / 2, _h * 0.3, { size: 40, bold: true, color: '#FF6B6B', shadow: true, shadowColor: 'rgba(255,107,107,0.5)', shadowBlur: 20 });
  renderer.drawText('Score: ' + score, _w / 2, _h * 0.4, { size: 28, bold: true, color: '#FFD700', shadow: true });

  for (var i = 0; i < _goButtons.length; i++) {
    var b = _goButtons[i];
    renderer.drawButton(b.x, b.y, b.w, b.h, b.text, { gradient: b.gradient, border: b.border, textColor: b.textColor });
  }
  ctx.restore();
}

function drawComboText(ctx) {
  if (!_comboText) return;
  ctx.save();
  var p = _comboText.progress;
  ctx.globalAlpha = p < 0.3 ? p / 0.3 : Math.max(0, 1 - (p - 0.5) / 0.5);
  var scale = p < 0.2 ? 0.5 + p * 2.5 : 1;
  var y = _h * 0.4 - p * 80;
  ctx.translate(_w / 2, y);
  ctx.scale(scale, scale);
  renderer.drawText(_comboText.text, 0, 0, { size: 36, bold: true, color: '#FFD700', shadow: true, shadowColor: 'rgba(255,215,0,0.8)', shadowBlur: 10 });
  ctx.restore();
}

function drawScorePop(ctx) {
  if (!_scorePop) return;
  ctx.save();
  var p = _scorePop.progress;
  ctx.globalAlpha = Math.max(0, 1 - p);
  renderer.drawText(_scorePop.text, _w / 2, _boardY + _boardSize / 2 - p * 50, { size: 20, bold: true, color: '#FFF', shadow: true });
  ctx.restore();
}

var _homeBtn = null;

var gameScene = {
  onEnter: function(data) {
    calcLayout();
    gameMode = (data && data.mode) || 'classic';
    if (gameMode === 'daily') {
      var today = new Date().toISOString().slice(0,10);
      var seed = 0;
      for (var i = 0; i < today.length; i++) seed = seed * 31 + today.charCodeAt(i);
      dailyRng = seededRandom(seed);
    } else {
      dailyRng = null;
    }

    initGrid();
    score = 0;
    best = save.getBest();
    revivalUsed = false;
    gameActive = true;
    gameOver = false;
    gameStartTime = Date.now();
    dragging = null;
    _clearAnim = null;
    _comboText = null;
    _scorePop = null;
    _shakeTime = 10;
    _previewCells = [];

    var bonus = parseInt(save.get('dessert-signin-bonus') || '0');
    if (bonus > 0) { score += bonus; save.set('dessert-signin-bonus', ''); }

    generateCandidates();

    _homeBtn = { x: _w / 2 - 60, y: _candY + 50, w: 120, h: 36 };
  },

  update: function(dt) {
    _shakeTime += dt;
    if (_comboText) { _comboText.progress += dt * 0.8; if (_comboText.progress > 1) _comboText = null; }
    if (_scorePop) { _scorePop.progress += dt * 1; if (_scorePop.progress > 1) _scorePop = null; }
    if (_clearAnim) { _clearAnim.progress = Math.min(1, _clearAnim.progress + dt * 2.5); }
    if (_flashAlpha > 0.01) _flashAlpha *= 0.88; else _flashAlpha = 0;
    for (var swi = _shockwaves.length - 1; swi >= 0; swi--) {
      var sw = _shockwaves[swi];
      sw.r += 300 * dt;
      sw.alpha *= 0.92;
      if (sw.alpha < 0.02 || sw.r > 200) _shockwaves.splice(swi, 1);
    }
  },

  draw: function(ctx) {
    renderer.clear(_theme.bg);
    drawHUD(ctx);
    drawBoard(ctx);
    drawCandidates(ctx);
    drawDragGhost(ctx);
    particles.draw(ctx);
    particles.update();
    drawComboText(ctx);
    drawScorePop(ctx);
    
    if (_flashAlpha > 0.01) {
      ctx.save();
      ctx.globalAlpha = _flashAlpha;
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, _w, _h);
      ctx.restore();
    }
    for (var swi = 0; swi < _shockwaves.length; swi++) {
      var sw = _shockwaves[swi];
      ctx.save();
      ctx.globalAlpha = sw.alpha;
      ctx.strokeStyle = '#FFD740';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(sw.x, sw.y, sw.r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = _theme.colors[swi % _theme.colors.length];
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(sw.x, sw.y, sw.r * 0.7, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    if (!gameOver && _homeBtn) {
      renderer.drawButton(_homeBtn.x, _homeBtn.y, _homeBtn.w, _homeBtn.h, '🏠 Main Menu', {
        gradient: ['#4A90D9','#357ABD'], border: '#1a4a80', fontSize: 14
      });
    }

    drawGameOver(ctx);
  },

  onTouchStart: function(e) {
    var t = e.touches[0];
    var tx = t.clientX, ty = t.clientY;

    if (gameOver) {
      for (var i = 0; i < _goButtons.length; i++) {
        var b = _goButtons[i];
        if (tx >= b.x && tx <= b.x + b.w && ty >= b.y && ty <= b.y + b.h) {
          sound.play('click');
          if (b.action === 'restart') {
            sceneManager.switchTo('game', { mode: gameMode });
          } else if (b.action === 'menu') {
            sceneManager.switchTo('home');
          } else if (b.action === 'revival') {
            doRevival();
          }
          return;
        }
      }
      return;
    }

    if (!gameActive) return;

    if (_homeBtn && tx >= _homeBtn.x && tx <= _homeBtn.x + _homeBtn.w && ty >= _homeBtn.y && ty <= _homeBtn.y + _homeBtn.h) {
      sound.play('click');
      sceneManager.switchTo('home');
      return;
    }

    var miniSize = Math.min(_cellSize * 0.5, 16);
    var totalW = 0;
    var candRects = [];
    for (var i = 0; i < candidates.length; i++) {
      var w = candidates[i].shape[0].length * (miniSize + 1);
      totalW += w;
    }
    totalW += (candidates.length - 1) * 20;
    var sx = (_w - totalW) / 2;
    for (var i = 0; i < candidates.length; i++) {
      var cand = candidates[i];
      var w = cand.shape[0].length * (miniSize + 1);
      var h = cand.shape.length * (miniSize + 1);
      candRects.push({ x: sx, y: _candY, w: w, h: h, idx: i });
      sx += w + 20;
    }

    for (var i = 0; i < candRects.length; i++) {
      var cr = candRects[i];
      if (candidates[cr.idx].used) continue;
      if (tx >= cr.x - 10 && tx <= cr.x + cr.w + 10 && ty >= cr.y - 10 && ty <= cr.y + cr.h + 10) {
        dragging = { index: cr.idx, tx: tx, ty: ty };
        return;
      }
    }
  },

  onTouchMove: function(e) {
    if (!dragging || !gameActive) return;
    var t = e.touches[0];
    dragging.tx = t.clientX;
    dragging.ty = t.clientY;

    var adjY = dragging.ty + _touchOffsetY;
    _previewCells = [];
    if (isOverBoard(dragging.tx, adjY)) {
      var cand = candidates[dragging.index];
      var pos = getGridPos(dragging.tx, adjY, cand.shape);
      _previewValid = canPlace(cand.shape, pos.row, pos.col);
      for (var r = 0; r < cand.shape.length; r++) {
        for (var c = 0; c < cand.shape[0].length; c++) {
          if (!cand.shape[r][c]) continue;
          var gr = pos.row + r, gc = pos.col + c;
          if (gr >= 0 && gr < GRID && gc >= 0 && gc < GRID) {
            _previewCells.push({ r: gr, c: gc });
          }
        }
      }
    }
  },

  onTouchEnd: function(e) {
    if (!dragging || !gameActive) return;
    var t = e.changedTouches[0];
    var adjY = dragging.ty + _touchOffsetY;
    if (isOverBoard(dragging.tx, adjY)) {
      var cand = candidates[dragging.index];
      var pos = getGridPos(dragging.tx, adjY, cand.shape);
      if (canPlace(cand.shape, pos.row, pos.col)) {
        placePiece(cand.shape, pos.row, pos.col, cand.color, dragging.index);
      }
    }
    _previewCells = [];
    dragging = null;
  }
};

// ===== ACHIEVEMENTS SCENE =====
var _achW, _achH, _achBackBtn;

var achievementsScene = {
  onEnter: function() {
    _achW = renderer.getWidth();
    _achH = renderer.getHeight();
    _achBackBtn = { x: _achW / 2 - 60, y: _achH - 70, w: 120, h: 40 };
  },

  draw: function(ctx) {
    var theme = THEMES[save.getTheme()] || THEMES.dessert;
    renderer.clear(theme.bg);
    renderer.drawText('🏆 Achievements', _achW / 2, 40, { size: 24, bold: true, color: '#FFD740', shadow: true });

    var stats = save.getStats();
    var achs = ACHIEVEMENTS;
    var startY = 80;
    var itemH = 50;

    for (var i = 0; i < achs.length; i++) {
      var a = achs[i];
      var unlocked = stats.unlockedAch.indexOf(a.id) >= 0;
      var y = startY + i * itemH;
      if (y > _achH - 80) break;

      ctx.save();
      if (!unlocked) ctx.globalAlpha = 0.4;
      ctx.fillStyle = 'rgba(255,255,255,0.05)';
      renderer.roundRect(20, y, _achW - 40, itemH - 6, 8);
      ctx.fill();

      renderer.drawText(a.icon, 50, y + itemH / 2 - 3, { size: 24, align: 'center' });
      renderer.drawText(a.name, 80, y + 14, { size: 14, bold: true, color: '#FFD740', align: 'left' });
      renderer.drawText(a.desc, 80, y + 32, { size: 11, color: 'rgba(255,255,255,0.6)', align: 'left' });
      renderer.drawText(unlocked ? '✅' : '🔒', _achW - 40, y + itemH / 2 - 3, { size: 18 });
      ctx.restore();
    }

    renderer.drawButton(_achBackBtn.x, _achBackBtn.y, _achBackBtn.w, _achBackBtn.h, 'Back', {
      gradient: ['#4A90D9','#357ABD'], border: '#1a4a80', fontSize: 14
    });
  },

  onTouchStart: function(e) {
    var t = e.touches[0];
    if (t.clientX >= _achBackBtn.x && t.clientX <= _achBackBtn.x + _achBackBtn.w &&
        t.clientY >= _achBackBtn.y && t.clientY <= _achBackBtn.y + _achBackBtn.h) {
      sceneManager.switchTo('home');
    }
  }
};

// ===== THEMES SCENE =====
var _thW, _thH, _thBackBtn, _themeItems = [];

var themesScene = {
  onEnter: function() {
    _thW = renderer.getWidth();
    _thH = renderer.getHeight();
    _thBackBtn = { x: _thW / 2 - 60, y: _thH - 70, w: 120, h: 40 };
    _themeItems = [];
    var keys = Object.keys(THEMES);
    var startY = 80;
    for (var i = 0; i < keys.length; i++) {
      _themeItems.push({ id: keys[i], y: startY + i * 60 });
    }
  },

  draw: function(ctx) {
    var curTheme = THEMES[save.getTheme()] || THEMES.dessert;
    renderer.clear(curTheme.bg);
    renderer.drawText('🎨 Themes', _thW / 2, 40, { size: 24, bold: true, color: '#FFD740', shadow: true });

    var stats = save.getStats();
    var current = save.getTheme();

    for (var i = 0; i < _themeItems.length; i++) {
      var item = _themeItems[i];
      var t = THEMES[item.id];
      var unlocked = stats.unlockedThemes.indexOf(item.id) >= 0;
      var active = current === item.id;
      var y = item.y;

      ctx.save();
      if (!unlocked) ctx.globalAlpha = 0.4;
      ctx.strokeStyle = active ? '#FFD740' : 'rgba(255,255,255,0.1)';
      ctx.lineWidth = 2;
      renderer.roundRect(20, y, _thW - 40, 52, 8);
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.03)';
      ctx.fill();

      for (var j = 0; j < t.colors.length; j++) {
        ctx.fillStyle = t.colors[j];
        ctx.beginPath();
        ctx.arc(50 + j * 28, y + 26, 10, 0, Math.PI * 2);
        ctx.fill();
      }

      renderer.drawText(t.name + (active ? ' ✓' : ''), _thW - 60, y + 26, { size: 14, color: '#FFF', align: 'right' });
      ctx.restore();
    }

    renderer.drawButton(_thBackBtn.x, _thBackBtn.y, _thBackBtn.w, _thBackBtn.h, 'Back', {
      gradient: ['#4A90D9','#357ABD'], border: '#1a4a80', fontSize: 14
    });
  },

  onTouchStart: function(e) {
    var t = e.touches[0];
    if (t.clientX >= _thBackBtn.x && t.clientX <= _thBackBtn.x + _thBackBtn.w &&
        t.clientY >= _thBackBtn.y && t.clientY <= _thBackBtn.y + _thBackBtn.h) {
      sceneManager.switchTo('home');
      return;
    }

    var stats = save.getStats();
    for (var i = 0; i < _themeItems.length; i++) {
      var item = _themeItems[i];
      if (t.clientY >= item.y && t.clientY <= item.y + 52 && t.clientX >= 20 && t.clientX <= _thW - 20) {
        if (stats.unlockedThemes.indexOf(item.id) >= 0) {
          save.setTheme(item.id);
        }
        return;
      }
    }
  }
};

// ===== STATS SCENE =====
var _stW, _stH, _stBackBtn;

var statsScene = {
  onEnter: function() {
    _stW = renderer.getWidth();
    _stH = renderer.getHeight();
    _stBackBtn = { x: _stW / 2 - 60, y: _stH - 70, w: 120, h: 40 };
  },

  draw: function(ctx) {
    var theme = THEMES[save.getTheme()] || THEMES.dessert;
    renderer.clear(theme.bg);
    renderer.drawText('📊 Statistics', _stW / 2, 40, { size: 24, bold: true, color: '#FFD740', shadow: true });

    var stats = save.getStats();
    var avg = stats.totalGames > 0 ? Math.round(stats.totalScore / stats.totalGames) : 0;
    var mins = Math.floor((stats.totalTime || 0) / 60);

    var items = [
      { label: 'Total Games', value: '' + stats.totalGames },
      { label: 'Total Clears', value: '' + stats.totalClears },
      { label: 'Best Combo', value: '' + stats.maxCombo },
      { label: 'Best Score', value: '' + stats.bestScore },
      { label: 'Avg Score', value: '' + avg },
      { label: 'Total Time', value: mins + 'min' },
    ];

    var cols = 2, cardW = (_stW - 60) / 2, cardH = 80, startY = 90;
    for (var i = 0; i < items.length; i++) {
      var col = i % cols, row = Math.floor(i / cols);
      var x = 20 + col * (cardW + 20);
      var y = startY + row * (cardH + 12);

      ctx.fillStyle = 'rgba(255,255,255,0.05)';
      renderer.roundRect(x, y, cardW, cardH, 8);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.1)';
      ctx.lineWidth = 1;
      ctx.stroke();

      renderer.drawText(items[i].value, x + cardW / 2, y + 30, { size: 24, bold: true, color: '#FFD740' });
      renderer.drawText(items[i].label, x + cardW / 2, y + 58, { size: 11, color: 'rgba(255,255,255,0.5)' });
    }

    renderer.drawButton(_stBackBtn.x, _stBackBtn.y, _stBackBtn.w, _stBackBtn.h, 'Back', {
      gradient: ['#4A90D9','#357ABD'], border: '#1a4a80', fontSize: 14
    });
  },

  onTouchStart: function(e) {
    var t = e.touches[0];
    if (t.clientX >= _stBackBtn.x && t.clientX <= _stBackBtn.x + _stBackBtn.w &&
        t.clientY >= _stBackBtn.y && t.clientY <= _stBackBtn.y + _stBackBtn.h) {
      sceneManager.switchTo('home');
    }
  }
};

// ===== INIT & MAIN LOOP =====
var info = renderer.init();
var ctx = info.ctx;

particles.init(ctx);
sound.init(save.getMuted());

sceneManager.register('home', homeScene);
sceneManager.register('game', gameScene);
sceneManager.register('achievements', achievementsScene);
sceneManager.register('themes', themesScene);
sceneManager.register('stats-view', statsScene);

sceneManager.switchTo('home');

// ===== TOUCH/MOUSE EVENTS (H5 native) =====
var _canvas = document.getElementById('gameCanvas');
var _touchStartCbs = [];
var _mouseDown = false;

function wrapTouchEvent(e) {
  var touches = [];
  var changedTouches = [];
  if (e.touches) {
    for (var i = 0; i < e.touches.length; i++) {
      touches.push({ clientX: e.touches[i].clientX, clientY: e.touches[i].clientY, identifier: e.touches[i].identifier });
    }
    for (var i = 0; i < e.changedTouches.length; i++) {
      changedTouches.push({ clientX: e.changedTouches[i].clientX, clientY: e.changedTouches[i].clientY, identifier: e.changedTouches[i].identifier });
    }
  } else {
    var t = { clientX: e.clientX, clientY: e.clientY, identifier: 0 };
    touches.push(t);
    changedTouches.push(t);
  }
  return { touches: touches, changedTouches: changedTouches, timeStamp: e.timeStamp };
}

document.addEventListener('touchstart', function(e) {
  if(e.target.tagName!=='CANVAS')return;
  e.preventDefault();
  sceneManager.onTouchStart(wrapTouchEvent(e));
}, { passive: false });

document.addEventListener('touchmove', function(e) {
  if(e.target.tagName!=='CANVAS')return;
  e.preventDefault();
  sceneManager.onTouchMove(wrapTouchEvent(e));
}, { passive: false });

document.addEventListener('touchend', function(e) {
  if(e.target.tagName!=='CANVAS')return;
  e.preventDefault();
  sceneManager.onTouchEnd(wrapTouchEvent(e));
}, { passive: false });

document.addEventListener('mousedown', function(e) {
  _mouseDown = true;
  sceneManager.onTouchStart(wrapTouchEvent(e));
});

document.addEventListener('mousemove', function(e) {
  if (!_mouseDown) return;
  sceneManager.onTouchMove(wrapTouchEvent(e));
});

document.addEventListener('mouseup', function(e) {
  _mouseDown = false;
  sceneManager.onTouchEnd(wrapTouchEvent(e));
});

window.addEventListener('resize', function() {
  _canvas.width = window.innerWidth * (window.devicePixelRatio || 1);
  _canvas.height = window.innerHeight * (window.devicePixelRatio || 1);
});

// ===== MAIN LOOP =====
var _lastTime = Date.now();

function gameLoop() {
  var now = Date.now();
  var dt = (now - _lastTime) / 1000;
  _lastTime = now;
  if (dt > 0.1) dt = 0.1;

  sceneManager.update(dt);
  sceneManager.draw(ctx);

  requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);

// ===== EXPOSE GAME STATE TO WINDOW =====
window._gameState = {
  get score() { return score; },
  get gameOver() { return gameOver; },
  get board() { return grid; },
  get gameActive() { return gameActive; },
  get candidates() { return candidates; },
  get gameMode() { return gameMode; },
  get best() { return best; },
  restart: function() {
    sceneManager.switchTo('game', { mode: gameMode || 'classic' });
  },
  triggerGameOver: function() {
    doGameOver();
  },
  switchScene: function(name, data) {
    sceneManager.switchTo(name, data);
  }
};

})();