import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { getAllUsers } from "@/app/actions/admin-actions";
import { AdminUsersTable } from "@/components/admin/admin-users-table";
import { ShieldAlert, Users, Zap, TrendingUp, Send } from "lucide-react";

export const metadata = { title: "Admin | AI Monitor" };

export default async function AdminDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  // Verify Admin Role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== 'admin') {
    redirect("/dashboard");
  }

  // Fetch all users via Server Action
  const { success, users } = await getAllUsers();

  const totalUsers = users?.length || 0;
  const proUsers = users?.filter(u => u.tier === 'pro').length || 0;
  const totalCredits = users?.reduce((acc, curr) => acc + (curr.credits || 0), 0) || 0;
  const totalInstantRuns = users?.reduce((acc, curr) => acc + (curr.instant_runs_used || 0), 0) || 0;

  return (
    <div className="space-y-10" suppressHydrationWarning>
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h2 className="text-4xl font-black tracking-tighter font-outfit text-white flex items-center gap-3">
            <ShieldAlert className="w-8 h-8 text-rose-500" />
            Admin God-Mode
          </h2>
          <p className="text-gray-400 font-bold tracking-tight">Manage users, subscriptions, and platform credits.</p>
        </div>
      </header>

      {/* Stats */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: "Total Users", value: totalUsers.toString(), icon: Users, color: "text-blue-400", bg: "bg-blue-400/10" },
          { label: "Pro Members", value: proUsers.toString(), icon: TrendingUp, color: "text-emerald-400", bg: "bg-emerald-400/10" },
          { label: "Total Credits", value: totalCredits.toLocaleString(), icon: Zap, color: "text-amber-400", bg: "bg-amber-400/10" },
          { label: "Weekly Instant Runs", value: totalInstantRuns.toString(), icon: Send, color: "text-rose-400", bg: "bg-rose-400/10" },
        ].map((stat, i) => (
          <div key={i} className="glass p-6 rounded-3xl flex items-center justify-between group hover:bg-white/[0.04] transition-all duration-500 border border-white/5 shadow-2xl">
            <div className="space-y-1">
              <p className="text-[10px] text-gray-400 font-black mb-1 uppercase tracking-[0.2em]">{stat.label}</p>
              <p className="text-4xl font-black font-outfit tracking-tighter">{stat.value}</p>
            </div>
            <div className={`p-5 rounded-2xl border border-white/10 transition-all duration-500 group-hover:scale-110 ${stat.bg} ${stat.color}`}>
              <stat.icon className="w-8 h-8" />
            </div>
          </div>
        ))}
      </section>

      {/* Main Table */}
      <section className="glass rounded-3xl border border-white/5 shadow-2xl overflow-hidden p-6 relative">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-rose-500/5 to-transparent pointer-events-none" />
        <h3 className="text-2xl font-black font-outfit tracking-tight mb-6">User Database</h3>
        
        {success && users ? (
          <AdminUsersTable initialUsers={users} />
        ) : (
          <div className="p-10 text-center text-gray-500 font-bold">Failed to load users database.</div>
        )}
      </section>
    </div>
  );
}
