import Loader from "@/components/Loader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { TimePicker } from "@/components/ui/time-picker";
import { useToast } from "@/hooks/use-toast";
import { Enums, TablesInsert } from "@/lib/api/types";
import { supabase } from "@/lib/supabase";
import { batchFns, batchKeys } from "@/query/batches";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, CircleMinus, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { CgSpinner } from "react-icons/cg";
import { useNavigate, useParams } from "react-router-dom";

type DaysEnum = Enums<"days">;
const days: DaysEnum[] = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

type TimingInsert = TablesInsert<"batch_schedules">;

export default function EditTimings() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    data: batchDetails,
    error,
    isLoading,
  } = useQuery({
    queryKey: batchKeys.getBatchById(id!),
    queryFn: () => batchFns.getBatchByIdFn(id!),
  });
  const { toast } = useToast();

  // Loading states
  const [submitLoading, setSubmitLoading] = useState(false);
  const [updateDiff, setUpdateDiff] = useState(false);

  // State object for adding new entry for timing
  const [newTimingEntry, setNewTimingEntry] = useState<TimingInsert>({
    batch_id: id!,
    day_of_week: "",
    start_time: "",
    end_time: "",
  });
  // Set of ids that will be removed on submit
  const [entriesToRemove, setEntriesToRemove] = useState<Set<string>>(
    new Set()
  );
  // All the changes to the timing entries including added and edited entries
  const [schedule, setSchedule] = useState<TimingInsert[]>([]);

  // Updating the schedule state to contain already existing records
  useEffect(() => {
    if (batchDetails) setSchedule(batchDetails.batch_schedules);
  }, [batchDetails]);

  // Handlers for adding new Timing Entry
  const handleDaySelector = (value: string) => {
    setNewTimingEntry((prev) => ({ ...prev, day_of_week: value as DaysEnum }));
  };
  const handlStartTime = (value: string) => {
    setNewTimingEntry((prev) => ({ ...prev, start_time: value }));
  };
  const handlEndTime = (value: string) => {
    setNewTimingEntry((prev) => ({ ...prev, end_time: value }));
  };
  const appendTiming = () => {
    if (
      !newTimingEntry.day_of_week ||
      !newTimingEntry.start_time ||
      !newTimingEntry.end_time
    ) {
      toast({
        title: "Error Occurred",
        description: "You need to select dates and timings before adding.",
      });
      return;
    }
    setSchedule((prev) => [...prev, newTimingEntry]);
    setNewTimingEntry({
      batch_id: id!,
      day_of_week: "",
      start_time: "",
      end_time: "",
    });
    if (!updateDiff) setUpdateDiff(true);
  };
  const removeTiming = (idx: number) => {
    const entry = schedule[idx]?.id;
    if (entry) setEntriesToRemove((prev) => new Set(prev).add(entry));
    setSchedule((schedule) => schedule.filter((_, i) => i !== idx));
    if (!updateDiff) setUpdateDiff(true);
  };

  // Handlers for Editing existing Timing Entries
  const editEntryDay = (idx: number, value: string) => {
    const newArray = [...schedule];
    newArray[idx].day_of_week = value as DaysEnum;
    setSchedule(newArray);
    if (!updateDiff) setUpdateDiff(true);
  };
  const editEntryStartTime = (idx: number, value: string) => {
    const newArray = [...schedule];
    newArray[idx].start_time = value;
    setSchedule(newArray);
    if (!updateDiff) setUpdateDiff(true);
  };
  const editEntryEndTime = (idx: number, value: string) => {
    const newArray = [...schedule];
    newArray[idx].end_time = value;
    setSchedule(newArray);
    if (!updateDiff) setUpdateDiff(true);
  };

  // Handler for Submit all schedule entries
  const handleSubmit = async () => {
    setSubmitLoading(true);
    // Delete entries
    const { error: errorDelete } = await supabase
      .from("batch_schedules")
      .delete()
      .in("id", Array.from(entriesToRemove));

    if (errorDelete) {
      toast({
        title: "Error Occurred.",
        description:
          "Error occurred while trying to remove old entries. Please try again later.",
      });
      setSubmitLoading(false);
      return;
    }
    // Update and add  entries
    const { error } = await supabase
      .from("batch_schedules")
      .upsert(
        schedule.filter((entry) => !entry.id || !entriesToRemove.has(entry.id))
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
                <h1 className="text-3xl font-bold">Edit Batch Timings - {batchDetails.name}</h1>
              </div>
              <div className="flex flex-col xl:flex-row gap-8 mb-4">
                <Card className="xl:w-1/2">
                  <CardHeader className="text-xl font-medium">
                    Batch Timings
                  </CardHeader>
                  <CardContent className="flex flex-col gap-2">
                    {schedule.map((entry, index) => (
                      <div
                        key={index}
                        className="grid grid-cols-[3fr_3fr_3fr_1fr] gap-2 w-full"
                      >
                        <Select
                          value={entry.day_of_week}
                          onValueChange={(value) => editEntryDay(index, value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {days.map((day, index) => (
                              <SelectItem key={index} value={day}>
                                {day}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <TimePicker
                          value={entry.start_time.slice(0, 5)}
                          onChange={(value) => editEntryStartTime(index, value)}
                        />
                        <TimePicker
                          value={entry.end_time.slice(0, 5)}
                          onChange={(value) => editEntryEndTime(index, value)}
                        />
                        <Button
                          variant={"ghost"}
                          onClick={() => removeTiming(index)}
                        >
                          <CircleMinus className="text-red-400 dark:text-red-500" />
                        </Button>
                      </div>
                    ))}
                    <div className="grid grid-cols-[3fr_3fr_3fr_1fr] gap-2 w-full">
                      {/* Day of Week */}
                      <Select
                        value={newTimingEntry.day_of_week}
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
                        value={newTimingEntry.start_time}
                        className="w-auto grow"
                        onChange={handlStartTime}
                      />
                      {/* End Time */}
                      <TimePicker
                        value={newTimingEntry.end_time}
                        className="w-auto grow"
                        onChange={handlEndTime}
                      />
                      <Button onClick={appendTiming}>
                        <Plus />
                      </Button>
                    </div>
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
