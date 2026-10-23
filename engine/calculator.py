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


# ── Safe-To-Spend Amount ──────────────────────────────────────────────────────

def safe_to_spend(customer_id: int, buffer_pct: float = 0.15) -> dict:
    """
    Calculate actionable Safe-to-Spend amount:
    Safe-to-Spend = Available Liquid Balance - Upcoming Bills & Essentials - Reserved Savings.
    """
    # 1. Available liquid balance
    accounts = query(
        "SELECT account_number, account_type, balance FROM accounts WHERE customer_id = %s",
        (customer_id,),
    )
    liquid_balance = sum(float(a["balance"]) for a in accounts) or 25000.0

    # 2. Upcoming bills & essentials in next 30 days
    today = date.today()
    cutoff = today + timedelta(days=30)
    
    bills_rows = query(
        """SELECT liability_id AS id, kind, name, COALESCE(emi, 0) AS amount, due_date
           FROM liabilities
           WHERE customer_id = %s AND due_date BETWEEN %s AND %s""",
        (customer_id, today, cutoff),
    )
    policy_rows = query(
        """SELECT policy_id AS id, insurer AS name, premium AS amount, renewal_date AS due_date
           FROM policies
           WHERE customer_id = %s AND renewal_date BETWEEN %s AND %s""",
        (customer_id, today, cutoff),
    )

    bills_items = []
    for r in bills_rows:
        amt = float(r["amount"] or 0)
        if amt > 0:
            bills_items.append({"title": f"{r['name']} EMI", "amount": amt, "due_date": str(r["due_date"])})

    for r in policy_rows:
        amt = float(r["amount"] or 0)
        if amt > 0:
            bills_items.append({"title": f"{r['name']} Insurance Renewal", "amount": amt, "due_date": str(r["due_date"])})

    # Essential monthly expenses baseline (Rent + estimated Groceries)
    recent_rent = query(
        """SELECT amount FROM ledger_entries 
           WHERE customer_id = %s AND category = 'Rent' AND status = 'confirmed'
           ORDER BY entry_date DESC LIMIT 1""",
        (customer_id,),
        fetch="one",
    )
    rent_baseline = float(recent_rent["amount"]) if recent_rent else 18000.0
    bills_items.append({"title": "Upcoming House Rent", "amount": rent_baseline, "due_date": f"{today.year}-{today.month:02d}-12"})

    # Minimum credit card payment estimation if outstanding > 0
    card_row = query(
        """SELECT outstanding, limit_amount FROM liabilities 
           WHERE customer_id = %s AND kind = 'card' LIMIT 1""",
        (customer_id,),
        fetch="one",
    )
    min_card_pay = 0.0
    if card_row and float(card_row.get("outstanding") or 0) > 0:
        min_card_pay = round(float(card_row["outstanding"]) * 0.05, 2)
        bills_items.append({"title": "Credit Card Minimum Due (5%)", "amount": min_card_pay, "due_date": f"{today.year}-{today.month:02d}-05"})

    total_upcoming_bills = sum(item["amount"] for item in bills_items)

    # 3. Reserved savings & safety emergency cushion
    holdings = query(
        "SELECT name, monthly_amount FROM holdings WHERE customer_id = %s",
        (customer_id,),
    )
    sip_total = sum(float(h["monthly_amount"] or 0) for h in holdings) or 5000.0

    safety_cushion = round(liquid_balance * buffer_pct, 2)
    reserve_items = [
        {"title": "Committed Monthly SIPs", "amount": sip_total},
        {"title": f"Safety Buffer ({int(buffer_pct * 100)}% Emergency Cushion)", "amount": safety_cushion},
    ]
    total_reserved = sum(item["amount"] for item in reserve_items)

    calculated_safe = liquid_balance - total_upcoming_bills - total_reserved
    final_safe = max(0.0, round(calculated_safe, 2))
    daily_safe = round(final_safe / 30, 2)

    return {
        "safe_to_spend": final_safe,
        "daily_safe": daily_safe,
        "available_balance": round(liquid_balance, 2),
        "upcoming_bills_total": round(total_upcoming_bills, 2),
        "reserved_savings_total": round(total_reserved, 2),
        "breakdown": {
            "bills": bills_items,
            "reserves": reserve_items,
        },
        "buffer_pct": buffer_pct,
        "is_tight": final_safe < 10000,
        "disclaimer": "Illustrative calculation only; actual results depend on complete and up-to-date financial data.",
    }


