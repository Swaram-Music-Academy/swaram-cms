import { supabase } from "@/lib/supabase";

type SummaryRecord = {
  fee_type: string;
  course: string | undefined | null;
  year: number | undefined | null;
  amount: number;
  created_at: string;
};

type HistoryRecord = {
  paid_on: string | null;
  description: string;
  amount: number | null;
  paid_by: string | null;
  receipt_url: string | null;
};

export const feeKeys = {
  getPaymentSchedule: (id: string) => ["fees-schedule", id],
  getSummary: (id: string) => ["fee-summary", id],
  getPaymentHistory: (id: string) => ["fees", id],
  getFeeReceipt: (id: string) => ["receipts", id],
};

export const feeFns = {
  getPaymentSchedule: async (studentId: string) => {
    const { data, error } = await supabase.rpc("get_payment_history", {
      p_student_id: studentId,
    });
    if (error) throw error;
    return data;
  },
  getSummary: async (studentId: string) => {
    const { data: feeSummary, error: feeError } = await supabase
      .from("student_fee_summary")
      .select("*, courses(name)")
      .eq("student_id", studentId);

    const { data: regSummary, error: regError } = await supabase
      .from("student_registeration_fees")
      .select("*")
      .eq("student_id", studentId);

    const courseSummary: SummaryRecord[] =
      feeSummary?.map((record) => ({
        fee_type: "Course",
        course: record.courses?.name ?? null,
        year: record.year_number ?? null,
        amount: record.final_fees ?? 0,
        created_at: record.created_at ?? new Date().toISOString(),
      })) ?? [];

    const registrationSummary: SummaryRecord[] =
      regSummary?.map((record) => ({
        fee_type: "Registration",
        course: null,
        year: null,
        amount: record.registeration_fee ?? 0,
        created_at: record.created_at ?? new Date().toISOString(),
      })) ?? [];
    // Combine both into result
    const result: SummaryRecord[] = [...courseSummary, ...registrationSummary];

    result?.sort(
      (a, b) =>
        new Date(b.created_at!).valueOf() - new Date(a.created_at!).valueOf()
    );
    if (feeError || regError) throw feeError ? feeError : regError;
    return result;
  },
  getPaymentHistory: async (id: string) => {
    const { data: installmentData, error } = await supabase
      .from("student_fee_summary")
      .select(`*, courses(*), student_installments(*, receipts(*))`)
      .eq("student_id", id);
    if (error) throw error;
    const { data: regData, error: regFeesError } = await supabase
      .from("student_registeration_fees")
      .select(`*, receipts(*)`)
      .eq("student_id", id)
      .eq("is_paid", true);
    if (regFeesError) throw regFeesError;

    const records: HistoryRecord[] = [];

    // Convert Installments into history record.
    installmentData
      .filter((record) => record.status === "Active")
      .forEach((summary) => {
        summary.student_installments
          .filter((installment) => installment.payment_status === "Completed")
          .forEach((installment) =>
            records.push({
              paid_on: installment.receipts!.payment_date,
              paid_by: installment.receipts!.payee,
              amount: installment.receipts!.amount,
              receipt_url: installment.receipts!.id,
              description: `${summary.courses?.name} - Year ${summary.year_number} (Installment #${installment.installment_number})`,
            })
          );
      });

    // Convert Registeration fee into history record.
    if (regData[0])
      records.push({
        paid_on: regData[0].receipts!.payment_date,
        paid_by: regData[0].receipts!.payee,
        amount: regData[0].registeration_fee,
        description: "Registeration Fee",
        receipt_url: regData[0].receipts!.id,
      });

    return records;
  },
  getFeeReceipt: async (id: string) => {
    return [id];
  },
};
