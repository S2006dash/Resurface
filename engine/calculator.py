"""
calculator.py  —  The ONLY place that does arithmetic in Artha.
Gemma never computes a total. All numbers come from here.

Functions:
  net_worth(customer_id)       → dict
  cash_flow(customer_id)       → dict
  category_totals(customer_id) → list
  finders(customer_id)         → list of findings (each with proof_row_ids)
  goal_simulate(goal_id, what_ifs, num_simulations) → dict
"""

import math
import random
from datetime import date, timedelta
from collections import defaultdict

from db import query
from ai_utils import analyze_fraud_risk


# ── Net worth ─────────────────────────────────────────────────────────────────

def net_worth(customer_id: int) -> dict:
    """
    Assets: SecureBank balances + investment holdings
    Liabilities: outstanding on cards + loans
    """
    # SecureBank accounts
    accounts = query(
        "SELECT account_number, account_type, balance FROM accounts WHERE customer_id = %s",
        (customer_id,),
    )
    bank_total = sum(float(a["balance"]) for a in accounts)

    # Investment holdings
    holdings = query(
        "SELECT kind, name, current_value FROM holdings WHERE customer_id = %s",
        (customer_id,),
    )
    investments_total = sum(float(h["current_value"] or 0) for h in holdings)

    # Liabilities
    liabilities = query(
        "SELECT kind, name, outstanding FROM liabilities WHERE customer_id = %s",
        (customer_id,),
    )
    liabilities_total = sum(float(l["outstanding"] or 0) for l in liabilities)

    total = bank_total + investments_total - liabilities_total

    return {
        "total_net_worth": round(total, 2),
        "bank_balance": round(bank_total, 2),
        "investments": round(investments_total, 2),
        "liabilities": round(liabilities_total, 2),
        "breakdown": {
            "accounts": accounts,
            "holdings": holdings,
            "liabilities": liabilities,
        },
    }


# ── Cash flow (last 30 days) ──────────────────────────────────────────────────

def cash_flow(customer_id: int) -> dict:
    since = date.today() - timedelta(days=30)
    rows = query(
        """SELECT direction, SUM(amount) AS total
           FROM ledger_entries
           WHERE customer_id = %s AND status = 'confirmed'
             AND entry_date >= %s
             AND category != 'Transfers'
           GROUP BY direction""",
        (customer_id, since),
    )
    income  = next((float(r["total"]) for r in rows if r["direction"] == "credit"), 0.0)
    expense = next((float(r["total"]) for r in rows if r["direction"] == "debit"),  0.0)
    savings_rate = round((income - expense) / income * 100, 1) if income > 0 else 0.0

    return {
        "income":       round(income, 2),
        "expenses":     round(expense, 2),
        "net":          round(income - expense, 2),
        "savings_rate": savings_rate,
        "period_days":  30,
    }


# ── Category totals ───────────────────────────────────────────────────────────

def category_totals(customer_id: int, since_days: int = 30) -> list:
    since = date.today() - timedelta(days=since_days)
    rows = query(
        """SELECT category, direction, SUM(amount) AS total, COUNT(*) AS txn_count
           FROM ledger_entries
           WHERE customer_id = %s AND status = 'confirmed'
             AND entry_date >= %s AND category != 'Transfers'
           GROUP BY category, direction
           ORDER BY total DESC""",
        (customer_id, since),
    )
    return [
        {
            "category":  r["category"],
            "direction": r["direction"],
            "total":     round(float(r["total"]), 2),
            "txn_count": r["txn_count"],
        }
        for r in rows
    ]


# ── Bills due soon ────────────────────────────────────────────────────────────

def bills_due(customer_id: int, days_ahead: int = 30) -> list:
    cutoff = date.today() + timedelta(days=days_ahead)
    today  = date.today()

    # From liabilities (EMI due dates)
    liabs = query(
        """SELECT liability_id AS id, kind, name, emi AS amount, due_date
           FROM liabilities
           WHERE customer_id = %s AND due_date BETWEEN %s AND %s""",
        (customer_id, today, cutoff),
    )
    # From policies (renewal dates)
    pols = query(
        """SELECT policy_id AS id, insurer AS name, premium AS amount, renewal_date AS due_date
           FROM policies
           WHERE customer_id = %s AND renewal_date BETWEEN %s AND %s""",
        (customer_id, today, cutoff),
    )
    result = []
    for r in liabs:
        result.append({
            "type": "liability", "kind": r["kind"], "name": r["name"],
            "amount": float(r["amount"] or 0),
            "due_date": str(r["due_date"]),
            "days_until": (r["due_date"] - today).days,
        })
    for r in pols:
        result.append({
            "type": "policy", "kind": "insurance", "name": r["name"],
            "amount": float(r["amount"] or 0),
            "due_date": str(r["due_date"]),
            "days_until": (r["due_date"] - today).days,
        })
    result.sort(key=lambda x: x["days_until"])
    return result


