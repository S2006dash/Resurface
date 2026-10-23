"""
Artha ingest routes  (all under /api/artha)
POST /upload   — read a file/image/text with Gemma 4; return proposed rows (nothing saved)
POST /confirm  — save confirmed rows to ledger_entries + write AuditLog
"""

import io
import os
import hashlib
import json

import pdfplumber

from flask import Blueprint, request, session, jsonify
from auth_utils import api_login_required
from db import query
from ingest.gemma_reader import extract_from_text, extract_from_image
from ingest.checks import run_checks

ingest_bp = Blueprint("ingest", __name__)

# ── Allowed MIME types ────────────────────────────────────────────────────────
IMAGE_MIMES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
PDF_MIME    = "application/pdf"


def _cache_lookup(file_hash: str):
    row = query(
        "SELECT response_json FROM extraction_cache WHERE file_hash = %s",
        (file_hash,), fetch="one",
    )
    return json.loads(row["response_json"]) if row else None


def _cache_store(file_hash: str, rows: list):
    query(
        """INSERT INTO extraction_cache (file_hash, response_json)
           VALUES (%s, %s)
           ON CONFLICT (file_hash) DO UPDATE SET response_json = EXCLUDED.response_json""",
        (file_hash, json.dumps(rows)), fetch="none",
    )


# ── POST /upload ──────────────────────────────────────────────────────────────

@ingest_bp.route("/upload", methods=["POST"])
@api_login_required
def upload():
    """
    Accept a file (multipart) or pasted text (JSON body).
    Returns proposed rows + confidence flags + checks.
    NOTHING is saved to the database here.
    """
    provider = os.environ.get("LLM_PROVIDER", "gemini")
    rows = []
    doc_type = "unknown"

    # ── Case 1: pasted text (JSON body) ──────────────────────────────────────
    if request.is_json:
        data = request.get_json(force=True) or {}
        text = data.get("text", "")
        doc_type = data.get("doc_type", "sms_text")
        file_hash = hashlib.sha256(text.encode()).hexdigest()

        cached = _cache_lookup(file_hash)
        if cached:
            rows = cached
        else:
            rows = extract_from_text(text, db_query=query)
            _cache_store(file_hash, rows)

    # ── Case 2: file upload (multipart/form-data) ─────────────────────────────
    elif "file" in request.files:
        f = request.files["file"]
        file_bytes = f.read()
        file_hash = hashlib.sha256(file_bytes).hexdigest()
        mime = f.content_type or ""
        doc_type = request.form.get("doc_type", "unknown")

        cached = _cache_lookup(file_hash)
        boxes = []
        if cached:
            if isinstance(cached, dict):
                rows = cached.get("rows", [])
                boxes = cached.get("boundingBoxes", [])
            else:
                rows = cached
        elif mime in IMAGE_MIMES:
            extraction = extract_from_image(file_bytes, mime_type=mime, db_query=query)
            if isinstance(extraction, dict):
                rows = extraction.get("rows", [])
                boxes = extraction.get("boundingBoxes", [])
            else:
                rows = extraction
            _cache_store(file_hash, {"rows": rows, "boundingBoxes": boxes})
        elif mime == PDF_MIME or f.filename.lower().endswith(".pdf"):
            doc_type = doc_type or "bank_pdf"
            # Try text extraction first; fall back to image render per page
            with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
                text = "\n".join(
                    page.extract_text() or "" for page in pdf.pages
                )
            if text.strip():
                rows = extract_from_text(text, db_query=query)
            else:
                # Scanned PDF — render first page as image
                try:
                    import pypdfium2 as pdfium
                    doc = pdfium.PdfDocument(file_bytes)
                    page = doc[0]
                    bmp = page.render(scale=2)
                    img_bytes = io.BytesIO()
                    bmp.to_pil().save(img_bytes, format="PNG")
                    extraction = extract_from_image(img_bytes.getvalue(), "image/png", db_query=query)
                    if isinstance(extraction, dict):
                        rows = extraction.get("rows", [])
                        boxes = extraction.get("boundingBoxes", [])
                    else:
                        rows = extraction
                except Exception as e:
                    return jsonify({"error": f"Could not render scanned PDF: {e}"}), 422
            _cache_store(file_hash, {"rows": rows, "boundingBoxes": boxes})
        else:
            return jsonify({"error": "Unsupported file type. Send an image, PDF, or paste text."}), 415

    else:
        return jsonify({"error": "No file or text provided"}), 400

    # ── Run checks on the proposed rows ──────────────────────────────────────
    opening = request.form.get("opening_balance")
    closing = request.form.get("closing_balance")
    checks = run_checks(
        rows,
        opening_balance=float(opening) if opening else None,
        closing_balance=float(closing) if closing else None,
    )

    # Generate a temporary doc_id placeholder (not saved yet)
    return jsonify({
        "doc_type": doc_type,
        "provider": "Gemma 4 Multimodal Vision (gemma-4-26b-a4b-it)",
        "rows": rows,
        "checks": checks,
        "boundingBoxes": boxes,
    })


# ── POST /confirm ─────────────────────────────────────────────────────────────

@ingest_bp.route("/confirm", methods=["POST"])
@api_login_required
def confirm():
    """
    Save reviewed rows to ledger_entries.
    Writes an AuditLog entry for provenance.
    Body: { doc_type, provider, rows: [...] }
    """
    data = request.get_json(force=True) or {}
    rows = data.get("rows", [])
    doc_type = data.get("doc_type", "unknown")
    provider = data.get("provider", os.environ.get("LLM_PROVIDER", "gemini"))

    if not rows:
        return jsonify({"error": "No rows to confirm"}), 400

    cid = session["customer_id"]

    # 1. Insert document record
    doc = query(
        """INSERT INTO documents (customer_id, doc_type, provider, status)
           VALUES (%s, %s, %s, 'processed')
           RETURNING doc_id""",
        (cid, doc_type, provider), fetch="one",
    )
    doc_id = doc["doc_id"]

    # 2. Insert confirmed ledger rows
    saved = 0
    for row in rows:
        if not row.get("date") or row.get("amount", 0) <= 0:
            continue  # skip invalid rows silently
        query(
            """INSERT INTO ledger_entries
               (customer_id, doc_id, entry_date, merchant, amount, direction,
                category, confidence, status, source_ref)
               VALUES (%s,%s,%s,%s,%s,%s,%s,%s,'confirmed',%s)""",
            (
                cid, doc_id,
                row["date"], row.get("merchant", "Unknown"),
                float(row["amount"]), row.get("direction", "debit"),
                row.get("category", "Other"),
                float(row.get("confidence", 0.5)),
                row.get("source_ref"),
            ),
            fetch="none",
        )
        saved += 1

    # 3. Write provenance to AuditLog
    query(
        """INSERT INTO audit_log (customer_id, action_type, details)
           VALUES (%s, 'ARTHA_CONFIRM', %s)""",
        (cid, json.dumps({"doc_id": doc_id, "row_count": saved, "provider": provider})),
        fetch="none",
    )

    return jsonify({
        "message": "Confirmed and saved",
        "doc_id": doc_id,
        "rows_saved": saved,
    })
