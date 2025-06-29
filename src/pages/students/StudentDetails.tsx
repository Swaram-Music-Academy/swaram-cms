import Loader from "@/components/Loader";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { studentFns, studentKeys } from "@/query/students";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, MoreHorizontal } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import ContactsTable from "./components/ContactsTable";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";
import { feeFns, feeKeys } from "@/query/fees";

export default function StudentDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    data: studentDetails,
    error,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: studentKeys.getStudentById(id!),
    queryFn: () => studentFns.getStudentByIdFn(id!),
  });
  const { data: feeRecords, isLoading: feesLoading } = useQuery({
    queryKey: feeKeys.getPaymentSchedule(id!),
    queryFn: () => feeFns.getPaymentSchedule(id!),
  });

  return (
    <>
      {isLoading || feesLoading ? (
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
                <h1 className="text-2xl">Student Details</h1>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild className="ml-auto">
                    <Button variant={"ghost"} size="icon">
                      <MoreHorizontal />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => navigate(`/students/edit/${id}`)}
                    >
                      Edit Details
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Link
                        to={`/admission-form/${id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View Admission Form
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              {/* Personal Details */}
              <div className="flex mt-8 gap-8 items-center">
                <div>
                  <Avatar className="w-32 h-32">
                    <AvatarImage
                      src={
                        studentDetails?.avatar_url
                          ? supabase.storage
                              .from("students")
                              .getPublicUrl(studentDetails.avatar_url).data
                              .publicUrl
                          : ""
                      }
                    />
                    <AvatarFallback className="text-3xl font-thin">
                      {studentDetails?.first_name.charAt(0).toUpperCase()}
                      {studentDetails?.last_name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div>
                  {/* Name */}
                  <h3 className="text-3xl font-medium mb-2">
                    {studentDetails?.first_name} {studentDetails?.middle_name}{" "}
                    {studentDetails?.last_name}
                  </h3>
                  {/* Badges */}
                  {studentDetails?.date_of_birth && (
                    <Badge variant={"secondary"}>
                      Age:{" "}
                      {(() => {
                        const dob = new Date(studentDetails.date_of_birth);
                        const today = new Date();
                        let age = today.getFullYear() - dob.getFullYear();
                        const hasHadBirthday =
                          today.getMonth() > dob.getMonth() ||
                          (today.getMonth() === dob.getMonth() &&
                            today.getDate() >= dob.getDate());
                        if (!hasHadBirthday) age--;
                        return age;
                      })()}
                    </Badge>
                  )}
                  <Badge variant={"secondary"} className="ml-2">
                    Gender: {studentDetails?.gender}
                  </Badge>
                  <Badge variant={"secondary"} className="ml-2">
                    Admission Date:{" "}
                    {new Date(
                      studentDetails!.admission_date!
                    ).toLocaleDateString("en-US", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </Badge>
                  {/* Adress */}
                  {studentDetails?.addresses && (
                    <Badge className="mt-4 w-1/2" variant={"secondary"}>
                      <p className="flex flex-col leading-5">
                        <span>
                          {studentDetails.addresses.unit && (
                            <span>{studentDetails.addresses.unit} - </span>
                          )}{" "}
                          {studentDetails.addresses.line_1}
                        </span>
                        <span>{studentDetails.addresses.line_2}</span>
                        <span>
                          {studentDetails.addresses.city},{" "}
                          {studentDetails.addresses.state}
                        </span>
                        <span>
                          {studentDetails.addresses.country} -{" "}
                          {studentDetails.addresses.zipcode}
                        </span>
                      </p>
                    </Badge>
                  )}
                </div>
              </div>
              {/* Container */}
              <ContactsTable
                onDataChange={() => refetch()}
                studentContacts={studentDetails?.students_contacts}
              />
              <div className="flex flex-col lg:flex-row gap-x-6 gap-y-3 my-16">
                <div className="lg:w-1/2 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xl font-medium">Enrollments</h4>
                    <Link
                      className="px-2 py-1.5 text-sm text-primary/75"
                      to={`/enrollment/${id}`}
                    >
                      Manage Enrollments
                    </Link>
                  </div>
                  <div className="border border-muted rounded overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Course</TableHead>
                          <TableHead>Batch</TableHead>
                          <TableHead>Current Year</TableHead>
                          <TableHead>Enrollment Date</TableHead>
                          <TableHead>Completion Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {studentDetails?.enrollments.length ? (
                          studentDetails.enrollments
                            .filter((r) => r.status !== "Dropped")
                            .map((record) => (
                              <TableRow key={record.id}>
                                <TableCell>{record.courses!.name}</TableCell>
                                <TableCell>{record.batches!.name}</TableCell>
                                <TableCell>{record.current_year}</TableCell>
                                <TableCell>
                                  {format(record.enrollment_date!, "PPP")}
                                </TableCell>
                                <TableCell>
                                  {format(record.completion_date!, "PPP")}
                                </TableCell>
                              </TableRow>
                            ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={5}>
                              <div className="h-32 w-full flex items-center justify-center">
                                No enrollment records found.
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
                <div className="lg:w-1/2 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xl font-medium">Fee Payment Records</h4>
                    <Link
                      className="px-2 py-1.5 text-sm text-primary/75"
                      to={`/fees/${id}`}
                    >
                      Manage Fee Records
                    </Link>
                  </div>
                  <div className="border border-muted rounded overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Fee Type</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Payment Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {feeRecords && feeRecords.length ? (
                          feeRecords?.map((record, index) => (
                            <TableRow key={index}>
                              <TableCell>{record.fee_type}</TableCell>
                              <TableCell>{record.description}</TableCell>
                              <TableCell>{record.amount}</TableCell>
                              <TableCell>{record.due_date}</TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={4}>
                              <div className="h-32 w-full flex items-center justify-center">
                                No payment records found.
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </>
  );
}
