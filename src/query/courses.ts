import { supabase } from "@/lib/supabase";

export const courseKeys = {
  getCourses: () => ["courses"],
  getCourseById: (id: string) => ["courses", id],
};

export const courseFns = {
  getCoursesFn: async () => {
    const { data, error } = await supabase.from("courses").select();
    if (error) {
      throw error;
    }
    return data;
  },
  getCourseByIdFn: async (id: string) => {
    const { data, error } = await supabase
      .from("courses")
      .select(`*, fee_structures(*)`)
      .eq("id", id)
      .single();
    if (error) {
      throw error;
    }
    return data;
  },
};