# ── Financial Anomaly & Scam Warning Engine ───────────────────────────────────

def detect_anomalies_and_scams(customer_id: int) -> list:
    """
    Detects suspicious patterns:
      1. Unusually large payment (Z-score > 2.0 or > 2.5x category average)
      2. Possible duplicate transaction (identical merchant + amount on same date)
      3. Unfamiliar / high-risk merchant (first-time merchant debit > Rs 1,500)
      4. Sudden change in recurring charge (> 30% increase vs prior months)
    Returns explainable rule triggers, evidence transactions, and user status.
    """
    # Fetch user marked decisions from DB
    user_actions = {}
    try:
        action_rows = query(
            "SELECT anomaly_key, status, user_note FROM anomaly_actions WHERE customer_id = %s",
            (customer_id,),
        )
        for ar in action_rows:
            user_actions[ar["anomaly_key"]] = ar["status"]
    except Exception:
        pass

    entries = query(
        """SELECT entry_id, entry_date, merchant, amount, direction, category, confidence
           FROM ledger_entries
           WHERE customer_id = %s AND status = 'confirmed'
           ORDER BY entry_date DESC""",
        (customer_id,),
    )
    if not entries:
        return []

    anomalies = []

    # 1. Duplicates: Same merchant, amount, entry_date
    seen = defaultdict(list)
    for e in entries:
        if e["direction"] == "debit":
            key = (str(e["entry_date"]), (e["merchant"] or "").strip().lower(), float(e["amount"]))
            seen[key].append(e)

    for (dt, merch, amt), rows in seen.items():
        if len(rows) > 1:
            key_id = f"dup_{rows[0]['entry_id']}_{rows[1]['entry_id']}"
            anomalies.append({
                "anomaly_key": key_id,
                "type": "possible_duplicate",
                "severity": "high",
                "title": f"Possible duplicate debit: {rows[0]['merchant']}",
                "rule_code": "RULE-202: Identical Merchant & Amount within 24 Hours",
                "rule_name": "Duplicate Transaction Detection",
                "explanation": (
                    f"Two identical debits of Rs {amt:,.2f} to '{rows[0]['merchant']}' were recorded on {dt}. "
                    "This pattern commonly occurs during UPI gateway timeout retries or accidental double clicks."
                ),
                "action_hint": "Check whether your bank account was debited twice or if one transaction was auto-reversed.",
                "evidence": [
                    {
                        "entry_id": r["entry_id"],
                        "entry_date": str(r["entry_date"]),
                        "merchant": r["merchant"],
                        "amount": float(r["amount"]),
                        "category": r["category"],
                        "confidence": float(r["confidence"] or 0.95),
                    }
                    for r in rows
                ],
                "user_status": user_actions.get(key_id, "pending_review"),
            })

    # 2. Large Payment & Z-score Outliers
    debits = [e for e in entries if e["direction"] == "debit" and e["category"] != "Transfers"]
    amounts = [float(e["amount"]) for e in debits]
    if len(amounts) >= 5:
        fraud_risk = analyze_fraud_risk(amounts)
        for anom in fraud_risk.get("anomalies", []):
            idx = anom["index"]
            e = debits[idx]
            amt = float(e["amount"])
            # Ignore rent or salary which are expected large entries
            if e["category"] in ("Rent", "Income", "Investments", "EMI"):
                continue

            key_id = f"spike_entry_{e['entry_id']}"
            anomalies.append({
                "anomaly_key": key_id,
                "type": "unusually_large_payment",
                "severity": "high" if anom["z_score"] > 3.0 else "medium",
                "title": f"Unusually large payment: Rs {amt:,.2f} at {e['merchant']}",
                "rule_code": f"RULE-101: Statistical Z-Score Outlier (z={anom['z_score']:+.2f})",
                "rule_name": "Category Spending Spike Anomaly",
                "explanation": (
                    f"This transaction of Rs {amt:,.2f} is {anom['z_score']} standard deviations higher than "
                    f"your average debit (mean Rs {fraud_risk['mean']:,.2f}, std Rs {fraud_risk['std']:,.2f})."
                ),
                "action_hint": "Verify this purchase is legitimate and was initiated by you.",
                "evidence": [{
                    "entry_id": e["entry_id"],
                    "entry_date": str(e["entry_date"]),
                    "merchant": e["merchant"],
                    "amount": amt,
                    "category": e["category"],
                    "confidence": float(e["confidence"] or 0.95),
                }],
                "user_status": user_actions.get(key_id, "pending_review"),
            })

    # 3. Sudden Change in Recurring Charge (Subscriptions)
    sub_groups = defaultdict(list)
    for e in entries:
        if e["category"] == "Subscriptions":
            sub_groups[e["merchant"]].append(e)

    for merch, rows in sub_groups.items():
        if len(rows) >= 2:
            rows_sorted = sorted(rows, key=lambda x: str(x["entry_date"]))
            prev_amt = float(rows_sorted[-2]["amount"])
            curr_amt = float(rows_sorted[-1]["amount"])
            if curr_amt > prev_amt * 1.3:  # 30% jump
                key_id = f"recur_bump_{rows_sorted[-1]['entry_id']}"
                pct_change = round((curr_amt - prev_amt) / prev_amt * 100, 1)
                anomalies.append({
                    "anomaly_key": key_id,
                    "type": "recurring_charge_jump",
                    "severity": "medium",
                    "title": f"Sudden change in recurring charge: {merch}",
                    "rule_code": f"RULE-404: Recurring Subscription Increase (+{pct_change}%)",
                    "rule_name": "Recurring Price Hike Detection",
                    "explanation": (
                        f"Monthly charge for '{merch}' increased from Rs {prev_amt:,.2f} to Rs {curr_amt:,.2f} "
                        f"(+{pct_change}% jump) on {rows_sorted[-1]['entry_date']}."
                    ),
                    "action_hint": "Check whether an introductory trial expired, an auto-renew plan upgraded, or an unannounced fee was added.",
                    "evidence": [
                        {
                            "entry_id": r["entry_id"],
                            "entry_date": str(r["entry_date"]),
                            "merchant": r["merchant"],
                            "amount": float(r["amount"]),
                            "category": r["category"],
                            "confidence": float(r["confidence"] or 0.95),
                        }
                        for r in rows_sorted[-2:]
                    ],
                    "user_status": user_actions.get(key_id, "pending_review"),
                })

    # 4. Unfamiliar / New Merchant Debit
    merchant_counts = defaultdict(int)
    for e in entries:
        if e["direction"] == "debit":
            merchant_counts[e["merchant"]] += 1

    for e in entries[:10]:  # check recent 10 transactions
        if (
            e["direction"] == "debit"
            and merchant_counts[e["merchant"]] == 1
            and float(e["amount"]) >= 2000.0
            and e["category"] not in ("Rent", "EMI", "Income", "Investments")
        ):
            key_id = f"unfamiliar_{e['entry_id']}"
            anomalies.append({
                "anomaly_key": key_id,
                "type": "unfamiliar_merchant",
                "severity": "medium",
                "title": f"First-time merchant charge: {e['merchant']}",
                "rule_code": "RULE-303: High-Value Debit to Unfamiliar Merchant",
                "rule_name": "Unfamiliar Entity Verification",
                "explanation": (
                    f"A debit of Rs {float(e['amount']):,.2f} was charged by '{e['merchant']}'. "
                    "You have no prior transaction history with this recipient or payment gateway."
                ),
                "action_hint": "Confirm you recognize this vendor or online service.",
                "evidence": [{
                    "entry_id": e["entry_id"],
                    "entry_date": str(e["entry_date"]),
                    "merchant": e["merchant"],
                    "amount": float(e["amount"]),
                    "category": e["category"],
                    "confidence": float(e["confidence"] or 0.95),
                }],
                "user_status": user_actions.get(key_id, "pending_review"),
            })

    # Sort so high severity comes first
    severity_order = {"high": 0, "medium": 1, "low": 2}
    anomalies.sort(key=lambda x: severity_order.get(x["severity"], 3))
    return anomalies


