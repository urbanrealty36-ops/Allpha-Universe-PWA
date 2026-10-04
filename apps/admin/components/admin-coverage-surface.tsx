"use client";
import {useEffect,useState} from "react";
import {apiFetch} from "../app/lib/api";
export default function AdminCoverageSurface({title,eyebrow,description,domainKeys=[]}:{title:string;eyebrow:string;description:string;domainKeys:string[]}){
 const [data,setData]=useState<any>(null),[error,setError]=useState<string|null>(null);
 useEffect(()=>{void apiFetch<{data:any}>("/api/v1/admin/control-plane/overview").then(r=>setData(r.data)).catch(e=>setError(e instanceof Error?e.message:"ADMIN_COVERAGE_LOAD_FAILED"))},[]);
 const domains=data?.domains??[];
 const relevant=domains.filter((x:any)=>domainKeys.includes(x.key));
 return <main className="min-h-screen p-6 sm:p-10"><div className="mx-auto max-w-7xl">
  <p className="text-xs uppercase tracking-[0.24em] text-cyan-300">{eyebrow} · Phase 27D</p>
  <h1 className="mt-3 text-4xl font-semibold tracking-tight">{title}</h1>
  <p className="mt-3 max-w-4xl text-slate-400">{description}</p>
  {error&&<div className="mt-6 rounded-xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-200">{error}</div>}
  <section className="mt-8 rounded-2xl border border-white/10 bg-white/[.03] p-6">
   <div className="flex items-center justify-between"><div><h2 className="font-semibold">Authoritative coverage</h2><p className="mt-1 text-xs text-slate-500">Read-only control-plane inventory; no synthetic records.</p></div><span className="text-xs text-slate-500">{data?.generated_at?new Date(data.generated_at).toLocaleString("id-ID"):"—"}</span></div>
   <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{relevant.map((x:any)=><div key={x.key} className="rounded-xl border border-white/10 p-4"><p className="text-xs uppercase tracking-wider text-slate-500">{x.label}</p><p className="mt-2 text-2xl font-semibold">{x.count}</p><p className="mt-1 text-xs text-slate-500">authoritative records</p></div>)}</div>
   {!relevant.length&&<p className="mt-5 text-sm text-slate-500">No dedicated domain inventory is exposed by the current canonical Admin Control Plane. This route intentionally does not fabricate CRUD or duplicate a domain engine.</p>}
  </section>
 </div></main>;
}