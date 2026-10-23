#!/bin/sh
set -e

echo "=== Initializing Artha Production Services ==="

# Automatically run database migrations & seeding if needed
python setup_database.py || echo "Warning: Database check encountered an issue, proceeding to app startup..."

PORT="${PORT:-8080}"
echo "=== Starting Gunicorn on port $PORT ==="
exec gunicorn app:app --bind "0.0.0.0:$PORT" --workers 2 --timeout 120
