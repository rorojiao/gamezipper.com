import { chromium } from '/home/junze/data/game_dev_working/gamezipper.com/node_modules/playwright/index.mjs';
import { spawn } from 'node:child_process';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';

const ROOT = '/home/junze/gamezipper.com';
const OUT = path.join(ROOT, 'qa-evidence-real-data');
const PORT = 18081;
const BASE = `http://127.0.0.1:${PORT}`;
const QUICK_BI = 'https://fluid-managing-russia-reid.trycloudflare.com';
const server = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], {
  cwd: ROOT,
  stdio: ['ignore', 'pipe', 'pipe'],
});
let browser;
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const result = { homepage: {}, games: [], startedAt: new Date().toISOString() };

try {
  let ready = false;
  for (let i = 0; i < 40; i += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${PORT}/api/health`).catch(() => null);
      if (response || i > 3) { ready = true; break; }
    } catch { /* retry */ }
    await sleep(100);
  }
  if (!ready) throw new Error('local_static_server_not_ready');

  browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    serviceWorkers: 'block',
  });

  // BI requests go to the same live SQLite service through its real QuickTunnel.
  // Only the local-test CORS header is added; response data is never synthesized.
  await context.route('https://bi.gamezipper.com/**', async route => {
    const url = new URL(route.request().url());
    const request = route.request();
    try {
      const response = await route.fetch({
        url: `${QUICK_BI}${url.pathname}${url.search}`,
        method: request.method(),
        headers: { 'Content-Type': request.headers()['content-type'] || 'application/json', Origin: 'https://gamezipper.com' },
        postData: request.postData() || undefined,
      });
      await route.fulfill({ response, headers: { ...response.headers(), 'access-control-allow-origin': '*' } });
    } catch (error) {
      await route.abort('failed');
    }
  });

  const page = await context.newPage();
  const homeErrors = [];
  const failedHomeRequests = [];
  let currentGame = '';
  const gameErrors = new Map();
  page.on('pageerror', error => {
    if (currentGame) {
      const list = gameErrors.get(currentGame) || [];
      list.push(error.message);
      gameErrors.set(currentGame, list);
    } else homeErrors.push(`pageerror: ${error.message}`);
  });
  page.on('console', message => {
    if (!currentGame && message.type() === 'error') homeErrors.push(`console: ${message.text()} @ ${message.location()?.url || 'inline'}`);
  });
  page.on('requestfailed', request => {
    if (!currentGame && /(gamezipper\.com|127\.0\.0\.1)/.test(request.url())) {
      failedHomeRequests.push(`${request.url()} :: ${request.failure()?.errorText || 'failed'}`);
    }
  });

  currentGame = '';
  await page.goto(`${BASE}/`, { waitUntil: 'load', timeout: 90000 });
  try {
    await page.waitForFunction(() => window.__gzPublicStats && Number.isSafeInteger(window.__gzPublicStats.playedToday), null, { timeout: 15000 });
  } catch (error) {
    result.debug = await page.evaluate(() => ({
      readyState: document.readyState,
      meta: window.GZ_SITE_META,
      stats: window.__gzPublicStats,
      liveText: document.getElementById('gz-live-players')?.textContent,
      dailyText: document.getElementById('gz-daily-plays')?.textContent,
      scripts: [...document.scripts].map(script => script.src).filter(Boolean),
    }));
    result.debug.homeErrors = homeErrors;
    result.debug.failedHomeRequests = failedHomeRequests;
    await page.screenshot({ path: path.join(OUT, 'homepage-debug.png'), fullPage: false });
    throw error;
  }
  await sleep(1000);
  const homepage = await page.evaluate(() => ({
    gameCount: document.getElementById('game-count')?.textContent,
    playedToday: document.getElementById('gz-daily-count')?.textContent,
    playingNow: document.getElementById('gz-player-count')?.textContent,
    trendingPlayingNow: document.getElementById('gz-live-num')?.textContent,
    liveVisible: !!document.getElementById('gz-live-players')?.offsetParent,
    dailyVisible: !!document.getElementById('gz-daily-plays')?.offsetParent,
    weeklyVisible: !!document.getElementById('gz-weekly-new')?.offsetParent,
    weeklyValue: window.GZ_SITE_META?.newGamesThisWeek,
    updated: document.querySelector('#gz-updated-date .gz-date-text')?.textContent,
    reviewSectionPresent: !!document.getElementById('gz-reviews'),
    api: window.__gzPublicStats,
    statsEndpoint: window.GZ_SITE_META?.statsEndpoint,
  }));
  const numeric = value => Number(String(value).replace(/,/g, ''));
  if (homepage.gameCount !== '467') throw new Error(`game_count_mismatch:${homepage.gameCount}`);
  if (numeric(homepage.playedToday) !== homepage.api.playedToday) throw new Error('played_today_dom_api_mismatch');
  if (numeric(homepage.playingNow) !== homepage.api.playingNow) throw new Error('playing_now_dom_api_mismatch');
  if (numeric(homepage.trendingPlayingNow) !== homepage.api.playingNow) throw new Error('trending_dom_api_mismatch');
  if (!homepage.liveVisible || !homepage.dailyVisible) throw new Error('real_stats_not_visible');
  if (homepage.weeklyValue !== 0 || homepage.weeklyVisible) throw new Error('weekly_new_not_hidden_at_zero');
  if (homepage.updated !== 'Nov 17, 2026') throw new Error(`wrong_updated_date:${homepage.updated}`);
  if (homepage.reviewSectionPresent) throw new Error('fake_review_section_still_present');
  const firstPartyErrors = homeErrors.filter(message => {
    const url = message.match(/ @ (https?:\/\/\S+)$/)?.[1] || '';
    return !url || url.startsWith(BASE) || url.startsWith('https://bi.gamezipper.com');
  });
  const thirdPartyEnvironmentErrors = homeErrors.filter(message => !firstPartyErrors.includes(message));
  if (firstPartyErrors.length || failedHomeRequests.length) {
    throw new Error(`homepage_console_or_request_errors:${JSON.stringify({ firstPartyErrors, failedHomeRequests })}`);
  }
  await page.screenshot({ path: path.join(OUT, 'homepage-top.png'), fullPage: false });
  await page.screenshot({ path: path.join(OUT, 'homepage-full.png'), fullPage: true });
  result.homepage = { ...homepage, consoleErrors: firstPartyErrors, thirdPartyEnvironmentErrors, failedRequests: failedHomeRequests, result: 'PASS' };

  const slugs = ['2048', 'snake', 'tetris', 'sudoku', 'chess', 'solitaire', 'minesweeper', 'blackjack', 'cryptograms', 'color-sort', 'brick-breaker', 'flappy-wings', 'crossword', 'word-search', 'mahjong-solitaire', 'checkers', 'memory-match', 'tic-tac-toe', 'connect-four', 'reversi'];
  for (const slug of slugs) {
    const gameContext = await browser.newContext({ viewport: { width: 1440, height: 1000 }, serviceWorkers: 'block' });
    const gamePage = await gameContext.newPage();
    const errors = [];
    gamePage.on('pageerror', error => errors.push(error.message));
    try {
      const response = await gamePage.goto(`${BASE}/${slug}/`, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await sleep(1200);
      const splash = gamePage.locator('#splash-screen:visible');
      if (await splash.count()) {
        await splash.click({ position: { x: 20, y: 20 }, timeout: 2500 }).catch(() => {});
        await sleep(500);
      }
      await gamePage.mouse.click(640, 400);
      await gamePage.keyboard.press('ArrowLeft').catch(() => {});
      await sleep(800);
      const state = await gamePage.evaluate(() => ({
        title: document.title,
        textLength: (document.body?.innerText || '').trim().length,
        canvases: document.querySelectorAll('canvas').length,
        controls: document.querySelectorAll('button,[role="button"],input,select,.cell,.card,[data-cell],table').length,
      }));
      const thirdPartyAdErrors = errors.filter(message => message === 'sl' || /adsbygoogle/.test(message));
      const gameCodeErrors = errors.filter(message => !thirdPartyAdErrors.includes(message));
      const pass = response?.status() === 200 && state.textLength > 40 && state.controls > 0 && gameCodeErrors.length === 0;
      result.games.push({ slug, http: response?.status(), ...state, errors: gameCodeErrors, thirdPartyAdErrors, result: pass ? 'PASS' : 'FAIL' });
    } catch (error) {
      result.games.push({ slug, errors: [...errors, error.message], result: 'FAIL' });
    } finally {
      await gameContext.close();
    }
  }
  result.summary = {
    homepage: 'PASS',
    gamesPassed: result.games.filter(game => game.result === 'PASS').length,
    gamesTotal: result.games.length,
    result: result.games.every(game => game.result === 'PASS') ? 'PASS' : 'FAIL',
  };
  if (result.summary.result !== 'PASS') throw new Error('game_regression_failed');
} catch (error) {
  result.fatal = error.stack || String(error);
  process.exitCode = 1;
} finally {
  result.finishedAt = new Date().toISOString();
  await writeFile(path.join(OUT, 'browser-regression.json'), JSON.stringify(result, null, 2));
  if (browser) await browser.close();
  server.kill('SIGTERM');
  console.log(JSON.stringify({ fatal: result.fatal, homepage: result.homepage?.result, summary: result.summary, evidence: path.join(OUT, 'browser-regression.json') }, null, 2));
}
