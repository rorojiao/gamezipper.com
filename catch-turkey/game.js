/**
 * Catch Turkey — Pure H5 Version
 * Rewritten from wx mini-game adapter to standard browser APIs
 */
(function() {
'use strict';

// ===== Canvas & Renderer Setup =====
var _mainCanvas = document.getElementById('gameCanvas');

function getBestSize() {
  var BAR_H = 28;
  var w = window.innerWidth || document.documentElement.clientWidth || 0;
  var h = window.innerHeight || document.documentElement.clientHeight || 0;
  if (window.visualViewport && window.visualViewport.width > 10) {
    w = Math.max(w, Math.floor(window.visualViewport.width));
    h = Math.max(h, Math.floor(window.visualViewport.height));
  }
  if (w < 200) w = screen.width || 375;
  if (h < 200) h = screen.height || 667;
  h = h - BAR_H; // Account for top navigation bar
  return { w: Math.floor(w), h: Math.floor(h) };
}

function syncCanvasSize() {
  var c = _mainCanvas;
  var dpr = window.devicePixelRatio || 1;
  var sz = getBestSize();
  if (c._lw === sz.w && c._lh === sz.h) return sz;
  c._lw = sz.w; c._lh = sz.h;
  c.style.width = sz.w + 'px';
  c.style.height = sz.h + 'px';
  c.width = sz.w * dpr;
  c.height = sz.h * dpr;
  return sz;
}

function syncFrame() {
  var sz = syncCanvasSize();
  var dpr = window.devicePixelRatio || 1;
  var t = Renderer.ctx.getTransform();
  if (t.a !== dpr || t.d !== dpr) {
    Renderer.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  if (Renderer.width !== sz.w || Renderer.height !== sz.h) {
    Renderer.width = sz.w;
    Renderer.height = sz.h;
    Renderer.scale = sz.w / 375;
    Renderer.dpr = dpr;
    Renderer._resized = true;
  }
}

// Initial canvas setup
syncCanvasSize();
// Single delayed resize to catch late viewport changes, not repeated
setTimeout(syncCanvasSize, 500);
window.addEventListener('resize', function() { syncCanvasSize(); });
if (window.visualViewport) {
  window.visualViewport.addEventListener('resize', function() { syncCanvasSize(); });
}

// ===== js/config =====
var TURKEY_TYPES = [
  { id: 0, name: 'Red Crest Turkey', desc: 'A proud red crest, fiery and passionate!', body: '#E53935', bodyDk: '#B71C1C', tail: '#FF5722', tailTip: '#FFAB91', accent: '#D32F2F', hi: '#FF8A80' },
  { id: 1, name: 'Blue Feather Turkey', desc: 'Elegant blue feathers, a true gentleman.', body: '#1E88E5', bodyDk: '#0D47A1', tail: '#42A5F5', tailTip: '#90CAF9', accent: '#1565C0', hi: '#82B1FF' },
  { id: 2, name: 'Golden Turkey', desc: 'Shimmering gold, a noble turkey.', body: '#FFB300', bodyDk: '#FF8F00', tail: '#FFD54F', tailTip: '#FFF9C4', accent: '#F9A825', hi: '#FFECB3' },
  { id: 3, name: 'Purple Turkey', desc: 'A mysterious magical purple turkey.', body: '#8E24AA', bodyDk: '#4A148C', tail: '#AB47BC', tailTip: '#CE93D8', accent: '#7B1FA2', hi: '#EA80FC' },
  { id: 4, name: 'Orange Turkey', desc: 'Full of energy and joy!', body: '#FB8C00', bodyDk: '#E65100', tail: '#FFA726', tailTip: '#FFE0B2', accent: '#EF6C00', hi: '#FFD180' },
  { id: 5, name: 'Pink Turkey', desc: 'Adorable pink turkey.', body: '#EC407A', bodyDk: '#AD1457', tail: '#F06292', tailTip: '#F8BBD0', accent: '#C2185B', hi: '#FF80AB' },
  { id: 6, name: 'Green Turkey', desc: 'Forest guardian, friend of nature.', body: '#43A047', bodyDk: '#1B5E20', tail: '#66BB6A', tailTip: '#A5D6A7', accent: '#2E7D32', hi: '#B9F6CA' },
  { id: 7, name: 'Rainbow Turkey', desc: 'Rare rainbow, seven colors of light!', body: '#FF6B35', bodyDk: '#E91E63', tail: '#9C27B0', tailTip: '#2196F3', accent: '#4CAF50', hi: '#FFEB3B' },
  { id: 8, name: 'White Turkey', desc: 'Pure white elegance.', body: '#ECEFF1', bodyDk: '#B0BEC5', tail: '#CFD8DC', tailTip: '#FAFAFA', accent: '#90A4AE', hi: '#FFFFFF' },
  { id: 9, name: 'Brown Turkey', desc: 'Classic and traditional.', body: '#795548', bodyDk: '#3E2723', tail: '#8D6E63', tailTip: '#BCAAA4', accent: '#000', hi: '#D7CCC8' },
];

var LEVELS = [
  { id: 1, name: '🌸 Beginner', count: 18, layers: 2, types: 4, time: 600, theme: 'spring' },
  { id: 2, name: '🌼 Novice', count: 24, layers: 2, types: 5, time: 540, theme: 'spring' },
  { id: 3, name: '🌷 Chaos', count: 30, layers: 3, types: 6, time: 480, theme: 'spring' },
  { id: 4, name: '☀️ Turkey Farm', count: 36, layers: 3, types: 6, time: 420, theme: 'summer' },
  { id: 5, name: '🌻 Jungle', count: 42, layers: 3, types: 7, time: 400, theme: 'summer' },
  { id: 6, name: '🍂 Autumn', count: 45, layers: 4, types: 7, time: 380, theme: 'autumn' },
  { id: 7, name: '🍁 Desert', count: 48, layers: 4, types: 8, time: 360, theme: 'autumn' },
  { id: 8, name: '❄️ Frozen', count: 51, layers: 4, types: 8, time: 340, theme: 'winter' },
  { id: 9, name: '⛄ Volcano', count: 54, layers: 4, types: 9, time: 320, theme: 'winter' },
  { id: 10, name: '🌈 Ultimate', count: 60, layers: 5, types: 10, time: 300, theme: 'rainbow' },
];

var THEMES = {
  spring: { sky: ['#87CEEB', '#A8D8EA', '#C5E8B7'], ground: ['#5BA55B', '#4a8c2a', '#3d7a22', '#2d5a1e'], flowers: ['🌸', '🌼', '🌻', '🍄', '🌷', '🐝'], cloudColor: 'rgba(255,255,255,0.5)' },
  summer: { sky: ['#FFD54F', '#FFB300', '#87CEEB', '#64B5F6'], ground: ['#7CB342', '#558B2F', '#33691E', '#1B5E20'], flowers: ['🌻', '☀️', '🌾', '🦋', '🐛', '🌺'], cloudColor: 'rgba(255,255,255,0.4)' },
  autumn: { sky: ['#FF8F00', '#FFB74D', '#FFCC80', '#FFF3E0'], ground: ['#BF360C', '#8D6E63', '#6D4C41', '#4E342E'], flowers: ['🍂', '🍁', '🌰', '🍄', '🎃', '🦔'], cloudColor: 'rgba(255,230,180,0.4)' },
  winter: { sky: ['#546E7A', '#78909C', '#B0BEC5', '#CFD8DC'], ground: ['#ECEFF1', '#CFD8DC', '#B0BEC5', '#90A4AE'], flowers: ['❄️', '⛄', '🌨️', '💎', '🧊', '🎄'], cloudColor: 'rgba(255,255,255,0.7)' },
  rainbow: { sky: ['#1a1a3e', '#2d1b69', '#4A148C', '#7B1FA2'], ground: ['#1B5E20', '#2E7D32', '#388E3C'], flowers: ['🌈', '⭐', '💫', '🎵', '🦄', '✨', '🌟'], cloudColor: 'rgba(255,255,255,0.3)' },
  farm: { sky: ['#87CEEB', '#A8D8EA', '#C5E8B7'], ground: ['#5BA55B', '#4a8c2a', '#3d7a22', '#2d5a1e'], flowers: ['🌸', '🌼', '🌻', '🍄', '🌷'], cloudColor: 'rgba(255,255,255,0.5)' },
  jungle: { sky: ['#1B5E20', '#388E3C', '#66BB6A'], ground: ['#2E7D32', '#1B5E20', '#0a2e08'], flowers: ['🌿', '🍀', '🪻', '🌴', '🦜'], cloudColor: 'rgba(200,255,200,0.3)' },
  desert: { sky: ['#FF8F00', '#FFB300', '#FFE082'], ground: ['#D4A050', '#C49040', '#A07030'], flowers: ['🌵', '🏜️', '☀️', '🦂', '🐪'], cloudColor: 'rgba(255,230,180,0.3)' },
  ocean: { sky: ['#01579B', '#0288D1', '#4FC3F7'], ground: ['#01579B', '#0277BD', '#01579B'], flowers: ['🐚', '🐟', '🪸', '🫧', '🐙'], cloudColor: 'rgba(150,220,255,0.4)' },
  volcano: { sky: ['#BF360C', '#E64A19', '#FF6E40'], ground: ['#3E2723', '#4E342E', '#3E2723'], flowers: ['🔥', '🌋', '💀', '🪨', '⚡'], cloudColor: 'rgba(255,100,50,0.3)' },
};

var COMBO_TEXTS = ['Nice!', 'Great!', 'Awesome!', 'Perfect!', 'Amazing!', 'Incredible!', 'LEGENDARY!'];
var SLOT_COUNT = 7;

// ===== js/renderer =====
var initSize = getBestSize();
var pixelRatio = window.devicePixelRatio || 1;
var DESIGN_WIDTH = 375;

var canvas = _mainCanvas;
canvas.width = initSize.w * pixelRatio;
canvas.height = initSize.h * pixelRatio;
var ctx = canvas.getContext('2d');
ctx.scale(pixelRatio, pixelRatio);

var _imgCache = {};

var Renderer = {
  canvas: canvas,
  ctx: ctx,
  width: initSize.w,
  height: initSize.h,
  dpr: pixelRatio,
  scale: initSize.w / DESIGN_WIDTH,
  _resized: false,

  loadImage: function(src) {
    if (_imgCache[src]) return Promise.resolve(_imgCache[src]);
    return new Promise(function(resolve, reject) {
      var img = new Image();
      img.onload = function() { _imgCache[src] = img; resolve(img); };
      img.onerror = reject;
      img.src = src;
    });
  },

  getImage: function(src) { return _imgCache[src] || null; },

  drawImage: function(src, x, y, w, h) {
    var img = _imgCache[src];
    if (!img) return;
    ctx.drawImage(img, x, y, w, h);
  },

  drawText: function(text, x, y, opts) {
    opts = opts || {};
    ctx.font = opts.font || '16px sans-serif';
    ctx.fillStyle = opts.color || '#000';
    ctx.textAlign = opts.align || 'left';
    ctx.textBaseline = opts.baseline || 'top';
    ctx.fillText(text, x, y);
  },

  drawRect: function(x, y, w, h, color) {
    ctx.fillStyle = color || '#000';
    ctx.fillRect(x, y, w, h);
  },

  drawRoundRect: function(x, y, w, h, r, color) {
    ctx.fillStyle = color || '#000';
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
    ctx.fill();
  },

  clear: function() { ctx.clearRect(0, 0, this.width, this.height); },
};

// ===== Touch Manager =====
var _touchHandlers = [];

var TouchManager = {
  register: function(handler) { _touchHandlers.push(handler); },
  unregister: function(handler) {
    var idx = _touchHandlers.indexOf(handler);
    if (idx >= 0) _touchHandlers.splice(idx, 1);
  },
  clear: function() { _touchHandlers.length = 0; },
  init: function() {
    function getCanvasXY(e) {
      var r = _mainCanvas.getBoundingClientRect();
      var t = e.touches ? e.touches[0] : (e.changedTouches ? e.changedTouches[0] : e);
      if (!t) return null;
      return { x: t.clientX - r.left, y: t.clientY - r.top };
    }

    document.addEventListener('touchstart', function(ev) {
      if (ev.target.tagName !== 'CANVAS') return;
      ev.preventDefault();
      var r = _mainCanvas.getBoundingClientRect();
      var ts = Array.from(ev.touches);
      var t = ts[0]; if (!t) return;
      var x = t.clientX - r.left, y = t.clientY - r.top;
      for (var i = _touchHandlers.length - 1; i >= 0; i--) {
        var h = _touchHandlers[i];
        if (h.hitTest && !h.hitTest(x, y)) continue;
        if (h.onStart) h.onStart(x, y, ev);
        break;
      }
    }, { passive: false });

    document.addEventListener('touchmove', function(ev) {
      if (ev.target.tagName !== 'CANVAS') return;
      ev.preventDefault();
      var r = _mainCanvas.getBoundingClientRect();
      var ts = Array.from(ev.touches);
      var t = ts[0]; if (!t) return;
      for (var i = _touchHandlers.length - 1; i >= 0; i--) {
        var h = _touchHandlers[i];
        if (h.onMove) h.onMove(t.clientX - r.left, t.clientY - r.top, ev);
      }
    }, { passive: false });

    document.addEventListener('touchend', function(ev) {
      if (ev.target.tagName !== 'CANVAS') return;
      ev.preventDefault();
      var r = _mainCanvas.getBoundingClientRect();
      var ts = Array.from(ev.changedTouches);
      var t = ts[0]; if (!t) return;
      for (var i = _touchHandlers.length - 1; i >= 0; i--) {
        var h = _touchHandlers[i];
        if (h.onEnd) h.onEnd(t.clientX - r.left, t.clientY - r.top, ev);
      }
    }, { passive: false });

    // Mouse fallback
    document.addEventListener('mousedown', function(ev) {
      var r = _mainCanvas.getBoundingClientRect();
      var x = ev.clientX - r.left, y = ev.clientY - r.top;
      for (var i = _touchHandlers.length - 1; i >= 0; i--) {
        var h = _touchHandlers[i];
        if (h.hitTest && !h.hitTest(x, y)) continue;
        if (h.onStart) h.onStart(x, y, ev);
        break;
      }
    });
    document.addEventListener('mousemove', function(ev) {
      if (ev.buttons <= 0) return;
      var r = _mainCanvas.getBoundingClientRect();
      for (var i = _touchHandlers.length - 1; i >= 0; i--) {
        var h = _touchHandlers[i];
        if (h.onMove) h.onMove(ev.clientX - r.left, ev.clientY - r.top, ev);
      }
    });
    document.addEventListener('mouseup', function(ev) {
      var r = _mainCanvas.getBoundingClientRect();
      for (var i = _touchHandlers.length - 1; i >= 0; i--) {
        var h = _touchHandlers[i];
        if (h.onEnd) h.onEnd(ev.clientX - r.left, ev.clientY - r.top, ev);
      }
    });
  },
};

// ===== js/save =====
var SAVE_KEY = 'catch_turkey_v2';
var _saveData = null;

function _defaultData() {
  return {
    maxLevel: 1, scores: {}, stars: {}, cards: [],
    settings: { sfx: true, bgm: true, vibrate: true },
    totalScore: 0, propBonus: { shuffle: 0, remove: 0, complete: 0 },
  };
}

var Save = {
  load: function() {
    try {
      var v = localStorage.getItem(SAVE_KEY);
      if (v !== null) { try { _saveData = JSON.parse(v); } catch(e) { _saveData = null; } }
    } catch(e) { _saveData = null; }
    if (!_saveData || typeof _saveData !== 'object') _saveData = {};
    var def = _defaultData();
    for (var k in def) { if (_saveData[k] === undefined) _saveData[k] = def[k]; }
    return _saveData;
  },
  save: function() {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(_saveData)); } catch(e) {}
  },
  get d() { return _saveData || this.load(); },
  addCard: function(id) {
    if (_saveData.cards.indexOf(id) === -1) { _saveData.cards.push(id); this.save(); }
  },
  setStars: function(lv, s) {
    if (!_saveData.stars[lv] || s > _saveData.stars[lv]) { _saveData.stars[lv] = s; this.save(); }
  },
  setScore: function(lv, s) {
    if (!_saveData.scores[lv] || s > _saveData.scores[lv]) {
      _saveData.scores[lv] = s;
      _saveData.totalScore = Object.values(_saveData.scores).reduce(function(a,b){return a+b;}, 0);
      this.save();
    }
  },
  reset: function() { _saveData = _defaultData(); this.save(); },
};

// ===== js/sound =====
var _audioCtx = null;
function getAudioCtx() {
  if (!_audioCtx) { try { _audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e) {} }
  return _audioCtx;
}

function playTones(notes, wave, gain, dur) {
  var c = getAudioCtx(); if (!c) return;
  var now = c.currentTime;
  var g = c.createGain();
  g.gain.setValueAtTime(gain, now);
  g.gain.exponentialRampToValueAtTime(0.001, now + dur);
  g.connect(c.destination);
  notes.forEach(function(n) {
    var o = c.createOscillator();
    o.type = wave;
    o.frequency.setValueAtTime(n.f, now + (n.t || 0));
    if (n.f2) o.frequency.exponentialRampToValueAtTime(n.f2, now + (n.t || 0) + (n.d || dur));
    o.connect(g);
    o.start(now + (n.t || 0));
    o.stop(now + (n.t || 0) + (n.d || dur));
  });
}

function playNoise(dur, gain) {
  var c = getAudioCtx(); if (!c) return;
  var now = c.currentTime;
  var bufSize = c.sampleRate * dur;
  var buf = c.createBuffer(1, bufSize, c.sampleRate);
  var data = buf.getChannelData(0);
  for (var i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1);
  var src = c.createBufferSource();
  src.buffer = buf;
  var g = c.createGain();
  g.gain.setValueAtTime(gain, now);
  g.gain.exponentialRampToValueAtTime(0.001, now + dur);
  var flt = c.createBiquadFilter();
  flt.type = 'lowpass';
  flt.frequency.setValueAtTime(2000, now);
  flt.frequency.exponentialRampToValueAtTime(200, now + dur);
  src.connect(flt); flt.connect(g); g.connect(c.destination);
  src.start(now); src.stop(now + dur);
}

function turkeyScream() {
  var c = getAudioCtx(); if (!c) return;
  var now = c.currentTime;
  var g = c.createGain();
  g.gain.setValueAtTime(0.25, now);
  g.gain.setValueAtTime(0.3, now + 0.05);
  g.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
  g.connect(c.destination);
  var o1 = c.createOscillator();
  o1.type = 'sawtooth';
  o1.frequency.setValueAtTime(1800, now);
  o1.frequency.exponentialRampToValueAtTime(600, now + 0.08);
  o1.frequency.setValueAtTime(2200, now + 0.1);
  o1.frequency.exponentialRampToValueAtTime(400, now + 0.3);
  o1.connect(g); o1.start(now); o1.stop(now + 0.35);
  var o2 = c.createOscillator();
  o2.type = 'square';
  o2.frequency.setValueAtTime(2400, now);
  o2.frequency.exponentialRampToValueAtTime(800, now + 0.15);
  o2.frequency.setValueAtTime(2800, now + 0.15);
  o2.frequency.exponentialRampToValueAtTime(500, now + 0.3);
  var g2 = c.createGain();
  g2.gain.setValueAtTime(0.08, now);
  g2.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
  o2.connect(g2); g2.connect(c.destination);
  o2.start(now); o2.stop(now + 0.35);
}

var Snd = {
  bgmAudio: null,
  click: function() { if (!Save.d.settings.sfx) return; playTones([{f:800, f2:600}], 'sine', 0.15, 0.08); },
  pickup: function(typeId) {
    if (!Save.d.settings.sfx) return;
    playTones([{f:500+typeId*80, f2:800+typeId*80}], 'sine', 0.2, 0.12);
    var c = getAudioCtx(); if (!c) return;
    var now = c.currentTime;
    var o = c.createOscillator(); o.type = 'sawtooth';
    o.frequency.setValueAtTime(600, now + 0.05);
    o.frequency.exponentialRampToValueAtTime(300, now + 0.12);
    var g = c.createGain();
    g.gain.setValueAtTime(0.06, now + 0.05);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    o.connect(g); g.connect(c.destination);
    o.start(now + 0.05); o.stop(now + 0.15);
  },
  drop: function() { if (!Save.d.settings.sfx) return; playTones([{f:400, f2:200}], 'sine', 0.15, 0.1); },
  match: function() {
    if (!Save.d.settings.sfx) return;
    turkeyScream();
    setTimeout(function() { playNoise(0.3, 0.25); }, 80);
    playTones([{f:523, d:0.06}, {f:659, t:0.06, d:0.06}, {f:784, t:0.12, d:0.1}], 'sine', 0.2, 0.25);
  },
  combo: function(n) {
    if (!Save.d.settings.sfx) return;
    for (var i = 0; i < Math.min(n, 4); i++) { (function(i){ setTimeout(function(){ turkeyScream(); }, i * 60); })(i); }
    setTimeout(function() { playNoise(0.5, 0.35); }, 50);
    playTones([{f:523, d:0.08}, {f:659, t:0.08, d:0.08}, {f:784, t:0.16, d:0.08}, {f:1047, t:0.24, d:0.15}], 'sine', 0.25, 0.4);
  },
  prop: function() { if (!Save.d.settings.sfx) return; playTones([{f:800, f2:1200}], 'sine', 0.2, 0.15); },
  win: function() {
    if (!Save.d.settings.sfx) return;
    playTones([{f:523, d:0.12}, {f:659, t:0.15, d:0.12}, {f:784, t:0.3, d:0.12}, {f:1047, t:0.45, d:0.25}], 'sine', 0.3, 0.7);
    setTimeout(function() { playNoise(0.15, 0.15); }, 600);
    setTimeout(function() { turkeyScream(); }, 200);
  },
  lose: function() { if (!Save.d.settings.sfx) return; playTones([{f:400, f2:150}], 'sawtooth', 0.2, 0.5); },
  tick: function() { if (!Save.d.settings.sfx) return; playTones([{f:1000, f2:800}], 'sine', 0.08, 0.03); },
  startBgm: function() { if (!Save.d.settings.bgm) return; if (this.bgmAudio) return; },
  stopBgm: function() { if (this.bgmAudio) { this.bgmAudio.pause(); this.bgmAudio = null; } },
};

// ===== js/particles =====
var PARTICLE_TYPES = {
  star:     { ch: '✨', sz: 16, life: 60, g: 0.02 },
  feather:  { ch: '🪶', sz: 14, life: 50, g: 0.05 },
  confetti: { ch: '🎊', sz: 14, life: 70, g: 0.08 },
  heart:    { ch: '❤️', sz: 14, life: 50, g: -0.02 },
  sparkle:  { ch: '⭐', sz: 12, life: 40, g: 0 },
  fire:     { ch: '🔥', sz: 18, life: 45, g: -0.06 },
  boom:     { ch: '💥', sz: 22, life: 30, g: 0 },
  lightning:{ ch: '⚡', sz: 16, life: 35, g: -0.03 },
  ring:     { ch: '💫', sz: 20, life: 40, g: 0 },
};

var POOL_SIZE = 600;
var pool = [];
var active = [];
for (var pi = 0; pi < POOL_SIZE; pi++) {
  pool.push({ on: false, x: 0, y: 0, vx: 0, vy: 0, life: 0, ml: 0, ch: '', sz: 16, g: 0, a: 0, va: 0 });
}

var _screenShake = 0, _screenFlash = 0, _shockwaves = [];

var ScreenFX = {
  shake: function(intensity) { _screenShake = Math.max(_screenShake, intensity || 8); },
  flash: function(alpha) { _screenFlash = Math.max(_screenFlash, alpha || 0.6); },
  shockwave: function(x, y) { _shockwaves.push({ x: x, y: y, r: 0, maxR: 250, alpha: 1.0 }); },
  update: function(c, w, h) {
    if (_screenShake > 0.5) {
      var dx = (Math.random() - 0.5) * _screenShake * 2;
      var dy = (Math.random() - 0.5) * _screenShake * 2;
      c.translate(dx, dy);
      _screenShake *= 0.85;
    } else { _screenShake = 0; }
    if (_screenFlash > 0.01) {
      c.save(); c.globalAlpha = _screenFlash; c.fillStyle = '#FFFFFF'; c.fillRect(0, 0, w, h); c.restore();
      _screenFlash *= 0.8;
    }
    for (var i = _shockwaves.length - 1; i >= 0; i--) {
      var sw = _shockwaves[i];
      sw.r += 12; sw.alpha *= 0.9;
      if (sw.alpha < 0.02 || sw.r > sw.maxR) { _shockwaves.splice(i, 1); continue; }
      c.save();
      c.globalAlpha = sw.alpha; c.strokeStyle = '#FFD700'; c.lineWidth = 5;
      c.shadowColor = '#FFD700'; c.shadowBlur = 15;
      c.beginPath(); c.arc(sw.x, sw.y, sw.r, 0, Math.PI * 2); c.stroke();
      c.shadowBlur = 0; c.strokeStyle = '#FF6B35'; c.lineWidth = 3;
      c.beginPath(); c.arc(sw.x, sw.y, sw.r * 0.7, 0, Math.PI * 2); c.stroke();
      c.globalAlpha = sw.alpha * 0.6; c.strokeStyle = '#FFFFFF'; c.lineWidth = 2;
      c.beginPath(); c.arc(sw.x, sw.y, sw.r * 0.4, 0, Math.PI * 2); c.stroke();
      c.restore();
    }
  }
};

var Particles = {
  emit: function(x, y, type, n) {
    n = n || 5;
    var t = PARTICLE_TYPES[type] || PARTICLE_TYPES.star;
    for (var i = 0; i < n; i++) {
      var p = null;
      for (var j = 0; j < pool.length; j++) { if (!pool[j].on) { p = pool[j]; break; } }
      if (!p) break;
      var ang = Math.random() * Math.PI * 2;
      var spd = 2 + Math.random() * 5;
      p.on = true; p.x = x; p.y = y;
      p.vx = Math.cos(ang) * spd; p.vy = Math.sin(ang) * spd - 1;
      p.life = t.life + (Math.random() * 20 | 0); p.ml = p.life;
      p.ch = t.ch; p.sz = t.sz * (0.8 + Math.random() * 0.4);
      p.g = t.g; p.a = Math.random() * 6.28; p.va = (Math.random() - 0.5) * 0.1;
      active.push(p);
    }
  },
  burst: function(x, y, n) {
    n = n || 12;
    var ts = ['star', 'feather', 'confetti', 'heart'];
    for (var i = 0; i < n; i++) { this.emit(x, y, ts[i % ts.length], 1); }
  },
  fireworks: function(cx, cy) {
    var self = this;
    for (var i = 0; i < 3; i++) {
      (function(i) {
        setTimeout(function() {
          var x = cx + (Math.random() - 0.5) * 200;
          var y = cy + (Math.random() - 0.5) * 200;
          self.burst(x, y, 6);
        }, i * 250);
      })(i);
    }
  },
  update: function(c) {
    for (var i = active.length - 1; i >= 0; i--) {
      var p = active[i];
      p.life--;
      if (p.life <= 0) { p.on = false; active.splice(i, 1); continue; }
      p.vy += p.g; p.x += p.vx; p.y += p.vy; p.a += p.va; p.vx *= 0.98;
      var alpha = p.life / p.ml;
      c.save(); c.globalAlpha = alpha;
      c.translate(p.x, p.y); c.rotate(p.a);
      c.font = p.sz + 'px serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText(p.ch, 0, 0); c.restore();
    }
  },
  clear: function() { active.forEach(function(p) { p.on = false; }); active.length = 0; },
  get count() { return active.length; },
};

// ===== js/scene-manager =====
var SceneManager = {
  _stack: [],
  _scenes: {},
  _lastTime: 0,
  _running: false,
  _currentTouchHandler: null,

  register: function(name, scene) { this._scenes[name] = scene; },
  switchTo: function(name, params) {
    while (this._stack.length > 0) { this._stack.pop().exit(); }
    this._pushScene(name, params);
  },
  push: function(name, params) { this._pushScene(name, params); },
  pop: function() {
    if (this._stack.length > 0) { this._stack.pop().exit(); }
    this._bindTouch();
  },
  current: function() { return this._stack.length > 0 ? this._stack[this._stack.length - 1] : null; },
  start: function() {
    if (this._running) return;
    this._running = true;
    this._lastTime = Date.now();
    this._loop();
  },
  stop: function() { this._running = false; },
  _pushScene: function(name, params) {
    var scene = this._scenes[name];
    if (!scene) { console.error('Scene not registered:', name); return; }
    this._stack.push(scene);
    scene._lastParams = params || {};
    scene.enter(params);
    this._bindTouch();
  },
  _bindTouch: function() {
    if (this._currentTouchHandler) {
      TouchManager.unregister(this._currentTouchHandler);
      this._currentTouchHandler = null;
    }
    var scene = this.current();
    if (!scene) return;
    this._currentTouchHandler = {
      onStart: function(x, y, e) { scene.onTouchStart(x, y, e); },
      onMove: function(x, y, e) { scene.onTouchMove(x, y, e); },
      onEnd: function(x, y, e) { scene.onTouchEnd(x, y, e); },
    };
    TouchManager.register(this._currentTouchHandler);
  },
  _loop: function() {
    if (!this._running) return;
    var self = this;

    syncFrame();
    if (Renderer._resized) {
      Renderer._resized = false;
      // Only recalculate layout, do NOT re-enter scene (which resets game state)
      var cs = this.current();
      if (cs && cs._calcLayout) cs._calcLayout();
      if (cs && cs._initButtons) cs._initButtons();
      if (cs && cs._layoutCards) cs._layoutCards();
    }

    var now = Date.now();
    var dt = (now - this._lastTime) / 1000;
    this._lastTime = now;

    var scene = this.current();
    if (scene) scene.update(dt);

    Renderer.clear();
    for (var si = 0; si < this._stack.length; si++) {
      this._stack[si].render(ctx, Renderer.width, Renderer.height);
    }

    requestAnimationFrame(function() { self._loop(); });
  },
};

// ===== Scene base =====
function Scene(name) { this.name = name; }
Scene.prototype.enter = function() {};
Scene.prototype.exit = function() {};
Scene.prototype.update = function() {};
Scene.prototype.render = function() {};
Scene.prototype.onTouchStart = function() {};
Scene.prototype.onTouchMove = function() {};
Scene.prototype.onTouchEnd = function() {};

// ===== js/scenes/home =====
var homeButtons = [];
var _bgLoaded = false;
var _titleLoaded = false;
var _animTime = 0;
var homeFallingItems = [];
var FALL_EMOJIS = ['🪶', '🍃', '🍂', '🌿', '✨', '🌸'];

var homeScene = new Scene('home');
homeScene.enter = function() {
  _animTime = 0;
  homeFallingItems.length = 0;
  this._initButtons();
  Renderer.loadImage('images/title_en.png').then(function() { _titleLoaded = true; });
  Renderer.loadImage('images/bg_farm.png').then(function() { _bgLoaded = true; });
};
homeScene.exit = function() { homeFallingItems.length = 0; };
homeScene._initButtons = function() {
  var w = Renderer.width, h = Renderer.height;
  var btnW = w * 0.55, btnH = 50, cx = w / 2, startY = h * 0.55, gap = 70;
  homeButtons = [
    { id: 'start', text: 'Start Game', x: cx - btnW / 2, y: startY, w: btnW, h: btnH, color: '#FF6B35' },
    { id: 'collection', text: 'Turkey Album', x: cx - btnW / 2, y: startY + gap, w: btnW, h: btnH, color: '#1E88E5' },
    { id: 'settings', text: 'Settings', x: cx - btnW / 2, y: startY + gap * 2, w: btnW, h: btnH, color: '#78909C' },
  ];
};
homeScene.update = function(dt) {
  _animTime += dt;
  if (Math.random() < dt * 1.5 && homeFallingItems.length < 20) {
    homeFallingItems.push({
      emoji: FALL_EMOJIS[Math.floor(Math.random() * FALL_EMOJIS.length)],
      x: Math.random() * Renderer.width, y: -20,
      vy: 30 + Math.random() * 40, vx: (Math.random() - 0.5) * 20,
      rot: Math.random() * 6.28, rotV: (Math.random() - 0.5) * 2,
      size: 12 + Math.random() * 14, alpha: 0.4 + Math.random() * 0.4,
    });
  }
  for (var i = homeFallingItems.length - 1; i >= 0; i--) {
    var f = homeFallingItems[i];
    f.y += f.vy * dt; f.x += f.vx * dt; f.rot += f.rotV * dt;
    if (f.y > Renderer.height + 30) homeFallingItems.splice(i, 1);
  }
};
homeScene.render = function(c, w, h) {
  // Background
  if (_bgLoaded) { Renderer.drawImage('images/bg_farm.png', 0, 0, w, h); }
  else {
    var skyGrad = c.createLinearGradient(0, 0, 0, h * 0.6);
    skyGrad.addColorStop(0, '#87CEEB'); skyGrad.addColorStop(0.6, '#A8D8EA'); skyGrad.addColorStop(1, '#C5E8B7');
    c.fillStyle = skyGrad; c.fillRect(0, 0, w, h * 0.6);
    var groundGrad = c.createLinearGradient(0, h * 0.6, 0, h);
    groundGrad.addColorStop(0, '#5BA55B'); groundGrad.addColorStop(0.5, '#4a8c2a'); groundGrad.addColorStop(1, '#2d5a1e');
    c.fillStyle = groundGrad; c.fillRect(0, h * 0.6, w, h * 0.4);
  }
  c.fillStyle = 'rgba(0,0,0,0.2)'; c.fillRect(0, 0, w, h);

  for (var fi = 0; fi < homeFallingItems.length; fi++) {
    var f = homeFallingItems[fi];
    c.save(); c.globalAlpha = f.alpha;
    c.translate(f.x, f.y); c.rotate(f.rot);
    c.font = f.size + 'px serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText(f.emoji, 0, 0); c.restore();
  }

  // Title
  var titleY = h * 0.12, titleH = h * 0.22, titleW = w * 0.8, titleX = (w - titleW) / 2;
  if (_titleLoaded) { Renderer.drawImage('images/title_en.png', titleX, titleY, titleW, titleH); }
  else {
    c.save(); c.font = 'bold 48px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillStyle = 'rgba(0,0,0,0.3)'; c.fillText('🦃 Catch Turkey', w / 2 + 2, titleY + titleH / 2 + 2);
    c.fillStyle = '#FFD700'; c.fillText('🦃 Catch Turkey', w / 2, titleY + titleH / 2); c.restore();
  }
  var subY = titleY + titleH + 10 + Math.sin(_animTime * 2) * 3;
  c.font = 'bold 16px sans-serif'; c.fillStyle = '#FFFFFF'; c.textAlign = 'center'; c.textBaseline = 'top';
  c.fillText('🌟 Fun Match-3 Game! 🌟', w / 2, subY);

  for (var bi = 0; bi < homeButtons.length; bi++) {
    var btn = homeButtons[bi];
    Renderer.drawRoundRect(btn.x + 2, btn.y + 3, btn.w, btn.h, 14, 'rgba(0,0,0,0.3)');
    Renderer.drawRoundRect(btn.x, btn.y, btn.w, btn.h, 14, btn.color);
    c.save(); c.globalAlpha = 0.25;
    Renderer.drawRoundRect(btn.x + 2, btn.y + 2, btn.w - 4, btn.h / 2, 14, '#FFFFFF'); c.restore();
    c.font = 'bold 20px sans-serif'; c.fillStyle = '#FFFFFF'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText(btn.text, btn.x + btn.w / 2, btn.y + btn.h / 2);
  }

  c.font = '12px sans-serif'; c.fillStyle = 'rgba(255,255,255,0.4)';
  c.textAlign = 'center'; c.textBaseline = 'bottom';
  c.fillText('Catch Turkey v2.0', w / 2, h - 20);
};
homeScene.onTouchStart = function(x, y) {
  for (var i = 0; i < homeButtons.length; i++) {
    var btn = homeButtons[i];
    if (x >= btn.x && x <= btn.x + btn.w && y >= btn.y && y <= btn.y + btn.h) {
      Snd.click();
      if (btn.id === 'start') SceneManager.switchTo('levelSelect');
      else if (btn.id === 'collection') SceneManager.switchTo('collection');
      else if (btn.id === 'settings') SceneManager.switchTo('settings');
      return;
    }
  }
};

// ===== js/scenes/level-select =====
var _lsCards = [], _lsBackBtn = null, _lsScrollY = 0, _lsMaxScrollY = 0, _lsTouchStartY = 0, _lsScrollStartY = 0;

var levelSelectScene = new Scene('levelSelect');
levelSelectScene.enter = function() { _lsScrollY = 0; this._layoutCards(); };
levelSelectScene.exit = function() {};
levelSelectScene._layoutCards = function() {
  var w = Renderer.width, h = Renderer.height;
  _lsBackBtn = { x: 10, y: 10, w: 44, h: 44 };
  var cols = 2, padding = 16, topOffset = 70, cardGap = 12;
  var gridW = w - padding * 2, cardW = (gridW - cardGap * (cols - 1)) / cols, cardH = 72;
  var gridStartY = topOffset + 10;
  _lsCards = LEVELS.map(function(lv, idx) {
    var col = idx % cols, row = Math.floor(idx / cols);
    return {
      lv: lv, x: padding + col * (cardW + cardGap), y: gridStartY + row * (cardH + cardGap),
      w: cardW, h: cardH, unlocked: lv.id <= Save.d.maxLevel,
      stars: Save.d.stars[lv.id] || 0, isCurrent: lv.id === Save.d.maxLevel
    };
  });
  var lastCard = _lsCards[_lsCards.length - 1];
  _lsMaxScrollY = Math.max(0, lastCard.y + lastCard.h + 20 - h);
};
levelSelectScene.render = function(c, w, h) {
  var grad = c.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, '#1a1a3e'); grad.addColorStop(0.5, '#2d1b69'); grad.addColorStop(1, '#4A148C');
  c.fillStyle = grad; c.fillRect(0, 0, w, h);
  c.font = 'bold 22px sans-serif'; c.fillStyle = '#FFD700'; c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillText('Select Level', w / 2, 36);
  c.font = '28px sans-serif'; c.fillStyle = '#FFFFFF'; c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillText('←', _lsBackBtn.x + _lsBackBtn.w / 2, _lsBackBtn.y + _lsBackBtn.h / 2);
  c.save(); c.translate(0, -_lsScrollY);
  for (var i = 0; i < _lsCards.length; i++) {
    var card = _lsCards[i];
    var r = 12;
    if (card.unlocked) {
      Renderer.drawRoundRect(card.x, card.y, card.w, card.h, r, card.isCurrent ? '#FF6B35' : '#283593');
      if (card.isCurrent) {
        c.save(); c.strokeStyle = '#FFD740'; c.lineWidth = 2; c.beginPath();
        c.moveTo(card.x + r, card.y);
        c.arcTo(card.x + card.w, card.y, card.x + card.w, card.y + card.h, r);
        c.arcTo(card.x + card.w, card.y + card.h, card.x, card.y + card.h, r);
        c.arcTo(card.x, card.y + card.h, card.x, card.y, r);
        c.arcTo(card.x, card.y, card.x + card.w, card.y, r);
        c.closePath(); c.stroke(); c.restore();
      }
      c.font = 'bold 28px sans-serif'; c.fillStyle = '#FFD700'; c.textAlign = 'left'; c.textBaseline = 'middle';
      c.fillText(card.lv.id, card.x + 14, card.y + card.h / 2 - 8);
      c.font = '14px sans-serif'; c.fillStyle = '#FFFFFF'; c.textAlign = 'left';
      c.fillText(card.lv.name, card.x + 46, card.y + card.h / 2 - 10);
      var starStr = '';
      for (var si = 0; si < card.stars; si++) starStr += '⭐';
      for (var si2 = 0; si2 < 3 - card.stars; si2++) starStr += '☆';
      c.font = '14px serif'; c.fillStyle = '#FFD700'; c.textAlign = 'left';
      c.fillText(starStr, card.x + 46, card.y + card.h / 2 + 12);
    } else {
      Renderer.drawRoundRect(card.x, card.y, card.w, card.h, r, 'rgba(255,255,255,0.08)');
      c.font = '28px serif'; c.fillStyle = 'rgba(255,255,255,0.3)'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText('🔒', card.x + 26, card.y + card.h / 2);
      c.font = '14px sans-serif'; c.fillStyle = 'rgba(255,255,255,0.3)'; c.textAlign = 'left';
      c.fillText(card.lv.name, card.x + 46, card.y + card.h / 2);
    }
  }
  c.restore();
};
levelSelectScene.onTouchStart = function(x, y) {
  _lsTouchStartY = y; _lsScrollStartY = _lsScrollY;
  if (x >= _lsBackBtn.x && x <= _lsBackBtn.x + _lsBackBtn.w && y >= _lsBackBtn.y && y <= _lsBackBtn.y + _lsBackBtn.h) {
    Snd.click(); SceneManager.switchTo('home'); return;
  }
  var adjY = y + _lsScrollY;
  for (var i = 0; i < _lsCards.length; i++) {
    var card = _lsCards[i];
    if (card.unlocked && x >= card.x && x <= card.x + card.w && adjY >= card.y && adjY <= card.y + card.h) {
      Snd.click(); SceneManager.switchTo('game', { levelId: card.lv.id }); return;
    }
  }
};
levelSelectScene.onTouchMove = function(x, y) {
  _lsScrollY = Math.max(0, Math.min(_lsMaxScrollY, _lsScrollStartY + (_lsTouchStartY - y)));
};

