#!/usr/bin/env node
// R3: cluster_rule_read extended — covers ALL live games, identifies
// ≥3 candidate clusters by (cat, tag1+tag2) signature, then rules-read
// each game's <h1> + <title> + <meta description> to decide duplicate-by-mechanic.

const fs=require('fs');
const path=require('path');

const ROOT=path.resolve(__dirname,'..');
const CATALOG_PATH=path.join(ROOT,'js/games-data.js');
const AUDIT_DIR=path.join(ROOT,'.audit');

let src=fs.readFileSync(CATALOG_PATH,'utf8');
src=src.replace(/^const\s+(GAME_GRADIENTS|GAMES)\s*=/gm,'var $1=');
let ctx={};
require('vm').createContext(ctx);
require('vm').runInContext(src, ctx);
const GAMES=ctx.GAMES;
const LIVE=GAMES.filter(g=>g.status==='live');

// header-only rule hint: take <title>, <meta name="description">,
// <meta property="og:description">, <h1> — strip HTML noise.
function ruleHint(html){
  const head = html.slice(0, 30000); // first 30 KB (header + meta)
  const title = (head.match(/<title>([^<]+)<\/title>/i) || [])[1] || '';
  const desc1 = (head.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i) || [])[1] || '';
  const desc2 = (head.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i) || [])[1] || '';
  const h1 = (head.match(/<h1[^>]*>([^<]+)<\/h1>/i) || [])[1] || '';
  // also try og:title
  const ogTitle = (head.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i) || [])[1] || '';
  const text = (title + ' ' + ogTitle + ' ' + h1 + ' ' + desc1 + ' ' + desc2).toLowerCase();
  const tokens = {};
  // PRECISE patterns (single-game mechanics, NOT generic puzzle words)
  const checks = [
    // Number-grid families
    ['sudoku',       /\bsudoku\b/],
    ['2048',         /\b2048\b/],
    ['minesweeper',  /\bminesweeper|mine\s*sweep/],
    ['kenken',       /\bkenken\b/],
    ['kakuro',       /\bkakuro\b/],
    ['futoshiki',    /\bfutoshiki\b/],
    ['str8ts',       /\bstr8ts\b/],
    ['slitherlink',  /\bslitherlink\b/],
    ['hitori',       /\bhitori\b/],
    ['nurikabe',     /\bnurikabe\b/],
    ['heyawake',     /\bheyawake\b/],
    ['tapa',         /\btapa\b/],
    ['yajilin',      /\byajilin\b/],
    ['akari',        /\b(?:akari|light\s*up)\b/],
    ['shakashaka',   /\bshakashaka\b/],
    ['shikaku',      /\bshikaku\b/],
    ['fillomino',    /\bfillomino\b/],
    ['masyu',        /\bmasyu\b/],
    ['tents',        /\btents?\s*(?:and|trees)?\b/],
    ['suguru',       /\bsuguru\b/],
    ['kuromasu',     /\bkuromasu\b/],
    ['numberlink',   /\bnumberlink\b/],
    ['tatamibari',   /\btatamibari\b/],
    ['ripple',       /\bripple\s*effect\b/],
    ['dosun',        /\bdosun\b/],
    ['queens',       /\bqueens?\s*puzzle\b/],
    ['train-tracks', /\btrain\s*tracks?\b/],
    ['spiral',       /\bspiral\s*galaxy\b/],
    ['family-tree',  /\bfamily\s*tree\b/],
    ['rule-rewrite', /\brule\s*rewrite\b/],
    ['skyscrapers',  /\bskyscrapers?\b/],
    ['bag-corral',   /\bbag\s*corral\b/],
    ['quoridor',     /\bquoridor\b/],
    ['reversi',      /\breversi\b/],
    ['tic-tac-toe',  /\btic\s*tac\s*toe\b/],
    ['gomoku',       /\bgomoku\b/],
    ['connect-4',    /\bconnect\s*(?:4|four)\b/],
    ['dominoes',     /\bdomino\b/],
    // Merge / drop / gravity
    ['merge',        /\bmerge|combine|stack\b(?!.*sudoku)/],
    ['drop-physics', /\bdrop|fall|gravity|fulcrum|balance|sand|marble/],
    ['cut-rope',     /\bcut\s+the\s+rope/],
    ['pull-pin',     /\bpull\s+the\s+pin\b|pull\s*pin/],
    // Color / sort
    ['sort-color',   /\bcolor\s*sort|crystal\s*sort|ball\s*sort\b/],
    ['color-cascade',/\bcolor\s*cascade|color\s*blend|color\s*helix/],
    // Sliding
    ['unblock',      /\bunblock\s*me|sliding\s*puzzle|number\s*slide/],
    // Block
    ['tetris',       /\btetris\b|wood\s*block|block\s*blast/],
    // Card
    ['solitaire',    /\bsolitaire\b/],
    ['card-game',    /\b(?:tripeaks|golf\s*solitaire|pyramid)/],
    // Word
    ['word-puzzle',  /\bword\s*(?:search|scapes|connections|cookies)|boggle|hangman|letter\s*boxed/],
    // Numbers
    ['number-match', /\bnumber\s*(?:match|slide)/],
    // Marble / physics
    ['physics-ball', /\bmarble\s*run|rope\s*rescue/],
    // Runners
    ['runner',       /\brunner\b(?!.*logic)/],
    ['slope',        /\bslope\b/],
    ['dino-runner',  /\bdino\b|\bt-?rex\b/],
  ];
  for(const [k,re] of checks) if(re.test(text)) tokens[k]=1;
  if(Object.keys(tokens).length===0) tokens['unknown']=1;
  return Object.keys(tokens).sort().join(',');
}

