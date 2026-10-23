#!/bin/sh
set -e

echo "=== Initializing Artha Production Services ==="

# Automatically run database migrations & seeding if needed
python setup_database.py || echo "Warning: Database check encountered an issue, proceeding to app startup..."

echo "=== Starting Gunicorn on port 8080 ==="
exec gunicorn app:app --bind 0.0.0.0:8080 --workers 2 --timeout 120
