// test_jsdom.js — jsdom integration test for Crucible Alloy.
const fs = require('fs');
const { JSDOM } = require('jsdom');
const html = fs.readFileSync(__dirname + '/index.html', 'utf8');
const dom = new JSDOM(html, {
  runScripts: 'dangerously', pretendToBeVisual: true,
  beforeParse(window) {
    function makeCtx() {
      return new Proxy({
        createLinearGradient() { return { addColorStop() {} }; }, createRadialGradient() { return { addColorStop() {} }; },
        save() {}, restore() {}, translate() {}, rotate() {}, scale() {},
        beginPath() {}, closePath() {}, moveTo() {}, lineTo() {}, arc() {}, ellipse() {}, rect() {}, fillRect() {}, strokeRect() {}, clearRect() {},
        fill() {}, stroke() {}, fillText() {}, measureText() { return { width: 10 }; },
        set fillStyle(v) {}, get fillStyle() { return '#000'; }, set strokeStyle(v) {}, get strokeStyle() { return '#000'; },
        set lineWidth(v) {}, get lineWidth() { return 1; }, set font(v) {}, get font() { return '10px sans'; },
        set textAlign(v) {}, get textAlign() { return 'start'; }, set textBaseline(v) {}, get textBaseline() { return 'alphabetic'; },
        set shadowColor(v) {}, set shadowBlur(v) {}, setLineDash() {}, set transform(v) {}, set globalAlpha(v) {}, get globalAlpha() { return 1; },
      }, { get: (t, p) => p in t ? t[p] : (() => {}), set: () => true });
    }
    window.HTMLCanvasElement.prototype.getContext = function () { return makeCtx(); };
    Object.defineProperty(window.HTMLCanvasElement.prototype, 'width', { configurable: true, get() { return this._w || 420; }, set(v) { this._w = v; } });
    Object.defineProperty(window.HTMLCanvasElement.prototype, 'height', { configurable: true, get() { return this._h || 600; }, set(v) { this._h = v; } });
    Object.defineProperty(window.HTMLElement.prototype, 'clientWidth', { configurable: true, get() { return 420; } });
    Object.defineProperty(window.HTMLElement.prototype, 'clientHeight', { configurable: true, get() { return 600; } });
    Object.defineProperty(window.HTMLElement.prototype, 'getBoundingClientRect', { configurable: true, value: function () { return { left: 0, top: 0, right: 420, bottom: 600, width: 420, height: 600, x: 0, y: 0 }; } });
    window.requestAnimationFrame = (cb) => setTimeout(() => cb(Date.now()), 16);
  }
});
const { window } = dom, { document } = window;
let pass = 0, fail = 0;
function check(name, cond) { if (cond) { pass++; console.log('  ✓ ' + name); } else { fail++; console.log('  ✗ ' + name); } }
const vm = require('vm');
const lvlMatch = html.match(/var LEVELS=\[([\s\S]*?)\];/);
const LEVELS = vm.runInNewContext('([' + lvlMatch[1] + '])');
function clickCanvas(x, y) {
  const cv = document.getElementById('cv');
  const ev = new window.MouseEvent('click', { bubbles: true, cancelable: true });
  Object.defineProperty(ev, 'clientX', { configurable: true, get() { return x; } });
  Object.defineProperty(ev, 'clientY', { configurable: true, get() { return y; } });
  cv.dispatchEvent(ev);
}
setTimeout(() => {
  console.log('=== Crucible Alloy jsdom Integration Test ===');
  check('LEVELS array loaded (30 levels)', LEVELS.length === 30);
  check('HUD prev button present', !!document.getElementById('prevBtn'));
  check('HUD next button present', !!document.getElementById('nextBtn'));
  check('HUD reset button present', !!document.getElementById('resetBtn'));
  check('HUD mute button present', !!document.getElementById('muteBtn'));
  check('Level label present', !!document.getElementById('lvl'));
  check('Canvas present', !!document.getElementById('cv'));
  check('Message overlay present', !!document.getElementById('msg'));
  check('Help text present', !!document.getElementById('help'));
  check('Initial level = L1/30', document.getElementById('lvl').textContent === 'L1/30');
  for (let i = 0; i < 14; i++) document.getElementById('nextBtn').click();
  check('After 14 next-clicks → L15/30', document.getElementById('lvl').textContent === 'L15/30');
  for (let i = 0; i < 15; i++) document.getElementById('nextBtn').click();
  check('After 15 more → L30/30', document.getElementById('lvl').textContent === 'L30/30');
  document.getElementById('prevBtn').click();
  check('Prev from L30 → L29/30', document.getElementById('lvl').textContent === 'L29/30');
  document.getElementById('resetBtn').click();
  check('Reset keeps current (L29)', document.getElementById('lvl').textContent === 'L29/30');
  while (document.getElementById('lvl').textContent !== 'L1/30') document.getElementById('prevBtn').click();
  check('Back to L1', document.getElementById('lvl').textContent === 'L1/30');
  for (let i = 0; i < 2; i++) clickCanvas(162, 530);
  for (let i = 0; i < 4; i++) clickCanvas(258, 530);
  setTimeout(() => {
    const msgShown = document.getElementById('msg').classList.contains('show');
    const msgText = document.querySelector('#msg .ttl').textContent || '';
    check('L1 solved → win message shown', msgShown && msgText.indexOf('Forged') >= 0);
    setTimeout(() => {
      check('L1 solved → auto-advanced to L2', document.getElementById('lvl').textContent === 'L2/30');
      console.log('\n' + pass + '/' + (pass + fail) + ' checks passed');
      if (fail > 0) { console.log(fail + ' FAILURES ❌'); process.exit(1); }
      console.log('ALL CHECKS PASSED ✅');
      process.exit(0);
    }, 1500);
  }, 600);
}, 300);