// tag-bucket signature: (cat, 'tag1 tag2')
const sigOf=g=>[g.cat, (g.tags||[]).slice(0,2).join(' ')];

const buckets={};
for(const g of LIVE){
  const k=sigOf(g).join(' | ');
  (buckets[k]=buckets[k]||[]).push(g);
}
const big=Object.entries(buckets).filter(([_,v])=>v.length>=3).sort((a,b)=>b[1].length-a[1].length);

console.log('=== R3 cluster candidates (≥3 same cat+tag-sig) ===');
console.log('total live:', LIVE.length);
console.log('big clusters:', big.length);

// For each big cluster, group by precise rule
const out=[];
for(const [sig,vs] of big){
  const enriched=vs.map(g=>{
    const idx=path.join(ROOT, g.url.replace(/^\//,'').replace(/\/$/,''), 'index.html');
    let hint='<missing>';
    try{ hint=ruleHint(fs.readFileSync(idx,'utf8')); }catch(e){ hint='<no index.html>'; }
    return {...g, rule: hint};
  });
  const byRule={};
  for(const g of enriched){
    (byRule[g.rule]=byRule[g.rule]||[]).push(g);
  }
  const groups=Object.entries(byRule).sort((a,b)=>b[1].length-a[1].length);
  out.push({sig, total: enriched.length, groups});
}

fs.writeFileSync(path.join(AUDIT_DIR,'r3-clusters.json'), JSON.stringify(out,null,2));

// Verdict: ONLY groups where ≥3 share IDENTICAL precise rule AND it's
// not a generic tag (e.g. 'puzzle', 'unknown' alone)
const verdict=[];
for(const cl of out){
  for(const [rule,gs] of cl.groups){
    const genericRules = ['puzzle', 'unknown', 'puzzle,unknown', 'puzzle,logic'];
    if(gs.length>=3 && !genericRules.includes(rule)){
      verdict.push({cluster: cl.sig, rule, count: gs.length, games: gs.map(g=>({name:g.name,url:g.url}))});
    }
  }
}

let md='# R3 cluster rule-read verdict (2026-07-20)\n\n';
md+='> Re-run of R2 verdict across all 536 live games with PRECISE header-only rule-hint.\n';
md+='> Cluster = same (cat, tag1+tag2) signature. rule = first tokens matching specific game-mechanics in <title>/<h1>/<meta desc>/og:title.\n\n';
md+=`## Big clusters (≥3 same cat+tag-sig): ${out.length}\n\n`;
for(const cl of out){
  md+=`### ${cl.total}× ${cl.sig}\n`;
  for(const [rule,gs] of cl.groups){
    md+=`- ${gs.length}× \`${rule}\`: ${gs.map(g=>g.name).join(', ')}\n`;
  }
  md+='\n';
}
md+=`## R3 dedup candidates (groups ≥3 with PRECISE identical rule, excluding generic tags)\n\n`;
if(verdict.length===0){
  md+='**No additional dedup candidates** beyond R2 merge-11 + racing-4 already resolved.\n';
}else{
  for(const v of verdict){
    md+=`### ${v.count}× ${v.cluster} → rule: ${v.rule}\n`;
    for(const g of v.games) md+=`- ${g.name} → ${g.url}\n`;
    md+='\n';
  }
}
fs.writeFileSync(path.join(AUDIT_DIR,'r3-verdict.md'), md);

console.log('\n=== R3 verdict summary ===');
console.log('R3 dedup candidates (≥3 same PRECISE rule):', verdict.length);
for(const v of verdict){
  console.log(`  ${v.count}× [${v.cluster}] rule="${v.rule}"`);
  for(const g of v.games) console.log(`     - ${g.name} → ${g.url}`);
}