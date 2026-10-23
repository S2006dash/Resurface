"""
Shared login decorator used by every protected endpoint (SecureBank + Artha).
"""

from functools import wraps
from flask import session, jsonify


def api_login_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if "customer_id" not in session:
            return jsonify({"error": "Authentication required"}), 401
        return f(*args, **kwargs)
    return decorated
