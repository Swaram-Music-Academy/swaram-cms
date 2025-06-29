import Loader from "@/components/Loader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import DatePicker from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { TimePicker } from "@/components/ui/time-picker";
import { useToast } from "@/hooks/use-toast";
import { Enums, Tables, TablesInsert } from "@/lib/api/types";
import { supabase } from "@/lib/supabase";
import { getAcademicYear } from "@/lib/utils/date";
import { courseFns, courseKeys } from "@/query/courses";
import { useQuery } from "@tanstack/react-query";
import { addYears } from "date-fns";
import { ChevronLeft, CircleMinus, Plus } from "lucide-react";
import { ChangeEventHandler, MouseEventHandler, useState } from "react";
import { CgSpinner } from "react-icons/cg";
import { useNavigate } from "react-router-dom";

type Batch = Tables<"batches">;
type NewBatch = TablesInsert<"batches">;
type CourseYearInsert = TablesInsert<"batch_year_courses">;

type DaysEnum = Enums<"days">;
type TimingInsert = TablesInsert<"batch_schedules">;

export default function AddBatch() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // Information for Batch
  const [details, setDetails] = useState<NewBatch>({
    name: "",
    description: "",
    start_date: new Date().toISOString(),
    end_date: addYears(new Date(), 1).toISOString(),
    academic_year: getAcademicYear(),
  });

  // Information of included courses and Years
  const [courseYears, setCourseYears] = useState<CourseYearInsert[]>([]);
  const [courseYearSelection, setCourseYearSelection] =
    useState<CourseYearInsert>({ course_id: "", year_number: 0 });
  const [years, setYears] = useState<number[]>([]);
  const { data: courseList, isLoading: isCourseLoading } = useQuery({
    queryKey: courseKeys.getCourses(),
    queryFn: courseFns.getCoursesFn,
  });

  // Information related to batch timings
  const [timingSelection, setTimingSelection] = useState<TimingInsert>({
    batch_id: "",
    day_of_week: "",
    start_time: "",
    end_time: "",
  });
  const [schedule, setSchedule] = useState<TimingInsert[]>([]);
  const days: DaysEnum[] = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  // Handlers for Batch Details
  const handleFormSubmit: MouseEventHandler<HTMLButtonElement> = async () => {
    setIsLoading(true);

    // 1. insert batch details and return the inserted row. from().insert().select();
    const { data: batch, error: batchError } = await supabase
      .from("batches")
      .insert([{ ...details }])
      .select();
    if (batchError) {
      toast({
        title: "Error Occurred.",
        description: "Failed to create new batch. Please try again.",
      });
      setIsLoading(false);
      return;
    }
    // 2. Use batch_id to add entries into batch_year_courses
    const { id: batch_id } = batch[0];
    const yearsPayload = courseYears.map((entry) => ({ ...entry, batch_id }));
    const { error: courseError } = await supabase
      .from("batch_year_courses")
      .insert(yearsPayload);
    if (courseError) {
      toast({
        title: "Error Occurred",
        description: "Failed to add course entries. Please try again.",
      });
      await supabase.from("batches").delete().eq("id", batch_id);
      setIsLoading(false);
      return;
    }

    // 3. Use batch_id to add entries into batch_schedules
    const payload = schedule.map((timing) => ({ ...timing, batch_id }));
    const { error: scheduleError } = await supabase
      .from("batch_schedules")
      .insert(payload);
    if (scheduleError) {
      toast({
        title: "Error Occurred",
        description: "Failed to add course entries. Please try again.",
      });
      await supabase.from("batches").delete().eq("id", batch_id);
      setIsLoading(false);
      return;
    }
    navigate("/batches");
  };

  // Edit details of batch
  const handleInputChange: ChangeEventHandler<
    HTMLInputElement | HTMLTextAreaElement
  > = (e) => {
    const target = e.currentTarget;
    const { name, value } = target;
    setDetails((details) => ({
      ...details!,
      [name as keyof Batch]: value,
    }));
  };

  // Handlers for Course an Year Selection
  const handleCourseSelection = (id: string) => {
    const course = courseList?.find((c) => c.id === id);
    if (course) {
      const generatedYears = Array.from(
        { length: course.duration_years },
        (_, i) => i + 1
      );
      setYears(generatedYears);
      setCourseYearSelection({
        course_id: course.id,
        year_number: 0,
      });
    } else {
      setYears([]);
      setCourseYearSelection({ course_id: "", year_number: 0 });
    }
  };
  const handleYearSelection = (value: string) => {
    setCourseYearSelection((data) => ({ ...data, year_number: Number(value) }));
  };
  const appendSelection = () => {
    if (!courseYearSelection.course_id || !courseYearSelection.year_number) {
      toast({
        title: "Error Occurred",
        description: "You need to select course and year before adding.",
        variant: "destructive",
      });
      return;
    }
    setCourseYearSelection({ course_id: "", year_number: 0 });
    setYears([]);
    setCourseYears((data) => [...data, courseYearSelection]);
  };

  // Handlers for Batch Timing Selectors
  const handleDaySelector = (value: string) => {
    setTimingSelection((timing) => ({
      ...timing,
      day_of_week: value as DaysEnum,
    }));
  };
  const handleStartTime = (value: string) => {
    setTimingSelection((timing) => ({
      ...timing,
      start_time: value,
    }));
  };
  const handleEndTime = (value: string) => {
    setTimingSelection((timing) => ({
      ...timing,
      end_time: value,
    }));
  };
  const appendTimeSelection = () => {
    if (
      !timingSelection.day_of_week ||
      !timingSelection.start_time ||
      !timingSelection.end_time
    ) {
      toast({
        title: "Error Occurred",
        description: "You need to select dates and timings before adding.",
      });
      return;
    }
    setSchedule((schedule) => [...schedule, timingSelection]);
    setTimingSelection((prev) => ({
      ...prev,
      day_of_week: "",
      start_time: "",
      end_time: "",
    }));
  };

  //Render the element
  return (
    <>
      {/* Header */}
      <div className="flex gap-4 items-center mb-8">
        <ChevronLeft className="cursor-pointer" onClick={() => navigate(-1)} />
        <h1 className="text-3xl font-bold">Add New Batch</h1>
      </div>
      {/* Container */}
      <div className="flex flex-col xl:flex-row gap-8 mb-4">
        {/* Batch Details */}
        <Card className="xl:w-1/2">
          <div className="flex gap-4 p-8">
            <div className="flex w-full flex-col">
              <h3 className="text-2xl font-medium mb-8">Batch Details</h3>
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    type="text"
                    id="name"
                    name="name"
                    value={details.name}
                    onChange={handleInputChange}
                    autoComplete="off"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Start Date</Label>
                  <DatePicker
                    value={details.start_date!}
                    onValueChange={(value: string) => {
                      setDetails((details) => ({
                        ...details,
                        start_date: value,
                      }));
                    }}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label>End Date</Label>
                  <DatePicker
                    value={details.end_date!}
                    onValueChange={(value: string) => {
                      setDetails((details) => ({
                        ...details,
                        end_date: value,
                      }));
                    }}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    onChange={handleInputChange}
                    value={details?.description || ""}
                  />
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Sub Container */}
        <div className="flex flex-col gap-8 xl:w-1/2">
          {/* Timing Details */}
          <Card className="grow">
            <div className="flex flex-col gap-4 p-8">
              <h3 className="text-2xl font-medium mb-8">Timings</h3>
              {schedule.map((schedule, index) => (
                <div
                  key={index}
                  className="grid grid-cols-[3fr_3fr_3fr_1fr] gap-2 w-full"
                >
                  <Input type="text" value={schedule.day_of_week} disabled />
                  <Input type="text" value={schedule.start_time} disabled />
                  <Input type="text" value={schedule.end_time} disabled />
                  <Button
                    variant={"ghost"}
                    onClick={() => {
                      setSchedule((schedule) =>
                        schedule.filter((_, i) => i !== index)
                      );
                    }}
                  >
                    <CircleMinus className="text-red-500 dark:text-red-400" />
                  </Button>
                </div>
              ))}
              <div className="grid grid-cols-[3fr_3fr_3fr_1fr] gap-2 w-full">
                {/* Day Selector */}
                <Select
                  value={timingSelection.day_of_week}
                  onValueChange={handleDaySelector}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={"Day"} />
                  </SelectTrigger>
                  <SelectContent>
                    {days.map((day, index) => (
                      <SelectItem key={index} value={day}>
                        {day}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {/* Start Time */}
                <TimePicker
                  value={timingSelection.start_time}
                  className="w-auto grow"
                  onChange={handleStartTime}
                />
                {/* End Time */}
                <TimePicker
                  value={timingSelection.end_time}
                  className="w-auto grow"
                  onChange={handleEndTime}
                />
                <Button onClick={appendTimeSelection}>
                  <Plus />
                </Button>
              </div>
            </div>
          </Card>

          {/* Course and Years */}
          <Card className="grow">
            <div className="flex gap-4 p-8">
              <div className="flex w-full flex-col">
                <h3 className="text-2xl font-medium mb-8">Courses and Years</h3>
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    {isCourseLoading ? (
                      <Loader />
                    ) : (
                      <>
                        {courseYears.map((courseYear, index) => (
                          <div key={index} className="flex gap-2">
                            <Input
                              type="text"
                              value={
                                courseList?.find(
                                  (c) => c.id === courseYear.course_id
                                )?.name
                              }
                              disabled
                            />
                            <Input
                              type="text"
                              value={courseYear.year_number}
                              disabled
                            />
                            <Button
                              variant={"ghost"}
                              onClick={() =>
                                setCourseYears((array) =>
                                  array.filter((_, i) => index !== i)
                                )
                              }
                            >
                              <CircleMinus className="text-red-500 dark:text-red-400" />
                            </Button>
                          </div>
                        ))}
                        <div className="w-full flex gap-2">
                          <Select
                            value={
                              courseYearSelection.course_id === null
                                ? ""
                                : courseYearSelection.course_id
                            }
                            onValueChange={(value) =>
                              handleCourseSelection(value)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select Course" />
                            </SelectTrigger>
                            <SelectContent>
                              {courseList?.map((course) => (
                                <SelectItem value={course.id} key={course.id}>
                                  {course.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {/* Year Selection */}
                          <Select
                            value={
                              courseYearSelection.year_number === 0
                                ? ""
                                : courseYearSelection.year_number.toString()
                            }
                            onValueChange={(value) =>
                              handleYearSelection(value)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select Year" />
                            </SelectTrigger>
                            <SelectContent>
                              {years.map((i) => (
                                <SelectItem key={i} value={i.toString()}>
                                  {i}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button onClick={appendSelection}>
                            <Plus />
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
      {/* Submit Buttons */}
      <div className="flex justify-end gap-2">
        <Button
          variant="default"
          onClick={handleFormSubmit}
          disabled={isLoading}
        >
          {isLoading ? <CgSpinner className="animate-spin" /> : "Add"}
        </Button>
        <Button variant="ghost" onClick={() => navigate(-1)}>
          Cancel
        </Button>
      </div>
    </>
  );
}
