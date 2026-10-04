"use client";

import {useEffect,useState} from "react";
import {apiFetch} from "../../lib/api";

const groups=[
 ["Identity & Agents",["users","agents"]],
 ["Content & Safety",["content","moderation"]],
 ["Universe",["galaxies","worlds","districts","zones","booths"]],
 ["Marketplace",["marketplace_listings","marketplace_offers"]],
 ["Billing & Economy",["billing_plans","credit_products","subscriptions","invoices","payouts"]],
 ["Governance",["approvals","risk","feature_flags","config_versions"]],
 ["Themes",["themes","theme_versions"]]
];
const label=(x:string)=>x.replaceAll("_"," ").replace(/\b\w/g,m=>m.toUpperCase());

type Action={operation:string;label:string};
function decisionsFor(operation:string):string[]{
 if(operation==="moderation_decision"||operation==="payout_decision")return ["approved","rejected"];
 if(operation==="payout_process")return ["processing","paid","failed"];
 if(operation==="moderate_theme")return ["approved","restricted","removed","appealed"];
 return [];
}

function actionsFor(resource:string,row:any):Action[]{
 if(resource==="moderation"&&row.id)return [{operation:"moderation_decision",label:"Moderate"}];
 if(resource==="payouts"&&row.id){
   if(row.status==="approved"||row.status==="processing")return [{operation:"payout_process",label:"Process payout"}];
   return [{operation:"payout_decision",label:"Decide payout"}];
 }
 if(resource==="marketplace_listings"&&row.id)return [{operation:"publish_listing",label:"Publish listing"}];
 if(resource==="themes"&&row.id)return [
   {operation:"publish_theme",label:"Publish"},
   {operation:"moderate_theme",label:"Moderate"}
 ];
 return [];
}

