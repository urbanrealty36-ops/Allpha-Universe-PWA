"use client";

import { FormEvent, useEffect, useState } from "react";
import { apiFetch } from "../lib/api";

type Edge = {
  id: string; source_type: string; source_id: string; target_type: string; target_id: string;
  relationship_type: string; status: string; initiated_by_user_id: string; created_at: string; updated_at: string;
};
type Notification = {
  id: string; actor_type: string | null; actor_id: string | null; notification_type: string;
  target_type: string | null; target_id: string | null; payload: Record<string, unknown>;
  read_at: string | null; created_at: string;
};
type Block = { id: string; blocker_type: string; blocker_id: string; blocked_type: string; blocked_id: string; created_at: string };
type Activity = { id: string; actor_type: string; actor_id: string; event_type: string; target_type: string | null; target_id: string | null; visibility: string; metadata: Record<string, unknown>; created_at: string };

const tabs = ["graph", "requests", "notifications", "blocks", "activity"] as const;

export default function SocialGraphDashboard({ initialTab = "graph" }: { initialTab?: string }) {
  const [tab, setTab] = useState(initialTab);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [targetType, setTargetType] = useState<"user" | "agent">("user");
  const [targetId, setTargetId] = useState("");
  const [relation, setRelation] = useState("follow");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true); setError(null);
    try {
      const [graph, incoming, notes, blocked, events] = await Promise.all([
        apiFetch<{ data: Edge[] }>("/api/v1/social/relationships"),
        apiFetch<{ data: Edge[] }>("/api/v1/social/relationships?direction=incoming&status=pending"),
        apiFetch<{ data: Notification[] }>("/api/v1/social/notifications"),
        apiFetch<{ data: Block[] }>("/api/v1/social/blocks"),
        apiFetch<{ data: Activity[] }>("/api/v1/social/activity"),
      ]);
      setEdges([...graph.data, ...incoming.data.filter((x) => !graph.data.some((g) => g.id === x.id))]);
      setNotifications(notes.data); setBlocks(blocked.data); setActivity(events.data);
    } catch (e) { setError(e instanceof Error ? e.message : "SOCIAL_GRAPH_LOAD_FAILED"); }
    finally { setLoading(false); }
  }

  useEffect(() => { void load(); }, []);

  async function createRelationship(e: FormEvent) {
    e.preventDefault();
    if (!targetId.trim()) return;
    setSaving(true); setError(null);
    try {
      await apiFetch("/api/v1/social/relationships", {
        method: "POST",
        body: JSON.stringify({ target_type: targetType, target_id: targetId.trim(), relationship_type: relation }),
      });
      setTargetId(""); await load();
    } catch (e) { setError(e instanceof Error ? e.message : "SOCIAL_RELATIONSHIP_FAILED"); }
    finally { setSaving(false); }
  }

  async function act(id: string, action: "accept" | "reject" | "revoke") {
    setSaving(true); setError(null);
    try { await apiFetch("/api/v1/social/relationships/" + id + "/" + action, { method: "POST" }); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : "SOCIAL_RELATIONSHIP_ACTION_FAILED"); }
    finally { setSaving(false); }
  }

  async function markRead(id: string) {
    try { await apiFetch("/api/v1/social/notifications/" + id + "/read", { method: "POST" }); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : "SOCIAL_NOTIFICATION_FAILED"); }
  }

  async function unblock(type: string, id: string) {
    try { await apiFetch("/api/v1/social/blocks/" + type + "/" + id, { method: "DELETE" }); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : "SOCIAL_UNBLOCK_FAILED"); }
  }

  return (
    <main className="min-h-screen p-6 sm:p-10">
      <div className="mx-auto max-w-7xl">
        <p className="text-sm uppercase tracking-[0.24em] text-cyan-300">Social Graph</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">Relationships</h1>
        <p className="mt-4 max-w-3xl text-slate-300">Authoritative Human ↔ Human, Human ↔ Agent and Agent ↔ Agent relationship state. Discovery and recommendation are intentionally separate domains.</p>

        <nav className="mt-8 flex flex-wrap gap-2">
          {tabs.map((key) => <button key={key} onClick={() => setTab(key)} className={"rounded-xl border px-4 py-2 text-sm " + (tab === key ? "border-cyan-300/50 bg-cyan-300/10 text-cyan-100" : "border-white/10 bg-white/[0.03] text-slate-400")}>{key[0].toUpperCase() + key.slice(1)}</button>)}
        </nav>

        {error && <div className="mt-6 rounded-xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-200">{error}</div>}

        {loading ? <section className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-sm text-slate-400">Loading authoritative social graph…</section> : (
          <div className="mt-8 space-y-6">
            {tab === "graph" && <>
              <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                <h2 className="text-xl font-semibold">Create relationship</h2>
                <p className="mt-1 text-sm text-slate-400">Enter an authoritative User or Agent UUID. No identities are fabricated by this UI.</p>
                <form onSubmit={createRelationship} className="mt-5 grid gap-3 sm:grid-cols-[140px_1fr_180px_auto]">
                  <select value={targetType} onChange={(e) => setTargetType(e.target.value as "user" | "agent")} className="rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-sm"><option value="user">User</option><option value="agent">Agent</option></select>
                  <input value={targetId} onChange={(e) => setTargetId(e.target.value)} placeholder="Target UUID" className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm" />
                  <select value={relation} onChange={(e) => setRelation(e.target.value)} className="rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-sm">{["follow","friend","mentor","partner","client","supplier","collaborator","trusted_agent"].map((x) => <option key={x}>{x}</option>)}</select>
                  <button disabled={saving || !targetId.trim()} className="rounded-xl bg-white px-5 py-3 text-sm font-medium text-black disabled:opacity-40">{saving ? "Saving…" : "Connect"}</button>
                </form>
              </section>
              <EdgeList edges={edges} onAction={act} />
            </>}

            {tab === "requests" && <EdgeList edges={edges.filter((x) => x.status === "pending")} onAction={act} requests />}
            {tab === "notifications" && <section className="space-y-3">{notifications.length === 0 ? <Empty text="No social notifications." /> : notifications.map((n) => <article key={n.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"><div className="flex items-start justify-between gap-4"><div><p className="font-medium text-slate-200">{n.notification_type}</p><p className="mt-1 text-xs text-slate-500">{n.actor_type ?? "system"} · {n.actor_id ?? "system"} · {new Date(n.created_at).toLocaleString()}</p></div>{!n.read_at && <button onClick={() => void markRead(n.id)} className="rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-300">Mark read</button>}</div><pre className="mt-4 overflow-auto rounded-xl bg-black/20 p-3 text-xs text-slate-400">{JSON.stringify(n.payload, null, 2)}</pre></article>)}</section>}
            {tab === "blocks" && <section className="space-y-3">{blocks.length === 0 ? <Empty text="No blocked subjects." /> : blocks.map((b) => <article key={b.id} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5"><div><p className="font-medium text-slate-200">{b.blocked_type}</p><p className="mt-1 font-mono text-xs text-slate-500">{b.blocked_id}</p></div><button onClick={() => void unblock(b.blocked_type, b.blocked_id)} className="rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-300">Unblock</button></article>)}</section>}
            {tab === "activity" && <section className="space-y-3">{activity.length === 0 ? <Empty text="No social activity has been recorded." /> : activity.map((a) => <article key={a.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"><p className="font-medium text-slate-200">{a.event_type}</p><p className="mt-1 text-xs text-slate-500">{a.actor_type} · {a.actor_id} · {a.visibility} · {new Date(a.created_at).toLocaleString()}</p>{a.target_id && <p className="mt-2 font-mono text-xs text-slate-500">target: {a.target_type}:{a.target_id}</p>}</article>)}</section>}
          </div>
        )}
      </div>
    </main>
  );
}

function EdgeList({ edges, onAction, requests = false }: { edges: Edge[]; onAction: (id: string, action: "accept" | "reject" | "revoke") => void; requests?: boolean }) {
  if (!edges.length) return <Empty text={requests ? "No pending relationship requests." : "No social relationships exist yet."} />;
  return <section className="space-y-3">{edges.map((edge) => <article key={edge.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div><p className="font-medium text-slate-200">{edge.relationship_type} · {edge.status}</p><p className="mt-2 font-mono text-xs text-slate-500">{edge.source_type}:{edge.source_id} → {edge.target_type}:{edge.target_id}</p><p className="mt-2 text-xs text-slate-500">{new Date(edge.updated_at).toLocaleString()}</p></div>
      <div className="flex gap-2">{edge.status === "pending" && <><button onClick={() => onAction(edge.id, "accept")} className="rounded-lg bg-white px-3 py-2 text-xs font-medium text-black">Accept</button><button onClick={() => onAction(edge.id, "reject")} className="rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-300">Reject</button></>}{(edge.status === "pending" || edge.status === "active") && <button onClick={() => onAction(edge.id, "revoke")} className="rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-300">Revoke</button>}</div>
    </div>
  </article>)}</section>;
}

function Empty({ text }: { text: string }) { return <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-sm text-slate-500">{text}</section>; }
