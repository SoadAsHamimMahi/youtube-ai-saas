import { AgentListView } from "@/components/dashboard/agent-list-view";

export default function YouTubeAgentsPage() {
  return (
    <AgentListView 
      agentType="youtube"
      title="YouTube Monitors" 
      description="Manage your automated YouTube video tracking agents."
      defaultModalType="youtube"
    />
  );
}