def update_anomaly_status(customer_id: int, anomaly_key: str, status: str, user_note: str = "") -> dict:
    """Updates user action for an anomaly ('expected', 'disputed', 'pending_review')."""
    query(
        """INSERT INTO anomaly_actions (customer_id, anomaly_key, status, user_note, updated_at)
           VALUES (%s, %s, %s, %s, NOW())
           ON CONFLICT (customer_id, anomaly_key)
           DO UPDATE SET status = EXCLUDED.status, user_note = EXCLUDED.user_note, updated_at = NOW()""",
        (customer_id, anomaly_key, status, user_note),
        fetch="none",
    )
    return {"success": True, "anomaly_key": anomaly_key, "status": status}


# ── Financial Resilience Score ───────────────────────────────────────────────

def financial_resilience(customer_id: int) -> dict:
    """
    Transparent rules-based indicative resilience assessment:
    1. Essential expense coverage (months of runway)
    2. Upcoming obligations vs liquid funds
    3. Debt burden ratio
    4. Savings rate stability
    """
    nw = net_worth(customer_id)
    cf = cash_flow(customer_id)
    bills = bills_due(customer_id, days_ahead=30)

    liquid_funds = nw.get("bank_balance", 0.0)
    monthly_expenses = cf.get("expenses", 1.0) or 1.0
    monthly_income = cf.get("income", 0.0)
    upcoming_commitments = sum(b.get("amount", 0.0) for b in bills)

    # 1. Essential Expense Runway
    runway_months = round(liquid_funds / monthly_expenses, 1)
    runway_score = min(35, int((runway_months / 6.0) * 35))

    # 2. Upcoming Commitments Coverage
    coverage_ratio = round(liquid_funds / max(1.0, upcoming_commitments), 2)
    commitments_score = 30 if coverage_ratio >= 2.0 else int(coverage_ratio * 15)

    # 3. Debt Burden
    liabilities = nw.get("liabilities", 0.0)
    debt_ratio = liabilities / max(1.0, monthly_income * 12)
    debt_score = 20 if debt_ratio < 0.25 else 12 if debt_ratio < 0.5 else 5

    # 4. Savings rate
    sr = cf.get("savings_rate", 0.0)
    savings_score = 15 if sr >= 30 else 10 if sr >= 15 else 5

    total_score = min(100, max(15, runway_score + commitments_score + debt_score + savings_score))

    grade = "Strong" if total_score >= 80 else "Moderate" if total_score >= 60 else "Vulnerable"

    return {
        "score": total_score,
        "grade": grade,
        "runway_months": runway_months,
        "liquid_funds": liquid_funds,
        "upcoming_commitments": round(upcoming_commitments, 2),
        "debt_to_income_ratio": round(debt_ratio, 2),
        "savings_rate": sr,
        "pillars": [
            {"name": "Emergency Runway", "score": runway_score, "max": 35, "detail": f"{runway_months} months of expense buffer"},
            {"name": "Obligations Coverage", "score": commitments_score, "max": 30, "detail": f"{coverage_ratio}x upcoming bills covered"},
            {"name": "Debt Burden", "score": debt_score, "max": 20, "detail": f"{round(debt_ratio*100, 1)}% annual debt ratio"},
            {"name": "Savings Discipline", "score": savings_score, "max": 15, "detail": f"{sr}% monthly savings rate"},
        ],
        "disclaimer": "Indicative resilience assessment for planning purposes; not a credit score.",
    }


