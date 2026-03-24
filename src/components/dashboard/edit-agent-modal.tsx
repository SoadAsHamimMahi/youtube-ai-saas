"use client";

import { useState } from 'react';
import { X, Plus, Loader2, Mail, Clock, Video, Tag, Briefcase, Play } from 'lucide-react';
import { updateAgent } from '@/app/actions/agent-actions';
import { cn } from "@/lib/utils";

interface EditAgentModalProps {
  agent: any;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditAgentModal({ agent, onClose, onSuccess }: EditAgentModalProps) {
  const [title, setTitle] = useState(agent.title || '');
  const [recipientEmail, setRecipientEmail] = useState(agent.recipient_email || '');
  const [query, setQuery] = useState('');
  const [queries, setQueries] = useState<string[]>(agent.queries || []);
  const [time, setTime] = useState(agent.preferred_time?.slice(0, 5) || '06:00');
  const [maxVideos, setMaxVideos] = useState(agent.max_videos || 10);
  const [timezone, setTimezone] = useState(agent.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Dhaka');
  const [loading, setLoading] = useState(false);

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

    const result = await updateAgent(agent.id, {
      title,
      queries,
      preferred_time: time.length === 5 ? time + ':00' : time,
      recipient_email: recipientEmail,
      max_videos: maxVideos,
      timezone: timezone,
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
            <h3 className="text-2xl font-black font-outfit tracking-tight text-white">Edit Agent</h3>
            <p className="text-[10px] text-primary font-black uppercase tracking-[0.2em] mt-1">Update your AI Monitor</p>
          </div>
          <button 
            onClick={onClose}
            className="p-3 rounded-2xl hover:bg-white/5 text-gray-500 hover:text-white transition-all shadow-lg"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto">
          {/* Agent Type Info (Read-only for edit) */}
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                {agent.agent_type === 'job' ? <Briefcase className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </div>
              <div>
                <p className="text-xs font-black text-white uppercase tracking-wider">{agent.agent_type === 'job' ? 'Job Agent' : 'YouTube Agent'}</p>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Permanent Type</p>
              </div>
            </div>
          </div>

          {/* Agent Name */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-400">
              <Tag className="w-3.5 h-3.5" /> Agent Name
            </label>
            <input
              type="text"
              placeholder="e.g. AI Tools Daily"
              className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-3.5 px-5 outline-none focus:border-primary/50 transition-all font-bold text-white placeholder-gray-600 focus:bg-white/[0.05]"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          {/* Recipient Email */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-400">
              <Mail className="w-3.5 h-3.5" /> Recipient Email
            </label>
            <input
              type="email"
              placeholder="where to send daily reports"
              className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-3.5 px-5 outline-none focus:border-primary/50 transition-all font-bold text-white placeholder-gray-600 focus:bg-white/[0.05]"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              required
            />
          </div>

          {/* Keywords */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-400">
              <Plus className="w-3.5 h-3.5" /> Monitoring Keywords
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add keyword..."
                className="flex-1 bg-white/[0.03] border border-white/10 rounded-xl py-3.5 px-5 outline-none focus:border-primary/50 transition-all font-bold text-white placeholder-gray-600"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addQuery())}
              />
              <button
                type="button"
                onClick={addQuery}
                className="px-5 rounded-xl bg-primary text-white font-black hover:opacity-90 transition-all active:scale-95"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              {queries.map((q, i) => (
                <span key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-gray-400 text-[10px] font-black uppercase tracking-wider">
                  {q}
                  <button type="button" onClick={() => removeQuery(q)} className="hover:text-rose-500 transition-colors">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Time & Count */}
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
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : '💾 Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
