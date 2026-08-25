#!/usr/bin/env node
/**
 * Pin Pull Puzzle — code-level QA checklist.
 * This directory is now a redirect stub to /pull-the-pin/; checks verify the
 * redirect contract, page structure, and assets. Runs without a browser.
 */
const fs = require('fs');
const path = require('path');
const DIR = __dirname;
const HTML = fs.readFileSync(path.join(DIR, 'index.html'), 'utf8');
const destination = 'https://gamezipper.com/pull-the-pin/';
const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

let pass = 0, fail = 0;
function check(name, cond, detail=''){
  if(cond){ pass++; console.log('  ✓', name); }
  else   { fail++; console.log('  ✗', name, '—', detail); }
}

console.log('== Pin Pull Puzzle (redirect) QA ==');
check('index.html present', fs.existsSync(path.join(DIR, 'index.html')));
check('icon.png present', fs.existsSync(path.join(DIR, 'icon.png')));
check('og-image.jpg present', fs.existsSync(path.join(DIR, 'og-image.jpg')));
check('verify_engine.js present', fs.existsSync(path.join(DIR, 'verify_engine.js')));
check('verify_independent.js present', fs.existsSync(path.join(DIR, 'verify_independent.js')));

// HTML structural checks
check('HTML has <!DOCTYPE html>', /^<!doctype html>/i.test(HTML));
check('HTML has <html lang="en">', /<html\s+lang="en"/i.test(HTML));
check('HTML has viewport meta', /<meta\s+name="viewport"/i.test(HTML));
check('HTML has title', /<title>[^<]+<\/title>/i.test(HTML));
check('HTML has VideoGame JSON-LD', /"@type":\s*"VideoGame"/.test(HTML));
check('HTML has closing </html>', /<\/html>/.test(HTML));
check('HTML has closing </body>', /<\/body>/.test(HTML));

// Redirect contract
check('robots noindex,follow', /<meta\s+name=["']robots["']\s+content=["']noindex,follow["']\s*\/?>/i.test(HTML));
check('canonical destination', new RegExp(`<link\\s+rel=["']canonical["']\\s+href=["']${esc(destination)}["']\\s*\\/?>`, 'i').test(HTML));
check('zero-delay meta refresh', new RegExp(`<meta\\s+http-equiv=["']refresh["']\\s+content=["']0;url=${esc(destination)}["']\\s*\\/?>`, 'i').test(HTML));
check('JavaScript location.replace destination', new RegExp(`window\\.location\\.replace\\(['"]${esc(destination)}['"]\\)`).test(HTML));
check('fallback Pull The Pin link', /<a\s+href=["']\/pull-the-pin\/["']/i.test(HTML));
check('no embedded game LEVELS', !/\b(?:const|let|var)\s+LEVELS\s*=/.test(HTML));

// Hygiene
check('no insecure http:// resources', !/src=["']http:\/\//i.test(HTML) && !/href=["']http:\/\/(?!gamezipper)/i.test(HTML));
check('no TODO/FIXME', !/TODO|FIXME/i.test(HTML));
check('no eval()', !/eval\(/.test(HTML));
check('no document.write', !/document\.write\(/.test(HTML));
check('no console.log', !/console\.log/.test(HTML));

console.log(`\n=== ${pass} pass, ${fail} fail ===`);
process.exit(fail === 0 ? 0 : 1);
