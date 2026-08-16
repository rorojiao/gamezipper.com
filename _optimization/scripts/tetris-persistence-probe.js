#!/usr/bin/env node
/* tetris best-score persistence probe (post-fix evidence).
 * 1) sandbox game.js with a Map-backed localStorage, force gameOver with score>0 → assert save
 * 2) fresh sandbox with pre-seeded localStorage → assert bestScore loads into HUD #best-disp */
const fs = require('fs'), path = require('path'), vm = require('vm');
const repo = path.resolve(__dirname, '..', '..');
const src = fs.readFileSync(path.join(repo, 'tetris', 'game.js'), 'utf8');
function mkSandbox(store) {
  const ctx2d = new Proxy({}, { get: (t, p) => { if (p === 'measureText') return () => ({ width: 10 }); if (p === 'createLinearGradient' || p === 'createRadialGradient' || p === 'createPattern') return () => ({ addColorStop() {} }); if (typeof p === 'string' && !(p in t)) return () => 1; return t[p]; }, set: (t, p, v) => { t[p] = v; return true; } });
  const el = () => ({ textContent: '', innerHTML: '', classList: { add() {}, remove() {} }, style: {}, addEventListener() {}, getContext: () => ctx2d, width: 300, height: 600, appendChild() {} });
  const ctx = {
    console, Date, JSON, Math,
    setTimeout: () => 0, clearTimeout() {}, setInterval: () => 0, clearInterval() {},
    requestAnimationFrame: () => {}, cancelAnimationFrame() {},
    performance: { now: () => 0 },
    localStorage: {
      getItem: k => (k in store ? store[k] : null),
      setItem: (k, v) => { store[k] = String(v); },
      removeItem: k => { delete store[k]; },
    },
    navigator: { userAgent: 'node' }, location: { href: '' },
    document: { getElementById: el, addEventListener() {}, createElement: el, body: { appendChild() {} }, hidden: false },
    CustomEvent: function (t, o) { this.type = t; this.detail = o && o.detail; },
  };
  ctx.window = ctx; ctx.globalThis = ctx; ctx.addEventListener = () => {}; ctx.dispatchEvent = () => {};
  vm.createContext(ctx);
  vm.runInContext(src + ';globalThis.__api={get score(){return score},set score(v){score=v},get bestScore(){return bestScore},gameOver,updateHUD,startGame};', ctx, { filename: 'game.js' });
  return ctx;
}
const out = { at: new Date().toISOString(), checks: [] };
{
  const store = {};
  const ctx = mkSandbox(store);
  ctx.__api.score = 12345;
  ctx.__api.gameOver();
  out.checks.push({ name: 'gameOver saves best', ok: store['gz_tetris_best'] === '12345', got: store['gz_tetris_best'] });
}
{
  const store = { gz_tetris_best: '9999' };
  const ctx = mkSandbox(store);
  ctx.__api.updateHUD();
  out.checks.push({ name: 'bestScore loads from storage on boot', ok: ctx.__api.bestScore === 9999, got: ctx.__api.bestScore });
  ctx.__api.score = 50; // below best → must NOT overwrite
  ctx.__api.gameOver();
  out.checks.push({ name: 'lower score does not clobber best', ok: store['gz_tetris_best'] === '9999', got: store['gz_tetris_best'] });
}
out.pass = out.checks.every(c => c.ok);
fs.writeFileSync(path.join(repo, '_optimization', 'evidence', 'tetris', 'persistence-probe.json'), JSON.stringify(out, null, 1) + '\n');
console.log(JSON.stringify(out));
process.exit(out.pass ? 0 : 1);
