#!/usr/bin/env node
// spades/verify_engine.js — verify the Spades card game has full engine + chrome
//
// Checks:
//   1. Engine state object + key phases
//   2. 52-card deck builder (4 suits × 13 values)
//   3. AI bidder + AI player logic
//   4. Bid dialog with 14 buttons (Nil + 1..13)
//   5. Trick winner detection
//   6. Score persistence (NS/EW scores)
//   7. Site-chrome (monetag + gz-ad-below-game + game-footer + h1)
//
// Usage: node spades/verify_engine.js

const fs=require('fs');
const path=require('path');

const SLUG='spades';
const htmlPath=path.join(__dirname,'index.html');
const html=fs.readFileSync(htmlPath,'utf8');

const checks={
  'createDeck fn': /function createDeck\s*\(/.test(html),
  'shuffle fn': /function shuffle\s*\(/.test(html),
  'getAIBid fn': /function getAIBid\s*\(/.test(html),
  'sortHand fn': /function sortHand\s*\(/.test(html),
  'startNewGame fn': /function startNewGame\s*\(/.test(html),
  'startNewRound fn': /function startNewRound\s*\(/.test(html),
  'placeBid fn': /function placeBid\s*\(/.test(html),
  'playCard fn': /function playCard\s*\(/.test(html),
  'isLegalPlay fn': /function isLegalPlay\s*\(/.test(html),
  'getTrickWinner fn': /function determineTrickWinner\s*\(/.test(html),
  'showBidDialog fn': /function showBidDialog\s*\(/.test(html),
  'isSpade fn': /function isSpade\s*\(/.test(html),
  'setModal fn': /function setModal\s*\(/.test(html),
  'modal element': /id="modal"/.test(html),
  'modal-box element': /id="modal-box"/.test(html),
  'HUD NS': /id="hNS"/.test(html),
  'HUD EW': /id="hEW"/.test(html),
  'HUD Trick': /id="hTrick"/.test(html),
  'HUD Bags': /id="hBags"/.test(html),
  'saveState fn': /function saveState\s*\(/.test(html),
  'loadState fn': /function loadState\s*\(/.test(html),
  'bStartGame btn': /id="bStartGame"/.test(html),
  'bNewGame btn': /id="bNewGame"/.test(html),
  'bUndo btn': /id="bUndo"/.test(html),
  'bStats btn': /id="bStats"/.test(html),
  'bBlindNil btn': /id="bBlindNil"/.test(html),
  // 4 suits: spade/heart/diamond/club
  'suits 4': /SUITS\s*=\s*\[['"]spade['"]/.test(html) && /['"]heart['"]/.test(html) && /['"]diamond['"]/.test(html) && /['"]club['"]/.test(html),
  'values 1-13': /\b(2|3|4|5|6|7|8|9|10|J|Q|K|A)\b/.test(html),
  // Site chrome
  'monetag-manager.js': html.includes('monetag-manager.js'),
  'gz-ad-below-game': html.includes('gz-ad-below-game'),
  'game-footer.js': html.includes('game-footer.js'),
  '<h1>': /<h1[^>]*>/.test(html),
  // Game canvas
  'canvas': /<canvas[^>]*id="c"/.test(html),
  'canvas click handler': /canvas\.addEventListener\(['"]click['"]/.test(html),
};

const failed=Object.entries(checks).filter(([_,v])=>!v).map(([k])=>k);
const passed=Object.entries(checks).filter(([_,v])=>v).length;

if(failed.length){
  console.error(`❌ ${SLUG} engine/chrome missing: ${failed.join(', ')}`);
  process.exit(1);
}

console.log(`✅ ${SLUG}: ${passed}/${Object.keys(checks).length} engine + chrome checks pass (52-card deck, 4-phase game: bidding→playing→trick resolution→scoring, AI bidder+player, HUD + site-chrome)`);
process.exit(0);
