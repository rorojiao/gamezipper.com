import { chromium } from 'playwright';
import fs from 'fs';

const GAMES = [
  '2048','abyss-chef','bolt-jam-3d','bounce-bot','brick-breaker',
  'catch-turkey','cloud-sheep','color-sort','dessert-blast','flappy-wings',
  'glyph-quest','idle-clicker','kitty-cafe','memory-match','mo-yu-fayu',
  'ocean-gem-pop','paint-splash','phantom-blade','snake','stacker',
  'sushi-stack','typing-speed','whack-a-mole','wood-block-puzzle','word-puzzle'
];

const BASE = 'https://gamezipper.com';
const SCREENSHOT_DIR = '/tmp/qa-screenshots-new';
fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

// Helper: collect console errors from a page
function collectErrors(page) {
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', err => errors.push(`PAGE_ERROR: ${err.message}`));
  return errors;
}

async function testGame(browser, name) {
  const url = `${BASE}/${name}/`;
  const result = { url, desktop: {}, mobile: {}, errors: [] };
  
  // Desktop test
  const desktopCtx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const desktopPage = await desktopCtx.newPage();
  const desktopErrors = collectErrors(desktopPage);
  
  try {
    await desktopPage.goto(url, { waitUntil: 'domcontentloaded', timeout: 10000 });
    await desktopPage.waitForTimeout(2000);
    await desktopPage.screenshot({ path: `${SCREENSHOT_DIR}/${name}-desktop.png` });
    result.desktop.ok = true;
    result.desktop.title = await desktopPage.title();
  } catch (e) {
    result.desktop.ok = false;
    result.desktop.error = e.message;
  }
  result.errors.push(...desktopErrors.filter(e => !e.includes('monetag') && !e.includes('ads') && !e.includes('tracking')));
  await desktopCtx.close();
  
  // Deduplicate errors
  result.errors = [...new Set(result.errors)];
  return result;
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  
  console.log('=== Game Site Testing ===');
  let gamePass = 0, gameFail = 0;
  
  for (const game of GAMES) {
    console.log(`Testing ${game}...`);
    try {
      const r = await testGame(browser, game);
      const pass = r.desktop.ok && r.errors.length === 0;
      if (pass) { 
        gamePass++; 
        console.log('✅');
      } else { 
        gameFail++; 
        console.log(`❌ desktop:${r.desktop.ok} errors:${r.errors.length}`); 
      }
      if (r.errors.length > 0) console.log(`  Errors: ${r.errors.slice(0, 3).join(' | ')}`);
    } catch (e) {
      gameFail++;
      console.log(`❌ Error: ${e.message}`);
    }
  }
  
  console.log(`\nGames: ${gamePass}/${GAMES.length} passed, ${gameFail} failed`);
  
  // Save results
  const results = { games: {} };
  const gameFailures = [];
  let passCount = 0, failCount = 0;
  
  for (const game of GAMES) {
    const r = await testGame(browser, game);
    results.games[game] = r;
    const pass = r.desktop.ok && r.errors.length === 0;
    if (pass) passCount++;
    else {
      failCount++;
      gameFailures.push({ game, desktop: r.desktop.ok, errors: r.errors.length });
    }
  }
  
  results.summary = {
    total: GAMES.length,
    passed: passCount,
    failed: failCount
  };
  
  fs.writeFileSync('/tmp/qa-simple-results.json', JSON.stringify(results, null, 2));
  
  console.log('\n=== SUMMARY ===');
  console.log(`Games: ${passCount}/${GAMES.length} passed, ${failCount} failed`);
  if (gameFailures.length > 0) {
    console.log('Failed games:');
    gameFailures.forEach(f => console.log(`  ${f.game}: desktop=${f.desktop} errors=${f.errors}`));
  }
  
  await browser.close();
}

main().catch(console.error);