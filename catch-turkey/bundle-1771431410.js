// ===== wx-adapter.js =====
(function() {
  var _canvasCreated = false;
  var _mainCanvas = null;

  function getCanvas() {
    if (!_mainCanvas) _mainCanvas = document.getElementById('gameCanvas');
    return _mainCanvas;
  }

  function getBestSize() {
    // !! 不能用 body.clientHeight !! body 被 canvas 撑大会形成循环
    // 只用纯 viewport 相关尺寸
    var w = window.innerWidth || document.documentElement.clientWidth || 0;
    var h = window.innerHeight || document.documentElement.clientHeight || 0;
    if (window.visualViewport && window.visualViewport.width > 10) {
      w = Math.max(w, Math.floor(window.visualViewport.width));
      h = Math.max(h, Math.floor(window.visualViewport.height));
    }
    if (w < 200) w = screen.width || 375;
    if (h < 200) h = screen.height || 667;
    return { w: Math.floor(w), h: Math.floor(h) };
  }

  function syncCanvasSize() {
    var c = getCanvas();
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

  window.wx = {
    createCanvas: function() {
      var c = getCanvas();
      if (!_canvasCreated) {
        _canvasCreated = true;
        syncCanvasSize();
        for (var d = 1; d <= 10; d++) setTimeout(syncCanvasSize, d * 200);
        window.addEventListener('resize', function() { syncCanvasSize(); });
        if (window.visualViewport) {
          window.visualViewport.addEventListener('resize', function() { syncCanvasSize(); });
        }
      }
      c.createImage = function() { return new Image(); };
      c.requestAnimationFrame = window.requestAnimationFrame.bind(window);
      return c;
    },

    getSystemInfoSync: function() {
      var sz = getBestSize();
      return { windowWidth: sz.w, windowHeight: sz.h, pixelRatio: window.devicePixelRatio || 1 };
    },

    _syncFrame: function(Renderer) {
      var sz = syncCanvasSize();
      var dpr = window.devicePixelRatio || 1;
      // Always ensure transform is correct (canvas.width changes reset it)
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
    },

    onTouchStart: function(cb) {
      function handle(e) {
        var r = getCanvas().getBoundingClientRect();
        var ts = e.touches ? Array.from(e.touches) : [e];
        cb({ touches: ts.map(function(t) { return { clientX: t.clientX - r.left, clientY: t.clientY - r.top }; }) });
      }
      document.addEventListener('touchstart', function(e) { e.preventDefault(); handle(e); }, { passive: false });
      document.addEventListener('mousedown', handle);
    },

    onTouchMove: function(cb) {
      function handle(e) {
        var r = getCanvas().getBoundingClientRect();
        var ts = e.touches ? Array.from(e.touches) : (e.buttons > 0 ? [e] : []);
        if (ts.length) cb({ touches: ts.map(function(t) { return { clientX: t.clientX - r.left, clientY: t.clientY - r.top }; }) });
      }
      document.addEventListener('touchmove', function(e) { e.preventDefault(); handle(e); }, { passive: false });
      document.addEventListener('mousemove', handle);
    },

    onTouchEnd: function(cb) {
      function handle(e) {
        var r = getCanvas().getBoundingClientRect();
        var ts = e.changedTouches ? Array.from(e.changedTouches) : [e];
        cb({ changedTouches: ts.map(function(t) { return { clientX: t.clientX - r.left, clientY: t.clientY - r.top }; }) });
      }
      document.addEventListener('touchend', function(e) { e.preventDefault(); handle(e); }, { passive: false });
      document.addEventListener('mouseup', handle);
    },

    getStorageSync: function(key) {
      try { var v = localStorage.getItem(key); if (v === null) return ''; try { return JSON.parse(v); } catch(e) { return v; } } catch(e) { return ''; }
    },
    setStorageSync: function(key, val) {
      try { localStorage.setItem(key, typeof val === 'string' ? val : JSON.stringify(val)); } catch(e) {}
    },
    createInnerAudioContext: function() {
      var audio = new Audio();
      return {
        set src(v) { audio.src = v; }, get src() { return audio.src; },
        set loop(v) { audio.loop = v; }, set volume(v) { audio.volume = v; },
        play: function() { try { audio.play(); } catch(e) {} },
        pause: function() { audio.pause(); },
        stop: function() { audio.pause(); audio.currentTime = 0; },
        destroy: function() { audio.src = ''; },
      };
    },
    vibrateShort: function() { if (navigator.vibrate) navigator.vibrate(15); },
  };
})();

// ===== Module System =====
var _modules = {};
var _cache = {};
function _define(name, fn) { _modules[name] = fn; }
function require(name) {
  // Normalize path
  var n = name.replace(/^\.\//, '');
  if (_cache[n]) return _cache[n].exports;
  if (!_modules[n]) {
    console.error('Module not found:', n, 'available:', Object.keys(_modules));
    return {};
  }
  var mod = { exports: {} };
  _cache[n] = mod;
  _modules[n](mod, mod.exports, function localRequire(dep) {
    // Resolve relative paths
    if (dep.startsWith('./') || dep.startsWith('../')) {
      var base = n.split('/');
      base.pop();
      var parts = dep.split('/');
      for (var i = 0; i < parts.length; i++) {
        if (parts[i] === '..') base.pop();
        else if (parts[i] !== '.') base.push(parts[i]);
      }
      dep = base.join('/');
    }
    return require(dep);
  });
  return mod.exports;
}


// ===== js/config.js =====
_define('js/config', function(module, exports, require) {
/**
 * Catch Turkey — 微信小游戏配置常量
 */

const TURKEY_TYPES = [
  { id: 0, name: '红冠Turkey', desc: '大红冠是它的骄傲，热情似火！', body: '#E53935', bodyDk: '#B71C1C', tail: '#FF5722', tailTip: '#FFAB91', accent: '#D32F2F', hi: '#FF8A80' },
  { id: 1, name: '蓝羽Turkey', desc: '优雅蓝色羽毛，翩翩绅士。', body: '#1E88E5', bodyDk: '#0D47A1', tail: '#42A5F5', tailTip: '#90CAF9', accent: '#1565C0', hi: '#82B1FF' },
  { id: 2, name: '金色Turkey', desc: '金光闪闪，尊贵的Turkey贵族。', body: '#FFB300', bodyDk: '#FF8F00', tail: '#FFD54F', tailTip: '#FFF9C4', accent: '#F9A825', hi: '#FFECB3' },
  { id: 3, name: '紫色Turkey', desc: '神秘紫色的魔法Turkey。', body: '#8E24AA', bodyDk: '#4A148C', tail: '#AB47BC', tailTip: '#CE93D8', accent: '#7B1FA2', hi: '#EA80FC' },
  { id: 4, name: '橙色Turkey', desc: '活力满满的快乐Turkey！', body: '#FB8C00', bodyDk: '#E65100', tail: '#FFA726', tailTip: '#FFE0B2', accent: '#EF6C00', hi: '#FFD180' },
  { id: 5, name: '粉色Turkey', desc: '可爱粉色少女心Turkey。', body: '#EC407A', bodyDk: '#AD1457', tail: '#F06292', tailTip: '#F8BBD0', accent: '#C2185B', hi: '#FF80AB' },
  { id: 6, name: '绿色Turkey', desc: '森林守护者，自然之友。', body: '#43A047', bodyDk: '#1B5E20', tail: '#66BB6A', tailTip: '#A5D6A7', accent: '#2E7D32', hi: '#B9F6CA' },
  { id: 7, name: '彩虹Turkey', desc: '稀有彩虹，七色光芒！', body: '#FF6B35', bodyDk: '#E91E63', tail: '#9C27B0', tailTip: '#2196F3', accent: '#4CAF50', hi: '#FFEB3B' },
  { id: 8, name: '白色Turkey', desc: '纯白无瑕的优雅贵妇。', body: '#ECEFF1', bodyDk: '#B0BEC5', tail: '#CFD8DC', tailTip: '#FAFAFA', accent: '#90A4AE', hi: '#FFFFFF' },
  { id: 9, name: '棕色Turkey', desc: '经典传统，朴实老前辈。', body: '#795548', bodyDk: '#3E2723', tail: '#8D6E63', tailTip: '#BCAAA4', accent: '#000', hi: '#D7CCC8' },
];

const LEVELS = [
  { id: 1, name: '🌸 Beginner', count: 18, layers: 2, types: 4, time: 600, theme: 'spring' },
  { id: 2, name: '🌼 Novice', count: 24, layers: 2, types: 5, time: 600, theme: 'spring' },
  { id: 3, name: '🌷 Chaos', count: 30, layers: 3, types: 6, time: 600, theme: 'spring' },
  { id: 4, name: '☀️ Turkey Farm', count: 36, layers: 3, types: 6, time: 600, theme: 'summer' },
  { id: 5, name: '🌻 Jungle', count: 42, layers: 3, types: 7, time: 600, theme: 'summer' },
  { id: 6, name: '🍂 Autumn', count: 45, layers: 4, types: 7, time: 600, theme: 'autumn' },
  { id: 7, name: '🍁 Desert', count: 48, layers: 4, types: 8, time: 600, theme: 'autumn' },
  { id: 8, name: '❄️ Frozen', count: 51, layers: 4, types: 8, time: 600, theme: 'winter' },
  { id: 9, name: '⛄ Volcano', count: 54, layers: 4, types: 9, time: 600, theme: 'winter' },
  { id: 10, name: '🌈 Ultimate', count: 60, layers: 5, types: 10, time: 600, theme: 'rainbow' },
];

const THEMES = {
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

const COMBO_TEXTS = ['Nice!', 'Great!', 'Awesome!', 'Perfect!', 'Amazing!', 'Incredible!', 'LEGENDARY!'];

const SLOT_COUNT = 7;

module.exports = { TURKEY_TYPES, LEVELS, THEMES, COMBO_TEXTS, SLOT_COUNT };

});

// ===== js/renderer.js =====
_define('js/renderer', function(module, exports, require) {
/**
 * Catch Turkey — Canvas 渲染基础框架（微信小游戏）
 */

const { windowWidth, windowHeight, pixelRatio } = wx.getSystemInfoSync();

const DESIGN_WIDTH = 375;
const scale = windowWidth / DESIGN_WIDTH;

const canvas = wx.createCanvas();
// Settings canvas 实际像素尺寸（适配高pts屏）
canvas.width = windowWidth * pixelRatio;
canvas.height = windowHeight * pixelRatio;
const ctx = canvas.getContext('2d');
ctx.scale(pixelRatio, pixelRatio);

const _imgCache = {};

const Renderer = {
  canvas,
  ctx,
  width: windowWidth,
  height: windowHeight,
  dpr: pixelRatio,
  scale,

  loadImage(src) {
    if (_imgCache[src]) return Promise.resolve(_imgCache[src]);
    return new Promise((resolve, reject) => {
      const img = canvas.createImage();
      img.onload = () => {
        _imgCache[src] = img;
        resolve(img);
      };
      img.onerror = reject;
      img.src = src;
    });
  },

  getImage(src) {
    return _imgCache[src] || null;
  },

  drawImage(src, x, y, w, h) {
    const img = _imgCache[src];
    if (!img) return;
    ctx.drawImage(img, x, y, w, h);
  },

  drawText(text, x, y, { font = '16px sans-serif', color = '#000', align = 'left', baseline = 'top' } = {}) {
    ctx.font = font;
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.textBaseline = baseline;
    ctx.fillText(text, x, y);
  },

  drawRect(x, y, w, h, color = '#000') {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
  },

  drawRoundRect(x, y, w, h, r, color = '#000') {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
    ctx.fill();
  },

  clear() {
    ctx.clearRect(0, 0, this.width, this.height);
  },
};

// resize: handled by wx._syncFrame()

/* ========== 触摸事件管理 ========== */
const _touchHandlers = [];

const TouchManager = {
  register(handler) {
    _touchHandlers.push(handler);
  },

  unregister(handler) {
    const idx = _touchHandlers.indexOf(handler);
    if (idx >= 0) _touchHandlers.splice(idx, 1);
  },

  clear() {
    _touchHandlers.length = 0;
  },

  init() {
    wx.onTouchStart((e) => {
      const t = e.touches[0];
      if (!t) return;
      const x = t.clientX;
      const y = t.clientY;
      for (let i = _touchHandlers.length - 1; i >= 0; i--) {
        const h = _touchHandlers[i];
        if (h.hitTest && !h.hitTest(x, y)) continue;
        if (h.onStart) h.onStart(x, y, e);
        break;
      }
    });

    wx.onTouchMove((e) => {
      const t = e.touches[0];
      if (!t) return;
      for (let i = _touchHandlers.length - 1; i >= 0; i--) {
        const h = _touchHandlers[i];
        if (h.onMove) h.onMove(t.clientX, t.clientY, e);
      }
    });

    wx.onTouchEnd((e) => {
      const t = e.changedTouches[0];
      if (!t) return;
      for (let i = _touchHandlers.length - 1; i >= 0; i--) {
        const h = _touchHandlers[i];
        if (h.onEnd) h.onEnd(t.clientX, t.clientY, e);
      }
    });
  },
};

module.exports = { Renderer, TouchManager };

});

// ===== js/save.js =====
_define('js/save', function(module, exports, require) {
/**
 * Catch Turkey — 存档管理模块（微信小游戏适配）
 */

const SAVE_KEY = 'catch_turkey_v2';

let _data = null;

function _defaultData() {
  return {
    maxLevel: 1,
    scores: {},
    stars: {},
    cards: [],
    settings: { sfx: true, bgm: true, vibrate: true },
    totalScore: 0,
    propBonus: { shuffle: 0, remove: 0, complete: 0 },
  };
}

const Save = {
  load() {
    try {
      _data = wx.getStorageSync(SAVE_KEY);
      if (typeof _data === 'string') _data = JSON.parse(_data);
    } catch (e) {
      _data = null;
    }
    if (!_data || typeof _data !== 'object') _data = {};
    const d = _data;
    const def = _defaultData();
    for (const k of Object.keys(def)) {
      if (d[k] === undefined) d[k] = def[k];
    }
    return d;
  },

  save() {
    try {
      wx.setStorageSync(SAVE_KEY, JSON.stringify(_data));
    } catch (e) {
      console.error('Save failed', e);
    }
  },

  get d() {
    return _data || this.load();
  },

  addCard(id) {
    if (!_data.cards.includes(id)) {
      _data.cards.push(id);
      this.save();
    }
  },

  setStars(lv, s) {
    if (!_data.stars[lv] || s > _data.stars[lv]) {
      _data.stars[lv] = s;
      this.save();
    }
  },

  setScore(lv, s) {
    if (!_data.scores[lv] || s > _data.scores[lv]) {
      _data.scores[lv] = s;
      _data.totalScore = Object.values(_data.scores).reduce((a, b) => a + b, 0);
      this.save();
    }
  },

  reset() {
    _data = _defaultData();
    this.save();
  },
};

module.exports = Save;

});

// ===== js/sound.js =====
_define('js/sound', function(module, exports, require) {
/**
 * Catch Turkey — Sound模块（Web Audio API 合成）
 */
const Save = require('./save');

let _ctx = null;
function getCtx() {
  if (!_ctx) {
    try { _ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e) {}
  }
  return _ctx;
}

// 合成Sound：频率序列 + 波形 + 增益包络
function playTones(notes, wave, gain, dur) {
  const ctx = getCtx(); if (!ctx) return;
  const now = ctx.currentTime;
  const g = ctx.createGain();
  g.gain.setValueAtTime(gain, now);
  g.gain.exponentialRampToValueAtTime(0.001, now + dur);
  g.connect(ctx.destination);
  notes.forEach((n, i) => {
    const o = ctx.createOscillator();
    o.type = wave;
    o.frequency.setValueAtTime(n.f, now + (n.t || 0));
    if (n.f2) o.frequency.exponentialRampToValueAtTime(n.f2, now + (n.t || 0) + (n.d || dur));
    o.connect(g);
    o.start(now + (n.t || 0));
    o.stop(now + (n.t || 0) + (n.d || dur));
  });
}

// 噪声爆炸
function playNoise(dur, gain) {
  const ctx = getCtx(); if (!ctx) return;
  const now = ctx.currentTime;
  const bufSize = ctx.sampleRate * dur;
  const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1);
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const g = ctx.createGain();
  g.gain.setValueAtTime(gain, now);
  g.gain.exponentialRampToValueAtTime(0.001, now + dur);
  // 低通滤波让爆炸更有力
  const flt = ctx.createBiquadFilter();
  flt.type = 'lowpass';
  flt.frequency.setValueAtTime(2000, now);
  flt.frequency.exponentialRampToValueAtTime(200, now + dur);
  src.connect(flt); flt.connect(g); g.connect(ctx.destination);
  src.start(now); src.stop(now + dur);
}

// Turkey贱贱的尖叫！
function turkeyScream() {
  const ctx = getCtx(); if (!ctx) return;
  const now = ctx.currentTime;
  // 高频下滑尖叫
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.25, now);
  g.gain.setValueAtTime(0.3, now + 0.05);
  g.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
  g.connect(ctx.destination);
  // 主音：高频锯齿波快速下滑 (像鸡叫)
  const o1 = ctx.createOscillator();
  o1.type = 'sawtooth';
  o1.frequency.setValueAtTime(1800, now);
  o1.frequency.exponentialRampToValueAtTime(600, now + 0.08);
  o1.frequency.setValueAtTime(2200, now + 0.1);
  o1.frequency.exponentialRampToValueAtTime(400, now + 0.3);
  o1.connect(g); o1.start(now); o1.stop(now + 0.35);
  // 泛音
  const o2 = ctx.createOscillator();
  o2.type = 'square';
  o2.frequency.setValueAtTime(2400, now);
  o2.frequency.exponentialRampToValueAtTime(800, now + 0.15);
  o2.frequency.setValueAtTime(2800, now + 0.15);
  o2.frequency.exponentialRampToValueAtTime(500, now + 0.3);
  const g2 = ctx.createGain();
  g2.gain.setValueAtTime(0.08, now);
  g2.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
  o2.connect(g2); g2.connect(ctx.destination);
  o2.start(now); o2.stop(now + 0.35);
}

const Snd = {
  bgmAudio: null,

  click() {
    if (!Save.d.settings.sfx) return;
    playTones([{f:800, f2:600}], 'sine', 0.15, 0.08);
  },
  pickup(typeId) {
    if (!Save.d.settings.sfx) return;
    // 清脆的拾取音 + 轻微Turkey叫
    playTones([{f:500+typeId*80, f2:800+typeId*80}], 'sine', 0.2, 0.12);
    // 小声的"咕"
    const ctx = getCtx(); if (!ctx) return;
    const now = ctx.currentTime;
    const o = ctx.createOscillator();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(600, now + 0.05);
    o.frequency.exponentialRampToValueAtTime(300, now + 0.12);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.06, now + 0.05);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    o.connect(g); g.connect(ctx.destination);
    o.start(now + 0.05); o.stop(now + 0.15);
  },
  drop() {
    if (!Save.d.settings.sfx) return;
    playTones([{f:400, f2:200}], 'sine', 0.15, 0.1);
  },
  match() {
    if (!Save.d.settings.sfx) return;
    // 消除：Turkey尖叫 + 爆炸！
    turkeyScream();
    setTimeout(() => playNoise(0.3, 0.25), 80);
    // 升调Confirm音
    playTones([{f:523, d:0.06}, {f:659, t:0.06, d:0.06}, {f:784, t:0.12, d:0.1}], 'sine', 0.2, 0.25);
  },
  combo(n) {
    if (!Save.d.settings.sfx) return;
    // Combo：更夸张的尖叫 + 多次爆炸
    for (let i = 0; i < Math.min(n, 4); i++) {
      setTimeout(() => turkeyScream(), i * 60);
    }
    setTimeout(() => playNoise(0.5, 0.35), 50);
    // Victory和弦
    playTones([
      {f:523, d:0.08}, {f:659, t:0.08, d:0.08},
      {f:784, t:0.16, d:0.08}, {f:1047, t:0.24, d:0.15}
    ], 'sine', 0.25, 0.4);
  },
  prop() {
    if (!Save.d.settings.sfx) return;
    playTones([{f:800, f2:1200}], 'sine', 0.2, 0.15);
  },
  win() {
    if (!Save.d.settings.sfx) return;
    // Victory大曲
    playTones([
      {f:523, d:0.12}, {f:659, t:0.15, d:0.12},
      {f:784, t:0.3, d:0.12}, {f:1047, t:0.45, d:0.25}
    ], 'sine', 0.3, 0.7);
    setTimeout(() => playNoise(0.15, 0.15), 600);
    setTimeout(() => turkeyScream(), 200);
  },
  lose() {
    if (!Save.d.settings.sfx) return;
    playTones([{f:400, f2:150}], 'sawtooth', 0.2, 0.5);
  },
  tick() {
    if (!Save.d.settings.sfx) return;
    playTones([{f:1000, f2:800}], 'sine', 0.08, 0.03);
  },

  startBgm() {
    if (!Save.d.settings.bgm) return;
    if (this.bgmAudio) return;
    // TODO: 替换为实际 BGM 文件
  },
  stopBgm() {
    if (this.bgmAudio) {
      this.bgmAudio.stop();
      this.bgmAudio.destroy();
      this.bgmAudio = null;
    }
  },
};

module.exports = Snd;

});