export default function OperationsPage(){
 const [resource,setResource]=useState("users"),[data,setData]=useState<any>(null),[q,setQ]=useState(""),[status,setStatus]=useState("");
 const [error,setError]=useState<string|null>(null),[busy,setBusy]=useState(false),[offset,setOffset]=useState(0);
 const [selected,setSelected]=useState<any>(null),[operation,setOperation]=useState(""),[decision,setDecision]=useState("");
 const [reason,setReason]=useState(""),[disbursementReference,setDisbursementReference]=useState("");
 const limit=25;

 async function load(next=offset){
   setBusy(true);setError(null);
   try{const p=new URLSearchParams({limit:String(limit),offset:String(next)});if(q)p.set("q",q);if(status)p.set("status",status);const r=await apiFetch<{data:any}>("/api/v1/admin/control-plane/domains/"+resource+"?"+p.toString());setData(r.data);setOffset(next)}
   catch(e){setError(e instanceof Error?e.message:"DOMAIN_LOAD_FAILED")}
   finally{setBusy(false)}
 }
 useEffect(()=>{void load(0)},[resource,status]);

 const rows=data?.items??[],total=Number(data?.total??0);
 function openOperation(row:any,action:Action){setSelected(row);setOperation(action.operation);setDecision("");setReason("");setDisbursementReference("")}
 async function runOperation(){
   if(!selected||!operation||!reason.trim()||(operation!=="publish_listing"&&operation!=="publish_theme"&&!decision))return;
   setBusy(true);setError(null);
   try{
     const payload:any={};
     if(operation==="moderation_decision"||operation==="payout_decision"||operation==="moderate_theme")payload.decision=decision;
     if(operation==="payout_process"){payload.outcome=decision;payload.disbursement_reference=disbursementReference.trim()||null}
     if(operation==="moderate_theme"&&selected.theme_version_id)payload.theme_version_id=selected.theme_version_id;
     const resourceName=resource==="moderation"?"content_moderation":resource==="payouts"?"payout":resource==="marketplace_listings"?"marketplace_listing":"theme";
     await apiFetch("/api/v1/admin/control-plane/domains/operate",{method:"POST",body:JSON.stringify({operation,resource:resourceName,id:selected.id,payload,reason:reason.trim()})});
     setSelected(null);setOperation("");setDecision("");setReason("");setDisbursementReference("");await load(0);
   }catch(e){setError(e instanceof Error?e.message:"DOMAIN_OPERATION_FAILED")}
   finally{setBusy(false)}
 }

 return <main className="min-h-screen p-6 sm:p-10"><div className="mx-auto max-w-[1700px]">
  <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs uppercase tracking-[0.24em] text-cyan-300">Allpha Control Plane · Phase 27C</p><h1 className="mt-3 text-4xl font-semibold">Domain Operations</h1><p className="mt-3 max-w-4xl text-slate-400">Operational explorer across authoritative platform domains. Read access requires admin.read; governed actions reuse canonical moderation, payout, marketplace and theme engines.</p></div><div className="flex gap-2"><a href="/transactions" className="rounded-xl border border-white/10 px-4 py-2 text-sm">Transactions</a><a href="/master-data" className="rounded-xl border border-white/10 px-4 py-2 text-sm">Master Data</a></div></div>

  <div className="mt-8 grid gap-6 lg:grid-cols-[260px_1fr]"><aside className="space-y-5">{groups.map(([g,rs])=><div key={g as string}><p className="mb-2 text-xs uppercase tracking-wider text-slate-600">{g as string}</p><div className="space-y-1">{(rs as string[]).map(r=><button key={r} onClick={()=>{setResource(r);setOffset(0)}} className={"w-full rounded-lg px-3 py-2 text-left text-sm "+(resource===r?"bg-cyan-300/10 text-cyan-200":"text-slate-400 hover:bg-white/5")}>{label(r)}</button>)}</div></div>)}</aside>

  <section><div className="grid gap-3 md:grid-cols-[1fr_200px_auto]"><input value={q} onChange={e=>setQ(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")void load(0)}} placeholder={"Search "+label(resource)+"…"} className="rounded-xl border border-white/10 bg-white/5 px-4 py-3"/><input value={status} onChange={e=>setStatus(e.target.value)} placeholder="Status / decision filter" className="rounded-xl border border-white/10 bg-white/5 px-4 py-3"/><button onClick={()=>void load(0)} className="rounded-xl bg-cyan-300 px-5 py-3 font-semibold text-slate-950">Search</button></div>
   {error&&<div className="mt-4 rounded-xl border border-red-400/20 bg-red-400/10 p-4 text-sm">{error}</div>}
   <div className="mt-5 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]"><div className="overflow-x-auto"><table className="w-full text-sm"><thead className="border-b border-white/10 text-left text-xs text-slate-500"><tr><th className="px-5 py-4">ID</th><th>Name / Key</th><th>Status</th><th>Owner / Context</th><th>Created</th><th>Actions</th></tr></thead><tbody>
   {rows.length===0?<tr><td colSpan={6} className="px-5 py-12 text-center text-slate-500">{busy?"Loading…":"No authoritative records."}</td></tr>:rows.map((x:any)=><tr key={x.id} className="border-t border-white/5"><td className="px-5 py-4 font-mono text-[11px]">{x.id}</td><td>{x.name||x.display_name||x.title||x.key||x.plan_key||x.product_key||x.invoice_number||x.namespace||"—"}<div className="text-xs text-slate-600">{x.slug||x.handle||x.catalog_key||x.resource_type||""}</div></td><td>{x.status??x.decision??(x.enabled?"enabled":"disabled")}</td><td className="text-xs text-slate-500">{x.owner_user_id||x.user_id||x.requester_user_id||x.buyer_user_id||x.seller_owner_user_id||x.galaxy_id||x.world_id||x.district_id||"—"}</td><td className="text-xs text-slate-500">{x.created_at?new Date(x.created_at).toLocaleString("id-ID"):"—"}</td><td><div className="flex flex-wrap gap-2">{actionsFor(resource,x).map(action=><button key={action.operation} onClick={()=>openOperation(x,action)} className="rounded-lg border border-cyan-300/30 px-3 py-2 text-xs">{action.label}</button>)}</div></td></tr>)}</tbody></table></div>
   <div className="flex items-center justify-between border-t border-white/10 p-4 text-sm text-slate-400"><span>{total} records</span><div className="flex gap-2"><button disabled={offset===0||busy} onClick={()=>void load(Math.max(0,offset-limit))} className="rounded-lg border border-white/10 px-3 py-2 disabled:opacity-30">Previous</button><button disabled={offset+limit>=total||busy} onClick={()=>void load(offset+limit)} className="rounded-lg border border-white/10 px-3 py-2 disabled:opacity-30">Next</button></div></div></div>
  </section></div>

  {selected&&<div className="fixed inset-0 z-50 bg-black/70 p-4 sm:p-10" onClick={()=>setSelected(null)}><div className="mx-auto max-w-xl rounded-2xl border border-white/10 bg-slate-950 p-6" onClick={e=>e.stopPropagation()}>
   <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">Governed Domain Action</p><h2 className="mt-2 text-xl font-semibold">{operation}</h2><p className="mt-2 text-sm text-slate-500">{selected.id}</p>
   {decisionsFor(operation).length>0&&<select value={decision} onChange={e=>setDecision(e.target.value)} className="mt-5 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3"><option value="">Select decision / outcome</option>{decisionsFor(operation).map(value=><option key={value} value={value}>{value.replaceAll("_"," ")}</option>)}</select>}
   {operation==="payout_process"&&<input value={disbursementReference} onChange={e=>setDisbursementReference(e.target.value)} placeholder="Disbursement reference (optional)" className="mt-3 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3"/>}
   <textarea value={reason} onChange={e=>setReason(e.target.value)} placeholder="Operator reason (required)" rows={4} className="mt-3 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3"/>
   <div className="mt-4 flex justify-end gap-2"><button onClick={()=>setSelected(null)} className="rounded-lg border border-white/10 px-4 py-2">Cancel</button><button disabled={busy||!reason.trim()||(operation!=="publish_listing"&&operation!=="publish_theme"&&!decision)} onClick={()=>void runOperation()} className="rounded-lg bg-cyan-300 px-4 py-2 font-semibold text-slate-950">{busy?"Executing…":"Execute"}</button></div>
  </div></div>}
 </div></main>;
}
