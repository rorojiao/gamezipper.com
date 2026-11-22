/* gz-daily.js — site-wide daily puzzle streak system (R531, 2026-11-22)
 *
 * Design (data-driven, no accounts):
 *   localStorage gz_daily_state = { d: 'YYYY-MM-DD', c: n, best: n, done: {wordle:1,...} }
 *   - d    = date of last activity (streak anchor)
 *   - c    = current consecutive-day streak
 *   - best = all-time best streak
 *   - done = map of daily-game slug -> 1 for TODAY only
 *
 * Flow:
 *   1. Any visit normalizes state (resets 'done' on date rollover; breaks streak if
 *      the last activity was neither yesterday nor today).
 *   2. Game pages that have a daily mode (wordle/nerdle/sudoku/word-scramble) send
 *      a 'gz_daily_done' CustomEvent after their own daily-complete logic runs.
 *   3. This script listens, marks the game done, increments the streak once per day,
 *   4. Renders a small streak badge on game pages + powers daily-puzzle.html cards.
 *
 * Games opt in by dispatching:
 *   document.dispatchEvent(new CustomEvent('gz_daily_done', {detail:{game:'wordle'}}))
 */
(function () {
  var KEY = 'gz_daily_state';
  var GAMES = ['wordle', 'nerdle', 'sudoku', 'word-scramble'];
  var PATHS = { '/wordle/': 'wordle', '/nerdle/': 'nerdle', '/sudoku/': 'sudoku', '/word-scramble/': 'word-scramble' };

  function today() { var d = new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function yesterdayStr() { var d = new Date(); d.setDate(d.getDate() - 1); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function load() {
    try { return JSON.parse(localStorage.getItem(KEY)) || { d: '', c: 0, best: 0, done: {} }; }
    catch (e) { return { d: '', c: 0, best: 0, done: {} }; }
  }
  function save(s) { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {} }

  function normalize(s) {
    var t = today();
    if (s.d !== t) {
      // date rollover (or first ever visit): clear per-day completion
      s.done = {};
      if (s.d === yesterdayStr()) { /* streak alive, carry c */ }
      else if (s.d) { s.c = 0; /* missed a day — streak broken */ }
      s.d = t;
      save(s);
    }
    return s;
  }

  function markDone(game) {
    var s = normalize(load());
    if (s.done[game]) return s;              // already counted today
    s.done[game] = 1;
    s.c = (s.c || 0) + (Object.keys(s.done).length === 1 ? 1 : 0); // +1 only on the FIRST puzzle of the day
    if (s.c > (s.best || 0)) s.best = s.c;
    save(s);
    return s;
  }

  // ---- event wiring ----
  document.addEventListener('gz_daily_done', function (e) {
    var game = e && e.detail && e.detail.game;
    if (!game || GAMES.indexOf(game) < 0) return;
    var s = markDone(game);
    renderBadge(s);
    renderCards(s);
  });

  // ---- UI: streak badge on game pages ----
  function renderBadge(s) {
    // homepage banner chip
    var chip = document.getElementById('gz-daily-streak-chip');
    if (chip) {
      var d = Object.keys(s.done || {}).length;
      chip.textContent = '🔥 ' + (s.c || 0) + '-day streak' + (d ? ' · ' + d + '/' + GAMES.length : '');
    }
    var b = document.getElementById('gz-daily-badge');
    if (!b) {
      // insert after body start (fixed chip, top-right, small)
      b = document.createElement('div');
      b.id = 'gz-daily-badge';
      b.style.cssText = 'position:fixed;top:8px;right:8px;z-index:9998;background:rgba(16,22,47,.95);border:1px solid #223184;border-radius:12px;padding:6px 12px;font:700 12px/1.4 -apple-system,BlinkMacSystemFont,sans-serif;color:#ffd93d;text-decoration:none;box-shadow:0 2px 8px rgba(0,0,0,.3)';
      document.body.appendChild(b);
    }
    var done = Object.keys(s.done || {}).length;
    b.innerHTML = '🔥 ' + (s.c || 0) + '-day streak' + (done ? ' · ' + done + '/' + GAMES.length + ' today' : '');
    b.title = 'Complete today\'s daily puzzles to keep your streak alive';
  }

  // ---- UI: daily-puzzle.html cards ----
  function renderCards(s) {
    var grid = document.getElementById('gz-daily-grid');
    if (!grid) return;
    var cards = grid.querySelectorAll('[data-gz-daily]');
    for (var i = 0; i < cards.length; i++) {
      var game = cards[i].getAttribute('data-gz-daily');
      var st = cards[i].querySelector('.gc-state');
      if (!st) continue;
      if (s.done && s.done[game]) {
        st.textContent = '✓ Done today';
        st.className = 'gc-state done';
      } else {
        st.className = 'gc-state todo';
      }
    }
    var el = document.getElementById('gz-streak');
    if (el) el.textContent = s.c || 0;
    el = document.getElementById('gz-best');
    if (el) el.textContent = s.best || 0;
    el = document.getElementById('gz-today-done');
    if (el) el.textContent = Object.keys(s.done || {}).length + '/' + GAMES.length;
  }

  function init() {
    var s = normalize(load());
    var game = PATHS[location.pathname];
    if (game || document.getElementById('gz-daily-banner')) renderBadge(s);
    renderCards(s);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
