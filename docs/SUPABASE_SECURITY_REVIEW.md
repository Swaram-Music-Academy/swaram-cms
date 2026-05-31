# Supabase Database Security Review — SMA CMS

**Project:** SMA CMS (Swaram Music Academy)  
**Project ID:** `ncpyouspricqpmdpikdz`  
**Review Date:** February 13, 2025  
**Review Method:** Supabase MCP tools + codebase analysis

**✅ Migration Applied (Feb 13, 2025):** `20260213233022_fix_rls_policies_authenticated_only` — RLS policies now restrict to `authenticated` role only.

---

## Executive Summary

Your Supabase database has **RLS enabled on all tables**, but the policies use `USING (true)` and `WITH CHECK (true)`, which effectively **disables** row-level security. Combined with policies applied to the `public` role, this means:

- Anyone with your anon key can read and write all data **without logging in**
- The anon key is present in your frontend bundle and can be easily obtained

There are also function security warnings, Auth settings to improve, and performance optimizations available.

---

## Critical Issues (Fix Immediately)

### 1. RLS Policies Bypass Security

**Finding:** All 16 tables have RLS policies that use `USING (true)` and `WITH CHECK (true)`, granting unrestricted access to the `public` role.

| Table | Policy Name | Issue |
|-------|-------------|-------|
| addresses | Access addresses | `true` = no restriction |
| batch_schedules | Access Batch Schedules | `true` = no restriction |
| batch_year_courses | Access Batch Courses | `true` = no restriction |
| batches | Access Batches | `true` = no restriction |
| contacts | Access Contacts | `true` = no restriction |
| courses | Access Courses | `true` = no restriction |
| enrollments | Access Enrollments | `true` = no restriction |
| fee_structures | Access Fee Structure data | `true` = no restriction |
| receipts | Access Receipts | `true` = no restriction |
| roles | Access all roles | `true` = no restriction |
| student_fee_summary | Access Student Fee Summary | `true` = no restriction |
| student_installments | Access Student Installments | `true` = no restriction |
| student_registeration_fees | Access Registeration Fees | `true` = no restriction |
| students | Access Students | `true` = no restriction |
| students | Policy with security definer functions | Duplicate, also `true` |
| students_contacts | Access Student Contacts | `true` = no restriction |
| users | Access users | `true` = no restriction |

**Remediation:** Replace these policies with ones that require authentication. Example:

```sql
-- Drop existing permissive policies and add authenticated-only access
-- Example for students table:
DROP POLICY IF EXISTS "Access Students" ON public.students;
DROP POLICY IF EXISTS "Policy with security definer functions" ON public.students;

CREATE POLICY "Authenticated users can manage students"
  ON public.students
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
```

Apply similar changes to all tables. For `users`, restrict to own row:

```sql
DROP POLICY IF EXISTS "Access users" ON public.users;

CREATE POLICY "Users can read own profile"
  ON public.users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);
```

