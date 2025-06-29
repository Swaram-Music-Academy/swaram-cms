import Loader from "@/components/Loader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import DatePicker from "@/components/ui/date-picker";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Enums, Tables } from "@/lib/api/types";
import { supabase } from "@/lib/supabase";
import { feeFns, feeKeys } from "@/query/fees";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ChevronLeft, Ellipsis } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import FeeProgress from "./components/FeeProgress";
import { enrollmentFns, enrollmentKeys } from "@/query/enrollments";
import { Separator } from "@/components/ui/separator";
import { studentKeys } from "@/query/students";

type Installment = Tables<"student_installments">;

type PaymentMethods = Enums<"payment_type">;

type regPayment = {
  payee: string | null;
  amount: number | null;
  payment_date: string | null;
  payment_method: PaymentMethods;
  reference_number: string | null;
};

type feePayment = regPayment & {
  installment_id: string;
};

const methods: PaymentMethods[] = ["Cash", "Cheque", "UPI"];

const initRegPayload: regPayment = {
  payee: "",
  amount: 1500,
  payment_date: new Date().toISOString(),
  payment_method: "Cash",
  reference_number: null,
};
const initFeePayload: feePayment = {
  installment_id: "",
  payee: "",
  amount: null,
  payment_date: new Date().toISOString(),
  payment_method: "Cash",
  reference_number: null,
};
const initDiscountPayload = {
  summary_id: "",
  discount: 0,
};

