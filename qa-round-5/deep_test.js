// Round 5 — Deep Gameplay Regression Test
// For each game:
// 1. Load page, dismiss splash/difficulty
// 2. Take "before" screenshot
// 3. Interact (5-15 actions per game, type-specific)
// 4. Wait, take "after" screenshot
// 5. Diff canvas pixels / DOM state / score
// 6. Report bugs: white screen, can't start, no progress, broken UI, console errors, 404s

const { chromium } = require('/home/msdn/.nvm/versions/node/v22.22.0/lib/node_modules/playwright');
const fs = require('fs');
const path = require('path');

const ROOT = '/home/msdn/gamezipper.com';
const SHOTS = path.join(ROOT, 'qa-round-5', 'evidence');
const EVIDENCE = path.join(ROOT, 'qa-round-5', 'evidence');
fs.mkdirSync(SHOTS, { recursive: true });
fs.mkdirSync(EVIDENCE, { recursive: true });

// 30 most-important games
const TOP_GAMES = [
  // Featured on home
  '2048','chess','snake','sudoku','minesweeper','solitaire','color-sort','magic-sort',
  'flappy-wings','brick-breaker','kitty-cafe','abyss-chef','glyph-quest','ocean-gem-pop',
  'tetris','memory-match','bounce-bot','phantom-blade','sushi-stack','bolt-jam-3d',
  'alien-whack','save-the-doge','tangled-yarn','rope-rescue','word-card-sort',
  'drift-boss','level-devil','monster-truck-madness','mahjong-solitaire','stack-ball',
];

// Game-type-specific interaction patterns
const ACTIONS = {
  'canvas-tap-and-arrows': async (page) => {
    // Generic canvas game: click center, then arrows
    await page.mouse.click(640, 400);
    await page.waitForTimeout(200);
    for (const k of ['ArrowUp','ArrowRight','ArrowDown','ArrowLeft','Space','ArrowUp','ArrowRight']) {
      await page.keyboard.press(k);
      await page.waitForTimeout(150);
    }
  },
  'canvas-only-click': async (page) => {
    // Click-based canvas games (color sort, etc)
    for (let i = 0; i < 5; i++) {
      await page.mouse.click(300 + i*100, 400);
      await page.waitForTimeout(200);
    }
  },
  'dom-chess-board': async (page) => {
    // Click squares
    for (let i = 0; i < 4; i++) {
      const square = await page.$(`[data-r="${i}"][data-c="${i}"]`);
      if (square) { try { await square.click({ timeout: 1000 }); } catch {} }
      await page.waitForTimeout(200);
    }
  },
  'dom-cards': async (page) => {
    // Memory / card games
    const cards = await page.$$('[class*="card" i], [class*="tile" i]');
    for (let i = 0; i < Math.min(6, cards.length); i++) {
      try { await cards[i].click({ timeout: 1000 }); await page.waitForTimeout(200); } catch {}
    }
  },
  'dom-click-only': async (page) => {
    // Wordle / sudoku / etc — click in main area + number keys
    for (let i = 0; i < 5; i++) {
      await page.mouse.click(640, 400);
      await page.waitForTimeout(150);
    }
    for (const n of ['1','2','3','4','5']) {
      await page.keyboard.press(n);
      await page.waitForTimeout(100);
    }
  },
  'idle-clicker': async (page) => {
    // Click center many times
    for (let i = 0; i < 15; i++) {
      await page.mouse.click(640, 400);
      await page.waitForTimeout(80);
    }
  },
  'arrow-only': async (page) => {
    for (let i = 0; i < 10; i++) {
      for (const k of ['ArrowUp','ArrowRight','ArrowDown','ArrowLeft']) {
        await page.keyboard.press(k);
        await page.waitForTimeout(100);
      }
    }
  },
  'chess-piece-move': async (page) => {
    // Real chess: click a piece, click destination
    // Try to find white pawn at e2 (row 6, col 4) and move to e4 (row 4, col 4)
    try {
      const from = await page.$('[data-r="6"][data-c="4"]');
      if (from) await from.click();
      await page.waitForTimeout(300);
      const to = await page.$('[data-r="4"][data-c="4"]');
      if (to) await to.click();
      await page.waitForTimeout(500);
      // Try other squares
      const from2 = await page.$('[data-r="7"][data-c="5"]');
      if (from2) await from2.click();
      await page.waitForTimeout(300);
      const to2 = await page.$('[data-r="5"][data-c="5"]');
      if (to2) await to2.click();
      await page.waitForTimeout(500);
    } catch {}
  },
  'sudoku-cell-number': async (page) => {
    // After picking Easy, click first empty cell, type numbers
    try {
      // Find cell with [data-row][data-col] or .cell
      const cell = await page.$('[data-row="0"][data-col="0"], .cell[data-row="0"], .sudoku-cell:first-child');
      if (cell) await cell.click();
      else { await page.mouse.click(640, 500); } // fallback to grid area
      await page.waitForTimeout(300);
      // Press a number key
      for (const n of ['1','2','3','4','5']) {
        await page.keyboard.press(n);
        await page.waitForTimeout(150);
      }
      // Click another cell
      const cell2 = await page.$('[data-row="0"][data-col="4"], .cell:nth-child(5)');
      if (cell2) await cell2.click();
      await page.waitForTimeout(300);
      for (const n of ['1','2','3']) {
        await page.keyboard.press(n);
        await page.waitForTimeout(150);
      }
    } catch {}
  },
};

