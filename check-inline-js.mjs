import fs from 'fs';

const GAMES = [
  '2048','abyss-chef','bolt-jam-3d','bounce-bot','brick-breaker',
  'catch-turkey','cloud-sheep','color-sort','dessert-blast','flappy-wings',
  'glyph-quest','idle-clicker','kitty-cafe','memory-match','mo-yu-fayu',
  'ocean-gem-pop','paint-splash','phantom-blade','snake','stacker',
  'sushi-stack','typing-speed','whack-a-mole','wood-block-puzzle','word-puzzle'
];

console.log('🔍 Checking inline JavaScript for problematic functions...');

function findProblematicFunctions(content) {
  const patterns = [
    /start\s*\(/,
    /onHasParentDirectory\s*\(/,
    /addRow\s*\(/,
    /function\s+start/,
    /function\s+onHasParentDirectory/,
    /function\s+addRow/
  ];
  
  const found = [];
  patterns.forEach((pattern, index) => {
    const matches = content.match(pattern);
    if (matches) {
      found.push({
        pattern: patterns[index].toString(),
        matches: matches
      });
    }
  });
  
  return found;
}

GAMES.forEach(game => {
  const htmlPath = `/home/msdn/gamezipper.com/${game}/index.html`;
  if (!fs.existsSync(htmlPath)) {
    console.log(`❌ ${game}: index.html not found`);
    return;
  }
  
  try {
    const content = fs.readFileSync(htmlPath, 'utf8');
    const found = findProblematicFunctions(content);
    
    if (found.length > 0) {
      console.log(`🔍 ${game}: Found problematic patterns:`);
      found.forEach(f => {
        console.log(`  Pattern: ${f.pattern}`);
        f.matches.forEach(match => {
          const lineNum = content.substring(0, content.indexOf(match)).split('\n').length;
          console.log(`    Line ${lineNum}: ${match}`);
          
          // Show context around the match
          const lines = content.split('\n');
          const startLine = Math.max(0, lineNum - 2);
          const endLine = Math.min(lines.length, lineNum + 2);
          
          for (let i = startLine; i < endLine; i++) {
            const prefix = i === lineNum - 1 ? '>> ' : '   ';
            console.log(`${prefix}${i + 1}: ${lines[i]}`);
          }
          console.log('');
        });
      });
    } else {
      console.log(`✅ ${game}: No problematic patterns found`);
    }
  } catch (e) {
    console.log(`❌ ${game}: Error reading file - ${e.message}`);
  }
});

console.log('\n📊 Analysis complete!');