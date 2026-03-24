"use server";

import { createClient } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";

export async function updateProfile(formData: { full_name: string }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  try {
    const { error } = await supabase
      .from("profiles")
      .update({ 
        full_name: formData.full_name,
        updated_at: new Date().toISOString()
      })
      .eq("id", user.id);

    if (error) throw error;

    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard"); // Sidebar uses profile info
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getProfile() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return data;
}
