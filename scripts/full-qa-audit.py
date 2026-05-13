#!/usr/bin/env python3
"""
GameZipper 全站质检脚本 — 5层检测
Usage: python3 full-qa-audit.py [--url URL] [--output DIR]

检测层:
  1. HTTP 健康检查（状态码、响应时间、SSL）
  2. JS 错误 + 资源 404（通过 Kachilu eval）
  3. Lighthouse 性能/SEO/可访问性评分
  4. 游戏功能检测（Canvas渲染、游戏元素）
  5. Monetag 广告渲染检测（iframe、zone加载）

工具链: Playwright + Kachilu + Lighthouse (全部已安装)
"""

import json
import os
import re
import sys
import time
import argparse
import subprocess
from datetime import datetime, timezone, timedelta
from pathlib import Path
from urllib.parse import urlparse

# ── 配置 ──────────────────────────────────────────
TZ_SH = timezone(timedelta(hours=8))
NOW = datetime.now(TZ_SH)

# ── 自动定位 kachilu-browser ───────────────────
def _find_kachilu_browser():
    """Locate kachilu-browser binary (installed via npm under nvm)."""
    import shutil
    path = shutil.which("kachilu-browser")
    if path:
        return path
    # Fallback: scan nvm node bin directories
    nvm_dir = os.path.expanduser("~/.nvm/versions/node")
    if os.path.isdir(nvm_dir):
        for ver in sorted(os.listdir(nvm_dir), reverse=True):
            candidate = os.path.join(nvm_dir, ver, "bin", "kachilu-browser")
            if os.path.isfile(candidate):
                return candidate
    return None

KACHILU_BROWSER = _find_kachilu_browser()


def parse_kachilu_eval(stdout_text: str) -> dict:
    """统一解析 Kachilu eval 输出（处理多种格式）"""
    stdout_text = stdout_text.strip()
    if not stdout_text:
        return {}
    # 格式1: "JSON..." (外层引号包裹 + 转义)
    if stdout_text.startswith('"') and stdout_text.endswith('"'):
        stdout_text = stdout_text[1:-1]
        stdout_text = stdout_text.replace('\\"', '"').replace('\\\\', '\\')
    # 格式2: 带前缀文本
    elif not stdout_text.startswith("{"):
        json_match = re.search(r'\{.*\}', stdout_text, re.DOTALL)
        stdout_text = json_match.group(0) if json_match else "{}"
    data = json.loads(stdout_text)
    # 格式3: 双重JSON
    if isinstance(data, str):
        data = json.loads(data)
    return data if isinstance(data, dict) else {}

SITES = [
    {"name": "GameZipper主站", "url": "https://gamezipper.com", "type": "game"},
    {"name": "GameZipper工具站", "url": "https://tools.gamezipper.com", "type": "tools"},
]

# 抽查的游戏页面（从 sitemap 或热门列表取）
SAMPLE_GAMES = [
    "https://gamezipper.com/2048/",
    "https://gamezipper.com/color-sort/",
    "https://gamezipper.com/dessert-blast/",
]

# Monetag zones 参考
MONETAG_ZONES = {
    "gamezipper.com": {"popunder": 10687757, "push": 10687756},
    "tools.gamezipper.com": {"popunder": 10689347, "push": 10689346},
}

OUTPUT_DIR = None


def log(msg: str, level: str = "info"):
    ts = datetime.now(TZ_SH).strftime("%H:%M:%S")
    prefix = {"info": "ℹ️", "ok": "✅", "warn": "⚠️", "error": "❌", "audit": "🔍"}.get(level, "•")
    print(f"[{ts}] {prefix} {msg}")