// ===== js/scenes/game =====
var TURKEY_IMG_MAP = [
  'images/turkey_red.png', 'images/turkey_blue.png', 'images/turkey_golden.png',
  'images/turkey_purple.png', 'images/turkey_orange.png', 'images/turkey_pink.png',
  'images/turkey_green.png', 'images/turkey_rainbow.png', 'images/turkey_white.png',
  'images/turkey_black.png',
];

var TURKEY_W = 80, TURKEY_H = 85, SLOT_W = 50, SLOT_H = 56, SLOT_GAP = 4, SLOT_BAR_H = 80;

// Game state variables
var level = null, turkeys = [], slots = [], score = 0, combo = 0, comboTimer = null;
var timeLeft = 0, timerInterval = null, gameOver = false, paused = false, animating = false;
var _matchAnimating = false, totalRemoved = 0, totalTurkeys = 0, theme = null;
var props = { shuffle: 3, remove: 3, complete: 3 };
var comboText = '', comboAlpha = 0, comboScale = 1, scoreFloats = [];
var countdownNum = 0, countdownAlpha = 0, _countdownCb = null;
var flyingTurkey = null, flyingTurkeys = [];
var _hudY = 0, _slotBarY = 0, _gameAreaY = 0, _gameAreaH = 0, _propBtns = [], _pauseBtn = null;

