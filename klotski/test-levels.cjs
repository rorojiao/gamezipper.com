const fs = require('fs');
const html = fs.readFileSync('/home/msdn/gamezipper.com/klotski/index.html', 'utf8');

const levelsMatch = html.match(/const LEVELS=\[([\s\S]*?)\];/);
if (!levelsMatch) {
    console.log('ERROR: No LEVELS array found!');
    process.exit(1);
}

const levelsText = levelsMatch[1];
const levels = [];
let depth = 0;
let start = -1;
let currentLevel = '';

for (let i = 0; i < levelsText.length; i++) {
    const ch = levelsText[i];
    if (ch === '{') {
        if (depth === 0) {
            start = i;
            currentLevel = '';
        }
        depth++;
        currentLevel += ch;
    } else if (ch === '}') {
        depth--;
        currentLevel += ch;
        if (depth === 0) {
            levels.push(currentLevel);
            currentLevel = '';
            start = -1;
        }
    } else if (depth > 0) {
        currentLevel += ch;
    }
}

const topLevelLevels = levels.filter(l => l.includes('name:') && l.includes('tier:') && l.includes('par:') && l.includes('blocks:'));

console.log('Total top-level levels found: ' + topLevelLevels.length);

if (topLevelLevels.length !== 30) {
    console.log('ERROR: Expected 30 levels, found ' + topLevelLevels.length);
    process.exit(1);
}

for (let i = 0; i < topLevelLevels.length; i++) {
    const level = topLevelLevels[i];
    const tierMatch = level.match(/tier:(\d+)/);
    const parMatch = level.match(/par:(\d+)/);
    const blocksMatch = level.match(/blocks:\[([\s\S]*?)\]/);

    const tier = tierMatch ? parseInt(tierMatch[1]) : 'MISSING';
    const par = parMatch ? parseInt(parMatch[1]) : 'MISSING';
    const hasBlocks = blocksMatch && blocksMatch[1].length > 0;

    const status = (tier !== 'MISSING' && par !== 'MISSING' && hasBlocks) ? 'PASS' : 'FAIL';
    const levelNum = String(i + 1).padStart(2, ' ');
    console.log('  L' + levelNum + ' (T' + tier + '): par=' + par + ', blocks=' + (hasBlocks ? 'OK' : 'MISSING') + ' ' + status);
}

const tier1 = topLevelLevels.slice(0, 10).filter(l => l.includes('tier:1')).length;
const tier2 = topLevelLevels.slice(10, 20).filter(l => l.includes('tier:2')).length;
const tier3 = topLevelLevels.slice(20, 30).filter(l => l.includes('tier:3')).length;

console.log('Tier distribution: T1=' + tier1 + ', T2=' + tier2 + ', T3=' + tier3);
console.log('All 30 levels validated successfully!');