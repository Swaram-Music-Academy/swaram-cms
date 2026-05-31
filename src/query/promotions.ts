import { supabase } from "@/lib/supabase";

export type PromotionBatchOption = {
  id: string;
  batchId: string;
  batchName: string;
  courseId: string;
  courseName: string;
  yearNumber: number;
  durationYears: number;
  studentCount: number;
};

export type PromotionStudent = {
  enrollmentId: string;
  studentId: string;
  firstName: string;
  middleName: string | null;
  lastName: string;
  avatarUrl: string | null;
  currentYear: number;
  courseName: string;
  amountDue: number;
  pendingInstallments: number;
  fullyPaid: boolean;
};

export type TargetBatchOption = {
  batchId: string;
  batchName: string;
};

export const promotionKeys = {
  batchesForPromotion: () => ["promotion", "batches"],
  studentsInBatch: (batchId: string, courseId: string, year: number) => [
    "promotion",
    "students",
    batchId,
    courseId,
    year,
  ],
  targetBatches: (courseId: string, year: number) => [
    "promotion",
    "target-batches",
    courseId,
    year,
  ],
  history: () => ["promotion", "history"],
};

// Fetches batches with their course+year associations and enrolled student counts
export const promotionFns = {
  getBatchesForPromotion: async (): Promise<PromotionBatchOption[]> => {
    const { data, error } = await supabase
      .from("batch_year_courses")
      .select("*, batches(*), courses(*)");
    if (error) throw error;

    // Get enrollment counts per batch+course+year
    const { data: enrollments, error: enrollError } = await supabase
      .from("enrollments")
      .select("id, batch_id, course_id, current_year")
      .eq("status", "Enrolled");
    if (enrollError) throw enrollError;

    // Group and count
    const countMap = new Map<string, number>();
    enrollments.forEach((e) => {
      const key = `${e.batch_id}_${e.course_id}_${e.current_year}`;
      countMap.set(key, (countMap.get(key) || 0) + 1);
    });

    return data
      .filter((byc) => byc.id && byc.batch_id && byc.course_id && byc.year_number && byc.batches && byc.courses)
      .map((byc) => ({
      id: byc.id,
      batchId: byc.batch_id!,
      batchName: byc.batches!.name,
      courseId: byc.course_id!,
      courseName: byc.courses!.name,
      yearNumber: byc.year_number!,
      durationYears: Number(byc.courses!.duration_years),
      studentCount:
        countMap.get(
          `${byc.batch_id}_${byc.course_id}_${byc.year_number}`
        ) || 0,
    }));
  },

  getStudentsInBatch: async (
    batchId: string,
    courseId: string,
    year: number
  ): Promise<PromotionStudent[]> => {
    const { data, error } = await supabase
      .from("enrollments")
      .select(
        `id, student_id, current_year,
         students(id, first_name, middle_name, last_name, avatar_url),
         courses(name)`
      )
      .eq("batch_id", batchId)
      .eq("course_id", courseId)
      .eq("current_year", year)
      .eq("status", "Enrolled");
    if (error) throw error;

    // Get fee status for each student+course+year
    const studentIds = data.map((e) => e.student_id!);
    const { data: summaries, error: feeError } = await supabase
      .from("student_fee_summary")
      .select("student_id, year_number, status, student_installments(*)")
      .eq("course_id", courseId)
      .eq("year_number", year)
      .in("student_id", studentIds);
    if (feeError) throw feeError;

    const feeMap = new Map<
      string,
      { totalDue: number; totalPaid: number; pending: number }
    >();
    summaries?.forEach((s) => {
      let totalDue = 0;
      let totalPaid = 0;
      let pending = 0;
      s.student_installments.forEach((inst) => {
        totalDue += inst.installment_amount || 0;
        if (inst.payment_status === "Completed")
          totalPaid += inst.installment_amount || 0;
        else pending++;
      });
      feeMap.set(s.student_id!, { totalDue, totalPaid, pending });
    });

    return data.map((e) => {
      const fee = feeMap.get(e.student_id!) || {
        totalDue: 0,
        totalPaid: 0,
        pending: 0,
      };
      return {
        enrollmentId: e.id,
        studentId: e.student_id!,
        firstName: e.students!.first_name,
        middleName: e.students!.middle_name,
        lastName: e.students!.last_name,
        avatarUrl: e.students!.avatar_url,
        currentYear: e.current_year!,
        courseName: e.courses!.name,
        amountDue: fee.totalDue - fee.totalPaid,
        pendingInstallments: fee.pending,
        fullyPaid: fee.pending === 0,
      };
    });
  },

  getTargetBatches: async (courseId: string, targetYear: number): Promise<TargetBatchOption[]> => {
    const { data, error } = await supabase
      .from("batch_year_courses")
      .select("*, batches(*)")
      .eq("course_id", courseId)
      .eq("year_number", targetYear);
    if (error) throw error;

    // Deduplicate by batch id
    const seen = new Set<string>();
    return data
      .filter((b) => {
        if (!b.batch_id || !b.batches) return false;
        if (seen.has(b.batch_id)) return false;
        seen.add(b.batch_id);
        return true;
      })
      .map((b) => ({
        batchId: b.batch_id!,
        batchName: b.batches!.name,
      }));
  },

  promoteStudents: async (params: {
    enrollmentIds: string[];
    targetBatchId: string;
    newYear: number;
    sourceBatchId: string;
    courseId: string;
    fromYear: number;
    excludedIds: string[];
  }) => {
    const { data, error } = await supabase.rpc("promote_students", {
      p_enrollment_ids: params.enrollmentIds,
      p_target_batch_id: params.targetBatchId,
      p_new_year: params.newYear,
      p_source_batch_id: params.sourceBatchId,
      p_course_id: params.courseId,
      p_from_year: params.fromYear,
      p_excluded_ids: params.excludedIds,
    });
    if (error) throw error;
    return data;
  },

  getPromotionHistory: async () => {
    const { data, error } = await supabase
      .from("promotion_history")
      .select(
        `*, 
         source_batch:batches!promotion_history_source_batch_id_fkey(name),
         target_batch:batches!promotion_history_target_batch_id_fkey(name),
         courses(name)`
      )
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  },

  undoPromotion: async (historyId: string, enrollmentIds?: string[]) => {
    const { error } = await supabase.rpc("undo_promotion", {
      p_history_id: historyId,
      p_enrollment_ids: enrollmentIds,
    });
    if (error) throw error;
  },
};
