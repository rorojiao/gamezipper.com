const {chromium} = require('playwright');
const PROXY = 'http://10.10.30.18:7890';
const EMAIL = 'LetusWinyj@proton.me';

(async () => {
  const browser = await chromium.launch({headless: true, proxy: {server: PROXY}});
  const ctx = await browser.newContext({userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'});
  const page = await ctx.newPage();
  
  await page.goto('https://www.indiehackers.com/sign-up');
  await page.waitForTimeout(4000);
  
  // Accept cookies first if present
  try {
    const acceptBtn = await page.$('text=Accept All');
    if (acceptBtn) { await acceptBtn.click(); await page.waitForTimeout(1000); }
  } catch(e) {}
  
  // Fill username
  await page.fill('input[placeholder*="IndieHacker"]', 'LetusWinyj');
  await page.waitForTimeout(500);
  
  // Click the NEXT button (it's inside the signup form)
  await page.click('button:has-text("Next")');
  await page.waitForTimeout(3000);
  await page.screenshot({path: '/tmp/ih-after-next.png'});
  
  // Check what's visible now
  const bodyText = await page.evaluate(() => document.querySelector('.sign-up')?.textContent || document.body.textContent.substring(0, 1000));
  console.log('After next:', bodyText.substring(0, 500));
  
  await browser.close();
})();
