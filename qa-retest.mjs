import { chromium } from 'playwright';

const PROBLEMATIC = ['2048','color-sort','wood-block-puzzle','idle-clicker','mo-yu-fayu','catch-turkey','dessert-blast','glyph-quest','flappy-wings','typing-speed','phantom-blade','ocean-gem-pop','paint-splash','word-puzzle','abyss-chef'];

const BASE = 'http://localhost:8765';
const { execSync } = await import('child_process');
execSync('mkdir -p /tmp/qa-screenshots2');

async function withBrowser(fn) {
  const browser = await chromium.launch({ headless: true, args: ['--max-old-space-size=256'] });
  try { return await fn(browser); } finally { await browser.close(); }
}

function filterErrors(errors) {
  return [...new Set(errors.filter(e => 
    !/monetag|adsbygoogle|tracking|favicon|googletag|Anchor|doubleclick|ads\?|ga\(/i.test(e)
  ))];
}

async function testGame(name) {
  const url = `${BASE}/${name}/`;
  const result = { url, desktop: {ok:false}, mobile: {ok:false}, errors: [] };
  
  await withBrowser(async (browser) => {
    try {
      const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
      const page = await ctx.newPage();
      const errs = [];
      page.on('pageerror', e => errs.push(`PAGE_ERROR: ${e.message}`));
      page.on('console', msg => { if (msg.type() === 'error') errs.push(msg.text()); });
      await page.goto(url, { waitUntil: 'load', timeout: 25000 });
      await page.waitForTimeout(2000);
      await page.screenshot({ path: `/tmp/qa-screenshots2/${name}-desktop.png` }).catch(()=>{});
      result.desktop.ok = true;
      result.errors.push(...filterErrors(errs));
      await ctx.close();
    } catch (e) { result.desktop.error = e.message.substring(0, 200); }
  });
  
  await withBrowser(async (browser) => {
    try {
      const ctx = await browser.newContext({ viewport: { width: 375, height: 812 } });
      const page = await ctx.newPage();
      const errs = [];
      page.on('pageerror', e => errs.push(`PAGE_ERROR: ${e.message}`));
      await page.goto(url, { waitUntil: 'load', timeout: 25000 });
      await page.waitForTimeout(2000);
      await page.screenshot({ path: `/tmp/qa-screenshots2/${name}-mobile.png` }).catch(()=>{});
      result.mobile.ok = true;
      result.errors.push(...filterErrors(errs));
      await ctx.close();
    } catch (e) { result.mobile.error = e.message.substring(0, 200); }
  });
  
  result.errors = [...new Set(result.errors)];
  return result;
}

console.log('Re-testing problematic games after fixes...');
let pass = 0, fail = 0;
for (const game of PROBLEMATIC) {
  process.stdout.write(`${game}: `);
  try {
    const r = await testGame(game);
    const ok = r.desktop.ok && r.mobile.ok && r.errors.length === 0;
    if (ok) { pass++; console.log('✅'); }
    else {
      fail++;
      console.log(`❌ d:${r.desktop.ok} m:${r.mobile.ok} err:${r.errors.length}`);
      r.errors.slice(0,2).forEach(e => console.log(`  ${e.substring(0,150)}`));
    }
  } catch(e) { fail++; console.log(`❌ CRASH: ${e.message.substring(0,80)}`); }
}
console.log(`\nRe-test: ${pass}/${PROBLEMATIC.length} pass`);
