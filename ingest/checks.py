"""
checks.py
Post-extraction validation:
  - Statement reconciliation: opening + credits - debits ≈ closing
  - Duplicate detection: same merchant + amount + date
  - Date sanity check
  - Amount format check
"""

from collections import defaultdict


def run_checks(rows: list[dict], opening_balance: float = None, closing_balance: float = None) -> dict:
    """
    Run all checks on a list of proposed rows.
    Returns a checks dict: { reconciles, duplicates, bad_dates, bad_amounts }
    Also mutates rows — adds flags where problems are found.
    """
    checks = {
        "reconciles": None,
        "duplicates": 0,
        "bad_dates": 0,
        "bad_amounts": 0,
    }

    # ── 1. Reconciliation ────────────────────────────────────────────────────
    if opening_balance is not None and closing_balance is not None:
        credits = sum(r["amount"] for r in rows if r.get("direction") == "credit")
        debits  = sum(r["amount"] for r in rows if r.get("direction") == "debit")
        computed_close = opening_balance + credits - debits
        tolerance = 1.0  # Rs 1 rounding tolerance
        checks["reconciles"] = abs(computed_close - closing_balance) <= tolerance

    # ── 2. Duplicate detection ────────────────────────────────────────────────
    seen = defaultdict(list)
    for row in rows:
        key = (row.get("date"), row.get("merchant", "").lower(), row.get("amount"))
        seen[key].append(row)

    for key, group in seen.items():
        if len(group) > 1:
            checks["duplicates"] += len(group) - 1
            for row in group:
                if "possible_duplicate" not in row["flags"]:
                    row["flags"].append("possible_duplicate")

    # ── 3. Date sanity ────────────────────────────────────────────────────────
    for row in rows:
        if row.get("date") is None or "date_unclear" in row.get("flags", []):
            checks["bad_dates"] += 1

    # ── 4. Amount sanity ──────────────────────────────────────────────────────
    for row in rows:
        if row.get("amount", 0) <= 0:
            checks["bad_amounts"] += 1

    return checks
