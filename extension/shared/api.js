/**
 * Artha Extension API Client
 * Interfaces with the Flask / PostgreSQL / Gemma 4 backend.
 */

const DEFAULT_BASE_URL = 'http://localhost:5000';

class ArthaApiClient {
  constructor() {
    this.baseUrl = DEFAULT_BASE_URL;
    this.init();
  }

  async init() {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      const data = await chrome.storage.local.get(['apiBaseUrl']);
      if (data && data.apiBaseUrl) {
        this.baseUrl = data.apiBaseUrl.replace(/\/+$/, '');
      }
    }
  }

  async setBaseUrl(url) {
    this.baseUrl = (url || DEFAULT_BASE_URL).replace(/\/+$/, '');
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      await chrome.storage.local.set({ apiBaseUrl: this.baseUrl });
    }
  }

  async request(path, options = {}) {
    await this.init();
    const url = `${this.baseUrl}${path.startsWith('/') ? path : '/' + path}`;
    const headers = options.headers || {};

    const fetchOptions = {
      ...options,
      headers,
      credentials: 'include', // Pass session cookies
    };

    try {
      const resp = await fetch(url, fetchOptions);
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        const errorMsg = data.error || data.message || `HTTP ${resp.status}`;
        const err = new Error(errorMsg);
        err.status = resp.status;
        err.data = data;
        throw err;
      }
      return data;
    } catch (err) {
      console.warn(`[Artha API] Request failed: ${path}`, err);
      throw err;
    }
  }

  // ── Auth ───────────────────────────────────────────────────────────────────
  async login(email, password) {
    const data = await this.request('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      await chrome.storage.local.set({ user: data });
    }
    return data;
  }

  async logout() {
    try {
      await this.request('/api/logout', { method: 'POST' });
    } finally {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        await chrome.storage.local.remove(['user']);
      }
    }
  }

  async getMe() {
    return this.request('/api/me');
  }

  // ── Artha Engine & Intelligence ────────────────────────────────────────────
  async getOverview() {
    return this.request('/api/artha/overview');
  }

  async getSafeToSpend(buffer = 0.15) {
    return this.request(`/api/artha/safe-to-spend?buffer=${buffer}`);
  }

  async getAnomalies() {
    return this.request('/api/artha/anomalies');
  }

  async getCoach(metric = 'safe-to-spend', language = 'english') {
    return this.request('/api/artha/coach', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ metric, language })
    });
  }

  async voiceAsk(query, language = 'english') {
    return this.request('/api/artha/voice-ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, language })
    });
  }

  // ── Ingestion & Receipt Clipping ───────────────────────────────────────────
  async uploadText(text, docType = 'web_receipt') {
    return this.request('/api/artha/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, doc_type: docType })
    });
  }

  async uploadFile(fileBlob, filename = 'receipt.png', docType = 'receipt_screenshot') {
    const formData = new FormData();
    formData.append('file', fileBlob, filename);
    formData.append('doc_type', docType);

    await this.init();
    const url = `${this.baseUrl}/api/artha/upload`;
    const resp = await fetch(url, {
      method: 'POST',
      body: formData,
      credentials: 'include'
    });
    const data = await resp.json().catch(() => ({}));
    if (!resp.ok) {
      throw new Error(data.error || `HTTP ${resp.status}`);
    }
    return data;
  }

  async confirmRows(docType, provider, rows) {
    return this.request('/api/artha/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ doc_type: docType, provider, rows })
    });
  }
}

const arthaApi = new ArthaApiClient();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { arthaApi, ArthaApiClient, DEFAULT_BASE_URL };
}
if (typeof window !== 'undefined') {
  window.arthaApi = arthaApi;
  window.DEFAULT_BASE_URL = DEFAULT_BASE_URL;
}
