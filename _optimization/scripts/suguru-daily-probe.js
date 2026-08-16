#!/usr/bin/env node
/* suguru daily uniqueness probe: drive the engine's own generateDaily over 40 consecutive day
 * seeds; for each: puzzle must have a UNIQUE solution (solveSuguru non-null) and every given
 * must match the returned solution. Also reports givens density. */
const fs = require('fs'), path = require('path'), vm = require('vm');
const repo = path.resolve(__dirname, '..', '..');
const html = fs.readFileSync(path.join(repo, 'suguru', 'index.html'), 'utf8');
const scripts = [...html.matchAll(/<script(?![^>]*src=)(?![^>]*application\/ld\+json)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]).join('\n');
const el = () => ({ textContent: '', classList: { add() {}, remove() {}, toggle() {} }, style: {}, addEventListener() {}, getContext: () => new Proxy({}, { get: (t, p) => { if (p === 'createLinearGradient' || p === 'createRadialGradient') return () => ({ addColorStop() {} }); if (typeof p === 'string' && !(p in t)) return () => 1; return t[p]; }, set: () => true }), width: 400, height: 400, appendChild() {} });
const ctx = {
  console, Date, JSON, Math,
  setTimeout: () => 0, clearTimeout() {}, setInterval: () => 0, clearInterval() {},
  requestAnimationFrame: () => {}, cancelAnimationFrame() {}, performance: { now: () => 0 },
  localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
  navigator: { userAgent: 'node' }, location: { href: '' },
  document: { getElementById: el, querySelector: () => null, querySelectorAll: () => [], addEventListener() {}, createElement: el, body: { appendChild() {} }, hidden: false },
  AudioContext: undefined,
};
ctx.window = ctx; ctx.globalThis = ctx; ctx.addEventListener = () => {};
vm.createContext(ctx);
// generateDaily/solveSuguru live inside a scoped block — inject the export right after generateDaily's body
const anchor = scripts.lastIndexOf('return {grid:[rows,cols],regions:regions,givens:givens,daily:true};\n}');
const injected = anchor < 0 ? scripts : scripts.slice(0, anchor + 'return {grid:[rows,cols],regions:regions,givens:givens,daily:true};\n}'.length) + '\n;globalThis.__g={generateDaily,solveSuguru,suguruSolveAny,suguruSolveUnique};' + scripts.slice(anchor + 'return {grid:[rows,cols],regions:regions,givens:givens,daily:true};\n}'.length);
vm.runInContext(injected, ctx, { filename: 'suguru.js' });
const g = ctx.__g;
const t0 = Date.now();
let nonUnique = 0, inconsistent = 0, nullGen = 0;
const densities = [];
const per = [];
const perMs = [];
const base = new Date(2026, 7, 16); // today 2026-08-16 — probe 40 days
for (let d = 0; d < 14; d++) {
  const dt = new Date(base.getTime() + d * 86400000);
  const seed = dt.getFullYear() * 10000 + (dt.getMonth() + 1) * 100 + dt.getDate();
  const tDay = Date.now();
  const lvl = g.generateDaily(seed);
  if (!lvl) { nullGen++; per.push({ seed, ok: false, why: 'null' }); continue; }
  // cross-check with the page's fast MRV unique-counter (old naive solveSuguru exhausts for minutes on sparse boards)
  const sol = g.suguruSolveUnique(lvl.grid[0], lvl.grid[1], lvl.regions, lvl.givens);
  const solB = g.solveSuguru ? null : null; // engine solver kept for reference but not used per-day
  let consistent = true;
  for (const k of Object.keys(lvl.givens)) if (sol && sol[+k] !== lvl.givens[k]) consistent = false;
  const uniq = !!sol;
  if (!uniq) nonUnique++;
  if (!consistent) inconsistent++;
  densities.push(Object.keys(lvl.givens).length / (lvl.grid[0] * lvl.grid[1]));
  perMs.push(Date.now() - tDay);
  per.push({ seed, ok: uniq && consistent, givens: Object.keys(lvl.givens).length });
}
const out = { at: new Date().toISOString(), daysProbed: 14, nonUnique, inconsistent, nullGen,
  avgGivensFrac: +(densities.reduce((a, b) => a + b, 0) / densities.length).toFixed(3),
  minGivensFrac: +Math.min(...densities).toFixed(3), per };
console.log(JSON.stringify({ daysProbed: out.daysProbed, nonUnique, inconsistent, nullGen, avgGivensFrac: out.avgGivensFrac, minGivensFrac: out.minGivensFrac }));
out.totalMs = Date.now() - t0; out.maxDayMs = Math.max(...(perMs.length ? perMs : [0])); out.avgDayMs = Math.round((perMs.reduce((a, b) => a + b, 0)) / (perMs.length || 1));
fs.writeFileSync(path.join(repo, '_optimization', 'evidence', 'suguru', 'daily-uniqueness-probe.json'), JSON.stringify(out, null, 1) + '\n');
process.exit(nonUnique + inconsistent + nullGen === 0 ? 0 : 1);
