# TypePeek

A lightweight Chrome extension that lets designers **inspect font information** from any text on the web.

> Hover to see the font family, size, weight, line height, and color.

---

## Why I Built This

As a visual communication and UX design student, I often do competitive analysis and want to know what font, size, and line height a website is using. Opening DevTools and digging through layers breaks the browsing flow.

TypePeek makes it as simple as a color-picker hover — **move the cursor over text and the specs appear instantly**.

---

## Features

- Hover over any text on the web to see a font-info card
- Shows: font family, size, weight, line height, color, and letter spacing
- `Ag` preview glyph rendered in the detected font
- Smart card positioning that avoids screen edges
- Works inside iframes
- Toggle on/off with `Option + P` (Mac) / `Alt + P` (Windows)
- Floating power toggle in the bottom-right corner
- Hide the card with `ESC`

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
- Click the power icon in the floating bar or press `Option + P` to pause/resume detection
- Press `ESC` to hide the card

---

## Technical Highlights

- **Manifest V3** with the latest Chrome extension standards
- **Content script** injection on all URLs and iframes
- **Shadow DOM isolation** keeps tooltip and floating bar styles separate from host pages
- **Floating control bar** fixed to the bottom-right, one-click toggle without memorizing shortcuts
- **Precise text detection** using `caretRangeFromPoint` / `caretPositionFromPoint`
- **Real font resolution** via `document.fonts.check()` to avoid fallback-font confusion
- **Edge-case handling** for scroll, resize, and DOM mutations

---

## Project Structure

```
typepeek/
├── manifest.json      # Extension manifest
├── content.js         # Core detection, tooltip, and floating toggle bar
├── README.md
└── assets/            # Icons, screenshots, demo media
```

---

## Roadmap

Version A solves "inspection"; Version B will upgrade TypePeek into a "research tool":

- Save interesting font records
- Add research notes to each record
- Manage saves in a popup dashboard
- Export annotated typography study cards for portfolios or case studies

---

## Demo

![TypePeek demo](assets/demo.gif)

![TypePeek screenshot](assets/screenshot.png)

---

## License

MIT
