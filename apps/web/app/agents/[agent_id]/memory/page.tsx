import AgentMemoryKnowledgeSurface from "../../../../components/agent-memory-knowledge-surface";

export default async function AgentMemoryPage({ params }: { params: Promise<{ agent_id: string }> }) {
  const { agent_id } = await params;
  return <AgentMemoryKnowledgeSurface agentId={agent_id} />;
}
