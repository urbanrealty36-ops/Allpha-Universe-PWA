import { Suspense } from "react";
import AgentExperienceSurface from "../../../components/agent-experience-surface";

export const dynamic = "force-dynamic";

export default async function AgentExperiencePage({ params }: { params: Promise<{ agent_id: string }> }) {
  const { agent_id } = await params;
  return (
    <Suspense fallback={<main className="min-h-screen bg-[#02040b] p-6 text-white">Preparing Agent Space…</main>}>
      <AgentExperienceSurface agentId={agent_id} />
    </Suspense>
  );
}
