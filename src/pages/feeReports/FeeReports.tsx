import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadialProgress } from "./components/RadialProgress";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { reportKeys, reportsFns } from "@/query/reports";
import Loader from "@/components/Loader";
import MonthlyChart from "./components/MonthlyChart";
import { formatNumberIndian } from "@/lib/utils/amount";

export default function FeeReports() {
  const { data, isLoading, error } = useQuery({
    queryKey: reportKeys.getFeeReports(),
    queryFn: () => reportsFns.getFeeReportsFn(),
  });

  const {
    data: charts,
    isLoading: chartsLoading,
    error: chartsError,
  } = useQuery({
    queryKey: reportKeys.getMonthlyChartData(),
    queryFn: () => reportsFns.getMonthlyChartData(),
  });

  return (
    <>
      {isLoading || chartsLoading ? (
        <Loader />
      ) : (
        <>
          {error && (
            <div className="w-full h-full flex items-center justify-center">
              Something went wrong. Please try again later.
            </div>
          )}
          {data && (
            <>
              <div className="flex items-center mb-8">
                <h1 className="text-3xl font-semibold">Fee Report Dashboard</h1>
              </div>

              {/* Registeration Fees section */}
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle className="text-2xl mb-8">
                    Registration Fees
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-[2fr_4fr] xl:grid-cols-[1fr_2fr_4fr] gap-8">
                  <div className="grid grid-cols-2 md:grid-cols-1 gap-4">
                    <Metric
                      label="Total Amount"
                      value={`₹${formatNumberIndian(data.registeration.total)}`}
                    />
                    <Metric
                      label="Outstanding Amount"
                      value={`₹${formatNumberIndian(
                        data.registeration.outstanding
                      )}`}
                    />
                    <Metric
                      label="Collected this month"
                      value={`₹${formatNumberIndian(
                        data.registeration.collectedThisMonth
                      )}`}
                    />
                    <Link to={"/pending-registeration"}>
                      <Metric
                        variant={"primary"}
                        label="Pending Students"
                        value={`${formatNumberIndian(
                          data.registeration.pendingStudents
                        )}`}
                      />
                    </Link>
                  </div>
                  <RadialProgress
                    percentPaid={data.registeration.percentPaid}
                    total={data.registeration.total}
                    outstanding={data.registeration.outstanding}
                  />
                  {chartsError ? (
                    <div className="w-full h-full flex items-center justify-center">
                      <p>Something went wrong, please try again later.</p>
                    </div>
                  ) : (
                    <MonthlyChart
                      data={charts!.registeration}
                      className="md:col-span-2 xl:col-span-1"
                    />
                  )}
                </CardContent>
              </Card>
              {/* Installment Fees section */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl mb-8">
                    Installment Fees
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-[2fr_4fr] xl:grid-cols-[1fr_2fr_4fr] gap-8">
                  <div className="grid grid-cols-2 md:grid-cols-1 gap-4">
                    <Metric
                      label="Total Amount"
                      value={`₹${formatNumberIndian(data.installments.total)}`}
                    />
                    <Metric
                      label="Outstanding Amount"
                      value={`₹${formatNumberIndian(
                        data.installments.outstanding
                      )}`}
                    />
                    <Metric
                      label="Collected this month"
                      value={`₹${formatNumberIndian(
                        data.installments.collectedThisMonth
                      )}`}
                    />
                    <Link to={"/pending-installments"}>
                      <Metric
                        variant="primary"
                        label="Overdue Students"
                        value={`${formatNumberIndian(
                          data.installments.pendingStudents
                        )}`}
                      />
                    </Link>
                  </div>
                  <RadialProgress
                    percentPaid={data.installments.percentPaid}
                    total={data.installments.total}
                    outstanding={data.installments.outstanding}
                  />

                  {chartsError ? (
                    <div className="w-full h-full flex items-center justify-center">
                      <p>Something went wrong, please try again later.</p>
                    </div>
                  ) : (
                    <MonthlyChart
                      data={charts!.installments}
                      className="md:col-span-2 xl:col-span-1"
                    />
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </>
      )}
    </>
  );
}

function Metric({
  label,
  value,
  variant,
}: {
  label: string;
  value: string;
  variant?: "primary" | "";
}) {
  const bgClasses = variant === "primary" ? "bg-primary" : "bg-muted";
  const labelClasses =
    variant === "primary" ? "text-white/80" : "text-muted-foreground";
  const valueClasses = variant === "primary" ? "text-white" : "text-foreground";

  return (
    <div
      className={`rounded-lg p-2 flex gap-1 flex-col items-center ${bgClasses}`}
    >
      <span className={`text-xs ${labelClasses}`}>{label}</span>
      <span className={`text-lg font-semibold ${valueClasses}`}>{value}</span>
    </div>
  );
}
