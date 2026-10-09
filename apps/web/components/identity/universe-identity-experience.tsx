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
          <div className="flex flex-col items-center"><span className="mb-1 text-cyan-400">◈</span><span className="text-[10px] text-slate-300">Spatial Worlds</span></div>
          <div className="flex flex-col items-center"><span className="mb-1 text-purple-400">▧</span><span className="text-[10px] text-slate-300">Immersive Places</span></div>
          <div className="flex flex-col items-center"><span className="mb-1 text-blue-400">→</span><span className="text-[10px] text-slate-300">Shared Experiences</span></div>
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
 return (
  <main className="relative min-h-[100svh] overflow-y-auto bg-slate-950 text-slate-100">
   <div aria-hidden="true" className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_20%_20%,rgba(56,189,248,.12),transparent_35%),radial-gradient(ellipse_at_80%_70%,rgba(168,85,247,.13),transparent_38%)]"/>
   <div aria-hidden="true" className="pointer-events-none fixed left-1/2 top-1/2 h-[min(90vw,760px)] w-[min(90vw,760px)] -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-300/[0.07]"/>
   <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-800/80 bg-slate-950/75 px-5 py-4 backdrop-blur-xl sm:px-8">
    <a href="/" className="font-orbitron text-sm font-extrabold tracking-wider text-white">ALLPHA<span className="text-cyan-300">.</span><small className="ml-2 font-sans text-[9px] tracking-[.2em] text-slate-400">IDENTITY</small></a>
    <a href="/" className="rounded-full border border-slate-700 bg-slate-900/70 px-3 py-2 text-xs text-slate-300 transition hover:border-cyan-300/40 hover:text-white">← Universe</a>
   </header>
   <div className="relative z-10 mx-auto grid w-full max-w-6xl gap-8 px-4 py-8 sm:px-8 sm:py-12 lg:grid-cols-[.9fr_1.1fr] lg:items-center lg:gap-16">
    <section className="flex flex-col items-center text-center lg:items-start lg:text-left">
     <div className="relative mb-6 grid h-36 w-36 place-items-center rounded-full bg-gradient-to-tr from-cyan-400 via-blue-500 to-purple-600 p-1 shadow-[0_0_45px_rgba(129,140,248,.3)] sm:h-44 sm:w-44">
      <div className="relative grid h-full w-full place-items-center overflow-hidden rounded-full bg-gradient-to-b from-indigo-950 via-slate-950 to-purple-950">
       <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(56,189,248,.5),transparent_70%)]"/>
       <div className="absolute bottom-0 h-20 w-full bg-gradient-to-t from-purple-950 to-transparent"/>
       <div className="relative z-10 flex flex-col items-center">
        <div className="relative h-20 w-16 rounded-full bg-gradient-to-b from-indigo-200 via-purple-300 to-cyan-200 shadow-inner">
         <div className="absolute -left-2 -top-1 h-10 w-8 rounded-full bg-indigo-300/80 blur-[.5px]"/>
         <div className="absolute -right-2 -top-1 h-10 w-8 rounded-full bg-purple-300/80 blur-[.5px]"/>
         <div className="absolute left-3 top-8 flex h-2 w-3 items-center justify-center rounded-full bg-cyan-900"><i className="h-1 w-1 rounded-full bg-cyan-300"/></div>
         <div className="absolute right-3 top-8 flex h-2 w-3 items-center justify-center rounded-full bg-cyan-900"><i className="h-1 w-1 rounded-full bg-cyan-300"/></div>
         <div className="absolute left-1/2 top-2 h-3 w-2 -translate-x-1/2 rotate-45 bg-cyan-400"/>
        </div>
        <div className="-mt-2 h-10 w-28 rounded-t-3xl border-t border-cyan-400/40 bg-slate-800"/>
       </div>
       <span className="absolute right-4 top-3 animate-pulse text-cyan-300">✧</span><span className="absolute bottom-4 left-3 animate-pulse text-purple-300">✦</span>
      </div>
     </div>
     <p className="text-[10px] font-bold uppercase tracking-[.25em] text-cyan-300">{signin ? "WELCOME BACK" : "CREATE YOUR"}</p>
     <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl">{signin ? "Enter your Universe" : "Human Identity"}</h1>
     <p className="mt-3 max-w-md text-sm leading-6 text-slate-400">{signin ? "Sign in to continue where your Universe left off." : "Your human identity anchors your presence and the AI Agent you own across Allpha."}</p>
     <div className="mt-7 hidden flex-wrap items-center gap-3 text-[9px] font-bold tracking-[.18em] text-slate-500 lg:flex"><span>IDENTITY</span><i className="text-cyan-300/60">→</i><span>AGENT</span><i className="text-cyan-300/60">→</i><span>MEMORY</span><i className="text-cyan-300/60">→</i><span>UNIVERSE</span></div>
    </section>
    <section className="glass-panel-glow mx-auto w-full max-w-xl rounded-3xl p-5 shadow-2xl sm:p-8">
     <div className="mb-6 flex items-center justify-between gap-3"><span className="text-[9px] font-bold uppercase tracking-[.2em] text-cyan-100/65">Secure Identity Gateway</span><span className="rounded-full border border-emerald-300/20 bg-emerald-300/[.06] px-2.5 py-1 text-[8px] text-emerald-200">SUPABASE AUTH</span></div>
     <div className="mb-5 grid grid-cols-2 gap-1 rounded-2xl border border-slate-800 bg-slate-950/80 p-1">
      <button type="button" className={signin ? "rounded-xl bg-cyan-300 px-3 py-3 text-xs font-bold text-slate-950" : "rounded-xl px-3 py-3 text-xs text-slate-400 hover:text-white"} onClick={()=>{setMode("signin");setMessage(null)}}>Sign In</button>
      <button type="button" className={!signin ? "rounded-xl bg-cyan-300 px-3 py-3 text-xs font-bold text-slate-950" : "rounded-xl px-3 py-3 text-xs text-slate-400 hover:text-white"} onClick={()=>{setMode("signup");setMessage(null)}}>Create Identity</button>
     </div>
     <button type="button" onClick={()=>void google()} disabled={busy} className="glass-panel mb-3 flex min-h-12 w-full items-center justify-between rounded-xl px-4 text-xs font-semibold text-white transition hover:border-cyan-300/35 disabled:opacity-50"><span className="flex items-center gap-3"><b className="grid h-6 w-6 place-items-center rounded-full bg-white text-[11px] text-slate-950">G</b>Continue with Google</span><span className="text-cyan-200">→</span></button>
     <button type="button" onClick={()=>setMessage({tone:"info",text:"Wallet identity akan tersedia pada activation wave Commerce & Identity."})} className="glass-panel mb-5 flex min-h-12 w-full items-center justify-between rounded-xl px-4 text-xs font-semibold text-white transition hover:border-purple-300/35"><span className="flex items-center gap-3"><b className="grid h-6 w-6 place-items-center rounded-full bg-purple-400/10 text-sm text-purple-300">◈</b>Continue with Wallet</span><span className="text-purple-200">→</span></button>
     <div className="mb-5 flex items-center gap-3"><span className="h-px flex-1 bg-slate-800"/><span className="text-[9px] font-semibold uppercase tracking-[.15em] text-slate-500">Or continue with email</span><span className="h-px flex-1 bg-slate-800"/></div>
     <form onSubmit={submit} className="space-y-4">
      {!signin && <label className="block"><span className="mb-1.5 block text-[11px] text-slate-400">Human Name</span><input required autoComplete="name" value={name} onChange={e=>setName(e.target.value)} placeholder="How should Allpha know you?" className="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-300/60"/></label>}
      <label className="block"><span className="mb-1.5 block text-[11px] text-slate-400">Email Address</span><input required type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" className="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-300/60"/></label>
      <label className="block"><span className="mb-1.5 block text-[11px] text-slate-400">{signin ? "Password" : "Create Password"}</span><input required minLength={8} type="password" autoComplete={signin ? "current-password" : "new-password"} value={password} onChange={e=>setPassword(e.target.value)} placeholder={signin ? "Your password" : "Minimum 8 characters"} className="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-300/60"/></label>
      {!signin && <label className="block"><span className="mb-1.5 block text-[11px] text-slate-400">Confirm Password</span><input required minLength={8} type="password" autoComplete="new-password" value={confirm} onChange={e=>setConfirm(e.target.value)} placeholder="Repeat your password" className="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-300/60"/></label>}
      {message && <div className={message.tone === "error" ? "rounded-xl border border-rose-300/25 bg-rose-300/[.06] p-3 text-xs text-rose-100" : "rounded-xl border border-cyan-300/20 bg-cyan-300/[.05] p-3 text-xs text-cyan-50"} role={message.tone === "error" ? "alert" : "status"}>{message.text}</div>}
      {!signin && <label className="flex cursor-pointer items-start gap-2 text-[11px] leading-5 text-slate-400"><input type="checkbox" checked={terms} onChange={e=>setTerms(e.target.checked)} className="mt-1 accent-cyan-300"/><span>I agree to the <a href="/terms" className="text-cyan-300 underline">Terms of Service</a> and <a href="/privacy" className="text-cyan-300 underline">Privacy Policy</a></span></label>}
      <button className="flex min-h-12 w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 px-5 py-3 text-sm font-bold text-white shadow-[0_0_25px_rgba(56,189,248,.25)] transition hover:brightness-110 disabled:cursor-wait disabled:opacity-60" disabled={busy} type="submit"><span>{busy ? "Opening…" : signin ? "Enter Universe" : "Create Identity & Begin"}</span><span aria-hidden="true">→</span></button>
     </form>
     {signin && <button type="button" className="mt-4 text-[11px] text-slate-500 underline hover:text-cyan-200" onClick={()=>setMessage({tone:"info",text:"Password recovery is handled through the existing Supabase identity flow."})}>Forgot password?</button>}
     {signin && <p className="mt-4 text-[10px] leading-5 text-slate-500">Your Human Identity remains the authority anchor for your Allpha presence and owned AI Agent.</p>}
    </section>
   </div>
  </main>
 );
}