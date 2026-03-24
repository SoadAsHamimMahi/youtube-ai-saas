"use client";

import { useEffect, useState } from "react";
import { 
  Mail,
  Zap,
  Play,
  Clock,
  PlusCircle,
  AlertCircle,
  Video,
  CheckCircle2,
  XCircle,
  Calendar,
  Loader2,
  Send,
  Trash2,
  RefreshCcw,
  Globe,
  Pencil,
  Briefcase
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { AddAgentModal } from "@/components/dashboard/add-agent-modal";
import { EditAgentModal } from "@/components/dashboard/edit-agent-modal";
import { triggerAgentRun, deleteAgent } from "@/app/actions/agent-actions";

interface Agent {
  id: string;
  title: string;
  queries: string[];
  preferred_time: string;
  recipient_email: string;
  max_videos: number;
  is_active: boolean;
  last_run_at: string | null;
  last_run_status: 'success' | 'error' | null;
  timezone: string;
  created_at: string;
  agent_type?: 'youtube' | 'job';
  location?: string;
}

interface AgentListViewProps {
  agentType?: 'youtube' | 'job';
  title: string;
  description: string;
  defaultModalType?: 'youtube' | 'job';
}

function getRelativeTime(dateString: string) {
  const now = new Date();
  const date = new Date(dateString);
  const diffInMs = now.getTime() - date.getTime();
  
  if (diffInMs < 0) return 'just now'; 

  const diffInSecs = Math.floor(diffInMs / 1000);
  if (diffInSecs < 10) return 'just now';
  if (diffInSecs < 60) return `${diffInSecs}s ago`;
  
  const diffInMins = Math.floor(diffInSecs / 60);
  if (diffInMins < 60) return `${diffInMins}m ago`;
  
  const diffInHours = Math.floor(diffInMins / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function AgentListView({ agentType, title, description, defaultModalType = 'youtube' }: AgentListViewProps) {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [runningId, setRunningId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [timeUpdate, setTimeUpdate] = useState(0); 

  const fetchAgents = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      
      let query = supabase.from('monitoring_configs').select('*').order('created_at', { ascending: false });
      
      if (agentType === 'job') {
        query = query.eq('agent_type', 'job');
      } else if (agentType === 'youtube') {
        query = query.or('agent_type.eq.youtube,agent_type.is.null');
      }

      const { data, error } = await query;

      if (error) throw error;
      setAgents(data || []);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    const interval = setInterval(() => setTimeUpdate(prev => prev + 1), 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchAgents();
  }, [agentType]); // Re-fetch if agentType prop magically changes

  const handleRunNow = async (agentId: string) => {
    if (runningId) return;
    setRunningId(agentId);
    try {
      const result = await triggerAgentRun(agentId);
      if (result.success) {
        await fetchAgents(false);
      } else {
        alert("Failed to send email: " + (result as any).error);
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setRunningId(null);
    }
  };

  const handleDelete = async (agentId: string) => {
    if (!confirm("Are you sure you want to delete this agent? This cannot be undone.")) return;
    setDeletingId(agentId);
    try {
      const result = await deleteAgent(agentId);
      if (result.success) {
        await fetchAgents(false);
      } else {
        alert("Delete failed: " + result.error);
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setDeletingId(null);
    }
  };

  const activeCount = agents.filter(a => a.is_active).length;
  const successCount = agents.filter(a => a.last_run_status === 'success').length;

  return (
    <div className="space-y-10" suppressHydrationWarning>
      {isModalOpen && (
        <AddAgentModal
          onClose={() => setIsModalOpen(false)}
          onSuccess={fetchAgents}
          defaultType={defaultModalType}
        />
      )}
      {editingAgent && (
        <EditAgentModal
          agent={editingAgent}
          onClose={() => setEditingAgent(null)}
          onSuccess={fetchAgents}
        />
      )}

      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-3xl font-extrabold tracking-tight">{title}</h2>
          <p className="text-gray-500 font-medium">{description}</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold transition-all shadow-lg shadow-primary/20"
        >
          <PlusCircle className="w-5 h-5" />
          Add New Agent
        </button>
      </header>

      {/* Stats */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: "Active Agents", value: activeCount.toString(), icon: Zap, color: "text-yellow-500" },
          { label: "Total Reports Sent", value: successCount.toString(), icon: Send, color: "text-green-500" },
          { label: "Emails Configured", value: agents.filter(a => a.recipient_email).length.toString(), icon: Mail, color: "text-primary" },
        ].map((stat, i) => (
          <div key={i} className="glass p-6 rounded-2xl flex items-center justify-between group hover:bg-surface-hover transition-all duration-300">
            <div>
              <p className="text-sm text-gray-400 font-semibold mb-1 uppercase tracking-wider">{stat.label}</p>
              <p className="text-4xl font-black">{stat.value}</p>
            </div>
            <div className={cn("p-4 rounded-xl bg-surface border border-border-glass transition-transform group-hover:scale-110", stat.color)}>
              <stat.icon className="w-6 h-6" />
            </div>
          </div>
        ))}
      </section>

      {/* Agents */}
      <section className="space-y-6 pb-20">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            Monitoring Agents ({agents.length})
          </h3>
          <button 
            onClick={() => fetchAgents()} 
            className="text-xs font-bold text-gray-500 hover:text-primary transition-colors flex items-center gap-2 group"
          >
            <RefreshCcw className="w-3.5 h-3.5 group-hover:rotate-180 transition-transform duration-500" />
            Refresh Data
          </button>
        </div>

        {error && (
          <div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center gap-4 text-red-500">
            <AlertCircle className="w-6 h-6 flex-shrink-0" />
            <div>
              <p className="font-bold">Database Connection Error</p>
              <p className="text-sm opacity-80">{error}. Did you run the SQL migration in Supabase?</p>
            </div>
          </div>
        )}

        {loading && agents.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass rounded-2xl h-80 animate-pulse bg-surface/30" />
            ))}
          </div>
        ) : agents.length === 0 && !error ? (
          <div className="glass rounded-3xl p-16 text-center space-y-4 border border-dashed border-border-glass">
            <div className="w-16 h-16 rounded-full bg-surface border border-border-glass flex items-center justify-center mx-auto">
              <Zap className="w-8 h-8 text-gray-600" />
            </div>
            <h4 className="text-2xl font-black">No Agents Yet</h4>
            <p className="text-gray-500 max-w-sm mx-auto">Create your first agent to start receiving daily AI-curated reports!</p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 px-6 py-3 mt-2 rounded-xl bg-primary text-white font-bold hover:bg-primary-hover transition-all shadow-lg shadow-primary/20"
            >
              <PlusCircle className="w-5 h-5" />
              Create First Agent
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {agents.map((agent) => (
              <div key={agent.id} className="glass rounded-2xl p-6 flex flex-col h-full border border-border-glass hover:border-primary/30 group transition-all duration-500 relative overflow-hidden">
                {/* Background Shimmer Effect */}
                {agent.is_active && (
                  <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 blur-3xl group-hover:bg-primary/10 transition-colors" />
                )}

                {/* Header Actions */}
                <div className="flex justify-between items-start mb-5">
                  <div className="flex gap-2">
                    <div className={cn(
                      "p-2.5 rounded-lg bg-surface border border-border-glass shadow-inner transition-transform duration-500",
                      agent.agent_type === 'job' ? 'text-green-400' : 'text-red-500'
                    )}>
                      {agent.agent_type === 'job' ? <Briefcase className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </div>
                    {/* Manual Trigger */}
                    <button 
                      onClick={() => handleRunNow(agent.id)}
                      disabled={!!runningId || !!deletingId}
                      className="p-2.5 rounded-lg bg-primary/10 border border-primary/20 hover:bg-primary hover:text-white transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center min-w-[40px]"
                    >
                      {runningId === agent.id ? (
                        <Loader2 className="w-4 h-4 animate-spin text-primary group-hover:text-white" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </button>
                    {/* Delete Agent */}
                    <button 
                      onClick={() => handleDelete(agent.id)}
                      disabled={!!runningId || !!deletingId}
                      className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 hover:bg-red-500 hover:text-white transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Delete Agent"
                    >
                      {deletingId === agent.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                    {/* Edit Agent */}
                    <button
                      onClick={() => setEditingAgent(agent)}
                      disabled={!!runningId || !!deletingId}
                      className="p-2.5 rounded-lg bg-surface border border-border-glass hover:bg-surface-hover hover:text-white transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Edit Agent"
                    >
                      <Pencil className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>

                  <div className="flex flex-col items-end gap-1.5">
                    <div className={cn(
                      "px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border shadow-sm",
                      agent.is_active ? "border-green-500/20 bg-green-500/10 text-green-500" : "border-gray-500/20 bg-gray-500/10 text-gray-500"
                    )}>
                      {agent.is_active ? 'Active' : 'Paused'}
                    </div>
                    {/* Final Run Feedback Dot */}
                    {agent.last_run_status && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] font-bold text-gray-600 uppercase tracking-tighter">Status</span>
                        <div className={cn(
                          "w-1.5 h-1.5 rounded-full",
                          agent.last_run_status === 'success' ? "bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" : "bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.6)]"
                        )} />
                      </div>
                    )}
                  </div>
                </div>

                {/* Content */}
                <h4 className="text-lg font-bold mb-3 group-hover:text-primary transition-colors pr-4">{agent.title}</h4>

                <div className="flex flex-wrap gap-1.5 mb-6 flex-1">
                  {agent.queries.map((q, i) => (
                    <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-surface text-gray-400 font-bold border border-border-glass border-white/5">
                      {q}
                    </span>
                  ))}
                </div>

                {/* Footer Status Display */}
                <div className="space-y-3.5 pt-4 border-t border-border-glass">
                  {/* LIVE COUNTDOWN / RELATIVE TIME */}
                  {agent.last_run_at ? (
                    <div className={cn(
                      "flex items-center gap-2 p-1.5 px-2 rounded-lg text-[11px] font-black border transition-colors",
                      agent.last_run_status === 'success' 
                        ? "bg-green-500/5 border-green-500/10 text-green-500" 
                        : "bg-red-500/5 border-red-500/10 text-red-500"
                    )}>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span className="animate-in fade-in slide-in-from-left-1 duration-500">
                        Email sent {typeof window !== 'undefined' ? getRelativeTime(agent.last_run_at) : 'recently'}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 p-1.5 px-2 rounded-lg text-[11px] font-bold bg-white/5 border border-white/5 text-gray-500 italic">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Ready for first scan</span>
                    </div>
                  )}

                  {/* Mail & Schedule Info */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2 text-[10px] text-gray-500 font-bold truncate">
                      <Mail className="w-3 h-3 text-primary flex-shrink-0" />
                      <span>{agent.recipient_email}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-[10px] text-gray-500 font-bold">
                        <Clock className="w-3 h-3 text-primary" />
                        <span>{agent.preferred_time?.slice(0, 5) || '00:00'}</span>
                        <div className="flex items-center gap-1 opacity-60">
                          <Globe className="w-2.5 h-2.5" />
                          <span>{agent.timezone ? (agent.timezone === 'Asia/Dhaka' ? 'DHAKA' : agent.timezone.split('/').pop()) : 'UTC'}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-gray-500 font-bold">
                        <Video className="w-3 h-3 text-primary" />
                        <span>{agent.max_videos} {agent.agent_type === 'job' ? 'jobs' : 'vids'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
