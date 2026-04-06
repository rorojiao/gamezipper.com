const { chromium } = require('playwright');

async function verifyGame(name, url) {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await ctx.newPage();

  try {
    await page.goto(url, { waitUntil: 'load', timeout: 15000 });
    await page.waitForTimeout(2000);

    // Click start
    const startSelectors = ['button:has-text("Start")', 'button:has-text("Play")', 'canvas'];
    let started = false;
    for (const sel of startSelectors) {
      try {
        const el = page.locator(sel).first();
        if (await el.isVisible({ timeout: 2000 })) {
          await el.click();
          started = true;
          break;
        }
      } catch(e) {}
    }

    await page.waitForTimeout(2000);

    // Evaluate game state
    const result = await page.evaluate(() => {
      const canvas = document.querySelector('canvas');
      if (!canvas) return { error: 'No canvas found' };
      
      const ctx = canvas.getContext('2d');
      const canvasData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      // Count non-transparent pixels
      let nonTransparent = 0;
      for (let i = 3; i < canvasData.data.length; i += 4) {
        if (canvasData.data[i] > 0) nonTransparent++;
      }
      
      // Check score elements
      const scoreEls = document.querySelectorAll('#score, .score, [class*="score"]');
      const scores = Array.from(scoreEls).map(el => el.textContent.trim().substring(0, 50));
      
      // Check for active game elements
      const hasScore = scores.length > 0;
      
      return {
        canvasWidth: canvas.width,
        canvasHeight: canvas.height,
        nonTransparentPixels: nonTransparent,
        hasScore,
        scores,
        canvasRendering: nonTransparent > 1000 ? 'ACTIVE' : 'BLANK_OR_MINIMAL'
      };
    });

    await ctx.close();
    await browser.close();
    return { name, ...result };
  } catch (err) {
    await ctx.close();
    await browser.close();
    return { name, error: err.message };
  }
}

async function main() {
  const games = [
    ['2048', 'https://gamezipper.com/2048/'],
    ['alien-whack', 'https://gamezipper.com/alien-whack/'],
    ['ball-catch', 'https://gamezipper.com/ball-catch/'],
    ['bounce-bot', 'https://gamezipper.com/bounce-bot/'],
    ['brick-breaker', 'https://gamezipper.com/brick-breaker/'],
    ['catch-turkey', 'https://gamezipper.com/catch-turkey/'],
    ['cloud-sheep', 'https://gamezipper.com/cloud-sheep/'],
  ];

  for (const [name, url] of games) {
    const result = await verifyGame(name, url);
    const icon = result.canvasRendering === 'ACTIVE' ? '✅' : '❌';
    console.log(`${icon} ${name}: canvas=${result.canvasWidth}x${result.canvasHeight} pixels=${result.nonTransparentPixels} rendering=${result.canvasRendering} scores=${JSON.stringify(result.scores)} error=${result.error || ''}`);
  }
}

main().catch(console.error);
