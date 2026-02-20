const {chromium} = require('playwright');
const PROXY = 'http://10.10.30.18:7890';
const PASSWORD = 'GameZipper2026!';
const USERNAME = 'LetusWinyj';
const EMAIL = 'LetusWinyj@proton.me';

(async () => {
  const browser = await chromium.launch({headless: true, proxy: {server: PROXY}});

  // === Dev.to ===
  console.log('=== Dev.to ===');
  let ctx = await browser.newContext({userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'});
  let page = await ctx.newPage();
  try {
    await page.goto('https://dev.to/enter?state=new-user');
    await page.waitForTimeout(2000);
    await page.click('text=Sign up with Email');
    await page.waitForTimeout(2000);
    
    await page.fill('#user_name', 'LetusWin YJ');
    await page.fill('#user_username', USERNAME);
    await page.fill('#user_email', EMAIL);
    await page.fill('#user_password', PASSWORD);
    await page.fill('#user_password_confirmation', PASSWORD);
    await page.screenshot({path: '/tmp/devto-filled.png'});
    
    const hasCaptcha = (await page.content()).includes('recaptcha') || (await page.content()).includes('hCaptcha');
    console.log('Has captcha:', hasCaptcha);
    
    await page.click('input[type="submit"]');
    await page.waitForTimeout(5000);
    console.log('After submit URL:', page.url());
    const bodyText = await page.textContent('body');
    console.log('After submit:', bodyText.substring(0, 500));
    await page.screenshot({path: '/tmp/devto-result.png'});
  } catch(e) {
    console.error('Dev.to:', e.message);
  }
  await ctx.close();

  // === IndieHackers ===
  console.log('\n=== IndieHackers ===');
  ctx = await browser.newContext({userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'});
  page = await ctx.newPage();
  try {
    await page.goto('https://www.indiehackers.com/', {timeout: 15000});
    await page.waitForTimeout(2000);
    console.log('IH title:', await page.title());
    console.log('IH URL:', page.url());
    
    // Try to find sign up
    const links = await page.evaluate(() => Array.from(document.querySelectorAll('a')).map(a => ({href: a.href, text: a.textContent.trim()})).filter(l => l.text.toLowerCase().includes('sign') || l.text.toLowerCase().includes('log') || l.text.toLowerCase().includes('register')));
    console.log('IH auth links:', JSON.stringify(links));
    await page.screenshot({path: '/tmp/ih-home.png'});
  } catch(e) {
    console.error('IH:', e.message);
  }
  await ctx.close();

  await browser.close();
})();