function shuffle(arr) {
  for (var i = arr.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
  }
  return arr;
}

function roundRectPath(c, x, y, w, h, r) {
  c.beginPath(); c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}

var gameScene = new Scene('game');
gameScene.enter = function(params) {
  var lvId = params ? params.levelId : 1;
  level = null;
  for (var i = 0; i < LEVELS.length; i++) { if (LEVELS[i].id === lvId) { level = LEVELS[i]; break; } }
  if (!level) level = LEVELS[0];
  theme = THEMES[level.theme] || THEMES.spring;

  score = 0; combo = 0; totalRemoved = 0; gameOver = false; paused = false; animating = false;
  slots = []; turkeys = []; scoreFloats = [];
  flyingTurkey = null; flyingTurkeys = []; _matchAnimating = false;
  comboText = ''; comboAlpha = 0;
  props = {
    shuffle: 3 + (Save.d.propBonus.shuffle || 0),
    remove: 3 + (Save.d.propBonus.remove || 0),
    complete: 3 + (Save.d.propBonus.complete || 0),
  };
  timeLeft = level.time;
  this._calcLayout();
  for (var i = 0; i < level.types; i++) { Renderer.loadImage(TURKEY_IMG_MAP[i]); }
  this._generateTurkeys();
  var self = this;
  this._startCountdown(function() { self._startTimer(); });
  Snd.startBgm();
};
gameScene.exit = function() {
  if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
  if (comboTimer) { clearTimeout(comboTimer); comboTimer = null; }
  Snd.stopBgm(); Particles.clear();
};
gameScene._calcLayout = function() {
  var w = Renderer.width, h = Renderer.height;
  _hudY = 0; _slotBarY = h - SLOT_BAR_H; _gameAreaY = 50; _gameAreaH = _slotBarY - 50;
  _pauseBtn = { x: w - 50, y: 8, w: 36, h: 36 };
  var propY = _slotBarY - 50, propW = 44, propGap = 16;
  var propTotalW = propW * 3 + propGap * 2;
  var propStartX = (w - propTotalW) / 2;
  _propBtns = [
    { id: 'shuffle', emoji: '🔀', x: propStartX, y: propY, w: propW, h: propW },
    { id: 'remove', emoji: '↩️', x: propStartX + propW + propGap, y: propY, w: propW, h: propW },
    { id: 'complete', emoji: '✨', x: propStartX + (propW + propGap) * 2, y: propY, w: propW, h: propW },
  ];
};
gameScene._generateTurkeys = function() {
  var lv = level;
  turkeys = [];
  var turkeyList = [];
  var totalGroups = Math.floor(lv.count / 3);
  var groupsPerType = Math.floor(totalGroups / lv.types);
  var extraGroups = totalGroups - groupsPerType * lv.types;
  for (var i = 0; i < lv.types; i++) {
    var groups = groupsPerType + (i < extraGroups ? 1 : 0);
    for (var j = 0; j < groups * 3; j++) turkeyList.push(i);
  }
  totalTurkeys = turkeyList.length;
  shuffle(turkeyList);

  var perLayer = Math.ceil(turkeyList.length / lv.layers);
  var topStart = (lv.layers - 1) * perLayer;
  var topSlice = turkeyList.slice(topStart);
  var topTypes = {};
  for (var ti = 0; ti < topSlice.length; ti++) topTypes[topSlice[ti]] = true;
  for (var tid = 0; tid < lv.types; tid++) {
    if (!topTypes[tid]) {
      var lowerIdx = -1;
      for (var li = 0; li < topStart; li++) { if (turkeyList[li] === tid) { lowerIdx = li; break; } }
      if (lowerIdx >= 0 && topStart < turkeyList.length) {
        var swapIdx = topStart + Math.floor(Math.random() * (turkeyList.length - topStart));
        if (swapIdx < turkeyList.length) {
          var tmp = turkeyList[lowerIdx]; turkeyList[lowerIdx] = turkeyList[swapIdx]; turkeyList[swapIdx] = tmp;
        }
      }
    }
  }

  var w = Renderer.width, areaW = w - 20, areaH = _gameAreaH - 60;
  var tw = TURKEY_W * 0.68, th = TURKEY_H * 0.6;
  var cols = Math.max(4, Math.min(7, Math.ceil(Math.sqrt(perLayer * 1.5))));
  var cellW = tw, cellH = th;
  var gridW = cols * cellW;
  var rows = Math.ceil(perLayer / cols);
  var gridH = rows * cellH;
  var baseX = (areaW - gridW) / 2 + 10;
  var baseY = _gameAreaY + (areaH - gridH) / 2;

  var idx = 0;
  for (var layer = 0; layer < lv.layers; layer++) {
    var layerStart = layer * perLayer;
    var layerEnd = Math.min(layerStart + perLayer, turkeyList.length);
    var layerOff = layer * TURKEY_W * 0.25;
    for (var ii = layerStart; ii < layerEnd; ii++) {
      var li2 = ii - layerStart;
      var row2 = Math.floor(li2 / cols);
      var col2 = li2 % cols;
      var hexOff = (row2 % 2) ? cellW * 0.5 : 0;
      var tx = baseX + col2 * cellW + hexOff + layerOff + (Math.random() * 10 - 5);
      var ty = baseY + row2 * cellH + layerOff + (Math.random() * 8 - 4);
      turkeys.push({
        id: idx++, typeId: turkeyList[ii],
        x: Math.max(2, Math.min(tx, w - TURKEY_W - 2)),
        y: Math.max(_gameAreaY + 2, Math.min(ty, _slotBarY - TURKEY_H - 60)),
        layer: layer, removed: false, blocked: false,
      });
    }
  }
  this._updateBlocked();
};
gameScene._updateBlocked = function() {
  for (var i = 0; i < turkeys.length; i++) {
    var t = turkeys[i];
    if (t.removed) { t.blocked = false; continue; }
    t.blocked = false;
    for (var j = 0; j < turkeys.length; j++) {
      var other = turkeys[j];
      if (other.removed || other.layer <= t.layer || other.id === t.id) continue;
      if (Math.abs(t.x - other.x) < TURKEY_W * 0.55 && Math.abs(t.y - other.y) < TURKEY_H * 0.55) {
        t.blocked = true; break;
      }
    }
  }
};
gameScene._startCountdown = function(cb) {
  _countdownCb = cb; countdownNum = 3; countdownAlpha = 1;
  var tick = function() {
    if (countdownNum > 0) {
      countdownAlpha = 1;
      setTimeout(function() {
        countdownNum--;
        if (countdownNum > 0) { tick(); }
        else {
          countdownNum = -1; countdownAlpha = 1;
          setTimeout(function() { countdownNum = 0; countdownAlpha = 0; if (_countdownCb) _countdownCb(); }, 600);
        }
      }, 800);
    }
  };
  tick();
};
gameScene._startTimer = function() {
  var self = this;
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(function() {
    if (paused || gameOver) return;
    timeLeft--;
    if (timeLeft <= 10 && timeLeft > 0) Snd.tick();
    if (timeLeft <= 0) { clearInterval(timerInterval); timerInterval = null; self._onLose('Time Up!'); }
  }, 1000);
};
gameScene._onTurkeyClick = function(turkey) {
  if (paused || gameOver || _matchAnimating || turkey.removed) return;
  if (turkey.blocked) {
    if (Save.d.settings.vibrate && navigator.vibrate) navigator.vibrate(15);
    return;
  }
  if (slots.length >= SLOT_COUNT) return;
  Snd.pickup(turkey.typeId);
  if (Save.d.settings.vibrate && navigator.vibrate) navigator.vibrate(15);
  turkey.removed = true;

  var insertIdx = slots.length;
  for (var i = 0; i < slots.length; i++) {
    if (slots[i].typeId === turkey.typeId) {
      var lastSame = i;
      while (lastSame + 1 < slots.length && slots[lastSame + 1].typeId === turkey.typeId) lastSame++;
      insertIdx = lastSame + 1; break;
    }
  }
  slots.splice(insertIdx, 0, { typeId: turkey.typeId });

  var w = Renderer.width;
  var slotTotalW = SLOT_COUNT * (SLOT_W + SLOT_GAP) - SLOT_GAP;
  var slotStartX = (w - slotTotalW) / 2;
  var endX = slotStartX + insertIdx * (SLOT_W + SLOT_GAP) + SLOT_W / 2;
  var endY = _slotBarY + SLOT_BAR_H / 2;
  var startX = turkey.x + TURKEY_W / 2, startY = turkey.y + TURKEY_H / 2;
  var cpx = (startX + endX) / 2, cpy = Math.min(startY, endY) - 120;

  flyingTurkey = { typeId: turkey.typeId, x: startX, y: startY, startX: startX, startY: startY, endX: endX, endY: endY, cpx: cpx, cpy: cpy, t: 0, dur: 0.4 };
  flyingTurkeys.push(flyingTurkey);
  animating = true;
  Particles.emit(startX, startY, 'sparkle', 2);
  this._updateBlocked();
};
gameScene._checkMatch = function() {
  var self = this;
  for (var i = 0; i <= slots.length - 3; i++) {
    if (slots[i].typeId === slots[i + 1].typeId && slots[i + 1].typeId === slots[i + 2].typeId) {
      animating = true; _matchAnimating = true;
      (function(matchIdx) {
        setTimeout(function() {
          Snd.match();
          slots.splice(matchIdx, 3);
          totalRemoved += 3;
          score += 100;
          combo++;
          if (comboTimer) clearTimeout(comboTimer);
          comboTimer = setTimeout(function() { combo = 0; }, 3000);
          if (combo > 1) { Snd.combo(combo); score += combo * 20; self._showCombo(combo); }

          var w = Renderer.width;
          var slotTotalW = SLOT_COUNT * (SLOT_W + SLOT_GAP) - SLOT_GAP;
          var slotStartX = (w - slotTotalW) / 2;
          var cx = slotStartX + (matchIdx + 1) * (SLOT_W + SLOT_GAP);
          var cy = _slotBarY + SLOT_BAR_H / 2;

          Particles.burst(cx, cy, 30);
          Particles.emit(cx, cy, 'fire', 12);
          Particles.emit(cx, cy, 'boom', 5);
          Particles.emit(cx, cy, 'lightning', 8);
          Particles.emit(cx, cy, 'ring', 5);
          Particles.emit(cx, cy, 'sparkle', 10);
          Particles.emit(cx, cy, 'confetti', 8);
          Particles.emit(cx, cy, 'heart', 4);
          for (var ei = 0; ei < 3; ei++) {
            var ox = cx + (Math.random() - 0.5) * 120, oy = cy + (Math.random() - 0.5) * 80;
            Particles.burst(ox, oy, 10); Particles.emit(ox, oy, 'fire', 4);
          }

          ScreenFX.shake(combo > 2 ? 20 : combo > 1 ? 15 : 12);
          ScreenFX.flash(combo > 2 ? 0.7 : combo > 1 ? 0.5 : 0.4);
          ScreenFX.shockwave(cx, cy);
          setTimeout(function() {
            ScreenFX.shockwave(cx + (Math.random()-0.5)*60, cy + (Math.random()-0.5)*40);
          }, 100);

          if (combo > 1) {
            for (var ci = 0; ci < combo * 4; ci++) {
              var rx = Math.random() * w, ry = cy + (Math.random() - 0.5) * 200;
              var types = ['star', 'confetti', 'fire', 'lightning', 'heart'];
              Particles.emit(rx, ry, types[ci % types.length], 1);
            }
          }

          var pts = 100 + (combo > 1 ? combo * 20 : 0);
          scoreFloats.push({ x: cx, y: cy - 20, text: '+' + pts + (combo > 2 ? ' 🔥' : combo > 1 ? ' ✨' : ''), alpha: 1, vy: -80, scale: combo > 2 ? 1.5 : 1 });
          if (combo > 1) {
            for (var si = 0; si < Math.min(combo, 5); si++) {
              scoreFloats.push({ x: cx + (Math.random()-0.5)*80, y: cy - 10 - Math.random()*30, text: ['🎉','🌟','💥','✨','🎊'][si % 5], alpha: 1, vy: -40 - Math.random()*40 });
            }
          }

          if (Save.d.settings.vibrate && navigator.vibrate) navigator.vibrate(combo > 2 ? 30 : 15);
          animating = false; _matchAnimating = false;
          if (totalRemoved >= totalTurkeys) { self._onWin(); }
          else { self._checkMatch(); }
        }, 500);
      })(i);
      return true;
    }
  }

  if (!gameOver) {
    if (slots.length >= SLOT_COUNT) {
      if (Save.d.settings.vibrate && navigator.vibrate) navigator.vibrate(100);
      var self2 = this;
      setTimeout(function() { if (!gameOver) self2._onLose('Slots Full!'); }, 300);
    }
    var remaining = turkeys.filter(function(t) { return !t.removed; });
    if (remaining.length === 0 && slots.length > 0 && totalRemoved < totalTurkeys) {
      var self3 = this;
      setTimeout(function() { if (!gameOver) self3._onLose('No more turkeys!'); }, 500);
    }
  }
  return false;
};
gameScene._showCombo = function(n) {
  comboText = COMBO_TEXTS[Math.min(n - 2, COMBO_TEXTS.length - 1)] + ' x' + n;
  comboAlpha = 1; comboScale = 1.5;
};
gameScene._useProp = function(type) {
  if (paused || gameOver || animating) return;
  if (props[type] <= 0) return;
  props[type]--;
  Snd.prop();
  if (Save.d.settings.vibrate && navigator.vibrate) navigator.vibrate(15);
  if (type === 'shuffle') this._propShuffle();
  else if (type === 'remove') this._propRemove();
  else if (type === 'complete') this._propComplete();
};
gameScene._propShuffle = function() {
  var act = turkeys.filter(function(t) { return !t.removed; });
  var positions = act.map(function(t) { return { x: t.x, y: t.y, layer: t.layer }; });
  shuffle(positions);
  act.forEach(function(t, idx) { t.x = positions[idx].x; t.y = positions[idx].y; t.layer = positions[idx].layer; });
  Particles.burst(Renderer.width / 2, Renderer.height / 2, 8);
  this._updateBlocked();
};
gameScene._propRemove = function() {
  if (slots.length === 0) return;
  var count = Math.min(3, slots.length);
  var removed = slots.splice(slots.length - count, count);
  removed.forEach(function(s) {
    for (var i = 0; i < turkeys.length; i++) {
      if (turkeys[i].removed && turkeys[i].typeId === s.typeId) { turkeys[i].removed = false; break; }
    }
  });
  this._updateBlocked();
};
gameScene._propComplete = function() {
  if (slots.length === 0) return;
  var counts = {};
  slots.forEach(function(s) { counts[s.typeId] = (counts[s.typeId] || 0) + 1; });
  var bestType = -1, bestCount = 0;
  Object.keys(counts).forEach(function(tid) {
    var cnt = counts[tid];
    if (cnt > bestCount && cnt < 3) { bestCount = cnt; bestType = parseInt(tid); }
  });
  if (bestType === -1) return;
  var needed = 3 - bestCount;
  for (var i = 0; i < needed; i++) {
    var t = null;
    for (var j = 0; j < turkeys.length; j++) {
      if (!turkeys[j].removed && turkeys[j].typeId === bestType) { t = turkeys[j]; break; }
    }
    if (t) {
      t.removed = true;
      var insertIdx = slots.length;
      for (var k = 0; k < slots.length; k++) {
        if (slots[k].typeId === bestType) {
          var last = k;
          while (last + 1 < slots.length && slots[last + 1].typeId === bestType) last++;
          insertIdx = last + 1; break;
        }
      }
      slots.splice(insertIdx, 0, { typeId: bestType });
    }
  }
  this._updateBlocked();
  var cx = Renderer.width / 2;
  Particles.burst(cx, _slotBarY, 5);
  var self = this;
  setTimeout(function() { self._checkMatch(); }, 300);
};
gameScene._onWin = function() {
  if (gameOver) return;
  gameOver = true;
  if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
  Snd.stopBgm(); Snd.win();
  var timePercent = timeLeft / level.time;
  var stars = 1;
  if (timePercent > 0.5) stars = 2;
  if (timePercent > 0.7) stars = 3;
  Save.setStars(level.id, stars);
  Save.setScore(level.id, score);
  if (level.id >= Save.d.maxLevel && level.id < 10) { Save.d.maxLevel = level.id + 1; Save.save(); }
  Save.addCard(Math.min(level.id - 1, 9));
  Particles.fireworks(Renderer.width / 2, Renderer.height / 2);
  setTimeout(function() {
    SceneManager.push('result', { win: true, stars: stars, score: score, levelId: level.id });
  }, 1000);
};
gameScene._onLose = function(reason) {
  if (gameOver) return;
  gameOver = true;
  if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
  Snd.stopBgm(); Snd.lose();
  setTimeout(function() {
    SceneManager.push('result', { win: false, reason: reason || 'Slots Full!', removed: totalRemoved, total: totalTurkeys, score: score, levelId: level.id });
  }, 800);
};
gameScene.update = function(dt) {
  if (comboAlpha > 0) { comboAlpha -= dt * 1.5; comboScale = Math.max(1, comboScale - dt * 2); if (comboAlpha < 0) comboAlpha = 0; }
  for (var i = scoreFloats.length - 1; i >= 0; i--) {
    var f = scoreFloats[i]; f.y += f.vy * dt; f.alpha -= dt * 1.2;
    if (f.alpha <= 0) scoreFloats.splice(i, 1);
  }
  for (var fi = flyingTurkeys.length - 1; fi >= 0; fi--) {
    var ft = flyingTurkeys[fi];
    ft.t += dt;
    var progress = Math.min(ft.t / ft.dur, 1);
    var ease = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;
    ft.x = (1 - ease) * (1 - ease) * ft.startX + 2 * (1 - ease) * ease * ft.cpx + ease * ease * ft.endX;
    ft.y = (1 - ease) * (1 - ease) * ft.startY + 2 * (1 - ease) * ease * ft.cpy + ease * ease * ft.endY;
    if (progress >= 1) {
      Snd.drop(); flyingTurkeys.splice(fi, 1);
      var matched = this._checkMatch();
      if (!matched && flyingTurkeys.length === 0) animating = false;
    }
  }
  flyingTurkey = flyingTurkeys.length > 0 ? flyingTurkeys[flyingTurkeys.length - 1] : null;
};
gameScene.render = function(c, w, h) {
  c.save();
  ScreenFX.update(c, w, h);

  // Background
  var skyColors = theme.sky;
  var skyGrad = c.createLinearGradient(0, 0, 0, h * 0.6);
  skyColors.forEach(function(col, i) { skyGrad.addColorStop(i / (skyColors.length - 1), col); });
  c.fillStyle = skyGrad; c.fillRect(0, 0, w, h * 0.6);
  var groundColors = theme.ground;
  var gGrad = c.createLinearGradient(0, h * 0.6, 0, h);
  groundColors.forEach(function(col, i) { gGrad.addColorStop(i / (groundColors.length - 1), col); });
  c.fillStyle = gGrad; c.fillRect(0, h * 0.6, w, h * 0.4);

  // Turkeys
  var sorted = turkeys.filter(function(t) { return !t.removed; }).sort(function(a, b) { return a.layer !== b.layer ? a.layer - b.layer : a.y - b.y; });
  for (var ti = 0; ti < sorted.length; ti++) {
    var t = sorted[ti];
    gameScene._drawSingleTurkey(c, t.typeId, t.x, t.y, t.blocked ? 0.5 : 1);
    if (t.blocked) { c.save(); c.globalAlpha = 0.3; c.fillStyle = 'rgba(0,0,0,0.3)'; c.fillRect(t.x, t.y, TURKEY_W, TURKEY_H); c.restore(); }
  }

  // Flying turkeys
  for (var fti = 0; fti < flyingTurkeys.length; fti++) {
    var ft = flyingTurkeys[fti];
    gameScene._drawSingleTurkey(c, ft.typeId, ft.x - TURKEY_W / 2, ft.y - TURKEY_H / 2, 1);
  }

  // HUD
  c.fillStyle = 'rgba(0,0,0,0.4)'; c.fillRect(0, 0, w, 50);
  c.font = 'bold 16px sans-serif'; c.fillStyle = '#FFD700'; c.textAlign = 'left'; c.textBaseline = 'middle';
  c.fillText(level.name, 10, 25);
  c.fillStyle = '#FFFFFF'; c.textAlign = 'center'; c.fillText('🏆 ' + score, w / 2, 25);
  var min = Math.floor(timeLeft / 60), sec = timeLeft % 60;
  c.font = 'bold 18px sans-serif';
  c.fillStyle = timeLeft <= 30 ? '#FF5252' : (timeLeft <= 60 ? '#FFD740' : '#FFFFFF');
  c.textAlign = 'right'; c.fillText('⏱ ' + min + ':' + (sec < 10 ? '0' : '') + sec, w - 50, 25);
  c.font = '22px sans-serif'; c.fillStyle = '#FFFFFF'; c.textAlign = 'center';
  c.fillText('⏸', _pauseBtn.x + _pauseBtn.w / 2, _pauseBtn.y + _pauseBtn.h / 2);
  // Progress bar
  c.fillStyle = 'rgba(255,255,255,0.15)'; c.fillRect(10, 44, w - 20, 6);
  var progress = totalTurkeys > 0 ? totalRemoved / totalTurkeys : 0;
  c.fillStyle = '#4CAF50'; c.fillRect(10, 44, (w - 20) * progress, 6);

  // Prop buttons
  var propTypes = ['shuffle', 'remove', 'complete'];
  for (var pi = 0; pi < _propBtns.length; pi++) {
    var btn = _propBtns[pi], count = props[propTypes[pi]], disabled = count <= 0;
    c.save(); if (disabled) c.globalAlpha = 0.4;
    Renderer.drawRoundRect(btn.x, btn.y, btn.w, btn.h, 10, 'rgba(0,0,0,0.5)');
    c.font = '22px serif'; c.fillStyle = '#FFFFFF'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText(btn.emoji, btn.x + btn.w / 2, btn.y + btn.h / 2 - 4);
    c.font = 'bold 11px sans-serif'; c.fillStyle = '#FFD700';
    c.fillText('' + count, btn.x + btn.w / 2, btn.y + btn.h - 8);
    c.restore();
  }

  // Slot bar
  var barGrad = c.createLinearGradient(0, _slotBarY, 0, h);
  barGrad.addColorStop(0, '#1A237E'); barGrad.addColorStop(0.3, '#283593');
  barGrad.addColorStop(0.7, '#1A237E'); barGrad.addColorStop(1, '#0D1B2A');
  c.fillStyle = barGrad; c.fillRect(0, _slotBarY, w, SLOT_BAR_H);
  c.fillStyle = '#FFD740'; c.fillRect(0, _slotBarY, w, 3);

  var totalSlotW = SLOT_COUNT * (SLOT_W + SLOT_GAP) - SLOT_GAP;
  var startX = (w - totalSlotW) / 2;
  for (var si = 0; si < SLOT_COUNT; si++) {
    var sx = startX + si * (SLOT_W + SLOT_GAP), sy = _slotBarY + (SLOT_BAR_H - SLOT_H) / 2;
    Renderer.drawRoundRect(sx, sy, SLOT_W, SLOT_H, 8, si < slots.length ? 'rgba(13,94,52,0.5)' : 'rgba(13,27,42,0.7)');
    c.save();
    c.strokeStyle = slots.length >= 7 ? 'rgba(255,60,60,0.7)' : (slots.length >= 5 ? 'rgba(255,200,0,0.6)' : 'rgba(255,215,64,0.3)');
    c.lineWidth = 2; roundRectPath(c, sx, sy, SLOT_W, SLOT_H, 8); c.stroke(); c.restore();
    if (si < slots.length) {
      var imgSrc = TURKEY_IMG_MAP[slots[si].typeId] || TURKEY_IMG_MAP[0];
      Renderer.drawImage(imgSrc, sx + 3, sy + 3, SLOT_W - 6, SLOT_H - 6);
    }
  }

  Particles.update(c);

  if (comboAlpha > 0) {
    c.save(); c.globalAlpha = comboAlpha;
    c.font = 'bold ' + (32 * comboScale) + 'px sans-serif'; c.fillStyle = '#FFD700'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.strokeStyle = 'rgba(0,0,0,0.6)'; c.lineWidth = 3;
    c.strokeText(comboText, w / 2, h * 0.35); c.fillText(comboText, w / 2, h * 0.35); c.restore();
  }

  for (var sfi = 0; sfi < scoreFloats.length; sfi++) {
    var sf = scoreFloats[sfi];
    c.save(); c.globalAlpha = sf.alpha; c.font = 'bold 18px sans-serif'; c.fillStyle = '#FFD700';
    c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(sf.text, sf.x, sf.y); c.restore();
  }

  if (countdownNum !== 0) {
    c.save(); c.fillStyle = 'rgba(0,0,0,0.5)'; c.fillRect(0, 0, w, h);
    c.globalAlpha = countdownAlpha; c.font = 'bold 72px sans-serif'; c.fillStyle = '#FFD700';
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText(countdownNum === -1 ? 'GO!' : '' + countdownNum, w / 2, h / 2); c.restore();
  }

  if (paused) {
    c.fillStyle = 'rgba(0,0,0,0.6)'; c.fillRect(0, 0, w, h);
    c.font = 'bold 36px sans-serif'; c.fillStyle = '#FFFFFF'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText('Game Paused', w / 2, h / 2 - 30);
    c.font = '18px sans-serif'; c.fillText('Tap anywhere to resume', w / 2, h / 2 + 20);
  }
  c.restore();
};
gameScene._drawSingleTurkey = function(c, typeId, x, y, alpha) {
  c.save(); c.globalAlpha = alpha;
  var src = TURKEY_IMG_MAP[typeId] || TURKEY_IMG_MAP[0];
  var img = Renderer.getImage(src);
  if (img) { Renderer.drawImage(src, x, y, TURKEY_W, TURKEY_H); }
  else {
    var t = TURKEY_TYPES[typeId] || TURKEY_TYPES[0];
    c.beginPath(); c.ellipse(x + TURKEY_W / 2, y + TURKEY_H / 2, TURKEY_W / 2 - 4, TURKEY_H / 2 - 4, 0, 0, Math.PI * 2);
    c.fillStyle = t.body; c.fill(); c.strokeStyle = t.bodyDk; c.lineWidth = 2; c.stroke();
    c.font = '20px serif'; c.fillStyle = '#FFFFFF'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText('🦃', x + TURKEY_W / 2, y + TURKEY_H / 2);
  }
  c.restore();
};
gameScene.onTouchStart = function(x, y) {
  if (paused) { paused = false; Snd.click(); return; }
  if (countdownNum !== 0) return;
  if (x >= _pauseBtn.x && x <= _pauseBtn.x + _pauseBtn.w && y >= _pauseBtn.y && y <= _pauseBtn.y + _pauseBtn.h) {
    if (!gameOver) { paused = true; Snd.click(); } return;
  }
  for (var i = 0; i < _propBtns.length; i++) {
    var btn = _propBtns[i];
    if (x >= btn.x && x <= btn.x + btn.w && y >= btn.y && y <= btn.y + btn.h) { this._useProp(btn.id); return; }
  }
  var sorted = turkeys.filter(function(t) { return !t.removed; }).sort(function(a, b) { return b.layer !== a.layer ? b.layer - a.layer : b.y - a.y; });
  for (var j = 0; j < sorted.length; j++) {
    var t = sorted[j];
    if (x >= t.x && x <= t.x + TURKEY_W && y >= t.y && y <= t.y + TURKEY_H) { this._onTurkeyClick(t); return; }
  }
};

