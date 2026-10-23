/**
 * Artha Companion Side Panel Script
 */

const fmt = n => '₹' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });

document.addEventListener('DOMContentLoaded', async () => {
  let currentOverview = null;
  let proposedData = null;
  let activeJargonLang = 'en';

  // ── Tab Switching ─────────────────────────────────────────────────────────
  const tabBtns = document.querySelectorAll('.sp-nav-btn');
  const tabPanes = document.querySelectorAll('.sp-tab-pane');

  tabBtns.forEach(btn => {
    btn.onclick = () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      tabPanes.forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      const pane = document.getElementById(btn.dataset.tab);
      if (pane) pane.classList.add('active');
    };
  });

  // ── Refresh Button ────────────────────────────────────────────────────────
  document.getElementById('btn-refresh').onclick = async () => {
    const btn = document.getElementById('btn-refresh');
    btn.style.transform = 'rotate(180deg)';
    await loadAllData();
    setTimeout(() => { btn.style.transform = 'none'; }, 300);
  };

  // ── Safe-to-Spend Buffer Slider ───────────────────────────────────────────
  const bufferSlider = document.getElementById('buffer-slider');
  const bufferValText = document.getElementById('slider-buffer-val');
  const bufferBadge = document.getElementById('s2s-buffer-badge');

  bufferSlider.oninput = async (e) => {
    const val = e.target.value;
    bufferValText.textContent = `${val}%`;
    bufferBadge.textContent = `${val}% Cushion Buffer`;
    try {
      const res = await arthaApi.getSafeToSpend(val / 100);
      updateSafeToSpendUI(res);
    } catch (err) {
      console.warn('Failed to update buffer:', err);
    }
  };

  function updateSafeToSpendUI(s2s) {
    if (!s2s) return;
    document.getElementById('s2s-amount').textContent = fmt(s2s.safe_to_spend || 0);
    document.getElementById('s2s-desc').textContent = s2s.explanation || 'Calculated after bills, obligations, and buffer.';
  }

  // ── Load All Data ──────────────────────────────────────────────────────────
  async function loadAllData() {
    try {
      const me = await arthaApi.getMe();
      if (me && me.full_name) {
        document.getElementById('user-display').textContent = me.full_name.split(' ')[0] || me.email;
      }

      currentOverview = await arthaApi.getOverview();

      // Safe to spend
      updateSafeToSpendUI(currentOverview.safe_to_spend);

      // Net worth
      document.getElementById('nw-amount').textContent = fmt(currentOverview.net_worth?.net_worth || 0);

      // Cash flow
      const cf = currentOverview.cash_flow || {};
      document.getElementById('income-amount').textContent = fmt(cf.monthly_income || 0);
      document.getElementById('expense-amount').textContent = fmt(Math.abs(cf.monthly_expense || 0));
      document.getElementById('savings-rate').textContent = `${(cf.savings_rate_pct ?? 36)}%`;

      // Resilience
      const res = currentOverview.resilience || {};
      document.getElementById('resilience-grade').textContent = res.verdict || 'Good';
      document.getElementById('r-runway').textContent = `${(res.runway_months || 3.2).toFixed(1)} months`;
      document.getElementById('fill-runway').style.width = `${Math.min(100, (res.runway_months || 3.2) * 20)}%`;

      document.getElementById('r-coverage').textContent = `${Math.min(100, Math.round((res.obligations_ratio || 0.92) * 100))}%`;
      document.getElementById('fill-coverage').style.width = `${Math.min(100, Math.round((res.obligations_ratio || 0.92) * 100))}%`;

      // Render Bills & Anomalies tabs
      renderBills(currentOverview.bills_due || []);
      renderAnomalies();
      renderJargonList();
    } catch (err) {
      console.error('Failed to load sidepanel data:', err);
      // Auto-try demo login if 401
      if (err.status === 401) {
        try {
          await arthaApi.login('priya@demo.artha', 'demo1234');
          await loadAllData();
        } catch (e) {
          document.getElementById('s2s-desc').textContent = 'Please sign in via the extension popup.';
        }
      }
    }
  }

  // ── Render Bills ───────────────────────────────────────────────────────────
  function renderBills(bills) {
    const listEl = document.getElementById('bills-list');
    if (!bills || bills.length === 0) {
      listEl.innerHTML = '<p class="text-xs text-muted">No upcoming bills due in the next 30 days. All clear!</p>';
      return;
    }

    listEl.innerHTML = bills.map(b => `
      <div class="alert-card-item">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <span class="alert-title">${b.merchant || 'Bill'}</span>
          <span style="font-weight:800; color:var(--text-main);">${fmt(b.amount)}</span>
        </div>
        <div class="alert-reason" style="display:flex; justify-content:space-between;">
          <span>Due date: ${b.due_date || 'Upcoming'}</span>
          <span style="color:${b.days_until <= 7 ? 'var(--accent-danger)' : 'var(--accent-gold)'};">
            ${b.days_until ?? 0} days remaining
          </span>
        </div>
      </div>
    `).join('');
  }

  // ── Render Anomalies ───────────────────────────────────────────────────────
  async function renderAnomalies() {
    const listEl = document.getElementById('anomalies-list');
    try {
      const data = await arthaApi.getAnomalies();
      const items = data.anomalies || data.findings || [];
      if (items.length === 0) {
        listEl.innerHTML = '<p class="text-xs text-muted">No anomalies or duplicate charges detected. Clean ledger!</p>';
        return;
      }

      listEl.innerHTML = items.map(a => `
        <div class="alert-card-item">
          <div style="display:flex; justify-content:space-between;">
            <span class="alert-title">${a.title || 'Potential anomaly'}</span>
            <span class="badge-mini" style="background:rgba(239,68,68,0.2); color:#fca5a5;">
              ${a.type || 'Alert'}
            </span>
          </div>
          <div class="alert-reason">${a.reason || a.description || ''}</div>
          ${a.action ? `<div class="text-xs text-mint" style="margin-top:4px;">💡 ${a.action}</div>` : ''}
        </div>
      `).join('');
    } catch (e) {
      listEl.innerHTML = '<p class="text-xs text-muted">Could not retrieve anomalies.</p>';
    }
  }

  // ── Dropzone & Ingest ──────────────────────────────────────────────────────
  const dropzone = document.getElementById('file-dropzone');
  const fileInput = document.getElementById('file-input');
  const reviewContainer = document.getElementById('ingest-review-container');
  const rowsList = document.getElementById('proposed-rows-list');
  const countBadge = document.getElementById('extracted-count');
  const btnConfirm = document.getElementById('btn-confirm-ledger');

  dropzone.onclick = () => fileInput.click();

  dropzone.ondragover = (e) => {
    e.preventDefault();
    dropzone.style.borderColor = 'var(--accent-mint)';
  };

  dropzone.ondragleave = () => {
    dropzone.style.borderColor = 'var(--border-light)';
  };

  dropzone.ondrop = async (e) => {
    e.preventDefault();
    dropzone.style.borderColor = 'var(--border-light)';
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await handleFileIngest(e.dataTransfer.files[0]);
    }
  };

  fileInput.onchange = async () => {
    if (fileInput.files && fileInput.files[0]) {
      await handleFileIngest(fileInput.files[0]);
    }
  };

  async function handleFileIngest(file) {
    dropzone.innerHTML = `<div class="dropzone-icon">⏳</div><p>Gemma 4 reading document (${file.name})...</p>`;
    try {
      const resp = await arthaApi.uploadFile(file, file.name);
      renderProposedRows(resp);
    } catch (err) {
      dropzone.innerHTML = `<div class="dropzone-icon">⚠️</div><p style="color:#f87171;">Extraction failed: ${err.message}</p>`;
    }
  }

  // Text Parse
  document.getElementById('btn-parse-text').onclick = async () => {
    const text = document.getElementById('text-ingest-input').value.trim();
    if (!text) return;

    const btn = document.getElementById('btn-parse-text');
    btn.disabled = true;
    btn.textContent = 'Reading with Gemma 4...';

    try {
      const resp = await arthaApi.uploadText(text, 'web_clip');
      renderProposedRows(resp);
    } catch (err) {
      alert(`Parsing failed: ${err.message}`);
    } finally {
      btn.disabled = false;
      btn.textContent = 'Read with Gemma 4 OCR';
    }
  };

  function renderProposedRows(resp) {
    proposedData = resp;
    const rows = resp.rows || [];
    countBadge.textContent = `${rows.length} row(s)`;
    reviewContainer.classList.remove('hidden');

    if (rows.length === 0) {
      rowsList.innerHTML = '<p class="text-xs text-muted">No transactions parsed. Check document format.</p>';
      return;
    }

    rowsList.innerHTML = rows.map((r, i) => `
      <div class="row-item">
        <div>
          <div class="row-merchant">${r.merchant || 'Payee'}</div>
          <div class="row-date">${r.date || 'Today'} · <span style="color:var(--accent-mint);">${r.category}</span></div>
        </div>
        <div style="text-align:right;">
          <div class="row-amount" style="color:${r.direction === 'credit' ? 'var(--accent-success)' : 'var(--text-main)'};">
            ${r.direction === 'credit' ? '+' : '-'}${fmt(r.amount)}
          </div>
          <span class="row-badge">${(r.confidence * 100).toFixed(0)}% confidence</span>
        </div>
      </div>
    `).join('');
  }

  btnConfirm.onclick = async () => {
    if (!proposedData || !proposedData.rows) return;
    btnConfirm.disabled = true;
    btnConfirm.textContent = 'Saving rows to ledger...';

    try {
      await arthaApi.confirmRows(proposedData.doc_type || 'web_clip', proposedData.provider || 'gemini', proposedData.rows);
      btnConfirm.textContent = '✓ Saved into Ledger!';
      setTimeout(() => {
        reviewContainer.classList.add('hidden');
        loadAllData();
      }, 1500);
    } catch (err) {
      alert(`Confirm failed: ${err.message}`);
      btnConfirm.disabled = false;
      btnConfirm.textContent = '✓ Confirm & Save to Ledger';
    }
  };

  // ── AI Coach ───────────────────────────────────────────────────────────────
  const coachInput = document.getElementById('coach-input');
  const btnCoachSend = document.getElementById('btn-coach-send');
  const chatHistory = document.getElementById('coach-chat-history');
  const coachLang = document.getElementById('coach-lang');

  async function askCoach(query) {
    if (!query) return;

    // Append user message
    const uMsg = document.createElement('div');
    uMsg.className = 'chat-msg user';
    uMsg.textContent = query;
    chatHistory.appendChild(uMsg);
    chatHistory.scrollTop = chatHistory.scrollHeight;

    // Thinking indicator
    const thinking = document.createElement('div');
    thinking.className = 'chat-msg coach';
    thinking.textContent = 'Thinking with Gemma 4...';
    chatHistory.appendChild(thinking);
    chatHistory.scrollTop = chatHistory.scrollHeight;

    try {
      const lang = coachLang.value;
      const resp = await arthaApi.voiceAsk(query, lang);
      thinking.textContent = resp.answer || resp.explanation || 'No answer returned.';
    } catch (e) {
      // Fallback to /coach endpoint
      try {
        const resp2 = await arthaApi.getCoach('safe-to-spend', coachLang.value);
        thinking.textContent = resp2.explanation || `Unable to consult coach (${e.message})`;
      } catch (err2) {
        thinking.textContent = `Coach unavailable: ${e.message}`;
      }
    }
    chatHistory.scrollTop = chatHistory.scrollHeight;
  }

  btnCoachSend.onclick = () => {
    const q = coachInput.value.trim();
    if (q) {
      coachInput.value = '';
      askCoach(q);
    }
  };

  coachInput.onkeydown = (e) => {
    if (e.key === 'Enter') btnCoachSend.click();
  };

  document.querySelectorAll('.prompt-chip').forEach(btn => {
    btn.onclick = () => askCoach(btn.dataset.q);
  });

  // ── Jargon Buster ──────────────────────────────────────────────────────────
  const searchInput = document.getElementById('jargon-search');
  const jargonResults = document.getElementById('jargon-results');

  document.querySelectorAll('.lp-btn').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('.lp-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeJargonLang = btn.dataset.jlang;
      renderJargonList(searchInput.value.trim());
    };
  });

  searchInput.oninput = (e) => {
    renderJargonList(e.target.value.trim());
  };

  function renderJargonList(search = '') {
    const s = search.toLowerCase();
    const keys = Object.keys(FINANCIAL_TERMS).filter(k => {
      const item = FINANCIAL_TERMS[k];
      return !s || k.includes(s) || item.term.toLowerCase().includes(s) || item.category.toLowerCase().includes(s);
    });

    if (keys.length === 0) {
      jargonResults.innerHTML = '<p class="text-xs text-muted">No matching financial terms found.</p>';
      return;
    }

    jargonResults.innerHTML = keys.map(k => {
      const itm = FINANCIAL_TERMS[k];
      const content = itm[activeJargonLang] || itm.en;
      return `
        <div class="jargon-card" data-term="${k}">
          <div class="jargon-card-term">
            <span>${itm.term}</span>
            <span class="badge-mini">${itm.category}</span>
          </div>
          <div class="jargon-card-def">${content.definition}</div>
          <div class="jargon-card-ex">💡 <strong>Example:</strong> ${content.example}</div>
          <div style="margin-top:6px; display:flex; justify-content:flex-end;">
            <button class="icon-btn" onclick="
              if ('speechSynthesis' in window) {
                window.speechSynthesis.cancel();
                window.speechSynthesis.speak(new SpeechSynthesisUtterance('${itm.term}. ${content.definition.replace(/'/g, "\\'")}'));
              }
            ">🔊 Pronounce</button>
          </div>
        </div>
      `;
    }).join('');
  }

  // Initial data fetch
  loadAllData();
});
