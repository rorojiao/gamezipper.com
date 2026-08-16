#!/usr/bin/env node
/* Playability harness: headless-chromium "plays" a game with structured random input and
 * collects evidence of liveness (canvas pixels changing, score-like text changing, rAF).
 * Usage: node playtest.js --only slug1,slug2 | --list file.txt [--dur 20] [--force] [--concurrency 2]
 * Evidence: _optimization/evidence/<slug>/playtest-{start,end}.png + _optimization/reports/playtest-results.json
 * Rules (same env constraints as smoke-test.js): bundled chromium only (no channel), abort-only
 * page.route for ad/analytics domains (route.continue() is broken here; never call it), browser+server closed at end. */
const fs = require('fs');
const path = require('path');
const http = require('http');
const { chromium } = require('playwright');

const repo = path.resolve(__dirname, '..', '..');
const EV = p => path.join(repo, '_optimization', 'evidence', p);
const REP = path.join(repo, '_optimization', 'reports');
const RESULTS = path.join(REP, 'playtest-results.json');

const args = process.argv.slice(2);
const argOf = k => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
const ONLY = argOf('--only') ? argOf('--only').split(',').map(s => s.trim()).filter(Boolean) : null;
const LIST = argOf('--list');
const DUR = Math.max(5, parseInt(argOf('--dur') || '20', 10));
const FORCE = args.includes('--force');
const CONC = Math.max(1, parseInt(argOf('--concurrency') || '2', 10));
const sleep = ms => new Promise(r => setTimeout(r, ms));

let targets;
if (ONLY) targets = ONLY;
else if (LIST) targets = fs.readFileSync(LIST, 'utf8').split(/[\s,]+/).map(s => s.trim()).filter(Boolean);
else {
  // default scope: action/arcade canvas games without a dedicated verifier (inventory flags)
  const inv = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'state', 'inventory.json'), 'utf8')).games;
  targets = inv.filter(g => /^(action|arcade)$/i.test(g.category || '') && g.canvas && !g.isStub && !g.hasVerifier).map(g => g.slug);
}

// ---- static server (same pattern as smoke-test.js) ----
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.gif': 'image/gif', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.wav': 'audio/wav', '.m4a': 'audio/mp4', '.json': 'application/json', '.ico': 'image/x-icon', '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf' };
const server = http.createServer((req, res) => {
  let u;
  try { u = decodeURIComponent(req.url.split('?')[0]); } catch (e) { u = '/'; }
  let fp = path.join(repo, u === '/' ? 'index.html' : u);
  if (fs.existsSync(fp) && fs.statSync(fp).isDirectory()) fp = path.join(fp, 'index.html');
  if (!fs.existsSync(fp) || !fs.statSync(fp).isFile()) { res.writeHead(404, { 'Content-Type': 'text/plain' }); res.end('404'); return; }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(fp).toLowerCase()] || 'application/octet-stream' });
  fs.createReadStream(fp).pipe(res);
});
server.listen(0, '127.0.0.1');

// Abort-only routes for ad/analytics/prod domains (route.continue() is broken in this env; never call it)
const BLOCK_PATTERNS = [
  'https://pagead2.googlesyndication.com/**', 'https://*.doubleclick.net/**', 'https://*.google-analytics.com/**',
  'https://*.googletagmanager.com/**', 'https://*.monetag.com/**', 'https://*.magsrv.com/**', 'https://alwingulla.com/**',
  'https://*.trycloudflare.com/**', 'https://*.cloudflareinsights.com/**', 'https://*.amazon-adsystem.com/**',
  'https://*.clkmg.com/**', 'https://*.cap.1ktower.com/**', 'https://*.facebook.net/**', 'https://*.hotjar.com/**',
  'https://*.adsterra.com/**', 'https://*.highperformanceformat.com/**', 'https://gamezipper.com/**', 'https://*.vignette.js/**',
];
// pageerror noise from headless/no-gesture env: autoplay policies, aborted ad fetches
const ENV_NOISE = [/play\(\)/i, /NotAllowedError/, /autoplay/i, /AudioContext.*suspended/i, /user gesture/i, /The play\(\) request was interrupted/, /adsbygoogle|adsense|monetag|adsterra|clkmg|doubleclick|googlesyndication|trycloudflare/i, /net::ERR_FAILED.*pagead|ERR_BLOCKED/i, /AbortError/i, /audio/i];