# ══════════════════════════════════════════════════
# 层 1: HTTP 健康检查
# ══════════════════════════════════════════════════
def check_http_health(url: str) -> dict:
    """用 curl 做 HTTP 健康检查"""
    result = {
        "url": url,
        "status_code": None,
        "response_time_ms": None,
        "ssl_expiry_days": None,
        "redirects": 0,
        "content_type": None,
        "issues": [],
    }

    try:
        # 检测是否有 mihomo 代理可用
        proxy = None
        try:
            proxy_check = subprocess.run(
                ["curl", "-sS", "-o", "/dev/null", "-w", "%{http_code}",
                 "--max-time", "3", "-x", "http://127.0.0.1:7890", "https://httpbin.org/ip"],
                timeout=5, capture_output=True, text=True
            )
            if proxy_check.stdout.strip() == "200":
                proxy = "http://127.0.0.1:7890"
        except Exception:
            pass

        # curl -o /dev/null -w 格式化输出
        cmd = [
            "curl", "-sS", "-o", "/dev/null",
            "-w", "%{http_code}|%{time_total}|%{redirect_url}|%{content_type}|%{ssl_verify_result}|%{num_redirects}",
            "-L", "--max-time", "15", url,
        ]
        if proxy:
            cmd.extend(["-x", proxy])

        # 代理失败时自动回退直连（exit 35 = SSL_ERROR_SYSCALL）
        try:
            out = subprocess.check_output(cmd, stderr=subprocess.PIPE, timeout=20).decode().strip()
        except subprocess.CalledProcessError:
            if proxy:
                # 去掉代理重试
                cmd_no_proxy = [c for c in cmd if c != proxy and c != "-x"]
                out = subprocess.check_output(cmd_no_proxy, stderr=subprocess.PIPE, timeout=20).decode().strip()
            else:
                raise
        parts = out.split("|")

        result["status_code"] = int(parts[0]) if parts[0].isdigit() else 0
        result["response_time_ms"] = round(float(parts[1]) * 1000) if len(parts) > 1 and parts[1] else 0
        result["content_type"] = parts[3] if len(parts) > 3 else "unknown"
        result["redirects"] = int(parts[5]) if len(parts) > 5 else 0

        if result["status_code"] >= 400:
            result["issues"].append(f"HTTP {result['status_code']} - 服务器错误")
        elif result["response_time_ms"] > 5000:
            result["issues"].append(f"响应时间 {result['response_time_ms']}ms 超过 5s 阈值")

        # SSL 检查
        try:
            domain = urlparse(url).hostname
            cert_out = subprocess.check_output(
                ["echo", "|", "openssl", "s_client", "-connect", f"{domain}:443", "-servername", domain, "2>/dev/null"],
                shell=True, timeout=10
            ).decode()
            expiry_match = re.search(r"notAfter=(.+)", cert_out)
            if expiry_match:
                from email.utils import parsedate_to_datetime
                expiry = parsedate_to_datetime(expiry_match.group(1).strip())
                days_left = (expiry.replace(tzinfo=None) - datetime.now()).days
                result["ssl_expiry_days"] = days_left
                if days_left < 30:
                    result["issues"].append(f"SSL 证书 {days_left} 天后过期")
        except Exception:
            pass

    except subprocess.TimeoutExpired:
        result["issues"].append("请求超时（15s）")
    except Exception as e:
        result["issues"].append(f"HTTP 检查失败: {e}")

    return result


