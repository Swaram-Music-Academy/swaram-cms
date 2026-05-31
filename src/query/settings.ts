import { supabase } from "@/lib/supabase";

export const settingsKeys = {
  registrationFee: () => ["settings", "registration-fee"],
};

export const settingsFns = {
  getRegistrationFee: async () => {
    const { data, error } = await supabase
      .from("app_settings")
      .select("value, updated_at")
      .eq("key", "registration_fee")
      .single();
    if (error) throw error;
    return {
      amount: Number((data.value as { amount?: number }).amount ?? 1500),
      updatedAt: data.updated_at,
    };
  },

  updateRegistrationFee: async (amount: number) => {
    const { error } = await supabase.from("app_settings").upsert({
      key: "registration_fee",
      value: { amount },
    });
    if (error) throw error;
  },
};
