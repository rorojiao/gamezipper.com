import { chromium } from 'playwright';

const GAMES = [
  '2048','abyss-chef','bolt-jam-3d','bounce-bot','brick-breaker',
  'catch-turkey','cloud-sheep','color-sort','dessert-blast','flappy-wings',
  'glyph-quest','idle-clicker','kitty-cafe','memory-match','mo-yu-fayu',
  'ocean-gem-pop','paint-splash','phantom-blade','snake','stacker',
  'sushi-stack','typing-speed','whack-a-mole','wood-block-puzzle','word-puzzle'
];

const BASE = 'file:///home/msdn/gamezipper.com';

console.log('🕵️ Tracing error sources...');

async function traceErrorSource(game) {
  const url = `${BASE}/${game}/`;
  console.log(`\n🔍 Tracing ${game}...`);
  
  try {
    const browser = await chromium.launch({ headless: true });
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    const page = await ctx.newPage();
    
    // Capture detailed error information
    const errors = [];
    const consoleMessages = [];
    
    page.on('pageerror', e => {
      console.log(`  🔴 Page Error: ${e.message}`);
      if (e.location) {
        console.log(`    Location: ${e.location.href}:${e.location.lineNumber}:${e.location.columnNumber}`);
      }
      errors.push({
        type: 'pageerror',
        message: e.message,
        location: e.location,
        stack: e.stack
      });
    });
    
    page.on('console', msg => {
      const msgData = {
        type: msg.type(),
        text: msg.text(),
        location: msg.location()?.href,
        line: msg.location()?.lineNumber,
        column: msg.location()?.columnNumber
      };
      consoleMessages.push(msgData);
      
      if (msg.type() === 'error') {
        console.log(`  🔴 Console Error: ${msg.text()}`);
        if (msg.location()) {
          console.log(`    Location: ${msg.location().href}:${msg.location().lineNumber}:${msg.location().columnNumber}`);
        }
      }
    });
    
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 10000 });
      await page.waitForTimeout(5000);
      
      // Check what's in the global scope
      const globalVars = await page.evaluate(() => {
        return {
          hasStart: typeof window.start !== 'undefined',
          hasOnHasParentDirectory: typeof window.onHasParentDirectory !== 'undefined',
          hasAddRow: typeof window.addRow !== 'undefined',
          hasGlobalScripts: !!window.GZMonetagSafe,
          globalKeys: Object.keys(window).filter(k => 
            k.includes('start') || k.includes('addRow') || k.includes('onHasParentDirectory')
          )
        };
      });
      
      console.log(`  🌐 Global scope check:`);
      console.log(`    start: ${globalVars.hasStart ? 'exists' : 'missing'}`);
      console.log(`    onHasParentDirectory: ${globalVars.hasOnHasParentDirectory ? 'exists' : 'missing'}`);
      console.log(`    addRow: ${globalVars.hasAddRow ? 'exists' : 'missing'}`);
      console.log(`    GZMonetagSafe: ${globalVars.hasGlobalScripts ? 'exists' : 'missing'}`);
      if (globalVars.globalKeys.length > 0) {
        console.log(`    Related keys: ${globalVars.globalKeys.join(', ')}`);
      }
      
      // Try to capture the exact error source
      const errorSource = await page.evaluate(() => {
        try {
          // Try to execute the problematic calls
          const errors = [];
          
          if (typeof window.start === 'function') {
            try {
              window.start('/test/');
            } catch (e) {
              errors.push('start failed: ' + e.message);
            }
          }
          
          if (typeof window.onHasParentDirectory === 'function') {
            try {
              window.onHasParentDirectory();
            } catch (e) {
              errors.push('onHasParentDirectory failed: ' + e.message);
            }
          }
          
          if (typeof window.addRow === 'function') {
            try {
              window.addRow('test.js', 'test.js', 0, 100, '10KB');
            } catch (e) {
              errors.push('addRow failed: ' + e.message);
            }
          }
          
          return errors;
        } catch (e) {
          return ['Evaluation error: ' + e.message];
        }
      });
      
      if (errorSource.length > 0) {
        console.log(`  🎯 Direct error tests:`);
        errorSource.forEach(error => {
          console.log(`    - ${error}`);
        });
      }
      
      await ctx.close();
      await browser.close();
      
      return { 
        name: game, 
        errors: errors.length,
        consoleErrors: consoleMessages.filter(m => m.type === 'error').length,
        errorSource,
        globalVars
      };
      
    } catch (e) {
      console.log(`  ❌ Navigation error: ${e.message.substring(0, 100)}`);
      await ctx.close();
      await browser.close();
      return { name: game, error: e.message };
    }
  } catch (e) {
    console.log(`  ❌ Browser error: ${e.message.substring(0, 100)}`);
    return { name: game, error: e.message };
  }
}

// Test just a few games to understand the pattern
async function main() {
  const testGames = GAMES.slice(0, 3); // Test first 3 games
  const results = [];
  
  for (const game of testGames) {
    const result = await traceErrorSource(game);
    results.push(result);
  }
  
  console.log('\n📊 Summary:');
  results.forEach(result => {
    if (result.errors > 0 || result.consoleErrors > 0 || result.errorSource?.length > 0) {
      console.log(`❌ ${result.name}: ${result.errors} page errors, ${result.consoleErrors} console errors`);
      if (result.errorSource?.length > 0) {
        console.log(`  Direct test errors: ${result.errorSource.join('; ')}`);
      }
    } else {
      console.log(`✅ ${result.name}: No errors found`);
    }
  });
}

main().catch(console.error);