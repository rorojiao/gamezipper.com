/* Shared vm harness for verify_engine.js authors — require() this instead of pasting the sandbox.
 * Provides: bootGame(slug) -> {ctx, api, el, dispatchKey, dispatchPointerAt, pump, readLS, call(fExpr)}
 * The sandbox stubs match _optimization/scripts/verifier-spec.md v3 (canvas Proxy incl gradients,
 * localStorage map, seeded Math.random, immediate setTimeout with error capture). */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const REPO = path.resolve(__dirname, '..', '..');

// browsers compile inline event-handler attributes (onclick="startGame()") at parse
// time, with page-global scope and this=element. pattern-matrix and similar engines
// drive their whole UI through markup onclicks, so the harness compiles them too.
let handlerCtx = null; // set once the vm context exists; until then handlers are stashed
function compileInlineHandler(el, code) {
  try { el.onclick = vm.compileFunction(code, ['event'], { parsingContext: handlerCtx }); }
  catch (e) { el.__onclickErr = String((e && e.message) || e); }
}
function stashInlineHandler(el, code) {
  if (handlerCtx) compileInlineHandler(el, code); else el.__pending_onclick = code;
}
// recursive static-markup parse (the page's own HTML, assigned once at boot —
// engine-assigned innerHTML keeps the one-level parse below, matching prior behavior)
// balanced open-tag matcher: finds tag+attrs+content for the element starting at
// `from` (handles same-tag nesting — a lazy `[\s\S]*?<\/tag>` truncates a div's content
// at its first nested </div>, silently dropping siblings after it)
function matchTag(html, from) {
  const open = /^<([a-zA-Z][a-zA-Z0-9]*)((?:\s+[^<>]*?)?)\s*(\/?)>/.exec(html.slice(from));
  if (!open) return null;
  const tag = open[1];
  const after = from + open[0].length;
  if (open[3] === '/') return { tag, attrs: open[2] || '', content: undefined, next: after }; // self-closing
  const lt = tag.toLowerCase();
  let d = 1, i = after;
  for (;;) {
    const nx = html.indexOf('<', i);
    if (nx < 0) return { tag, attrs: open[2] || '', content: undefined, next: after }; // void element (img/br): no close
    if (html[nx + 1] === '/') {
      const end = html.indexOf('>', nx);
      if (html.slice(nx + 2, end).trim().toLowerCase() === lt) { d--; if (d === 0) return { tag, attrs: open[2] || '', content: html.slice(after, nx), next: end + 1 }; }
      i = end + 1;
    } else {
      const end = html.indexOf('>', nx);
      const inner = html.slice(nx + 1, end).toLowerCase();
      const selfClose = html.slice(nx, end + 1).endsWith('/>');
      if (!selfClose && (inner === lt || inner.startsWith(lt + ' ') || inner.startsWith(lt + '\n') || inner.startsWith(lt + '\t'))) d++;
      i = end + 1;
    }
  }
}
const VOID_TAGS = new Set(['br', 'hr', 'img', 'input', 'meta', 'link', 'source', 'area', 'base', 'col', 'embed', 'track', 'wbr']);
function parseMarkupChildren(el, html, depth, mirror) {
  let i = 0;
  for (;;) {
    const lt = html.indexOf('<', i);
    if (lt < 0) break;
    const m = matchTag(html, lt);
    if (!m) { i = lt + 1; continue; } // not a tag start (script `i<n`, comments) — skip this '<'
    if (m.next <= lt) { i = lt + 1; continue; }
    i = m.next;
    if (VOID_TAGS.has(m.tag.toLowerCase())) continue; // void tags carry no children/text
    const child = makeEl();
    child.tagName = child.nodeName = m.tag;
    if (mirror) child.__mirror = true; // id-subtree parse: this node DUPLICATES the canonical body-tree node (the id-extraction lazy match truncates inner HTML at the first same-tag close, e.g. woodoku's #piece-tray yields a phantom extra .piece-slot) — document-level walks must skip it or engines double-bind / render onto shifted elements
    const cls = /class="([^"]*)"/.exec(m.attrs || '');
    if (cls) String(cls[1]).split(/\s+/).forEach(t => t && child.classList._s.add(t)); // seed the live set only — className is a stale fallback view, classList.remove() only clears the set
    const idm = /\sid="([^"]*)"/.exec(m.attrs || '');
    if (idm) child.id = idm[1]; // deep static-markup nodes must be addressable by id (find-n-merge's per-screen X/PLAY/GOT IT buttons live past nested divs, where the els-extraction lazy match truncates)
    // data-* attrs -> dataset: killer-sudoku wires .diff-btn/.puzzle-btn handlers that read
    // this.dataset.diff / this.dataset.idx — a parsed node without dataset silently yields NaN
    // (same regex as the find-n-merge els-extraction below). Also mirrored to __attr_ storage:
    // real DOM getAttribute('data-lv') works too (tangram showLS cells parse it).
    for (const dm of String(m.attrs || '').matchAll(/\sdata-([a-zA-Z0-9_-]+)="([^"]*)"/g)) { child.dataset[dm[1].replace(/-([a-z])/g, (c) => c[1].toUpperCase())] = dm[2]; child['__attr_data-' + dm[1]] = dm[2]; }
    const oc = /\sonclick="([^"]*)"/.exec(m.attrs || '');
    if (oc) stashInlineHandler(child, oc[1]);
    if (m.content !== undefined) {
      if (/<[a-zA-Z]/.test(m.content)) { if (depth > 0) parseMarkupChildren(child, m.content, depth - 1, mirror); }
      else child.textContent = m.content;
    }
    el.children.push(child);
    child.parentNode = child.parentElement = el;
  }
}

