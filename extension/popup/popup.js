/**
 * Artha Extension Popup Script
 */

const fmt = n => '₹' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });

document.addEventListener('DOMContentLoaded', async () => {
  const statusEl = document.getElementById('connection-status');
  const loginSection = document.getElementById('login-section');
  const dashboardSection = document.getElementById('dashboard-section');

  const safeAmountEl = document.getElementById('safe-amount');
  const safeSubtextEl = document.getElementById('safe-subtext');
  const netWorthEl = document.getElementById('net-worth-val');
  const monthSpendEl = document.getElementById('month-spend-val');
  const alertBanner = document.getElementById('alert-banner');
  const alertText = document.getElementById('alert-text');

  const btnLogin = document.getElementById('btn-login');
  const btnLogout = document.getElementById('btn-logout');
  const btnOpenSidepanel = document.getElementById('btn-open-sidepanel');
  const btnQuickIngest = document.getElementById('btn-quick-ingest');
  const quickInput = document.getElementById('quick-sms-input');
  const quickResult = document.getElementById('quick-ingest-result');

  function setStatus(online, text) {
    const dot = statusEl.querySelector('.status-dot');
    const txt = statusEl.querySelector('.status-text');
    dot.className = `status-dot ${online ? 'online' : 'offline'}`;
    txt.textContent = text || (online ? 'Connected' : 'Offline');
  }

  async function checkAuthAndLoad() {
    try {
      setStatus(false, 'Connecting...');
      const me = await arthaApi.getMe();
      setStatus(true, `${me.full_name ? me.full_name.split(' ')[0] : 'Connected'}`);
      showDashboard();
      await loadDashboardData();
    } catch (err) {
      if (err.status === 401) {
        setStatus(false, 'Login Required');
        showLogin();
      } else {
        setStatus(false, 'Offline');
        showLogin(`Cannot connect to backend (${err.message || 'Make sure Flask is running on port 5000'})`);
      }
    }
  }

  function showLogin(customError = null) {
    loginSection.classList.remove('hidden');
    dashboardSection.classList.add('hidden');
    const errEl = document.getElementById('login-error');
    if (customError) {
      errEl.textContent = customError;
    } else {
      errEl.textContent = '';
    }
  }

  function showDashboard() {
    loginSection.classList.add('hidden');
    dashboardSection.classList.remove('hidden');
  }

  async function loadDashboardData() {
    try {
      const data = await arthaApi.getOverview();

      // Safe to spend
      const s2s = data.safe_to_spend || {};
      const amount = s2s.safe_to_spend ?? 0;
      safeAmountEl.textContent = fmt(amount);
      safeSubtextEl.textContent = s2s.explanation || 'Calculated after upcoming bills and savings commitments.';

      // Net worth
      const nw = data.net_worth || {};
      netWorthEl.textContent = fmt(nw.net_worth || 0);

      // Cash flow expense
      const cf = data.cash_flow || {};
      monthSpendEl.textContent = fmt(Math.abs(cf.monthly_expense || 0));

      // Alerts & Bills Due
      const bills = data.bills_due || [];
      if (bills.length > 0) {
        const nextBill = bills[0];
        alertBanner.classList.remove('hidden');
        alertText.textContent = `${nextBill.merchant || 'Bill'}: ${fmt(nextBill.amount)} due in ${nextBill.days_until ?? 0} days`;
      } else if (data.anomalies_count > 0) {
        alertBanner.classList.remove('hidden');
        alertText.textContent = `${data.anomalies_count} spending spike or subscription alert(s) detected`;
      } else {
        alertBanner.classList.add('hidden');
      }
    } catch (err) {
      console.error('Failed to load dashboard:', err);
      safeSubtextEl.textContent = 'Could not fetch data. Check Artha backend.';
    }
  }

  // ── Login Handler ──────────────────────────────────────────────────────────
  btnLogin.onclick = async () => {
    const email = document.getElementById('login-email').value.trim();
    const pass = document.getElementById('login-password').value;
    const errEl = document.getElementById('login-error');
    errEl.textContent = '';
    btnLogin.textContent = 'Signing in...';

    try {
      await arthaApi.login(email, pass);
      await checkAuthAndLoad();
    } catch (err) {
      errEl.textContent = err.message || 'Login failed. Invalid email/password.';
    } finally {
      btnLogin.textContent = 'Sign In';
    }
  };

  // ── Logout Handler ─────────────────────────────────────────────────────────
  btnLogout.onclick = async (e) => {
    e.preventDefault();
    await arthaApi.logout();
    checkAuthAndLoad();
  };

  // ── Quick Ingest Handler ───────────────────────────────────────────────────
  btnQuickIngest.onclick = async () => {
    const text = quickInput.value.trim();
    if (!text) return;

    btnQuickIngest.disabled = true;
    btnQuickIngest.textContent = 'Reading with Gemma 4...';
    quickResult.classList.remove('hidden');
    quickResult.textContent = 'Extracting transaction rows...';

    try {
      const resp = await arthaApi.uploadText(text, 'sms_clip');
      const rows = resp.rows || [];
      if (rows.length > 0) {
        const r = rows[0];
        quickResult.innerHTML = `<strong>✓ Extracted:</strong> ${r.merchant || 'Expense'} · ${fmt(r.amount)} · <em>${r.category}</em> (Confidence: ${(r.confidence * 100).toFixed(0)}%)`;
        quickInput.value = '';
      } else {
        quickResult.textContent = 'No transaction rows parsed from text.';
      }
    } catch (err) {
      quickResult.textContent = `Error: ${err.message}`;
    } finally {
      btnQuickIngest.disabled = false;
      btnQuickIngest.textContent = 'Process with Gemma 4';
    }
  };

  // ── Open Side Panel ────────────────────────────────────────────────────────
  btnOpenSidepanel.onclick = async () => {
    if (chrome.sidePanel && chrome.sidePanel.open) {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab) {
        chrome.sidePanel.open({ tabId: tab.id });
        window.close(); // Close popup when opening side panel
      }
    } else {
      chrome.tabs.create({ url: chrome.runtime.getURL('sidepanel/sidepanel.html') });
    }
  };

  // Initial load
  checkAuthAndLoad();
});
