const { chromium } = require('playwright');

async function testGame(name, url, type, actions) {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await ctx.newPage();

  const jsErrors = [];
  page.on('console', msg => { if (msg.type() === 'error') jsErrors.push(msg.text()); });
  page.on('pageerror', err => jsErrors.push('PAGE ERROR: ' + err.message));

  let result = { name, status: 'unknown', details: '', errors: [] };

  try {
    await page.goto(url, { waitUntil: 'load', timeout: 20000 });
    await page.waitForTimeout(3000);

    // Dismiss splash by clicking on the splash screen itself (not canvas)
    const splashVisible = await page.locator('#splash-screen, #splash').first().isVisible().catch(() => false);
    if (splashVisible) {
      await page.locator('#splash-screen, #splash').first().click({ force: true });
      result.details += 'Clicked splash to dismiss\n';
    }
    await page.waitForTimeout(1000);

    // Also try keyboard to dismiss splash
    await page.keyboard.press('Space');
    await page.waitForTimeout(500);

    // Now try canvas click
    try {
      const canvas = page.locator('canvas').last();
      if (await canvas.isVisible({ timeout: 2000 })) {
        await canvas.click({ force: true });
        result.details += 'Clicked game canvas\n';
      }
    } catch(e) {}

    await page.waitForTimeout(2000);

    // Perform actions
    if (type === 'keyboard') {
      for (const key of actions) {
        await page.keyboard.press(key);
        await page.waitForTimeout(150);
      }
      result.details += `Keyboard: ${actions.length} presses\n`;
    } else {
      for (const pos of actions) {
        await page.mouse.click(pos.x, pos.y);
        await page.waitForTimeout(150);
      }
      result.details += `Mouse: ${actions.length} clicks\n`;
    }

    await page.waitForTimeout(1500);

    // Evaluate game state
    const state = await page.evaluate(() => {
      const canvases = Array.from(document.querySelectorAll('canvas'));
      const results = [];
      for (const c of canvases) {
        try {
          const ctx2d = c.getContext('2d');
          if (!ctx2d) { results.push({ id: c.id, w: c.width, h: c.height, ctx: false }); continue; }
          const data = ctx2d.getImageData(0, 0, Math.min(c.width, 80), Math.min(c.height, 80));
          let nonTransparent = 0;
          for (let i = 3; i < data.data.length; i += 4) if (data.data[i] > 0) nonTransparent++;
          results.push({ id: c.id, w: c.width, h: c.height, ctx: true, sample: nonTransparent });
        } catch(e) { results.push({ id: c.id, error: e.message.substring(0, 50) }); }
      }
      const scores = Array.from(document.querySelectorAll('#score, .score')).map(el => el.textContent.replace(/\s+/g, ' ').trim().substring(0, 60));
      return { canvases: results, scores };
    });

    result.details += `Canvas count: ${state.canvases.length}\n`;
    for (const c of state.canvases) {
      result.details += `  Canvas ${c.id || '?'}: ${c.w}x${c.h} ctx=${c.ctx} sample=${c.sample || 0}\n`;
    }
    result.details += `Scores: ${state.scores.join(', ') || 'none'}\n`;

    const realErrors = jsErrors.filter(e => !e.includes('ERR_') && !e.includes('Failed to load') && !e.includes('404'));
    if (realErrors.length > 0) {
      result.errors = realErrors;
      result.status = 'JS_ERROR';
      result.details += `JS Errors: ${realErrors.join(' | ')}\n`;
    } else {
      result.status = 'PASS';
    }

  } catch (err) {
    result.status = 'ERROR';
    result.details += `Error: ${err.message}\n`;
  }

  await ctx.close();
  await browser.close();
  return result;
}

async function main() {
  const games = [
    { name: '2048', url: 'https://gamezipper.com/2048/', type: 'keyboard', actions: ['ArrowUp','ArrowLeft','ArrowDown','ArrowRight','ArrowUp','ArrowLeft','ArrowDown','ArrowRight','ArrowUp','ArrowLeft'] },
    { name: 'alien-whack', url: 'https://gamezipper.com/alien-whack/', type: 'click', actions: [{x:200,y:300},{x:400,y:250},{x:300,y:350},{x:150,y:280},{x:450,y:320},{x:250,y:300},{x:350,y:270},{x:200,y:340},{x:400,y:290},{x:300,y:310}] },
    { name: 'ball-catch', url: 'https://gamezipper.com/ball-catch/', type: 'click', actions: [{x:200,y:500},{x:300,y:500},{x:400,y:500},{x:250,y:500},{x:350,y:500},{x:300,y:500},{x:220,y:500},{x:380,y:500},{x:280,y:500},{x:320,y:500}] },
    { name: 'bounce-bot', url: 'https://gamezipper.com/bounce-bot/', type: 'keyboard', actions: ['ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','ArrowUp','ArrowUp','ArrowLeft','ArrowRight','ArrowUp','ArrowDown'] },
    { name: 'brick-breaker', url: 'https://gamezipper.com/brick-breaker/', type: 'click', actions: [{x:200,y:500},{x:400,y:500},{x:300,y:500},{x:500,y:500},{x:150,y:500},{x:350,y:500},{x:250,y:500},{x:450,y:500},{x:320,y:500},{x:180,y:500}] },
    { name: 'catch-turkey', url: 'https://gamezipper.com/catch-turkey/', type: 'click', actions: [{x:150,y:200},{x:300,y:250},{x:200,y:300},{x:400,y:220},{x:250,y:280},{x:350,y:320},{x:180,y:260},{x:420,y:240},{x:280,y:290},{x:320,y:270}] },
    { name: 'cloud-sheep', url: 'https://gamezipper.com/cloud-sheep/', type: 'click', actions: [{x:200,y:300},{x:300,y:250},{x:250,y:350},{x:150,y:280},{x:350,y:300},{x:200,y:320},{x:400,y:270},{x:300,y:340},{x:250,y:260},{x:320,y:300}] }
  ];

  const results = [];
  for (const g of games) {
    console.log(`\n=== ${g.name} ===`);
    const r = await testGame(g.name, g.url, g.type, g.actions);
    results.push(r);
    const icon = r.status === 'PASS' ? '✅' : r.status === 'JS_ERROR' ? '🔧' : '❌';
    console.log(`${icon} ${g.name}: ${r.status}`);
    console.log(r.details);
  }

  console.log('\n========== FINAL SUMMARY ==========');
  for (const r of results) {
    const icon = r.status === 'PASS' ? '✅' : r.status === 'JS_ERROR' ? '🔧' : '❌';
    console.log(`${icon} ${r.name}: ${r.status} ${r.errors.length > 0 ? '| errors: ' + r.errors.length : ''}`);
  }

  const fs = require('fs');
  fs.writeFileSync('/home/msdn/gamezipper.com/test-results/test-final.json', JSON.stringify(results, null, 2));
  console.log('\nResults saved.');
}

main().catch(console.error);
