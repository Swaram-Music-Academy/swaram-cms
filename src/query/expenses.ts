import { Tables, TablesInsert, TablesUpdate } from "@/lib/api/types";
import { supabase } from "@/lib/supabase";

export const EXPENSE_PAYMENT_METHODS = [
  "Cash",
  "UPI",
  "Bank Transfer",
  "Cheque",
  "Card",
  "Other",
] as const;

export type ExpensePaymentMethod = (typeof EXPENSE_PAYMENT_METHODS)[number];
export type ExpenseCategory = Tables<"expense_categories">;
export type ExpenseInsert = TablesInsert<"expenses">;
export type ExpenseUpdate = TablesUpdate<"expenses">;

export type ExpenseFilters = {
  fromDate?: string;
  toDate?: string;
  categoryId?: string;
  paymentMethod?: string;
  search?: string;
};

export type ExpenseRecord = Tables<"expenses"> & {
  expense_categories: Pick<ExpenseCategory, "id" | "name"> | null;
};

export const expenseKeys = {
  categories: () => ["expenses", "categories"],
  list: (filters: ExpenseFilters) => ["expenses", "list", filters],
};

export const expenseFns = {
  getCategories: async () => {
    const { data, error } = await supabase
      .from("expense_categories")
      .select("*")
      .eq("is_active", true)
      .order("name");
    if (error) throw error;
    return data;
  },

  getExpenses: async (filters: ExpenseFilters = {}) => {
    let query = supabase
      .from("expenses")
      .select("*, expense_categories(id, name)")
      .order("expense_date", { ascending: false })
      .order("created_at", { ascending: false });

    if (filters.fromDate) query = query.gte("expense_date", filters.fromDate);
    if (filters.toDate) query = query.lte("expense_date", filters.toDate);
    if (filters.categoryId) query = query.eq("category_id", filters.categoryId);
    if (filters.paymentMethod)
      query = query.eq("payment_method", filters.paymentMethod);

    if (filters.search?.trim()) {
      const search = filters.search.trim().replace(/[%_]/g, "\\$&");
      query = query.or(
        `title.ilike.%${search}%,paid_to.ilike.%${search}%,notes.ilike.%${search}%`
      );
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as ExpenseRecord[];
  },

  createExpense: async (payload: ExpenseInsert) => {
    const { data, error } = await supabase
      .from("expenses")
      .insert(payload)
      .select("id")
      .single();
    if (error) throw error;
    return data;
  },

  updateExpense: async (id: string, payload: ExpenseUpdate) => {
    const { error } = await supabase.from("expenses").update(payload).eq("id", id);
    if (error) throw error;
  },

  deleteExpense: async (id: string) => {
    const { error } = await supabase.from("expenses").delete().eq("id", id);
    if (error) throw error;
  },

  uploadReceipt: async (file: File) => {
    const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "-");
    const path = `${crypto.randomUUID()}/${Date.now()}-${safeName}`;
    const { error } = await supabase.storage
      .from("expense-receipts")
      .upload(path, file, { upsert: false });
    if (error) throw error;
    return path;
  },

  getReceiptUrl: async (path: string) => {
    const { data, error } = await supabase.storage
      .from("expense-receipts")
      .createSignedUrl(path, 60 * 5);
    if (error) throw error;
    return data.signedUrl;
  },
};
