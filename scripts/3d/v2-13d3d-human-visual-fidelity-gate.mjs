#!/usr/bin/env node
import fs from "node:fs";
const file = process.env.ALLPHA_V213D3D_REVIEW_JSON || "v2-13d3d-human-review.json";
const review = JSON.parse(fs.readFileSync(file, "utf8"));
const required = [
  "themeIdentity","geometrySpatialHierarchy","silhouetteMassing",
  "negativeSpaceComposition","categoryFidelity","materialPBR",
  "lightingAtmosphere","cameraCinematicFraming",
  "mobileBrowserPlausibility","crossThemeDifferentiation"
];
const errors = [];
if (review.schema !== "allpha-3d-v2-13d3d-human-visual-fidelity-review/1.0") errors.push("SCHEMA_INVALID");
if (review.phase !== "V2.13D.3D") errors.push("PHASE_INVALID");
if (review.goldenReference !== "crystal-ai-city") errors.push("GOLDEN_REFERENCE_INVALID");
if (!Number.isInteger(review.sourceRunId) || review.sourceRunId < 1) errors.push("SOURCE_RUN_INVALID");
if (!/^[0-9a-f]{40}$/.test(review.sourceHeadSha || "")) errors.push("SOURCE_SHA_INVALID");
if (!review.reviewer || review.reviewer.trim().length < 2) errors.push("REVIEWER_REQUIRED");
if (!["APPROVED","REJECTED","PENDING"].includes(review.decision)) errors.push("DECISION_INVALID");
for (const key of required) {
  if (!review.criteria || !["PASS","PARTIAL","FAIL"].includes(review.criteria[key])) errors.push("CRITERION_INVALID:" + key);
}
if (review.decision === "APPROVED") {
  const failed = required.filter((key) => review.criteria[key] !== "PASS");
  if (failed.length) errors.push("APPROVAL_REQUIRES_ALL_CRITERIA_PASS:" + failed.join(","));
}
if (!review.notes || review.notes.trim().length < 1) errors.push("REVIEW_NOTES_REQUIRED");
if (errors.length) {
  console.error(JSON.stringify({ok:false,errors},null,2));
  process.exit(1);
}
console.log(JSON.stringify({ok:true,phase:review.phase,decision:review.decision,sourceRunId:review.sourceRunId,sourceHeadSha:review.sourceHeadSha,goldenReference:review.goldenReference,criteria:review.criteria},null,2));
