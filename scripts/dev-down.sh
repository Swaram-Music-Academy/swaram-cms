#!/usr/bin/env bash
# ============================================================================
# dev-down.sh — Stop the full local dev environment
# ============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_DIR"

echo "==> Stopping Node app container..."
docker compose -f docker-compose.dev.yml down

echo "==> Stopping Supabase local stack..."
npx supabase stop

echo ""
echo "==> Dev environment stopped."
