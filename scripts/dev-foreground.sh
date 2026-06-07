#!/usr/bin/env bash
# Run frontend + backend in the foreground (recommended for daily dev).
# Keep this terminal open while working. Ctrl+C stops both.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo "▸ MMS dev (foreground) — Ctrl+C to stop"
echo "  Frontend  http://localhost:5173"
echo "  Workspace http://dar-ul-quran.localhost:5173"
echo ""

if ! docker ps --format '{{.Names}}' 2>/dev/null | grep -qx "mms-postgres"; then
  echo "⚠ PostgreSQL container not running — start with: ./restart_servers.sh"
fi

trap 'kill 0 2>/dev/null; exit 0' INT TERM
pnpm --filter mms-backend dev &
pnpm --filter mms-frontend dev &
wait
