#!/usr/bin/env node
/* GENERATED in-engine verifier for chess — pattern follows akari/verify_engine.js.
 * vm sandbox: loads game.js (top-level `class ChessGame`, no surgery) — a fresh instance is the
 * same path index.html uses (`const game = new ChessGame()`).
 * Part A (legality sweep): enumerate every legal move for both sides from the initial position
 * (depth 2: every white opening, and every black reply to each) and execute it through the
 * engine's own click-input path onClick() -> doMove(); assert no exception, that the piece
 * actually moved, and that the mover's king is never left in check after the move.
 * Part B (checkmate): drive scholar's mate (1.e4 e5 2.Qh5 Nc6 3.Bc4 Nf6 4.Qxf7#) via the same
 * onClick path against a deliberately suicidal opponent; assert the engine itself declares
 * checkmate (gameOver + in-check + no legal moves for black).
 * Usage: node chess/verify_engine.js   (cwd = repo root)
 */
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const SLUG_DIR = __dirname;
const code = fs.readFileSync(path.join(SLUG_DIR, 'game.js'), 'utf8');

function mkAny() {
  const f = function () { return anyP; };
  const anyP = new Proxy(f, {
    get(t, p) {
      if (p === Symbol.toPrimitive) return () => 0;
      if (p === 'length') return 0;
      if (!(p in t)) t[p] = mkAny();
      return t[p];
    },
    set() { return true; },
    apply() { return anyP; },
  });
  return anyP;
}
function mkEl(extra) {
  const el = {
    id: '', className: '', style: {}, dataset: {}, textContent: '', innerHTML: '', value: '', src: '', href: '',
    children: [], left: 0, top: 0, width: 500, height: 500, clientWidth: 500, clientHeight: 500,
    disabled: false, hidden: false, visibilityState: 'visible',
    classList: { add: () => {}, remove: () => {}, toggle: () => {}, contains: () => false },
    addEventListener: () => {}, removeEventListener: () => {}, dispatchEvent: () => {},
    animate: () => ({ onfinish: null, cancel: () => {} }),
    appendChild: function (c) { return c; }, removeChild: function (c) { return c; }, remove: () => {},
    insertBefore: function (c) { return c; },
    querySelector: () => mkEl(), querySelectorAll: () => [],
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 500, height: 500, right: 500, bottom: 500 }),
    setAttribute: () => {}, getAttribute: () => '',
    getContext: () => mkAny(),
    focus: () => {}, blur: () => {}, click: () => {},
  };
  Object.assign(el, extra || {});
  return el;
}
const BODY = mkEl(), DOC_EL = mkEl();
BODY.parentElement = DOC_EL; BODY.parentNode = DOC_EL;
DOC_EL.parentElement = BODY; DOC_EL.parentNode = BODY;
function ImageStub() { const o = { width: 0, height: 0, complete: true, onload: null, onerror: null, addEventListener: () => {} }; let _s = ''; Object.defineProperty(o, 'src', { get: () => _s, set: (v) => { _s = v; if (o.onload) { try { o.onload(); } catch (e) {} } } }); return o; }