// Pick interaction pattern based on game name/type
function pickAction(slug) {
  if (slug === 'chess' || slug === 'checkers' || slug === 'connect-four' || slug === 'reversi') return 'chess-piece-move';
  if (slug === 'memory-match' || slug === 'solitaire' || slug === 'word-search' || slug === 'mahjong-solitaire') return 'dom-cards';
  if (slug === 'wordle' || slug === 'sudoku' || slug === 'crossword' || slug === 'minesweeper') return 'sudoku-cell-number';
  if (slug === 'idle-clicker' || slug === 'cookie-clicker' || slug === 'merge-kingdom') return 'idle-clicker';
  if (slug === 'color-sort' || slug === 'magic-sort' || slug === 'sushi-stack' || slug === 'ball-sort') return 'canvas-only-click';
  if (slug === 'snake' || slug === 'bounce-bot' || slug === 'neon-run' || slug === 'slope') return 'arrow-only';
  return 'canvas-tap-and-arrows';
}

async function testOne(browser, slug, idx) {
  const result = {
    slug, idx, http_status: null, page_errors: [], console_errors: [], console_warnings: [],
    network_failures: [],
    has_canvas: false, canvas_w: 0, canvas_h: 0, has_dom_game: false, has_game_var: false,
    has_tap_start: false, has_splash: false, splash_dismissed: false,
    difficulty_present: false, difficulty_picked: false,
    initial_score: '', initial_level: '', initial_text: '',
    final_score: '', final_level: '', final_text: '',
    score_changed: false, level_changed: false, text_changed: false,
    game_over_seen: false, win_seen: false, restart_btn_seen: false,
    canvas_pixel_change_pct: null, ui_overlap_detected: false,
    layout_issues: [],
    playable: false, has_blocker: false, blocker_reason: '',
    crashes: false,
  };

  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();

  page.on('console', m => {
    if (m.type() === 'error') result.console_errors.push(m.text().slice(0, 200));
    if (m.type() === 'warning') result.console_warnings.push(m.text().slice(0, 200));
  });
  page.on('pageerror', e => result.page_errors.push(e.message.slice(0, 200)));
  page.on('response', r => {
    if (r.status() >= 400 && !r.url().includes('api/collect')) {
      result.network_failures.push({ status: r.status(), url: r.url().slice(0, 120) });
    }
  });

  try {
    const url = `https://gamezipper.com/${slug}/?bust=${Date.now()}`;
    const t0 = Date.now();
    const resp = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 25000 });
    result.http_status = resp.status();
    result.load_ms = Date.now() - t0;
    await page.waitForTimeout(2500);

    // Inspect
    const dom1 = await page.evaluate(() => {
      const c = document.querySelector('canvas');
      const splash = document.getElementById('splash-screen');
      const tap = document.getElementById('gz-tap-start');
      const ctaOverlay = document.getElementById('gz-cb-overlay');
      const ctaShown = ctaOverlay ? (getComputedStyle(ctaOverlay).display !== 'none' && getComputedStyle(ctaOverlay).visibility !== 'hidden' && parseFloat(getComputedStyle(ctaOverlay).opacity || '1') > 0) : false;
      const all = document.body.innerText || '';
      return {
        canvas: !!c,
        canvasW: c ? c.width : 0,
        canvasH: c ? c.height : 0,
        hasSplash: !!splash,
        splashDisplay: splash ? getComputedStyle(splash).display : 'none',
        hasTapStart: !!tap,
        tapVisible: tap ? getComputedStyle(tap).display !== 'none' : false,
        adBreakShown: ctaShown,
        difficultyText: all.includes('Easy') && all.includes('Medium') && all.includes('Hard'),
        fullText: all.slice(0, 400),
      };
    });
    result.has_canvas = dom1.canvas;
    result.canvas_w = dom1.canvasW;
    result.canvas_h = dom1.canvasH;
    result.has_splash = dom1.hasSplash;
    result.has_tap_start = dom1.hasTapStart;
    result.difficulty_present = dom1.difficultyText;
    result.initial_text = dom1.fullText;
    if (dom1.adBreakShown) { result.has_blocker = true; result.blocker_reason = 'GAME_BREAK_OVERLAY'; }

    // Take "before" screenshot
    await page.screenshot({ path: path.join(SHOTS, `${slug}-1-before.png`) });

    // Dismiss splash + tap-to-start
    await page.evaluate(() => {
      const s = document.getElementById('splash-screen');
      if (s) { s.classList.add('fade-out'); setTimeout(() => s.remove(), 100); }
      const t = document.getElementById('gz-tap-start');
      if (t) t.remove();
    });
    await page.waitForTimeout(500);
    result.splash_dismissed = true;

    // If difficulty picker visible, pick Easy
    if (dom1.difficultyText) {
      try {
        // Find and click "Easy" or first difficulty button
        const easyBtn = await page.locator('text=/^Easy$/').first();
        await easyBtn.click({ timeout: 2000 });
        result.difficulty_picked = true;
        await page.waitForTimeout(1000);
      } catch (e) {
        // Try alternative: click first button with Easy
        try {
          const buttons = await page.$$('button, [role="button"], [class*="difficulty"], [class*="level"]');
          for (const b of buttons) {
            const t = await b.innerText().catch(() => '');
            if (/easy/i.test(t)) { await b.click(); result.difficulty_picked = true; break; }
          }
          await page.waitForTimeout(1000);
        } catch {}
      }
    }

    // Sample canvas pixel before interaction
    let pixelsBefore = null;
    if (result.has_canvas && result.canvas_w > 50) {
      pixelsBefore = await page.evaluate(() => {
        const c = document.querySelector('canvas');
        if (!c) return null;
        const ctx = c.getContext('2d');
        if (!ctx) return null;
        const w = c.width, h = c.height;
        const samples = [];
        for (let i = 0; i < 8; i++) {
          const x = Math.floor(Math.random() * w);
          const y = Math.floor(Math.random() * h);
          const d = ctx.getImageData(x, y, 1, 1).data;
          samples.push([d[0], d[1], d[2]]);
        }
        return samples;
      });
    }

    // Run game-specific actions
    const action = pickAction(slug);
    const fn = ACTIONS[action];
    if (fn) {
      try {
        await fn(page);
      } catch (e) {
        result.layout_issues.push(`action_failed: ${e.message.slice(0, 100)}`);
      }
    }
    await page.waitForTimeout(1500);

    // Sample after
    let pixelsAfter = null;
    if (result.has_canvas && result.canvas_w > 50) {
      pixelsAfter = await page.evaluate(() => {
        const c = document.querySelector('canvas');
        if (!c) return null;
        const ctx = c.getContext('2d');
        if (!ctx) return null;
        const w = c.width, h = c.height;
        const samples = [];
        for (let i = 0; i < 8; i++) {
          const x = Math.floor(Math.random() * w);
          const y = Math.floor(Math.random() * h);
          const d = ctx.getImageData(x, y, 1, 1).data;
          samples.push([d[0], d[1], d[2]]);
        }
        return samples;
      });
    }
    if (pixelsBefore && pixelsAfter) {
      const diff = pixelsBefore.filter((p, i) => p[0] !== pixelsAfter[i][0] || p[1] !== pixelsAfter[i][1] || p[2] !== pixelsAfter[i][2]).length;
      result.canvas_pixel_change_pct = diff / pixelsBefore.length;
    }

    // Get final state
    const dom2 = await page.evaluate(() => {
      const all = document.body.innerText || '';
      const sm = all.match(/(?:SCORE|Score|score)\s*[:.]?\s*(\d+)/);
      const lm = all.match(/(?:LEVEL|Level|level)\s*[:.]?\s*(\d+)/);
      const cm = all.match(/(?:MOVES|Moves)\s*[:.]?\s*(\d+)/);
      const go = /game over/i.test(all);
      const win = /you win|you won|congratulations|level complete|you did it/i.test(all);
      const restart = /play again|restart|try again/i.test(all);
      const ctaOverlay = document.getElementById('gz-cb-overlay');
      const ctaShown = ctaOverlay ? (getComputedStyle(ctaOverlay).display !== 'none' && getComputedStyle(ctaOverlay).visibility !== 'hidden' && parseFloat(getComputedStyle(ctaOverlay).opacity || '1') > 0) : false;
      return {
        score: sm ? sm[1] : '',
        level: lm ? lm[1] : '',
        moves: cm ? cm[1] : '',
        gameOver: go, win, restart,
        adBreakShown: ctaShown,
        text: all.slice(0, 400)
      };
    });
    result.final_score = dom2.score;
    result.final_level = dom2.level;
    result.final_moves = dom2.moves;
    result.final_text = dom2.text;
    result.score_changed = result.initial_text !== result.final_text && (result.final_score !== '' || result.final_level !== '');
    result.text_changed = result.initial_text !== result.final_text;
    result.game_over_seen = dom2.gameOver;
    result.win_seen = dom2.win;
    result.restart_btn_seen = dom2.restart;
    if (dom2.adBreakShown) { result.has_blocker = true; result.blocker_reason = 'GAME_BREAK_OVERLAY_AFTER'; }

    // Mobile viewport test
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(SHOTS, `${slug}-2-mobile.png`) });
    // Check for horizontal scroll, text overflow
    const mobileCheck = await page.evaluate(() => {
      return {
        bodyW: document.body.scrollWidth,
        windowW: window.innerWidth,
        overflows: document.body.scrollWidth > window.innerWidth + 5
      };
    });
    if (mobileCheck.overflows) {
      result.layout_issues.push(`mobile_overflow: body ${mobileCheck.bodyW}px > window ${mobileCheck.windowW}px`);
    }

    // Back to desktop
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.waitForTimeout(300);

    // "After" screenshot
    await page.screenshot({ path: path.join(SHOTS, `${slug}-3-after.png`) });

    // Decide playable
    // For DOM games (chess, sudoku, etc): text_changed is enough
    // For canvas games: canvas_pixel_change_pct > 0 OR score/level changed
    if (result.has_blocker) result.playable = false;
    else if (!result.has_canvas && result.text_changed) result.playable = true;
    else if (result.has_canvas && (result.canvas_pixel_change_pct > 0 || result.score_changed || result.game_over_seen || result.win_seen)) result.playable = true;
    else if (result.has_canvas && result.canvas_pixel_change_pct === 0 && !result.score_changed) {
      // Canvas game but no movement detected — might be:
      // 1. Splash not actually dismissed
      // 2. Need different interaction (drag/swipe/long-press)
      // 3. Game requires specific first action
      result.playable = 'maybe';
    }
  } catch (e) {
    result.crashes = true;
    result.crash_error = e.message.slice(0, 200);
  } finally {
    await ctx.close();
  }
  return result;
}

