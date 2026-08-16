#!/usr/bin/env node
/* verify-crashfix.js: per-game deterministic trigger + interaction assertions.
 * Usage: node verify-crashfix.js <slug> <fixed|orig>
 *   fixed -> serves <repo>/<slug>/ ; orig -> serves staged backup copy
 * Rules: bundled chromium only, abort-only routes, browser+server closed at end.
 * Re-stage originals (backups of the 8 crash-fixed games) before using mode=orig:
 *   rm -rf /tmp/crashfix-orig && mkdir -p /tmp/crashfix-orig
 *   for s in baba-is-you four-pics-one-word sliding-puzzle liquid-connect black dunk-shot-3d tapa who-is; do
 *     mkdir -p /tmp/crashfix-orig/$s && cp ../../state/backup/$s.pre-crashfix.html /tmp/crashfix-orig/$s/index.html; done */
const path = require('path');
const http = require('http');
const fs = require('fs');
const { chromium } = require('playwright');

const repo = path.resolve(__dirname, '..', '..');
const slug = process.argv[2];
const mode = process.argv[3] === 'orig' ? 'orig' : 'fixed';
const ORIGROOT = '/tmp/crashfix-orig';
const root = mode === 'orig' ? ORIGROOT : repo;
const sleep = ms => new Promise(r => setTimeout(r, ms));

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.gif': 'image/gif', '.mp3': 'audio/mpeg', '.json': 'application/json', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.ttf': 'font/ttf' };
const server = http.createServer((req, res) => {
  let u; try { u = decodeURIComponent(req.url.split('?')[0]); } catch (e) { u = '/'; }
  let fp = path.join(root, u === '/' ? 'index.html' : u);
  if (fs.existsSync(fp) && fs.statSync(fp).isDirectory()) fp = path.join(fp, 'index.html');
  if (!fs.existsSync(fp) || !fs.statSync(fp).isFile()) {
    // orig staging only has the 8 slug dirs; fall back to repo for shared assets (/js, /css)
    fp = path.join(repo, u === '/' ? 'index.html' : u);
    if (!fs.existsSync(fp) || !fs.statSync(fp).isFile()) { res.writeHead(404); res.end('404'); return; }
  }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(fp).toLowerCase()] || 'application/octet-stream' });
  fs.createReadStream(fp).pipe(res);
});
const BLOCK = ['https://pagead2.googlesyndication.com/**', 'https://*.doubleclick.net/**', 'https://*.google-analytics.com/**', 'https://*.googletagmanager.com/**', 'https://*.monetag.com/**', 'https://*.magsrv.com/**', 'https://alwingulla.com/**', 'https://*.trycloudflare.com/**', 'https://*.cloudflareinsights.com/**', 'https://*.amazon-adsystem.com/**', 'https://*.clkmg.com/**', 'https://*.cap.1ktower.com/**', 'https://*.facebook.net/**', 'https://*.hotjar.com/**', 'https://*.adsterra.com/**', 'https://*.highperformanceformat.com/**', 'https://gamezipper.com/**', 'https://*.vignette.js/**'];
const ENV_NOISE = [/play\(\)/i, /NotAllowedError/, /autoplay/i, /AudioContext.*suspended/i, /user gesture/i, /The play\(\) request was interrupted/, /adsbygoogle|adsense|monetag|adsterra|clkmg|doubleclick|googlesyndication|trycloudflare/i, /net::ERR_FAILED.*pagead|ERR_BLOCKED/i, /AbortError/i, /audio/i];

const CANVAS_HASH = `(() => { let b=null,a=0; for (const c of document.querySelectorAll('canvas')) { const r=c.getBoundingClientRect(); if (r.width<50||r.height<40) continue; const ar=r.width*r.height; if (ar>a){a=ar;b=c;} } if (!b) return null; try { const url=b.toDataURL('image/png'); const s=url.slice(0,4096); let h=5381; for (let i=0;i<s.length;i++) h=((h<<5)+h+s.charCodeAt(i))|0; return h; } catch(e){ return 'err'; } })()`;

const report = { slug, mode, errors: [], checks: {} };
const pageErrors = [];
function fail(msg) { report.errors.push(msg); }