# ── Finders (each returns proof_row_ids) ─────────────────────────────────────

def find_recurring_subscriptions(customer_id: int) -> list:
    """Same merchant, same amount, appeared in at least 2 different months."""
    rows = query(
        """SELECT entry_id, merchant, amount, entry_date
           FROM ledger_entries
           WHERE customer_id = %s AND status = 'confirmed'
             AND category = 'Subscriptions'
           ORDER BY merchant, entry_date""",
        (customer_id,),
    )
    by_merchant = defaultdict(list)
    for r in rows:
        by_merchant[(r["merchant"], float(r["amount"]))].append(r)

    findings = []
    for (merchant, amount), entries in by_merchant.items():
        months = {str(e["entry_date"])[:7] for e in entries}
        if len(months) >= 2:
            findings.append({
                "type":         "recurring_subscription",
                "merchant":     merchant,
                "monthly_cost": round(amount, 2),
                "months_seen":  len(months),
                "proof_row_ids": [e["entry_id"] for e in entries],
            })
    return findings


def find_possible_duplicates(customer_id: int) -> list:
    """Same merchant + amount on the same date."""
    rows = query(
        """SELECT entry_id, merchant, amount, entry_date
           FROM ledger_entries
           WHERE customer_id = %s AND status = 'confirmed'
           ORDER BY entry_date, merchant""",
        (customer_id,),
    )
    seen = defaultdict(list)
    for r in rows:
        key = (str(r["entry_date"]), r["merchant"], float(r["amount"]))
        seen[key].append(r["entry_id"])

    findings = []
    for (dt, merchant, amount), ids in seen.items():
        if len(ids) > 1:
            findings.append({
                "type":          "possible_duplicate",
                "merchant":      merchant,
                "amount":        round(amount, 2),
                "date":          dt,
                "proof_row_ids": ids,
            })
    return findings


def find_spending_spikes(customer_id: int) -> list:
    """Category spend doubled vs previous period."""
    today  = date.today()
    p1_end = today
    p1_start = today - timedelta(days=30)
    p2_end   = p1_start
    p2_start = p1_start - timedelta(days=30)

    def period_totals(start, end):
        rows = query(
            """SELECT category, SUM(amount) AS total
               FROM ledger_entries
               WHERE customer_id = %s AND status='confirmed' AND direction='debit'
                 AND entry_date BETWEEN %s AND %s AND category != 'Transfers'
               GROUP BY category""",
            (customer_id, start, end),
        )
        return {r["category"]: float(r["total"]) for r in rows}

    current = period_totals(p1_start, p1_end)
    previous = period_totals(p2_start, p2_end)

    findings = []
    for cat, curr_total in current.items():
        prev_total = previous.get(cat, 0)
        if prev_total > 0 and curr_total >= prev_total * 2:
            proof_rows = query(
                """SELECT entry_id FROM ledger_entries
                   WHERE customer_id = %s AND status='confirmed' AND direction='debit'
                     AND category = %s AND entry_date BETWEEN %s AND %s""",
                (customer_id, cat, p1_start, p1_end),
            )
            findings.append({
                "type":          "spending_spike",
                "category":      cat,
                "current_total": round(curr_total, 2),
                "previous_total": round(prev_total, 2),
                "change_pct":    round((curr_total - prev_total) / prev_total * 100, 1),
                "proof_row_ids": [r["entry_id"] for r in proof_rows],
            })
    return findings


def find_card_near_limit(customer_id: int, threshold: float = 0.85) -> list:
    liabs = query(
        """SELECT liability_id, name, outstanding, limit_amount
           FROM liabilities
           WHERE customer_id = %s AND kind = 'card'
             AND limit_amount > 0""",
        (customer_id,),
    )
    findings = []
    for l in liabs:
        utilisation = float(l["outstanding"]) / float(l["limit_amount"])
        if utilisation >= threshold:
            findings.append({
                "type":         "card_near_limit",
                "card_name":    l["name"],
                "outstanding":  round(float(l["outstanding"]), 2),
                "limit":        round(float(l["limit_amount"]), 2),
                "utilisation":  round(utilisation * 100, 1),
                "proof_row_ids": [l["liability_id"]],  # liability id as reference
            })
    return findings


