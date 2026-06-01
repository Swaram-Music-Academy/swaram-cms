# Swaram CMS

Swaram CMS is the internal management app for Swaram Music Academy. It manages students, courses, batches, enrollments, fees, expenses, promotions, reports, and academy settings.

## Tech Stack

- React
- TypeScript
- Vite
- Supabase
- React Query
- Tailwind CSS
- shadcn/ui
- Netlify

## Main Features

### Academy Management

- Student registration and profile management
- Contact management with country-aware phone inputs
- Student avatar upload/camera capture
- Course management
- Course fee structure management
- Batch management
- Timetable views
- Student enrollment into batches/courses

### Fees and Reports

- Registration fee tracking
- Installment fee tracking
- Receipt generation
- Pending installment reports
- Pending registration fee reports
- Fee reports with monthly collection charts
- Fee payment history and status tracking

### Expenses and Financial Dashboard

- Manual expense entry
- Expense categories
- Optional receipt upload for expenses
- Expense filters by date range, category, payment method, and search
- Financial dashboard with:
  - projected revenue
  - collected revenue
  - pending revenue
  - expenses
  - profit/loss
  - profit margin
  - registration fee projection vs collection
  - installment fee projection vs collection
  - expenses by category
  - revenue vs expenses by month

### Promotions

- Batch-level year promotion workflow
- Promotion history
- Undo promotion support

### Settings

- Global registration fee setting
- Registration fee changes affect new students only; existing records remain unchanged for historical accuracy

## Local Development

Detailed local setup docs are in:

```text
docs/LOCAL_DEV.md
```

Start local development stack:

```bash
npm run dev:up
```

Start local stack with sanitized seed data:

```bash
npm run dev:up:seed
```

Stop local stack:

```bash
npm run dev:down
```

Local app:

```text
http://localhost:5173
```

Local Supabase Studio:

```text
http://localhost:54323
```

Seeded local dev login:

```text
Email:    jeetpatel1011@gmail.com
Password: password
```

## Build

```bash
npm run build
```

Netlify also uses this build command.

## Supabase

Database migrations live in:

```text
supabase/migrations
```

Important current migrations include:

- Promotion workflow
- Security/RLS cleanup
- Configurable registration fee setting
- Expenses feature

Production database migrations are applied manually with Supabase CLI after review.

Recommended flow:

```bash
npx supabase db push --dry-run
npx supabase db push
```

## Documentation

Useful project docs:

```text
docs/HANDOFF.md              Current project state and handoff notes
docs/OPERATIONS.md           Academy operations and business rules
docs/LOCAL_DEV.md            Local development and seed setup
docs/CHANGELOG.md            Recent feature/change summary
docs/SUPABASE_SECURITY_REVIEW.md
```

If starting from a fresh session, read:

```text
docs/HANDOFF.md
docs/OPERATIONS.md
docs/CHANGELOG.md
```

## Deployment

- Frontend deploys through Netlify from `main`.
- Supabase migrations are not automatically deployed by Netlify.
- Production DB migrations should be reviewed and applied separately.
- `netlify.toml` skips frontend builds for docs-only, migration-only, Docker-only, or local script-only changes.

## Notes

- Current app uses direct authenticated Supabase table access.
- Some authenticated GraphQL exposure linter warnings are accepted for now because revoking authenticated table access would break the current frontend architecture.
- RBAC foundation is planned. Sidebar navigation now includes permission keys so future role-based filtering can be added cleanly.
