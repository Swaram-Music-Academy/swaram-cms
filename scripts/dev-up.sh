#!/usr/bin/env bash
# ============================================================================
# dev-up.sh — Start the full local dev environment
#
# Brings up:
#   1. Supabase ensemble (postgres, auth, rest, studio, realtime, etc.)
#   2. Node app container (Vite dev server)
#
# Usage:
#   bash scripts/dev-up.sh          # start everything
#   bash scripts/dev-up.sh --seed   # start + seed sanitized prod data
# ============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_DIR"

SEED=false
if [[ "${1:-}" == "--seed" ]]; then
  SEED=true
fi

echo "=============================="
echo " Swaram CMS — Dev Environment"
echo "=============================="
echo ""

# ---- Step 1: Start Supabase ----
echo "==> Step 1: Starting Supabase local stack..."
npx supabase start

# Grab keys from supabase status
echo ""
echo "==> Reading Supabase keys..."
SUPABASE_STATUS=$(npx supabase status -o json 2>/dev/null)
API_URL=$(echo "$SUPABASE_STATUS" | jq -r '.API_URL')
ANON_KEY=$(echo "$SUPABASE_STATUS" | jq -r '.ANON_KEY')
SERVICE_ROLE_KEY=$(echo "$SUPABASE_STATUS" | jq -r '.SERVICE_ROLE_KEY')
STUDIO_URL=$(echo "$SUPABASE_STATUS" | jq -r '.STUDIO_URL')

echo "   API URL:     $API_URL"
echo "   Studio:      $STUDIO_URL"
echo "   Anon Key:    ${ANON_KEY:0:20}..."
echo ""

# Write .env.local for running outside Docker (optional)
cat > .env.local <<EOF
VITE_SUPABASE_PROJECT_URL=${API_URL}
VITE_SUPABASE_ANON_KEY=${ANON_KEY}
EOF
echo "==> .env.local updated."

# ---- Step 2: Seed data (optional) ----
if [ "$SEED" = true ]; then
  echo ""
  echo "==> Step 2: Seeding sanitized prod data..."
  bash scripts/seed-sanitized.sh
else
  echo "==> Step 2: Skipping seed (use --seed to seed sanitized prod data)"
fi

# ---- Step 3: Start the app container ----
echo ""
echo "==> Step 3: Starting Node app container..."
SUPABASE_ANON_KEY="$ANON_KEY" docker compose -f docker-compose.dev.yml up -d --build

echo ""
echo "=============================="
echo " Dev environment is running!"
echo ""
echo "  App:            http://localhost:5173"
echo "  Supabase API:   $API_URL"
echo "  Supabase Studio: $STUDIO_URL"
echo ""
echo "  Stop everything:  bash scripts/dev-down.sh"
echo "  View app logs:    docker compose -f docker-compose.dev.yml logs -f"
echo "  Seed data:        bash scripts/seed-sanitized.sh"
echo "=============================="
