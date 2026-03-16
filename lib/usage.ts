import { createClient } from "@/lib/supabase/server";

export type Plan = "free" | "basic" | "pro";

export const PLAN_LIMITS: Record<Plan, { sonnet: number; haiku: number }> = {
  free:  { sonnet: 3,  haiku: 5  },
  basic: { sonnet: 25, haiku: 30 },
  pro:   { sonnet: 75, haiku: 200 },
};

export interface UsageResult {
  allowed: boolean;
  model: "sonnet" | "haiku";
  upgrade: boolean;
  plan: Plan;
  sonnetRemaining: number;
  haikuRemaining: number;
  userId: string | null;
}

export async function checkUsage(): Promise<UsageResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    // Allow one guest search using the haiku model (no usage tracking)
    return { allowed: true, model: "haiku", upgrade: false, plan: "free", sonnetRemaining: 0, haikuRemaining: 1, userId: null };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan, sonnet_count, sonnet_reset_at, haiku_count, haiku_reset_at, is_admin")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return { allowed: true, model: "sonnet", upgrade: false, plan: "free", sonnetRemaining: 3, haikuRemaining: 5, userId: user.id };
  }

  // Admins and gifted users get unlimited access
  if (profile.is_admin) {
    return { allowed: true, model: "sonnet", upgrade: false, plan: "pro", sonnetRemaining: 999, haikuRemaining: 999, userId: user.id };
  }

  const plan = (profile.plan || "free") as Plan;
  const limits = PLAN_LIMITS[plan];
  const now = new Date();

  let sonnetCount = profile.sonnet_count || 0;
  let haikuCount = profile.haiku_count || 0;

  if (profile.sonnet_reset_at && new Date(profile.sonnet_reset_at) <= now) {
    sonnetCount = 0;
    supabase.from("profiles").update({
      sonnet_count: 0,
      sonnet_reset_at: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    }).eq("id", user.id);
  }

  if (profile.haiku_reset_at && new Date(profile.haiku_reset_at) <= now) {
    haikuCount = 0;
    supabase.from("profiles").update({
      haiku_count: 0,
      haiku_reset_at: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    }).eq("id", user.id);
  }

  const sonnetRemaining = limits.sonnet - sonnetCount;
  const haikuRemaining = limits.haiku - haikuCount;

  if (sonnetRemaining > 0) {
    return { allowed: true, model: "sonnet", upgrade: false, plan, sonnetRemaining, haikuRemaining, userId: user.id };
  }

  if (haikuRemaining > 0) {
    return { allowed: true, model: "haiku", upgrade: false, plan, sonnetRemaining: 0, haikuRemaining, userId: user.id };
  }

  return { allowed: false, model: "haiku", upgrade: plan !== "pro", plan, sonnetRemaining: 0, haikuRemaining: 0, userId: user.id };
}

export async function incrementUsage(userId: string, model: "sonnet" | "haiku") {
  const supabase = await createClient();
  const field = model === "sonnet" ? "sonnet_count" : "haiku_count";

  const { data: profile } = await supabase
    .from("profiles")
    .select(field)
    .eq("id", userId)
    .single();

  if (!profile) return;

  await supabase
    .from("profiles")
    .update({ [field]: ((profile as Record<string, number>)[field] || 0) + 1 })
    .eq("id", userId);
}
