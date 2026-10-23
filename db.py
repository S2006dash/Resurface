"""
Database connection helper.
Reads DATABASE_URL from environment (DigitalOcean sets this automatically).
Falls back to individual DB_* vars for local dev.
Gracefully falls back to local SQLite (artha.sqlite) if PostgreSQL is not available,
ensuring offline presentations and demos never crash.
"""

import os
import re
import sqlite3
from urllib.parse import urlparse
from dotenv import load_dotenv

load_dotenv()

_USE_SQLITE = False
_SQLITE_PATH = os.path.join(os.path.dirname(__file__), "artha.sqlite")


def _init_sqlite(conn):
    """Create all required tables in SQLite and seed demo data if empty."""
    cur = conn.cursor()
    cur.executescript("""
    CREATE TABLE IF NOT EXISTS customers (
        customer_id   INTEGER PRIMARY KEY AUTOINCREMENT,
        full_name     TEXT NOT NULL,
        email         TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        phone         TEXT,
        address       TEXT,
        created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS accounts (
        account_number TEXT PRIMARY KEY,
        customer_id    INTEGER REFERENCES customers(customer_id) ON DELETE CASCADE,
        account_type   TEXT NOT NULL CHECK (account_type IN ('savings','current','fd')),
        balance        REAL DEFAULT 0.00,
        created_at     DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS transaction_history (
        transaction_id   INTEGER PRIMARY KEY AUTOINCREMENT,
        from_account     TEXT REFERENCES accounts(account_number),
        to_account       TEXT REFERENCES accounts(account_number),
        amount           REAL NOT NULL,
        transaction_type TEXT,
        description      TEXT,
        transaction_date DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS audit_log (
        log_id      INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_id INTEGER REFERENCES customers(customer_id),
        action_type TEXT,
        details     TEXT,
        created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS login_activity (
        activity_id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_id INTEGER REFERENCES customers(customer_id),
        ip_address  TEXT,
        user_agent  TEXT,
        success     INTEGER,
        created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS documents (
        doc_id      INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_id INTEGER REFERENCES customers(customer_id) ON DELETE CASCADE,
        doc_type    TEXT NOT NULL,
        provider    TEXT NOT NULL,
        status      TEXT DEFAULT 'pending',
        file_hash   TEXT,
        created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS ledger_entries (
        entry_id    INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_id INTEGER REFERENCES customers(customer_id) ON DELETE CASCADE,
        doc_id      INTEGER REFERENCES documents(doc_id) ON DELETE SET NULL,
        entry_date  TEXT NOT NULL,
        merchant    TEXT,
        amount      REAL NOT NULL,
        direction   TEXT NOT NULL CHECK (direction IN ('debit','credit')),
        category    TEXT,
        confidence  REAL,
        status      TEXT DEFAULT 'proposed' CHECK (status IN ('proposed','confirmed')),
        source_ref  TEXT,
        created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS liabilities (
        liability_id  INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_id   INTEGER REFERENCES customers(customer_id) ON DELETE CASCADE,
        kind          TEXT NOT NULL CHECK (kind IN ('card','loan')),
        name          TEXT,
        limit_amount  REAL,
        outstanding   REAL,
        emi           REAL,
        due_date      TEXT,
        created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS holdings (
        holding_id     INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_id    INTEGER REFERENCES customers(customer_id) ON DELETE CASCADE,
        kind           TEXT NOT NULL CHECK (kind IN ('SIP','RD','MF')),
        name           TEXT,
        current_value  REAL,
        monthly_amount REAL,
        created_at     DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS policies (
        policy_id    INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_id  INTEGER REFERENCES customers(customer_id) ON DELETE CASCADE,
        insurer      TEXT,
        kind         TEXT,
        premium      REAL,
        renewal_date TEXT,
        created_at   DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS goals (
        goal_id       INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_id   INTEGER REFERENCES customers(customer_id) ON DELETE CASCADE,
        name          TEXT NOT NULL,
        target_amount REAL NOT NULL,
        deadline      TEXT NOT NULL,
        created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS nudges (
        nudge_id     INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_id  INTEGER REFERENCES customers(customer_id) ON DELETE CASCADE,
        rule         TEXT,
        message      TEXT,
        evidence_json TEXT,
        sent_at      DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS merchant_category_cache (
        merchant_key TEXT PRIMARY KEY,
        category     TEXT,
        source       TEXT,
        updated_at   DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS extraction_cache (
        file_hash     TEXT PRIMARY KEY,
        response_json TEXT,
        cached_at     DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    """)
    conn.commit()

    # Check if Priya already exists
    cur.execute("SELECT customer_id FROM customers WHERE email = 'priya@demo.artha'")
    if not cur.fetchone():
        try:
            import bcrypt
            pw = bcrypt.hashpw(b"demo1234", bcrypt.gensalt()).decode()
        except Exception:
            pw = "demo1234"

        cur.execute(
            "INSERT INTO customers (full_name, email, password_hash, phone, address) VALUES (?, ?, ?, ?, ?)",
            ("Priya Sharma", "priya@demo.artha", pw, "9876543210", "Chennai, Tamil Nadu")
        )
        cid = cur.lastrowid

        cur.execute(
            "INSERT INTO accounts (account_number, customer_id, account_type, balance) VALUES ('SB001PRIYA', ?, 'savings', 85000.00)",
            (cid,)
        )

        entries = [
            ("2026-08-01", "Swiggy",          420,  "debit",  "Food",          0.97),
            ("2026-08-02", "Zomato",          380,  "debit",  "Food",          0.96),
            ("2026-08-03", "Netflix",         649,  "debit",  "Subscriptions", 0.99),
            ("2026-08-05", "Spotify",         119,  "debit",  "Subscriptions", 0.99),
            ("2026-08-05", "FitLife Gym",     999,  "debit",  "Subscriptions", 0.88),
            ("2026-08-07", "Amazon",         2100,  "debit",  "Shopping",      0.93),
            ("2026-08-10", "Salary",        55000,  "credit", "Income",        0.99),
            ("2026-08-12", "House Rent",    18000,  "debit",  "Rent",          0.99),
            ("2026-08-15", "HDFC EMI",       6200,  "debit",  "EMI",           0.95),
            ("2026-08-20", "Swiggy",          510,  "debit",  "Food",          0.97),
            ("2026-08-22", "Zomato",          460,  "debit",  "Food",          0.96),
            ("2026-08-25", "BigBasket",      1800,  "debit",  "Groceries",     0.94),
            ("2026-09-01", "Swiggy",          780,  "debit",  "Food",          0.97),
            ("2026-09-03", "Zomato",          920,  "debit",  "Food",          0.96),
            ("2026-09-05", "Netflix",         649,  "debit",  "Subscriptions", 0.99),
            ("2026-09-05", "FitLife Gym",     999,  "debit",  "Subscriptions", 0.88),
            ("2026-09-08", "Spotify",         119,  "debit",  "Subscriptions", 0.99),
            ("2026-09-10", "Salary",        55000,  "credit", "Income",        0.99),
            ("2026-09-12", "House Rent",    18000,  "debit",  "Rent",          0.99),
            ("2026-09-14", "Swiggy",          850,  "debit",  "Food",          0.97),
            ("2026-09-14", "Swiggy",          850,  "debit",  "Food",          0.97),
            ("2026-09-15", "HDFC EMI",       6200,  "debit",  "EMI",           0.95),
            ("2026-09-18", "BigBasket",      2100,  "debit",  "Groceries",     0.94),
            ("2026-09-22", "Zerodha SIP",    5000,  "debit",  "Investments",   0.97),
            ("2026-10-01", "Swiggy",          900,  "debit",  "Food",          0.97),
            ("2026-10-02", "Zomato",          870,  "debit",  "Food",          0.96),
            ("2026-10-03", "Netflix",         649,  "debit",  "Subscriptions", 0.99),
            ("2026-10-05", "FitLife Gym",     999,  "debit",  "Subscriptions", 0.88),
            ("2026-10-07", "Spotify",         119,  "debit",  "Subscriptions", 0.99),
            ("2026-10-10", "Salary",        55000,  "credit", "Income",        0.99),
            ("2026-10-12", "House Rent",    18000,  "debit",  "Rent",          0.99),
            ("2026-10-15", "HDFC EMI",       6200,  "debit",  "EMI",           0.95),
            ("2026-10-18", "BigBasket",      1950,  "debit",  "Groceries",     0.94),
            ("2026-10-20", "Zerodha SIP",    5000,  "debit",  "Investments",   0.97),
        ]
        for (dt, merchant, amount, direction, category, conf) in entries:
            cur.execute(
                "INSERT INTO ledger_entries (customer_id, entry_date, merchant, amount, direction, category, confidence, status) VALUES (?, ?, ?, ?, ?, ?, ?, 'confirmed')",
                (cid, dt, merchant, amount, direction, category, conf)
            )

        cur.execute(
            "INSERT INTO liabilities (customer_id, kind, name, limit_amount, outstanding, emi, due_date) VALUES (?, 'card', 'HDFC Credit Card', 80000, 71500, 0, '2026-11-05')",
            (cid,)
        )
        cur.execute(
            "INSERT INTO policies (customer_id, insurer, kind, premium, renewal_date) VALUES (?, 'Star Health', 'health', 12000, '2026-11-10')",
            (cid,)
        )
        cur.execute(
            "INSERT INTO goals (customer_id, name, target_amount, deadline) VALUES (?, 'Laptop', 60000, '2027-04-23')",
            (cid,)
        )
        conn.commit()


