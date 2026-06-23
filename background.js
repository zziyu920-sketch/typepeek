const CURRENT_VERSION = '1.1.0';
const STORAGE_KEYS = {
  records: 'typepeek_records',
  settings: 'typepeek_settings',
  version: 'typepeek_version'
};

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

  return false;
});
