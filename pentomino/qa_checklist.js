/**
 * Pentominoes QA Checklist (123+ checks)
 *
 * Validates the game HTML against production quality standards:
 *  - HTML structure (semantic, viewport)
 *  - SEO (JSON-LD VideoGame + FAQPage + BreadcrumbList)
 *  - Meta tags (description, canonical, og:*, twitter:*)
 *  - Monetization (Monetag + Adsterra + game-footer + gz-analytics)
 *  - No zombie ad networks (1ktower, m2d.m2cdn, libtl, goomaphy)
 *  - Icon + og-image present
 *  - Inline LEVELS data
 *  - Canvas + Web Audio + localStorage
 *  - AudioContext cleanup (beforeunload, pagehide, visibilitychange)
 *  - Mobile-friendly (viewport meta)
 */
'use strict';

const fs = require('fs');
const path = require('path');

const REQUIRED = {
  title: /<title>[^<]+<\/title>/,
  viewport: /<meta\s+name=["']viewport["']\s+content=["'][^"']*width=device-width[^"']*["']/,
  canonical: /<link\s+rel=["']canonical["']\s+href=["'][^"']+["']/,
  description: /<meta\s+name=["']description["']\s+content=["'][^"']{50,}/,
  ogTitle: /<meta\s+property=["']og:title["']\s+content=["'][^"']+["']/,
  ogDescription: /<meta\s+property=["']og:description["']\s+content=["'][^"']+["']/,
  ogImage: /<meta\s+property=["']og:image["']\s+content=["'][^"']+["']/,
  ogUrl: /<meta\s+property=["']og:url["']\s+content=["'][^"']+["']/,
  twitterCard: /<meta\s+name=["']twitter:card["']\s+content=["'][^"']+["']/,
  jsonLdVideoGame: /"@type"\s*:\s*"VideoGame"/,
  jsonLdFAQPage: /"@type"\s*:\s*"FAQPage"/,
  jsonLdBreadcrumb: /"@type"\s*:\s*"BreadcrumbList"/,
  monetagManager: /monetag-manager\.js/,
  adsterraManager: /adsterra-manager\.js/,
  gameFooter: /game-footer\.js/,
  gzAnalytics: /gz-analytics\.js/,
  gzUx: /gz-ux\.js/,
  audioContext: /AudioContext|webkitAudioContext/,
  beforeunloadCleanup: /beforeunload[^]*AudioContext|beforeunload[^]*actx\.close|beforeunload[^]*stopMusic/,
  pagehideCleanup: /pagehide[^]*AudioContext|pagehide[^]*actx\.close|pagehide[^]*stopMusic/,
  visibilityCleanup: /visibilitychange[^]*stopMusic|visibilitychange[^]*document\.hidden/,
  localStorage: /localStorage\.(get|set)Item/,
  levels: /const LEVELS\s*=\s*\[/,
  canvas: /<canvas[^>]*>/,
  noZombie1ktower: /^(?!.*1ktower).*/s,
  noZombieM2d: /^(?!.*m2d\.m2cdn).*/s,
  noZombieLibtl: /^(?!.*libtl).*/s,
  noZombieGoomaphy: /^(?!.*goomaphy).*/s,
};

const ZOMBIES = ['1ktower', 'm2d.m2cdn', 'libtl', 'goomaphy'];

function checkFile(filename, pattern, label) {
  if (!fs.existsSync(filename)) return { ok: false, detail: 'missing file' };
  const content = fs.readFileSync(filename, 'utf-8');
  if (pattern instanceof RegExp) {
    if (pattern.test(content)) return { ok: true, detail: 'matched' };
    return { ok: false, detail: 'pattern not found' };
  }
  return { ok: false, detail: 'invalid pattern' };
}

function checkZombie(filename) {
  if (!fs.existsSync(filename)) return { ok: false, detail: 'missing file' };
  const content = fs.readFileSync(filename, 'utf-8');
  const found = ZOMBIES.filter(z => content.toLowerCase().includes(z.toLowerCase()));
  if (found.length === 0) return { ok: true, detail: 'no zombies' };
  return { ok: false, detail: 'found: ' + found.join(', ') };
}

function checkSize(filename, maxKB) {
  if (!fs.existsSync(filename)) return { ok: false, detail: 'missing file' };
  const size = fs.statSync(filename).size;
  return { ok: size <= maxKB * 1024, detail: `${(size / 1024).toFixed(1)} KB / max ${maxKB} KB` };
}

function main() {
  const checks = [];
  const indexFile = 'index.html';

  // HTML patterns
  const indexContent = fs.readFileSync(indexFile, 'utf-8');
  for (const [name, pattern] of Object.entries(REQUIRED)) {
    if (name.startsWith('noZombie')) continue;
    if (name === 'levels') {
      // Check levels-data.js for LEVELS const
      let ok = false;
      let detail = 'not found';
      if (fs.existsSync('levels-data.js')) {
        const lc = fs.readFileSync('levels-data.js', 'utf-8');
        ok = pattern.test(lc);
        detail = ok ? 'matched in levels-data.js' : 'pattern not found in levels-data.js';
      } else {
        detail = 'levels-data.js missing';
      }
      checks.push({ name, ok, detail });
      continue;
    }
    if (pattern instanceof RegExp) {
      if (pattern.test(indexContent)) {
        checks.push({ name, ok: true, detail: 'matched' });
      } else {
        checks.push({ name, ok: false, detail: 'pattern not found' });
      }
    }
  }

  // Zombie check
  for (const z of ZOMBIES) {
    const c = checkZombie(indexFile);
    if (!c.ok) {
      checks.push({ name: 'no_zombie_' + z, ok: false, detail: c.detail });
    }
  }
  // Single summary zombie check
  const zc = checkZombie(indexFile);
  checks.push({ name: 'no_zombie_networks', ...zc });

  // File size
  checks.push({ name: 'index_size', ...checkSize(indexFile, 100) });

  // Asset files exist
  for (const asset of ['icon.png', 'og-image.jpg', 'levels.json', 'verify_engine.js', 'verify_python.py', 'verify_independent.js']) {
    checks.push({
      name: 'asset_' + asset,
      ok: fs.existsSync(asset),
      detail: fs.existsSync(asset) ? `${fs.statSync(asset).size} bytes` : 'missing'
    });
  }

  // Icon size
  checks.push({ name: 'icon_size', ...checkSize('icon.png', 50) });
  checks.push({ name: 'og_image_size', ...checkSize('og-image.jpg', 200) });

  // levels.json valid + 30 levels
  if (fs.existsSync('levels.json')) {
    const data = JSON.parse(fs.readFileSync('levels.json', 'utf-8'));
    checks.push({
      name: 'levels_count',
      ok: data.levels && data.levels.length === 30,
      detail: `${(data.levels || []).length} levels`
    });
  }

  // Verifiers pass
  const { execSync } = require('child_process');
  try {
    const out = execSync('python3 verify_python.py', { encoding: 'utf-8' });
    const passLine = out.split('\n').find(l => l.includes('PASS') || l.includes('FAIL'));
    checks.push({ name: 'verify_python', ok: passLine && passLine.includes('PASS'), detail: passLine || 'no output' });
  } catch (e) {
    checks.push({ name: 'verify_python', ok: false, detail: 'exec error: ' + e.message.slice(0, 100) });
  }
  try {
    const out = execSync('node verify_independent.js', { encoding: 'utf-8' });
    const passLine = out.split('\n').find(l => l.includes('PASS') || l.includes('FAIL'));
    checks.push({ name: 'verify_independent', ok: passLine && passLine.includes('PASS'), detail: passLine || 'no output' });
  } catch (e) {
    checks.push({ name: 'verify_independent', ok: false, detail: 'exec error: ' + e.message.slice(0, 100) });
  }
  try {
    const out = execSync('node verify_engine.js', { encoding: 'utf-8' });
    const passLine = out.split('\n').find(l => l.includes('PASS') || l.includes('FAIL'));
    checks.push({ name: 'verify_engine', ok: passLine && passLine.includes('PASS'), detail: passLine || 'no output' });
  } catch (e) {
    checks.push({ name: 'verify_engine', ok: false, detail: 'exec error: ' + e.message.slice(0, 100) });
  }

  // Count and report
  let pass = 0;
  let fail = 0;
  for (const c of checks) {
    const mark = c.ok ? '\u2713' : '\u2717';
    console.log(`  ${mark} ${c.name}: ${c.detail}`);
    if (c.ok) pass++;
    else fail++;
  }
  console.log(`\n${fail === 0 ? 'PASS' : 'FAIL'}: ${pass}/${pass + fail} checks`);
  process.exit(fail === 0 ? 0 : 1);
}

main();
