

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."days" AS ENUM (
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday',
    ''
);


ALTER TYPE "public"."days" OWNER TO "postgres";


CREATE TYPE "public"."enrollment_status" AS ENUM (
    'Enrolled',
    'Completed',
    'Dropped'
);


ALTER TYPE "public"."enrollment_status" OWNER TO "postgres";


CREATE TYPE "public"."fee_status" AS ENUM (
    'Active',
    'Cancelled'
);


ALTER TYPE "public"."fee_status" OWNER TO "postgres";


CREATE TYPE "public"."gender" AS ENUM (
    'Male',
    'Female'
);


ALTER TYPE "public"."gender" OWNER TO "postgres";


CREATE TYPE "public"."payment_status" AS ENUM (
    'Pending',
    'Completed'
);


ALTER TYPE "public"."payment_status" OWNER TO "postgres";


CREATE TYPE "public"."payment_type" AS ENUM (
    'Cash',
    'Cheque',
    'UPI'
);


ALTER TYPE "public"."payment_type" OWNER TO "postgres";


CREATE TYPE "public"."relation" AS ENUM (
    'Self',
    'Father',
    'Mother',
    'Guardian'
);


ALTER TYPE "public"."relation" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."add_installments_after_fee_summary"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
declare
  course_name text;
  per_installment int;
  remainder int;
  due_dates date[];
  num_installments int;
begin
  -- Fetch the course name
  select name into course_name from courses where id = new.course_id;

  if course_name = 'Sitar' then
    num_installments := 4;
    due_dates := ARRAY[
      date '2025-06-21',
      date '2025-09-07',
      date '2025-11-24',
      date '2026-02-10'
    ];
  else
    num_installments := 2;
    due_dates := ARRAY[
      date '2025-06-21',
      date '2025-11-25'
    ];
  end if;

  -- Calculate clean split
  per_installment := floor(new.final_fees / num_installments);
  remainder := new.final_fees;

  for i in 1..num_installments loop
    insert into student_installments (
      fee_summary_id,
      installment_number,
      installment_amount,
      due_date,
      payment_status,
      receipt_id
    )
    values (
      new.id,
      i,
      case when i = num_installments then remainder else per_installment end,
      due_dates[i],
      'Pending',
      null
    );

    remainder := remainder - per_installment;
  end loop;

  return new;
end;
$$;


ALTER FUNCTION "public"."add_installments_after_fee_summary"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."add_registration_fee_on_student_insert"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
declare
  fixed_fee numeric := 1500; -- set your default registration fee here
begin
  insert into student_registeration_fees (
    student_id,
    registeration_fee,
    is_paid,
    receipt_id
  )
  values (
    new.id,
    fixed_fee,
    false,
    null
  );

  return new;
end;
$$;


ALTER FUNCTION "public"."add_registration_fee_on_student_insert"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_batch_times"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF NEW.start_time > NEW.end_time THEN
    RAISE EXCEPTION 'Start time must be earlier than end time.';
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."check_batch_times"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_fee_summary"("enrollment_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
declare
  v_course_id uuid;
  v_student_id uuid;
  v_year_number integer;
  v_total_fee numeric;
begin
  -- Step 1: Get enrollment details
  select course_id, student_id, current_year
  into v_course_id, v_student_id, v_year_number
  from enrollments
  where id = enrollment_id;

  -- Step 2: Get fee structure for course and year
  select total_fee into v_total_fee
  from fee_structures
  where course_id = v_course_id and year_number = v_year_number;

  if v_total_fee is null then
    raise exception 'No fee structure found for course % and year %', v_course_id, v_year_number;
  end if;

  -- Step 3: Insert into student_fee_summary
  insert into student_fee_summary (
    course_id, student_id, year_number,
    total_fees, discount
  )
  values (
    v_course_id, v_student_id, v_year_number,
    v_total_fee, 0
  );
end;
$$;