// ===== js/scenes/result =====
var _result = null, _resultButtons = [], _resultAnimTime = 0;

var resultScene = new Scene('result');
resultScene.enter = function(params) {
  _result = params || {}; _resultAnimTime = 0;
  var w = Renderer.width, h = Renderer.height;
  var btnW = w * 0.35, btnH = 44, cx = w / 2, popupBottom = h / 2 + 120;
  _resultButtons = [];
  if (_result.win) {
    if (_result.levelId < 10) _resultButtons.push({ id: 'next', text: 'Next Level', x: cx - btnW - 8, y: popupBottom, w: btnW, h: btnH, color: '#4CAF50' });
    _resultButtons.push({ id: 'levels', text: 'Levels', x: cx + 8, y: popupBottom, w: btnW, h: btnH, color: '#1E88E5' });
  } else {
    _resultButtons.push({ id: 'retry', text: 'Retry', x: cx - btnW - 8, y: popupBottom, w: btnW, h: btnH, color: '#FF6B35' });
    _resultButtons.push({ id: 'levels', text: 'Back', x: cx + 8, y: popupBottom, w: btnW, h: btnH, color: '#78909C' });
  }
};
resultScene.exit = function() { _result = null; };
resultScene.update = function(dt) { _resultAnimTime += dt; };
resultScene.render = function(c, w, h) {
  c.fillStyle = 'rgba(0,0,0,0.6)'; c.fillRect(0, 0, w, h);
  var popW = w * 0.8, popH = 280, px = (w - popW) / 2, py = h / 2 - popH / 2 - 20;
  Renderer.drawRoundRect(px, py, popW, popH, 16, 'rgba(26,35,126,0.95)');
  c.save(); c.strokeStyle = '#FFD740'; c.lineWidth = 2; c.beginPath();
  c.moveTo(px + 16, py); c.arcTo(px + popW, py, px + popW, py + popH, 16);
  c.arcTo(px + popW, py + popH, px, py + popH, 16); c.arcTo(px, py + popH, px, py, 16);
  c.arcTo(px, py, px + popW, py, 16); c.closePath(); c.stroke(); c.restore();

  var cx = w / 2;
  if (_result.win) {
    var scale = Math.min(1, _resultAnimTime * 4);
    var bounce = scale < 1 ? scale : 1 + Math.sin(_resultAnimTime * 3) * 0.02;
    c.save(); c.translate(cx, py + popH / 2); c.scale(bounce, bounce); c.translate(-cx, -(py + popH / 2));
    c.save(); c.shadowColor = '#FFD700'; c.shadowBlur = 20;
    c.font = 'bold 32px sans-serif'; c.fillStyle = '#FFD700'; c.textAlign = 'center'; c.textBaseline = 'top';
    c.fillText('🎉 Victory! 🎉', cx, py + 15); c.restore();
    var starY = py + 60;
    for (var si = 0; si < 3; si++) {
      var isFull = si < _result.stars;
      var starDelay = 0.3 + si * 0.2;
      var starScale = _resultAnimTime > starDelay ? Math.min(1.2, (_resultAnimTime - starDelay) * 5) : 0;
      var finalScale = starScale > 1 ? 1 + (1.2 - starScale) * 0.5 : starScale;
      if (finalScale <= 0) continue;
      c.save(); var ssx = cx - 50 + si * 50;
      c.translate(ssx, starY + 15); c.scale(finalScale, finalScale);
      c.font = '36px serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
      if (isFull) { c.shadowColor = '#FFD700'; c.shadowBlur = 10; }
      c.fillText(isFull ? '⭐' : '☆', 0, 0); c.restore();
    }
    c.save(); c.font = 'bold 48px sans-serif'; c.fillStyle = '#FFFFFF'; c.textAlign = 'center'; c.textBaseline = 'top';
    c.shadowColor = 'rgba(255,255,255,0.5)'; c.shadowBlur = 10;
    c.fillText('' + _result.score, cx, py + 105); c.restore();
    c.font = '16px sans-serif'; c.fillStyle = 'rgba(255,255,255,0.7)'; c.textAlign = 'center'; c.textBaseline = 'top';
    c.fillText('Score', cx, py + 155);
    var cardId = Math.min(_result.levelId - 1, 9);
    var turkey = TURKEY_TYPES[cardId];
    if (turkey) {
      c.save(); c.shadowColor = '#FFD700'; c.shadowBlur = 8;
      c.font = 'bold 16px sans-serif'; c.fillStyle = '#FFD700'; c.textAlign = 'center'; c.textBaseline = 'top';
      c.fillText('🏆 Unlocked: ' + turkey.name, cx, py + 185); c.restore();
    }
    c.restore();
  } else {
    var scale2 = Math.min(1, _resultAnimTime * 4);
    c.save(); c.translate(cx, py + popH / 2); c.scale(scale2, scale2); c.translate(-cx, -(py + popH / 2));
    c.save(); c.shadowColor = '#FF5252'; c.shadowBlur = 15;
    c.font = 'bold 32px sans-serif'; c.fillStyle = '#FF5252'; c.textAlign = 'center'; c.textBaseline = 'top';
    c.fillText('😢 Game Over', cx, py + 20); c.restore();
    if (_result.reason) {
      c.font = 'bold 18px sans-serif'; c.fillStyle = '#FFAB91'; c.textAlign = 'center'; c.textBaseline = 'top';
      c.fillText(_result.reason, cx, py + 70);
    }
    if (_result.removed !== undefined && _result.total) {
      var barW = popW * 0.6, barH = 20, barX = cx - barW / 2, barY2 = py + 110;
      var pct = _result.removed / _result.total;
      c.fillStyle = 'rgba(255,255,255,0.15)'; c.beginPath(); c.roundRect(barX, barY2, barW, barH, 10); c.fill();
      c.fillStyle = pct > 0.7 ? '#FFB300' : pct > 0.4 ? '#FF7043' : '#EF5350';
      c.beginPath(); c.roundRect(barX, barY2, barW * pct, barH, 10); c.fill();
      c.font = 'bold 14px sans-serif'; c.fillStyle = '#FFFFFF'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText(_result.removed + ' / ' + _result.total, cx, barY2 + barH / 2);
      c.font = '13px sans-serif'; c.fillStyle = 'rgba(255,255,255,0.6)';
      c.fillText('Try Again! So Close!', cx, barY2 + barH + 20);
    }
    c.restore();
  }
  for (var bi = 0; bi < _resultButtons.length; bi++) {
    var btn = _resultButtons[bi];
    Renderer.drawRoundRect(btn.x, btn.y, btn.w, btn.h, 10, btn.color);
    c.font = 'bold 16px sans-serif'; c.fillStyle = '#FFFFFF'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText(btn.text, btn.x + btn.w / 2, btn.y + btn.h / 2);
  }
};
resultScene.onTouchStart = function(x, y) {
  for (var i = 0; i < _resultButtons.length; i++) {
    var btn = _resultButtons[i];
    if (x >= btn.x && x <= btn.x + btn.w && y >= btn.y && y <= btn.y + btn.h) {
      Snd.click();
      if (btn.id === 'next') SceneManager.switchTo('game', { levelId: _result.levelId + 1 });
      else if (btn.id === 'retry') SceneManager.switchTo('game', { levelId: _result.levelId });
      else if (btn.id === 'levels') SceneManager.switchTo('levelSelect');
      return;
    }
  }
};