def all_finders(customer_id: int) -> list:
    """Run every finder and return a flat list of findings with id, type, title, reason, proof, action."""
    raw = []
    raw.extend(find_recurring_subscriptions(customer_id))
    raw.extend(find_possible_duplicates(customer_id))
    raw.extend(find_spending_spikes(customer_id))
    raw.extend(find_card_near_limit(customer_id))

    # Normalise into the /insights contract shape
    findings = []
    for i, f in enumerate(raw):
        ftype = f["type"]

        if ftype == "recurring_subscription":
            title  = f"Potentially unused subscription: {f['merchant']}"
            reason = f"Charged Rs {f['monthly_cost']} every month for {f['months_seen']} months."
            action = "Review whether you still use this service."

        elif ftype == "possible_duplicate":
            title  = f"Possible duplicate: {f['merchant']}"
            reason = f"Rs {f['amount']} charged twice on {f['date']}."
            action = "Check your statement and raise a dispute if confirmed."

        elif ftype == "spending_spike":
            title  = f"Spending spike: {f['category']}"
            reason = (f"{f['category']} spend was Rs {f['current_total']} this month "
                      f"vs Rs {f['previous_total']} last month (+{f['change_pct']}%).")
            action = f"Review your {f['category'].lower()} transactions."

        elif ftype == "card_near_limit":
            title  = f"Card near limit: {f['card_name']}"
            reason = (f"Outstanding Rs {f['outstanding']} is {f['utilisation']}% "
                      f"of your Rs {f['limit']} limit.")
            action = "Pay down the balance to improve your credit utilisation."

        else:
            title  = ftype
            reason = ""
            action = ""

        findings.append({
            "id":           i + 1,
            "type":         ftype,
            "title":        title,
            "reason":       reason,
            "proof_row_ids": f.get("proof_row_ids", []),
            "action":       action,
            "data":         f,
        })

    return findings


# ── Goal simulator ────────────────────────────────────────────────────────────

def goal_simulate(customer_id: int, goal_id: int, what_ifs: dict = None, num_simulations: int = 1000) -> dict:
    """
    Monte Carlo simulation for a savings goal.
    what_ifs: e.g. {"Food": -1800}  → trim Rs 1800 from Food spending
    Returns: { goal, current_savings, projected_savings, months_needed,
               success_probability, what_if_impact }
    """
    goal = query(
        "SELECT * FROM goals WHERE goal_id = %s AND customer_id = %s",
        (goal_id, customer_id), fetch="one",
    )
    if not goal:
        return {"error": "Goal not found"}

    target   = float(goal["target_amount"])
    deadline = goal["deadline"]
    today    = date.today()
    months_left = max(1, round((deadline - today).days / 30))

    # Monthly net savings from last 3 months
    three_months_ago = today - timedelta(days=90)
    monthly_rows = query(
        """SELECT DATE_TRUNC('month', entry_date) AS month,
                  SUM(CASE WHEN direction='credit' THEN amount ELSE -amount END) AS net
           FROM ledger_entries
           WHERE customer_id = %s AND status='confirmed'
             AND entry_date >= %s AND category != 'Transfers'
           GROUP BY 1 ORDER BY 1""",
        (customer_id, three_months_ago),
    )

    nets = [float(r["net"]) for r in monthly_rows] or [0.0]
    base_monthly = sum(nets) / len(nets)

    # Apply what-if adjustments
    what_ifs = what_ifs or {}
    adjustment = sum(what_ifs.values())
    adjusted_monthly = base_monthly - adjustment  # negative what_if = cut spending = more savings

    # Monte Carlo
    std_dev = (
        math.sqrt(sum((x - base_monthly) ** 2 for x in nets) / len(nets))
        if len(nets) > 1 else abs(base_monthly * 0.2)
    )
    successes = 0
    for _ in range(num_simulations):
        total = sum(
            adjusted_monthly + random.gauss(0, std_dev)
            for _ in range(months_left)
        )
        if total >= target:
            successes += 1

    probability = round(successes / num_simulations * 100, 1)
    projected   = round(adjusted_monthly * months_left, 2)

    # What-if impact vs base case
    base_projected = round(base_monthly * months_left, 2)

    return {
        "goal": {
            "id":     goal_id,
            "name":   goal["name"],
            "target": target,
            "deadline": str(deadline),
        },
        "months_left":           months_left,
        "base_monthly_savings":  round(base_monthly, 2),
        "adjusted_monthly":      round(adjusted_monthly, 2),
        "projected_savings":     projected,
        "base_projected":        base_projected,
        "success_probability":   probability,
        "what_ifs":              what_ifs,
        "note": "Estimate based on recent history. Not financial advice.",
    }
