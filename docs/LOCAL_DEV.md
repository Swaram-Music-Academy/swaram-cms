# Local Development with Docker

Run the full Swaram CMS stack locally using Docker containers.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Docker Host                                                │
│                                                             │
│  ┌──────────────┐   ┌────────────────────────────────────┐  │
│  │  swaram-app   │   │  Supabase Ensemble                 │  │
│  │  (Node 22)    │   │  (supabase start)                  │  │
│  │              │   │                                    │  │
│  │  Vite Dev    │──▶│  API Gateway    :54321             │  │
│  │  Server      │   │  Postgres DB    :54322             │  │
│  │  :5173       │   │  Studio UI      :54323             │  │
│  │              │   │  Mailpit        :54324             │  │
│  │              │   │  Auth / Storage / Realtime / ...   │  │
│  └──────────────┘   └────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Prerequisites

- [Docker Desktop](https://docs.docker.com/get-docker/) (with WSL2 integration if on Windows)
- [Supabase CLI](https://supabase.com/docs/guides/cli) — `npm install -g supabase` or use via `npx`
- Node 18+ (for running Supabase CLI on host)

---

## Quick Start

### Start everything (one command)

```bash
bash scripts/dev-up.sh
```

This will:
1. Start the Supabase ensemble (`supabase start`) — Postgres, Auth, REST API, Studio, etc.
2. Update `.env.local` with the correct local Supabase keys
3. Build and start the Node app container with Vite dev server

### Start everything + seed sanitized prod data

```bash
bash scripts/dev-up.sh --seed
```

Same as above, but also pulls production data, loads it into local Postgres, and **sanitizes all PII** (names, emails, phones, addresses replaced with fake data).

### npm shortcuts

```bash
npm run dev:up          # start everything
npm run dev:up:seed     # start + seed sanitized data
npm run dev:down        # stop everything
npm run db:seed-local   # seed sanitized data (Supabase must be running)
npm run db:pull         # pull schema + raw data from prod (original script)
```

---

## What's Running

| Service           | URL                          | Notes                          |
|-------------------|------------------------------|--------------------------------|
| **Vite App**      | http://localhost:5173        | React SPA with HMR             |
| **Supabase API**  | http://localhost:54321       | REST + GraphQL + Auth          |
| **Supabase Studio** | http://localhost:54323    | DB browser, SQL editor          |
| **Postgres**      | localhost:54322              | `postgres:postgres`            |
| **Mailpit**       | http://localhost:54324       | Catches auth emails locally    |

---

## Seeding Data

### Sanitized prod data (recommended for dev)

```bash
bash scripts/seed-sanitized.sh
```

This pulls production data and replaces all sensitive fields:

| Table        | Sanitized Fields                                        |
|--------------|---------------------------------------------------------|
| `contacts`   | `contact_name`, `phone`, `email`, `whatsapp_num`       |
| `students`   | `first_name`, `middle_name`, `last_name`                |
| `addresses`  | `unit`, `line_1`, `line_2`, `zipcode`                   |
| `users`      | `name`                                                  |
| `auth.users` | `email`, `encrypted_password`, `phone`, tokens          |

After seeding, all auth users have:
- **Email:** `dev_<uuid-prefix>@example.com`
- **Password:** `password123`

To find a login:
```bash
docker exec supabase_db_swaram-software psql -U postgres -d postgres \
  -c "SELECT email FROM auth.users LIMIT 5;"
```

### Raw prod data (use with caution)

```bash
npm run db:pull
```

Uses the original `db-pull.sh` — pulls real data including PII. Only use if you need real data for debugging.

---

## Stopping

```bash
bash scripts/dev-down.sh
# or
npm run dev:down
```

This stops both the Node app container and the Supabase ensemble.

To stop only one:
```bash
# Stop just the app container
docker compose -f docker-compose.dev.yml down

# Stop just Supabase
npx supabase stop
```

---

## Running Without Docker (app only)

If you prefer running Vite on your host (faster HMR), you can skip the app container:

```bash
# Start just Supabase
npx supabase start

# Run Vite on host
npm run dev
```

The `.env.local` file is auto-updated by `dev-up.sh`, or create it manually:
```env
VITE_SUPABASE_PROJECT_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=<from supabase status>
```

---

## VS Code Dev Container

A `.devcontainer/devcontainer.json` is included for VS Code / GitHub Codespaces users. It uses Docker-outside-of-Docker to share the host Docker socket and auto-runs `scripts/dev-up.sh` on container start.

---

## File Reference

| File                           | Purpose                                        |
|--------------------------------|------------------------------------------------|
| `Dockerfile.dev`               | Node 22 image for the app container            |
| `docker-compose.dev.yml`       | App container definition                       |
| `scripts/dev-up.sh`            | Start Supabase + app container                 |
| `scripts/dev-down.sh`          | Stop everything                                |
| `scripts/seed-sanitized.sh`    | Pull + sanitize prod data                      |
| `scripts/db-pull.sh`           | Pull raw prod data (original)                  |
| `supabase/config.toml`         | Supabase local config (ports, auth, etc.)      |
| `.devcontainer/devcontainer.json` | VS Code Dev Container config                |
