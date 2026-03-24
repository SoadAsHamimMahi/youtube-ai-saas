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
import { AgentLogsModal } from "@/components/dashboard/agent-logs-modal";
import { EmailPreviewModal } from "@/components/dashboard/email-preview-modal";
import { 
  Eye,
  History
} from "lucide-react";



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
  last_run_error: string | null;
  timezone: string;
  created_at: string;
  agent_type?: 'youtube' | 'job';
  location?: string;
  frequency_days?: number;
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
  const [viewingLogsId, setViewingLogsId] = useState<{id: string, title: string} | null>(null);
  const [previewingAgent, setPreviewingAgent] = useState<Agent | null>(null);
  const [totalSentCount, setTotalSentCount] = useState(0);
  const [timeUpdate, setTimeUpdate] = useState(0); 
  const [userTier, setUserTier] = useState<'free' | 'pro'>('free');
  const [credits, setCredits] = useState<number>(0);
  const [instantRunsUsed, setInstantRunsUsed] = useState<number>(0);

  const fetchAgents = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase.from('profiles').select('tier, credits, instant_runs_used').eq('id', user.id).single();
        if (profile) {
          setUserTier(profile.tier);
          setCredits(profile.credits);
          setInstantRunsUsed(profile.instant_runs_used || 0);
        }
      }

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

      // Fetch accurate historical success count
      const { count } = await supabase
        .from('agent_logs')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'success');
      
      if (count !== null) setTotalSentCount(count);
      
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

  return (
    <div className="space-y-10" suppressHydrationWarning>
      {isModalOpen && (
        <AddAgentModal
          onClose={() => setIsModalOpen(false)}
          onSuccess={fetchAgents}
          defaultType={defaultModalType}
          userTier={userTier}
        />
      )}
      {editingAgent && (
        <EditAgentModal
          agent={editingAgent}
          onClose={() => setEditingAgent(null)}
          onSuccess={fetchAgents}
          userTier={userTier}
        />
      )}
      {viewingLogsId && (
        <AgentLogsModal
          agentId={viewingLogsId.id}
          agentTitle={viewingLogsId.title}
          onClose={() => setViewingLogsId(null)}
        />
      )}
      {previewingAgent && (
        <EmailPreviewModal
          agent={previewingAgent}
          onClose={() => setPreviewingAgent(null)}
        />
      )}



      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h2 className="text-4xl font-black tracking-tighter font-outfit text-white">
            {title}
          </h2>
          <p className="text-gray-400 font-bold tracking-tight">{description}</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-primary hover:bg-primary-hover text-white font-black transition-all shadow-2xl shadow-primary/30 hover:translate-y-[-2px] active:scale-95"
        >
          <PlusCircle className="w-5 h-5" />
          Add New Agent
        </button>
      </header>


      {/* Stats */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: "Active Agents", value: activeCount.toString(), icon: Zap, color: "text-amber-400", bg: "bg-amber-400/10" },
          { label: "Total Reports Sent", value: totalSentCount.toString(), icon: Send, color: "text-emerald-400", bg: "bg-emerald-400/10" },
          { label: "Emails Configured", value: agents.filter(a => a.recipient_email).length.toString(), icon: Mail, color: "text-indigo-400", bg: "bg-indigo-400/10" },
        ].map((stat, i) => (
          <div key={i} className="glass p-8 rounded-3xl flex items-center justify-between group hover:bg-white/[0.04] transition-all duration-500 border border-white/5 shadow-2xl">
            <div className="space-y-1">
              <p className="text-[10px] text-gray-400 font-black mb-1 uppercase tracking-[0.2em]">{stat.label}</p>
              <p className="text-5xl font-black font-outfit tracking-tighter">{stat.value}</p>
            </div>
            <div className={cn("p-5 rounded-2xl border border-white/10 transition-all duration-500 group-hover:scale-110", stat.bg, stat.color)}>
              <stat.icon className="w-8 h-8" />
            </div>
          </div>
        ))}
      </section>


      {/* Agents */}
      <section className="space-y-6 pb-20">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-black font-outfit tracking-tight flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-primary shadow-[0_0_15px_rgba(99,102,241,0.8)] animate-pulse" />
            Monitoring Agents ({agents.length})
          </h3>
          <button 
            onClick={() => fetchAgents()} 
            className="text-[10px] font-black tracking-widest uppercase text-gray-500 hover:text-primary transition-all flex items-center gap-2 group bg-white/5 px-4 py-2 rounded-full border border-white/5"
          >
            <RefreshCcw className="w-3.5 h-3.5 group-hover:rotate-180 transition-transform duration-700" />
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
              <div key={agent.id} className="glass rounded-[2rem] p-10 flex flex-col h-full border border-white/5 hover:border-primary/40 group transition-all duration-700 relative overflow-hidden group-hover:translate-y-[-4px] shadow-2xl">
                {/* Background Shimmer Effect */}
                {agent.is_active && (
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-[80px] pointer-events-none group-hover:bg-primary/20 transition-all duration-700" />
                )}

                {/* Header Actions */}
                <div className="flex sm:flex-row flex-col justify-between items-start sm:items-center gap-6 mb-6 relative z-10 w-full">
                  <div className="flex flex-wrap items-center gap-2 flex-1">
                    <div className={cn(
                      "p-3 rounded-xl bg-white/5 border border-white/10 shadow-lg transition-all duration-500 group-hover:scale-110",
                      agent.agent_type === 'job' ? 'text-emerald-400' : 'text-rose-500'
                    )}>
                      {agent.agent_type === 'job' ? <Briefcase className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                    </div>
                    {/* Manual Trigger */}
                    <button 
                      onClick={() => {
                        if (userTier === 'free' && instantRunsUsed >= 2) {
                          alert('Instant Trigger Limit Reached: Free users are limited to 2 manual runs every 7 days. Upgrade to Pro for unlimited instant triggers!');
                          return;
                        }
                        if (credits < 10) {
                          alert(`Insufficient Credits (${credits}/10). You need at least 10 credits to run an agent.`);
                          return;
                        }
                        handleRunNow(agent.id);
                      }}
                      disabled={!!runningId || !!deletingId}
                      className={cn(
                        "p-3 rounded-xl border transition-all duration-500 flex items-center justify-center min-w-[44px]",
                        userTier === 'free' && instantRunsUsed >= 2
                          ? "bg-white/5 border-white/10 text-gray-500 hover:cursor-not-allowed group-hover:scale-100"
                          : "bg-primary/10 border-primary/20 hover:bg-primary hover:text-white group-hover:scale-110 disabled:opacity-30 disabled:cursor-not-allowed"
                      )}
                      title={
                        userTier === 'free' 
                          ? (instantRunsUsed >= 2 ? 'Out of free weekly instant runs (2/2)' : `Run Now (${2 - instantRunsUsed} free runs left this week)`) 
                          : 'Run Agent Now (Costs 10 Credits)'
                      }
                    >
                      {runningId === agent.id ? (
                        <Loader2 className="w-5 h-5 animate-spin text-primary group-hover:text-white" />
                      ) : (
                        <Send className="w-5 h-5" />
                      )}
                    </button>
                    {/* Delete Agent */}
                    <button 
                      onClick={() => handleDelete(agent.id)}
                      disabled={!!runningId || !!deletingId}
                      className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500 hover:text-white transition-all duration-500 disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Delete Agent"
                    >
                      {deletingId === agent.id ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Trash2 className="w-5 h-5" />
                      )}
                    </button>
                    {/* Edit Agent */}
                    <button
                      onClick={() => setEditingAgent(agent)}
                      disabled={!!runningId || !!deletingId}
                      className="p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:text-white transition-all duration-500 disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Edit Agent"
                    >
                      <Pencil className="w-5 h-5 text-gray-400" />
                    </button>
                    {/* View Logs */}
                    <button 
                      onClick={() => setViewingLogsId({id: agent.id, title: agent.title})}
                      className="p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-indigo-500/20 hover:text-primary transition-all duration-500"
                      title="View Run History"
                    >
                      <History className="w-5 h-5 text-gray-400" />
                    </button>
                    {/* Preview Email */}
                    <button 
                      onClick={() => setPreviewingAgent(agent)}
                      className="p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-indigo-500/20 hover:text-primary transition-all duration-500"
                      title="Preview Email Content"
                    >
                      <Eye className="w-5 h-5 text-gray-400" />
                    </button>
                  </div>

                  <div className="flex flex-col items-end gap-1.5">
                    <div className={cn(
                      "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all duration-500",
                      agent.is_active 
                        ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.1)]" 
                        : "border-gray-500/20 bg-gray-500/10 text-gray-500"
                    )}>
                      {agent.is_active ? 'Active' : 'Paused'}
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="relative z-10 space-y-3">
                  <h4 className="text-xl font-black font-outfit text-white group-hover:text-primary transition-colors tracking-tight leading-tight">
                    {agent.title}
                  </h4>

                  <div className="flex flex-wrap gap-2 mb-6">
                    {agent.queries.map((q, i) => (
                      <span key={i} className="text-[10px] px-3 py-1 rounded-lg bg-white/5 text-gray-400 font-black border border-white/5 uppercase tracking-wider group-hover:bg-white/10 transition-colors">
                        {q}
                      </span>
                    ))}
                  </div>
                </div>


                {/* Footer Status Display */}
                <div className="space-y-3.5 pt-4 border-t border-border-glass">
                  {/* LIVE COUNTDOWN / RELATIVE TIME */}
                  {agent.last_run_at ? (
                    <div className="space-y-2">
                      <div className={cn(
                        "flex items-center gap-2 p-1.5 px-2 rounded-lg text-[11px] font-black border transition-colors",
                        agent.last_run_status === 'success' 
                          ? "bg-green-500/5 border-green-500/10 text-green-500" 
                          : "bg-red-500/5 border-red-500/10 text-red-500"
                      )}>
                        {agent.last_run_status === 'success' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                        <span className="animate-in fade-in slide-in-from-left-1 duration-500">
                          {agent.last_run_status === 'success' ? 'Email sent' : 'Failed'} {typeof window !== 'undefined' ? getRelativeTime(agent.last_run_at) : 'recently'}
                        </span>
                      </div>
                      
                      {agent.last_run_status === 'error' && agent.last_run_error && (
                        <div className="flex items-start gap-1.5 p-2 rounded bg-red-500/5 border border-red-500/10 text-[10px] text-red-400 font-medium leading-tight">
                          <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                          <span>{agent.last_run_error}</span>
                        </div>
                      )}
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
                        <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 hidden sm:inline-block">
                          {agent.frequency_days === 7 ? 'Weekly' : agent.frequency_days === 3 ? '3 Days' : 'Daily'}
                        </span>
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
