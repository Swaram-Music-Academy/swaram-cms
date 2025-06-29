import { supabase } from "@/lib/supabase";
import { getAcademicYear } from "@/lib/utils/date";

export const batchKeys = {
  getBatches: () => ["batches"],
  getBatchById: (id: string) => ["batches", id],
};

export const batchFns = {
  getBatchesFn: async () => {
    const year = getAcademicYear();
    const { data, error } = await supabase
      .from("batches")
      .select()
      .eq("academic_year", year);
    if (error) {
      throw error;
    }
    return data;
  },
  getBatchByIdFn: async (id: string) => {
    const { data, error } = await supabase
      .from("batches")
      .select(`*, batch_year_courses(*, courses(*)), batch_schedules(*)`)
      .eq("id", id)
      .single();
    if (error) {
      throw error;
    }
    return data;
  },
};
