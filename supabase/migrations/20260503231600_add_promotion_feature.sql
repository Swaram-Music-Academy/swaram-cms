-- ============================================================
-- Year Promotion Feature
-- ============================================================

-- 1. Audit table for promotion history
CREATE TABLE IF NOT EXISTS promotion_history (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at        timestamptz NOT NULL DEFAULT now(),

  source_batch_id   uuid NOT NULL REFERENCES batches(id),
  target_batch_id   uuid NOT NULL REFERENCES batches(id),
  course_id         uuid NOT NULL REFERENCES courses(id),
  from_year         smallint NOT NULL,
  to_year           smallint NOT NULL,

  promoted_by       uuid REFERENCES auth.users(id),
  promotion_date    date NOT NULL DEFAULT CURRENT_DATE,

  enrollment_ids    uuid[] NOT NULL DEFAULT '{}',
  excluded_ids      uuid[] NOT NULL DEFAULT '{}'
);

-- 2. RPC: promote_students
--    Bumps current_year, reassigns batch, creates fee summaries.
--    Returns the promotion_history row id.
CREATE OR REPLACE FUNCTION promote_students(
  p_enrollment_ids   uuid[],
  p_target_batch_id  uuid,
  p_new_year         smallint,
  p_source_batch_id  uuid,
  p_course_id        uuid,
  p_from_year        smallint,
  p_excluded_ids     uuid[] DEFAULT '{}',
  p_promoted_by      uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  v_enrollment_id  uuid;
  v_history_id     uuid;
BEGIN
  -- Promote each selected enrollment
  FOREACH v_enrollment_id IN ARRAY p_enrollment_ids LOOP
    UPDATE enrollments
    SET current_year = p_new_year,
        batch_id     = p_target_batch_id
    WHERE id     = v_enrollment_id
      AND status = 'Enrolled';

    -- create_fee_summary reads the enrollment's new current_year
    PERFORM create_fee_summary(v_enrollment_id);
  END LOOP;

  -- Write audit record
  INSERT INTO promotion_history (
    source_batch_id, target_batch_id, course_id,
    from_year, to_year,
    promoted_by, enrollment_ids, excluded_ids
  ) VALUES (
    p_source_batch_id, p_target_batch_id, p_course_id,
    p_from_year, p_new_year,
    p_promoted_by, p_enrollment_ids, p_excluded_ids
  )
  RETURNING id INTO v_history_id;

  RETURN v_history_id;
END;
$$;

-- 3. RPC: undo_promotion
--    Reverts year + batch on selected (or all) enrollments from a
--    past promotion and cancels the fee summaries that were created.
CREATE OR REPLACE FUNCTION undo_promotion(
  p_history_id       uuid,
  p_enrollment_ids   uuid[] DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_history       promotion_history;
  v_enrollment_id uuid;
  v_target_ids    uuid[];
  v_summary_id    uuid;
  v_student_id    uuid;
  v_course_id     uuid;
BEGIN
  SELECT * INTO v_history FROM promotion_history WHERE id = p_history_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Promotion history record % not found', p_history_id;
  END IF;

  -- Determine which enrollments to undo
  v_target_ids := COALESCE(p_enrollment_ids, v_history.enrollment_ids);

  FOREACH v_enrollment_id IN ARRAY v_target_ids LOOP
    -- Get student + course from enrollment
    SELECT student_id, course_id
    INTO v_student_id, v_course_id
    FROM enrollments WHERE id = v_enrollment_id;

    -- Revert enrollment year and batch
    UPDATE enrollments
    SET current_year = v_history.from_year,
        batch_id     = v_history.source_batch_id
    WHERE id = v_enrollment_id;

    -- Find the fee summary that was created for the promoted year
    SELECT id INTO v_summary_id
    FROM student_fee_summary
    WHERE student_id  = v_student_id
      AND course_id   = v_course_id
      AND year_number  = v_history.to_year
      AND status       = 'Active';

    IF v_summary_id IS NOT NULL THEN
      -- Remove pending installments only (keep completed ones)
      DELETE FROM student_installments
      WHERE fee_summary_id = v_summary_id
        AND payment_status = 'Pending';

      -- Cancel the fee summary
      UPDATE student_fee_summary
      SET status = 'Cancelled'
      WHERE id = v_summary_id;
    END IF;
  END LOOP;

  -- Update the history record
  UPDATE promotion_history
  SET enrollment_ids = ARRAY(
        SELECT unnest(enrollment_ids)
        EXCEPT
        SELECT unnest(v_target_ids)
      ),
      excluded_ids = excluded_ids || v_target_ids
  WHERE id = p_history_id;
END;
$$;

-- 4. Update get_payment_history to filter by current year + overdue
DROP FUNCTION IF EXISTS get_payment_history(uuid);
CREATE OR REPLACE FUNCTION get_payment_history(p_student_id uuid)
RETURNS TABLE (
  due_date timestamp,
  fee_type text,
  description text,
  amount numeric,
  receipt_id uuid,
  payment_status text
)
LANGUAGE sql STABLE
AS $$
  WITH current_enrollments AS (
    SELECT course_id, current_year
    FROM enrollments
    WHERE student_id = p_student_id
      AND status = 'Enrolled'
  )
  (
    -- Current year installments (all statuses)
    SELECT
      coalesce(r.payment_date, si.due_date) as due_date,
      'Course Installment' as fee_type,
      'Installment #' || si.installment_number || ' (' || c.name || ' - Year ' || sfs.year_number || ')' as description,
      si.installment_amount as amount,
      si.receipt_id as receipt_id,
      si.payment_status::text as payment_status
    FROM student_installments si
    JOIN student_fee_summary sfs ON si.fee_summary_id = sfs.id
    JOIN courses c ON c.id = sfs.course_id
    JOIN current_enrollments ce ON ce.course_id = sfs.course_id AND ce.current_year = sfs.year_number
    LEFT JOIN receipts r ON r.id = si.receipt_id
    WHERE sfs.student_id = p_student_id
      AND sfs.status = 'Active'

    UNION ALL

    -- Previous year OVERDUE installments only
    SELECT
      coalesce(r.payment_date, si.due_date) as due_date,
      'Course Installment' as fee_type,
      'Installment #' || si.installment_number || ' (' || c.name || ' - Year ' || sfs.year_number || ') [OVERDUE]' as description,
      si.installment_amount as amount,
      si.receipt_id as receipt_id,
      si.payment_status::text as payment_status
    FROM student_installments si
    JOIN student_fee_summary sfs ON si.fee_summary_id = sfs.id
    JOIN courses c ON c.id = sfs.course_id
    LEFT JOIN current_enrollments ce ON ce.course_id = sfs.course_id AND ce.current_year = sfs.year_number
    LEFT JOIN receipts r ON r.id = si.receipt_id
    WHERE sfs.student_id = p_student_id
      AND sfs.status = 'Active'
      AND ce.course_id IS NULL
      AND si.payment_status = 'Pending'

    UNION ALL

    -- Registration Fee (always show)
    SELECT
      r.payment_date as due_date,
      'Registration Fee' as fee_type,
      'Admission Fee' as description,
      srf.registeration_fee as amount,
      srf.receipt_id as receipt_id,
      CASE WHEN srf.is_paid THEN 'Paid' ELSE 'Pending' END as payment_status
    FROM student_registeration_fees srf
    LEFT JOIN receipts r ON r.id = srf.receipt_id
    WHERE srf.student_id = p_student_id
  )
  ORDER BY due_date NULLS LAST;
$$;

-- 5. Fix add_installments_after_fee_summary to use current academic year
--    instead of hardcoded 2025 dates.
CREATE OR REPLACE FUNCTION add_installments_after_fee_summary()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  course_name text;
  per_installment int;
  remainder int;
  due_dates date[];
  num_installments int;
  acad_year int;
BEGIN
  -- Determine academic year: if current month < May, use previous year
  IF EXTRACT(MONTH FROM now()) < 5 THEN
    acad_year := EXTRACT(YEAR FROM now())::int - 1;
  ELSE
    acad_year := EXTRACT(YEAR FROM now())::int;
  END IF;

  SELECT name INTO course_name FROM courses WHERE id = new.course_id;

  IF course_name = 'Sitar' THEN
    num_installments := 4;
    due_dates := ARRAY[
      make_date(acad_year, 6, 21),
      make_date(acad_year, 9, 7),
      make_date(acad_year, 11, 24),
      make_date(acad_year + 1, 2, 10)
    ];
  ELSE
    num_installments := 2;
    due_dates := ARRAY[
      make_date(acad_year, 6, 21),
      make_date(acad_year, 11, 25)
    ];
  END IF;

  per_installment := floor(new.final_fees / num_installments);
  remainder := new.final_fees;

  FOR i IN 1..num_installments LOOP
    INSERT INTO student_installments (
      fee_summary_id, installment_number, installment_amount,
      due_date, payment_status, receipt_id
    ) VALUES (
      new.id, i,
      CASE WHEN i = num_installments THEN remainder ELSE per_installment END,
      due_dates[i], 'Pending', NULL
    );
    remainder := remainder - per_installment;
  END LOOP;

  RETURN new;
END;
$$;
