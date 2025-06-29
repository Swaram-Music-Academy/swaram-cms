"use client";
import {
  Label,
  PolarGrid,
  PolarRadiusAxis,
  RadialBar,
  RadialBarChart,
} from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChartConfig, ChartContainer } from "@/components/ui/chart";
import { cn } from "@/lib/utils";
import { getAcademicYear } from "@/lib/utils/date";

// Props
interface FeeProgressProps {
  paidAmount: number;
  totalAmount: number;
  className?: string;
}

export default function FeeProgress({
  paidAmount,
  totalAmount,
  className,
}: FeeProgressProps) {
  const percentPaid =
    totalAmount > 0 ? Math.min((paidAmount / totalAmount) * 100, 100) : 0;

  const chartData = [
    {
      label: "Paid",
      value: percentPaid,
      fill: "hsl(var(--primary))",
    },
  ];

  const chartConfig = {
    value: {
      label: "Paid %",
    },
  } satisfies ChartConfig;

  return (
    <Card className={cn("flex flex-col", className)}>
      <CardHeader className="pb-0 text-center">
        <CardTitle className="text-xl">Payment Progress</CardTitle>
        <CardDescription>
          Academic Year {getAcademicYear()} - {getAcademicYear() + 1}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[250px]"
        >
          <RadialBarChart
            data={chartData}
            startAngle={270}
            endAngle={270 - Math.floor(percentPaid * 3.6)}
            innerRadius={80}
            outerRadius={110}
          >
            <PolarGrid
              gridType="circle"
              radialLines={false}
              stroke="none"
              fill="#123456"
              polarRadius={[86, 74]}
            />
            <RadialBar dataKey="value" background cornerRadius={10} />
            <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-foreground text-4xl font-bold"
                        >
                          {percentPaid.toFixed(0)}%
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className="fill-muted-foreground text-sm"
                        >
                          Paid
                        </tspan>
                      </text>
                    );
                  }
                  return null;
                }}
              />
            </PolarRadiusAxis>
          </RadialBarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        <div className="flex items-center gap-2 font-medium leading-none">
          ₹{paidAmount.toFixed(2)} paid of ₹{totalAmount.toFixed(2)}
        </div>
        <div className="text-muted-foreground leading-none">
          Payments as of today
        </div>
      </CardFooter>
    </Card>
  );
}