(async () => {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const results = [];
  const N = parseInt(process.argv[2] || TOP_GAMES.length);
  const toTest = TOP_GAMES.slice(0, N);
  console.log(`Testing ${toTest.length} games\n`);

  for (let i = 0; i < toTest.length; i++) {
    const r = await testOne(browser, toTest[i], i);
    results.push(r);
    const playableIcon = r.playable === true ? '✓' : (r.playable === false ? '✗' : '?');
    const issues = [];
    if (r.has_blocker) issues.push(`BLOCKER(${r.blocker_reason})`);
    if (r.console_errors.length) issues.push(`err=${r.console_errors.length}`);
    if (r.network_failures.length) issues.push(`net=${r.network_failures.length}`);
    if (r.layout_issues.length) issues.push(`layout=${r.layout_issues.length}`);
    if (r.crashes) issues.push('CRASH');
    const change = r.has_canvas ? `pixel=${(r.canvas_pixel_change_pct*100).toFixed(0)}%` : `txt=${r.text_changed?'Y':'N'}`;
    console.log(`[${i+1}/${toTest.length}] ${playableIcon} ${r.slug.padEnd(20)} ${change.padEnd(15)} score=${r.final_score||'-'}/lv=${r.final_level||'-'} ${issues.join(' ')}`);

    if ((i+1) % 5 === 0) {
      fs.writeFileSync(path.join(ROOT, 'qa-round-5', 'results.json'), JSON.stringify(results, null, 2));
    }
  }
  await browser.close();
  fs.writeFileSync(path.join(ROOT, 'qa-round-5', 'results.json'), JSON.stringify(results, null, 2));

  const stats = { tested: results.length };
  stats.playable_true = results.filter(r => r.playable === true).length;
  stats.playable_false = results.filter(r => r.playable === false).length;
  stats.playable_maybe = results.filter(r => r.playable === 'maybe').length;
  stats.blocker = results.filter(r => r.has_blocker).length;
  stats.console_errors = results.filter(r => r.console_errors.length > 0).length;
  stats.network_failures = results.filter(r => r.network_failures.length > 0).length;
  stats.layout_issues = results.filter(r => r.layout_issues.length > 0).length;
  stats.crashes = results.filter(r => r.crashes).length;
  console.log('\n=== Summary ===');
  console.log(JSON.stringify(stats, null, 2));
})();
