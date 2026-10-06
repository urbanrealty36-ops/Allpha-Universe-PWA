#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const THEMES = [
  "aurora-kingdom","celestial-samurai","chronos-realm","coral-metropolis","crystal-ai-city",
  "desert-starfall","dragon-dominion","dream-carnival","emerald-rainforest","floating-garden",
  "galactic-frontier","heroic-nexus","kingdom-of-aether","lunar-frontier","mars-frontier",
  "mystic-academy","neo-jakarta-2099","neon-tokyo","nusantara-raya","oceanic-atlantis",
  "pharaoh-eternal","quantum-city","savanna-spirit","skyforge-empire","viking-fjord",
];
const CATEGORIES = [
  "universe","galaxy","world","orbit","capsule","district","booth","content-feed",
  "agent-character","live-stage","human-live","sticker-social","animation","navigation-fx",
];
const BUCKET = "allpha-world-assets";
const ROOT = "theme-v2-real-3d/v2.13";
const R3_SCHEMA = "allpha-3d-v2-13d-1a-r3-golden-gate/1.0";
const ASSET_SCHEMA = "allpha-3d-v2-13d-theme-production/1.0";
const ACTIVATION_SCHEMA = "allpha-3d-v2-13d2-storage-activation/1.0";

const args = process.argv.slice(2);
const root = path.resolve(args.find((v) => v.startsWith("--root="))?.slice(7) ?? "allpha-theme-v2-13d-production");
const r3ReportPath = path.resolve(args.find((v) => v.startsWith("--r3-report="))?.slice(12) ?? "3d-v2-13d-1a-r3-golden-gate-report.json");
const activate = args.includes("--activate");

function fail(message) { throw new Error(message); }
function sha256(buffer) { return crypto.createHash("sha256").update(buffer).digest("hex"); }
function readJson(file) { if (!fs.existsSync(file)) fail("Missing file: " + file); return JSON.parse(fs.readFileSync(file, "utf8")); }

const report = readJson(r3ReportPath);
if (report.schema !== R3_SCHEMA) fail("R3 schema mismatch.");
if (report.automatedGoldenGate !== "PASS") fail("R3 automated golden gate is not PASS.");
if (report.themes !== 25 || report.categories !== 14 || report.assets !== 350 || report.previews !== 350 || report.contactSheets !== 25) {
  fail("R3 evidence counts are not 25/14/350/350/25.");
}
if (report.errors?.length) fail("R3 report contains errors.");
if (report.promotionToStorage !== "BLOCKED_UNTIL_R3_HUMAN_REVIEW") fail("Unexpected R3 promotion state.");
if (activate && process.env.ALLPHA_3D_HUMAN_VISUAL_FIDELITY_APPROVED !== "true") {
  fail("Activation blocked: human visual fidelity approval is required.");
}
if (activate && process.env.ALLPHA_3D_PRODUCTION_PROMOTION_APPROVED !== "true") {
  fail("Activation blocked: production promotion approval is required.");
}

const assets = [];
for (const theme of THEMES) for (const category of CATEGORIES) {
  const file = path.join(root, theme, category + ".glb");
  if (!fs.existsSync(file)) fail("Missing production GLB: " + file);
  const buffer = fs.readFileSync(file);
  assets.push({
    themeKey: theme,
    category,
    localPath: path.relative(process.cwd(), file),
    storagePath: ROOT + "/" + theme + "/" + category + ".glb",
    bytes: buffer.length,
    checksumSha256: sha256(buffer),
    schema: ASSET_SCHEMA,
    presentationOnly: true,
    legacy: false,
    canonicalRenderer: "AllphaWorldRenderer",
  });
}
if (assets.length !== 350) fail("Expected 350 assets, found " + assets.length);

const output = {
  schema: ACTIVATION_SCHEMA,
  phase: "V2.13D.2",
  mode: activate ? "activate" : "dry-run",
  goldenReference: "crystal-ai-city",
  bucket: BUCKET,
  root: ROOT,
  themes: 25,
  categories: 14,
  assets: 350,
  r3Report: path.relative(process.cwd(), r3ReportPath),
  humanVisualFidelityApproval: process.env.ALLPHA_3D_HUMAN_VISUAL_FIDELITY_APPROVED === "true",
  productionPromotionApproval: process.env.ALLPHA_3D_PRODUCTION_PROMOTION_APPROVED === "true",
  frontendSecretExposure: false,
  privilegedMutationBoundary: "backend-or-controlled-activation-job-only",
  assets,
};

const outputPath = path.resolve("3d-v2-13d2-storage-activation-manifest.json");
fs.writeFileSync(outputPath, JSON.stringify(output, null, 2) + "\n");
console.log(JSON.stringify({
  ok: true,
  schema: ACTIVATION_SCHEMA,
  phase: "V2.13D.2",
  mode: output.mode,
  themes: 25,
  categories: 14,
  assets: 350,
  activationReady: activate,
  manifest: outputPath,
}, null, 2));
