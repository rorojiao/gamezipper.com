// GameZipper batch playability test — node + playwright
const { chromium } = require('/home/msdn/.nvm/versions/node/v22.22.0/lib/node_modules/playwright');
const fs = require('fs');
const path = require('path');

const ROOT = '/home/msdn/gamezipper.com';
const EXCLUDE = new Set(['dist','admin','blog','audio','api','fun-web-games','docs','kanban','cookie-policy',
  'liquid-connect','monkey-mart-ref','og-images','outreach','promotion','public','scripts',
  'terms','tests','js','contact','.benchmarks','.claude','.git','.well-known','node_modules',
  'qa-round-0','qa-round-1','qa-round-2','qa-round-3','qa-shared','tidy-up-3d']);

// Get all game dirs
const dirs = fs.readdirSync(ROOT)
  .filter(d => {
    const full = path.join(ROOT, d);
    if (EXCLUDE.has(d)) return false;
    if (d.startsWith('.')) return false;
    try {
      return fs.statSync(full).isDirectory();
    } catch { return false; }
  })
  .filter(d => {
    const idx = path.join(ROOT, d, 'index.html');
    return fs.existsSync(idx);
  })
  .sort();

console.log(`Total games with index.html: ${dirs.length}`);

// Parse registry for category / name
const data = fs.readFileSync(path.join(ROOT, 'js', 'games-data.js'), 'utf8');
const reg = {};
for (const m of data.matchAll(/url:["']([^"']+)["']/g)) {
  const slug = m[1].replace(/^\/|\/$/g, '');
  const startIdx = data.lastIndexOf('{name', m.index);
  if (startIdx < 0) continue;
  let depth = 0, end = startIdx;
  for (let i = startIdx; i < data.length; i++) {
    if (data[i] === '{') depth++;
    else if (data[i] === '}') {
      depth--;
      if (depth === 0) { end = i; break; }
    }
  }
  const block = data.substring(startIdx, end + 1);
  const nameM = block.match(/name:["']([^"']+)["']/);
  const catM = block.match(/cat:["']([^"']+)["']/);
  reg[slug] = { name: nameM ? nameM[1] : slug, cat: catM ? catM[1] : 'unknown' };
}

// Featured first
const FEATURED = ['2048','chess','snake','sudoku','minesweeper','solitaire','color-sort','magic-sort',
                  'flappy-wings','brick-breaker','kitty-cafe','abyss-chef','glyph-quest','ocean-gem-pop',
                  'tetris','memory-match','bounce-bot','phantom-blade','sushi-stack','bolt-jam-3d',
                  'alien-whack','save-the-doge','tangled-yarn','rope-rescue','word-card-sort',
                  'drift-boss','level-devil','monster-truck-madness','papas-freezeria','mahjong-solitaire',
                  'pong','slope','reaction-time','stack-ball','wordle','crossword','daily-word-puzzle','typing-speed',
                  'happy-glass','factory-balls','cover-orange','fruit-slash','knife-hit','idle-clicker',
                  'mo-yu-fayu','cut-the-rope','carrom','spider-solitaire','tripeaks-solitaire','freecell'];
const ordered = [...FEATURED.filter(s => dirs.includes(s)), ...dirs.filter(s => !FEATURED.includes(s))];

const N = parseInt(process.argv[2] || 60);
const toTest = ordered.slice(0, N);
console.log(`Testing ${toTest.length} games\n`);

const OUT = path.join(ROOT, 'qa-round-4', 'playability_results.json');
const OUT_DIR = path.join(ROOT, 'qa-round-4', 'evidence');
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.mkdirSync(OUT_DIR, { recursive: true });

const results = [];

