import AgentMemoryKnowledgeSurface from "../../../../components/agent-memory-knowledge-surface";

export default async function AgentMemoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AgentMemoryKnowledgeSurface agentId={id} />;
}
