import ImmersiveUniverseShell from "../../components/universe/immersive-universe-shell";

export default function UniversePage() {
  return (
    <div className="relative">
      <a
        href="/universe/e2e-setup"
        className="fixed right-4 top-4 z-[100] rounded-xl border border-cyan-300/30 bg-slate-950/85 px-4 py-2 text-xs font-medium text-cyan-200 backdrop-blur"
      >
        E2E Setup
      </a>
      <ImmersiveUniverseShell />
    </div>
  );
}
