# ── Stage 1: Build React frontend ────────────────────────────────────────────
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm install --frozen-lockfile 2>/dev/null || npm install
COPY frontend/ ./
RUN npm run build


# ── Stage 2: Python / Flask backend ──────────────────────────────────────────
FROM python:3.11-slim

WORKDIR /app

# System deps for psycopg2 and pillow
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev gcc libffi-dev libssl-dev \
    && rm -rf /var/lib/apt/lists/*

# Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source
COPY . .

# Copy compiled React app from stage 1
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

RUN chmod +x entrypoint.sh

EXPOSE 8080

CMD ["./entrypoint.sh"]
