"""
Artha ingest routes (all under /api/artha)
POST /upload   — read a file/image/text with Gemma 4 / Vision OCR; return proposed rows (nothing saved)
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
from ingest.gemma_reader import extract_from_text, extract_from_image, generate_bounding_boxes
from ingest.checks import run_checks

ingest_bp = Blueprint("ingest", __name__)

# ── Allowed MIME types ────────────────────────────────────────────────────────
IMAGE_MIMES = {"image/jpeg", "image/png", "image/webp", "image/gif", "image/bmp"}
PDF_MIME    = "application/pdf"


def _cache_lookup(file_hash: str):
    try:
        row = query(
            "SELECT response_json FROM extraction_cache WHERE file_hash = %s",
            (file_hash,), fetch="one",
        )
        return json.loads(row["response_json"]) if row and row.get("response_json") else None
    except Exception as e:
        print(f"[_cache_lookup] Cache read error (continuing): {e}")
        return None


def _cache_store(file_hash: str, payload: dict):
    try:
        query(
            """INSERT INTO extraction_cache (file_hash, response_json)
               VALUES (%s, %s)
               ON CONFLICT (file_hash) DO UPDATE SET response_json = excluded.response_json""",
            (file_hash, json.dumps(payload)), fetch="none",
        )
    except Exception as e:
        print(f"[_cache_store] Cache write error (continuing): {e}")


# ── POST /upload ──────────────────────────────────────────────────────────────

@ingest_bp.route("/upload", methods=["POST"])
@api_login_required
def upload():
    """
    Accept a file (multipart) or pasted text (JSON body).
    Returns proposed rows + confidence flags + deterministic checks + visual bounding boxes.
    NOTHING is saved to the database here.
    """
    custom_key = request.headers.get("X-Gemini-Key") or request.form.get("gemini_key")
    provider = "Gemma 4 Multimodal Vision (gemma-4-26b-a4b-it)"
    rows = []
    boxes = []
    doc_type = "unknown"

    # ── Case 1: pasted text (JSON body) ──────────────────────────────────────
    if request.is_json:
        data = request.get_json(force=True) or {}
        text = data.get("text", "")
        doc_type = data.get("doc_type", "sms_text")
        file_hash = hashlib.sha256(text.encode("utf-8")).hexdigest()

        cached = _cache_lookup(file_hash)
        if cached:
            if isinstance(cached, dict):
                rows = cached.get("rows", [])
                boxes = cached.get("boundingBoxes", [])
            else:
                rows = cached
                boxes = generate_bounding_boxes(rows, doc_type)
        else:
            rows = extract_from_text(text, db_query=query, custom_key=custom_key)
            boxes = generate_bounding_boxes(rows, doc_type)
            _cache_store(file_hash, {"rows": rows, "boundingBoxes": boxes})

    # ── Case 2: file upload (multipart/form-data) ─────────────────────────────
    elif "file" in request.files:
        f = request.files["file"]
        file_bytes = f.read()
        if not file_bytes:
            return jsonify({"error": "Empty file uploaded"}), 400

        file_hash = hashlib.sha256(file_bytes).hexdigest()
        mime = (f.content_type or "").lower()
        filename = (f.filename or "").lower()
        doc_type = request.form.get("doc_type", "receipt")

        cached = _cache_lookup(file_hash)
        if cached:
            if isinstance(cached, dict):
                rows = cached.get("rows", [])
                boxes = cached.get("boundingBoxes", [])
            else:
                rows = cached
                boxes = generate_bounding_boxes(rows, filename)
        elif mime in IMAGE_MIMES or any(filename.endswith(ext) for ext in [".jpg", ".jpeg", ".png", ".webp", ".gif", ".bmp"]):
            doc_type = doc_type or "receipt_photo"
            extraction = extract_from_image(
                file_bytes,
                mime_type=mime,
                filename_hint=f.filename or "",
                db_query=query,
                custom_key=custom_key,
            )
            if isinstance(extraction, dict):
                rows = extraction.get("rows", [])
                boxes = extraction.get("boundingBoxes", [])
            else:
                rows = extraction
                boxes = generate_bounding_boxes(rows, filename)
            _cache_store(file_hash, {"rows": rows, "boundingBoxes": boxes})

        elif mime == PDF_MIME or filename.endswith(".pdf"):
            doc_type = doc_type or "bank_pdf"
            extracted_text = ""
            try:
                with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
                    extracted_text = "\n".join(
                        page.extract_text() or "" for page in pdf.pages
                    )
            except Exception as e:
                print(f"[upload] pdfplumber error: {e}")

            if extracted_text.strip():
                rows = extract_from_text(extracted_text, db_query=query, custom_key=custom_key)
                boxes = generate_bounding_boxes(rows, filename)
            else:
                # Scanned PDF — render first page as image and run multimodal vision
                try:
                    import pypdfium2 as pdfium
                    doc = pdfium.PdfDocument(file_bytes)
                    page = doc[0]
                    bmp = page.render(scale=2)
                    img_bytes = io.BytesIO()
                    bmp.to_pil().save(img_bytes, format="PNG")
                    extraction = extract_from_image(
                        img_bytes.getvalue(),
                        mime_type="image/png",
                        filename_hint=filename,
                        db_query=query,
                        custom_key=custom_key,
                    )
                    if isinstance(extraction, dict):
                        rows = extraction.get("rows", [])
                        boxes = extraction.get("boundingBoxes", [])
                    else:
                        rows = extraction
                        boxes = generate_bounding_boxes(rows, filename)
                except Exception as e:
                    print(f"[upload] Scanned PDF render failed: {e}")
                    rows = extract_from_text(f"PDF Document: {filename}", db_query=query, custom_key=custom_key)
                    boxes = generate_bounding_boxes(rows, filename)

            _cache_store(file_hash, {"rows": rows, "boundingBoxes": boxes})
        else:
            # Fallback for other file types
            rows = extract_from_text(f"Document: {filename}", db_query=query, custom_key=custom_key)
            boxes = generate_bounding_boxes(rows, filename)
            _cache_store(file_hash, {"rows": rows, "boundingBoxes": boxes})

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

    return jsonify({
        "doc_type": doc_type,
        "provider": provider,
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
    provider = data.get("provider", "Gemma 4 Multimodal Vision (gemma-4-26b-a4b-it)")

    if not rows:
        return jsonify({"error": "No rows to confirm"}), 400

    cid = session.get("customer_id")
    if not cid:
        # Fallback to demo persona Priya
        priya = query("SELECT customer_id FROM customers WHERE email = 'priya@demo.artha'", fetch="one")
        cid = priya["customer_id"] if priya else 1

    # 1. Insert document record
    doc_id = 1
    try:
        doc = query(
            """INSERT INTO documents (customer_id, doc_type, provider, status)
               VALUES (%s, %s, %s, 'processed')
               RETURNING doc_id""",
            (cid, doc_type, provider), fetch="one",
        )
        if doc and "doc_id" in doc:
            doc_id = doc["doc_id"]
    except Exception as e:
        print(f"[confirm] Document insert note: {e}")

    # 2. Insert confirmed ledger rows
    saved = 0
    for row in rows:
        if not row.get("date") or float(row.get("amount", 0)) <= 0:
            continue
        try:
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
                    float(row.get("confidence", 0.95)),
                    row.get("source_ref") or row.get("gst") or row.get("utr"),
                ),
                fetch="none",
            )
            saved += 1
        except Exception as e:
            print(f"[confirm] Row insert error: {e}")

    # 3. Write provenance to AuditLog
    try:
        query(
            """INSERT INTO audit_log (customer_id, action_type, details)
               VALUES (%s, 'ARTHA_CONFIRM', %s)""",
            (cid, json.dumps({"doc_id": doc_id, "row_count": saved, "provider": provider})),
            fetch="none",
        )
    except Exception as e:
        print(f"[confirm] Audit log error: {e}")

    return jsonify({
        "message": "Confirmed and saved",
        "doc_id": doc_id,
        "rows_saved": saved,
    })

