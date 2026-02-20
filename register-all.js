const {chromium} = require('playwright');

const EMAIL = 'LetusWinyj@proton.me';
const PASSWORD = 'GameZipper2026!';
const USERNAME = 'LetusWinyj';
const PROXY = 'http://10.10.30.18:7890';

const results = {};

async function tryHN(browser) {
  console.log('\n=== Hacker News ===');
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });
  const page = await context.newPage();
  try {
    await page.goto('https://news.ycombinator.com/login?goto=news', {timeout: 30000});
    
    // Fill the create account form (second form)
    const forms = await page.$$('form');
    const createForm = forms[1];
    await createForm.locator('input[name="acct"]').fill(USERNAME);
    await createForm.locator('input[name="pw"]').fill(PASSWORD);
    await createForm.locator('input[type="submit"]').click();
    await page.waitForTimeout(3000);
    await page.screenshot({path: '/tmp/hn-after-register.png'});
    
    const content = await page.content();
    if (content.includes('login') && !content.includes('logout')) {
      // Check for error
      const text = await page.textContent('body');
      if (text.includes('already exists')) {
        console.log('HN: Username already exists, trying login...');
        await page.goto('https://news.ycombinator.com/login?goto=news');
        const loginForm = (await page.$$('form'))[0];
        await loginForm.locator('input[name="acct"]').fill(USERNAME);
        await loginForm.locator('input[name="pw"]').fill(PASSWORD);
        await loginForm.locator('input[type="submit"]').click();
        await page.waitForTimeout(3000);
      } else {
        console.log('HN: Page text snippet:', text.substring(0, 500));
      }
    }
    
    await page.screenshot({path: '/tmp/hn-loggedin.png'});
    const afterContent = await page.content();
    
    if (afterContent.includes('logout')) {
      console.log('HN: Logged in successfully!');
      results.hn = {status: 'logged_in'};
      
      // Submit link
      await page.goto('https://news.ycombinator.com/submit');
      await page.waitForTimeout(1000);
      await page.fill('input[name="title"]', 'Show HN: GameZipper – 12 Free HTML5 Browser Games (No Ads, No Login)');
      await page.fill('input[name="url"]', 'https://gamezipper.com');
      await page.screenshot({path: '/tmp/hn-submit-before.png'});
      await page.click('input[type="submit"]');
      await page.waitForTimeout(3000);
      await page.screenshot({path: '/tmp/hn-submit-after.png'});
      console.log('HN: Submitted! URL:', page.url());
      results.hn.post = 'submitted';
    } else {
      console.log('HN: Login/register unclear');
      results.hn = {status: 'unclear', url: page.url()};
    }
  } catch(e) {
    console.error('HN error:', e.message);
    results.hn = {status: 'error', error: e.message};
  }
  await context.close();
}

async function tryDevTo(browser) {
  console.log('\n=== Dev.to ===');
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });
  const page = await context.newPage();
  try {
    // Dev.to uses OAuth (GitHub, Twitter, etc.) or email via Forem
    await page.goto('https://dev.to/enter?state=new-user', {timeout: 30000});
    await page.waitForTimeout(2000);
    await page.screenshot({path: '/tmp/devto-register.png'});
    
    // Check if there's email registration
    const content = await page.content();
    if (content.includes('Email') || content.includes('email')) {
      // Try to find email registration link
      const emailLink = await page.$('text=Continue with email');
      if (emailLink) {
        await emailLink.click();
        await page.waitForTimeout(2000);
      }
    }
    
    // Dev.to mainly uses OAuth, check available options
    const buttons = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('a, button')).map(el => el.textContent.trim()).filter(t => t.length > 0 && t.length < 100);
    });
    console.log('Dev.to buttons:', buttons.join(' | '));
    await page.screenshot({path: '/tmp/devto-options.png'});
    
    // Dev.to requires OAuth - likely can't register with just email
    results.devto = {status: 'requires_oauth', note: 'Dev.to requires GitHub/Twitter/Apple/Forem OAuth login'};
    console.log('Dev.to: Requires OAuth, skipping');
  } catch(e) {
    console.error('Dev.to error:', e.message);
    results.devto = {status: 'error', error: e.message};
  }
  await context.close();
}

