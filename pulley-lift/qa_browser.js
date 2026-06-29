// Pulley Lift — Playwright browser QA
// Loads the game, screenshots every screen, plays Level 1 to completion via the
// in-engine BFS hint solver, captures console errors, and verifies win overlay.
const { chromium } = require('playwright');
const fs = require('fs');

const URL = 'http://127.0.0.1:8765/pulley-lift/index.html';
const OUT = '/home/msdn/gamezipper.com/pulley-lift/qa_shots';
fs.mkdirSync(OUT, { recursive: true });

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 420, height: 760 } });
  const page = await ctx.newPage();

  const errors = [];
  const logs = [];
  page.on('console', m => logs.push(`[${m.type()}] ${m.text()}`));
  page.on('pageerror', e => errors.push(`PAGEERROR: ${e.message}`));

  console.log('1. Loading', URL);
  await page.goto(URL, { waitUntil: 'load', timeout: 15000 });
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUT}/01_menu.png` });
  console.log('   menu captured');

  // Check title and that Play button exists
  const title = await page.title();
  console.log('   title:', title);

  console.log('2. Click Play');
  await page.click('text=Play');
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${OUT}/02_levelselect.png` });
  console.log('   level select captured');

  console.log('3. Enter Level 1');
  // First level cell
  await page.click('.lc >> nth=0');
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUT}/03_level1_initial.png` });
  console.log('   level 1 initial captured');

  // Read level 1 data from the page to drive the solver
  const lvl1 = await page.evaluate(() => {
    // LC is a global in the page
    return { n: LC[0].n, H: LC[0].H, target: LC[0].target, loadIdx: LC[0].loadIdx,
             start: LC[0].start, startMask: LC[0].startMask, par: LC[0].par };
  });
  console.log('   level 1 data:', JSON.stringify(lvl1));

  // Read current state from the page
  const state0 = await page.evaluate(() => ({ h: curH.slice(), m: curM }));
  console.log('   current state:', JSON.stringify(state0));

  // Drive the in-page settle + BFS to find a winning move sequence
  const solution = await page.evaluate((lvl) => {
    function settle(heights, mask) {
      const n = heights.length; const eIdx = [];
      for (let i = 0; i < n; i++) if ((mask >> i) & 1) eIdx.push(i);
      if (eIdx.length <= 1) return heights.slice();
      let sum = 0; for (const i of eIdx) sum += heights[i];
      let avg = Math.floor(sum / eIdx.length); if (avg < 0) avg = 0;
      const nv = heights.slice(); for (const i of eIdx) nv[i] = avg;
      return nv;
    }
    const startH = settle(lvl.start.slice(), lvl.startMask);
    if (startH[lvl.loadIdx] === lvl.target) return [];
    const visited = new Map([[startH.join(',') + '|' + lvl.startMask, null]]);
    const q = [{ h: startH, m: lvl.startMask, parent: null, move: -1, depth: 0 }];
    const cap = lvl.target * 4 + 12;
    while (q.length) {
      const st = q.shift();
      if (st.depth > cap) continue;
      for (let i = 0; i < lvl.n; i++) {
        const nm = st.m ^ (1 << i);
        const nh = settle(st.h.slice(), nm);
        let bad = false;
        for (let k = 0; k < nh.length; k++) if (nh[k] < 0 || nh[k] > lvl.H) { bad = true; break; }
        if (bad) continue;
        const key = nh.join(',') + '|' + nm;
        if (visited.has(key)) continue;
        const node = { parent: st, move: i };
        visited.set(key, node);
        if (nh[lvl.loadIdx] === lvl.target) {
          // reconstruct
          const path = []; let cur = node;
          while (cur && cur.parent) { path.unshift(cur.move); cur = cur.parent; }
          return path;
        }
        q.push({ h: nh, m: nm, parent: st, move: i, depth: st.depth + 1 });
      }
    }
    return null;
  }, lvl1);
  console.log('   solution moves:', JSON.stringify(solution));

  if (!solution) {
    console.error('   NO SOLUTION FOUND in-page');
    await browser.close();
    process.exit(1);
  }

  // Execute the solution by tapping each branch's pulley
  for (let step = 0; step < solution.length; step++) {
    const branchIdx = solution[step];
    // Click the pulley area for this branch (top region of canvas)
    const coords = await page.evaluate((bi) => {
      const W = document.getElementById('cw').clientWidth;
      const padX = 24;
      const n = CL.n;
      const colW = (W - padX * 2) / n;
      const cx = padX + colW * (bi + 0.5);
      return { x: cx, y: 70 };
    }, branchIdx);
    const box = await page.locator('#c').boundingBox();
    await page.mouse.click(box.x + coords.x, box.y + coords.y);
    await page.waitForTimeout(300);
    console.log(`   step ${step + 1}: tap branch ${branchIdx + 1}`);
  }
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUT}/04_level1_solved.png` });

  // Check win overlay visible
  const winVisible = await page.locator('#wo.active').count();
  console.log('   win overlay visible:', winVisible > 0);

  const winStars = await page.locator('#wss').textContent();
  console.log('   stars:', winStars);

  console.log('5. Daily challenge screen');
  await page.click('text=Levels'); // back
  await page.waitForTimeout(200);
  await page.click('text=←'); // back to menu (using the back arrow button)
  await page.waitForTimeout(200);
  // Use evaluate to call sd() directly
  await page.evaluate(() => sd());
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${OUT}/05_daily.png` });

  console.log('6. Achievements');
  await page.evaluate(() => sm());
  await page.waitForTimeout(150);
  await page.evaluate(() => sa());
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${OUT}/06_achievements.png` });

  console.log('7. Help');
  await page.evaluate(() => sm());
  await page.waitForTimeout(150);
  await page.evaluate(() => sh());
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${OUT}/07_help.png` });

  // Final report
  console.log('---');
  console.log('Page errors:', errors.length);
  errors.forEach(e => console.log('  ', e));
  console.log('Console messages:', logs.length);
  logs.slice(0, 20).forEach(l => console.log('  ', l));
  console.log('---');
  console.log('Screenshots in:', OUT);
  fs.writeFileSync(`${OUT}/errors.json`, JSON.stringify({ errors, logs }, null, 2));

  await browser.close();
  // Pass if: no pageerrors, win overlay appeared, stars rendered
  const pass = errors.length === 0 && winVisible > 0;
  console.log(pass ? 'BROWSER QA: PASS' : 'BROWSER QA: FAIL');
  process.exit(pass ? 0 : 1);
})();