// compound/descendant selector matching (`.grid .cell`, `.cell[data-row="1"][data-col="2"]`,
// `div.piece[data-index="0"]`, `.a.b`) — the simple class/tag/attr walks can't express these;
// tetra-fit resolves drop targets and hint cells through them. Tree order: registry first,
// then the parsed body; deduped by identity. Engaged ONLY when the simple branches found
// nothing real, so existing outcomes (and the fake fallback) are unchanged.
function qsPartMatches(part, el) {
  let rest = String(part);
  const tagM = /^([a-zA-Z][\w-]*)/.exec(rest);
  if (tagM) { rest = rest.slice(tagM[0].length); if (String(el.tagName || '').toLowerCase() !== tagM[1].toLowerCase()) return false; }
  const idM = /^#([\w-]+)/.exec(rest);
  if (idM) { rest = rest.slice(idM[0].length); if (el.id !== idM[1]) return false; }
  let any = !!tagM || !!idM;
  while (rest[0] === '.') { const cM = /^\.([\w-]+)/.exec(rest); if (!cM) return false; rest = rest.slice(cM[0].length); any = true; if (!(el.classList && el.classList.contains(cM[1]))) return false; }
  for (const m of rest.matchAll(/\[\s*([\w-]+)\s*(?:=\s*"([^"]*)")?\s*\]/g)) {
    any = true;
    const dk = m[1].replace(/^data-/, '').replace(/-([a-z])/g, (c) => c[1].toUpperCase());
    const val = el.dataset && el.dataset[dk] !== undefined ? String(el.dataset[dk]) : (el['__attr_' + m[1]] !== undefined ? String(el['__attr_' + m[1]]) : null);
    if (m[2] === undefined ? val === null : val !== String(m[2])) return false;
  }
  return any && rest.replace(/\[[^\]]*\]/g, '').trim() === '';
}
function qsGeneral(sel, els, root) {
  const parts = String(sel).trim().split(/\s+/);
  const out = [], seen = new Set();
  const consider = (el) => {
    if (seen.has(el) || !qsPartMatches(parts[parts.length - 1], el)) return;
    seen.add(el);
    let need = parts.length - 1, a = el.parentNode;
    while (need > 0 && a && a !== root) { if (qsPartMatches(parts[need - 1], a)) need--; a = a.parentNode; }
    if (need === 0) out.push(el);
  };
  const walk = (el) => { for (const c of (el.children || [])) { if (c.__mirror) continue; walk(c); consider(c); } };
  for (const id of Object.keys(els)) { const r = els[id]; if (!Array.isArray(r)) { consider(r); walk(r); } }
  walk(root);
  return out;
}
function qsCompoundish(sel) { return sel.includes(' ') || /\.[\w-]*\[/.test(sel) || (sel.startsWith('.') && sel.slice(1).includes('.')) || /:not\(/.test(sel); }
// ":not()" class-selector chains (tangram showLS wires its level grid via
// querySelectorAll('.lc:not(.lk)')) — need-classes + not-classes matched
// against the LIVE element tree so onclick lands on the real parsed nodes.
function parseNotClasses(sel) {
  const m = /^((?:\.[\w-]+)+)((?::not\(\.[\w-]+\))*)$/.exec(String(sel).trim());
  if (!m) return null;
  return {
    need: [...m[1].matchAll(/\.[\w-]+/g)].map(x => x[0].slice(1)),
    not: [...m[2].matchAll(/:not\(\.([\w-]+)\)/g)].map(x => x[1]),
  };
}
function matchesNotClasses(el, s) {
  const cn = String(el.className || '').split(/\s+/).filter(Boolean);
  return s.need.every(c => cn.includes(c)) && !s.not.some(c => cn.includes(c));
}

function makeEl(extra) {
  const listeners = {};
  const elBase = { tagName: 'div', nodeName: 'div' };
  const el = {
    id: '', className: '', textContent: '', innerHTML: '', value: '',
    style: { setProperty() {} }, dataset: {},
    classList: { _s: new Set(), add(...c) { c.forEach(x => this._s.add(x)); }, remove(...c) { c.forEach(x => this._s.delete(x)); }, toggle(c, f) { const on = f === undefined ? !this._s.has(c) : !!f; on ? this._s.add(c) : this._s.delete(c); return on; }, contains(c) { return this._s.has(c) || String(el.className).split(/\s+/).includes(c); } }, // className assignments and classList must agree (boggle's getDieFromEvent checks classList after engines set className directly)
    children: [], width: 480, height: 640, clientWidth: 480, clientHeight: 640, offsetWidth: 480, offsetHeight: 640, scrollWidth: 480, scrollHeight: 640,
    disabled: false, hidden: false, checked: false,
    addEventListener(t, f) { const L = listeners[t] = listeners[t] || []; if (L.indexOf(f) === -1) L.push(f); }, // browser-accurate: identical (type, callback) registrations are deduped (shape-fold setupCanvas re-binds on every showGame; dupes double-fired every click)
    // real removal (2026-08-25): hashiwokakero's setupCanvas does remove-then-add on the
    // canvas every game; with a no-op remove, listeners piled up one per game start and
    // every click toggled the same bridge N times (N games -> net 0 or 1 by parity).
    // Mirrors the document/window stubs — browsers really drop the handler.
    removeEventListener(t, f) { if (listeners[t]) listeners[t] = listeners[t].filter((x) => x !== f); }, /* dispatch binds the element as `this` — engines rely on it (e.g. btnStart's this.disabled) */
    cloneNode(deep) { // drag ghosts: tetra-fit's startDrag clones the picked piece and positions the clone via style.left/top (listeners intentionally NOT copied — browsers don't copy them either)
      const c = makeEl({ tagName: this.tagName, nodeName: this.nodeName, id: this.id, className: this.className, textContent: this.textContent, value: this.value });
      for (const t of this.classList._s) c.classList._s.add(t);
      Object.assign(c.dataset, this.dataset);
      for (const k of Object.keys(this.style)) if (k !== 'setProperty') c.style[k] = this.style[k];
      if (deep) for (const ch of (this.children || [])) c.appendChild(ch.cloneNode(true));
      return c;
    },
    dispatch(t, ev) { ev = ev || {}; ev.preventDefault = ev.preventDefault || (() => {}); ev.stopPropagation = ev.stopPropagation || (() => {}); const el = this; ev.target = ev.target || el; ev.currentTarget = el; // browsers set both during dispatch (futoshiki gzCellClick reads e.currentTarget.dataset)
      (listeners[t] || []).forEach(f => f.call(el, ev)); const h = this['on' + t]; if (typeof h === 'function') { try { h.call(el, ev); } catch (e) {} } return true; }, // browsers fire BOTH addEventListener listeners and the on<event> property (black/beads-out style engines use d.onclick=)
    getContext: () => mk2d(),
    setPointerCapture() {}, releasePointerCapture() {}, // pointer-capture API: no-op here, listeners stay on the capturing element
    animate() { return { onfinish: null, cancel() {}, finish() {}, finished: Promise.resolve() }; }, // WAAPI: confetti-style engines set anim.onfinish=()=>el.remove() (outside-sudoku)
    // browser-accurate: setting style.left/top moves the rect (drag-geometry games like
    // black/moon-eclipse compute wins from two elements' rects). Falls back to the old
    // static 480x640 at origin when no inline position/size is set.
    getBoundingClientRect() {
      const st = this.style || {};
      const l = parseFloat(st.left) || 0, t = parseFloat(st.top) || 0;
      const w = parseFloat(st.width) || this.offsetWidth || 480;
      const h = parseFloat(st.height) || this.offsetHeight || 640;
      return { left: l, top: t, right: l + w, bottom: t + h, width: w, height: h, x: l, y: t };
    },
    appendChild(c) { this.children.push(c); if (c && c.parentNode !== this) { c.parentNode = c.parentElement = this; } return c; }, insertBefore(c, ref) { const i = ref ? this.children.indexOf(ref) : -1; if (i < 0) this.children.push(c); else this.children.splice(i, 0, c); if (c && c.parentNode !== this) { c.parentNode = c.parentElement = this; } return c; }, get nextSibling() { if (this.parentNode && this.parentNode.children) { const i = this.parentNode.children.indexOf(this); return this.parentNode.children[i + 1] || null; } return null; }, removeChild(c) { const i = this.children.indexOf(c); if (i >= 0) this.children.splice(i, 1); return c; }, remove() { if (this.parentElement) this.parentElement.removeChild(this); }, parentElement: null,
    focus() {}, blur() {}, click() { this.dispatch('click'); }, scrollIntoView() {}, // crossword selectWord scrolls the clue into view
    insertAdjacentHTML() {}, insertAdjacentElement() {},
    // closest walks self→ancestors matching class/#id (family-tree tray handler resolves
    // e.target.closest('.tile'); browsers return the element itself on a self-match)
    closest(sel) { const s = String(sel); let n = this; while (n) { if (s.startsWith('.') ? (n.classList && n.classList.contains(s.slice(1))) : s.startsWith('#') ? n.id === s.slice(1) : n.tagName === s.toUpperCase()) return n; n = n.parentNode; } return null; },
    contains() { return false; }, matches() { return false; },
    get firstChild() { if ((this.children || []).length) return this.children[0]; if (!this.__txt) this.__txt = { textContent: '' }; return this.__txt; }, // harness els never parse markup; browsers give real nodes — a text stub beats null for engines doing hud.firstChild.textContent
    get lastChild() { const c = this.children || []; if (c.length) return c[c.length - 1]; if (!this.__txt) this.__txt = { textContent: '' }; return this.__txt; },
    setAttribute(k, v) { this['__attr_' + k] = v; if (k === 'id') this.id = v; if (k === 'onclick' && typeof v === 'string') stashInlineHandler(this, v); }, getAttribute(k) { return this['__attr_' + k] === undefined ? null : this['__attr_' + k]; }, removeAttribute(k) { delete this['__attr_' + k]; }, hasAttribute(k) { return this['__attr_' + k] !== undefined; },
    // per-element cache: engines do wrap = s.querySelector('div') then appendChild into it —
    // a fresh stub per call would orphan those children (black L3/L7/L22 star/letter taps)
    // #id lookups search PARSED descendants first (engine wiring lands on the real node
    // the verifier then clicks); unknown selectors keep the per-element stub cache so
    // repeated engine qs() calls return the same object as before
    querySelector(sel) {
      this.__qs = this.__qs || {};
      if (String(sel)[0] === '#') { const id = String(sel).slice(1); const find = (el) => { for (const c of (el.children || [])) { if (c.id === id) return c; const r = find(c); if (r) return r; } return null; }; const hit = find(this); if (hit) return hit; }
      if (!this.__qs[sel]) this.__qs[sel] = makeEl();
      return this.__qs[sel];
    },
    // class selectors return ALL descendants (real querySelectorAll semantics — overlays
    // wire nested .lvl-cell grids 3 levels down)
    querySelectorAll(sel) {
      const s = parseNotClasses(sel);
      if (s) { const out = []; const walk = (el) => { for (const c of (el.children || [])) { if (matchesNotClasses(c, s)) out.push(c); walk(c); } }; walk(this); return out; }
      const cls = String(sel).replace(/^\./, ''); const out = []; const walk = (el) => { for (const c of (el.children || [])) { if (c.classList && (c.classList.contains(cls) || String(c.className || '').split(/\s+/).includes(cls))) out.push(c); walk(c); } }; walk(this); return out;
    },
  };
  // every innerHTML assignment replaces children in a real browser (black re-renders grids/wraps per level; keeping stale children made verifiers click previous levels' tiles).
  // Parse simple markup into child elements one level deep — engines iterate .children
  // of innerHTML-built containers (constellation-connect star spans, color-blend wells).
  try {
    let _ih = '';
    Object.defineProperty(el, 'innerHTML', {
      get: () => _ih,
      set(v) {
        _ih = String(v);
        el.children.length = 0;
        // recursive parse: overlays nest buttons/grids 3-4 deep (family-tree level cells);
        // balanced same-tag matching via matchTag (nested div-in-div truncation bug)
        const parse = (parent, html, depth) => {
          let i = 0;
          for (;;) {
            const lt = html.indexOf('<', i);
            if (lt < 0) break;
            const m = matchTag(html, lt);
            if (!m) { i = lt + 1; continue; }
            if (m.next <= lt) { i = lt + 1; continue; }
            i = m.next;
            if (VOID_TAGS.has(m.tag.toLowerCase())) continue;
            const child = makeEl();
            child.tagName = child.nodeName = m.tag;
            const cls = /class="([^"]*)"/.exec(m.attrs || '');
            if (cls) { child.className = cls[1]; String(cls[1]).split(/\s+/).forEach(t => t && child.classList._s.add(t)); }
            const idm = /\sid="([^"]*)"/.exec(m.attrs || '');
            if (idm) child.id = idm[1];
            for (const dm of String(m.attrs || '').matchAll(/data-([a-zA-Z0-9_-]+)="([^"]*)"/g)) { child.dataset[dm[1].replace(/-([a-z])/g, (c) => c[1].toUpperCase())] = dm[2]; child['__attr_data-' + dm[1]] = dm[2]; }
            const oc = /\sonclick="([^"]*)"/.exec(m.attrs || '');
            if (oc) stashInlineHandler(child, oc[1]);
            if (m.content !== undefined) {
              if (/<[a-zA-Z]/.test(m.content)) { if (depth > 0) parse(child, m.content, depth - 1); }
              else child.textContent = m.content;
            }
            parent.children.push(child);
          }
        };
        parse(el, _ih, 6);
      },
    });
  } catch (e) {}
  // dynamic script/link loading: onload fires on the NEXT pump frame (browsers load
  // asynchronously; engines assign .onload AFTER .src, so a synchronous fire would miss it)
  let _src = '';
  try {
    Object.defineProperty(el, 'src', { get: () => _src, set(v) { _src = v; module.exports.__pendingOnloads.push(() => { if (typeof el.onload === 'function') { try { el.onload(); } catch (e) {} } }); } });
  } catch (e) {}
  el.tagName = (extra && extra.tagName) || 'div';
  el.nodeName = el.tagName;
  return Object.assign(el, extra || {});
}
function mk2d() {
  const grad = { addColorStop() {} };
  return new Proxy({}, {
    get: (t, p) => {
      if (p === 'measureText') return () => ({ width: 10 });
      if (p === 'createLinearGradient' || p === 'createRadialGradient' || p === 'createPattern') return () => grad;
      if (p === 'getImageData') return () => ({ data: new Uint8ClampedArray(4) });
      if (p === 'canvas') return { width: 480, height: 640 };
      if (typeof p === 'string' && !(p in t)) return () => 1;
      return t[p];
    },
    set: () => true,
  });
}
function mkAudio() {
  const node = () => ({ connect() { return node(); }, disconnect() {}, start() {}, stop() {}, frequency: { value: 0, setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {} }, gain: { value: 0, setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {}, setTargetAtTime() {} }, Q: { value: 0, setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {} }, detune: { value: 0, setValueAtTime() {} }, type: 'sine', playbackRate: { value: 1, setValueAtTime() {} } });
  return { currentTime: 0, state: 'running', sampleRate: 44100, destination: node(), resume() { return Promise.resolve(); }, suspend() { return Promise.resolve(); }, close() { return Promise.resolve(); }, createGain: node, createOscillator: node, createBufferSource: node, createAnalyser: node, createBiquadFilter: node, createDynamicsCompressor: node, createDelay: node, createBuffer: () => ({ getChannelData: () => new Float32Array(64) }), decodeAudioData: () => Promise.resolve({ getChannelData: () => new Float32Array(64) }), listener: { setPosition() {}, setOrientation() {} } };
}
function bootGame(slug, opts) {
  handlerCtx = null; // per-boot: a second bootGame in the same process must not compile handlers into the previous context
  opts = opts || {};
  const loadErrorsLater = [];
  const html = fs.readFileSync(path.join(REPO, slug, 'index.html'), 'utf8');
  // inline scripts (skipping ld+json) + LOCAL external scripts (src without a scheme) in DOM order
  const scripts = [];
  for (const m of html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)) {
    const attrs = m[1] || '', body = m[2];
    if (/application\/ld\+json/.test(attrs)) continue;
    const src = (attrs.match(/src="([^"]+)"/) || [])[1];
    if (src) {
      if (/^https?:|^\/\//.test(src)) continue; // external CDN — page must work without it
      const clean = src.split('?')[0].split('#')[0];
      // opts.scriptOverrides: { 'three.min.js': source } swaps a local script's payload —
      // used for WebGL libraries that cannot run headless (verifiers drive logic, not pixels)
      const ov = opts.scriptOverrides && Object.entries(opts.scriptOverrides).find(([k]) => clean.endsWith(k));
      if (ov) { scripts.push(ov[1]); continue; }
      const local = clean.startsWith('/') ? path.join(REPO, clean) : path.join(REPO, slug, clean);
      try { scripts.push(fs.readFileSync(local, 'utf8')); } catch (e) { loadErrorsLater.push('src ' + src + ': ' + e.code); }
    } else if (body.trim()) scripts.push(body);
  }
  const els = {};
  // a stand-in for the page's first <script> tag (ad-snippet insertBefore anchors on it)
  els[':script0'] = makeEl({ tagName: 'script', nodeName: 'script' });
  let seed = opts.seed || 424242;
  const rafQ = [];
  const timers = [];
  const sandbox = {
    console: { log() {}, error: (...a) => { (sandbox.__errors = sandbox.__errors || []).push(a.map(String).join(' ')); }, warn() {} },
    Date, JSON, Math,
    setTimeout: (f, ms) => { const id = (timers._seq = (timers._seq || 0) + 1); timers.push({ f, at: (sandbox.__now || 0) + (ms || 0), id }); return id; }, // return the id actually stored — the old off-by-one made every clearTimeout kill the WRONG timer (go-fish's aiTimer clear cancelled unrelated callbacks and froze games)
    clearTimeout: (id) => { const i = timers.findIndex(t => t.id === id); if (i >= 0) timers.splice(i, 1); },
    setInterval: (f, ms) => { const id = (timers._seq = (timers._seq || 0) + 1) + 1000000; timers.push({ f, at: (sandbox.__now || 0) + (ms || 1), every: ms || 1, id }); return id; },
    clearInterval: (id) => { const i = timers.findIndex(t => t.id === id); if (i >= 0) timers.splice(i, 1); },
    // real cancel: games that cancel+restart their rAF chain (cancelAnimationFrame(rafId) in
    // startGame) accumulated zombie loops under the old no-op — every pump then ran update
    // twice+ and physics diverged from single-step mirrors (gravity-flip frame-2 lockstep)
    requestAnimationFrame: (f) => { const id = (rafQ._seq = (rafQ._seq || 0) + 1); rafQ.push({ id, f }); return id; },
    cancelAnimationFrame: (id) => { if (!id) return; for (let i = rafQ.length - 1; i >= 0; i--) if (rafQ[i] && rafQ[i].id === id) rafQ.splice(i, 1); },
    requestIdleCallback: (f) => { try { f({ didTimeout: false, timeRemaining: () => 50 }); } catch (e) {} return 0; }, cancelIdleCallback() {},
    BroadcastChannel: function () { this.postMessage = () => {}; this.onmessage = null; this.close = () => {}; this.addEventListener = () => {}; this.removeEventListener = () => {}; },
    URL, URLSearchParams, structuredClone: (o) => JSON.parse(JSON.stringify(o)), TextEncoder, TextDecoder, btoa: (s) => Buffer.from(String(s), 'binary').toString('base64'), atob: (s) => Buffer.from(String(s), 'base64').toString('binary'),
    performance: { now: () => sandbox.__now || 0 },
    __now: 0,
    localStorage: (() => { const m = {}; return { getItem: k => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = String(v); }, removeItem: k => { delete m[k]; }, clear: () => { for (const k in m) delete m[k]; }, key: i => Object.keys(m)[i] || null, get length() { return Object.keys(m).length; }, _m: m }; })(),
    sessionStorage: (() => { const m = {}; return { getItem: k => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = String(v); }, removeItem: k => { delete m[k]; }, clear: () => { for (const k in m) delete m[k]; }, key: i => Object.keys(m)[i] || null, get length() { return Object.keys(m).length; } }; })(),
    navigator: { userAgent: 'node', maxTouchPoints: 1, vibrate() {}, platform: 'linux' },
    location: { href: 'http://localhost/' + slug + '/', search: '', hash: '', origin: 'http://localhost', protocol: 'http:', host: 'localhost', pathname: '/' + slug + '/', reload() {}, assign() {}, replace() {} },
    document: {
      getElementById: (id) => {
        if (!els[id]) { els[id] = makeEl({ id }); els[id].parentNode = els[id].parentElement = sandbox.document.body; } // site-infra scripts walk .parentNode to inject banners
        return els[id];
      },
      querySelector: (sel) => {
        const idm = /^#([A-Za-z][\w-]*)$/.exec(sel);
        if (idm) { if (!els[idm[1]]) { els[idm[1]] = makeEl({ id: idm[1] }); els[idm[1]].parentNode = els[idm[1]].parentElement = sandbox.document.body; } return els[idm[1]]; } // #id aliases getElementById (engines bind via $()); parentNode wired for ad-infra walks
        if (qsCompoundish(sel)) { const r = qsGeneral(sel, els, sandbox.document.body); if (r && r.length) return r[0]; }
        const k = 'q:' + sel;
        if (!els[k]) { els[k] = makeEl({ className: String(sel).replace(/^\./, '') }); els[k].parentElement = els[k].parentNode = sandbox.document.body; } // site-infra scripts inject banners via canvasWrap.parentNode (real DOM always has one)
        return els[k];
      },
      querySelectorAll(sel) {
        // live walk, uncached: levels re-render grids mid-session (boggle 4x4 -> 5x5) and a
        // cached node list goes stale against the rebuilt children
        const s2 = parseNotClasses(sel);
        if (s2) {
          const out = [], seen = new Set();
          const add = (e) => { if (matchesNotClasses(e, s2) && !seen.has(e)) { seen.add(e); out.push(e); } };
          const walkN = (el) => { for (const c of (el.children || [])) { if (c.__mirror) continue; add(c); walkN(c); } };
          for (const id of Object.keys(els)) { const r = els[id]; if (!Array.isArray(r) && r.className !== undefined) { add(r); walkN(r); } }
          walkN(sandbox.document.body);
          if (out.length) return out;
        }
        if (sel.startsWith('.') || /^[a-z]+$/i.test(sel)) {
          const cls = String(sel).replace(/^\./, '');
          const tag = /^[a-z]+$/i.test(sel) ? sel : null;
          const out = [];
          const walk = (el) => { for (const c of (el.children || [])) { if (c.__mirror) continue; walk(c); const cn = String(c.className || ''); if (tag ? c.tagName === tag : (cls && cn.split(/\s+/).includes(cls)) || (cls && c.classList && c.classList.contains(cls))) out.push(c); } };
          // top-level els (markup ids) are body children in a real DOM — class selectors must
          // match them too (schulte showScreen does querySelectorAll('.screen') on top-level
          // screens; getElementsByClassName below already root-checks). Tag selectors stay
          // children-only: every stub defaults to tagName 'div', root-matching 'div' would
          // return the whole cache.
          if (cls && !tag) for (const id of Object.keys(els)) { const r = els[id]; if (!Array.isArray(r) && r.classList && r.classList.contains(cls)) out.push(r); }
          for (const id of Object.keys(els)) walk(els[id]);
          // the parsed body tree is the real DOM — static class-wired markup (killer-sudoku's
          // .diff-btn menu) only exists there; the els-registry stubs approximate it and miss
          // nodes. Appended after the registry matches (existing index consumers unchanged);
          // deduped because id stubs and parsed nodes are distinct objects covering the same
          // markup — a dup would double-bind a click handler and fire it twice per click.
          const seen = new Set(out);
          const walkBody = (el) => { for (const c of (el.children || [])) { walkBody(c); const cn = String(c.className || ''); if (tag ? c.tagName === tag : (cls && cn.split(/\s+/).includes(cls)) || (cls && c.classList && c.classList.contains(cls))) { if (!seen.has(c)) { seen.add(c); out.push(c); } } } };
          walkBody(sandbox.document.body);
          if (out.length) return out;
        }
        // attribute selectors `[k]` / `[k="v"]` (chains + optional tag): engines mark cells
        // this way (einstein-riddle flashes `[data-house="0"][data-attr="color"]`) — match
        // dataset OR setAttribute storage, live walk like the class branch above
        if (/^\w*(\[[^\]]+\])+$/.test(sel)) {
          const tagM = (sel.match(/^(\w+)?/) || [])[1] || null;
          const conds = [...String(sel).matchAll(/\[\s*([\w-]+)\s*(?:=\s*"([^"]*)")?\s*\]/g)].map((m) => ({ k: m[1], v: m[2] }));
          const test = (el) => (!tagM || String(el.tagName || '').toLowerCase() === tagM.toLowerCase()) && conds.every(({ k, v }) => {
            // dataset proxies data-some-attr as .someAttr (camelCase)
            const dk = k.replace(/^data-/, '').replace(/-([a-z])/g, (c) => c[1].toUpperCase());
            const val = el.dataset && el.dataset[dk] !== undefined ? String(el.dataset[dk]) : (el['__attr_' + k] !== undefined ? String(el['__attr_' + k]) : null);
            return v === undefined ? val !== null : val === String(v);
          });
          const out = [];
          const walk = (el) => { for (const c of (el.children || [])) { if (c.__mirror) continue; if (test(c)) out.push(c); walk(c); } };
          walk(sandbox.document.body);
          for (const id of Object.keys(els)) { const r = els[id]; if (!Array.isArray(r) && test(r)) out.push(r); walk(r); }
          if (out.length) return out;
        }
        if (qsCompoundish(sel)) { const out2 = qsGeneral(sel, els, sandbox.document.body); if (out2.length) return out2; }
        const key = 'qa:' + sel;
        if (!els[key]) {
          const n = (opts.qsAll && opts.qsAll[sel]) || 6;
          const arr = []; for (let i = 0; i < n; i++) arr.push(makeEl({ className: String(sel).replace(/^\./, '') }));
          els[key] = arr;
        }
        return els[key];
      },
      addEventListener(t, f) { (this.__dls = this.__dls || {})[t] = (this.__dls[t] || []).concat(f); },
      removeEventListener(t, f) { if (this.__dls && this.__dls[t]) this.__dls[t] = this.__dls[t].filter((x) => x !== f); },
      dispatch(t, ev) { ev = ev || {}; ev.preventDefault = ev.preventDefault || (() => {}); ev.stopPropagation = ev.stopPropagation || (() => {}); ((this.__dls || {})[t] || []).forEach(f => { try { f.call(this, ev); } catch (e) {} }); return true; },
      // real DOM API (killer-sudoku endGame dispatches new Event('gameover') on document);
      // window.dispatchEvent below already mirrors this for __wls
      dispatchEvent(ev) { ev = ev || {}; ev.preventDefault = ev.preventDefault || (() => {}); ev.stopPropagation = ev.stopPropagation || (() => {}); ((this.__dls || {})[ev.type] || []).forEach(f => { try { f.call(this, ev); } catch (e) {} }); return true; },
      createElement: (tag) => makeEl({ tagName: String(tag || 'div').toUpperCase(), nodeName: String(tag || 'div').toUpperCase() }), // browsers report UPPER tagName (2026-08-25)
      createElementNS: () => makeEl(),
      getElementsByTagName(tag) { const out = []; const walk = (el) => { const cn = String(el.tagName || el.nodeName || ''); if (String(tag) === '*' || cn.toLowerCase() === String(tag).toLowerCase()) out.push(el); for (const c of (el.children || [])) walk(c); }; for (const id of Object.keys(els)) walk(els[id]); return out; },
      getElementsByClassName(cls) { const out = []; const walk = (el) => { if (String(el.className || '').split(/\s+/).includes(String(cls))) out.push(el); for (const c of (el.children || [])) { if (c.__mirror) continue; walk(c); } }; for (const id of Object.keys(els)) walk(els[id]); return out; },
      // deepest registered element whose (style-derived) rect contains the point —
      // engines like boggle resolve their grid tiles through elementFromPoint
      elementFromPoint(x, y) {
        const walk = (el) => {
          let hit = null;
          for (const c of (el.children || [])) { const r = walk(c); if (r) hit = r; }
          if (hit) return hit;
          try { const r = this.getElementById === undefined ? null : null; } catch (e) {}
          const rr = el.getBoundingClientRect && el.getBoundingClientRect();
          if (rr && x >= rr.left && x <= rr.right && y >= rr.top && y <= rr.bottom && (el.children || []).length === 0) return el;
          return null;
        };
        for (const id of Object.keys(els)) { const r = walk(els[id]); if (r) return r; }
        return null;
      },
      createTextNode: t => ({ textContent: t }),
      body: makeEl(), head: makeEl(), documentElement: makeEl(),
      hidden: false, visibilityState: 'visible', readyState: 'complete', cookie: '',
    },
    alert() {}, confirm: () => true, prompt: () => '',
    getComputedStyle: () => ({ getPropertyValue: () => '', display: 'block', opacity: '1', width: '480px', height: '640px', transform: 'none' }), matchMedia: () => ({ matches: false, addEventListener() {}, addListener() {}, removeListener() {} }),
    fetch: () => Promise.resolve({ ok: true, json: () => Promise.resolve({}), text: () => Promise.resolve('') }),
    XMLHttpRequest: function () { this.open = () => {}; this.send = () => {}; this.setRequestHeader = () => {}; },
    addEventListener(t, f) { (this.__wls = this.__wls || {})[t] = (this.__wls[t] || []).concat(f); },
    removeEventListener(t, f) { if (this.__wls && this.__wls[t]) this.__wls[t] = this.__wls[t].filter((x) => x !== f); }, // real removal: drag systems add per-gesture window listeners and drop them on pointerup — a no-op made stale handlers re-fire on later gestures
    dispatchEvent(ev) { ev = ev || {}; ev.preventDefault = ev.preventDefault || (() => {}); ev.stopPropagation = ev.stopPropagation || (() => {}); ((this.__wls || {})[ev.type] || []).forEach(f => { try { f(ev); } catch (e) {} }); return true; },
    MutationObserver: function () { this.observe = () => {}; this.disconnect = () => {}; },
    ResizeObserver: function () { this.observe = () => {}; this.disconnect = () => {}; },
    IntersectionObserver: function () { this.observe = () => {}; this.disconnect = () => {}; },
    Image: function () { const o = { onload: null, onerror: null, width: 0, height: 0 }; let s = ''; Object.defineProperty(o, 'src', { get: () => s, set(v) { s = v; if (o.onload) { try { o.onload(); } catch (e) {} } } }); return o; },
    CustomEvent: function (t) { return { type: t }; }, Event: function (t) { return { type: t }; },
    AudioContext: function () { return mkAudio(); }, webkitAudioContext: function () { return mkAudio(); },
    CanvasRenderingContext2D: function () { this.prototype = CanvasRenderingContext2D.prototype; }, // engines polyfill roundRect etc. on the 2d context prototype
    innerWidth: (opts.viewport && opts.viewport[0]) || 480, innerHeight: (opts.viewport && opts.viewport[1]) || 640, devicePixelRatio: 1, scrollX: 0, scrollY: 0, pageXOffset: 0, pageYOffset: 0, scrollTo() {}, scrollBy() {}, // outside-sudoku setupCanvas adds window.scrollY to a rect.top -> NaN cellSize without it
    screen: { width: 480, height: 640 },
    adsbygoogle: { push() {} },
    __rafQ: rafQ, __timers: timers, __els: els,
  };
  // pointer capture API (no-op in the harness; listeners on the capturing element still get events)
  for (const el of Object.values(els)) { el.setPointerCapture = function () {}; el.releasePointerCapture = function () {}; }
  // virtual clock: engines mixing Date.now() with timers/rAF must observe the pump's time
  class VDate extends Date { static now() { return sandbox.__now || 0; } constructor(...a) { super(...(a.length ? a : [sandbox.__now || 0])); } }
  sandbox.Date = VDate;
  sandbox.Math = Object.create(Math);
  sandbox.Math.random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  sandbox.window = sandbox; sandbox.globalThis = sandbox; sandbox.self = sandbox;
  if (opts.seedLS) for (const [k, v] of Object.entries(opts.seedLS)) sandbox.localStorage.setItem(k, v); // returning-player state
  // browsers expose every element id as a window property (named access); engines rely on it
  for (const m of html.matchAll(/\sid="([A-Za-z][A-Za-z0-9_-]*)"/g)) { const id = m[1]; if (!(id in sandbox)) { sandbox[id] = els[id] || (els[id] = makeEl({ id })); } }
  for (const m of html.matchAll(/<([a-zA-Z][a-zA-Z0-9]*)\b[^>]*?\sid="([A-Za-z][A-Za-z0-9_-]*)"[^>]*>/g)) {
    const el = els[m[2]]; if (!el || Array.isArray(el)) continue;
    const cls = /\sclass="([^"]*)"/.exec(m[0]); if (cls && !el.className) String(cls[1]).split(/\s+/).forEach(t => t && el.classList._s.add(t)); // live set only (see parseMarkupChildren)
    const oc = /\sonclick="([^"]*)"/.exec(m[0]); if (oc && typeof el.onclick !== 'function' && !el.__pending_onclick) stashInlineHandler(el, oc[1]);
  }
  // populate registered elements' children from the page markup (engines iterate
  // .children of statically-written containers, e.g. constellation-connect's star spans)
  for (const m of html.matchAll(/<([a-zA-Z][a-zA-Z0-9]*)\b[^>]*\sid="([A-Za-z][A-Za-z0-9_-]*)"[^>]*>([\s\S]*?)<\/\1>/g)) {
    const el = els[m[2]];
    if (el && !el.children.length && !Array.isArray(el)) { try { parseMarkupChildren(el, m[3], 4, true); } catch (e) {} }
  }
  for (const id in els) { if (!els[id].parentNode) els[id].parentNode = els[id].parentElement = sandbox.document.body; } // every element has a parent in a real DOM (mancala measures canvas.parentElement.clientWidth)
  // full recursive parse of the page body: inline-onclick controls nested deep in static
  // markup (pattern-matrix tutorial steps, modal Retry, hint badge) are real clickable
  // nodes here. Nothing walks body (els-driven walks skip it), so existing child-walk
  // semantics are unchanged — verifiers reach these nodes via document.body descendants.
  try { parseMarkupChildren(sandbox.document.body, (/<body[^>]*>([\s\S]*?)<\/body>/.exec(html) || [, ''])[1], 24); } catch (e) {}
  const ctx = vm.createContext(sandbox);
  handlerCtx = ctx;
  for (const el of Object.values(els)) { // compile inline handlers stashed during markup parse
    if (Array.isArray(el)) continue;
    (function cp(e) { if (e.__pending_onclick) { const c = e.__pending_onclick; delete e.__pending_onclick; compileInlineHandler(e, c); } (e.children || []).forEach(cp); })(el);
  }
  (function cpb(e) { if (e.__pending_onclick) { const c = e.__pending_onclick; delete e.__pending_onclick; compileInlineHandler(e, c); } (e.children || []).forEach(cpb); })(sandbox.document.body); // body subtree (deep static markup)
  const loadErrors = [];
  if (opts.vendor) for (const [name, file] of Object.entries(opts.vendor)) {
    // run vendored libs in a bare context, then expose on the game sandbox
    const vctx = vm.createContext({ console: { log() {}, error() {} }, setTimeout: () => 0, clearTimeout() {}, setInterval: () => 0, clearInterval() {}, requestAnimationFrame: () => 0, performance: { now: () => 0 }, document: { addEventListener() {}, removeEventListener() {}, createElement: () => ({ style: {} }), documentElement: { style: {} } }, navigator: { userAgent: 'node' }, Math, Date, JSON });
    vctx.window = vctx; vctx.self = vctx; vctx.globalThis = vctx;
    try { vm.runInContext(fs.readFileSync(path.join(REPO, '_optimization', 'vendor', file), 'utf8'), vctx, { filename: file }); sandbox[name] = vctx[name] || vctx.window[name]; }
    catch (e) { loadErrors.push('vendor ' + name + ': ' + e.message); }
  }
  // opts.inject: append an export shim INSIDE a chosen script's scope (IIFE internals access).
  //   { anchor: 'window.RT = ', exports: 'globalThis.__X={state:()=>state};' } -> after the anchor line
  if (opts.inject) {
    const at = scripts.findIndex(sc => sc.includes(opts.inject.anchor));
    if (at >= 0) {
      const sc = scripts[at];
      const pos = sc.indexOf(opts.inject.anchor);
      // insert after the anchor's FULL statement: if the anchor opens a block (function/if),
      // skip to its balanced closing brace; else end of line
      let insertAt = sc.indexOf('\n', pos);
      const brace0 = sc.indexOf('{', pos);
      if (brace0 >= 0 && brace0 < insertAt) {
        let d = 0, j = brace0;
        for (; j < sc.length; j++) { if (sc[j] === '{') d++; else if (sc[j] === '}') { d--; if (!d) break; } }
        insertAt = j + 1;
      }
      scripts[at] = sc.slice(0, insertAt) + '\n;' + opts.inject.exports + '\n' + sc.slice(insertAt);
    } else loadErrorsLater.push('inject-anchor-missing: ' + opts.inject.anchor);
  }
  scripts.forEach((sc, i) => { try { vm.runInContext(sc, ctx, { filename: slug + '-' + i + '.js' }); } catch (e) { loadErrors.push('script#' + i + ': ' + String(e.message)); } });
  // real browsers always fire DOMContentLoaded after parsing — engines assign their
  // canvas/listeners inside it (solitaire-roguelite: canvas stays null without this)
  // fire BOTH registries: window stores listeners in __wls, the document stub in __dls —
  // reading only __wls silently dropped document-level DOMContentLoaded handlers
  // (hotaru-beam wires ALL input inside document-DCL init; engine booted deaf until this)
  const dcl = (host, name) => { try { [].concat((host.__wls || {})[name] || [], (host.__dls || {})[name] || []).forEach(f => f.call(host, { type: name })); } catch (e) { loadErrors.push(name + ': ' + String(e.message)); } };
  dcl(sandbox.document, 'DOMContentLoaded'); // document listeners
  dcl(sandbox, 'DOMContentLoaded'); // window listeners (solitaire-roguelite wires canvas here)
  dcl(sandbox, 'load'); // balls-vs-bricks registers its rAF loop on window 'load'
  loadErrors.push(...loadErrorsLater);
  const api = {
    ctx, sandbox, els, loadErrors, rafQ, timers,
    /** pump n rAF frames (each frame advances __now by 16.67ms and fires due timers) */
    pump(n) { for (let i = 0; i < n; i++) { sandbox.__now += 16.67;
      { const q = module.exports.__pendingOnloads.splice(0); q.forEach(f => { try { f(); } catch (e) {} }); } // deferred dynamic-script onload
      const due = []; // snapshot first: callbacks mutate the timer list (clearTimeout/extra setTimeout)
      for (let j = timers.length - 1; j >= 0; j--) { const t = timers[j]; if (t && t.at <= sandbox.__now) { if (t.every) { t.at += t.every; } else { timers.splice(j, 1); } due.push(t); } }
      for (const t of due) { try { t.f(); } catch (e) { sandbox.__errors = (sandbox.__errors || []).concat('timer: ' + e.message + ' @ ' + String(e.stack || '').split('\n')[1]); } }
      const q = rafQ.splice(0); q.forEach(e => { try { e.f(sandbox.__now); } catch (e2) { sandbox.__errors = (sandbox.__errors || []).concat('raf: ' + e2.message + ' @ ' + String(e2.stack || '').split('\n')[1]); } }); } },
    /** evaluate an expression inside the vm (reads engine internals after an export surgery) */
    call(expr) { return vm.runInContext(expr, ctx); },
    /** dispatch a keyboard event to the element that owns key listeners (canvas/document/body fallback chain) */
    key(k, type) {
      const t = type || 'keydown';
      const ev = { key: k, code: k, preventDefault() {} };
      const targets = ['document', 'window', 'body'].map(x => sandbox.document[x]);
      for (const x of targets) { if (x && x.dispatch) { x.dispatch(t, ev); break; } }
      // browser reality: a keydown on body BUBBLES to document — engines binding at document
      // level (windmill-sudoku 1-9 keys) must hear keys dispatched at body level too
      for (const f of (sandbox.document.__dls || {})[t] || []) { try { f.call(sandbox.document, ev); } catch (e) { sandbox.__errors = (sandbox.__errors || []).concat('key: ' + e.message); } }
    },
    ls: sandbox.localStorage,
  };
  return api;
}
module.exports = { bootGame, makeEl, mk2d, REPO, __pendingOnloads: [] };
