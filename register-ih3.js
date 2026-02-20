const {chromium} = require('playwright');
const PROXY = 'http://10.10.30.18:7890';
const EMAIL = 'LetusWinyj@proton.me';

(async () => {
  const browser = await chromium.launch({headless: true, proxy: {server: PROXY}});
  const ctx = await browser.newContext({userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'});
  const page = await ctx.newPage();
  
  await page.goto('https://www.indiehackers.com/sign-up');
  await page.waitForTimeout(3000);
  
  // Fill username (placeholder: "e.g. IndieHacker322") - id="ember48" but may vary
  await page.fill('input[placeholder*="IndieHacker"]', 'LetusWinyj');
  // Fill email
  await page.fill('input[name="email"]', EMAIL);
  // Do NOT fill honeypot field
  
  await page.screenshot({path: '/tmp/ih-filled.png'});
  console.log('Filled form');
  
  // Submit
  await page.click('button[type="submit"]');
  await page.waitForTimeout(5000);
  console.log('After submit URL:', page.url());
  const bodyText = await page.textContent('body');
  console.log('Result:', bodyText.substring(0, 500));
  await page.screenshot({path: '/tmp/ih-result.png'});
  
  await browser.close();
})();
