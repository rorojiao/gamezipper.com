// Anagram Level Verification (Node.js)
// Independent BFS verification of all 30 levels

const fs = require('fs');

// Extract levels from index.html
function extractLevels() {
    const html = fs.readFileSync('/home/msdn/gamezipper.com/anagram/index.html', 'utf8');

    // Extract LEVELS array
    const levelsMatch = html.match(/const LEVELS=\[([\s\S]*?)\];/);
    if (!levelsMatch) {
        console.log('❌ ERROR: No LEVELS array found!');
        process.exit(1);
    }

    const levelsText = `[${levelsMatch[1]}]`;
    const levels = eval(levelsText); // Safe: data only, no code execution

    console.log(`✅ Extracted ${levels.length} levels`);
    return levels;
}

// Extract word set from index.html
function extractWordSet() {
    const html = fs.readFileSync('/home/msdn/gamezipper.com/anagram/index.html', 'utf8');

    // Extract WORD_SET (should be a Set with 10K words)
    const wordSetMatch = html.match(/const WORD_SET=new Set\(([\s\S]*?)\);/);
    if (!wordSetMatch) {
        console.log('❌ ERROR: No WORD_SET found!');
        process.exit(1);
    }

    // Parse word list from the Set constructor
    const wordListMatch = wordSetMatch[1].match(/\[([\s\S]*?)\]/);
    let wordSet;

    if (wordListMatch) {
        const wordListStr = wordListMatch[1];
        const words = wordListStr.split(',').map(w => w.trim().replace(/['"]/g, ''));
        wordSet = new Set(words);
    } else {
        // Fallback: extract individual words
        const words = html.match(/"([a-z]{3,6})"/g) || [];
        wordSet = new Set(words.map(w => w.replace(/"/g, '')));
    }

    console.log(`✅ Loaded ${wordSet.size} words from dictionary`);
    return wordSet;
}

// BFS to find all valid words from letters
function bfsFindWords(letters, wordSet) {
    // Build letter frequency map
    const letterCounts = {};
    for (const ch of letters) {
        letterCounts[ch] = (letterCounts[ch] || 0) + 1;
    }

    const validWords = new Set();

    // Check all words in dictionary
    for (const word of wordSet) {
        if (word.length < 3 || word.length > 6) continue;

        // Check if word can be formed from letters
        const wordCounts = {};
        for (const ch of word) {
            wordCounts[ch] = (wordCounts[ch] || 0) + 1;
        }

        let canForm = true;
        for (const ch in wordCounts) {
            if (!letterCounts[ch] || letterCounts[ch] < wordCounts[ch]) {
                canForm = false;
                break;
            }
        }

        if (canForm) {
            validWords.add(word);
        }
    }

    // Sort by length, then alphabetically
    return Array.from(validWords).sort((a, b) => {
        if (a.length !== b.length) return a.length - b.length;
        return a.localeCompare(b);
    });
}

// Validate a single level
function validateLevel(level, levelNum) {
    const letters = level.letters;
    const par = level.par;
    const tier = Math.ceil(levelNum / 6);

    const issues = [];

    // Check letters length
    if (letters.length !== 6) {
        issues.push(`INVALID_LENGTH: ${letters.length} letters (expected 6)`);
    }

    // Check letters are uppercase
    if (!/^[A-Z]{6}$/.test(letters)) {
        issues.push(`INVALID_FORMAT: '${letters}' must be 6 uppercase letters`);
    }

    // Check par range
    const parRanges = {
        1: [4, 6],
        2: [6, 8],
        3: [8, 10],
        4: [10, 12],
        5: [12, 15]
    };
    const [minPar, maxPar] = parRanges[tier];
    if (par < minPar || par > maxPar) {
        issues.push(`INVALID_PAR: ${par} (Tier ${tier} expects ${minPar}-${maxPar})`);
    }

    return { issues, tier, letters, par };
}

function main() {
    console.log('🔍 Anagram Level Verification (Node.js BFS)\n');

    // Extract levels
    const levels = extractLevels();

    // Load word dictionary
    const wordSet = extractWordSet();

    if (levels.length !== 30) {
        console.log(`❌ ERROR: Expected 30 levels, found ${levels.length}`);
        process.exit(1);
    }

    console.log('\n📊 Level Analysis:');
    console.log('-'.repeat(80));

    let allValid = true;
    let totalValidWords = 0;

    for (let i = 0; i < levels.length; i++) {
        const levelNum = i + 1;
        const level = levels[i];

        const { issues, tier, letters, par } = validateLevel(level, levelNum);

        // Count valid words using BFS
        const validWords = bfsFindWords(letters, wordSet);
        const validWordCount = validWords.length;
        totalValidWords += validWordCount;

        // Check if par is achievable
        if (validWordCount < par) {
            issues.push(`PAR_UNACHIEVABLE: ${validWordCount} words available (par=${par})`);
        }

        // Print level status
        const status = issues.length === 0 ? '✅' : `❌ ${issues.join(', ')}`;
        console.log(`L${String(levelNum).padStart(2, ' ')} (T${tier}): letters=${letters}, par=${String(par).padStart(2, ' ')}, words=${String(validWordCount).padStart(2, ' ')} ${status}`);

        if (issues.length > 0) {
            allValid = false;

            // Debug: print available words if par is unachievable
            if (validWordCount < par) {
                console.log(`     Available words: ${validWords.join(', ')}`);
            }
        }
    }

    console.log('-'.repeat(80));
    console.log('\n📈 Summary:');
    console.log(`Total levels: ${levels.length}`);
    console.log(`Total valid words across all levels: ${totalValidWords}`);
    console.log(`Average words per level: ${(totalValidWords / levels.length).toFixed(1)}`);
    console.log(`All levels valid: ${allValid ? '✅ YES' : '❌ NO'}`);

    if (allValid) {
        console.log('\n🎉 All 30 levels passed verification (Node.js BFS)!');
        process.exit(0);
    } else {
        console.log('\n❌ Some levels failed verification!');
        process.exit(1);
    }
}

main();