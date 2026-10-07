#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(process.env.ALLPHA_V213D3B_ROOT ?? "docs/3d");
const RESULT = path.resolve(
  process.env.ALLPHA_V213D3B_RESULT ??
    path.join(ROOT, "v2-13d3b-human-visual-fidelity-rereview-result.json"),
);
const SCHEMA = path.resolve(
  process.env.ALLPHA_V213D3B_SCHEMA ??
    "scripts/3d/v2-13d3b-human-visual-fidelity-rereview.schema.json",
);

const EXPECTED_RUN = Number(process.env.ALLPHA_V213D3B_SOURCE_RUN ?? 37540658850);
const EXPECTED_SHA = process.env.ALLPHA_V213D3B_SOURCE_SHA ??
  "58e7eb21e7a709d8fb5d543b0e7bf72209317afe";

function fail(code, details) {
  console.error(`Error: ${code}`);
  if (details) console.error(details);
  process.exit(1);
}

if (!fs.existsSync(RESULT)) fail("V2.13D3B_RESULT_MISSING", RESULT);
if (!fs.existsSync(SCHEMA)) fail("V2.13D3B_SCHEMA_MISSING", SCHEMA);

let result;
try {
  result = JSON.parse(fs.readFileSync(RESULT, "utf8"));
} catch (error) {
  fail("V2.13D3B_RESULT_INVALID_JSON", error.message);
}

const expected = {
  schema: "allpha-3d-v2-13d3b-human-visual-fidelity-rereview/1.0",
  phase: "V2.13D.3B",
  sourceRun: EXPECTED_RUN,
  sourceSha: EXPECTED_SHA,
  themes: 25,
  categories: 4,
  assets: 100,
};

if (result.schema !== expected.schema) fail("V2.13D3B_SCHEMA_ID_MISMATCH");
if (result.phase !== expected.phase) fail("V2.13D3B_PHASE_MISMATCH");
if (result.source?.workflowRunId !== expected.sourceRun) fail("V2.13D3B_SOURCE_RUN_MISMATCH");
if (result.source?.headSha !== expected.sourceSha) fail("V2.13D3B_SOURCE_SHA_MISMATCH");
if (result.source?.themes !== expected.themes) fail("V2.13D3B_THEME_COUNT_MISMATCH");
if (result.source?.categories !== expected.categories) fail("V2.13D3B_CATEGORY_COUNT_MISMATCH");
if (result.source?.assetCount !== expected.assets) fail("V2.13D3B_ASSET_COUNT_MISMATCH");
if (result.goldenBenchmark !== "crystal-ai-city") fail("V2.13D3B_GOLDEN_BENCHMARK_MISMATCH");
if (result.scope?.assetCount !== expected.assets) fail("V2.13D3B_SCOPE_ASSET_COUNT_MISMATCH");
if (result.review?.method !== "human-visual-contact-sheet-review") fail("V2.13D3B_REVIEW_METHOD_MISMATCH");
if (result.review?.reviewedThemeCount !== 25) fail("V2.13D3B_REVIEW_THEME_COUNT_MISMATCH");
if (result.review?.reviewedAssetCount !== 100) fail("V2.13D3B_REVIEW_ASSET_COUNT_MISMATCH");
if (!["APPROVED", "REJECTED"].includes(result.review?.overallDecision)) fail("V2.13D3B_REVIEW_DECISION_INVALID");
if (result.review?.promotionEligible !== false) fail("V2.13D3B_PROMOTION_MUST_REMAIN_BLOCKED");
if (result.gate?.productionPromotionApproval !== "BLOCKED") fail("V2.13D3B_PROMOTION_APPROVAL_NOT_BLOCKED");
if (result.gate?.promotionToStorage !== "BLOCKED_UNTIL_REVIEW_APPROVAL_AND_REMEDIATION") fail("V2.13D3B_STORAGE_GATE_INVALID");
if (result.gate?.storageMutationPerformed !== false) fail("V2.13D3B_STORAGE_MUTATION_DETECTED");

const failedCriteria = Object.entries(result.review.criteria ?? {})
  .filter(([, value]) => value === "FAIL")
  .map(([key]) => key);

console.log(JSON.stringify({
  phase: "V2.13D.3B",
  decision: result.review.overallDecision,
  reviewedThemes: 25,
  reviewedAssets: 100,
  failedCriteria,
  storageMutationPerformed: false,
}, null, 2));

if (result.review.overallDecision === "REJECTED") {
  console.error("V2.13D3B_HUMAN_REVIEW_REJECTED");
  console.error("Promotion remains blocked; proceed only with isolated visual remediation.");
  process.exit(2);
}

console.log("V2.13D.3B_HUMAN_REVIEW_APPROVED");