// ===== js/particles.js =====
_define('js/particles', function(module, exports, require) {
/**
 * Catch Turkey — 粒子效果系统（微信小游戏 Canvas 版）
 */

const PARTICLE_TYPES = {
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

const POOL_SIZE = 600;
const pool = [];
const active = [];

for (let i = 0; i < POOL_SIZE; i++) {
  pool.push({
    on: false, x: 0, y: 0, vx: 0, vy: 0,
    life: 0, ml: 0, ch: '', sz: 16, g: 0, a: 0, va: 0,
  });
}

// ===== 屏幕特效 =====
let _screenShake = 0;
let _screenFlash = 0;
let _shockwaves = [];

const ScreenFX = {
  shake(intensity = 8) { _screenShake = Math.max(_screenShake, intensity); },
  flash(alpha = 0.6) { _screenFlash = Math.max(_screenFlash, alpha); },
  shockwave(x, y) { _shockwaves.push({ x, y, r: 0, maxR: 250, alpha: 1.0 }); },
  
  update(ctx, w, h) {
    // Shake
    if (_screenShake > 0.5) {
      const dx = (Math.random() - 0.5) * _screenShake * 2;
      const dy = (Math.random() - 0.5) * _screenShake * 2;
      ctx.translate(dx, dy);
      _screenShake *= 0.85;
    } else { _screenShake = 0; }
    
    // Flash
    if (_screenFlash > 0.01) {
      ctx.save();
      ctx.globalAlpha = _screenFlash;
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, w, h);
      ctx.restore();
      _screenFlash *= 0.8;
    }
    
    // 🌊 冲击波特效
    for (let i = _shockwaves.length - 1; i >= 0; i--) {
      const sw = _shockwaves[i];
      sw.r += 12;
      sw.alpha *= 0.9;
      if (sw.alpha < 0.02 || sw.r > sw.maxR) {
        _shockwaves.splice(i, 1);
        continue;
      }
      ctx.save();
      // 外圈金色粗线
      ctx.globalAlpha = sw.alpha;
      ctx.strokeStyle = '#FFD700';
      ctx.lineWidth = 5;
      ctx.shadowColor = '#FFD700';
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(sw.x, sw.y, sw.r, 0, Math.PI * 2);
      ctx.stroke();
      // 中圈橙色
      ctx.shadowBlur = 0;
      ctx.strokeStyle = '#FF6B35';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(sw.x, sw.y, sw.r * 0.7, 0, Math.PI * 2);
      ctx.stroke();
      // 内圈白色
      ctx.globalAlpha = sw.alpha * 0.6;
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(sw.x, sw.y, sw.r * 0.4, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }
};

const Particles = {
  emit(x, y, type, n = 5) {
    const t = PARTICLE_TYPES[type] || PARTICLE_TYPES.star;
    for (let i = 0; i < n; i++) {
      const p = pool.find(p => !p.on);
      if (!p) break;
      const ang = Math.random() * Math.PI * 2;
      const spd = 2 + Math.random() * 5;
      p.on = true;
      p.x = x; p.y = y;
      p.vx = Math.cos(ang) * spd;
      p.vy = Math.sin(ang) * spd - 1;
      p.life = t.life + (Math.random() * 20 | 0);
      p.ml = p.life;
      p.ch = t.ch;
      p.sz = t.sz * (0.8 + Math.random() * 0.4);
      p.g = t.g;
      p.a = Math.random() * 6.28;
      p.va = (Math.random() - 0.5) * 0.1;
      active.push(p);
    }
  },

  burst(x, y, n = 12) {
    const ts = ['star', 'feather', 'confetti', 'heart'];
    for (let i = 0; i < n; i++) {
      this.emit(x, y, ts[i % ts.length], 1);
    }
  },

  fireworks(cx, cy) {
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        const x = cx + (Math.random() - 0.5) * 200;
        const y = cy + (Math.random() - 0.5) * 200;
        this.burst(x, y, 6);
      }, i * 250);
    }
  },

  update(ctx) {
    for (let i = active.length - 1; i >= 0; i--) {
      const p = active[i];
      p.life--;
      if (p.life <= 0) {
        p.on = false;
        active.splice(i, 1);
        continue;
      }
      p.vy += p.g;
      p.x += p.vx;
      p.y += p.vy;
      p.a += p.va;
      p.vx *= 0.98;
      const alpha = p.life / p.ml;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.a);
      ctx.font = p.sz + 'px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(p.ch, 0, 0);
      ctx.restore();
    }
  },

  clear() {
    active.forEach(p => (p.on = false));
    active.length = 0;
  },

  get count() {
    return active.length;
  },
};

