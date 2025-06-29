import Loader from "@/components/Loader";
import { Button } from "@/components/ui/button";
import DatePicker from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectValue,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Enums, TablesInsert, TablesUpdate } from "@/lib/api/types";
import { supabase } from "@/lib/supabase";
import { courseFns, courseKeys } from "@/query/courses";
import { studentFns, studentKeys } from "@/query/students";
import { useQuery } from "@tanstack/react-query";
import { add, format } from "date-fns";
import { ChevronLeft, Save, Trash2 } from "lucide-react";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

type EnrollmentRecord = TablesInsert<"enrollments">;
type EnrollmentUpdate = TablesUpdate<"enrollments">;
type EnrollmentStatus = Enums<"enrollment_status">;
export default function EnrollStudent() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  // State Variables for adding new data
  const [isAdding, setIsAdding] = useState(false);
  const initPayload: EnrollmentRecord = {
    student_id: id!,
    enrollment_date: new Date().toISOString(),
    completion_date: add(new Date(), {
      years: 1,
    }).toISOString(),
  };
  const [payload, setPayload] = useState<EnrollmentRecord>(initPayload);

  // State variables for editing record
  const [isEditing, setIsEditing] = useState(false);
  const [editingPayload, setEditingPayload] = useState<EnrollmentUpdate[]>([]);
  const [updateDiff, setUpdateDiff] = useState(false);
  // Static Data Fetching
  const statuses: EnrollmentStatus[] = ["Enrolled", "Dropped", "Completed"];
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: studentKeys.getStudentById(id!),
    queryFn: () => studentFns.getStudentByIdFn(id!),
  });
  const {
    data: courses,
    isLoading: courseLoading,
    error: courseError,
  } = useQuery({
    queryKey: courseKeys.getCourses(),
    queryFn: () => courseFns.getCoursesFn(),
  });
  const {
    data: batches,
    isLoading: batchLoading,
    error: batchError,
  } = useQuery({
    queryKey: ["batches"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("batch_year_courses")
        .select("id, course_id, year_number, batches(id, name)");
      if (error) throw error;
      return data;
    },
  });
  // Handling new data submission
  const handleNew = () => {
    setIsAdding(true);
  };
  const cancelNew = () => {
    setIsAdding(false);
    setPayload(initPayload);
  };
  const payloadChangeHandler = (
    key: keyof EnrollmentRecord,
    value: string | number | undefined
  ) => {
    setPayload((prev) => ({ ...prev, [key]: value }));
  };
  const submitNewRecord = async () => {
    if (!payload.course_id || !payload.batch_id || !payload.current_year) {
      toast({
        title: "Invalid Submission",
        description: "Please fill all field s.",
      });
      return;
    }

    const { data, error } = await supabase
      .from("enrollments")
      .insert(payload)
      .select()
      .single();
    if (error) {
      toast({
        title: "Error occurred",
        description:
          "Error occurred while inserting record. Please try again later.",
      });
      return;
    }
    await supabase.rpc("create_fee_summary", {
      enrollment_id: data.id,
    });
    cancelNew();
    refetch();
  };

  // Handler for editing enrollments
  const editRecords = () => {
    setIsAdding(false);
    setPayload(initPayload);
    setIsEditing(true);
    setEditingPayload(
      data!.enrollments!.map((r) => ({
        id: r.id,
        batch_id: r.batch_id,
        course_id: r.course_id,
        status: r.status,
        completion_date: r.completion_date,
        enrollment_date: r.enrollment_date,
        current_year: r.current_year,
      }))
    );
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditingPayload([]);
    setUpdateDiff(false);
  };
  const editRecordHandler = (
    index: number,
    key: keyof EnrollmentUpdate,
    value: string | number | undefined
  ) => {
    setUpdateDiff(true);
    setEditingPayload((prev) => {
      const newArr = [...prev];
      newArr[index] = { ...newArr[index], [key]: value };
      return newArr;
    });
  };

  const submitEditChanges = async () => {
    // validation
    const missingValues = editingPayload.some(
      (record) => !record.course_id || !record.batch_id || !record.current_year
    );
    if (missingValues) {
      toast({
        title: "Missing Values",
        description: "Please fill in all values.",
      });
      return;
    }
    console.table(editingPayload);
    const { error } = await supabase.from("enrollments").upsert(editingPayload);
    if (error) {
      console.error(error);
      toast({
        title: "Error occurred",
        description:
          "Error occurred whule updating records, please try again later.",
      });
    }
    cancelEditing();
    refetch();
  };

  return (
    <>
      {isLoading || courseLoading || batchLoading ? (
        <Loader />
      ) : (
        <>
          {(error || batchError || courseError) && (
            <div className="w-full h-full flex items-center justify-center">
              Something went wrong. Please try again later.
            </div>
          )}
          {data && (
            <>
              <div className="flex gap-4 items-center mb-8">
                <ChevronLeft
                  className="cursor-pointer"
                  onClick={() => navigate(-1)}
                />
                <h1 className="text-3xl font-medium">
                  Manage enrollments -{" "}
                  {`${data.first_name} ${data.middle_name} ${data.last_name}`}
                </h1>

                <Button
                  className="ml-auto"
                  onClick={() => (isAdding ? cancelNew() : handleNew())}
                >
                  {isAdding ? "Cancel changes" : "New Enrollment"}
                </Button>
                <Button
                  disabled={data.enrollments.length === 0}
                  variant={"ghost"}
                  onClick={() => (isEditing ? cancelEditing() : editRecords())}
                >
                  {isEditing ? "Cancel Editing" : "Edit Enrollments"}
                </Button>
              </div>

              {/* Table Here */}
              <Table className="border border-border">
                <TableHeader className="bg-secondary">
                  <TableRow>
                    <TableHead>Course</TableHead>
                    <TableHead>Current Year</TableHead>
                    <TableHead>Batch</TableHead>
                    <TableHead>Enrollment Date</TableHead>
                    <TableHead>Completion Date</TableHead>
                    <TableHead>Status</TableHead>
                    {isAdding && <TableHead>Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.enrollments.length > 0 ? (
                    data.enrollments.map((record, index) =>
                      isEditing ? (
                        <TableRow key={record.id}>
                          <TableCell>
                            <Select
                              value={editingPayload[index].course_id!}
                              onValueChange={(value) => {
                                editRecordHandler(index, "course_id", value);
                                editRecordHandler(index, "batch_id", undefined);
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {courses!.map((c) => (
                                  <SelectItem key={c.id} value={c.id}>
                                    {c.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={
                                editingPayload[index].current_year || undefined
                              }
                              onChange={(e) => {
                                editRecordHandler(
                                  index,
                                  "current_year",
                                  Number(e.currentTarget.value)
                                );
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Select
                              value={
                                editingPayload[index].batch_id || undefined
                              }
                              onValueChange={(value: string) =>
                                editRecordHandler(index, "batch_id", value)
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select Batch" />
                              </SelectTrigger>
                              <SelectContent>
                                {(() => {
                                  const seen = new Set<string>();
                                  return batches
                                    ?.filter(
                                      (b) =>
                                        b.course_id ===
                                          editingPayload[index].course_id &&
                                        (b.year_number
                                          ? b.year_number ===
                                            editingPayload[index].current_year
                                          : true)
                                    )
                                    .filter((b) => {
                                      const id = b.batches!.id;
                                      if (seen.has(id)) return false;
                                      seen.add(id);
                                      return true;
                                    })
                                    ?.map((batch) => (
                                      <SelectItem
                                        key={batch.id}
                                        value={batch.batches!.id}
                                      >
                                        {batch.batches?.name}
                                      </SelectItem>
                                    ));
                                })()}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <DatePicker
                              value={editingPayload[index].enrollment_date!}
                              onValueChange={(value) =>
                                editRecordHandler(
                                  index,
                                  "enrollment_date",
                                  value
                                )
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <DatePicker
                              value={editingPayload[index].completion_date!}
                              onValueChange={(value) =>
                                editRecordHandler(
                                  index,
                                  "enrollment_date",
                                  value
                                )
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <Select
                              value={editingPayload[index].status!}
                              onValueChange={(value) =>
                                editRecordHandler(index, "status", value)
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {statuses.map((status, index) => (
                                  <SelectItem key={index} value={status}>
                                    {status}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                        </TableRow>
                      ) : (
                        <TableRow key={record.id}>
                          <TableCell>{record.courses?.name}</TableCell>
                          <TableCell>{record.current_year}</TableCell>
                          <TableCell>{record.batches?.name}</TableCell>
                          <TableCell>
                            {format(record.enrollment_date!, "PPP")}
                          </TableCell>
                          <TableCell>
                            {format(record.completion_date!, "PPP")}
                          </TableCell>
                          <TableCell>{record.status}</TableCell>
                        </TableRow>
                      )
                    )
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7}>
                        <div className="p-4 flex justify-center">
                          No enrollment records found.
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                  {isAdding && (
                    <TableRow>
                      <TableCell>
                        <Select
                          value={payload.course_id || ""}
                          onValueChange={(value: string) => {
                            payloadChangeHandler("course_id", value);
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select Course" />
                          </SelectTrigger>
                          <SelectContent>
                            {courses!.map((course) => (
                              <SelectItem key={course.id} value={course.id}>
                                {course.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={payload.current_year || ""}
                          onChange={(e) =>
                            payloadChangeHandler(
                              "current_year",
                              e.target.value
                                ? Number(e.target.value)
                                : undefined
                            )
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Select
                          value={payload.batch_id || ""}
                          onValueChange={(value: string) =>
                            payloadChangeHandler("batch_id", value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select Batch" />
                          </SelectTrigger>
                          <SelectContent>
                            {(() => {
                              const seen = new Set<string>();
                              return batches
                                ?.filter(
                                  (b) =>
                                    (payload.course_id
                                      ? b.course_id === payload.course_id
                                      : false) &&
                                    (payload.current_year
                                      ? payload.current_year === b.year_number
                                      : true)
                                )
                                .filter((b) => {
                                  const id = b.batches!.id;
                                  if (seen.has(id)) return false;
                                  seen.add(id);
                                  return true;
                                })
                                .map((batch) => (
                                  <SelectItem
                                    key={batch.id}
                                    value={batch.batches!.id}
                                  >
                                    {batch.batches?.name}
                                  </SelectItem>
                                ));
                            })()}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <DatePicker
                          value={
                            payload.enrollment_date || new Date().toISOString()
                          }
                          onValueChange={(value) =>
                            payloadChangeHandler("enrollment_date", value)
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <DatePicker
                          value={
                            payload.completion_date ||
                            new Date(
                              new Date().setFullYear(
                                new Date().getFullYear() + 1
                              )
                            ).toISOString()
                          }
                          onValueChange={(value) =>
                            payloadChangeHandler("completion_date", value)
                          }
                        />
                      </TableCell>
                      <TableCell></TableCell>
                      <TableCell>
                        <Button
                          onClick={() => submitNewRecord()}
                          variant={"ghost"}
                          size={"icon"}
                        >
                          <Save />
                        </Button>
                        <Button
                          variant={"ghost"}
                          size={"icon"}
                          onClick={cancelNew}
                        >
                          <Trash2 />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              <div className="flex justify-end mt-4">
                {updateDiff && (
                  <Button onClick={submitEditChanges}>Save Changes</Button>
                )}
              </div>
            </>
          )}
        </>
      )}
    </>
  );
}
