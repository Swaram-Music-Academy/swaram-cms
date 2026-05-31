-- ============================================================
-- Security linter cleanup
-- ============================================================
-- 1. Pin function search_path to avoid role-mutable search_path warnings.
-- 2. Revoke direct RPC execution of trigger-only SECURITY DEFINER function.
-- 3. Make broad authenticated RLS policies explicit instead of USING (true).
-- 4. Revoke anon table privileges because this is an authenticated staff CMS.

-- ------------------------------------------------------------
-- 1. Function search_path hardening
-- ------------------------------------------------------------
ALTER FUNCTION public.add_installments_after_fee_summary() SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.add_registration_fee_on_student_insert() SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.check_batch_times() SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.create_fee_summary(enrollment_id uuid) SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.get_payment_history(p_student_id uuid) SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.get_timetable_by_slot() SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.handle_enrollment_drop() SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.handle_new_user() SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.promote_students(
  p_enrollment_ids uuid[],
  p_target_batch_id uuid,
  p_new_year smallint,
  p_source_batch_id uuid,
  p_course_id uuid,
  p_from_year smallint,
  p_excluded_ids uuid[],
  p_promoted_by uuid
) SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.undo_promotion(p_history_id uuid, p_enrollment_ids uuid[]) SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.update_installments_after_fee_change() SET search_path = public, extensions, pg_temp;

-- ------------------------------------------------------------
-- 2. Trigger-only SECURITY DEFINER function should not be callable via RPC
-- ------------------------------------------------------------
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated;

-- ------------------------------------------------------------
-- 3. Make authenticated-wide RLS policies explicit
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated users can manage addresses" ON public.addresses;
CREATE POLICY "Authenticated users can manage addresses" ON public.addresses
  FOR ALL TO authenticated
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can manage batch_schedules" ON public.batch_schedules;
CREATE POLICY "Authenticated users can manage batch_schedules" ON public.batch_schedules
  FOR ALL TO authenticated
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can manage batch_year_courses" ON public.batch_year_courses;
CREATE POLICY "Authenticated users can manage batch_year_courses" ON public.batch_year_courses
  FOR ALL TO authenticated
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can manage batches" ON public.batches;
CREATE POLICY "Authenticated users can manage batches" ON public.batches
  FOR ALL TO authenticated
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can manage contacts" ON public.contacts;
CREATE POLICY "Authenticated users can manage contacts" ON public.contacts
  FOR ALL TO authenticated
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can manage courses" ON public.courses;
CREATE POLICY "Authenticated users can manage courses" ON public.courses
  FOR ALL TO authenticated
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can manage enrollments" ON public.enrollments;
CREATE POLICY "Authenticated users can manage enrollments" ON public.enrollments
  FOR ALL TO authenticated
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can manage fee_structures" ON public.fee_structures;
CREATE POLICY "Authenticated users can manage fee_structures" ON public.fee_structures
  FOR ALL TO authenticated
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can manage receipts" ON public.receipts;
CREATE POLICY "Authenticated users can manage receipts" ON public.receipts
  FOR ALL TO authenticated
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can manage roles" ON public.roles;
CREATE POLICY "Authenticated users can manage roles" ON public.roles
  FOR ALL TO authenticated
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can manage student_fee_summary" ON public.student_fee_summary;
CREATE POLICY "Authenticated users can manage student_fee_summary" ON public.student_fee_summary
  FOR ALL TO authenticated
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can manage student_installments" ON public.student_installments;
CREATE POLICY "Authenticated users can manage student_installments" ON public.student_installments
  FOR ALL TO authenticated
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can manage student_registeration_fees" ON public.student_registeration_fees;
CREATE POLICY "Authenticated users can manage student_registeration_fees" ON public.student_registeration_fees
  FOR ALL TO authenticated
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can manage students" ON public.students;
CREATE POLICY "Authenticated users can manage students" ON public.students
  FOR ALL TO authenticated
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can manage students_contacts" ON public.students_contacts;
CREATE POLICY "Authenticated users can manage students_contacts" ON public.students_contacts
  FOR ALL TO authenticated
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- New promotion table should also be protected by RLS.
ALTER TABLE public.promotion_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can manage promotion_history" ON public.promotion_history;
CREATE POLICY "Authenticated users can manage promotion_history" ON public.promotion_history
  FOR ALL TO authenticated
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ------------------------------------------------------------
-- 4. This app is authenticated-only. Revoke anon table privileges.
--    RLS already blocks anon rows, but revoking grants also reduces API/GraphQL exposure.
-- ------------------------------------------------------------
REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public FROM anon;
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM anon;

-- Re-grant only the functions explicitly needed before login, if any, below.
-- Currently the React app does not call public RPCs before authentication.
