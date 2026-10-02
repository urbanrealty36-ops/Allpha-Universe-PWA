"use client";

import { useEffect } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { createSupabaseBrowserClient } from "../supabase/client";

export type SpatialStateRow = {
  id:string; world_id:string; agent_id:string; movement_state:string;
  position:Record<string,unknown>; rotation:Record<string,unknown>;
  zone_key:string|null; target_position:Record<string,unknown>|null;
  speed:number; metadata:Record<string,unknown>; updated_at:string;
};

export function subscribeToAgentSpatialState(
  worldId:string,
  agentId:string,
  onState:(state:SpatialStateRow)=>void,
):()=>void {
  const supabase=createSupabaseBrowserClient();
  let channel:RealtimeChannel|undefined;
  let cancelled=false;
  void (async()=>{
    channel=supabase.channel(`spatial:world:${worldId}:agent:${agentId}`)
      .on("postgres_changes",{
        event:"UPDATE",
        schema:"public",
        table:"agent_spatial_states",
        filter:`world_id=eq.${worldId}`,
      },payload=>{
        const next=payload.new as SpatialStateRow;
        if(next.agent_id===agentId) onState(next);
      })
      .subscribe();
    if(cancelled && channel) await supabase.removeChannel(channel);
  })();
  return ()=>{cancelled=true;if(channel) void supabase.removeChannel(channel);};
}

export function useAgentSpatialStateRealtime(
  worldId:string|undefined,
  agentId:string|undefined,
  onState:(state:SpatialStateRow)=>void,
){
  useEffect(()=>{
    if(!worldId||!agentId)return;
    return subscribeToAgentSpatialState(worldId,agentId,onState);
  },[worldId,agentId,onState]);
}
