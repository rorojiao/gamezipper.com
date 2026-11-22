// R1193 verify: x11-arm fakeFP drop + iframe emb tag. Aborts collect POSTs (no BI pollution).
import { chromium } from 'playwright';
const LAN = process.env.LAN_IP; // serve via LAN so R1064 local guard does not fire
const BASE = `http://${LAN}:8793`;
const results = [];
async function run(name, { url, platform, ua, iframeWrap }) {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ ignoreHTTPSErrors: true });
  const page = await ctx.newPage();
  const bodies = [];
  await page.route('**/api/collect*', route => {
    const p = route.request().postData();
    if (p) bodies.push(p);
    return route.abort();
  });
  if (platform !== undefined || ua !== undefined) {
    await page.addInitScript(({ platform, ua }) => {
      if (platform !== null) Object.defineProperty(navigator, 'platform', { get: () => platform });
      // UA override via defineProperty on navigator.userAgent is flaky; use it best-effort
      if (ua !== null) try { Object.defineProperty(navigator, 'userAgent', { get: () => ua }); } catch (e) {}
    }, { platform: platform ?? null, ua: ua ?? null });
  }
  let target = url;
  if (iframeWrap) {
    // build wrapper on the fly via server? simpler: use dataless approach — navigate wrapper from same origin
    target = `${BASE}/__r1193_wrapper.html`;
  }
  await page.goto(target, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3500);
  await browser.close();
  const all = bodies.flatMap(b => { try { return JSON.parse(b); } catch (e) { return []; } });
  const evs = all.map(e => e.e);
  const dEmb = all.filter(e => e.d && e.d.emb === 1).length;
  results.push({ name, collect_posts: bodies.length, events: evs.length, sample: evs.slice(0, 6), emb_tagged: dEmb });
}
const LANu = `http://${LAN}:8793`;
await run('T1 top-level normal (Linux x86_64 platform)', { url: `${LANu}/snake/`, platform: 'Linux x86_64' });
await run('T2 fakeFP armv81 platform + X11 x86_64 UA', { url: `${LANu}/snake/`, platform: 'Linux armv81' });
await run('T3 consistent android (armv8l platform + android UA)', { url: `${LANu}/snake/`, platform: 'Linux armv8l', ua: 'Mozilla/5.0 (Linux; Android 11; X) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Mobile Safari/537.36' });
await run('T4 iframe embed (emb tag expected)', { url: `${LANu}/snake/`, iframeWrap: true, platform: 'Linux x86_64' });
console.log(JSON.stringify(results, null, 1));
