"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { createClient as createServerClient } from "@/lib/supabase-server";

// Helper to get admin Supabase client that bypasses RLS
const getAdminSupabase = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
};

// BUG #5 FIX: Verify the caller is an admin before any admin operation.
// Without this, any authenticated user could call these server actions.
async function assertAdmin() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized: Not logged in.");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    throw new Error("Forbidden: Admin access required.");
  }
}

export async function getAllUsers() {
  await assertAdmin();  // BUG #5 FIX
  const supabase = getAdminSupabase();
  try {
    // BUG #6 FIX: Fetch profiles and agents together, group in one pass using a Map.
    // Old approach did O(n*m) JavaScript filter per user with nested loops.
    const [profilesResult, agentsResult] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("monitoring_configs").select("user_id, is_active"),
    ]);

    if (profilesResult.error) throw profilesResult.error;

    const profiles = profilesResult.data;
    const allAgents = agentsResult.data || [];

    // Build a lookup Map for O(n) grouping instead of O(n*m) filter
    const agentMap = new Map<string, { total: number; active: number }>();
    for (const agent of allAgents) {
      const entry = agentMap.get(agent.user_id) || { total: 0, active: 0 };
      entry.total++;
      if (agent.is_active) entry.active++;
      agentMap.set(agent.user_id, entry);
    }

    const enrichedProfiles = profiles.map(profile => ({
      ...profile,
      total_agents: agentMap.get(profile.id)?.total ?? 0,
      active_agents: agentMap.get(profile.id)?.active ?? 0,
    }));

    return { success: true, users: enrichedProfiles };
  } catch (error: any) {
    console.error("Admin GetAllUsers Error:", error.message);
    return { success: false, error: error.message };
  }
}

export async function updateUserTier(userId: string, targetTier: 'free' | 'pro') {
  await assertAdmin();  // BUG #5 FIX
  const supabase = getAdminSupabase();
  try {
    const { error } = await supabase
      .from("profiles")
      .update({ tier: targetTier })
      .eq("id", userId);

    if (error) throw error;
    revalidatePath("/dashboard/admin");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateUserCredits(userId: string, newCredits: number) {
  await assertAdmin();  // BUG #5 FIX
  const supabase = getAdminSupabase();
  try {
    const { error } = await supabase
      .from("profiles")
      .update({ credits: Math.max(0, newCredits) })
      .eq("id", userId);

    if (error) throw error;
    revalidatePath("/dashboard/admin");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateUserInstantRunsUsed(userId: string, newUsed: number) {
  await assertAdmin();  // BUG #5 FIX
  const supabase = getAdminSupabase();
  try {
    const { error } = await supabase
      .from("profiles")
      .update({ instant_runs_used: Math.max(0, newUsed) })
      .eq("id", userId);

    if (error) throw error;
    revalidatePath("/dashboard/admin");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