module.exports = Particles;

});

// ===== js/scene-manager.js =====
_define('js/scene-manager', function(module, exports, require) {
/**
 * Catch Turkey — 场景管理器（微信小游戏）
 */

const { Renderer, TouchManager } = require('./renderer');
const canvas = Renderer.canvas;

class Scene {
  constructor(name) {
    this.name = name;
  }
  enter(params) {}
  exit() {}
  update(dt) {}
  render(ctx, w, h) {}
  onTouchStart(x, y) {}
  onTouchMove(x, y) {}
  onTouchEnd(x, y) {}
}

const SceneManager = {
  _stack: [],
  _scenes: {},
  _lastTime: 0,
  _running: false,
  _currentTouchHandler: null,

  register(name, scene) {
    this._scenes[name] = scene;
  },

  switchTo(name, params) {
    while (this._stack.length > 0) {
      const old = this._stack.pop();
      old.exit();
    }
    this._pushScene(name, params);
  },

  push(name, params) {
    this._pushScene(name, params);
  },

  pop() {
    if (this._stack.length > 0) {
      const old = this._stack.pop();
      old.exit();
    }
    this._bindTouch();
  },

  current() {
    return this._stack.length > 0 ? this._stack[this._stack.length - 1] : null;
  },

  start() {
    if (this._running) return;
    this._running = true;
    this._lastTime = Date.now();
    this._loop();
  },

  stop() {
    this._running = false;
  },

  _pushScene(name, params) {
    const scene = this._scenes[name];
    if (!scene) {
      console.error('场景未注册:', name);
      return;
    }
    this._stack.push(scene);
    scene._lastParams = params || {};
    scene.enter(params);
    this._bindTouch();
  },

  _bindTouch() {
    if (this._currentTouchHandler) {
      TouchManager.unregister(this._currentTouchHandler);
      this._currentTouchHandler = null;
    }
    const scene = this.current();
    if (!scene) return;

    this._currentTouchHandler = {
      onStart: (x, y, e) => scene.onTouchStart(x, y, e),
      onMove: (x, y, e) => scene.onTouchMove(x, y, e),
      onEnd: (x, y, e) => scene.onTouchEnd(x, y, e),
    };
    TouchManager.register(this._currentTouchHandler);
  },

  _loop() {
    if (!this._running) return;

    if (typeof wx !== "undefined" && wx._syncFrame) wx._syncFrame(Renderer);
    if (Renderer._resized) {
      Renderer._resized = false;
      const cs = this.current();
      if (cs && cs.enter) cs.enter(cs._lastParams || {});
    }

    const now = Date.now();
    const dt = (now - this._lastTime) / 1000;
    this._lastTime = now;

    const scene = this.current();
    if (scene) {
      scene.update(dt);
    }

    const { ctx, width, height } = Renderer;
    Renderer.clear();
    for (const s of this._stack) {
      s.render(ctx, width, height);
    }

    // 微信小游戏优先用 canvas.requestAnimationFrame
    const raf = (typeof canvas !== 'undefined' && canvas.requestAnimationFrame)
      ? canvas.requestAnimationFrame.bind(canvas)
      : requestAnimationFrame;
    raf(() => this._loop());
  },
};

module.exports = { Scene, SceneManager };

});

// ===== js/scenes/home.js =====
_define('js/scenes/home', function(module, exports, require) {
/**
 * Catch Turkey — 首页场景（微信小游戏 Canvas 版）
 */

const { Scene, SceneManager } = require('../scene-manager');
const { Renderer } = require('../renderer');
const Snd = require('../sound');

let buttons = [];
let _bgLoaded = false;
let _titleLoaded = false;
let _animTime = 0;

const fallingItems = [];
const FALL_EMOJIS = ['🪶', '🍃', '🍂', '🌿', '✨', '🌸'];

class HomeScene extends Scene {
  constructor() {
    super('home');
  }

  enter() {
    _animTime = 0;
    fallingItems.length = 0;
    this._initButtons();
    Renderer.loadImage('images/title_cn.png').then(() => { _titleLoaded = true; });
    Renderer.loadImage('images/bg_farm.png').then(() => { _bgLoaded = true; });
  }

  exit() {
    fallingItems.length = 0;
  }

  _initButtons() {
    const w = Renderer.width;
    const h = Renderer.height;
    const btnW = w * 0.55;
    const btnH = 50;
    const cx = w / 2;
    const startY = h * 0.55;
    const gap = 70;

    buttons = [
      { id: 'start', text: 'Start Game', x: cx - btnW / 2, y: startY, w: btnW, h: btnH, color: '#FF6B35' },
      { id: 'collection', text: 'Turkey Album', x: cx - btnW / 2, y: startY + gap, w: btnW, h: btnH, color: '#1E88E5' },
      { id: 'settings', text: 'Settings', x: cx - btnW / 2, y: startY + gap * 2, w: btnW, h: btnH, color: '#78909C' },
    ];
  }

  update(dt) {
    _animTime += dt;
    if (Math.random() < dt * 1.5 && fallingItems.length < 20) {
      fallingItems.push({
        emoji: FALL_EMOJIS[Math.floor(Math.random() * FALL_EMOJIS.length)],
        x: Math.random() * Renderer.width, y: -20,
        vy: 30 + Math.random() * 40, vx: (Math.random() - 0.5) * 20,
        rot: Math.random() * 6.28, rotV: (Math.random() - 0.5) * 2,
        size: 12 + Math.random() * 14, alpha: 0.4 + Math.random() * 0.4,
      });
    }
    for (let i = fallingItems.length - 1; i >= 0; i--) {
      const f = fallingItems[i];
      f.y += f.vy * dt; f.x += f.vx * dt; f.rot += f.rotV * dt;
      if (f.y > Renderer.height + 30) fallingItems.splice(i, 1);
    }
  }

  render(ctx, w, h) {
    this._drawBackground(ctx, w, h);

    for (const f of fallingItems) {
      ctx.save();
      ctx.globalAlpha = f.alpha;
      ctx.translate(f.x, f.y);
      ctx.rotate(f.rot);
      ctx.font = f.size + 'px serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(f.emoji, 0, 0);
      ctx.restore();
    }

    this._drawTitle(ctx, w, h);

    for (const btn of buttons) {
      this._drawButton(ctx, btn);
    }

    ctx.font = '12px sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
    ctx.fillText('Catch Turkey v2.0 微信小游戏版', w / 2, h - 20);
  }

  _drawBackground(ctx, w, h) {
    if (_bgLoaded) {
      Renderer.drawImage('images/bg_farm.png', 0, 0, w, h);
    } else {
      const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.6);
      skyGrad.addColorStop(0, '#87CEEB');
      skyGrad.addColorStop(0.6, '#A8D8EA');
      skyGrad.addColorStop(1, '#C5E8B7');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, w, h * 0.6);

      const groundGrad = ctx.createLinearGradient(0, h * 0.6, 0, h);
      groundGrad.addColorStop(0, '#5BA55B');
      groundGrad.addColorStop(0.5, '#4a8c2a');
      groundGrad.addColorStop(1, '#2d5a1e');
      ctx.fillStyle = groundGrad;
      ctx.fillRect(0, h * 0.6, w, h * 0.4);
    }
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.fillRect(0, 0, w, h);
  }

  _drawTitle(ctx, w, h) {
    const titleY = h * 0.12;
    const titleH = h * 0.22;
    const titleW = w * 0.8;
    const titleX = (w - titleW) / 2;

    if (_titleLoaded) {
      Renderer.drawImage('images/title_cn.png', titleX, titleY, titleW, titleH);
    } else {
      ctx.save();
      ctx.font = 'bold 48px sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.fillText('🦃 Catch Turkey', w / 2 + 2, titleY + titleH / 2 + 2);
      ctx.fillStyle = '#FFD700';
      ctx.fillText('🦃 Catch Turkey', w / 2, titleY + titleH / 2);
      ctx.restore();
    }

    const subY = titleY + titleH + 10 + Math.sin(_animTime * 2) * 3;
    ctx.font = 'bold 16px sans-serif';
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillText('🌟 Fun Match-3 Game! 🌟', w / 2, subY);
  }

  _drawButton(ctx, btn) {
    const r = 14;
    Renderer.drawRoundRect(btn.x + 2, btn.y + 3, btn.w, btn.h, r, 'rgba(0,0,0,0.3)');
    Renderer.drawRoundRect(btn.x, btn.y, btn.w, btn.h, r, btn.color);
    ctx.save();
    ctx.globalAlpha = 0.25;
    Renderer.drawRoundRect(btn.x + 2, btn.y + 2, btn.w - 4, btn.h / 2, r, '#FFFFFF');
    ctx.restore();
    ctx.font = 'bold 20px sans-serif';
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(btn.text, btn.x + btn.w / 2, btn.y + btn.h / 2);
  }

  onTouchStart(x, y) {
    for (const btn of buttons) {
      if (x >= btn.x && x <= btn.x + btn.w && y >= btn.y && y <= btn.y + btn.h) {
        Snd.click();
        switch (btn.id) {
          case 'start':
            SceneManager.switchTo('levelSelect');
            break;
          case 'collection':
            SceneManager.switchTo('collection');
            break;
          case 'settings':
            SceneManager.switchTo('settings');
            break;
        }
        return;
      }
    }
  }
}

module.exports = new HomeScene();

});

