const {chromium} = require('playwright');
const PROXY = 'http://10.10.30.18:7890';
const EMAIL = 'LetusWinyj@proton.me';

(async () => {
  const browser = await chromium.launch({headless: true, proxy: {server: PROXY}});
  const ctx = await browser.newContext({userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'});
  const page = await ctx.newPage();
  
  await page.goto('https://www.indiehackers.com/sign-up');
  await page.waitForTimeout(3000);
  
  // Step 1: Username
  await page.fill('input[placeholder*="IndieHacker"]', 'LetusWinyj');
  // Click NEXT button
  await page.click('text=NEXT');
  await page.waitForTimeout(3000);
  await page.screenshot({path: '/tmp/ih-step2.png'});
  console.log('Step 2 URL:', page.url());
  
  // Check what's on screen now
  const inputs = await page.evaluate(() => Array.from(document.querySelectorAll('input:not([type="hidden"]):not([type="checkbox"])')).map(i => ({type: i.type, placeholder: i.placeholder, name: i.name, id: i.id})));
  console.log('Inputs:', JSON.stringify(inputs));
  
  // Fill email if visible
  try {
    await page.fill('input[type="email"]', EMAIL);
    console.log('Filled email');
  } catch(e) {
    console.log('No email field');
  }
  
  // Fill password if visible
  try {
    await page.fill('input[type="password"]', 'GameZipper2026!');
    console.log('Filled password');
  } catch(e) {
    console.log('No password field');
  }
  
  await page.screenshot({path: '/tmp/ih-step2-filled.png'});
  
  // Look for submit/next button
  const buttons = await page.evaluate(() => Array.from(document.querySelectorAll('button, input[type="submit"]')).map(b => b.textContent?.trim()));
  console.log('Buttons:', buttons);
  
  // Click submit/create/next
  try {
    const btn = await page.$('button[type="submit"]') || await page.$('text=CREATE') || await page.$('text=SIGN UP') || await page.$('text=NEXT');
    if (btn) {
      await btn.click();
      await page.waitForTimeout(5000);
      console.log('After submit URL:', page.url());
      await page.screenshot({path: '/tmp/ih-step3.png'});
    }
  } catch(e) {
    console.log('Submit error:', e.message);
  }
  
  await browser.close();
})();
