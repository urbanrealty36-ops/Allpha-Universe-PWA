"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { apiFetch } from "../lib/api";

type Interest = { id: string; parent_id: string | null; name: string; canonical_key: string; description: string | null; ontology_type: string };
type Affinity = { id: string; interest_id: string; score: number; confidence: number; evidence_count: number; positive_evidence: number; negative_evidence: number; interest?: Interest };
type Passion = { id: string; name: string | null; confidence: number; evidence_count: number; status: string };
type Habit = { id: string; pattern_type: string; pattern_key: string; pattern: Record<string, unknown>; confidence: number; evidence_count: number; status: string };
type Goal = { id: string; title: string; description: string | null; goal_type: string | null; status: string; priority: number; target_at: string | null };
type Snapshot = { interests: Affinity[]; passions: Passion[]; habits: Habit[]; goals: Goal[] };

const tabs = [["all", "Overview"], ["interests", "Interests"], ["passions", "Passions"], ["habits", "Habits"], ["goals", "Goals"]] as const;

export default function PersonalizationDashboard({ initialTab = "all" }: { initialTab?: string }) {
  const [tab, setTab] = useState(initialTab);
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [ontology, setOntology] = useState<Interest[]>([]);
  const [selectedInterest, setSelectedInterest] = useState("");
  const [goalTitle, setGoalTitle] = useState("");
  const [goalDescription, setGoalDescription] = useState("");
  const [signalType, setSignalType] = useState("view");
  const [signalStrength, setSignalStrength] = useState("1");
  const [signalEntityType, setSignalEntityType] = useState("content");
  const [signalEntityId, setSignalEntityId] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const selectedIds = useMemo(() => new Set((snapshot?.interests ?? []).map((item) => item.interest_id)), [snapshot]);

  async function load() {
    setLoading(true); setError(null);
    try {
      const [graph, nodes] = await Promise.all([
        apiFetch<Snapshot & { subject: { type: string; id: string } }>("/api/v1/personalization/me"),
        apiFetch<{ data: Interest[] }>("/api/v1/personalization/ontology/interests"),
      ]);
      setSnapshot(graph); setOntology(nodes.data);
    } catch (err) { setError(err instanceof Error ? err.message : "PERSONALIZATION_LOAD_FAILED"); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []);

  async function addInterest(event: FormEvent) {
    event.preventDefault(); if (!selectedInterest) return; setSaving(true); setError(null);
    try {
      await apiFetch("/api/v1/personalization/interests", { method: "POST", body: JSON.stringify({ interest_id: selectedInterest }) });
      setSelectedInterest(""); await load();
    } catch (err) { setError(err instanceof Error ? err.message : "INTEREST_UPDATE_FAILED"); } finally { setSaving(false); }
  }
  async function removeInterest(id: string) {
    setSaving(true); setError(null);
    try { await apiFetch("/api/v1/personalization/interests/" + id, { method: "DELETE" }); await load(); }
    catch (err) { setError(err instanceof Error ? err.message : "INTEREST_REMOVE_FAILED"); } finally { setSaving(false); }
  }
  async function recordSignal(event: FormEvent) {
    event.preventDefault();
    if (!signalType.trim()) return;
    setSaving(true); setError(null);
    try {
      await apiFetch("/api/v1/personalization/signals", {
        method: "POST",
        body: JSON.stringify({
          signal_type: signalType.trim(),
          entity_type: signalEntityType.trim() || null,
          entity_id: signalEntityId.trim() || null,
          strength: Math.max(0, Math.min(1, Number(signalStrength) || 0)),
          context: { source: "web-personalization-dashboard" },
        }),
      });
      setSignalEntityId("");
      await load();
    } catch (err) { setError(err instanceof Error ? err.message : "PERSONALIZATION_SIGNAL_FAILED"); }
    finally { setSaving(false); }
  }

  async function refreshGraph() {
    setRefreshing(true); setError(null);
    try {
      await apiFetch("/api/v1/personalization/refresh", {
        method: "POST",
        body: JSON.stringify({ subject_type: "user" }),
      });
      await load();
    } catch (err) { setError(err instanceof Error ? err.message : "PERSONALIZATION_REFRESH_FAILED"); }
    finally { setRefreshing(false); }
  }

  async function createGoal(event: FormEvent) {
    event.preventDefault(); if (!goalTitle.trim()) return; setSaving(true); setError(null);
    try {
      await apiFetch("/api/v1/personalization/goals", { method: "POST", body: JSON.stringify({ title: goalTitle.trim(), description: goalDescription.trim() || null }) });
      setGoalTitle(""); setGoalDescription(""); await load();
    } catch (err) { setError(err instanceof Error ? err.message : "GOAL_CREATE_FAILED"); } finally { setSaving(false); }
  }

  return (
    <main className="min-h-screen p-6 sm:p-10">
      <div className="mx-auto max-w-7xl">
        <p className="text-sm uppercase tracking-[0.24em] text-cyan-300">Intelligence</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">Personalization Graph</h1>
        <p className="mt-4 max-w-3xl text-slate-300">Interest, passion and habit signals are learned from real activity. Goals are explicit user intent.</p>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button onClick={() => void refreshGraph()} disabled={refreshing || loading} className="rounded-xl bg-cyan-300 px-4 py-2 text-sm font-medium text-slate-950 disabled:opacity-40">{refreshing ? "Refreshing Graph…" : "Refresh Intelligence"}</button>
          <span className="text-xs text-slate-500">Authoritative refresh; no synthetic signals.</span>
        </div>
        <nav className="mt-8 flex flex-wrap gap-2">
          {tabs.map(([key,label]) => <button key={key} onClick={() => setTab(key)} className={"rounded-xl border px-4 py-2 text-sm " + (tab === key ? "border-cyan-300/50 bg-cyan-300/10 text-cyan-100" : "border-white/10 bg-white/[0.03] text-slate-400")}>{label}</button>)}
        </nav>
        {error && <div className="mt-6 rounded-xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-200">{error}</div>}
        {loading ? <section className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-sm text-slate-400">Loading authoritative personalization data…</section> : !snapshot ? <section className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-sm text-slate-400">No personalization graph is available.</section> : (
          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            {(tab === "all" || tab === "interests") && <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 lg:col-span-2">
              <h2 className="text-xl font-semibold">Interests & Signals</h2>
              <form onSubmit={recordSignal} className="mt-4 grid gap-3 sm:grid-cols-4">
                <input value={signalType} onChange={e => setSignalType(e.target.value)} placeholder="Signal type" className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm" />
                <select value={signalEntityType} onChange={e => setSignalEntityType(e.target.value)} className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm"><option value="content">content</option><option value="world">world</option><option value="agent">agent</option><option value="community">community</option><option value="event">event</option></select>
                <input value={signalEntityId} onChange={e => setSignalEntityId(e.target.value)} placeholder="Entity UUID (optional)" className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm" />
                <button disabled={saving || !signalType.trim()} className="rounded-xl bg-white px-4 py-3 text-sm font-medium text-black disabled:opacity-40">Record Signal</button>
              </form>
              <div className="mt-6 flex flex-wrap gap-2">
                <select value={selectedInterest} onChange={e => setSelectedInterest(e.target.value)} className="min-w-56 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm"><option value="">Select an interest</option>{ontology.filter(item => !selectedIds.has(item.id)).map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
                <button disabled={saving || !selectedInterest} onClick={() => void addInterest(new Event("submit") as unknown as FormEvent)} className="rounded-xl border border-white/10 px-4 py-2 text-sm">Add</button>
              </div>
              <div className="mt-5 space-y-3">{snapshot.interests.length === 0 ? <p className="text-sm text-slate-500">No interest affinity exists yet.</p> : snapshot.interests.map(item => <div key={item.id} className="flex items-center justify-between rounded-xl border border-white/10 p-4"><div><p className="font-medium">{item.interest?.name ?? item.interest_id}</p><p className="text-xs text-slate-500">Score {item.score.toFixed(3)} · Evidence {item.evidence_count} · Confidence {item.confidence.toFixed(3)}</p></div><button disabled={saving} onClick={() => void removeInterest(item.interest_id)} className="rounded-lg border border-white/10 px-3 py-2 text-xs">Remove</button></div>)}</div>
            </section>}
            {(tab === "all" || tab === "passions") && <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6"><h2 className="text-xl font-semibold">Passion Graph</h2><div className="mt-4 space-y-3">{snapshot.passions.length === 0 ? <p className="text-sm text-slate-500">No derived passion cluster exists yet.</p> : snapshot.passions.map(item => <article key={item.id} className="rounded-xl border border-white/10 p-4"><p className="font-medium">{item.name ?? "Unnamed cluster"}</p><p className="text-xs text-slate-500">Confidence {item.confidence.toFixed(3)} · Evidence {item.evidence_count} · {item.status}</p></article>)}</div></section>}
            {(tab === "all" || tab === "habits") && <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6"><h2 className="text-xl font-semibold">Habit Graph</h2><div className="mt-4 space-y-3">{snapshot.habits.length === 0 ? <p className="text-sm text-slate-500">No recurring habit pattern has enough evidence yet.</p> : snapshot.habits.map(item => <article key={item.id} className="rounded-xl border border-white/10 p-4"><p className="font-medium">{item.pattern_type}: {item.pattern_key}</p><p className="text-xs text-slate-500">Confidence {item.confidence.toFixed(3)} · Evidence {item.evidence_count} · {item.status}</p></article>)}</div></section>}
            {(tab === "all" || tab === "goals") && <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 lg:col-span-2"><h2 className="text-xl font-semibold">Goals</h2><form onSubmit={createGoal} className="mt-4 grid gap-3"><input value={goalTitle} onChange={e => setGoalTitle(e.target.value)} placeholder="Goal title" className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm" /><textarea value={goalDescription} onChange={e => setGoalDescription(e.target.value)} placeholder="Optional description" rows={3} className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm" /><button disabled={saving || !goalTitle.trim()} className="w-fit rounded-xl bg-white px-5 py-3 text-sm font-medium text-black disabled:opacity-40">{saving ? "Saving…" : "Create Goal"}</button></form><div className="mt-5 space-y-3">{snapshot.goals.length === 0 ? <p className="text-sm text-slate-500">No goals have been created.</p> : snapshot.goals.map(goal => <article key={goal.id} className="rounded-xl border border-white/10 p-4"><div className="flex justify-between gap-4"><p className="font-medium">{goal.title}</p><span className="text-xs text-slate-500">{goal.status}</span></div>{goal.description && <p className="mt-2 text-sm text-slate-400">{goal.description}</p>}<p className="mt-2 text-xs text-slate-500">Priority {goal.priority}{goal.target_at ? " · Target " + new Date(goal.target_at).toLocaleString() : ""}</p></article>)}</div></section>}
          </div>
        )}
      </div>
    </main>
  );
}