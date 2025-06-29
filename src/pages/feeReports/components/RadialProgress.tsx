import { ChartConfig, ChartContainer } from "@/components/ui/chart";
import { Separator } from "@/components/ui/separator";
import { formatNumberIndian } from "@/lib/utils/amount";
import { Label, PolarRadiusAxis } from "recharts";
import { RadialBar } from "recharts";
import { PolarGrid, RadialBarChart } from "recharts";

const chartConfig = {
  value: {
    label: "Paid %",
  },
} satisfies ChartConfig;

export function RadialProgress({
  percentPaid,
  total,
  outstanding,
}: {
  percentPaid: number;
  total: number;
  outstanding: number;
}) {
  const chartData = [
    {
      label: "Paid",
      value: percentPaid,
      fill: "hsl(var(--primary))",
    },
  ];
  return (
    <div className="flex flex-row">
      <Separator orientation="vertical" />
      <div className="w-full flex flex-col gap-4">
        <p className="font-semibold text-center text-lg text-accent-foreground">
          Payment Progress
        </p>
        <ChartContainer config={chartConfig} className="max-h-[250px]">
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
            <RadialBar dataKey={"value"} background cornerRadius={10} />
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
              ></Label>
            </PolarRadiusAxis>
          </RadialBarChart>
        </ChartContainer>
        <div className=" mt-auto flex flex-col gap-2 text-sm text-center">
          <div className="font-medium leading-none">
            ₹{formatNumberIndian(total - outstanding)} paid of ₹
            {formatNumberIndian(total)}
          </div>
          <div className="text-muted-foreground leading-none">
            Payments as of today
          </div>
        </div>
      </div>
      <Separator orientation="vertical" />
    </div>
  );
}
