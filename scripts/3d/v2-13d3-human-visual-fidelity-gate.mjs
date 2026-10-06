#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const EXPECTED_THEMES = [
  "aurora-kingdom","celestial-samurai","chronos-realm","coral-metropolis","crystal-ai-city",
  "desert-starfall","dragon-dominion","dream-carnival","emerald-rainforest","floating-garden",
  "galactic-frontier","heroic-nexus","kingdom-of-aether","lunar-frontier","mars-frontier",
  "mystic-academy","neo-jakarta-2099","neon-tokyo","nusantara-raya","oceanic-atlantis",
  "pharaoh-eternal","quantum-city","savanna-spirit","skyforge-empire","viking-fjord",
];

const D2_SCHEMA = "allpha-3d-v2-13d2-storage-activation/1.0";
const R3_SCHEMA = "allpha-3d-v2-13d-1a-r3-golden-gate/1.0";
const REVIEW_SCHEMA = "allpha-3d-v2-13d3-human-visual-fidelity-review/1.0";

const args = process.argv.slice(2);
const getArg = (name, fallback) => args.find((v) => v.startsWith(name + "="))?.slice(name.length + 1) ?? fallback;
const d2Path = path.resolve(getArg("--d2", "3d-v2-13d2-storage-activation-manifest.json"));
const r3Path = path.resolve(getArg("--r3", "3d-v2-13d-1a-r3-golden-gate-report.json"));
const contactSheetsRoot = path.resolve(getArg("--contact-sheets", "review-pack/contact-sheets"));
const humanApproved = process.env.ALLPHA_3D_HUMAN_VISUAL_FIDELITY_APPROVED === "true";
const promotionApproved = process.env.ALLPHA_3D_PRODUCTION_PROMOTION_APPROVED === "true";
const reviewer = process.env.ALLPHA_3D_REVIEWER_ATTESTATION || "PENDING";

const readJson = (file) => JSON.parse(fs.readFileSync(file, "utf8"));
const fail = (m) => { throw new Error(m); };

if (!fs.existsSync(d2Path)) fail("Missing D2 manifest: " + d2Path);
if (!fs.existsSync(r3Path)) fail("Missing R3 report: " + r3Path);

const d2 = readJson(d2Path);
const r3 = readJson(r3Path);

if (d2.schema !== D2_SCHEMA || d2.phase !== "V2.13D.2" || d2.mode !== "dry-run") fail("D2 contract is not GREEN-ready.");
if (d2.themes !== 25 || d2.categories !== 14 || d2.assets !== 350) fail("D2 counts are not 25/14/350.");
if (d2.goldenReference !== "crystal-ai-city" || d2.bucket !== "allpha-world-assets" || d2.root !== "theme-v2-real-3d/v2.13") fail("D2 storage contract mismatch.");
if (d2.frontendSecretExposure !== false) fail("Frontend secret exposure contract violated.");
if (!Array.isArray(d2.assetEntries) || d2.assetEntries.length !== 350) fail("D2 assetEntries must contain exactly 350 records.");

if (r3.schema !== R3_SCHEMA || r3.automatedGoldenGate !== "PASS") fail("R3 automated Golden Gate is not PASS.");
if (r3.themes !== 25 || r3.categories !== 14 || r3.assets !== 350 || r3.previews !== 350 || r3.contactSheets !== 25) fail("R3 evidence counts are not 25/14/350/350/25.");
if (r3.errors?.length) fail("R3 report contains errors.");

if (!fs.existsSync(contactSheetsRoot)) fail("Missing human review contact-sheet directory: " + contactSheetsRoot);
const files = fs.readdirSync(contactSheetsRoot).filter((f) => /\.(png|jpg|jpeg)$/i.test(f));
const matchedThemes = EXPECTED_THEMES.filter((theme) => files.some((f) => f.toLowerCase().includes(theme)));
if (files.length < 25 || matchedThemes.length !== 25) {
  fail("Expected at least 25 theme contact sheets; found files=" + files.length + ", matchedThemes=" + matchedThemes.length);
}

const criteria = [
  "Theme identity and structural differentiation versus Crystal AI City benchmark",
  "Geometry quality and spatial hierarchy",
  "Material/PBR readability and non-flat presentation",
  "Lighting, atmosphere, camera composition, and cinematic depth",
  "Category fidelity across universe/galaxy/world/orbit/capsule/district/booth/content/agent/live/human/sticker/animation/navigation",
  "No obvious broken geometry, missing asset, unreadable preview, or accidental placeholder treatment",
  "Mobile/browser presentation plausibility and runtime performance awareness",
];

const output = {
  schema: REVIEW_SCHEMA,
  phase: "V2.13D.3",
  source: {
    d2Manifest: path.relative(process.cwd(), d2Path),
    r3Report: path.relative(process.cwd(), r3Path),
    contactSheets: path.relative(process.cwd(), contactSheetsRoot),
  },
  goldenReference: "crystal-ai-city",
  themes: 25,
  categories: 14,
  assets: 350,
  contactSheets: 25,
  criteria,
  reviewerAttestation: reviewer,
  humanVisualFidelityReview: humanApproved ? "APPROVED" : "PENDING",
  productionPromotionApproval: promotionApproved ? "APPROVED" : "PENDING",
  promotionToStorage: humanApproved && promotionApproved ? "READY_FOR_CONTROLLED_PROMOTION" : "BLOCKED_UNTIL_APPROVALS",
  storageMutationPerformed: false,
  frontendSecretExposure: false,
  privilegedMutationBoundary: "backend-or-controlled-activation-job-only",
  themeReview: EXPECTED_THEMES.map((theme) => ({
    themeKey: theme,
    contactSheet: files.find((f) => f.toLowerCase().includes(theme)) ?? null,
    decision: humanApproved ? "APPROVED_BY_ATTESTATION" : "PENDING_HUMAN_REVIEW",
  })),
};

fs.writeFileSync("3d-v2-13d3-human-visual-fidelity-review.json", JSON.stringify(output, null, 2) + "\n");
console.log(JSON.stringify({
  ok: true,
  phase: output.phase,
  humanVisualFidelityReview: output.humanVisualFidelityReview,
  productionPromotionApproval: output.productionPromotionApproval,
  promotionToStorage: output.promotionToStorage,
  themes: 25,
  assets: 350,
  contactSheets: 25,
  storageMutationPerformed: false,
}, null, 2));
