import { chromium } from 'playwright';
import fs from 'fs';
import { execSync } from 'child_process';

const GAMES = [
  '2048','abyss-chef','bolt-jam-3d','bounce-bot','brick-breaker',
  'catch-turkey','cloud-sheep','color-sort','dessert-blast','flappy-wings',
  'glyph-quest','idle-clicker','kitty-cafe','memory-match','mo-yu-fayu',
  'ocean-gem-pop','paint-splash','phantom-blade','snake','stacker',
  'sushi-stack','typing-speed','whack-a-mole','wood-block-puzzle','word-puzzle'
];

const BASE = 'file:///home/msdn/gamezipper.com';
const SD = '/tmp/qa-screenshots';
fs.mkdirSync(SD, { recursive: true });

console.log('🎮 Local Game QA Testing...');
console.log(`Testing ${GAMES.length} games`);

async function testGame(name) {
  const url = `${BASE}/${name}/`;
  const result = { url, desktop: {ok:false}, mobile: {ok:false}, errors: [] };
  
  console.log(`\n🔍 Testing ${name}...`);
  
  // First, check if directory exists
  try {
    const stat = fs.statSync(`/home/msdn/gamezipper.com/${name}`);
    if (!stat.isDirectory()) {
      console.log(`  ❌ ${name}: Not a directory`);
      result.desktop.error = 'Not a directory';
      result.mobile.error = 'Not a directory';
      return result;
    }
  } catch(e) {
    console.log(`  ❌ ${name}: Directory not found`);
    result.desktop.error = 'Directory not found';
    result.mobile.error = 'Directory not found';
    return result;
  }
  
  // Try to find index.html
  const indexPath = `/home/msdn/gamezipper.com/${name}/index.html`;
  if (!fs.existsSync(indexPath)) {
    console.log(`  ❌ ${name}: index.html not found`);
    result.desktop.error = 'index.html not found';
    result.mobile.error = 'index.html not found';
    return result;
  }
  
  try {
    // Desktop test
    console.log(`  📱 Desktop test...`);
    const browser = await chromium.launch({ headless: true });
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    const page = await ctx.newPage();
    const errs = [];
    
    page.on('pageerror', e => {
      errs.push(`PAGE_ERROR: ${e.message}`);
      console.log(`    🔴 Page error: ${e.message.substring(0, 100)}`);
    });
    page.on('console', msg => { 
      if (msg.type() === 'error') {
        errs.push(msg.text());
        console.log(`    🔴 Console error: ${msg.text().substring(0, 100)}`);
      }
    });
    
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 10000 });
      await page.waitForTimeout(2000);
      
      // Check for game elements
      const hasGameContent = await page.evaluate(() => {
        const body = document.body;
        const text = body.textContent || '';
        const hasCanvas = body.querySelector('canvas') !== null;
        const hasGameDiv = body.querySelector('[class*="game"], [id*="game"], canvas, div[style*="display"]') !== null;
        return hasCanvas || hasGameDiv || text.length > 100;
      });
      
      if (hasGameContent) {
        result.desktop.ok = true;
        const title = await page.title();
        console.log(`    ✅ Desktop loaded: ${title}`);
        
        await page.screenshot({ path: `${SD}/${name}-desktop.png` });
      } else {
        console.log(`    ❌ Desktop: No game content found`);
        result.desktop.error = 'No game content found';
      }
    } catch (e) {
      result.desktop.error = e.message;
      console.log(`    ❌ Desktop error: ${e.message.substring(0, 100)}`);
    }
    
    result.errors.push(...errs);
    await ctx.close();
    await browser.close();
    
    // Mobile test
    console.log(`  📱 Mobile test...`);
    try {
      const browser = await chromium.launch({ headless: true });
      const ctx = await browser.newContext({
        viewport: { width: 375, height: 812 },
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)'
      });
      const page = await ctx.newPage();
      const errs = [];
      
      page.on('pageerror', e => {
        errs.push(`PAGE_ERROR: ${e.message}`);
        console.log(`    🔴 Mobile page error: ${e.message.substring(0, 100)}`);
      });
      
      try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 10000 });
        await page.waitForTimeout(2000);
        
        const hasGameContent = await page.evaluate(() => {
          const body = document.body;
          const text = body.textContent || '';
          const hasCanvas = body.querySelector('canvas') !== null;
          const hasGameDiv = body.querySelector('[class*="game"], [id*="game"], canvas, div[style*="display"]') !== null;
          return hasCanvas || hasGameDiv || text.length > 100;
        });
        
        if (hasGameContent) {
          result.mobile.ok = true;
          console.log(`    ✅ Mobile loaded successfully`);
          
          await page.screenshot({ path: `${SD}/${name}-mobile.png` });
        } else {
          console.log(`    ❌ Mobile: No game content found`);
          result.mobile.error = 'No game content found';
        }
      } catch (e) {
        result.mobile.error = e.message;
        console.log(`    ❌ Mobile error: ${e.message.substring(0, 100)}`);
      }
      
      result.errors.push(...errs);
      await ctx.close();
      await browser.close();
    } catch(e) {
      console.log(`    ❌ Mobile crash: ${e.message.substring(0, 100)}`);
      result.mobile.error = e.message;
    }
    
  } catch(e) {
    console.log(`  ❌ Overall crash: ${e.message.substring(0, 100)}`);
    result.desktop.error = e.message;
    result.mobile.error = e.message;
  }
  
  // Filter out common ad/tracking errors
  const filteredErrors = result.errors.filter(e => 
    !/monetag|adsbygoogle|tracking|favicon|googletag|Anchor|doubleclick|ads\?|ga\(/i.test(e)
  );
  
  result.errors = [...new Set(filteredErrors)];
  return result;
}

// Main test function
(async () => {
  let gamePass = 0;
  const gameResults = {};
  
  for (const game of GAMES) {
    try {
      const r = await testGame(game);
      gameResults[game] = r;
      const pass = r.desktop.ok && r.mobile.ok && r.errors.length === 0;
      if (pass) { 
        gamePass++; 
        console.log(`\n🟢 ${game}: PASSED`);
      } else { 
        console.log(`\n🔴 ${game}: FAILED - d:${r.desktop.ok} m:${r.mobile.ok} err:${r.errors.length}`);
        if (r.errors.length > 0) {
          r.errors.slice(0,2).forEach(e => console.log(`   ${e.substring(0,100)}`));
        }
      }
    } catch(e) {
      gameResults[game] = { error: e.message.substring(0, 200) };
      console.log(`\n🔴 ${game}: CRASH - ${e.message.substring(0, 100)}`);
    }
  }
  
  const gameFail = GAMES.length - gamePass;
  console.log(`\n📊 Game Summary: ${gamePass}/${GAMES.length} passed (${gameFail} failed)`);
  
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
  
  // Save results
  const results = {
    timestamp: new Date().toISOString(),
    gamePass, gameFail, totalGames: GAMES.length,
    gameResults
  };
  
  fs.writeFileSync('/tmp/qa-game-results.json', JSON.stringify(results, null, 2));
  console.log('\n✅ Results saved to /tmp/qa-game-results.json');
  
  console.log('\n🎮 QA Cycle Complete!');
})();