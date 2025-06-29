import Loader from "@/components/Loader";
import DataTable from "@/components/tables/data-table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/lib/supabase";
import { formatNumberIndian } from "@/lib/utils/amount";
import { RegisterationRecords, reportKeys, reportsFns } from "@/query/reports";
import { useQuery } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { Link } from "react-router-dom";

export default function PendingRegisterationFees() {
  const { data, error, isLoading } = useQuery({
    queryKey: reportKeys.getPendingRegisteration(),
    queryFn: () => reportsFns.getPendingRegisteration(),
  });

  const columns: ColumnDef<RegisterationRecords>[] = [
    {
      accessorKey: "name",
      header: () => <p className="pl-4">Name</p>,
      cell: ({ row }) => {
        const name = `${row.original.first_name} ${row.original.middle_name} ${row.original.last_name} `;
        return (
          // Add avatar here later
          <Link to={`/students/${row.original.id}`}>
            <div className="flex items-center pl-4 gap-4">
              <Avatar className="w-8 h-8">
                <AvatarImage
                  src={
                    supabase.storage
                      .from("students")
                      .getPublicUrl(row.original.avatar_url || "").data
                      .publicUrl
                  }
                />
                <AvatarFallback>
                  {row.original.first_name[0]}
                  {row.original.last_name[0]}
                </AvatarFallback>
              </Avatar>
              <p>{name}</p>
            </div>
          </Link>
        );
      },
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => <p>₹{formatNumberIndian(row.original.amount)}</p>,
    },
    {
      accessorKey: "due_date",
      header: "Due Date",
      cell: ({ row }) => <p>{format(row.original.due_date, "PPP")}</p>,
    },
  ];

  return (
    <>
      {isLoading ? (
        <Loader />
      ) : (
        <>
          {error && (
            <div className="w-full h-full items-center justify-center">
              Something went wrong, please try again later.
            </div>
          )}
          {data && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <h1 className="text-3xl font-semibold">Pending Installments</h1>
              </div>

              {/* Progress Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    Fees Collection Progress
                  </CardTitle>
                  <CardDescription>
                    Shows how much of the total installment fees have been
                    collected so far.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-2xl">
                      {data.paidPercent < 10
                        ? data.paidPercent.toFixed(1)
                        : data.paidPercent}
                      % Collected
                    </span>
                  </div>
                  <Progress value={data.paidPercent} />
                </CardContent>
              </Card>

              {/* Table Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    Students with Overdue Payments
                  </CardTitle>
                  <CardDescription>
                    List of students who have overdue installments.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <DataTable columns={columns} data={data.list} />
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}
    </>
  );
}
