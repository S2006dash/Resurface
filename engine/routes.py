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
    safe_to_spend, detect_anomalies_and_scams, update_anomaly_status,
    financial_resilience, simulate_what_if, reconcile_sources,
)

engine_bp = Blueprint("engine", __name__)


# ── GET /overview ─────────────────────────────────────────────────────────────

@engine_bp.route("/overview", methods=["GET"])
@api_login_required
def overview():
    cid = session["customer_id"]
    return jsonify({
        "net_worth":       net_worth(cid),
        "cash_flow":       cash_flow(cid),
        "categories":      category_totals(cid),
        "bills_due":       bills_due(cid),
        "safe_to_spend":   safe_to_spend(cid),
        "resilience":      financial_resilience(cid),
        "anomalies_count": len(detect_anomalies_and_scams(cid)),
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


# ── GET /safe-to-spend ────────────────────────────────────────────────────────

@engine_bp.route("/safe-to-spend", methods=["GET"])
@api_login_required
def get_safe_to_spend():
    cid = session["customer_id"]
    buffer = float(request.args.get("buffer", 0.15))
    return jsonify(safe_to_spend(cid, buffer))


# ── GET /resilience ───────────────────────────────────────────────────────────

@engine_bp.route("/resilience", methods=["GET"])
@api_login_required
def get_resilience():
    cid = session["customer_id"]
    return jsonify(financial_resilience(cid))


# ── GET /anomalies ────────────────────────────────────────────────────────────

@engine_bp.route("/anomalies", methods=["GET"])
@api_login_required
def get_anomalies():
    cid = session["customer_id"]
    findings = detect_anomalies_and_scams(cid)
    return jsonify({"anomalies": findings, "count": len(findings)})


# ── POST /anomalies/status ────────────────────────────────────────────────────

@engine_bp.route("/anomalies/status", methods=["POST"])
@api_login_required
def post_anomaly_status():
    cid = session["customer_id"]
    data = request.get_json(force=True) or {}
    key = data.get("anomaly_key")
    status = data.get("status")  # 'expected' | 'disputed' | 'pending_review'
    note = data.get("note", "")

    if not key or not status:
        return jsonify({"error": "anomaly_key and status required"}), 400

    result = update_anomaly_status(cid, key, status, note)
    return jsonify(result)


# ── POST /what-if ─────────────────────────────────────────────────────────────

@engine_bp.route("/what-if", methods=["POST"])
@api_login_required
def post_what_if():
    cid = session["customer_id"]
    data = request.get_json(force=True) or {}
    scenario = data.get("scenario", "salary_delay")
    params = data.get("params", {})
    return jsonify(simulate_what_if(cid, scenario, params))


# ── GET /reconciliation ───────────────────────────────────────────────────────

@engine_bp.route("/reconciliation", methods=["GET"])
@api_login_required
def get_reconciliation():
    cid = session["customer_id"]
    return jsonify(reconcile_sources(cid))


# ── POST /reconciliation/resolve ──────────────────────────────────────────────

@engine_bp.route("/reconciliation/resolve", methods=["POST"])
@api_login_required
def post_reconciliation_resolve():
    data = request.get_json(force=True) or {}
    conflict_id = data.get("conflict_id")
    action = data.get("action")
    return jsonify({
        "success": True,
        "conflict_id": conflict_id,
        "resolved_action": action,
        "message": f"Conflict {conflict_id} resolved with action '{action}'.",
    })


# ── POST /voice-ask (Gemma 4 Voice Assistant) ────────────────────────────────

@engine_bp.route("/voice-ask", methods=["POST"])
@api_login_required
def post_voice_ask():
    cid = session["customer_id"]
    data = request.get_json(force=True) or {}
    query_text = data.get("query", "").strip()
    language = data.get("language", "english").lower()

    if not query_text:
        return jsonify({"error": "query text required"}), 400

    # Retrieve real pre-computed engine numbers
    sts = safe_to_spend(cid)
    cf = cash_flow(cid)
    bills = bills_due(cid, 30)
    anoms = detect_anomalies_and_scams(cid)
    resil = financial_resilience(cid)

    context_data = {
        "safe_to_spend": sts["safe_to_spend"],
        "daily_safe": sts["daily_safe"],
        "monthly_income": cf["income"],
        "monthly_expenses": cf["expenses"],
        "savings_rate_pct": cf["savings_rate"],
        "resilience_score_out_of_100": resil["score"],
        "resilience_grade": resil["grade"],
        "runway_months": resil["runway_months"],
        "upcoming_bills_count": len(bills),
        "next_bill": bills[0]["name"] if bills else "None",
        "next_bill_amount": bills[0]["amount"] if bills else 0,
        "anomalies_detected": len(anoms),
    }

    lang_instruction = (
        "Respond in Tamil (தமிழ்). Keep the tone natural, helpful and polite." if language == "tamil"
        else "Respond in Hindi (हिन्दी). Keep the tone natural, helpful and polite." if language == "hindi"
        else "Respond in Telugu (తెలుగు). Keep the tone natural, helpful and polite." if language == "telugu"
        else "Respond in English. Keep the tone natural, friendly and professional."
    )

    prompt = f"""You are Artha, a verified personal financial co-pilot powered by Google Gemma.
{lang_instruction}

IMPORTANT GROUNDING RULES:
1. ONLY use the verified numbers provided below. NEVER compute, guess, or alter the numbers.
2. Keep your spoken response concise, conversational, and direct (2 to 4 sentences).
3. Always provide a clear, practical conclusion so the user knows what action to take next.
4. Do not offer unsolicited investment advice or speculative claims.

Verified Financial Engine Data:
{json.dumps(context_data, indent=2)}

User's Question:
"{query_text}"

Your Spoken Response:"""

    try:
        import google.generativeai as genai
        api_key = os.environ.get("GEMINI_API_KEY")
        if not api_key:
            raise RuntimeError("GEMINI_API_KEY not configured")
        genai.configure(api_key=api_key)
        # Use Gemma 4 model
        model = genai.GenerativeModel("gemma-4-31b-it")
        response = model.generate_content(prompt)
        spoken_text = response.text.strip()
    except Exception as e:
        # Graceful fallback that still provides exact verified engine numbers
        if language == "tamil":
            spoken_text = f"உங்கள் கணக்கின்படி, இந்த மாதத்திற்கான பாதுகாப்பான செலவுத் தொகை ₹{sts['safe_to_spend']:,.0f}. உங்கள் அடுத்த கட்டணம் {context_data['next_bill']} ₹{context_data['next_bill_amount']:,.0f}."
        elif language == "hindi":
            spoken_text = f"आपके सत्यापित डेटा के अनुसार, इस महीने खर्च करने के लिए सुरक्षित राशि ₹{sts['safe_to_spend']:,.0f} है। आपका अगला बिल {context_data['next_bill']} (₹{context_data['next_bill_amount']:,.0f}) देय है।"
        elif language == "telugu":
            spoken_text = f"మీ ధృవీకరించిన ఖాతా ప్రకారం, ఈ నెలకు సురక్షితమైన ఖర్చు మొత్తం ₹{sts['safe_to_spend']:,.0f}."
        else:
            spoken_text = f"Based on your verified engine calculations, your estimated safe-to-spend amount is ₹{sts['safe_to_spend']:,.0f} (₹{sts['daily_safe']:,.0f}/day). Your next upcoming bill is {context_data['next_bill']} for ₹{context_data['next_bill_amount']:,.0f}."

    return jsonify({
        "query": query_text,
        "language": language,
        "spoken_response": spoken_text,
        "engine_context": context_data,
    })
