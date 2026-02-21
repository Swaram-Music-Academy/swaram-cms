# Local development with Supabase

Run the app against a **local** Supabase instance that mirrors production (DB, Auth, Edge Functions, Storage).

## Prerequisites

- [Supabase CLI](https://supabase.com/docs/guides/cli) (used via `npx supabase`)
- [Docker](https://docs.docker.com/get-docker/) (required for `npx supabase start`)
- Node 18+

---

## 1. Env: point the app at local Supabase

Vite loads `.env` then `.env.local`; `.env.local` overrides. So:

- **Production:** Use `.env` with your prod `VITE_SUPABASE_PROJECT_URL` and `VITE_SUPABASE_ANON_KEY`.
- **Local:** Create `.env.local` with local Supabase URL and anon key (from step 2). Do not commit `.env.local`.

Create `.env.local` with:

```env
VITE_SUPABASE_PROJECT_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=<anon key from `supabase status`>
```

Get the anon key in step 2 after starting local Supabase.

---

## 2. Pull production schema and start local Supabase

`supabase db pull` pulls the **full schema** from prod (tables, RLS policies, functions,
triggers, etc.) into a single migration file. This means `supabase start` can create
all the tables itself — no ordering issues with existing migrations.

### One-time setup: pull schema from prod

1. Link to your prod project:
   ```bash
   npx supabase login
   npx supabase link --project-ref <your-prod-project-ref>
   ```
   Project ref is in the dashboard URL: `https://supabase.com/dashboard/project/<project-ref>`.

2. Remove the old hand-written migration (it's already included in the prod schema):
   ```bash
   rm supabase/migrations/20260213233022_fix_rls_policies_authenticated_only.sql
   ```

3. Pull the full prod schema:
   ```bash
   npx supabase db pull
   ```
   This creates a new file in `supabase/migrations/` (e.g. `*_remote_schema.sql`)
   containing every table, view, RLS policy, function, trigger, etc. from prod.

### Start local Supabase

```bash
npx supabase start
```

The CLI applies the pulled migration — all tables and policies are created.

```bash
npx supabase status
```

Note the output:
- **API URL** (e.g. `http://127.0.0.1:54321`) → `VITE_SUPABASE_PROJECT_URL`
- **anon key** → `VITE_SUPABASE_ANON_KEY`

Use these in `.env.local`. Local Studio: **http://127.0.0.1:54323**.

---

## 3. Pull schema + data from remote (one command)

To sync your local DB with prod (schema changes **and** latest data), run:

```bash
npm run db:pull
```

This runs `scripts/db-pull.sh` which:
1. `supabase db pull` — pulls any new schema changes from remote into a migration file
2. `supabase db reset` — resets local DB and applies all migrations
3. `supabase db dump --data-only` — dumps all rows from remote (including `auth.users`)
4. Pipes the dump into the local DB container via `docker exec`

After this, the same email/password logins work against the copied `auth.users`.

> **Note:** `supabase db pull` may prompt to update the remote migration history table — say **Y**.

### Manual steps (if you prefer)

```bash
npx supabase db dump --data-only -f prod_data.sql
docker exec -i supabase_db_swaram-software psql -U postgres -d postgres < prod_data.sql
```

---

## 4. Copy Edge Functions from production (if any)

Edge Functions are not in the DB; pull them from the prod project.

1. Log in and link (or use project ref):
   ```bash
   npx supabase login
   ```
2. List prod functions:
   ```bash
   npx supabase functions list --project-ref <your-prod-project-ref>
   ```
   Project ref is in the dashboard URL: `https://supabase.com/dashboard/project/<project-ref>`.
3. Download each function into `supabase/functions/`:
   ```bash
   npx supabase functions download <function-name> --project-ref <your-prod-project-ref>
   ```
   Repeat for every function. Downloads go into `supabase/functions/<function-name>/`.

Local Supabase serves these when you run `supabase start`. No extra deploy step for local.

---

## 5. Copy Storage from production

Storage is not included in the DB backup. Use the provided script to copy objects from prod to local. Run from the project root after `npm install`.

1. Create buckets on local (if they don’t exist). In Studio (http://127.0.0.1:54323) → Storage, create the same bucket names as prod (e.g. `students`). Or use SQL in Studio → SQL Editor:
   ```sql
   insert into storage.buckets (id, name, public)
   values ('students', 'students', false)
   on conflict (id) do nothing;
   ```
2. Set env vars for the script (prod and local **service role** keys so the script can read/write all objects). Either export them or put them in `.env.sync` (gitignored):
   ```bash
   export PROD_SUPABASE_URL="https://<prod-ref>.supabase.co"
   export PROD_SUPABASE_SERVICE_ROLE_KEY="<prod-service-role-key>"
   export LOCAL_SUPABASE_URL="http://127.0.0.1:54321"
   export LOCAL_SUPABASE_SERVICE_ROLE_KEY="<local-service-role-key>"
   ```
   Or create `.env.sync` with the same four variables, then run with [dotenv-cli](https://www.npmjs.com/package/dotenv-cli): `npx dotenv -e .env.sync -- node scripts/sync-storage-from-prod.mjs`
   Local service role key: `supabase status` (under "service_role key"). Prod: Dashboard → Project Settings → API → service_role.
3. Run the script:
   ```bash
   npm run sync-storage
   ```
   If you use `.env.sync`, run: `npx dotenv -e .env.sync -- npm run sync-storage`

---

## 6. Run the app locally

```bash
npm run dev
```

The app will use `.env.local` and talk to local Supabase. Log in with any user that exists in the restored `auth.users` (e.g. your prod email/password).

---

## Quick reference

| Goal                    | Command / action                                                    |
|-------------------------|----------------------------------------------------------------------|
| Pull prod schema + data | `npm run db:pull`                                                   |
| Start local             | `npx supabase start`                                                |
| Stop local              | `npx supabase stop`                                                 |
| Reset local DB          | `npx supabase db reset` (re-applies migrations from scratch)        |
| Local URLs/keys         | `npx supabase status`                                               |
| Use prod in dev         | Remove or rename `.env.local`; ensure `.env` has prod               |
| Use local in dev        | `.env.local` with local URL + anon key                              |
