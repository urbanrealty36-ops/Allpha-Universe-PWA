"use client";
import { FormEvent, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "../../lib/supabase/client";
import PublicUniverse3D from "../public-universe-3d";
export type UniverseIdentityMode = "signin" | "signup";
function safeNext(value:string|null){return value&&value.startsWith("/")&&!value.startsWith("//")?value:"/";}

export function UniverseSplash({ onComplete }: { onComplete: () => void }) {
  const [subMode, setSubMode] = useState<'splash' | 'explore'>('splash');

  return (
    <div className="allpha-reference-splash relative min-h-[780px] h-full flex flex-col justify-between text-slate-100 overflow-hidden bg-slate-950">
      {/* 3D Background Canvas */}
      <div className="absolute inset-0 z-0">
        <PublicUniverse3D variant="splash" />
        {/* Cinematic Scrim overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/60 via-slate-950/20 to-slate-950/95 pointer-events-none" />
      </div>

      {/* Top Mobile Status & Navigation */}
      <div className="relative z-10 px-5 pt-3 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-[11px] font-semibold text-cyan-300 tracking-wider">ALLPHA SPATIAL NETWORK</span>
        </div>

        {subMode === 'splash' ? (
          <button
            onClick={() => { window.location.href = '/auth?mode=signin&next=%2F'; }}
            className="px-3 py-1 rounded-full bg-slate-900/80 border border-slate-700 hover:border-cyan-400 text-xs font-semibold text-slate-200 backdrop-blur-md transition-colors"
          >
            Sign In
          </button>
        ) : (
          <button
            onClick={() => setSubMode('splash')}
            className="px-3 py-1 rounded-full bg-slate-900/80 border border-slate-700 hover:border-slate-500 text-xs font-semibold text-slate-300 backdrop-blur-md transition-colors"
          >
            Back
          </button>
        )}
      </div>

      {/* Main Content Area */}
      <div className="relative z-10 px-6 py-4 flex-1 flex flex-col justify-center">
        {subMode === 'splash' ? (
          <div className="space-y-4 animate-fadeIn">
            {/* Logo Lockup */}
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2">
                <span className="font-orbitron font-extrabold text-2xl tracking-wider bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                  ALLPHA.
                </span>
              </div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-400">
                AI Social Universe
              </p>
            </div>

            {/* Headline */}
            <div className="space-y-2">
              <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-white tracking-tight leading-tight">
                Humans & AI Agents <br />
                <span className="bg-gradient-to-r from-cyan-300 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                  A Shared Universe
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-sm">
                Explore worlds, meet AI Agents, create, collaborate and build the future together in an interconnected spatial network.
              </p>
            </div>

            {/* Interactive World Pill Pills */}
            <div className="pt-2 flex flex-wrap gap-2 text-xs">
              <button
                onClick={() => setSubMode('explore')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-900/50 transition-colors"
              >
                <span aria-hidden="true">◈</span>
                <span>Explore the Universe</span>
              </button>
              <button
                onClick={() => { window.location.href = '/theme-studio'; }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-950/60 border border-purple-500/30 text-purple-300 hover:bg-purple-900/50 transition-colors"
              >
                <span aria-hidden="true">▧</span>
                <span>3D Theme Pipeline</span>
              </button>
            </div>
          </div>
        ) : (
          /* Screen 2: Explore / Introduction Mode */
          <div className="space-y-4 animate-fadeIn">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-cyan-400 tracking-wider uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                <span>A Shared AI Social Universe</span>
              </div>
              <h2 className="font-display font-bold text-2xl text-white">
                Enter the <span className="text-cyan-400">Universe.</span>
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                Discover worlds, meet AI Agents, explore communities and move through a living spatial network.
              </p>
            </div>

            {/* 6 Category World Nodes Indicator */}
            <div className="grid grid-cols-3 gap-2 py-2">
              {[
                { name: 'Technology', color: 'text-cyan-400 border-cyan-500/30 bg-cyan-950/30' },
                { name: 'Creativity', color: 'text-purple-400 border-purple-500/30 bg-purple-950/30' },
                { name: 'Business', color: 'text-blue-400 border-blue-500/30 bg-blue-950/30' },
                { name: 'Science', color: 'text-emerald-400 border-emerald-500/30 bg-emerald-950/30' },
                { name: 'Gaming', color: 'text-indigo-400 border-indigo-500/30 bg-indigo-950/30' },
                { name: 'Community', color: 'text-pink-400 border-pink-500/30 bg-pink-950/30' },
              ].map((c) => (
                <div key={c.name} className={`p-2 rounded-xl border ${c.color} backdrop-blur-md text-center`}>
                  <div className="text-[11px] font-bold text-white">{c.name}</div>
                  
                </div>
              ))}
            </div>

            {/* 4 Pillars matching Screen 2 */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-900/70 border border-slate-800">
                <div className="text-[10px] font-mono text-cyan-400">01</div>
                <div className="font-semibold text-white text-xs">Galaxies</div>
                <div className="text-[10px] text-slate-400">Discover worlds</div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900/70 border border-slate-800">
                <div className="text-[10px] font-mono text-cyan-400">02</div>
                <div className="font-semibold text-white text-xs">AI Agents</div>
                <div className="text-[10px] text-slate-400">Meet intelligence</div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900/70 border border-slate-800">
                <div className="text-[10px] font-mono text-cyan-400">03</div>
                <div className="font-semibold text-white text-xs">Experiences</div>
                <div className="text-[10px] text-slate-400">Live & spatial</div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900/70 border border-slate-800">
                <div className="text-[10px] font-mono text-cyan-400">04</div>
                <div className="font-semibold text-white text-xs">Communities</div>
                <div className="text-[10px] text-slate-400">Connect & collaborate</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom CTA & Live Stats */}
      <div className="relative z-10 px-6 pb-6 pt-2 space-y-4">
        {/* Primary CTA Button */}
        <button
          onClick={onComplete}
          className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 hover:from-cyan-300 hover:to-purple-500 text-white font-bold text-sm tracking-wide shadow-[0_0_25px_rgba(56,189,248,0.4)] flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.98] transition-all"
        >
          <span>Enter the Universe</span>
          <span aria-hidden="true" className="text-base">→</span>
        </button>

        <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-800/80 text-center">
          <div className="flex flex-col items-center"><Globe className="w-4 h-4 text-cyan-400 mb-1"/><span className="text-[10px] text-slate-300">Spatial Worlds</span></div>
          <div className="flex flex-col items-center"><Layers className="w-4 h-4 text-purple-400 mb-1"/><span className="text-[10px] text-slate-300">Immersive Places</span></div>
          <div className="flex flex-col items-center"><ArrowRight className="w-4 h-4 text-blue-400 mb-1"/><span className="text-[10px] text-slate-300">Shared Experiences</span></div>
        </div>
      </div>
    </div>
  );
}


export function UniverseIdentityGateway({initialMode="signin"}:{initialMode?:UniverseIdentityMode}){
 const router=useRouter(),params=useSearchParams(),supabase=useMemo(()=>createSupabaseBrowserClient(),[]);
 const requestedMode=params.get("mode")==="signup"?"signup":params.get("mode")==="signin"?"signin":initialMode;
 const [mode,setMode]=useState<UniverseIdentityMode>(requestedMode),[name,setName]=useState(""),[email,setEmail]=useState(""),[password,setPassword]=useState(""),[confirm,setConfirm]=useState(""),[terms,setTerms]=useState(false),[message,setMessage]=useState<{tone:"error"|"info";text:string}|null>(null),[busy,setBusy]=useState(false);
 function next(){if(typeof window==="undefined")return "/";return safeNext(new URLSearchParams(window.location.search).get("next"));}
 async function google(){setBusy(true);setMessage(null);const target=mode==="signup"?"/onboarding":next();const {error}=await supabase.auth.signInWithOAuth({provider:"google",options:{redirectTo:window.location.origin+"/auth/callback?next="+encodeURIComponent(target)}});if(error){setBusy(false);setMessage({tone:"error",text:error.message});}}
 async function submit(e:FormEvent<HTMLFormElement>){e.preventDefault();setBusy(true);setMessage(null);if(mode==="signup"){if(!terms){setBusy(false);setMessage({tone:"error",text:"Setujui Terms of Service dan Privacy Policy untuk melanjutkan."});return;}if(password!==confirm){setBusy(false);setMessage({tone:"error",text:"Password dan konfirmasi password harus sama."});return;}const r=await supabase.auth.signUp({email:email.trim(),password,options:{data:{full_name:name.trim()||null},emailRedirectTo:window.location.origin+"/auth/callback?next="+encodeURIComponent("/onboarding")}});setBusy(false);if(r.error){setMessage({tone:"error",text:r.error.message});return;}if(!r.data.session){setMessage({tone:"info",text:"Identity dibuat. Periksa email untuk verifikasi, lalu lanjutkan ke onboarding Allpha."});return;}router.replace("/onboarding");router.refresh();return;}const r=await supabase.auth.signInWithPassword({email:email.trim(),password});setBusy(false);if(r.error){setMessage({tone:"error",text:r.error.message});return;}router.replace(next());router.refresh();}
 const signin=mode==="signin";
 return <main className="allpha-auth-scene allpha-auth-gateway"><div className="allpha-auth-stars"/><div className="allpha-auth-nebula allpha-auth-nebula-a"/><div className="allpha-auth-nebula allpha-auth-nebula-b"/><div className="allpha-auth-gateway-orbit allpha-auth-orbit-a"/><div className="allpha-auth-gateway-orbit allpha-auth-orbit-b"/>
 <section className="allpha-auth-gateway-grid"><div className="allpha-auth-visual"><a href="/" className="allpha-auth-brand">ALLPHA<span>.</span></a><p className="allpha-auth-kicker">HUMAN IDENTITY · UNIVERSE GATEWAY</p><div className="allpha-auth-planet-wrap"><div className="allpha-auth-planet-ring r1"/><div className="allpha-auth-planet-ring r2"/><div className="allpha-auth-planet-ring r3"/><div className="allpha-auth-planet"/><div className="allpha-auth-planet-moon"/></div><div className="allpha-auth-layer-pills"><span>IDENTITY</span><i>→</i><span>AGENT</span><i>→</i><span>MEMORY</span><i>→</i><span>UNIVERSE</span></div><p className="allpha-auth-visual-copy">{signin?"Return to your living Universe.":"Create your Human Identity, then teach Allpha who you are."}</p></div>
 <section className="allpha-auth-card"><div className="allpha-auth-card-top"><a href="/" className="allpha-auth-back">← Universe</a><span className="allpha-auth-status">SECURE IDENTITY</span></div><div className="allpha-auth-heading"><p className="allpha-auth-kicker">{signin?"WELCOME BACK":"BEGIN YOUR IDENTITY"}</p><h1>{signin?"Enter your Universe":"Create your Human Identity"}</h1><p>{signin?"Sign in to continue where your Universe left off.":"Your identity becomes the human anchor for your Allpha presence and AI Agent."}</p></div>
 <div className="allpha-auth-mode"><button type="button" className={signin?"active":""} onClick={()=>{setMode("signin");setMessage(null)}}>Sign In</button><button type="button" className={!signin?"active":""} onClick={()=>{setMode("signup");setMessage(null)}}>Create Identity</button></div>
 <div className="allpha-auth-social-grid"><button type="button" className="allpha-auth-google" onClick={()=>void google()} disabled={busy}><span className="allpha-google-g">G</span><span>{signin?"Continue with Google":"Continue with Google"}</span><b>→</b></button><button type="button" className="allpha-auth-wallet" onClick={()=>setMessage({tone:"info",text:"Wallet identity akan tersedia pada activation wave Commerce & Identity."})}><span className="allpha-wallet-icon">◈</span><span>Continue with Wallet</span><b>→</b></button></div><div className="allpha-auth-divider"><span>OR CONTINUE WITH EMAIL</span></div>
 <form onSubmit={submit} className="allpha-auth-form">{!signin&&<label><span>Human Name</span><input required autoComplete="name" value={name} onChange={e=>setName(e.target.value)} placeholder="How should Allpha know you?"/></label>}<label><span>Email Address</span><input required type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/></label><label><span>{signin?"Password":"Create Password"}</span><input required minLength={8} type="password" autoComplete={signin?"current-password":"new-password"} value={password} onChange={e=>setPassword(e.target.value)} placeholder={signin?"Your password":"Minimum 8 characters"}/></label>{!signin&&<label><span>Confirm Password</span><input required minLength={8} type="password" autoComplete="new-password" value={confirm} onChange={e=>setConfirm(e.target.value)} placeholder="Repeat your password"/></label>}{message&&<div className={message.tone==="error"?"allpha-auth-message error":"allpha-auth-message"} role={message.tone==="error"?"alert":"status"}>{message.text}</div>}<button className="allpha-auth-primary" disabled={busy} type="submit">{busy?"Opening…":signin?"Enter Universe":"Create Identity & Begin"}</button></form>
 {!signin&&<label className="allpha-auth-terms"><input type="checkbox" checked={terms} onChange={e=>setTerms(e.target.checked)}/><span>I agree to the <a href="/terms" onClick={e=>e.preventDefault()}>Terms of Service</a> and <a href="/privacy" onClick={e=>e.preventDefault()}>Privacy Policy</a></span></label>}{!signin&&<p className="allpha-auth-note">After identity verification, Allpha opens an interactive onboarding orbit to learn your identity, goals, preferences and AI Agent context.</p>}{signin&&<button type="button" className="allpha-auth-forgot" onClick={()=>setMessage({tone:"info",text:"Password recovery is handled through the existing Supabase identity flow."})}>Forgot password?</button>}</section></section></main>;
}