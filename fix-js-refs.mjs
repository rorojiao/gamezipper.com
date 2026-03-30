import fs from 'fs';
import path from 'path';

const GAMES_DIR = '/home/msdn/gamezipper.com';
const TOOLS_DIR = '/home/msdn/gamezipper-tools';

console.log('🔧 Fixing JavaScript file references...');

// Function to check and fix game HTML files
async function fixGameFiles() {
  const games = [
    '2048','abyss-chef','bolt-jam-3d','bounce-bot','brick-breaker',
    'catch-turkey','cloud-sheep','color-sort','dessert-blast','flappy-wings',
    'glyph-quest','idle-clicker','kitty-cafe','memory-match','mo-yu-fayu',
    'ocean-gem-pop','paint-splash','phantom-blade','snake','stacker',
    'sushi-stack','typing-speed','whack-a-mole','wood-block-puzzle','word-puzzle'
  ];
  
  let fixedCount = 0;
  let jsFiles = {};
  
  // First, scan for existing JS files
  games.forEach(game => {
    const gameDir = path.join(GAMES_DIR, game);
    if (fs.existsSync(gameDir)) {
      const files = fs.readdirSync(gameDir);
      jsFiles[game] = files.filter(f => f.endsWith('.js'));
    }
  });
  
  console.log(`Found JS files for games:`);
  Object.entries(jsFiles).forEach(([game, files]) => {
    if (files.length > 0) {
      console.log(`  ${game}: ${files.join(', ')}`);
    }
  });
  
  // Now check and fix HTML files
  games.forEach(game => {
    const htmlPath = path.join(GAMES_DIR, game, 'index.html');
    if (!fs.existsSync(htmlPath)) {
      console.log(`❌ ${game}: index.html not found`);
      return;
    }
    
    const html = fs.readFileSync(htmlPath, 'utf8');
    const jsFile = jsFiles[game]?.[0]; // Use first JS file if exists
    
    if (jsFile && !html.includes(`src="${jsFile}"`)) {
      // Check if it's already loading JS from parent directory
      if (html.includes('src="../') || html.includes('src="/')) {
        console.log(`⚠️  ${game}: Already loading JS from parent directory`);
        return;
      }
      
      // Add JS file reference
      const scriptTag = `\n<script src="${jsFile}"></script>`;
      const insertPos = html.lastIndexOf('</body>');
      if (insertPos !== -1) {
        const newHtml = html.slice(0, insertPos) + scriptTag + html.slice(insertPos);
        fs.writeFileSync(htmlPath, newHtml);
        console.log(`✅ ${game}: Added <script src="${jsFile}"></script>`);
        fixedCount++;
      }
    } else if (!jsFile) {
      console.log(`⚠️  ${game}: No JS file found to reference`);
    }
  });
  
  console.log(`\n📊 Summary: Fixed ${fixedCount} game HTML files`);
  return fixedCount;
}

// Function to check and fix tool HTML files
async function fixToolFiles() {
  const toolDirs = [
    'calc','color','convert','css-tools','dev','fortune',
    'image','seo','social','text'
  ];
  
  let fixedCount = 0;
  
  toolDirs.forEach(dir => {
    const dirPath = path.join(TOOLS_DIR, dir);
    if (!fs.existsSync(dirPath)) return;
    
    const htmlFiles = fs.readdirSync(dirPath).filter(f => f.endsWith('.html'));
    htmlFiles.forEach(htmlFile => {
      const htmlPath = path.join(dirPath, htmlFile);
      const html = fs.readFileSync(htmlPath, 'utf8');
      
      // Check if this tool needs JS fixes
      const jsFiles = fs.readdirSync(dirPath).filter(f => f.endsWith('.js'));
      
      // Add common JS files if missing
      const scriptsToAdd = [];
      
      // Add monetag-safe.js if missing
      if (!html.includes('monetag-safe.js') && !html.includes('monetag')) {
        scriptsToAdd.push('../monetag-safe.js');
      }
      
      // Add game-footer.js if missing and it's a tool
      if (!html.includes('game-footer.js')) {
        scriptsToAdd.push('../game-footer.js');
      }
      
      if (scriptsToAdd.length > 0) {
        const scriptTags = scriptsToAdd.map(js => `<script src="${js}"></script>`).join('\n  ');
        const insertPos = html.lastIndexOf('</body>');
        if (insertPos !== -1) {
          const newHtml = html.slice(0, insertPos) + '  ' + scriptTags + '\n' + html.slice(insertPos);
          fs.writeFileSync(htmlPath, newHtml);
          console.log(`✅ ${dir}/${htmlFile}: Added ${scriptsToAdd.length} script(s)`);
          fixedCount++;
        }
      }
    });
  });
  
  console.log(`\n📊 Summary: Fixed ${fixedCount} tool HTML files`);
  return fixedCount;
}

// Main function
async function main() {
  console.log('🎮 Starting JS reference fixes...\n');
  
  const gameFixes = await fixGameFiles();
  console.log('\n');
  const toolFixes = await fixToolFiles();
  
  console.log(`\n🎯 Total fixes applied: ${gameFixes + toolFixes}`);
  console.log('✅ Reference fixing complete!');
}

main().catch(console.error);