"use client";

import { useEffect, useState } from 'react';
import { X, Calendar, CheckCircle2, XCircle, Clock, Info, Loader2 } from 'lucide-react';
import { getAgentLogs } from '@/app/actions/agent-actions';
import { cn } from "@/lib/utils";

interface AgentLogsModalProps {
  agentId: string;
  agentTitle: string;
  onClose: () => void;
}

export function AgentLogsModal({ agentId, agentTitle, onClose }: AgentLogsModalProps) {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLogs() {
      const result = await getAgentLogs(agentId);
      if (result.success) {
        setLogs(result.logs || []);
      }
      setLoading(false);
    }
    fetchLogs();
  }, [agentId]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="glass w-full max-w-2xl rounded-[2.5rem] overflow-hidden border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col max-h-[85vh] animate-in zoom-in duration-300">
        {/* Header */}
        <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
          <div>
            <h3 className="text-2xl font-black font-outfit tracking-tight text-white">Execution History</h3>
            <p className="text-[10px] text-primary font-black uppercase tracking-[0.2em] mt-1">{agentTitle}</p>
          </div>
          <button 
            onClick={onClose}
            className="p-3 rounded-2xl hover:bg-white/5 text-gray-400 hover:text-white transition-all shadow-lg"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
              <p className="text-xs font-black text-gray-500 uppercase tracking-widest">Retrieving logs...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-20 space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-white/5 flex items-center justify-center mx-auto mb-4 border border-white/5">
                <Info className="w-8 h-8 text-gray-600" />
              </div>
              <p className="text-gray-400 font-bold">No activity recorded yet.</p>
              <p className="text-xs text-gray-600">This agent will log its results after the first run.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {logs.map((log) => (
                <div 
                  key={log.id} 
                  className={cn(
                    "p-5 rounded-3xl border transition-all duration-300 group",
                    log.status === 'success' 
                      ? "bg-emerald-500/5 border-emerald-500/10 hover:bg-emerald-500/10" 
                      : "bg-rose-500/5 border-rose-500/10 hover:bg-rose-500/10"
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className={cn(
                        "p-3 rounded-2xl border transition-transform duration-500 group-hover:scale-110",
                        log.status === 'success' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-rose-500/10 border-rose-500/20 text-rose-500"
                      )}>
                        {log.status === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                      </div>
                      <div className="space-y-1">
                        <p className={cn(
                          "text-sm font-black leading-tight",
                          log.status === 'success' ? "text-emerald-400" : "text-rose-400"
                        )}>
                          {log.status === 'success' ? 'Agent Run Successful' : 'Run Failed'}
                        </p>
                        <p className="text-xs text-gray-400 font-medium leading-relaxed">
                          {log.message || (log.status === 'success' ? 'Email delivered to recipient.' : 'Unknown error occurred.')}
                        </p>
                        {log.error_reason && (
                          <div className="mt-3 p-3 rounded-xl bg-black/20 border border-white/5 text-[10px] font-mono text-rose-400/80 leading-relaxed break-all">
                            {log.error_reason}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="flex items-center gap-1.5 text-[10px] font-black text-gray-500 uppercase tracking-tighter">
                        <Calendar className="w-3 h-3" />
                        {new Date(log.run_at).toLocaleDateString()}
                      </div>
                      <div className="flex items-center justify-end gap-1.5 text-[10px] font-black text-gray-600 uppercase tracking-tighter mt-1">
                        <Clock className="w-3 h-3" />
                        {new Date(log.run_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-white/5 bg-white/[0.01]">
          <button 
            onClick={onClose}
            className="w-full py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] text-gray-500 hover:text-white hover:bg-white/5 transition-all border border-transparent hover:border-white/10"
          >
            Dismiss History
          </button>
        </div>
      </div>
    </div>
  );
}
