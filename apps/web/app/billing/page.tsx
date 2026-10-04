"use client";

import {useEffect,useState} from "react";
import {apiFetch} from "../../lib/api";

type Plan={id:string;plan_key:string;name:string;description:string|null;interval_unit:string;interval_count:number;price_amount:number;currency:string;included_credits:number};
type Subscription={id:string;plan_id:string;status:string;current_period_start:string|null;current_period_end:string|null;cancel_at_period_end:boolean;created_at:string};
type Invoice={id:string;invoice_number:string;subscription_id:string|null;order_id:string;status:string;amount:number;currency:string;period_start:string|null;period_end:string|null;due_at:string|null;paid_at:string|null;created_at:string};
const money=(n:number,c:string)=>new Intl.NumberFormat("id-ID",{style:"currency",currency:c,maximumFractionDigits:0}).format(n);
const date=(x:string|null)=>x?new Date(x).toLocaleDateString("id-ID"):"—";

export default function BillingPage(){
 const [plans,setPlans]=useState<Plan[]>([]),[subs,setSubs]=useState<Subscription[]>([]),[invoices,setInvoices]=useState<Invoice[]>([]);
 const [busy,setBusy]=useState<string|null>(null),[message,setMessage]=useState("");
 async function load(){
   try{
     const [p,s,i]=await Promise.all([
       apiFetch<{data:Plan[]}>("/api/v1/billing/plans"),
       apiFetch<{data:Subscription[]}>("/api/v1/billing/subscriptions"),
       apiFetch<{data:Invoice[]}>("/api/v1/billing/invoices")
     ]);
     setPlans(p.data||[]);setSubs(s.data||[]);setInvoices(i.data||[]);
   }catch(e){setMessage(e instanceof Error?e.message:"Billing unavailable")}
 }
 useEffect(()=>{void load()},[]);
 async function subscribe(id:string){
   try{setBusy(id);const r=await apiFetch<{redirect_url:string}>(`/api/v1/billing/plans/${id}/subscribe`,{method:"POST",body:JSON.stringify({idempotency_key:crypto.randomUUID()})});window.location.assign(r.redirect_url)}
   catch(e){setMessage(e instanceof Error?e.message:"Subscription checkout failed")}finally{setBusy(null)}
 }
 async function cancel(id:string){
   if(!window.confirm("Batalkan subscription ini? Subscription aktif akan berhenti pada akhir periode berjalan."))return;
   try{setBusy(id);await apiFetch(`/api/v1/billing/subscriptions/${id}/cancel`,{method:"POST"});setMessage("Subscription cancellation tersimpan.");await load()}
   catch(e){setMessage(e instanceof Error?e.message:"Subscription cancellation failed")}finally{setBusy(null)}
 }
 const active=subs.find(x=>["active","past_due","paused","pending_payment"].includes(x.status));
 return <main className="mx-auto max-w-7xl space-y-8 p-6 text-[var(--allpha-text)]">
  <header><p className="text-xs uppercase tracking-[.22em] text-[var(--allpha-cyan)]">Account Billing</p><h1 className="mt-2 text-4xl font-semibold">Plans, Subscription & Invoices</h1><p className="mt-3 max-w-3xl text-sm text-white/60">Billing uses the canonical Commerce Order → Payment → Midtrans → Settlement flow. No client-side payment state is authoritative.</p></header>
  {message&&<div className="rounded-xl border border-white/10 bg-[var(--allpha-surface)] p-4 text-sm">{message}</div>}
  <section><h2 className="text-2xl font-semibold">Available Plans</h2><div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
   {plans.length===0?<p className="text-sm text-white/50">No published billing plans are configured yet.</p>:plans.map(x=><article key={x.id} className="rounded-2xl border border-white/10 bg-[var(--allpha-surface)] p-5"><p className="text-xs uppercase tracking-wider text-white/40">{x.plan_key}</p><h3 className="mt-2 text-xl font-medium">{x.name}</h3><p className="mt-2 text-sm text-white/60">{x.description||"Allpha subscription plan"}</p><p className="mt-5 text-2xl font-semibold">{money(x.price_amount,x.currency)}<span className="text-sm text-white/40"> / {x.interval_count} {x.interval_unit}</span></p><p className="mt-2 text-sm text-white/50">{x.included_credits} included AI credits</p><button disabled={!!active||busy===x.id} onClick={()=>void subscribe(x.id)} className="mt-5 w-full rounded-lg bg-[var(--allpha-cyan)] px-4 py-2 text-sm font-semibold text-black">{active?"Subscription active":busy===x.id?"Opening…":"Subscribe with Midtrans"}</button></article>)}</div></section>
  <section><div className="flex items-center justify-between"><h2 className="text-2xl font-semibold">My Subscription</h2><a href="/economy" className="text-sm text-[var(--allpha-cyan)]">Economy & Credits →</a></div><div className="mt-4 space-y-3">
   {subs.length===0?<p className="text-sm text-white/50">No subscription records.</p>:subs.map(x=><article key={x.id} className="rounded-2xl border border-white/10 bg-[var(--allpha-surface)] p-5"><div className="flex flex-wrap items-center justify-between gap-4"><div><p className="font-semibold">{x.plan_id}</p><p className="text-sm text-white/50">{x.status} · {date(x.current_period_start)} → {date(x.current_period_end)}</p></div>{x.status!=="cancelled"&&!x.cancel_at_period_end&&<button disabled={busy===x.id} onClick={()=>void cancel(x.id)} className="rounded-lg border border-red-300/20 px-3 py-2 text-xs text-red-200">{busy===x.id?"Saving…":"Cancel subscription"}</button>}</div>{x.cancel_at_period_end&&<p className="mt-3 text-xs text-amber-200">Cancellation scheduled at period end.</p>}</article>)}</div></section>
  <section><h2 className="text-2xl font-semibold">Invoices</h2><div className="mt-4 overflow-x-auto rounded-2xl border border-white/10 bg-[var(--allpha-surface)]"><table className="w-full text-sm"><thead className="border-b border-white/10 text-left text-xs text-white/40"><tr><th className="px-5 py-4">Invoice</th><th>Status</th><th>Amount</th><th>Period</th><th>Due</th><th>Paid</th></tr></thead><tbody>{invoices.length===0?<tr><td colSpan={6} className="px-5 py-10 text-center text-white/40">No invoices.</td></tr>:invoices.map(x=><tr key={x.id} className="border-t border-white/5"><td className="px-5 py-4 font-mono text-xs">{x.invoice_number}</td><td>{x.status}</td><td>{money(x.amount,x.currency)}</td><td>{date(x.period_start)} → {date(x.period_end)}</td><td>{date(x.due_at)}</td><td>{date(x.paid_at)}</td></tr>)}</tbody></table></div></section>
 </main>;
}