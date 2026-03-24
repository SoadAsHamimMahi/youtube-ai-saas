"use client";

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { X, Plus, Loader2, Mail, Clock, Video, Tag } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AddAgentModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function AddAgentModal({ onClose, onSuccess }: AddAgentModalProps) {
  const [title, setTitle] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [query, setQuery] = useState('');
  const [queries, setQueries] = useState<string[]>([]);
  const [time, setTime] = useState('06:00');
  const [maxVideos, setMaxVideos] = useState(10);
  const [timezone, setTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Dhaka');
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
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase
      .from('monitoring_configs')
      .insert([{
        title,
        queries,
        preferred_time: time + ':00',
        recipient_email: recipientEmail,
        max_videos: maxVideos,
        timezone: timezone,
        user_id: user?.id,
        is_active: true,
      }]);

    if (error) {
      alert(error.message);
    } else {
      onSuccess();
      onClose();
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="w-full max-w-xl glass rounded-3xl overflow-hidden shadow-2xl relative">
        <button onClick={onClose} className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors z-10">
          <X className="w-6 h-6" />
        </button>

        <div className="p-8 space-y-6 max-h-[90vh] overflow-y-auto">
          <div className="space-y-1 pr-8">
            <h3 className="text-2xl font-black tracking-tight">Create AI Monitor</h3>
            <p className="text-gray-500 font-medium text-sm">Configure keywords, recipient, and schedule for daily AI-curated YouTube reports.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Agent Name */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-400">
                <Tag className="w-3.5 h-3.5" /> Agent Name
              </label>
              <input
                type="text"
                placeholder="e.g. AI Tools Daily"
                className="w-full bg-surface border border-border-glass rounded-xl py-3 px-4 outline-none focus:border-primary/50 transition-all font-bold"
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
                className="w-full bg-surface border border-border-glass rounded-xl py-3 px-4 outline-none focus:border-primary/50 transition-all font-bold"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                required
              />
            </div>

            {/* Categories / Keywords */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-400">
                <Tag className="w-3.5 h-3.5" /> Categories / Keywords
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. OpenAI GPT-5"
                  className="flex-1 bg-surface border border-border-glass rounded-xl py-3 px-4 outline-none focus:border-primary/50 transition-all font-bold"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addQuery())}
                />
                <button
                  type="button"
                  onClick={addQuery}
                  className="px-4 rounded-xl bg-surface border border-border-glass text-primary hover:bg-primary hover:text-white transition-all font-bold"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
              {queries.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {queries.map((q, i) => (
                    <span key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-primary text-xs font-bold">
                      {q}
                      <button type="button" onClick={() => removeQuery(q)} className="hover:text-red-400 transition-colors">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              {queries.length === 0 && (
                <p className="text-[11px] text-gray-600 font-bold">Add keywords like "LangChain tutorial" or "AI agents 2026"</p>
              )}
            </div>

            {/* Time + Video Count + Timezone Row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-400">
                  <Clock className="w-3.5 h-3.5" /> Daily Send Time
                </label>
                <input
                  type="time"
                  className="w-full bg-surface border border-border-glass rounded-xl py-3 px-4 outline-none focus:border-primary/50 transition-all font-bold"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-400">
                  <Video className="w-3.5 h-3.5" /> Videos Per Email
                </label>
                <input
                  type="number"
                  min={1}
                  max={25}
                  className="w-full bg-surface border border-border-glass rounded-xl py-3 px-4 outline-none focus:border-primary/50 transition-all font-bold"
                  value={maxVideos}
                  onChange={(e) => setMaxVideos(Number(e.target.value))}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-400">
                <Tag className="w-3.5 h-3.5" /> Timezone
              </label>
              <select
                className="w-full bg-surface border border-border-glass rounded-xl py-3 px-4 outline-none focus:border-primary/50 transition-all font-bold appearance-none cursor-pointer"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                required
              >
                <option value="Asia/Dhaka">Asia/Dhaka (GMT+6)</option>
                <option value="UTC">UTC (GMT+0)</option>
                <option value="America/New_York">America/New_York (GMT-5)</option>
                <option value="Europe/London">Europe/London (GMT+0)</option>
                <option value="Asia/Dubai">Asia/Dubai (GMT+4)</option>
                <option value="Asia/Singapore">Asia/Singapore (GMT+8)</option>
              </select>
              <p className="text-[10px] text-gray-600 font-bold">Detected: {Intl.DateTimeFormat().resolvedOptions().timeZone}</p>
            </div>

            {/* Buttons */}
            <div className="pt-2 flex gap-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-4 rounded-xl font-bold bg-surface border border-border-glass hover:bg-surface-hover transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-[2] py-4 rounded-xl font-black bg-primary text-white hover:bg-primary-hover shadow-lg shadow-primary/30 transition-all flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : '🚀 Launch Agent'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