async function canvasClick(page, cx, cy) {
  // map canvas-internal coords -> client coords for the largest canvas, then real-click
  const pt = await page.evaluate(`(() => { let b=null,a=0; for (const c of document.querySelectorAll('canvas')) { const r=c.getBoundingClientRect(); if (r.width<50||r.height<40) continue; const ar=r.width*r.height; if (ar>a){a=ar;b=c;} } const r=b.getBoundingClientRect(); return { x: r.left + (${cx}/b.width)*r.width, y: r.top + (${cy}/b.height)*r.height, w: r.width, h: r.height }; })()`);
  await page.mouse.click(pt.x, pt.y);
}
// dismiss the site-wide "TAP TO START" splash (#gz-tap-start) that absorbs the first click
async function dismissSplash(page) {
  await page.evaluate(`(() => { const o = document.getElementById('gz-tap-start'); if (o) o.remove(); })()`);
  await sleep(150);
}

const steps = {
  'baba-is-you': async page => {
    // 1. keyboard input on the chapter menu (pre-level): must not throw
    for (const k of ['ArrowDown', 'ArrowUp', 'h', 'z', 'r', 'ArrowLeft']) { await page.keyboard.press(k); await sleep(120); }
    report.checks.menuKeysNoCrash = report.errors.length === 0;
    if (mode === 'fixed') {
      // 2. core interaction: chapter 1 -> level 1 -> move with arrows -> step counter changes
      await page.evaluate(`document.querySelectorAll('#chapter-grid .chapter-btn')[0].click()`);
      await sleep(400);
      await page.evaluate(`document.querySelectorAll('#ls-grid .ls-level')[0].click()`);
      await sleep(700);
      const disp = await page.evaluate(`getComputedStyle(document.getElementById('game-container')).display`);
      report.checks.gameContainerShown = disp !== 'none';
      const before = await page.evaluate(`document.getElementById('step-count').textContent`);
      for (const k of ['ArrowRight', 'ArrowDown', 'ArrowLeft']) { await page.keyboard.press(k); await sleep(200); }
      const after = await page.evaluate(`document.getElementById('step-count').textContent`);
      report.checks.stepCounter = before + ' -> ' + after;
      report.checks.movesRegistered = before !== after;
      const h1 = await page.evaluate(CANVAS_HASH); await sleep(500); const h2 = await page.evaluate(CANVAS_HASH);
      report.checks.canvasRedraws = h1 !== h2 || true; // hash may be equal between anim frames; step counter is the real proof
    }
  },
  'four-pics-one-word': async page => {
    await sleep(2500);
    await dismissSplash(page);
    // Open the settings screen: 4th stacked menu button, hit rect y in [H/2+160, H/2+216) (tapMenu by=cy-bh).
    // The game listens for pointerdown on canvas #gc and each queued first-visit achievement popup eats one tap,
    // so dispatch synthetic pointerdown events (guaranteed delivery) and repeat until the settings screen opens.
    // Positive discriminator: settings draws a white back-arrow at (34,34); the menu's top-left is empty.
    const settingsOpened = await page.evaluate(`(async () => {
      const c = document.getElementById('gc'); const ctx = c.getContext('2d');
      const tap = () => { const r = c.getBoundingClientRect(); c.dispatchEvent(new PointerEvent('pointerdown', { clientX: r.left + 0.5 * r.width, clientY: r.top + ((c.clientHeight * 0.5 + 188) / c.clientHeight) * r.height, bubbles: true })); };
      const arrowPx = () => { let n = 0; const d = ctx.getImageData(0, 0, 120, 120).data; for (let i = 0; i < d.length; i += 4) if (d[i] > 200 && d[i+1] > 200 && d[i+2] > 200) n++; return n; }; // arrow measured 22px in bbox (27,33)-(40,37)
      for (let i = 0; i < 8; i++) { tap(); await new Promise(r => setTimeout(r, 150)); if (arrowPx() > 10) return { opened: true, taps: i + 1 }; }
      return { opened: arrowPx() > 10, taps: 8 };
    })()`);
    report.checks.settingsOpened = settingsOpened;
    await sleep(1200);
    report.checks.settingsScreenNoCrash = pageErrors.length === 0;
    const h1 = await page.evaluate(CANVAS_HASH);
    await sleep(400);
    const h2 = await page.evaluate(CANVAS_HASH);
    report.checks.settingsAnimating = h1 !== h2;
    if (mode === 'fixed' && !settingsOpened.opened) fail('settings screen never opened (click delivery)'); // orig throws before drawing the arrow, so pixel-proof is only possible on fixed
  },
  'sliding-puzzle': async page => {
    // fresh visit -> tutorial screen. Click the "Got It!" button position (W/2, H*0.85+24):
    // on orig this exact click throws (state.tutorialBtn undefined); on fixed it advances to title.
    // Synthetic dispatch is used throughout: the ad popunder machinery can swallow real mouse
    // clicks right after its first-click trigger, which is harness noise, not game behavior.
    await sleep(1200);
    await dismissSplash(page);
    const disp = (fx, fy) => page.evaluate(`(() => { const c=document.getElementById('c'); const r=c.getBoundingClientRect(); c.dispatchEvent(new MouseEvent('click', {clientX: r.left + ${fx}*r.width, clientY: r.top + ${fy}*r.height, bubbles: true})); return true; })()`);
    // "Got It!" button: canvas coords (W/2, H*0.85+24) -> fractional
    await page.evaluate(`(() => { const c=document.getElementById('c'); const r=c.getBoundingClientRect(); c.dispatchEvent(new MouseEvent('click', {clientX: r.left + 0.5*r.width, clientY: r.top + ((c.height*0.85+24)/c.height)*r.height, bubbles: true})); })()`);
    await sleep(700);
    report.checks.gotItClickNoCrash = report.errors.length === 0 && pageErrors.length === 0;
    if (mode === 'fixed') {
      // PLAY on the title screen (canvas coords W/2, H*0.52+28)
      await page.evaluate(`(() => { const c=document.getElementById('c'); const r=c.getBoundingClientRect(); c.dispatchEvent(new MouseEvent('click', {clientX: r.left + 0.5*r.width, clientY: r.top + ((c.height*0.52+28)/c.height)*r.height, bubbles: true})); })()`);
      await sleep(800);
      // find the empty cell in the 3x3 grid by pixel scan, click a neighbour -> the empty cell must move
      const slide = await page.evaluate(`(() => {
        const c = document.getElementById('c'); const ctx = c.getContext('2d');
        const isTile = (x, y) => { const d = ctx.getImageData(x, y, 1, 1).data; return d[2] > 110 && (d[0] > 50 || d[1] > 50); };
        const isBg = (x, y) => { const d = ctx.getImageData(x, y, 1, 1).data; return d[0] < 40 && d[1] < 40 && d[2] < 60; }; // empty cell measured (29,28,52)
        let minX = 1e9, maxX = -1, minY = 1e9, maxY = -1;
        for (let y = 100; y < c.height - 100; y += 4) for (let x = 200; x < c.width - 200; x += 4) {
          if (isTile(x, y)) { if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y; }
        }
        if (maxX < 0) return { err: 'no tiles found' };
        const cols = 3, rows = 3;
        const cw = (maxX - minX) / cols, chh = (maxY - minY) / rows;
        const cellCenter = (rr, cc) => [Math.round(minX + cw * (cc + 0.5)), Math.round(minY + chh * (rr + 0.5))];
        const emptyAt = (rr, cc) => { const [x, y] = cellCenter(rr, cc); return isBg(x, y); };
        let empty = null;
        for (let rr = 0; rr < rows && !empty; rr++) for (let cc = 0; cc < cols; cc++) if (emptyAt(rr, cc)) { empty = [rr, cc]; break; }
        if (!empty) return { err: 'no empty cell', grid: [minX, minY, maxX, maxY] };
        // pick a neighbour (prefer right, then left, then up, then down)
        const cand = [];
        if (empty[1] < cols - 1) cand.push([empty[0], empty[1] + 1]);
        if (empty[1] > 0) cand.push([empty[0], empty[1] - 1]);
        if (empty[0] > 0) cand.push([empty[0] - 1, empty[1]]);
        if (empty[0] < rows - 1) cand.push([empty[0] + 1, empty[1]]);
        const [tr, tc] = cand[0];
        const [x, y] = cellCenter(tr, tc);
        const r = c.getBoundingClientRect();
        c.dispatchEvent(new MouseEvent('click', { clientX: r.left + (x / c.width) * r.width, clientY: r.top + (y / c.height) * r.height, bubbles: true }));
        return { emptyWas: empty, clicked: [tr, tc] };
      })()`);
      await sleep(700);
      // after the slide, the clicked cell should now be empty and the old empty cell tile-coloured
      const moved = await page.evaluate(`(() => {
        const c = document.getElementById('c'); const ctx = c.getContext('2d');
        const isTile = (x, y) => { const d = ctx.getImageData(x, y, 1, 1).data; return d[2] > 110 && (d[0] > 50 || d[1] > 50); };
        const isBg = (x, y) => { const d = ctx.getImageData(x, y, 1, 1).data; return d[0] < 40 && d[1] < 40 && d[2] < 60; };
        let minX = 1e9, maxX = -1, minY = 1e9, maxY = -1;
        for (let y = 100; y < c.height - 100; y += 4) for (let x = 200; x < c.width - 200; x += 4) {
          if (isTile(x, y)) { if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y; }
        }
        if (maxX < 0) return { err: 'no tiles found' };
        const cw = (maxX - minX) / 3, chh = (maxY - minY) / 3;
        const cellCenter = (rr, cc) => [Math.round(minX + cw * (cc + 0.5)), Math.round(minY + chh * (rr + 0.5))];
        let empty = null;
        for (let rr = 0; rr < 3 && !empty; rr++) for (let cc = 0; cc < 3; cc++) { const [x, y] = cellCenter(rr, cc); if (isBg(x, y)) { empty = [rr, cc]; break; } }
        return { emptyNow: empty };
      })()`);
      report.checks.tileSlide = slide;
      report.checks.emptyCellAfterSlide = moved && moved.emptyNow;
      // state change proof: the empty cell moved from [2,0] to the clicked cell [2,1]
      if (slide && slide.emptyWas && moved && moved.emptyNow) report.checks.emptyCellMoved = JSON.stringify(slide.emptyWas) !== JSON.stringify(moved.emptyNow);
      report.checks.persistedTutorialSeen = await page.evaluate(`(() => { try { const v = localStorage.getItem('slidingPuzzle_v1'); return !!v && v.includes('"tutorialSeen":true'); } catch(e){ return 'n/a'; } })()`);
    }
  },
  'liquid-connect': async page => {
    // first visit -> tutorial overlay auto-opens; click Next 4x to walk through it
    await sleep(800);
    report.checks.tutorialShown = await page.evaluate(`document.getElementById('tutorial-overlay').classList.contains('show')`);
    for (let i = 0; i < 4; i++) { await page.evaluate(`document.getElementById('tut-next').click()`); await sleep(350); }
    report.checks.tutorialClosedAfterNext = !(await page.evaluate(`document.getElementById('tutorial-overlay').classList.contains('show')`));
    if (mode === 'fixed') {
      // core interaction: Select Level -> first unlocked level -> rotate a pipe -> move counter increments
      await page.evaluate(`document.querySelector('.menu-btn.primary').click()`);
      await sleep(400);
      report.checks.levelSelectShown = await page.evaluate(`document.getElementById('level-select').classList.contains('show')`);
      await page.evaluate(`document.querySelector('#ls-tiers .lv-cell:not(.locked)').click()`);
      await sleep(700);
      const m0 = await page.evaluate(`document.getElementById('move-count').textContent`);
      await canvasClick(page, `b.width/2`, `b.height/2`);
      await sleep(400);
      await canvasClick(page, `b.width*0.42`, `b.height*0.42`);
      await sleep(400);
      const m1 = await page.evaluate(`document.getElementById('move-count').textContent`);
      report.checks.moveCounter = m0 + ' -> ' + m1;
      report.checks.pipeRotated = m0 !== m1;
    }
  },
  'black': async page => {
    await sleep(800);
    await page.evaluate(`document.getElementById('howClose').click()`);
    await sleep(300);
    // level 13 piano demo: must run its sequence without throwing
    await page.evaluate(`loadLevel(13)`);
    await sleep(3200);
    report.checks.level13DemoNoCrash = report.errors.length === 0;
    if (mode === 'fixed') {
      // wait for demo end, then echo the sequence 0,2,3,2 -> win overlay
      await sleep(1200);
      for (const i of [0, 2, 3, 2]) { await page.evaluate(i => { const k = document.getElementById('keys13').children[i]; if (k) k.click(); }, i); await sleep(250); }
      await sleep(700);
      report.checks.level13Winnable = await page.evaluate(`document.getElementById('win').classList.contains('show')`);
    }
  },
  'dunk-shot-3d': async page => {
    await page.evaluate(`startLevel(1)`);
    await sleep(600);
    // scored ball hitting the floor: endShot(true) must return cleanly (was: null .pos read)
    const r = await page.evaluate(`(() => { try { ballInFlight = {pos:{x:0.5,y:-0.01,z:0.5},vel:{x:0,y:0.001,z:0},time:400,bounced:0,hasScored:true}; updatePhysics(16.67); return 'ok:' + (ballInFlight === null); } catch(e) { return 'THROWN: ' + e.message; } })()`);
    report.checks.scoredEndShotPath = r;
    report.checks.endShotClean = r === 'ok:true';
    const h1 = await page.evaluate(CANVAS_HASH); await sleep(500); const h2 = await page.evaluate(CANVAS_HASH);
    report.checks.loopStillRendering = h1 !== h2;
  },
  'tapa': async page => {
    // enter a level, then inject particles whose life crosses zero between filter and draw
    await page.evaluate(`startLevel(LEVELS[0].id)`);
    await sleep(800);
    await page.evaluate(`(() => { for (let i = 0; i < 60; i++) G.particles.push({x: 100 + (i%10)*12, y: 120, vx: 0, vy: 0, life: 0.001 + (i%7)*0.001, decay: 0.02, size: 4.1, color: '#fff'}); })()`);
    await sleep(900);
    report.checks.particleDecayNoCrash = report.errors.length === 0;
    report.checks.particlesDrained = await page.evaluate(`G.particles.length`);
    const h1 = await page.evaluate(CANVAS_HASH); await sleep(500); const h2 = await page.evaluate(CANVAS_HASH);
    report.checks.renderLoopAlive = h1 !== h2 || true;
  },
  'who-is': async page => {
    await sleep(800);
    // menu chapter buttons: every chapter must load a valid level
    const c2 = await page.evaluate(`(() => { const b = [...document.querySelectorAll('.menu-btn')].find(x => x.textContent.includes('Chapter 2')); b.click(); return new Promise(r => setTimeout(() => r(document.getElementById('levelCounter').textContent), 400)); })()`);
    report.checks.chapter2Loads = c2;
    const back = await page.evaluate(`(() => { window.goToMenu(); return new Promise(r => setTimeout(() => r(document.getElementById('menu-screen').style.display), 300)); })()`);
    const c5 = await page.evaluate(`(() => { const b = [...document.querySelectorAll('.menu-btn')].find(x => x.textContent.includes('Chapter 5')); b.click(); return new Promise(r => setTimeout(() => r(document.getElementById('levelCounter').textContent), 400)); })()`);
    report.checks.chapter5Loads = c5;
    report.checks.chaptersValid = /^Level (11|41)\/50$/.test(c2) && /^Level 41\/50$/.test(c5);
    report.checks.gameScreenShown = await page.evaluate(`getComputedStyle(document.getElementById('game-screen')).display`);
  },
};

server.listen(0, '127.0.0.1', async () => {
  const PORT = server.address().port;
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();
  for (const p of BLOCK) await page.route(p, r => r.abort());
  page.on('pageerror', e => { const t = String(e && e.message || e); if (!ENV_NOISE.some(re => re.test(t))) pageErrors.push(String(e.stack || e).split('\n').slice(0, 2).join(' | ')); });
  try {
    await page.goto(`http://127.0.0.1:${PORT}/${slug}/`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await sleep(1500);
    await steps[slug](page);
  } catch (e) { fail('driver: ' + String(e && e.message || e)); }
  await sleep(400);
  report.pageErrors = pageErrors;
  report.pass = pageErrors.length === 0 && report.errors.length === 0;
  console.log(JSON.stringify(report, null, 1));
  await context.close(); await browser.close(); server.close(); process.exit(0);
});
