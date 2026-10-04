"use client";
import {useEffect,useState} from "react";
import {apiFetch} from "../../lib/api";

export default function Page(){
 const [data,setData]=useState<any>(null),[error,setError]=useState<string|null>(null);
 useEffect(()=>{void apiFetch<{data:any}>("/api/v1/admin/agent-authority/security-summary").then(r=>setData(r.data)).catch(e=>setError(e instanceof Error?e.message:"ADMIN_SECURITY_LOAD_FAILED"))},[]);
 const security=data?.security??{};
 const domains=data?.domains??[];
 return <main className="min-h-screen p-6 sm:p-10"><div className="mx-auto max-w-7xl">
  <p className="text-xs uppercase tracking-[0.24em] text-cyan-300">Governance · Phase 27D</p><h1 className="mt-3 text-4xl font-semibold">Security Control Plane</h1>
  <p className="mt-3 max-w-4xl text-slate-400">Authoritative security posture derived from the existing Control Plane. This surface does not invent security records or replace the canonical authorization layer.</p>
  {error&&<div className="mt-5 rounded-xl border border-red-400/20 bg-red-400/10 p-4 text-sm">{error}</div>}
  <section className="mt-8 grid gap-4 md:grid-cols-2"><div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"><p className="text-sm text-slate-400">Feature Flags RLS</p><p className="mt-2 text-2xl font-semibold">{security.rls_feature_flags===true?"Enabled":security.rls_feature_flags===false?"Disabled":"Unknown"}</p></div><div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"><p className="text-sm text-slate-400">Config Versions RLS</p><p className="mt-2 text-2xl font-semibold">{security.rls_config_versions===true?"Enabled":security.rls_config_versions===false?"Disabled":"Unknown"}</p></div></section>
  <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-5"><h2 className="font-semibold">Authoritative domain inventory</h2><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{domains.map((d:any)=><div key={d.key} className="rounded-xl border border-white/10 p-4"><p className="text-sm text-slate-400">{d.label}</p><p className="mt-1 text-xl font-semibold">{d.count}</p></div>)}</div></section>
 </div></main>;
}