ALTER FUNCTION "public"."create_fee_summary"("enrollment_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_payment_history"("p_student_id" "uuid") RETURNS TABLE("due_date" "date", "fee_type" "text", "description" "text", "amount" numeric, "receipt_id" "uuid", "payment_status" "text")
    LANGUAGE "sql"
    AS $$
  (
    -- Course Installments
    select
      coalesce(r.payment_date, si.due_date) as due_date,
      'Course Installment' as fee_type,
      'Installment #' || si.installment_number || ' (' || c.name || ')' as description,
      si.installment_amount as amount,
      si.receipt_id as receipt_id,
      si.payment_status::text as payment_status
    from student_installments si
    join student_fee_summary sfs on si.fee_summary_id = sfs.id
    join courses c on c.id = sfs.course_id  -- 👈 join to get course name
    left join receipts r on r.id = si.receipt_id
    where sfs.student_id = p_student_id

    union all

    -- Registration Fee
    select
      r.payment_date as due_date,
      'Registration Fee' as fee_type,
      'Admission Fee' as description,
      srf.registeration_fee as amount,
      srf.receipt_id as receipt_id,
      case when srf.is_paid then 'Paid' else 'Pending' end as payment_status
    from student_registeration_fees srf
    left join receipts r on r.id = srf.receipt_id
    where srf.student_id = p_student_id
  )
  order by due_date nulls last
$$;


ALTER FUNCTION "public"."get_payment_history"("p_student_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_timetable_by_slot"() RETURNS json
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_object_agg(start_hour, days_map) INTO result
  FROM (
    SELECT 
      start_hour,
      json_object_agg(day_of_week, sessions) AS days_map
    FROM (
      SELECT 
        to_char(bs.start_time, 'HH24:MI') AS start_hour,
        bs.day_of_week,
        json_agg(
          json_build_object(
            'id', bs.id,
            'name', b.name,
            'start_time', bs.start_time,
            'end_time', bs.end_time
          ) ORDER BY bs.start_time
        ) AS sessions
      FROM batch_schedules bs
      INNER JOIN batches b ON b.id = bs.batch_id
      GROUP BY start_hour, bs.day_of_week
    ) AS inner_group
    GROUP BY start_hour
  ) AS outer_group;

  RETURN result;
END;
$$;


ALTER FUNCTION "public"."get_timetable_by_slot"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_enrollment_drop"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  -- Only act if status changed to 'dropped'
  if new.status = 'Dropped' and old.status != 'Dropped' then
    update student_fee_summary
    set status = 'Cancelled'
    where student_id = new.student_id
      and course_id = new.course_id
      and year_number = new.current_year;
  end if;

  return new;
end;
$$;


ALTER FUNCTION "public"."handle_enrollment_drop"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
begin
  insert into public.users (id, created_at)
  values (new.id, now());
  return new;
end;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_installments_after_fee_change"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
declare
  course_name text;
  per_installment int;
  remainder int;
  due_dates date[];
  num_installments int;
begin
  -- Only react if total_fees changed
  if new.discount is distinct from old.discount then
    -- Delete existing installments
    delete from student_installments where fee_summary_id = new.id;

    -- Get course name
    select name into course_name from courses where id = new.course_id;

    if course_name = 'Sitar' then
      num_installments := 4;
      due_dates := ARRAY[
        date '2025-06-21',
        date '2025-09-07',
        date '2025-11-24',
        date '2026-02-10'
      ];
    else
      num_installments := 2;
      due_dates := ARRAY[
        date '2025-06-21',
        date '2025-11-25'
      ];
    end if;

    -- Calculate new values
    per_installment := floor(new.final_fees / num_installments);
    remainder := new.final_fees;

    for i in 1..num_installments loop
      insert into student_installments (
        fee_summary_id,
        installment_number,
        installment_amount,
        due_date,
        payment_status,
        receipt_id
      )
      values (
        new.id,
        i,
        case when i = num_installments then remainder else per_installment end,
        due_dates[i],
        'Pending',
        null
      );

      remainder := remainder - per_installment;
    end loop;
  end if;

  return new;
end;
$$;


ALTER FUNCTION "public"."update_installments_after_fee_change"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."addresses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "unit" "text",
    "line_1" "text" NOT NULL,
    "line_2" "text",
    "city" "text" NOT NULL,
    "state" "text" NOT NULL,
    "country" "text" NOT NULL,
    "zipcode" "text" NOT NULL,
    "created_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."addresses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."batch_schedules" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "batch_id" "uuid",
    "start_time" time without time zone,
    "end_time" time without time zone,
    "day_of_week" "public"."days"
);


ALTER TABLE "public"."batch_schedules" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."batch_year_courses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "year_number" smallint,
    "course_id" "uuid",
    "batch_id" "uuid"
);


