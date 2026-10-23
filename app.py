"""
Artha — All your money, one clear picture. Private by design.
Built on a fresh Flask + React + PostgreSQL base.
"""

import os
import re
from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()


def create_app():
    app = Flask(__name__, static_folder="frontend/dist", static_url_path="")

    # ── Security ─────────────────────────────────────────────────────────────
    secret = os.environ.get("SECRET_KEY", "artha-hacktoberfest-demo-secret-key-2026")
    app.secret_key = secret

    # Session cookie config — secure in production
    app.config.update(
        SESSION_COOKIE_HTTPONLY=True,
        SESSION_COOKIE_SAMESITE="Lax",
        SESSION_COOKIE_SECURE=(os.environ.get("FLASK_ENV") == "production"),
    )

    # ── CORS ─────────────────────────────────────────────────────────────────
    # In production we serve React from Flask (same origin) so CORS is only
    # needed for local dev (Vite runs on :5173) and Chrome extension origins.
    dev_origins = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        re.compile(r"^chrome-extension://.*$"),
    ]
    CORS(app, supports_credentials=True, origins=dev_origins)

    # ── SecureBank blueprints ─────────────────────────────────────────────────
    from routes.auth import auth_bp
    from routes.dashboard import dashboard_bp
    from routes.transfer import transfer_bp
    from routes.history import history_bp
    from routes.profile import profile_bp

    app.register_blueprint(auth_bp,       url_prefix="/api")
    app.register_blueprint(dashboard_bp,  url_prefix="/api")
    app.register_blueprint(transfer_bp,   url_prefix="/api")
    app.register_blueprint(history_bp,    url_prefix="/api")
    app.register_blueprint(profile_bp,    url_prefix="/api")

    # ── Artha blueprints ──────────────────────────────────────────────────────
    from ingest.routes import ingest_bp
    from engine.routes import engine_bp

    app.register_blueprint(ingest_bp,  url_prefix="/api/artha")
    app.register_blueprint(engine_bp,  url_prefix="/api/artha")

    # ── Health check (no auth, used by DigitalOcean health probe) ────────────
    @app.route("/health")
    def health():
        return jsonify({"status": "ok"})

    # ── Catch-all: serve compiled React SPA ──────────────────────────────────
    @app.route("/", defaults={"path": ""})
    @app.route("/<path:path>")
    def serve_react(path):
        dist = os.path.join(app.root_path, "frontend", "dist")
        target = os.path.join(dist, path)
        if path and os.path.exists(target):
            return send_from_directory(dist, path)
        return send_from_directory(dist, "index.html")

    return app


app = create_app()

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    debug = os.environ.get("FLASK_ENV") == "development"
    app.run(host="0.0.0.0", port=port, debug=debug)