def get_connection():
    """Return a database connection (PostgreSQL if available, otherwise SQLite)."""
    global _USE_SQLITE
    if _USE_SQLITE:
        conn = sqlite3.connect(_SQLITE_PATH, check_same_thread=False)
        conn.row_factory = sqlite3.Row
        return conn

    try:
        import psycopg2
        import psycopg2.extras
        url = os.environ.get("DATABASE_URL")
        if url:
            if url.startswith("postgres://"):
                url = url.replace("postgres://", "postgresql://", 1)
            try:
                conn = psycopg2.connect(url)
                conn.autocommit = False
                return conn
            except Exception:
                r = urlparse(url)
                conn = psycopg2.connect(
                    host=r.hostname,
                    port=r.port or 5432,
                    database=r.path.lstrip("/"),
                    user=r.username,
                    password=r.password,
                    sslmode="require" if any(k in (r.hostname or "") for k in ["digitalocean", "neon", "supabase", "aiven", "render"]) else "prefer",
                )
                conn.autocommit = False
                return conn
        else:
            conn = psycopg2.connect(
                host=os.environ.get("DB_HOST", "localhost"),
                port=int(os.environ.get("DB_PORT", 5432)),
                database=os.environ.get("DB_NAME", "artha_db"),
                user=os.environ.get("DB_USER", "postgres"),
                password=os.environ.get("DB_PASSWORD", ""),
            )
            conn.autocommit = False
            return conn
    except Exception as e:
        # Fall back to SQLite
        _USE_SQLITE = True
        conn = sqlite3.connect(_SQLITE_PATH, check_same_thread=False)
        conn.row_factory = sqlite3.Row
        _init_sqlite(conn)
        return conn


