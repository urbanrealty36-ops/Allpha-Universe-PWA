import type { WorldScene,NavigationNode,NavigationEdge } from "./scene-schema";

export type NavigationGraph={nodes:NavigationNode[];edges:NavigationEdge[]};

export function resolveNavigation(scene:WorldScene):NavigationGraph{
  if(scene.navigation_graph?.nodes?.length) return scene.navigation_graph;
  const nodes=scene.zones.map((zone,index)=>{
    const angle=(index/Math.max(1,scene.zones.length))*Math.PI*2;
    return {id:`zone:${zone.id}`,zone_id:zone.id,position:{x:Math.cos(angle)*6,y:0,z:Math.sin(angle)*6}};
  });
  const edges:NavigationEdge[]=[];
  for(let i=0;i<nodes.length;i++){
    const next=nodes[(i+1)%nodes.length];
    if(next && next!==nodes[i]) edges.push({from:nodes[i].id,to:next.id,cost:1,bidirectional:true});
  }
  return {nodes,edges};
}

export function shortestPath(graph:NavigationGraph,from:string,to:string):NavigationNode[]{
  if(from===to){const n=graph.nodes.find(x=>x.id===from);return n?[n]:[];}
  const queue=[from],prev=new Map<string,string|null>([[from,null]]);
  while(queue.length){
    const current=queue.shift()!;
    for(const edge of graph.edges.filter(e=>e.from===current || (e.bidirectional && e.to===current))){
      const next=edge.from===current?edge.to:edge.from;
      if(prev.has(next)) continue;
      prev.set(next,current);
      if(next===to){
        const ids:string[]=[]; let cursor:string|null=next;
        while(cursor){ids.unshift(cursor);cursor=prev.get(cursor)??null;}
        return ids.map(id=>graph.nodes.find(n=>n.id===id)).filter(Boolean) as NavigationNode[];
      }
      queue.push(next);
    }
  }
  return [];
}
