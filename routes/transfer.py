"""
POST /api/transfer — move money between SecureBank accounts.
"""

from flask import Blueprint, request, session, jsonify
from auth_utils import api_login_required
from db import query, get_connection

transfer_bp = Blueprint("transfer", __name__)


@transfer_bp.route("/transfer", methods=["POST"])
@api_login_required
def transfer():
    data = request.get_json(force=True) or {}
    from_acc = data.get("from_account")
    to_acc = data.get("to_account")
    try:
        amount = float(data.get("amount", 0))
    except (TypeError, ValueError):
        return jsonify({"error": "Invalid amount"}), 400

    if not from_acc or not to_acc or amount <= 0:
        return jsonify({"error": "from_account, to_account and positive amount required"}), 400

    conn = get_connection()
    try:
        with conn.cursor() as cur:
            # Verify ownership and sufficient funds
            cur.execute(
                "SELECT balance FROM accounts WHERE account_number = %s AND customer_id = %s FOR UPDATE",
                (from_acc, session["customer_id"]),
            )
            row = cur.fetchone()
            if not row:
                return jsonify({"error": "Source account not found"}), 404
            if float(row[0]) < amount:
                return jsonify({"error": "Insufficient funds"}), 400

            # Debit source
            cur.execute(
                "UPDATE accounts SET balance = balance - %s WHERE account_number = %s",
                (amount, from_acc),
            )
            # Credit destination
            cur.execute(
                "UPDATE accounts SET balance = balance + %s WHERE account_number = %s",
                (amount, to_acc),
            )
            # Record transaction
            cur.execute(
                """INSERT INTO transaction_history
                   (from_account, to_account, amount, transaction_type, description)
                   VALUES (%s, %s, %s, 'transfer', 'SecureBank transfer')""",
                (from_acc, to_acc, amount),
            )
        conn.commit()
        return jsonify({"message": "Transfer successful"})
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()
