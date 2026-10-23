"""
GET /api/dashboard — SecureBank account balances.
"""

from flask import Blueprint, session, jsonify
from auth_utils import api_login_required
from db import query

dashboard_bp = Blueprint("dashboard", __name__)


@dashboard_bp.route("/dashboard", methods=["GET"])
@api_login_required
def dashboard():
    accounts = query(
        """SELECT account_number, account_type, balance
           FROM accounts WHERE customer_id = %s ORDER BY account_type""",
        (session["customer_id"],),
    )
    total = sum(float(a["balance"]) for a in accounts)
    return jsonify({"accounts": accounts, "total_balance": round(total, 2)})
