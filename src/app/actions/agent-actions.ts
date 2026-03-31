"use server";

import { runAgentImmediately } from "@/lib/agent-worker";
import { revalidatePath } from "next/cache";
import { CreateAgentSchema } from "@/lib/validation";

async function getSupabase() {
  const { cookies } = await import("next/headers");
  const { createServerClient } = await import("@supabase/ssr");
  
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll() {}
      }
    }
  );
}

export async function triggerAgentRun(agentId: string) {
  try {
    const result = await runAgentImmediately(agentId);
    revalidatePath("/dashboard");
    return result;
  } catch (error: any) {
    console.error("Server Action Error:", error.message);
    return { success: false, error: error.message };
  }
}

export async function deleteAgent(agentId: string) {
  const supabase = await getSupabase();
  try {
    const { error } = await supabase
      .from("monitoring_configs")
      .delete()
      .eq("id", agentId);

    if (error) throw error;
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: any) {
    console.error("Delete Agent Error:", error.message);
    return { success: false, error: error.message };
  }
}

export async function updateAgent(agentId: string, updates: any) {
  const supabase = await getSupabase();
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    // SECURITY FIX #6: Partial validation — only validate keys that are present
    const safeUpdates: Record<string, any> = {};
    if (updates.title !== undefined) {
      if (typeof updates.title !== 'string' || updates.title.length > 100) throw new Error('Invalid title');
      safeUpdates.title = updates.title.trim();
    }
    if (updates.recipient_email !== undefined) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(updates.recipient_email)) throw new Error('Invalid email');
      safeUpdates.recipient_email = updates.recipient_email;
    }
    if (updates.is_active !== undefined) safeUpdates.is_active = Boolean(updates.is_active);
    if (updates.preferred_time !== undefined) safeUpdates.preferred_time = updates.preferred_time;
    if (updates.max_videos !== undefined) safeUpdates.max_videos = Math.min(Math.max(1, Number(updates.max_videos)), 20);
    if (updates.frequency_days !== undefined) safeUpdates.frequency_days = updates.frequency_days;
    if (updates.queries !== undefined && Array.isArray(updates.queries)) safeUpdates.queries = updates.queries.slice(0, 10);
    if (updates.location !== undefined) safeUpdates.location = String(updates.location).slice(0, 100);

    // Enforce Free Tier restrictions on updates
    const { data: profile } = await supabase.from("profiles").select("tier").eq("id", user.id).single();
    if (profile?.tier === 'free') {
      if (safeUpdates.frequency_days) safeUpdates.frequency_days = 3;
      if (safeUpdates.max_videos) safeUpdates.max_videos = Math.min(safeUpdates.max_videos, 5);
    }

    const { error } = await supabase
      .from("monitoring_configs")
      .update(safeUpdates)
      .eq("id", agentId)
      .eq("user_id", user.id); // Ownership check

    if (error) throw error;
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: any) {
    console.error("Update Agent Error:", error.message);
    return { success: false, error: error.message };
  }
}

export async function createAgent(agent: any) {
  const supabase = await getSupabase();
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    // SECURITY FIX #6: Validate all agent input with Zod schema
    const parsed = CreateAgentSchema.safeParse(agent);
    if (!parsed.success) {
      throw new Error(parsed.error.issues[0]?.message ?? 'Invalid agent data');
    }
    const safeAgent = parsed.data;

    const { data: profile } = await supabase
      .from("profiles")
      .select("tier")
      .eq("id", user.id)
      .single();

    if (profile?.tier === 'free') {
      const { count } = await supabase
        .from("monitoring_configs")
        .select("*", { count: 'exact', head: true })
        .eq("user_id", user.id)
        .eq("agent_type", safeAgent.agent_type);

      if (count && count >= 1) {
        throw new Error(`Free Tier Limit Reached: You can only have 1 ${safeAgent.agent_type === 'job' ? 'Job' : 'YouTube'} agent. Please upgrade to Pro for unlimited agents.`);
      }

      safeAgent.frequency_days = 3;
      safeAgent.max_videos = Math.min(safeAgent.max_videos || 5, 5);
    }

    const { data, error } = await supabase
      .from("monitoring_configs")
      .insert([{ ...safeAgent, user_id: user.id }])
      .select()
      .single();

    if (error) throw error;
    revalidatePath("/dashboard");
    return { success: true, data };
  } catch (error: any) {
    console.error("Create Agent Error:", error.message);
    return { success: false, error: error.message };
  }
}

export async function getAgentLogs(agentId: string) {
  const supabase = await getSupabase();
  try {
    const { data, error } = await supabase
      .from("agent_logs")
      .select("*")
      .eq("agent_id", agentId)
      .order("run_at", { ascending: false })
      .limit(20);

    if (error) throw error;
    return { success: true, logs: data };
  } catch (error: any) {
    console.error("Get Agent Logs Error:", error.message);
    return { success: false, error: error.message };
  }
}

export async function getLastSuccessfulLog(agentId: string) {
  const supabase = await getSupabase();
  try {
    const { data, error } = await supabase
      .from("agent_logs")
      .select("*")
      .eq("agent_id", agentId)
      .eq("status", "success")
      .order("run_at", { ascending: false })
      .limit(1)
      .single();

    if (error) return { success: false, error: error.message };
    return { success: true, log: data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
