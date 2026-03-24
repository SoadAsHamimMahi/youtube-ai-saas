"use client";

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { X, Plus, Loader2, Mail, Clock, Video, Tag, Briefcase, MapPin, MonitorPlay } from 'lucide-react';

interface AddAgentModalProps {
  onClose: () => void;
  onSuccess: () => void;
  defaultType?: 'youtube' | 'job';
}

type AgentType = 'youtube' | 'job';

export function AddAgentModal({ onClose, onSuccess, defaultType = 'youtube' }: AddAgentModalProps) {
  const [agentType, setAgentType] = useState<AgentType>(defaultType);
  const [title, setTitle] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [query, setQuery] = useState('');
  const [queries, setQueries] = useState<string[]>([]);
  const [time, setTime] = useState('06:00');
  const [maxVideos, setMaxVideos] = useState(10);
  const [timezone, setTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Dhaka');
  const [location, setLocation] = useState('Remote');
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
      alert(agentType === 'job' ? 'Please add at least one skill!' : 'Please add at least one keyword!');
      return;
    }
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    const payload: Record<string, unknown> = {
      title,
      queries,
      preferred_time: time + ':00',
      recipient_email: recipientEmail,
      max_videos: maxVideos,
      timezone: timezone,
      user_id: user?.id,
      is_active: true,
      agent_type: agentType,
    };

    if (agentType === 'job') {
      payload.location = location;
    }

    const { error } = await supabase.from('monitoring_configs').insert([payload]);

    if (error) {
      alert(error.message);
    } else {
      onSuccess();
      onClose();
    }
    setLoading(false);
  };

  const isJob = agentType === 'job';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="w-full max-w-xl glass rounded-3xl overflow-hidden shadow-2xl relative">
        <button onClick={onClose} className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors z-10">
          <X className="w-6 h-6" />
        </button>

        <div className="p-8 space-y-6 max-h-[90vh] overflow-y-auto">
          <div className="space-y-1 pr-8">
            <h3 className="text-2xl font-black tracking-tight">Create AI Agent</h3>
            <p className="text-gray-500 font-medium text-sm">Choose an agent type and configure your daily automated report.</p>
          </div>

          {/* Agent Type Toggle */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setAgentType('youtube')}
              className={`flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm border transition-all ${
                !isJob
                  ? 'bg-primary/20 border-primary text-primary'
                  : 'bg-surface border-border-glass text-gray-400 hover:text-white'
              }`}
            >
              <MonitorPlay className="w-4 h-4" /> YouTube Monitor
            </button>
            <button
              type="button"
              onClick={() => setAgentType('job')}
              className={`flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm border transition-all ${
                isJob
                  ? 'bg-green-500/20 border-green-500 text-green-400'
                  : 'bg-surface border-border-glass text-gray-400 hover:text-white'
              }`}
            >
              <Briefcase className="w-4 h-4" /> Job Finder
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Agent Name */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-400">
                <Tag className="w-3.5 h-3.5" /> Agent Name
              </label>
              <input
                type="text"
                placeholder={isJob ? 'e.g. Next.js Jobs Daily' : 'e.g. AI Tools Daily'}
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

            {/* Keywords / Skills */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-400">
                <Tag className="w-3.5 h-3.5" /> {isJob ? 'Skills / Job Titles' : 'Categories / Keywords'}
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder={isJob ? 'e.g. React Developer' : 'e.g. OpenAI GPT-5'}
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
                    <span key={i} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold border ${isJob ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-primary/10 border-primary/20 text-primary'}`}>
                      {q}
                      <button type="button" onClick={() => removeQuery(q)} className="hover:text-red-400 transition-colors">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              {queries.length === 0 && (
                <p className="text-[11px] text-gray-600 font-bold">
                  {isJob ? 'Add skills like "Next.js" or "Full Stack Developer"' : 'Add keywords like "LangChain tutorial" or "AI agents 2026"'}
                </p>
              )}
            </div>

            {/* Location (Job only) */}
            {isJob && (
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-400">
                  <MapPin className="w-3.5 h-3.5" /> Job Location
                </label>
                <select
                  className="w-full bg-surface border border-border-glass rounded-xl py-3 px-4 outline-none focus:border-primary/50 transition-all font-bold appearance-none cursor-pointer"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                >
                  <option value="Remote">🌍 Remote (Worldwide)</option>
                  <option value="USA">🇺🇸 USA</option>
                  <option value="UK">🇬🇧 UK</option>
                  <option value="Canada">🇨🇦 Canada</option>
                  <option value="Australia">🇦🇺 Australia</option>
                  <option value="India">🇮🇳 India</option>
                  <option value="Bangladesh">🇧🇩 Bangladesh</option>
                </select>
              </div>
            )}

            {/* Time + Count + Timezone Row */}
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
                  <Video className="w-3.5 h-3.5" /> {isJob ? 'Jobs Per Email' : 'Videos Per Email'}
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
                className={`flex-[2] py-4 rounded-xl font-black text-white shadow-lg transition-all flex items-center justify-center gap-2 ${
                  isJob
                    ? 'bg-green-600 hover:bg-green-700 shadow-green-500/30'
                    : 'bg-primary hover:bg-primary-hover shadow-primary/30'
                }`}
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : isJob ? '💼 Launch Job Agent' : '🚀 Launch Agent'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
