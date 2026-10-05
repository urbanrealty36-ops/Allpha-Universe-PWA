import type { Vec3 } from "./scene-schema";

export type ContentSpatialRelationship = {
  kind: "agent" | "world" | "community" | "live" | "related";
  targetId: string;
};

export type ContentSpatialInput = {
  id: string;
  title?: string | null;
  excerpt?: string | null;
  position?: Vec3;
  gravity?: number | null;
  relationshipCount?: number | null;
  relationships?: ContentSpatialRelationship[];
};

export type ContentSpatialNode = {
  id: string;
  title: string;
  position: Vec3;
  scale: number;
  depth: "foreground" | "midground" | "background";
  gravity?: number;
  relationshipCount: number;
  relationships: ContentSpatialRelationship[];
  presentationOnly: true;
};

export type ContentSpatialComposition = {
  version: "3d-v2.07";
  fieldRadius: number;
  nodes: ContentSpatialNode[];
  links: Array<{ from: string; to: string; kind: "related" }>;
  presentationOnly: true;
  progressiveEnhancement: "2d-2.5d-spatial-3d";
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function fallbackPosition(index: number, total: number): Vec3 {
  const angle = (index / Math.max(1, total)) * Math.PI * 2;
  const radius = 2.8 + (index % 4) * 1.15;
  return {
    x: Math.cos(angle) * radius,
    y: 0.35 + (index % 3) * 0.24,
    z: Math.sin(angle) * radius,
  };
}

export function createContentSpatialCompositionV207(
  items: readonly ContentSpatialInput[],
  lowPower = false,
): ContentSpatialComposition {
  const source = items.filter((item) => Boolean(item.id));
  const visible = source.slice(0, lowPower ? 8 : 16);
  const ids = new Set(visible.map((item) => item.id));

  const nodes = visible.map((item, index) => {
    const gravity = typeof item.gravity === "number" ? clamp(item.gravity, 0, 1) : undefined;
    const scale = gravity === undefined ? 0.42 : 0.34 + gravity * 0.34;
    const depth: ContentSpatialNode["depth"] =
      index === 0 ? "foreground" :
      index < Math.ceil(visible.length / 2) ? "midground" :
      "background";

    return {
      id: item.id,
      title: item.title || item.excerpt || "Content Capsule",
      position: item.position || fallbackPosition(index, visible.length),
      scale,
      depth,
      ...(gravity === undefined ? {} : { gravity }),
      relationshipCount: Math.max(0, Math.floor(item.relationshipCount ?? 0)),
      relationships: (item.relationships || []).filter((relationship) => Boolean(relationship.targetId)),
      presentationOnly: true as const,
    };
  });

  const links: ContentSpatialComposition["links"] = [];
  for (const node of nodes) {
    for (const relationship of node.relationships) {
      if (relationship.kind === "related" && ids.has(relationship.targetId)) {
        const exists = links.some(
          (link) =>
            (link.from === node.id && link.to === relationship.targetId) ||
            (link.from === relationship.targetId && link.to === node.id),
        );
        if (!exists) links.push({ from: node.id, to: relationship.targetId, kind: "related" });
      }
    }
  }

  return {
    version: "3d-v2.07",
    fieldRadius: 9,
    nodes,
    links,
    presentationOnly: true,
    progressiveEnhancement: "2d-2.5d-spatial-3d",
  };
}

export function validateContentSpatialComposition(
  composition: ContentSpatialComposition,
): { ok: true } | { ok: false; errors: string[] } {
  const errors: string[] = [];
  if (composition.version !== "3d-v2.07") errors.push("CONTENT_SPATIAL_SCHEMA_UNSUPPORTED");
  if (composition.presentationOnly !== true) errors.push("CONTENT_SPATIAL_AUTHORITY_BOUNDARY_INVALID");
  if (composition.nodes.length > 16) errors.push("CONTENT_SPATIAL_NODE_BUDGET_EXCEEDED");
  if (composition.nodes.some((node) => node.presentationOnly !== true)) errors.push("CONTENT_SPATIAL_NODE_AUTHORITY_INVALID");
  if (composition.links.some((link) => link.kind !== "related")) errors.push("CONTENT_SPATIAL_LINK_KIND_INVALID");
  return errors.length ? { ok: false, errors } : { ok: true };
}