async function testOne(browser, slug, idx) {
  const info = reg[slug] || { name: slug, cat: 'unknown' };
  const result = {
    slug, name: info.name, cat: info.cat, idx,
    http_status: null,
    page_errors: [],  // critical: page crashed
    console_errors: [],
    console_warnings: [],
    network_failures: [],
    ad_blocking_issues: [],
    has_canvas: false,
    has_dom_game: false,
    has_tap_start: false,
    tap_dismissed: false,
    has_restart: false,
    has_play_button: false,
    body_text: '',
    state_changed: false,
    game_state_sample: {},
    load_ms: null,
    crashed: false
  };

  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, userAgent: 'Mozilla/5.0' });
  const page = await ctx.newPage();

  page.on('console', msg => {
    const text = msg.text();
    if (msg.type() === 'error') result.console_errors.push(text.slice(0, 300));
    if (msg.type() === 'warning') result.console_warnings.push(text.slice(0, 300));
    if (text.includes('adsbygoogle') && msg.type() === 'error') result.ad_blocking_issues.push(text.slice(0, 200));
  });
  page.on('pageerror', err => result.page_errors.push(err.message.slice(0, 300)));
  page.on('response', resp => {
    if (resp.status() >= 400 && !resp.url().includes('api/collect')) {
      result.network_failures.push({ status: resp.status(), url: resp.url.slice(0, 150) });
    }
  });

  try {
    const url = `https://gamezipper.com/${slug}/?bust=${Date.now()}`;
    const t0 = Date.now();
    const resp = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
    result.http_status = resp.status();
    result.load_ms = Date.now() - t0;
    await page.waitForTimeout(2500);

    // Inspect DOM
    const dom = await page.evaluate(() => {
      const c = document.querySelector('canvas');
      // Many games use DOM tiles, look for board / grid / tiles
      const board = document.querySelector('.board, .grid, .game-board, #board, #grid, [class*="tile-container"], [class*="game-grid"]');
      const playBtn = document.querySelector('button[id*="play" i], button[class*="play" i], .btn-play, .play-btn');
      const tapStart = document.getElementById('gz-tap-start');
      const restart = document.getElementById('gz-restart-overlay');
      const gameVar = !!(window.game || window.G2048 || window.BOARD || window.board || window.gsGameState);
      return {
        hasCanvas: !!c,
        canvasW: c ? c.width : 0,
        canvasH: c ? c.height : 0,
        hasDomGame: !!board,
        hasGameVar: gameVar,
        hasPlayBtn: !!playBtn,
        tapStartVisible: tapStart ? getComputedStyle(tapStart).display !== 'none' : false,
        hasRestart: !!restart,
        bodyText: (document.body.innerText || '').slice(0, 250)
      };
    });
    result.has_canvas = dom.hasCanvas;
    result.canvas_width = dom.canvasW;
    result.canvas_height = dom.canvasH;
    result.has_dom_game = dom.hasDomGame;
    result.has_game_var = dom.hasGameVar;
    result.has_tap_start = dom.tapStartVisible;
    result.has_play_button = dom.hasPlayBtn;
    result.has_restart = dom.hasRestart;
    result.body_text = dom.bodyText;

    // Sample DOM state
    result.game_state_sample = await page.evaluate(() => {
      const out = {};
      // Try to extract common state elements
      const score = document.querySelector('[id*="score" i], [class*="score" i]');
      if (score && score.innerText) out.score = score.innerText.slice(0, 50);
      const best = document.querySelector('[id*="best" i], [class*="best" i]');
      if (best && best.innerText) out.best = best.innerText.slice(0, 50);
      const level = document.querySelector('[id*="level" i], [class*="level" i]');
      if (level && level.innerText) out.level = level.innerText.slice(0, 50);
      return out;
    });

    // Try to interact
    if (dom.tapStartVisible) {
      try {
        await page.click('#gz-tap-start', { timeout: 1500 });
        result.tap_dismissed = true;
      } catch {}
    } else if (dom.hasCanvas && dom.canvasW > 50) {
      try {
        await page.mouse.click(640, 400);
      } catch {}
    } else if (dom.hasPlayBtn) {
      try {
        await page.click('button[id*="play" i], .play-btn', { timeout: 1500 });
      } catch {}
    }

    // For DOM-based games, try keyboard arrows
    if (dom.hasDomGame) {
      for (const k of ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp']) {
        try { await page.keyboard.press(k); await page.waitForTimeout(150); } catch {}
      }
    }

    await page.waitForTimeout(2000);

    // Re-sample state
    const state2 = await page.evaluate(() => {
      const out = {};
      const score = document.querySelector('[id*="score" i], [class*="score" i]');
      if (score && score.innerText) out.score = score.innerText.slice(0, 50);
      const best = document.querySelector('[id*="best" i], [class*="best" i]');
      if (best && best.innerText) out.best = best.innerText.slice(0, 50);
      const level = document.querySelector('[id*="level" i], [class*="level" i]');
      if (level && level.innerText) out.level = level.innerText.slice(0, 50);
      return out;
    });
    result.game_state_after = state2;
    result.state_changed = JSON.stringify(result.game_state_sample) !== JSON.stringify(state2);
  } catch (e) {
    result.crashed = true;
    result.crash_msg = String(e).slice(0, 300);
  } finally {
    await ctx.close();
  }
  return result;
}

(async () => {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  try {
    for (let i = 0; i < toTest.length; i++) {
      const r = await testOne(browser, toTest[i], i);
      results.push(r);
      if ((i + 1) % 5 === 0 || i === 0) {
        const s = stats(results);
        console.log(`[${i+1}/${toTest.length}] tested  pass=${s.stateChanged}/${s.tested}  crashed=${s.crashed}  consoleErr=${s.consoleErrors}  netFail=${s.netFails}  adBlock=${s.adBlocking}`);
      }
      if ((i + 1) % 10 === 0) {
        fs.writeFileSync(OUT, JSON.stringify(results, null, 2));
      }
    }
  } finally {
    await browser.close();
  }
  fs.writeFileSync(OUT, JSON.stringify(results, null, 2));
  console.log('\n=== Final ===');
  console.log(JSON.stringify(stats(results), null, 2));
  console.log('Output:', OUT);
})();

function stats(rs) {
  const s = { tested: rs.length, stateChanged: 0, crashed: 0, consoleErrors: 0, consoleWarnings: 0, netFails: 0, adBlocking: 0, noCanvas: 0, noDomGame: 0, noInteraction: 0 };
  for (const r of rs) {
    if (r.state_changed) s.stateChanged++;
    if (r.crashed) s.crashed++;
    if (r.console_errors.length) s.consoleErrors++;
    if (r.console_warnings.length) s.consoleWarnings++;
    if (r.network_failures.length) s.netFails++;
    if (r.ad_blocking_issues.length) s.adBlocking++;
    if (!r.has_canvas && !r.has_dom_game) s.noCanvas++;
    if (!r.has_tap_start && !r.has_play_button && !r.has_canvas) s.noInteraction++;
  }
  return s;
}