// ===== js/scenes/level-select.js =====
_define('js/scenes/level-select', function(module, exports, require) {
/**
 * Catch Turkey — Level选择场景（微信小游戏 Canvas 版）
 */

const { Scene, SceneManager } = require('../scene-manager');
const { Renderer } = require('../renderer');
const { LEVELS } = require('../config');
const Save = require('../save');
const Snd = require('../sound');

let _cards = [];
let _backBtn = null;
let _scrollY = 0;
let _maxScrollY = 0;
let _touchStartY = 0;
let _scrollStartY = 0;

class LevelSelectScene extends Scene {
  constructor() {
    super('levelSelect');
  }

  enter() {
    _scrollY = 0;
    this._layoutCards();
  }

  exit() {}

  _layoutCards() {
    const w = Renderer.width;
    const h = Renderer.height;

    _backBtn = { x: 10, y: 10, w: 44, h: 44 };

    const cols = 2;
    const padding = 16;
    const topOffset = 70;
    const cardGap = 12;
    const gridW = w - padding * 2;
    const cardW = (gridW - cardGap * (cols - 1)) / cols;
    const cardH = 72;
    const gridStartY = topOffset + 10;

    _cards = LEVELS.map((lv, idx) => {
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      const x = padding + col * (cardW + cardGap);
      const y = gridStartY + row * (cardH + cardGap);
      const unlocked = lv.id <= Save.d.maxLevel;
      const stars = Save.d.stars[lv.id] || 0;
      const isCurrent = lv.id === Save.d.maxLevel;
      return { lv, x, y, w: cardW, h: cardH, unlocked, stars, isCurrent };
    });

    const lastCard = _cards[_cards.length - 1];
    const contentH = lastCard.y + lastCard.h + 20;
    _maxScrollY = Math.max(0, contentH - h);
  }

  update(dt) {}

  render(ctx, w, h) {
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#1a1a3e');
    grad.addColorStop(0.5, '#2d1b69');
    grad.addColorStop(1, '#4A148C');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    ctx.font = 'bold 22px sans-serif';
    ctx.fillStyle = '#FFD700';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('Select Level', w / 2, 36);

    ctx.font = '28px sans-serif';
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('←', _backBtn.x + _backBtn.w / 2, _backBtn.y + _backBtn.h / 2);

    ctx.save();
    ctx.translate(0, -_scrollY);
    for (const card of _cards) {
      this._drawCard(ctx, card);
    }
    ctx.restore();
  }

  _drawCard(ctx, card) {
    const { lv, x, y, w: cw, h: ch, unlocked, stars, isCurrent } = card;
    const r = 12;

    if (unlocked) {
      const bgColor = isCurrent ? '#FF6B35' : '#283593';
      Renderer.drawRoundRect(x, y, cw, ch, r, bgColor);

      if (isCurrent) {
        ctx.save();
        ctx.strokeStyle = '#FFD740';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + cw, y, x + cw, y + ch, r);
        ctx.arcTo(x + cw, y + ch, x, y + ch, r);
        ctx.arcTo(x, y + ch, x, y, r);
        ctx.arcTo(x, y, x + cw, y, r);
        ctx.closePath();
        ctx.stroke();
        ctx.restore();
      }

      ctx.font = 'bold 28px sans-serif';
      ctx.fillStyle = '#FFD700';
      ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillText(lv.id, x + 14, y + ch / 2 - 8);

      ctx.font = '14px sans-serif';
      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'left';
      ctx.fillText(lv.name, x + 46, y + ch / 2 - 10);

      const starStr = '⭐'.repeat(stars) + '☆'.repeat(3 - stars);
      ctx.font = '14px serif';
      ctx.fillStyle = '#FFD700';
      ctx.textAlign = 'left';
      ctx.fillText(starStr, x + 46, y + ch / 2 + 12);
    } else {
      Renderer.drawRoundRect(x, y, cw, ch, r, 'rgba(255,255,255,0.08)');
      ctx.font = '28px serif';
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('🔒', x + 26, y + ch / 2);
      ctx.font = '14px sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.textAlign = 'left';
      ctx.fillText(lv.name, x + 46, y + ch / 2);
    }
  }

  onTouchStart(x, y) {
    _touchStartY = y;
    _scrollStartY = _scrollY;

    if (x >= _backBtn.x && x <= _backBtn.x + _backBtn.w &&
        y >= _backBtn.y && y <= _backBtn.y + _backBtn.h) {
      Snd.click();
      SceneManager.switchTo('home');
      return;
    }

    const adjY = y + _scrollY;
    for (const card of _cards) {
      if (card.unlocked &&
          x >= card.x && x <= card.x + card.w &&
          adjY >= card.y && adjY <= card.y + card.h) {
        Snd.click();
        SceneManager.switchTo('game', { levelId: card.lv.id });
        return;
      }
    }
  }

  onTouchMove(x, y) {
    const dy = _touchStartY - y;
    _scrollY = Math.max(0, Math.min(_maxScrollY, _scrollStartY + dy));
  }
}

module.exports = new LevelSelectScene();

});

