const { chromium } = require('playwright');

(async () => {
  const results = {};
  
  async function runTest(slug, testFn) {
    console.log(`\n=== Testing: ${slug} ===`);
    let browser;
    try {
      browser = await chromium.launch({ args: ['--no-sandbox','--disable-gpu','--disable-dev-shm-usage'] });
      const ctx = await browser.newContext({ viewport: { width: 375, height: 812 } });
      const page = await ctx.newPage();
      const jsErrors = [];
      page.on('pageerror', e => jsErrors.push(e.message));
      
      await page.goto(`file:///home/msdn/gamezipper.com/${slug}/index.html`, { timeout: 10000 });
      await page.waitForTimeout(1500);
      await page.screenshot({ path: `/tmp/playthrough/${slug}-start.png` });
      
      // Dismiss tutorial - try common patterns
      for (const sel of ['text=/Got it/i', 'text=/Start/i', 'text=/Play/i', 'text=/OK/i', 'text=/Begin/i', 'text=/Let.*Go/i', 'text=/Tap to/i', '.tutorial-overlay', '[class*="tutorial"] button']) {
        try { 
          const el = await page.$(sel);
          if (el && await el.isVisible()) { await el.click(); await page.waitForTimeout(300); break; }
        } catch(e) {}
      }
      await page.waitForTimeout(500);
      
      const result = await testFn(page);
      result.jsErrors = jsErrors;
      result.started = true;
      
      const ls = await page.evaluate(() => Object.keys(localStorage));
      result.localStorageKeys = ls;
      
      results[slug] = result;
      await ctx.close();
    } catch(e) {
      results[slug] = { started: false, error: e.message.substring(0,200) };
    }
    if (browser) await browser.close();
    console.log(`Result: ${JSON.stringify(results[slug]).substring(0,300)}`);
  }

  // 1. 2048
  await runTest('2048', async (page) => {
    const scoreBefore = await page.evaluate(() => document.querySelector('.score-box')?.textContent?.match(/\\d+/)?.[0] || '0');
    const dirs = ['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'];
    for(let i=0;i<100;i++) {
      await page.keyboard.press(dirs[Math.floor(Math.random()*4)]);
      if(i===50) await page.screenshot({ path: '/tmp/playthrough/2048-playing.png' });
      if(i%10===0) await page.waitForTimeout(100);
    }
    await page.waitForTimeout(500);
    const scoreAfter = await page.evaluate(() => document.querySelector('.score-box')?.textContent?.match(/\\d+/)?.[0] || '0');
    const gameOver = await page.evaluate(() => {
      const el = document.querySelector('[class*="game-over"], [class*="gameover"]');
      return el ? { visible: getComputedStyle(el).display !== 'none' && getComputedStyle(el).opacity !== '0', text: el.textContent.substring(0,100) } : null;
    });
    const tryAgainBtn = await page.evaluate(() => {
      const btn = document.querySelector('button');
      return btn ? btn.textContent.trim() : null;
    });
    await page.screenshot({ path: '/tmp/playthrough/2048-end.png' });
    return { scoreBefore, scoreAfter, scoreChanged: parseInt(scoreAfter) > parseInt(scoreBefore), gameOver, tryAgainBtn };
  });

  // 2. Typing Speed
  await runTest('typing-speed', async (page) => {
    // Check for time/mode buttons
    const modeClicked = await page.evaluate(() => {
      const btns = document.querySelectorAll('button, [class*="time"], [class*="mode"]');
      for (const b of btns) { if (b.textContent.includes('30')) { b.click(); return true; } }
      return false;
    });
    await page.waitForTimeout(500);
    
    // Get the text to type
    const targetText = await page.evaluate(() => {
      const el = document.querySelector('[class*="word"], [class*="text"], [class*="current"], [class*="display"]');
      return el ? el.textContent.trim().substring(0,30) : '';
    });
    
    // Type characters to trigger start
    if (targetText) {
      await page.keyboard.type(targetText.substring(0,10), { delay: 80 });
    } else {
      await page.keyboard.type('the quick ', { delay: 80 });
    }
    await page.waitForTimeout(1000);
    await page.screenshot({ path: '/tmp/playthrough/typing-speed-playing.png' });
    
    // Check if timer/game is active
    const midState = await page.evaluate(() => document.body.innerText.substring(0,500));
    
    // Wait some time then check results
    await page.waitForTimeout(5000);
    
    const endState = await page.evaluate(() => {
      const body = document.body.innerText;
      return {
        hasWPM: /wpm/i.test(body),
        hasAccuracy: /accuracy/i.test(body),
        bodySnippet: body.substring(0,300)
      };
    });
    await page.screenshot({ path: '/tmp/playthrough/typing-speed-end.png' });
    return { modeClicked, targetText, endState };
  });

  // 3. Color Sort
  await runTest('color-sort', async (page) => {
    const canvas = await page.$('canvas');
    const before = await page.evaluate(() => document.body.innerText.match(/level[:\s]*(\d+)/i)?.[1] || document.body.innerText.substring(0,200));
    
    if (canvas) {
      const box = await canvas.boundingBox();
      for (let i = 0; i < 15; i++) {
        const x1 = box.x + box.width * (0.15 + (i%4)*0.2);
        const y1 = box.y + box.height * 0.7;
        await page.mouse.click(x1, y1);
        await page.waitForTimeout(300);
        const x2 = box.x + box.width * (0.15 + ((i+1)%4)*0.2);
        await page.mouse.click(x2, y1);
        await page.waitForTimeout(300);
      }
    }
    await page.screenshot({ path: '/tmp/playthrough/color-sort-playing.png' });
    const after = await page.evaluate(() => document.body.innerText.match(/level[:\s]*(\d+)/i)?.[1] || document.body.innerText.substring(0,200));
    await page.screenshot({ path: '/tmp/playthrough/color-sort-end.png' });
    return { hasCanvas: !!canvas, levelBefore: before, levelAfter: after };
  });

  // 4. Word Puzzle
  await runTest('word-puzzle', async (page) => {
    const guesses = ['crane','sloth','jumpy','fixed','wrong','beach'];
    for (const word of guesses) {
      for (const ch of word) await page.keyboard.press(ch.toUpperCase());
      await page.keyboard.press('Enter');
      await page.waitForTimeout(1000);
    }
    await page.screenshot({ path: '/tmp/playthrough/word-puzzle-playing.png' });
    await page.waitForTimeout(1000);
    
    const state = await page.evaluate(() => {
      const body = document.body.innerText;
      const btns = Array.from(document.querySelectorAll('button')).map(b=>b.textContent.trim().substring(0,30));
      return { hasPlayAgain: /play again|new game|retry/i.test(body + btns.join(' ')), buttons: btns, bodySnippet: body.substring(0,300) };
    });
    await page.screenshot({ path: '/tmp/playthrough/word-puzzle-end.png' });
    return state;
  });

  // 5. Dessert Blast
  await runTest('dessert-blast', async (page) => {
    const canvas = await page.$('canvas');
    const before = await page.evaluate(() => {
      const body = document.body.innerText;
      return { score: body.match(/score[:\s]*(\d+)/i)?.[1] || '0', snippet: body.substring(0,200) };
    });
    
    if (canvas) {
      const box = await canvas.boundingBox();
      // Simulate drag and drop on canvas
      for (let i = 0; i < 15; i++) {
        const sx = box.x + Math.random() * box.width;
        const sy = box.y + box.height * 0.8;
        const tx = box.x + Math.random() * box.width;
        const ty = box.y + box.height * 0.3;
        await page.mouse.move(sx, sy);
        await page.mouse.down();
        await page.mouse.move(tx, ty, { steps: 5 });
        await page.mouse.up();
        await page.waitForTimeout(300);
      }
    }
    await page.screenshot({ path: '/tmp/playthrough/dessert-blast-playing.png' });
    const after = await page.evaluate(() => {
      const body = document.body.innerText;
      return { score: body.match(/score[:\s]*(\d+)/i)?.[1] || '0', snippet: body.substring(0,200) };
    });
    await page.screenshot({ path: '/tmp/playthrough/dessert-blast-end.png' });
    return { hasCanvas: !!canvas, before, after };
  });

  // 6. Catch Turkey
  await runTest('catch-turkey', async (page) => {
    const canvas = await page.$('canvas');
    const before = await page.evaluate(() => document.body.innerText.substring(0,200));
    
    if (canvas) {
      const box = await canvas.boundingBox();
      for (let i = 0; i < 30; i++) {
        await page.mouse.click(box.x + Math.random() * box.width, box.y + Math.random() * box.height);
        await page.waitForTimeout(200);
      }
    }
    await page.screenshot({ path: '/tmp/playthrough/catch-turkey-playing.png' });
    const after = await page.evaluate(() => document.body.innerText.substring(0,200));
    await page.screenshot({ path: '/tmp/playthrough/catch-turkey-end.png' });
    return { hasCanvas: !!canvas, before, after };
  });

  // 7. Flappy Wings
  await runTest('flappy-wings', async (page) => {
    const canvas = await page.$('canvas');
    if (canvas) {
      const box = await canvas.boundingBox();
      // Click to start
      await page.mouse.click(box.x + box.width/2, box.y + box.height/2);
      await page.waitForTimeout(500);
    }
    await page.keyboard.press('Space');
    await page.waitForTimeout(300);
    
    for(let i=0;i<50;i++) {
      await page.keyboard.press('Space');
      await page.waitForTimeout(150);
      if(i===25) await page.screenshot({ path: '/tmp/playthrough/flappy-wings-playing.png' });
    }
    await page.waitForTimeout(2000);
    
    const state = await page.evaluate(() => {
      const body = document.body.innerText;
      return { hasGameOver: /game over|try again|restart|tap to/i.test(body), bodySnippet: body.substring(0,300) };
    });
    await page.screenshot({ path: '/tmp/playthrough/flappy-wings-end.png' });
    return { hasCanvas: !!canvas, ...state };
  });

  // 8. Whack-a-Mole
  await runTest('whack-a-mole', async (page) => {
    // Try selecting difficulty
    try { await page.click('text=/easy|medium|start|play/i', {timeout:2000}); } catch(e) {}
    await page.waitForTimeout(500);
    
    const canvas = await page.$('canvas');
    if (canvas) {
      const box = await canvas.boundingBox();
      for (let i = 0; i < 30; i++) {
        await page.mouse.click(box.x + Math.random() * box.width, box.y + Math.random() * box.height);
        await page.waitForTimeout(300);
        if(i===15) await page.screenshot({ path: '/tmp/playthrough/whack-a-mole-playing.png' });
      }
    }
    await page.waitForTimeout(3000);
    const state = await page.evaluate(() => {
      const body = document.body.innerText;
      return { hasResult: /score|result|time|again/i.test(body), bodySnippet: body.substring(0,300) };
    });
    await page.screenshot({ path: '/tmp/playthrough/whack-a-mole-end.png' });
    return { hasCanvas: !!canvas, ...state };
  });

  // 9. Memory Match
  await runTest('memory-match', async (page) => {
    // Click cards
    const cards = await page.$$('.card, [class*="card"], [class*="tile"]');
    const before = await page.evaluate(() => document.body.innerText.substring(0,200));
    
    if (cards.length > 0) {
      for (let i = 0; i < Math.min(cards.length, 20); i++) {
        try { await cards[i % cards.length].click(); await page.waitForTimeout(400); } catch(e) {}
      }
    } else {
      // Canvas-based
      const canvas = await page.$('canvas');
      if (canvas) {
        const box = await canvas.boundingBox();
        for (let i = 0; i < 20; i++) {
          await page.mouse.click(box.x + (i%4+0.5)*(box.width/4), box.y + (Math.floor(i/4)%4+0.5)*(box.height/4));
          await page.waitForTimeout(400);
        }
      }
    }
    await page.screenshot({ path: '/tmp/playthrough/memory-match-playing.png' });
    const after = await page.evaluate(() => document.body.innerText.substring(0,300));
    await page.screenshot({ path: '/tmp/playthrough/memory-match-end.png' });
    return { cardCount: cards.length, before, after };
  });

  // 10. Idle Clicker
  await runTest('idle-clicker', async (page) => {
    const before = await page.evaluate(() => document.body.innerText.substring(0,200));
    
    // Find clickable area
    const clickTarget = await page.$('canvas, [class*="click"], [class*="tap"], [class*="cookie"], [class*="main"]');
    if (clickTarget) {
      const box = await clickTarget.boundingBox();
      for (let i = 0; i < 100; i++) {
        await page.mouse.click(box.x + box.width/2, box.y + box.height/2);
        if(i===50) await page.screenshot({ path: '/tmp/playthrough/idle-clicker-playing.png' });
        if(i%10===0) await page.waitForTimeout(50);
      }
    }
    await page.waitForTimeout(500);
    
    // Try buying upgrade
    try { await page.click('text=/buy|upgrade|purchase/i', {timeout:2000}); } catch(e) {}
    
    const after = await page.evaluate(() => document.body.innerText.substring(0,300));
    await page.screenshot({ path: '/tmp/playthrough/idle-clicker-end.png' });
    return { hasClickTarget: !!clickTarget, before, after };
  });

  // 11. Kitty Café
  await runTest('kitty-cafe', async (page) => {
    const canvas = await page.$('canvas');
    const before = await page.evaluate(() => document.body.innerText.substring(0,200));
    
    if (canvas) {
      const box = await canvas.boundingBox();
      // Click pairs of adjacent cells
      for (let i = 0; i < 15; i++) {
        const x = box.x + (i%4+0.5)*(box.width/5);
        const y = box.y + box.height * 0.5;
        await page.mouse.click(x, y);
        await page.waitForTimeout(200);
        await page.mouse.click(x + box.width/5, y);
        await page.waitForTimeout(300);
      }
    }
    await page.screenshot({ path: '/tmp/playthrough/kitty-cafe-playing.png' });
    const after = await page.evaluate(() => document.body.innerText.substring(0,300));
    await page.screenshot({ path: '/tmp/playthrough/kitty-cafe-end.png' });
    return { hasCanvas: !!canvas, before, after };
  });

  // 12. Paint Splash
  await runTest('paint-splash', async (page) => {
    const canvas = await page.$('canvas');
    const before = await page.evaluate(() => document.body.innerText.substring(0,200));
    
    if (canvas) {
      const box = await canvas.boundingBox();
      // Swipe gestures
      for (let i = 0; i < 15; i++) {
        const sx = box.x + Math.random() * box.width;
        const sy = box.y + Math.random() * box.height;
        await page.mouse.move(sx, sy);
        await page.mouse.down();
        await page.mouse.move(sx + (Math.random()-0.5)*100, sy + (Math.random()-0.5)*100, { steps: 10 });
        await page.mouse.up();
        await page.waitForTimeout(300);
      }
    }
    await page.screenshot({ path: '/tmp/playthrough/paint-splash-playing.png' });
    const after = await page.evaluate(() => document.body.innerText.substring(0,300));
    await page.screenshot({ path: '/tmp/playthrough/paint-splash-end.png' });
    return { hasCanvas: !!canvas, before, after };
  });

  // Output all results
  console.log('\n\n=== FINAL RESULTS ===');
  console.log(JSON.stringify(results, null, 2));
})();
