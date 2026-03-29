
const { chromium } = require("playwright");
(async()=>{
  const browser = await chromium.launch({headless:true});
  const pages = ["/","/2048/","/flappy-wings/","/snake/","/ocean-gem-pop/"];
  for (const path of pages) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    await page.goto("http://127.0.0.1:8765"+path, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2500);
    const data = await page.evaluate(() => {
      const scripts = [...document.scripts].map(s => s.src).filter(Boolean);
      const adScript = scripts.find(s => s.includes('quge5.com')) || null;
      const full = [...document.querySelectorAll('*')].map(el => {
        const s = getComputedStyle(el), r = el.getBoundingClientRect();
        return {id:el.id, cls:String(el.className||''), pos:s.position, z:+(s.zIndex||0), w:r.width, h:r.height, disp:s.display, vis:s.visibility, op:s.opacity};
      }).filter(o => (o.pos==='fixed'||o.pos==='absolute') && o.w>250 && o.h>250 && o.disp!=='none' && o.vis!=='hidden' && o.op!=='0' && o.z>50);
      return { adScript, fullCount: full.length, full: full.slice(0,5), promo: !!document.getElementById('gz-promo-rail') };
    });
    console.log('\nPAGE', path, JSON.stringify(data));
    await page.close();
  }
  await browser.close();
})();
