#!/usr/bin/env bash
# Start PoemForge locally: backend on :3001, frontend on :5173.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_PID=""

cleanup() {
  if [ -n "$BACKEND_PID" ]; then
    kill "$BACKEND_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT INT TERM

if [ ! -d "$ROOT/backend/node_modules" ]; then
  echo "Installing backend dependencies..."
  (cd "$ROOT/backend" && npm install --no-audit --no-fund)
fi

if [ ! -d "$ROOT/frontend/node_modules" ]; then
  echo "Installing frontend dependencies..."
  (cd "$ROOT/frontend" && npm install --no-audit --no-fund)
fi

echo "Starting backend on http://localhost:3001 ..."
(cd "$ROOT/backend" && node src/server.js) &
BACKEND_PID=$!

echo "Starting frontend on http://localhost:5173 ..."
(cd "$ROOT/frontend" && npm run dev)
