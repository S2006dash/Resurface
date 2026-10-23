/**
 * Artha Extension - Background Service Worker (Manifest V3)
 */

importScripts('../shared/jargon.js', '../shared/api.js');

// ── Context Menus Setup ───────────────────────────────────────────────────────
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'artha-explain-selection',
    title: '💡 Explain with Artha Jargon Buster: "%s"',
    contexts: ['selection']
  });

  chrome.contextMenus.create({
    id: 'artha-clip-text',
    title: '📥 Clip Transaction Text to Artha',
    contexts: ['selection']
  });

  chrome.contextMenus.create({
    id: 'artha-clip-screenshot',
    title: '📸 Capture Receipt Screenshot to Artha',
    contexts: ['page', 'image']
  });

  chrome.contextMenus.create({
    id: 'artha-open-sidepanel',
    title: '📊 Open Artha Companion Panel',
    contexts: ['action']
  });

  console.log('[Artha] Background service worker initialized.');
});

// ── Handle Context Menu Clicks ────────────────────────────────────────────────
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!tab || !tab.id) return;

  // 1. Explain selected financial term
  if (info.menuItemId === 'artha-explain-selection') {
    const text = (info.selectionText || '').trim();
    chrome.tabs.sendMessage(tab.id, {
      type: 'ARTHA_TRIGGER_JARGON',
      text: text
    });
  }

  // 2. Clip highlighted text to Artha
  else if (info.menuItemId === 'artha-clip-text') {
    const text = (info.selectionText || '').trim();
    try {
      chrome.tabs.sendMessage(tab.id, {
        type: 'ARTHA_SHOW_NOTIFICATION',
        message: 'Reading transaction with Gemma 4 OCR...',
        status: 'loading'
      });

      const res = await arthaApi.uploadText(text, 'web_text_clip');
      const rows = res.rows || [];

      chrome.tabs.sendMessage(tab.id, {
        type: 'ARTHA_SHOW_NOTIFICATION',
        message: rows.length > 0
          ? `✓ Extracted ${rows.length} transaction(s)! Opening Artha review...`
          : 'Gemma 4 analyzed text. Check Artha Side Panel.',
        status: 'success',
        data: res
      });

      // Try opening sidepanel if available
      if (chrome.sidePanel && chrome.sidePanel.open) {
        chrome.sidePanel.open({ tabId: tab.id });
      }
    } catch (err) {
      chrome.tabs.sendMessage(tab.id, {
        type: 'ARTHA_SHOW_NOTIFICATION',
        message: `Upload failed: ${err.message || 'Make sure Artha backend is running'}`,
        status: 'error'
      });
    }
  }

  // 3. Capture visible receipt screenshot and upload
  else if (info.menuItemId === 'artha-clip-screenshot') {
    try {
      chrome.tabs.sendMessage(tab.id, {
        type: 'ARTHA_SHOW_NOTIFICATION',
        message: 'Capturing visible receipt screenshot...',
        status: 'loading'
      });

      const dataUrl = await chrome.tabs.captureVisibleTab(tab.windowId, { format: 'png' });
      const blob = await (await fetch(dataUrl)).blob();

      chrome.tabs.sendMessage(tab.id, {
        type: 'ARTHA_SHOW_NOTIFICATION',
        message: 'Gemma 4 analyzing receipt...',
        status: 'loading'
      });

      const res = await arthaApi.uploadFile(blob, 'web_capture.png', 'receipt_screenshot');
      const rowCount = (res.rows || []).length;

      chrome.tabs.sendMessage(tab.id, {
        type: 'ARTHA_SHOW_NOTIFICATION',
        message: `✓ Extracted ${rowCount} item(s) from receipt! Opening Artha...`,
        status: 'success',
        data: res
      });

      if (chrome.sidePanel && chrome.sidePanel.open) {
        chrome.sidePanel.open({ tabId: tab.id });
      }
    } catch (err) {
      chrome.tabs.sendMessage(tab.id, {
        type: 'ARTHA_SHOW_NOTIFICATION',
        message: `Screenshot capture failed: ${err.message}`,
        status: 'error'
      });
    }
  }

  // 4. Open side panel
  else if (info.menuItemId === 'artha-open-sidepanel') {
    if (chrome.sidePanel && chrome.sidePanel.open) {
      chrome.sidePanel.open({ tabId: tab.id });
    }
  }
});

// ── In-Memory Cache for Safe-to-Spend ─────────────────────────────────────────
let cachedSafeToSpend = null;
let lastCacheTime = 0;
const CACHE_TTL_MS = 60 * 1000; // 1 minute

async function getCachedSafeToSpend() {
  const now = Date.now();
  if (cachedSafeToSpend && (now - lastCacheTime < CACHE_TTL_MS)) {
    return cachedSafeToSpend;
  }
  try {
    const data = await arthaApi.getSafeToSpend(0.15);
    cachedSafeToSpend = data;
    lastCacheTime = now;
    return data;
  } catch (e) {
    if (cachedSafeToSpend) return cachedSafeToSpend;
    throw e;
  }
}

// ── Message Dispatcher ────────────────────────────────────────────────────────
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'GET_SAFE_TO_SPEND') {
    getCachedSafeToSpend()
      .then(data => sendResponse({ success: true, data }))
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true; // Keep async channel open
  }

  if (msg.type === 'LOOKUP_JARGON') {
    const match = findFinancialTerm(msg.term);
    sendResponse({ match });
    return false;
  }

  if (msg.type === 'OPEN_SIDEPANEL') {
    if (chrome.sidePanel && chrome.sidePanel.open && sender.tab) {
      chrome.sidePanel.open({ tabId: sender.tab.id });
      sendResponse({ success: true });
    } else {
      sendResponse({ success: false, reason: 'sidePanel not supported or no sender tab' });
    }
    return false;
  }

  if (msg.type === 'CLIP_RECEIPT_TEXT') {
    arthaApi.uploadText(msg.text, msg.docType || 'web_clip')
      .then(data => sendResponse({ success: true, data }))
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true;
  }
});
