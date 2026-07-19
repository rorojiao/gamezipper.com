#!/usr/bin/env node
/**
 * In-engine Suraromu verifier.
 * Loads index.html, extracts LEVELS, parses them, and runs the in-engine
 * checkWin logic against each solution to verify all 30 levels are solvable.
 */
const fs = require('fs');
const vm = require('vm');

const html = fs.readFileSync('index.html', 'utf8');

// Extract the LEVELS array
// R3 fix: load LEVELS via shared extractor (handles inline + JSON + compact)
const extractLevels=require('../.audit/gz-extract-levels.js');
const LEVELS=extractLevels('suraromu');
const levelsJSON = m[1];

// Parse levels
console.log(`Loaded ${LEVELS.length} levels`);

function edgeKey(r1,c1,r2,c2){
  if(r1>r2||(r1===r2&&c1>c2)){var t=[r1,c1];r1=r2;c1=c2;r2=t[0];c2=t[1]}
  return r1+','+c1+','+r2+','+c2;
}

let pass = 0, fail = 0;
for (let idx = 0; idx < LEVELS.length; idx++) {
  const L = LEVELS[idx];
  const cols = L[0], rows = L[1];
  const blackStr = L[3];
  const startR = L[4], startC = L[5], startNum = L[6];
  const gatesStr = L[7];
  const solStr = L[9];

  // Parse black set
  const blackSet = {};
  if (blackStr) {
    blackStr.split('|').forEach(p => {
      const [r,c] = p.split(',').map(Number);
      blackSet[r+','+c] = true;
    });
  }

  // Parse gates
  const gates = [];
  if (gatesStr) {
    gatesStr.split('|').forEach(g => {
      const parts = g.split(',');
      gates.push({cell:[parseInt(parts[0]),parseInt(parts[1])],dir:parts[2]});
    });
  }

  // Parse solution edges and build drawnEdges
  const drawnEdges = {};
  const solEdges = [];
  if (solStr) {
    solStr.split('|').forEach(e => {
      const parts = e.split(',').map(Number);
      const a = [parts[0],parts[1]], b = [parts[2],parts[3]];
      solEdges.push([a,b]);
      drawnEdges[edgeKey(a[0],a[1],b[0],b[1])] = true;
    });
  }

  // === In-engine checkWin logic ===
  const keys = Object.keys(drawnEdges).filter(k => drawnEdges[k]);
  let ok = true;
  let reason = '';

  if (keys.length < 4) { ok = false; reason = 'too few edges'; }

  if (ok) {
    // build adjacency
    const adj = {};
    keys.forEach(k => {
      const parts = k.split(',');
      const a = parts[0]+','+parts[1], b = parts[2]+','+parts[3];
      if (!adj[a]) adj[a] = [];
      if (!adj[b]) adj[b] = [];
      adj[a].push(b); adj[b].push(a);
    });

    // every node degree 2
    for (const node in adj) {
      if (adj[node].length !== 2) { ok = false; reason = `node ${node} has degree ${adj[node].length}`; break; }
    }

    if (ok) {
      const startKey = startR + ',' + startC;
      if (!adj[startKey]) { ok = false; reason = 'start not on loop'; }
      if (ok) {
        // trace loop
        const visited = {};
        let cur = startKey, prev = null;
        const order = [];
        let step;
        for (step = 0; step < keys.length + 1; step++) {
          if (visited[cur]) {
            if (step === keys.length && cur === startKey) break;
            ok = false; reason = `loop revisit at ${cur} step ${step}`;
            break;
          }
          visited[cur] = true;
          order.push(cur);
          const next = adj[cur][0] === prev ? adj[cur][1] : adj[cur][0];
          prev = cur; cur = next;
        }
        if (ok && order.length !== keys.length) { ok = false; reason = `order length ${order.length} != edges ${keys.length}`; }
        if (ok) {
          // all gates on path
          for (const g of gates) {
            const gk = g.cell[0]+','+g.cell[1];
            if (visited[gk] !== true) { ok = false; reason = `gate ${gk} not on path`; break; }
          }
        }
      }
    }
  }

  if (ok) { pass++; }
  else { fail++; console.log(`L${idx+1} FAIL: ${reason}`); }
}

console.log(`\nIn-engine verifier: ${pass}/${LEVELS.length} PASS, ${fail} FAIL`);
process.exit(fail > 0 ? 1 : 0);
