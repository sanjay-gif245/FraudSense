#!/bin/bash
# Starts both the FraudSense backend (FastAPI) and frontend (Vite) together.
# Stops both when you press Ctrl+C.
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

cleanup() {
  echo ""
  echo "Stopping FraudSense..."
  kill "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null
  exit 0
}
trap cleanup INT TERM

if [ ! -f "$SCRIPT_DIR/backend/data/creditcard_balanced.csv" ]; then
  echo "WARNING: backend/data/creditcard_balanced.csv not found."
  echo "Download it from the GitHub Releases page and place it there,"
  echo "otherwise the app will fall back to a small synthetic dataset."
  echo ""
fi

if [ ! -d "$SCRIPT_DIR/backend/.venv" ]; then
  echo "ERROR: backend/.venv not found. Run this first:"
  echo "  cd backend && python3 -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt"
  exit 1
fi

if [ ! -d "$SCRIPT_DIR/frontend/node_modules" ]; then
  echo "ERROR: frontend/node_modules not found. Run this first:"
  echo "  cd frontend && npm install"
  exit 1
fi

echo "Starting backend on http://127.0.0.1:8000 ..."
(cd "$SCRIPT_DIR/backend" && ./.venv/bin/uvicorn main:app --reload --port 8000) &
BACKEND_PID=$!

echo "Waiting for the backend to finish loading the dataset and training the model..."
until curl -s -o /dev/null http://127.0.0.1:8000/health; do
  sleep 1
done
echo "Backend is ready."

echo "Starting frontend on http://localhost:5173 ..."
(cd "$SCRIPT_DIR/frontend" && npm run dev) &
FRONTEND_PID=$!

wait
