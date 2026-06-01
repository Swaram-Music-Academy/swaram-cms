import Loader from "@/components/Loader";
import DataTable from "@/components/tables/data-table";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { formatNumberIndian } from "@/lib/utils/amount";
import {
  EXPENSE_PAYMENT_METHODS,
  ExpenseFilters,
  ExpenseRecord,
  expenseFns,
  expenseKeys,
} from "@/query/expenses";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { Eye, Pencil, Plus, Trash2 } from "lucide-react";
import { ChangeEvent, FormEvent, useMemo, useState } from "react";

const ALL_CATEGORIES = "all-categories";
const ALL_PAYMENT_METHODS = "all-payment-methods";

type ExpenseFormState = {
  id?: string;
  title: string;
  amount: string;
  expense_date: string;
  category_id: string;
  paid_to: string;
  payment_method: string;
  notes: string;
  receipt_path: string | null;
};

const emptyExpenseForm = (): ExpenseFormState => ({
  title: "",
  amount: "",
  expense_date: new Date().toISOString().slice(0, 10),
  category_id: "",
  paid_to: "",
  payment_method: "",
  notes: "",
  receipt_path: null,
});

export default function Expenses() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<ExpenseFilters>({});
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [form, setForm] = useState<ExpenseFormState>(emptyExpenseForm);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);

  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: expenseKeys.categories(),
    queryFn: expenseFns.getCategories,
  });

  const {
    data: expenses = [],
    error,
    isLoading: expensesLoading,
  } = useQuery({
    queryKey: expenseKeys.list(filters),
    queryFn: () => expenseFns.getExpenses(filters),
  });

  const invalidateExpenses = () => {
    queryClient.invalidateQueries({ queryKey: ["expenses"] });
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const amount = Number(form.amount);
      if (!form.title.trim()) throw new Error("Title is required.");
      if (!amount || amount <= 0) throw new Error("Amount must be greater than 0.");
      if (!form.expense_date) throw new Error("Expense date is required.");
      if (!form.category_id) throw new Error("Category is required.");

      let receiptPath = form.receipt_path;
      if (receiptFile) receiptPath = await expenseFns.uploadReceipt(receiptFile);

      const payload = {
        title: form.title.trim(),
        amount,
        expense_date: form.expense_date,
        category_id: form.category_id,
        paid_to: form.paid_to.trim() || null,
        payment_method: form.payment_method || null,
        receipt_path: receiptPath,
        notes: form.notes.trim() || null,
      };

      if (form.id) {
        await expenseFns.updateExpense(form.id, payload);
      } else {
        const { data: userData } = await supabase.auth.getUser();
        await expenseFns.createExpense({
          ...payload,
          created_by: userData.user?.id ?? null,
        });
      }
    },
    onSuccess: () => {
      invalidateExpenses();
      setIsDrawerOpen(false);
      setForm(emptyExpenseForm());
      setReceiptFile(null);
      toast({ title: "Expense saved." });
    },
    onError: (error) => {
      toast({
        title: "Failed to save expense.",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: expenseFns.deleteExpense,
    onSuccess: () => {
      invalidateExpenses();
      toast({ title: "Expense deleted." });
    },
    onError: () => {
      toast({
        title: "Failed to delete expense.",
        description: "Please try again.",
        variant: "destructive",
      });
    },
  });

  const totals = useMemo(() => {
    const total = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
    return {
      total,
      count: expenses.length,
      average: expenses.length ? total / expenses.length : 0,
    };
  }, [expenses]);

  const openCreateDialog = () => {
    setForm(emptyExpenseForm());
    setReceiptFile(null);
    setIsDrawerOpen(true);
  };

  const openEditDialog = (expense: ExpenseRecord) => {
    setForm({
      id: expense.id,
      title: expense.title,
      amount: String(expense.amount),
      expense_date: expense.expense_date,
      category_id: expense.category_id,
      paid_to: expense.paid_to ?? "",
      payment_method: expense.payment_method ?? "",
      notes: expense.notes ?? "",
      receipt_path: expense.receipt_path,
    });
    setReceiptFile(null);
    setIsDrawerOpen(true);
  };

  const handleInputChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.currentTarget;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    saveMutation.mutate();
  };

  const viewReceipt = async (path: string) => {
    try {
      const url = await expenseFns.getReceiptUrl(path);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      toast({
        title: "Failed to open receipt.",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  const columns: ColumnDef<ExpenseRecord>[] = [
    {
      accessorKey: "expense_date",
      header: "Date",
      cell: ({ row }) => <p>{format(row.original.expense_date, "PPP")}</p>,
    },
    {
      accessorKey: "title",
      header: "Title",
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.title}</p>
          {row.original.notes && (
            <p className="text-xs text-muted-foreground line-clamp-1">
              {row.original.notes}
            </p>
          )}
        </div>
      ),
    },
    {
      accessorKey: "category",
      header: "Category",
      cell: ({ row }) => <p>{row.original.expense_categories?.name ?? "-"}</p>,
    },
    {
      accessorKey: "paid_to",
      header: "Paid To",
      cell: ({ row }) => <p>{row.original.paid_to || "-"}</p>,
    },
    {
      accessorKey: "payment_method",
      header: "Payment Method",
      cell: ({ row }) => <p>{row.original.payment_method || "-"}</p>,
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => (
        <p className="font-medium">₹{formatNumberIndian(Number(row.original.amount))}</p>
      ),
    },
    {
      accessorKey: "receipt_path",
      header: "Receipt",
      cell: ({ row }) =>
        row.original.receipt_path ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => viewReceipt(row.original.receipt_path!)}
          >
            <Eye className="mr-2 h-4 w-4" /> View
          </Button>
        ) : (
          <p className="text-muted-foreground">-</p>
        ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" onClick={() => openEditDialog(row.original)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              if (confirm("Delete this expense?")) {
                deleteMutation.mutate(row.original.id);
              }
            }}
          >
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      ),
    },
  ];

  const isLoading = categoriesLoading || expensesLoading;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Expenses</h1>
          <p className="text-muted-foreground">
            Track class expenses, receipts, and outgoing payments.
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" /> Add Expense
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Total Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">₹{formatNumberIndian(totals.total)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Number of Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{formatNumberIndian(totals.count)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Average Expense</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">₹{formatNumberIndian(Number(totals.average.toFixed(2)))}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter expenses by date, category, payment method, or text.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-5">
          <div className="space-y-2">
            <Label htmlFor="fromDate">From</Label>
            <Input
              id="fromDate"
              type="date"
              value={filters.fromDate ?? ""}
              onChange={(event) =>
                setFilters((current) => ({ ...current, fromDate: event.target.value || undefined }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="toDate">To</Label>
            <Input
              id="toDate"
              type="date"
              value={filters.toDate ?? ""}
              onChange={(event) =>
                setFilters((current) => ({ ...current, toDate: event.target.value || undefined }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Category</Label>
            <Select
              value={filters.categoryId ?? ALL_CATEGORIES}
              onValueChange={(value) =>
                setFilters((current) => ({
                  ...current,
                  categoryId: value === ALL_CATEGORIES ? undefined : value,
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_CATEGORIES}>All categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Payment Method</Label>
            <Select
              value={filters.paymentMethod ?? ALL_PAYMENT_METHODS}
              onValueChange={(value) =>
                setFilters((current) => ({
                  ...current,
                  paymentMethod: value === ALL_PAYMENT_METHODS ? undefined : value,
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All methods" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_PAYMENT_METHODS}>All methods</SelectItem>
                {EXPENSE_PAYMENT_METHODS.map((method) => (
                  <SelectItem key={method} value={method}>
                    {method}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="search">Search</Label>
            <Input
              id="search"
              placeholder="Title, paid to, notes"
              value={filters.search ?? ""}
              onChange={(event) =>
                setFilters((current) => ({ ...current, search: event.target.value || undefined }))
              }
            />
          </div>
          <div className="md:col-span-5">
            <Button variant="outline" onClick={() => setFilters({})}>
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Expense Records</CardTitle>
          <CardDescription>Manually recorded class expenses.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Loader />
          ) : error ? (
            <div className="flex h-32 items-center justify-center">
              Something went wrong, please try again later.
            </div>
          ) : (
            <DataTable columns={columns} data={expenses} />
          )}
        </CardContent>
      </Card>

      <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <SheetContent className="w-[520px] overflow-y-auto sm:max-w-[520px]">
          <form onSubmit={handleSubmit} className="flex min-h-full flex-col gap-6">
            <SheetHeader>
              <SheetTitle>{form.id ? "Edit Expense" : "Add Expense"}</SheetTitle>
              <SheetDescription>
                Record outgoing costs. Receipts are optional.
              </SheetDescription>
            </SheetHeader>

            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  name="title"
                  value={form.title}
                  onChange={handleInputChange}
                  placeholder="January electricity bill"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount *</Label>
                  <Input
                    id="amount"
                    name="amount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.amount}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expense_date">Expense Date *</Label>
                  <Input
                    id="expense_date"
                    name="expense_date"
                    type="date"
                    value={form.expense_date}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Category *</Label>
                <Select
                  value={form.category_id}
                  onValueChange={(value) =>
                    setForm((current) => ({ ...current, category_id: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Payment Method</Label>
                <Select
                  value={form.payment_method || undefined}
                  onValueChange={(value) =>
                    setForm((current) => ({ ...current, payment_method: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPENSE_PAYMENT_METHODS.map((method) => (
                      <SelectItem key={method} value={method}>
                        {method}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="paid_to">Paid To</Label>
                <Input
                  id="paid_to"
                  name="paid_to"
                  value={form.paid_to}
                  onChange={handleInputChange}
                  placeholder="Vendor, faculty, staff member, company, etc."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="receipt">Receipt</Label>
                <Input
                  id="receipt"
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(event) => setReceiptFile(event.target.files?.[0] ?? null)}
                />
                {form.receipt_path && !receiptFile && (
                  <p className="text-xs text-muted-foreground">
                    Existing receipt will be kept unless you upload a new one.
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  value={form.notes}
                  onChange={handleInputChange}
                  placeholder="Additional context"
                />
              </div>
            </div>

            <SheetFooter className="mt-auto pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDrawerOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? "Saving..." : "Save Expense"}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
