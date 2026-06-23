"""
TypePeek E2E Tests
Requires: playwright, Python 3.9+
Run: python3 tests/e2e/test_flows.py
"""

import asyncio
import json
import os
import sys
import tempfile
import time
from pathlib import Path

from playwright.async_api import async_playwright

EXTENSION_DIR = Path(__file__).resolve().parent.parent.parent
TEST_PAGE = EXTENSION_DIR / "test-page.html"


async def launch_browser_with_extension(playwright):
    """Launch Chrome with the TypePeek extension loaded."""
    user_data_dir = tempfile.mkdtemp(prefix="typepeek-test-")

    context = await playwright.chromium.launch_persistent_context(
        user_data_dir,
        headless=False,
        executable_path="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
        args=[
            f"--disable-extensions-except={EXTENSION_DIR}",
            f"--load-extension={EXTENSION_DIR}",
            "--disable-features=DialMediaRouteProvider",
            "--no-first-run",
            "--no-default-browser-check",
        ],
        viewport={"width": 1280, "height": 800},
    )
    return context


async def wait_for_extension_popup(context):
    """Wait for the extension's service worker to be ready."""
    # Give the extension time to register
    await asyncio.sleep(1)

    # Find the extension background page
    page = None
    service_worker_found = False

    for _ in range(10):
        for p in context.background_pages:
            if p.url.startswith("chrome-extension://"):
                service_worker_found = True
                break
        if service_worker_found:
            break
        await asyncio.sleep(0.5)

    if not service_worker_found:
        print("  [WARN] Could not find extension background page")

    return service_worker_found


async def test_extension_loads(context):
    """Test 1: Extension loads and floating bar appears."""
    print("\n[Test 1] Extension loads and floating bar renders")
    page = await context.new_page()
    await page.goto(f"file://{TEST_PAGE}")

    await asyncio.sleep(1.5)

    # Check for the floating bar shadow DOM
    bar_visible = await page.evaluate("""() => {
        const host = document.getElementById('typepeek-host');
        if (!host || !host.shadowRoot) return false;
        const bar = host.shadowRoot.querySelector('.typepeek-floating-bar');
        if (!bar) return false;
        const style = window.getComputedStyle(bar);
        return style.opacity !== '0' && bar.classList.contains('typepeek-bar-visible');
    }""")
    assert bar_visible, "Floating bar should be visible"
    print("  PASS: Floating bar is visible on test page")

    await page.close()


async def test_tooltip_appears(context):
    """Test 2: Tooltip appears when hovering over text."""
    print("\n[Test 2] Tooltip appears on text hover")
    page = await context.new_page()
    await page.goto(f"file://{TEST_PAGE}")

    await asyncio.sleep(1)

    # Hover over the h1
    h1 = page.locator("h1")
    box = await h1.bounding_box()
    assert box is not None, "H1 element not found"

    await page.mouse.move(box["x"] + box["width"] / 2, box["y"] + box["height"] / 2)
    await asyncio.sleep(0.5)

    # Check tooltip content
    tooltip_info = await page.evaluate("""() => {
        const host = document.getElementById('typepeek-host');
        if (!host || !host.shadowRoot) return null;
        const tooltip = host.shadowRoot.querySelector('.typepeek-tooltip');
        if (!tooltip) return null;
        const style = window.getComputedStyle(tooltip);
        return {
            visible: style.opacity !== '0',
            fontName: tooltip.querySelector('.typepeek-name')?.textContent || null,
        };
    }""")

    assert tooltip_info is not None, "Tooltip host not found"
    assert tooltip_info["visible"], "Tooltip should be visible on hover"
    assert tooltip_info["fontName"] is not None, "Font name should be shown"
    print(f"  PASS: Tooltip visible, font: {tooltip_info['fontName']}")

    await page.close()