// ---- in-page probes ----
// largest visible canvas -> djb2-ish hash of first 4KB of toDataURL + total length
const CANVAS_PROBE = `(() => {
  let best = null, bestArea = 0;
  for (const c of document.querySelectorAll('canvas')) {
    const r = c.getBoundingClientRect();
    if (r.width < 50 || r.height < 40) continue;
    const a = r.width * r.height;
    if (a > bestArea) { bestArea = a; best = c; }
  }
  if (!best) return { canvas: false };
  try {
    const url = best.toDataURL('image/png');
    const s = url.slice(0, 4096);
    let h = 5381;
    for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
    return { canvas: true, hash: h, len: url.length, w: best.width, h: best.height };
  } catch (e) { return { canvas: true, hashErr: String(e && e.message || e).slice(0, 80) }; }
})()`;
// visible text nodes containing digits (score/HUD-like), nav/ad containers excluded
const SCORE_PROBE = `(() => {
  const out = [];
  const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let n, i = 0;
  while ((n = walk.nextNode()) && i < 400) {
    const t = (n.nodeValue || '').trim();
    if (!t || t.length > 60 || !/\\d/.test(t)) continue;
    const el = n.parentElement;
    if (!el || /^(SCRIPT|STYLE|NOSCRIPT|NAV|INS|IFRAME)$/.test(el.tagName)) continue;
    if (el.closest('nav,#gz-topnav,[id^=gz-ad],[class*=adsbygoogle],[id^=gz-cta],ins,iframe')) continue;
    const st = getComputedStyle(el);
    if (st.display === 'none' || st.visibility === 'hidden' || +st.opacity === 0) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) continue;
    out.push(t.replace(/\\s+/g, ' ').slice(0, 50));
    i++;
  }
  return out;
})()`;
// rAF liveness: >=6 frames inside 0.9s (headless still fires rAF for active tabs)
const RAF_PROBE = `(() => new Promise(res => {
  let n = 0; const t0 = performance.now();
  const cb = () => { n++; if (n >= 6) res(true); else if (performance.now() - t0 > 900) res(false); else requestAnimationFrame(cb); };
  requestAnimationFrame(cb);
  setTimeout(() => res(n >= 2), 1000);
}))()`;
// dedicated score-ish elements (id/class hints) for evidence
const SCORE_EL_PROBE = `(() => {
  const out = {};
  for (const el of document.querySelectorAll('[id],[class]')) {
    const k = el.id || (typeof el.className === 'string' ? el.className : '');
    if (!/(^|[-_ ])(score|best|lvl|level|point|coin|dist|hud)([-_ ]|$)/i.test(k)) continue;
    const t = (el.innerText || '').trim();
    if (!t || t.length > 40) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 2) continue;
    out[k] = t.replace(/\\s+/g, ' ').slice(0, 40);
  }
  return out;
})()`;
// start/advance candidates, tiered: 1=play/start buttons, 2=confirm (got it/next), 3=pure-digit cells (level "1"), 4=onclick-wired digit cards (chapter cards)
const FIND_START = `(() => {
  const A = /play|start|begin|tap to|continue/i;
  const AX = /again|restart|replay|more games|share|setting|how|back|reset|hint|pause|next|level/i;
  const B = /^(got it|ok|okay|next|continue|let'?s play|play now|start level|level 1)$/i;
  const out = [];
  const vis = el => {
    const st = getComputedStyle(el);
    if (st.display === 'none' || st.visibility === 'hidden' || st.pointerEvents === 'none') return false;
    const r = el.getBoundingClientRect();
    return r.width >= 5 && r.height >= 5 && r.bottom > 0 && r.right > 0 && r.top < innerHeight && r.left < innerWidth;
  };
  const bad = el => !!(el.closest && el.closest('nav,#gz-topnav,[id^=gz-ad],[id^=gz-cta],footer,ins,iframe'));
  const label = el => ((el.innerText || el.value || el.getAttribute('aria-label') || '') + '').trim().replace(/\\s+/g, ' ');
  const add = (el, tier, txt) => {
    const r = el.getBoundingClientRect();
    out.push({ el, tier, txt: txt.slice(0, 24), x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2), area: Math.round(r.width * r.height) });
  };
  for (const el of document.querySelectorAll('button, [role=button], input[type=button], input[type=submit], a')) {
    if (bad(el)) continue;
    const txt = label(el);
    if (!txt || !vis(el)) continue;
    if (el.tagName === 'A') { const h = el.getAttribute('href') || ''; if (!h.startsWith('#') && !h.startsWith('javascript:')) continue; }
    if (txt.length <= 25 && A.test(txt) && !AX.test(txt)) { add(el, 1, txt); continue; }
    const t2 = txt.toLowerCase().replace(/[!.:…*]+$/, '').trim();
    if (B.test(t2)) add(el, 2, txt);
    else if (/^\\d{1,3}$/.test(txt)) add(el, 3, txt);
  }
  for (const el of document.querySelectorAll('[onclick], div, span, li')) {
    if (typeof el.onclick !== 'function' || bad(el) || !vis(el)) continue;
    const txt = label(el);
    if (!txt || txt.length > 24 || !/\\d/.test(txt)) continue;
    const r = el.getBoundingClientRect();
    if (r.width * r.height > innerWidth * innerHeight * 0.25) continue;
    add(el, 4, txt);
  }
  out.sort((a, b) => a.tier - b.tier || (a.tier <= 2 ? b.area - a.area : a.area - b.area));
  const top = out.slice(0, 12);
  top.forEach((c, i) => { c.k = 'gzpt' + i; try { c.el.setAttribute('data-gzpt', c.k); } catch (e) {} });
  return top.map(({ k, tier, txt }) => ({ k, tier, txt }));
})()`;

