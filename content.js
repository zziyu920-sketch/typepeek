(function () {
  const GENERIC_FAMILIES = new Set([
    'serif', 'sans-serif', 'monospace', 'cursive', 'fantasy',
    'system-ui', 'ui-serif', 'ui-sans-serif', 'ui-monospace',
    '-apple-system', 'blinkmacsystemfont', 'segoe ui', 'roboto',
    'helvetica neue', 'arial', 'noto sans', 'sans',
    'apple color emoji', 'segoe ui emoji', 'segoe ui symbol'
  ]);

  const TOOLTIP_CSS = `
    .typepeek-tooltip {
      position: fixed;
      z-index: 2147483647;
      width: 240px;
      padding: 16px;
      background: rgba(24, 24, 27, 0.96);
      color: #fafafa;
      border-radius: 14px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      font-size: 13px;
      line-height: 1.4;
      box-shadow: 0 12px 40px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(255, 255, 255, 0.06);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid rgba(255, 255, 255, 0.08);
      pointer-events: none;
      opacity: 0;
      transform: translateY(6px) scale(0.98);
      transition: opacity 0.18s ease, transform 0.18s ease;
    }
    .typepeek-tooltip.typepeek-visible {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
    .typepeek-header {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      margin-bottom: 14px;
      padding-bottom: 14px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    }
    .typepeek-preview {
      flex-shrink: 0;
      width: 44px;
      height: 44px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(255, 255, 255, 0.06);
      border-radius: 10px;
      font-size: 26px;
      line-height: 1;
      color: #fff;
    }
    .typepeek-name-wrap {
      min-width: 0;
      flex: 1;
    }
    .typepeek-name {
      font-size: 15px;
      font-weight: 600;
      color: #fff;
      word-break: break-word;
      line-height: 1.3;
    }
    .typepeek-fallback {
      font-size: 11px;
      color: #a1a1a6;
      margin-top: 3px;
      word-break: break-word;
    }
    .typepeek-grid {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 12px;
      margin-bottom: 14px;
    }
    .typepeek-cell {
      display: flex;
      flex-direction: column;
      gap: 3px;
    }
    .typepeek-cell.typepeek-cell-wide {
      grid-column: span 2;
    }
    .typepeek-label {
      color: #a1a1a6;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }
    .typepeek-value {
      color: #ffffff;
      font-weight: 500;
      font-size: 13px;
    }
    .typepeek-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-top: 12px;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
    }
    .typepeek-color {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .typepeek-swatch {
      width: 14px;
      height: 14px;
      border-radius: 50%;
      border: 1px solid rgba(255, 255, 255, 0.15);
      box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.1);
    }
    .typepeek-shortcut {
      font-size: 10px;
      color: #71717a;
    }
    .typepeek-controls {
      position: fixed;
      z-index: 2147483647;
      pointer-events: auto;
    }
    .typepeek-save-btn {
      position: absolute;
      top: -36px;
      right: 0;
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      background: rgba(24, 24, 27, 0.96);
      color: #fafafa;
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 10px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      font-size: 12px;
      font-weight: 500;
      line-height: 1;
      cursor: pointer;
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
      transition: background 0.15s ease, color 0.15s ease, transform 0.15s ease;
    }
    .typepeek-save-btn:hover {
      background: rgba(255, 255, 255, 0.1);
    }
    .typepeek-save-btn:active {
      transform: scale(0.96);
    }
    .typepeek-save-btn.typepeek-saved {
      color: #34d399;
      border-color: rgba(52, 211, 153, 0.25);
    }
    .typepeek-save-btn svg {
      width: 14px;
      height: 14px;
      flex-shrink: 0;
    }
    .typepeek-floating-bar {
      position: fixed;
      z-index: 2147483646;
      right: 16px;
      bottom: 16px;
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 10px;
      background: rgba(24, 24, 27, 0.92);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 100px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(255, 255, 255, 0.04);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      pointer-events: auto;
      color: #fafafa;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      font-size: 12px;
      line-height: 1;
      opacity: 0;
      transform: translateY(12px) scale(0.96);
      transition: opacity 0.22s ease, transform 0.22s ease, background 0.15s ease;
    }
    .typepeek-floating-bar.typepeek-bar-visible {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
    .typepeek-floating-bar.typepeek-bar-dragging {
      transition: opacity 0.22s ease, background 0.15s ease;
      cursor: grabbing;
    }
    .typepeek-bar-drag-handle {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: grab;
      user-select: none;
    }
    .typepeek-bar-drag-handle:active {
      cursor: grabbing;
    }
    .typepeek-floating-bar.typepeek-disabled {
      background: rgba(60, 60, 67, 0.75);
    }
    .typepeek-bar-logo {
      width: 18px;
      height: 18px;
      border-radius: 5px;
      flex-shrink: 0;
    }
    .typepeek-bar-status {
      font-weight: 500;
      color: #fafafa;
      min-width: 58px;
    }
    .typepeek-bar-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      padding: 0;
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 50%;
      color: #fafafa;
      cursor: pointer;
      transition: background 0.15s ease, transform 0.15s ease;
      position: relative;
    }
    .typepeek-bar-btn:hover {
      background: rgba(255, 255, 255, 0.12);
    }
    .typepeek-bar-btn:active {
      transform: scale(0.92);
    }
    .typepeek-bar-btn svg {
      width: 14px;
      height: 14px;
      flex-shrink: 0;
    }
    .typepeek-bar-btn.typepeek-off svg {
      color: #a1a1a6;
    }
    .typepeek-bar-btn.typepeek-off:hover {
      color: #fafafa;
    }
    .typepeek-bar-badge {
      position: absolute;
      top: -4px;
      right: -4px;
      min-width: 14px;
      height: 14px;
      padding: 0 4px;
      background: #3b82f6;
      color: #fff;
      font-size: 9px;
      font-weight: 600;
      border-radius: 7px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
    }
    .typepeek-bar-badge.typepeek-badge-hidden {
      display: none;
    }
    .typepeek-toast {
      position: fixed;
      z-index: 2147483647;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%) scale(0.96);
      padding: 12px 20px;
      background: rgba(24, 24, 27, 0.96);
      color: #fafafa;
      border-radius: 100px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      font-size: 14px;
      font-weight: 500;
      box-shadow: 0 12px 40px rgba(0, 0, 0, 0.35);
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.2s ease, transform 0.2s ease;
    }
    .typepeek-toast.typepeek-toast-visible {
      opacity: 1;
      transform: translate(-50%, -50%) scale(1);
    }
  `;

  let hostRoot = null;
  let tooltip = null;
  let controls = null;
  let saveBtn = null;
  let floatingBar = null;
  let toggleBtn = null;
  let bookmarkBtn = null;
  let bookmarkBadge = null;
  let toast = null;
  let currentTarget = null;
  let currentRecordData = null;
  let lastX = 0;
  let lastY = 0;
  let enabled = true;
  let savedCount = 0;

  // Drag state
  let barPos = { right: 16, bottom: 16 };
  let dragInfo = null;

  const isMac = /Mac|iPod|iPhone|iPad/.test(navigator.platform || '');
  const shortcutKey = isMac ? 'Option + P' : 'Alt + P';

  function getOrCreateTooltip() {
    if (tooltip) return tooltip;

    hostRoot = document.createElement('div');
    hostRoot.id = 'typepeek-host';
    hostRoot.style.position = 'fixed';
    hostRoot.style.top = '0';
    hostRoot.style.left = '0';
    hostRoot.style.width = '0';
    hostRoot.style.height = '0';
    hostRoot.style.zIndex = '2147483647';
    document.body.appendChild(hostRoot);

    const shadow = hostRoot.attachShadow({ mode: 'open' });
    const style = document.createElement('style');
    style.textContent = TOOLTIP_CSS;
    shadow.appendChild(style);

    tooltip = document.createElement('div');
    tooltip.id = 'typepeek-tooltip';
    tooltip.className = 'typepeek-tooltip';
    shadow.appendChild(tooltip);

    controls = document.createElement('div');
    controls.className = 'typepeek-controls';
    controls.style.opacity = '0';
    controls.style.transform = 'translateY(6px) scale(0.98)';
    controls.style.transition = 'opacity 0.18s ease, transform 0.18s ease';
    shadow.appendChild(controls);

    saveBtn = document.createElement('button');
    saveBtn.className = 'typepeek-save-btn';
    saveBtn.type = 'button';
    saveBtn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
      </svg>
      <span>Save</span>
    `;
    saveBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      saveCurrentRecord();
    });
    controls.appendChild(saveBtn);

    return tooltip;
  }

  function createFloatingBar() {
    if (floatingBar) return floatingBar;

    const shadow = hostRoot ? hostRoot.shadowRoot : getOrCreateTooltip().getRootNode();

    floatingBar = document.createElement('div');
    floatingBar.className = 'typepeek-floating-bar';
    floatingBar.innerHTML = `
      <div class="typepeek-bar-drag-handle">
        <img class="typepeek-bar-logo" src="${chrome.runtime.getURL('assets/icon32.png')}" alt="">
        <span class="typepeek-bar-status">TypePeek On</span>
      </div>
      <button type="button" class="typepeek-bar-btn" id="typepeek-toggle-btn" title="Toggle TypePeek" aria-label="Toggle TypePeek">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path>
          <line x1="12" y1="2" x2="12" y2="12"></line>
        </svg>
      </button>
      <button type="button" class="typepeek-bar-btn" id="typepeek-bookmark-btn" title="Open collection" aria-label="Open collection">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
        </svg>
        <span class="typepeek-bar-badge typepeek-badge-hidden">0</span>
      </button>
    `;

    toggleBtn = floatingBar.querySelector('#typepeek-toggle-btn');
    bookmarkBtn = floatingBar.querySelector('#typepeek-bookmark-btn');
    bookmarkBadge = floatingBar.querySelector('.typepeek-bar-badge');

    toggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleEnabled();
    });

    bookmarkBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      openCollection();
    });

    // Drag to reposition
    const dragHandle = floatingBar.querySelector('.typepeek-bar-drag-handle');
    dragHandle.addEventListener('mousedown', onDragStart);
    dragHandle.addEventListener('touchstart', onDragStart, { passive: false });

    shadow.appendChild(floatingBar);

    // Create toast element
    toast = document.createElement('div');
    toast.className = 'typepeek-toast';
    toast.textContent = 'TypePeek Off';
    shadow.appendChild(toast);

    updateFloatingBar();
    loadSavedCount();
    loadBarPosition();

    // Show with slight delay for entrance animation
    requestAnimationFrame(() => {
      floatingBar.classList.add('typepeek-bar-visible');
    });

    return floatingBar;
  }

  // ── Drag handlers ──

  function onDragStart(e) {
    if (!floatingBar) return;
    e.preventDefault();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const rect = floatingBar.getBoundingClientRect();
    dragInfo = {
      startX: clientX,
      startY: clientY,
      startRight: window.innerWidth - rect.right,
      startBottom: window.innerHeight - rect.bottom
    };
    floatingBar.classList.add('typepeek-bar-dragging');
    document.addEventListener('mousemove', onDragMove);
    document.addEventListener('mouseup', onDragEnd);
    document.addEventListener('touchmove', onDragMove, { passive: false });
    document.addEventListener('touchend', onDragEnd);
  }

  function onDragMove(e) {
    if (!dragInfo || !floatingBar) return;
    e.preventDefault();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const dx = dragInfo.startX - clientX;
    const dy = dragInfo.startY - clientY;
    barPos.right = Math.max(0, Math.min(dragInfo.startRight + dx, window.innerWidth - 100));
    barPos.bottom = Math.max(0, Math.min(dragInfo.startBottom + dy, window.innerHeight - 40));
    floatingBar.style.right = barPos.right + 'px';
    floatingBar.style.bottom = barPos.bottom + 'px';
  }

  function onDragEnd(e) {
    if (!dragInfo) return;
    document.removeEventListener('mousemove', onDragMove);
    document.removeEventListener('mouseup', onDragEnd);
    document.removeEventListener('touchmove', onDragMove);
    document.removeEventListener('touchend', onDragEnd);
    floatingBar.classList.remove('typepeek-bar-dragging');
    snapToCorner();
    applyBarPosition();
    saveBarPosition();
    dragInfo = null;
  }

  function snapToCorner() {
    const cx = barPos.right;
    const cy = barPos.bottom;
    const hw = window.innerWidth / 2;
    const hh = window.innerHeight / 2;
    if (cx < hw && cy < hh) {
      barPos = { right: null, bottom: null, left: 16, top: 16 };
    } else if (cx >= hw && cy < hh) {
      barPos = { right: 16, bottom: null, left: null, top: 16 };
    } else if (cx < hw && cy >= hh) {
      barPos = { right: null, bottom: 16, left: 16, top: null };
    } else {
      barPos = { right: 16, bottom: 16, left: null, top: null };
    }
  }

  function applyBarPosition() {
    if (!floatingBar) return;
    floatingBar.style.right = barPos.right != null ? barPos.right + 'px' : 'auto';
    floatingBar.style.bottom = barPos.bottom != null ? barPos.bottom + 'px' : 'auto';
    floatingBar.style.left = barPos.left != null ? barPos.left + 'px' : 'auto';
    floatingBar.style.top = barPos.top != null ? barPos.top + 'px' : 'auto';
  }

  function loadBarPosition() {
    if (typeof chrome === 'undefined' || !chrome.storage) return;
    chrome.storage.local.get(['typepeek_settings'], (result) => {
      const settings = result.typepeek_settings || {};
      if (settings.barPos) {
        barPos = settings.barPos;
        applyBarPosition();
      }
    });
  }

  function saveBarPosition() {
    if (typeof chrome === 'undefined' || !chrome.storage) return;
    chrome.storage.local.get(['typepeek_settings'], (result) => {
      const settings = result.typepeek_settings || {};
      settings.barPos = { ...barPos };
      chrome.storage.local.set({ typepeek_settings: settings });
    });
  }

  function updateFloatingBar() {
    if (!floatingBar) return;
    const statusText = floatingBar.querySelector('.typepeek-bar-status');
    if (enabled) {
      floatingBar.classList.remove('typepeek-disabled');
      toggleBtn.classList.remove('typepeek-off');
      statusText.textContent = 'TypePeek On';
    } else {
      floatingBar.classList.add('typepeek-disabled');
      toggleBtn.classList.add('typepeek-off');
      statusText.textContent = 'TypePeek Off';
    }
  }

  function toggleEnabled() {
    enabled = !enabled;
    updateFloatingBar();
    showToggleToast(enabled ? 'TypePeek On' : 'TypePeek Off');
    if (!enabled) {
      hideTooltip();
      currentTarget = null;
    }
  }

  function showToggleToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('typepeek-toast-visible');
    setTimeout(() => {
      toast.classList.remove('typepeek-toast-visible');
    }, 1200);
  }

  function openCollection() {
    if (chrome.action && chrome.action.openPopup) {
      chrome.action.openPopup().catch(() => {
        chrome.runtime.sendMessage({ action: 'openPopup' });
      });
      return;
    }
    chrome.runtime.sendMessage({ action: 'openPopup' });
  }

  function loadSavedCount() {
    if (typeof chrome === 'undefined' || !chrome.storage) return;
    chrome.storage.local.get(['typepeek_records'], (result) => {
      const records = result.typepeek_records || [];
      updateBookmarkBadge(records.length);
    });
  }

  function updateBookmarkBadge(count) {
    savedCount = count;
    if (!bookmarkBadge) return;
    if (count > 0) {
      bookmarkBadge.textContent = count > 99 ? '99+' : String(count);
      bookmarkBadge.classList.remove('typepeek-badge-hidden');
    } else {
      bookmarkBadge.classList.add('typepeek-badge-hidden');
    }
  }

  function parseFontNames(fontFamily) {
    return fontFamily.split(',').map(name => {
      const cleaned = name.trim().replace(/^["']|["']$/g, '');
      return { original: cleaned, lower: cleaned.toLowerCase() };
    }).filter(n => n.original.length > 0);
  }

  function resolveFontFamily(fontFamily) {
    if (!fontFamily) return { primary: '—', fallback: '' };
    const names = parseFontNames(fontFamily);
    if (names.length === 0) return { primary: '—', fallback: '' };

    const testText = 'AaBbCc';
    const testSize = '72px';
    let primary = null;
    let fallbackIndex = -1;

    for (let i = 0; i < names.length; i++) {
      const { original, lower } = names[i];
      if (GENERIC_FAMILIES.has(lower)) {
        if (fallbackIndex === -1) fallbackIndex = i;
        continue;
      }
      if (typeof document !== 'undefined' && document.fonts && document.fonts.check) {
        try {
          const loaded = document.fonts.check(`${testSize} "${original}"`);
          if (loaded) {
            primary = original;
            fallbackIndex = i + 1;
            break;
          }
          if (primary === null) primary = original;
        } catch (e) {
          primary = original;
          fallbackIndex = i + 1;
          break;
        }
      } else {
        primary = original;
        fallbackIndex = i + 1;
        break;
      }
    }

    if (!primary) primary = names[0].original;

    const fallback = fallbackIndex > -1 && fallbackIndex < names.length
      ? names.slice(fallbackIndex).map(n => n.original).join(', ')
      : '';

    return { primary, fallback };
  }

  function normalizeLineHeight(lineHeight, fontSizePx) {
    if (lineHeight === 'normal') {
      return `${Math.round(fontSizePx * 1.2)}px`;
    }
    if (lineHeight.endsWith('px')) {
      return lineHeight;
    }
    const value = parseFloat(lineHeight);
    if (!isNaN(value)) {
      return `${Math.round(value * fontSizePx)}px`;
    }
    return lineHeight;
  }

  function rgbToHex(rgb) {
    if (!rgb || rgb === 'rgba(0, 0, 0, 0)') return '—';
    const match = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (!match) return rgb;
    const toHex = (n) => parseInt(n, 10).toString(16).padStart(2, '0');
    return `#${toHex(match[1])}${toHex(match[2])}${toHex(match[3])}`;
  }

  function generateId() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  }

  function getDomain(url) {
    try {
      return new URL(url).hostname;
    } catch (e) {
      return '';
    }
  }

  function truncateText(text, maxLength) {
    const cleaned = (text || '').replace(/\s+/g, ' ').trim();
    if (cleaned.length <= maxLength) return cleaned;
    return cleaned.slice(0, maxLength).trimEnd() + '…';
  }

  function buildRecord(el) {
    const style = window.getComputedStyle(el);
    const fontSize = parseFloat(style.fontSize);
    const { primary: primaryFont, fallback: fallbackFonts } = resolveFontFamily(style.fontFamily);
    const lineHeight = normalizeLineHeight(style.lineHeight, fontSize);
    const color = rgbToHex(style.color);
    const now = Date.now();

    return {
      id: generateId(),
      createdAt: now,
      updatedAt: now,
      primaryFont,
      fallbackFonts,
      fontSize: style.fontSize,
      fontWeight: style.fontWeight,
      lineHeight,
      color,
      colorRaw: style.color,
      letterSpacing: style.letterSpacing,
      fontFamilyCss: style.fontFamily,
      url: window.location.href,
      domain: getDomain(window.location.href),
      pageTitle: document.title || '',
      elementTag: (el.tagName || '').toUpperCase(),
      sampleText: truncateText(el.textContent, 60),
      note: '',
      tags: [],
      group: null
    };
  }

  function saveCurrentRecord() {
    if (!currentTarget) return;
    const record = buildRecord(currentTarget);
    currentRecordData = record;

    chrome.runtime.sendMessage({ action: 'saveRecord', record }, (response) => {
      if (chrome.runtime.lastError) {
        // eslint-disable-next-line no-console
        console.error('[TypePeek] save failed:', chrome.runtime.lastError.message);
        return;
      }
      if (response && response.ok) {
        showSaveFeedback();
      }
    });
  }

  function showSaveFeedback() {
    if (!saveBtn) return;
    const label = saveBtn.querySelector('span');
    const originalHTML = saveBtn.innerHTML;
    saveBtn.classList.add('typepeek-saved');
    saveBtn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
      <span>Saved</span>
    `;
    loadSavedCount();
    setTimeout(() => {
      saveBtn.classList.remove('typepeek-saved');
      saveBtn.innerHTML = originalHTML;
    }, 1500);
  }

  function isTextElement(el) {
    return el && el.textContent && el.textContent.trim().length > 0 && !el.closest('#typepeek-host');
  }

  function positionTooltip(x, y) {
    const t = getOrCreateTooltip();
    const rect = t.getBoundingClientRect();
    const pad = 14;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const fitsRight = x + pad + rect.width <= vw;
    const fitsBelow = y + pad + rect.height <= vh;

    let left, top;

    if (fitsRight && fitsBelow) {
      left = x + pad;
      top = y + pad;
    } else if (fitsRight && !fitsBelow) {
      left = x + pad;
      top = y - rect.height - pad;
    } else if (!fitsRight && fitsBelow) {
      left = x - rect.width - pad;
      top = y + pad;
    } else {
      left = x - rect.width - pad;
      top = y - rect.height - pad;
    }

    left = Math.max(pad, Math.min(left, vw - rect.width - pad));
    top = Math.max(pad, Math.min(top, vh - rect.height - pad));

    t.style.left = `${left}px`;
    t.style.top = `${top}px`;

    if (controls) {
      controls.style.left = `${left}px`;
      controls.style.top = `${top}px`;
      controls.style.width = `${rect.width}px`;
      controls.style.height = `${rect.height}px`;
    }
  }

  function showTooltip(el, x, y) {
    const style = window.getComputedStyle(el);
    const fontSize = parseFloat(style.fontSize);
    const { primary: fontFamily, fallback } = resolveFontFamily(style.fontFamily);
    const lineHeight = normalizeLineHeight(style.lineHeight, fontSize);
    const color = rgbToHex(style.color);

    const t = getOrCreateTooltip();
    t.innerHTML = `
      <div class="typepeek-header">
        <div class="typepeek-preview" style="font-family: ${style.fontFamily}">Ag</div>
        <div class="typepeek-name-wrap">
          <div class="typepeek-name" style="font-family: ${style.fontFamily}">${fontFamily}</div>
          ${fallback ? `<div class="typepeek-fallback">${fallback}</div>` : ''}
        </div>
      </div>
      <div class="typepeek-grid">
        <div class="typepeek-cell">
          <span class="typepeek-label">Size</span>
          <span class="typepeek-value">${style.fontSize}</span>
        </div>
        <div class="typepeek-cell">
          <span class="typepeek-label">Weight</span>
          <span class="typepeek-value">${style.fontWeight}</span>
        </div>
        <div class="typepeek-cell">
          <span class="typepeek-label">Leading</span>
          <span class="typepeek-value">${lineHeight}</span>
        </div>
      </div>
      <div class="typepeek-footer">
        <div class="typepeek-color">
          <span class="typepeek-swatch" style="background-color: ${style.color}"></span>
          <span class="typepeek-value">${color}</span>
        </div>
        ${style.letterSpacing !== 'normal' ? `<div class="typepeek-cell">
          <span class="typepeek-label">Tracking ${style.letterSpacing}</span>
        </div>` : '<span class="typepeek-shortcut">' + shortcutKey + '</span>'}
      </div>
    `;

    // Reset save button state when a new element is inspected.
    if (saveBtn) {
      saveBtn.classList.remove('typepeek-saved');
      const label = saveBtn.querySelector('span');
      if (label) label.textContent = 'Save';
    }

    positionTooltip(x, y);
    t.classList.add('typepeek-visible');
    if (controls) {
      controls.style.opacity = '1';
      controls.style.transform = 'translateY(0) scale(1)';
    }
  }

  function hideTooltip() {
    if (tooltip) {
      tooltip.classList.remove('typepeek-visible');
    }
    if (controls) {
      controls.style.opacity = '0';
      controls.style.transform = 'translateY(6px) scale(0.98)';
    }
  }

  function getTextElementAtPoint(x, y) {
    let node = null;

    if (document.caretPositionFromPoint) {
      const pos = document.caretPositionFromPoint(x, y);
      if (pos && pos.offsetNode) {
        node = pos.offsetNode;
      }
    } else if (document.caretRangeFromPoint) {
      const range = document.caretRangeFromPoint(x, y);
      if (range) {
        node = range.startContainer;
      }
    }

    if (node && node.nodeType === Node.TEXT_NODE && node.textContent.trim().length > 0) {
      const parent = node.parentElement;
      if (parent && !parent.closest('#typepeek-host')) return parent;
    }

    const el = document.elementFromPoint(x, y);
    if (!el || el.closest('#typepeek-host')) return null;
    if (isTextElement(el)) return el;

    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
      acceptNode: (n) => n.textContent.trim().length > 0 ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT
    });
    const firstText = walker.nextNode();
    if (firstText) {
      const parent = firstText.parentElement;
      if (parent && !parent.closest('#typepeek-host')) return parent;
    }

    return null;
  }

  function updateTooltipPosition() {
    if (currentTarget && tooltip && tooltip.classList.contains('typepeek-visible')) {
      positionTooltip(lastX, lastY);
    }
  }

  document.addEventListener('mousemove', (e) => {
    if (!enabled) return;

    lastX = e.clientX;
    lastY = e.clientY;

    const textEl = getTextElementAtPoint(lastX, lastY);
    if (!textEl) {
      hideTooltip();
      currentTarget = null;
      return;
    }

    currentTarget = textEl;
    showTooltip(textEl, lastX, lastY);
  });

  document.addEventListener('keydown', (e) => {
    if (e.altKey && (e.key === 'p' || e.key === 'P')) {
      e.preventDefault();
      toggleEnabled();
    }
    if (e.key === 'Escape') {
      hideTooltip();
      currentTarget = null;
    }
  });

  document.addEventListener('mouseleave', () => {
    hideTooltip();
    currentTarget = null;
  });

  window.addEventListener('scroll', updateTooltipPosition, { passive: true });
  window.addEventListener('resize', updateTooltipPosition, { passive: true });

  const observer = new MutationObserver(() => {
    if (currentTarget && !document.body.contains(currentTarget)) {
      hideTooltip();
      currentTarget = null;
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });

  // Keep bookmark badge in sync when records change in other contexts.
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.onChanged) {
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === 'local' && changes.typepeek_records) {
        const records = changes.typepeek_records.newValue || [];
        updateBookmarkBadge(records.length);
      }
    });
  }

  // Initialize the floating control bar once the DOM is ready.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createFloatingBar);
  } else {
    createFloatingBar();
  }
})();