// ===== js/scenes/game.js =====
_define('js/scenes/game', function(module, exports, require) {
/**
 * Catch Turkey — 核心游戏场景（微信小游戏 Canvas 版）
 * 包含：Turkey生成、层叠遮挡、Tap to Pick、槽位管理、三消匹配、
 *       计ptsCombo、Time、Level胜负判定、Item系统
 */

const { Scene, SceneManager } = require('../scene-manager');
const { Renderer } = require('../renderer');
const { LEVELS, TURKEY_TYPES, THEMES, COMBO_TEXTS, SLOT_COUNT } = require('../config');
const Save = require('../save');
const Snd = require('../sound');
const Particles = require('../particles');

// ========== Turkey图片映射 ==========
const TURKEY_IMG_MAP = [
  'images/turkey_red.png',     // 0 红冠
  'images/turkey_blue.png',    // 1 蓝羽
  'images/turkey_golden.png',  // 2 金色
  'images/turkey_purple.png',  // 3 紫色
  'images/turkey_orange.png',  // 4 橙色
  'images/turkey_pink.png',    // 5 粉色
  'images/turkey_green.png',   // 6 绿色
  'images/turkey_rainbow.png', // 7 彩虹
  'images/turkey_white.png',   // 8 白色
  'images/turkey_black.png',   // 9 棕色/黑色
];

// ========== 游戏常量 ==========
const TURKEY_W = 80;   // Turkey绘制宽度
const TURKEY_H = 85;   // Turkey绘制高度
const SLOT_W = 50;     // 槽位宽度
const SLOT_H = 56;     // 槽位高度
const SLOT_GAP = 4;    // 槽位间距
const SLOT_BAR_H = 80; // 槽位栏高度

// ========== 游戏状态 ==========
let level = null;       // 当前Level配置
let turkeys = [];       // All Turkeys {id, typeId, x, y, layer, removed, blocked}
let slots = [];         // 槽位 [{typeId}]
let score = 0;
let combo = 0;
let comboTimer = null;
let timeLeft = 0;
let timerInterval = null;
let gameOver = false;
let paused = false;
let animating = false;
let _matchAnimating = false;
let totalRemoved = 0;
let totalTurkeys = 0;
let theme = null;

// Item
let props = { shuffle: 3, remove: 3, complete: 3 };

// 动画状态
let comboText = '';
let comboAlpha = 0;
let comboScale = 1;
let scoreFloats = [];  // [{x, y, text, alpha, vy}]
let countdownNum = 0;  // Time数字（3,2,1,GO）
let countdownAlpha = 0;
let _countdownCb = null;

// 飞行动画
let flyingTurkey = null; // legacy single ref (kept for compat)
let flyingTurkeys = []; // support multiple simultaneous flying turkeys

// HUD布局
let _hudY = 0;
let _slotBarY = 0;
let _gameAreaY = 0;
let _gameAreaH = 0;
let _propBtns = [];
let _pauseBtn = null;

// ========== 工具函数 ==========

/** 打乱数组 */
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** 绘制圆角矩形路径 */
function roundRectPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

class GameScene extends Scene {
  constructor() {
    super('game');
  }

  enter(params) {
    const lvId = params ? params.levelId : 1;
    level = LEVELS.find(l => l.id === lvId);
    if (!level) level = LEVELS[0];
    theme = THEMES[level.theme] || THEMES.spring;

    // 重置状态
    score = 0;
    combo = 0;
    totalRemoved = 0;
    gameOver = false;
    paused = false;
    animating = false;
    slots = [];
    turkeys = [];
    scoreFloats = [];
    flyingTurkey = null;
    flyingTurkeys = [];
    _matchAnimating = false;
    comboText = '';
    comboAlpha = 0;
    props = {
      shuffle: 3 + (Save.d.propBonus.shuffle || 0),
      remove: 3 + (Save.d.propBonus.remove || 0),
      complete: 3 + (Save.d.propBonus.complete || 0),
    };
    timeLeft = level.time;

    // 计算布局
    this._calcLayout();

    // 预加载Turkey图片
    const loadPromises = [];
    for (let i = 0; i < level.types; i++) {
      loadPromises.push(Renderer.loadImage(TURKEY_IMG_MAP[i]));
    }

    // 生成Turkey
    this._generateTurkeys();

    // 开始Time
    this._startCountdown(() => {
      this._startTimer();
    });

    Snd.startBgm();
  }

  exit() {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
    if (comboTimer) {
      clearTimeout(comboTimer);
      comboTimer = null;
    }
    Snd.stopBgm();
    Particles.clear();
  }

  // ========== 布局计算 ==========
  _calcLayout() {
    const w = Renderer.width;
    const h = Renderer.height;

    _hudY = 0;
    const hudH = 50;
    _slotBarY = h - SLOT_BAR_H;
    _gameAreaY = hudH;
    _gameAreaH = _slotBarY - hudH;

    // Pause按钮
    _pauseBtn = { x: w - 50, y: 8, w: 36, h: 36 };

    // Item按钮（槽位栏上方）
    const propY = _slotBarY - 50;
    const propW = 44;
    const propGap = 16;
    const propTotalW = propW * 3 + propGap * 2;
    const propStartX = (w - propTotalW) / 2;
    _propBtns = [
      { id: 'shuffle', emoji: '🔀', x: propStartX, y: propY, w: propW, h: propW },
      { id: 'remove', emoji: '↩️', x: propStartX + propW + propGap, y: propY, w: propW, h: propW },
      { id: 'complete', emoji: '✨', x: propStartX + (propW + propGap) * 2, y: propY, w: propW, h: propW },
    ];
  }

  // ========== Turkey生成 ==========
  _generateTurkeys() {
    const lv = level;
    turkeys = [];

    // 生成类型pts配（每种类型数量能被3整除）
    const turkeyList = [];
    const totalGroups = Math.floor(lv.count / 3);
    const groupsPerType = Math.floor(totalGroups / lv.types);
    let extraGroups = totalGroups - groupsPerType * lv.types;
    for (let i = 0; i < lv.types; i++) {
      const groups = groupsPerType + (i < extraGroups ? 1 : 0);
      for (let j = 0; j < groups * 3; j++) {
        turkeyList.push(i);
      }
    }
    totalTurkeys = turkeyList.length;

    // Shuffle
    shuffle(turkeyList);

    // 可解性检查：确保每种类型在顶层至少有1只
    const perLayer = Math.ceil(turkeyList.length / lv.layers);
    const topStart = (lv.layers - 1) * perLayer;
    const topSlice = turkeyList.slice(topStart);
    const topTypes = new Set(topSlice);
    for (let tid = 0; tid < lv.types; tid++) {
      if (!topTypes.has(tid)) {
        const lowerIdx = turkeyList.findIndex((v, i) => v === tid && i < topStart);
        if (lowerIdx >= 0 && topStart < turkeyList.length) {
          const swapIdx = topStart + Math.floor(Math.random() * (turkeyList.length - topStart));
          if (swapIdx < turkeyList.length) {
            [turkeyList[lowerIdx], turkeyList[swapIdx]] = [turkeyList[swapIdx], turkeyList[lowerIdx]];
          }
        }
      }
    }

    // 布局：六角网格+层偏移
    const w = Renderer.width;
    const areaW = w - 20;
    const areaH = _gameAreaH - 60; // 留出Item区空间
    const tw = TURKEY_W * 0.68;
    const th = TURKEY_H * 0.6;
    const cols = Math.max(4, Math.min(7, Math.ceil(Math.sqrt(perLayer * 1.5))));
    const cellW = tw;
    const cellH = th;
    const gridW = cols * cellW;
    const rows = Math.ceil(perLayer / cols);
    const gridH = rows * cellH;
    const baseX = (areaW - gridW) / 2 + 10;
    const baseY = _gameAreaY + (areaH - gridH) / 2;

    let idx = 0;
    for (let layer = 0; layer < lv.layers; layer++) {
      const layerStart = layer * perLayer;
      const layerEnd = Math.min(layerStart + perLayer, turkeyList.length);
      const layerOff = layer * TURKEY_W * 0.25;
      for (let i = layerStart; i < layerEnd; i++) {
        const li = i - layerStart;
        const row = Math.floor(li / cols);
        const col = li % cols;
        const hexOff = (row % 2) ? cellW * 0.5 : 0;
        const x = baseX + col * cellW + hexOff + layerOff + (Math.random() * 10 - 5);
        const y = baseY + row * cellH + layerOff + (Math.random() * 8 - 4);
        turkeys.push({
          id: idx++,
          typeId: turkeyList[i],
          x: Math.max(2, Math.min(x, w - TURKEY_W - 2)),
          y: Math.max(_gameAreaY + 2, Math.min(y, _slotBarY - TURKEY_H - 60)),
          layer: layer,
          removed: false,
          blocked: false,
        });
      }
    }

    this._updateBlocked();
  }

  // ========== 遮挡计算 ==========
  _updateBlocked() {
    for (const t of turkeys) {
      if (t.removed) { t.blocked = false; continue; }
      t.blocked = false;
      for (const other of turkeys) {
        if (other.removed || other.layer <= t.layer || other.id === t.id) continue;
        const dx = Math.abs(t.x - other.x);
        const dy = Math.abs(t.y - other.y);
        if (dx < TURKEY_W * 0.55 && dy < TURKEY_H * 0.55) {
          t.blocked = true;
          break;
        }
      }
    }
  }

  // ========== Time ==========
  _startCountdown(cb) {
    _countdownCb = cb;
    countdownNum = 3;
    countdownAlpha = 1;
    const tick = () => {
      if (countdownNum > 0) {
        countdownAlpha = 1;
        setTimeout(() => {
          countdownNum--;
          if (countdownNum > 0) {
            tick();
          } else {
            // 显示 GO!
            countdownNum = -1; // 特殊值表示GO
            countdownAlpha = 1;
            setTimeout(() => {
              countdownNum = 0;
              countdownAlpha = 0;
              if (_countdownCb) _countdownCb();
            }, 600);
          }
        }, 800);
      }
    };
    tick();
  }

  // ========== 计时器 ==========
  _startTimer() {
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      if (paused || gameOver) return;
      timeLeft--;
      if (timeLeft <= 10 && timeLeft > 0) Snd.tick();
      if (timeLeft <= 0) {
        clearInterval(timerInterval);
        timerInterval = null;
        this._onLose('Time Up!');
      }
    }, 1000);
  }

  // ========== Turkey点击 ==========
  _onTurkeyClick(turkey) {
    if (paused || gameOver || _matchAnimating || turkey.removed) return;

    // 被遮挡的Turkey不能点
    if (turkey.blocked) {
      // Vibration
      if (Save.d.settings.vibrate) {
        wx.vibrateShort({ type: 'light' });
      }
      return;
    }

    // Slots Full!
    if (slots.length >= SLOT_COUNT) return;

    Snd.pickup(turkey.typeId);
    if (Save.d.settings.vibrate) {
      wx.vibrateShort({ type: 'light' });
    }

    turkey.removed = true;

    // 找到插入位置（相同类型相邻）
    let insertIdx = slots.length;
    for (let i = 0; i < slots.length; i++) {
      if (slots[i].typeId === turkey.typeId) {
        let lastSame = i;
        while (lastSame + 1 < slots.length && slots[lastSame + 1].typeId === turkey.typeId) lastSame++;
        insertIdx = lastSame + 1;
        break;
      }
    }
    slots.splice(insertIdx, 0, { typeId: turkey.typeId });

    // 飞行动画
    const w = Renderer.width;
    const slotTotalW = SLOT_COUNT * (SLOT_W + SLOT_GAP) - SLOT_GAP;
    const slotStartX = (w - slotTotalW) / 2;
    const endX = slotStartX + insertIdx * (SLOT_W + SLOT_GAP) + SLOT_W / 2;
    const endY = _slotBarY + SLOT_BAR_H / 2;
    const startX = turkey.x + TURKEY_W / 2;
    const startY = turkey.y + TURKEY_H / 2;
    const cpx = (startX + endX) / 2;
    const cpy = Math.min(startY, endY) - 120;

    flyingTurkey = {
      typeId: turkey.typeId,
      x: startX, y: startY,
      startX, startY, endX, endY,
      cpx, cpy,
      t: 0, dur: 0.4,
    };
    flyingTurkeys.push(flyingTurkey);
    animating = true;

    // 发射粒子
    Particles.emit(startX, startY, 'sparkle', 2);

    this._updateBlocked();
  }

  // ========== 匹配检查 ==========
  _checkMatch() {
    for (let i = 0; i <= slots.length - 3; i++) {
      if (slots[i].typeId === slots[i + 1].typeId && slots[i + 1].typeId === slots[i + 2].typeId) {
        const typeId = slots[i].typeId;
        animating = true;
        _matchAnimating = true;

        setTimeout(() => {
          Snd.match();
          slots.splice(i, 3);
          totalRemoved += 3;
          score += 100;

          // Combo
          combo++;
          if (comboTimer) clearTimeout(comboTimer);
          comboTimer = setTimeout(() => { combo = 0; }, 3000);
          if (combo > 1) {
            Snd.combo(combo);
            score += combo * 20;
            this._showCombo(combo);
          }

          // 🔥🔥🔥 超级爆炸消除特效！！！
          const w = Renderer.width;
          const slotTotalW = SLOT_COUNT * (SLOT_W + SLOT_GAP) - SLOT_GAP;
          const slotStartX = (w - slotTotalW) / 2;
          const cx = slotStartX + (i + 1) * (SLOT_W + SLOT_GAP);
          const cy = _slotBarY + SLOT_BAR_H / 2;
          
          // 超大量粒子从中心爆炸
          Particles.burst(cx, cy, 30);
          Particles.emit(cx, cy, 'fire', 12);
          Particles.emit(cx, cy, 'boom', 5);
          Particles.emit(cx, cy, 'lightning', 8);
          Particles.emit(cx, cy, 'ring', 5);
          Particles.emit(cx, cy, 'sparkle', 10);
          Particles.emit(cx, cy, 'confetti', 8);
          Particles.emit(cx, cy, 'heart', 4);
          
          // 多个位置同时爆炸
          for (let ei = 0; ei < 3; ei++) {
            const ox = cx + (Math.random() - 0.5) * 120;
            const oy = cy + (Math.random() - 0.5) * 80;
            Particles.burst(ox, oy, 10);
            Particles.emit(ox, oy, 'fire', 4);
          }
          
          // 强烈Screen Shake + 闪光 + 多重冲击波
          if (typeof ScreenFX !== 'undefined') {
            ScreenFX.shake(combo > 2 ? 20 : combo > 1 ? 15 : 12);
            ScreenFX.flash(combo > 2 ? 0.7 : combo > 1 ? 0.5 : 0.4);
            ScreenFX.shockwave(cx, cy);
            // 延迟第二波冲击
            setTimeout(() => {
              if (typeof ScreenFX !== 'undefined') {
                ScreenFX.shockwave(cx + (Math.random()-0.5)*60, cy + (Math.random()-0.5)*40);
              }
            }, 100);
          }
          
          // Combo时全屏粒子风暴
          if (combo > 1) {
            for (let ci = 0; ci < combo * 4; ci++) {
              const rx = Math.random() * w;
              const ry = cy + (Math.random() - 0.5) * 200;
              const types = ['star', 'confetti', 'fire', 'lightning', 'heart'];
              Particles.emit(rx, ry, types[ci % types.length], 1);
            }
          }

          // Score飘字（大号+多方向散射）
          const pts = 100 + (combo > 1 ? combo * 20 : 0);
          scoreFloats.push({
            x: cx, y: cy - 20,
            text: '+' + pts + (combo > 2 ? ' 🔥' : combo > 1 ? ' ✨' : ''),
            alpha: 1, vy: -80,
            scale: combo > 2 ? 1.5 : 1,
          });
          // 额外散射飘字
          if (combo > 1) {
            for (let si = 0; si < Math.min(combo, 5); si++) {
              scoreFloats.push({
                x: cx + (Math.random() - 0.5) * 80,
                y: cy - 10 - Math.random() * 30,
                text: ['🎉','🌟','💥','✨','🎊'][si % 5],
                alpha: 1, vy: -40 - Math.random() * 40,
              });
            }
          }

          // 震动
          if (Save.d.settings.vibrate) {
            wx.vibrateShort({ type: combo > 2 ? 'heavy' : 'medium' });
          }

          animating = false; _matchAnimating = false;

          // 判定Victory
          if (totalRemoved >= totalTurkeys) {
            this._onWin();
          } else {
            // 递归检查连锁消除
            this._checkMatch();
          }
        }, 500);
        return true;
      }
    }

    // 无匹配 - 检查Game Over
    if (!gameOver) {
      if (slots.length >= SLOT_COUNT) {
        if (Save.d.settings.vibrate) wx.vibrateLong();
        setTimeout(() => { if (!gameOver) this._onLose('Slots Full!'); }, 300);
      }
      const remaining = turkeys.filter(t => !t.removed);
      if (remaining.length === 0 && slots.length > 0 && totalRemoved < totalTurkeys) {
        setTimeout(() => { if (!gameOver) this._onLose('No more turkeys!'); }, 500);
      }
    }
    return false;
  }

  // ========== Combo显示 ==========
  _showCombo(n) {
    const text = COMBO_TEXTS[Math.min(n - 2, COMBO_TEXTS.length - 1)];
    comboText = text + ' x' + n;
    comboAlpha = 1;
    comboScale = 1.5;
  }

  // ========== Item系统 ==========
  _useProp(type) {
    if (paused || gameOver || animating) return;
    if (props[type] <= 0) return;
    props[type]--;
    Snd.prop();
    if (Save.d.settings.vibrate) wx.vibrateShort({ type: 'medium' });

    switch (type) {
      case 'shuffle': this._propShuffle(); break;
      case 'remove': this._propRemove(); break;
      case 'complete': this._propComplete(); break;
    }
  }

  /** ShuffleItem */
  _propShuffle() {
    const active = turkeys.filter(t => !t.removed);
    const positions = active.map(t => ({ x: t.x, y: t.y, layer: t.layer }));
    shuffle(positions);
    active.forEach((t, idx) => {
      t.x = positions[idx].x;
      t.y = positions[idx].y;
      t.layer = positions[idx].layer;
    });
    Particles.burst(Renderer.width / 2, Renderer.height / 2, 8);
    this._updateBlocked();
  }

  /** UndoItem */
  _propRemove() {
    if (slots.length === 0) return;
    const count = Math.min(3, slots.length);
    const removed = slots.splice(slots.length - count, count);
    removed.forEach(s => {
      const t = turkeys.find(t => t.removed && t.typeId === s.typeId);
      if (t) t.removed = false;
    });
    this._updateBlocked();
  }

  /** 自动完成Item */
  _propComplete() {
    if (slots.length === 0) return;
    const counts = {};
    slots.forEach(s => { counts[s.typeId] = (counts[s.typeId] || 0) + 1; });
    let bestType = -1, bestCount = 0;
    Object.entries(counts).forEach(([tid, cnt]) => {
      if (cnt > bestCount && cnt < 3) { bestCount = cnt; bestType = parseInt(tid); }
    });
    if (bestType === -1) return;

    const needed = 3 - bestCount;
    for (let i = 0; i < needed; i++) {
      const t = turkeys.find(t => !t.removed && t.typeId === bestType);
      if (t) {
        t.removed = true;
        let insertIdx = slots.length;
        for (let j = 0; j < slots.length; j++) {
          if (slots[j].typeId === bestType) {
            let last = j;
            while (last + 1 < slots.length && slots[last + 1].typeId === bestType) last++;
            insertIdx = last + 1;
            break;
          }
        }
        slots.splice(insertIdx, 0, { typeId: bestType });
      }
    }
    this._updateBlocked();
    const cx = Renderer.width / 2;
    Particles.burst(cx, _slotBarY, 5);
    setTimeout(() => this._checkMatch(), 300);
  }

  // ========== Victory ==========
  _onWin() {
    if (gameOver) return;
    gameOver = true;
    if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
    Snd.stopBgm();
    Snd.win();

    // 计算Stars
    const timePercent = timeLeft / level.time;
    let stars = 1;
    if (timePercent > 0.5) stars = 2;
    if (timePercent > 0.7) stars = 3;

    // 保存进度
    Save.setStars(level.id, stars);
    Save.setScore(level.id, score);
    if (level.id >= Save.d.maxLevel && level.id < 10) {
      Save.d.maxLevel = level.id + 1;
      Save.save();
    }
    Save.addCard(Math.min(level.id - 1, 9));

    // 粒子庆祝
    Particles.fireworks(Renderer.width / 2, Renderer.height / 2);

    // 延迟显示结果（Passed popup 状态）
    setTimeout(() => {
      SceneManager.push('result', { win: true, stars, score, levelId: level.id });
    }, 1000);
  }

  // ========== Game Over ==========
  _onLose(reason) {
    if (gameOver) return;
    gameOver = true;
    if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
    Snd.stopBgm();
    Snd.lose();

    setTimeout(() => {
      SceneManager.push('result', {
        win: false, reason: reason || 'Slots Full!',
        removed: totalRemoved, total: totalTurkeys,
        score, levelId: level.id,
      });
    }, 800);
  }

  // ========== 每帧更新 ==========
  update(dt) {
    // Combo文字淡出
    if (comboAlpha > 0) {
      comboAlpha -= dt * 1.5;
      comboScale = Math.max(1, comboScale - dt * 2);
      if (comboAlpha < 0) comboAlpha = 0;
    }

    // Score飘字更新
    for (let i = scoreFloats.length - 1; i >= 0; i--) {
      const f = scoreFloats[i];
      f.y += f.vy * dt;
      f.alpha -= dt * 1.2;
      if (f.alpha <= 0) scoreFloats.splice(i, 1);
    }

    // Time淡出
    if (countdownNum !== 0 && countdownAlpha > 0) {
      // 不在这里做淡出，由回调控制
    }

    // 飞行动画 (支持多个同时飞行)
    for (let fi = flyingTurkeys.length - 1; fi >= 0; fi--) {
      const ft = flyingTurkeys[fi];
      ft.t += dt;
      const progress = Math.min(ft.t / ft.dur, 1);
      const ease = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;
      const { startX, startY, endX, endY, cpx, cpy } = ft;
      ft.x = (1 - ease) * (1 - ease) * startX + 2 * (1 - ease) * ease * cpx + ease * ease * endX;
      ft.y = (1 - ease) * (1 - ease) * startY + 2 * (1 - ease) * ease * cpy + ease * ease * endY;

      if (progress >= 1) {
        Snd.drop();
        flyingTurkeys.splice(fi, 1);

        // 检查匹配
        const matched = this._checkMatch();
        if (!matched && flyingTurkeys.length === 0) animating = false;
      }
    }
    flyingTurkey = flyingTurkeys.length > 0 ? flyingTurkeys[flyingTurkeys.length - 1] : null;

    // 粒子在 render 中绘制
  }

  // ========== 渲染 ==========
  render(ctx, w, h) {
    // Screen Shake
    ctx.save();
    if (typeof ScreenFX !== 'undefined') ScreenFX.update(ctx, w, h);
    
    // 背景
    this._drawBackground(ctx, w, h);

    // Turkey
    this._drawTurkeys(ctx);

    // 飞行中的Turkey（支持多个）
    for (const ft of flyingTurkeys) {
      this._drawSingleTurkey(ctx, ft.typeId,
        ft.x - TURKEY_W / 2, ft.y - TURKEY_H / 2, 1);
    }

    // HUD
    this._drawHUD(ctx, w, h);

    // Item按钮
    this._drawProps(ctx);

    // 槽位栏
    this._drawSlotBar(ctx, w, h);

    // 粒子效果
    Particles.update(ctx);

    // Combo文字
    if (comboAlpha > 0) {
      ctx.save();
      ctx.globalAlpha = comboAlpha;
      ctx.font = `bold ${32 * comboScale}px sans-serif`;
      ctx.fillStyle = '#FFD700';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      // 文字描边
      ctx.strokeStyle = 'rgba(0,0,0,0.6)';
      ctx.lineWidth = 3;
      ctx.strokeText(comboText, w / 2, h * 0.35);
      ctx.fillText(comboText, w / 2, h * 0.35);
      ctx.restore();
    }

    // Score飘字
    for (const f of scoreFloats) {
      ctx.save();
      ctx.globalAlpha = f.alpha;
      ctx.font = 'bold 18px sans-serif';
      ctx.fillStyle = '#FFD700';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(f.text, f.x, f.y);
      ctx.restore();
    }

    // Time覆盖
    if (countdownNum !== 0) {
      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, w, h);
      ctx.globalAlpha = countdownAlpha;
      ctx.font = 'bold 72px sans-serif';
      ctx.fillStyle = '#FFD700';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const text = countdownNum === -1 ? 'GO!' : '' + countdownNum;
      ctx.fillText(text, w / 2, h / 2);
      ctx.restore();
    }

    // Pause覆盖
    if (paused) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, w, h);
      ctx.font = 'bold 36px sans-serif';
      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('游戏Pause', w / 2, h / 2 - 30);
      ctx.font = '18px sans-serif';
      ctx.fillText('点击任意位置Resume', w / 2, h / 2 + 20);
    }
    
    // 关闭Screen Shake的ctx.save
    ctx.restore();
  }

  // ---- 背景绘制 ----
  _drawBackground(ctx, w, h) {
    // 天空渐变
    const skyColors = theme.sky;
    const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.6);
    skyColors.forEach((c, i) => skyGrad.addColorStop(i / (skyColors.length - 1), c));
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, h * 0.6);

    // 草地渐变
    const groundColors = theme.ground;
    const gGrad = ctx.createLinearGradient(0, h * 0.6, 0, h);
    groundColors.forEach((c, i) => gGrad.addColorStop(i / (groundColors.length - 1), c));
    ctx.fillStyle = gGrad;
    ctx.fillRect(0, h * 0.6, w, h * 0.4);
  }

  // ---- Turkey绘制 ----
  _drawTurkeys(ctx) {
    // 按layer和y排序绘制（底层先画）
    const sorted = turkeys
      .filter(t => !t.removed)
      .sort((a, b) => a.layer !== b.layer ? a.layer - b.layer : a.y - b.y);

    for (const t of sorted) {
      const alpha = t.blocked ? 0.5 : 1;
      this._drawSingleTurkey(ctx, t.typeId, t.x, t.y, alpha);

      // 被遮挡标记
      if (t.blocked) {
        ctx.save();
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fillRect(t.x, t.y, TURKEY_W, TURKEY_H);
        ctx.restore();
      }
    }
  }

  /** 绘制单只Turkey */
  _drawSingleTurkey(ctx, typeId, x, y, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha;
    const src = TURKEY_IMG_MAP[typeId] || TURKEY_IMG_MAP[0];
    const img = Renderer.getImage(src);
    if (img) {
      Renderer.drawImage(src, x, y, TURKEY_W, TURKEY_H);
    } else {
      // 图片未加载时画彩色占位圆
      const t = TURKEY_TYPES[typeId] || TURKEY_TYPES[0];
      ctx.beginPath();
      ctx.ellipse(x + TURKEY_W / 2, y + TURKEY_H / 2, TURKEY_W / 2 - 4, TURKEY_H / 2 - 4, 0, 0, Math.PI * 2);
      ctx.fillStyle = t.body;
      ctx.fill();
      ctx.strokeStyle = t.bodyDk;
      ctx.lineWidth = 2;
      ctx.stroke();
      // Turkeyemoji标记
      ctx.font = '20px serif';
      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🦃', x + TURKEY_W / 2, y + TURKEY_H / 2);
    }
    ctx.restore();
  }

  // ---- HUD绘制 ----
  _drawHUD(ctx, w, h) {
    // HUD背景
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(0, 0, w, 50);

    // Level名
    ctx.font = 'bold 16px sans-serif';
    ctx.fillStyle = '#FFD700';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(level.name, 10, 25);

    // Score
    ctx.font = 'bold 16px sans-serif';
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.fillText('🏆 ' + score, w / 2, 25);

    // Time
    const min = Math.floor(timeLeft / 60);
    const sec = timeLeft % 60;
    const timeStr = min + ':' + (sec < 10 ? '0' : '') + sec;
    ctx.font = 'bold 18px sans-serif';
    ctx.fillStyle = timeLeft <= 30 ? '#FF5252' : (timeLeft <= 60 ? '#FFD740' : '#FFFFFF');
    ctx.textAlign = 'right';
    ctx.fillText('⏱ ' + timeStr, w - 50, 25);

    // Pause按钮
    ctx.font = '22px sans-serif';
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.fillText('⏸', _pauseBtn.x + _pauseBtn.w / 2, _pauseBtn.y + _pauseBtn.h / 2);

    // 进度条
    const progW = w - 20;
    const progH = 6;
    const progY = 44;
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.fillRect(10, progY, progW, progH);
    const progress = totalTurkeys > 0 ? totalRemoved / totalTurkeys : 0;
    ctx.fillStyle = '#4CAF50';
    ctx.fillRect(10, progY, progW * progress, progH);
  }

  // ---- Item按钮绘制 ----
  _drawProps(ctx) {
    const propTypes = ['shuffle', 'remove', 'complete'];
    for (let i = 0; i < _propBtns.length; i++) {
      const btn = _propBtns[i];
      const count = props[propTypes[i]];
      const disabled = count <= 0;

      ctx.save();
      if (disabled) ctx.globalAlpha = 0.4;

      // 按钮背景
      Renderer.drawRoundRect(btn.x, btn.y, btn.w, btn.h, 10, 'rgba(0,0,0,0.5)');

      // emoji图标
      ctx.font = '22px serif';
      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(btn.emoji, btn.x + btn.w / 2, btn.y + btn.h / 2 - 4);

      // 数量
      ctx.font = 'bold 11px sans-serif';
      ctx.fillStyle = '#FFD700';
      ctx.fillText('' + count, btn.x + btn.w / 2, btn.y + btn.h - 8);

      ctx.restore();
    }
  }

  // ---- 槽位栏绘制 ----
  _drawSlotBar(ctx, w, h) {
    // 槽位栏背景
    const barGrad = ctx.createLinearGradient(0, _slotBarY, 0, h);
    barGrad.addColorStop(0, '#1A237E');
    barGrad.addColorStop(0.3, '#283593');
    barGrad.addColorStop(0.7, '#1A237E');
    barGrad.addColorStop(1, '#0D1B2A');
    ctx.fillStyle = barGrad;
    ctx.fillRect(0, _slotBarY, w, SLOT_BAR_H);

    // 顶部金线
    ctx.fillStyle = '#FFD740';
    ctx.fillRect(0, _slotBarY, w, 3);

    // 槽位
    const totalW = SLOT_COUNT * (SLOT_W + SLOT_GAP) - SLOT_GAP;
    const startX = (w - totalW) / 2;

    for (let i = 0; i < SLOT_COUNT; i++) {
      const sx = startX + i * (SLOT_W + SLOT_GAP);
      const sy = _slotBarY + (SLOT_BAR_H - SLOT_H) / 2;

      // 槽位背景
      const slotColor = i < slots.length
        ? 'rgba(13,94,52,0.5)'
        : 'rgba(13,27,42,0.7)';
      Renderer.drawRoundRect(sx, sy, SLOT_W, SLOT_H, 8, slotColor);

      // 槽位边框
      ctx.save();
      const borderColor = slots.length >= 7
        ? 'rgba(255,60,60,0.7)'
        : (slots.length >= 5 ? 'rgba(255,200,0,0.6)' : 'rgba(255,215,64,0.3)');
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = 2;
      roundRectPath(ctx, sx, sy, SLOT_W, SLOT_H, 8);
      ctx.stroke();
      ctx.restore();

      // 槽中Turkey
      if (i < slots.length) {
        const s = slots[i];
        const imgSrc = TURKEY_IMG_MAP[s.typeId] || TURKEY_IMG_MAP[0];
        const miniW = SLOT_W - 6;
        const miniH = SLOT_H - 6;
        Renderer.drawImage(imgSrc, sx + 3, sy + 3, miniW, miniH);
      }
    }
  }

  // ========== 触摸事件 ==========
  onTouchStart(x, y) {
    // Pause状态 - Tap to Resume
    if (paused) {
      paused = false;
      Snd.click();
      return;
    }

    // Time中不响应
    if (countdownNum !== 0) return;

    // Pause按钮
    if (x >= _pauseBtn.x && x <= _pauseBtn.x + _pauseBtn.w &&
        y >= _pauseBtn.y && y <= _pauseBtn.y + _pauseBtn.h) {
      if (!gameOver) {
        paused = true;
        Snd.click();
      }
      return;
    }

    // Item按钮
    for (const btn of _propBtns) {
      if (x >= btn.x && x <= btn.x + btn.w && y >= btn.y && y <= btn.y + btn.h) {
        this._useProp(btn.id);
        return;
      }
    }

    // Turkey点击检测（从顶层往下检测，先检测最上层的）
    const sorted = turkeys
      .filter(t => !t.removed)
      .sort((a, b) => b.layer !== a.layer ? b.layer - a.layer : b.y - a.y);

    for (const t of sorted) {
      if (x >= t.x && x <= t.x + TURKEY_W && y >= t.y && y <= t.y + TURKEY_H) {
        this._onTurkeyClick(t);
        return;
      }
    }
  }
}

