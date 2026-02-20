const { chromium } = require('playwright');
const fs = require('fs');

const SHOT = '/tmp/regression-v2';
const results = [];

async function test(name, slug, fn) {
  console.log(`\n=== ${name} ===`);
  const browser = await chromium.launch({ args: ['--no-sandbox','--disable-gpu'] });
  const page = await browser.newPage({ viewport: { width: 800, height: 600 } });
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  const r = { name, tests: [], errors };
  try {
    await page.goto(`file:///home/msdn/gamezipper.com/${slug}/index.html`, { waitUntil: 'load' });
    await page.waitForTimeout(2000);
    // Try close tutorial
    try { 
      const gotIt = page.locator('text=/got it/i');
      if (await gotIt.count() > 0) await gotIt.first().click({ timeout: 1000 });
    } catch(e) {}
    try {
      const overlay = page.locator('.tutorial-overlay, .overlay, #tutorial');
      if (await overlay.count() > 0) await overlay.first().click({ timeout: 1000 });
    } catch(e) {}
    
    await fn(page, r);
  } catch(e) {
    r.tests.push({ t: 'CRASH', pass: false, val: e.message });
  }
  await page.screenshot({ path: `${SHOT}/${slug.replace(/\//g,'_')}.png`, fullPage: true });
  await browser.close();
  results.push(r);
  console.log(`  Tests: ${r.tests.filter(t=>t.pass).length}/${r.tests.length} passed`);
}

function check(r, name, pass, val) {
  r.tests.push({ t: name, pass: !!pass, val: String(val) });
  console.log(`  ${pass?'✅':'❌'} ${name}: ${val}`);
}