# ══════════════════════════════════════════════════
# 层 2: JS 错误 + 资源 404 (Kachilu)
# ══════════════════════════════════════════════════
def check_js_errors(url: str) -> dict:
    """用 Kachilu Browser 检测 JS 错误和资源 404"""
    result = {
        "url": url,
        "js_errors": [],
        "failed_resources": [],
        "console_warnings": [],
        "issues": [],
    }

    js_code = """
    JSON.stringify({
        jsErrors: window.__kachiluErrors || [],
        consoleErrors: window.__kachiluConsoleErrors || [],
        failedResources: [...performance.getEntriesByType("resource")]
            .filter(r => r.responseStatus >= 400)
            .map(r => ({ url: r.name.slice(0, 100), status: r.responseStatus })),
        longTasks: [...performance.getEntriesByType("longtask")].length
    })
    """

    try:
        # 启动 Kachilu 会话
        session = "qa-full-" + datetime.now().strftime("%H%M%S")
        subprocess.run(
            [KACHILU_BROWSER, "--session", session, "open", url],
            timeout=30, capture_output=True
        )
        time.sleep(5)  # 等待页面加载完成

        # 注入错误收集器
        error_collector = """
        window.__kachiluErrors = [];
        window.__kachiluConsoleErrors = [];
        const origError = console.error;
        console.error = function(...args) {
            window.__kachiluConsoleErrors.push(args.map(a => String(a)).slice(0, 200));
            origError.apply(console, args);
        };
        window.addEventListener('error', e => {
            window.__kachiluErrors.push({ msg: e.message, file: e.filename?.slice(-60), line: e.lineno });
        });
        """
        proc = subprocess.run(
            [KACHILU_BROWSER, "--session", session, "eval", error_collector],
            timeout=10, capture_output=True, text=True
        )

        time.sleep(3)  # 等待更多错误触发

        # 收集结果
        proc = subprocess.run(
            [KACHILU_BROWSER, "--session", session, "eval", js_code],
            timeout=10, capture_output=True, text=True
        )
        try:
            data = parse_kachilu_eval(proc.stdout)
            result["js_errors"] = data.get("jsErrors", [])
            result["console_warnings"] = data.get("consoleErrors", [])
            result["failed_resources"] = data.get("failedResources", [])

            if result["js_errors"]:
                result["issues"].append(f"{len(result['js_errors'])} 个 JS 运行时错误")
            if result["failed_resources"]:
                result["issues"].append(f"{len(result['failed_resources'])} 个资源加载失败(4xx/5xx)")
        except json.JSONDecodeError:
            result["issues"].append("Kachilu eval 返回非 JSON（可能页面未加载）")

        # 清理
        subprocess.run(
            [KACHILU_BROWSER, "close", "--session", session],
            timeout=10, capture_output=True
        )

    except subprocess.TimeoutExpired:
        result["issues"].append("Kachilu 会话超时")
    except FileNotFoundError:
        result["issues"].append("Kachilu Browser CLI 未安装")
    except Exception as e:
        result["issues"].append(f"JS 检测异常: {e}")

    return result


# ══════════════════════════════════════════════════
# 层 3: Lighthouse 审计
# ══════════════════════════════════════════════════
def check_lighthouse(url: str, output_dir: str) -> dict:
    """运行 Lighthouse 审计"""
    result = {
        "url": url,
        "performance": None,
        "accessibility": None,
        "best_practices": None,
        "seo": None,
        "issues": [],
        "report_file": None,
    }

    try:
        report_file = os.path.join(output_dir, f"lighthouse-{urlparse(url).hostname}.json")
        cmd = [
            "npx", "lighthouse", url,
            "--output=json",
            "--output-path", report_file,
            "--chrome-flags=--headless --no-sandbox --disable-gpu",
            "--only-categories=performance,accessibility,best-practices,seo",
            "--quiet",
        ]
        subprocess.run(cmd, timeout=120, capture_output=True)

        if os.path.exists(report_file):
            with open(report_file) as f:
                data = json.load(f)

            cats = data.get("categories", {})
            result["performance"] = cats.get("performance", {}).get("score")
            result["accessibility"] = cats.get("accessibility", {}).get("score")
            result["best_practices"] = cats.get("best-practices", {}).get("score")
            result["seo"] = cats.get("seo", {}).get("score")
            result["report_file"] = report_file

            if result["performance"] and result["performance"] < 0.5:
                result["issues"].append(f"性能评分 {result['performance']*100:.0f}/100 — 需优化")
            if result["seo"] and result["seo"] < 0.7:
                result["issues"].append(f"SEO 评分 {result['seo']*100:.0f}/100 — 需优化")
            if result["accessibility"] and result["accessibility"] < 0.7:
                result["issues"].append(f"可访问性 {result['accessibility']*100:.0f}/100 — 需优化")
        else:
            result["issues"].append("Lighthouse 报告未生成")

    except subprocess.TimeoutExpired:
        result["issues"].append("Lighthouse 超时（120s）")
    except Exception as e:
        result["issues"].append(f"Lighthouse 异常: {e}")

    return result


