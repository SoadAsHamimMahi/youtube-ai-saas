"use client";

import { useState } from "react";
import { updateUserTier, updateUserCredits, updateUserInstantRunsUsed } from "@/app/actions/admin-actions";
import { Loader2, Plus, Minus, UserCog, Zap, Crown } from "lucide-react";
import { cn } from "@/lib/utils";

interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: string;
  tier: 'free' | 'pro';
  credits: number;
  instant_runs_used: number;
  total_agents: number;
  active_agents: number;
  created_at: string;
}

export function AdminUsersTable({ initialUsers }: { initialUsers: Profile[] }) {
  const [users, setUsers] = useState<Profile[]>(initialUsers);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleTierChange = async (userId: string, newTier: 'free' | 'pro') => {
    setLoadingId(userId);
    const res = await updateUserTier(userId, newTier);
    if (res.success) {
      setUsers(users.map(u => u.id === userId ? { ...u, tier: newTier } : u));
    } else {
      alert("Failed to update tier: " + res.error);
    }
    setLoadingId(null);
  };

  const handleCreditsChange = async (userId: string, currentCredits: number, change: number) => {
    setLoadingId(userId);
    const newAmount = Math.max(0, currentCredits + change);
    const res = await updateUserCredits(userId, newAmount);
    if (res.success) {
      setUsers(users.map(u => u.id === userId ? { ...u, credits: newAmount } : u));
    } else {
      alert("Failed to update credits: " + res.error);
    }
    setLoadingId(null);
  };

  const handleInstantRunsChange = async (userId: string, currentUsed: number, change: number) => {
    setLoadingId(userId);
    const newUsed = Math.max(0, currentUsed + change);
    const res = await updateUserInstantRunsUsed(userId, newUsed);
    if (res.success) {
      setUsers(users.map(u => u.id === userId ? { ...u, instant_runs_used: newUsed } : u));
    } else {
      alert("Failed to update instant runs: " + res.error);
    }
    setLoadingId(null);
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-white/10 uppercase text-[10px] font-black tracking-[0.2em] text-gray-500">
            <th className="py-4 px-4">User</th>
            <th className="py-4 px-4">Role & Tier</th>
            <th className="py-4 px-4">Agents</th>
            <th className="py-4 px-4">Credits</th>
            <th className="py-4 px-4">Instant Runs</th>
            <th className="py-4 px-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {users.map(user => (
            <tr key={user.id} className="group hover:bg-white/[0.02] transition-colors">
              <td className="py-4 px-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 border border-white/5 flex items-center justify-center text-indigo-400 font-black">
                    {user.full_name?.substring(0,2).toUpperCase() || '??'}
                  </div>
                  <div>
                    <h4 className="font-black text-white text-sm">{user.full_name || 'No Name'}</h4>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                </div>
              </td>
              
              <td className="py-4 px-4">
                <div className="flex flex-col gap-1 items-start">
                  <span className={cn(
                    "text-[10px] px-2 py-0.5 rounded uppercase font-black tracking-widest border",
                    user.role === 'admin' ? "bg-rose-500/10 text-rose-500 border-rose-500/20" : "bg-white/5 text-gray-400 border-white/10"
                  )}>
                    {user.role}
                  </span>
                  <span className={cn(
                    "text-[10px] px-2 py-0.5 rounded flex items-center gap-1 uppercase font-black tracking-widest border",
                    user.tier === 'pro' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-gray-500/10 text-gray-500 border-gray-500/20"
                  )}>
                    {user.tier === 'pro' && <Crown className="w-3 h-3" />}
                    {user.tier}
                  </span>
                </div>
              </td>
              
              <td className="py-4 px-4">
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-black text-white">{user.active_agents} <span className="text-gray-500">Active</span></span>
                  <span className="text-xs text-gray-500 font-bold">{user.total_agents} Total</span>
                </div>
              </td>
              
              <td className="py-4 px-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                    <Zap className="w-4 h-4 text-amber-500" />
                  </div>
                  <span className="text-lg font-black font-outfit text-white">{user.credits}</span>
                </div>
              </td>
              
              <td className="py-4 px-4">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col gap-0.5">
                    <span className={cn(
                      "text-sm font-black",
                      user.instant_runs_used >= 2 ? "text-rose-500" : "text-white"
                    )}>
                      {user.instant_runs_used || 0} / 2
                    </span>
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-tight">Used This Week</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => handleInstantRunsChange(user.id, user.instant_runs_used || 0, -1)}
                      disabled={loadingId === user.id || (user.instant_runs_used || 0) === 0}
                      className="p-1 rounded bg-white/5 hover:bg-emerald-500/20 text-gray-400 hover:text-emerald-400 transition-colors disabled:opacity-50 disabled:hover:bg-white/5 disabled:hover:text-gray-400"
                      title="Add 1 Run (decrease used limit)"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleInstantRunsChange(user.id, user.instant_runs_used || 0, 1)}
                      disabled={loadingId === user.id}
                      className="p-1 rounded bg-white/5 hover:bg-rose-500/20 text-gray-400 hover:text-rose-400 transition-colors disabled:opacity-50"
                      title="Remove 1 Run (increase used limit)"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </td>
              
              <td className="py-4 px-4 text-right">
                <div className="flex items-center justify-end gap-2">
                  {/* Credit Controls */}
                  <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/5 mr-4">
                    <button 
                      onClick={() => handleCreditsChange(user.id, user.credits, -100)}
                      disabled={loadingId === user.id}
                      className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-rose-400 transition-colors disabled:opacity-50"
                      title="Remove 100 Credits"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="text-xs font-black text-gray-500 w-8 text-center">{loadingId === user.id ? <Loader2 className="w-3 h-3 animate-spin mx-auto" /> : '100'}</span>
                    <button 
                      onClick={() => handleCreditsChange(user.id, user.credits, 100)}
                      disabled={loadingId === user.id}
                      className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-emerald-400 transition-colors disabled:opacity-50"
                      title="Add 100 Credits"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  
                  {/* Tier Toggle */}
                  <button
                    onClick={() => handleTierChange(user.id, user.tier === 'pro' ? 'free' : 'pro')}
                    disabled={loadingId === user.id || user.role === 'admin'}
                    className={cn(
                      "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all border flex items-center gap-2",
                      user.role === 'admin' 
                        ? "bg-black/20 text-gray-600 border-white/5 cursor-not-allowed" // Don't allow demoting admins easily here
                        : user.tier === 'pro' 
                          ? "bg-gray-500/10 text-gray-400 border-gray-500/20 hover:bg-rose-500/10 hover:text-rose-500 hover:border-rose-500/30" 
                          : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500 hover:text-white"
                    )}
                  >
                    <UserCog className="w-4 h-4" />
                    {user.tier === 'pro' ? 'Downgrade' : 'Upgrade to Pro'}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
