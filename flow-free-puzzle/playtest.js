// Flow Free Puzzle — permanent alias page redirecting to Flow Connect (no local engine by design).
// Playtest: the gameplay now lives in /flow-connect/, so this checks that the alias
// redirects consistently and that the destination exists locally as a real game page.
'use strict';

const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const destination = 'https://gamezipper.com/flow-connect/';
const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const checks = [
  ['noindex,follow robots directive', /<meta\s+name=["']robots["']\s+content=["']noindex,follow["']\s*\/?>/i],
  ['canonical destination', new RegExp(`<link\\s+rel=["']canonical["']\\s+href=["']${esc(destination)}["']\\s*\\/?>`, 'i')],
  ['zero-delay meta refresh', new RegExp(`<meta\\s+http-equiv=["']refresh["']\\s+content=["']0;url=${esc(destination)}["']\\s*\\/?>`, 'i')],
  ['JavaScript location.replace destination', new RegExp(`window\\.location\\.replace\\(['"]${esc(destination)}['"]\\)`)],
  ['fallback Flow Connect link', /<a\s+href=["']\/flow-connect\/["']/i],
];

const failures = checks.filter(([, pattern]) => !pattern.test(html)).map(([name]) => name);
if (/\b(?:const|let|var)\s+LEVELS\s*=/.test(html)) failures.push('redirect page must not embed game LEVELS');

// The redirect target must exist locally and be a real game page, not another alias hop.
const targetPath = path.join(__dirname, '..', 'flow-connect', 'index.html');
if (!fs.existsSync(targetPath)) {
  failures.push('redirect target flow-connect/index.html missing');
} else {
  const target = fs.readFileSync(targetPath, 'utf8');
  if (/http-equiv=["']refresh["']|location\.replace/.test(target) && !/<canvas|requestAnimationFrame/.test(target)) {
    failures.push('redirect target is itself a redirect (alias chain)');
  }
  if (!/<canvas/.test(target)) failures.push('redirect target has no game canvas');
}

if (failures.length) {
  console.error('PLAYTEST FAILED:', failures.join(', '));
  process.exit(1);
}
console.log(`PLAYTEST PASSED: alias redirects to ${destination} (${checks.length} checks) and target is a real game page`);