// ===== js/scenes/collection =====
var _colBackBtn = null, _colCards = [], _colScrollY = 0, _colMaxScrollY = 0, _colTouchStartY = 0, _colScrollStartY = 0;

var collectionScene = new Scene('collection');
collectionScene.enter = function() { _colScrollY = 0; this._layout(); };
collectionScene.exit = function() {};
collectionScene._layout = function() {
  var w = Renderer.width, h = Renderer.height;
  _colBackBtn = { x: 10, y: 10, w: 44, h: 44 };
  var cols = 2, padding = 16, topOffset = 90, cardGap = 14;
  var gridW = w - padding * 2, cardW = (gridW - cardGap * (cols - 1)) / cols, cardH = 140;
  var collected = Save.d.cards || [];
  _colCards = TURKEY_TYPES.map(function(t, idx) {
    return { turkey: t, x: padding + (idx % cols) * (cardW + cardGap), y: topOffset + Math.floor(idx / cols) * (cardH + cardGap), w: cardW, h: cardH, unlocked: collected.indexOf(t.id) !== -1 };
  });
  var lastCard = _colCards[_colCards.length - 1];
  _colMaxScrollY = Math.max(0, lastCard.y + lastCard.h + 30 - h);
};
collectionScene.render = function(c, w, h) {
  var grad = c.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, '#0D1B2A'); grad.addColorStop(0.5, '#1B2838'); grad.addColorStop(1, '#0D1B2A');
  c.fillStyle = grad; c.fillRect(0, 0, w, h);
  c.font = 'bold 22px sans-serif'; c.fillStyle = '#FFD700'; c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillText('Turkey Album', w / 2, 36);
  c.font = '28px sans-serif'; c.fillStyle = '#FFFFFF'; c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillText('←', _colBackBtn.x + _colBackBtn.w / 2, _colBackBtn.y + _colBackBtn.h / 2);
  var collected = (Save.d.cards || []).length;
  c.font = '14px sans-serif'; c.fillStyle = 'rgba(255,255,255,0.7)'; c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillText(collected + '/10 Collected', w / 2, 62);
  var barW = w * 0.6, barH = 6, barX = (w - barW) / 2, barY = 74;
  Renderer.drawRoundRect(barX, barY, barW, barH, 3, 'rgba(255,255,255,0.1)');
  if (collected > 0) Renderer.drawRoundRect(barX, barY, barW * (collected / 10), barH, 3, '#FFD700');

  c.save(); c.translate(0, -_colScrollY);
  for (var i = 0; i < _colCards.length; i++) {
    var card = _colCards[i], t = card.turkey, r = 12;
    Renderer.drawRoundRect(card.x, card.y, card.w, card.h, r, card.unlocked ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.04)');
    var previewCx = card.x + card.w / 2, previewCy = card.y + 10 + (card.h - 60) / 2;
    if (card.unlocked) {
      // Draw turkey preview
      c.save();
      var tailR = 28;
      for (var ti = -3; ti <= 3; ti++) {
        var angle = -Math.PI / 2 + ti * 0.22;
        c.beginPath(); c.arc(previewCx + Math.cos(angle) * tailR, previewCy + Math.sin(angle) * tailR - 8, 6, 0, Math.PI * 2);
        c.fillStyle = ti % 2 === 0 ? t.tail : t.tailTip; c.fill();
      }
      c.beginPath(); c.ellipse(previewCx, previewCy + 5, 18, 22, 0, 0, Math.PI * 2); c.fillStyle = t.body; c.fill();
      c.beginPath(); c.ellipse(previewCx, previewCy + 12, 12, 14, 0, 0, Math.PI * 2); c.fillStyle = t.bodyDk; c.fill();
      c.beginPath(); c.arc(previewCx, previewCy - 18, 10, 0, Math.PI * 2); c.fillStyle = t.body; c.fill();
      c.beginPath(); c.moveTo(previewCx + 8, previewCy - 18); c.lineTo(previewCx + 16, previewCy - 16); c.lineTo(previewCx + 8, previewCy - 14); c.closePath(); c.fillStyle = '#FF8F00'; c.fill();
      c.beginPath(); c.ellipse(previewCx + 2, previewCy - 10, 3, 5, 0.2, 0, Math.PI * 2); c.fillStyle = '#E53935'; c.fill();
      c.beginPath(); c.arc(previewCx + 3, previewCy - 20, 2.5, 0, Math.PI * 2); c.fillStyle = '#FFFFFF'; c.fill();
      c.beginPath(); c.arc(previewCx + 3.5, previewCy - 20, 1.2, 0, Math.PI * 2); c.fillStyle = '#000000'; c.fill();
      c.restore();
      c.font = 'bold 14px sans-serif'; c.fillStyle = '#FFFFFF'; c.textAlign = 'center'; c.textBaseline = 'top';
      c.fillText(t.name, card.x + card.w / 2, card.y + card.h - 44);
      c.font = '10px sans-serif'; c.fillStyle = 'rgba(255,255,255,0.6)';
      c.fillText(t.desc.length > 12 ? t.desc.substring(0, 12) + '...' : t.desc, card.x + card.w / 2, card.y + card.h - 24);
    } else {
      c.font = '40px serif'; c.fillStyle = 'rgba(255,255,255,0.15)'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText('🦃', previewCx, previewCy);
      c.font = '20px serif'; c.fillStyle = 'rgba(255,255,255,0.3)'; c.fillText('🔒', previewCx, previewCy + 30);
      c.font = 'bold 14px sans-serif'; c.fillStyle = 'rgba(255,255,255,0.3)'; c.textBaseline = 'top';
      c.fillText('???', card.x + card.w / 2, card.y + card.h - 44);
      c.font = '10px sans-serif'; c.fillText('Clear the level to unlock', card.x + card.w / 2, card.y + card.h - 24);
    }
  }
  c.restore();
};
collectionScene.onTouchStart = function(x, y) {
  _colTouchStartY = y; _colScrollStartY = _colScrollY;
  if (x >= _colBackBtn.x && x <= _colBackBtn.x + _colBackBtn.w && y >= _colBackBtn.y && y <= _colBackBtn.y + _colBackBtn.h) {
    Snd.click(); SceneManager.switchTo('home');
  }
};
collectionScene.onTouchMove = function(x, y) {
  _colScrollY = Math.max(0, Math.min(_colMaxScrollY, _colScrollStartY + (_colTouchStartY - y)));
};

