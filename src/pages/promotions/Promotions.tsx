import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { promotionFns, promotionKeys } from "@/query/promotions";
import Loader from "@/components/Loader";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { formatNumberIndian } from "@/lib/utils/amount";
import { AlertTriangle, CheckCircle, ChevronRight, Info } from "lucide-react";
import { Link } from "react-router-dom";

export default function Promotions() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 1 state
  const [selectedSourceId, setSelectedSourceId] = useState<string>("");
  const [selectedTargetBatchId, setSelectedTargetBatchId] =
    useState<string>("");

  // Step 2 state
  const [selectedEnrollments, setSelectedEnrollments] = useState<Set<string>>(
    new Set()
  );

  // Fetch batch+course+year combinations
  const { data: batchOptions, isLoading: batchesLoading } = useQuery({
    queryKey: promotionKeys.batchesForPromotion(),
    queryFn: promotionFns.getBatchesForPromotion,
  });

  // Derive selected source info
  const sourceInfo = useMemo(() => {
    if (!selectedSourceId || !batchOptions) return null;
    return batchOptions.find((b) => b.id === selectedSourceId) || null;
  }, [selectedSourceId, batchOptions]);

  const isFinalYear = sourceInfo
    ? sourceInfo.yearNumber >= sourceInfo.durationYears
    : false;

  // Fetch target batches (same course, year+1)
  const { data: targetBatches, isLoading: targetLoading } = useQuery({
    queryKey: promotionKeys.targetBatches(
      sourceInfo?.courseId || "",
      (sourceInfo?.yearNumber || 0) + 1
    ),
    queryFn: () =>
      promotionFns.getTargetBatches(
        sourceInfo!.courseId,
        sourceInfo!.yearNumber + 1
      ),
    enabled: !!sourceInfo && !isFinalYear,
  });

  // Fetch students in selected source batch
  const { data: students, isLoading: studentsLoading } = useQuery({
    queryKey: promotionKeys.studentsInBatch(
      sourceInfo?.batchId || "",
      sourceInfo?.courseId || "",
      sourceInfo?.yearNumber || 0
    ),
    queryFn: () =>
      promotionFns.getStudentsInBatch(
        sourceInfo!.batchId,
        sourceInfo!.courseId,
        sourceInfo!.yearNumber
      ),
    enabled: !!sourceInfo,
  });

  // When students load, select all by default
  const handleSourceChange = (value: string) => {
    setSelectedSourceId(value);
    setSelectedTargetBatchId("");
    setSelectedEnrollments(new Set());
  };

  // Auto-select all students when they load
  useMemo(() => {
    if (students) {
      setSelectedEnrollments(new Set(students.map((s) => s.enrollmentId)));
    }
  }, [students]);

  const toggleEnrollment = (id: string) => {
    setSelectedEnrollments((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = (checked: boolean) => {
    if (checked && students) {
      setSelectedEnrollments(new Set(students.map((s) => s.enrollmentId)));
    } else {
      setSelectedEnrollments(new Set());
    }
  };

  const selectedCount = selectedEnrollments.size;
  const totalCount = students?.length || 0;
  const excludedStudents = students?.filter(
    (s) => !selectedEnrollments.has(s.enrollmentId)
  );
  const studentsWithDues = students?.filter(
    (s) => selectedEnrollments.has(s.enrollmentId) && !s.fullyPaid
  );

  // Submit promotion
  const handlePromote = async () => {
    if (!sourceInfo || !selectedTargetBatchId || selectedCount === 0) return;
    setIsSubmitting(true);

    try {
      const enrollmentIds = [...selectedEnrollments];
      const excludedIds =
        students
          ?.filter((s) => !selectedEnrollments.has(s.enrollmentId))
          .map((s) => s.enrollmentId) || [];

      await promotionFns.promoteStudents({
        enrollmentIds,
        targetBatchId: selectedTargetBatchId,
        newYear: sourceInfo.yearNumber + 1,
        sourceBatchId: sourceInfo.batchId,
        courseId: sourceInfo.courseId,
        fromYear: sourceInfo.yearNumber,
        excludedIds,
      });

      toast({
        title: "Promotion Successful",
        description: `${selectedCount} student(s) promoted from Year ${sourceInfo.yearNumber} to Year ${sourceInfo.yearNumber + 1}.`,
      });

      // Reset state
      setSelectedSourceId("");
      setSelectedTargetBatchId("");
      setSelectedEnrollments(new Set());

      // Invalidate queries
      queryClient.invalidateQueries({
        queryKey: promotionKeys.batchesForPromotion(),
      });
      queryClient.invalidateQueries({ queryKey: promotionKeys.history() });
    } catch (err) {
      toast({
        title: "Error",
        description:
          err instanceof Error ? err.message : "Promotion failed. Try again.",
        variant: "destructive",
      });
    }
    setIsSubmitting(false);
  };

  // Group batch options by course for the dropdown
  const groupedBatches = useMemo(() => {
    if (!batchOptions) return [];
    const map = new Map<
      string,
      { courseName: string; items: typeof batchOptions }
    >();
    batchOptions
      .filter((b) => b.studentCount > 0)
      .forEach((b) => {
        if (!map.has(b.courseId)) {
          map.set(b.courseId, { courseName: b.courseName, items: [] });
        }
        map.get(b.courseId)!.items.push(b);
      });
    return [...map.values()];
  }, [batchOptions]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold">Year Promotion</h1>
        <Link to="/promotions/history">
          <Button variant="ghost">
            Promotion History
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </Link>
      </div>

      {batchesLoading ? (
        <Loader />
      ) : (
        <>
          {/* Step 1: Batch Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Step 1: Select Source Batch
              </CardTitle>
              <CardDescription>
                Choose the batch to promote students from.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1 space-y-2">
                  <label className="text-sm font-medium">Source Batch</label>
                  <Select
                    value={selectedSourceId}
                    onValueChange={handleSourceChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a batch..." />
                    </SelectTrigger>
                    <SelectContent>
                      {groupedBatches.map((group) => (
                        <div key={group.courseName}>
                          <p className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                            {group.courseName}
                          </p>
                          {group.items.map((b) => (
                            <SelectItem key={b.id} value={b.id}>
                              {b.batchName} — Year {b.yearNumber} (
                              {b.studentCount} students)
                            </SelectItem>
                          ))}
                        </div>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {sourceInfo && !isFinalYear && (
                  <div className="flex-1 space-y-2">
                    <label className="text-sm font-medium">Target Batch</label>
                    {targetLoading ? (
                      <Loader />
                    ) : targetBatches && targetBatches.length > 0 ? (
                      <Select
                        value={selectedTargetBatchId}
                        onValueChange={setSelectedTargetBatchId}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select target batch..." />
                        </SelectTrigger>
                        <SelectContent>
                          {targetBatches.map((b) => (
                            <SelectItem key={b.batchId} value={b.batchId}>
                              {b.batchName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/5 p-3 text-sm text-destructive">
                        <AlertTriangle className="h-4 w-4" />
                        No batch configured for {sourceInfo.courseName} Year{" "}
                        {sourceInfo.yearNumber + 1}. Create one first in
                        Batches.
                      </div>
                    )}
                  </div>
                )}
              </div>

              {sourceInfo && (
                <div className="flex items-center gap-2 text-sm">
                  <Info className="h-4 w-4 text-muted-foreground" />
                  {isFinalYear ? (
                    <span className="text-orange-600 dark:text-orange-400">
                      Year {sourceInfo.yearNumber} is the final year of{" "}
                      {sourceInfo.courseName} ({sourceInfo.durationYears}-year
                      course). Students cannot be promoted further — mark
                      enrollments as Completed manually.
                    </span>
                  ) : (
                    <span className="text-muted-foreground">
                      Promoting: {sourceInfo.courseName} Year{" "}
                      {sourceInfo.yearNumber} → Year{" "}
                      {sourceInfo.yearNumber + 1}
                    </span>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Step 2: Student Selection */}
          {sourceInfo && !isFinalYear && students && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  Step 2: Select Students
                </CardTitle>
                <CardDescription>
                  All students are selected by default. Deselect any who should
                  not be promoted.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {studentsLoading ? (
                  <Loader />
                ) : students.length === 0 ? (
                  <div className="h-32 flex items-center justify-center text-muted-foreground">
                    No enrolled students found in this batch.
                  </div>
                ) : (
                  <>
                    <div className="border border-muted rounded overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-12">
                              <Checkbox
                                checked={
                                  selectedCount === totalCount
                                    ? true
                                    : selectedCount > 0
                                      ? "indeterminate"
                                      : false
                                }
                                onCheckedChange={(c) => toggleAll(!!c)}
                              />
                            </TableHead>
                            <TableHead>Student</TableHead>
                            <TableHead>Current Year</TableHead>
                            <TableHead>Fee Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {students.map((s) => (
                            <TableRow key={s.enrollmentId}>
                              <TableCell>
                                <Checkbox
                                  checked={selectedEnrollments.has(
                                    s.enrollmentId
                                  )}
                                  onCheckedChange={() =>
                                    toggleEnrollment(s.enrollmentId)
                                  }
                                />
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <Avatar className="w-8 h-8">
                                    <AvatarImage
                                      src={
                                        s.avatarUrl
                                          ? supabase.storage
                                              .from("students")
                                              .getPublicUrl(s.avatarUrl).data
                                              .publicUrl
                                          : ""
                                      }
                                    />
                                    <AvatarFallback>
                                      {s.firstName[0]}
                                      {s.lastName[0]}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span>
                                    {s.firstName} {s.middleName} {s.lastName}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>Year {s.currentYear}</TableCell>
                              <TableCell>
                                {s.fullyPaid ? (
                                  <Badge
                                    variant="secondary"
                                    className="text-green-700 dark:text-green-400"
                                  >
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Paid
                                  </Badge>
                                ) : (
                                  <Badge
                                    variant="secondary"
                                    className="text-orange-700 dark:text-orange-400"
                                  >
                                    <AlertTriangle className="h-3 w-3 mr-1" />₹
                                    {formatNumberIndian(s.amountDue)} due (
                                    {s.pendingInstallments} installment
                                    {s.pendingInstallments !== 1 && "s"})
                                  </Badge>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {selectedCount} of {totalCount} student(s) selected
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Step 3: Confirm */}
          {sourceInfo &&
            !isFinalYear &&
            selectedTargetBatchId &&
            selectedCount > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    Step 3: Review & Confirm
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-sm max-w-md">
                    <span className="text-muted-foreground">Course</span>
                    <span className="font-medium">
                      {sourceInfo.courseName}
                    </span>
                    <span className="text-muted-foreground">From</span>
                    <span className="font-medium">
                      {sourceInfo.batchName} — Year {sourceInfo.yearNumber}
                    </span>
                    <span className="text-muted-foreground">To</span>
                    <span className="font-medium">
                      {targetBatches?.find(
                        (b) => b.batchId === selectedTargetBatchId
                      )?.batchName || "—"}{" "}
                      — Year {sourceInfo.yearNumber + 1}
                    </span>
                    <span className="text-muted-foreground">Promoting</span>
                    <span className="font-medium">
                      {selectedCount} / {totalCount} students
                    </span>
                  </div>

                  {excludedStudents && excludedStudents.length > 0 && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Excluded: </span>
                      <span>
                        {excludedStudents
                          .map(
                            (s) =>
                              `${s.firstName} ${s.middleName || ""} ${s.lastName}`.trim()
                          )
                          .join(", ")}
                      </span>
                    </div>
                  )}

                  {studentsWithDues && studentsWithDues.length > 0 && (
                    <div className="flex items-start gap-2 rounded-md border border-orange-300 dark:border-orange-700 bg-orange-50 dark:bg-orange-950/30 p-3 text-sm text-orange-800 dark:text-orange-300">
                      <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                      <span>
                        {studentsWithDues.length} selected student(s) have
                        unpaid installments from the current year. Their
                        outstanding amounts will remain on the pending list.
                      </span>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button disabled={isSubmitting}>
                          {isSubmitting ? <Loader /> : "Promote Selected"}
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Confirm Promotion</DialogTitle>
                          <DialogDescription>
                            This will promote {selectedCount} student(s) from{" "}
                            {sourceInfo.courseName} Year{" "}
                            {sourceInfo.yearNumber} to Year{" "}
                            {sourceInfo.yearNumber + 1} and create new fee
                            records. This action can be undone from Promotion
                            History.
                          </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                          <DialogClose asChild>
                            <Button variant="ghost">Cancel</Button>
                          </DialogClose>
                          <DialogClose asChild>
                            <Button onClick={handlePromote}>
                              Confirm Promotion
                            </Button>
                          </DialogClose>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>
            )}
        </>
      )}
    </div>
  );
}