# ══════════════════════════════════════════════════
# 层 4: 游戏功能检测
# ══════════════════════════════════════════════════
def check_game_functionality(url: str) -> dict:
    """检测游戏页面核心功能"""
    result = {
        "url": url,
        "has_canvas": False,
        "canvas_size": None,
        "has_splash": False,
        "has_game_ui": False,
        "game_loaded": False,
        "issues": [],
    }

    js_code = """
    JSON.stringify({
        hasCanvas: !!document.querySelector('canvas'),
        canvasSize: (() => { const c = document.querySelector('canvas'); return c ? {w: c.width, h: c.height} : null; })(),
        hasSplash: !!document.getElementById('splash-screen'),
        hasGameUI: !!document.querySelector('#game-container, .game-wrapper, #game-canvas'),
        scripts: [...document.querySelectorAll('script[src]')].filter(s => /game|phaser|pixi|kontra/.test(s.src)).map(s => s.src.split('/').pop()),
        gameTitle: document.title,
        h1: document.querySelector('h1')?.textContent?.trim()?.slice(0, 80) || 'NONE',
    })
    """

    try:
        session = "qa-game-" + datetime.now().strftime("%H%M%S")
        subprocess.run(
            [KACHILU_BROWSER, "--session", session, "open", url],
            timeout=30, capture_output=True
        )
        time.sleep(6)  # 游戏加载需要更久

        proc = subprocess.run(
            [KACHILU_BROWSER, "--session", session, "eval", js_code],
            timeout=10, capture_output=True, text=True
        )

        try:
            data = parse_kachilu_eval(proc.stdout)
            result["has_canvas"] = data.get("hasCanvas", False)
            result["canvas_size"] = data.get("canvasSize")
            result["has_splash"] = data.get("hasSplash", False)
            result["has_game_ui"] = data.get("hasGameUI", False)
            result["game_title"] = data.get("gameTitle", "")
            result["h1"] = data.get("h1", "")

            if not result["has_canvas"]:
                result["issues"].append("未检测到 Canvas 元素 — 游戏可能未加载")
            elif result["canvas_size"] and (result["canvas_size"]["w"] < 100 or result["canvas_size"]["h"] < 100):
                result["issues"].append(f"Canvas 尺寸异常: {result['canvas_size']}")
            else:
                result["game_loaded"] = True

        except json.JSONDecodeError:
            result["issues"].append("游戏检测 eval 解析失败")

        subprocess.run(
            [KACHILU_BROWSER, "close", "--session", session],
            timeout=10, capture_output=True
        )

    except subprocess.TimeoutExpired:
        result["issues"].append("游戏检测超时")
    except Exception as e:
        result["issues"].append(f"游戏检测异常: {e}")

    return result


# ══════════════════════════════════════════════════
# 层 5: Monetag 广告渲染检测
# ══════════════════════════════════════════════════
def check_monetag_ads(url: str, site_type: str) -> dict:
    """检测 Monetag 广告脚本加载和渲染状态"""
    result = {
        "url": url,
        "magsrv_loaded": False,
        "ad_iframes": 0,
        "ad_script_loaded": False,
        "zone_ids_found": [],
        "issues": [],
    }

    domain = urlparse(url).hostname or ""
    zones = MONETAG_ZONES.get(domain, {})

    js_code = f"""
    JSON.stringify({{
        magsrvLoaded: [...performance.getEntriesByType("resource")].some(r => /magsrv\\.com|monetag\\.com/.test(r.name)),
        adIframes: document.querySelectorAll('iframe').length,
        monetagScript: !!document.querySelector('script[src*="magsrv"]'),
        gzMonetagSafe: typeof window.GZMonetagSafe,
        zoneIdsFound: [...document.querySelectorAll('script')].map(s => s.textContent).join(' ').match(/zoneId['":\\s]+(\\d+)/g) || [],
        allIframes: [...document.querySelectorAll('iframe')].map(f => ({{src: f.src?.slice(0,100), id: f.id}})),
        performanceAds: [...performance.getEntriesByType("resource")].filter(r => /magsrv|monetag|ad/.test(r.name)).map(r => ({{name: r.name.slice(0,80), size: r.transferSize}})),
        monetagScripts: [...document.querySelectorAll('script[src*="monetag"],script[src*="magsrv"]')].map(s => s.src.slice(0,80))
    }})
    """

    try:
        session = "qa-ad-" + datetime.now().strftime("%H%M%S")
        subprocess.run(
            [KACHILU_BROWSER, "--session", session, "open", url],
            timeout=30, capture_output=True
        )
        time.sleep(5)  # 广告脚本异步加载

        proc = subprocess.run(
            [KACHILU_BROWSER, "--session", session, "eval", js_code],
            timeout=10, capture_output=True, text=True
        )

        try:
            data = parse_kachilu_eval(proc.stdout)

            # 用 performanceAds 里是否有 magsrv/monetag 来判断
            perf_ads = data.get("performanceAds", [])
            result["magsrv_loaded"] = any(
                "magsrv" in a.get("name", "") or "monetag" in a.get("name", "")
                for a in perf_ads if isinstance(a, dict)
            )
            result["ad_iframes"] = data.get("adIframes", 0)
            result["ad_script_loaded"] = data.get("monetagScript", False)
            result["zone_ids_found"] = data.get("zoneIdsFound", [])
            result["performance_ads"] = perf_ads

            if not result["magsrv_loaded"]:
                result["issues"].append("magsrv.com 资源未加载 — 广告脚本可能被阻止")

            # 检查已知 placeholder zones
            placeholder_zones = {10687758, 10687759, 10689348}
            for zone_id_str in result["zone_ids_found"]:
                try:
                    zid = int(re.search(r'\d+', zone_id_str).group())
                    if zid in placeholder_zones:
                        result["issues"].append(f"检测到 placeholder zone {zid} — 浪费带宽")
                except (AttributeError, ValueError):
                    pass

        except json.JSONDecodeError:
            result["issues"].append("广告检测 eval 解析失败")

        subprocess.run(
            [KACHILU_BROWSER, "close", "--session", session],
            timeout=10, capture_output=True
        )

    except subprocess.TimeoutExpired:
        result["issues"].append("广告检测超时")
    except Exception as e:
        result["issues"].append(f"广告检测异常: {e}")

    return result


