import { Suspense } from "react";
import ContentCapsuleExperience from "../../../components/content/content-capsule-experience";

export const dynamic = "force-dynamic";

export default async function ContentPage({ params }: { params: Promise<{ content_id: string }> }) {
  const { content_id } = await params;
  return (
    <Suspense fallback={<main className="min-h-screen bg-[#02040b] p-6 text-white">Preparing Content Capsule…</main>}>
      <ContentCapsuleExperience contentId={content_id} />
    </Suspense>
  );
}
