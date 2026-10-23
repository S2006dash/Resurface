-- SecureBank core schema
-- WARNING: contains DROP TABLE — never re-run against a database with Artha data.
-- New Artha tables live in artha_schema.sql only.

DROP TABLE IF EXISTS audit_log CASCADE;
DROP TABLE IF EXISTS login_activity CASCADE;
DROP TABLE IF EXISTS transaction_history CASCADE;
DROP TABLE IF EXISTS accounts CASCADE;
DROP TABLE IF EXISTS customers CASCADE;

CREATE TABLE customers (
    customer_id   SERIAL PRIMARY KEY,
    full_name     VARCHAR(100) NOT NULL,
    email         VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone         VARCHAR(20),
    address       TEXT,
    created_at    TIMESTAMP DEFAULT NOW()
);

CREATE TABLE accounts (
    account_number VARCHAR(20) PRIMARY KEY,
    customer_id    INTEGER REFERENCES customers(customer_id) ON DELETE CASCADE,
    account_type   VARCHAR(20) NOT NULL CHECK (account_type IN ('savings','current','fd')),
    balance        NUMERIC(15,2) DEFAULT 0.00,
    created_at     TIMESTAMP DEFAULT NOW()
);

CREATE TABLE transaction_history (
    transaction_id   SERIAL PRIMARY KEY,
    from_account     VARCHAR(20) REFERENCES accounts(account_number),
    to_account       VARCHAR(20) REFERENCES accounts(account_number),
    amount           NUMERIC(15,2) NOT NULL,
    transaction_type VARCHAR(30),
    description      TEXT,
    transaction_date TIMESTAMP DEFAULT NOW()
);

CREATE TABLE audit_log (
    log_id      SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(customer_id),
    action_type VARCHAR(50),
    details     TEXT,
    created_at  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE login_activity (
    activity_id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(customer_id),
    ip_address  VARCHAR(45),
    user_agent  TEXT,
    success     BOOLEAN,
    created_at  TIMESTAMP DEFAULT NOW()
);
