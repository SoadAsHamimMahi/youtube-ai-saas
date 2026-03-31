"use server";

import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";
import { getTransporter } from "@/lib/mailer";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";

// Admin client for generating confirm links
const getAdminSupabase = () => {
  return createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
};

export async function signUpAction(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { success: false, error: "Email and password are required." };
  }

  const adminSupabase = getAdminSupabase();

  try {
    // BUG #4 FIX: Use Admin createUser (does NOT send built-in Supabase email)
    // instead of client signUp (which ALSO sends a built-in confirmation email).
    // This ensures only ONE email is ever sent — our custom branded SMTP one.
    const { data: { user }, error: createError } = await adminSupabase.auth.admin.createUser({
      email,
      password,
      email_confirm: false, // User still needs to click confirmation link
    });

    if (createError) throw createError;
    if (!user) throw new Error("Could not create user.");

    // BUG #3 FIX: Use 'magiclink' type so no password is passed to generateLink.
    // The user is already created above, so we just need a login/confirm link.
    const { data: linkData, error: linkError } = await adminSupabase.auth.admin.generateLink({
      type: 'magiclink',
      email: email,
    });

    if (linkError) {
      console.error("Admin link generation failed:", linkError.message);
      return { success: true, message: "Account created! Please check your email for a confirmation link." };
    }

    const { action_link } = linkData.properties;

    // BUG #8 FIX: Use singleton transporter, not a new one per request
    const transporter = getTransporter();

    await transporter.sendMail({
      from: `"AI Monitor 🤖" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: "🚀 Confirm your AI Monitor Registration",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 40px; border: 1px solid #eee; border-radius: 12px; background: #fafafa;">
          <h1 style="color: #333; font-size: 24px; margin-bottom: 24px;">Confirm Your Account</h1>
          <p style="color: #666; line-height: 1.6; font-size: 16px;">
            Welcome to AI Monitor! You're just one step away from launching your automated YouTube research and job finding agents.
          </p>
          <div style="margin: 32px 0; text-align: center;">
            <a href="${action_link}" style="display: inline-block; padding: 16px 32px; background: #6366f1; color: white; border-radius: 8px; font-weight: bold; text-decoration: none; font-size: 16px;">
              Confirm Registration →
            </a>
          </div>
          <p style="color: #999; font-size: 12px;">
            If you didn't request this, you can safely ignore this email.
          </p>
        </div>
      `,
    });

    return { success: true, message: "Success! Check your inbox for the confirmation email." };
  } catch (error: any) {
    console.error("Auth Action Error:", error.message);
    return { success: false, error: error.message };
  }
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
