"""
Artha engine routes  (all under /api/artha)
GET  /overview          — net worth, cash flow, savings rate, bills due
GET  /transactions      — exact rows behind a number (evidence drawer)
GET  /insights          — all findings with proof row ids
POST /goals/simulate    — Monte Carlo goal odds with optional what-ifs
POST /coach             — Gemma explains finished numbers in English or Tamil
GET  /goals             — list user's goals
POST /goals             — create a new goal
"""

import os
import json

from flask import Blueprint, request, session, jsonify
from auth_utils import api_login_required
from db import query
from engine.calculator import (
    net_worth, cash_flow, category_totals,
    all_finders, bills_due, goal_simulate,
)

engine_bp = Blueprint("engine", __name__)


# ── GET /overview ─────────────────────────────────────────────────────────────

@engine_bp.route("/overview", methods=["GET"])
@api_login_required
def overview():
    cid = session["customer_id"]
    return jsonify({
        "net_worth":    net_worth(cid),
        "cash_flow":    cash_flow(cid),
        "categories":   category_totals(cid),
        "bills_due":    bills_due(cid),
    })


# ── GET /transactions ─────────────────────────────────────────────────────────

@engine_bp.route("/transactions", methods=["GET"])
@api_login_required
def transactions():
    """
    Returns the raw ledger rows that back a number.
    Query params:
      category     — filter by category
      finding_id   — comma-separated entry_ids
      direction    — debit | credit
      from_date    — YYYY-MM-DD
      to_date      — YYYY-MM-DD
      limit        — default 100
    """
    cid   = session["customer_id"]
    limit = min(int(request.args.get("limit", 100)), 500)

    conditions = ["customer_id = %s", "status = 'confirmed'"]
    params     = [cid]

    if request.args.get("category"):
        conditions.append("category = %s")
        params.append(request.args["category"])

    if request.args.get("finding_id"):
        ids = [int(x) for x in request.args["finding_id"].split(",") if x.strip().isdigit()]
        conditions.append(f"entry_id = ANY(ARRAY{ids}::int[])")

    if request.args.get("direction"):
        conditions.append("direction = %s")
        params.append(request.args["direction"])

    if request.args.get("from_date"):
        conditions.append("entry_date >= %s")
        params.append(request.args["from_date"])

    if request.args.get("to_date"):
        conditions.append("entry_date <= %s")
        params.append(request.args["to_date"])

    where = " AND ".join(conditions)
    params.append(limit)

    rows = query(
        f"""SELECT entry_id, entry_date, merchant, amount, direction,
                   category, confidence, source_ref, doc_id
            FROM ledger_entries
            WHERE {where}
            ORDER BY entry_date DESC
            LIMIT %s""",
        params,
    )
    return jsonify({"transactions": rows, "count": len(rows)})


# ── GET /insights ─────────────────────────────────────────────────────────────

@engine_bp.route("/insights", methods=["GET"])
@api_login_required
def insights():
    cid = session["customer_id"]
    findings = all_finders(cid)
    return jsonify({"findings": findings, "count": len(findings)})


# ── GET /goals ────────────────────────────────────────────────────────────────

@engine_bp.route("/goals", methods=["GET"])
@api_login_required
def list_goals():
    cid  = session["customer_id"]
    rows = query(
        "SELECT * FROM goals WHERE customer_id = %s ORDER BY deadline",
        (cid,),
    )
    return jsonify({"goals": rows})


# ── POST /goals ───────────────────────────────────────────────────────────────

@engine_bp.route("/goals", methods=["POST"])
@api_login_required
def create_goal():
    cid  = session["customer_id"]
    data = request.get_json(force=True) or {}
    name   = data.get("name", "").strip()
    target = data.get("target_amount")
    dl     = data.get("deadline")

    if not name or not target or not dl:
        return jsonify({"error": "name, target_amount and deadline required"}), 400

    row = query(
        """INSERT INTO goals (customer_id, name, target_amount, deadline)
           VALUES (%s,%s,%s,%s) RETURNING goal_id""",
        (cid, name, float(target), dl), fetch="one",
    )
    return jsonify({"goal_id": row["goal_id"], "message": "Goal created"}), 201


# ── POST /goals/simulate ──────────────────────────────────────────────────────

@engine_bp.route("/goals/simulate", methods=["POST"])
@api_login_required
def simulate_goal():
    cid  = session["customer_id"]
    data = request.get_json(force=True) or {}
    goal_id  = data.get("goal_id")
    what_ifs = data.get("what_ifs", {})   # e.g. {"Food": -1800}

    if not goal_id:
        return jsonify({"error": "goal_id required"}), 400

    result = goal_simulate(cid, int(goal_id), what_ifs)
    return jsonify(result)


# ── POST /coach ───────────────────────────────────────────────────────────────

@engine_bp.route("/coach", methods=["POST"])
@api_login_required
def coach():
    """
    Give Gemma pre-computed numbers and ask for a short explanation.
    Gemma is NEVER asked to compute a total — only to explain.
    Body: { metric: {...}, language: "english" | "tamil" }
    """
    data     = request.get_json(force=True) or {}
    metric   = data.get("metric", {})
    language = data.get("language", "english").lower()

    if not metric:
        return jsonify({"error": "metric data required"}), 400

    provider = os.environ.get("LLM_PROVIDER", "gemini")

    lang_instruction = (
        "Respond in Tamil (தமிழ்)." if language == "tamil"
        else "Respond in English."
    )

    prompt = f"""You are a friendly personal finance coach.
{lang_instruction}
The following numbers have already been calculated by a trusted Python engine.
Do NOT add, subtract, or compute any totals yourself. Only explain what the numbers mean.
Keep the explanation under 60 words. Do not give investment advice.
Include a brief, actionable suggestion.

Data:
{json.dumps(metric, indent=2)}

Explanation:"""

    try:
        if provider == "ollama":
            import requests as req
            base  = os.environ.get("OLLAMA_BASE_URL", "http://localhost:11434")
            model = os.environ.get("OLLAMA_MODEL", "gemma4:e4b")
            r = req.post(f"{base}/api/generate",
                         json={"model": model, "prompt": prompt, "stream": False},
                         timeout=60)
            r.raise_for_status()
            explanation = r.json().get("response", "").strip()
        else:
            import google.generativeai as genai
            api_key = os.environ.get("GEMINI_API_KEY")
            if not api_key:
                return jsonify({"error": "GEMINI_API_KEY not configured"}), 503
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel("gemma-4-31b-it")
            response = model.generate_content(prompt)
            explanation = response.text.strip()

        return jsonify({"explanation": explanation, "language": language})

    except Exception as e:
        return jsonify({"error": f"Coach unavailable: {str(e)}"}), 503
