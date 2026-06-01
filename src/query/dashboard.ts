import { supabase } from "@/lib/supabase";
import { ExpenseCategory } from "@/query/expenses";

export type DashboardFilters = {
  academicYear: number;
  fromDate: string;
  toDate: string;
  expenseCategoryId?: string;
};

export type MonthlyProjectionCollection = {
  month: string;
  projected: number;
  collected: number;
};

export type ExpenseCategoryBreakdown = {
  category: string;
  amount: number;
};

export type MonthlyRevenueExpense = {
  month: string;
  revenue: number;
  expenses: number;
  profit: number;
};

export type DashboardData = {
  summary: {
    projectedRevenue: number;
    collectedRevenue: number;
    pendingRevenue: number;
    expenses: number;
    profit: number;
    profitMargin: number;
  };
  registrationFees: MonthlyProjectionCollection[];
  installmentFees: MonthlyProjectionCollection[];
  expensesByCategory: ExpenseCategoryBreakdown[];
  revenueVsExpenses: MonthlyRevenueExpense[];
};

export const dashboardKeys = {
  data: (filters: DashboardFilters) => ["dashboard", "financials", filters],
  expenseCategories: () => ["dashboard", "expense-categories"],
};

const monthFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  year: "2-digit",
});

const toLocalDate = (dateString: string) => {
  const [year, month, day] = dateString.slice(0, 10).split("-").map(Number);
  return new Date(year, month - 1, day);
};

const toMonthKey = (dateString: string) => {
  const date = toLocalDate(dateString);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
};

const getMonthKeyFromDate = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

const getMonthLabel = (monthKey: string) => {
  const [year, month] = monthKey.split("-").map(Number);
  return monthFormatter.format(new Date(year, month - 1, 1));
};

const getMonthKeys = (fromDate: string, toDate: string) => {
  const from = toLocalDate(fromDate);
  const to = toLocalDate(toDate);
  const cursor = new Date(from.getFullYear(), from.getMonth(), 1);
  const end = new Date(to.getFullYear(), to.getMonth(), 1);
  const keys: string[] = [];

  while (cursor <= end) {
    keys.push(getMonthKeyFromDate(cursor));
    cursor.setMonth(cursor.getMonth() + 1);
  }

  return keys;
};

const isWithinRange = (dateString: string | null | undefined, filters: DashboardFilters) => {
  if (!dateString) return false;
  const date = dateString.slice(0, 10);
  return date >= filters.fromDate && date <= filters.toDate;
};

const initMonthlyMap = (monthKeys: string[]) =>
  Object.fromEntries(monthKeys.map((key) => [key, 0])) as Record<string, number>;

export const dashboardFns = {
  getExpenseCategories: async () => {
    const { data, error } = await supabase
      .from("expense_categories")
      .select("*")
      .eq("is_active", true)
      .order("name");
    if (error) throw error;
    return data as ExpenseCategory[];
  },

  getDashboardData: async (filters: DashboardFilters): Promise<DashboardData> => {
    const monthKeys = getMonthKeys(filters.fromDate, filters.toDate);

    const [regResult, instResult, expenseResult] = await Promise.all([
      supabase
        .from("student_registeration_fees")
        .select("registeration_fee, is_paid, created_at, receipts(payment_date)"),
      supabase
        .from("student_installments")
        .select("installment_amount, due_date, payment_status, receipts(payment_date)"),
      (() => {
        let query = supabase
          .from("expenses")
          .select("amount, expense_date, expense_categories(id, name)")
          .gte("expense_date", filters.fromDate)
          .lte("expense_date", filters.toDate);
        if (filters.expenseCategoryId) {
          query = query.eq("category_id", filters.expenseCategoryId);
        }
        return query;
      })(),
    ]);

    if (regResult.error) throw regResult.error;
    if (instResult.error) throw instResult.error;
    if (expenseResult.error) throw expenseResult.error;

    const regProjected = initMonthlyMap(monthKeys);
    const regCollected = initMonthlyMap(monthKeys);
    const instProjected = initMonthlyMap(monthKeys);
    const instCollected = initMonthlyMap(monthKeys);
    const expensesMonthly = initMonthlyMap(monthKeys);
    const expenseCategoryMap = new Map<string, number>();

    for (const row of regResult.data || []) {
      const amount = row.registeration_fee || 0;
      if (isWithinRange(row.created_at, filters)) {
        const key = toMonthKey(row.created_at!);
        if (key in regProjected) regProjected[key] += amount;
      }

      const paymentDate = row.receipts?.payment_date;
      if (row.is_paid && isWithinRange(paymentDate, filters)) {
        const key = toMonthKey(paymentDate!);
        if (key in regCollected) regCollected[key] += amount;
      }
    }

    for (const row of instResult.data || []) {
      const amount = row.installment_amount || 0;
      if (isWithinRange(row.due_date, filters)) {
        const key = toMonthKey(row.due_date!);
        if (key in instProjected) instProjected[key] += amount;
      }

      const paymentDate = row.receipts?.payment_date;
      if (row.payment_status === "Completed" && isWithinRange(paymentDate, filters)) {
        const key = toMonthKey(paymentDate!);
        if (key in instCollected) instCollected[key] += amount;
      }
    }

    for (const row of expenseResult.data || []) {
      const amount = Number(row.amount || 0);
      const key = toMonthKey(row.expense_date);
      if (key in expensesMonthly) expensesMonthly[key] += amount;

      const category = row.expense_categories?.name ?? "Uncategorized";
      expenseCategoryMap.set(category, (expenseCategoryMap.get(category) || 0) + amount);
    }

    const registrationFees = monthKeys.map((key) => ({
      month: getMonthLabel(key),
      projected: regProjected[key],
      collected: regCollected[key],
    }));

    const installmentFees = monthKeys.map((key) => ({
      month: getMonthLabel(key),
      projected: instProjected[key],
      collected: instCollected[key],
    }));

    const expensesByCategory = Array.from(expenseCategoryMap.entries())
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);

    const revenueVsExpenses = monthKeys.map((key) => {
      const revenue = regCollected[key] + instCollected[key];
      const expenses = expensesMonthly[key];
      return {
        month: getMonthLabel(key),
        revenue,
        expenses,
        profit: revenue - expenses,
      };
    });

    const projectedRevenue =
      Object.values(regProjected).reduce((sum, amount) => sum + amount, 0) +
      Object.values(instProjected).reduce((sum, amount) => sum + amount, 0);
    const collectedRevenue =
      Object.values(regCollected).reduce((sum, amount) => sum + amount, 0) +
      Object.values(instCollected).reduce((sum, amount) => sum + amount, 0);
    const expenses = Object.values(expensesMonthly).reduce(
      (sum, amount) => sum + amount,
      0
    );
    const profit = collectedRevenue - expenses;

    return {
      summary: {
        projectedRevenue,
        collectedRevenue,
        pendingRevenue: projectedRevenue - collectedRevenue,
        expenses,
        profit,
        profitMargin: collectedRevenue ? (profit / collectedRevenue) * 100 : 0,
      },
      registrationFees,
      installmentFees,
      expensesByCategory,
      revenueVsExpenses,
    };
  },
};
