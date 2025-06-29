import Loader from "@/components/Loader";
import DataTable from "@/components/tables/data-table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { Tables } from "@/lib/api/types";
import { supabase } from "@/lib/supabase";
import { dateString } from "@/lib/utils/date";
import { batchFns, batchKeys } from "@/query/batches";
import { useQuery } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { ArrowDownAZ, ArrowUpAZ, MoreHorizontal, PlusIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";

type Batch = Tables<"batches">;

export default function Batches() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    data: batches,
    error,
    isLoading,
  } = useQuery({
    queryKey: batchKeys.getBatches(),
    queryFn: batchFns.getBatchesFn,
  });

  const removeBatch = async (id: string) => {
    const { error } = await supabase.from("batches").delete().eq("id", id);
    if (error) {
      toast({
        title: "Error occurred",
        description: "Error occurred while deleting batch, please try again.",
      });
    }
    navigate(0);
  };

  const columns: ColumnDef<Batch>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => {
        return (
          <Button
            variant={"ghost"}
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Name
            {column.getIsSorted() === "asc" ? (
              <ArrowDownAZ className="ml-2 h-4 w-4" />
            ) : (
              <ArrowUpAZ className="ml-2 h-4 w-4" />
            )}
          </Button>
        );
      },
      cell: ({ row }) => {
        return <div className="pl-4">{row.original.name}</div>;
      },
    },
    {
      accessorKey: "description",
      header: "Description",
    },
    {
      accessorKey: "start_date",
      header: "Start Date",
      cell: ({ row }) => {
        const date = row.original.start_date;

        return date ? <>{dateString(date)}</> : "";
      },
    },
    {
      accessorKey: "end_date",
      header: "End Date",
      cell: ({ row }) => {
        const date = row.original.end_date;

        return date ? <>{dateString(date)}</> : "";
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const batch = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open Menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => {
                  navigate(`/batches/${batch.id}`);
                }}
              >
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  navigate(`/batches/edit/${batch.id}`);
                }}
              >
                Edit Details
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  navigate(`/batches/edit/${batch.id}/timings`);
                }}
              >
                Edit Timings
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  navigate(`/batches/edit/${batch.id}/courses`);
                }}
              >
                Edit Courses
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  removeBatch(row.original.id);
                }}
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
  return (
    <>
      <div className="flex items-center mb-8">
        <h1 className="text-3xl font-bold">Batches</h1>
        <Button
          onClick={() => navigate("add")}
          className="ml-auto"
          variant={"default"}
        >
          <PlusIcon />
          Add Batch
        </Button>
      </div>
      {isLoading ? (
        <Loader />
      ) : (
        <>
          {error ? (
            <div className="w-full h-full flex items-center justify-center">
              Something went wrong. Please try again
            </div>
          ) : (
            <DataTable columns={columns} data={batches!} />
          )}
        </>
      )}
    </>
  );
}
