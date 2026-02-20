const {chromium} = require('playwright');
const PROXY = 'http://10.10.30.18:7890';
const PASSWORD = 'GameZipper2026!';
const EMAIL = 'LetusWinyj@proton.me';

(async () => {
  const browser = await chromium.launch({headless: true, proxy: {server: PROXY}});
  const ctx = await browser.newContext({userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'});
  const page = await ctx.newPage();
  
  // Try IndieHackers sign up page directly
  console.log('=== IndieHackers ===');
  await page.goto('https://www.indiehackers.com/');
  await page.waitForTimeout(2000);
  
  // Look for sign in/up buttons
  const allButtons = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('a, button')).slice(0, 50).map(el => ({
      tag: el.tagName,
      text: el.textContent?.trim().substring(0, 80),
      href: el.href || '',
      class: el.className?.substring(0, 50)
    }));
  });
  console.log(JSON.stringify(allButtons, null, 2));
  
  // Try clicking sign in / sign up
  try {
    const signBtn = await page.$('text=Sign up') || await page.$('text=Sign Up') || await page.$('text=Log in') || await page.$('text=Log In') || await page.$('text=Sign in');
    if (signBtn) {
      console.log('Found auth button');
      await signBtn.click();
      await page.waitForTimeout(3000);
      await page.screenshot({path: '/tmp/ih-auth.png'});
      console.log('URL after click:', page.url());
      
      const inputs = await page.evaluate(() => Array.from(document.querySelectorAll('input')).map(i => ({name: i.name, type: i.type, placeholder: i.placeholder})));
      console.log('Inputs:', JSON.stringify(inputs));
    } else {
      console.log('No auth button found');
    }
  } catch(e) {
    console.log('Error:', e.message);
  }
  
  await page.screenshot({path: '/tmp/ih-final.png'});
  await browser.close();
})();
