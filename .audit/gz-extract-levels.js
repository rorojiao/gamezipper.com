#!/usr/bin/env node
// gz-extract-levels.js — shared utility for all game verifiers.
// Given an index.html, return a parsed LEVELS array (or null).
//
// Detects LEVELS in:
//   1. inline  : `const LEVELS = [...];` or `let LEVELS = [...];`
//   2. JSON     : sibling `levels.json` or `levels_inline.json`
//   3. compact  : sibling `levels_compact.json` or `levels_inline.txt` (JS obj)
//
// Usage:
//   const LEVELS = require('./.audit/gz-extract-levels.js')(slug);
//   // or via CLI:
//   node .audit/gz-extract-levels.js <slug>
//
// IMPORTANT: parses LEVELS via balanced-bracket scanner that is
// string-literal aware (handles '\\"', template literals, regex literals,
// single-quote, double-quote, line-comments, block-comments). This
// avoids the old regex-based extractor's bug of stopping at the first
// '];' found inside the array (e.g. inside an object literal that
// contains an array as its value).

const fs=require('fs');
const path=require('path');

// Robust string-aware balanced-bracket scanner.
// s: source string, i: start index (must be just AFTER opening '[' or '{')
// open/close: '[{' / ']}'
// Returns: end index (inclusive of matching close), OR -1 if unterminated.
function findMatching(s, i, open, close){
  let depth=1;
  let inStr=null;        // '"' | "'" | '`'
  let inRegex=false;
  let inLineComment=false;
  let inBlockComment=false;
  while(i<s.length && depth>0){
    const c=s[i];
    const prev=s[i-1]||'';
    const next=s[i+1]||'';
    if(inLineComment){
      if(c==='\n') inLineComment=false;
    } else if(inBlockComment){
      if(c==='*' && next==='/'){ inBlockComment=false; i++; }
    } else if(inStr){
      if(c==='\\'){ i++; } // skip escape
      else if(c===inStr){ inStr=null; }
    } else if(inRegex){
      if(c==='\\'){ i++; }
      else if(c==='/'){ inRegex=false; }
      // skip over char-class brackets [a-z]
    } else {
      if(c==='/' && next==='/'){ inLineComment=true; i++; }
      else if(c==='/' && next==='*'){ inBlockComment=true; i++; }
      else if(c==='"' || c==="'" || c==='`'){ inStr=c; }
      else if(c===open) depth++;
      else if(c===close){ depth--; if(depth===0) return i; }
    }
    i++;
  }
  return -1;
}

// Find first occurrence of `const LEVELS = [` or `let LEVELS = [` in
// the html, then scan to find the matching `]`, return the substring
// (inclusive of the brackets) that parses as a JSON array.
function extractLevelsFromHtml(html){
  const re=/\b(const|let|var)\s+LEVELS\s*=\s*\[/g;
  let m;
  while((m=re.exec(html))){
    const startIdx=m.index + m[0].length - 1; // index of '['
    const closeIdx=findMatching(html, startIdx+1, '[', ']');
    if(closeIdx<0) continue;
    const body=html.slice(startIdx, closeIdx+1);
    try{
      const arr=eval('('+body+')');
      if(Array.isArray(arr)) return arr;
    }catch(e){
      // try JSON.parse with comment-stripped fallback
      try{
        return JSON.parse(body);
      }catch(e2){ /* keep searching */ }
    }
  }
  return null;
}

function extractFromJson(slugDir){
  for(const fname of ['levels.json','levels_inline.json']){
    const p=path.join(slugDir, fname);
    if(fs.existsSync(p)){
      try{
        const j=JSON.parse(fs.readFileSync(p,'utf8'));
        if(Array.isArray(j)) return j;
        if(Array.isArray(j.LEVELS)) return j.LEVELS;
        if(Array.isArray(j.levels)) return j.levels;
      }catch(e){ /* try next */ }
    }
  }
  return null;
}

function extractLevels(slug){
  const slugDir=path.resolve(__dirname,'..', slug);
  const htmlPath=path.join(slugDir,'index.html');
  if(fs.existsSync(htmlPath)){
    const html=fs.readFileSync(htmlPath,'utf8');
    const arr=extractLevelsFromHtml(html);
    if(arr) return arr;
  }
  return extractFromJson(slugDir);
}

// CLI usage
if(require.main===module){
  const slug=process.argv[2];
  if(!slug){ console.error('Usage: node gz-extract-levels.js <slug>'); process.exit(1); }
  const arr=extractLevels(slug);
  if(!arr){ console.error(`No LEVELS found for ${slug}`); process.exit(1); }
  console.log(`Found ${arr.length} levels for ${slug}`);
}

module.exports=extractLevels;
module.exports.extractLevelsFromHtml=extractLevelsFromHtml;
module.exports.extractFromJson=extractFromJson;