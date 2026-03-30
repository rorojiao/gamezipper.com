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
const TOOLS_BASE = 'https://tools.gamezipper.com';
const SD = '/tmp/qa-screenshots';
fs.mkdirSync(SD, { recursive: true });

function filterErrors(errors) {
  return [...new Set(errors.filter(e => 
    !/monetag|adsbygoogle|tracking|favicon|googletag|Anchor|doubleclick|ads\?|ga\(/i.test(e)
  ))];
}

async function testGame(name) {
  const url = `${BASE}/${name}/`;
  const result = { url, desktop: {ok:false}, mobile: {ok:false}, errors: [] };
  
  console.log(`Testing ${name}...`);
  
  try {
    // Desktop test
    const browser = await chromium.launch({ headless: true });
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    const page = await ctx.newPage();
    const errs = [];
    page.on('pageerror', e => errs.push(`PAGE_ERROR: ${e.message}`));
    page.on('console', msg => { if (msg.type() === 'error') errs.push(msg.text()); });
    
    try {
      await page.goto(url, { waitUntil: 'load', timeout: 15000 });
      await page.waitForTimeout(2000);
      await page.screenshot({ path: `${SD}/${name}-desktop.png` }).catch(()=>{});
      result.desktop.ok = true;
      result.desktop.title = await page.title();
      console.log(`  Desktop: ✅ ${await page.title()}`);
    } catch (e) {
      result.desktop.error = e.message;
      console.log(`  Desktop: ❌ ${e.message.substring(0, 100)}`);
    }
    
    result.errors.push(...filterErrors(errs));
    await ctx.close();
    await browser.close();
  } catch(e) {
    console.log(`  Desktop: ❌ CRASH: ${e.message.substring(0, 100)}`);
  }
  
  // Quick mobile test (simplified)
  try {
    const browser = await chromium.launch({ headless: true });
    const ctx = await browser.newContext({
      viewport: { width: 375, height: 812 },
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)'
    });
    const page = await ctx.newPage();
    const errs = [];
    page.on('pageerror', e => errs.push(`PAGE_ERROR: ${e.message}`));
    
    try {
      await page.goto(url, { waitUntil: 'load', timeout: 15000 });
      await page.waitForTimeout(2000);
      await page.screenshot({ path: `${SD}/${name}-mobile.png` }).catch(()=>{});
      result.mobile.ok = true;
      console.log(`  Mobile: ✅`);
    } catch (e) {
      result.mobile.error = e.message;
      console.log(`  Mobile: ❌ ${e.message.substring(0, 100)}`);
    }
    
    result.errors.push(...filterErrors(errs));
    await ctx.close();
    await browser.close();
  } catch(e) {
    console.log(`  Mobile: ❌ CRASH: ${e.message.substring(0, 100)}`);
  }
  
  result.errors = [...new Set(result.errors)];
  return result;
}

// Main test function
(async () => {
  console.log('🎮 Gamezipper QA Cycle - Starting...');
  console.log(`Testing ${GAMES.length} games`);
  
  let gamePass = 0;
  const gameResults = {};
  
  for (const game of GAMES) {
    try {
      const r = await testGame(game);
      gameResults[game] = r;
      const pass = r.desktop.ok && r.mobile.ok && r.errors.length === 0;
      if (pass) { 
        gamePass++; 
        console.log(`🟢 ${game}: PASSED`);
      } else { 
        console.log(`🔴 ${game}: FAILED - d:${r.desktop.ok} m:${r.mobile.ok} err:${r.errors.length}`);
        if (r.errors.length > 0) {
          r.errors.slice(0,2).forEach(e => console.log(`   ${e.substring(0,100)}`));
        }
      }
    } catch(e) {
      gameResults[game] = { error: e.message.substring(0, 200) };
      console.log(`🔴 ${game}: CRASH - ${e.message.substring(0, 100)}`);
    }
    console.log('---');
  }
  
  const gameFail = GAMES.length - gamePass;
  console.log(`\n📊 Game Summary: ${gamePass}/${GAMES.length} passed (${gameFail} failed)`);
  
  // Save results
  const results = {
    timestamp: new Date().toISOString(),
    gamePass, gameFail, totalGames: GAMES.length,
    gameResults
  };
  
  fs.writeFileSync('/tmp/qa-game-results.json', JSON.stringify(results, null, 2));
  console.log('Results saved to /tmp/qa-game-results.json');
  
  // List failures for analysis
  if (gameFail > 0) {
    console.log('\n🔍 Failed games:');
    Object.entries(gameResults).forEach(([name, result]) => {
      if (!result.desktop?.ok || !result.mobile?.ok || result.errors?.length > 0) {
        const issues = [];
        if (!result.desktop?.ok) issues.push('desktop');
        if (!result.mobile?.ok) issues.push('mobile');
        if (result.errors?.length > 0) issues.push(`${result.errors.length} errors`);
        console.log(`   ${name}: ${issues.join(', ')}`);
      }
    });
  }
})();