import Loader from "@/components/Loader";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { courseFns, courseKeys } from "@/query/courses";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

export default function CourseDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    data: courseDetails,
    error,
    isLoading,
  } = useQuery({
    queryKey: courseKeys.getCourseById(id as string),
    queryFn: () => courseFns.getCourseByIdFn(id!),
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
                <h1 className="text-3xl font-medium">
                  Course Details - {courseDetails?.name}
                </h1>
                <Badge className="text-base" variant="secondary">
                  {courseDetails?.duration_years} Years
                </Badge>
              </div>
              {courseDetails?.description && (
                <div className="ml-6 bg-secondary p-4 rounded-lg">
                  <div className="text-lg font-semibold">Description</div>
                  <p className="text-muted-foreground">
                    {courseDetails?.description}
                  </p>
                </div>
              )}
              {/* Fee Structures */}
              {courseDetails?.fee_structures && (
                <div className="ml-6 mt-4">
                  <h2 className="text-xl font-semibold mb-2">Fee Structure</h2>
                  <Table className="max-w-md w-1/2 border border-border">
                    <TableHeader className="bg-secondary">
                      <TableRow>
                        <TableHead className="pl-4">Year</TableHead>
                        <TableHead>Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {courseDetails.fee_structures.map((fee) => (
                        <TableRow key={fee.id}>
                          <TableCell className="pl-4">{fee.year_number}</TableCell>
                          <TableCell>{fee.total_fee ? `₹ ${fee.total_fee}` : "-"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </>
          )}
        </>
      )}
    </>
    // <div className="flex h-full w-full items-center justify-center">
    //   <h1 className="text-2xl font-bold">Course Details Page</h1>
    // </div>
  );
}