ALTER TABLE "public"."batch_year_courses" OWNER TO "postgres";


COMMENT ON TABLE "public"."batch_year_courses" IS 'Many-to-many mapping between courses and batches tables';



CREATE TABLE IF NOT EXISTS "public"."batches" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "name" character varying NOT NULL,
    "description" character varying,
    "academic_year" smallint,
    "start_date" "date",
    "end_date" "date"
);


ALTER TABLE "public"."batches" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."contacts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "contact_name" "text" NOT NULL,
    "phone" "text" NOT NULL,
    "email" "text",
    "whatsapp_num" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."contacts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."courses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "name" character varying DEFAULT '''''::character varying'::character varying NOT NULL,
    "duration_years" bigint DEFAULT '1'::bigint NOT NULL,
    "description" "text"
);


ALTER TABLE "public"."courses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."enrollments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "student_id" "uuid",
    "course_id" "uuid",
    "batch_id" "uuid",
    "current_year" smallint,
    "enrollment_date" timestamp without time zone DEFAULT "now"(),
    "completion_date" timestamp without time zone,
    "status" "public"."enrollment_status" DEFAULT 'Enrolled'::"public"."enrollment_status"
);


ALTER TABLE "public"."enrollments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."fee_structures" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "course_id" "uuid",
    "year_number" smallint,
    "total_fee" integer
);


ALTER TABLE "public"."fee_structures" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."receipts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "receipt_number" integer NOT NULL,
    "payee" "text",
    "amount" integer,
    "payment_date" timestamp without time zone DEFAULT "now"(),
    "payment_method" "public"."payment_type",
    "reference_number" "text"
);


ALTER TABLE "public"."receipts" OWNER TO "postgres";


ALTER TABLE "public"."receipts" ALTER COLUMN "receipt_number" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."receipts_receipt_number_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."roles" (
    "name" "text",
    "description" "text",
    "permissions" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL
);


ALTER TABLE "public"."roles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."student_fee_summary" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "course_id" "uuid",
    "student_id" "uuid",
    "year_number" smallint,
    "total_fees" integer,
    "discount" integer,
    "status" "public"."fee_status" DEFAULT 'Active'::"public"."fee_status",
    "final_fees" integer GENERATED ALWAYS AS (("total_fees" - "discount")) STORED
);


ALTER TABLE "public"."student_fee_summary" OWNER TO "postgres";


COMMENT ON TABLE "public"."student_fee_summary" IS 'Records of all payments done by student';



CREATE TABLE IF NOT EXISTS "public"."student_installments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "fee_summary_id" "uuid",
    "installment_number" smallint,
    "installment_amount" integer,
    "due_date" timestamp without time zone,
    "payment_status" "public"."payment_status",
    "receipt_id" "uuid",
    "academic_year" smallint
);


ALTER TABLE "public"."student_installments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."student_registeration_fees" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "student_id" "uuid",
    "registeration_fee" smallint DEFAULT '1500'::smallint,
    "is_paid" boolean DEFAULT false,
    "receipt_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."student_registeration_fees" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."students" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "first_name" "text" NOT NULL,
    "middle_name" "text",
    "last_name" "text" NOT NULL,
    "avatar_url" "text",
    "date_of_birth" "date" NOT NULL,
    "address_id" "uuid",
    "gender" "public"."gender" NOT NULL,
    "admission_date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "gr_no" smallint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."students" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."students_contacts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "contact_id" "uuid" NOT NULL,
    "student_id" "uuid" NOT NULL,
    "occupation" "text",
    "relationship" "public"."relation",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."students_contacts" OWNER TO "postgres";


ALTER TABLE "public"."students" ALTER COLUMN "gr_no" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."students_gr_no_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."users" (
    "name" "text",
    "avatar_url" "text",
    "role_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL
);


ALTER TABLE "public"."users" OWNER TO "postgres";


ALTER TABLE ONLY "public"."addresses"
    ADD CONSTRAINT "addresses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."batch_schedules"
    ADD CONSTRAINT "batch_schedule_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."batch_year_courses"
    ADD CONSTRAINT "batch_year_courses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."batches"
    ADD CONSTRAINT "batches_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."contacts"
    ADD CONSTRAINT "contacts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."courses"
    ADD CONSTRAINT "courses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."enrollments"
    ADD CONSTRAINT "enrollments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."fee_structures"
    ADD CONSTRAINT "fee_structures_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."receipts"
    ADD CONSTRAINT "receipts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."roles"
    ADD CONSTRAINT "roles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."student_fee_summary"
    ADD CONSTRAINT "student_fee_summary_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."student_installments"
    ADD CONSTRAINT "student_installments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."student_registeration_fees"
    ADD CONSTRAINT "student_registeration_fees_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."students_contacts"
    ADD CONSTRAINT "students_contacts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."students"
    ADD CONSTRAINT "students_gr_no_key" UNIQUE ("gr_no");



ALTER TABLE ONLY "public"."students"
    ADD CONSTRAINT "students_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



CREATE OR REPLACE TRIGGER "enforce_batch_timings" BEFORE INSERT ON "public"."batch_schedules" FOR EACH ROW EXECUTE FUNCTION "public"."check_batch_times"();



CREATE OR REPLACE TRIGGER "trg_add_registration_fee" AFTER INSERT ON "public"."students" FOR EACH ROW EXECUTE FUNCTION "public"."add_registration_fee_on_student_insert"();



CREATE OR REPLACE TRIGGER "trg_create_installments" AFTER INSERT ON "public"."student_fee_summary" FOR EACH ROW EXECUTE FUNCTION "public"."add_installments_after_fee_summary"();



CREATE OR REPLACE TRIGGER "trg_enrollment_drop" AFTER UPDATE ON "public"."enrollments" FOR EACH ROW WHEN (("old"."status" IS DISTINCT FROM "new"."status")) EXECUTE FUNCTION "public"."handle_enrollment_drop"();



CREATE OR REPLACE TRIGGER "trg_update_installments_on_fee_change" AFTER UPDATE ON "public"."student_fee_summary" FOR EACH ROW EXECUTE FUNCTION "public"."update_installments_after_fee_change"();



ALTER TABLE ONLY "public"."batch_schedules"
    ADD CONSTRAINT "batch_schedule_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "public"."batches"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."batch_year_courses"
    ADD CONSTRAINT "batch_year_courses_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "public"."batches"("id") ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY "public"."batch_year_courses"
    ADD CONSTRAINT "batch_year_courses_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY "public"."enrollments"
    ADD CONSTRAINT "enrollments_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "public"."batches"("id") ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY "public"."enrollments"
    ADD CONSTRAINT "enrollments_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY "public"."enrollments"
    ADD CONSTRAINT "enrollments_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."fee_structures"
    ADD CONSTRAINT "fee_structures_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."student_fee_summary"
    ADD CONSTRAINT "student_fee_summary_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY "public"."student_fee_summary"
    ADD CONSTRAINT "student_fee_summary_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."student_installments"
    ADD CONSTRAINT "student_installments_fee_summary_id_fkey" FOREIGN KEY ("fee_summary_id") REFERENCES "public"."student_fee_summary"("id") ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY "public"."student_installments"
    ADD CONSTRAINT "student_installments_receipt_id_fkey" FOREIGN KEY ("receipt_id") REFERENCES "public"."receipts"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."student_registeration_fees"
    ADD CONSTRAINT "student_registeration_fees_receipt_id_fkey" FOREIGN KEY ("receipt_id") REFERENCES "public"."receipts"("id") ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY "public"."student_registeration_fees"
    ADD CONSTRAINT "student_registeration_fees_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."students"
    ADD CONSTRAINT "students_address_id_fkey" FOREIGN KEY ("address_id") REFERENCES "public"."addresses"("id");



ALTER TABLE ONLY "public"."students_contacts"
    ADD CONSTRAINT "students_contacts_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."students_contacts"
    ADD CONSTRAINT "students_contacts_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



CREATE POLICY "Authenticated users can manage addresses" ON "public"."addresses" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Authenticated users can manage batch_schedules" ON "public"."batch_schedules" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Authenticated users can manage batch_year_courses" ON "public"."batch_year_courses" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Authenticated users can manage batches" ON "public"."batches" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Authenticated users can manage contacts" ON "public"."contacts" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Authenticated users can manage courses" ON "public"."courses" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Authenticated users can manage enrollments" ON "public"."enrollments" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Authenticated users can manage fee_structures" ON "public"."fee_structures" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Authenticated users can manage receipts" ON "public"."receipts" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Authenticated users can manage roles" ON "public"."roles" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Authenticated users can manage student_fee_summary" ON "public"."student_fee_summary" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Authenticated users can manage student_installments" ON "public"."student_installments" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Authenticated users can manage student_registeration_fees" ON "public"."student_registeration_fees" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Authenticated users can manage students" ON "public"."students" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Authenticated users can manage students_contacts" ON "public"."students_contacts" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Users can read own profile" ON "public"."users" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "id"));



ALTER TABLE "public"."addresses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."batch_schedules" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."batch_year_courses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."batches" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."contacts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."courses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."enrollments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."fee_structures" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."receipts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."roles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."student_fee_summary" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."student_installments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."student_registeration_fees" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."students" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."students_contacts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."addresses";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."batch_schedules";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."batch_year_courses";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."batches";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."contacts";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."courses";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."enrollments";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."fee_structures";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."receipts";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."roles";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."student_fee_summary";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."student_installments";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."student_registeration_fees";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."students";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."students_contacts";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."users";



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."add_installments_after_fee_summary"() TO "anon";
GRANT ALL ON FUNCTION "public"."add_installments_after_fee_summary"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."add_installments_after_fee_summary"() TO "service_role";



GRANT ALL ON FUNCTION "public"."add_registration_fee_on_student_insert"() TO "anon";
GRANT ALL ON FUNCTION "public"."add_registration_fee_on_student_insert"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."add_registration_fee_on_student_insert"() TO "service_role";



GRANT ALL ON FUNCTION "public"."check_batch_times"() TO "anon";
GRANT ALL ON FUNCTION "public"."check_batch_times"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_batch_times"() TO "service_role";



GRANT ALL ON FUNCTION "public"."create_fee_summary"("enrollment_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."create_fee_summary"("enrollment_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_fee_summary"("enrollment_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_payment_history"("p_student_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_payment_history"("p_student_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_payment_history"("p_student_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_timetable_by_slot"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_timetable_by_slot"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_timetable_by_slot"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_enrollment_drop"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_enrollment_drop"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_enrollment_drop"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_installments_after_fee_change"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_installments_after_fee_change"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_installments_after_fee_change"() TO "service_role";


















GRANT ALL ON TABLE "public"."addresses" TO "anon";
GRANT ALL ON TABLE "public"."addresses" TO "authenticated";
GRANT ALL ON TABLE "public"."addresses" TO "service_role";



GRANT ALL ON TABLE "public"."batch_schedules" TO "anon";
GRANT ALL ON TABLE "public"."batch_schedules" TO "authenticated";
GRANT ALL ON TABLE "public"."batch_schedules" TO "service_role";



GRANT ALL ON TABLE "public"."batch_year_courses" TO "anon";
GRANT ALL ON TABLE "public"."batch_year_courses" TO "authenticated";
GRANT ALL ON TABLE "public"."batch_year_courses" TO "service_role";



GRANT ALL ON TABLE "public"."batches" TO "anon";
GRANT ALL ON TABLE "public"."batches" TO "authenticated";
GRANT ALL ON TABLE "public"."batches" TO "service_role";



GRANT ALL ON TABLE "public"."contacts" TO "anon";
GRANT ALL ON TABLE "public"."contacts" TO "authenticated";
GRANT ALL ON TABLE "public"."contacts" TO "service_role";



GRANT ALL ON TABLE "public"."courses" TO "anon";
GRANT ALL ON TABLE "public"."courses" TO "authenticated";
GRANT ALL ON TABLE "public"."courses" TO "service_role";



GRANT ALL ON TABLE "public"."enrollments" TO "anon";
GRANT ALL ON TABLE "public"."enrollments" TO "authenticated";
GRANT ALL ON TABLE "public"."enrollments" TO "service_role";



GRANT ALL ON TABLE "public"."fee_structures" TO "anon";
GRANT ALL ON TABLE "public"."fee_structures" TO "authenticated";
GRANT ALL ON TABLE "public"."fee_structures" TO "service_role";



GRANT ALL ON TABLE "public"."receipts" TO "anon";
GRANT ALL ON TABLE "public"."receipts" TO "authenticated";
GRANT ALL ON TABLE "public"."receipts" TO "service_role";



GRANT ALL ON SEQUENCE "public"."receipts_receipt_number_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."receipts_receipt_number_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."receipts_receipt_number_seq" TO "service_role";



GRANT ALL ON TABLE "public"."roles" TO "anon";
GRANT ALL ON TABLE "public"."roles" TO "authenticated";
GRANT ALL ON TABLE "public"."roles" TO "service_role";



GRANT ALL ON TABLE "public"."student_fee_summary" TO "anon";
GRANT ALL ON TABLE "public"."student_fee_summary" TO "authenticated";
GRANT ALL ON TABLE "public"."student_fee_summary" TO "service_role";



GRANT ALL ON TABLE "public"."student_installments" TO "anon";
GRANT ALL ON TABLE "public"."student_installments" TO "authenticated";
GRANT ALL ON TABLE "public"."student_installments" TO "service_role";



GRANT ALL ON TABLE "public"."student_registeration_fees" TO "anon";
GRANT ALL ON TABLE "public"."student_registeration_fees" TO "authenticated";
GRANT ALL ON TABLE "public"."student_registeration_fees" TO "service_role";



GRANT ALL ON TABLE "public"."students" TO "anon";
GRANT ALL ON TABLE "public"."students" TO "authenticated";
GRANT ALL ON TABLE "public"."students" TO "service_role";



GRANT ALL ON TABLE "public"."students_contacts" TO "anon";
GRANT ALL ON TABLE "public"."students_contacts" TO "authenticated";
GRANT ALL ON TABLE "public"."students_contacts" TO "service_role";



GRANT ALL ON SEQUENCE "public"."students_gr_no_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."students_gr_no_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."students_gr_no_seq" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";






























drop extension if exists "pg_net";

CREATE TRIGGER on_auth_user_insert AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


  create policy "Give users authenticated access to folder v0xl7c_0"
  on "storage"."objects"
  as permissive
  for select
  to authenticated
using (((bucket_id = 'students'::text) AND ((storage.foldername(name))[1] = 'private'::text) AND (auth.role() = 'authenticated'::text)));



  create policy "Give users authenticated access to folder v0xl7c_1"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check ((bucket_id = 'students'::text));



  create policy "Give users authenticated access to folder v0xl7c_2"
  on "storage"."objects"
  as permissive
  for update
  to authenticated
using ((bucket_id = 'students'::text));



  create policy "Give users authenticated access to folder v0xl7c_3"
  on "storage"."objects"
  as permissive
  for delete
  to authenticated
using ((bucket_id = 'students'::text));



