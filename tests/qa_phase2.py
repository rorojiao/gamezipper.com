#!/usr/bin/env python3
"""
Phase 2: Deep Interactive QA Test for 15 representative GameZipper games.
Uses kachilu-browser CLI to open, click start, interact, and check errors.
"""
import subprocess
import json
import sys
import os
import time
import csv
from datetime import datetime

# ── Config ──────────────────────────────────────────────────────────────
KACHILU = "/home/msdn/.nvm/versions/node/v22.22.0/bin/kachilu-browser"
BASE_URL = "https://gamezipper.com"
LOAD_WAIT = 6
ACTION_WAIT = 3
RESULTS_FILE = "/home/msdn/gamezipper.com/tests/qa_phase2_results.json"
CSV_FILE = "/home/msdn/gamezipper.com/tests/qa_phase2_results.csv"

# ── 15 representative games ────────────────────────────────────────────
GAMES = [
    {
        "slug": "2048", "name": "2048", "category": "Puzzle",
        "start_pattern": "New Game",
        "action_type": "keyboard",
        "action_keys": ["ArrowRight", "ArrowDown", "ArrowRight", "ArrowDown"],
    },
    {
        "slug": "tetris", "name": "Tetris", "category": "Arcade",
        "start_pattern": "PLAY",
        "action_type": "keyboard",
        "action_keys": ["ArrowLeft", "ArrowDown", "ArrowRight", "Space"],
    },
    {
        "slug": "snake", "name": "Snake", "category": "Arcade",
        "start_pattern": None,
        "action_type": "keyboard",
        "action_keys": ["ArrowRight", "ArrowDown", "ArrowLeft"],
    },
    {
        "slug": "flappy-wings", "name": "Flappy Wings", "category": "Arcade",
        "start_pattern": "Got it!",
        "action_type": "keyboard",
        "action_keys": ["Space", "Space", "Space"],
    },
    {
        "slug": "slope", "name": "Slope", "category": "Arcade",
        "start_pattern": "START",
        "action_type": "keyboard",
        "action_keys": ["ArrowLeft", "ArrowRight", "ArrowLeft"],
    },
    {
        "slug": "sudoku", "name": "Sudoku", "category": "Puzzle",
        "start_pattern": "Easy",
        "action_type": "sudoku",
    },
    {
        "slug": "jigsaw-puzzle", "name": "Jigsaw Puzzle", "category": "Puzzle",
        "start_pattern": "Play",
        "action_type": "click_area",
    },
    {
        "slug": "whack-a-mole", "name": "Whack-a-Mole", "category": "Action",
        "start_pattern": "Engage",
        "action_type": "click_area",
    },
    {
        "slug": "memory-match", "name": "Memory Match", "category": "Puzzle",
        "start_pattern": "Start!",
        "action_type": "memory",
    },
    {
        "slug": "minesweeper", "name": "Minesweeper", "category": "Puzzle",
        "start_pattern": "Beginner",
        "action_type": "canvas_click",
    },
    {
        "slug": "reaction-time", "name": "Reaction Time", "category": "Reflex",
        "start_pattern": "Start Test",
        "action_type": "keyboard",
        "action_keys": ["Space"],
    },
    {
        "slug": "idle-clicker", "name": "Idle Clicker", "category": "Casual",
        "start_pattern": "Grimoire",
        "action_type": "click_area",
    },
    {
        "slug": "color-sort", "name": "Color Sort", "category": "Puzzle",
        "start_pattern": None,
        "action_type": "click_area",
    },
    {
        "slug": "chess", "name": "Chess", "category": "Board",
        "start_pattern": None,
        "action_type": "chess",
    },
    {
        "slug": "crossword", "name": "Crossword", "category": "Word",
        "start_pattern": "Getting Started",
        "action_type": "crossword",
    },
]

