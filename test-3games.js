const { chromium } = require('playwright');

async function debugGame(name, url) {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await ctx.newPage();

  const jsErrors = [];
  page.on('console', msg => { if (msg.type() === 'error') jsErrors.push(msg.text()); });
  page.on('pageerror', err => jsErrors.push('PAGE ERROR: ' + err.message));

  try {
    await page.goto(url, { waitUntil: 'load', timeout: 15000 });
    await page.waitForTimeout(2000);

    // Check splash/start screen using Playwright locators
    const splashVisible = await page.locator('#splash-screen, #splash, [class*="splash"]').first().isVisible().catch(() => false);
    const startBtnVisible = await page.locator('button').filter({ hasText: /start|play/i }).first().isVisible().catch(() => false);
    console.log(`  Splash visible: ${splashVisible}, Start button visible: ${startBtnVisible}`);

    // Click start using Playwright (handles :has-text properly)
    try {
      const startBtn = page.locator('button').filter({ hasText: /start|play/i }).first();
      if (await startBtn.isVisible({ timeout: 2000 })) {
        await startBtn.click();
        console.log(`  Clicked start button`);
      } else {
        const canvas = page.locator('canvas').first();
        if (await canvas.isVisible({ timeout: 2000 })) {
          await canvas.click();
          console.log(`  Clicked canvas`);
        }
      }
    } catch(e) {
      console.log(`  Start click error: ${e.message}`);
    }

    await page.waitForTimeout(3000);

    // Detailed canvas analysis
    const detailed = await page.evaluate(() => {
      const canvases = document.querySelectorAll('canvas');
      const results = [];
      for (const c of canvases) {
        try {
          const ctx2d = c.getContext('2d');
          if (!ctx2d) { results.push({ id: c.id, className: c.className, width: c.width, height: c.height, error: 'no context' }); continue; }
          const data = ctx2d.getImageData(0, 0, Math.min(c.width, 100), Math.min(c.height, 100));
          let nonTransparent = 0;
          for (let i = 3; i < data.data.length; i += 4) {
            if (data.data[i] > 0) nonTransparent++;
          }
          results.push({
            id: c.id, className: c.className, width: c.width, height: c.height,
            sampleNonTransparent: nonTransparent,
            canvasArea: c.width * c.height
          });
        } catch(e) {
          results.push({ id: c.id, className: c.className, error: e.message });
        }
      }
      
      const scoreEls = document.querySelectorAll('#score, .score');
      const scores = Array.from(scoreEls).map(el => el.textContent.replace(/\s+/g, ' ').trim().substring(0, 80));
      
      return { canvasCount: canvases.length, canvasResults: results, scores };
    });
    
    console.log(`  Canvases: ${detailed.canvasCount}`);
    for (const c of detailed.canvasResults) {
      console.log(`    - ${c.id || 'no-id'} ${c.width}x${c.height} sample=${c.sampleNonTransparent || 0}px error=${c.error || ''}`);
    }
    console.log(`  Scores: ${JSON.stringify(detailed.scores)}`);
    const realErrors = jsErrors.filter(e => !e.includes('ERR_') && !e.includes('Failed to load') && !e.includes('404'));
    console.log(`  Real JS Errors: ${realErrors.join(' | ') || 'none'}`);
    
  } catch (err) {
    console.log(`  ERROR: ${err.message}`);
  }

  await ctx.close();
  await browser.close();
}

async function main() {
  console.log('=== 2048 ===');
  await debugGame('2048', 'https://gamezipper.com/2048/');
  
  console.log('\n=== ball-catch ===');
  await debugGame('ball-catch', 'https://gamezipper.com/ball-catch/');
  
  console.log('\n=== catch-turkey ===');
  await debugGame('catch-turkey', 'https://gamezipper.com/catch-turkey/');
}

main().catch(console.error);
