const {chromium} = require('playwright');
const PROXY = 'http://10.10.30.18:7890';
const PASSWORD = 'GameZipper2026!';
const EMAIL = 'LetusWinyj@proton.me';

(async () => {
  const browser = await chromium.launch({headless: true, proxy: {server: PROXY}});
  const ctx = await browser.newContext({userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'});
  const page = await ctx.newPage();
  
  await page.goto('https://www.indiehackers.com/sign-up');
  await page.waitForTimeout(3000);
  await page.screenshot({path: '/tmp/ih-signup.png'});
  console.log('URL:', page.url());
  
  const inputs = await page.evaluate(() => Array.from(document.querySelectorAll('input, button[type="submit"]')).map(i => ({tag: i.tagName, name: i.name, type: i.type, placeholder: i.placeholder, id: i.id})));
  console.log('Inputs:', JSON.stringify(inputs, null, 2));
  
  // Check for Google/Twitter OAuth
  const content = await page.content();
  const hasGoogle = content.includes('Google') || content.includes('google');
  const hasTwitter = content.includes('Twitter') || content.includes('twitter');
  console.log('Google:', hasGoogle, 'Twitter:', hasTwitter);
  
  // Try to fill email/password if available
  try {
    await page.fill('input[type="email"]', EMAIL);
    await page.fill('input[type="password"]', PASSWORD);
    await page.screenshot({path: '/tmp/ih-filled.png'});
    console.log('Filled form');
    
    // Submit
    const submitBtn = await page.$('button[type="submit"]') || await page.$('input[type="submit"]');
    if (submitBtn) {
      await submitBtn.click();
      await page.waitForTimeout(5000);
      console.log('After submit URL:', page.url());
      await page.screenshot({path: '/tmp/ih-result.png'});
    }
  } catch(e) {
    console.log('Fill error:', e.message);
  }
  
  await browser.close();
})();
