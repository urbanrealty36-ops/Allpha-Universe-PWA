import { readFile } from "node:fs/promises";
import { test, expect } from "@playwright/test";

test.describe("Canonical Theme manifest runtime contract", () => {
  test("AllphaWorldRenderer uses the canonical manifest-driven scene", async () => {
    const renderer = await readFile("apps/web/components/world/allpha-world-renderer.tsx", "utf8");
    const spatial = await readFile("apps/web/components/world/theme-spatial-scene.tsx", "utf8");
    const scene = await readFile("apps/web/components/world/theme-manifest-asset-scene.tsx", "utf8");

    expect(renderer).toContain('from "./theme-spatial-scene"');
    expect(renderer).toContain('from "./theme-manifest-asset-scene"');
    expect(renderer).not.toContain("ThemeV2ProductionAssetScene");
    expect(renderer).not.toContain("ThemeV2SpatialScene");
    expect(spatial).toContain("ThemeManifestAssetScene");
    expect(scene).toContain("/api/v1/themes/world-runtime/public/themes/");
    expect(scene).toContain("signed_url");
    expect(scene).not.toContain("theme-v2-real-3d/v2.13/");
  });

  test("public manifest supports the new Tripo Storage prefix without V2.13 coupling", async () => {
    const api = await readFile("apps/api/app/api/world_runtime.py", "utf8");
    expect(api).toContain('"storage_path": "like.theme-v3-tripo/*"');
    expect(api).not.toContain('"storage_path": "like.theme-v2-real-3d/*"');
  });

  test("unpublished/missing GLB assets do not receive fabricated scene substitutes", async () => {
    const renderer = await readFile("apps/web/components/world/allpha-world-renderer.tsx", "utf8");
    const hero = await readFile("apps/web/components/world/cinematic-production-hero.tsx", "utf8");
    const publicEntry = await readFile("apps/web/components/public-universe-3d.tsx", "utf8");

    expect(renderer).toContain("return (");
    expect(hero).toContain("fallback={null}");
    expect(hero).not.toContain("sphereGeometry");
    expect(publicEntry).toContain("fallback={null}");
    expect(publicEntry).not.toContain("HumanSilhouette");
    expect(publicEntry).not.toContain('themeKey="crystal-ai-city"');
  });
});
