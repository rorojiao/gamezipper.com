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

async function withBrowser(fn) {
  const browser = await chromium.launch({ headless: true, args: ['--max-old-space-size=256'] });
  try { return await fn(browser); } finally { await browser.close(); }
}

async function testGame(name) {
  const url = `${BASE}/${name}/`;
  const result = { url, desktop: {ok:false}, mobile: {ok:false}, errors: [] };
  
  await withBrowser(async (browser) => {
    // Desktop
    try {
      const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
      const page = await ctx.newPage();
      const errs = [];
      page.on('pageerror', e => errs.push(`PAGE_ERROR: ${e.message}`));
      page.on('console', msg => { if (msg.type() === 'error') errs.push(msg.text()); });
      await page.goto(url, { waitUntil: 'load', timeout: 25000 });
      await page.waitForTimeout(2000);
      await page.screenshot({ path: `${SD}/${name}-desktop.png` }).catch(()=>{});
      result.desktop.ok = true;
      result.desktop.title = await page.title();
      result.errors.push(...filterErrors(errs));
      await ctx.close();
    } catch (e) { result.desktop.error = e.message.substring(0, 200); }
  });
  
  await withBrowser(async (browser) => {
    // Mobile
    try {
      const ctx = await browser.newContext({
        viewport: { width: 375, height: 812 },
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)'
      });
      const page = await ctx.newPage();
      const errs = [];
      page.on('pageerror', e => errs.push(`PAGE_ERROR: ${e.message}`));
      await page.goto(url, { waitUntil: 'load', timeout: 25000 });
      await page.waitForTimeout(2000);
      await page.screenshot({ path: `${SD}/${name}-mobile.png` }).catch(()=>{});
      result.mobile.ok = true;
      result.errors.push(...filterErrors(errs));
      await ctx.close();
    } catch (e) { result.mobile.error = e.message.substring(0, 200); }
  });
  
  result.errors = [...new Set(result.errors)];
  return result;
}

async function testTool(url) {
  return withBrowser(async (browser) => {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    const page = await ctx.newPage();
    const errs = [];
    page.on('pageerror', e => errs.push(e.message));
    const result = { url, ok: false, errors: [] };
    try {
      const resp = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
      result.status = resp?.status() || 0;
      await page.waitForTimeout(1000);
      const bodyLen = await page.evaluate(() => document.body?.innerText?.trim()?.length || 0);
      result.hasContent = bodyLen > 50;
      result.ok = result.status === 200 && result.hasContent;
    } catch (e) { result.error = e.message.substring(0, 150); }
    result.errors = filterErrors(errs);
    await ctx.close();
    return result;
  });
}

(async () => {
  console.log('=== PART 1: Game Site Testing ===');
  let gamePass = 0;
  const gameResults = {};
  
  for (const game of GAMES) {
    process.stdout.write(`${game}: `);
    try {
      const r = await testGame(game);
      gameResults[game] = r;
      const pass = r.desktop.ok && r.mobile.ok && r.errors.length === 0;
      if (pass) { gamePass++; console.log('✅'); }
      else { 
        console.log(`❌ d:${r.desktop.ok} m:${r.mobile.ok} err:${r.errors.length}`);
        r.errors.slice(0,2).forEach(e => console.log(`  ${e.substring(0,150)}`));
        if (r.desktop.error) console.log(`  d_err: ${r.desktop.error.substring(0,120)}`);
      }
    } catch(e) {
      gameResults[game] = { error: e.message.substring(0, 200) };
      console.log(`❌ CRASH: ${e.message.substring(0, 100)}`);
    }
  }
  const gameFail = GAMES.length - gamePass;
  console.log(`\nGames: ${gamePass}/${GAMES.length} pass\n`);
  
  // Part 2: Tools
  console.log('=== PART 2: Tools Site Testing ===');
  const { execSync } = await import('child_process');
  const toolFiles = execSync(
    `cd /home/msdn/gamezipper-tools && find . -maxdepth 3 -name "*.html" ! -name "google*" | sort`
  ).toString().trim().split('\n').filter(Boolean);
  
  let toolPass = 0;
  const toolFailures = [];
  
  for (const file of toolFiles) {
    const url = `${TOOLS_BASE}/${file.replace(/^\.\//, '')}`;
    try {
      const r = await testTool(url);
      if (r.ok && r.errors.length === 0) { toolPass++; process.stdout.write('.'); }
      else { 
        process.stdout.write('X');
        toolFailures.push({ file: file.replace('./',''), s: r.status, c: r.hasContent, 
          e: r.errors?.slice(0,1).join(';') || r.error?.substring(0,80) });
      }
    } catch(e) {
      process.stdout.write('X');
      toolFailures.push({ file: file.replace('./',''), e: e.message.substring(0,80) });
    }
  }
  
  const toolFail = toolFiles.length - toolPass;
  console.log(`\n\nTools: ${toolPass}/${toolFiles.length} pass, ${toolFail} fail`);
  
  if (toolFailures.length > 0 && toolFailures.length <= 30) {
    console.log('\nFailed tools:');
    toolFailures.forEach(f => console.log(`  ${f.file}: ${f.e || `status=${f.s} content=${f.c}`}`));
  } else if (toolFailures.length > 30) {
    console.log(`\n${toolFailures.length} tool failures (showing first 20):`);
    toolFailures.slice(0,20).forEach(f => console.log(`  ${f.file}: ${f.e || `status=${f.s} content=${f.c}`}`));
  }
  
  // Save
  fs.writeFileSync('/tmp/qa-results.json', JSON.stringify({ gameResults, gamePass, gameFail, toolPass, toolFail: toolFiles.length - toolPass, toolTotal: toolFiles.length, toolFailures }, null, 2));
  
  console.log('\n=== SUMMARY ===');
  console.log(`Games: ${gamePass}/${GAMES.length} passed`);
  console.log(`Tools: ${toolPass}/${toolFiles.length} passed`);
  
  // Game error summary
  const gFails = Object.entries(gameResults).filter(([_, r]) => !r.desktop?.ok || !r.mobile?.ok || r.errors?.length > 0);
  if (gFails.length > 0) {
    console.log('\nGame issues:');
    gFails.forEach(([n, r]) => {
      const parts = [];
      if (!r.desktop?.ok) parts.push(`desktop:FAIL`);
      if (!r.mobile?.ok) parts.push(`mobile:FAIL`);
      r.errors?.forEach(e => parts.push(e.substring(0,80)));
      console.log(`  ${n}: ${parts.join(' | ')}`);
    });
  }
})();
