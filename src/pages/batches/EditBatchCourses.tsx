import Loader from "@/components/Loader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { TablesInsert } from "@/lib/api/types";
import { supabase } from "@/lib/supabase";
import { batchFns, batchKeys } from "@/query/batches";
import { courseFns, courseKeys } from "@/query/courses";
import { SelectValue } from "@radix-ui/react-select";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, CircleMinus, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { CgSpinner } from "react-icons/cg";
import { useNavigate, useParams } from "react-router-dom";

type CourseYearInsert = TablesInsert<"batch_year_courses">;

export default function EditCourses() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Querying all filler details
  const {
    data: batchDetails,
    error,
    isLoading,
  } = useQuery({
    queryKey: batchKeys.getBatchById(id!),
    queryFn: () => batchFns.getBatchByIdFn(id!),
  });
  const { data: courseList, isLoading: isCourseLoading } = useQuery({
    queryKey: courseKeys.getCourses(),
    queryFn: courseFns.getCoursesFn,
  });

  const { toast } = useToast();

  // Loading states
  const [submitLoading, setSubmitLoading] = useState(false);
  const [updateDiff, setUpdateDiff] = useState(false);

  // State object for adding new entry for timing
  const [newCourseEntry, setNewCourseEntry] = useState<CourseYearInsert>({
    batch_id: id!,
    course_id: "",
    year_number: 0,
  });
  const [years, setYears] = useState<number[]>([]);

  // State object that maintains all entries regarding courses and years to be added / edited
  const [entries, setEntries] = useState<CourseYearInsert[]>([]);
  const [entriesYears, setEntriesYears] = useState<number[]>([]);

  // Set of ids that will be removed on submit
  const [entriesToRemove, setEntriesToRemove] = useState<Set<string>>(
    new Set()
  );
  // Updating the schedule state to contain already existing records
  useEffect(() => {
    if (batchDetails && courseList) {
      const arr = batchDetails.batch_year_courses.map((entry) => {
        const course = courseList?.find(
          (course) => course.id === entry.course_id
        );
        return course!.duration_years;
      });
      setEntriesYears(arr);
      setEntries(batchDetails.batch_year_courses);
    }
  }, [batchDetails, courseList]);

  // Handlers to update existing course years records
  const editCourseSelection = (value: string, idx: number) => {
    const course = courseList!.find((c) => c.id === value);
    const newArray = [...entries];
    const newYears = [...entriesYears];
    newArray[idx].course_id = value;
    newArray[idx].year_number = 0;
    newYears[idx] = course!.duration_years;
    setEntries(newArray);
    setEntriesYears(newYears);
    if (!updateDiff) setUpdateDiff(true);
  };
  const editCourseYear = (value: string, idx: number) => {
    const newArray = [...entries];
    newArray[idx].year_number = Number(value);
    setEntries(newArray);
    if (!updateDiff) setUpdateDiff(true);
  };
  // Handlers for New course and year selection:
  const handleCourseSelection = (course_id: string) => {
    const course = courseList?.find((c) => c.id === course_id);
    if (course) {
      const generatedYears = Array.from(
        { length: course.duration_years },
        (_, i) => i + 1
      );
      setYears(generatedYears);
      setNewCourseEntry((prev) => ({
        ...prev,
        course_id: course.id,
        year_number: 0,
      }));
    } else {
      setYears([]);
      setNewCourseEntry({
        batch_id: id!,
        course_id: "",
        year_number: 0,
      });
    }
  };
  const handleYearSelection = (value: string) => {
    setNewCourseEntry((data) => ({ ...data, year_number: Number(value) }));
  };

  // Handler to add newest selection to entries
  const appendEntry = () => {
    if (!newCourseEntry.course_id || !newCourseEntry.year_number) {
      toast({
        title: "Error Occurred",
        description: "You need to select course and year before adding.",
        variant: "destructive",
      });
      return;
    }
    setEntries((prev) => [...prev, newCourseEntry]);
    setEntriesYears((prev) => [...prev, years.length]);
    setNewCourseEntry({ batch_id: id!, course_id: "", year_number: 0 });
    setYears([]);
    if (!updateDiff) setUpdateDiff(true);
  };
  // Maintain a set of ids to be removed
  const removeEntry = (idx: number) => {
    const entry = entries[idx]?.id;
    if (entry) setEntriesToRemove((prev) => new Set(prev).add(entry));
    setEntries((prev) => prev.filter((_, i) => i !== idx));
    setEntriesYears((prev) => prev.filter((_, i) => i !== idx));
    if (!updateDiff) setUpdateDiff(true);
  };

  // Submit Handler
  const handleSubmit = async () => {
    if (entries.some((e) => e.year_number === 0)) {
      toast({
        title: "Error Occurred",
        description: "You have to fill out all fields before submitting.",
      });
      return;
    }
    setSubmitLoading(true);
    const { error: errorDelete } = await supabase
      .from("batch_year_courses")
      .delete()
      .in("id", Array.from(entriesToRemove));

    if (errorDelete) {
      toast({
        title: "Error Occurred.",
        description:
          "Error Occurred while trying to remove old entries. Please try again.",
      });
      setSubmitLoading(false);
      return;
    }

    const { error } = await supabase
      .from("batch_year_courses")
      .upsert(
        entries.filter((entry) => !entry.id || !entriesToRemove.has(entry.id))
      );
    if (error) {
      toast({
        title: "Error Occurred.",
        description: "Error occurred while saving changes. Please try again.",
      });
      setSubmitLoading(false);
      return;
    }
    setSubmitLoading(false);
    navigate(-1);
  };
  return (
    <>
      {isLoading ? (
        <Loader />
      ) : (
        <>
          {error && (
            <div className="w-full h-full flex-items-center justify-center">
              Something went wrong. Please try again.
            </div>
          )}
          {batchDetails && (
            <>
              {/* Header */}
              <div className="flex gap-4 items-center mb-8">
                <ChevronLeft
                  className="cursor-pointer"
                  onClick={() => navigate(-1)}
                />
                <h1 className="text-3xl font-bold">Edit Batch Courses</h1>
              </div>
              <div className="flex flex-col xl:flex-row gap-8 mb-4">
                <Card className="xl:w-1/2">
                  <CardHeader className="text-xl font-medium">
                    Courses and Years
                  </CardHeader>
                  <CardContent className="flex flex-col gap-2">
                    {isCourseLoading ? (
                      <Loader />
                    ) : (
                      <>
                        {entries.map((entry, index) => (
                          <div key={index} className="w-full flex gap-2">
                            <Select
                              value={entry.course_id ?? ""}
                              onValueChange={(value) =>
                                editCourseSelection(value, index)
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {courseList?.map((course) => (
                                  <SelectItem key={course.id} value={course.id}>
                                    {course.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Select
                              value={entry.year_number.toString()}
                              onValueChange={(value) =>
                                editCourseYear(value, index)
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {Array.from(
                                  { length: entriesYears[index] },
                                  (_, i) => i + 1
                                ).map((i) => (
                                  <SelectItem key={i} value={i.toString()}>
                                    {i}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button
                              variant={"ghost"}
                              onClick={() => removeEntry(index)}
                            >
                              <CircleMinus className="text-red-400 dark:text-red-500" />
                            </Button>
                          </div>
                        ))}
                        <div key="index" className="w-full flex gap-2">
                          <Select
                            value={newCourseEntry.course_id ?? ""}
                            onValueChange={handleCourseSelection}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder={"Select Course"} />
                            </SelectTrigger>
                            <SelectContent>
                              {courseList?.map((course) => (
                                <SelectItem key={course.id} value={course.id}>
                                  {course.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Select
                            value={
                              newCourseEntry.year_number === 0
                                ? ""
                                : newCourseEntry.year_number.toString()
                            }
                            onValueChange={handleYearSelection}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder={"Select Year"} />
                            </SelectTrigger>
                            <SelectContent>
                              {years.map((i) => (
                                <SelectItem key={i} value={i.toString()}>
                                  {i}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button onClick={appendEntry}>
                            <Plus />
                          </Button>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>
              {/* Submit Buttons */}
              <div className="flex justify-end gap-2">
                {updateDiff && (
                  <Button
                    className="min-w-20"
                    onClick={handleSubmit}
                    disabled={submitLoading}
                  >
                    {submitLoading ? (
                      <CgSpinner className="animate-spin" />
                    ) : (
                      "Save"
                    )}
                  </Button>
                )}
                <Button variant="ghost" onClick={() => navigate(-1)}>
                  Cancel
                </Button>
              </div>
            </>
          )}
        </>
      )}
    </>
  );
}