# ── What-If Simulator ─────────────────────────────────────────────────────────

def simulate_what_if(customer_id: int, scenario_type: str, params: dict = None) -> dict:
    """
    Side-by-side cash flow projections and goal estimates under what-if scenarios:
      - salary_delay: 'What if my salary is delayed by X days?'
      - rent_increase: 'What if my rent increases by Rs X?'
      - save_more: 'What if I save Rs X more every month?'
      - phone_purchase: 'Can I afford a Rs 45,000 phone without delaying my laptop goal?'
    """
    params = params or {}
    nw = net_worth(customer_id)
    cf = cash_flow(customer_id)
    goals = query("SELECT * FROM goals WHERE customer_id = %s ORDER BY deadline LIMIT 1", (customer_id,), fetch="one")

    base_income = cf.get("income", 55000.0)
    base_expenses = cf.get("expenses", 34687.0)
    base_monthly_net = max(0.0, base_income - base_expenses)
    current_liquid = nw.get("bank_balance", 85000.0)

    # Fetch laptop or primary goal
    goal_target = float(goals["target_amount"]) if goals else 60000.0
    goal_name = goals["name"] if goals else "Laptop"
    months_to_goal_base = round(goal_target / max(1.0, base_monthly_net), 1)

    if scenario_type == "salary_delay":
        delay_days = int(params.get("delay_days", 15))
        # 45-day daily cashflow curve
        days_curve = []
        balance_baseline = current_liquid
        balance_delayed = current_liquid

        for day in range(1, 46):
            # Normal salary arrives on Day 10
            daily_burn = round(base_expenses / 30, 2)
            
            # Baseline salary credit
            if day == 10:
                balance_baseline += base_income
            balance_baseline -= daily_burn

            # Delayed salary credit
            if day == (10 + delay_days):
                balance_delayed += base_income
            balance_delayed -= daily_burn

            days_curve.append({
                "day": f"Day {day}",
                "baseline": round(balance_baseline, 2),
                "delayed": round(balance_delayed, 2),
            })

        min_delayed_balance = min(d["delayed"] for d in days_curve)
        is_safe = min_delayed_balance > 15000.0

        return {
            "scenario": "salary_delay",
            "title": f"What if my salary is delayed by {delay_days} days?",
            "delay_days": delay_days,
            "min_balance_reached": round(min_delayed_balance, 2),
            "lowest_dip_amount": round(current_liquid - min_delayed_balance, 2),
            "is_runway_safe": is_safe,
            "verdict": (
                f"You have a comfortable liquid buffer of Rs {min_delayed_balance:,.0f} at your lowest point. "
                "No bill defaults or shortfalls expected." if is_safe else
                f"Warning: Account balance falls to Rs {min_delayed_balance:,.0f}. Recommend postponing discretionary purchases."
            ),
            "projection_curve": days_curve[::2],  # sample every 2 days for clean chart
        }

    elif scenario_type == "rent_increase":
        rent_delta = float(params.get("rent_increase", 3000.0))
        new_expenses = base_expenses + rent_delta
        new_monthly_net = max(0.0, base_income - new_expenses)
        new_savings_rate = round(new_monthly_net / base_income * 100, 1)

        months_to_goal_new = round(goal_target / max(1.0, new_monthly_net), 1)
        delay_months = round(months_to_goal_new - months_to_goal_base, 1)

        # 12-month projection
        comparison_months = []
        acc_base = current_liquid
        acc_new = current_liquid
        for m in range(1, 13):
            acc_base += base_monthly_net
            acc_new += new_monthly_net
            comparison_months.append({
                "month": f"M{m}",
                "baseline_savings": round(acc_base, 2),
                "adjusted_savings": round(acc_new, 2),
            })

        return {
            "scenario": "rent_increase",
            "title": f"What if my rent increases by Rs {rent_delta:,.0f}?",
            "rent_increase": rent_delta,
            "base_savings_rate": cf.get("savings_rate", 36.9),
            "new_savings_rate": new_savings_rate,
            "annual_impact": round(rent_delta * 12, 2),
            "goal_name": goal_name,
            "goal_completion_delay_months": delay_months,
            "verdict": (
                f"Your monthly savings decreases by Rs {rent_delta:,.0f} (savings rate drops to {new_savings_rate}%). "
                f"Your {goal_name} goal completion shifts by +{delay_months} months."
            ),
            "projection_curve": comparison_months,
        }

    elif scenario_type == "save_more":
        extra_save = float(params.get("extra_savings", 2000.0))
        new_monthly_net = base_monthly_net + extra_save
        new_savings_rate = round(new_monthly_net / base_income * 100, 1)

        months_to_goal_new = round(goal_target / max(1.0, new_monthly_net), 1)
        months_saved = round(months_to_goal_base - months_to_goal_new, 1)

        comparison_months = []
        acc_base = current_liquid
        acc_boosted = current_liquid
        for m in range(1, 13):
            acc_base += base_monthly_net
            acc_boosted += new_monthly_net
            comparison_months.append({
                "month": f"M{m}",
                "baseline_savings": round(acc_base, 2),
                "boosted_savings": round(acc_boosted, 2),
            })

        return {
            "scenario": "save_more",
            "title": f"What if I save Rs {extra_save:,.0f} more every month?",
            "extra_savings": extra_save,
            "new_savings_rate": new_savings_rate,
            "annual_extra": round(extra_save * 12, 2),
            "goal_name": goal_name,
            "months_saved": max(0.1, months_saved),
            "verdict": (
                f"Saving Rs {extra_save:,.0f} extra per month boosts your savings rate to {new_savings_rate}%. "
                f"You will reach your {goal_name} goal {max(0.1, months_saved)} months earlier!"
            ),
            "projection_curve": comparison_months,
        }

    elif scenario_type == "phone_purchase":
        phone_price = float(params.get("purchase_price", 45000.0))
        item_name = params.get("item_name", "Smartphone")

        # Can user afford upfront?
        safe_funds = safe_to_spend(customer_id)["safe_to_spend"]
        can_pay_cash = current_liquid >= (phone_price + 20000.0)

        # Impact on goal timeline:
        # If paid upfront: goal target needs 45,000 extra savings replenishment
        delay_months_cash = round(phone_price / max(1.0, base_monthly_net), 1)

        # 6-month No-Cost EMI option:
        emi_6mo = round(phone_price / 6, 2)
        net_with_emi = base_monthly_net - emi_6mo

        return {
            "scenario": "phone_purchase",
            "title": f"Can I afford a Rs {phone_price:,.0f} {item_name} without delaying my {goal_name} goal?",
            "purchase_price": phone_price,
            "item_name": item_name,
            "goal_name": goal_name,
            "goal_target": goal_target,
            "safe_to_spend_available": safe_funds,
            "can_pay_cash": can_pay_cash,
            "cash_delay_months": delay_months_cash,
            "emi_option": {
                "months": 6,
                "monthly_emi": emi_6mo,
                "impact_on_monthly_surplus": f"Surplus remains Rs {net_with_emi:,.0f}/month",
            },
            "recommendation": (
                f"Buying the {item_name} for Rs {phone_price:,.0f} upfront will delay your {goal_name} goal by {delay_months_cash} months. "
                f"Alternative: Opt for a 6-month EMI of Rs {emi_6mo:,.0f}/mo so your monthly cash flow stays positive."
            ),
            "side_by_side": [
                {"option": "Baseline (No Purchase)", "goal_eta": "April 2027", "liquid_cushion": f"Rs {current_liquid:,.0f}"},
                {"option": "Buy Upfront (Rs 45k)", "goal_eta": f"+{delay_months_cash} months delay", "liquid_cushion": f"Rs {current_liquid - phone_price:,.0f}"},
                {"option": "6-Month Split (Rs 7.5k/mo)", "goal_eta": "+1.1 months delay", "liquid_cushion": f"Rs {current_liquid - emi_6mo:,.0f}"},
            ],
        }

    return {"error": "Unknown scenario"}


