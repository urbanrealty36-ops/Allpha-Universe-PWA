"use client";

import {useEffect,useState} from "react";
import {apiFetch} from "../../lib/api";

const resources=[["billing_plans","Billing Plans"],["subscriptions","Subscriptions"],["invoices","Invoices"],["payouts","Payout Requests"],["credit_products","AI Credit Products"]];
export default function AdminBillingPage(){
 const [counts,setCounts]=useState<Record<string,number>>({}),[error,setError]=useState("");
 useEffect(()=>{void Promise.all(resources.map(async([key])=>{try{const r=await apiFetch<{data:{items:any[];total?:number}}>(`/api/v1/admin/control-plane/domains/${key}?limit=1&offset=0`);return [key,Number(r.data?.total??r.data?.items?.length??0)] as const}catch(e){return [key,-1] as const}})).then(rows=>setCounts(Object.fromEntries(rows))).catch(e=>setError(e instanceof Error?e.message:"Billing admin unavailable"))},[]);
 return <main className="min-h-screen p-6 sm:p-10"><div className="mx-auto max-w-7xl">
  <p className="text-xs uppercase tracking-[.24em] text-cyan-300">Commercial Control Plane</p><h1 className="mt-3 text-4xl font-semibold">Billing & Economy Operations</h1><p className="mt-4 max-w-3xl text-slate-400">Authoritative billing, subscription, invoice, credit and payout visibility. Mutations remain behind the canonical domain-operation and payout permission boundaries.</p>
  {error&&<div className="mt-5 rounded-xl border border-red-400/20 bg-red-400/10 p-4 text-sm">{error}</div>}
  <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{resources.map(([key,label])=><a key={key} href={key==="payouts"?"/../admin/payouts":"/operations"} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 hover:border-cyan-300/30"><p className="text-xs uppercase tracking-wider text-slate-500">{label}</p><p className="mt-3 text-3xl font-semibold">{counts[key]===-1?"—":counts[key]??"…"}</p><p className="mt-2 text-xs text-slate-500">{key==="payouts"?"Open payout review":"Open Domain Operations →"}</p></a>)}</div>
  <section className="mt-8 grid gap-4 md:grid-cols-3"><a href="/transactions" className="rounded-xl border border-white/10 p-4"><b>Transaction Explorer</b><p className="mt-1 text-sm text-slate-500">Orders, payments, invoices, credit purchases and audit evidence.</p></a><a href="/operations" className="rounded-xl border border-white/10 p-4"><b>Domain Operations</b><p className="mt-1 text-sm text-slate-500">Billing plans, credit products, subscriptions, invoices and payouts.</p></a><a href="/overview" className="rounded-xl border border-white/10 p-4"><b>Control Plane Overview</b><p className="mt-1 text-sm text-slate-500">Return to the authoritative platform control plane.</p></a></section>
 </div></main>;
}