# ══════════════════════════════════════════════════
# 报告生成
# ══════════════════════════════════════════════════
def generate_report(all_results: dict, output_dir: str) -> str:
    """生成可读的质检报告"""
    lines = []
    lines.append(f"🧪 GameZipper 全站质检报告")
    lines.append(f"📅 {NOW.strftime('%Y-%m-%d %H:%M')} (Asia/Shanghai)")
    lines.append(f"{'='*50}")
    lines.append("")

    total_issues = 0
    critical_count = 0

    for site_name, checks in all_results.items():
        lines.append(f"📍 {site_name}")
        lines.append(f"{'─'*40}")

        # 层 1: HTTP
        http = checks.get("http", {})
        if http:
            status = http.get("status_code", "?")
            time_ms = http.get("response_time_ms", "?")
            icon = "✅" if status and status < 400 else "❌"
            lines.append(f"  {icon} HTTP: {status} | {time_ms}ms | SSL: {http.get('ssl_expiry_days', '?')}天")
            for issue in http.get("issues", []):
                lines.append(f"     ⚠️ {issue}")
                total_issues += 1
                if "HTTP 5" in issue or "超时" in issue:
                    critical_count += 1

        # 层 2: JS 错误
        js = checks.get("js", {})
        if js:
            js_err_count = len(js.get("js_errors", []))
            failed_res_count = len(js.get("failed_resources", []))
            icon = "✅" if js_err_count == 0 and failed_res_count == 0 else "⚠️"
            lines.append(f"  {icon} JS错误: {js_err_count} | 资源失败: {failed_res_count}")
            for e in js.get("js_errors", [])[:5]:
                lines.append(f"     • {e.get('msg', e)[:80]}")
            for r in js.get("failed_resources", [])[:5]:
                lines.append(f"     • [{r.get('status')}] {r.get('url', '')}")
            total_issues += js_err_count + failed_res_count

        # 层 3: Lighthouse
        lh = checks.get("lighthouse", {})
        if lh and lh.get("performance") is not None:
            def score_str(v):
                return f"{v*100:.0f}" if v is not None else "?"
            perf = score_str(lh.get("performance"))
            a11y = score_str(lh.get("accessibility"))
            seo = score_str(lh.get("seo"))
            bp = score_str(lh.get("best_practices"))
            icon = "✅" if lh.get("performance", 0) >= 0.5 else "⚠️"
            lines.append(f"  {icon} Lighthouse: 性能{perf} | 可访问{a11y} | 最佳实践{bp} | SEO{seo}")
            for issue in lh.get("issues", []):
                lines.append(f"     ⚠️ {issue}")
                total_issues += 1

        # 层 4: 游戏
        game = checks.get("game", {})
        if game:
            icon = "✅" if game.get("game_loaded") else "❌"
            canvas_info = f"Canvas: {game.get('canvas_size', '无')}" if game.get("has_canvas") else "无 Canvas"
            splash = " | Splash: ✅" if game.get("has_splash") else ""
            lines.append(f"  {icon} 游戏: {canvas_info}{splash}")
            for issue in game.get("issues", []):
                lines.append(f"     ⚠️ {issue}")
                total_issues += 1
                critical_count += 1

        # 层 5: 广告
        ads = checks.get("ads", {})
        if ads:
            icon = "✅" if ads.get("magsrv_loaded") else "⚠️"
            monetag_scripts = ads.get("performance_ads", [])
            monetag_count = len([a for a in monetag_scripts if isinstance(a, dict) and ("magsrv" in a.get("name","") or "monetag" in a.get("name",""))])
            lines.append(f"  {icon} 广告: monetag={monetag_count}个资源 | iframe={ads.get('ad_iframes', 0)}")
            for issue in ads.get("issues", []):
                lines.append(f"     ⚠️ {issue}")
                total_issues += 1

        lines.append("")

    # 总结
    lines.append(f"{'='*50}")
    icon = "✅" if critical_count == 0 else "🚨"
    lines.append(f"{icon} 总结: {total_issues} 个问题 | {critical_count} 个严重 | 0 个崩溃")
    lines.append(f"   检测站点: {len(all_results)} | 时间: {NOW.strftime('%H:%M:%S')}")

    report = "\n".join(lines)
    return report


