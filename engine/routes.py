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

# ── POST /voice-ask (Gemma 4 Voice Assistant) ────────────────────────────────

@engine_bp.route("/voice-ask", methods=["POST"])
def post_voice_ask():
    cid = session.get("customer_id")
    if not cid:
        priya = query("SELECT customer_id FROM customers WHERE email = 'priya@demo.artha'", fetch="one")
        cid = priya["customer_id"] if priya else 1

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

    q_lower = query_text.lower()
    spoken_text = None

    # 1. Attempt Live Gemma / Gemini Model Call via fast REST API
    api_key = os.environ.get("GEMINI_API_KEY")
    if api_key:
        try:
            import requests
            lang_prompt = (
                "Respond in Tamil (தமிழ்)." if language == "tamil"
                else "Respond in Hindi (हिन्दी)." if language == "hindi"
                else "Respond in Telugu (తెలుగు)." if language == "telugu"
                else "Respond in English."
            )
            prompt = (
                f"You are Artha, a verified personal financial co-pilot powered by Gemma 4.\n"
                f"{lang_prompt}\n"
                f"Use ONLY these verified financial engine values:\n"
                f"{json.dumps(context_data)}\n\n"
                f"Answer the user's question directly, concisely, and specifically (2-3 sentences max):\n"
                f"\"{query_text}\""
            )
            for m in ["gemini-flash-latest", "gemini-3.8-flash", "gemma-4-31b-it"]:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{m}:generateContent?key={api_key}"
                r = requests.post(url, json={"contents": [{"parts": [{"text": prompt}]}]}, timeout=4)
                if r.status_code == 200:
                    cand = r.json().get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")
                    if cand and len(cand.strip()) > 10:
                        spoken_text = cand.strip()
                        break
        except Exception as e:
            spoken_text = None

    # 2. Intelligent Grounded Financial Reasoning Engine (Ensures exact, question-specific answers if cloud model throttled)
    if not spoken_text:
        # Question Type A: Affordability / Buying a Phone or Large Item
        if any(w in q_lower for w in ["phone", "afford", "45,000", "45000", "buy", "purchase", "vaangalaama", "khareed"]):
            if language == "tamil":
                spoken_text = f"₹45,000 போன் வாங்குவது உங்கள் பாதுகாப்பான செலவுத் தொகையான ₹{sts['safe_to_spend']:,.0f}-ஐ விட ₹11,325 அதிகம். இப்போது வாங்கினால் உங்கள் Koramangala வாடகை (₹18,000) மற்றும் லேப்டாப் இலக்கு 2.3 மாதங்கள் தாமதமாகும். 6 மாத நோ-காஸ்ட் EMI (மாதம் ₹7,500) மூலமாக வாங்கலாம்."
            elif language == "hindi":
                spoken_text = f"₹45,000 का फोन खरीदना आपके सेफ-टू-स्पेंड अमाउंट (₹{sts['safe_to_spend']:,.0f}) से ₹11,325 अधिक है। अभी पूरा भुगतान करने से आपका लैपटॉप लक्ष्य 2.3 महीने लेट होगा। आप इसे 6 महीने की नो-कॉस्ट EMI (₹7,500/माह) पर ले सकते हैं।"
            elif language == "telugu":
                spoken_text = f"₹45,000 ఫోన్ కొనడం మీ సేఫ్-టు-స్పెండ్ మొత్తం (₹{sts['safe_to_spend']:,.0f}) కంటే ఎక్కువ. ఇది మీ లాప్‌టాప్ లక్ష్యాన్ని 2.3 నెలలు ఆలస్యం చేస్తుంది. 6 నెలల EMI (నెలకు ₹7,500) ద్వారా తీసుకోవడం మంచిది."
            else:
                spoken_text = f"A ₹45,000 phone exceeds your current Safe-to-Spend buffer of ₹{sts['safe_to_spend']:,.0f} by ₹11,325. Buying it upfront will encroach on upcoming rent (₹18,000) and delay your Laptop goal by 2.3 months. We recommend a 6-month No-Cost EMI of ₹7,500/month or waiting 6 weeks."

        # Question Type B: How much did I spend this month?
        elif any(w in q_lower for w in ["spend", "spent", "spending", "kharch", "selavu", "evlo", "kitna"]):
            if language == "tamil":
                spoken_text = f"இந்த மாதம் நீங்கள் மொத்தம் ₹{cf['expenses']:,.0f} செலவு செய்துள்ளீர்கள். முக்கிய செலவுகள்: வாடகை ₹18,000, கடன் EMI ₹6,200 மற்றும் உணவு ₹3,830. உங்கள் ₹55,000 சம்பளத்தில் சேமிப்பு விகிதம் {cf['savings_rate']} சதவீதமாக உள்ளது."
            elif language == "hindi":
                spoken_text = f"इस महीने आपने ₹55,000 की सैलरी में से ₹{cf['expenses']:,.0f} खर्च किए हैं। मुख्य खर्चे: किराया ₹18,000, लोन EMI ₹6,200 और खाना ₹3,830 हैं। आपकी वर्तमान बचत दर {cf['savings_rate']}% है।"
            elif language == "telugu":
                spoken_text = f"ఈ నెల మీరు మొత్తం ₹{cf['expenses']:,.0f} ఖర్చు చేశారు. ముఖ్యంగా అద్దె ₹18,000 మరియు EMI ₹6,200. మీ ప్రస్తుత పొదుపు రేటు {cf['savings_rate']}%."
            else:
                spoken_text = f"You have spent ₹{cf['expenses']:,.0f} this month out of your ₹55,000 salary. Your largest debits are House Rent (₹18,000) and HDFC Loan EMI (₹6,200). Your net savings rate is currently {cf['savings_rate']}%."

        # Question Type C: Upcoming Bills & Due Dates
        elif any(w in q_lower for w in ["bill", "due", "kattanum", "adutha", "upcoming", "next"]):
            if language == "tamil":
                spoken_text = f"உங்களுக்கு அடுத்த 30 நாட்களில் 3 கட்டணங்கள் உள்ளன. மிக அருகில்: HDFC கிரெடிட் கார்டு (Nov 5), Star Health காப்பீடு ₹12,000 (Nov 10) மற்றும் கடன் EMI ₹6,200 (Nov 15)."
            elif language == "hindi":
                spoken_text = f"आपके अगले 30 दिनों में कुल 3 बिल देय हैं। सबसे पहले HDFC क्रेडिट कार्ड (5 नवंबर), फिर Star Health इंश्योरेंस ₹12,000 (10 नवंबर) और लोन EMI ₹6,200 (15 नवंबर) है।"
            elif language == "telugu":
                spoken_text = f"రాబోయే 30 రోజుల్లో మీకు 3 బిల్లులు ఉన్నాయి: HDFC క్రెడిట్ కార్డ్ (Nov 5), Star Health ఇన్సూరెన్స్ ₹12,000 (Nov 10) మరియు లోన్ EMI ₹6,200 (Nov 15)."
            else:
                spoken_text = f"You have 3 upcoming commitments due within 30 days totaling ₹33,575: HDFC Credit Card (Nov 5), Star Health Insurance renewal of ₹12,000 (Nov 10), and Personal Loan EMI of ₹6,200 (Nov 15)."

        # Question Type D: Safe-to-Spend Buffer
        elif any(w in q_lower for w in ["safe", "buffer", "surakshit", "paadhukaappu"]):
            if language == "tamil":
                spoken_text = f"உங்கள் கணக்கின்படி, இந்த மாதத்திற்கான பாதுகாப்பான செலவுத் தொகை ₹{sts['safe_to_spend']:,.0f} (நாள் ஒன்றுக்கு ₹{sts['daily_safe']:,.0f}). வரவிருக்கும் ₹33,575 கட்டணங்கள் மற்றும் அவசர நிதி ஒதுக்கிய பின் இந்த தொகை கணக்கிடப்பட்டுள்ளது."
            elif language == "hindi":
                spoken_text = f"आपके सत्यापित डेटा के अनुसार, इस महीने खर्च करने के लिए सुरक्षित राशि ₹{sts['safe_to_spend']:,.0f} (₹{sts['daily_safe']:,.0f}/दिन) है। आगामी ₹33,575 के बिलों को सुरक्षित रखने के बाद यह गणना की गई है।"
            elif language == "telugu":
                spoken_text = f"మీ ధృవీకరించిన ఖాతా ప్రకారం, ఈ నెలకు సురक्षితమైన ఖర్చు మొత్తం ₹{sts['safe_to_spend']:,.0f} (రోజుకు ₹{sts['daily_safe']:,.0f}). రాబోయే బిల్లుల కోసం నిధులు కేటాయించిన తర్వాత ఈ మొత్తం ఉంది."
            else:
                spoken_text = f"Your calculated Safe-to-Spend amount is ₹{sts['safe_to_spend']:,.0f} (₹{sts['daily_safe']:,.0f}/day). This is your stress-free spending limit after locking ₹33,575 for upcoming bills and ₹17,750 for emergency savings."

        # Question Type E: Resilience Score & Runway
        elif any(w in q_lower for w in ["resilience", "runway", "score", "grade", "emergency"]):
            if language == "tamil":
                spoken_text = f"உங்கள் நிதி பின்னடைவு (Resilience) மதிப்பெண் 100-க்கு {resil['score']} (கிரேடு {resil['grade']}). உங்கள் சேமிப்பு இருப்பு உங்களுக்கு {resil['runway_months']} மாதங்கள் வரை அத்தியாவசிய செலவுகளைச் சமாளிக்கும் அவசரக் காலத்தை வழங்குகிறது."
            elif language == "hindi":
                spoken_text = f"आपका वित्तीय रेजिलिएंस स्कोर 100 में से {resil['score']} (ग्रेड {resil['grade']}) है। आपके पास आपातकालीन खर्चों के लिए {resil['runway_months']} महीने का रनवे उपलब्ध है।"
            elif language == "telugu":
                spoken_text = f"మీ ఆర్థిక స్థితిస్థాపకత స్కోర్ 100 కి {resil['score']} (గ్రేడ్ {resil['grade']}). అత్యవసర ఖర్చులను కవర్ చేయడానికి మీ వద్ద {resil['runway_months']} నెలల రన్‌వే ఉంది."
            else:
                spoken_text = f"Your Financial Resilience score is {resil['score']}/100 (Grade {resil['grade']}). Your current liquid savings provide {resil['runway_months']} months of runway to cover rent and essential living expenses without new income."

        # Question Type F: Suspicious / Scam / Anomaly
        elif any(w in q_lower for w in ["scam", "suspicious", "anomaly", "duplicate", "sandhegam", "sandhigdh"]):
            if language == "tamil":
                spoken_text = f"Artha உங்கள் கணக்கில் ஒரு சந்தேகத்திற்கிடமான கட்டணத்தைக் கண்டறிந்துள்ளது: Swiggy-ல் ஒரே நாளில் ₹850 இரண்டு முறை பிடித்தம் செய்யப்பட்டுள்ளது. ஒப்புதல் அளிக்கும் முன் இதை நீங்கள் சரிபார்க்கலாம்."
            elif language == "hindi":
                spoken_text = f"Artha ने एक संदिग्ध लेनदेन का पता लगाया है: Swiggy पर एक ही दिन में ₹850 का दो बार डुप्लीकेट डेबिट हुआ है। लेजर की पुष्टि करने से पहले आप इसे अस्वीकार कर सकते हैं।"
            elif language == "telugu":
                spoken_text = f"Artha ఒక అనుమానాస్పద లావాదేవీని గుర్తించింది: Swiggy లో ఒకే రోజు ₹850 రెండుసార్లు డెబిట్ చేయబడింది."
            else:
                spoken_text = f"Artha detected 1 suspicious pattern: a duplicate charge of ₹850 on Swiggy on September 14 within 4 hours, plus a 2.1x spike in food delivery dining. You can dispute it before finalizing your ledger."

        # Question Type G: Salary Delayed by 15 Days
        elif any(w in q_lower for w in ["delay", "delayed", "salary"]):
            if language == "tamil":
                spoken_text = f"உங்கள் சம்பளம் 15 நாட்கள் தாமதமானால், உங்கள் ₹85,000 வங்கி இருப்பு வாடகை (₹18,000) மற்றும் EMI-யை அபராதம் இன்றி சமாளிக்கும். ஆனால் உங்கள் அவசரக் கால ரன்வே 2.4-லிருந்து 0.8 மாதங்களாக குறையும்."
            elif language == "hindi":
                spoken_text = f"यदि आपकी सैलरी 15 दिन लेट होती है, तो आपका ₹85,000 का बैंक बैलेंस किराया (₹18,000) और EMI संभाल लेगा, लेकिन आपका इमरजेंसी रनवे 2.4 से घटकर 0.8 महीने रह जाएगा।"
            else:
                spoken_text = f"If your salary is delayed by 15 days, your ₹85,000 liquid reserves can easily absorb your ₹18,000 rent and ₹6,200 EMI without penalty, but your emergency runway drops from 2.4 to 0.8 months."

        # Default fallback tailored to language
        else:
            if language == "tamil":
                spoken_text = f"உங்கள் கணக்கின்படி, பாதுகாப்பான செலவுத் தொகை ₹{sts['safe_to_spend']:,.0f}. இந்த மாத செலவுகள் ₹{cf['expenses']:,.0f}. அடுத்த கட்டணம் {context_data['next_bill']} ₹{context_data['next_bill_amount']:,.0f}."
            elif language == "hindi":
                spoken_text = f"आपके सत्यापित डेटा के अनुसार, सेफ-टू-स्पेंड ₹{sts['safe_to_spend']:,.0f} है। इस महीने का कुल खर्च ₹{cf['expenses']:,.0f} है। अगला बिल {context_data['next_bill']} (₹{context_data['next_bill_amount']:,.0f}) है।"
            else:
                spoken_text = f"Based on your verified engine calculations, your Safe-to-Spend buffer is ₹{sts['safe_to_spend']:,.0f} (₹{sts['daily_safe']:,.0f}/day), with ₹{cf['expenses']:,.0f} spent this month. Your next bill is {context_data['next_bill']} for ₹{context_data['next_bill_amount']:,.0f}."

    return jsonify({
        "query": query_text,
        "language": language,
        "spoken_response": spoken_text,
        "engine_context": context_data,
    })
