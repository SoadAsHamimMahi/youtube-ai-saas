import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { PricingCards } from "@/components/dashboard/pricing-cards";
import { CreditCard, Rocket, Sparkles, ShieldCheck } from "lucide-react";

export const metadata = { title: "Billing & Upgrade | AI Monitor" };

export default async function BillingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth");

  const { data: profile } = await supabase
    .from("profiles")
    .select("tier")
    .eq("id", user.id)
    .single();

  const userTier = (profile?.tier as 'free' | 'pro') || 'free';

  return (
    <div className="space-y-12 pb-20" suppressHydrationWarning>
      <header className="flex flex-col items-center text-center space-y-4 max-w-2xl mx-auto">
        <div className="p-4 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
           <Rocket className="w-8 h-8 animate-bounce" />
        </div>
        <div className="space-y-1">
          <h2 className="text-4xl md:text-5xl font-black tracking-tighter font-outfit text-white">
            Level Up Your Monitoring
          </h2>
          <p className="text-gray-400 font-bold tracking-tight text-lg">
             Choose the plan that fits your growth. Affordable for local developers and researchers.
          </p>
        </div>
      </header>

      {/* Pricing Module */}
      <PricingCards currentTier={userTier} />

      {/* Trust Badges */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        {[
          { label: "Secure Payments", icon: ShieldCheck, color: "text-blue-400", bg: "bg-blue-400/10" },
          { label: "Cancel Anytime", icon: CreditCard, color: "text-rose-400", bg: "bg-rose-400/10" },
          { label: "Premium Features", icon: Sparkles, color: "text-amber-400", bg: "bg-amber-400/10" },
        ].map((badge, i) => (
          <div key={i} className="glass p-6 rounded-2xl border border-white/5 flex items-center justify-center gap-3">
             <badge.icon className={badge.color} />
             <span className="text-sm font-black text-gray-400 uppercase tracking-widest">{badge.label}</span>
          </div>
        ))}
      </section>
    </div>
  );
}