const sandbox = {
  console, Math, Date, JSON, Array, Object, Set, Map, Number, String, Boolean,
  parseInt, parseFloat, isNaN, isFinite, Symbol, RegExp, Promise, Uint8Array, Uint32Array, Int32Array, Float32Array,
  Error, TypeError, alert: () => {}, prompt: () => '', confirm: () => true,
  Image: ImageStub,
  window: {
    addEventListener: () => {}, removeEventListener: () => {}, innerWidth: 1280, innerHeight: 720,
    AudioContext: function () {
      return {
        createOscillator: () => ({ connect: () => {}, frequency: { value: 0, setValueAtTime: () => {}, linearRampToValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} }, start: () => {}, stop: () => {}, type: '', disconnect: () => {} }),
        createGain: () => ({ connect: () => {}, gain: { value: 0, setValueAtTime: () => {}, linearRampToValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} }, disconnect: () => {} }),
        createBuffer: () => ({ getChannelData: () => new Float32Array(4410) }),
        createBufferSource: () => ({ connect: () => {}, buffer: null, start: () => {}, stop: () => {}, disconnect: () => {} }),
        currentTime: 0, destination: {}, state: 'running', resume: () => {}, close: () => {}, sampleRate: 44100,
      };
    },
    devicePixelRatio: 1, matchMedia: () => ({ matches: false, addEventListener: () => {}, addListener: () => {} }),
    scrollY: 0, scrollX: 0, location: { href: 'https://localhost/', hash: '', search: '', reload: () => {} },
    dispatchEvent: () => {},
  },
  document: {
    getElementById: (id) => mkEl({ id, parentElement: BODY, parentNode: BODY }),
    getElementsByTagName: () => [mkEl({ parentElement: BODY })],
    getElementsByClassName: () => [mkEl({ parentElement: BODY })],
    querySelector: () => mkEl({ parentElement: BODY }),
    querySelectorAll: () => [],
    addEventListener: () => {}, removeEventListener: () => {},
    createElement: (t) => mkEl({ tagName: t, parentElement: BODY, parentNode: BODY }),
    createTextNode: (t) => ({ textContent: t }),
    body: BODY, head: mkEl(), documentElement: DOC_EL,
    hidden: false, visibilityState: 'visible', readyState: 'complete', cookie: '',
  },
  adsbygoogle: { push: () => {} },
  localStorage: (() => { const m = {}; return { getItem: (k) => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = String(v); }, removeItem: (k) => { delete m[k]; }, clear: () => { for (const k in m) delete m[k]; } }; })(),
  sessionStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
  setInterval: () => 0, clearInterval: () => {},
  setTimeout: (fn, delay) => { if (typeof fn === 'function' && (delay || 0) <= 500) { try { fn(); } catch (e) {} } return 0; },
  clearTimeout: () => {},
  requestAnimationFrame: () => 0, cancelAnimationFrame: () => {},
  performance: { now: () => Date.now() },
  fetch: () => Promise.resolve({ ok: true, json: () => Promise.resolve({}), text: () => Promise.resolve('') }),
  navigator: { userAgent: 'verify', maxTouchPoints: 1, clipboard: { writeText: () => {} } },
  MutationObserver: function () { return { observe: () => {}, disconnect: () => {}, takeRecords: () => [] }; },
  ResizeObserver: function () { return { observe: () => {}, disconnect: () => {}, unobserve: () => {} }; },
  IntersectionObserver: function () { return { observe: () => {}, disconnect: () => {} }; },
  CustomEvent: function (t) { return { type: t }; },
  Event: function (t) { return { type: t }; },
  devicePixelRatio: 1,
};
sandbox.window.document = sandbox.document;
sandbox.window.localStorage = sandbox.localStorage;
sandbox.window.performance = sandbox.performance;
sandbox.window.navigator = sandbox.navigator;
sandbox.window.setTimeout = sandbox.setTimeout;
sandbox.window.requestAnimationFrame = sandbox.requestAnimationFrame;
sandbox.window.dispatchEvent = sandbox.window.dispatchEvent || (() => {});
sandbox.window.adsbygoogle = sandbox.adsbygoogle;
sandbox.AudioContext = sandbox.window.AudioContext;
sandbox.webkitAudioContext = sandbox.window.AudioContext;
sandbox.globalThis = sandbox;

const ctx = vm.createContext(sandbox);
let loadErr = null;
try { vm.runInContext(code, ctx, { filename: 'game.js' }); } catch (e) { loadErr = e; }
if (loadErr) { console.error('engine load error:', loadErr.stack && loadErr.stack.split('\n')[0] || loadErr.message); process.exit(1); }
// sanity: engine exposes the class + a constructor smoke test (same path as index.html's `new ChessGame()`)
const hasClass = vm.runInContext('typeof ChessGame === "function"', ctx);
if (!hasClass) { console.error('ChessGame class not available'); process.exit(1); }

