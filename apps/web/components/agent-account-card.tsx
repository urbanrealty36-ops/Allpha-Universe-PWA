"use client";
import Link from "next/link";

export type AgentAccount = {
  agent_id:string; name:string; handle:string|null; description:string|null; avatar_path:string|null;
  status:string; runtime_state:string; is_owned_by_viewer:boolean;
  skills:Array<{id:string;name:string;description:string|null;category:string;skill_level:number;quality_score:number;usage_count:number;successful_usage_count:number;challenge_status:string}>;
  quality_score:number; verified_usage_count:number; successful_usage_count:number; reward_credits_earned:number; challenge_level:number;
};

export default function AgentAccountCard({agent,compact=false}:{agent:AgentAccount;compact?:boolean}){
 return <article className={"rounded-2xl border border-slate-200 bg-white p-4 shadow-sm "+(compact?"":"sm:p-5")}>
  <div className="flex items-start gap-3">
   <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-sm font-semibold text-white">{agent.name.slice(0,1).toUpperCase()}</div>
   <div className="min-w-0 flex-1">
    <div className="flex flex-wrap items-center gap-2"><h3 className="truncate font-semibold text-slate-950">{agent.name}</h3>{agent.runtime_state&&<span className="rounded-full border border-slate-200 px-2 py-0.5 text-[10px] text-slate-500">{agent.runtime_state}</span>}</div>
    {agent.handle&&<p className="text-xs text-slate-500">@{agent.handle}</p>}
   </div>
  </div>
  {agent.description&&<p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">{agent.description}</p>}
  <div className="mt-4 flex flex-wrap gap-2">
   {agent.skills.slice(0,5).map(s=><span key={s.id} className="rounded-full border border-cyan-200 bg-cyan-50 px-2.5 py-1 text-[10px] text-cyan-800">{s.name} · L{s.skill_level}</span>)}
   {agent.skills.length>5&&<span className="rounded-full border border-slate-200 px-2.5 py-1 text-[10px] text-slate-500">+{agent.skills.length-5} skills</span>}
  </div>
  <div className="mt-4 grid grid-cols-3 gap-2 text-center">
   <Metric value={Number(agent.quality_score||0).toFixed(1)} label="Quality"/>
   <Metric value={String(agent.verified_usage_count||0)} label="Verified"/>
   <Metric value={"L"+String(agent.challenge_level||1)} label="Challenge"/>
  </div>
  <div className="mt-4 flex gap-2">
   <Link href={"/agents/account/"+agent.agent_id} className="rounded-xl bg-slate-950 px-3 py-2 text-xs font-medium text-white">Open Agent Account</Link>
   <Link href={"/messages?target_type=agent&target_id="+agent.agent_id} className="rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-700">Ask / Message</Link>
  </div>
 </article>
}
function Metric({value,label}:{value:string;label:string}){return <div className="rounded-xl border border-slate-100 bg-slate-50 p-2"><p className="text-sm font-semibold text-slate-950">{value}</p><p className="mt-0.5 text-[9px] uppercase tracking-wider text-slate-500">{label}</p></div>}
