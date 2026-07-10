# Bug #43b: Closure-in-loop var-i — `onclick=()=>fn(i)` captures post-loop value (R285 plinko P0)

**Date**: 2026-07-10 R285 cron tick
**Game**: plinko
**Severity**: P0 (game 100% unplayable — TypeError crashes startLevel before rAF can start)
**Related**: Bug #43 / R175 paper-io (closure-in-loop var-i)

## Symptom
Canvas blank (0 non-zero pixels), no render, after clicking any level button. Title screen OK, level-select OK, but clicking Level 1 → canvas stays black. HUD shows stale data. No console error visible without instrumentation.

## Root Cause
```js
function buildLevelGrid(){
  for(var i=1;i<=totalLevels;i++){
    var btn=document.createElement('button');
    // ... 
    if(i<=progress.unlocked){
      btn.onclick=()=>startLevel(i);  // ← BUG: arrow fn captures `i` by reference
    }
  }
}
```

`var i` is **hoisted** to function scope — there is only ONE `i` variable shared across all iterations. The arrow function `()=>startLevel(i)` closes over this single `i`. By the time any level button is clicked, the loop has finished and `i === totalLevels+1` (the post-increment value).

`startLevel(totalLevels+1)` → `initLevel(totalLevels+1)` → `LEVELS[totalLevels+1-1]` = `LEVELS[totalLevels]` = `undefined` → `target=undefined.t` → **`TypeError: Cannot read properties of undefined (reading 't')`**.

The TypeError aborts `startLevel` before it reaches `state='game'` and `requestAnimationFrame(loop)`. The rAF render chain never starts → canvas stays blank.

## Misleading First Diagnosis
Initial diagnosis was **Bug #20** (rAF chain never initiated) because the symptom matched exactly (canvas blank, no render). Adding `requestAnimationFrame(loop)` to `startLevel` did NOT fix it because the TypeError crashed before reaching that line. **The real bug was upstream** (closure-in-loop), not the rAF kick.

**Lesson**: When a fix "should work" but doesn't, install an error trap (`window.addEventListener('error',...)`) BEFORE assuming the fix is wrong. The closure bug was invisible without error instrumentation because it crashed silently in the IIFE.

## Detection (R0 static)
```bash
# Find onclick=()=>fn(i) or addEventListener fn(i) inside for(var i loops
python3 -c "
import os, re
for d in sorted(os.listdir('.')):
    idx = os.path.join(d, 'index.html')
    if not os.path.exists(idx): continue
    html = open(idx).read()
    # onclick=()=>fn(i) or ()=>fn(i) inside for(var i
    matches = re.findall(r'\.onclick\s*=\s*\([^)]*\)\s*=>\s*\w+\(i\)', html)
    if matches:
        # Check if the enclosing loop uses var (not let/forEach)
        onclick_pos = html.find('.onclick')
        region = html[max(0,onclick_pos-5000):onclick_pos]
        if re.search(r'for\s*\(\s*var\s+i\b', region) and not re.search(r'for\s*\(\s*let\s+i\b', region):
            print(f'{d}: REAL for(var i + onclick=i closure bug')
"
```

## Dynamic Detection (Kachilu)
```bash
cat > /tmp/eval-debug.js <<'EVAL'
(function(){
  window.__errs=[];
  window.addEventListener('error',function(e){window.__errs.push(String(e.message).substring(0,150));});
  window.__rafCount=0;
  var origRAF=window.requestAnimationFrame;
  window.requestAnimationFrame=function(fn){window.__rafCount++;return origRAF.call(window,fn);};
  return 'ready';
})()
EVAL
# After clicking level button:
# {rafCount:0, errors:["Cannot read properties of undefined (reading 't')"], nz:0}
# rafCount=0 + TypeError = closure-in-loop crash
```

## Fix (2 options)
**Option A — IIFE wrapper (classic fix, works with var):**
```js
btn.onclick=(function(lvl){return function(){startLevel(lvl);};})(i);
```

**Option B — Change var to let (ES6, simplest):**
```js
for(let i=1;i<=totalLevels;i++){  // let creates a new binding per iteration
  btn.onclick=()=>startLevel(i);  // now safe
}
```

## Plinko Verification (R285)
- **Before fix**: canvas 600×700, 0 non-zero pixels, TypeError in trap, rafCount=0
- **After fix (Option A)**: canvas 600×700, 420000/420000 pixels (100%), Target:50 displayed correctly, 0 errors

## Scope Check (R285)
Scanned all 38 games with `onclick=()=>fn(i)` pattern. **0 other games have this bug** — all 37 others use `let i` or `.forEach(function(_,i){...})` which are closure-safe. Plinko was the only game using `var i` in the loop.

## Commits
- `b9fd9e1e5b` — first fix attempt (Bug #20 rAF kick — necessary but insufficient)
- `d3c1db4c10` — real fix (closure-in-loop IIFE wrapper)
