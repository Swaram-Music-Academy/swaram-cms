import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { getAcademicYear } from "@/lib/utils/date";
import { cn } from "@/lib/utils";

const chartConfig = {
  fees: {
    label: "Desktop",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;

export default function MonthlyChart({
  data,
  className,
}: {
  data?: { month: string; Fees: number }[];
  className?: string;
}) {
  return (
    <div className={cn(`flex flex-col`, className)}>
      <p className="font-semibold text-lg">Monthly Fee Payments</p>
      <p className="text-sm text-muted-foreground">
        Showing fee payments for academic year {getAcademicYear()}
      </p>
      <ChartContainer config={chartConfig} className="max-h-[250px] mt-8">
        <BarChart
          accessibilityLayer
          data={data}
          margin={{
            left: 12,
            right: 12,
          }}
        >
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="month"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tickFormatter={(value) => value.slice(0, 3)}
          />
          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent indicator="line" />}
          />
          <Bar
            dataKey="Fees"
            type="natural"
            fill="var(--color-fees)"
            fillOpacity={1}
            opacity={0.8}
            radius={8}
            stroke="var(--color-fees)"
          />
        </BarChart>
      </ChartContainer>
    </div>
  );
}
