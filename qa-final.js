const { chromium } = require('playwright');

const GAMES = [
  '2048','abyss-chef','bolt-jam-3d','bounce-bot','brick-breaker','catch-turkey',
  'cloud-sheep','color-sort','dessert-blast','flappy-wings','glyph-quest',
  'idle-clicker','kitty-cafe','memory-match','mo-yu-fayu','ocean-gem-pop',
  'paint-splash','phantom-blade','snake','stacker','sushi-stack',
  'typing-speed','whack-a-mole','wood-block-puzzle'
];

const RESULTS = [];

async function test(browser, url, name, category) {
  const page = await browser.newPage();
  const errors = [];
  page.on('console', m => { if(m.type()==='error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push(e.message));
  try {
    await page.goto(url, { waitUntil: 'commit', timeout: 10000 });
    await page.waitForTimeout(3000);
    const realErrors = errors.filter(e => 
      !e.includes('monetag') && !e.includes('ad') && !e.includes('favicon') &&
      !e.includes('ResizeObserver') && !e.includes('net::ERR')
    );
    const hasCanvas = await page.evaluate(() => !!document.querySelector('canvas'));
    return { name, status: realErrors.length ? 'warn' : 'pass', errors: realErrors, hasCanvas };
  } catch(e) {
    return { name, status: 'fail', errors: [e.message.substring(0,100)] };
  } finally {
    await page.close();
  }
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  
  // Test key games
  console.log('Testing games...');
  for (const g of GAMES) {
    const r = await test(browser, `https://gamezipper.com/${g}/`, g, 'game');
    RESULTS.push(r);
    process.stdout.write(r.status === 'pass' ? '.' : r.status === 'warn' ? 'W' : 'F');
  }
  
  console.log('\nDone.');
  const pass = RESULTS.filter(r=>r.status==='pass').length;
  const warn = RESULTS.filter(r=>r.status==='warn').length;
  const fail = RESULTS.filter(r=>r.status==='fail').length;
  console.log(`\nPass: ${pass}, Warn: ${warn}, Fail: ${fail}`);
  
  const issues = RESULTS.filter(r=>r.status!=='pass');
  for (const i of issues) {
    console.log(`[${i.status.toUpperCase()}] ${i.name}: ${i.errors.join(' | ')}`);
  }
})();
