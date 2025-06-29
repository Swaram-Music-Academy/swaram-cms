import Loader from "@/components/Loader";
import { Badge } from "@/components/ui/badge";
import { Enums } from "@/lib/api/types";
import { supabase } from "@/lib/supabase";
import { useQuery } from "@tanstack/react-query";

type DaysEnum = Enums<"days">;

export default function WeeklyTimetable() {
  const days: DaysEnum[] = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const timeSlots = ["18:00", "19:00", "20:00"];
  type TimetableData = {
    [slot: string]: {
      [day: string]: { name: string }[];
    };
  };

  const { data, error, isLoading } = useQuery<TimetableData>({
    queryKey: ["timetable"],
    queryFn: async () => {
      // Simulate fetching timetable data
      const { data, error } = await supabase.rpc("get_timetable_by_slot");
      if (error) {
        throw error;
      }
      return data as TimetableData;
    },
  });

  console.log(data);
  return (
    <>
      {isLoading ? (
        <Loader />
      ) : (
        <>
          {error && (
            <div className="w-full h-full flex items-center justify-center">
              Something went wrong while fetching timetable data. Please try
              again later.
            </div>
          )}
          {data && (
            <>
              <div className="flex items-center mb-8 gap-4">
                <h1 className="text-3xl font-semibold">
                  Weekly Class Timetable
                </h1>
              </div>
              {/* Grid: +1 for time column, +7 for days */}
              <div className="border border-border">
                {/* Head Row */}
                <div className="grid grid-cols-[1fr_repeat(6,2fr)] w-full">
                  <div className="bg-accent border-border border"></div>
                  {days.map((day) => (
                    <div
                      className={`bg-accent border-border text-center border border-l-0 p-2`}
                      key={day}
                    >
                      <span className="font-medium text-muted-foreground">
                        {day.slice(0, 3)}
                      </span>
                    </div>
                  ))}
                </div>
                {/* Timing Row */}
                {timeSlots.map((slot) => (
                  <div
                    key={slot}
                    className="grid grid-cols-[1fr_repeat(6,2fr)] w-full"
                  >
                    <div className="text-sm font-semibold text-muted-foreground bg-accent border-border border min-h-32 flex items-center justify-center">
                      {slot}
                    </div>
                    {days.map((day) => (
                      <div
                        className={`border-border border border-l-0 min-h-32 py-4 p-2 flex flex-col gap-2`}
                        key={day}
                      >
                        {data[slot][day].map((batch) => (
                          <Badge className="bg-green-600/80 hover:bg-green-600/90 cursor-default text-sm">
                            {batch.name}
                          </Badge>
                        ))}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </>
  );
}
