// JS syntax validation + level data extraction for jigpic-solitaire
const fs = require('fs');
const html = fs.readFileSync('/home/msdn/gamezipper.com/jigpic-solitaire/index.html', 'utf8');

// Extract all script blocks
const scripts = html.match(/<script[^>]*>([\s\S]*?)<\/script>/g);
console.log('Total script blocks:', scripts.length);

scripts.forEach(function(block, i) {
  const code = block.replace(/<\/?script[^>]*>/g, '');
  if (code.length < 10) return; // skip tiny blocks
  
  // Skip JSON-LD
  if (block.includes('application/ld+json')) {
    try { JSON.parse(code); console.log('Script ' + (i+1) + ': JSON-LD OK (' + code.length + ' chars)'); }
    catch(e) { console.log('Script ' + (i+1) + ': JSON-LD PARSE ERROR - ' + e.message); }
    return;
  }
  
  try {
    new Function(code);
    console.log('Script ' + (i+1) + ': SYNTAX OK (' + code.length + ' chars)');
  } catch(e) {
    console.log('Script ' + (i+1) + ': SYNTAX ERROR - ' + e.message);
  }
});

// Validate level data
const levelMatch = html.match(/var LEVELS=(\[.*?\]);/s);
if (levelMatch) {
  try {
    const levels = JSON.parse(levelMatch[1]);
    console.log('\n=== LEVEL DATA VALIDATION ===');
    console.log('Total levels:', levels.length);
    
    let allValid = true;
    levels.forEach(function(lv, i) {
      const n = lv.grid * lv.grid;
      
      // Check tile count
      if (lv.tiles.length !== n) {
        console.log('FAIL Level ' + (i+1) + ': tile count ' + lv.tiles.length + ' != ' + n);
        allValid = false;
        return;
      }
      
      // Check permutation
      const sorted = [...lv.tiles].sort((a,b) => a-b);
      for (let j = 0; j < n; j++) {
        if (sorted[j] !== j) {
          console.log('FAIL Level ' + (i+1) + ': invalid permutation at index ' + j);
          allValid = false;
          return;
        }
      }
      
      // Check not already solved
      if (lv.tiles.every((v, j) => v === j)) {
        console.log('FAIL Level ' + (i+1) + ': already solved');
        allValid = false;
      }
    });
    
    // Tier distribution
    const tiers = {};
    levels.forEach(lv => { tiers[lv.tier] = (tiers[lv.tier] || 0) + 1; });
    console.log('Tier distribution:', JSON.stringify(tiers));
    
    // Grid sizes
    const grids = [...new Set(levels.map(l => l.grid))].sort();
    console.log('Grid sizes:', grids.join(', '));
    
    console.log('All levels valid:', allValid);
    
  } catch(e) {
    console.log('LEVEL PARSE ERROR:', e.message);
  }
} else {
  console.log('ERROR: Could not find LEVELS array');
}
