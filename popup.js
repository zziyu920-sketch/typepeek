(function () {
  const STORAGE_KEYS = {
    records: 'typepeek_records'
  };

  const els = {
    list: document.getElementById('record-list'),
    empty: document.getElementById('empty-state'),
    count: document.getElementById('record-count'),
    search: document.getElementById('search-input'),
    groupFilter: document.getElementById('group-filter'),
    exportAll: document.getElementById('export-all-btn'),
    clearAll: document.getElementById('clear-all-btn'),
    syncToggle: document.getElementById('sync-toggle'),
    syncStatus: document.getElementById('sync-status'),
    selectAll: document.getElementById('select-all-checkbox'),
    selectionBar: document.getElementById('selection-bar'),
    selectionCount: document.getElementById('selection-count'),
    exportZip: document.getElementById('export-zip-btn'),
    compareBtn: document.getElementById('compare-btn'),
    compareOverlay: document.getElementById('compare-overlay'),
    compareClose: document.getElementById('compare-close'),
    compareBody: document.getElementById('compare-body')
  };

  let records = [];
  let editingId = null;
  let selectedIds = new Set();

  function init() {
    loadRecords(() => {
      render();
    });

    els.search.addEventListener('input', render);
    els.groupFilter.addEventListener('change', render);

    els.exportAll.addEventListener('click', exportAllJSON);
    els.clearAll.addEventListener('click', clearAllRecords);

    els.syncToggle.addEventListener('change', () => {
      toggleSync(els.syncToggle.checked);
    });

    loadSyncStatus();

    els.compareOverlay.addEventListener('click', (e) => {
      if (e.target === els.compareOverlay) closeCompare();
    });

    els.selectAll.addEventListener('change', () => {
      const filtered = getFilteredRecords();
      if (els.selectAll.checked) {
        filtered.forEach((r) => selectedIds.add(r.id));
      } else {
        filtered.forEach((r) => selectedIds.delete(r.id));
      }
      render();
    });

    els.exportZip.addEventListener('click', exportSelectedAsZip);
    els.compareBtn.addEventListener('click', openCompare);
    els.compareClose.addEventListener('click', closeCompare);

    chrome.runtime.onMessage.addListener((message) => {
      if (message.action === 'recordSaved' || message.action === 'recordsSynced') {
        loadRecords(() => render());
      }
    });
  }

  function loadRecords(callback) {
    chrome.storage.local.get([STORAGE_KEYS.records], (result) => {
      records = result[STORAGE_KEYS.records] || [];
      if (callback) callback();
    });
  }

  function getFilteredRecords() {
    const query = els.search.value.trim().toLowerCase();
    const group = els.groupFilter.value;

    return records.filter((r) => {
      if (group && r.group !== group) return false;
      if (!query) return true;
      const haystack = [
        r.primaryFont,
        r.fallbackFonts,
        r.domain,
        r.pageTitle,
        r.sampleText,
        r.note,
        r.elementTag,
        ...(r.tags || [])
      ].join(' ').toLowerCase();
      return haystack.includes(query);
    });
  }

  function updateGroupOptions() {
    const currentValue = els.groupFilter.value;
    const groups = Array.from(new Set(records.map((r) => r.group).filter(Boolean))).sort();

    els.groupFilter.innerHTML = '<option value="">All groups</option>';
    groups.forEach((g) => {
      const option = document.createElement('option');
      option.value = g;
      option.textContent = g;
      els.groupFilter.appendChild(option);
    });

    if (groups.includes(currentValue)) {
      els.groupFilter.value = currentValue;
    }
  }

  function render() {
    updateGroupOptions();

    const filtered = getFilteredRecords();
    els.count.textContent = `${filtered.length} record${filtered.length === 1 ? '' : 's'}`;

    els.list.innerHTML = '';

    if (filtered.length === 0) {
      els.list.style.display = 'none';
      els.empty.classList.add('is-visible');
      els.selectionBar.hidden = true;
      return;
    }

    updateSelectionBar(filtered);

    els.list.style.display = 'flex';
    els.empty.classList.remove('is-visible');

    filtered.forEach((record) => {
      els.list.appendChild(renderRecordCard(record));
    });
  }

  function renderRecordCard(record) {
    const card = document.createElement('article');
    const isSelected = selectedIds.has(record.id);
    card.className = 'tp-card' + (isSelected ? ' tp-card-selected' : '');
    card.dataset.id = record.id;

    const isEditing = editingId === record.id;

    // Selection checkbox
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'tp-card-checkbox';
    checkbox.checked = isSelected;
    checkbox.addEventListener('change', (e) => {
      e.stopPropagation();
      if (checkbox.checked) {
        selectedIds.add(record.id);
      } else {
        selectedIds.delete(record.id);
      }
      render();
    });
    card.appendChild(checkbox);

    card.innerHTML = `
      <div class="tp-card-header">
        <div class="tp-card-preview" style="font-family: ${escapeHtml(record.fontFamilyCss)}">Ag</div>
        <div class="tp-card-meta">
          <p class="tp-card-font" style="font-family: ${escapeHtml(record.fontFamilyCss)}">${escapeHtml(record.primaryFont)}</p>
          ${record.fallbackFonts ? `<p class="tp-card-fallback">${escapeHtml(record.fallbackFonts)}</p>` : ''}
          <p class="tp-card-source">${escapeHtml(record.domain || 'unknown')} · ${escapeHtml(record.elementTag)} · ${formatDate(record.createdAt)}</p>
        </div>
        <div class="tp-card-actions">
          <button type="button" class="tp-icon-btn tp-edit-btn" title="Edit" aria-label="Edit">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
          </button>
          <button type="button" class="tp-icon-btn tp-export-btn" title="Export PNG" aria-label="Export PNG">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
          </button>
          <button type="button" class="tp-icon-btn tp-delete-btn" title="Delete" aria-label="Delete">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </div>
      </div>

      <div class="tp-metrics">
        <div class="tp-metric">
          <span class="tp-metric-label">Size</span>
          <span class="tp-metric-value">${escapeHtml(record.fontSize)}</span>
        </div>
        <div class="tp-metric">
          <span class="tp-metric-label">Weight</span>
          <span class="tp-metric-value">${escapeHtml(record.fontWeight)}</span>
        </div>
        <div class="tp-metric">
          <span class="tp-metric-label">Leading</span>
          <span class="tp-metric-value">${escapeHtml(record.lineHeight)}</span>
        </div>
      </div>

      <div class="tp-color-row">
        <span class="tp-swatch" style="background-color: ${escapeHtml(record.colorRaw)}"></span>
        <span class="tp-color-value">${escapeHtml(record.color)}</span>
        ${record.letterSpacing !== 'normal' ? `<span class="tp-metric-value" style="margin-left:auto;font-size:11px;color:var(--tp-text-secondary)">Tracking ${escapeHtml(record.letterSpacing)}</span>` : ''}
      </div>

      ${record.sampleText ? `<div class="tp-sample">“${escapeHtml(record.sampleText)}”</div>` : ''}
      ${record.note ? `<div class="tp-note">${escapeHtml(record.note)}</div>` : ''}
      ${record.tags && record.tags.length ? `<div class="tp-tags">${record.tags.map((t) => `<span class="tp-tag">${escapeHtml(t)}</span>`).join('')}</div>` : ''}
      ${record.group ? `<div class="tp-card-source">Group: ${escapeHtml(record.group)}</div>` : ''}
    `;

    if (isEditing) {
      const editor = createEditor(record);
      card.appendChild(editor);
    }

    card.querySelector('.tp-edit-btn').addEventListener('click', () => {
      editingId = record.id;
      render();
    });
    card.querySelector('.tp-export-btn').addEventListener('click', () => {
      exportRecordAsPNG(record);
    });
    card.querySelector('.tp-delete-btn').addEventListener('click', () => {
      deleteRecord(record.id);
    });

    return card;
  }

  function createEditor(record) {
    const editor = document.createElement('form');
    editor.className = 'tp-editor';
    editor.innerHTML = `
      <div class="tp-field">
        <label class="tp-field-label" for="note-${record.id}">Note</label>
        <textarea id="note-${record.id}" class="tp-note-input" placeholder="Add your research note...">${escapeHtml(record.note || '')}</textarea>
      </div>
      <div class="tp-field">
        <label class="tp-field-label" for="tags-${record.id}">Tags (comma separated)</label>
        <input id="tags-${record.id}" class="tp-tags-input" type="text" value="${escapeHtml((record.tags || []).join(', '))}" placeholder="serif, hero, bristol">
      </div>
      <div class="tp-field">
        <label class="tp-field-label" for="group-${record.id}">Group</label>
        <input id="group-${record.id}" class="tp-group-input" type="text" value="${escapeHtml(record.group || '')}" placeholder="Bristol Research">
      </div>
      <div class="tp-editor-actions">
        <button type="button" class="tp-btn tp-btn-secondary tp-cancel-btn">Cancel</button>
        <button type="submit" class="tp-btn tp-btn-primary">Save</button>
      </div>
    `;

    editor.querySelector('.tp-cancel-btn').addEventListener('click', () => {
      editingId = null;
      render();
    });

    editor.addEventListener('submit', (e) => {
      e.preventDefault();
      const note = editor.querySelector('.tp-note-input').value.trim();
      const tagsRaw = editor.querySelector('.tp-tags-input').value;
      const group = editor.querySelector('.tp-group-input').value.trim() || null;
      const tags = tagsRaw
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      chrome.runtime.sendMessage({ action: 'updateRecord', id: record.id, updates: { note, tags, group } }, (response) => {
        if (response && response.ok) {
          editingId = null;
          loadRecords(() => render());
        }
      });
    });

    return editor;
  }

  function deleteRecord(id) {
    const record = records.find((r) => r.id === id);
    const name = record ? record.primaryFont : 'this record';
    if (!confirm(`Delete "${name}"?`)) return;

    chrome.runtime.sendMessage({ action: 'deleteRecord', id }, (response) => {
      if (response && response.ok) {
        loadRecords(() => render());
      }
    });
  }

  function clearAllRecords() {
    if (!records.length) return;
    if (!confirm(`Delete all ${records.length} saved records? This cannot be undone.`)) return;

    chrome.storage.local.set({ [STORAGE_KEYS.records]: [] }, () => {
      loadRecords(() => render());
    });
  }

  function exportAllJSON() {
    if (!records.length) return;
    const blob = new Blob([JSON.stringify(records, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `typepeek-records-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  /* ---------- PNG Export ---------- */

  function exportRecordAsPNG(record) {
    const width = 800;
    const height = 500;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = '#18181b';
    roundRect(ctx, 0, 0, width, height, 20);
    ctx.fill();

    // Subtle border
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 2;
    roundRect(ctx, 1, 1, width - 2, height - 2, 20);
    ctx.stroke();

    // Header
    ctx.fillStyle = '#71717a';
    ctx.font = '600 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('TYPEPEEK STUDY CARD', 48, 48);

    // Font preview
    ctx.fillStyle = '#fafafa';
    ctx.font = `72px ${formatFontFamily(record.fontFamilyCss)}, -apple-system, BlinkMacSystemFont, sans-serif`;
    ctx.fillText('Ag', 48, 140);

    // Divider
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(48, 180);
    ctx.lineTo(width - 48, 180);
    ctx.stroke();

    // Metrics
    const metrics = [
      ['FONT', record.primaryFont],
      ['SIZE', record.fontSize],
      ['WEIGHT', record.fontWeight],
      ['LEADING', record.lineHeight],
      ['COLOR', record.color],
      ['TRACKING', record.letterSpacing !== 'normal' ? record.letterSpacing : 'normal']
    ];

    let y = 220;
    const labelColor = '#71717a';
    const valueColor = '#fafafa';
    ctx.font = '500 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

    metrics.forEach(([label, value]) => {
      ctx.fillStyle = labelColor;
      ctx.fillText(label, 48, y);
      ctx.fillStyle = valueColor;
      ctx.font = `500 16px ${formatFontFamily(record.fontFamilyCss)}, -apple-system, BlinkMacSystemFont, sans-serif`;
      ctx.fillText(value, 180, y);
      ctx.font = '500 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      y += 36;
    });

    // Color swatch
    ctx.fillStyle = record.colorRaw || record.color;
    ctx.beginPath();
    ctx.arc(700, 220, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Footer divider
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.beginPath();
    ctx.moveTo(48, 330);
    ctx.lineTo(width - 48, 330);
    ctx.stroke();

    // Context
    y = 360;
    ctx.fillStyle = '#a1a1a6';
    ctx.font = '500 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(`Found on: ${record.domain || 'unknown'}`, 48, y);

    if (record.sampleText) {
      y += 28;
      ctx.fillText(`Sample: “${record.sampleText}”`, 48, y);
    }

    if (record.note) {
      y += 28;
      const lines = wrapText(ctx, `Note: ${record.note}`, width - 96, '500 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif');
      lines.forEach((line) => {
        ctx.fillText(line, 48, y);
        y += 22;
      });
    }

    if (record.tags && record.tags.length) {
      y += 8;
      ctx.fillText(`Tags: ${record.tags.join(', ')}`, 48, y);
    }

    y += 28;
    ctx.fillStyle = '#71717a';
    ctx.font = '500 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(`Saved: ${formatDate(record.createdAt)}`, 48, y);

    // Download
    const link = document.createElement('a');
    const safeName = record.primaryFont.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    link.download = `typepeek-${safeName || 'record'}-${record.id}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }

  function roundRect(ctx, x, y, w, h, r) {
    const radius = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + w - radius, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
    ctx.lineTo(x + w, y + h - radius);
    ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
    ctx.lineTo(x + radius, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  function wrapText(ctx, text, maxWidth, font) {
    ctx.font = font;
    const words = text.split(' ');
    const lines = [];
    let current = words[0];
    for (let i = 1; i < words.length; i++) {
      const test = current + ' ' + words[i];
      if (ctx.measureText(test).width < maxWidth) {
        current = test;
      } else {
        lines.push(current);
        current = words[i];
      }
    }
    lines.push(current);
    return lines;
  }

  function formatFontFamily(cssValue) {
    if (!cssValue) return 'sans-serif';
    return cssValue.split(',').map((name) => {
      const n = name.trim().replace(/^["']|["']$/g, '');
      if (/\s/.test(n)) return `"${n}"`;
      return n;
    }).join(', ');
  }

  /* ---------- Utilities ---------- */

  function escapeHtml(str) {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function loadSyncStatus() {
    chrome.runtime.sendMessage({ action: 'getSyncStatus' }, (response) => {
      if (chrome.runtime.lastError || !response) return;
      els.syncToggle.checked = response.enabled === true;
      updateSyncLabel(response);
    });
  }

  function toggleSync(enabled) {
    chrome.runtime.sendMessage({ action: 'toggleSync', enabled }, (response) => {
      if (chrome.runtime.lastError || !response) {
        els.syncToggle.checked = !enabled;
        return;
      }
      updateSyncLabel(response);
    });
  }

  function updateSyncLabel(state) {
    if (!state || !state.enabled) {
      els.syncStatus.textContent = 'Sync off';
      els.syncStatus.style.color = '';
      return;
    }
    const kb = state.bytesUsed ? (state.bytesUsed / 1024).toFixed(1) : '0.0';
    const limitKb = (state.limit / 1024).toFixed(0);
    els.syncStatus.textContent = `Synced (${kb}/${limitKb}KB)`;
    els.syncStatus.style.color = 'var(--tp-success)';
  }

  function updateSelectionBar(filtered) {
    const count = filtered.filter((r) => selectedIds.has(r.id)).length;
    els.selectionBar.hidden = false;
    els.selectionCount.textContent = count + ' selected';
    els.selectAll.checked = count === filtered.length && filtered.length > 0;
    els.compareBtn.hidden = count !== 2;
  }

  async function exportSelectedAsZip() {
    const selected = records.filter((r) => selectedIds.has(r.id));
    if (selected.length === 0) return;

    const zip = new JSZip();
    const folder = zip.folder('typepeek-export');

    for (let i = 0; i < selected.length; i++) {
      const record = selected[i];
      const canvas = await renderRecordToCanvas(record);
      if (canvas) {
        const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
        const safeName = record.primaryFont.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        folder.file(safeName + '-' + record.id + '.png', blob);
      }
    }

    folder.file('records.json', JSON.stringify(selected, null, 2));

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'typepeek-export-' + new Date().toISOString().slice(0, 10) + '.zip';
    a.click();
    URL.revokeObjectURL(url);

    selectedIds.clear();
    render();
  }

  function renderRecordToCanvas(record) {
    return new Promise((resolve) => {
      const width = 800;
      const height = 500;
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      // Background
      ctx.fillStyle = '#18181b';
      ctx.beginPath();
      const r = 20;
      ctx.moveTo(r, 0);
      ctx.lineTo(width - r, 0);
      ctx.quadraticCurveTo(width, 0, width, r);
      ctx.lineTo(width, height - r);
      ctx.quadraticCurveTo(width, height, width - r, height);
      ctx.lineTo(r, height);
      ctx.quadraticCurveTo(0, height, 0, height - r);
      ctx.lineTo(0, r);
      ctx.quadraticCurveTo(0, 0, r, 0);
      ctx.closePath();
      ctx.fill();

      // Header
      ctx.fillStyle = '#71717a';
      ctx.font = '600 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('TYPEPEEK STUDY CARD', 48, 48);

      // Font preview
      ctx.fillStyle = '#fafafa';
      ctx.font = '72px ' + (record.fontFamilyCss || 'sans-serif');
      ctx.fillText('Ag', 48, 140);

      ctx.strokeStyle = 'rgba(255,255,255,0.08)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(48, 180);
      ctx.lineTo(width - 48, 180);
      ctx.stroke();

      const metrics = [
        ['FONT', record.primaryFont],
        ['SIZE', record.fontSize],
        ['WEIGHT', record.fontWeight],
        ['LEADING', record.lineHeight],
        ['COLOR', record.color],
        ['TRACKING', record.letterSpacing !== 'normal' ? record.letterSpacing : 'normal']
      ];

      let y = 220;
      ctx.font = '500 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      metrics.forEach(([label, value]) => {
        ctx.fillStyle = '#71717a';
        ctx.fillText(label, 48, y);
        ctx.fillStyle = '#fafafa';
        ctx.font = '500 16px ' + (record.fontFamilyCss || 'sans-serif');
        ctx.fillText(value, 180, y);
        ctx.font = '500 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        y += 36;
      });

      // Color swatch
      ctx.fillStyle = record.colorRaw || record.color;
      ctx.beginPath();
      ctx.arc(700, 220, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.2)';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.strokeStyle = 'rgba(255,255,255,0.08)';
      ctx.beginPath();
      ctx.moveTo(48, 330);
      ctx.lineTo(width - 48, 330);
      ctx.stroke();

      y = 360;
      ctx.fillStyle = '#a1a1a6';
      ctx.font = '500 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText('Found on: ' + (record.domain || 'unknown'), 48, y);

      if (record.note) {
        y += 28;
        ctx.fillText('Note: ' + record.note, 48, y);
      }

      if (record.tags && record.tags.length) {
        y += 28;
        ctx.fillText('Tags: ' + record.tags.join(', '), 48, y);
      }

      y += 28;
      ctx.fillStyle = '#71717a';
      ctx.font = '500 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText('Saved: ' + formatDate(record.createdAt), 48, y);

      resolve(canvas);
    });
  }

  function openCompare() {
    const selected = records.filter((r) => selectedIds.has(r.id));
    if (selected.length !== 2) return;
    els.compareOverlay.hidden = false;
    els.compareBody.innerHTML = '';
    els.compareBody.appendChild(buildCompareColumn(selected[0], 'A'));
    els.compareBody.appendChild(buildCompareColumn(selected[1], 'B'));
  }

  function closeCompare() {
    els.compareOverlay.hidden = true;
  }

  function buildCompareColumn(record, label) {
    const col = document.createElement('div');
    col.className = 'tp-compare-col';

    const metrics = [
      { label: 'Font', value: record.primaryFont, key: 'primaryFont' },
      { label: 'Size', value: record.fontSize, key: 'fontSize' },
      { label: 'Weight', value: record.fontWeight, key: 'fontWeight' },
      { label: 'Leading', value: record.lineHeight, key: 'lineHeight' },
      { label: 'Color', value: record.color, key: 'color' },
      { label: 'Tracking', value: record.letterSpacing !== 'normal' ? record.letterSpacing : 'normal', key: 'letterSpacing' }
    ];

    const otherRecord = records.filter((r) => selectedIds.has(r.id) && r.id !== record.id)[0];

    col.innerHTML = `
      <div class="tp-compare-preview" style="font-family: ${escapeHtml(record.fontFamilyCss)}">${label}</div>
      <div>
        <div class="tp-compare-font-name" style="font-family: ${escapeHtml(record.fontFamilyCss)}">${escapeHtml(record.primaryFont)}</div>
        ${record.fallbackFonts ? '<div class="tp-compare-fallback">' + escapeHtml(record.fallbackFonts) + '</div>' : ''}
      </div>
      <div class="tp-compare-metrics">
        ${metrics.map((m) => {
          const otherVal = otherRecord ? otherRecord[m.key] : null;
          const isDiff = otherRecord && m.value !== otherVal;
          return '<div class="tp-compare-row">' +
            '<span class="tp-compare-row-label">' + m.label + '</span>' +
            '<span class="tp-compare-row-value' + (isDiff ? ' tp-diff' : '') + '">' +
            (m.key === 'color' ? '<span class="tp-compare-swatch" style="background-color:' + escapeHtml(record.colorRaw || record.color) + '"></span>' : '') +
            escapeHtml(m.value) + '</span>' +
          '</div>';
        }).join('')}
      </div>
      <div class="tp-compare-source">
        ${escapeHtml(record.domain || 'unknown')} · ${escapeHtml(record.elementTag || '')}<br>
        ${escapeHtml(record.sampleText || '')}
      </div>
    `;

    return col;
  }

  function formatDate(ts) {
    if (!ts) return '';
    const d = new Date(ts);
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  }

  init();
})();
