"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "../lib/supabase/client";

const steps=[
 {key:"identity",eyebrow:"01 · IDENTITY ORBIT",title:"Who are you in this Universe?",hint:"Start with the human behind the Agent.",fields:[["name","Your name","What should Allpha call you?","text"],["role","What do you do?","Profession, business or role","text"]]},
 {key:"world",eyebrow:"02 · WORLD ORBIT",title:"What worlds pull you in?",hint:"Choose the subjects you naturally return to.",fields:[["interests","Your interests","Technology, business, design, mining, travel…","text"],["passion","What are you passionate about?","What could you talk about for hours?","text"]]},
 {key:"goals",eyebrow:"03 · GOAL GALAXY",title:"Where are you going?",hint:"Your goals become context for future Agent assistance.",fields:[["goal","Your main goal","What are you trying to achieve?","text"],["future","In the next 12 months…","What would make the year meaningful?","text"]]},
 {key:"style",eyebrow:"04 · COMMUNICATION ORBIT",title:"How should your Agent understand you?",hint:"Shape the relationship, not the authority.",fields:[["style","Communication style","Direct, detailed, concise, strategic…","text"],["language","Preferred language","Bahasa Indonesia, English, bilingual…","text"]]},
 {key:"agent",eyebrow:"05 · AGENT CORE",title:"What should your Agent become?",hint:"This is the first seed of your AI Agent context.",fields:[["agentName","Agent name","Give your companion a name","text"],["agentRole","Agent role","What should your Agent help you with?","text"]]},
 {key:"memory",eyebrow:"06 · MEMORY CAPSULE",title:"What should Allpha remember first?",hint:"Write the context you want available to your future Agent experience.",fields:[["knowledge","About me / important context","Anything Allpha should know about you","textarea"],["avoid","Anything to avoid?","Topics, tone or behaviors you do not want","textarea"]]}
] as const;

export default function UniverseOnboarding(){
 const router=useRouter(),supabase=useMemo(()=>createSupabaseBrowserClient(),[]);
 const [step,setStep]=useState(0),[saving,setSaving]=useState(false),[error,setError]=useState<string|null>(null);
 const [answers,setAnswers]=useState<Record<string,string>>({});
 const current=steps[step];
 const progress=((step+1)/steps.length)*100;
 function set(key:string,value:string){setAnswers(a=>({...a,[key]:value}));}
 async function finish(){
  setSaving(true);setError(null);
  try{
   const {error:e}=await supabase.auth.updateUser({data:{allpha_onboarding:{completed_at:new Date().toISOString(),identity:{name:answers.name||null,role:answers.role||null},interests:{interests:answers.interests||null,passion:answers.passion||null},goals:{goal:answers.goal||null,future:answers.future||null},communication:{style:answers.style||null,language:answers.language||null},agent:{name:answers.agentName||null,role:answers.agentRole||null},memory:{knowledge:answers.knowledge||null,avoid:answers.avoid||null}}}});
   if(e)throw e;
   router.replace("/agents/create?from=onboarding");router.refresh();
  }catch(e){setError(e instanceof Error?e.message:"ONBOARDING_SAVE_FAILED");}finally{setSaving(false);}
 }
 return <main className="allpha-onboarding-scene"><div className="allpha-onboarding-stars"/><div className="allpha-onboarding-nebula n1"/><div className="allpha-onboarding-nebula n2"/>
  <header className="allpha-onboarding-top"><a href="/" className="allpha-auth-brand">ALLPHA<span>.</span></a><div><span>HUMAN → AGENT</span><strong>ONBOARDING ORBIT</strong></div><button type="button" onClick={()=>router.push("/")}>Skip for now</button></header>
  <div className="allpha-onboarding-progress"><span style={{width:progress+"%"}}/></div>
  <section className="allpha-onboarding-stage">
   <div className="allpha-onboarding-orbit o1"/><div className="allpha-onboarding-orbit o2"/><div className="allpha-onboarding-orbit o3"/>
   <div className="allpha-onboarding-core"><div className="core-glow"/><span>{String(step+1).padStart(2,"0")}</span><small>ORBIT</small></div>
   {steps.map((s,i)=><button key={s.key} type="button" onClick={()=>i<=step&&setStep(i)} className={"allpha-onboarding-planet p"+i+(i===step?" active":"")} aria-label={s.title}><span>{String(i+1).padStart(2,"0")}</span></button>)}
   <div className="allpha-onboarding-card">
    <p className="allpha-auth-kicker">{current.eyebrow}</p><h1>{current.title}</h1><p className="hint">{current.hint}</p>
    <div className="allpha-onboarding-fields">{current.fields.map(([key,label,placeholder,type])=><label key={key}><span>{label}</span>{type==="textarea"?<textarea value={answers[key]||""} onChange={e=>set(key,e.target.value)} placeholder={placeholder} rows={3}/>:<input value={answers[key]||""} onChange={e=>set(key,e.target.value)} placeholder={placeholder}/>}</label>)}</div>
    {error&&<div className="allpha-auth-message error">{error}</div>}
    <div className="allpha-onboarding-actions"><button type="button" className="secondary" disabled={step===0} onClick={()=>setStep(step-1)}>Previous Orbit</button>{step<steps.length-1?<button type="button" className="allpha-auth-primary" onClick={()=>setStep(step+1)}>Enter Next Orbit →</button>:<button type="button" className="allpha-auth-primary" disabled={saving} onClick={()=>void finish()}>{saving?"Creating Memory Capsule…":"Complete & Enter Universe"}</button>}</div>
    <div className="allpha-onboarding-caption"><span>{step+1} / {steps.length}</span><i/> <span>Each orbit becomes context for your Agent</span></div>
   </div>
  </section>
 </main>;
}