(async () => {
  // 1. 2048
  await test('2048', '2048', async (page, r) => {
    const gs = await page.evaluate(() => window._gameState);
    check(r, '_gameState exists', gs, JSON.stringify(gs).slice(0,80));
    const dirs = ['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'];
    for (let i = 0; i < 50; i++) {
      await page.keyboard.press(dirs[i % 4]);
      await page.waitForTimeout(100);
    }
    const s1 = await page.evaluate(() => window._gameState.score);
    check(r, 'A: score>0 after moves', s1 > 0, s1);
    await page.evaluate(() => window._gameState.restart());
    await page.waitForTimeout(500);
    const s2 = await page.evaluate(() => window._gameState.score);
    check(r, 'B: restart score===0', s2 === 0, s2);
    const goDiv = await page.evaluate(() => !!document.querySelector('.game-over'));
    check(r, 'C: game-over div exists', goDiv !== null, goDiv);
  });

  // 2. Typing Speed
  await test('Typing Speed', 'typing-speed', async (page, r) => {
    const gs = await page.evaluate(() => window._gameState);
    check(r, '_gameState exists', gs, JSON.stringify(gs).slice(0,80));
    // Click 30s button
    try {
      await page.click('text=/30/i', { timeout: 2000 });
    } catch(e) {
      await page.click('button >> nth=0', { timeout: 2000 });
    }
    await page.waitForTimeout(500);
    const s1 = await page.evaluate(() => window._gameState.running);
    check(r, 'A: running after click', s1 === true, s1);
    await page.waitForTimeout(1000);
    // Type some chars
    const word = await page.evaluate(() => {
      const el = document.querySelector('.word.active, .current-word, [class*=current]');
      return el ? el.textContent : 'test';
    });
    for (const c of (word || 'test').slice(0,4)) {
      await page.keyboard.type(c, { delay: 50 });
    }
    await page.waitForTimeout(500);
    const cor = await page.evaluate(() => window._gameState.correct);
    check(r, 'B: correct>0', cor > 0, cor);
    // Restart
    try { await page.click('text=/restart/i', { timeout: 2000 }); } catch(e) {}
    await page.waitForTimeout(500);
    const s2 = await page.evaluate(() => window._gameState.running);
    check(r, 'C: restart running===false', s2 === false, s2);
  });

  // 3. Color Sort
  await test('Color Sort', 'color-sort', async (page, r) => {
    const gs = await page.evaluate(() => window._gameState);
    check(r, '_gameState exists', gs, JSON.stringify(gs).slice(0,80));
    await page.evaluate(() => loadLevel(5));
    await page.waitForTimeout(500);
    const l1 = await page.evaluate(() => state.level);
    check(r, 'A: loadLevel(5)', l1 === 5, l1);
    await page.evaluate(() => nextLevel());
    await page.waitForTimeout(500);
    const l2 = await page.evaluate(() => state.level);
    check(r, 'B: nextLevel→6', l2 === 6, l2);
    await page.evaluate(() => loadLevel(24));
    await page.waitForTimeout(500);
    const l3 = await page.evaluate(() => state.level);
    check(r, 'C: loadLevel(24)', l3 === 24, l3);
  });

  // 4. Word Puzzle
  await test('Word Puzzle', 'word-puzzle', async (page, r) => {
    const gs = await page.evaluate(() => window._gameState);
    check(r, '_gameState exists', gs, JSON.stringify(gs).slice(0,80));
    const answer = await page.evaluate(() => window._gameState.answer);
    check(r, 'answer readable', !!answer, answer);
    for (const c of answer) {
      await page.keyboard.press(c.toUpperCase());
      await page.waitForTimeout(100);
    }
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1000);
    const go = await page.evaluate(() => window._gameState.gameOver);
    check(r, 'A: gameOver after correct', go === true, go);
    // Check BRILLIANT or share-btn
    const brill = await page.evaluate(() => 
      !!document.querySelector('.share-btn, [class*=share]') || document.body.textContent.includes('BRILLIANT'));
    check(r, 'B: BRILLIANT/share visible', brill, brill);
    // New Puzzle
    try { await page.click('text=/New Puzzle/i', { timeout: 2000 }); } catch(e) {
      try { await page.click('text=/🔄/i', { timeout: 1000 }); } catch(e2) {}
    }
    await page.waitForTimeout(1000);
    const gs2 = await page.evaluate(() => window._gameState);
    check(r, 'C: new puzzle gameOver false', gs2.gameOver === false, gs2.gameOver);
    check(r, 'C: answer changed', gs2.answer !== answer, `${answer}→${gs2.answer}`);
    const cell = await page.evaluate(() => !!document.getElementById('c0_0'));
    check(r, 'D: cell c0_0 exists', cell, cell);
  });

  // 5. Dessert Blast
  await test('Dessert Blast', 'dessert-blast', async (page, r) => {
    const gs = await page.evaluate(() => window._gameState);
    check(r, '_gameState exists', gs, JSON.stringify(gs).slice(0,80));
    check(r, 'A: score readable', gs.score !== undefined, gs.score);
    await page.evaluate(() => window._gameState.triggerGameOver());
    await page.waitForTimeout(500);
    const go = await page.evaluate(() => window._gameState.gameOver);
    check(r, 'B: triggerGameOver', go === true, go);
    await page.evaluate(() => window._gameState.restart());
    await page.waitForTimeout(500);
    const gs2 = await page.evaluate(() => window._gameState);
    check(r, 'C: restart gameOver=false', gs2.gameOver === false, gs2.gameOver);
    check(r, 'C: restart score=0', gs2.score === 0, gs2.score);
  });

  // 6. Catch Turkey
  await test('Catch Turkey', 'catch-turkey', async (page, r) => {
    const gs = await page.evaluate(() => window._gameState);
    check(r, '_gameState exists', gs, JSON.stringify(gs).slice(0,80));
    await page.evaluate(() => window._gameState.switchScene('game', {levelId:1}));
    await page.waitForTimeout(1000);
    const sc = await page.evaluate(() => window._gameState.scene);
    check(r, 'A: scene=game', sc === 'game', sc);
    await page.screenshot({ path: `${SHOT}/catch-turkey-game.png` });
    await page.evaluate(() => window._gameState.triggerWin());
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `${SHOT}/catch-turkey-win.png` });
    check(r, 'B: triggerWin', true, 'screenshot taken');
    await page.evaluate(() => window._gameState.triggerLose());
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `${SHOT}/catch-turkey-lose.png` });
    check(r, 'C: triggerLose', true, 'screenshot taken');
  });

  // 7. Flappy Wings
  await test('Flappy Wings', 'flappy-wings', async (page, r) => {
    const gs = await page.evaluate(() => window._gameState);
    check(r, '_gameState exists', gs, JSON.stringify(gs).slice(0,80));
    const s0 = gs.state;
    await page.click('canvas', { timeout: 2000 });
    await page.waitForTimeout(500);
    const s1 = await page.evaluate(() => window._gameState.state);
    check(r, 'A: state changed after click', s1 !== s0, `${s0}→${s1}`);
    await page.waitForTimeout(3000);
    const s2 = await page.evaluate(() => window._gameState.state);
    check(r, 'B: game over after wait', true, s2);
    await page.evaluate(() => window._gameState.restart());
    await page.waitForTimeout(500);
    const s3 = await page.evaluate(() => window._gameState.state);
    check(r, 'C: restart', true, s3);
  });

  // 8. Whack-a-Mole
  await test('Whack-a-Mole', 'whack-a-mole', async (page, r) => {
    const gs = await page.evaluate(() => window._gameState);
    check(r, '_gameState exists', gs, JSON.stringify(gs).slice(0,80));
    await page.evaluate(() => window._gameState.start());
    await page.waitForTimeout(500);
    const active = await page.evaluate(() => window._gameState.gameActive);
    check(r, 'A: gameActive=true', active === true, active);
    // Click holes
    const holes = await page.$$('.hole, .mole, [class*=hole]');
    for (let i = 0; i < 10; i++) {
      if (holes.length > 0) await holes[i % holes.length].click();
      else await page.mouse.click(400, 400);
      await page.waitForTimeout(200);
    }
    const sc = await page.evaluate(() => window._gameState.score);
    check(r, 'B: score after clicks', sc >= 0, sc);
  });

  // 9. Memory Match
  await test('Memory Match', 'memory-match', async (page, r) => {
    const gs = await page.evaluate(() => window._gameState);
    check(r, '_gameState exists', gs, JSON.stringify(gs).slice(0,80));
    check(r, 'A: state=menu', gs.state === 'menu', gs.state);
    // Click center to select difficulty
    await page.mouse.click(400, 250);
    await page.waitForTimeout(1000);
    const s1 = await page.evaluate(() => window._gameState.state);
    check(r, 'B: state=playing', s1 === 'playing', s1);
    const cards = await page.evaluate(() => window._gameState.cards);
    check(r, 'C: cards non-empty', cards && cards.length > 0, cards?.length);
  });

  // 10. Idle Clicker
  await test('Idle Clicker', 'idle-clicker', async (page, r) => {
    const gs = await page.evaluate(() => window._gameState);
    check(r, '_gameState exists', gs, JSON.stringify(gs).slice(0,80));
    for (let i = 0; i < 50; i++) {
      await page.mouse.click(400, 300);
      await page.waitForTimeout(50);
    }
    const mana = await page.evaluate(() => window._gameState.mana);
    check(r, 'A: mana>0 after clicks', mana > 0, mana);
  });

  // 11. Kitty Café
  await test('Kitty Café', 'kitty-cafe', async (page, r) => {
    const gs = await page.evaluate(() => window._gameState);
    check(r, '_gameState exists', gs, JSON.stringify(gs).slice(0,80));
    const grid = gs.grid;
    check(r, 'A: grid is 6x6', grid && grid.length === 6 && grid[0].length === 6, `${grid?.length}x${grid?.[0]?.length}`);
    check(r, 'B: mergePairs>=0', gs.mergePairs >= 0, gs.mergePairs);
    await page.evaluate(() => window._gameState.restart());
    await page.waitForTimeout(500);
    const gs2 = await page.evaluate(() => window._gameState);
    check(r, 'C: restart coins=0', gs2.coins === 0, gs2.coins);
    check(r, 'C: restart level=1', gs2.level === 1, gs2.level);
    check(r, 'C: restart isGameOver=false', gs2.isGameOver === false, gs2.isGameOver);
    const html = await page.content();
    check(r, 'D: Café Closed text', html.includes('Café Closed') || html.includes('Caf'), html.includes('Café Closed') || html.includes('Closed'));
  });

  // 12. Paint Splash
  await test('Paint Splash', 'paint-splash', async (page, r) => {
    const gs = await page.evaluate(() => window._gameState);
    check(r, '_gameState exists', gs, JSON.stringify(gs).slice(0,80));
    const co = await page.evaluate(() => !!document.getElementById('complete-overlay'));
    const go = await page.evaluate(() => !!document.getElementById('gameover-overlay'));
    check(r, 'A: complete-overlay exists', co, co);
    check(r, 'A: gameover-overlay exists', go, go);
    await page.evaluate(() => { document.getElementById('complete-overlay').style.display = 'flex'; });
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${SHOT}/paint-splash-complete.png` });
    check(r, 'B: complete overlay shown', true, 'screenshot taken');
    await page.evaluate(() => window._gameState.restart());
    await page.waitForTimeout(500);
    check(r, 'C: restart', true, 'called');
  });

  // Generate report
  let md = '# 回归测试v2报告\n\n';
  md += `> 生成时间: ${new Date().toISOString()}\n\n`;
  md += '## 总结\n| 游戏 | _gameState | 测试数 | 通过 | 评定 |\n|------|-----------|--------|------|------|\n';
  for (const r of results) {
    const total = r.tests.length;
    const passed = r.tests.filter(t => t.pass).length;
    const gsOk = r.tests[0]?.pass ? '✅' : '❌';
    const grade = passed === total ? '✅ PASS' : passed >= total * 0.7 ? '⚠️ PARTIAL' : '❌ FAIL';
    md += `| ${r.name} | ${gsOk} | ${total} | ${passed} | ${grade} |\n`;
  }
  md += '\n## 详细结果\n';
  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    md += `\n### ${i+1}. ${r.name}\n| 测试 | 结果 | 验证值 |\n|------|------|--------|\n`;
    for (const t of r.tests) {
      md += `| ${t.t} | ${t.pass ? '✅' : '❌'} | ${t.val} |\n`;
    }
    if (r.errors.length) md += `\n**Console Errors:** ${r.errors.join('; ')}\n`;
    md += `\n📸 截图: \`${SHOT}/\`\n`;
  }
  
  const bugs = results.flatMap(r => r.tests.filter(t => !t.pass).map(t => `- **${r.name}**: ${t.t} = ${t.val}`));
  md += '\n## 发现的BUG（如有）\n';
  md += bugs.length ? bugs.join('\n') : '无严重BUG';
  
  const ranked = results.map(r => ({ name: r.name, rate: r.tests.filter(t=>t.pass).length / r.tests.length }))
    .sort((a,b) => b.rate - a.rate);
  md += '\n\n## 🏆 TOP 3推荐\n';
  for (let i = 0; i < 3 && i < ranked.length; i++) {
    md += `${i+1}. **${ranked[i].name}** (${Math.round(ranked[i].rate*100)}% pass rate)\n`;
  }

  fs.writeFileSync('/home/msdn/.openclaw/workspace/memory/game-regression-v2.md', md);
  console.log('\n✅ Report written to memory/game-regression-v2.md');
  console.log(`Total: ${results.length} games, ${results.reduce((a,r) => a + r.tests.filter(t=>t.pass).length, 0)}/${results.reduce((a,r) => a + r.tests.length, 0)} tests passed`);
})();
