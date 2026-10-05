import { Suspense } from "react";
import AskContentExperience from "../../../../components/content/ask-content-experience";

export const dynamic = "force-dynamic";

export default async function AskContentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <Suspense fallback={<main className="min-h-screen bg-[#02040b] p-6 text-white">Preparing Ask the Content…</main>}>
      <AskContentExperience contentId={id} />
    </Suspense>
  );
}
