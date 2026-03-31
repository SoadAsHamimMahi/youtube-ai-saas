"use server";

import { createClient } from "@/lib/supabase-server";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import nodemailer from "nodemailer";

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

  const supabase = await createClient();
  const adminSupabase = getAdminSupabase();

  try {
    // 1. Create the user through Supabase Auth (Client)
    // This triggers the default email, but we'll also send our own if we can 
    // generate a link, or we can just use our SMTP for everything.
    const { data: { user }, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || ''}/auth/callback`,
      }
    });

    if (signUpError) throw signUpError;
    if (!user) throw new Error("Could not create user.");

    // 2. Generate a custom confirmation link using Admin API to ensure we have it for SMTP
    const { data: linkData, error: linkError } = await adminSupabase.auth.admin.generateLink({
      type: 'signup',
      email: email,
      password: password,
    });

    if (linkError) {
      console.error("Admin link generation failed, but user created:", linkError.message);
      // Fallback: The user was created, but we couldn't get a custom link. 
      // Supabase's default provider MIGHT have sent one.
      return { success: true, message: "Success! Check your email for a confirmation link." };
    }

    const { action_link } = linkData.properties;

    // 3. Send custom branded email via SMTP
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
      },
    });

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

    return { success: true, message: "Success! Branded confirmation link sent via SMTP. Please check your inbox." };
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
