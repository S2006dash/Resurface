"""
setup_database.py
Run once to initialise the database.
Usage:
    python setup_database.py           # creates tables + seeds demo persona Priya
    python setup_database.py --schema  # schema only, no seed data
"""

import os
import sys
import bcrypt
from dotenv import load_dotenv
from db import get_connection

load_dotenv()

SECUREBANK_SCHEMA = "database_schema.sql"
ARTHA_SCHEMA = "artha_schema.sql"


def run_sql_file(conn, path):
    with open(path, "r") as f:
        sql = f.read()
    with conn.cursor() as cur:
        cur.execute(sql)
    conn.commit()
    print(f"  ✓ {path}")


def seed_demo(conn):
    """
    Seed the fictional persona Priya (24, junior analyst, Chennai).
    All data is made up — safe for public demo.
    """
    with conn.cursor() as cur:
        # Priya's account
        pw = bcrypt.hashpw(b"demo1234", bcrypt.gensalt()).decode()
        cur.execute(
            """INSERT INTO customers (full_name, email, password_hash, phone, address)
               VALUES (%s,%s,%s,%s,%s)
               ON CONFLICT (email) DO NOTHING
               RETURNING customer_id""",
            ("Priya Sharma", "priya@demo.artha", pw, "9876543210", "Chennai, Tamil Nadu"),
        )
        row = cur.fetchone()
        if row is None:
            cur.execute("SELECT customer_id FROM customers WHERE email='priya@demo.artha'")
            row = cur.fetchone()
        cid = row[0]

        # SecureBank savings account
        cur.execute(
            """INSERT INTO accounts (account_number, customer_id, account_type, balance)
               VALUES ('SB001PRIYA', %s, 'savings', 85000.00)
               ON CONFLICT DO NOTHING""",
            (cid,),
        )

        # ── Artha ledger: ~3 months of fictional transactions ────────────────
        entries = [
            # (entry_date, merchant, amount, direction, category, confidence)
            ("2026-08-01", "Swiggy",          420,  "debit",  "Food",          0.97),
            ("2026-08-02", "Zomato",          380,  "debit",  "Food",          0.96),
            ("2026-08-03", "Netflix",         649,  "debit",  "Subscriptions", 0.99),
            ("2026-08-05", "Spotify",         119,  "debit",  "Subscriptions", 0.99),
            ("2026-08-05", "FitLife Gym",     999,  "debit",  "Subscriptions", 0.88),  # forgotten gym
            ("2026-08-07", "Amazon",         2100,  "debit",  "Shopping",      0.93),
            ("2026-08-10", "Salary",        55000,  "credit", "Income",        0.99),
            ("2026-08-12", "House Rent",    18000,  "debit",  "Rent",          0.99),
            ("2026-08-15", "HDFC EMI",       6200,  "debit",  "EMI",           0.95),
            ("2026-08-20", "Swiggy",          510,  "debit",  "Food",          0.97),
            ("2026-08-22", "Zomato",          460,  "debit",  "Food",          0.96),
            ("2026-08-25", "BigBasket",      1800,  "debit",  "Groceries",     0.94),
            ("2026-09-01", "Swiggy",          780,  "debit",  "Food",          0.97),  # spike starts
            ("2026-09-03", "Zomato",          920,  "debit",  "Food",          0.96),  # spike
            ("2026-09-05", "Netflix",         649,  "debit",  "Subscriptions", 0.99),
            ("2026-09-05", "FitLife Gym",     999,  "debit",  "Subscriptions", 0.88),  # forgotten gym #2
            ("2026-09-08", "Spotify",         119,  "debit",  "Subscriptions", 0.99),
            ("2026-09-10", "Salary",        55000,  "credit", "Income",        0.99),
            ("2026-09-12", "House Rent",    18000,  "debit",  "Rent",          0.99),
            ("2026-09-14", "Swiggy",          850,  "debit",  "Food",          0.97),  # spike
            ("2026-09-14", "Swiggy",          850,  "debit",  "Food",          0.97),  # DUPLICATE same day
            ("2026-09-15", "HDFC EMI",       6200,  "debit",  "EMI",           0.95),
            ("2026-09-18", "BigBasket",      2100,  "debit",  "Groceries",     0.94),
            ("2026-09-22", "Zerodha SIP",    5000,  "debit",  "Investments",   0.97),
            ("2026-10-01", "Swiggy",          900,  "debit",  "Food",          0.97),  # spike continues
            ("2026-10-02", "Zomato",          870,  "debit",  "Food",          0.96),
            ("2026-10-03", "Netflix",         649,  "debit",  "Subscriptions", 0.99),
            ("2026-10-05", "FitLife Gym",     999,  "debit",  "Subscriptions", 0.88),  # forgotten gym #3
            ("2026-10-07", "Spotify",         119,  "debit",  "Subscriptions", 0.99),
            ("2026-10-10", "Salary",        55000,  "credit", "Income",        0.99),
            ("2026-10-12", "House Rent",    18000,  "debit",  "Rent",          0.99),
            ("2026-10-15", "HDFC EMI",       6200,  "debit",  "EMI",           0.95),
            ("2026-10-18", "BigBasket",      1950,  "debit",  "Groceries",     0.94),
            ("2026-10-20", "Zerodha SIP",    5000,  "debit",  "Investments",   0.97),
        ]

        for (dt, merchant, amount, direction, category, conf) in entries:
            cur.execute(
                """INSERT INTO ledger_entries
                   (customer_id, entry_date, merchant, amount, direction, category, confidence, status)
                   VALUES (%s,%s,%s,%s,%s,%s,%s,'confirmed')""",
                (cid, dt, merchant, amount, direction, category, conf),
            )

        # ── Liabilities ──────────────────────────────────────────────────────
        cur.execute(
            """INSERT INTO liabilities (customer_id, kind, name, limit_amount, outstanding, emi, due_date)
               VALUES (%s,'card','HDFC Credit Card',80000,71500,0,'2026-11-05')
               ON CONFLICT DO NOTHING""",
            (cid,),
        )  # card near limit (finding #5)

        # ── Policy ───────────────────────────────────────────────────────────
        cur.execute(
            """INSERT INTO policies (customer_id, insurer, kind, premium, renewal_date)
               VALUES (%s,'Star Health','health',12000,'2026-11-10')
               ON CONFLICT DO NOTHING""",
            (cid,),
        )  # renews in ~18 days from demo date (finding #4)

        # ── Goal: laptop ─────────────────────────────────────────────────────
        cur.execute(
            """INSERT INTO goals (customer_id, name, target_amount, deadline)
               VALUES (%s,'Laptop',60000,'2027-04-23')
               ON CONFLICT DO NOTHING""",
            (cid,),
        )  # finding #6

    conn.commit()
    print(f"  ✓ Demo persona 'Priya' seeded (login: priya@demo.artha / demo1234)")
    print(f"    customer_id = {cid}")


if __name__ == "__main__":
    schema_only = "--schema" in sys.argv
    force_reset = "--force" in sys.argv

    conn = get_connection()
    try:
        # Check if database already has data to prevent wiping live transactions
        if not force_reset:
            try:
                with conn.cursor() as cur:
                    cur.execute("""
                        SELECT EXISTS (
                            SELECT FROM information_schema.tables 
                            WHERE table_schema = 'public' AND table_name = 'customers'
                        );
                    """)
                    exists = cur.fetchone()[0]
                    if exists:
                        cur.execute("SELECT count(*) FROM customers;")
                        cnt = cur.fetchone()[0]
                        if cnt > 0:
                            print(f"✓ Database already initialized ({cnt} customers). Preserving existing records.")
                            print("  (Pass --force to drop and re-seed from scratch)")
                            sys.exit(0)
            except Exception as e:
                conn.rollback()

        print("Running SecureBank schema …")
        run_sql_file(conn, SECUREBANK_SCHEMA)

        print("Running Artha schema …")
        run_sql_file(conn, ARTHA_SCHEMA)

        if not schema_only:
            print("Seeding demo data …")
            seed_demo(conn)

        print("\nDone. Database is ready.")
    finally:
        conn.close()
