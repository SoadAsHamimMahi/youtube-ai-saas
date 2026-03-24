import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { SettingsForm } from "@/components/dashboard/settings-form";
import { User, CreditCard, Zap, Calendar, ShieldCheck } from "lucide-react";

export const metadata = { title: "Settings | AI Monitor" };

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) return <div>Profile not found</div>;

  const nextResetDate = new Date(new Date(profile.last_reset_at).getTime() + 7 * 24 * 60 * 60 * 1000);

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-20" suppressHydrationWarning>
      <header className="space-y-2">
        <h2 className="text-4xl font-black tracking-tighter font-outfit text-white flex items-center gap-3">
          <User className="w-8 h-8 text-indigo-500" />
          Account Settings
        </h2>
        <p className="text-gray-400 font-bold tracking-tight text-lg">Manage your identity and subscription status.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Form */}
        <div className="lg:col-span-2 space-y-8">
          <section className="glass p-8 rounded-[2.5rem] border border-white/5 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-[60px] pointer-events-none group-hover:bg-indigo-500/20 transition-all duration-700" />
            <div className="relative space-y-8">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                  <User className="w-5 h-5 text-indigo-400" />
                </div>
                <h3 className="text-xl font-black font-outfit">Personal Information</h3>
              </div>
              <SettingsForm profile={profile} />
            </div>
          </section>
        </div>

        {/* Right Column: Stats Cards */}
        <div className="space-y-6">
          {/* Subscription Tier */}
          <div className="glass p-6 rounded-3xl border border-white/5 shadow-xl relative overflow-hidden group hover:scale-[1.02] transition-all duration-500">
             <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <ShieldCheck className="w-16 h-16 text-white" />
             </div>
             <p className="text-[10px] text-gray-500 font-black mb-3 uppercase tracking-[0.2em]">Membership Tier</p>
             <div className="flex items-center gap-3">
                <span className={`px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest border shadow-lg ${
                  profile.tier === 'pro' 
                    ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" 
                    : "bg-white/5 text-gray-400 border-white/10"
                }`}>
                  {profile.tier} Tier
                </span>
                {profile.tier === 'pro' && (
                   <span className="text-xs text-emerald-500/60 font-black animate-pulse">VERIFIED</span>
                )}
             </div>
          </div>

          {/* Credits */}
          <div className="glass p-6 rounded-3xl border border-white/5 shadow-xl bg-gradient-to-br from-amber-500/[0.03] to-transparent hover:scale-[1.02] transition-all duration-500">
             <p className="text-[10px] text-gray-500 font-black mb-4 uppercase tracking-[0.2em]">Available Balance</p>
             <div className="flex items-end gap-2 mb-2">
                <Zap className="w-10 h-10 text-amber-500 mb-1" />
                <span className="text-5xl font-black font-outfit tracking-tighter text-white">{profile.credits}</span>
             </div>
             <p className="text-xs text-gray-500 font-bold">Resets every 7 days</p>
          </div>

          {/* Reset Date */}
          <div className="glass p-6 rounded-3xl border border-white/5 shadow-xl flex items-center gap-4 hover:scale-[1.02] transition-all duration-500 italic font-medium">
             <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10">
                <Calendar className="w-6 h-6 text-indigo-400" />
             </div>
             <div>
                <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em]">Next Refill</p>
                <p className="text-sm font-black text-white">{nextResetDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
