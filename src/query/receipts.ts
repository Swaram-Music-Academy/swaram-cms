import { supabase } from "@/lib/supabase";

export const receiptKeys = {
  getReceipt: (id: string) => ["receipts", id],
};

export const receiptFns = {
  getReceiptFn: async (id: string) => {
    const { data, error: receiptError } = await supabase
      .from("receipts")
      .select(`*`)
      .eq("id", id)
      .single();
    if (receiptError) {
      throw receiptError;
    }

    const { data: installment, error: installmentError } = await supabase
      .from("student_installments")
      .select("*, student_fee_summary(year_number, courses(*))")
      .eq("receipt_id", id)
      .maybeSingle();
    if (installmentError) throw installmentError;

    if (installment) {
      return {
        ...data,
        description: `${installment.student_fee_summary?.courses?.name} ${installment.student_fee_summary?.year_number} - Installment #${installment.installment_number}`,
      };
    }

    return {
      ...data,
      description: "Registeration Fees",
    };
  },
};
