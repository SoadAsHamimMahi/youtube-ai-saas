"use client";

import { useEffect, useState } from "react";
import { 
  X, 
  Eye, 
  ExternalLink,
  Loader2,
  Mail,
  Zap,
  Globe
} from "lucide-react";
import { getTopJobs } from "@/lib/job-worker";

interface EmailPreviewModalProps {
  agent: {
    title: string;
    queries: string[];
    agent_type?: 'youtube' | 'job';
    location?: string;
    max_videos: number;
  };
  onClose: () => void;
}

export function EmailPreviewModal({ agent, onClose }: EmailPreviewModalProps) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app, this should be a Server Action
    // But since getTopJobs is exported from lib, we can call a dedicated preview action
    const fetchPreview = async () => {
      try {
        // Using a dynamic import for the action or just calling fetch if it was an endpoint
        // For simplicity, we'll assume a Server Action exists or we'll fetch via a temporary API
        const res = await fetch('/api/preview', {
            method: 'POST',
            body: JSON.stringify(agent)
        });
        const json = await res.json();
        setData(json.results || []);
      } catch (err) {
        console.error("Preview failed:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPreview();
  }, [agent]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-500">
      <div className="glass w-full max-w-2xl rounded-[2rem] overflow-hidden border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-primary/20 text-primary">
              <Eye className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-2xl font-black tracking-tight">Email Preview</h3>
              <p className="text-sm text-gray-400 font-bold uppercase tracking-widest flex items-center gap-2">
                {agent.agent_type === 'job' ? <Zap className="w-3 h-3" /> : <Mail className="w-3 h-3" />}
                Live Simulation
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-3 rounded-2xl hover:bg-white/5 text-gray-500 hover:text-white transition-all shadow-lg"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-black/20">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-32 text-gray-500 space-y-4">
              <Loader2 className="w-12 h-12 animate-spin text-primary" />
              <p className="font-extrabold text-lg tracking-tight">Analyzing live sources...</p>
            </div>
          ) : data.length === 0 ? (
            <div className="text-center py-32 space-y-4 opacity-50">
              <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4 border border-white/10">
                <Globe className="w-10 h-10" />
              </div>
              <p className="text-xl font-black">No results found for these queries.</p>
              <p className="text-sm font-bold text-gray-400">Try broading your keywords or location.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20 text-xs font-bold text-primary mb-6 text-center uppercase tracking-widest">
                {data.length} Results Found — This is how they will look in your email
              </div>
              
              {data.map((item, i) => (
                <div key={i} className="p-5 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-white/10 transition-all group">
                  <div className="flex justify-between items-start gap-4">
                    <div className="space-y-1 flex-1">
                      <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1 flex items-center gap-2">
                        <span>{item.source || 'Result'} #{i+1}</span>
                        {item.posted_at && <span className="text-primary">• {item.posted_at}</span>}
                      </div>
                      <h4 className="text-lg font-bold text-white group-hover:text-primary transition-colors leading-tight">
                        {item.title}
                      </h4>
                      <p className="text-sm text-gray-400 font-bold">
                        {item.company || item.channelName}
                      </p>
                    </div>
                    <a 
                      href={item.apply_url || item.url} 
                      target="_blank" 
                      className="p-2.5 rounded-xl bg-white/5 hover:bg-primary hover:text-white text-gray-400 transition-all border border-white/5"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                  <p className="mt-4 text-xs text-gray-500 line-clamp-2 font-medium opacity-80 bg-white/[0.02] p-3 rounded-lg border border-white/5">
                    {item.description?.replace(/<[^>]+>/g, '').slice(0, 150)}...
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 bg-surface/50 border-t border-white/5 flex items-center justify-between">
            <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                Subject: {agent.title}
            </div>
            <button 
                onClick={onClose}
                className="px-6 py-2 rounded-xl bg-surface border border-white/10 text-xs font-black hover:bg-white/5 transition-all text-gray-300"
            >
                Close Preview
            </button>
        </div>
      </div>
    </div>
  );
}
