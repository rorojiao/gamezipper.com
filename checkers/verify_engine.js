#!/usr/bin/env node
'use strict';
const fs=require('fs'),path=require('path');
const html=fs.readFileSync(path.join(__dirname,'index.html'),'utf8');
const rules={
 mandatoryCapture:/function getValidMoves[\s\S]*?if \(jumps\.length > 0\) return \{ moves: jumps, mustJump: true \}/.test(html),
 multiJump:/function finishAnimation[\s\S]*?moreJumps\.length > 0[\s\S]*?jumpInProgress = true/.test(html),
 promotion:/piece === RED && (?:move\.)?r === 0[\s\S]*?RED_KING/.test(html)&&/piece === DARK && (?:move\.)?r === 7[\s\S]*?DARK_KING/.test(html),
 aiTurn:/currentPlayer === DARK[\s\S]*?setTimeout\(doAITurn, 200\)/.test(html),
 undoPair:/gameMode === 'ai' \? Math\.min\(2, undoStack\.length\) : 1/.test(html),
 draw40:/noCaptureMoves >= MAX_NO_CAPTURE/.test(html),
 statsSave:/localStorage\.setItem\('checkers_stats'/.test(html),
 touch:/canvas\.addEventListener\('touchend'/.test(html)
};
const pass=Object.values(rules).every(Boolean);console.log(JSON.stringify({rules,pass},null,2));if(!pass)process.exit(1);