export default function FeeDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Data fetching part
  const { data: paymentSchedule, isLoading } = useQuery({
    queryKey: feeKeys.getPaymentSchedule(id!),
    queryFn: () => feeFns.getPaymentSchedule(id!),
  });
  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: feeKeys.getSummary(id!),
    queryFn: () => feeFns.getSummary(id!),
  });
  const { data: enrollmentList, isLoading: enrollmentLoading } = useQuery({
    queryKey: enrollmentKeys.getEnrollmentByStudentId(id!),
    queryFn: () => enrollmentFns.getEnrollmentByStudentIdFn(id!),
  });
  const { data: paymentHistory, isLoading: paymentHistoryLoading } = useQuery({
    queryKey: feeKeys.getPaymentHistory(id!),
    queryFn: () => feeFns.getPaymentHistory(id!),
  });
  const { data: studentDetails, isLoading: studentLoading } = useQuery({
    queryKey: studentKeys.getStudentById(id!),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("students")
        .select("first_name, middle_name, last_name")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
  });

  // state for handling drawer in dropdown
  const [feeSheetOpen, setFeeSheetOpen] = useState(false);
  const [registerationSheetOpen, setRegisterationSheetOpen] = useState(false);
  const [discountSheetOpen, setDiscountSheetOpen] = useState(false);

  const [feePayload, setFeePayload] = useState<feePayment>(initFeePayload);
  const [regPayload, setRegPayload] = useState<regPayment>(initRegPayload);
  const [discountPayload, setDiscountPayload] = useState(initDiscountPayload);

  // This variable is used to list all the corresponsing instalmments when an enrollment is selected during fee payment
  const [installmentList, setInstallmentList] = useState<Installment[]>([]);

  // Handlers for fee Payment
  const feePayloadChange = (
    key: keyof feePayment,
    value: string | number | null
  ) => {
    setFeePayload((prev) => ({ ...prev, [key]: value }));
  };
  const resetFeePayload = () => {
    setRegPayload(initRegPayload);
  };
  const listInstallments = async (value: string) => {
    if (!enrollmentList) return;
    // find course year and student id
    const record = enrollmentList.find((e) => e.id === value);
    const { student_id, course_id, current_year } = record!;

    // use to find summmary
    const { data, error } = await supabase
      .from("student_fee_summary")
      .select(`*, student_installments(*)`)
      .eq("student_id", student_id!)
      .eq("course_id", course_id!)
      .eq("year_number", current_year!)
      .limit(1)
      .single();
    if (error) {
      toast({
        title: "Error Occurred",
        description:
          "Error occurred while fetching installments. Please try again later.",
      });
      return;
    }
    setInstallmentList(data.student_installments);
  };
  const selectInstallment = async (value: string) => {
    feePayloadChange("installment_id", value);
    const amount =
      installmentList.find((i) => i.id === value)?.installment_amount || null;
    setFeePayload((prev) => ({ ...prev, amount, installment_id: value }));
  };

  const submitFees = async () => {
    if (!feePayload.installment_id || !feePayload.payee || !feePayload.amount) {
      toast({
        title: "Missing Values",
        description: "Please fill out missing values.",
      });
      return;
    }
    const { data, error } = await supabase
      .from("receipts")
      .insert({
        payee: feePayload.payee,
        amount: feePayload.amount,
        payment_method: feePayload.payment_method,
        payment_date: feePayload.payment_date,
      })
      .select("*")
      .single();

    if (error) {
      toast({
        title: "Error occurred",
        description:
          "Error occurred while adding payment details. Please try again later",
      });
      return;
    }
    const receiptId = data.id;
    const { error: updateError } = await supabase
      .from("student_installments")
      .update({ payment_status: "Completed", receipt_id: receiptId })
      .eq("id", feePayload.installment_id);
    if (updateError) {
      toast({
        title: "Error occurred",
        description:
          "Error occurred while reflecting payment records. Please try again later.",
      });
      return;
    }
    resetFeePayload();
    setFeeSheetOpen(false);
    refetchData();
  };

  // Handlers for Registeration fees
  const regPayloadChange = (
    key: keyof regPayment,
    value: string | number | null
  ) => {
    setRegPayload((prev) => ({ ...prev, [key]: value }));
  };
  const resetRegPayload = () => {
    setRegPayload(initRegPayload);
  };
  const selectSummary = async (value: string) => {
    if (!enrollmentList) return;
    const record = enrollmentList.find((e) => e.id === value);
    const { student_id, course_id, current_year } = record!;

    const { data, error } = await supabase
      .from("student_fee_summary")
      .select("*")
      .eq("student_id", student_id!)
      .eq("course_id", course_id!)
      .eq("year_number", current_year!)
      .limit(1)
      .single();
    if (error) {
      toast({
        title: "Error Occurred",
        description:
          "Error occurred while fetching summary. Please try again later.",
      });
      return;
    }
    discountPayloadChange("summary_id", data.id);
  };
  const submitRegFees = async () => {
    //Valuidate payload
    if (!regPayload.payee || !regPayload.amount || !regPayload.payment_date) {
      toast({
        title: "Missing Values",
        description: "Please fill out missing values.",
      });
      return;
    }
    if (regPayload.payment_method !== "Cash" && !regPayload.reference_number) {
      toast({
        title: "Missing Reference Number",
        description: "Please provide a reference number for non-cash payments.",
      });
      return;
    }

    const { data: receipt, error } = await supabase
      .from("receipts")
      .insert(regPayload)
      .select()
      .single();
    if (error) {
      toast({
        title: "Error Occurred",
        description:
          "Error occurred while making an entry. Please try again later.",
      });
      return;
    }
    const receiptId = receipt.id;
    const { error: updateError } = await supabase
      .from("student_registeration_fees")
      .update({ receipt_id: receiptId, is_paid: true })
      .eq("student_id", id!);
    if (updateError) {
      toast({
        title: "Error Occurred",
        description:
          "Error occurred while updating records. Please try again later.",
      });
      return;
    }
    setRegisterationSheetOpen(false);
    setRegPayload(initRegPayload);
    // Refresh the summary to reflect changes
    refetchData();
  };

  // Handlers for Discount
  const submitDiscount = async () => {
    console.log(discountPayload);

    const { error } = await supabase
      .from("student_fee_summary")
      .update({ discount: discountPayload.discount })
      .eq("id", discountPayload.summary_id);

    if (error) {
      toast({
        title: "Error Occurred",
        description:
          "Error occurred while applying discount. Please try again later.",
      });
      return;
    }
    setDiscountSheetOpen(false);
    setDiscountPayload(initDiscountPayload);
  };
  const resetDiscountPayload = () => {
    setDiscountPayload(initDiscountPayload);
  };
  const discountPayloadChange = (
    key: keyof typeof initDiscountPayload,
    value: string | number | null
  ) => {
    setDiscountPayload((prev) => ({ ...prev, [key]: value }));
  };

  // Handler to refetch data
  const refetchData = async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: feeKeys.getPaymentSchedule(id!),
      }),
      queryClient.invalidateQueries({ queryKey: feeKeys.getSummary(id!) }),
      queryClient.invalidateQueries({
        queryKey: enrollmentKeys.getEnrollmentByStudentId(id!),
      }),
      queryClient.invalidateQueries({
        queryKey: feeKeys.getPaymentHistory(id!),
      }),
      queryClient.invalidateQueries({
        queryKey: studentKeys.getStudentById(id!),
      }),
    ]);
  };

  return (
    <>
      {isLoading ||
      summaryLoading ||
      enrollmentLoading ||
      paymentHistoryLoading ||
      studentLoading ? (
        <Loader />
      ) : (
        <>
          <div className="flex gap-4 items-center mb-8">
            <ChevronLeft
              onClick={() => {
                navigate(-1);
              }}
              className="font-bold cursor-pointer text-muted-foreground hover:text-secondary-foreground "
            />
            <h1 className="text-3xl font-medium">
              Fee Details - {studentDetails?.first_name}{" "}
              {studentDetails?.middle_name} {studentDetails?.last_name}
            </h1>
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild className="ml-auto">
                <Button variant={"ghost"} size={"icon"}>
                  <Ellipsis />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setFeeSheetOpen(true)}>
                  Record Payment
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setRegisterationSheetOpen(true)}
                >
                  Registeration Fee Payment
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setDiscountSheetOpen(true)}>
                  Offer Discount
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {/* Fee Sheet */}
            <Sheet
              open={feeSheetOpen}
              onOpenChange={(open) => {
                setFeeSheetOpen(open);
                resetFeePayload();
              }}
            >
              <SheetContent className="flex flex-col gap-6">
                <SheetHeader>
                  <SheetTitle>Fee Payment</SheetTitle>
                  <SheetDescription>
                    Make a payment for course here. Click save when you are
                    done.
                  </SheetDescription>
                </SheetHeader>

                <div className="flex flex-col gap-4">
                  <div className="space-y-1">
                    <Label>Select Enrollment</Label>
                    <Select onValueChange={listInstallments}>
                      <SelectTrigger>
                        <SelectValue placeholder="---" />
                      </SelectTrigger>
                      <SelectContent>
                        {enrollmentList?.map((e) => (
                          <SelectItem key={e.id} value={e.id}>
                            {e.courses?.name} - Year {e.current_year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {installmentList.length !== 0 && (
                    <div className="flex flex-col gap-4">
                      <div className="space-y-1">
                        <Label>Select Installment</Label>
                        <Select
                          value={feePayload.installment_id}
                          onValueChange={(value) => {
                            selectInstallment(value);
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="---" />
                          </SelectTrigger>
                          <SelectContent>
                            {installmentList?.map((e) => (
                              <SelectItem
                                disabled={e.payment_status === "Completed"}
                                key={e.id}
                                value={e.id}
                              >
                                Installment {e.installment_number} - ₹
                                {e.installment_amount}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                  <Separator className="" />
                  <span className="text-xs font-medium uppercase">
                    Payment Details
                  </span>
                  <div className="flex flex-col gap-4">
                    <div className="space-y-1">
                      <Label className="text-xs text-foreground/70 font-normal">
                        Payment by
                      </Label>
                      <Input
                        type="text"
                        value={feePayload.payee || ""}
                        onChange={(e) =>
                          feePayloadChange("payee", e.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-foreground/70 font-normal">
                        Payment Method
                      </Label>
                      <Select
                        value={feePayload.payment_method}
                        onValueChange={(value) =>
                          feePayloadChange("payment_method", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {methods.map((m, i) => (
                            <SelectItem key={i} value={m}>
                              {m}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-foreground/70 font-normal">
                        Amount
                      </Label>
                      <Input
                        type={"text"}
                        value={feePayload.amount || undefined}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-foreground/70 font-normal">
                        Date
                      </Label>
                      <DatePicker
                        value={feePayload.payment_date!}
                        onValueChange={(value) =>
                          regPayloadChange("payment_date", value)
                        }
                      />
                    </div>
                  </div>
                </div>
                <SheetFooter className="mt-auto">
                  <div className="flex flex-col w-full gap-1">
                    <Button onClick={submitFees}>Save</Button>
                    <SheetClose asChild>
                      <Button variant="outline">Cancel</Button>
                    </SheetClose>
                  </div>
                </SheetFooter>
              </SheetContent>
            </Sheet>
            <Sheet
              open={registerationSheetOpen}
              onOpenChange={(open) => {
                setRegisterationSheetOpen(open);
                resetRegPayload();
              }}
            >
              <SheetContent className="flex flex-col gap-6">
                <SheetHeader>
                  <SheetTitle>Fee Payment</SheetTitle>
                  <SheetDescription>
                    Make a payment for registeration fee here. Click save when
                    you are done.
                  </SheetDescription>
                </SheetHeader>
                <div className="flex flex-col gap-4 ">
                  <div className="space-y-1">
                    <Label className="text-xs text-foreground/70 font-normal">
                      Payment by
                    </Label>
                    <Input
                      type="text"
                      value={regPayload.payee || ""}
                      onChange={(e) =>
                        regPayloadChange("payee", e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-foreground/70 font-normal">
                      Payment Method
                    </Label>
                    <Select
                      value={regPayload.payment_method}
                      onValueChange={(value) =>
                        regPayloadChange("payment_method", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {methods.map((m, i) => (
                          <SelectItem key={i} value={m}>
                            {m}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {regPayload.payment_method !== "Cash" && (
                    <div className="space-y-1">
                      <Label className="text-xs text-foreground/70 font-normal">
                        Reference Number
                      </Label>
                      <Input
                        type="text"
                        value={regPayload.reference_number || ""}
                        onChange={(e) =>
                          regPayloadChange("reference_number", e.target.value)
                        }
                      />
                    </div>
                  )}
                  <div className="space-y-1">
                    <Label className="text-xs text-foreground/70 font-normal">
                      Amount
                    </Label>
                    <Input
                      type="text"
                      disabled
                      value={regPayload.amount!}
                      onChange={(e) =>
                        regPayloadChange("amount", e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-foreground/70 font-normal">
                      Date
                    </Label>
                    <DatePicker
                      value={regPayload.payment_date!}
                      onValueChange={(value) =>
                        regPayloadChange("payment_date", value)
                      }
                    />
                  </div>
                </div>
                <SheetFooter className="mt-auto">
                  <div className="flex flex-col w-full gap-1">
                    <Button onClick={submitRegFees}>Save</Button>
                    <SheetClose asChild>
                      <Button variant="outline">Cancel</Button>
                    </SheetClose>
                  </div>
                </SheetFooter>
              </SheetContent>
            </Sheet>
            <Sheet
              open={discountSheetOpen}
              onOpenChange={(open) => {
                setDiscountSheetOpen(open);
                resetDiscountPayload();
              }}
            >
              <SheetContent className="flex flex-col gap-6">
                <SheetHeader>
                  <SheetTitle>Offer discount</SheetTitle>
                  <SheetDescription>
                    Offer a discount for enrolled courses. Click save when you
                    are done.
                  </SheetDescription>
                </SheetHeader>
                <div className="flex flex-col gap-4">
                  <div className="space-y-1">
                    <Label>Select Enrollment</Label>
                    <Select
                      onValueChange={(value) => {
                        selectSummary(value);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="---" />
                      </SelectTrigger>
                      <SelectContent>
                        {enrollmentList?.map((e) => (
                          <SelectItem key={e.id} value={e.id}>
                            {e.courses?.name} - Year {e.current_year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-foreground/70 font-normal">
                      Discount amount
                    </Label>
                    <Input
                      type="number"
                      value={discountPayload.discount}
                      onChange={(e) =>
                        discountPayloadChange(
                          "discount",
                          Number(e.target.value)
                        )
                      }
                    />
                  </div>
                </div>
                <SheetFooter className="mt-auto">
                  <div className="flex flex-col w-full gap-1">
                    <Button onClick={submitDiscount}>Save</Button>
                    <SheetClose asChild>
                      <Button variant="outline">Cancel</Button>
                    </SheetClose>
                  </div>
                </SheetFooter>
              </SheetContent>
            </Sheet>
          </div>
          <FeeProgress
            paidAmount={
              paymentHistory?.reduce(
                (prev, curr) => prev + (curr.amount || 0),
                0
              ) || 0
            }
            totalAmount={summary?.reduce((a, b) => a + b.amount, 0) || 0}
            className="shadow-none bg-gradient-to-br from-primary/20 to-primary/5"
          />
          <div className="flex gap-8 my-8 w-full">
            {/* Fee Summary */}
            {/* List records from student_fee_summary and student_registeration_fees */}
            <div className="w-1/2 h-fit rounded-lg overflow-hidden flex gap-2 flex-col border border-border">
              <h3 className="font-semibold px-4 pt-2 text-lg">Fee Summary</h3>
              <Table>
                <TableHeader>
                  <TableRow className="bg-secondary">
                    <TableHead className="px-4">Fee Type</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>Year</TableHead>
                    <TableHead>Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {summary && summary.length !== 0 ? (
                    <>
                      {summary.map((r) => (
                        <TableRow key={r.created_at}>
                          <TableCell className="px-4">
                            <Badge variant={"outline"}>{r.fee_type}</Badge>
                          </TableCell>
                          <TableCell> {r.course || "-"} </TableCell>
                          <TableCell> {r.course || "-"} </TableCell>
                          <TableCell className="text-right">
                            ₹{r.amount}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-accent">
                        <TableCell className="px-4 uppercase text-xs">
                          Total
                        </TableCell>
                        <TableCell
                          colSpan={3}
                          className="text-right font-medium"
                        >
                          ₹{summary.reduce((a, b) => a + b.amount, 0)}
                        </TableCell>
                      </TableRow>
                    </>
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4}>
                        <div className="h-32 flex items-center justify-center">
                          No payment summary
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            {/* Payment Schedule */}
            {/*  List data from student_installments and and registeration */}
            <div className="w-1/2 h-fit rounded-lg overflow-hidden flex gap-2 flex-col border border-border">
              <h3 className="font-semibold px-4 pt-2 text-lg">
                Payment Schedule
              </h3>
              <Table>
                <TableHeader>
                  <TableRow className="bg-secondary">
                    <TableHead className="px-4">Due Date</TableHead>
                    <TableHead>Fee Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paymentSchedule && paymentSchedule.length ? (
                    paymentSchedule.map((e, i) => (
                      <TableRow key={i}>
                        <TableCell className="px-4">
                          {e.due_date ? format(e.due_date, "PPP") : "-"}
                        </TableCell>
                        <TableCell>{e.fee_type}</TableCell>
                        <TableCell>{e.description}</TableCell>
                        <TableCell className="font-medium">
                          ₹{e.amount}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4}>
                        <div className="flex items-center justify-center h-32">
                          <p>No payment history yet</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          <div className="rounded-lg overflow-hidden flex gap-2 flex-col border border-border">
            <h3 className="font-semibold px-4 pt-2 text-lg">Payment History</h3>
            <Table>
              <TableHeader>
                <TableRow className="bg-accent">
                  <TableHead className="px-4">Paid on</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Paid by</TableHead>
                  <TableHead>Receipt</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paymentHistory && paymentHistory.length > 0 ? (
                  paymentHistory.map((record, i) => (
                    <TableRow key={i}>
                      <TableCell className="px-4">
                        {format(record.paid_on!, "PPP")}
                      </TableCell>
                      <TableCell>{record.description}</TableCell>
                      <TableCell>{record.amount}</TableCell>
                      <TableCell>{record.paid_by}</TableCell>
                      <TableCell>
                        <Button variant={"link"} className="p-0">
                          <Link to={`/receipts/${record.receipt_url}`}>
                            View Receipt
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5}>
                      <div className="h-20 flex items-center justify-center">
                        No payments made yet
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </>
  );
}
