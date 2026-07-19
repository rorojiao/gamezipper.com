'use strict';
// Forked worker for one code-robot level — receives LEVEL via IPC, runs the same
// BFS solver logic, prints results as `OUT:KEY:value` lines so the parent can parse.
process.on('message', m => {
  if (!m || m.cmd !== 'solve') return;
  const lv = m.level;
  const BASE = ['FWD','TL','TR','JMP','LIT'];
  const allMask = (1 << lv.lights.length) - 1;
  function transition(st, cmd, li){
    let {r,c,d,m} = st;
    if(cmd==='FWD'){
      const nr=r+[-1,0,1,0][d], nc=c+[0,1,0,-1][d];
      if(nr<0||nr>=lv.gridH||nc<0||nc>=lv.gridW||lv.grid[nr][nc]==='X'||lv.grid[nr][nc]==='H')return null;
      return {r:nr,c:nc,d,m};
    }
    if(cmd==='JMP'){
      const nr=r+2*[-1,0,1,0][d], nc=c+2*[0,1,0,-1][d];
      if(nr<0||nr>=lv.gridH||nc<0||nc>=lv.gridW||lv.grid[nr][nc]==='X')return null;
      return {r:nr,c:nc,d,m};
    }
    if(cmd==='TL')return {r,c,d:(d+3)%4,m};
    if(cmd==='TR')return {r,c,d:(d+1)%4,m};
    if(cmd==='LIT'){
      const i=li.get(`${r},${c}`);
      if(i===undefined)return null;
      return {r,c,d,m:m^(1<<i)};
    }
    return null;
  }
  const li = new Map(lv.lights.map((p,i)=>[p.join(','),i]));
  let sr=-1, sc=-1;
  for (let r=0;r<lv.gridH;r++) for (let c=0;c<lv.gridW;c++) if (lv.grid[r][c]==='S'){sr=r;sc=c;}
  function gen(maxLen, filter){
    const out=[];
    const rec = p => {
      if(p.length===maxLen){ if(filter(p)) out.push(p.join(',')); return; }
      for (const c of BASE) rec(p.concat(c));
    };
    rec([]);
    return out;
  }
  const p1s = lv.p1 ? gen(lv.p1, p => p.includes('LIT') && p.some(c=>c==='FWD'||c==='JMP')) : [];
  const p2s = lv.p2 ? gen(lv.p2, p => p.includes('LIT') && p.some(c=>c==='FWD'||c==='JMP')) : [];
  // cap to MAX_SUMMARIES=600 (diversity-ranked)
  const MAX_SUMMARIES=600;
  function buildLTS(seqStr){
    const seq = seqStr.split(',');
    const map = new Map();
    for (let r=0;r<lv.gridH;r++) for (let c=0;c<lv.gridW;c++)
      if (lv.grid[r][c]!=='X'&&lv.grid[r][c]!=='H')
        for (let d=0;d<4;d++) for (let m=0;m<=allMask;m++){
          let st={r,c,d,m}, ok=true;
          for (const cmd of seq){
            const ns = transition(st,cmd,li);
            if(!ns){ok=false;break;}
            st=ns;
          }
          if(ok) map.set(`${r},${c},${d},${m}`, st);
        }
    return map;
  }
  let p1LTS = p1s.map(buildLTS);
  if (p1LTS.length > MAX_SUMMARIES){
    p1LTS.sort((a,b)=>b.size-a.size);
    p1LTS.length = MAX_SUMMARIES;
  }
  let p2LTS = p2s.map(buildLTS);
  if (p2LTS.length > MAX_SUMMARIES){
    p2LTS.sort((a,b)=>b.size-a.size);
    p2LTS.length = MAX_SUMMARIES;
  }
  // Layer BFS
  let layer = new Map();
  layer.set(`${sr},${sc},${lv.startDir},0`, []);
  const MAX_LAYER = 200000;
  for (let depth = 0; depth < lv.slots; depth++) {
    const next = new Map();
    for (const [k, prog] of layer) {
      const [r,c,d,m] = k.split(',').map(Number);
      if (lv.grid[r][c]==='G' && m===allMask){
        process.stdout.write('OUT:SOL:'+prog.join(' | ')+'\n');
        process.exit(0);
      }
      const st = {r,c,d,m};
      for (const cmd of BASE){
        const ns = transition(st, cmd, li);
        if (!ns) continue;
        const np = prog.concat(cmd);
        const nk = `${ns.r},${ns.c},${ns.d},${ns.m}`;
        if (!next.has(nk)){
          if (next.size >= MAX_LAYER) continue;
          next.set(nk, np);
        }
      }
      for (let k=0;k<p1LTS.length;k++){
        const ns = p1LTS[k].get(`${st.r},${st.c},${st.d},${st.m}`) || null;
        if (!ns) continue;
        const np = prog.concat('P1['+p1s[k]+']');
        const nk = `${ns.r},${ns.c},${ns.d},${ns.m}`;
        if (!next.has(nk)){
          if (next.size >= MAX_LAYER) continue;
          next.set(nk, np);
        }
      }
      for (let k=0;k<p2LTS.length;k++){
        const ns = p2LTS[k].get(`${st.r},${st.c},${st.d},${st.m}`);
        if (!ns) continue;
        const np = prog.concat('P2['+p2s[k]+']');
        const nk = `${ns.r},${ns.c},${ns.d},${ns.m}`;
        if (!next.has(nk)){
          if (next.size >= MAX_LAYER) continue;
          next.set(nk, np);
        }
      }
    }
    layer = next;
    if (layer.size === 0) break;
  }
  process.stdout.write('OUT:STATUS:NONE\n');
  process.exit(0);
});