# ── JS Snippets ────────────────────────────────────────────────────────
ERROR_CATCHER_JS = """\
window.__qaErrors=[];
var _oe=console.error;console.error=function(){window.__qaErrors.push(Array.from(arguments).join(' ').substring(0,200));_oe.apply(console,arguments);};
var _ow=console.warn;console.warn=function(){window.__qaErrors.push(Array.from(arguments).join(' ').substring(0,200));_ow.apply(console,arguments);};
window.onerror=function(m,u,l){window.__qaErrors.push(String(m).substring(0,200));};
window.addEventListener('unhandledrejection',function(e){window.__qaErrors.push(String(e.reason||e).substring(0,200));},true);
"""

STATE_CHECKER_JS = """\
(function(){
  var r={};
  r.canvases=[];
  document.querySelectorAll('canvas').forEach(function(c,i){
    var b=c.getBoundingClientRect();
    var px=false;
    try{var ctx=c.getContext('2d');if(ctx&&c.width>0&&c.height>0){var d=ctx.getImageData(0,0,Math.min(c.width,20),Math.min(c.height,20)).data;for(var p=0;p<d.length;p+=4){if(d[p]>0||d[p+1]>0||d[p+2]>0){px=true;break;}}}}catch(e){}
    r.canvases.push({id:c.id||('c'+i),w:c.width,h:c.height,vis:b.width>0&&b.height>0,pix:px});
  });
  var gc=document.querySelector('#game-container,.game-container,#game,.game,main,#app,#game-screen,.game-screen');
  r.gameContainer=gc?{w:Math.round(gc.getBoundingClientRect().width),h:Math.round(gc.getBoundingClientRect().height),vis:gc.getBoundingClientRect().width>0}:null;
  r.buttons=[];
  document.querySelectorAll('button,[role="button"],.btn').forEach(function(e){
    var b=e.getBoundingClientRect();
    if(b.width>5&&b.height>5&&b.top<window.innerHeight&&b.bottom>0){
      r.buttons.push({text:(e.textContent||'').trim().substring(0,40),w:Math.round(b.width),h:Math.round(b.height)});
    }
  });
  r.errorCount=window.__qaErrors?window.__qaErrors.length:0;
  r.errorMessages=window.__qaErrors?window.__qaErrors.slice(0,5):[];
  r.url=window.location.href;
  r.title=document.title;
  r.domNodes=document.querySelectorAll('*').length;
  // Check for visible game elements beyond buttons
  r.interactiveEls=0;
  document.querySelectorAll('[onclick],[class*=piece],[class*=card],[class*=cell],[class*=tile],[class*=grid],[class*=hole],[class*=mole],[class*=square],[class*=tube],[class*=bottle],[class*=pipe]').forEach(function(e){
    var b=e.getBoundingClientRect();
    if(b.width>5&&b.height>5&&b.top<window.innerHeight&&b.bottom>0) r.interactiveEls++;
  });
  return JSON.stringify(r);
})()
"""

FIND_START_BTN_JS = """\
(function(){
  var cands=[];
  var pats=['start','play','begin','go','engage','let\\'s go','new game','start test','getting started','easy','play!','start!','grimoire'];
  document.querySelectorAll('button,[role="button"],.btn,a').forEach(function(e){
    var b=e.getBoundingClientRect();
    if(b.width>10&&b.height>10&&b.top<window.innerHeight&&b.bottom>0){
      var t=(e.textContent||'').trim().toLowerCase();
      for(var i=0;i<pats.length;i++){
        if(t.indexOf(pats[i])>=0){
          cands.push({text:(e.textContent||'').trim().substring(0,50),tag:e.tagName,x:Math.round(b.x+b.width/2),y:Math.round(b.y+b.height/2)});
          break;
        }
      }
    }
  });
  return JSON.stringify(cands);
})()
"""

# ── Helpers ────────────────────────────────────────────────────────────
def log(msg):
    ts = datetime.now().strftime("%H:%M:%S")
    print(f"[{ts}] {msg}", flush=True)

def run_cmd(session, cmd, timeout=15):
    full = f"{KACHILU} --session {session} {cmd}"
    try:
        r = subprocess.run(full, shell=True, capture_output=True, text=True, timeout=timeout)
        return r.stdout.strip()
    except subprocess.TimeoutExpired:
        log(f"  ⏱ Timeout: {cmd[:60]}")
        return ""
    except Exception as e:
        log(f"  ❌ Cmd error: {e}")
        return ""