**Docs:** [RLS Policy Always True](https://supabase.com/docs/guides/database/database-linter?lint=0024_permissive_rls_policy)

---

### 2. Storage Buckets Are Public

**Finding:** Both buckets are configured as `public: true`:

- `avatars` — public
- `students` — public (student photos, form uploads)

Public buckets allow unauthenticated access to files via URL. For the `students` bucket (PII documents), this is a privacy risk.

**Remediation:**

1. In Supabase Dashboard → Storage → each bucket → set **Public** to `false` if files should only be accessed by logged-in users.
2. Add storage policies that require authentication for SELECT/INSERT/UPDATE/DELETE as needed.
3. If public access is required for avatars, use signed URLs or keep avatars public but ensure no sensitive data is stored there.

---

## Security Warnings

### 3. Function Search Path Mutable (9 functions)

**Finding:** These functions do not set `search_path`, which can allow search path manipulation and increase SQL injection risk:

- `create_fee_summary`
- `add_registration_fee_on_student_insert`
- `check_batch_times`
- `handle_new_user`
- `add_installments_after_fee_summary`
- `get_payment_history`
- `get_timetable_by_slot`
- `handle_enrollment_drop`
- `update_installments_after_fee_change`

**Remediation:** Set `search_path` when creating/altering each function:

```sql
ALTER FUNCTION public.create_fee_summary SET search_path = public;
```

Or in the function definition:

```sql
CREATE OR REPLACE FUNCTION public.create_fee_summary(...)
RETURNS ...
LANGUAGE plpgsql
SET search_path = public
AS $$ ... $$;
```

**Docs:** [Function Search Path Mutable](https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable)

---

### 4. Auth: Leaked Password Protection Disabled

**Finding:** Supabase Auth is not checking passwords against HaveIBeenPwned.

**Remediation:** Enable in Dashboard → Authentication → Policies → [Password Strength and Leaked Password Protection](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection)

---

### 5. Auth: Insufficient MFA Options

**Finding:** Limited multi-factor authentication options are enabled.

**Remediation:** Enable additional MFA methods in Dashboard → Authentication. See [Auth MFA](https://supabase.com/docs/guides/auth/auth-mfa).

---

### 6. Postgres Version Has Security Patches

**Finding:** Postgres version `17.4.1.45` has available security patches.

**Remediation:** Schedule an upgrade in the Supabase Dashboard. See [Upgrading](https://supabase.com/docs/guides/platform/upgrading).

---

## Performance Issues

### 7. Unindexed Foreign Keys (16 foreign keys)

Foreign key columns without indexes can slow down JOINs and cascading operations. Affected tables include:

- `batch_schedules` (batch_id)
- `batch_year_courses` (batch_id, course_id)
- `enrollments` (batch_id, course_id, student_id)
- `fee_structures` (course_id)
- `student_fee_summary` (course_id, student_id)
- `student_installments` (fee_summary_id, receipt_id)
- `student_registeration_fees` (receipt_id, student_id)
- `students` (address_id)
- `students_contacts` (contact_id, student_id)
- `users` (role_id)

**Remediation:** Add indexes on FK columns. Example:

```sql
CREATE INDEX idx_batch_schedules_batch_id ON public.batch_schedules(batch_id);
CREATE INDEX idx_enrollments_student_id ON public.enrollments(student_id);
CREATE INDEX idx_enrollments_course_id ON public.enrollments(course_id);
CREATE INDEX idx_enrollments_batch_id ON public.enrollments(batch_id);
-- ... repeat for other tables
```

**Docs:** [Unindexed Foreign Keys](https://supabase.com/docs/guides/database/database-linter?lint=0001_unindexed_foreign_keys)

---

### 8. Duplicate RLS Policies on `students` Table

**Finding:** The `students` table has two permissive policies for the same operations ("Access Students" and "Policy with security definer functions"). Both use `true`, so they overlap and add unnecessary overhead.

**Remediation:** Keep a single policy after fixing the security issue (see Issue 1). Drop the redundant one.

**Docs:** [Multiple Permissive Policies](https://supabase.com/docs/guides/database/database-linter?lint=0006_multiple_permissive_policies)

---

## What’s Working Well

- RLS is **enabled** on all relevant tables.
- Foreign key relationships and schema are well defined.
- No service role key in the frontend.
- Auth is used for login (routes are protected).
- Database structure supports the application’s needs.

---

## Recommended Action Plan

1. **Immediate:** Replace permissive RLS policies with `authenticated`-only policies.
2. **Immediate:** Review and adjust storage bucket settings and policies.
3. **Short term:** Set `search_path` on all custom functions.
4. **Short term:** Enable leaked password protection in Auth.
5. **Short term:** Plan Postgres upgrade.
6. **As capacity allows:** Add indexes on foreign keys for performance.
7. **As capacity allows:** Consolidate duplicate RLS policies and consider role-based access if needed.

---

## References

- [Supabase RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Database Linter Docs](https://supabase.com/docs/guides/database/database-linter)
- [Password Security](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection)
- [Auth MFA](https://supabase.com/docs/guides/auth/auth-mfa)
- [Upgrading Postgres](https://supabase.com/docs/guides/platform/upgrading)
