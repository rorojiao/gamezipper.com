const fs = require('fs');
const html = fs.readFileSync('/home/msdn/gamezipper.com/nuritwin/index.html','utf8');
// Extract all script blocks
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
console.log('Found', scripts.length, 'inline script blocks');
let errors = 0;
scripts.forEach((js, i) => {
  try { new Function(js); console.log('Block', i, 'OK'); }
  catch(e) { console.log('Block', i, 'ERROR:', e.message); errors++; }
});
process.exit(errors);
