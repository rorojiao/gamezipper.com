#!/usr/bin/env python3
"""Deep Playwright test for a single game - test every level and feature."""
import sys, json, time, asyncio
from playwright.async_api import async_playwright

GAME = sys.argv[1] if len(sys.argv) > 1 else "2048"
URL = f"https://gamezipper.com/{GAME}/"

async def test_game():
    results = {"game": GAME, "url": URL, "errors": [], "screenshots": [], "features_tested": [], "levels_found": []}
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True, args=['--no-sandbox'])
        
        # Test desktop
        page = await browser.new_page(viewport={"width": 1280, "height": 720})
        errors = []
        page.on("pageerror", lambda e: errors.append(str(e)))
        console_msgs = []
        page.on("console", lambda msg: console_msgs.append(f"{msg.type}: {msg.text}") if msg.type in ("error", "warning") else None)
        
        try:
            await page.goto(URL, wait_until="networkidle", timeout=30000)
        except Exception as e:
            results["errors"].append(f"Load error: {e}")
            await browser.close()
            print(json.dumps(results, indent=2))
            return
        
        await page.wait_for_timeout(3000)
        results["screenshots"].append(f"/tmp/deep_{GAME}_desktop_loaded.png")
        await page.screenshot(path=f"/tmp/deep_{GAME}_desktop_loaded.png")
        
        if errors:
            results["errors"].extend([f"desktop: {e}" for e in errors])
        
        # Try to find game elements
        canvas_count = await page.locator("canvas").count()
        button_count = await page.locator("button").count()
        
        results["features_tested"].append(f"Page loaded. Canvas: {canvas_count}, Buttons: {button_count}")
        
        # Try clicking start/play button
        for selector in ["button:has-text('Start')", "button:has-text('Play')", "button:has-text('开始')", 
                         "#start-btn", ".start-btn", "[data-action='start']"]:
            try:
                btn = page.locator(selector).first
                if await btn.count() > 0:
                    await btn.click(timeout=3000)
                    results["features_tested"].append(f"Clicked start button: {selector}")
                    await page.wait_for_timeout(2000)
                    results["screenshots"].append(f"/tmp/deep_{GAME}_desktop_after_start.png")
                    await page.screenshot(path=f"/tmp/deep_{GAME}_desktop_after_start.png")
                    break
            except:
                pass
        
        # Try clicking on canvas to start
        if canvas_count > 0:
            canvas = page.locator("canvas").first
            box = await canvas.bounding_box()
            if box:
                cx, cy = box["x"] + box["width"]/2, box["y"] + box["height"]/2
                await canvas.click()
                results["features_tested"].append("Clicked canvas center")
                await page.wait_for_timeout(1000)
                # Try some keyboard inputs
                for key in ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " ", "Enter"]:
                    await page.keyboard.press(key)
                results["features_tested"].append("Tested keyboard inputs (arrows, space, enter)")
                await page.wait_for_timeout(1000)
                results["screenshots"].append(f"/tmp/deep_{GAME}_desktop_gameplay.png")
                await page.screenshot(path=f"/tmp/deep_{GAME}_desktop_gameplay.png")
        
        # Look for level indicators
        level_text = await page.evaluate("""() => {
            const body = document.body.innerText;
            const levelMatch = body.match(/level\\s*\\d+/gi) || body.match(/关卡\\s*\\d+/g) || [];
            return levelMatch;
        }""")
        if level_text:
            results["levels_found"] = level_text
        
        # Test mobile viewport
        mob_page = await browser.new_page(viewport={"width": 390, "height": 844})
        mob_errors = []
        mob_page.on("pageerror", lambda e: mob_errors.append(str(e)))
        try:
            await mob_page.goto(URL, wait_until="networkidle", timeout=30000)
            await mob_page.wait_for_timeout(3000)
            results["screenshots"].append(f"/tmp/deep_{GAME}_mobile_loaded.png")
            await mob_page.screenshot(path=f"/tmp/deep_{GAME}_mobile_loaded.png")
            if mob_errors:
                results["errors"].extend([f"mobile: {e}" for e in mob_errors])
            # Check overflow
            overflow = await mob_page.evaluate("document.documentElement.scrollWidth > document.documentElement.clientWidth")
            if overflow:
                results["errors"].append("mobile: horizontal overflow detected")
        except Exception as e:
            results["errors"].append(f"mobile load error: {e}")
        
        # Collect all console errors
        if console_msgs:
            results["errors"].extend([f"console: {m}" for m in console_msgs[:10]])
        
        await browser.close()
    
    print(json.dumps(results, indent=2, ensure_ascii=False))

asyncio.run(test_game())
