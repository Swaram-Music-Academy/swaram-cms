import { supabase } from "@/lib/supabase";

export const enrollmentKeys = {
  getEnrollmentByStudentId: (id: string) => ["enrollments", id],
};

export const enrollmentFns = {
  getEnrollmentByStudentIdFn: async (id: string) => {
    const { data, error } = await supabase
      .from("enrollments")
      .select("*, courses(*), batches(*)")
      .eq("student_id", id);
    if (error) {
      throw error;
    }
    return data;
  },
};
