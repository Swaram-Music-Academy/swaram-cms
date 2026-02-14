-- ============================================================
-- Fix RLS: Replace permissive policies with authenticated-only
-- ============================================================
-- Previously: policies used USING (true) for 'public' role
-- (anon + authenticated), allowing unauthenticated access.
-- Now: restrict to 'authenticated' role only (logged-in users).
-- ============================================================

-- Addresses
DROP POLICY IF EXISTS "Access addresses" ON public.addresses;
CREATE POLICY "Authenticated users can manage addresses"
  ON public.addresses FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- Batch schedules
DROP POLICY IF EXISTS "Access Batch Schedules" ON public.batch_schedules;
CREATE POLICY "Authenticated users can manage batch_schedules"
  ON public.batch_schedules FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- Batch year courses
DROP POLICY IF EXISTS "Access Batch Courses" ON public.batch_year_courses;
CREATE POLICY "Authenticated users can manage batch_year_courses"
  ON public.batch_year_courses FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- Batches
DROP POLICY IF EXISTS "Access Batches" ON public.batches;
CREATE POLICY "Authenticated users can manage batches"
  ON public.batches FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- Contacts
DROP POLICY IF EXISTS "Access Contacts" ON public.contacts;
CREATE POLICY "Authenticated users can manage contacts"
  ON public.contacts FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- Courses
DROP POLICY IF EXISTS "Access Courses" ON public.courses;
CREATE POLICY "Authenticated users can manage courses"
  ON public.courses FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- Enrollments
DROP POLICY IF EXISTS "Access Enrollments" ON public.enrollments;
CREATE POLICY "Authenticated users can manage enrollments"
  ON public.enrollments FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- Fee structures
DROP POLICY IF EXISTS "Access Fee Structure data" ON public.fee_structures;
CREATE POLICY "Authenticated users can manage fee_structures"
  ON public.fee_structures FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- Receipts
DROP POLICY IF EXISTS "Access Receipts" ON public.receipts;
CREATE POLICY "Authenticated users can manage receipts"
  ON public.receipts FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- Roles
DROP POLICY IF EXISTS "Access all roles" ON public.roles;
CREATE POLICY "Authenticated users can manage roles"
  ON public.roles FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- Student fee summary
DROP POLICY IF EXISTS "Access Student Fee Summary" ON public.student_fee_summary;
CREATE POLICY "Authenticated users can manage student_fee_summary"
  ON public.student_fee_summary FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- Student installments
DROP POLICY IF EXISTS "Access Student Installments" ON public.student_installments;
CREATE POLICY "Authenticated users can manage student_installments"
  ON public.student_installments FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- Student registration fees
DROP POLICY IF EXISTS "Access Registeration Fees" ON public.student_registeration_fees;
CREATE POLICY "Authenticated users can manage student_registeration_fees"
  ON public.student_registeration_fees FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- Students (drop BOTH policies, create single replacement)
DROP POLICY IF EXISTS "Access Students" ON public.students;
DROP POLICY IF EXISTS "Policy with security definer functions" ON public.students;
CREATE POLICY "Authenticated users can manage students"
  ON public.students FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- Students contacts
DROP POLICY IF EXISTS "Access Student Contacts" ON public.students_contacts;
CREATE POLICY "Authenticated users can manage students_contacts"
  ON public.students_contacts FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- Users: restrict to own row only for SELECT (profile lookup)
DROP POLICY IF EXISTS "Access users" ON public.users;
CREATE POLICY "Users can read own profile"
  ON public.users FOR SELECT TO authenticated
  USING (auth.uid() = id);
-- Note: INSERT into public.users is done by handle_new_user trigger
-- (runs with definer privileges, bypasses RLS). No client INSERT/UPDATE needed.