module.exports = new GameScene();

});

// ===== js/scenes/result.js =====
_define('js/scenes/result', function(module, exports, require) {
/**
 * Catch Turkey — 结果弹窗场景（Victory/Game Over）
 */

const { Scene, SceneManager } = require('../scene-manager');
const { Renderer } = require('../renderer');
const { TURKEY_TYPES } = require('../config');
const Snd = require('../sound');

let _result = null;
let _buttons = [];
let _animTime = 0;

class ResultScene extends Scene {
  constructor() {
    super('result');
  }

  enter(params) {
    _result = params || {};
    _animTime = 0;
    this._layoutButtons();
    // Show GameMonetize ad on result screen
    try { if (window.GameMonetizeSDK) window.GameMonetizeSDK.showBanner(); } catch(e) {}
  }

  exit() {
    _result = null;
  }

  _layoutButtons() {
    const w = Renderer.width;
    const h = Renderer.height;
    const btnW = w * 0.35;
    const btnH = 44;
    const cx = w / 2;
    const popupBottom = h / 2 + 120;

    _buttons = [];
    if (_result.win) {
      if (_result.levelId < 10) {
        _buttons.push({ id: 'next', text: 'Next Level', x: cx - btnW - 8, y: popupBottom, w: btnW, h: btnH, color: '#4CAF50' });
      }
      _buttons.push({ id: 'levels', text: 'Level列表', x: cx + 8, y: popupBottom, w: btnW, h: btnH, color: '#1E88E5' });
    } else {
      _buttons.push({ id: 'retry', text: 'Retry', x: cx - btnW - 8, y: popupBottom, w: btnW, h: btnH, color: '#FF6B35' });
      _buttons.push({ id: 'levels', text: 'Back', x: cx + 8, y: popupBottom, w: btnW, h: btnH, color: '#78909C' });
    }
  }

  update(dt) {
    _animTime += dt;
  }

  render(ctx, w, h) {
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, w, h);

    const popW = w * 0.8;
    const popH = 280;
    const px = (w - popW) / 2;
    const py = h / 2 - popH / 2 - 20;

    Renderer.drawRoundRect(px, py, popW, popH, 16, 'rgba(26,35,126,0.95)');

    ctx.save();
    ctx.strokeStyle = '#FFD740';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(px + 16, py);
    ctx.arcTo(px + popW, py, px + popW, py + popH, 16);
    ctx.arcTo(px + popW, py + popH, px, py + popH, 16);
    ctx.arcTo(px, py + popH, px, py, 16);
    ctx.arcTo(px, py, px + popW, py, 16);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();

    if (_result.win) {
      this._drawWin(ctx, w, px, py, popW, popH);
    } else {
      this._drawLose(ctx, w, px, py, popW, popH);
    }

    for (const btn of _buttons) {
      Renderer.drawRoundRect(btn.x, btn.y, btn.w, btn.h, 10, btn.color);
      ctx.font = 'bold 16px sans-serif';
      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(btn.text, btn.x + btn.w / 2, btn.y + btn.h / 2);
    }
  }

  _drawWin(ctx, w, px, py, popW, popH) {
    const cx = w / 2;
    // 动态弹入效果
    const scale = Math.min(1, _animTime * 4);
    const bounce = scale < 1 ? scale : 1 + Math.sin(_animTime * 3) * 0.02;
    
    ctx.save();
    ctx.translate(cx, py + popH / 2);
    ctx.scale(bounce, bounce);
    ctx.translate(-cx, -(py + popH / 2));
    
    // 标题 - 大号带光晕
    ctx.save();
    ctx.shadowColor = '#FFD700';
    ctx.shadowBlur = 20;
    ctx.font = 'bold 32px sans-serif';
    ctx.fillStyle = '#FFD700';
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillText('🎉 Victory! 🎉', cx, py + 15);
    ctx.restore();

    // Stars - 大号带动画
    const starY = py + 60;
    for (let si = 0; si < 3; si++) {
      const isFull = si < _result.stars;
      const starDelay = 0.3 + si * 0.2;
      const starScale = _animTime > starDelay ? Math.min(1.2, (_animTime - starDelay) * 5) : 0;
      const finalScale = starScale > 1 ? 1 + (1.2 - starScale) * 0.5 : starScale;
      if (finalScale <= 0) continue;
      ctx.save();
      const sx = cx - 50 + si * 50;
      ctx.translate(sx, starY + 15);
      ctx.scale(finalScale, finalScale);
      ctx.font = '36px serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      if (isFull) {
        ctx.shadowColor = '#FFD700';
        ctx.shadowBlur = 10;
      }
      ctx.fillText(isFull ? '⭐' : '☆', 0, 0);
      ctx.restore();
    }

    // Score - 超大醒目
    ctx.save();
    ctx.font = 'bold 48px sans-serif';
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.shadowColor = 'rgba(255,255,255,0.5)';
    ctx.shadowBlur = 10;
    ctx.fillText('' + _result.score, cx, py + 105);
    ctx.restore();
    
    // "pts" 标签
    ctx.font = '16px sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillText('得 pts', cx, py + 155);

    // Turkey卡片 - 带发光边框
    const cardId = Math.min(_result.levelId - 1, 9);
    const turkey = TURKEY_TYPES[cardId];
    if (turkey) {
      ctx.save();
      ctx.shadowColor = '#FFD700';
      ctx.shadowBlur = 8;
      ctx.font = 'bold 16px sans-serif';
      ctx.fillStyle = '#FFD700';
      ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      ctx.fillText('🏆 获得图鉴：' + turkey.name, cx, py + 185);
      ctx.restore();
    }
    
    ctx.restore(); // bounce scale
  }

  _drawLose(ctx, w, px, py, popW, popH) {
    const cx = w / 2;
    const scale = Math.min(1, _animTime * 4);
    
    ctx.save();
    ctx.translate(cx, py + popH / 2);
    ctx.scale(scale, scale);
    ctx.translate(-cx, -(py + popH / 2));
    
    // 标题
    ctx.save();
    ctx.shadowColor = '#FF5252';
    ctx.shadowBlur = 15;
    ctx.font = 'bold 32px sans-serif';
    ctx.fillStyle = '#FF5252';
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillText('😢 Game Over', cx, py + 20);
    ctx.restore();

    // 原因
    if (_result.reason) {
      ctx.font = 'bold 18px sans-serif';
      ctx.fillStyle = '#FFAB91';
      ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      ctx.fillText(_result.reason, cx, py + 70);
    }

    // 进度条
    if (_result.removed !== undefined && _result.total) {
      const barW = popW * 0.6;
      const barH = 20;
      const barX = cx - barW / 2;
      const barY = py + 110;
      const pct = _result.removed / _result.total;
      
      // 背景
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.beginPath();
      ctx.roundRect(barX, barY, barW, barH, 10);
      ctx.fill();
      // 进度
      ctx.fillStyle = pct > 0.7 ? '#FFB300' : pct > 0.4 ? '#FF7043' : '#EF5350';
      ctx.beginPath();
      ctx.roundRect(barX, barY, barW * pct, barH, 10);
      ctx.fill();
      // 文字
      ctx.font = 'bold 14px sans-serif';
      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(_result.removed + ' / ' + _result.total, cx, barY + barH / 2);
      
      ctx.font = '13px sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.fillText('Try Again!，So Close!！', cx, barY + barH + 20);
    }
    
    ctx.restore();
  }

  onTouchStart(x, y) {
    for (const btn of _buttons) {
      if (x >= btn.x && x <= btn.x + btn.w && y >= btn.y && y <= btn.y + btn.h) {
        Snd.click();
        switch (btn.id) {
          case 'next':
            SceneManager.switchTo('game', { levelId: _result.levelId + 1 });
            break;
          case 'retry':
            SceneManager.switchTo('game', { levelId: _result.levelId });
            break;
          case 'levels':
            SceneManager.switchTo('levelSelect');
            break;
        }
        return;
      }
    }
  }
}

