import { FormEvent, useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Loader from "@/components/Loader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { formatNumberIndian } from "@/lib/utils/amount";
import { settingsFns, settingsKeys } from "@/query/settings";

export default function Settings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState(1500);
  const [isSaving, setIsSaving] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: settingsKeys.registrationFee(),
    queryFn: settingsFns.getRegistrationFee,
  });

  useEffect(() => {
    if (data) setAmount(data.amount);
  }, [data]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!amount || amount <= 0) {
      toast({
        title: "Invalid amount",
        description: "Registration fee must be greater than zero.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      await settingsFns.updateRegistrationFee(amount);
      await queryClient.invalidateQueries({ queryKey: settingsKeys.registrationFee() });
      toast({
        title: "Settings updated",
        description: `New students will now get a registration fee of ₹${formatNumberIndian(amount)}.`,
      });
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Could not update settings.",
        variant: "destructive",
      });
    }
    setIsSaving(false);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold">Settings</h1>

      {isLoading ? (
        <Loader />
      ) : error ? (
        <div className="w-full h-full flex items-center justify-center">
          Something went wrong. Please try again.
        </div>
      ) : (
        <Card className="max-w-xl">
          <CardHeader>
            <CardTitle>Registration Fee</CardTitle>
            <CardDescription>
              This is a one-time fee applied only to newly registered students. Existing student fee records are not changed.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="registration-fee">Amount</Label>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">₹</span>
                  <Input
                    id="registration-fee"
                    type="number"
                    min={1}
                    value={amount}
                    onChange={(e) => setAmount(Number(e.currentTarget.value))}
                  />
                </div>
              </div>

              {data?.updatedAt && (
                <p className="text-xs text-muted-foreground">
                  Last updated: {new Date(data.updatedAt).toLocaleString()}
                </p>
              )}

              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
