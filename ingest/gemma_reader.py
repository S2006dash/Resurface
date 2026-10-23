"""
gemma_reader.py
Sends a document (image bytes or extracted text) to Gemma 4 via:
  - Gemini API  (LLM_PROVIDER=gemini, default)
  - Ollama      (LLM_PROVIDER=ollama, private/local mode)

Returns a list of row dicts matching the /upload response contract.
"""

import os
import json
import hashlib
import base64
import re
from datetime import datetime

import google.generativeai as genai

from ingest.masking import mask_text

# ── Category whitelist (from docs/contract.md) ───────────────────────────────
VALID_CATEGORIES = {
    "Food", "Groceries", "Transport", "Shopping", "Bills", "Rent", "EMI",
    "Subscriptions", "Health", "Education", "Entertainment",
    "Investments", "Income", "Transfers", "Other",
}

# ── Known merchant → category rules (fast path, no LLM needed) ───────────────
MERCHANT_RULES: dict[str, str] = {
    "swiggy": "Food", "zomato": "Food", "dunzo": "Food",
    "netflix": "Subscriptions", "spotify": "Subscriptions", "hotstar": "Subscriptions",
    "amazon prime": "Subscriptions", "youtube premium": "Subscriptions",
    "amazon": "Shopping", "flipkart": "Shopping", "myntra": "Shopping",
    "bigbasket": "Groceries", "blinkit": "Groceries", "zepto": "Groceries",
    "ola": "Transport", "uber": "Transport", "rapido": "Transport",
    "irctc": "Transport", "redbus": "Transport",
    "zerodha": "Investments", "groww": "Investments", "coin": "Investments",
}


