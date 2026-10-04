"use client";
import {useEffect,useState} from "react";
import {apiFetch} from "../../lib/api";
export default function ApprovalsPage(){
 const [data,setData]=useState<any>(null),[error,setError]=useState<string|null>(null),[q,setQ]=useState("");
 useEffect(()=>{void apiFetch<{data:any}>("/api/v1/admin/agent-authority/overview?limit=200").then(r=>setData(r.data)).catch(e=>setError(e instanceof Error?e.message:"ADMIN_APPROVALS_LOAD_FAILED"))},[]);
 const rows=(data?.approval_requests??data?.approvals??[]).filter((x:any)=>!q||JSON.stringify(x).toLowerCase().includes(q.toLowerCase()));
 return <main className="min-h-screen p-6 sm:p-10"><div className="mx-auto max-w-[1600px]"><p className="text-xs uppercase tracking-[0.24em] text-cyan-300">Governance · Phase 27D</p><h1 className="mt-3 text-4xl font-semibold">Approval Queue</h1><p className="mt-3 max-w-4xl text-slate-400">Authoritative approval evidence from the existing Agent Authority control plane. Approval decisions continue through the canonical approval/runtime boundary.</p>
 <div className="mt-8 flex gap-3"><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Filter command, agent, action, status…" className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3"/></div>
 {error&&<div className="mt-4 rounded-xl border border-red-400/20 bg-red-400/10 p-4 text-sm">{error}</div>}
 <section className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]"><div className="overflow-x-auto"><table className="w-full text-sm"><thead className="border-b border-white/10 text-left text-xs text-slate-500"><tr><th className="px-5 py-4">ID</th><th>Agent / Command</th><th>Action</th><th>Status</th><th>Risk</th><th>Created</th></tr></thead><tbody>{rows.length===0?<tr><td colSpan={6} className="px-5 py-12 text-center text-slate-500">No authoritative approval requests returned.</td></tr>:rows.map((x:any,i:number)=><tr key={x.id??i} className="border-t border-white/5"><td className="px-5 py-4 font-mono text-xs">{x.id??"—"}</td><td>{x.agent_name??x.agent_id??x.command_id??"—"}</td><td>{x.action??x.command??x.request_type??"—"}</td><td>{x.status??x.decision??"—"}</td><td>{x.risk_level??x.risk_decision??"—"}</td><td className="text-xs text-slate-500">{x.created_at?new Date(x.created_at).toLocaleString("id-ID"):"—"}</td></tr>)}</tbody></table></div></section>
 </div></main>;
}