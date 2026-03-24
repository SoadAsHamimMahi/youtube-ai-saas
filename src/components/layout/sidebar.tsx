"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Clock, 
  Settings, 
  Play,
  Briefcase,
  PlusCircle,
  LogOut,
  Zap,
  ShieldAlert,
  CreditCard,
  Rocket
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

const baseMenuItems = [
  { name: "Overview", icon: LayoutDashboard, href: "/dashboard" },
  { name: "YouTube Monitors", icon: Play, href: "/dashboard/youtube" },
  { name: "Job Finders", icon: Briefcase, href: "/dashboard/jobs" },
  { name: "Schedules", icon: Clock, href: "/dashboard/schedules" },
  { name: "Billing", icon: CreditCard, href: "/dashboard/billing" },
  { name: "Settings", icon: Settings, href: "/dashboard/settings" },
];

export function Sidebar() {
  const pathname = usePathname();
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        supabase.from("profiles").select("*").eq("id", user.id).single().then(({ data }) => {
          if (data) setProfile(data);
        });
      }
    });

    // Realtime subscription for instant credit updates
    const channel = supabase.channel('profile_changes')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles' }, (payload) => {
        setProfile((prev: any) => ({ ...prev, ...payload.new }));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  let menuItems: any[] = profile?.role === 'admin' 
    ? [...baseMenuItems, { name: "God-Mode Admin", icon: ShieldAlert, href: "/dashboard/admin" }]
    : [...baseMenuItems];

  if (profile?.tier !== 'pro') {
    menuItems = [
      ...menuItems.slice(0, 4), 
      { name: "Upgrade to Pro", icon: Rocket, href: "/dashboard/billing", special: true },
      ...menuItems.slice(4)
    ];
  }

  return (
    <div className="w-72 h-screen border-r border-white/5 bg-background flex flex-col fixed left-0 top-0 z-50 overflow-hidden" suppressHydrationWarning>
      {/* Sidebar background glow */}
      <div className="absolute top-0 left-0 w-full h-1/2 bg-primary/5 blur-[120px] pointer-events-none" />
      
      <div className="p-8 relative">
        <div className="flex items-center gap-3.5 group">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black text-2xl shadow-2xl shadow-indigo-500/40 group-hover:scale-105 transition-transform duration-500 border border-white/20">
            A
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tighter text-white">
              AI MONITOR
            </h1>
            <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] leading-none mt-1">
              PRO DASHBOARD
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-4 py-8 space-y-1.5 relative">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3.5 px-5 py-3.5 rounded-2xl transition-all duration-500 group relative overflow-hidden",
                isActive 
                  ? "bg-white/[0.03] text-white border border-white/10 shadow-[0_0_20px_rgba(99,102,241,0.1)]" 
                  : (item as any).special 
                    ? "bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-600 hover:text-white"
                    : "text-gray-500 hover:text-gray-200 hover:bg-white/[0.02]"
              )}
            >
              {/* Active state indicator */}
              {isActive && (
                <div className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-primary rounded-full shadow-[0_0_10px_rgba(99,102,241,0.8)]" />
              )}
              
              <item.icon className={cn(
                "w-5 h-5 transition-all duration-500",
                isActive ? "text-primary scale-110" : "group-hover:text-primary group-hover:scale-110"
              )} />
              <span className={cn(
                "text-sm tracking-tight transition-colors duration-500",
                isActive ? "font-black" : "font-bold"
              )}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="p-6 mt-auto space-y-6 relative border-t border-white/5 bg-white/[0.01]">
        <button className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-primary text-white font-black text-sm hover:translate-y-[-2px] hover:shadow-[0_10px_25px_rgba(99,102,241,0.4)] transition-all duration-500 group shadow-lg shadow-primary/20 border border-white/10">
          <PlusCircle className="w-5 h-5 group-hover:rotate-90 transition-transform duration-500" />
          <span>New Monitor</span>
        </button>
        
        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 transition-colors hover:bg-white/[0.05]">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-gray-800 to-gray-900 border border-white/10 flex items-center justify-center text-sm font-black text-gray-400">
              {profile ? profile.full_name?.substring(0, 2).toUpperCase() : "SM"}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-black text-white truncate">{profile?.full_name || 'Loading...'}</p>
              <p className={cn("text-[10px] font-black uppercase tracking-widest opacity-80", profile?.tier === 'pro' ? 'text-primary' : 'text-gray-400')}>
                {profile?.tier === 'pro' ? 'Pro Member' : 'Free Tier'}
              </p>
            </div>
          </div>
          
          {/* Credit Counter */}
          <div className="bg-background rounded-xl border border-white/5 p-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
              </div>
              <span className="text-[11px] font-black text-gray-400 uppercase tracking-wider">Credits</span>
            </div>
            <span className="text-sm font-black text-white">{profile?.credits ?? '-'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
