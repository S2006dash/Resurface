"""
Database connection helper.
Reads DATABASE_URL from environment (DigitalOcean sets this automatically).
Falls back to individual DB_* vars for local dev.
"""

import os
import psycopg2
import psycopg2.extras
from urllib.parse import urlparse


def get_connection():
    """Return a new psycopg2 connection. Caller must close it."""
    url = os.environ.get("DATABASE_URL")
    if url:
        r = urlparse(url)
        conn = psycopg2.connect(
            host=r.hostname,
            port=r.port or 5432,
            database=r.path.lstrip("/"),
            user=r.username,
            password=r.password,
            sslmode="require" if "digitalocean" in (r.hostname or "") else "prefer",
        )
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


def query(sql, params=None, fetch="all"):
    """
    Run a SQL statement and return results as list-of-dicts.
    fetch: "all" | "one" | "none"
    """
    conn = get_connection()
    try:
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
