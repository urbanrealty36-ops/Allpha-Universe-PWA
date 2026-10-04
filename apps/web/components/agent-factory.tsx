"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../lib/api";
import { createSupabaseBrowserClient } from "../lib/supabase/client";

type Skill={skill_key:string;name:string;description?:string|null;category:string;risk_level:string};
type AgentType={type_key:string;name:string;description?:string|null;category:string;default_skill_keys:string[];recommended_capability_keys:string[];default_autonomy_level:string;risk_profile:string};
type Character={character_key:string;name:string;archetype:string;description?:string|null;interaction_style:string;persona_defaults:Record<string,unknown>;tone_defaults:Record<string,unknown>;visual_profile:Record<string,unknown>};
type Resource={id:string;name?:string|null;title?:string|null;slug?:string|null};

const modes=[["social","Social & Berkenalan"],["networking","Networking"],["communication","Communication"],["commerce","Commerce / Jual Beli"],["education","Education / Tutor"],["news","News / Information"],["live","Live Streaming"],["event","Event / Organizer"],["presentation","Presentation / MC"],["collaboration","Collaboration / Partnership"],["personal","Personal"],["private","Private"],["creator","Creator / Content"]] as const;
const contexts=[["universe","Allpha Universe"],["world","World"],["district","District"],["zone","Zone"],["booth","Booth / Tenant"],["live","Live"],["feed","Feed"],["content","Content"],["personal","Personal Space"],["private","Private Space"]] as const;
const steps=["Identity","Agent Type","Skills","Character","Universe Context","Authority & Policy","Preview"];

const cls=(active:boolean)=>active?"border-cyan-400/50 bg-cyan-400/10":"border-white/10 bg-white/[0.025]";
const input="w-full rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-400/50";
const card="rounded-2xl border border-white/10 bg-white/[0.035] p-5";