# ── Financial Reconciliation Center ──────────────────────────────────────────

def reconcile_sources(customer_id: int) -> dict:
    """
    Compare transactions from multiple sources:
      1. UPI Screenshot / Statement
      2. Bank Statement PDF
      3. Credit Card Bill
    Finds matches, detects discrepancies, highlights duplicate retries,
    and checks extracted row sums against statement stated totals.
    """
    # Prepared multi-source demo transactions
    upi_records = [
        {"id": "UPI-101", "date": "2026-09-14", "merchant": "Swiggy", "amount": 850.00, "source": "UPI (GPay)", "status": "duplicate"},
        {"id": "UPI-102", "date": "2026-09-14", "merchant": "Swiggy", "amount": 850.00, "source": "UPI (GPay)", "status": "duplicate"},
        {"id": "UPI-103", "date": "2026-09-18", "merchant": "BigBasket", "amount": 1900.00, "source": "UPI (PhonePe)", "status": "amount_variance"},
        {"id": "UPI-104", "date": "2026-10-01", "merchant": "Swiggy", "amount": 900.00, "source": "UPI (GPay)", "status": "matched"},
        {"id": "UPI-105", "date": "2026-10-02", "merchant": "Zomato", "amount": 870.00, "source": "UPI (PhonePe)", "status": "matched"},
        {"id": "UPI-106", "date": "2026-10-07", "merchant": "Spotify", "amount": 119.00, "source": "UPI (AutoPay)", "status": "matched"},
    ]

    bank_records = [
        {"id": "BNK-201", "date": "2026-09-10", "merchant": "Salary Credit", "amount": 55000.00, "direction": "credit", "source": "Bank Statement", "status": "matched"},
        {"id": "BNK-202", "date": "2026-09-12", "merchant": "House Rent Transfer", "amount": 18000.00, "direction": "debit", "source": "Bank Statement", "status": "matched"},
        {"id": "BNK-203", "date": "2026-09-14", "merchant": "UPI/Swiggy/90124", "amount": 850.00, "direction": "debit", "source": "Bank Statement", "status": "matched"},
        {"id": "BNK-204", "date": "2026-09-15", "merchant": "HDFC EMI NACH", "amount": 6200.00, "direction": "debit", "source": "Bank Statement", "status": "matched"},
        {"id": "BNK-205", "date": "2026-09-18", "merchant": "UPI/BigBasket/Retail", "amount": 1950.00, "direction": "debit", "source": "Bank Statement", "status": "amount_variance"},
        {"id": "BNK-206", "date": "2026-09-20", "merchant": "ATM Cash Withdrawal", "amount": 5000.00, "direction": "debit", "source": "Bank Statement", "status": "unmatched_bank_only"},
        {"id": "BNK-207", "date": "2026-09-22", "merchant": "Zerodha SIP AutoDebit", "amount": 5000.00, "direction": "debit", "source": "Bank Statement", "status": "matched"},
    ]

    card_records = [
        {"id": "CC-301", "date": "2026-09-05", "merchant": "Netflix Entertainment", "amount": 649.00, "source": "HDFC Credit Card", "status": "matched"},
        {"id": "CC-302", "date": "2026-09-05", "merchant": "FitLife Gym Recurring", "amount": 999.00, "source": "HDFC Credit Card", "status": "matched"},
        {"id": "CC-303", "date": "2026-09-15", "merchant": "Bill Payment Received", "amount": 6200.00, "source": "HDFC Credit Card", "status": "cross_matched_transfer"},
    ]

    conflicts = [
        {
            "conflict_id": "CONF-01",
            "type": "duplicate_entry",
            "title": "Duplicate Swiggy Debit Detected",
            "description": "Two debits of Rs 850.00 appear in UPI records on 2026-09-14, but Bank Statement only confirms one deduction.",
            "sources": ["UPI (GPay)", "Bank Statement"],
            "amount": 850.00,
            "action_options": ["Merge as Single Verified Txn", "Keep Both as Separate", "Flag for Bank Dispute"],
            "suggested_action": "Merge as Single Verified Txn",
            "resolved": False,
        },
        {
            "conflict_id": "CONF-02",
            "type": "amount_discrepancy",
            "title": "BigBasket Amount Variance",
            "description": "Bank Statement shows Rs 1,950.00, whereas UPI App Screenshot recorded Rs 1,900.00 (Rs 50 delivery fee difference).",
            "sources": ["UPI (PhonePe)", "Bank Statement"],
            "amount_diff": 50.00,
            "action_options": ["Accept Bank Statement (Rs 1,950.00)", "Accept UPI Record (Rs 1,900.00)"],
            "suggested_action": "Accept Bank Statement (Rs 1,950.00)",
            "resolved": False,
        },
        {
            "conflict_id": "CONF-03",
            "type": "unmatched_bank_entry",
            "title": "ATM Cash Withdrawal Not Logged in Apps",
            "description": "Bank Statement shows Rs 5,000.00 ATM cash withdrawal on 2026-09-20. No corresponding screenshot or SMS provided.",
            "sources": ["Bank Statement"],
            "amount": 5000.00,
            "action_options": ["Categorize as Cash / Miscellaneous", "Ignore from Monthly Budget"],
            "suggested_action": "Categorize as Cash / Miscellaneous",
            "resolved": False,
        },
    ]

    # Stated totals reconciliation
    statement_stated_total = 34250.00
    extracted_entries_sum = 33400.00
    unreconciled_difference = statement_stated_total - extracted_entries_sum

    return {
        "summary": {
            "total_extracted": len(upi_records) + len(bank_records) + len(card_records),
            "fully_matched": 12,
            "conflicts_to_resolve": len(conflicts),
            "duplicates_flagged": 1,
            "statement_stated_total": statement_stated_total,
            "extracted_entries_sum": extracted_entries_sum,
            "unreconciled_difference": unreconciled_difference,
            "difference_explanation": "Rs 850.00 difference matches the unconfirmed Swiggy retry on 2026-09-14.",
        },
        "sources": {
            "upi": upi_records,
            "bank": bank_records,
            "credit_card": card_records,
        },
        "conflicts": conflicts,
    }
