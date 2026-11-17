import { chromium } from '/home/junze/data/game_dev_working/gamezipper.com/node_modules/playwright/index.mjs';
import { writeFile } from 'node:fs/promises';

const OUT = '/home/junze/gamezipper.com/qa-evidence-real-data';
const BASE = 'https://gamezipper.com';
const result = { homepage: {}, games: [], startedAt: new Date().toISOString() };
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
let browser;
try {
  browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, serviceWorkers: 'block' });
  const page = await context.newPage();
  const consoleErrors = [];
  const pageErrors = [];
  const failedRequests = [];
  page.on('console', message => { if (message.type() === 'error') consoleErrors.push(`${message.text()} @ ${message.location()?.url || 'inline'}`); });
  page.on('pageerror', error => pageErrors.push(error.message));
  page.on('requestfailed', request => failedRequests.push(`${request.url()} :: ${request.failure()?.errorText || 'failed'}`));
  await page.goto(`${BASE}/?qa=realdata`, { waitUntil: 'load', timeout: 90000 });
  await page.waitForFunction(() => window.__gzPublicStats && Number.isSafeInteger(window.__gzPublicStats.playedToday), null, { timeout: 15000 });
  await sleep(1200);
  const homepage = await page.evaluate(() => {
    const nav = performance.getEntriesByType('navigation')[0];
    const stats = performance.getEntriesByType('resource').find(entry => entry.name.includes('/api/public-stats'));
    return {
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
      timing: nav ? { domContentLoaded: nav.domContentLoadedEventEnd, load: nav.loadEventEnd, statsStart: stats?.startTime, statsDuration: stats?.duration } : null,
    };
  });
  const numeric = value => Number(String(value).replace(/,/g, ''));
  if (homepage.gameCount !== '467') throw new Error(`game_count:${homepage.gameCount}`);
  if (numeric(homepage.playedToday) !== homepage.api.playedToday) throw new Error('played_dom_api_mismatch');
  if (numeric(homepage.playingNow) !== homepage.api.playingNow) throw new Error('playing_dom_api_mismatch');
  if (numeric(homepage.trendingPlayingNow) !== homepage.api.playingNow) throw new Error('trending_dom_api_mismatch');
  if (!homepage.liveVisible || !homepage.dailyVisible) throw new Error('real_stats_hidden');
  if (homepage.weeklyValue !== 0 || homepage.weeklyVisible) throw new Error('weekly_zero_not_hidden');
  if (homepage.updated !== 'Nov 17, 2026') throw new Error(`updated:${homepage.updated}`);
  if (homepage.reviewSectionPresent) throw new Error('reviews_present');
  if (consoleErrors.length || pageErrors.length || failedRequests.length) {
    throw new Error(`production_home_errors:${JSON.stringify({ consoleErrors, pageErrors, failedRequests })}`);
  }
  if (homepage.timing?.statsStart < homepage.timing?.load) throw new Error(`stats_not_async:${JSON.stringify(homepage.timing)}`);
  await page.screenshot({ path: `${OUT}/production-homepage-top.png`, fullPage: false });
  await page.screenshot({ path: `${OUT}/production-homepage-full.png`, fullPage: true });
  result.homepage = { ...homepage, consoleErrors, pageErrors, failedRequests, result: 'PASS' };
  await context.close();

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
  if (result.summary.result !== 'PASS') throw new Error('production_game_regression_failed');
} catch (error) {
  result.fatal = error.stack || String(error);
  process.exitCode = 1;
} finally {
  result.finishedAt = new Date().toISOString();
  await writeFile(`${OUT}/production-browser-regression.json`, JSON.stringify(result, null, 2));
  if (browser) await browser.close();
  console.log(JSON.stringify({ fatal: result.fatal, homepage: result.homepage?.result, timing: result.homepage?.timing, summary: result.summary, evidence: `${OUT}/production-browser-regression.json` }, null, 2));
}
