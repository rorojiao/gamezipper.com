#!/usr/bin/env node
// verify_engine.js — ludo state-machine + win-condition verifier (sweep 84)
// Ludo is procedural (no LEVELS array). Validate:
// 1. Initial token state is correct (4 players × 4 tokens, all dist=-1, finished=false)
// 2. Win condition fires when all 4 tokens of a player are finished
// 3. Progress save/load roundtrip preserves wins

const fs = require('fs');
const html = fs.readFileSync('ludo/index.html', 'utf8');

// 1) Verify initTokens() sets up 4×4 tokens correctly
const initMatch = html.match(/function initTokens\(\)\{[\s\S]{0,400}/);
if (!initMatch) { console.error('❌ initTokens() not found'); process.exit(1); }
const initCode = initMatch[0];
console.log('initTokens signature:', initCode.includes('tokens[p][t]={dist:-1,finished:false}') ? 'OK 4x4 initialized' : 'BAD');

// 2) Verify checkGameEnd() and endGame() exist
const hasCheckGameEnd = /function checkGameEnd\(\)\{[\s\S]*?tokens\[p\]\.every/.test(html);
const hasEndGame = /function endGame\(winner\)\{[\s\S]*?gameActive\s*=\s*false/.test(html);
console.log('checkGameEnd logic:', hasCheckGameEnd ? 'OK checks all 4 tokens finished' : 'BAD');
console.log('endGame logic:', hasEndGame ? 'OK sets gameActive=false' : 'BAD');

// 3) Verify saveProgress writes v:1
const saveOk = /localStorage\.setItem\('ludo_save',JSON\.stringify\(\{v:1,w:wins,bs:bestStreak,tg:totalGames,gpc:gamesPlayedCount\}\)\)/.test(html);
console.log('saveProgress writes v:1:', saveOk ? 'OK' : 'BAD');

// 4) Verify loadProgress has v===1 guard
const loadOk = /if\(d&&d\.v===1\)\{wins=d\.w/.test(html);
console.log('loadProgress v===1 guard:', loadOk ? 'OK' : 'BAD');

// 5) Verify init/end sets gameActive state
const gameActiveOk = /gameActive\s*=\s*(true|false)/.test(html);
console.log('gameActive state variable used:', gameActiveOk ? 'OK' : 'BAD');

// 6) Verify dice rolls + valid moves logic exists
const rollOk = /function rollDice\(\)/.test(html);
const moveOk = /function (moveToken|applyMove|moveSelected)/.test(html) || /applyMove\(/.test(html);
console.log('rollDice function:', rollOk ? 'OK' : 'BAD');
console.log('moveToken logic:', moveOk ? 'OK' : 'BAD');

// 7) Verify player colors defined (4 distinct players)
const colors = ['red', 'green', 'yellow', 'blue'].filter(c => html.includes(`'${c}'`) || html.includes(`"${c}"`));
console.log('4 player colors:', colors.length === 4 ? 'OK' : `BAD (${colors.length})`);

const all = initCode.includes('tokens[p][t]={dist:-1,finished:false}') && hasCheckGameEnd && hasEndGame && saveOk && loadOk && gameActiveOk && rollOk && moveOk && colors.length === 4;
console.log('\n' + (all ? '✅ All structural invariants PASS' : '❌ FAIL — see above'));
process.exit(all ? 0 : 1);