import Loader from "@/components/Loader";
import { batchFns, batchKeys } from "@/query/batches";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CgSpinner } from "react-icons/cg";
import { useNavigate, useParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import DatePicker from "@/components/ui/date-picker";
import { Textarea } from "@/components/ui/textarea";
import { TablesUpdate } from "@/lib/api/types";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

type BatchUpdate = TablesUpdate<"batches">;

export default function EditBatch() {
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

  const [batchPayload, setBatchPayload] = useState<BatchUpdate>({});
  const [updateDiff, setUpdateDiff] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  // Handlers for Editing
  const handleBatchInput = ({
    key,
    value,
  }: {
    key: keyof BatchUpdate;
    value: string;
  }) => {
    setBatchPayload((prev) => ({ ...prev, [key]: value }));
    if (!updateDiff) setUpdateDiff(true);
  };

  // Handle Submit form
  const handleFormSubmit = async () => {
    setSubmitLoading(true);
    const { error } = await supabase
      .from("batches")
      .update(batchPayload)
      .eq("id", id!);
    if (error) {
      toast({
        title: "Error Occurred",
        description:
          "Error occurred while trying to update details. Please try again.",
        variant: "destructive",
      });
      return;
    }
    setSubmitLoading(false);
    navigate("/batches");
  };
  return (
    <>
      {isLoading ? (
        <Loader />
      ) : (
        <>
          {error && (
            <div className="w-full h-full flex items-center justify-center">
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
                <h1 className="text-3xl font-bold">Edit Batch</h1>
              </div>
              {/* Container */}
              <div className="flex flex-col xl:flex-row gap-8 mb-4">
                {/* Batch Details */}
                <Card className="xl:w-1/2">
                  <div className="flex gap-4 p-8">
                    <div className="flex w-full flex-col">
                      <h3 className="text-xl font-medium mb-8">
                        Batch Details
                      </h3>
                      <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-2">
                          <Label htmlFor="name">Name</Label>
                          <Input
                            type="text"
                            id="name"
                            name="name"
                            value={batchPayload.name || batchDetails?.name}
                            onChange={(e) => {
                              const { value } = e.currentTarget;
                              handleBatchInput({ key: "name", value });
                            }}
                            autoComplete="off"
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <Label>Start Date</Label>
                          <DatePicker
                            value={batchDetails.start_date ?? ""}
                            onValueChange={(value: string) => {
                              handleBatchInput({ key: "start_date", value });
                            }}
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <Label>End Date</Label>
                          <DatePicker
                            value={batchDetails.end_date ?? ""}
                            onValueChange={(value: string) => {
                              handleBatchInput({ key: "end_date", value });
                            }}
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <Label htmlFor="description">Description</Label>
                          <Textarea
                            id="description"
                            name="description"
                            onChange={(e) => {
                              const { value } = e.currentTarget;
                              handleBatchInput({ key: "description", value });
                            }}
                            value={
                              (batchPayload.description ||
                                batchDetails.description) ??
                              ""
                            }
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
              {/* Submit Buttons */}
              <div className="flex justify-end gap-2">
                {updateDiff && (
                  <Button
                    className="min-w-20"
                    onClick={handleFormSubmit}
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
