import { chromium } from 'playwright';
import fs from 'fs';

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

console.log('🔍 Debugging JavaScript errors...');

async function debugGame(name) {
  const url = `${BASE}/${name}/`;
  console.log(`\n🔧 Debugging ${name}...`);
  
  try {
    const browser = await chromium.launch({ headless: true });
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    const page = await ctx.newPage();
    
    // Capture all errors and console messages
    const errors = [];
    const consoleMessages = [];
    
    page.on('pageerror', e => {
      errors.push({
        type: 'pageerror',
        message: e.message,
        stack: e.stack,
        location: e.location?.href
      });
      console.log(`  🔴 Page Error: ${e.message.substring(0, 100)}`);
    });
    
    page.on('console', msg => {
      const msgData = {
        type: msg.type(),
        text: msg.text(),
        location: msg.location()?.href
      };
      consoleMessages.push(msgData);
      
      if (msg.type() === 'error') {
        console.log(`  🔴 Console Error: ${msg.text().substring(0, 100)}`);
      }
    });
    
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 10000 });
      await page.waitForTimeout(3000);
      
      // Check for specific error patterns
      const errorPatterns = ['start is not defined', 'onHasParentDirectory is not defined', 'addRow is not defined'];
      
      const foundErrors = errors.filter(e => 
        errorPatterns.some(pattern => e.message.includes(pattern))
      );
      
      if (foundErrors.length > 0) {
        console.log(`  ❌ Found target errors:`);
        foundErrors.forEach(error => {
          console.log(`    - ${error.message}`);
          if (error.location) {
            console.log(`      Location: ${error.location}`);
          }
        });
        
        // Check what scripts are loaded
        const scripts = await page.evaluate(() => {
          return Array.from(document.querySelectorAll('script')).map(script => ({
            src: script.src,
            content: script.textContent?.substring(0, 100) || '',
            loaded: script.complete
          }));
        });
        
        console.log(`  📝 Scripts loaded:`);
        scripts.forEach(script => {
          console.log(`    ${script.src ? script.src : 'inline'} ${script.loaded ? '(loaded)' : '(loading...)'} ${script.content ? '- ' + script.content.substring(0, 50) + '...' : ''}`);
        });
        
        // Check for global variables
        const globals = await page.evaluate(() => {
          return {
            windowStart: typeof window.start !== 'undefined',
            windowOnHasParentDirectory: typeof window.onHasParentDirectory !== 'undefined',
            windowAddRow: typeof window.addRow !== 'undefined'
          };
        });
        
        console.log(`  🌐 Global variables:`);
        Object.entries(globals).forEach(([key, value]) => {
          console.log(`    ${key}: ${value ? 'exists' : 'missing'}`);
        });
      } else {
        console.log(`  ✅ No target errors found`);
      }
      
      await ctx.close();
      await browser.close();
      
      return { 
        name, 
        errors: foundErrors.length, 
        totalErrors: errors.length,
        scriptsLoaded: scripts.length,
        globals
      };
      
    } catch (e) {
      console.log(`  ❌ Navigation error: ${e.message.substring(0, 100)}`);
      await ctx.close();
      await browser.close();
      return { name, error: e.message };
    }
  } catch (e) {
    console.log(`  ❌ Browser error: ${e.message.substring(0, 100)}`);
    return { name, error: e.message };
  }
}

// Test just the first few games to understand the pattern
async function main() {
  const testGames = GAMES.slice(0, 5); // Test first 5 games
  const results = [];
  
  for (const game of testGames) {
    const result = await debugGame(game);
    results.push(result);
  }
  
  console.log('\n📊 Summary:');
  results.forEach(result => {
    if (result.errors > 0) {
      console.log(`❌ ${result.name}: ${result.errors} target errors`);
    } else {
      console.log(`✅ ${result.name}: No target errors`);
    }
  });
}

main().catch(console.error);