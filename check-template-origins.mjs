import fs from 'fs';
import { chromium } from 'playwright';

const GAMES = [
  '2048','abyss-chef','bolt-jam-3d','bounce-bot','brick-breaker',
  'catch-turkey','cloud-sheep','color-sort','dessert-blast','flappy-wings'
];

const BASE = 'file:///home/msdn/gamezipper.com';

console.log('🔍 Checking for template origins of errors...');

async function detectErrorOrigin(game) {
  const url = `${BASE}/${game}/`;
  console.log(`\n🔍 ${game} - Error Origin Analysis:`);
  
  try {
    const browser = await chromium.launch({ headless: true });
    const ctx = await browser.newContext({ 
      viewport: { width: 1280, height: 720 },
      // Add additional debugging
      ignoreHTTPSErrors: true,
      javaScriptEnabled: true
    });
    const page = ctx.newPage();
    
    const errors = [];
    const scriptLoads = [];
    
    // Track script loading
    page.on('request', request => {
      if (request.resourceType() === 'script') {
        console.log(`  📄 Script request: ${request.url()}`);
        scriptLoads.push({
          url: request.url(),
          method: request.method(),
          headers: request.headers()
        });
      }
    });
    
    page.on('response', response => {
      if (response.url().includes('script')) {
        console.log(`  📥 Script response: ${response.url()} (${response.status()})`);
      }
    });
    
    page.on('pageerror', e => {
      errors.push({
        type: 'pageerror',
        message: e.message,
        location: e.location,
        stack: e.stack
      });
      console.log(`  🔴 Error: ${e.message}`);
    });
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`  🔴 Console: ${msg.text()}`);
        if (msg.location()) {
          console.log(`    Location: ${msg.location().href}:${msg.location().lineNumber}`);
        }
      }
    });
    
    // Try to catch the exact moment errors occur
    await page.goto(url, { 
      waitUntil: 'domcontentloaded', 
      timeout: 8000 
    });
    
    // Wait a bit more for any async errors
    await page.waitForTimeout(3000);
    
    // Check if we can find where these functions are being called
    const errorAnalysis = await page.evaluate(() => {
      const errors = [];
      
      // Check if these functions are being called anywhere in the document
      const scripts = document.querySelectorAll('script');
      for (let script of scripts) {
        const content = script.textContent || '';
        if (content.includes('start(') || content.includes('onHasParentDirectory(') || content.includes('addRow(')) {
          errors.push({
            type: 'inline_script',
            content: content.substring(0, 200) + '...'
          });
        }
      }
      
      // Check if there are any external scripts that might be problematic
      const externalScripts = Array.from(document.querySelectorAll('script[src]'))
        .map(s => s.src)
        .filter(src => src.includes('gamezipper') || src.includes('/js/') || src.includes('/scripts/'));
      
      return {
        inlineScriptErrors: errors,
        externalScripts,
        globalFunctions: Object.keys(window).filter(k => 
          k.includes('start') || k.includes('addRow') || k.includes('onHasParentDirectory')
        )
      };
    });
    
    console.log(`  📊 Error Analysis:`);
    console.log(`    Inline scripts with errors: ${errorAnalysis.inlineScriptErrors.length}`);
    errorAnalysis.inlineScriptErrors.forEach(err => {
      console.log(`      - ${err.type}: ${err.content}`);
    });
    
    console.log(`    External scripts: ${errorAnalysis.externalScripts.join(', ') || 'none'}`);
    console.log(`    Global functions: ${errorAnalysis.globalFunctions.join(', ') || 'none'}`);
    
    await ctx.close();
    await browser.close();
    
    return {
      name: game,
      errors: errors.length,
      scriptLoads: scriptLoads.length,
      errorAnalysis
    };
    
  } catch (e) {
    console.log(`  ❌ Error during analysis: ${e.message}`);
    return { name: game, error: e.message };
  }
}

async function main() {
  const results = [];
  
  for (const game of GAMES) {
    const result = await detectErrorOrigin(game);
    results.push(result);
  }
  
  console.log('\n📊 Overall Results:');
  results.forEach(result => {
    if (result.errors > 0) {
      console.log(`❌ ${result.name}: ${result.errors} errors found`);
      if (result.errorAnalysis?.inlineScriptErrors?.length > 0) {
        console.log(`   Inline script issues detected`);
      }
    } else {
      console.log(`✅ ${result.name}: No errors found`);
    }
  });
}

main().catch(console.error);