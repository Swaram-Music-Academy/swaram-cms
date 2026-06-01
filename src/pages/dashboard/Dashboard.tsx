import Loader from "@/components/Loader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatNumberIndian } from "@/lib/utils/amount";
import { getAcademicYear } from "@/lib/utils/date";
import { dashboardFns, dashboardKeys } from "@/query/dashboard";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts";

const ALL_CATEGORIES = "all-categories";

const projectionChartConfig = {
  projected: {
    label: "Projected",
    color: "hsl(var(--muted-foreground))",
  },
  collected: {
    label: "Collected",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;

const expensesChartConfig = {
  amount: {
    label: "Expenses",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;

const revenueExpenseChartConfig = {
  revenue: {
    label: "Revenue",
    color: "hsl(var(--primary))",
  },
  expenses: {
    label: "Expenses",
    color: "hsl(var(--destructive))",
  },
  profit: {
    label: "Profit / Loss",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;

const academicYearRange = (year: number) => ({
  fromDate: `${year}-05-01`,
  toDate: `${year + 1}-04-30`,
});

const formatCurrency = (value: number) =>
  `₹${formatNumberIndian(Number(value.toFixed(2)))}`;

export default function Dashboard() {
  const currentAcademicYear = getAcademicYear();
  const academicYearOptions = useMemo(
    () => Array.from({ length: 6 }, (_, index) => currentAcademicYear - index),
    [currentAcademicYear]
  );

  const [academicYear, setAcademicYear] = useState(currentAcademicYear);
  const [dateRange, setDateRange] = useState(academicYearRange(currentAcademicYear));
  const [expenseCategoryId, setExpenseCategoryId] = useState<string | undefined>();

  const filters = {
    academicYear,
    fromDate: dateRange.fromDate,
    toDate: dateRange.toDate,
    expenseCategoryId,
  };

  const { data: categories = [] } = useQuery({
    queryKey: dashboardKeys.expenseCategories(),
    queryFn: dashboardFns.getExpenseCategories,
  });

  const { data, isLoading, error } = useQuery({
    queryKey: dashboardKeys.data(filters),
    queryFn: () => dashboardFns.getDashboardData(filters),
  });

  const handleAcademicYearChange = (value: string) => {
    const year = Number(value);
    setAcademicYear(year);
    setDateRange(academicYearRange(year));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Analytics Dashboard</h1>
        <p className="text-muted-foreground">
          Revenue, expenses, and profit/loss for the selected period.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Global Filters</CardTitle>
          <CardDescription>
            Defaults to the selected academic year. Narrow the date range for month-specific reports.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="space-y-2">
            <Label>Academic Year</Label>
            <Select value={String(academicYear)} onValueChange={handleAcademicYearChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {academicYearOptions.map((year) => (
                  <SelectItem key={year} value={String(year)}>
                    {year}-{year + 1}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="fromDate">From</Label>
            <Input
              id="fromDate"
              type="date"
              value={dateRange.fromDate}
              onChange={(event) =>
                setDateRange((current) => ({ ...current, fromDate: event.target.value }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="toDate">To</Label>
            <Input
              id="toDate"
              type="date"
              value={dateRange.toDate}
              onChange={(event) =>
                setDateRange((current) => ({ ...current, toDate: event.target.value }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Expense Category</Label>
            <Select
              value={expenseCategoryId ?? ALL_CATEGORIES}
              onValueChange={(value) =>
                setExpenseCategoryId(value === ALL_CATEGORIES ? undefined : value)
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
        </CardContent>
      </Card>

      {isLoading ? (
        <Loader />
      ) : error || !data ? (
        <Card>
          <CardContent className="flex h-32 items-center justify-center">
            Something went wrong, please try again later.
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6">
            <SummaryCard title="Projected Revenue" value={formatCurrency(data.summary.projectedRevenue)} />
            <SummaryCard title="Collected Revenue" value={formatCurrency(data.summary.collectedRevenue)} />
            <SummaryCard title="Pending Revenue" value={formatCurrency(data.summary.pendingRevenue)} />
            <SummaryCard title="Expenses" value={formatCurrency(data.summary.expenses)} />
            <SummaryCard
              title="Profit / Loss"
              value={formatCurrency(data.summary.profit)}
              valueClassName={data.summary.profit >= 0 ? "text-emerald-600" : "text-red-600"}
            />
            <SummaryCard
              title="Profit Margin"
              value={`${data.summary.profitMargin.toFixed(2)}%`}
              valueClassName={data.summary.profitMargin >= 0 ? "text-emerald-600" : "text-red-600"}
            />
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <ProjectionCollectionPane
              title="Registration Fees"
              description="Monthly projected vs collected registration fees."
              data={data.registrationFees}
            />
            <ProjectionCollectionPane
              title="Installment Fees"
              description="Monthly projected vs collected installment payments."
              data={data.installmentFees}
            />
            <ExpensesByCategoryPane data={data.expensesByCategory} />
            <RevenueVsExpensesPane data={data.revenueVsExpenses} />
          </div>
        </>
      )}
    </div>
  );
}

function SummaryCard({
  title,
  value,
  valueClassName,
}: {
  title: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className={`text-2xl font-semibold ${valueClassName ?? ""}`}>{value}</p>
      </CardContent>
    </Card>
  );
}

function ProjectionCollectionPane({
  title,
  description,
  data,
}: {
  title: string;
  description: string;
  data: { month: string; projected: number; collected: number }[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={projectionChartConfig} className="h-[320px] w-full">
          <BarChart data={data} margin={{ left: 12, right: 12 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
            <YAxis tickLine={false} axisLine={false} tickMargin={8} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="projected" fill="var(--color-projected)" radius={6} />
            <Bar dataKey="collected" fill="var(--color-collected)" radius={6} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

function ExpensesByCategoryPane({
  data,
}: {
  data: { category: string; amount: number }[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Expenses by Category</CardTitle>
        <CardDescription>Expense distribution for the selected period.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={expensesChartConfig} className="h-[320px] w-full">
          <BarChart data={data} layout="vertical" margin={{ left: 24, right: 12 }}>
            <CartesianGrid horizontal={false} />
            <XAxis type="number" tickLine={false} axisLine={false} />
            <YAxis
              type="category"
              dataKey="category"
              tickLine={false}
              axisLine={false}
              width={120}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="amount" fill="var(--color-amount)" radius={6} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

function RevenueVsExpensesPane({
  data,
}: {
  data: { month: string; revenue: number; expenses: number; profit: number }[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue vs Expenses</CardTitle>
        <CardDescription>Collected revenue, expenses, and profit/loss by month.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={revenueExpenseChartConfig} className="h-[320px] w-full">
          <LineChart data={data} margin={{ left: 12, right: 12 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
            <YAxis tickLine={false} axisLine={false} tickMargin={8} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Line dataKey="revenue" stroke="var(--color-revenue)" strokeWidth={2} dot={false} />
            <Line dataKey="expenses" stroke="var(--color-expenses)" strokeWidth={2} dot={false} />
            <Line dataKey="profit" stroke="var(--color-profit)" strokeWidth={2} dot={false} />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
