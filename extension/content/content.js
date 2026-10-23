/**
 * Artha Content Script
 * 1. Safe-to-Spend Shopping Guardian on e-commerce / checkout pages
 * 2. In-Page Jargon Buster on financial terms
 * 3. Ingest Notifications
 */

(() => {
  // Prevent duplicate injections
  if (window.__ARTHA_CONTENT_INITIALIZED__) return;
  window.__ARTHA_CONTENT_INITIALIZED__ = true;

  const fmt = n => '₹' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });

  // ── Notification Toast ───────────────────────────────────────────────────────
  let toastEl = null;
  function showToast(message, status = 'info') {
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.className = 'artha-toast';
      document.body.appendChild(toastEl);
    }

    const iconHtml = status === 'loading'
      ? '<div class="artha-toast-spinner"></div>'
      : status === 'success' ? '<span>✓</span>' : '<span>💡</span>';

    toastEl.innerHTML = `${iconHtml}<span>${message}</span>`;
    toastEl.classList.add('artha-visible');

    if (status !== 'loading') {
      setTimeout(() => {
        toastEl.classList.remove('artha-visible');
      }, 3500);
    }
  }

  // ── 1. In-Page Jargon Buster ─────────────────────────────────────────────────
  let jargonBubble = null;
  let activeLang = 'en';
  let activeTermData = null;

  function dismissJargonBubble() {
    if (jargonBubble && jargonBubble.parentNode) {
      jargonBubble.parentNode.removeChild(jargonBubble);
      jargonBubble = null;
    }
  }

  function renderJargonBubble(matchResult, clientX, clientY) {
    dismissJargonBubble();
    activeTermData = matchResult.data;
    activeLang = 'en';

    const b = document.createElement('div');
    b.className = 'artha-jargon-bubble';
    b.style.left = `${Math.min(window.innerWidth - 340, Math.max(16, clientX - 80))}px`;
    b.style.top = `${Math.min(window.innerHeight - 300, clientY + 16)}px`;

    function updateContent() {
      const content = activeTermData[activeLang] || activeTermData.en;
      b.innerHTML = `
        <div class="artha-jargon-top">
          <span class="artha-jargon-badge">${activeTermData.category}</span>
          <button id="artha-close-jargon" class="artha-icon-btn" style="color:#64748b; font-size:16px;">✕</button>
        </div>
        <div class="artha-jargon-term">${activeTermData.term}</div>

        <div class="artha-lang-toggle">
          <button class="artha-lang-btn ${activeLang === 'en' ? 'active' : ''}" data-lang="en">EN</button>
          <button class="artha-lang-btn ${activeLang === 'hi' ? 'active' : ''}" data-lang="hi">हिंदी</button>
          <button class="artha-lang-btn ${activeLang === 'ta' ? 'active' : ''}" data-lang="ta">தமிழ்</button>
          <button class="artha-lang-btn ${activeLang === 'te' ? 'active' : ''}" data-lang="te">తెలుగు</button>
        </div>

        <div class="artha-jargon-def">${content.definition}</div>
        <div class="artha-jargon-example">
          <strong>💡 Real-World Example:</strong> ${content.example}
        </div>

        <div class="artha-jargon-actions">
          <button id="artha-tts-btn" class="artha-btn-secondary" style="color:#0d4f2e; border-color:#86efac; background:#f0fdf4;">
            🔊 Listen
          </button>
          <button id="artha-open-side-btn" class="artha-btn-secondary" style="background:#0d4f2e; color:#fff;">
            Open in Artha Panel →
          </button>
        </div>
      `;

      // Event handlers
      b.querySelector('#artha-close-jargon').onclick = (e) => {
        e.stopPropagation();
        dismissJargonBubble();
      };

      b.querySelectorAll('.artha-lang-btn').forEach(btn => {
        btn.onclick = (e) => {
          e.stopPropagation();
          activeLang = btn.dataset.lang;
          updateContent();
        };
      });

      b.querySelector('#artha-tts-btn').onclick = (e) => {
        e.stopPropagation();
        if ('speechSynthesis' in window) {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(`${activeTermData.term}. ${content.definition}`);
          window.speechSynthesis.speak(utterance);
        }
      };

      b.querySelector('#artha-open-side-btn').onclick = (e) => {
        e.stopPropagation();
        chrome.runtime.sendMessage({ type: 'OPEN_SIDEPANEL' });
        dismissJargonBubble();
      };
    }

    updateContent();
    document.body.appendChild(b);
  }

  // Listen to text selection for Jargon Buster
  document.addEventListener('mouseup', (e) => {
    // If clicking inside the bubble or guardian, don't dismiss immediately
    if (e.target.closest('.artha-jargon-bubble') || e.target.closest('.artha-guardian-pill')) {
      return;
    }

    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
      dismissJargonBubble();
      return;
    }

    const text = selection.toString().trim();
    if (text.length >= 2 && text.length <= 40 && typeof window.findFinancialTerm === 'function') {
      const match = window.findFinancialTerm(text);
      if (match) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        renderJargonBubble(match, rect.left + window.scrollX, rect.bottom + window.scrollY);
      }
    }
  });

  // ── 2. Safe-to-Spend Shopping Guardian ───────────────────────────────────────
  let guardianEl = null;
  let isGuardianCollapsed = false;

  // Detect Cart / Order Amount from webpage DOM
  function detectCartAmount() {
    // E-commerce specific selectors
    const selectors = [
      '#subtotals-marketplace-table .grand-total-price', // Amazon
      '.grand-total-price',
      '#sc-subtotal-amount-activecart', // Amazon cart
      '._1Y9NYc', '._35mLK5', '._30jeq3._16Jk6d', // Flipkart
      '.total-amount', '.bill-detail-total',
      '[data-testid="bill-summary-total"]', // Swiggy
      '.cart-subtotal', '.order-total', '.payment-total'
    ];

    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el && el.innerText) {
        const num = parsePrice(el.innerText);
        if (num > 0) return num;
      }
    }

    // Generic heuristic: Look for elements labeled 'Total' or 'Pay' followed by rupee sign
    const textNodes = document.querySelectorAll('div, span, p, td');
    for (let i = 0; i < Math.min(textNodes.length, 250); i++) {
      const text = textNodes[i].innerText || '';
      if (/total|amount payable|order total|grand total|to pay/i.test(text) && /₹|rs\.?/i.test(text)) {
        const parsed = parsePrice(text);
        if (parsed > 0 && parsed < 500000) return parsed;
      }
    }
    return null;
  }

  function parsePrice(str) {
    const m = str.match(/(?:₹|Rs\.?)\s*([\d,]+(?:\.\d+)?)/i);
    if (m && m[1]) {
      return parseFloat(m[1].replace(/,/g, ''));
    }
    return 0;
  }

  function initShoppingGuardian() {
    chrome.runtime.sendMessage({ type: 'GET_SAFE_TO_SPEND' }, (resp) => {
      if (!resp || !resp.success || !resp.data) return;
      const s2s = resp.data;
      const safeAmount = s2s.safe_to_spend || 0;
      const cartTotal = detectCartAmount();

      // Only mount on e-commerce domains or when a cart total is detected
      const isShopDomain = /amazon|flipkart|swiggy|zomato|myntra|zepto|blinkit|bigbasket|tatacliq|meesho|makemytrip/i.test(window.location.hostname);
      if (!isShopDomain && !cartTotal) return;

      renderGuardian(safeAmount, cartTotal);
    });
  }

  function renderGuardian(safeAmount, cartTotal) {
    if (guardianEl) guardianEl.remove();

    guardianEl = document.createElement('div');
    guardianEl.className = 'artha-guardian-pill';

    const remaining = safeAmount - (cartTotal || 0);
    const isSafe = remaining >= 0;

    function renderView() {
      if (isGuardianCollapsed) {
        guardianEl.innerHTML = `
          <div class="artha-guardian-collapsed" id="artha-expand-guardian">
            <span class="artha-guardian-logo-badge">₹</span>
            <span style="font-size:12px; font-weight:700; color:var(--artha-mint);">
              Safe: ${fmt(safeAmount)} ${cartTotal ? `· Cart: ${fmt(cartTotal)}` : ''}
            </span>
          </div>
        `;
        guardianEl.querySelector('#artha-expand-guardian').onclick = () => {
          isGuardianCollapsed = false;
          renderView();
        };
        return;
      }

      guardianEl.innerHTML = `
        <div class="artha-guardian-header">
          <div class="artha-guardian-title">
            <span class="artha-guardian-logo-badge">₹</span>
            <span>Artha Safe-to-Spend Guardian</span>
          </div>
          <div class="artha-guardian-actions">
            <button id="artha-collapse-guardian" class="artha-icon-btn" title="Minimize">—</button>
            <button id="artha-close-guardian" class="artha-icon-btn" title="Dismiss">✕</button>
          </div>
        </div>

        <div class="artha-guardian-body">
          <div class="artha-stat-row">
            <span class="artha-stat-label">Today's Safe-to-Spend:</span>
            <span class="artha-stat-val">${fmt(safeAmount)}</span>
          </div>

          ${cartTotal ? `
            <div class="artha-stat-row" style="margin-bottom:4px;">
              <span class="artha-stat-label">Current Cart Total:</span>
              <span style="font-weight:700; color:#f8fafc;">${fmt(cartTotal)}</span>
            </div>
            <div class="artha-stat-row" style="border-top:1px dashed rgba(255,255,255,0.1); padding-top:6px;">
              <span class="artha-stat-label">Remaining Balance:</span>
              <span style="font-weight:800; color:${isSafe ? '#86efac' : '#fca5a5'};">
                ${fmt(remaining)}
              </span>
            </div>

            <div class="artha-impact-card ${isSafe ? 'artha-impact-safe' : 'artha-impact-warning'}">
              ${isSafe
                ? `✓ <strong>Within safe limit.</strong> This purchase will not endanger upcoming rent, bills, or SIPs.`
                : `⚠️ <strong>Over daily allowance by ${fmt(Math.abs(remaining))}.</strong> Buying this will dip into next week's savings buffer.`}
            </div>
          ` : `
            <div style="font-size:11px; color:var(--artha-text-muted); line-height:1.4;">
              Artha keeps tabs on upcoming bills, rent, and goals so you spend with confidence.
            </div>
          `}

          <div class="artha-guardian-footer">
            <button id="artha-open-panel-btn" class="artha-btn-secondary">
              Open Companion Panel →
            </button>
            <button id="artha-clip-page-btn" class="artha-btn-secondary" title="Capture receipt">
              📸 Clip Receipt
            </button>
          </div>
        </div>
      `;

      guardianEl.querySelector('#artha-collapse-guardian').onclick = () => {
        isGuardianCollapsed = true;
        renderView();
      };
      guardianEl.querySelector('#artha-close-guardian').onclick = () => {
        guardianEl.remove();
        guardianEl = null;
      };
      guardianEl.querySelector('#artha-open-panel-btn').onclick = () => {
        chrome.runtime.sendMessage({ type: 'OPEN_SIDEPANEL' });
      };
      guardianEl.querySelector('#artha-clip-page-btn').onclick = () => {
        showToast('Capturing receipt for Gemma 4 OCR...', 'loading');
        chrome.runtime.sendMessage({ type: 'CLIP_RECEIPT_TEXT', text: document.body.innerText.slice(0, 1500) }, (r) => {
          showToast(r && r.success ? 'Receipt clipped to Artha!' : 'Clip complete.', 'success');
        });
      };
    }

    renderView();
    document.body.appendChild(guardianEl);
  }

  // ── 3. Runtime Message Listener ─────────────────────────────────────────────
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === 'ARTHA_SHOW_NOTIFICATION') {
      showToast(msg.message, msg.status);
    } else if (msg.type === 'ARTHA_TRIGGER_JARGON') {
      if (typeof window.findFinancialTerm === 'function') {
        const match = window.findFinancialTerm(msg.text);
        if (match) {
          renderJargonBubble(match, window.innerWidth / 2, 100);
        } else {
          showToast(`Looking up "${msg.text}" in Artha Side Panel...`, 'info');
          chrome.runtime.sendMessage({ type: 'OPEN_SIDEPANEL' });
        }
      }
    }
  });

  // Check cart amount with slight delay to let dynamic JS pages settle
  setTimeout(initShoppingGuardian, 1500);
})();
