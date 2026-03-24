"use client";

import { useEffect, useState } from 'react';
import { X, Mail, CheckCircle2, Loader2, Info, Briefcase, Play, Calendar } from 'lucide-react';
import { cn } from "@/lib/utils";

interface EmailPreviewModalProps {
  agent: any;
  onClose: () => void;
}

export function EmailPreviewModal({ agent, onClose }: EmailPreviewModalProps) {
  const [loading, setLoading] = useState(true);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSimulation, setIsSimulation] = useState(false);
  const [sentAt, setSentAt] = useState<string | null>(null);

  const fetchPreview = async (forceSimulate = false) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          agentId: agent.id,
          simulate: forceSimulate 
        }),
      });
      const data = await response.json();
      if (data.success) {
        setPreviewData(data.data || []);
        setIsSimulation(data.isSimulation);
        setSentAt(data.sentAt || null);
      } else {
        setError(data.error || 'Failed to retrieve preview');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPreview();
  }, [agent.id]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="glass w-full max-w-3xl rounded-[2.5rem] overflow-hidden border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col max-h-[90vh] animate-in zoom-in duration-300">
        {/* Header */}
        <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-primary/10 text-primary border border-primary/20">
              {agent.agent_type === 'job' ? <Briefcase className="w-6 h-6" /> : <Play className="w-6 h-6" />}
            </div>
            <div>
              <h3 className="text-2xl font-black font-outfit tracking-tight text-white">
                {isSimulation ? 'Live Simulation' : 'Last Sent Report'}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] text-primary font-black uppercase tracking-[0.2em]">
                  {agent.title}
                </span>
                {sentAt && (
                   <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[9px] text-emerald-400 font-black uppercase tracking-widest">
                     <Calendar className="w-2.5 h-2.5" />
                     {new Date(sentAt).toLocaleString()}
                   </div>
                )}
              </div>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-3 rounded-2xl hover:bg-white/5 text-gray-400 hover:text-white transition-all shadow-lg"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-[rgba(10,11,20,0.4)]">
          {loading && (
            <div className="flex flex-col items-center justify-center py-32 gap-6">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-4 border-primary/10 border-t-primary animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-primary animate-ping" />
                </div>
              </div>
              <div className="text-center">
                <p className="text-sm font-black text-white uppercase tracking-widest">Retrieving Content</p>
                <p className="text-[10px] text-primary font-black uppercase tracking-[0.2em] mt-1 animate-pulse">Scanning Archive...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="p-8 rounded-[2rem] bg-rose-500/5 border border-rose-500/10 text-center space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-rose-500/10 flex items-center justify-center mx-auto border border-rose-500/20 shadow-lg shadow-rose-500/10">
                <Info className="w-8 h-8 text-rose-500" />
              </div>
              <div className="space-y-1">
                <h4 className="text-lg font-black text-white font-outfit">Retrieval Halted</h4>
                <p className="text-sm text-rose-400 font-bold">{error}</p>
              </div>
              <button
                onClick={() => fetchPreview(true)}
                className="px-6 py-2 rounded-xl bg-primary/10 text-primary font-black text-xs uppercase tracking-widest border border-primary/20 hover:bg-primary hover:text-white transition-all"
              >
                Try Live Simulation
              </button>
            </div>
          )}

          {!loading && !error && previewData.length === 0 && (
             <div className="flex flex-col items-center justify-center py-24 text-center space-y-8 animate-in fade-in zoom-in duration-500">
             <div className="relative">
               <div className="absolute inset-0 bg-primary/20 blur-[60px] animate-pulse rounded-full" />
               <div className="w-24 h-24 rounded-[2rem] bg-white/5 border border-white/10 flex items-center justify-center relative z-10">
                 <Mail className="w-10 h-10 text-primary" />
               </div>
             </div>
             <div className="max-w-md space-y-3">
               <h4 className="text-xl font-black text-white font-outfit">No sent history yet</h4>
               <p className="text-sm text-gray-500 font-bold leading-relaxed">
                 We haven't sent any reports for this agent yet. Would you like to run a live simulation to see how it will look?
               </p>
             </div>
             <button
               onClick={() => fetchPreview(true)}
               className="px-10 py-4 rounded-2xl bg-primary text-white font-black text-sm uppercase tracking-widest hover:shadow-lg transition-all"
             >
               Run Live Simulation
             </button>
           </div>
          )}

          {!loading && !error && previewData.length > 0 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
              {/* Email Envelope Style Card */}
              <div className="rounded-[2.5rem] bg-white border border-white/5 shadow-2xl overflow-hidden">
                <div className="bg-[#1a1c2e] p-6 border-b border-white/5">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-[10px] font-black tracking-[0.2em] text-primary uppercase">
                       {isSimulation ? 'Subject Simulation' : 'Subject of Sent Report'}
                    </p>
                    <div className="flex gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-rose-500/40" />
                      <div className="w-2 h-2 rounded-full bg-amber-500/40" />
                      <div className="w-2 h-2 rounded-full bg-emerald-500/40" />
                    </div>
                  </div>
                  <h4 className="text-lg font-black font-outfit text-white leading-tight">
                    {agent.agent_type === 'job' ? '🚀 New Job Opportunities Found' : '📺 Your Daily AI Video Digest'}: {agent.title}
                  </h4>
                </div>
                
                <div className="p-8 bg-white text-[#1e293b] font-sans">
                  {/* Mock Email Content */}
                  <div className="max-w-xl mx-auto space-y-8">
                    <div className="space-y-4">
                      <h1 className="text-3xl font-black text-[#0f172a] font-outfit">Hello! 👋</h1>
                      <p className="text-lg text-[#475569] font-medium leading-relaxed">
                        Here's your report for <span className="text-indigo-600 font-black">{agent.queries.join(', ')}</span>. 
                        We found {previewData.length} new insights.
                      </p>
                    </div>

                    <div className="space-y-4">
                      {previewData.map((item: any, i: number) => (
                        <div key={i} className="group p-5 rounded-2xl bg-white border border-slate-200 shadow-sm transition-all hover:shadow-md hover:border-indigo-200">
                          <div className="flex items-start justify-between gap-4">
                            <div className="space-y-1 flex-1">
                              <h5 className="font-black text-[#1e293b] group-hover:text-indigo-600 transition-colors line-clamp-2 leading-tight">
                                {item.title || item.position}
                              </h5>
                              <p className="text-xs text-[#64748b] font-bold uppercase tracking-wider">
                                {item.channelName || item.channelTitle || item.company}
                              </p>
                            </div>
                            {item.thumbnail && (
                              <img src={item.thumbnail} className="w-24 h-16 object-cover rounded-xl flex-shrink-0 bg-slate-100 border border-slate-100" />
                            )}
                          </div>
                          <div className="mt-4 flex items-center justify-between pt-4 border-t border-slate-50">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                               {isSimulation ? 'Just scanned' : 'Sent via Email'}
                            </span>
                            <a 
                              href={item.url} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="text-xs font-black text-indigo-600 uppercase tracking-widest group-hover:translate-x-1 transition-transform inline-flex items-center gap-1"
                            >
                              View Details →
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="pt-8 border-t border-slate-200 text-center">
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mb-4">You received this because of your AI Monitor settings</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-center gap-4 py-4">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                <p className="text-sm font-bold text-gray-400">
                  {isSimulation 
                    ? 'Simulation results display what future reports will contain.' 
                    : 'This content was successfully delivered to '+agent.recipient_email}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="p-8 border-t border-white/5 bg-white/[0.02] flex gap-4">
          <button 
            onClick={onClose}
            className="flex-1 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] text-gray-500 hover:text-white hover:bg-white/5 transition-all border border-transparent hover:border-white/10"
          >
            Dismiss
          </button>
          {!loading && (
             <button
              onClick={() => fetchPreview(true)}
              className="flex-1 py-4 rounded-2xl font-black bg-white/5 text-primary border border-primary/20 hover:bg-primary hover:text-white transition-all text-xs uppercase tracking-widest shadow-lg active:scale-95"
            >
              🔄 {isSimulation ? 'Re-Simulate' : 'Run New Simulation'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
