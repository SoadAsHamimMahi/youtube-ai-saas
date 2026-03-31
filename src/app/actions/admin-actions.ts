"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

// Helper to get admin Supabase client that bypasses RLS
const getAdminSupabase = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
};

export async function getAllUsers() {
  const supabase = getAdminSupabase();
  try {
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Get active agents count for each user just for analytics
    const { data: agentCounts } = await supabase
      .from("monitoring_configs")
      .select("user_id", { count: "exact" });

    // Note: The above count doesn't group by user id effectively unless we use RPC
    // Let's do a simple count per user by fetching user_ids directly
    const { data: activeAgents } = await supabase
      .from("monitoring_configs")
      .select("user_id, is_active");

    const enrichedProfiles = profiles.map(profile => {
      const userAgents = activeAgents?.filter(a => a.user_id === profile.id) || [];
      return {
        ...profile,
        total_agents: userAgents.length,
        active_agents: userAgents.filter(a => a.is_active).length,
      };
    });

    return { success: true, users: enrichedProfiles };
  } catch (error: any) {
    console.error("Admin GetAllUsers Error:", error.message);
    return { success: false, error: error.message };
  }
}

export async function updateUserTier(userId: string, targetTier: 'free' | 'pro') {
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
