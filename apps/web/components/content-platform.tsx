"use client";

import { FormEvent, useEffect, useState } from "react";
import { apiFetch } from "../lib/api";

type Content = { id:string; owner_type:string; owner_id:string; content_type:string; title:string|null; body:string|null; excerpt:string|null; visibility:string; status:string; language_code:string|null; metadata:Record<string,unknown>; published_at:string|null; created_at:string; updated_at:string };
const types = ["post","image","video","carousel","article","document","presentation","podcast","audio","tutorial","infographic","research","ai_capsule"];

export default function ContentPlatform({ detailId }: { detailId?: string }) {
  const [items,setItems] = useState<Content[]>([]);
  const [selected,setSelected] = useState<Content|null>(null);
  const [type,setType] = useState("post");
  const [title,setTitle] = useState("");
  const [body,setBody] = useState("");
  const [excerpt,setExcerpt] = useState("");
  const [visibility,setVisibility] = useState("public");
  const [loading,setLoading] = useState(true);\n  const [topics,setTopics] = useState<any[]>([]);\n  const [revisions,setRevisions] = useState<any[]>([]);\n  const [events,setEvents] = useState<any[]>([]);\n  const [topicCatalog,setTopicCatalog] = useState<any[]>([]);\n  const [selectedTopic,setSelectedTopic] = useState("");
  const [saving,setSaving] = useState(false);
  const [error,setError] = useState<string|null>(null);

  async function load() {
    setLoading(true); setError(null);
    try {
      if (detailId) {
        const r = await apiFetch<{data:Content}>("/api/v1/content/" + detailId);
        setSelected(r.data);\n        const [t,rv,ev,cat] = await Promise.all([\n          apiFetch<{data:any[]}>("/api/v1/content/"+detailId+"/topics"),\n          apiFetch<{data:any[]}>("/api/v1/content/"+detailId+"/revisions"),\n          apiFetch<{data:any[]}>("/api/v1/content/"+detailId+"/events"),\n          apiFetch<{data:any[]}>("/api/v1/content/topics")\n        ]);\n        setTopics(t.data||[]); setRevisions(rv.data||[]); setEvents(ev.data||[]); setTopicCatalog(cat.data||[]);
      } else {
        const r = await apiFetch<{data:Content[]}>("/api/v1/content?mine=true");
        setItems(r.data);
      }
    } catch (e) { setError(e instanceof Error ? e.message : "CONTENT_LOAD_FAILED"); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, [detailId]);

  async function create(e:FormEvent) {
    e.preventDefault(); if (!title.trim() && !body.trim()) return;
    setSaving(true); setError(null);
    try {
      await apiFetch("/api/v1/content", { method:"POST", body:JSON.stringify({content_type:type,title:title||null,body:body||null,excerpt:excerpt||null,visibility}) });
      setTitle(""); setBody(""); setExcerpt(""); setVisibility("public"); await load();
    } catch (e) { setError(e instanceof Error ? e.message : "CONTENT_CREATE_FAILED"); }
    finally { setSaving(false); }
  }

  async function action(id:string, actionName:"publish"|"archive") {
    setSaving(true); setError(null);
    try { await apiFetch("/api/v1/content/" + id + "/" + actionName, {method:"POST"}); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : "CONTENT_ACTION_FAILED"); }
    finally { setSaving(false); }
  }

  if (detailId) return (
    <main className="min-h-screen p-6 sm:p-10"><div className="mx-auto max-w-4xl">
      {error && <ErrorBox text={error}/>}
      {loading ? <State text="Loading authoritative content…" /> : selected ? (
        <article className="mt-6 rounded-3xl border border-white/10 bg-white/[0.03] p-7">
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">{selected.content_type} · {selected.status}</p>
          <h1 className="mt-3 text-4xl font-semibold">{selected.title || "Untitled content"}</h1>
          {selected.excerpt && <p className="mt-4 text-slate-300">{selected.excerpt}</p>}
          <div className="mt-8 whitespace-pre-wrap text-slate-200">{selected.body || "No body content."}</div>
          <p className="mt-8 text-xs text-slate-500">{selected.owner_type}:{selected.owner_id}</p>
        </article>
      ) : <State text="Content is not available." />}
    </div></main>
  );

  return (
    <main className="min-h-screen p-6 sm:p-10"><div className="mx-auto max-w-7xl">
      <p className="text-sm uppercase tracking-[0.24em] text-cyan-300">Content Platform</p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight">Create & Manage Content</h1>
      <p className="mt-4 max-w-3xl text-slate-300">Create authoritative content and attach real media. Publishing remains subject to ownership, moderation and media approval.</p>
      {error && <div className="mt-6"><ErrorBox text={error}/></div>}
      <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-6">
        <h2 className="text-xl font-semibold">Create content</h2>
        <form onSubmit={create} className="mt-5 grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <select value={type} onChange={e=>setType(e.target.value)} className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm">{types.map(x=><option key={x}>{x}</option>)}</select>
            <select value={visibility} onChange={e=>setVisibility(e.target.value)} className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm"><option value="public">Public</option><option value="connections">Connections</option><option value="private">Private</option><option value="unlisted">Unlisted</option></select>
          </div>
          <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Title" className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm"/>
          <textarea value={excerpt} onChange={e=>setExcerpt(e.target.value)} placeholder="Excerpt" rows={2} className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm"/>
          <textarea value={body} onChange={e=>setBody(e.target.value)} placeholder="Write your content…" rows={8} className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm"/>
          <button disabled={saving || (!title.trim() && !body.trim())} className="w-fit rounded-xl bg-white px-5 py-3 text-sm font-medium text-black disabled:opacity-40">{saving ? "Saving…" : "Create draft"}</button>
        </form>
      </section>
      <section className="mt-8">
        <div className="mb-4 flex items-center justify-between"><h2 className="text-xl font-semibold">My content</h2><button onClick={()=>void load()} className="rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-300">Refresh</button></div>
        {loading ? <State text="Loading authoritative content…" /> : items.length === 0 ? <State text="No content exists yet. Create a real draft above." /> :
          <div className="grid gap-4 md:grid-cols-2">{items.map(x=><article key={x.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="flex items-start justify-between gap-4"><div><p className="text-xs uppercase tracking-[0.15em] text-cyan-300">{x.content_type}</p><h3 className="mt-2 text-lg font-semibold">{x.title || "Untitled content"}</h3><p className="mt-2 text-sm text-slate-400">{x.excerpt || "No excerpt."}</p></div><span className="rounded-full border border-white/10 px-2 py-1 text-[11px] text-slate-400">{x.status}</span></div>
            <div className="mt-5 flex gap-2">{x.status==="draft" && <button disabled={saving} onClick={()=>void action(x.id,"publish")} className="rounded-lg bg-white px-3 py-2 text-xs font-medium text-black">Publish</button>}{(x.status==="draft"||x.status==="published") && <button disabled={saving} onClick={()=>void action(x.id,"archive")} className="rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-300">Archive</button>}<a href={"/content/" + x.id} className="rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-300">Open</a></div>
          </article>)}</div>}
      </section>
    </div></main>
  );
}
function ErrorBox({text}:{text:string}){return <div className="rounded-xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-200">{text}</div>}
function State({text}:{text:string}){return <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-sm text-slate-500">{text}</div>}
