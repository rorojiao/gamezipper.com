#!/usr/bin/env node
/*
 * Hexa-Bridges in-engine verifier.
 *
 * Verifies that for each level, the unique stored solution drawn via DOM
 * clicks triggers the win condition (Check button → win overlay appears).
 *
 * Uses Playwright headless via Python (no JS Playwright here — minimal Node).
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

// Generate a Python script that tests each level via Playwright
const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'levels.json'), 'utf8'));
const levels = data.levels;
const url = 'http://127.0.0.1:8765/hexa-bridges/';

const py = `
import asyncio
import json
from playwright.async_api import async_playwright

URL = 'http://127.0.0.1:8765/hexa-bridges/'

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        ctx = await browser.new_context(viewport={'width': 1280, 'height': 800})
        page = await ctx.new_page()
        passed = 0
        failed = []
        for lv_idx in range(30):
            await page.goto(URL, wait_until='networkidle')
            # Unlock all previous levels
            stars = {str(i): 3 for i in range(lv_idx + 1)}
            await page.evaluate("localStorage.setItem('gz-hexa-bridges-progress-v1', JSON.stringify({stars: " + json.dumps(stars) + ", bestTime: {}}))")
            await page.reload(wait_until='networkidle')
            await page.wait_for_timeout(500)
            await page.click('#btn-play')
            await page.wait_for_timeout(300)
            await page.evaluate(f"""
                () => {{
                    const btns = document.querySelectorAll('#screen-levels .lvl-btn.unlocked');
                    if (btns[{lv_idx}]) btns[{lv_idx}].click();
                    else throw new Error('No button at idx ' + {lv_idx});
                }}
            """)
            await page.wait_for_timeout(500)
            sol = await page.evaluate(f"window.__LEVELS_DATA.LEVELS[{lv_idx}].solution")
            for a, b in sol:
                s1 = f"{a[0]},{a[1]}"
                s2 = f"{b[0]},{b[1]}"
                js_key = s1 + '|' + s2 if s1 < s2 else s2 + '|' + s1
                await page.evaluate(f"""
                    () => {{
                        const e = document.querySelector('[data-edge="{js_key}"]');
                        if (e) e.dispatchEvent(new MouseEvent('click', {{bubbles: true}}));
                    }}
                """)
                await page.wait_for_timeout(10)
            await page.evaluate("document.getElementById('btn-check').click()")
            await page.wait_for_timeout(300)
            win = await page.evaluate("document.getElementById('overlay-win').classList.contains('show')")
            if win:
                passed += 1
            else:
                failed.append(lv_idx + 1)
        print(f'verify_engine: {passed}/30 PASS')
        if failed:
            for lv in failed: print(f'  Level {lv}: FAIL')
            exit(1)
        await browser.close()

asyncio.run(main())
`;

// Write to temp file
const pyFile = '/tmp/_hexa_engine_test.py';
fs.writeFileSync(pyFile, py);

// Run Python
const result = spawnSync('python3', [pyFile], { encoding: 'utf8' });
console.log(result.stdout);
if (result.stderr) console.error(result.stderr);
process.exit(result.status);
