import Loader from "@/components/Loader";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { dateString, getTimeString } from "@/lib/utils/date";
import { batchFns, batchKeys } from "@/query/batches";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

export default function BatchDetails() {
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

  return (
    <>
      {isLoading ? (
        <Loader />
      ) : (
        <>
          {error ? (
            <div className="w-full h-full flex items-center justify-center">
              Something went wrong. Please try again
            </div>
          ) : (
            <>
              <div className="flex gap-4 items-center mb-4">
                <ChevronLeft
                  onClick={() => {
                    navigate(-1);
                  }}
                  className="font-bold cursor-pointer text-muted-foreground hover:text-secondary-foreground "
                />
                <h1 className="text-3xl font-bold">
                  Batch Details - {batchDetails?.name}
                </h1>
              </div>
              <div className="flex flex-col bg-secondary p-4 rounded-md mb-4">
                <p> {batchDetails?.description}</p>
              </div>
              {/* Metadata */}
              <div className="grid grid-cols-[2fr_4fr] lg:w-2/3 gap-2 mb-8">
                <p className="text-muted-foreground">Academic Year</p>
                <p className="">{`${batchDetails?.academic_year}`}</p>
                <p className="text-muted-foreground">Start Date</p>
                <p className="">{dateString(batchDetails!.start_date!)}</p>
                <p className="text-muted-foreground">End Date</p>
                <p className="">{dateString(batchDetails!.end_date!)}</p>
              </div>
              <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-medium mb-2">Schedule</h3>
                  </div>

                  <div className="border border-muted rounded overflow-hidden">
                    <Table>
                      <TableHeader className="bg-secondary">
                        <TableRow>
                          <TableHead className="w-auto">Day of Week</TableHead>
                          <TableHead>Start Time</TableHead>
                          <TableHead>End Time</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {batchDetails?.batch_schedules.length ? (
                          <>
                            {batchDetails.batch_schedules.map((schedule) => (
                              <TableRow
                                key={schedule.day_of_week}
                                className="text-muted-foreground"
                              >
                                <TableCell className="w=[100px]">
                                  {schedule.day_of_week}
                                </TableCell>
                                <TableCell>
                                  {getTimeString(schedule.start_time)}
                                </TableCell>
                                <TableCell>
                                  {getTimeString(schedule.end_time)}
                                </TableCell>
                              </TableRow>
                            ))}
                          </>
                        ) : (
                          <TableRow>
                            <TableCell colSpan={3}>
                              <div className="h-32 w-full flex items-center justify-center">
                                No schedule records found.
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                      <TableFooter className="bg-secondary">
                        <TableRow>
                          <TableCell
                            colSpan={2}
                            className="text-right"
                          ></TableCell>
                          <TableCell className="">
                            <p className="text-xs uppercase text-muted-foreground mr-2 inline-block">
                              Total Days
                            </p>
                            <p className="uppercase inline-block">
                              {batchDetails?.batch_schedules.length}
                            </p>
                          </TableCell>
                        </TableRow>
                      </TableFooter>
                    </Table>
                  </div>
                </div>
                <div className="">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-medium mb-2">
                      Courses and Years Included
                    </h3>
                  </div>
                  <div className="border border-muted rounded overflow-hidden">
                    <Table>
                      <TableHeader className="bg-secondary">
                        <TableRow>
                          <TableHead className="w-auto">Course Name</TableHead>
                          <TableHead>Year</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {batchDetails?.batch_year_courses.length ? (
                          <>
                            {batchDetails.batch_year_courses.map(
                              (entry, index) => (
                                <TableRow
                                  key={index}
                                  className="text-muted-foreground"
                                >
                                  <TableCell className="w=[100px] font-medium">
                                    {entry.courses?.name}
                                  </TableCell>
                                  <TableCell>{entry.year_number}</TableCell>
                                </TableRow>
                              )
                            )}
                          </>
                        ) : (
                          <TableRow>
                            <TableCell colSpan={3}>
                              <div className="h-32 w-full flex items-center justify-center">
                                No course records found.
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </section>
            </>
          )}
        </>
      )}
    </>
  );
}
