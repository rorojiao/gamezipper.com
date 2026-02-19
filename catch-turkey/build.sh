#!/bin/bash
set -e
cd "$(dirname "$0")"
SRC="/home/msdn/.openclaw/workspace/catch-turkey-wx"
OUT="bundle.js"

# Module order (dependency sorted)
MODULES=(
  "js/config.js"
  "js/renderer.js"
  "js/save.js"
  "js/sound.js"
  "js/particles.js"
  "js/scene-manager.js"
  "js/scenes/home.js"
  "js/scenes/level-select.js"
  "js/scenes/game.js"
  "js/scenes/result.js"
  "js/scenes/collection.js"
  "js/scenes/settings.js"
  "game.js"
)

cat > "$OUT" << 'HEADER'
// ===== wx-adapter.js =====
(function() {
  var _touchStartCbs = [];
  var _touchMoveCbs = [];
  var _touchEndCbs = [];
  var _canvasCreated = false;
  var _mainCanvas = null;

  function getCanvas() {
    if (!_mainCanvas) {
      _mainCanvas = document.getElementById('gameCanvas');
    }
    return _mainCanvas;
  }

  function resizeCanvas() {
    var c = getCanvas();
    var dpr = window.devicePixelRatio || 1;
    c.width = window.innerWidth * dpr;
    c.height = window.innerHeight * dpr;
  }

  window.wx = {
    createCanvas: function() {
      var c = getCanvas();
      if (!_canvasCreated) {
        _canvasCreated = true;
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
      }
      c.createImage = function() { return new Image(); };
      c.requestAnimationFrame = window.requestAnimationFrame.bind(window);
      return c;
    },

    getSystemInfoSync: function() {
      return {
        windowWidth: window.innerWidth,
        windowHeight: window.innerHeight,
        pixelRatio: window.devicePixelRatio || 1,
      };
    },

    onTouchStart: function(cb) {
      _touchStartCbs.push(cb);
      document.addEventListener('touchstart', function(e) {
        e.preventDefault();
        cb({ touches: Array.from(e.touches).map(function(t) { return { clientX: t.clientX, clientY: t.clientY }; }) });
      }, { passive: false });
      document.addEventListener('mousedown', function(e) {
        cb({ touches: [{ clientX: e.clientX, clientY: e.clientY }] });
      });
    },

    onTouchMove: function(cb) {
      _touchMoveCbs.push(cb);
      document.addEventListener('touchmove', function(e) {
        e.preventDefault();
        cb({ touches: Array.from(e.touches).map(function(t) { return { clientX: t.clientX, clientY: t.clientY }; }) });
      }, { passive: false });
      document.addEventListener('mousemove', function(e) {
        if (e.buttons > 0) {
          cb({ touches: [{ clientX: e.clientX, clientY: e.clientY }] });
        }
      });
    },

    onTouchEnd: function(cb) {
      _touchEndCbs.push(cb);
      document.addEventListener('touchend', function(e) {
        e.preventDefault();
        cb({ changedTouches: Array.from(e.changedTouches).map(function(t) { return { clientX: t.clientX, clientY: t.clientY }; }) });
      }, { passive: false });
      document.addEventListener('mouseup', function(e) {
        cb({ changedTouches: [{ clientX: e.clientX, clientY: e.clientY }] });
      });
    },

    getStorageSync: function(key) {
      try {
        var val = localStorage.getItem(key);
        if (val === null) return '';
        try { return JSON.parse(val); } catch(e) { return val; }
      } catch(e) { return ''; }
    },

    setStorageSync: function(key, val) {
      try {
        localStorage.setItem(key, typeof val === 'string' ? val : JSON.stringify(val));
      } catch(e) {}
    },

    createInnerAudioContext: function() {
      var audio = new Audio();
      return {
        set src(v) { audio.src = v; },
        get src() { return audio.src; },
        set loop(v) { audio.loop = v; },
        set volume(v) { audio.volume = v; },
        play: function() { try { audio.play(); } catch(e) {} },
        pause: function() { audio.pause(); },
        stop: function() { audio.pause(); audio.currentTime = 0; },
        destroy: function() { audio.src = ''; },
      };
    },

    vibrateShort: function(opts) {
      if (navigator.vibrate) navigator.vibrate(15);
    },

    vibrateLong: function(opts) {
      if (navigator.vibrate) navigator.vibrate(400);
    },
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

HEADER

# Wrap each module
for mod in "${MODULES[@]}"; do
  MOD_NAME="${mod%.js}"
  # Remove leading ./ if any
  MOD_NAME="${MOD_NAME#./}"
  echo "" >> "$OUT"
  echo "// ===== $mod =====" >> "$OUT"
  echo "_define('$MOD_NAME', function(module, exports, require) {" >> "$OUT"
  cat "$SRC/$mod" >> "$OUT"
  echo "" >> "$OUT"
  echo "});" >> "$OUT"
done

# Boot entry
cat >> "$OUT" << 'FOOTER'

// ===== Boot =====
require('game');
FOOTER

echo "Built $OUT successfully ($(wc -c < "$OUT") bytes)"
