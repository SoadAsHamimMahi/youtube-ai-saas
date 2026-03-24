"use server";

import { runAgentImmediately } from "@/lib/agent-worker";
import { revalidatePath } from "next/cache";

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
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("tier")
        .eq("id", user.id)
        .single();
      
      // Enforce Free Tier restrictions on updates
      if (profile?.tier === 'free') {
        if (updates.frequency_days) updates.frequency_days = 3;
        if (updates.max_videos) updates.max_videos = Math.min(updates.max_videos, 5);
      }
    }

    const { error } = await supabase
      .from("monitoring_configs")
      .update(updates)
      .eq("id", agentId);

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
        .eq("agent_type", agent.agent_type);
      
      if (count && count >= 1) {
        throw new Error(`Free Tier Limit Reached: You can only have 1 ${agent.agent_type === 'job' ? 'Job' : 'YouTube'} agent. Please upgrade to Pro for unlimited agents.`);
      }
      
      agent.frequency_days = 3;
      agent.max_videos = Math.min(agent.max_videos || 5, 5);
    }

    agent.user_id = user.id;

    const { data, error } = await supabase
      .from("monitoring_configs")
      .insert([agent])
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
