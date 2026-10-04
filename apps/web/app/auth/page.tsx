"use client";

import { Suspense } from "react";
import { UniverseIdentityGateway } from "../../components/identity/universe-identity-experience";

export default function AuthPage() {
  return (
    <Suspense fallback={<AuthLoadingState />}>
      <UniverseIdentityGateway />
    </Suspense>
  );
}

function AuthLoadingState() {
  return (
    <main className="relative flex min-h-[100svh] items-center justify-center overflow-hidden bg-[#02030b] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(124,58,237,.16),transparent_30%),radial-gradient(circle_at_18%_78%,rgba(34,211,238,.09),transparent_28%)]" />
      <div className="relative z-10 text-center">
        <div className="mx-auto h-3 w-3 animate-pulse rounded-full bg-cyan-300 shadow-[0_0_35px_rgba(103,232,249,.9)]" aria-hidden="true" />
        <p className="mt-5 text-[10px] uppercase tracking-[0.42em] text-cyan-200/60">
          Opening Human Identity Gateway
        </p>
      </div>
    </main>
  );
}
