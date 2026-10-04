import AgentPersonalizationSurface from "../../../../components/agent-personalization-surface";

export default async function AgentPersonalizationPage({ params }: { params: Promise<{ agent_id: string }> }) {
  const { agent_id } = await params;
  return <AgentPersonalizationSurface agentId={agent_id} />;
}
