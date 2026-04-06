const { chromium } = require('playwright');

async function screenshot(name, url) {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await ctx.newPage();
  try {
    await page.goto(url, { waitUntil: 'load', timeout: 15000 });
    await page.waitForTimeout(2000);
    
    // Click start
    const startSelectors = ['button:has-text("Start")', 'button:has-text("Play")', 'canvas'];
    for (const sel of startSelectors) {
      try {
        const el = page.locator(sel).first();
        if (await el.isVisible({ timeout: 2000 })) {
          await el.click();
          break;
        }
      } catch(e) {}
    }
    await page.waitForTimeout(1500);
    
    await page.screenshot({ path: `/home/msdn/gamezipper.com/test-results/${name}-screenshot.png`, fullPage: false });
    console.log(`Screenshot saved: ${name}-screenshot.png`);
  } finally {
    await ctx.close();
    await browser.close();
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
    try {
      await screenshot(name, url);
    } catch (e) {
      console.log(`Error with ${name}: ${e.message}`);
    }
  }
}

main().catch(console.error);