module.exports = new ResultScene();

});

// ===== js/scenes/collection.js =====
_define('js/scenes/collection', function(module, exports, require) {
/**
 * Catch Turkey — 收藏/图鉴场景（微信小游戏 Canvas 版）
 * 展示Collected的10种Turkey，Not Collected显示为剪影/Locked
 */

const { Scene, SceneManager } = require('../scene-manager');
const { Renderer } = require('../renderer');
const { TURKEY_TYPES } = require('../config');
const Save = require('../save');
const Snd = require('../sound');

let _backBtn = null;
let _cards = [];
let _scrollY = 0;
let _maxScrollY = 0;
let _touchStartY = 0;
let _scrollStartY = 0;

class CollectionScene extends Scene {
  constructor() {
    super('collection');
  }

  enter() {
    _scrollY = 0;
    this._layout();
  }

  exit() {}

  _layout() {
    const w = Renderer.width;
    const h = Renderer.height;

    _backBtn = { x: 10, y: 10, w: 44, h: 44 };

    const cols = 2;
    const padding = 16;
    const topOffset = 90; // 标题 + 进度条
    const cardGap = 14;
    const gridW = w - padding * 2;
    const cardW = (gridW - cardGap * (cols - 1)) / cols;
    const cardH = 140;

    const collected = Save.d.cards || [];

    _cards = TURKEY_TYPES.map((t, idx) => {
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      const x = padding + col * (cardW + cardGap);
      const y = topOffset + row * (cardH + cardGap);
      const unlocked = collected.includes(t.id);
      return { turkey: t, x, y, w: cardW, h: cardH, unlocked };
    });

    const lastCard = _cards[_cards.length - 1];
    const contentH = lastCard.y + lastCard.h + 30;
    _maxScrollY = Math.max(0, contentH - h);
  }

  update(dt) {}

  render(ctx, w, h) {
    // 背景
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#0D1B2A');
    grad.addColorStop(0.5, '#1B2838');
    grad.addColorStop(1, '#0D1B2A');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // 标题栏
    ctx.font = 'bold 22px sans-serif';
    ctx.fillStyle = '#FFD700';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Turkey Album', w / 2, 36);

    // Back按钮
    ctx.font = '28px sans-serif';
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('←', _backBtn.x + _backBtn.w / 2, _backBtn.y + _backBtn.h / 2);

    // Collection
    const collected = (Save.d.cards || []).length;
    ctx.font = '14px sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(collected + '/10 Collected', w / 2, 62);

    // 进度条
    const barW = w * 0.6;
    const barH = 6;
    const barX = (w - barW) / 2;
    const barY = 74;
    Renderer.drawRoundRect(barX, barY, barW, barH, 3, 'rgba(255,255,255,0.1)');
    if (collected > 0) {
      const fillW = barW * (collected / 10);
      Renderer.drawRoundRect(barX, barY, fillW, barH, 3, '#FFD700');
    }

    // 卡片网格（可滚动）
    ctx.save();
    ctx.translate(0, -_scrollY);
    for (const card of _cards) {
      this._drawCard(ctx, card);
    }
    ctx.restore();
  }

  _drawCard(ctx, card) {
    const { turkey: t, x, y, w: cw, h: ch, unlocked } = card;
    const r = 12;

    // 卡片背景
    if (unlocked) {
      Renderer.drawRoundRect(x, y, cw, ch, r, 'rgba(255,255,255,0.1)');
    } else {
      Renderer.drawRoundRect(x, y, cw, ch, r, 'rgba(255,255,255,0.04)');
    }

    // Turkey展示区域
    const previewY = y + 10;
    const previewH = ch - 60;
    const previewCx = x + cw / 2;
    const previewCy = previewY + previewH / 2;

    if (unlocked) {
      // 绘制彩色Turkey简笔（身体 + 尾巴）
      this._drawTurkeyPreview(ctx, previewCx, previewCy, t);

      // 名字
      ctx.font = 'bold 14px sans-serif';
      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(t.name, x + cw / 2, y + ch - 44);

      // 描述
      ctx.font = '10px sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.fillText(t.desc.length > 12 ? t.desc.substring(0, 12) + '...' : t.desc, x + cw / 2, y + ch - 24);
    } else {
      // Locked剪影
      ctx.font = '40px serif';
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🦃', previewCx, previewCy);

      // 锁图标
      ctx.font = '20px serif';
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.fillText('🔒', previewCx, previewCy + 30);

      // ???
      ctx.font = 'bold 14px sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.textBaseline = 'top';
      ctx.fillText('???', x + cw / 2, y + ch - 44);

      ctx.font = '10px sans-serif';
      ctx.fillText('通关对应Level解锁', x + cw / 2, y + ch - 24);
    }
  }

  /** 绘制简笔Turkey预览 */
  _drawTurkeyPreview(ctx, cx, cy, t) {
    ctx.save();

    // 尾巴扇形
    const tailR = 28;
    for (let i = -3; i <= 3; i++) {
      const angle = -Math.PI / 2 + i * 0.22;
      const tx = cx + Math.cos(angle) * tailR;
      const ty = cy + Math.sin(angle) * tailR - 8;
      ctx.beginPath();
      ctx.arc(tx, ty, 6, 0, Math.PI * 2);
      ctx.fillStyle = i % 2 === 0 ? t.tail : t.tailTip;
      ctx.fill();
    }

    // 身体
    ctx.beginPath();
    ctx.ellipse(cx, cy + 5, 18, 22, 0, 0, Math.PI * 2);
    ctx.fillStyle = t.body;
    ctx.fill();

    // 深色腹部
    ctx.beginPath();
    ctx.ellipse(cx, cy + 12, 12, 14, 0, 0, Math.PI * 2);
    ctx.fillStyle = t.bodyDk;
    ctx.fill();

    // 头
    ctx.beginPath();
    ctx.arc(cx, cy - 18, 10, 0, Math.PI * 2);
    ctx.fillStyle = t.body;
    ctx.fill();

    // 喙
    ctx.beginPath();
    ctx.moveTo(cx + 8, cy - 18);
    ctx.lineTo(cx + 16, cy - 16);
    ctx.lineTo(cx + 8, cy - 14);
    ctx.closePath();
    ctx.fillStyle = '#FF8F00';
    ctx.fill();

    // 肉髯
    ctx.beginPath();
    ctx.ellipse(cx + 2, cy - 10, 3, 5, 0.2, 0, Math.PI * 2);
    ctx.fillStyle = '#E53935';
    ctx.fill();

    // 眼睛
    ctx.beginPath();
    ctx.arc(cx + 3, cy - 20, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx + 3.5, cy - 20, 1.2, 0, Math.PI * 2);
    ctx.fillStyle = '#000000';
    ctx.fill();

    ctx.restore();
  }

  onTouchStart(x, y) {
    _touchStartY = y;
    _scrollStartY = _scrollY;

    if (x >= _backBtn.x && x <= _backBtn.x + _backBtn.w &&
        y >= _backBtn.y && y <= _backBtn.y + _backBtn.h) {
      Snd.click();
      SceneManager.switchTo('home');
      return;
    }
  }

  onTouchMove(x, y) {
    const dy = _touchStartY - y;
    _scrollY = Math.max(0, Math.min(_maxScrollY, _scrollStartY + dy));
  }
}

module.exports = new CollectionScene();

});

