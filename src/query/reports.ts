import { supabase } from "@/lib/supabase";

const ACADEMIC_YEAR_MONTHS = [
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
];

// Utility to get short month label from Date
const getMonthLabel = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleString("default", { month: "short" });
};

const initTotalsMap = () =>
  Object.fromEntries(ACADEMIC_YEAR_MONTHS.map((month) => [month, 0]));

type MetricObj = {
  total: number;
  outstanding: number;
  collectedThisMonth: number;
  pendingStudents: number;
  percentPaid: number;
};

export type InstallmentRecords = {
  id: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  avatar_url?: string;
  description: string;
  installment_amount: number;
  installment_number: number;
  due_date: string;
};
export type RegisterationRecords = {
  id: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  avatar_url?: string;
  due_date: string;
  amount: number;
};
export const reportKeys = {
  getFeeReports: () => ["fee-reports"],
  getMonthlyChartData: () => ["monthly-chart"],
  getPendingInstallments: () => ["pending", "installments"],
  getPendingRegisteration: () => ["pending", "registeration"],
  getDashboardMetrics: () => ["dashboard"],
};

export const reportsFns = {
  getFeeReportsFn: async () => {
    // Initializing metrics for registeration and installments.

    const regObj: MetricObj = {
      total: 0,
      outstanding: 0,
      pendingStudents: 0,
      collectedThisMonth: 0,
      percentPaid: 0,
    };

    const instObj: MetricObj = {
      total: 0,
      outstanding: 0,
      pendingStudents: 0,
      collectedThisMonth: 0,
      percentPaid: 0,
    };
    // Helper for current month metric
    const currentMonthStart = new Date();
    currentMonthStart.setDate(1);
    currentMonthStart.setHours(0, 0, 0, 0);

    // Fetching reg Data
    const { data: regData, error: regError } = await supabase
      .from("student_registeration_fees")
      .select("registeration_fee, is_paid, created_at");

    if (regError) throw regError;

    // Calculating Registration data.
    if (regData && regData.length) {
      const regPendingRows = regData.filter((r) => !r.is_paid);
      const regPending = regPendingRows.reduce(
        (a, b) => a + b.registeration_fee,
        0
      );
      const regTotal = regData.reduce((a, b) => a + b.registeration_fee, 0);

      const regThisMonth = regData
        .filter(
          (r) => r.is_paid && new Date(r.created_at!) >= currentMonthStart
        )
        .reduce((a, b) => a + b.registeration_fee, 0);
      // setting new values
      regObj.outstanding = regPending;
      regObj.total = regTotal;
      regObj.pendingStudents = regPendingRows.length;
      regObj.percentPaid = (1 - regPending / regTotal) * 100;
      regObj.collectedThisMonth = regThisMonth;
    }

    // Fetching installment data
    const { data: instData, error: instError } = await supabase
      .from("student_installments")
      .select(
        "fee_summary_id, installment_amount, payment_status, due_date, created_at"
      );

    if (instError) throw instError;

    // Calculating Installment data
    if (instData && instData.length) {
      const pendingRows = instData.filter(
        (i) => i.payment_status !== "Completed"
      );
      const paidRows = instData.filter((i) => i.payment_status === "Completed");

      const total = instData.reduce(
        (sum, row) => sum + (row.installment_amount || 0),
        0
      );
      const outstanding = pendingRows.reduce(
        (sum, row) => sum + (row.installment_amount || 0),
        0
      );

      const collectedThisMonth = paidRows
        .filter((row) => new Date(row.created_at!) >= currentMonthStart)
        .reduce((sum, row) => sum + (row.installment_amount || 0), 0);

      // Unique pending students (distinct fee_summary_id count with unpaid installments)
      const pendingStudentIds = new Set(
        pendingRows.map((row) => row.fee_summary_id)
      );

      // setting new values
      instObj.total = total;
      instObj.outstanding = outstanding;
      instObj.collectedThisMonth = collectedThisMonth;
      instObj.pendingStudents = pendingStudentIds.size;
      instObj.percentPaid = total ? (1 - outstanding / total) * 100 : 0;
    }

    // Returning all data
    return { registeration: regObj, installments: instObj };
  },
  getMonthlyChartData: async () => {
    // Fetching records
    const { data: regData, error: regError } = await supabase
      .from("student_registeration_fees")
      .select("registeration_fee, is_paid, created_at");
    const { data: instData, error: instError } = await supabase
      .from("student_installments")
      .select(
        "payment_status, installment_amount, created_at, receipts(payment_date) "
      );
    if (regError) throw regError;
    if (regError) throw instError;

    // Aggregating Data
    // 3️⃣ Aggregate registration
    const regTotals = initTotalsMap();
    (regData || [])
      .filter((r) => r.is_paid && r.created_at)
      .forEach((r) => {
        const month = getMonthLabel(r.created_at!);
        regTotals[month] += r.registeration_fee || 0;
      });

    // 4️⃣ Aggregate installment
    const instTotals = initTotalsMap();
    (instData || [])
      .filter((i) => i.payment_status === "Completed" && i.created_at)
      .forEach((i) => {
        const month = getMonthLabel(i.created_at);
        instTotals[month] += i.installment_amount || 0;
      });

    return {
      registeration: ACADEMIC_YEAR_MONTHS.map((month) => ({
        month,
        Fees: regTotals[month],
      })),
      installments: ACADEMIC_YEAR_MONTHS.map((month) => ({
        month,
        Fees: instTotals[month],
      })),
    };
  },
  getPendingInstallments: async () => {
    const { data, error } = await supabase
      .from("student_installments")
      .select(
        `*, student_fee_summary(*, students(*), courses(*)), receipts(*)`
      );

    if (error) throw error;
    const result: InstallmentRecords[] = data
      .filter(
        (r) =>
          new Date(r.due_date!) < new Date() && r.payment_status === "Pending"
      )
      .map((record) => {
        const obj: InstallmentRecords = {
          id: record.student_fee_summary!.student_id!,
          first_name: record.student_fee_summary!.students!.first_name!,
          middle_name: record.student_fee_summary!.students!.middle_name!,
          last_name: record.student_fee_summary!.students!.last_name!,
          avatar_url: record.student_fee_summary!.students!.avatar_url!,
          description: `${record.student_fee_summary?.courses?.name} ${record.student_fee_summary?.year_number} Year`,
          installment_amount: record.installment_amount!,
          installment_number: record.installment_number!,
          due_date: record.due_date!,
        };
        return obj;
      });

    // Aggregate total paid progress
    let total = 0;
    let paid = 0;
    data.forEach((r) => {
      if (r.payment_status === "Completed") paid += r.receipts?.amount || 0;
      total += r.installment_amount || 0;
    });
    return {
      paidPercent: total === 0 ? 0 : (paid / total) * 100,
      list: result,
    };
  },
  getPendingRegisteration: async () => {
    const { data, error } = await supabase
      .from("student_registeration_fees")
      .select("*, students(*)");
    if (error) throw error;
    let total = 0;
    let paid = 0;
    data.forEach((r) => {
      if (r.is_paid) paid += r.registeration_fee;
      total += r.registeration_fee;
    });

    const result: RegisterationRecords[] = data
      .filter((r) => !r.is_paid)
      .map((r) => {
        const obj: RegisterationRecords = {
          id: r.students!.id,
          first_name: r.students!.first_name,
          middle_name: r.students!.middle_name || "",
          last_name: r.students!.last_name,
          avatar_url: r.students!.avatar_url || "",
          amount: r.registeration_fee!,
          due_date: r.created_at!,
        };
        return obj;
      });

    const paidPercent = total === 0 ? 0 : (paid / total) * 100;

    return { paidPercent, list: result };
  },
  getDashboardMetrics: async () => {
    const [students, courses, batches, enrollments] = await Promise.all([
      supabase.from("students").select("*", { count: "exact", head: true }),
      supabase.from("courses").select("*", { count: "exact", head: true }),
      supabase.from("batches").select("*", { count: "exact", head: true }),
      supabase.from("enrollments").select("*", { count: "exact", head: true }),
    ]);

    if (students.error) throw students.error;
    if (courses.error) throw courses.error;
    if (batches.error) throw batches.error;
    if (enrollments.error) throw enrollments.error;

    return {
      totalStudents: students.count ?? 0,
      totalCourses: courses.count ?? 0,
      totalBatches: batches.count ?? 0,
      totalEnrollments: enrollments.count ?? 0,
    };
  },
};
