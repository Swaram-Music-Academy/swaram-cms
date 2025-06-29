import { Tables } from "@/lib/api/types";
import { useQuery } from "@tanstack/react-query";
import { studentFns, studentKeys } from "@/query/students";
import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import DataTable from "@/components/tables/data-table";
import Loader from "@/components/Loader";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { QueryData } from "@supabase/supabase-js";

type Student = Tables<"students">;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const studentContactQuery = supabase
  .from("students")
  .select("*, students_contacts(*)")
  .single();

type StudentWithContacts = QueryData<typeof studentContactQuery>;

export default function Students() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    data: students,
    error,
    isLoading,
  } = useQuery({
    queryKey: studentKeys.getStudents(),
    queryFn: studentFns.getStudentsFn,
  });
  const [searchQuery, setSearchQuery] = useState<string>("");

  const filteredStudents = useMemo(() => {
    const normalizedQuery = searchQuery.toLowerCase().trim();
    return students?.filter((student) => {
      const fullname = [
        student.first_name,
        student.middle_name,
        student.last_name,
      ]
        .filter(Boolean) // remove empty or null parts
        .join(" ")
        .toLowerCase();
      return fullname.includes(normalizedQuery);
    });
  }, [students, searchQuery]);

  // State for multiple row selections.
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  // Helper to toggle ID in selection
  const toggleId = (id: string) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  // Helper to toggle all visible (filteredStudents) selection
  const toggleAllVisible = (checked: boolean) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (checked) {
        filteredStudents?.forEach((s) => newSet.add(s.id));
      } else {
        filteredStudents?.forEach((s) => newSet.delete(s.id));
      }
      return newSet;
    });
  };

  const deleteStudentByData = async (student: StudentWithContacts) => {
    // Delete student record
    const { error: studentError } = await supabase
      .from("students")
      .delete()
      .eq("id", student.id);

    if (studentError) {
      toast({
        title: "Error occurred",
        description: `Error deleting student with ID ${student.id}.`,
      });
    }

    // Delete address
    const { error: addressError } = await supabase
      .from("addresses")
      .delete()
      .eq("id", student.id);

    if (addressError) {
      toast({
        title: "Error occurred",
        description: `Error deleting address for student ID ${student.id}.`,
      });
    }

    // Delete orphan contacts
    const contactsList = student.students_contacts.map((r) => r.contact_id);
    const { error: contactsError } = await supabase
      .from("contacts")
      .delete()
      .in("id", contactsList);
    if (contactsError) {
      toast({
        title: "Error occurred",
        description: `Error deleting contacts for student ID ${student.id}.`,
      });
    }
    // Delete avatar from storage if exists
    if (student.avatar_url) {
      const { error: storageError } = await supabase.storage
        .from("students")
        .remove([student.avatar_url]);

      if (storageError) {
        toast({
          title: "Error occurred",
          description: `Error deleting avatar for student ID ${student.id}.`,
        });
      }
    }
  };

  // Method to remove student record
  const removeStudent = async (id: string) => {
    const { data } = await supabase
      .from("students")
      .select("*, students_contacts(*)")
      .eq("id", id)
      .single();

    if (error || !data) {
      toast({
        title: "Error occurred",
        description: "Error fetching student record. Please try again.",
      });
      return;
    }
    await deleteStudentByData(data);
    navigate(0);
  };

  // Mthod to bulk remove records
  const deleteSelected = async () => {
    // Do here everything.
    const ids = [...selectedIds];
    if (selectedIds.size === 0) return;
    const { data, error } = await supabase
      .from("students")
      .select("*, students_contacts(*)")
      .in("id", ids);

    if (error || !data) {
      toast({
        title: "Error",
        description: "Could not fetch student records for deletion.",
      });
      return;
    }

    if (data.length === 0) {
      toast({
        title: "No Records",
        description: "No student records found for deletion.",
      });
      return;
    }

    // Bulk delete student rows
    const { error: deleteError } = await supabase
      .from("students")
      .delete()
      .in("id", ids);

    if (deleteError) {
      toast({
        title: "Error occurred",
        description: "Error deleting student records. Please try again.",
      });
    }
    // Bulk delete address rows
    const { error: addressError } = await supabase
      .from("addresses")
      .delete()
      .in("id", ids);

    if (addressError) {
      toast({
        title: "Error occurred",
        description: "Error deleting address records. Please try again.",
      });
    }

    // Remove all contacts
    const contactsList = data
      .map((r) => r.students_contacts.map((s) => s.contact_id))
      .flat();

    const { error: contactsError } = await supabase
      .from("contacts")
      .delete()
      .in("id", contactsList);
    if (contactsError) {
      toast({
        title: "Error occurred.",
        description: `Error deleting contacts for selected students`,
      });
    }

    // Collect all avatar paths
    const avatarPaths = data
      .filter((student) => student.avatar_url)
      .map((student) => student.avatar_url as string);

    if (avatarPaths.length > 0) {
      const { error: storageError } = await supabase.storage
        .from("students")
        .remove(avatarPaths);

      if (storageError) {
        toast({
          title: "Error occurred",
          description: "Error deleting student avatars from storage.",
        });
      }
    }

    toast({
      title: "Success",
      description: `${ids.length} student(s) deleted successfully.`,
    });

    // Refetch data.
    navigate(0);
    setSelectedIds(new Set());
  };

  // Defining columns for our datatable
  const columns: ColumnDef<Student>[] = [
    {
      id: "select",
      header: () => {
        const checkedValue =
          filteredStudents && filteredStudents.length === 0
            ? false
            : filteredStudents!.every((s) => selectedIds.has(s.id))
            ? true
            : filteredStudents!.some((s) => selectedIds.has(s.id))
            ? "indeterminate"
            : false;
        return (
          <Checkbox
            checked={checkedValue}
            onCheckedChange={(checked) => toggleAllVisible(!!checked)}
            aria-label="Select all"
          />
        );
      },
      cell: ({ row }) => (
        <Checkbox
          checked={selectedIds.has(row.original.id)}
          onCheckedChange={() => toggleId(row.original.id)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "gr_no",
      header: () => <p className="pl-4">GR NO.</p>,
      cell: ({ row }) => <p className="pl-4">{row.original.gr_no}</p>,
    },
    {
      accessorKey: "Full Name",
      header: "Full Name",
      cell: ({ row }) => {
        const name = `${row.original.first_name} ${row.original.middle_name} ${row.original.last_name}`;
        return (
          // Add avatar here later
          <Link to={`/students/${row.original.id}`}>
            <div className="flex items-center gap-4">
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
      accessorKey: "date_of_birth",
      header: () => <p>Date of Birth</p>,
      cell: ({ row }) => (
        <div className="">
          {new Date(row.original.date_of_birth).toLocaleDateString("en-US", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}
        </div>
      ),
    },
    {
      accessorKey: "gender",
      header: () => <p>Gender</p>,
      cell: ({ row }) => <p>{row.original.gender}</p>,
    },
    {
      accessorKey: "admission_date",
      header: () => <p>Admission Date</p>,
      cell: ({ row }) => (
        <div className="">
          {new Date(row.original.admission_date).toLocaleDateString("en-US", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}
        </div>
      ),
    },
    {
      accessorKey: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const student = row.original;
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
                  navigate(`/students/${student.id}`);
                }}
              >
                View Student Details
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  navigate(`/students/edit/${student.id}`);
                }}
              >
                Edit Student Details
              </DropdownMenuItem>
              {/* <DropdownMenuItem> */}
              <Dialog>
                <DialogTrigger
                  className={cn(
                    "w-full hover:bg-neutral-100 dark:hover:bg-neutral-800 relative flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&>svg]:size-4 [&>svg]:shrink-0"
                  )}
                >
                  Delete Student Record
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="mb-4">
                      Are you absolutely sure?
                    </DialogTitle>
                    <DialogDescription>
                      This action cannot be undone. This will permanently remove
                      student records from our servers.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant={"ghost"} type="button">
                        Cancel
                      </Button>
                    </DialogClose>
                    <DialogClose asChild>
                      <Button
                        variant={"destructive"}
                        type="button"
                        onClick={() => removeStudent(student.id)}
                      >
                        Delete
                      </Button>
                    </DialogClose>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              {/* </DropdownMenuItem> */}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
  return (
    <>
      <div className="flex items-center mb-8 gap-4">
        <h1 className="text-3xl font-semibold">Students</h1>
        <Input
          onChange={(e) => setSearchQuery(e.currentTarget.value)}
          className="ml-auto max-w-72"
          placeholder="Search Records"
        />
        <Button
          onClick={() => navigate("add")}
          className=""
          variant={"default"}
        >
          <PlusIcon />
          New Registeration
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
            <DataTable columns={columns} data={filteredStudents!} />
          )}
          {/* Popup below the table */}
          {selectedIds.size > 0 && (
            <div className="fixed bg-background bottom-4 left-1/2 transform -translate-x-1/2 z-50 rounded-md shadow-md px-4 py-2 border border-border flex items-center gap-2 text-sm">
              <p className="mr-8">
                {selectedIds.size} record{selectedIds.size !== 1 && "s"}{" "}
                selected
              </p>
              <Button variant="destructive" size="sm" onClick={deleteSelected}>
                Delete Selected
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setSelectedIds(new Set())}
              >
                Clear Selection
              </Button>
            </div>
          )}
        </>
      )}
    </>
  );
}
