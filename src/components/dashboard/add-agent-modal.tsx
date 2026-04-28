"use client";

import { useState } from 'react';
import { X, Plus, Loader2, Mail, Clock, Video, Tag, Briefcase, Play, Smartphone, Laptop, Calendar } from 'lucide-react';
import { createAgent } from '@/app/actions/agent-actions';
import { cn } from "@/lib/utils";

interface AddAgentModalProps {
  onClose: () => void;
  onSuccess: () => void;
  defaultType?: 'youtube' | 'job';
  userTier?: 'free' | 'pro';
}

export function AddAgentModal({ onClose, onSuccess, defaultType = 'youtube', userTier = 'free' }: AddAgentModalProps) {
  const [agentType, setAgentType] = useState<'youtube' | 'job'>(defaultType);
  const [title, setTitle] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [query, setQuery] = useState('');
  const [queries, setQueries] = useState<string[]>([]);
  const [time, setTime] = useState('06:00');
  const [maxVideos, setMaxVideos] = useState(10);
  const [frequencyDays, setFrequencyDays] = useState(1);
  const [duration, setDuration] = useState<'1_week' | '1_month' | 'forever'>('forever');
  const [loading, setLoading] = useState(false);
  const [timezone, setTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Dhaka');

  const addQuery = () => {
    const trimmed = query.trim();
    if (trimmed && !queries.includes(trimmed)) {
      setQueries([...queries, trimmed]);
      setQuery('');
    }
  };

  const removeQuery = (q: string) => {
    setQueries(queries.filter(item => item !== q));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (queries.length === 0) {
      alert('Please add at least one category/keyword!');
      return;
    }
    setLoading(true);

    const result = await createAgent({
      title,
      agent_type: agentType,
      queries,
      preferred_time: time.length === 5 ? time + ':00' : time,
      recipient_email: recipientEmail,
      max_videos: maxVideos,
      is_active: false,
      timezone: timezone,
      frequency_days: frequencyDays,
      duration: duration,
    });

    if (!result.success) {
      alert(result.error);
    } else {
      onSuccess();
      onClose();
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="glass w-full max-w-lg rounded-[2.5rem] overflow-hidden border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col max-h-[90vh] animate-in zoom-in duration-300">
        {/* Header */}
        <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
          <div>
            <h3 className="text-2xl font-black font-outfit tracking-tight text-white">Create New Agent</h3>
            <p className="text-[10px] text-primary font-black uppercase tracking-[0.2em] mt-1">Configure your AI Monitor</p>
          </div>
          <button 
            onClick={onClose}
            className="p-3 rounded-2xl hover:bg-white/5 text-gray-400 hover:text-white transition-all shadow-lg"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto">
          {/* Agent Type Toggle */}
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setAgentType('youtube')}
              className={cn(
                "p-4 rounded-2xl border transition-all duration-500 flex flex-col items-center gap-3 relative overflow-hidden group",
                agentType === 'youtube' 
                  ? "bg-primary text-white border-primary shadow-lg shadow-primary/20" 
                  : "bg-white/[0.03] border-white/5 text-gray-500 hover:text-gray-300 hover:bg-white/[0.05]"
              )}
            >
              <Play className={cn("w-6 h-6 transition-transform duration-500", agentType === 'youtube' && "scale-110")} />
              <span className="text-[10px] font-black uppercase tracking-widest">YouTube Agent</span>
            </button>
            <button
              type="button"
              onClick={() => setAgentType('job')}
              className={cn(
                "p-4 rounded-2xl border transition-all duration-500 flex flex-col items-center gap-3 relative overflow-hidden group",
                agentType === 'job' 
                  ? "bg-primary text-white border-primary shadow-lg shadow-primary/20" 
                  : "bg-white/[0.03] border-white/5 text-gray-500 hover:text-gray-300 hover:bg-white/[0.05]"
              )}
            >
              <Briefcase className={cn("w-6 h-6 transition-transform duration-500", agentType === 'job' && "scale-110")} />
              <span className="text-[10px] font-black uppercase tracking-widest">Job Agent</span>
            </button>
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-400">
              <Tag className="w-3.5 h-3.5" /> Agent Name
            </label>
            <input
              type="text"
              placeholder="e.g. Daily Tech Radar"
              className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-3.5 px-5 outline-none focus:border-primary/50 transition-all font-bold text-white placeholder-gray-600"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-400">
              <Mail className="w-3.5 h-3.5" /> Recipient Email
            </label>
            <input
              type="email"
              placeholder="Where to send report?"
              className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-3.5 px-5 outline-none focus:border-primary/50 transition-all font-bold text-white placeholder-gray-600"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-400">
              <Plus className="w-3.5 h-3.5" /> Monitoring Keywords
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder={agentType === 'youtube' ? "e.g. Next.js 15" : "e.g. React Developer"}
                className="flex-1 bg-white/[0.03] border border-white/10 rounded-xl py-3.5 px-5 outline-none focus:border-primary/50 transition-all font-bold text-white placeholder-gray-600"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addQuery())}
              />
              <button
                type="button"
                onClick={addQuery}
                className="px-5 rounded-xl bg-primary text-white font-black hover:opacity-90 active:scale-95 transition-all"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              {queries.map((q, i) => (
                <span key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-gray-400 text-[10px] font-black uppercase tracking-wider group hover:bg-white/10 transition-all">
                  {q}
                  <button type="button" onClick={() => removeQuery(q)} className="hover:text-rose-500 transition-colors">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-400">
                  <Clock className="w-3.5 h-3.5" /> Daily Time
                </label>
                <input
                  type="time"
                  className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-3.5 px-5 outline-none focus:border-primary/50 transition-all font-black text-white [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-400">
                  <Calendar className="w-3.5 h-3.5" /> Frequency
                  {userTier === 'free' && <span className="ml-1 px-1.5 py-0.5 rounded bg-primary/20 text-primary border border-primary/20 text-[9px] translate-y-[-1px]">PRO</span>}
                </label>
                <select
                  className={cn(
                    "w-full bg-white/[0.03] border border-white/10 rounded-xl py-3.5 px-3 outline-none focus:border-primary/50 transition-all font-black appearance-none",
                    userTier === 'free' ? "text-primary/70 cursor-not-allowed bg-black/20" : "text-white cursor-pointer"
                  )}
                  value={userTier === 'free' ? 3 : frequencyDays}
                  onChange={(e) => setFrequencyDays(Number(e.target.value))}
                  disabled={userTier === 'free'}
                  required
                >
                  {userTier === 'free' ? (
                    <option value={3} className="bg-background text-primary">Every 3 Days</option>
                  ) : (
                    <>
                      <option value={1} className="bg-background text-white">Daily</option>
                      <option value={3} className="bg-background text-white">Every 3 Days</option>
                      <option value={7} className="bg-background text-white">Weekly</option>
                    </>
                  )}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-400">
                  <Calendar className="w-3.5 h-3.5" /> Run For
                </label>
                <select
                  className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-3.5 px-3 outline-none focus:border-primary/50 transition-all font-black appearance-none text-white cursor-pointer"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value as any)}
                  required
                >
                  <option value="1_week" className="bg-background text-white">1 Week</option>
                  <option value="1_month" className="bg-background text-white">1 Month</option>
                  <option value="forever" className="bg-background text-white">Forever</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-400">
                  <Video className="w-3.5 h-3.5" /> Max Results
                </label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-3.5 px-5 outline-none focus:border-primary/50 transition-all font-black text-white"
                  value={maxVideos}
                  onChange={(e) => setMaxVideos(Number(e.target.value))}
                  required
                />
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-white/5 flex gap-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-4 rounded-2xl font-black text-gray-500 hover:text-white hover:bg-white/5 transition-all text-xs uppercase tracking-widest border border-transparent hover:border-white/10"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-[2] py-4 rounded-2xl font-black bg-primary text-white hover:translate-y-[-2px] hover:shadow-[0_10px_25px_rgba(99,102,241,0.4)] transition-all flex items-center justify-center gap-3 shadow-lg shadow-primary/20 border border-white/10"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : '🚀 Start Monitoring'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
