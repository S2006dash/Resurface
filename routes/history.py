"""
GET /api/history — SecureBank transaction history.
GET /api/forecast — balance trend forecast using ai_utils.
"""

from flask import Blueprint, session, jsonify, request
from auth_utils import api_login_required
from db import query
from ai_utils import predict_balance_trend

history_bp = Blueprint("history", __name__)


@history_bp.route("/history", methods=["GET"])
@api_login_required
def history():
    limit = min(int(request.args.get("limit", 50)), 200)
    rows = query(
        """SELECT th.transaction_id, th.from_account, th.to_account,
                  th.amount, th.transaction_type, th.description,
                  th.transaction_date
           FROM transaction_history th
           JOIN accounts a ON (th.from_account = a.account_number
                                OR th.to_account = a.account_number)
           WHERE a.customer_id = %s
           ORDER BY th.transaction_date DESC
           LIMIT %s""",
        (session["customer_id"], limit),
    )
    return jsonify({"transactions": rows})


@history_bp.route("/forecast", methods=["GET"])
@api_login_required
def forecast():
    rows = query(
        """SELECT DATE_TRUNC('month', transaction_date) AS month,
                  SUM(CASE WHEN to_account IN
                        (SELECT account_number FROM accounts WHERE customer_id = %s)
                       THEN amount ELSE -amount END) AS net
           FROM transaction_history th
           JOIN accounts a ON (th.from_account = a.account_number
                                OR th.to_account = a.account_number)
           WHERE a.customer_id = %s
           GROUP BY 1 ORDER BY 1""",
        (session["customer_id"], session["customer_id"]),
    )
    balances = [float(r["net"]) for r in rows]
    return jsonify(predict_balance_trend(balances))
