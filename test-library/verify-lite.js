#!/usr/bin/env node
/**
 * 3-agent × 10-iter verification (lightweight, stable)
 * Each iter: 1 HTTP check + 1 curl-based content check + 1 grep check
 * 3 "agents" run in parallel within each iter
 *
 * Usage:
 *   node verify-lite.js <slug>
 *   node verify-lite.js --batch N
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

async function agent1_http(slug) {
  try {
    const r = execSync(
      `curl -sI "https://gamezipper.com/${slug}/" -o /dev/null -w "%{http_code}|%{time_total}"`,
      { timeout: 15000, encoding: 'utf8' }
    ).trim();
    const [code, time] = r.split('|');
    return { agent: 1, type: 'http', code, time, pass: code === '200' && parseFloat(time) < 5 };
  } catch (e) { return { agent: 1, error: e.message, pass: false }; }
}

async function agent2_content(slug) {
  try {
    const html = execSync(`curl -s "https://gamezipper.com/${slug}/"`, { timeout: 15000, encoding: 'utf8' });
    // Run all checks
    const checks = {
      h1: /<h1[^>]*>([^<]+)</.test(html),
      canvas: /<canvas/i.test(html) || /<div[^>]+class="[^"]*board/i.test(html) || /class="[^"]*cell/i.test(html) || /class="[^"]*tube/i.test(html) || /class="[^"]*tile/i.test(html) || /class="[^"]*grid/i.test(html),
      gzAd: /id="gz-ad-below-game"/.test(html),
      // game-footer is dynamically injected by game-footer.js (defer loaded), so we check for the script reference
      gzFooter: /game-footer\.js/.test(html),
      monetag: /monetag-manager\.js/.test(html),
      // gameJs: either has game.js/bundle reference, or game logic is inline in index.html (e.g. color-sort)
      gameJs: /<script[^>]+src="[^"]*(game\.js|bundle-)/.test(html) || /function\s+(startGame|initGame|renderGame|loadGame|newGame|spawn|update)/.test(html),
      no1ktower: !/1ktower\.com/.test(html),
      noAlwingulla: !/alwingulla\.com/.test(html),
      noRye: !/rye\.io/.test(html),
      noDeadAnalytics: !/site-analytics\.gamezipper\.com/.test(html),
      noHttp: !/http:\/\/gamezipper|10\.10\.|192\.168\./.test(html),
    };
    const allPass = Object.values(checks).every(v => v);
    return { agent: 2, type: 'content', checks, pass: allPass };
  } catch (e) { return { agent: 2, error: e.message, pass: false }; }
}

async function agent3_static(slug) {
  try {
    // Check local file
    const html = fs.readFileSync(`/home/msdn/gamezipper.com/${slug}/index.html`, 'utf8');
    const issues = [];
    // Script balance
    const bal = html.split('\n').reduce((s, l) => s + l.split('<script').length - 1 - (l.split('</script>').length - 1), 0);
    if (bal !== 0) issues.push(`script balance=${bal}`);
    // rAF broken pattern
    if (/_origRAF\.call\(window, ?clearTimeout/.test(html)) issues.push('broken rAF cancelAnimationFrame');
    // Splash no dismiss
    if (/splash-screen/.test(html) && !/dismiss/.test(html) && !/splash\.remove/.test(html)) issues.push('splash no dismiss');
    // Missing gz-ad
    if (!/gz-ad-below-game/.test(html)) issues.push('missing gz-ad');
    if (!/monetag-manager/.test(html)) issues.push('missing monetag');
    if (!/game-footer/.test(html)) issues.push('missing game-footer');
    return { agent: 3, type: 'static', issues, pass: issues.length === 0 };
  } catch (e) { return { agent: 3, error: e.message, pass: false }; }
}

async function verifyOne(slug) {
  const results = { pass: 0, fail: 0, issues: [] };
  for (let iter = 1; iter <= 10; iter++) {
    const [a1, a2, a3] = await Promise.all([
      agent1_http(slug),
      agent2_content(slug),
      agent3_static(slug),
    ]);
    const allPass = a1.pass && a2.pass && a3.pass;
    if (allPass) {
      results.pass++;
      process.stdout.write('✓');
    } else {
      results.fail++;
      process.stdout.write('✗');
      [a1, a2, a3].forEach((r, i) => {
        if (!r.pass) {
          if (r.error) results.issues.push(`iter${iter}/agent${i+1}: ${r.error}`);
          if (r.checks) {
            Object.entries(r.checks).forEach(([k, v]) => {
              if (!v) results.issues.push(`iter${iter}/agent${i+1}: content ${k}=${v}`);
            });
          }
          if (r.issues) {
            r.issues.forEach(iss => results.issues.push(`iter${iter}/agent${i+1}: ${iss}`));
          }
          if (r.code && r.code !== '200') results.issues.push(`iter${iter}/agent${i+1}: HTTP ${r.code}`);
        }
      });
    }
  }
  process.stdout.write('\n');
  return results;
}

async function main() {
  const args = process.argv.slice(2);
  const games = JSON.parse(fs.readFileSync(path.join(__dirname, 'games-list.json'), 'utf8'));
  let targets;
  if (args[0] === '--batch') {
    const n = parseInt(args[1] || '5', 10);
    targets = games.slice(0, n);
  } else if (args[0]) {
    targets = games.filter(g => g.slug === args[0]);
    if (!targets.length) { console.error(`Game ${args[0]} not found`); process.exit(1); }
  } else {
    console.log('Usage: node verify-lite.js <slug> | --batch N');
    process.exit(1);
  }

  console.log(`\n=== Verifying ${targets.length} games ===`);
  const allResults = {};
  for (const game of targets) {
    process.stdout.write(`[${game.slug}] `);
    allResults[game.slug] = await verifyOne(game.slug);
  }

  const report = {
    timestamp: new Date().toISOString(),
    games: allResults,
    summary: {
      total: Object.keys(allResults).length,
      allPass: Object.values(allResults).filter(r => r.fail === 0).length,
      hasFails: Object.values(allResults).filter(r => r.fail > 0).length,
    }
  };
  const outFile = path.join(__dirname, 'verify-results', `verify-lite-${Date.now()}.json`);
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, JSON.stringify(report, null, 2));
  console.log(`\n=== Summary ===`);
  console.log(`Total: ${report.summary.total} | All pass: ${report.summary.allPass} | Has fails: ${report.summary.hasFails}`);
  console.log(`Report: ${outFile}`);

  if (report.summary.hasFails > 0) {
    console.log('\n=== Fails ===');
    Object.entries(allResults).forEach(([slug, r]) => {
      if (r.fail > 0) {
        console.log(`  ${slug}: ${r.fail}/10 fail`);
        r.issues.slice(0, 3).forEach(iss => console.log('    - ' + iss));
      }
    });
  }
  process.exit(report.summary.hasFails > 0 ? 1 : 0);
}

main().catch(e => { console.error(e); process.exit(1); });
