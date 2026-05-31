#!/usr/bin/env bash
# ============================================================================
# seed-sanitized.sh
#
# Pulls production data from the linked Supabase project, sanitizes sensitive
# fields (PII), and loads it into the local Supabase instance.
#
# Sensitive data that gets scrubbed:
#   - contacts.phone, contacts.email, contacts.whatsapp_num, contacts.contact_name
#   - addresses.unit, addresses.line_1, addresses.line_2, addresses.zipcode
#   - students.first_name, students.middle_name, students.last_name
#   - auth.users emails and encrypted passwords
#   - users.name
#
# Prerequisites:
#   - Supabase CLI linked to prod: npx supabase link --project-ref <ref>
#   - Local Supabase running: npx supabase start
#   - psql and Docker available
# ============================================================================
set -euo pipefail

DB_CONTAINER="supabase_db_swaram-software"
DUMP_FILE="/tmp/prod_data_raw.sql"
SANITIZED_FILE="/tmp/prod_data_sanitized.sql"

echo "=============================="
echo " Seed Local DB (Sanitized)"
echo "=============================="

# ---- Step 1: Pull latest schema from prod ----
echo ""
echo "==> Step 1/5: Pulling schema changes from remote..."
if npx supabase db pull 2>/dev/null; then
  echo "   Schema pulled. Resetting local DB to apply migrations..."
  npx supabase db reset
else
  echo "   No schema changes (or not linked). Resetting local DB anyway..."
  npx supabase db reset
fi

# ---- Step 2: Dump prod data ----
echo ""
echo "==> Step 2/5: Dumping data from remote (--data-only)..."
npx supabase db dump --data-only -f "$DUMP_FILE"
echo "   Dump saved to $DUMP_FILE ($(du -h "$DUMP_FILE" | cut -f1))"

# ---- Step 3: Restore raw data into local DB ----
echo ""
echo "==> Step 3/5: Restoring raw data into local DB..."
docker exec -i "$DB_CONTAINER" psql -U postgres -d postgres < "$DUMP_FILE" 2>&1 | tail -5

# ---- Step 4: Sanitize sensitive data in-place ----
echo ""
echo "==> Step 4/5: Sanitizing sensitive data..."

docker exec -i "$DB_CONTAINER" psql -U postgres -d postgres <<'SANITIZE_SQL'
BEGIN;

-- Contacts: replace real names, phones, emails
UPDATE public.contacts SET
  contact_name = 'Contact ' || LEFT(id::text, 8),
  phone        = '+91' || LPAD((FLOOR(RANDOM() * 9000000000) + 1000000000)::text, 10, '0'),
  email        = 'user_' || LEFT(id::text, 8) || '@example.com',
  whatsapp_num = CASE
    WHEN whatsapp_num IS NOT NULL
    THEN '+91' || LPAD((FLOOR(RANDOM() * 9000000000) + 1000000000)::text, 10, '0')
    ELSE NULL
  END;

-- Students: replace real names with generic ones
UPDATE public.students SET
  first_name  = 'Student',
  middle_name = CASE WHEN middle_name IS NOT NULL THEN 'M' ELSE NULL END,
  last_name   = LEFT(id::text, 8);

-- Addresses: genericize
UPDATE public.addresses SET
  unit   = CASE WHEN unit IS NOT NULL THEN 'Unit ' || LEFT(id::text, 4) ELSE NULL END,
  line_1 = (FLOOR(RANDOM() * 999) + 1)::text || ' Sample Street',
  line_2 = CASE WHEN line_2 IS NOT NULL THEN 'Near Landmark' ELSE NULL END,
  zipcode = LPAD((FLOOR(RANDOM() * 900000) + 100000)::text, 6, '0');

-- Users table (app-level): replace names
UPDATE public.users SET
  name = 'User ' || LEFT(id::text, 8);

-- Auth users: replace emails and passwords with dev-friendly ones
-- Password hash = bcrypt of 'password123' (standard dev password)
UPDATE auth.users SET
  email              = 'dev_' || LEFT(id::text, 8) || '@example.com',
  encrypted_password = '$2a$10$PznUGzshVgOU00J6xJGJd.Iq4gEaioaEYmGKxnRpOEHQbFBjsIrim',
  raw_user_meta_data = jsonb_set(
    COALESCE(raw_user_meta_data, '{}'::jsonb),
    '{email}',
    to_jsonb('dev_' || LEFT(id::text, 8) || '@example.com')
  ),
  phone              = NULL,
  email_confirmed_at = NOW(),
  confirmation_token = '',
  recovery_token     = '';

COMMIT;

-- Verify sanitization
SELECT 'contacts'  AS "table", COUNT(*) AS "rows", COUNT(*) FILTER (WHERE email LIKE '%@example.com') AS "sanitized" FROM public.contacts
UNION ALL
SELECT 'students',  COUNT(*),       COUNT(*) FILTER (WHERE first_name = 'Student')             FROM public.students
UNION ALL
SELECT 'addresses', COUNT(*),       COUNT(*) FILTER (WHERE line_1 LIKE '%Sample Street')       FROM public.addresses
UNION ALL
SELECT 'auth.users', COUNT(*),      COUNT(*) FILTER (WHERE email LIKE 'dev_%@example.com')     FROM auth.users;

SANITIZE_SQL

# ---- Step 4b: Create dev user with known credentials ----
echo ""
echo "==> Step 4b: Ensuring dev user exists..."

docker exec -i "$DB_CONTAINER" psql -U postgres -d postgres <<'DEV_USER_SQL'
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'jeetpatel1011@gmail.com') THEN
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at, confirmation_token, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(), 'authenticated', 'authenticated',
      'jeetpatel1011@gmail.com',
      crypt('password', gen_salt('bf')),
      NOW(), NOW(), NOW(), '', ''
    );
  ELSE
    UPDATE auth.users
    SET encrypted_password = crypt('password', gen_salt('bf'))
    WHERE email = 'jeetpatel1011@gmail.com';
  END IF;
END
$$;
DEV_USER_SQL

# ---- Step 5: Cleanup ----
echo ""
echo "==> Step 5/5: Cleaning up..."
rm -f "$DUMP_FILE" "$SANITIZED_FILE"

echo ""
echo "=============================="
echo " Done! Local DB seeded with sanitized prod data."
echo ""
echo " All auth users now have:"
echo "   Email:    dev_<uuid-prefix>@example.com"
echo "   Password: password123"
echo ""
echo " To find a valid login, run:"
echo "   docker exec $DB_CONTAINER psql -U postgres -d postgres -c \"SELECT email FROM auth.users LIMIT 5;\""
echo "=============================="
