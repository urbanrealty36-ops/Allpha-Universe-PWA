export default function Page() {
  return (
    <main className="min-h-screen p-6 sm:p-10">
      <div className="mx-auto max-w-7xl">
        <p className="text-sm uppercase tracking-[0.24em] text-cyan-300">Agent</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">Agent Mind</h1>
        <p className="mt-4 max-w-2xl text-slate-300">Memory, reasoning state, and knowledge boundaries</p>
        <section className="mt-10 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <p className="text-sm font-medium text-slate-200">No data available yet</p>
          <p className="mt-2 text-sm text-slate-400">This surface is waiting for its authoritative API and Supabase data flow. No synthetic records are rendered.</p>
        </section>
      </div>
    </main>
  );
}