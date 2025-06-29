import { supabase } from "@/lib/supabase";

export const studentKeys = {
  getStudents: () => ["students"],
  getStudentById: (id: string) => ["students", id],
};

export const studentFns = {
  getStudentsFn: async () => {
    const { data, error } = await supabase.from("students").select();
    if (error) {
      throw error;
    }
    return data;
  },
  getStudentByIdFn: async (id: string) => {
    const { data, error } = await supabase
      .from("students")
      .select(
        "*, students_contacts(contacts(*), *), addresses(*), student_fee_summary(*), enrollments(*, courses(*), batches(*))"
      )
      .eq("id", id)
      .limit(1)
      .single();
    if (error) {
      throw error;
    }
    return data;
  },
};
