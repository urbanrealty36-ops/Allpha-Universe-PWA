"use client";

import {useEffect,useState} from "react";
import {apiFetch} from "../../lib/api";

const money=(x:any)=>new Intl.NumberFormat("id-ID",{style:"currency",currency:"IDR",maximumFractionDigits:0}).format(Number(x||0));
const date=(x:any)=>x?new Date(x).toLocaleString("id-ID"):"—";

function DetailSection({title,children}:{title:string;children:React.ReactNode}){
  return <section className="rounded-xl border border-white/10 bg-white/[0.03] p-4"><h3 className="font-semibold">{title}</h3><div className="mt-3">{children}</div></section>;
}

export default function TransactionsPage(){
 const [data,setData]=useState<any>(null),[selected,setSelected]=useState<any>(null);
 const [q,setQ]=useState(""),[kind,setKind]=useState(""),[status,setStatus]=useState("");
 const [paymentStatus,setPaymentStatus]=useState(""),[providerStatus,setProviderStatus]=useState("");
 const [from,setFrom]=useState(""),[to,setTo]=useState("");
 const [busy,setBusy]=useState(false),[error,setError]=useState<string|null>(null),[offset,setOffset]=useState(0);
 const limit=25;

 function queryString(nextOffset:number){
   const p=new URLSearchParams({limit:String(limit),offset:String(nextOffset)});
   if(q)p.set("q",q); if(kind)p.set("order_kind",kind); if(status)p.set("order_status",status);
   if(paymentStatus)p.set("payment_status",paymentStatus); if(providerStatus)p.set("provider_status",providerStatus);
   if(from)p.set("date_from",new Date(from).toISOString()); if(to)p.set("date_to",new Date(to).toISOString());
   return p.toString();
 }
 async function load(nextOffset=offset){
   setBusy(true);setError(null);
   try{const r=await apiFetch<{data:any}>("/api/v1/admin/control-plane/transactions?"+queryString(nextOffset));setData(r.data);setOffset(nextOffset)}
   catch(e){setError(e instanceof Error?e.message:"TRANSACTIONS_LOAD_FAILED")}
   finally{setBusy(false)}
 }
 useEffect(()=>{void load(0)},[kind,status,paymentStatus,providerStatus]);

 async function detail(id:string){
   setError(null);
   try{const r=await apiFetch<{data:any}>("/api/v1/admin/control-plane/transactions/"+id);setSelected(r.data)}
   catch(e){setError(e instanceof Error?e.message:"TRANSACTION_DETAIL_FAILED")}
 }
 const items=data?.items??[],total=Number(data?.total??0);
 const order=selected?.order, buyer=selected?.buyer;

 return <main className="min-h-screen p-6 sm:p-10"><div className="mx-auto max-w-[1800px]">
  <div className="flex flex-wrap items-end justify-between gap-4"><div>
   <p className="text-xs uppercase tracking-[0.24em] text-cyan-300">Allpha Control Plane · Phase 27C</p>
   <h1 className="mt-3 text-4xl font-semibold">Transaction Explorer</h1>
   <p className="mt-3 max-w-4xl text-slate-400">Authoritative Commerce Orders, payment attempts, provider references, invoices, credits, events and audit evidence. Secret provider payloads are never returned.</p>
  </div></div>

  <section className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
   <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
    <input value={q} onChange={e=>setQ(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")void load(0)}} placeholder="Order ID, username, provider reference…" className="rounded-xl border border-white/10 bg-white/5 px-4 py-3"/>
    <select value={kind} onChange={e=>setKind(e.target.value)} className="rounded-xl border border-white/10 bg-white/5 px-4 py-3"><option value="">All order kinds</option><option value="marketplace">Marketplace</option><option value="credit_purchase">Credit purchase</option><option value="subscription">Subscription</option><option value="booth">Booth</option><option value="live">Live</option><option value="other">Other</option></select>
    <select value={status} onChange={e=>setStatus(e.target.value)} className="rounded-xl border border-white/10 bg-white/5 px-4 py-3"><option value="">All order statuses</option><option value="pending">Pending</option><option value="paid">Paid</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option><option value="failed">Failed</option></select>
    <select value={paymentStatus} onChange={e=>setPaymentStatus(e.target.value)} className="rounded-xl border border-white/10 bg-white/5 px-4 py-3"><option value="">All payment statuses</option><option value="pending">Pending</option><option value="captured">Captured</option><option value="failed">Failed</option><option value="expired">Expired</option><option value="cancelled">Cancelled</option></select>
    <input value={providerStatus} onChange={e=>setProviderStatus(e.target.value)} placeholder="Provider status" className="rounded-xl border border-white/10 bg-white/5 px-4 py-3"/>
    <label className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-500">From<input type="datetime-local" value={from} onChange={e=>setFrom(e.target.value)} className="mt-1 block w-full bg-transparent text-sm text-slate-200 outline-none"/></label>
    <label className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-500">To<input type="datetime-local" value={to} onChange={e=>setTo(e.target.value)} className="mt-1 block w-full bg-transparent text-sm text-slate-200 outline-none"/></label>
    <button onClick={()=>void load(0)} className="rounded-xl bg-cyan-300 px-5 py-3 font-semibold text-slate-950">Apply filters</button>
   </div>
  </section>

  {error&&<div className="mt-4 rounded-xl border border-red-400/20 bg-red-400/10 p-4 text-sm">{error}</div>}
  <section className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]"><div className="overflow-x-auto"><table className="w-full text-sm">
   <thead className="border-b border-white/10 text-left text-xs text-slate-500"><tr><th className="px-5 py-4">Order</th><th>Buyer</th><th>Kind</th><th>Amount</th><th>Payment</th><th>Provider</th><th>Created</th><th></th></tr></thead>
   <tbody>{items.length===0?<tr><td colSpan={8} className="px-5 py-12 text-center text-slate-500">{busy?"Loading…":"No authoritative transactions found."}</td></tr>:items.map((x:any)=><tr key={x.order_id} className="border-t border-white/5">
    <td className="px-5 py-4"><div className="font-mono text-xs">{x.order_id}</div><div className="mt-1 text-slate-500">{x.order_status}</div></td>
    <td>{x.buyer_display_name||x.buyer_username||x.buyer_user_id}</td><td>{x.order_kind}</td><td>{money(x.total_amount)}<div className="text-xs text-slate-500">{x.item_count} item · {money(x.item_value)}</div></td>
    <td>{x.payments?.[0]?.status||"—"}</td><td>{x.payments?.[0]?.provider_status||x.payments?.[0]?.provider_transaction_id||x.payments?.[0]?.external_reference||"—"}</td>
    <td className="text-xs text-slate-500">{date(x.created_at)}</td><td><button onClick={()=>void detail(x.order_id)} className="rounded-lg border border-cyan-300/30 px-3 py-2 text-xs">Open</button></td>
   </tr>)}</tbody>
  </table></div>
  <div className="flex items-center justify-between border-t border-white/10 p-4 text-sm text-slate-400"><span>{total} total</span><div className="flex gap-2"><button disabled={offset===0||busy} onClick={()=>void load(Math.max(0,offset-limit))} className="rounded-lg border border-white/10 px-3 py-2 disabled:opacity-30">Previous</button><button disabled={offset+limit>=total||busy} onClick={()=>void load(offset+limit)} className="rounded-lg border border-white/10 px-3 py-2 disabled:opacity-30">Next</button></div></div>
  </section>

  {selected&&<div className="fixed inset-0 z-50 overflow-auto bg-black/80 p-4 sm:p-8" onClick={()=>setSelected(null)}>
   <div className="mx-auto max-w-6xl space-y-4 rounded-2xl border border-white/10 bg-slate-950 p-5 sm:p-7" onClick={e=>e.stopPropagation()}>
    <div className="flex items-center justify-between gap-4"><div><p className="text-xs uppercase tracking-[0.2em] text-cyan-300">Transaction Drill-down</p><h2 className="mt-2 text-2xl font-semibold">{order?.order_kind||"Order"} · {order?.id}</h2></div><button onClick={()=>setSelected(null)} className="rounded-lg border border-white/10 px-3 py-2">Close</button></div>
    <div className="grid gap-4 md:grid-cols-3"><DetailSection title="Order"><div className="space-y-1 text-sm text-slate-300"><p>Status: <b>{order?.status||"—"}</b></p><p>Total: <b>{money(order?.total_amount)}</b></p><p>Currency: {order?.currency||"—"}</p><p>Created: {date(order?.created_at)}</p><p>Paid: {date(order?.paid_at)}</p><p>Completed: {date(order?.completed_at)}</p></div></DetailSection><DetailSection title="Buyer"><div className="space-y-1 text-sm text-slate-300"><p>{buyer?.display_name||"—"}</p><p>@{buyer?.username||"—"}</p><p className="font-mono text-xs">{buyer?.id||order?.buyer_user_id||"—"}</p><p>Status: {buyer?.status||"—"}</p></div></DetailSection><DetailSection title="Linked Commerce"><div className="space-y-1 text-sm text-slate-300"><p>Invoice: {selected.invoice?.invoice_number||"—"}</p><p>Credit purchase: {selected.credit_purchase?.id||"—"}</p><p>Items: {selected.items?.length??0}</p><p>Payments: {selected.payments?.length??0}</p><p>Events: {selected.events?.length??0}</p></div></DetailSection></div>

    <DetailSection title="Payment attempts"><div className="overflow-x-auto"><table className="w-full text-xs"><thead className="text-left text-slate-500"><tr><th className="py-2">Provider</th><th>Status</th><th>Provider status</th><th>Reference</th><th>Amount</th><th>Captured/Paid</th></tr></thead><tbody>{(selected.payments??[]).map((p:any)=><tr key={p.id} className="border-t border-white/5"><td className="py-2">{p.provider_key}</td><td>{p.status}</td><td>{p.provider_status||"—"}</td><td>{p.provider_transaction_id||p.external_reference||"—"}</td><td>{money(p.amount)}</td><td>{date(p.captured_at||p.paid_at)}</td></tr>)}</tbody></table></div></DetailSection>

    <DetailSection title="Order items & sellers"><div className="overflow-x-auto"><table className="w-full text-xs"><thead className="text-left text-slate-500"><tr><th className="py-2">Item</th><th>Seller</th><th>Listing</th><th>Qty</th><th>Total</th></tr></thead><tbody>{(selected.items??[]).map((i:any)=><tr key={i.id} className="border-t border-white/5"><td className="py-2">{i.title_snapshot||"—"}</td><td>{i.seller_display_name||i.seller_username||i.seller_owner_user_id||"—"}</td><td>{i.listing_id||"—"}</td><td>{i.quantity}</td><td>{money(i.total_amount)}</td></tr>)}</tbody></table></div></DetailSection>

    <div className="grid gap-4 lg:grid-cols-2"><DetailSection title="Commerce event timeline"><div className="space-y-3">{(selected.events??[]).length===0?<p className="text-sm text-slate-500">No commerce events.</p>:(selected.events??[]).map((e:any)=><div key={e.id} className="border-l border-cyan-300/30 pl-3"><p className="text-sm">{e.event_type} · {e.outcome||"—"}</p><p className="text-xs text-slate-500">{date(e.created_at)}</p></div>)}</div></DetailSection><DetailSection title="Audit evidence"><div className="space-y-3">{(selected.audit??[]).length===0?<p className="text-sm text-slate-500">No audit records linked to this order.</p>:(selected.audit??[]).map((a:any)=><div key={a.id} className="rounded-lg border border-white/5 p-3"><p className="text-sm">{a.action} · {a.outcome}</p><p className="mt-1 text-xs text-slate-500">{a.resource_type} · {date(a.created_at)}</p></div>)}</div></DetailSection></div>

    {selected.invoice&&<DetailSection title="Invoice"><div className="grid gap-2 text-sm text-slate-300 sm:grid-cols-2"><p>Number: {selected.invoice.invoice_number}</p><p>Status: {selected.invoice.status}</p><p>Amount: {money(selected.invoice.amount)}</p><p>Due: {date(selected.invoice.due_at)}</p><p>Paid: {date(selected.invoice.paid_at)}</p><p>Period: {date(selected.invoice.period_start)} → {date(selected.invoice.period_end)}</p></div></DetailSection>}
   </div>
  </div>}
 </div></main>;
}
