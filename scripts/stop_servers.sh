#!/usr/bin/env bash
# Stop MMS dev servers — delegates to restart_servers.sh for one source of truth
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
exec "$ROOT_DIR/restart_servers.sh" stop