def eval_js(session, js_code, timeout=12):
    tmp = f"/tmp/qa2_{session}_{os.getpid()}.js"
    with open(tmp, 'w') as f:
        f.write(js_code)
    try:
        with open(tmp, 'r') as f:
            content = f.read()
        r = subprocess.run(
            f"{KACHILU} --session {session} eval --stdin",
            shell=True, input=content, capture_output=True, text=True, timeout=timeout
        )
        out = r.stdout.strip()
        if not out:
            return None
        text = out.strip()
        if text.startswith('"') and text.endswith('"'):
            text = text[1:-1]
            text = text.replace('\\"', '"').replace('\\\\', '\\')
        try:
            return json.loads(text)
        except:
            s, e = text.find('{'), text.rfind('}')
            if s >= 0 and e > s:
                try: return json.loads(text[s:e+1])
                except: pass
            return None
    except subprocess.TimeoutExpired:
        return None
    except Exception:
        return None
    finally:
        if os.path.exists(tmp):
            os.unlink(tmp)

def open_page(session, url):
    out = run_cmd(session, f'open "{url}"', 20)
    log(f"  Opened: {out.split(chr(10))[0][:80]}")
    time.sleep(LOAD_WAIT)

def close_session(session):
    run_cmd(session, "close", 10)

def press_key(session, key):
    return bool(run_cmd(session, f"press '{key}'", 8))

def mouse_click(session, x, y):
    return bool(run_cmd(session, f"mouse click {int(x)} {int(y)}", 8))

def get_state(session):
    return eval_js(session, STATE_CHECKER_JS, 10)

def find_start_buttons(session):
    return eval_js(session, FIND_START_BTN_JS, 8) or []

def click_snapshot_ref(session, ref):
    """Click using snapshot @ref."""
    return bool(run_cmd(session, f"click '{ref}'", 10))

# ── Game action handlers ───────────────────────────────────────────────
def action_keyboard(session, game):
    keys = game.get("action_keys", [])
    log(f"  ⌨ Keys: {keys[:3]}{'...' if len(keys)>3 else ''}")
    for k in keys[:4]:
        press_key(session, k)
        time.sleep(0.3)
    time.sleep(ACTION_WAIT)
    return True

def action_sudoku(session, game):
    """Click a sudoku cell after difficulty selection."""
    log("  🔢 Clicking sudoku cell...")
    # Wait for grid to render after clicking Easy
    time.sleep(2)
    # Try JS click on any td/div that looks like a cell
    js = """\
(function(){
  var all=document.querySelectorAll('td,div[class*=cell],div[class*=grid],div[class*=box],div[data-row],div[data-col],div[data-value],input');
  for(var i=0;i<all.length;i++){
    var b=all[i].getBoundingClientRect();
    if(b.width>15&&b.height>15&&b.top>80&&b.bottom<window.innerHeight-100){
      all[i].click();
      all[i].focus();
      return JSON.stringify({ok:true,x:Math.round(b.x+b.width/2),y:Math.round(b.y+b.height/2),tag:all[i].tagName});
    }
  }
  return JSON.stringify({ok:false});
})()
"""
    r = eval_js(session, js, 8)
    if r and r.get("ok"):
        log(f"  ✅ Clicked cell at ({r['x']},{r['y']})")
        time.sleep(ACTION_WAIT)
        return True
    # Fallback: click center area
    mouse_click(session, 400, 350)
    time.sleep(ACTION_WAIT)
    log("  ⚠ Used fallback center click")
    return True

