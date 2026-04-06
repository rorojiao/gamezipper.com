const { chromium } = require('playwright');

async function testGame(name, url, gameType, actions) {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();
  
  const errors = [];
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
  page.on('pageerror', err => errors.push(err.message));

  let result = { name, status: 'unknown', errors: [], details: '' };

  try {
    // Navigate with load instead of networkidle
    await page.goto(url, { waitUntil: 'load', timeout: 20000 });
    await page.waitForTimeout(3000);

    // Try to find start button
    const startSelectors = [
      'button:has-text("Start")', 'button:has-text("Play")', '#start', 
      '[class*="start"]', 'canvas', 'div:has-text("Start")'
    ];
    
    let clickedStart = false;
    for (const sel of startSelectors) {
      try {
        const el = page.locator(sel).first();
        if (await el.isVisible({ timeout: 2000 })) {
          await el.click({ timeout: 3000 });
          clickedStart = true;
          result.details += `Clicked: ${sel}\n`;
          break;
        }
      } catch(e) {}
    }
    
    await page.waitForTimeout(2000);

    // Perform game actions
    if (gameType === 'keyboard') {
      for (const key of actions) {
        await page.keyboard.press(key);
        await page.waitForTimeout(200);
      }
      result.details += `Keyboard actions: ${actions.length}\n`;
    } else {
      for (const pos of actions) {
        await page.mouse.click(pos.x, pos.y);
        await page.waitForTimeout(200);
      }
      result.details += `Click actions: ${actions.length}\n`;
    }

    await page.waitForTimeout(1000);

    // Get game state
    const gameState = await page.evaluate(() => {
      // Check canvas exists
      const canvas = document.querySelector('canvas');
      // Check score elements
      const scoreEl = document.querySelector('#score, .score, [class*="score"]');
      // Check for 2048 tiles
      const tiles = document.querySelectorAll('.tile');
      // Check any visible text
      return {
        hasCanvas: !!canvas,
        scoreText: scoreEl ? scoreEl.textContent.trim().substring(0, 100) : null,
        tileCount: tiles.length,
        bodyHTML: document.body.innerHTML.substring(0, 500)
      };
    });
    
    result.details += `Game state: ${JSON.stringify(gameState)}\n`;

    if (errors.length > 0) {
      result.errors = errors;
      // Filter out resource errors (ads, analytics, etc)
      const jsErrors = errors.filter(e => !e.includes('net::ERR_') && !e.includes('404') && !e.includes('Failed to load resource'));
      if (jsErrors.length > 0) {
        result.status = 'JS_ERROR';
        result.details += `JS Errors: ${jsErrors.join(' | ')}\n`;
      } else {
        result.status = 'PASS';
        result.details += `Resource warnings (ignored): ${errors.length}\n`;
      }
    } else {
      result.status = 'PASS';
    }
  } catch (err) {
    result.status = 'ERROR';
    result.details += `Error: ${err.message}\n`;
  }

  await context.close();
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
    console.log(`\n=== Testing: ${g.name} ===`);
    const result = await testGame(g.name, g.url, g.type, g.actions);
    results.push(result);
    const icon = result.status === 'PASS' ? '✅' : result.status === 'JS_ERROR' ? '🔧' : '❌';
    console.log(`${icon} ${g.name}: ${result.status}`);
    console.log(result.details.substring(0, 300));
  }

  console.log('\n\n========== FINAL SUMMARY ==========');
  for (const r of results) {
    const icon = r.status === 'PASS' ? '✅' : r.status === 'JS_ERROR' ? '🔧' : '❌';
    console.log(`${icon} ${r.name}: ${r.status} ${r.errors.length > 0 ? '⚠️ ' + r.errors.length + ' errors' : ''}`);
  }

  const fs = require('fs');
  fs.writeFileSync('/home/msdn/gamezipper.com/test-results/test-deep.json', JSON.stringify(results, null, 2));
}

main().catch(console.error);