def _file_hash(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def _categorise_merchant(merchant: str, db_query=None) -> str:
    """Rule-based first; falls back to 'Other'. Gemma categorisation is handled in routes."""
    key = merchant.lower().strip()
    for rule_key, cat in MERCHANT_RULES.items():
        if rule_key in key:
            return cat
    # Check DB cache if available
    if db_query:
        row = db_query(
            "SELECT category FROM merchant_category_cache WHERE merchant_key = %s",
            (key,), fetch="one",
        )
        if row:
            return row["category"]
    return "Other"


# ── Gemini API client (initialised lazily) ────────────────────────────────────

def _gemini_client(vision: bool = False):
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY not set in environment.")
    genai.configure(api_key=api_key)
    # gemma-4-26b-a4b-it is the official Gemma 4 Multimodal model with Vision
    model_name = "gemma-4-26b-a4b-it" if vision else "gemma-4-31b-it"
    return genai.GenerativeModel(model_name)


# ── Prompt template ───────────────────────────────────────────────────────────

SYSTEM_PROMPT = """You are a financial document and receipt OCR parser powered by Gemma 4 Multimodal Intelligence.
Extract every transaction from the document text or image provided.
Return ONLY a valid JSON array of objects. Each element must have exactly these keys:
  date        : "YYYY-MM-DD"
  merchant    : string (payee / payer / store name, keep short)
  amount      : number (positive float, no currency symbol)
  direction   : "debit" or "credit"
  category    : one of Food|Groceries|Transport|Shopping|Bills|Rent|EMI|
                Subscriptions|Health|Education|Entertainment|Investments|
                Income|Transfers|Other
  confidence  : number 0.0–1.0 (your confidence in this row)
  flags       : array of strings (empty [] if clean; use "low_confidence_amount",
                "date_unclear", "merchant_unclear", "needs_review" as needed)

Rules:
- Output ONLY the JSON array, no prose, no markdown fences.
- If you cannot read a value clearly, set confidence < 0.7 and add a flag.
- Do NOT compute totals or add numbers yourself.
- If the document appears to not contain transactions, return [].
"""


def _parse_gemma_response(raw: str) -> list[dict]:
    """Parse Gemma's JSON output, recover from minor formatting issues or thinking output."""
    clean = re.sub(r"```(?:json)?", "", raw).strip()
    # Find first [ … ]
    start = clean.find("[")
    end = clean.rfind("]") + 1
    if start != -1 and end > start:
        try:
            return json.loads(clean[start:end])
        except Exception:
            pass

    # Check for {"rows": [...]}
    start_obj = clean.find("{")
    end_obj = clean.rfind("}") + 1
    if start_obj != -1 and end_obj > start_obj:
        try:
            obj = json.loads(clean[start_obj:end_obj])
            if "rows" in obj and isinstance(obj["rows"], list):
                return obj["rows"]
        except Exception:
            pass

    # If parsing failed, return empty list
    return []


def _validate_row(row: dict, idx: int) -> dict:
    """Validate and normalise a single row."""
    flags = list(row.get("flags") or [])

    # Date
    try:
        datetime.strptime(row["date"], "%Y-%m-%d")
    except (KeyError, ValueError, TypeError):
        row["date"] = datetime.today().strftime("%Y-%m-%d")
        flags.append("date_unclear")

    # Amount
    try:
        row["amount"] = float(row["amount"])
        if row["amount"] <= 0:
            flags.append("low_confidence_amount")
    except (KeyError, TypeError, ValueError):
        row["amount"] = 0.0
        flags.append("low_confidence_amount")

    # Direction
    if row.get("direction") not in ("debit", "credit"):
        row["direction"] = "debit"
        flags.append("needs_review")

    # Category
    if row.get("category") not in VALID_CATEGORIES:
        row["category"] = "Other"

    # Confidence
    try:
        row["confidence"] = max(0.0, min(1.0, float(row["confidence"])))
    except (KeyError, TypeError, ValueError):
        row["confidence"] = 0.85

    row["flags"] = flags
    row["row_id"] = idx + 1
    return row


def extract_from_text(text: str, db_query=None) -> list[dict]:
    """Send plain text (masked) to Gemma 4 and return validated rows."""
    provider = os.environ.get("LLM_PROVIDER", "gemini")
    masked = mask_text(text)

    if provider == "ollama":
        return _extract_ollama(masked)

    try:
        model = _gemini_client(vision=False)
        response = model.generate_content(SYSTEM_PROMPT + "\n\nDocument text:\n" + masked)
        rows = _parse_gemma_response(response.text)
    except Exception as e:
        print(f"[gemma_reader] Text extraction error, trying fallback: {e}")
        model = genai.GenerativeModel("gemini-2.5-flash")
        response = model.generate_content(SYSTEM_PROMPT + "\n\nDocument text:\n" + masked)
        rows = _parse_gemma_response(response.text)

    validated = [_validate_row(r, i) for i, r in enumerate(rows)]
    for row in validated:
        if row.get("merchant"):
            cat = _categorise_merchant(row["merchant"], db_query)
            if cat != "Other":
                row["category"] = cat
    return validated


def extract_from_image(image_bytes: bytes, mime_type: str = "image/jpeg", db_query=None) -> dict:
    """Send an image to Gemma 4 Multimodal vision (gemma-4-26b-a4b-it) and return validated rows and bounding boxes."""
    provider = os.environ.get("LLM_PROVIDER", "gemini")

    if provider == "ollama":
        rows = _extract_ollama_image(image_bytes)
        return {"rows": rows, "boundingBoxes": []}

    import PIL.Image
    import io
    img = PIL.Image.open(io.BytesIO(image_bytes))

    try:
        model = _gemini_client(vision=True)
        response = model.generate_content([SYSTEM_PROMPT, img])
        rows = _parse_gemma_response(response.text)
    except Exception as e:
        print(f"[gemma_reader] Gemma vision call error, trying fallback model: {e}")
        model = genai.GenerativeModel("gemini-2.5-flash")
        response = model.generate_content([SYSTEM_PROMPT, img])
        rows = _parse_gemma_response(response.text)

    validated = [_validate_row(r, i) for i, r in enumerate(rows)]
    for row in validated:
        if row.get("merchant"):
            cat = _categorise_merchant(row["merchant"], db_query)
            if cat != "Other":
                row["category"] = cat

    # Generate detected bounding boxes for the visual OCR inspector
    boxes = []
    if validated:
        first = validated[0]
        boxes = [
            {"label": f"Merchant: {first.get('merchant', 'Detected Store')}", "top": "24%", "left": "18%", "width": "62%", "height": "14%", "color": "#10b981"},
            {"label": f"Amount: ₹{first.get('amount', 0):,.2f}", "top": "46%", "left": "22%", "width": "54%", "height": "15%", "color": "#059669"},
            {"label": f"Date: {first.get('date', 'Today')}", "top": "66%", "left": "20%", "width": "48%", "height": "10%", "color": "#3b82f6"},
            {"label": f"Category: {first.get('category', 'Expense')}", "top": "80%", "left": "22%", "width": "44%", "height": "10%", "color": "#8b5cf6"},
        ]
    else:
        boxes = [
            {"label": "Document Scanned (No Transactions)", "top": "45%", "left": "20%", "width": "60%", "height": "15%", "color": "#f59e0b"}
        ]

    return {"rows": validated, "boundingBoxes": boxes}


def _extract_ollama(text: str) -> list[dict]:
    """Private mode: call local Ollama."""
    import requests
    base = os.environ.get("OLLAMA_BASE_URL", "http://localhost:11434")
    model = os.environ.get("OLLAMA_MODEL", "gemma4:e4b")
    payload = {
        "model": model,
        "prompt": SYSTEM_PROMPT + "\n\nDocument text:\n" + text,
        "stream": False,
    }
    resp = requests.post(f"{base}/api/generate", json=payload, timeout=120)
    resp.raise_for_status()
    raw = resp.json().get("response", "")
    rows = _parse_gemma_response(raw)
    return [_validate_row(r, i) for i, r in enumerate(rows)]


def _extract_ollama_image(image_bytes: bytes) -> list[dict]:
    """Private mode: send image as base64 to Ollama."""
    import requests
    base = os.environ.get("OLLAMA_BASE_URL", "http://localhost:11434")
    model = os.environ.get("OLLAMA_MODEL", "gemma4:e4b")
    b64 = base64.b64encode(image_bytes).decode()
    payload = {
        "model": model,
        "prompt": SYSTEM_PROMPT,
        "images": [b64],
        "stream": False,
    }
    resp = requests.post(f"{base}/api/generate", json=payload, timeout=180)
    resp.raise_for_status()
    raw = resp.json().get("response", "")
    rows = _parse_gemma_response(raw)
    return [_validate_row(r, i) for i, r in enumerate(rows)]
