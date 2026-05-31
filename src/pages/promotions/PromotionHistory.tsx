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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { format } from "date-fns";
import { ChevronLeft, Undo2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

export default function PromotionHistory() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [undoingId, setUndoingId] = useState<string | null>(null);

  const { data: history, isLoading, error } = useQuery({
    queryKey: promotionKeys.history(),
    queryFn: promotionFns.getPromotionHistory,
  });

  const handleUndo = async (historyId: string) => {
    setUndoingId(historyId);
    try {
      await promotionFns.undoPromotion(historyId);
      toast({
        title: "Promotion Undone",
        description: "Students have been reverted to their previous year.",
      });
      queryClient.invalidateQueries({ queryKey: promotionKeys.history() });
      queryClient.invalidateQueries({
        queryKey: promotionKeys.batchesForPromotion(),
      });
    } catch (err) {
      toast({
        title: "Error",
        description:
          err instanceof Error ? err.message : "Failed to undo promotion.",
        variant: "destructive",
      });
    }
    setUndoingId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-4 items-center">
        <ChevronLeft
          className="cursor-pointer text-muted-foreground hover:text-secondary-foreground"
          onClick={() => navigate("/promotions")}
        />
        <h1 className="text-3xl font-semibold">Promotion History</h1>
      </div>

      {isLoading ? (
        <Loader />
      ) : error ? (
        <div className="w-full h-full flex items-center justify-center">
          Something went wrong. Please try again.
        </div>
      ) : !history || history.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center text-muted-foreground">
              <p className="text-lg">No promotions recorded yet.</p>
              <p className="text-sm mt-1">
                Promote students from the promotions page.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Past Promotions</CardTitle>
            <CardDescription>
              View all past year promotions. You can undo a promotion to revert
              students to their previous year.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border border-muted rounded overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>From → To</TableHead>
                    <TableHead>Source Batch</TableHead>
                    <TableHead>Target Batch</TableHead>
                    <TableHead>Students</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((h) => {
                    const promotedCount = h.enrollment_ids?.length || 0;
                    const isFullyUndone = promotedCount === 0;

                    return (
                      <TableRow key={h.id}>
                        <TableCell>
                          {format(new Date(h.promotion_date), "PPP")}
                        </TableCell>
                        <TableCell>{h.courses?.name}</TableCell>
                        <TableCell>
                          Year {h.from_year} → Year {h.to_year}
                        </TableCell>
                        <TableCell>{h.source_batch?.name}</TableCell>
                        <TableCell>{h.target_batch?.name}</TableCell>
                        <TableCell>
                          {promotedCount} promoted
                          {h.excluded_ids && h.excluded_ids.length > 0 && (
                            <span className="text-muted-foreground ml-1">
                              ({h.excluded_ids.length} excluded)
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {isFullyUndone ? (
                            <Badge variant="secondary">Undone</Badge>
                          ) : (
                            <Badge>Active</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {!isFullyUndone && (
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  disabled={undoingId === h.id}
                                >
                                  <Undo2 className="h-4 w-4 mr-1" />
                                  Undo
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Undo Promotion</DialogTitle>
                                  <DialogDescription>
                                    This will revert {promotedCount} student(s)
                                    from {h.courses?.name} Year {h.to_year}{" "}
                                    back to Year {h.from_year}. Pending
                                    installments for Year {h.to_year} will be
                                    removed, and fee summaries will be
                                    cancelled. Completed payments will not be
                                    affected.
                                  </DialogDescription>
                                </DialogHeader>
                                <DialogFooter>
                                  <DialogClose asChild>
                                    <Button variant="ghost">Cancel</Button>
                                  </DialogClose>
                                  <DialogClose asChild>
                                    <Button
                                      variant="destructive"
                                      onClick={() => handleUndo(h.id)}
                                    >
                                      Undo Promotion
                                    </Button>
                                  </DialogClose>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
