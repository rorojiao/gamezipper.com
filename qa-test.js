const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const GAMES = [
  '2048','abyss-chef','bolt-jam-3d','bounce-bot','brick-breaker','catch-turkey',
  'cloud-sheep','color-sort','dessert-blast','flappy-wings','glyph-quest',
  'idle-clicker','kitty-cafe','memory-match','mo-yu-fayu','ocean-gem-pop',
  'paint-splash','phantom-blade','snake','stacker','sushi-stack',
  'typing-speed','whack-a-mole','wood-block-puzzle'
];

const TOOL_PAGES = [];
const toolsBase = '/home/msdn/gamezipper-tools';
const excludeZhs = p => !p.includes('/zh/');
const findHtmlFiles = (dir, base='') => {
  try {
    for (const f of fs.readdirSync(dir)) {
      const full = path.join(dir, f);
      if (f === 'node_modules' || f === '.git') continue;
      if (fs.statSync(full).isDirectory()) {
        findHtmlFiles(full, base + '/' + f);
      } else if (f === 'index.html' || (f.endsWith('.html') && f !== 'googleaf4887b838cad74a.html' && f !== 'ads.txt')) {
        TOOL_PAGES.push(base + '/' + f.replace('.html',''));
      }
    }
  } catch(e) {}
};
findHtmlFiles(toolsBase);
// filter zh and google verify
const TOOL_URLS = TOOL_PAGES.filter(p => !p.startsWith('/zh'));

const SCREENSHOT_DIR = '/tmp/qa-screenshots';
fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

const results = { games: [], tools: [], errors: [] };

async function testPage(browser, url, name, category, opts = {}) {
  const page = await browser.newPage();
  const consoleErrors = [];
  const consoleWarnings = [];
  
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
    if (msg.type() === 'warning') consoleWarnings.push(msg.text());
  });
  page.on('pageerror', err => consoleErrors.push(err.message));

  const result = { name, url, errors: [], status: 'pass' };
  
  try {
    // Desktop test
    await page.setViewportSize({ width: 1280, height: 800 });
    const response = await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    
    if (!response || response.status() >= 400) {
      result.status = 'fail';
      result.errors.push(`HTTP ${response?.status() || 'no response'}`);
    }

    await page.waitForTimeout(2000);

    // Desktop screenshot
    await page.screenshot({ path: `${SCREENSHOT_DIR}/${category}-desktop-${name.replace(/[^a-z0-9]/gi,'-')}.png` });

    // Check mobile overflow
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/${category}-mobile-${name.replace(/[^a-z0-9]/gi,'-')}.png` });
    
    const overflow = await page.evaluate(() => {
      const el = document.documentElement;
      return el.scrollWidth > el.clientWidth;
    });
    if (overflow) {
      result.errors.push('mobile-horizontal-overflow');
      result.status = 'warn';
    }

    // Game-specific checks
    if (category === 'game' && opts.checkCanvas) {
      const hasCanvas = await page.evaluate(() => !!document.querySelector('canvas'));
      if (!hasCanvas) {
        result.errors.push('no-canvas');
        result.status = 'warn';
      }
      
      // Check for play/start buttons
      const buttons = await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button, [role="button"], .play-btn, .start-btn, a.btn'));
        return btns.map(b => ({ text: b.textContent?.trim()?.substring(0,50), visible: b.offsetParent !== null }));
      });
      result.buttons = buttons.length;
    }

    // Check for JS errors (filter noise)
    const realErrors = consoleErrors.filter(e => 
      !e.includes('monetag') && !e.includes('adblock') && !e.includes('favicon') &&
      !e.includes('net::ERR') && !e.includes('ResizeObserver')
    );
    if (realErrors.length > 0) {
      result.jsErrors = realErrors.slice(0, 3);
      if (result.status === 'pass') result.status = 'warn';
    }

  } catch (err) {
    result.status = 'fail';
    result.errors.push(err.message.substring(0, 200));
  }
  
  await page.close();
  return result;
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  
  console.log(`\n🎮 Testing ${GAMES.length} games + ${TOOL_URLS.length} tool pages\n`);
  
  // Test games
  for (const game of GAMES) {
    const url = `https://gamezipper.com/${game}/`;
    const r = await testPage(browser, url, game, 'game', { checkCanvas: true });
    results.games.push(r);
    process.stdout.write(r.status === 'pass' ? '.' : r.status === 'warn' ? 'w' : 'F');
  }
  
  console.log('\n');
  
  // Test tool pages (batch)
  for (const toolPath of TOOL_URLS) {
    const url = `https://tools.gamezipper.com${toolPath === '/index' ? '/' : toolPath.endsWith('/index') ? toolPath.replace('/index','/') : toolPath + '.html'}`;
    // Correct URL construction
    let actualUrl;
    if (toolPath === '/index') {
      actualUrl = 'https://tools.gamezipper.com/';
    } else if (toolPath.endsWith('/index')) {
      actualUrl = `https://tools.gamezipper.com${toolPath.replace('/index','/')}`;
    } else {
      actualUrl = `https://tools.gamezipper.com${toolPath}.html`;
    }
    const r = await testPage(browser, actualUrl, toolPath, 'tool');
    results.tools.push(r);
    process.stdout.write(r.status === 'pass' ? '.' : r.status === 'warn' ? 'w' : 'F');
  }

  await browser.close();
  
  // Summary
  const gamePass = results.games.filter(r => r.status === 'pass').length;
  const gameWarn = results.games.filter(r => r.status === 'warn').length;
  const gameFail = results.games.filter(r => r.status === 'fail').length;
  const toolPass = results.tools.filter(r => r.status === 'pass').length;
  const toolWarn = results.tools.filter(r => r.status === 'warn').length;
  const toolFail = results.tools.filter(r => r.status === 'fail').length;

  console.log(`\n\n=== QA RESULTS ===`);
  console.log(`Games: ${gamePass} pass, ${gameWarn} warn, ${gameFail} fail (total: ${GAMES.length})`);
  console.log(`Tools: ${toolPass} pass, ${toolWarn} warn, ${toolFail} fail (total: ${TOOL_URLS.length})`);
  
  // Show failures and warnings
  const issues = [...results.games, ...results.tools].filter(r => r.status !== 'pass');
  if (issues.length > 0) {
    console.log(`\n--- Issues Found ---`);
    for (const i of issues) {
      console.log(`[${i.status.toUpperCase()}] ${i.name}: ${i.errors.join(', ')}${i.jsErrors ? ' JS: ' + i.jsErrors.join('; ') : ''}`);
    }
  } else {
    console.log('\n✅ All pages passed!');
  }
  
  // Save results
  fs.writeFileSync('/tmp/qa-results.json', JSON.stringify(results, null, 2));
  console.log(`\nScreenshots: ${SCREENSHOT_DIR}/`);
  console.log(`Results: /tmp/qa-results.json`);
})();