def main():
    global OUTPUT_DIR

    parser = argparse.ArgumentParser(description="GameZipper 全站质检")
    parser.add_argument("--url", help="只检测指定 URL")
    parser.add_argument("--output", default="/tmp/gamezipper-qa", help="输出目录")
    parser.add_argument("--skip-lighthouse", action="store_true", help="跳过 Lighthouse（省时间）")
    parser.add_argument("--skip-games", action="store_true", help="跳过游戏功能检测")
    args = parser.parse_args()

    OUTPUT_DIR = args.output
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    log("🧪 GameZipper 全站质检开始", "audit")
    all_results = {}

    # ── 主站检测 ──
    for site in SITES:
        site_name = site["name"]
        url = args.url or site["url"]
        log(f"检测 {site_name}: {url}")

        checks = {}

        # 层 1: HTTP
        log("  层1: HTTP 健康检查...")
        checks["http"] = check_http_health(url)

        # 层 2: JS 错误
        log("  层2: JS 错误检测...")
        checks["js"] = check_js_errors(url)

        # 层 3: Lighthouse
        if not args.skip_lighthouse:
            log("  层3: Lighthouse 审计...")
            checks["lighthouse"] = check_lighthouse(url, OUTPUT_DIR)
        else:
            log("  层3: 跳过 Lighthouse", "warn")

        # 层 5: 广告
        log("  层5: Monetag 广告检测...")
        checks["ads"] = check_monetag_ads(url, site["type"])

        all_results[site_name] = checks

        if args.url:
            break

    # ── 抽查游戏 ──
    if not args.skip_games and not args.url:
        for game_url in SAMPLE_GAMES:
            game_name = game_url.rstrip("/").split("/")[-1] or urlparse(game_url).hostname
            log(f"抽查游戏: {game_name}")
            checks = {}
            checks["http"] = check_http_health(game_url)
            checks["game"] = check_game_functionality(game_url)
            all_results[f"🎮 {game_name}"] = checks

    # ── 生成报告 ──
    report = generate_report(all_results, OUTPUT_DIR)
    print("\n" + report)

    # 保存报告
    report_file = os.path.join(OUTPUT_DIR, f"qa-report-{NOW.strftime('%Y%m%d-%H%M%S')}.md")
    with open(report_file, "w") as f:
        f.write(report)
    log(f"报告已保存: {report_file}", "ok")

    # 保存 JSON 原始数据
    json_file = os.path.join(OUTPUT_DIR, f"qa-data-{NOW.strftime('%Y%m%d-%H%M%S')}.json")
    with open(json_file, "w") as f:
        json.dump(all_results, f, ensure_ascii=False, indent=2, default=str)

    # 清理 Kachilu 残留
    subprocess.run([KACHILU_BROWSER, "close", "--all"], timeout=10, capture_output=True)

    return 0


if __name__ == "__main__":
    sys.exit(main())
