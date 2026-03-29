import { chromium } from 'playwright';
import { writeFileSync } from 'fs';

const GAME_URLS = [
  '2048', 'abyss-chef', 'bolt-jam-3d', 'bounce-bot', 'brick-breaker',
  'catch-turkey', 'cloud-sheep', 'color-sort', 'dessert-blast', 'flappy-wings',
  'glyph-quest', 'idle-clicker', 'kitty-cafe', 'memory-match', 'mo-yu-fayu',
  'ocean-gem-pop', 'paint-splash', 'phantom-blade', 'snake', 'stacker',
  'sushi-stack', 'typing-speed', 'whack-a-mole', 'wood-block-puzzle', 'word-puzzle'
].map(g => `https://gamezipper.com/${g}/`);

// Get tool URLs
const toolResp = await fetch('https://tools.gamezipper.com/');
const toolHtml = await toolResp.text();
// Parse tool links
const toolLinks = [...toolHtml.matchAll(/href="\.\/([^"]+\/[^"]+\.html)"/g)].map(m => `https://tools.gamezipper.com/${m[1]}`);
// Also check category pages
const categoryLinks = [...toolHtml.matchAll(/href="\.\/([^"]+\/)"/g)].map(m => `https://tools.gamezipper.com/${m[1]}`);

// Fetch category pages for more tools
for (const catUrl of categoryLinks) {
  try {
    const resp = await fetch(catUrl);
    const html = await resp.text();
    const links = [...html.matchAll(/href="\.\/([^"]+\.html)"/g)].map(m => `https://tools.gamezipper.com/${catUrl.split('/').filter(Boolean).pop()}/${m[1]}`);
    toolLinks.push(...links);
  } catch(e) {}
}

const uniqueToolUrls = [...new Set(toolLinks)];

console.log(`Found ${GAME_URLS.length} games, ${uniqueToolUrls.length} tools`);

const results = [];
let errors = 0;

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });

async function testPage(url, label) {
  const page = await ctx.newPage();
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  const pageErrors = [];
  page.on('pageerror', err => pageErrors.push(err.message));
  
  try {
    const resp = await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    const status = resp?.status() || 0;
    await page.waitForTimeout(1000);
    
    // Check for basic issues
    const issues = [];
    if (status >= 400) issues.push(`HTTP ${status}`);
    if (consoleErrors.length > 0) issues.push(`Console errors: ${consoleErrors.length}`);
    if (pageErrors.length > 0) issues.push(`Page errors: ${pageErrors.length}`);
    
    // Check for blank page
    const bodyText = await page.evaluate(() => document.body?.innerText?.trim()?.length || 0);
    if (bodyText < 10) issues.push('Page appears blank');
    
    // Check for JS errors in game canvas
    const hasCanvas = await page.evaluate(() => !!document.querySelector('canvas'));
    const hasGameContainer = await page.evaluate(() => !!document.querySelector('[id*="game"], [class*="game"], canvas'));
    
    if (issues.length > 0) {
      errors++;
      results.push({ url, label, status: 'FAIL', issues, consoleErrors: consoleErrors.slice(0, 3), pageErrors: pageErrors.slice(0, 2) });
      console.log(`❌ ${label}: ${issues.join(', ')}`);
    } else {
      results.push({ url, label, status: 'PASS', issues: [] });
      process.stdout.write('.');
    }
  } catch (e) {
    errors++;
    results.push({ url, label, status: 'FAIL', issues: [`Timeout/Navigation: ${e.message}`] });
    console.log(`❌ ${label}: ${e.message}`);
  }
  await page.close();
}

// Test games
console.log('\n🎮 Testing games...');
for (const url of GAME_URLS) {
  const name = url.split('/').filter(Boolean).pop();
  await testPage(url, `game:${name}`);
}

// Test tools
console.log(`\n🔧 Testing ${uniqueToolUrls.length} tools...`);
for (const url of uniqueToolUrls) {
  const name = url.split('/').pop().replace('.html', '');
  await testPage(url, `tool:${name}`);
}

await browser.close();

const passed = results.filter(r => r.status === 'PASS').length;
const failed = results.filter(r => r.status === 'FAIL');
const gameResults = results.filter(r => r.label.startsWith('game:'));
const toolResults = results.filter(r => r.label.startsWith('tool:'));
const gamePassed = gameResults.filter(r => r.status === 'PASS').length;
const toolPassed = toolResults.filter(r => r.status === 'PASS').length;

console.log(`\n\n📊 RESULTS: ${passed}/${results.length} passed`);
console.log(`🎮 Games: ${gamePassed}/${gameResults.length}`);
console.log(`🔧 Tools: ${toolPassed}/${toolResults.length}`);

if (failed.length > 0) {
  console.log('\n❌ FAILED:');
  failed.forEach(f => {
    console.log(`  ${f.label}: ${f.issues.join(', ')}`);
    if (f.consoleErrors?.length) console.log(`    Console: ${f.consoleErrors[0]}`);
    if (f.pageErrors?.length) console.log(`    Error: ${f.pageErrors[0]}`);
  });
}

writeFileSync('/tmp/qa-results.json', JSON.stringify(results, null, 2));
console.log('\nResults saved to /tmp/qa-results.json');