// ===== js/scenes/settings.js =====
_define('js/scenes/settings', function(module, exports, require) {
/**
 * Catch Turkey — Settings场景（微信小游戏 Canvas 版）
 */

const { Scene, SceneManager } = require('../scene-manager');
const { Renderer } = require('../renderer');
const Save = require('../save');
const Snd = require('../sound');

let _backBtn = null;
let _items = [];
let _resetBtn = null;
let _confirmReset = false;
let _confirmButtons = [];

class SettingsScene extends Scene {
  constructor() {
    super('settings');
  }

  enter() {
    _confirmReset = false;
    this._layout();
  }

  exit() {
    _confirmReset = false;
  }

  _layout() {
    const w = Renderer.width;
    const h = Renderer.height;

    _backBtn = { x: 10, y: 10, w: 44, h: 44 };

    const itemW = w * 0.8;
    const itemH = 56;
    const cx = w / 2;
    const startY = 90;
    const gap = 16;

    _items = [
      { id: 'sfx', label: '🔊 Sound', key: 'sfx', x: cx - itemW / 2, y: startY, w: itemW, h: itemH },
      { id: 'bgm', label: '🎵 BGM', key: 'bgm', x: cx - itemW / 2, y: startY + (itemH + gap), w: itemW, h: itemH },
      { id: 'vibrate', label: '📳 振动', key: 'vibrate', x: cx - itemW / 2, y: startY + (itemH + gap) * 2, w: itemW, h: itemH },
    ];

    const resetY = startY + (itemH + gap) * 3 + 20;
    _resetBtn = { x: cx - itemW / 2, y: resetY, w: itemW, h: 50 };

    // Confirm弹窗按钮
    const confirmW = w * 0.3;
    const confirmY = h / 2 + 30;
    _confirmButtons = [
      { id: 'confirmYes', text: 'Confirm Reset', x: cx - confirmW - 10, y: confirmY, w: confirmW, h: 44, color: '#E53935' },
      { id: 'confirmNo', text: 'Cancel', x: cx + 10, y: confirmY, w: confirmW, h: 44, color: '#78909C' },
    ];
  }

  update(dt) {}

  render(ctx, w, h) {
    // 背景
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#0D1B2A');
    grad.addColorStop(0.5, '#1B2838');
    grad.addColorStop(1, '#0D1B2A');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // 标题
    ctx.font = 'bold 22px sans-serif';
    ctx.fillStyle = '#FFD700';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Settings', w / 2, 36);

    // Back按钮
    ctx.font = '28px sans-serif';
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('←', _backBtn.x + _backBtn.w / 2, _backBtn.y + _backBtn.h / 2);

    // Settings项
    const settings = Save.d.settings;
    for (const item of _items) {
      this._drawToggleItem(ctx, item, settings[item.key]);
    }

    // 重置按钮
    Renderer.drawRoundRect(_resetBtn.x, _resetBtn.y, _resetBtn.w, _resetBtn.h, 12, '#E53935');
    ctx.font = 'bold 16px sans-serif';
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🗑️ Reset Data', _resetBtn.x + _resetBtn.w / 2, _resetBtn.y + _resetBtn.h / 2);

    // 版本号
    ctx.font = '12px sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText('🦃 Catch Turkey v2.0', w / 2, h - 30);

    // Confirm Reset弹窗
    if (_confirmReset) {
      this._drawConfirmDialog(ctx, w, h);
    }
  }

  _drawToggleItem(ctx, item, isOn) {
    const { x, y, w: iw, h: ih, label } = item;
    const r = 12;

    Renderer.drawRoundRect(x, y, iw, ih, r, 'rgba(255,255,255,0.08)');

    // 标签
    ctx.font = '16px sans-serif';
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, x + 16, y + ih / 2);

    // Toggle
    const toggleW = 50;
    const toggleH = 28;
    const toggleX = x + iw - toggleW - 16;
    const toggleY = y + (ih - toggleH) / 2;
    const toggleR = toggleH / 2;

    // Toggle背景
    Renderer.drawRoundRect(toggleX, toggleY, toggleW, toggleH, toggleR, isOn ? '#4CAF50' : 'rgba(255,255,255,0.2)');

    // Toggle圆点
    const dotR = toggleH / 2 - 3;
    const dotX = isOn ? toggleX + toggleW - dotR - 5 : toggleX + dotR + 5;
    const dotY = toggleY + toggleH / 2;
    ctx.beginPath();
    ctx.arc(dotX, dotY, dotR, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
  }

  _drawConfirmDialog(ctx, w, h) {
    // 遮罩
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, w, h);

    // 弹窗
    const popW = w * 0.75;
    const popH = 160;
    const px = (w - popW) / 2;
    const py = h / 2 - popH / 2 - 20;

    Renderer.drawRoundRect(px, py, popW, popH, 16, 'rgba(26,35,126,0.95)');

    ctx.font = 'bold 18px sans-serif';
    ctx.fillStyle = '#FF5252';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('⚠️ Confirm Reset？', w / 2, py + 20);

    ctx.font = '14px sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fillText('All progress will be cleared！', w / 2, py + 55);

    // Confirm/Cancel按钮
    for (const btn of _confirmButtons) {
      Renderer.drawRoundRect(btn.x, btn.y, btn.w, btn.h, 10, btn.color);
      ctx.font = 'bold 14px sans-serif';
      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(btn.text, btn.x + btn.w / 2, btn.y + btn.h / 2);
    }
  }

  onTouchStart(x, y) {
    // Confirm弹窗优先
    if (_confirmReset) {
      for (const btn of _confirmButtons) {
        if (x >= btn.x && x <= btn.x + btn.w && y >= btn.y && y <= btn.y + btn.h) {
          Snd.click();
          if (btn.id === 'confirmYes') {
            Save.reset();
            _confirmReset = false;
          } else {
            _confirmReset = false;
          }
          return;
        }
      }
      // 点击弹窗外关闭
      _confirmReset = false;
      return;
    }

    // Back按钮
    if (x >= _backBtn.x && x <= _backBtn.x + _backBtn.w &&
        y >= _backBtn.y && y <= _backBtn.y + _backBtn.h) {
      Snd.click();
      SceneManager.switchTo('home');
      return;
    }

    // Settings项Toggle
    for (const item of _items) {
      if (x >= item.x && x <= item.x + item.w && y >= item.y && y <= item.y + item.h) {
        Snd.click();
        Save.d.settings[item.key] = !Save.d.settings[item.key];
        Save.save();
        if (item.key === 'bgm') {
          if (!Save.d.settings.bgm) Snd.stopBgm();
          else Snd.startBgm();
        }
        return;
      }
    }

    // 重置按钮
    if (x >= _resetBtn.x && x <= _resetBtn.x + _resetBtn.w &&
        y >= _resetBtn.y && y <= _resetBtn.y + _resetBtn.h) {
      Snd.click();
      _confirmReset = true;
      return;
    }
  }
}

module.exports = new SettingsScene();

});

// ===== game.js =====
_define('game', function(module, exports, require) {
/**
 * Catch Turkey — 微信小游戏入口
 */

const { Renderer, TouchManager } = require('./js/renderer');
const { SceneManager } = require('./js/scene-manager');
const Save = require('./js/save');

// 场景导入
const homeScene = require('./js/scenes/home');
const levelSelectScene = require('./js/scenes/level-select');
const gameScene = require('./js/scenes/game');
const resultScene = require('./js/scenes/result');
const collectionScene = require('./js/scenes/collection');
const settingsScene = require('./js/scenes/settings');

// 初始化存档
Save.load();

// 初始化触摸管理
TouchManager.init();

// 注册所有场景
SceneManager.register('home', homeScene);
SceneManager.register('levelSelect', levelSelectScene);
SceneManager.register('game', gameScene);
SceneManager.register('result', resultScene);
SceneManager.register('collection', collectionScene);
SceneManager.register('settings', settingsScene);

// 预加载关键图片
const preloadImages = [
  'images/title_cn.png',
  'images/bg_farm.png',
  'images/turkey_red.png',
  'images/turkey_blue.png',
  'images/turkey_golden.png',
  'images/turkey_purple.png',
  'images/turkey_orange.png',
  'images/turkey_pink.png',
  'images/turkey_green.png',
  'images/turkey_rainbow.png',
];

let loaded = 0;
const total = preloadImages.length;

function onAllLoaded() {
  SceneManager.switchTo('home');
  SceneManager.start();
}

preloadImages.forEach(src => {
  Renderer.loadImage(src).then(() => {
    loaded++;
    if (loaded >= total) onAllLoaded();
  }).catch(() => {
    loaded++;
    if (loaded >= total) onAllLoaded();
  });
});

if (total === 0) onAllLoaded();

});

// ===== Boot =====
require('game');
