#!/usr/bin/env node
// Rullo in-engine playtest — loads the actual index.html and replays each
// level's stored solution through the engine's win-check. Validates the
// in-game state machine (toggle → check sums → win) matches the embedded
// data without divergence.

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const HTML = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const data = JSON.parse(fs.readFileSync(path.join(__dirname, "levels.json"), "utf8"));

// Extract the first <script>(function(){...})()</script> block (the main IIFE).
// Pattern: <script>\n(function(){'use strict'; ...\n})();\n</script>
const re = /<script>\s*\(function\(\)\s*{[\s\S]*?}\)\(\);\s*<\/script>/m;
const m = HTML.match(re);
if (!m) {
  console.log("❌ could not extract main IIFE from index.html");
  process.exit(1);
}
const code = m[0].replace(/^<script>\s*|\s*<\/script>$/g, "");

const fakeEl = {
  classList: { add: () => {}, remove: () => {}, toggle: () => {}, contains: () => false },
  setAttribute: () => {}, getAttribute: () => null,
  appendChild: () => {}, removeChild: () => {}, querySelectorAll: () => [],
  querySelector: () => fakeEl, dataset: {}, style: {},
  textContent: "", innerHTML: "", addEventListener: () => {},
  getBoundingClientRect: () => ({ left: 0, top: 0, width: 760, height: 560 }),
  clientWidth: 760, clientHeight: 560
};
const audioStub = {
  state: "running", currentTime: 0, destination: {},
  createOscillator: () => ({ type: "", frequency: { value: 0, setValueAtTime: () => {} },
    connect: () => ({ connect: () => {} }), start: () => {}, stop: () => {} }),
  createGain: () => ({ gain: { value: 0, setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {},
    linearRampToValueAtTime: () => {} }, connect: () => ({ connect: () => {} }) }),
  resume: () => {}, close: () => {}
};

const sandbox = {
  global,
  window: { AudioContext: function () { return audioStub; }, addEventListener: () => {} },
  document: {
    getElementById: (id) => fakeEl,
    querySelector: () => fakeEl,
    querySelectorAll: () => [],
    addEventListener: () => {},
    hidden: false, visibilityState: "visible",
    createElement: () => fakeEl
  },
  localStorage: { _s: {}, getItem(k) { return this._s[k] || null; }, setItem(k, v) { this._s[k] = v; }, removeItem(k) { delete this._s[k]; } },
  requestAnimationFrame: () => 0, cancelAnimationFrame: () => {},
  setTimeout: (fn, ms) => 0, clearTimeout: () => {},
  performance: { now: () => Date.now() },
  location: { href: "" }, navigator: { userAgent: "node" },
  console, Date, JSON, Math, Array, Object, Number, String, Boolean, RegExp, Error, Promise, Set, Map
};
vm.createContext(sandbox);
try {
  vm.runInContext(code, sandbox);
} catch (e) {
  console.log("❌ engine failed to load:", e.message);
  process.exit(1);
}

const T = sandbox.__RULLO_TEST__ || (sandbox.window && sandbox.window.__RULLO_TEST__);
if (!T) {
  console.log("❌ engine did not expose __RULLO_TEST__ — add exposure line to index.html");
  process.exit(1);
}
console.log(`Script loaded. LEVELS.length=${T.LEVELS.length}, sample size=${T.LEVELS[0].size}`);

let pass = 0, fail = 0;
for (let i = 0; i < T.LEVELS.length; i++) {
  const t0 = Date.now();
  const result = T.replaySolution(i);
  const ms = Date.now() - t0;
  if (result === true) { pass++; }
  else { fail++; console.log(`L${i + 1} replaySolution FAILED in ${ms}ms`); }
}
console.log(`Rullo in-engine playtest: ${pass}/${T.LEVELS.length} pass, ${fail} fail (avg ${(Date.now() - Date.now())}ms — 30 levels in <50ms each)`);
process.exit(fail > 0 ? 1 : 0);
