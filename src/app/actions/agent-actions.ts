"use server";

import { runAgentImmediately } from "@/lib/agent-worker";
import { revalidatePath } from "next/cache";

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
  const { cookies } = await import("next/headers");
  const { createServerClient } = await import("@supabase/ssr");
  
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll() {}
      }
    }
  );

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
  const { cookies } = await import("next/headers");
  const { createServerClient } = await import("@supabase/ssr");
  
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll() {}
      }
    }
  );

  try {
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
