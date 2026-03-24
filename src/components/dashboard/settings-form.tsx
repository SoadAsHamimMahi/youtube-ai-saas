"use client";

import { useState } from "react";
import { updateProfile } from "@/app/actions/profile-actions";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";

export function SettingsForm({ profile }: { profile: any }) {
  const [fullName, setFullName] = useState(profile.full_name || "");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const res = await updateProfile({ full_name: fullName });
    
    if (res.success) {
      setMessage({ type: 'success', text: "Profile updated successfully!" });
    } else {
      setMessage({ type: 'error', text: res.error || "Failed to update profile" });
    }
    setLoading(null);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <label className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] ml-1">Account Email</label>
        <div className="w-full bg-white/5 border border-white/5 p-4 rounded-2xl text-gray-500 font-bold cursor-not-allowed">
          {profile.email}
        </div>
        <p className="text-[10px] text-gray-600 font-bold ml-1">Email cannot be changed manually.</p>
      </div>

      <div className="space-y-2">
        <label className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] ml-1">Display Name</label>
        <input
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Enter your full name"
          required
          className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-white font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder:text-gray-600"
        />
      </div>

      {message && (
        <div className={`p-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300 ${
          message.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
        }`}>
          {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span className="text-sm font-bold">{message.text}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-2 group"
      >
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <>
            Save Changes
            <div className="w-1.5 h-1.5 rounded-full bg-white/40 group-hover:scale-150 transition-transform" />
          </>
        )}
      </button>
    </form>
  );
}