// ===== js/scenes/settings =====
var _setBackBtn = null, _setItems = [], _setResetBtn = null, _confirmReset = false, _confirmButtons = [];

var settingsScene = new Scene('settings');
settingsScene.enter = function() { _confirmReset = false; this._layout(); };
settingsScene.exit = function() { _confirmReset = false; };
settingsScene._layout = function() {
  var w = Renderer.width, h = Renderer.height;
  _setBackBtn = { x: 10, y: 10, w: 44, h: 44 };
  var itemW = w * 0.8, itemH = 56, cx = w / 2, startY = 90, gap = 16;
  _setItems = [
    { id: 'sfx', label: '🔊 Sound', key: 'sfx', x: cx - itemW / 2, y: startY, w: itemW, h: itemH },
    { id: 'bgm', label: '🎵 BGM', key: 'bgm', x: cx - itemW / 2, y: startY + itemH + gap, w: itemW, h: itemH },
    { id: 'vibrate', label: '📳 Vibration', key: 'vibrate', x: cx - itemW / 2, y: startY + (itemH + gap) * 2, w: itemW, h: itemH },
  ];
  _setResetBtn = { x: cx - itemW / 2, y: startY + (itemH + gap) * 3 + 20, w: itemW, h: 50 };
  var confirmW = w * 0.3, confirmY = h / 2 + 30;
  _confirmButtons = [
    { id: 'confirmYes', text: 'Confirm Reset', x: cx - confirmW - 10, y: confirmY, w: confirmW, h: 44, color: '#E53935' },
    { id: 'confirmNo', text: 'Cancel', x: cx + 10, y: confirmY, w: confirmW, h: 44, color: '#78909C' },
  ];
};
settingsScene.render = function(c, w, h) {
  var grad = c.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, '#0D1B2A'); grad.addColorStop(0.5, '#1B2838'); grad.addColorStop(1, '#0D1B2A');
  c.fillStyle = grad; c.fillRect(0, 0, w, h);
  c.font = 'bold 22px sans-serif'; c.fillStyle = '#FFD700'; c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillText('Settings', w / 2, 36);
  c.font = '28px sans-serif'; c.fillStyle = '#FFFFFF'; c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillText('←', _setBackBtn.x + _setBackBtn.w / 2, _setBackBtn.y + _setBackBtn.h / 2);

  var settings = Save.d.settings;
  for (var i = 0; i < _setItems.length; i++) {
    var item = _setItems[i], isOn = settings[item.key];
    Renderer.drawRoundRect(item.x, item.y, item.w, item.h, 12, 'rgba(255,255,255,0.08)');
    c.font = '16px sans-serif'; c.fillStyle = '#FFFFFF'; c.textAlign = 'left'; c.textBaseline = 'middle';
    c.fillText(item.label, item.x + 16, item.y + item.h / 2);
    var toggleW = 50, toggleH = 28, toggleX = item.x + item.w - toggleW - 16, toggleY = item.y + (item.h - toggleH) / 2;
    Renderer.drawRoundRect(toggleX, toggleY, toggleW, toggleH, toggleH / 2, isOn ? '#4CAF50' : 'rgba(255,255,255,0.2)');
    var dotR = toggleH / 2 - 3, dotX = isOn ? toggleX + toggleW - dotR - 5 : toggleX + dotR + 5;
    c.beginPath(); c.arc(dotX, toggleY + toggleH / 2, dotR, 0, Math.PI * 2); c.fillStyle = '#FFFFFF'; c.fill();
  }
  Renderer.drawRoundRect(_setResetBtn.x, _setResetBtn.y, _setResetBtn.w, _setResetBtn.h, 12, '#E53935');
  c.font = 'bold 16px sans-serif'; c.fillStyle = '#FFFFFF'; c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillText('🗑️ Reset Data', _setResetBtn.x + _setResetBtn.w / 2, _setResetBtn.y + _setResetBtn.h / 2);
  c.font = '12px sans-serif'; c.fillStyle = 'rgba(255,255,255,0.3)'; c.textAlign = 'center'; c.textBaseline = 'bottom';
  c.fillText('🦃 Catch Turkey v2.0', w / 2, h - 30);

  if (_confirmReset) {
    c.fillStyle = 'rgba(0,0,0,0.7)'; c.fillRect(0, 0, w, h);
    var popW = w * 0.75, popH2 = 160, px = (w - popW) / 2, py = h / 2 - popH2 / 2 - 20;
    Renderer.drawRoundRect(px, py, popW, popH2, 16, 'rgba(26,35,126,0.95)');
    c.font = 'bold 18px sans-serif'; c.fillStyle = '#FF5252'; c.textAlign = 'center'; c.textBaseline = 'top';
    c.fillText('⚠️ Confirm Reset？', w / 2, py + 20);
    c.font = '14px sans-serif'; c.fillStyle = 'rgba(255,255,255,0.7)';
    c.fillText('All progress will be cleared！', w / 2, py + 55);
    for (var bi = 0; bi < _confirmButtons.length; bi++) {
      var btn = _confirmButtons[bi];
      Renderer.drawRoundRect(btn.x, btn.y, btn.w, btn.h, 10, btn.color);
      c.font = 'bold 14px sans-serif'; c.fillStyle = '#FFFFFF'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText(btn.text, btn.x + btn.w / 2, btn.y + btn.h / 2);
    }
  }
};
settingsScene.onTouchStart = function(x, y) {
  if (_confirmReset) {
    for (var i = 0; i < _confirmButtons.length; i++) {
      var btn = _confirmButtons[i];
      if (x >= btn.x && x <= btn.x + btn.w && y >= btn.y && y <= btn.y + btn.h) {
        Snd.click();
        if (btn.id === 'confirmYes') { Save.reset(); _confirmReset = false; }
        else { _confirmReset = false; }
        return;
      }
    }
    _confirmReset = false; return;
  }
  if (x >= _setBackBtn.x && x <= _setBackBtn.x + _setBackBtn.w && y >= _setBackBtn.y && y <= _setBackBtn.y + _setBackBtn.h) {
    Snd.click(); SceneManager.switchTo('home'); return;
  }
  for (var i = 0; i < _setItems.length; i++) {
    var item = _setItems[i];
    if (x >= item.x && x <= item.x + item.w && y >= item.y && y <= item.y + item.h) {
      Snd.click(); Save.d.settings[item.key] = !Save.d.settings[item.key]; Save.save();
      if (item.key === 'bgm') { if (!Save.d.settings.bgm) Snd.stopBgm(); else Snd.startBgm(); }
      return;
    }
  }
  if (x >= _setResetBtn.x && x <= _setResetBtn.x + _setResetBtn.w && y >= _setResetBtn.y && y <= _setResetBtn.y + _setResetBtn.h) {
    Snd.click(); _confirmReset = true;
  }
};

