import { Suspense } from "react";
import WorldExperience from "../../components/world/world-experience";

function WorldLoading() {
  return (
    <main className="min-h-screen bg-[#02040b] p-4 text-white">
      <div className="mx-auto max-w-6xl animate-pulse space-y-4 pt-20">
        <div className="h-8 w-48 rounded bg-white/10" />
        <div className="h-48 rounded-[30px] bg-white/[0.04]" />
        <div className="grid gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-24 rounded-2xl bg-white/[0.04]" />
          ))}
        </div>
      </div>
    </main>
  );
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ world_id?: string | string[] }>;
}) {
  const resolvedSearchParams = await searchParams;
  const rawWorldId = resolvedSearchParams.world_id;
  const initialWorldId = Array.isArray(rawWorldId) ? rawWorldId[0] ?? null : rawWorldId ?? null;

  return (
    <Suspense fallback={<WorldLoading />}>
      <WorldExperience initialWorldId={initialWorldId} />
    </Suspense>
  );
}