function detectRedirectStub(slug) {
  const fp = path.join(repo, slug, 'index.html');
  if (!fs.existsSync(fp)) return 'MISSING';
  let html;
  try { html = fs.readFileSync(fp, 'utf8'); } catch (e) { return null; }
  if (html.length > 3000) return null; // stub pages are tiny
  const m = html.match(/url=(https?:\/\/[^"'>\s]+)/) || html.match(/location\.replace\((['"])(https?:\/\/[^'"]+)\1\)/);
  return m ? (m[2] || m[1]) : null;
}

let results = {};
if (fs.existsSync(RESULTS) && !FORCE) {
  try { results = JSON.parse(fs.readFileSync(RESULTS, 'utf8')).results || {}; } catch (e) { results = {}; }
}
const queue = targets.filter(s => FORCE || !results[s]);
const total = targets.length;
let done = Object.keys(results).length;

function persist() {
  if (!fs.existsSync(REP)) fs.mkdirSync(REP, { recursive: true });
  fs.writeFileSync(RESULTS, JSON.stringify({ updated: new Date().toISOString(), harness: 'playtest.js', durSec: DUR, total_in_scope: total, done, results }, null, 1));
}

function classify(rec) {
  const canvasMoved = rec.canvasSamples && rec.canvasSamples.pairs > 0 && rec.canvasSamples.changed > 0;
  const hasErr = (rec.pageErrors || []).length > 0;
  if (!rec.started || !canvasMoved) return 'DEAD';
  if (hasErr || rec.scoreLikeChanges === 0) return 'DEGRADED';
  return 'PLAYABLE';
}

async function playtestGame(browser, slug) {
  const rec = { slug, ts: new Date().toISOString(), durSec: DUR, started: false };
  const pageErrors = [];
  fs.mkdirSync(EV(slug), { recursive: true });

  const stub = detectRedirectStub(slug);
  rec.redirectStub = stub === 'MISSING' ? 'MISSING: no index.html' : stub;

  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();
  for (const pat of BLOCK_PATTERNS) await page.route(pat, r => r.abort());
  const onPageErr = e => { const t = String(e && e.message || e).slice(0, 300); if (!ENV_NOISE.some(re => re.test(t))) pageErrors.push(t); };
  page.on('pageerror', onPageErr);

  try {
    const resp = await page.goto(`http://127.0.0.1:${PORT}/${slug}/`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    rec.httpStatus = resp ? resp.status() : 0;
    await page.waitForTimeout(3000);
    // shield: random clicks must never follow cross-page links (scroll between guard and click
    // would otherwise navigate away, e.g. to /tetris/ or /blog/, and poison all evidence)
    await page.evaluate(`(() => {
      if (window.__gzptShield) return; window.__gzptShield = true;
      document.addEventListener('click', e => {
        const t = e.target; if (!t || !t.closest) return;
        const a = t.closest('a[href]'); if (!a) return;
        const h = a.getAttribute('href') || '';
        if (h.startsWith('#') || h.startsWith('javascript:') || a.target === '_blank') return;
        e.preventDefault(); e.stopPropagation();
      }, true);
    })()`).catch(() => {});

    // step 1: initial canvas / score snapshot
    rec.initial = await page.evaluate(`({ canvas: ${CANVAS_PROBE}, scoreTexts: ${SCORE_PROBE}, scoreEls: ${SCORE_EL_PROBE} })`).catch(e => ({ evalError: String(e).slice(0, 200) }));

    if (rec.redirectStub) {
      // redirect stub page: nothing to play; capture evidence and finish fast
      await page.screenshot({ path: EV(`${slug}/playtest-start.png`) }).catch(() => {});
      await page.screenshot({ path: EV(`${slug}/playtest-end.png`) }).catch(() => {});
      rec.note = 'redirect stub page, no local game';
      rec.verdict = classify(rec); // no canvas samples -> DEAD
      return rec;
    }

    // step 2: find start entry and advance through menus (chapters/levels/tutorial popups)
    const clicked = [];
    const tried = new Set();
    const EXPOSED_PROBE = `(() => { let b=null,a=0; for (const cv of document.querySelectorAll('canvas')){const r=cv.getBoundingClientRect(); if(r.width<50||r.height<40) continue; const ar=r.width*r.height; if(ar>a){a=ar;b=cv;}} if(!b) return false; const r=b.getBoundingClientRect(); const el=document.elementFromPoint(r.x+r.width/2, r.y+r.height/2); return el===b || (el && b.contains(el)); })()`;
    let lastHash = null, animRuns = 0, noCand = 0, gridClicks = 0;
    for (let step = 0; step < 9 && clicked.length < 7; step++) {
      // game canvas directly hittable (no menu overlay on top) -> stop advancing, play
      const exposed = await page.evaluate(EXPOSED_PROBE).catch(() => false);
      if (exposed && (rec.started || step > 0)) break;
      if (step > 0) {
        const cv = await page.evaluate(CANVAS_PROBE).catch(() => null);
        const h = cv && cv.canvas ? cv.hash : null;
        if (h != null && lastHash != null && h !== lastHash) { animRuns++; if (animRuns >= 2 || (animRuns >= 1 && noCand >= 1)) break; } else animRuns = 0;
        lastHash = h;
      }
      const cands = await page.evaluate(FIND_START).catch(() => []);
      let c = cands.find(c => !tried.has(c.tier + '|' + c.txt));
      if (c && (c.tier === 3 || c.tier === 4)) { if (gridClicks >= 2) c = undefined; }
      if (!c) {
        const c12 = cands.find(c => (c.tier === 1 || c.tier === 2) && !tried.has(c.tier + '|' + c.txt));
        c = c12;
      }
      if (!c) { if (++noCand >= 2) break; await page.waitForTimeout(500); continue; }
      noCand = 0;
      if (c.tier >= 3) gridClicks++;
      // targeted JS click on the element itself: real-mouse clicks at coordinates can be
      // intercepted by invisible overlay screens (e.g. slice-master .ov>* pointer-events)
      const ok = await page.evaluate(k => { const el = document.querySelector('[data-gzpt="' + k + '"]'); if (el) { el.click(); return true; } return false; }, c.k).catch(() => false);
      if (!ok) { tried.add(c.tier + '|' + c.txt); continue; }
      tried.add(c.tier + '|' + c.txt);
      clicked.push('t' + c.tier + ':' + c.txt);
      if (c.tier === 1) rec.startedVia = 'button';
      rec.started = true;
      await page.waitForTimeout(900);
    }
    rec.startClicked = clicked;
    try { await page.evaluate(`(() => { if (document.activeElement && document.activeElement.blur) document.activeElement.blur(); })()`); } catch (e) {}
    if (!rec.started || animRuns === 0) {
      // fallback / nudge: real click at canvas center (starts fullscreen "tap to play" splashes)
      const box = await (async () => { try { return await page.evaluate(`(() => { let b=null,a=0; for (const cv of document.querySelectorAll('canvas')){const r=cv.getBoundingClientRect(); if(r.width<50) continue; const ar=r.width*r.height; if(ar>a){a=ar;b={x:r.x,y:r.y,w:r.width,h:r.height};}} return b; })()`); } catch (e) { return null; } })();
      const cx = box ? Math.round(box.x + box.w / 2) : 640, cy = box ? Math.round(box.y + box.h / 2) : 400;
      try { await page.mouse.click(cx, cy); if (!rec.started) { rec.startedVia = `canvas-center(${cx},${cy})`; rec.started = true; } else clicked.push('nudge:center'); } catch (e) {}
      await page.waitForTimeout(400);
      try { await page.keyboard.press('Space'); await page.waitForTimeout(300); } catch (e) {}
    }
    await page.screenshot({ path: EV(`${slug}/playtest-start.png`) }).catch(() => {});

    // steps 3+4 in parallel: structured random input & 2s-interval liveness sampling
    const durMs = DUR * 1000;
    rec.inputLog = []; rec.inputCount = 0; rec.scoreLikeChanges = 0; rec.scoreExamples = []; rec.rafAlive = false;
    rec.canvasSamples = { pairs: 0, changed: 0 };
    rec.linkSkips = 0;
    let inputErrs = 0, crashed = false;
    page.on('crash', () => { crashed = true; });
    // guard: clicking a same-page link would navigate away and poison all evidence
    const SAFE_POINT = `(x, y) => { const el = document.elementFromPoint(x, y); if (!el || !el.closest) return true; const a = el.closest('a[href]'); if (!a) return true; const h = a.getAttribute('href') || ''; return h.startsWith('#') || h.startsWith('javascript:') || a.target === '_blank'; }`;
    const gameGone = () => { try { const u = page.url(); return u !== `http://127.0.0.1:${PORT}/${slug}/` && u !== `http://127.0.0.1:${PORT}/${slug}/index.html`; } catch (e) { return true; } };

    const inputLoop = async () => {
      const t0 = Date.now();
      const keys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
      while (Date.now() - t0 < durMs && !crashed && !gameGone()) {
        await sleep(300 + Math.random() * 300);
        if (crashed || gameGone()) break;
        const roll = Math.random();
        try {
          if (roll < 0.40) {
            for (let t = 0; t < 3; t++) {
              const x = Math.round(1280 * (0.2 + Math.random() * 0.6)), y = Math.round(800 * (0.2 + Math.random() * 0.6));
              if (!(await page.evaluate(SAFE_POINT, x, y).catch(() => true))) { rec.linkSkips++; continue; }
              await page.mouse.click(x, y); rec.inputLog.push(`click@${x},${y}`); break;
            }
          } else if (roll < 0.65) {
            const k = keys[(Math.random() * 4) | 0];
            await page.keyboard.press(k); rec.inputLog.push('key:' + k);
          } else if (roll < 0.85) {
            await page.keyboard.press('Space'); rec.inputLog.push('key:Space');
          } else {
            const x1 = Math.round(1280 * (0.2 + Math.random() * 0.6)), y1 = Math.round(800 * (0.2 + Math.random() * 0.6));
            const x2 = Math.round(1280 * (0.2 + Math.random() * 0.6)), y2 = Math.round(800 * (0.2 + Math.random() * 0.6));
            if (!(await page.evaluate(SAFE_POINT, x1, y1).catch(() => true))) { rec.linkSkips++; continue; }
            await page.mouse.move(x1, y1); await page.mouse.down();
            await page.mouse.move(Math.round((x1 + x2) / 2), Math.round((y1 + y2) / 2), { steps: 3 });
            await page.mouse.move(x2, y2, { steps: 3 }); await page.mouse.up();
            rec.inputLog.push(`drag@${x1},${y1}->${x2},${y2}`);
          }
          rec.inputCount++;
        } catch (e) { if (++inputErrs > 5) break; }
      }
    };

    const sampleLoop = async () => {
      const t0 = Date.now();
      let prevCanvas = null, prevScores = null;
      while (Date.now() - t0 < durMs + 1500 && !crashed && !gameGone()) {
        const cv = await page.evaluate(CANVAS_PROBE).catch(() => null);
        if (cv && cv.canvas && cv.hash !== undefined) {
          if (prevCanvas && (cv.hash !== prevCanvas.hash || cv.len !== prevCanvas.len)) rec.canvasSamples.changed++;
          if (prevCanvas) rec.canvasSamples.pairs++;
          prevCanvas = cv;
        }
        const sc = await page.evaluate(SCORE_PROBE).catch(() => null);
        if (sc) {
          if (prevScores) {
            let diffs = [];
            if (sc.length === prevScores.length) {
              for (let i = 0; i < sc.length; i++) if (sc[i] !== prevScores[i]) diffs.push(prevScores[i] + ' -> ' + sc[i]);
            } else {
              const a = new Set(prevScores), b = new Set(sc);
              for (const v of b) if (!a.has(v)) diffs.push('+ ' + v);
              for (const v of a) if (!b.has(v)) diffs.push('- ' + v);
            }
            if (diffs.length) { rec.scoreLikeChanges++; if (rec.scoreExamples.length < 10) rec.scoreExamples.push(...diffs.slice(0, 3)); }
          }
          prevScores = sc;
        }
        if (!rec.rafAlive) { const raf = await page.evaluate(RAF_PROBE).catch(() => null); if (raf) rec.rafAlive = true; }
        await sleep(2000);
      }
    };

    await Promise.all([inputLoop(), sampleLoop()]);
    rec.inputErrors = inputErrs; rec.crashed = crashed;
    try { const p = new URL(page.url()).pathname; rec.navigatedAway = p !== `/${slug}/` && p !== `/${slug}/index.html` ? p : null; } catch (e) { rec.navigatedAway = page.url(); }
    rec.final = await page.evaluate(`({ scoreTexts: ${SCORE_PROBE}, scoreEls: ${SCORE_EL_PROBE} })`).catch(() => null);
    await page.screenshot({ path: EV(`${slug}/playtest-end.png`) }).catch(() => {});

    rec.canvasChanged = rec.canvasSamples.pairs > 0 ? +(rec.canvasSamples.changed / rec.canvasSamples.pairs).toFixed(2) : 0;
    rec.pageErrors = pageErrors.slice(0, 10);
    rec.verdict = classify(rec);
  } catch (e) {
    rec.error = String(e && e.message || e).slice(0, 300);
    rec.pageErrors = pageErrors.slice(0, 10);
    rec.started = rec.started || false;
    rec.canvasSamples = rec.canvasSamples || { pairs: 0, changed: 0 };
    rec.verdict = classify(rec);
    await page.screenshot({ path: EV(`${slug}/playtest-end.png`) }).catch(() => {});
  } finally {
    page.off('pageerror', onPageErr);
    await context.close().catch(() => {});
  }
  return rec;
}

let PORT = 0;
server.on('listening', async () => {
  PORT = server.address().port;
  const browser = await chromium.launch(); // bundled chromium, headless default; no channel arg
  console.log(`[playtest] server=127.0.0.1:${PORT} games=${queue.length}/${total} dur=${DUR}s conc=${CONC}`);
  const t0 = Date.now();
  let idx = 0, n = done;
  async function worker() {
    while (idx < queue.length) {
      const slug = queue[idx++];
      const rec = await playtestGame(browser, slug);
      results[slug] = rec;
      done++; n++;
      persist();
      const dt = ((Date.now() - t0) / 1000).toFixed(0);
      console.log(`[${n}/${total}] ${slug.padEnd(20)} ${rec.verdict} started=${rec.started ? (rec.startedVia || 'y') : 'NO'} inputs=${rec.inputCount || 0} canvasΔ=${rec.canvasChanged != null ? rec.canvasChanged : '-'} scoreΔ=${rec.scoreLikeChanges != null ? rec.scoreLikeChanges : 0} raf=${rec.rafAlive ? 'y' : 'n'} err=${(rec.pageErrors || []).length}${rec.redirectStub ? ' redirect=' + rec.redirectStub : ''} ${dt}s`);
    }
  }
  await Promise.all(Array.from({ length: Math.min(CONC, queue.length || 1) }, worker));
  persist();
  await browser.close();
  server.close();
  const v = {};
  Object.values(results).forEach(r => v[r.verdict] = (v[r.verdict] || 0) + 1);
  console.log('[playtest] DONE', JSON.stringify(v), ((Date.now() - t0) / 1000 / 60).toFixed(1) + 'min');
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('[playtest] interrupted, persisting');
  try { persist(); } catch (e) {}
  process.exit(130);
});
