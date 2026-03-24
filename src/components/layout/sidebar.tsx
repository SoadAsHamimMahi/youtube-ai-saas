"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Clock, 
  Settings, 
  Play,
  PlusCircle,
  LogOut
} from "lucide-react";
import { cn } from "@/lib/utils";

const menuItems = [
  { name: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  { name: "My Agents", icon: Play, href: "/dashboard/agents" },
  { name: "Schedules", icon: Clock, href: "/dashboard/schedules" },
  { name: "Settings", icon: Settings, href: "/dashboard/settings" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="w-64 h-screen border-r border-border-glass glass flex flex-col fixed left-0 top-0 z-50" suppressHydrationWarning>
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-primary/20">
          Y
        </div>
        <h1 className="text-xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
          AI Monitor
        </h1>
      </div>

      <nav className="flex-1 px-4 py-8 space-y-2">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group",
                isActive 
                  ? "bg-primary text-white shadow-lg shadow-primary/20" 
                  : "text-gray-400 hover:text-white hover:bg-surface-hover"
              )}
            >
              <item.icon className={cn(
                "w-5 h-5 transition-transform duration-300 group-hover:scale-110",
                isActive ? "text-white" : "text-gray-500 group-hover:text-primary"
              )} />
              <span className="font-semibold">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 mt-auto space-y-4">
        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-bold hover:opacity-90 transition-opacity shadow-lg shadow-primary/20 group">
          <PlusCircle className="w-5 h-5 group-hover:rotate-90 transition-transform duration-500" />
          <span>Add New Agent</span>
        </button>
        
        <div className="p-4 rounded-xl border border-border-glass bg-surface/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-surface border border-border-glass flex items-center justify-center text-xs text-gray-400">
              U
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-bold text-white truncate">User Account</p>
              <p className="text-[10px] text-gray-500 truncate">Free Plan</p>
            </div>
            <button className="text-gray-500 hover:text-red-500 transition-colors">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
