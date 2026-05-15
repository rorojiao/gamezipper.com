const fs = require('fs');
const html = fs.readFileSync('wordscapes/index.html', 'utf8');

// Extract LEVELS using string manipulation
const start = html.indexOf('const LEVELS=[');
const end = html.indexOf('];', start) + 2;
const levelsStr = html.substring(start + 'const LEVELS='.length, end);
const LEVELS = eval(levelsStr);
console.log('Total levels:', LEVELS.length);

let errors = 0;
let warnings = 0;

LEVELS.forEach((level, i) => {
    const idx = i + 1;
    if (!level.letters || !Array.isArray(level.letters) || level.letters.length < 3) {
        console.log(`❌ Level ${idx}: Invalid letters`);
        errors++;
        return;
    }
    if (!level.words || !Array.isArray(level.words) || level.words.length < 2) {
        console.log(`❌ Level ${idx}: Invalid words (need >=2)`);
        errors++;
        return;
    }
    const letterPool = {};
    level.letters.forEach(l => letterPool[l] = (letterPool[l] || 0) + 1);
    
    level.words.forEach(word => {
        const pool = {...letterPool};
        for (const ch of word) {
            if (!pool[ch] || pool[ch] <= 0) {
                console.log(`❌ Level ${idx}: Word "${word}" cannot be formed from letters ${JSON.stringify(level.letters)}`);
                errors++;
                return;
            }
            pool[ch]--;
        }
    });
    
    if (i > 0) {
        const prevMaxWord = Math.max(...LEVELS[i-1].words.map(w => w.length));
        const currMaxWord = Math.max(...level.words.map(w => w.length));
        const prevWords = LEVELS[i-1].words.length;
        const currWords = level.words.length;
        
        if (currMaxWord < prevMaxWord && currWords <= prevWords) {
            console.log(`⚠️ Level ${idx}: Difficulty regression vs level ${i}`);
            warnings++;
        }
    }
    
    const wordSet = new Set(level.words);
    if (wordSet.size !== level.words.length) {
        console.log(`❌ Level ${idx}: Duplicate words`);
        errors++;
    }
    
    level.words.forEach(word => {
        if (word.length < 2) {
            console.log(`❌ Level ${idx}: Word too short: "${word}"`);
            errors++;
        }
    });
});

console.log('\n=== LEVEL VALIDATION SUMMARY ===');
console.log('Levels checked:', LEVELS.length);
console.log('Errors:', errors);
console.log('Warnings:', warnings);
console.log(errors === 0 ? '✅ ALL LEVELS VALID' : '❌ HAS ERRORS');

// Letter count progression
console.log('\n=== DIFFICULTY PROGRESSION ===');
LEVELS.forEach((l, i) => {
    const maxWord = Math.max(...l.words.map(w => w.length));
    console.log(`L${i+1}: ${l.letters.length} letters, ${l.words.length} words, max word length: ${maxWord}`);
});
