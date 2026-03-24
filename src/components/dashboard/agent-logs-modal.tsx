"use client";

import { useEffect, useState } from "react";
import { 
  X, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Info,
  Calendar,
  Loader2
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

interface LogEntry {
  id: string;
  status: 'success' | 'error';
  message: string;
  run_at: string;
}

interface AgentLogsModalProps {
  agentId: string;
  agentTitle: string;
  onClose: () => void;
}

export function AgentLogsModal({ agentId, agentTitle, onClose }: AgentLogsModalProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const { data, error } = await supabase
          .from('agent_logs')
          .select('*')
          .eq('agent_id', agentId)
          .order('run_at', { ascending: false })
          .limit(20);

        if (error) throw error;
        setLogs(data || []);
      } catch (err) {
        console.error("Error fetching logs:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [agentId]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="glass w-full max-w-lg rounded-3xl overflow-hidden border border-border-glass shadow-2xl flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="p-6 border-b border-border-glass flex items-center justify-between bg-surface/50">
          <div>
            <h3 className="text-xl font-black">Agent History</h3>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">{agentTitle}</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-white/5 text-gray-400 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-500">
              <Loader2 className="w-8 h-8 animate-spin mb-4 text-primary" />
              <p className="font-bold">Fetching logs...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-20 space-y-3 opacity-50">
              <Info className="w-10 h-10 mx-auto" />
              <p className="font-bold">No history records found yet.</p>
            </div>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="p-4 rounded-2xl bg-surface/30 border border-border-glass flex gap-4 items-start transition-all hover:bg-surface/50">
                <div className={cn(
                  "p-2 rounded-lg mt-0.5",
                  log.status === 'success' ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
                )}>
                  {log.status === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-gray-200 leading-snug">
                    {log.message}
                  </p>
                  <div className="flex items-center gap-3 text-[10px] text-gray-500 font-bold">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(log.run_at).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(log.run_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-surface/50 border-t border-border-glass text-center">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
            Showing last 20 events
          </p>
        </div>
      </div>
    </div>
  );
}
