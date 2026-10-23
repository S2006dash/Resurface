"""
SecureBank auth routes.
POST /api/login
POST /api/logout
GET  /api/me
"""

import bcrypt
from flask import Blueprint, request, session, jsonify
from db import query

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json(force=True) or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    if not email or not password:
        return jsonify({"error": "Email and password required"}), 400

    row = query(
        "SELECT customer_id, password_hash, full_name FROM customers WHERE email = %s",
        (email,), fetch="one",
    )
    if not row:
        return jsonify({"error": "Invalid credentials"}), 401

    if not bcrypt.checkpw(password.encode(), row["password_hash"].encode()):
        return jsonify({"error": "Invalid credentials"}), 401

    session["customer_id"] = row["customer_id"]
    session["email"] = email
    return jsonify({"message": "Login successful", "name": row["full_name"]})


@auth_bp.route("/logout", methods=["POST"])
def logout():
    session.clear()
    return jsonify({"message": "Logged out"})


@auth_bp.route("/me", methods=["GET"])
def me():
    if "customer_id" not in session:
        return jsonify({"error": "Not authenticated"}), 401
    row = query(
        "SELECT customer_id, full_name, email FROM customers WHERE customer_id = %s",
        (session["customer_id"],), fetch="one",
    )
    return jsonify(row or {})
