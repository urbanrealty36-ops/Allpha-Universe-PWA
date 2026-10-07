#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(process.env.ALLPHA_D3C_EVIDENCE_ROOT ?? "d3c-evidence");
const REVIEW = path.resolve(process.env.ALLPHA_D3D_REVIEW_JSON ?? "v2-13d3d-human-review.json");
const EXPECTED = {
  schema: "allpha-3d-v2-13d3d-human-visual-fidelity-review/1.0",
  phase: "V2.13D.3D",
  goldenReference: "crystal-ai-city",
  themes: 25,
  categories: ["universe", "galaxy", "world", "district"],
  assets: 100,
  sourceRunId: 37553533713,
  sourceHeadSha: "eb6892492c4ba7188ecd6c9c8b7d00d633e2c154",
};

function fail(message) { console.error("POST_D3D_PROMOTION_GATE_BLOCKED: " + message); process.exit(1); }
function readJson(file) {
  if (!fs.existsSync(file)) fail("Missing JSON: " + file);
  try { return JSON.parse(fs.readFileSync(file, "utf8")); }
  catch { fail("Invalid JSON: " + file); }
}
function assert(v, m) { if (!v) fail(m); }

const review = readJson(REVIEW);
assert(review.schema === EXPECTED.schema, "review schema mismatch");
assert(review.phase === EXPECTED.phase, "review phase mismatch");
assert(review.goldenReference === EXPECTED.goldenReference, "golden reference mismatch");
assert(Number.isInteger(review.sourceRunId) && review.sourceRunId === EXPECTED.sourceRunId, "D3C source run mismatch");
assert(review.sourceHeadSha === EXPECTED.sourceHeadSha, "D3C source SHA mismatch");
assert(typeof review.reviewer === "string" && review.reviewer.trim() && review.reviewer !== "PENDING", "human reviewer is required");
assert(["APPROVED", "REJECTED", "PENDING"].includes(review.decision), "invalid human decision");
assert(Array.isArray(review.criteria) && review.criteria.length === 10, "exactly 10 human criteria required");
for (const criterion of review.criteria) {
  assert(criterion && typeof criterion.name === "string" && ["PASS", "PARTIAL", "FAIL"].includes(criterion.result), "invalid human criterion");
}
assert(typeof review.notes === "string" && review.notes.trim() && review.notes !== "PENDING", "human review notes are required");

const sheets = EXPECTED.categories.map(c => path.join(ROOT, "v2-13d3c-review-sheets", c + "-25-theme-contact-sheet.jpg"));
for (const file of sheets) assert(fs.existsSync(file), "missing D3C human-review contact sheet: " + file);

const allPass = review.criteria.every(c => c.result === "PASS");
const humanApproved = review.decision === "APPROVED" && allPass;
const explicitPromotionApproval = process.env.ALLPHA_3D_PRODUCTION_PROMOTION_APPROVED === "true";
const eligible = humanApproved && explicitPromotionApproval;

const decision = {
  schema: "allpha-3d-post-d3d-promotion-decision/1.0",
  phase: "V2.13D.POST-D3D",
  source: {
    d3cRunId: EXPECTED.sourceRunId,
    d3cHeadSha: EXPECTED.sourceHeadSha,
    d3cScope: "25 themes × 4 macro categories = 100 assets",
    d3cEvidence: "GREEN / LOCKED",
    humanReview: review.decision,
    reviewer: review.reviewer,
  },
  contract: { themes: EXPECTED.themes, categories: EXPECTED.categories, assets: EXPECTED.assets, goldenReference: EXPECTED.goldenReference },
  gates: {
    evidencePacketComplete: true,
    humanReviewApproved: humanApproved,
    explicitProductionPromotionApproval: explicitPromotionApproval,
    promotionEligibility: eligible,
  },
  decision: eligible ? "ELIGIBLE_FOR_PROMOTION" : "PROMOTION_BLOCKED",
  storageMutationPerformed: false,
  supabaseMutationPerformed: false,
  lockedOutsideScope: ["D3A", "D3C", "250 non-macro assets", "350-asset rebuild", "Supabase", "Storage"],
};

fs.writeFileSync("v2-13d-post-d3d-promotion-decision.json", JSON.stringify(decision, null, 2) + "\n");
console.log(JSON.stringify(decision, null, 2));
if (!eligible) process.exit(2);