const DRIVER = `(function(){
  const res = { whiteMoves:0, blackMoves:0, executed:0, illegalNoExc:0, kingLeftInCheck:0, notMoved:0,
                mateGameOver:false, mateInCheck:false, mateNoLegal:true, mateMsg:'', err:null, mateMoves:[] };
  function playClick(g, fr, fc, tr, tc) {
    g.onClick(fr, fc);       // select
    g.onClick(tr, tc);       // move to legal destination
    return g.board[tr][tc] !== null && g.lastMove && g.lastMove.to.r === tr && g.lastMove.to.c === tc;
  }
  try {
    // ---- Part A: legality sweep, depth 2 from the initial position ----
    const root = new ChessGame();
    for (let fr = 0; fr < 8; fr++) for (let fc = 0; fc < 8; fc++) {
      const piece = root.board[fr][fc];
      if (!piece || root.pieceColor(piece) !== 'white') continue;
      const moves = root.getLegalMoves(fr, fc);
      res.whiteMoves += moves.length;
      for (const m of moves) {
        const g = new ChessGame();
        const ok = playClick(g, fr, fc, m.r, m.c);
        res.executed++;
        if (!ok) res.notMoved++;
        if (g.turn !== 'black') res.illegalNoExc++;
        // after white's move it must not be WHITE's king in check (black may check white — fine,
        // but the mover's own king must never be left in check)
        const whiteInCheck = g.isInCheck('white');
        if (whiteInCheck) res.kingLeftInCheck++;
        // every black reply
        for (let br = 0; br < 8; br++) for (let bc = 0; bc < 8; bc++) {
          const bp = g.board[br][bc];
          if (!bp || g.pieceColor(bp) !== 'black') continue;
          const bmoves = g.getLegalMoves(br, bc);
          res.blackMoves += bmoves.length;
          for (const bm of bmoves) {
            const g2 = new ChessGame();
            // replay white's move on the fresh game, then black's reply
            playClick(g2, fr, fc, m.r, m.c);
            const ok2 = playClick(g2, br, bc, bm.r, bm.c);
            res.executed++;
            if (!ok2) res.notMoved++;
            if (g2.isInCheck('black')) res.kingLeftInCheck++;
          }
        }
      }
    }

    // ---- Part B: scholar's mate vs a deliberately suicidal opponent ----
    // 1.e4 e5  2.Qh5 Nc6  3.Bc4 Nf6??  4.Qxf7#
    const g = new ChessGame();
    const seq = [
      [6,4,4,4], // e4
      [1,4,3,4], // e5
      [7,3,3,7], // Qh5
      [0,1,2,2], // Nc6
      [7,5,4,2], // Bc4
      [0,6,2,5], // Nf6??
      [3,7,1,5], // Qxf7#
    ];
    for (const [fr, fc, tr, tc] of seq) {
      const ok = playClick(g, fr, fc, tr, tc);
      res.mateMoves.push((ok ? '' : 'FAIL:') + String.fromCharCode(97+fc) + (8-fr) + String.fromCharCode(97+tc) + (8-tr));
      if (!ok) break;
    }
    res.mateGameOver = g.gameOver === true;
    res.mateInCheck = g.isInCheck('black') === true;
    res.mateNoLegal = g.hasAnyLegalMove('black') === false;
  } catch (e) { res.err = String(e && e.stack || e).slice(0, 300); }
  return res;
})()`;

let r;
try { r = vm.runInContext(DRIVER, ctx); } catch (e) { console.error('driver error:', e.stack && e.stack.split('\n').slice(0,3).join(' | ') || e.message); process.exit(1); }
if (r.err) console.error('driver reported error:', r.err);

const checks = [];
checks.push(['engine-load-no-fatal-error', !r.err]);
checks.push(['legality-sweep-no-exceptions (' + r.executed + ' moves executed: ' + r.whiteMoves + ' white + ' + r.blackMoves + ' black legal moves enumerated)', r.notMoved === 0 && r.illegalNoExc === 0]);
checks.push(['no-move-leaves-movers-king-in-check', r.kingLeftInCheck === 0]);
checks.push(['scholar-s-mate-executed (' + r.mateMoves.join(' ') + ')', r.mateMoves.length === 7 && !r.mateMoves.some(m => m.startsWith('FAIL'))]);
checks.push(['engine-declares-checkmate (gameOver=' + r.mateGameOver + ', inCheck=' + r.mateInCheck + ', blackNoLegal=' + r.mateNoLegal + ')', r.mateGameOver && r.mateInCheck && r.mateNoLegal]);
let pass = 0, fail = 0; const fails = [];
for (const [name, ok] of checks) { if (ok) pass++; else { fail++; fails.push(name); } }
console.log('chess in-engine verification: executed=' + r.executed + ' (white=' + r.whiteMoves + ', black=' + r.blackMoves + ') notMoved=' + r.notMoved + ' kingInCheckViolations=' + r.kingLeftInCheck + ' mate=' + r.mateMoves.join(' ') + ' gameOver=' + r.mateGameOver);
console.log(JSON.stringify({ pass, fail, fails, total: checks.length, goal: 'all legal moves execute cleanly (depth-2 sweep) + checkmate a suicidal opponent via scholar\'s mate', steps: r.executed + r.mateMoves.length, verdict: fail === 0 ? 'PASS' : 'FAIL' }));
process.exit(fail === 0 ? 0 : 1);
