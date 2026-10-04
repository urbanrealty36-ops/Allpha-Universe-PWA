import AgentControlSurface from "../../../../components/agent-control-surface";

export default async function AgentControlPage({ params }: { params: Promise<{ agent_id: string }> }) {
  const { agent_id } = await params;
  return <AgentControlSurface agentId={agent_id} />;
}
