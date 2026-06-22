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
  let floatingBar = null;
  let toggleBtn = null;
  let toast = null;
  let currentTarget = null;
  let lastX = 0;
  let lastY = 0;
  let enabled = true;

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

    return tooltip;
  }

  function createFloatingBar() {
    if (floatingBar) return floatingBar;

    const shadow = hostRoot ? hostRoot.shadowRoot : getOrCreateTooltip().getRootNode();

    floatingBar = document.createElement('div');
    floatingBar.className = 'typepeek-floating-bar';
    floatingBar.innerHTML = `
      <img class="typepeek-bar-logo" src="${chrome.runtime.getURL('assets/icon32.png')}" alt="">
      <span class="typepeek-bar-status">TypePeek On</span>
      <button type="button" class="typepeek-bar-btn" id="typepeek-toggle-btn" title="Toggle TypePeek" aria-label="Toggle TypePeek">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path>
          <line x1="12" y1="2" x2="12" y2="12"></line>
        </svg>
      </button>
    `;

    toggleBtn = floatingBar.querySelector('#typepeek-toggle-btn');

    toggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleEnabled();
    });

    shadow.appendChild(floatingBar);

    toast = document.createElement('div');
    toast.className = 'typepeek-toast';
    toast.textContent = 'TypePeek Off';
    shadow.appendChild(toast);

    updateFloatingBar();

    requestAnimationFrame(() => {
      floatingBar.classList.add('typepeek-bar-visible');
    });

    return floatingBar;
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
        </div>` : '<span class="typepeek-shortcut">Alt + P</span>'}
      </div>
    `;

    positionTooltip(x, y);
    t.classList.add('typepeek-visible');
  }

  function hideTooltip() {
    if (tooltip) {
      tooltip.classList.remove('typepeek-visible');
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

  // Initialize the floating control bar once the DOM is ready.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createFloatingBar);
  } else {
    createFloatingBar();
  }
})();
