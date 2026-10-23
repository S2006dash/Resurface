-- Artha extension schema.
-- Uses CREATE TABLE IF NOT EXISTS throughout — safe to re-run.
-- Never put these in database_schema.sql.

-- ── Documents (metadata only — no file bytes stored) ─────────────────────────
CREATE TABLE IF NOT EXISTS documents (
    doc_id      SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(customer_id) ON DELETE CASCADE,
    doc_type    VARCHAR(40) NOT NULL,   -- upi_screenshot | bank_pdf | card_pdf | loan_screenshot | policy_photo | sms_text
    provider    VARCHAR(20) NOT NULL,   -- gemini | ollama | manual
    status      VARCHAR(20) DEFAULT 'pending',  -- pending | processed | error
    file_hash   VARCHAR(64),            -- SHA-256 for cache lookup
    created_at  TIMESTAMP DEFAULT NOW()
);

-- ── Ledger entries (all outside-SecureBank money) ────────────────────────────
CREATE TABLE IF NOT EXISTS ledger_entries (
    entry_id    SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(customer_id) ON DELETE CASCADE,
    doc_id      INTEGER REFERENCES documents(doc_id) ON DELETE SET NULL,
    entry_date  DATE NOT NULL,
    merchant    VARCHAR(150),
    amount      NUMERIC(15,2) NOT NULL,
    direction   VARCHAR(6) NOT NULL CHECK (direction IN ('debit','credit')),
    -- Categories: exactly this list (from docs/contract.md)
    category    VARCHAR(30) CHECK (category IN (
        'Food','Groceries','Transport','Shopping','Bills','Rent','EMI',
        'Subscriptions','Health','Education','Entertainment',
        'Investments','Income','Transfers','Other'
    )),
    confidence  NUMERIC(4,3),           -- 0.000–1.000 from Gemma
    status      VARCHAR(10) DEFAULT 'proposed' CHECK (status IN ('proposed','confirmed')),
    source_ref  TEXT,                   -- page/line in the original doc
    created_at  TIMESTAMP DEFAULT NOW()
);

-- ── Liabilities (credit cards, personal loans) ───────────────────────────────
CREATE TABLE IF NOT EXISTS liabilities (
    liability_id  SERIAL PRIMARY KEY,
    customer_id   INTEGER REFERENCES customers(customer_id) ON DELETE CASCADE,
    kind          VARCHAR(10) NOT NULL CHECK (kind IN ('card','loan')),
    name          VARCHAR(100),
    limit_amount  NUMERIC(15,2),
    outstanding   NUMERIC(15,2),
    emi           NUMERIC(15,2),
    due_date      DATE,
    created_at    TIMESTAMP DEFAULT NOW()
);

-- ── Holdings (SIP, RD, MF investments) ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS holdings (
    holding_id     SERIAL PRIMARY KEY,
    customer_id    INTEGER REFERENCES customers(customer_id) ON DELETE CASCADE,
    kind           VARCHAR(10) NOT NULL CHECK (kind IN ('SIP','RD','MF')),
    name           VARCHAR(150),
    current_value  NUMERIC(15,2),
    monthly_amount NUMERIC(15,2),
    created_at     TIMESTAMP DEFAULT NOW()
);

-- ── Insurance policies ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS policies (
    policy_id    SERIAL PRIMARY KEY,
    customer_id  INTEGER REFERENCES customers(customer_id) ON DELETE CASCADE,
    insurer      VARCHAR(100),
    kind         VARCHAR(30),           -- health | life | vehicle | term
    premium      NUMERIC(15,2),
    renewal_date DATE,
    created_at   TIMESTAMP DEFAULT NOW()
);

-- ── Goals ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS goals (
    goal_id       SERIAL PRIMARY KEY,
    customer_id   INTEGER REFERENCES customers(customer_id) ON DELETE CASCADE,
    name          VARCHAR(150) NOT NULL,
    target_amount NUMERIC(15,2) NOT NULL,
    deadline      DATE NOT NULL,
    created_at    TIMESTAMP DEFAULT NOW()
);

-- ── Nudges (one per day cap) ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS nudges (
    nudge_id     SERIAL PRIMARY KEY,
    customer_id  INTEGER REFERENCES customers(customer_id) ON DELETE CASCADE,
    rule         VARCHAR(50),
    message      TEXT,
    evidence_json TEXT,
    sent_at      TIMESTAMP DEFAULT NOW()
);

-- ── Merchant category cache ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS merchant_category_cache (
    merchant_key VARCHAR(150) PRIMARY KEY,
    category     VARCHAR(30),
    source       VARCHAR(10) CHECK (source IN ('rule','gemma','user')),
    updated_at   TIMESTAMP DEFAULT NOW()
);

-- ── Extraction cache (avoid re-calling Gemma for the same file) ───────────────
CREATE TABLE IF NOT EXISTS extraction_cache (
    file_hash     VARCHAR(64) PRIMARY KEY,
    response_json TEXT,
    created_at    TIMESTAMP DEFAULT NOW()
);