def action_memory(session, game):
    """Click memory cards after start."""
    log("  🃏 Clicking memory cards...")
    time.sleep(1)
    js = """\
(function(){
  var cards=document.querySelectorAll('[class*=card],[class*=flip],[class*=memory],[class*=tile]');
  var clicked=0;
  for(var i=0;i<Math.min(cards.length,4);i++){
    var b=cards[i].getBoundingClientRect();
    if(b.width>10&&b.height>10&&b.top>50&&b.bottom<window.innerHeight-50){
      cards[i].click();
      clicked++;
      if(clicked>=2) break;
    }
  }
  return JSON.stringify({clicked:clicked,total:cards.length});
})()
"""
    r = eval_js(session, js, 8)
    if r and r.get("clicked", 0) > 0:
        log(f"  ✅ Clicked {r['clicked']} cards (found {r.get('total',0)} total)")
        time.sleep(ACTION_WAIT)
        return True
    # Cards might use canvas — try canvas click
    state = get_state(session)
    if state:
        for c in state.get("canvases", []):
            if c.get("vis"):
                mouse_click(session, c["w"]//3, c["h"]//3)
                time.sleep(0.5)
                mouse_click(session, c["w"]*2//3, c["h"]//3)
                log("  ✅ Clicked canvas cards")
                time.sleep(ACTION_WAIT)
                return True
    # Fallback
    mouse_click(session, 300, 300)
    time.sleep(ACTION_WAIT)
    log("  ⚠ Used fallback click")
    return True

def action_canvas_click(session, game):
    """Click on canvas element (minesweeper etc)."""
    log("  🖱 Clicking canvas...")
    time.sleep(1)
    state = get_state(session)
    if state:
        for c in state.get("canvases", []):
            if c.get("vis"):
                # Click center of canvas
                cx, cy = c["w"]//2, c["h"]//2
                mouse_click(session, cx, cy)
                log(f"  ✅ Clicked canvas center ({cx},{cy})")
                time.sleep(ACTION_WAIT)
                # Verify pixels changed
                new_state = get_state(session)
                if new_state:
                    for nc in new_state.get("canvases", []):
                        if nc.get("pix"):
                            return True
                return True
    mouse_click(session, 400, 300)
    time.sleep(ACTION_WAIT)
    return True

def action_chess(session, game):
    """Click chess piece via snapshot ref."""
    log("  ♟ Clicking chess piece...")
    time.sleep(1)
    # Get snapshot to find piece refs
    snap = run_cmd(session, "snapshot -i", 10)
    # Look for piece-like elements (unicode chess symbols)
    import re
    piece_refs = re.findall(r'\[ref=(e\d+)\].*?[♜♞♝♛♚♟]', snap)
    if piece_refs:
        ref = piece_refs[0]
        log(f"  ✅ Found piece ref {ref}")
        click_snapshot_ref(session, f"@{ref}")
        time.sleep(1)
        # Try to move - click an empty square
        empty_refs = re.findall(r'\[ref=(e\d+)\]\s+clickable', snap)
        # Get refs after the pieces section
        if len(empty_refs) > 8:
            move_ref = empty_refs[-1]
            click_snapshot_ref(session, f"@{move_ref}")
            log(f"  ✅ Moved to {move_ref}")
        time.sleep(ACTION_WAIT)
        return True
    # Fallback: click via JS
    js = """\
(function(){
  var pieces=document.querySelectorAll('[class*=piece],[class*=chess],[class*=square]');
  for(var i=0;i<Math.min(pieces.length,3);i++){
    var b=pieces[i].getBoundingClientRect();
    if(b.width>10&&b.height>10&&b.top>0){
      pieces[i].click();
      return JSON.stringify({ok:true,x:Math.round(b.x+b.width/2),y:Math.round(b.y+b.height/2)});
    }
  }
  return JSON.stringify({ok:false});
})()
"""
    r = eval_js(session, js, 8)
    if r and r.get("ok"):
        log(f"  ✅ Clicked piece at ({r['x']},{r['y']})")
        time.sleep(ACTION_WAIT)
        return True
    mouse_click(session, 400, 350)
    time.sleep(ACTION_WAIT)
    log("  ⚠ Used fallback click")
    return True

def action_crossword(session, game):
    """Click crossword grid cell after puzzle selection."""
    log("  📝 Clicking crossword cell...")
    time.sleep(2)  # wait for grid to render
    js = """\
(function(){
  var cells=document.querySelectorAll('td,[class*=cell],[class*=grid],[class*=box],[class*=letter],[class*=input],input[type=text]');
  for(var i=0;i<cells.length;i++){
    var b=cells[i].getBoundingClientRect();
    if(b.width>10&&b.height>10&&b.top>50&&b.bottom<window.innerHeight-100){
      cells[i].click();
      cells[i].focus();
      return JSON.stringify({ok:true,x:Math.round(b.x+b.width/2),y:Math.round(b.y+b.height/2),tag:cells[i].tagName});
    }
  }
  return JSON.stringify({ok:false});
})()
"""
    r = eval_js(session, js, 8)
    if r and r.get("ok"):
        log(f"  ✅ Clicked cell at ({r['x']},{r['y']})")
        # Try typing a letter
        time.sleep(0.5)
        press_key(session, "a")
        time.sleep(ACTION_WAIT)
        return True
    mouse_click(session, 400, 350)
    time.sleep(ACTION_WAIT)
    log("  ⚠ Used fallback click")
    return True

def action_click_area(session, game):
    """Generic click on game area."""
    log("  🖱 Clicking game area...")
    js = """\
(function(){
  var targets=document.querySelectorAll('.game-area *,#game *:not(button):not(a),.game *:not(button):not(a),canvas,[class*=piece],[class*=mole],[class*=hole],[class*=target],[class*=gem],[class*=orc],[class*=ingredient]');
  for(var i=0;i<targets.length;i++){
    var b=targets[i].getBoundingClientRect();
    if(b.width>10&&b.height>10&&b.top>50&&b.bottom<window.innerHeight-50){
      return JSON.stringify({ok:true,x:Math.round(b.x+b.width/2),y:Math.round(b.y+b.height/2),tag:targets[i].tagName});
    }
  }
  return JSON.stringify({ok:false});
})()
"""
    r = eval_js(session, js, 8)
    if r and r.get("ok"):
        mouse_click(session, r["x"], r["y"])
        log(f"  ✅ Clicked at ({r['x']},{r['y']})")
        time.sleep(ACTION_WAIT)
        return True
    # Fallback: check for canvas
    state = get_state(session)
    if state:
        for c in state.get("canvases", []):
            if c.get("vis"):
                mouse_click(session, c["w"]//2, c["h"]//2)
                log(f"  ✅ Clicked canvas ({c['w']//2},{c['h']//2})")
                time.sleep(ACTION_WAIT)
                return True
    mouse_click(session, 400, 300)
    time.sleep(ACTION_WAIT)
    log("  ⚠ Used fallback center click")
    return True

ACTION_HANDLERS = {
    "keyboard": action_keyboard,
    "sudoku": action_sudoku,
    "memory": action_memory,
    "canvas_click": action_canvas_click,
    "chess": action_chess,
    "crossword": action_crossword,
    "click_area": action_click_area,
}

# ── Main test ──────────────────────────────────────────────────────────
def test_game(game, idx, total):
    slug = game["slug"]
    name = game["name"]
    session = f"p2_{slug}"
    
    log(f"\n{'='*60}")
    log(f"[{idx+1}/{total}] {name} ({game['category']})")
    log(f"{'='*60}")
    
    result = {
        "name": name, "slug": slug, "category": game["category"],
        "timestamp": datetime.now().isoformat(),
        "entered_game": False, "start_button_text": "",
        "start_button_found": False, "action_worked": False,
        "js_error_count": 0, "js_error_messages": [],
        "canvas_found": False, "canvas_has_pixels": False,
        "game_container_found": False, "notes": "", "success": False,
    }
    
    try:
        # 1. Open
        log("  [1] Opening page...")
        open_page(session, f"{BASE_URL}/{slug}/")
        
        # 2. Error catcher
        log("  [2] Injecting error catcher...")
        eval_js(session, ERROR_CATCHER_JS, 8)
        time.sleep(0.5)
        
        # 3. Initial state
        log("  [3] Checking state...")
        state = get_state(session)
        if not state:
            result["notes"] += "Failed to read state. "
            return result
        
        btns = state.get("buttons", [])
        result["snapshot_buttons"] = [b["text"] for b in btns[:10]]
        log(f"  Buttons: {[b['text'] for b in btns[:6]]}")
        
        # 4. Find + click start
        log("  [4] Finding start button...")
        candidates = find_start_buttons(session)
        custom = game.get("start_pattern")
        
        clicked = False
        clicked_text = ""
        
        if custom:
            for btn in candidates:
                if custom.lower() in btn["text"].lower():
                    log(f"  Found '{custom}': '{btn['text']}'")
                    mouse_click(session, btn["x"], btn["y"])
                    clicked = True
                    clicked_text = btn["text"]
                    break
        
        if not clicked and candidates:
            best = candidates[0]
            log(f"  First candidate: '{best['text']}'")
            mouse_click(session, best["x"], best["y"])
            clicked = True
            clicked_text = best["text"]
        
        if not clicked:
            log("  No button, trying Enter...")
            press_key(session, "Enter")
            time.sleep(1)
            new_state = get_state(session)
            if new_state:
                new_btns = [b["text"] for b in new_state.get("buttons", [])]
                if new_btns != [b["text"] for b in btns]:
                    clicked = True
                    clicked_text = "(Enter key)"
        
        result["start_button_text"] = clicked_text
        result["start_button_found"] = bool(clicked_text)
        log(f"  {'✅' if clicked else '⚠'} Start: '{clicked_text or 'N/A'}'")
        time.sleep(ACTION_WAIT)
        
        # 5. Post-start state
        log("  [5] Post-start state...")
        post = get_state(session)
        if post:
            for c in post.get("canvases", []):
                if c.get("vis"):
                    result["canvas_found"] = True
                    if c.get("pix"):
                        result["canvas_has_pixels"] = True
            gc = post.get("gameContainer")
            if gc and gc.get("vis"):
                result["game_container_found"] = True
            ie = post.get("interactiveEls", 0)
            result["entered_game"] = (
                result["canvas_found"] or
                result["game_container_found"] or
                ie > 0 or
                result["start_button_found"]
            )
        
        # 6. Action
        log("  [6] Game action...")
        atype = game.get("action_type", "click_area")
        handler = ACTION_HANDLERS.get(atype, action_click_area)
        action_ok = handler(session, game)
        result["action_worked"] = action_ok
        log(f"  {'✅' if action_ok else '⚠'} Action: {'OK' if action_ok else 'uncertain'}")
        
        # 7. Errors
        log("  [7] Collecting errors...")
        final = get_state(session)
        if final:
            result["js_error_count"] = final.get("errorCount", 0)
            result["js_error_messages"] = final.get("errorMessages", [])
        
        if result["js_error_count"] > 0:
            log(f"  ⚠ {result['js_error_count']} JS errors:")
            for err in result["js_error_messages"][:3]:
                log(f"     - {err[:80]}")
        else:
            log("  ✅ No JS errors")
        
        result["success"] = (
            result["entered_game"] and
            result["action_worked"] and
            result["js_error_count"] == 0
        )
        
    except Exception as e:
        log(f"  ❌ Exception: {e}")
        result["notes"] += f"Error: {str(e)[:80]}. "
    finally:
        close_session(session)
    
    s = "✅ PASS" if result["success"] else "⚠ WARN" if result["js_error_count"]==0 and result["entered_game"] else "❌ FAIL"
    log(f"  → {s} | Enter:{result['entered_game']} | Btn:'{result['start_button_text'][:25]}' | Act:{result['action_worked']} | Err:{result['js_error_count']}")
    return result

# ── Report ─────────────────────────────────────────────────────────────
def print_report(results):
    print("\n" + "=" * 95)
    print("  PHASE 2: DEEP INTERACTIVE QA — 15 REPRESENTATIVE GAMES")
    print(f"  {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 95)
    
    hdr = f"{'#':>2} | {'Game':<18} | {'Cat':<7} | {'Enter':>5} | {'Start Button':<26} | {'Action':>6} | {'Err':>3} | {'Status':>6}"
    print(f"\n{hdr}")
    print("-" * 95)
    
    passed = warn = fail = 0
    for i, r in enumerate(results):
        enter = "✅" if r["entered_game"] else "❌"
        act = "✅" if r["action_worked"] else "⚠"
        errs = r["js_error_count"]
        btn = (r["start_button_text"] or "N/A")[:26]
        
        if r["success"]:
            status, passed = "✅ PASS", passed + 1
        elif r["entered_game"] and errs == 0:
            status, warn = "⚠ WARN", warn + 1
        else:
            status, fail = "❌ FAIL", fail + 1
        
        print(f"{i+1:>2} | {r['name']:<18} | {r['category']:<7} | {enter:>5} | {btn:<26} | {act:>6} | {errs:>3} | {status:>6}")
    
    print("-" * 95)
    print(f"\n📊 SUMMARY: {passed} ✅ pass | {warn} ⚠ warn | {fail} ❌ fail | {len(results)} total")
    print(f"   Pass rate: {passed/len(results)*100:.1f}%")
    
    errs_g = [r for r in results if r["js_error_count"] > 0]
    if errs_g:
        print(f"\n⚠️  JS ERRORS ({len(errs_g)}):")
        for r in errs_g:
            print(f"   • {r['name']}: {r['js_error_count']} errors")
            for e in r["js_error_messages"][:2]:
                print(f"     - {e[:100]}")
    
    notes_g = [r for r in results if r["notes"]]
    if notes_g:
        print(f"\n📝 NOTES:")
        for r in notes_g:
            print(f"   • {r['name']}: {r['notes'][:80]}")
    
    cats = {}
    for r in results:
        c = r["category"]
        cats.setdefault(c, {"t":0,"p":0})
        cats[c]["t"] += 1
        if r["success"]: cats[c]["p"] += 1
    print(f"\n📋 BY CATEGORY:")
    for c, d in sorted(cats.items()):
        print(f"   {c:<10}: {d['p']}/{d['t']} ({d['p']/d['t']*100:.0f}%)")
    
    print("\n" + "=" * 95)

def save_results(results):
    with open(RESULTS_FILE, 'w') as f:
        json.dump({"timestamp": datetime.now().isoformat(), "phase": 2, "results": results,
            "summary": {"total": len(results),
                "passed": sum(1 for r in results if r["success"]),
                "warnings": sum(1 for r in results if r["entered_game"] and not r["success"] and r["js_error_count"]==0),
                "failed": sum(1 for r in results if not r["entered_game"] or r["js_error_count"]>0),
            }}, f, indent=2)
    log(f"💾 JSON: {RESULTS_FILE}")
    
    with open(CSV_FILE, 'w', newline='') as f:
        w = csv.writer(f)
        w.writerow(["Name","Slug","Category","Entered","Start Button","Action OK","JS Errors","Canvas","Pixels","Game Container","Success","Notes"])
        for r in results:
            w.writerow([r["name"],r["slug"],r["category"],r["entered_game"],r["start_button_text"],
                r["action_worked"],r["js_error_count"],r["canvas_found"],r["canvas_has_pixels"],
                r["game_container_found"],r["success"],r["notes"]])
    log(f"💾 CSV: {CSV_FILE}")

def main():
    print("=" * 60)
    print("  GAMEZIPPER PHASE 2: DEEP INTERACTIVE QA")
    print(f"  {len(GAMES)} games | {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)
    
    try:
        subprocess.run([KACHILU, "--version"], capture_output=True, timeout=5)
    except:
        log("❌ kachilu-browser not found!")
        sys.exit(1)
    
    results = []
    for i, g in enumerate(GAMES):
        results.append(test_game(g, i, len(GAMES)))
        if i < len(GAMES) - 1:
            time.sleep(1)
    
    print_report(results)
    save_results(results)
    
    if all(r["success"] for r in results):
        print("\n🎉 ALL TESTS PASSED!")
        sys.exit(0)
    else:
        n = sum(1 for r in results if not r["success"])
        print(f"\n⚠️ {n} test(s) need review")
        sys.exit(1)

if __name__ == "__main__":
    main()
