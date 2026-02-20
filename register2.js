const {chromium} = require('playwright');
const PROXY = 'http://10.10.30.18:7890';
const PASSWORD = 'GameZipper2026!';
const USERNAME = 'LetusWinyj';
const EMAIL = 'LetusWinyj@proton.me';

(async () => {
  const browser = await chromium.launch({headless: true, proxy: {server: PROXY}});
  
  // === HN ===
  console.log('=== HN Registration ===');
  let ctx = await browser.newContext({userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'});
  let page = await ctx.newPage();
  try {
    await page.goto('https://news.ycombinator.com/login?goto=news');
    // Use the second form for create account
    const acctInputs = await page.$$('input[name="acct"]');
    const pwInputs = await page.$$('input[name="pw"]');
    // Second set is create account
    await acctInputs[1].fill(USERNAME);
    await pwInputs[1].fill(PASSWORD);
    // Click the second submit button
    const submits = await page.$$('input[type="submit"]');
    await submits[1].click();
    await page.waitForTimeout(3000);
    const bodyText = await page.textContent('body');
    console.log('HN after register:', bodyText.substring(0, 300));
    await page.screenshot({path: '/tmp/hn-result.png'});
    
    if (bodyText.includes('logout') || page.url().includes('news')) {
      console.log('HN: Registration/login successful!');
      
      // Now submit a link
      await page.goto('https://news.ycombinator.com/submit');
      await page.waitForTimeout(1000);
      await page.fill('input[name="title"]', 'Show HN: GameZipper – 12 Free HTML5 Browser Games (No Ads, No Login)');
      await page.fill('input[name="url"]', 'https://gamezipper.com');
      const submitBtn = await page.$('input[type="submit"]');
      await submitBtn.click();
      await page.waitForTimeout(3000);
      console.log('HN submit result URL:', page.url());
      const postBody = await page.textContent('body');
      console.log('HN submit page:', postBody.substring(0, 300));
      await page.screenshot({path: '/tmp/hn-submitted.png'});
    }
  } catch(e) {
    console.error('HN:', e.message);
  }
  await ctx.close();

  // === Dev.to email signup ===
  console.log('\n=== Dev.to Email Signup ===');
  ctx = await browser.newContext({userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'});
  page = await ctx.newPage();
  try {
    await page.goto('https://dev.to/enter?state=new-user');
    await page.waitForTimeout(2000);
    // Click "Sign up with Email"
    await page.click('text=Sign up with Email');
    await page.waitForTimeout(2000);
    await page.screenshot({path: '/tmp/devto-email-form.png'});
    
    // Fill the email registration form
    const inputs = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('input')).map(i => ({name: i.name, id: i.id, type: i.type, placeholder: i.placeholder}));
    });
    console.log('Dev.to inputs:', JSON.stringify(inputs));
    
    // Try filling fields
    try { await page.fill('#new_user_name', USERNAME); } catch(e) {}
    try { await page.fill('#new_user_username', USERNAME); } catch(e) {}
    try { await page.fill('#new_user_email', EMAIL); } catch(e) {}
    try { await page.fill('#new_user_password', PASSWORD); } catch(e) {}
    try { await page.fill('#new_user_password_confirmation', PASSWORD); } catch(e) {}
    // Also try generic selectors
    try { await page.fill('input[name="user[name]"]', USERNAME); } catch(e) {}
    try { await page.fill('input[name="user[username]"]', USERNAME); } catch(e) {}
    try { await page.fill('input[name="user[email]"]', EMAIL); } catch(e) {}
    try { await page.fill('input[name="user[password]"]', PASSWORD); } catch(e) {}
    try { await page.fill('input[name="user[password_confirmation]"]', PASSWORD); } catch(e) {}
    
    await page.screenshot({path: '/tmp/devto-filled.png'});
    
    // Check for captcha
    const hasCaptcha = (await page.content()).includes('captcha') || (await page.content()).includes('recaptcha') || (await page.content()).includes('hCaptcha');
    console.log('Dev.to has captcha:', hasCaptcha);
    
    if (!hasCaptcha) {
      // Try submit
      const submitBtn = await page.$('input[type="submit"], button[type="submit"]');
      if (submitBtn) {
        const btnText = await submitBtn.textContent();
        console.log('Dev.to submit button:', btnText);
        await submitBtn.click();
        await page.waitForTimeout(5000);
        console.log('Dev.to after submit URL:', page.url());
        await page.screenshot({path: '/tmp/devto-after-submit.png'});
      }
    } else {
      console.log('Dev.to: Has CAPTCHA, cannot proceed');
    }
  } catch(e) {
    console.error('Dev.to:', e.message);
  }
  await ctx.close();

  // === IndieHackers ===
  console.log('\n=== IndieHackers ===');
  ctx = await browser.newContext({userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'});
  page = await ctx.newPage();
  try {
    await page.goto('https://www.indiehackers.com/sign-up');
    await page.waitForTimeout(3000);
    await page.screenshot({path: '/tmp/ih-signup.png'});
    const content = await page.content();
    const buttons = await page.evaluate(() => Array.from(document.querySelectorAll('a, button, input[type="submit"]')).map(el => el.textContent?.trim()).filter(t => t && t.length < 100));
    console.log('IH signup buttons:', buttons.join(' | '));
    console.log('IH URL:', page.url());
  } catch(e) {
    console.error('IH:', e.message);
  }
  await ctx.close();

  await browser.close();
})();
