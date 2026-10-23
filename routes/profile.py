"""
GET  /api/profile — fetch profile
POST /api/profile — update profile
"""

from flask import Blueprint, request, session, jsonify
from auth_utils import api_login_required
from db import query

profile_bp = Blueprint("profile", __name__)


@profile_bp.route("/profile", methods=["GET"])
@api_login_required
def get_profile():
    row = query(
        "SELECT customer_id, full_name, email, phone, address FROM customers WHERE customer_id = %s",
        (session["customer_id"],), fetch="one",
    )
    return jsonify(row or {})


@profile_bp.route("/profile", methods=["POST"])
@api_login_required
def update_profile():
    data = request.get_json(force=True) or {}
    allowed = {"full_name", "phone", "address"}
    updates = {k: v for k, v in data.items() if k in allowed}
    if not updates:
        return jsonify({"error": "Nothing to update"}), 400

    set_clause = ", ".join(f"{k} = %s" for k in updates)
    values = list(updates.values()) + [session["customer_id"]]
    query(
        f"UPDATE customers SET {set_clause} WHERE customer_id = %s",
        values, fetch="none",
    )
    return jsonify({"message": "Profile updated"})