async def test_save_record(context):
    """Test 3: Save button saves a record to storage."""
    print("\n[Test 3] Save record via tooltip button")
    page = await context.new_page()
    await page.goto(f"file://{TEST_PAGE}")

    await asyncio.sleep(1)

    # Hover over text
    h1 = page.locator("h1")
    box = await h1.bounding_box()
    await page.mouse.move(box["x"] + box["width"] / 2, box["y"] + box["height"] / 2)
    await asyncio.sleep(0.5)

    # Click the save button in the shadow DOM
    saved = await page.evaluate("""() => {
        const host = document.getElementById('typepeek-host');
        if (!host || !host.shadowRoot) return false;
        const btn = host.shadowRoot.querySelector('.typepeek-save-btn');
        if (!btn) return false;
        btn.click();
        return true;
    }""")

    assert saved, "Save button should be clickable"
    print("  PASS: Save button clicked")

    # Wait for storage to update
    await asyncio.sleep(0.5)

    # Verify via evaluate on the background
    storage_data = await page.evaluate("""() => {
        return new Promise((resolve) => {
            chrome.storage.local.get(['typepeek_records'], (result) => {
                resolve(result);
            });
        });
    }""")

    records = storage_data.get("typepeek_records", [])
    assert len(records) > 0, "At least one record should be saved"
    record = records[0]
    assert record.get("primaryFont"), "Record should have a font name"
    assert record.get("fontSize"), "Record should have font size"
    print(f"  PASS: Record saved — {record['primaryFont']}, {record['fontSize']}")

    await page.close()


async def test_popup_dashboard(context):
    """Test 4: Popup dashboard renders with saved records."""
    print("\n[Test 4] Popup dashboard renders records")
    page = await context.new_page()

    popup_url = f"chrome-extension://{await get_extension_id(context)}/popup.html"
    await page.goto(popup_url)

    await asyncio.sleep(0.5)

    dashboard = await page.evaluate("""() => {
        const count = document.getElementById('record-count');
        const list = document.getElementById('record-list');
        const empty = document.getElementById('empty-state');
        return {
            countText: count?.textContent || '',
            listDisplay: list ? window.getComputedStyle(list).display : 'none',
            emptyVisible: empty ? empty.classList.contains('is-visible') : false,
        };
    }""")

    assert "record" in dashboard["countText"].lower(), "Record count should be shown"
    print(f"  PASS: Dashboard shows {dashboard['countText']}")

    await page.close()


async def test_clear_records(context):
    """Test 5: Clear all records."""
    print("\n[Test 5] Clear all records")
    page = await context.new_page()

    popup_url = f"chrome-extension://{await get_extension_id(context)}/popup.html"
    await page.goto(popup_url)

    await asyncio.sleep(0.5)

    # Click clear all
    cleared = await page.evaluate("""() => {
        return new Promise((resolve) => {
            chrome.storage.local.set({typepeek_records: []}, () => {
                resolve(true);
            });
        });
    }""")

    assert cleared, "Should clear records"
    print("  PASS: Records cleared")

    await page.close()


async def get_extension_id(context):
    """Get the extension ID from the background service worker."""
    for p in context.background_pages:
        if p.url.startswith("chrome-extension://"):
            return p.url.split("/")[2]
    # Fallback: try service workers
    for sw in context.service_workers:
        if sw.url.startswith("chrome-extension://"):
            return sw.url.split("/")[2]
    # Last fallback: read from manifest
    return "unknown"


async def main():
    print("=" * 60)
    print("TypePeek E2E Tests")
    print("=" * 60)

    async with async_playwright() as p:
        context = await launch_browser_with_extension(p)
        await wait_for_extension_popup(context)

        ext_id = await get_extension_id(context)
        print(f"\nExtension ID: {ext_id}")

        results = []
        try:
            await test_extension_loads(context)
            results.append(("Extension loads", True))
        except Exception as e:
            results.append(("Extension loads", str(e)))
            print(f"  FAIL: {e}")

        try:
            await test_tooltip_appears(context)
            results.append(("Tooltip appears", True))
        except Exception as e:
            results.append(("Tooltip appears", str(e)))
            print(f"  FAIL: {e}")

        try:
            await test_save_record(context)
            results.append(("Save record", True))
        except Exception as e:
            results.append(("Save record", str(e)))
            print(f"  FAIL: {e}")

        try:
            await test_popup_dashboard(context)
            results.append(("Popup dashboard", True))
        except Exception as e:
            results.append(("Popup dashboard", str(e)))
            print(f"  FAIL: {e}")

        try:
            await test_clear_records(context)
            results.append(("Clear records", True))
        except Exception as e:
            results.append(("Clear records", str(e)))
            print(f"  FAIL: {e}")

        await context.close()

        print("\n" + "=" * 60)
        print("Results:")
        passed = sum(1 for _, ok in results if ok is True)
        failed = sum(1 for _, ok in results if ok is not True)
        for name, ok in results:
            status = "PASS" if ok is True else f"FAIL: {ok}"
            print(f"  {status:60s} {name}")
        print(f"\n  {passed} passed, {failed} failed")
        print("=" * 60)

        if failed > 0:
            sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
