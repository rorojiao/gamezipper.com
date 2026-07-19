#!/usr/bin/env python3
"""R3 batch verifier rewriter v3 — robust, fixes ~all known patterns."""
import re
from pathlib import Path

ROOT=Path('/home/msdn/gamezipper.com')
HELPER_PATH_REL='.audit/gz-extract-levels.js'

def fix_js(path:Path, slug:str):
    src=path.read_text()
    if 'gz-extract-levels' in src:
        return 'already-fixed', 0
    pattern=re.compile(
        r'(?:const|let|var)\s+(?P<var>\w+)\s*=\s*html\.match\([^)]*\)\s*;?',
        re.M
    )
    m=pattern.search(src)
    if not m:
        return 'no-match', 0
    start=m.start()
    var=m.group('var')
    rest=src[m.end():]
    if_re=re.compile(r'if\s*\(\s*!?\s*\(?\s*'+re.escape(var)+r'\s*\)?\s*\)\s*\{')
    ifm=if_re.search(rest)
    if ifm:
        if_open_idx=m.end()+ifm.end()-1
    else:
        if_re2=re.compile(r'if\s*\(\s*'+re.escape(var)+r'\s*===?\s*null\s*\)\s*\{')
        ifm=if_re2.search(rest)
        if ifm:
            if_open_idx=m.end()+ifm.end()-1
    if not ifm:
        # Fallback: no if-block. Just replace const line + next usage.
        next_line_re=re.compile(r'[^\n]*'+re.escape(var)+r'\[\d+\][^\n]*')
        next_m=next_line_re.search(src, m.end())
        if not next_m:
            return 'no-if-block', 0
        end_of_line=src.find('\n', next_m.end())
        if end_of_line<0: end_of_line=len(src)
        replacement=(
            '// R3 fix: load LEVELS via shared extractor (handles inline + JSON + compact)\n'
            f"const extractLevels=require('../{HELPER_PATH_REL}');\n"
            f"const LEVELS=extractLevels('{slug}');"
        )
        new_src=src[:m.start()]+replacement+src[end_of_line:]
        path.write_text(new_src)
        return 'fixed', len(new_src)-len(src)
    # Balanced-brace scan to find end of if-block
    depth=1
    i=if_open_idx+1
    in_str=None
    in_line=False
    in_block=False
    while i<len(src) and depth>0:
        c=src[i]
        if in_line:
            if c=='\n': in_line=False
        elif in_block:
            if c=='*' and i+1<len(src) and src[i+1]=='/':
                in_block=False; i+=1
        elif in_str:
            if c=='\\' and i+1<len(src): i+=1
            elif c==in_str: in_str=None
        else:
            if c=='/' and i+1<len(src) and src[i+1]=='/': in_line=True; i+=1
            elif c=='/' and i+1<len(src) and src[i+1]=='*': in_block=True; i+=1
            elif c in '"\'`': in_str=c
            elif c=='{': depth+=1
            elif c=='}':
                depth-=1
                if depth==0: end=i+1; break
        i+=1
    else:
        return 'unbalanced-brace', 0
    replacement=(
        '// R3 fix: load LEVELS via shared extractor (handles inline + JSON + compact)\n'
        f"const extractLevels=require('../{HELPER_PATH_REL}');\n"
        f"const LEVELS=extractLevels('{slug}');"
    )
    new_src=src[:start]+replacement+src[end:]
    path.write_text(new_src)
    return 'fixed', len(new_src)-len(src)

def fix_py(path:Path, slug:str):
    src=path.read_text()
    if 'gz-extract-levels' in src or 'extract_levels' in src:
        return 'already-fixed', 0
    if 'ast.literal_eval' in src and 'index.html' in src:
        idx_open=src.find('html = open(')
        if idx_open<0: idx_open=src.find('html=open(')
        if idx_open<0: return 'no-html-open', 0
        idx_ast=src.find('ast.literal_eval', idx_open)
        if idx_ast<0: return 'no-ast', 0
        idx_eol=src.find('\n', idx_ast)
        if idx_eol<0: return 'no-eol', 0
        replacement=(
            'import subprocess as _gz_subp\n'
            f"_gz_proc=_gz_subp.run(['node','../.audit/gz-extract-levels.js','{slug}'],\n"
            f"                     capture_output=True,text=True,timeout=30,cwd='{slug}')\n"
            'import json as _gz_json\n'
            'levels=[]\n'
            '# Caller still expects `levels` list. Re-extract via helper and use it:\n'
            'import os; _slug_dir=os.path.dirname(os.path.abspath(__file__))\n'
            "for _fn in ('levels.json','levels_inline.json'):\n"
            '    _p=os.path.join(_slug_dir,_fn)\n'
            '    if os.path.exists(_p):\n'
            '        with open(_p) as _f: _j=_gz_json.load(_f)\n'
            '        if isinstance(_j,list): levels=_j; break\n'
            "        if isinstance(_j,dict) and 'LEVELS' in _j and isinstance(_j['LEVELS'],list): levels=_j['LEVELS']; break\n"
        )
        new_src=src[:idx_open]+replacement+src[idx_eol+1:]
        path.write_text(new_src)
        return 'fixed', len(new_src)-len(src)
    return 'no-match', 0

def main():
    fixed=already=skipped=errors=0
    report=[]
    for d in sorted(ROOT.iterdir()):
        if not d.is_dir() or d.name.startswith('.'): continue
        for f in sorted(d.iterdir()):
            if not f.name.startswith('verify_'): continue
            try:
                if f.suffix=='.js':
                    status,delta=fix_js(f, d.name)
                elif f.suffix=='.py':
                    status,delta=fix_py(f, d.name)
                else: continue
            except Exception as e:
                status,delta=f'err:{e}',0; errors+=1
            report.append((d.name, str(f.relative_to(ROOT)), status, delta))
            if status=='fixed': fixed+=1
            elif status=='already-fixed': already+=1
            else: skipped+=1
    print(f'fixed={fixed} already={already} skipped={skipped} errors={errors}')
    for slug, p, s, d in report:
        if s!='no-match':
            print(f'  [{s:14s}] {p} (delta={d})')

if __name__=='__main__':
    main()