async function tryReddit(browser) {
  console.log('\n=== Reddit ===');
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });
  const page = await context.newPage();
  try {
    await page.goto('https://www.reddit.com/register/', {timeout: 30000});
    await page.waitForTimeout(3000);
    await page.screenshot({path: '/tmp/reddit-register.png'});
    
    const content = await page.content();
    // Reddit registration is complex with reCAPTCHA
    const hasCaptcha = content.includes('captcha') || content.includes('recaptcha') || content.includes('hCaptcha');
    console.log('Reddit: Has CAPTCHA:', hasCaptcha);
    
    // Try to fill email first
    try {
      await page.fill('input[name="email"], input[type="email"], #regEmail', EMAIL);
      await page.screenshot({path: '/tmp/reddit-email.png'});
      console.log('Reddit: Filled email');
    } catch(e) {
      console.log('Reddit: Could not fill email field');
    }
    
    // Reddit almost certainly has CAPTCHA
    results.reddit = {status: 'captcha_expected', note: 'Reddit registration requires CAPTCHA, cannot automate'};
    console.log('Reddit: Likely needs CAPTCHA, skipping automated registration');
  } catch(e) {
    console.error('Reddit error:', e.message);
    results.reddit = {status: 'error', error: e.message};
  }
  await context.close();
}

async function tryProductHunt(browser) {
  console.log('\n=== Product Hunt ===');
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });
  const page = await context.newPage();
  try {
    await page.goto('https://www.producthunt.com', {timeout: 30000});
    await page.waitForTimeout(2000);
    await page.screenshot({path: '/tmp/ph-home.png'});
    
    // Check for sign up
    const signupLink = await page.$('text=Sign Up') || await page.$('text=Sign up') || await page.$('a[href*="signup"]');
    if (signupLink) {
      await signupLink.click();
      await page.waitForTimeout(2000);
    } else {
      await page.goto('https://www.producthunt.com/login', {timeout: 30000});
      await page.waitForTimeout(2000);
    }
    await page.screenshot({path: '/tmp/ph-signup.png'});
    
    const buttons = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('a, button')).map(el => el.textContent.trim()).filter(t => t.length > 0 && t.length < 100);
    });
    console.log('PH buttons:', buttons.slice(0, 20).join(' | '));
    
    results.producthunt = {status: 'needs_manual', note: 'Product Hunt likely requires OAuth or complex registration'};
  } catch(e) {
    console.error('PH error:', e.message);
    results.producthunt = {status: 'error', error: e.message};
  }
  await context.close();
}

async function tryIndieHackers(browser) {
  console.log('\n=== IndieHackers ===');
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });
  const page = await context.newPage();
  try {
    await page.goto('https://www.indiehackers.com/', {timeout: 30000});
    await page.waitForTimeout(2000);
    await page.screenshot({path: '/tmp/ih-home.png'});
    console.log('IH URL:', page.url(), 'Title:', await page.title());
    
    // IndieHackers was acquired by Stripe and may have changed
    results.indiehackers = {status: 'checked', note: 'Need to verify current registration flow'};
  } catch(e) {
    console.error('IH error:', e.message);
    results.indiehackers = {status: 'error', error: e.message};
  }
  await context.close();
}

(async () => {
  const browser = await chromium.launch({
    headless: true,
    proxy: {server: PROXY}
  });
  
  await tryHN(browser);
  await tryReddit(browser);
  await tryDevTo(browser);
  await tryProductHunt(browser);
  await tryIndieHackers(browser);
  
  await browser.close();
  
  console.log('\n=== RESULTS ===');
  console.log(JSON.stringify(results, null, 2));
})();
