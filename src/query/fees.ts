import { supabase } from "@/lib/supabase";

type SummaryRecord = {
  fee_type: string;
  course: string | undefined | null;
  year: number | undefined | null;
  amount: number;
  created_at: string;
  hasPending?: boolean;
};

type HistoryRecord = {
  paid_on: string | null;
  description: string;
  amount: number | null;
  paid_by: string | null;
  receipt_url: string | null;
  status?: "paid" | "upcoming" | "overdue";
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
    // Get current enrollment years for this student
    const { data: enrollments, error: enrollError } = await supabase
      .from("enrollments")
      .select("course_id, current_year")
      .eq("student_id", studentId)
      .eq("status", "Enrolled");
    if (enrollError) throw enrollError;

    const currentYearMap = new Map<string, number>();
    enrollments?.forEach((e) => {
      if (e.course_id && e.current_year)
        currentYearMap.set(e.course_id, e.current_year);
    });

    const { data: feeSummary, error: feeError } = await supabase
      .from("student_fee_summary")
      .select("*, courses(name), student_installments(payment_status)")
      .eq("student_id", studentId)
      .eq("status", "Active");
    if (feeError) throw feeError;

    const { data: regSummary, error: regError } = await supabase
      .from("student_registeration_fees")
      .select("*")
      .eq("student_id", studentId);
    if (regError) throw regError;

    // Only show current year OR older years that still have pending installments
    const courseSummary: SummaryRecord[] =
      feeSummary
        ?.filter((record) => {
          const currentYear = currentYearMap.get(record.course_id!) ?? 0;
          const isCurrentYear = record.year_number === currentYear;
          const hasPending = record.student_installments?.some(
            (i) => i.payment_status === "Pending"
          );
          return isCurrentYear || hasPending;
        })
        .map((record) => {
          const currentYear = currentYearMap.get(record.course_id!) ?? 0;
          const hasPending = record.student_installments?.some(
            (i) => i.payment_status === "Pending"
          );
          return {
            fee_type: "Course",
            course: record.courses?.name ?? null,
            year: record.year_number ?? null,
            amount: record.final_fees ?? 0,
            created_at: record.created_at ?? new Date().toISOString(),
            hasPending:
              record.year_number !== currentYear && hasPending ? true : false,
          };
        }) ?? [];

    // Only show registration fee if unpaid
    const registrationSummary: SummaryRecord[] =
      regSummary
        ?.filter((record) => !record.is_paid)
        .map((record) => ({
          fee_type: "Registration",
          course: null,
          year: null,
          amount: record.registeration_fee ?? 0,
          created_at: record.created_at ?? new Date().toISOString(),
        })) ?? [];

    const result: SummaryRecord[] = [...courseSummary, ...registrationSummary];
    result.sort(
      (a, b) =>
        new Date(b.created_at!).valueOf() - new Date(a.created_at!).valueOf()
    );
    return result;
  },
  getPaymentHistory: async (id: string) => {
    // Get current enrollment years
    const { data: enrollments, error: enrollError } = await supabase
      .from("enrollments")
      .select("course_id, current_year")
      .eq("student_id", id)
      .eq("status", "Enrolled");
    if (enrollError) throw enrollError;

    const currentYearMap = new Map<string, number>();
    enrollments?.forEach((e) => {
      if (e.course_id && e.current_year)
        currentYearMap.set(e.course_id, e.current_year);
    });

    const { data: installmentData, error } = await supabase
      .from("student_fee_summary")
      .select(`*, courses(*), student_installments(*, receipts(*))`)
      .eq("student_id", id)
      .eq("status", "Active");
    if (error) throw error;

    const { data: regData, error: regFeesError } = await supabase
      .from("student_registeration_fees")
      .select(`*, receipts(*)`)
      .eq("student_id", id);
    if (regFeesError) throw regFeesError;

    const now = new Date();
    const records: HistoryRecord[] = [];

    installmentData
      .filter((record) => record.status === "Active")
      .forEach((summary) => {
        const currentYear = currentYearMap.get(summary.course_id!) ?? 0;
        const isCurrentYear = summary.year_number === currentYear;

        summary.student_installments.forEach((installment) => {
          if (installment.payment_status === "Completed") {
            // Paid — always show
            records.push({
              paid_on: installment.receipts!.payment_date,
              paid_by: installment.receipts!.payee,
              amount: installment.receipts!.amount,
              receipt_url: installment.receipts!.id,
              description: `${summary.courses?.name} - Year ${summary.year_number} (Installment #${installment.installment_number})`,
              status: "paid",
            });
          } else if (isCurrentYear) {
            // Current year pending — show as upcoming or overdue
            const dueDate = installment.due_date
              ? new Date(installment.due_date)
              : null;
            const isOverdue = dueDate ? dueDate < now : false;
            records.push({
              paid_on: installment.due_date,
              paid_by: null,
              amount: installment.installment_amount,
              receipt_url: null,
              description: `${summary.courses?.name} - Year ${summary.year_number} (Installment #${installment.installment_number})`,
              status: isOverdue ? "overdue" : "upcoming",
            });
          } else if (installment.payment_status === "Pending") {
            // Old year overdue — show as overdue
            records.push({
              paid_on: installment.due_date,
              paid_by: null,
              amount: installment.installment_amount,
              receipt_url: null,
              description: `${summary.courses?.name} - Year ${summary.year_number} (Installment #${installment.installment_number})`,
              status: "overdue",
            });
          }
        });
      });

    // Registration fee
    if (regData[0]) {
      if (regData[0].is_paid && regData[0].receipts) {
        records.push({
          paid_on: regData[0].receipts.payment_date,
          paid_by: regData[0].receipts.payee,
          amount: regData[0].registeration_fee,
          description: "Registeration Fee",
          receipt_url: regData[0].receipts.id,
          status: "paid",
        });
      } else if (!regData[0].is_paid) {
        records.push({
          paid_on: regData[0].created_at,
          paid_by: null,
          amount: regData[0].registeration_fee,
          description: "Registeration Fee",
          receipt_url: null,
          status: "overdue",
        });
      }
    }

    // Sort: overdue first, then upcoming, then paid (most recent first)
    const statusOrder = { overdue: 0, upcoming: 1, paid: 2 };
    records.sort((a, b) => {
      const sa = statusOrder[a.status || "paid"];
      const sb = statusOrder[b.status || "paid"];
      if (sa !== sb) return sa - sb;
      return (
        new Date(b.paid_on || 0).valueOf() -
        new Date(a.paid_on || 0).valueOf()
      );
    });

    return records;
  },
  getFeeReceipt: async (id: string) => {
    return [id];
  },
};