export default function AgentFactory(){
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [onboardingContext,setOnboardingContext] = useState<any>(null);
  const [step,setStep]=useState(0),[types,setTypes]=useState<AgentType[]>([]),[skills,setSkills]=useState<Skill[]>([]),[characters,setCharacters]=useState<Character[]>([]);
  const [resources,setResources]=useState<Resource[]>([]),[districts,setDistricts]=useState<Resource[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState<string|null>(null),[creating,setCreating]=useState(false),[created,setCreated]=useState<any>(null),[skillQuery,setSkillQuery]=useState("");
  const [form,setForm]=useState({name:"",handle:"",description:"",type:"",character:"",skills:[] as string[],mode:"social",scope:"universe",resourceId:"",districtId:"",autonomy:"recommend",maxSpend:"",dailySpend:"",monthlySpend:"",approvalAbove:"",visibility:"public"});

  useEffect(()=>{void loadCatalog(); void loadOnboardingContext()},[]);
  async function loadOnboardingContext(){
    try{
      const params = new URLSearchParams(window.location.search);
      if(params.get("from") !== "onboarding") return;
      const { data } = await supabase.auth.getUser();
      const ctx = data.user?.user_metadata?.allpha_onboarding ?? null;
      setOnboardingContext(ctx);
      if(ctx){
        setForm(f=>({
          ...f,
          name: f.name || ctx.agent?.name || "",
          description: f.description || ctx.agent?.role || "",
        }));
      }
    }catch{}
  }
  async function loadCatalog(){try{const r=await apiFetch<{data:{types:AgentType[];skills:Skill[];characters:Character[]}}>("/api/v1/agent-catalog");setTypes(r.data.types);setSkills(r.data.skills);setCharacters(r.data.characters)}catch(e){setError(e instanceof Error?e.message:"AGENT_FACTORY_LOAD_FAILED")}finally{setLoading(false)}}

  useEffect(()=>{
    if(["universe","feed","personal","private"].includes(form.scope)){setResources([]);return}
    if(form.scope==="zone"){void loadResources("district");return}
    void loadResources(form.scope);
  },[form.scope,form.districtId]);

  useEffect(()=>{if(form.scope==="zone"&&form.districtId)void loadZoneResources(form.districtId)},[form.scope,form.districtId]);

  async function loadResources(scope:string){
    const urls:Record<string,string>={world:"/api/v1/universe/worlds?limit=100",district:"/api/v1/districts?limit=100",booth:"/api/v1/booths?limit=100",live:"/api/v1/live/sessions?limit=100",content:"/api/v1/content?status=published&limit=100"};
    if(!urls[scope])return;
    try{const r=await apiFetch<{data:Resource[]}>(urls[scope]);setResources(r.data||[]);if(scope==="district")setDistricts(r.data||[])}catch(e){setError(e instanceof Error?e.message:"CONTEXT_LOAD_FAILED")}
  }
  async function loadZoneResources(id:string){try{const r=await apiFetch<{data:Resource[]}>("/api/v1/districts/"+id+"/zones");setResources(r.data||[])}catch(e){setError(e instanceof Error?e.message:"ZONE_LOAD_FAILED")}}

  const selectedType=types.find(x=>x.type_key===form.type),selectedCharacter=characters.find(x=>x.character_key===form.character);
  const filteredSkills=useMemo(()=>skills.filter(s=>!skillQuery.trim()||[s.name,s.category,s.description||""].join(" ").toLowerCase().includes(skillQuery.toLowerCase())),[skills,skillQuery]);

  function chooseType(key:string){const t=types.find(x=>x.type_key===key);setForm(f=>({...f,type:key,skills:Array.from(new Set([...f.skills,...(t?.default_skill_keys||[])]))}))}
  function toggleSkill(key:string){setForm(f=>({...f,skills:f.skills.includes(key)?f.skills.filter(x=>x!==key):[...f.skills,key]}))}
  async function create(){
    setCreating(true);setError(null);
    try{
      const r=await apiFetch<{data:any}>("/api/v1/agents",{method:"POST",body:JSON.stringify({
        name:form.name.trim(),handle:form.handle.trim()||null,description:form.description.trim()||null,visibility:form.visibility,
        agent_type_key:form.type||null,character_key:form.character||null,skill_keys:form.skills,experience_mode:form.mode,
        universe_context:{scope:form.scope,resource_id:form.resourceId||null},autonomy_level:form.autonomy,
        max_spend_per_action:form.maxSpend?Number(form.maxSpend):null,daily_spend_limit:form.dailySpend?Number(form.dailySpend):null,
        monthly_spend_limit:form.monthlySpend?Number(form.monthlySpend):null,requires_approval_above:form.approvalAbove?Number(form.approvalAbove):null
      })});
      setCreated(r.data);
      const agentId = r.data?.agent?.id;
      if(agentId && onboardingContext){
        const identity = onboardingContext.identity ?? {};
        const interests = onboardingContext.interests ?? {};
        const goals = onboardingContext.goals ?? {};
        const communication = onboardingContext.communication ?? {};
        const agent = onboardingContext.agent ?? {};
        const memory = onboardingContext.memory ?? {};
        const contextText = [
          identity.name ? "Human name: " + identity.name : "",
          identity.role ? "Role: " + identity.role : "",
          interests.interests ? "Interests: " + interests.interests : "",
          interests.passion ? "Passion: " + interests.passion : "",
          goals.goal ? "Main goal: " + goals.goal : "",
          goals.future ? "12-month direction: " + goals.future : "",
          communication.style ? "Communication preference: " + communication.style : "",
          communication.language ? "Preferred language: " + communication.language : "",
          agent.role ? "Requested Agent role: " + agent.role : "",
          memory.knowledge ? "Important human context: " + memory.knowledge : "",
          memory.avoid ? "Avoid / boundaries: " + memory.avoid : "",
        ].filter(Boolean).join("\n");
        if(contextText){
          await apiFetch(`/api/v1/agents/${agentId}/memory`,{method:"POST",body:JSON.stringify({
            memory_type:"onboarding_context", content:contextText, sensitivity:"private",
            metadata:{created_from:"universe-onboarding",completed_at:onboardingContext.completed_at||null},
            source_type:"user_explicit"
          })});
          await apiFetch(`/api/v1/agents/${agentId}/knowledge`,{method:"POST",body:JSON.stringify({
            title:"Human Onboarding Context", content:contextText,
            provenance:{created_from:"universe-onboarding",completed_at:onboardingContext.completed_at||null},
            visibility:"private"
          })});
        }
        await supabase.auth.updateUser({data:{allpha_onboarding:{...onboardingContext,agent_activated_at:new Date().toISOString()}}});
      }
      setStep(7);
    }catch(e){setError(e instanceof Error?e.message:"AGENT_CREATE_FAILED")}finally{setCreating(false)}
  }

  if(loading)return <main className="min-h-screen bg-slate-950 p-6 text-slate-300">Memuat Agent Factory…</main>;

  return <main className="min-h-screen bg-slate-950 text-white"><div className="mx-auto max-w-6xl px-4 py-6 sm:px-8 sm:py-10">
    <header className="mb-8"><p className="text-[11px] uppercase tracking-[0.28em] text-cyan-300">Allpha Agent Factory</p><h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-5xl">Create an AI Agent for the Universe</h1><p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">Bangun Agent untuk social discovery, networking, commerce, education, Live, event, collaboration, personal space, World, District, Booth/Tenant dan pengalaman Allpha lainnya.</p></header>
    <div className="mb-8 grid grid-cols-2 gap-2 sm:grid-cols-7">{steps.map((s,i)=><button key={s} onClick={()=>i<=step&&setStep(i)} className={"rounded-xl px-2 py-2 text-xs "+(i===step?"bg-cyan-400/15 text-cyan-200 ring-1 ring-cyan-400/30":"bg-white/[0.03] text-slate-500")}>{i+1}. {s}</button>)}</div>
    {error&&<div className="mb-5 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">{error}</div>}

    {step===0&&<section className={card}><h2 className="text-xl font-semibold">Identity</h2><p className="mt-2 text-sm text-slate-400">Siapa Agent ini di Allpha?</p><div className="mt-5 grid gap-4 sm:grid-cols-2">
      <input className={input} placeholder="Agent name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/><input className={input} placeholder="Handle (opsional)" value={form.handle} onChange={e=>setForm({...form,handle:e.target.value})}/>
      <textarea className={input+" sm:col-span-2 min-h-28"} placeholder="Deskripsi Agent" value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/>
    </div></section>}

    {step===1&&<section className={card}><h2 className="text-xl font-semibold">Agent Type</h2><p className="mt-2 text-sm text-slate-400">Tentukan peran utama Agent. Type menentukan fungsi, bukan authority.</p><div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{types.map(t=><button key={t.type_key} onClick={()=>chooseType(t.type_key)} className={"rounded-2xl border p-4 text-left "+cls(form.type===t.type_key)}><div className="font-medium">{t.name}</div><div className="mt-1 text-xs text-cyan-300">{t.category}</div><p className="mt-2 text-xs leading-5 text-slate-400">{t.description}</p></button>)}</div></section>}

    {step===2&&<section className={card}><div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><h2 className="text-xl font-semibold">Skills</h2><p className="mt-2 text-sm text-slate-400">{form.skills.length} skill dipilih. Default dari Type sudah ditambahkan dan dapat diubah.</p></div><input className={input+" sm:max-w-sm"} placeholder="Cari skill…" value={skillQuery} onChange={e=>setSkillQuery(e.target.value)}/></div><div className="mt-5 grid max-h-[55vh] gap-3 overflow-auto pr-1 sm:grid-cols-2 lg:grid-cols-3">{filteredSkills.map(s=><button key={s.skill_key} onClick={()=>toggleSkill(s.skill_key)} className={"rounded-2xl border p-4 text-left "+cls(form.skills.includes(s.skill_key))}><div className="flex items-center justify-between gap-2"><span className="font-medium">{s.name}</span><span className="text-[10px] uppercase text-slate-500">{s.risk_level}</span></div><div className="mt-1 text-xs text-cyan-300">{s.category}</div><p className="mt-2 text-xs leading-5 text-slate-400">{s.description}</p></button>)}</div></section>}

    {step===3&&<section className="grid gap-5 lg:grid-cols-[1fr_0.8fr]"><div className={card}><h2 className="text-xl font-semibold">AI Character</h2><p className="mt-2 text-sm text-slate-400">Character menentukan cara Agent hadir, berbicara dan tampil—bukan permission.</p><div className="mt-5 grid gap-3 sm:grid-cols-2">{characters.map(c=><button key={c.character_key} onClick={()=>setForm({...form,character:c.character_key})} className={"rounded-2xl border p-4 text-left "+cls(form.character===c.character_key)}><div className="font-medium">{c.name}</div><div className="mt-1 text-xs text-cyan-300">{c.archetype}</div><p className="mt-2 text-xs leading-5 text-slate-400">{c.description}</p></button>)}</div></div><div className={card}><p className="text-xs uppercase tracking-widest text-cyan-300">Character Preview</p><div className="mt-5 rounded-2xl bg-white/[0.04] p-5"><div className="text-2xl">{selectedCharacter?.name||"Choose a Character"}</div><div className="mt-1 text-sm text-slate-400">{selectedCharacter?.interaction_style||"Preview appears here."}</div><pre className="mt-4 overflow-auto text-[11px] leading-5 text-slate-400">{JSON.stringify(selectedCharacter?.visual_profile||{},null,2)}</pre></div></div></section>}

    {step===4&&<section className={card}><h2 className="text-xl font-semibold">Universe Context</h2><p className="mt-2 text-sm text-slate-400">Context menentukan experience. Authority tetap berada di Policy dan Agent Runtime.</p><div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">{contexts.map(([key,label])=><button key={key} onClick={()=>setForm({...form,scope:key,resourceId:"",districtId:""})} className={"rounded-xl border p-3 text-left text-sm "+cls(form.scope===key)}>{label}</button>)}</div>
      {form.scope==="zone"&&<select className={input+" mt-5"} value={form.districtId} onChange={e=>setForm({...form,districtId:e.target.value,resourceId:""})}><option value="">Pilih District untuk melihat Zone</option>{districts.map(d=><option key={d.id} value={d.id}>{d.name||d.slug||d.id}</option>)}</select>}
      {resources.length>0&&!["universe","feed","personal","private"].includes(form.scope)&&<select className={input+" mt-3"} value={form.resourceId} onChange={e=>setForm({...form,resourceId:e.target.value})}><option value="">Pilih {form.scope}</option>{resources.map(r=><option key={r.id} value={r.id}>{r.name||r.title||r.slug||r.id}</option>)}</select>}
      {resources.length===0&&["world","district","zone","booth","live","content"].includes(form.scope)&&<p className="mt-4 text-sm text-slate-500">Belum ada data {form.scope} yang tersedia untuk akun ini. Tidak ada data sintetis yang ditampilkan.</p>}
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{modes.map(([key,label])=><button key={key} onClick={()=>setForm({...form,mode:key})} className={"rounded-xl border p-3 text-left text-sm "+(form.mode===key?"border-violet-400/50 bg-violet-400/10":"border-white/10 bg-white/[0.025]")}>{label}</button>)}</div>
    </section>}

    {step===5&&<section className={card}><h2 className="text-xl font-semibold">Authority & Policy</h2><p className="mt-2 text-sm text-slate-400">Skill/Character tidak memberikan permission. Authority tetap di policy dan runtime.</p><div className="mt-5 grid gap-4 sm:grid-cols-2">
      <label className="text-sm text-slate-300">Autonomy<select className={input+" mt-2"} value={form.autonomy} onChange={e=>setForm({...form,autonomy:e.target.value})}><option value="recommend">Recommend</option><option value="assist">Assist</option><option value="conditional">Conditional</option><option value="autonomous">Autonomous</option></select></label>
      <label className="text-sm text-slate-300">Visibility<select className={input+" mt-2"} value={form.visibility} onChange={e=>setForm({...form,visibility:e.target.value})}><option value="public">Public</option><option value="connections">Connections</option><option value="community">Community</option><option value="private">Private</option></select></label>
      <label className="text-sm text-slate-300">Max spend / action<input className={input+" mt-2"} type="number" min="0" value={form.maxSpend} onChange={e=>setForm({...form,maxSpend:e.target.value})}/></label>
      <label className="text-sm text-slate-300">Approval above<input className={input+" mt-2"} type="number" min="0" value={form.approvalAbove} onChange={e=>setForm({...form,approvalAbove:e.target.value})}/></label>
      <label className="text-sm text-slate-300">Daily limit<input className={input+" mt-2"} type="number" min="0" value={form.dailySpend} onChange={e=>setForm({...form,dailySpend:e.target.value})}/></label>
      <label className="text-sm text-slate-300">Monthly limit<input className={input+" mt-2"} type="number" min="0" value={form.monthlySpend} onChange={e=>setForm({...form,monthlySpend:e.target.value})}/></label>
    </div></section>}

    {step===6&&<section className={card}><h2 className="text-xl font-semibold">Preview & Create</h2><p className="mt-2 text-sm text-slate-400">Review konfigurasi sebelum Agent dibuat di database.</p><div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{[["Identity",form.name||"—"],["Type",selectedType?.name||"—"],["Character",selectedCharacter?.name||"—"],["Mode",modes.find(x=>x[0]===form.mode)?.[1]||"—"],["Context",contexts.find(x=>x[0]===form.scope)?.[1]||"—"],["Skills",String(form.skills.length)],["Autonomy",form.autonomy],["Visibility",form.visibility]].map(([a,b])=><div key={a} className="rounded-xl bg-white/[0.04] p-4"><div className="text-xs uppercase tracking-widest text-slate-500">{a}</div><div className="mt-2 text-sm">{b}</div></div>)}</div><div className="mt-5 rounded-xl border border-amber-400/20 bg-amber-400/5 p-4 text-sm text-amber-100">Agent dibuat hanya setelah Anda menekan Create Agent. Factory tidak membuat data sintetis.</div></section>}

    {step===7&&created&&<section className={card}><p className="text-xs uppercase tracking-widest text-emerald-300">Created</p><h2 className="mt-3 text-3xl font-semibold">{created.agent?.name||form.name}</h2><p className="mt-2 text-sm text-slate-400">Agent berhasil dibuat sebagai Agent milik akun Anda.</p><pre className="mt-5 overflow-auto rounded-xl bg-black/30 p-4 text-xs text-slate-400">{JSON.stringify(created,null,2)}</pre><a className="mt-5 inline-block rounded-xl bg-cyan-300 px-5 py-3 text-sm font-semibold text-slate-950" href="/agents">Kembali ke My Agents</a></section>}

    {step<7&&<div className="mt-6 flex justify-between gap-3"><button disabled={step===0} onClick={()=>setStep(step-1)} className="rounded-xl border border-white/10 px-5 py-3 text-sm disabled:opacity-30">Back</button>{step<6?<button disabled={(step===0&&!form.name.trim())||(step===1&&!form.type)||(step===3&&!form.character)||(step===4&&["world","district","zone","booth","live"].includes(form.scope)&&!form.resourceId)} onClick={()=>setStep(step+1)} className="rounded-xl bg-cyan-300 px-5 py-3 text-sm font-semibold text-slate-950 disabled:opacity-30">Next</button>:<button disabled={creating||!form.name.trim()} onClick={()=>void create()} className="rounded-xl bg-cyan-300 px-5 py-3 text-sm font-semibold text-slate-950 disabled:opacity-30">{creating?"Creating…":"Create Agent"}</button>}</div>}
  </div></main>;
}