// ===== Boot =====
Save.load();
TouchManager.init();

SceneManager.register('home', homeScene);
SceneManager.register('levelSelect', levelSelectScene);
SceneManager.register('game', gameScene);
SceneManager.register('result', resultScene);
SceneManager.register('collection', collectionScene);
SceneManager.register('settings', settingsScene);

var preloadImages = [
  'images/title_en.png', 'images/bg_farm.png',
  'images/turkey_red.png', 'images/turkey_blue.png', 'images/turkey_golden.png',
  'images/turkey_purple.png', 'images/turkey_orange.png', 'images/turkey_pink.png',
  'images/turkey_green.png', 'images/turkey_rainbow.png',
];

var loaded = 0, total = preloadImages.length;
function onAllLoaded() { SceneManager.switchTo('home'); SceneManager.start(); }
preloadImages.forEach(function(src) {
  Renderer.loadImage(src).then(function() { loaded++; if (loaded >= total) onAllLoaded(); }).catch(function() { loaded++; if (loaded >= total) onAllLoaded(); });
});
if (total === 0) onAllLoaded();

// ===== Expose game state to window =====
window._gameState = {
  get score() { return score; },
  get level() { return level; },
  get timeLeft() { return timeLeft; },
  get gameOver() { return gameOver; },
  get scene() { var s = SceneManager.current(); if(!s)return null; for(var k in SceneManager._scenes){if(SceneManager._scenes[k]===s)return k;} return 'unknown'; },
  get slots() { return slots; },
  get turkeys() { return turkeys; },
  get totalRemoved() { return totalRemoved; },
  get totalTurkeys() { return totalTurkeys; },
  switchScene: function(name, params) { SceneManager.switchTo(name, params); },
  triggerWin: function() { gameScene._onWin(); },
  triggerLose: function(reason) { gameScene._onLose(reason || 'Debug'); },
  getSceneManager: function() { return SceneManager; },
  getSave: function() { return Save; },
};

})();