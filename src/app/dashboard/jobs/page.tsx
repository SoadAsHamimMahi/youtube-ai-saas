import { AgentListView } from "@/components/dashboard/agent-list-view";

export default function JobAgentsPage() {
  return (
    <AgentListView 
      agentType="job"
      title="Job Finders" 
      description="Manage your automated LinkedIn job search agents."
      defaultModalType="job"
    />
  );
}
