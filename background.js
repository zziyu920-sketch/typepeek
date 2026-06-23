const CURRENT_VERSION = '1.1.0';
const STORAGE_KEYS = {
  records: 'typepeek_records',
  settings: 'typepeek_settings',
  version: 'typepeek_version',
  sync: 'typepeek_sync'
};

const SYNC_LIMIT = 102400; // chrome.storage.sync max bytes (100KB)

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    chrome.storage.local.set({
      [STORAGE_KEYS.version]: CURRENT_VERSION,
      [STORAGE_KEYS.records]: [],
      [STORAGE_KEYS.settings]: {
        version: CURRENT_VERSION,
        tags: [],
        groups: []
      }
    });
  } else if (details.reason === 'update') {
    chrome.storage.local.get([STORAGE_KEYS.version], (result) => {
      const fromVersion = result[STORAGE_KEYS.version] || '1.0.1';
      migrate(fromVersion, CURRENT_VERSION);
    });
  }
});

function migrate(fromVersion, toVersion) {
  // Placeholder for future schema migrations.
  // 1.0.1 -> 1.1.0: only adds new keys; existing data is left untouched.
  chrome.storage.local.set({ [STORAGE_KEYS.version]: toVersion });
}

// Keep service worker alive for runtime message relay between content scripts and popup.
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Only accept messages from this extension's own contexts.
  if (!sender.id || sender.id !== chrome.runtime.id) return false;

  if (message.action === 'ping') {
    sendResponse({ ok: true });
    return false;
  }

  if (message.action === 'saveRecord' && message.record) {
    chrome.storage.local.get([STORAGE_KEYS.records], (result) => {
      const records = result[STORAGE_KEYS.records] || [];
      records.unshift(message.record);
      chrome.storage.local.set({ [STORAGE_KEYS.records]: records }, () => {
        // Broadcast to any open popups.
        chrome.runtime.sendMessage({ action: 'recordSaved', recordId: message.record.id }).catch(() => {});
        sendResponse({ ok: true });
      });
    });
    return true;
  }

  if (message.action === 'updateRecord' && message.id && message.updates) {
    chrome.storage.local.get([STORAGE_KEYS.records], (result) => {
      const records = result[STORAGE_KEYS.records] || [];
      const index = records.findIndex((r) => r.id === message.id);
      if (index === -1) {
        sendResponse({ ok: false, error: 'Record not found' });
        return;
      }
      records[index] = { ...records[index], ...message.updates, updatedAt: Date.now() };
      chrome.storage.local.set({ [STORAGE_KEYS.records]: records }, () => {
        sendResponse({ ok: true });
      });
    });
    return true;
  }

  if (message.action === 'deleteRecord' && message.id) {
    chrome.storage.local.get([STORAGE_KEYS.records], (result) => {
      const records = result[STORAGE_KEYS.records] || [];
      const next = records.filter((r) => r.id !== message.id);
      chrome.storage.local.set({ [STORAGE_KEYS.records]: next }, () => {
        sendResponse({ ok: true });
      });
    });
    return true;
  }

  if (message.action === 'openPopup') {
    chrome.action.openPopup().catch(() => {
      chrome.windows.create({
        url: chrome.runtime.getURL('popup.html'),
        type: 'popup',
        width: 420,
        height: 620
      });
    });
    return false;
  }

  if (message.action === 'getSyncStatus') {
    chrome.storage.sync.get([STORAGE_KEYS.sync], (result) => {
      const syncState = result[STORAGE_KEYS.sync] || { enabled: false };
      chrome.storage.sync.getBytesInUse(null, (bytesUsed) => {
        sendResponse({ ...syncState, bytesUsed, limit: SYNC_LIMIT });
      });
    });
    return true;
  }

  if (message.action === 'toggleSync') {
    const enabled = !!message.enabled;
    const syncState = { enabled, lastSynced: enabled ? Date.now() : null };
    chrome.storage.sync.set({ [STORAGE_KEYS.sync]: syncState }, () => {
      if (enabled) {
        syncRecordsToSyncStorage(() => sendResponse({ ok: true, ...syncState }));
      } else {
        chrome.storage.sync.remove('typepeek_sync_records', () => {
          sendResponse({ ok: true, ...syncState });
        });
      }
    });
    return true;
  }

  if (message.action === 'syncNow') {
    syncRecordsToSyncStorage((success) => {
      const syncState = { enabled: true, lastSynced: success ? Date.now() : null };
      chrome.storage.sync.set({ [STORAGE_KEYS.sync]: syncState }, () => {
        sendResponse({ ok: success, ...syncState });
      });
    });
    return true;
  }

  return false;
});

// ── Sync helpers ──

function syncRecordsToSyncStorage(callback) {
  chrome.storage.local.get([STORAGE_KEYS.records], (result) => {
    const records = result[STORAGE_KEYS.records] || [];
    // Strip large fields for sync efficiency
    const slim = records.map((r) => ({
      id: r.id,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      primaryFont: r.primaryFont,
      fallbackFonts: r.fallbackFonts,
      fontSize: r.fontSize,
      fontWeight: r.fontWeight,
      lineHeight: r.lineHeight,
      color: r.color,
      colorRaw: r.colorRaw,
      letterSpacing: r.letterSpacing,
      fontFamilyCss: r.fontFamilyCss,
      domain: r.domain,
      pageTitle: r.pageTitle,
      elementTag: r.elementTag,
      sampleText: r.sampleText,
      note: r.note,
      tags: r.tags,
      group: r.group
    }));
    const payload = JSON.stringify(slim);
    if (payload.length > SYNC_LIMIT * 0.95) {
      // Trim oldest records until under limit
      while (slim.length > 1 && JSON.stringify(slim).length > SYNC_LIMIT * 0.95) {
        slim.pop();
      }
    }
    chrome.storage.sync.set({ typepeek_sync_records: slim }, () => {
      if (callback) callback(true);
    });
  });
}

// Pull changes from other synced devices
chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'sync') return;
  if (!changes.typepeek_sync_records || !changes.typepeek_sync_records.newValue) return;

  // Check if sync is enabled locally
  chrome.storage.sync.get([STORAGE_KEYS.sync], (result) => {
    const syncState = result[STORAGE_KEYS.sync];
    if (!syncState || !syncState.enabled) return;

    const remoteRecords = changes.typepeek_sync_records.newValue;
    chrome.storage.local.get([STORAGE_KEYS.records], (localResult) => {
      const localRecords = localResult[STORAGE_KEYS.records] || [];
      const localMap = new Map(localRecords.map((r) => [r.id, r]));
      let merged = false;

      remoteRecords.forEach((rr) => {
        const existing = localMap.get(rr.id);
        if (!existing || rr.updatedAt > existing.updatedAt) {
          localMap.set(rr.id, { ...rr, url: rr.url || '', _synced: true });
          merged = true;
        }
      });

      if (merged) {
        const mergedRecords = Array.from(localMap.values()).sort((a, b) => b.createdAt - a.createdAt);
        chrome.storage.local.set({ [STORAGE_KEYS.records]: mergedRecords }, () => {
          chrome.runtime.sendMessage({ action: 'recordsSynced' }).catch(() => {});
        });
      }
    });
  });
});
