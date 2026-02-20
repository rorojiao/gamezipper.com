const {chromium} = require('playwright');
(async () => {
  const browser = await chromium.launch({headless: true});
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });
  const page = await context.newPage();
  
  try {
    // Hacker News registration
    console.log('=== Hacker News Registration ===');
    await page.goto('https://news.ycombinator.com/login?goto=news', {timeout: 30000});
    await page.screenshot({path: '/tmp/hn-before.png'});
    
    // Fill create account form
    const inputs = await page.$$('input');
    console.log('Found inputs:', inputs.length);
    const html = await page.content();
    // Find the create account section
    const createSection = html.includes('create account');
    console.log('Has create account section:', createSection);
    
    // HN has two forms - login and create account
    // The create account fields are the second set
    await page.screenshot({path: '/tmp/hn-page.png', fullPage: true});
    console.log(await page.title());
    
    // Print all form elements
    const formInfo = await page.evaluate(() => {
      const forms = document.querySelectorAll('form');
      return Array.from(forms).map((f, i) => ({
        index: i,
        action: f.action,
        inputs: Array.from(f.querySelectorAll('input')).map(inp => ({name: inp.name, type: inp.type}))
      }));
    });
    console.log(JSON.stringify(formInfo, null, 2));
    
  } catch(e) {
    console.error('Error:', e.message);
  }
  await browser.close();
})();