def query(sql, params=None, fetch="all"):
    """
    Run a SQL statement and return results as list-of-dicts.
    fetch: "all" | "one" | "none"
    Transparently supports both PostgreSQL and SQLite.
    """
    conn = get_connection()
    try:
        if _USE_SQLITE:
            cur = conn.cursor()
            # Convert PostgreSQL placeholders (%s) to SQLite (?)
            sqlite_sql = sql
            # Replace PostgreSQL functions / syntax with SQLite
            sqlite_sql = re.sub(r'NOW\(\)', 'CURRENT_TIMESTAMP', sqlite_sql, flags=re.IGNORECASE)
            sqlite_sql = re.sub(r"DATE_TRUNC\s*\(\s*'month'\s*,\s*(\w+)\s*\)", r"strftime('%Y-%m-01', \1)", sqlite_sql, flags=re.IGNORECASE)
            sqlite_sql = re.sub(r'%s', '?', sqlite_sql)
            
            cur.execute(sqlite_sql, tuple(params or ()))
            result = None
            if fetch == "all":
                result = [dict(r) for r in cur.fetchall()]
            elif fetch == "one":
                row = cur.fetchone()
                result = dict(row) if row else None
            cur.close()
            conn.commit()
            return result
        else:
            import psycopg2.extras
            with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
                cur.execute(sql, params or ())
                conn.commit()
                if fetch == "all":
                    return [dict(r) for r in cur.fetchall()]
                if fetch == "one":
                    row = cur.fetchone()
                    return dict(row) if row else None
                return None
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()

