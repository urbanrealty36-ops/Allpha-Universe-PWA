"use client";
import {useEffect,useState} from "react";
import {apiFetch} from "../lib/api";
export default function PaymentResultPage(){
 const [status,setStatus]=useState("Checking payment status…");
 useEffect(()=>{const p=new URLSearchParams(window.location.search);const id=p.get("order_id");if(!id){setStatus("Payment reference is missing.");return;}const run=async()=>{try{const r=await apiFetch<{transaction_status:string}>(`/api/v1/payments/midtrans/status/${encodeURIComponent(id)}`);setStatus(r.transaction_status==="settlement"||r.transaction_status==="capture"?"Payment received. Allpha is processing your entitlement.":`Payment status: ${r.transaction_status}`)}catch(e){setStatus(e instanceof Error?e.message:"Payment status unavailable")}};void run()},[]);
 return <main className="mx-auto flex min-h-[70vh] max-w-xl items-center justify-center p-6"><section className="w-full rounded-3xl border border-white/10 bg-[var(--allpha-surface)] p-8 text-center"><p className="text-xs uppercase tracking-[.22em] text-[var(--allpha-cyan)]">Allpha Payment</p><h1 className="mt-3 text-3xl font-semibold">Payment Result</h1><p className="mt-5 text-white/60">{status}</p><a href="/economy" className="mt-8 inline-flex rounded-lg border border-white/10 px-5 py-2 text-sm">Back to Economy</a></section></main>
}