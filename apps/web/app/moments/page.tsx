import { Suspense } from "react";
import UniverseMomentsExperience from "../../components/universe/universe-moments-experience";

export const dynamic = "force-dynamic";

export default function MomentsPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-[#02040b] p-6 text-white">Preparing Universe Moments…</main>}>
      <UniverseMomentsExperience />
    </Suspense>
  );
}
