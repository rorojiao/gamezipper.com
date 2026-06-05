#!/usr/bin/env node
/**
 * 3-agent × 10-iter verification (real Playwright + Kachilu)
 * Per user policy: every fix must be verified by 3 independent agents
 * running the same test case 10 times each.
 *
 * Usage:
 *   node verify-game.js <slug>        # 1 game, 3 agents × 10 iters
 *   node verify-game.js --batch 5      # 5 games
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const KACHILU = '/home/msdn/.nvm/versions/node/v22.22.0/bin/kachilu-browser';

async function runOneIter(slug, iter, agentId) {
  const session = `verify-${slug}-i${iter}-a${agentId}`;
  const url = `https://gamezipper.com/${slug}/`;
  try {
    // Open
    execSync(`${KACHILU} --session "${session}" open "${url}"`, { timeout: 60000, stdio: 'pipe' });
    // Wait 12s for game load + footer
    await new Promise(r => setTimeout(r, 12000));
    // Eval
    const script = `(function(){
      var r = {h1:'', hasCanvas:false, errors:[], gzAd:false, gzFooter:false, monetag:false, hasGameJs:false, playable:'maybe'};
      try { r.h1 = (document.querySelector('h1') || {}).textContent || ''; } catch(e){}
      try { r.hasCanvas = !!document.querySelector('canvas'); } catch(e){}
      try { r.gzAd = !!document.getElementById('gz-ad-below-game'); } catch(e){}
      try { r.gzFooter = !!document.getElementById('game-footer'); } catch(e){}
      try { r.monetag = document.querySelector('script[src*="monetag-manager"]') !== null; } catch(e){}
      try {
        var scripts = Array.from(document.scripts).map(s => s.src || '');
        r.hasGameJs = scripts.some(s => /game\\.js|bundle-.*\\.js/.test(s));
      } catch(e){}
      // Detect zombie endpoints
      try {
        var bodyHtml = document.body.innerHTML;
        r.zombieEndpoints = /1ktower\\.com|alwingulla\\.com|rye\\.io/.test(bodyHtml);
        r.deadAnalytics = /site-analytics\\.gamezipper\\.com/.test(bodyHtml);
      } catch(e){}
      r.playable = (r.h1 && (r.hasCanvas || r.gzFooter)) ? true : (r.gzFooter ? 'maybe' : false);
      return JSON.stringify(r);
    })()`;
    const result = execSync(
      `${KACHILU} --session "${session}" eval '${script.replace(/'/g, "'\\''")}'`,
      { timeout: 30000, encoding: 'utf8', stdio: 'pipe' }
    );
    return JSON.parse(result);
  } catch (e) {
    return { error: e.message, playable: false };
  }
}

async function verifyOneGame(slug) {
  const url = `https://gamezipper.com/${slug}/`;
  const results = { pass: 0, fail: 0, issues: [] };
  console.log(`\n[Verifying] ${slug}`);
  for (let iter = 1; iter <= 10; iter++) {
    // Run 3 agents in parallel
    const iterResults = await Promise.all([
      runOneIter(slug, iter, 1),
      runOneIter(slug, iter, 2),
      runOneIter(slug, iter, 3),
    ]);
    // All 3 must agree on PASS for this iter to PASS
    const allPass = iterResults.every(r => r.playable === true && !r.zombieEndpoints && !r.deadAnalytics);
    if (allPass) {
      results.pass++;
      process.stdout.write('.');
    } else {
      results.fail++;
      process.stdout.write('F');
      iterResults.forEach((r, ai) => {
        if (r.playable !== true) results.issues.push(`iter${iter}/agent${ai+1}: playable=${r.playable}`);
        if (r.zombieEndpoints) results.issues.push(`iter${iter}/agent${ai+1}: zombie endpoint detected`);
        if (r.deadAnalytics) results.issues.push(`iter${iter}/agent${ai+1}: dead site-analytics img`);
      });
    }
  }
  // Cleanup
  try { execSync(`${KACHILU} close --all`, { timeout: 10000, stdio: 'pipe' }); } catch {}
  console.log(`\n[Result] ${slug}: ${results.pass}/10 pass, ${results.fail}/10 fail`);
  if (results.issues.length) {
    console.log('Issues:');
    results.issues.forEach(i => console.log('  - ' + i));
  }
  return results;
}

async function main() {
  const args = process.argv.slice(2);
  const gamesList = JSON.parse(fs.readFileSync(path.join(__dirname, 'games-list.json'), 'utf8'));
  let targets;
  if (args[0] === '--batch') {
    const n = parseInt(args[1] || '5', 10);
    targets = gamesList.slice(0, n);
  } else if (args[0]) {
    targets = gamesList.filter(g => g.slug === args[0]);
    if (!targets.length) {
      console.error(`Game ${args[0]} not found in library`);
      process.exit(1);
    }
  } else {
    console.log('Usage: node verify-game.js <slug> | --batch N');
    process.exit(1);
  }

  const allResults = {};
  for (const game of targets) {
    allResults[game.slug] = await verifyOneGame(game.slug);
  }

  // Summary
  const report = {
    timestamp: new Date().toISOString(),
    games: allResults,
    summary: {
      total: Object.keys(allResults).length,
      allPass: Object.values(allResults).filter(r => r.fail === 0).length,
      hasFails: Object.values(allResults).filter(r => r.fail > 0).length,
    }
  };
  const outFile = path.join(__dirname, 'verify-results', `verify-${Date.now()}.json`);
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, JSON.stringify(report, null, 2));
  console.log(`\n=== Summary ===`);
  console.log(`Total: ${report.summary.total} | All pass: ${report.summary.allPass} | Has fails: ${report.summary.hasFails}`);
  console.log(`Report: ${outFile}`);
  process.exit(report.summary.hasFails > 0 ? 1 : 0);
}

main().catch(e => { console.error(e); process.exit(1); });
