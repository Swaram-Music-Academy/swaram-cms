# Development Handoff

This document is intended to make the current state of the app understandable from a fresh session without relying on prior chat context.

## Current branch and PR

- Branch: `feat/dev-containers`
- PR URL: <https://github.com/Swaram-Music-Academy/swaram-cms/pull/new/feat/dev-containers>
- Latest pushed commit at time of writing: `3280dbc fix: resolve strict TypeScript build errors`

## What changed in this branch

See `docs/CHANGELOG.md` for the full change log. Highlights:

- Docker/local dev cleanup
- Sanitized production data seeding updates
- Year promotion workflow
- Promotion history and undo
- Fee/payment bug fixes
- DatePicker rewrite
- Sheet/drawer focus fix
- Country-aware phone input
- Configurable registration fee setting
- Supabase security linter cleanup
- Operations documentation

## Key user-facing routes

| Route | Purpose |
| ----- | ------- |
| `/students` | Student list and student record management |
| `/students/:id` | Student details |
| `/students/add` | New student registration |
| `/courses` | Course list |
| `/courses/edit/:id/fee-structure` | Course yearly fee structure |
| `/batches` | Batch management |
| `/fees/:id` | Student fee management |
| `/promotions` | Batch-level year promotion workflow |
| `/promotions/history` | Promotion audit history and undo |
| `/settings` | Global app settings, currently registration fee |

## Local development

Detailed docs: `docs/LOCAL_DEV.md`

Start local stack:

```bash
bash scripts/dev-up.sh
```

Start with sanitized production seed:

```bash
bash scripts/dev-up.sh --seed
```

Stop:

```bash
bash scripts/dev-down.sh
```

Local app URL:

```text
http://localhost:5173
```

Local Supabase Studio:

```text
http://localhost:54323
```

## Local dev login

The sanitized seed script ensures this user exists locally:

```text
Email:    jeetpatel1011@gmail.com
Password: password
```

Sanitized imported auth users also get:

```text
Email:    dev_<uuid-prefix>@example.com
Password: password123
```

## Supabase migrations in this branch

### `20260503231600_add_promotion_feature.sql`

Adds:

- `promotion_history` table
- `promote_students(...)` RPC
- `undo_promotion(...)` RPC
- updated `get_payment_history(...)`
- updated `add_installments_after_fee_summary()` to calculate due dates from current academic year instead of hardcoded 2025 dates

### `20260531194237_fix_security_linter_warnings.sql`

Adds security cleanup:

- Pins public function `search_path`
- Revokes direct execution of trigger-only `handle_new_user()`
- Replaces `USING (true)` policies with explicit authenticated checks
- Enables RLS on `promotion_history`
- Revokes anon access to public tables/functions

Remaining accepted warning:

- Authenticated GraphQL table exposure remains accepted because the current frontend intentionally uses direct Supabase table queries as authenticated users.

### `20260531201708_add_global_registration_fee_setting.sql`

Adds:

- `app_settings` table
- `registration_fee` setting with default `1500`
- `/settings` UI support through generated types and app code
- updated `add_registration_fee_on_student_insert()` trigger to read current registration fee from `app_settings`

Important behavior:

- Updating registration fee only affects newly registered students.
- Existing `student_registeration_fees` rows are not changed.

## Applying migrations to production

There is currently no GitHub Action for production DB migrations.

Manual flow:

```bash
npx supabase link --project-ref ncpyouspricqpmdpikdz
npx supabase db push --dry-run
npx supabase db push
```

Recommended backup before production push:

```bash
npx supabase db dump --data-only -f prod_data_backup.sql
```

## Frontend deployment

Netlify is used for frontend deployment.

`netlify.toml` now includes a build ignore rule so deploys only run when frontend/app-related files change:

- `src`
- `public`
- `index.html`
- package files
- Vite/TS/Tailwind/PostCSS/shadcn config
- `netlify.toml`

Docs-only, Supabase-only, Docker-only, and script-only commits should be skipped by Netlify.

## Build command

Netlify runs:

```bash
npm run build
```

Which runs:

```bash
tsc -b && vite build
```

Use this locally before pushing frontend changes:

```bash
npm run build
```

Known non-blocking build warning:

- Large JS chunk warning from Vite/Rollup. Build still succeeds.
- Browserslist data is stale. Build still succeeds.

## Supabase local/prod access for agents

A local Pi extension was created under `.pi/extensions/supabase-db`, but `.pi/` is gitignored and not tracked.

The extension supports:

- Local DB/Auth/Storage/Functions/Logs
- Production DB/Auth/Storage read-only

Production credentials are expected in `~/.supabase_secrets`, not in the repo.

This is local developer tooling only and is intentionally not committed.

## Important operational rules

Detailed docs: `docs/OPERATIONS.md`

Key rules:

- Primary academic cycle: May → April
- Secondary cycle: October → September
- Students can be enrolled in multiple courses at once
- Promotion is batch-level, not student-global
- Promotion does not auto-complete final-year students; completion remains manual
- Registration fee is one-time, not per-year or per-course
- Fee summary should show current year plus older pending/overdue items only
- Payment history displays `Paid`, `Upcoming`, and `Overdue` records

## Known pending feature: configurable installment deadlines

The app currently has a temporary improved installment-date implementation:

- Dates are no longer hardcoded to 2025
- Dates are calculated from the current academic year

Still pending:

- Admin-configurable installment deadline templates
- May-Apr vs Oct-Sep enrollment cycle support
- Course/template-based installment count instead of course-name matching (`Sitar`)

See `docs/OPERATIONS.md` under "Known Limitations & Planned Features".

## Suggested smoke test checklist

Before merging/deploying:

1. Login locally with dev user.
2. Create a course and verify fee structure rows auto-appear based on duration.
3. Create/edit student with contact phone numbers.
4. Test student image upload/camera capture if local storage bucket exists.
5. Add student enrollment and verify fee summary/installments are created.
6. Open `/fees/:id`:
   - record registration fee payment
   - record course installment payment
   - tab through drawer fields without drawer closing
7. Navigate from fee page back to student detail; should not show 404.
8. Promote a batch from `/promotions`.
9. Verify promoted enrollment year and target batch.
10. Verify fee records show current year plus old overdue only.
11. Undo promotion from `/promotions/history`.
12. Update registration fee at `/settings`; create a new student and verify new fee amount.

## Files most relevant for future work

| File | Purpose |
| ---- | ------- |
| `docs/OPERATIONS.md` | Business/operations rules |
| `docs/CHANGELOG.md` | Summary of changes in this feature branch |
| `docs/LOCAL_DEV.md` | Local setup and seed instructions |
| `src/pages/promotions/Promotions.tsx` | Promotion wizard UI |
| `src/pages/promotions/PromotionHistory.tsx` | Promotion history and undo UI |
| `src/query/promotions.ts` | Promotion query/RPC layer |
| `src/pages/Settings.tsx` | Global settings UI |
| `src/query/settings.ts` | Settings query layer |
| `src/query/fees.ts` | Fee summary/history filtering logic |
| `src/pages/fees/FeeDetails.tsx` | Fee management UI |
| `supabase/migrations/` | Database changes |

## If starting a new session

Recommended first prompt:

> Read `docs/HANDOFF.md`, `docs/OPERATIONS.md`, and `docs/CHANGELOG.md`. Then inspect git status and continue from the current branch.
