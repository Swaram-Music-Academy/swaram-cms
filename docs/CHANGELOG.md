# Change Log

## 2026-05-31 — Stability, Year Promotion, Fees, Settings, Security

### New features

#### Batch-based year promotion

Added a new year promotion workflow for batch-level promotions:

- Route: `/promotions`
- History route: `/promotions/history`
- New database table: `promotion_history`
- New RPCs:
  - `promote_students(...)`
  - `undo_promotion(...)`

Operational model:

- Select a source batch.
- Select a target batch for the next course year.
- All students are selected by default.
- Deselect students who are not appearing for exam or are not continuing.
- Promotion creates the next year's fee summary and installments.
- Promotion history supports undo for human-error correction.

#### Configurable registration fee

Registration fee is now globally configurable instead of hardcoded.

- Route: `/settings`
- New database table: `app_settings`
- Setting key: `registration_fee`
- Default amount: `1500`
- Existing student registration fee records are not modified.
- Only newly registered students use the latest configured value.

The `add_registration_fee_on_student_insert()` trigger now reads from `app_settings`.

#### Country-aware phone input

Student contact phone and WhatsApp fields now use a country-aware input:

- Defaults to India `+91`
- Supports country dropdown/search
- Stores numbers in E.164 format, e.g. `+919898293324`
- WhatsApp links strip the `+` for `wa.me` URLs

#### Operations documentation

Added `docs/OPERATIONS.md` to document academy operating rules and implementation assumptions:

- Academic year cycles
- Courses and years
- Batches
- Student lifecycle
- Enrollment
- Promotions
- Fees and installments
- Known limitations and planned features

---

### Fee and payment behavior changes

#### Fee summary filtering

Fee summaries now show:

- Current enrollment year fee summaries
- Older-year fee summaries only when they still have pending installments
- Registration fee only if it is unpaid

This avoids showing historical paid registration fees or fully-settled old course years as if they are part of the current year.

#### Payment schedule filtering

`get_payment_history(...)` was updated to return:

- Current year installments
- Older-year pending installments as overdue
- Registration fee records

#### Payment history status chips

Payment history now shows status badges:

- `Paid`
- `Upcoming`
- `Overdue`

Paid rows link to receipts. Upcoming/overdue rows do not.

#### Installment due date fix

The installment trigger no longer uses hardcoded 2025 dates. It now calculates dates from the current academic year.

This is still a temporary implementation. A future feature should make installment deadline templates configurable by cycle and course/template type.

---

### Bug fixes

#### Fees page

- Fixed fee payment date picker updating the wrong payload.
- Fixed `resetFeePayload()` resetting the registration payload instead of fee payload.
- Fixed React Query cache key collision that caused a 404 when navigating back from `/fees/:id` to `/students/:id`.
- Fixed drawer/dropdown interaction where pressing Tab could close the drawer and leave the menu stuck.
- Fixed Fee Summary year column showing the course name instead of year.

#### Student pages

- Fixed enrollment edit completion date writing to `enrollment_date` instead of `completion_date`.
- Fixed student deletion using the wrong error variable.
- Fixed student deletion removing address by `student.id` instead of `student.address_id`.
- Replaced full page reloads with React Query invalidation after student deletion.
- Fixed camera capture preview positioning.
- Added camera stream cleanup on unmount.
- Edit student page now shows the existing avatar.

#### Courses

- Courses list now uses React Query instead of local `useEffect` state.
- Fee structure editor now creates missing fee rows based on course `duration_years`.
  - This fixes new courses showing no fee inputs.

#### Shared UI

- Rewrote DatePicker to fix stale values, incorrect default selection, month navigation issues, and year clamping behavior.
- DataTable now shows a page indicator.
- Sheet component now prevents focus-outside tab behavior from closing drawers.

---

### Supabase and security changes

#### Supabase migrations added

- `20260503231600_add_promotion_feature.sql`
- `20260531194237_fix_security_linter_warnings.sql`
- `20260531201708_add_global_registration_fee_setting.sql`

#### Security linter cleanup

- Pinned function `search_path` for public functions.
- Revoked direct execution of trigger-only `handle_new_user()`.
- Replaced overly permissive `USING (true)` policies with explicit authenticated checks.
- Enabled RLS on `promotion_history`.
- Revoked anon access to public tables/functions.

Remaining accepted warning:

- Authenticated GraphQL table exposure remains accepted for now because the frontend currently uses direct Supabase table queries as authenticated users.

---

### Development and deployment changes

#### Local Docker/dev setup

- Removed unused `.devcontainer` configuration.
- Docker Compose no longer overrides Supabase env vars; Vite reads from `.env`/`.env.local`.
- `.pi/` is gitignored for local agent config and feature notes.

#### Seed script

`script/seed-sanitized.sh` now ensures this local dev login exists:

- Email: `jeetpatel1011@gmail.com`
- Password: `password`

The script still sanitizes production data before loading it locally.

#### Netlify build filtering

`netlify.toml` now skips deploy builds when commits only change non-frontend files, such as docs, migrations, Docker/dev scripts, etc.

Frontend/app-related changes still trigger Netlify builds.
