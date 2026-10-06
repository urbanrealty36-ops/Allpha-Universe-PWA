#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root=process.env.ALLPHA_V213D_EVIDENCE_ROOT ?? "evidence";
const validationPath=path.join(root,"3d-v2-13d-production-validation-report.json");
const reviewPath=path.join(root,"3d-v2-13d-preview-review-report.json");
const assetRoot=path.join(root,"allpha-theme-v2-13d-production");
const errors=[];
function read(p){if(!fs.existsSync(p)){errors.push("MISSING:"+p);return null;}return JSON.parse(fs.readFileSync(p,"utf8"));}
const validation=read(validationPath), review=read(reviewPath);
if(validation){
 if(validation.schema!=="allpha-3d-v2-13d-validation/1.0") errors.push("VALIDATION_SCHEMA_INVALID");
 if(validation.ok!==true) errors.push("R2_VALIDATION_NOT_GREEN");
 if(validation.themes!==25||validation.categories!==14||validation.assets!==350||validation.previews!==350) errors.push("VALIDATION_COUNTS_INVALID");
 if((validation.errors??[]).length) errors.push("VALIDATION_ERRORS_PRESENT");
}
if(review){
 if(review.schema!=="allpha-3d-v2-13d-preview-review/1.0") errors.push("REVIEW_SCHEMA_INVALID");
 if(review.automatedReview!=="PASS") errors.push("AUTOMATED_PREVIEW_REVIEW_NOT_GREEN");
 if(review.themes!==25||review.categories!==14||review.previews!==350||review.expectedPreviews!==350) errors.push("REVIEW_COUNTS_INVALID");
 if((review.errors??[]).length) errors.push("PREVIEW_REVIEW_ERRORS_PRESENT");
 if(review.humanVisualFidelityReview!=="PENDING") errors.push("HUMAN_REVIEW_STATE_INVALID");
}
if(fs.existsSync(assetRoot)){
 const sheets=path.join(assetRoot,"contact-sheets");
 const count=fs.existsSync(sheets)?fs.readdirSync(sheets).filter(x=>x.endsWith(".jpg")).length:0;
 if(count!==25) errors.push("CONTACT_SHEET_COUNT_INVALID:"+count);
}else errors.push("ASSET_EVIDENCE_ROOT_MISSING");
const report={schema:"allpha-3d-v2-13d-1a-r3-golden-gate/1.0",phase:"V2.13D.1A-R3",sourceRunId:process.env.ALLPHA_R2_RUN_ID??null,sourceRunConclusion:process.env.ALLPHA_R2_RUN_CONCLUSION??null,r2EvidenceValid:errors.length===0,goldenReference:"crystal-ai-city",themes:25,categories:14,assets:350,previews:350,contactSheets:25,automatedGoldenGate:errors.length===0?"PASS":"FAIL",humanVisualFidelityReview:"PENDING",promotionToStorage:"BLOCKED_UNTIL_R3_HUMAN_REVIEW",errors};
fs.writeFileSync("3d-v2-13d-1a-r3-golden-gate-report.json",JSON.stringify(report,null,2)+"\n");
console.log(JSON.stringify(report,null,2));
process.exit(errors.length?1:0);