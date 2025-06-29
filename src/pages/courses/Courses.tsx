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
import { ColumnDef } from "@tanstack/react-table";
import {
  ArrowDown01,
  ArrowDownAZ,
  ArrowUp01,
  ArrowUpAZ,
  MoreHorizontal,
  PlusIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

type Course = Tables<"courses">;

export default function CoursePage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [courses, setCourses] = useState<Course[] | null>(null);
  useEffect(() => {
    const fetchCourses = async () => {
      const { data, error } = await supabase.from("courses").select();
      if (error) {
        toast({
          variant: "destructive",
          title: "Error occurred",
          description: "Error occurred while fetching data, please try again.",
        });
        return;
      }
      setCourses(data);
    };
    fetchCourses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const removeCourse = async (id: string) => {
    const { error } = await supabase.from("courses").delete().eq("id", id);
    if (error) {
      toast({
        title: "Error occurred",
        description: "Error occurred while deleting course, please try again.",
      });
    }
    navigate(0);
  };

  // Setting columns for our datatable
  const columns: ColumnDef<Course>[] = [
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
    { accessorKey: "description", header: "Description" },
    {
      accessorKey: "duration_years",
      header: ({ column }) => {
        return (
          <Button
            variant={"ghost"}
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Years Duration
            {column.getIsSorted() === "asc" ? (
              <ArrowDown01 className="ml-2 h-4 w-4" />
            ) : (
              <ArrowUp01 className="ml-2 h-4 w-4" />
            )}
          </Button>
        );
      },
      cell: ({ row }) => {
        return <div className="pl-4">{row.original.duration_years}</div>;
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const course = row.original;
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
                onClick={() => navigate(`/courses/${course.id}`)}
              >
                View Course Details
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  navigate(`/courses/edit/${course.id}`);
                }}
              >
                Edit Course Details
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  navigate(`/courses/edit/${course.id}/fee-structure`);
                }}
              >
                Edit Course Fees
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  removeCourse(row.original.id);
                }}
              >
                Delete Course
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
        <h1 className="text-3xl font-semibold">Courses</h1>
        <Button
          onClick={() => navigate("add")}
          className="ml-auto"
          variant={"default"}
        >
          <PlusIcon />
          Add Course
        </Button>
      </div>
      {courses ? <DataTable columns={columns} data={courses} /> : <Loader />}
    </>
  );
}
