# TypePeek

A lightweight Chrome extension that lets designers **inspect, save, and export font information** from any text on the web.

[![Version](https://img.shields.io/badge/version-1.1.0-blue)](https://github.com/zziyu920-sketch/typepeek/releases)
[![License](https://img.shields.io/badge/license-MIT-green)](./LICENSE)
[![Manifest](https://img.shields.io/badge/manifest-v3-orange)](./manifest.json)

> Hover to see the font. Click to save a typography study card for your portfolio or case study.

---

## Why I Built This

As a visual communication and UX design student, I often do competitive analysis and want to know what font, size, and line height a website is using. Opening DevTools and digging through layers breaks the browsing flow.

TypePeek makes it as simple as a color-picker hover — **move the cursor over text and the specs appear instantly**.

---

## Features

### Version A (Inspect)
- Hover over any text on the web to see a font-info card
- Shows: font family, size, weight, line height, color, and letter spacing
- `Ag` preview glyph rendered in the detected font
- Smart card positioning that avoids screen edges
- Works inside iframes
- Toggle on/off with `Option + P` (Mac) / `Alt + P` (Windows)
- Hide the card with `ESC`

### Version B (Research Tool)
- Click **Save** on the tooltip to bookmark a typography sample
- Persisted locally with `chrome.storage.local`
- Open the **popup dashboard** from the toolbar or floating bar to manage saves
- Add research notes, tags, and groups to each record
- Edit or delete saved records
- Export an 800×500 **typography study card PNG** with specs, source, notes, and tags
- Export all records as JSON for backup
- **Floating control bar** in the bottom-right corner: power toggle, saved-count badge, and quick access to the collection

---

## Install

1. Download or clone this repo
2. Open Chrome and go to `chrome://extensions/`
3. Turn on **Developer mode** in the top-right corner
4. Click **Load unpacked**
5. Select the `typepeek/` folder

---

## Usage

- Install the extension and open any webpage
- Move the mouse over any text; the card appears after ~100ms
- Click the **Save** button in the top-right of the tooltip to bookmark the sample
- Open the TypePeek popup from the toolbar or the floating bar’s bookmark icon
- Search, group, edit notes, or export PNG study cards from the popup
- Click the power icon in the floating bar or press `Option + P` to pause/resume detection
- Press `ESC` to hide the card

---

## Technical Highlights

- **Manifest V3** with a minimal service worker for storage migration
- **Content script** injection on all URLs and iframes
- **Shadow DOM isolation** keeps tooltip and floating bar styles separate from host pages
- **Layered interaction design**: tooltip is `pointer-events: none`, while a sibling controls layer handles clickable buttons
- **Floating control bar** fixed to the bottom-right, translucent and interactive
- **Precise text detection** using `caretRangeFromPoint` / `caretPositionFromPoint`
- **Real font resolution** via `document.fonts.check()` to avoid fallback-font confusion
- **Local persistence** with `chrome.storage.local`, surviving page reloads and browser restarts
- **Canvas-based PNG export** with zero dependencies, ready to drop into a portfolio
- **Edge-case handling** for scroll, resize, and DOM mutations

---

## Project Structure

```
typepeek/
├── manifest.json      # Extension manifest
├── background.js      # Service worker: install/update migration, message relay
├── content.js         # Core detection, tooltip, save button, floating bar
├── popup.html         # Dashboard UI
├── popup.css          # Dashboard styles
├── popup.js           # Dashboard logic: CRUD, search, PNG export
├── test-page.html     # Local test page
├── README.md
└── assets/            # Icons, screenshots, demo media
```

---

## Roadmap

Version A solved “inspection”; Version B turns TypePeek into a “research tool”:

- ✅ Save font records
- ✅ Add notes, tags, and groups
- ✅ Manage saves in a popup dashboard
- ✅ Export annotated typography study cards
- ✅ JSON backup export
- ✅ Floating control bar with power toggle and collection access

Future ideas:

- Cloud sync via `chrome.storage.sync`
- Bulk export of multiple cards as ZIP
- Font pairing suggestions and comparison view
- Dark/light theme toggle

---

## Demo

![TypePeek demo](assets/demo.gif)

![TypePeek screenshot](assets/screenshot.png)

---

## Testing

```bash
# Install test dependencies
python3 -m pip install playwright
python3 -m playwright install chromium

# Run E2E tests (requires Google Chrome)
python3 tests/e2e/test_flows.py
```

A local `test-page.html` is also included for manual smoke testing.

---

## License

MIT
