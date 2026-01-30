#!/usr/bin/env node
// scripts/sync-issue-fixed-field.mjs
// - Ensures every issue in data/pending-issues.json has a `fixed` boolean (default: false)
// - Optionally marks issues referenced in the most-recent commit as fixed
// - Respects Lock/ — will abort if a lock exists for the target files

import fs from "fs";
import path from "path";
import {execSync} from "child_process";

// Use the current working directory as the repository root (works on Windows and CI)
const root = process.cwd();
const lockDir = path.join(root, "Lock");
// prefer canonical issue data file(s) used by the repo
const pendingPathCandidates = [
  path.join(root, "data", "issues-todo.json"),
  path.join(root, "data", "pending-issues.json")
];
const pendingPath = pendingPathCandidates.find(p => fs.existsSync(p));
if (!pendingPath) die('No issue data file found (expected data/issues-todo.json or data/pending-issues.json)');
const mdPath = path.join(root, "WB-ISSUES-TODO.md");

function die(msg){
  console.error("ERROR:", msg);
  process.exit(1);
}

function hasLockFor(filename){
  if (!fs.existsSync(lockDir)) return false;
  const files = fs.readdirSync(lockDir);
  return files.some(f => f.toLowerCase().includes(path.basename(filename).toLowerCase()));
}

function readJSON(p){
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function writeJSON(p, obj){
  fs.writeFileSync(p, JSON.stringify(obj, null, 2) + "\n", "utf8");
}

function syncFixedField(){
  const issues = readJSON(pendingPath);
  let changed = false;
  for (const id in issues){
    const rec = issues[id];
    if (rec.fixed === undefined){
      rec.fixed = false;
      changed = true;
    }
  }
  if (changed) writeJSON(pendingPath, issues);
  return changed;
}

function updateMdFromJson(){
  // Simple sync: replace `| ... | false |` -> `| ... | true |` where ID matches and vice-versa.
  // This keeps the WB-ISSUES-TODO.md table consistent with the JSON source for the Fixed column.
  let md = fs.readFileSync(mdPath, "utf8");
  const issues = readJSON(pendingPath);
  const ids = Object.keys(issues);
  let mdChanged = false;
  for (const id of ids){
    const fixed = issues[id].fixed === true ? "true" : "false";
    // replace a row that contains the id and a Fixed column value
    const re = new RegExp("(\\|\\s*" + id.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&") + "\\s*\\|\\s*)(true|false)(\\s*\\|)", "g");
    const before = md;
    md = md.replace(re, (_, a, b, c) => `${a}${fixed}${c}`);
    if (md !== before) mdChanged = true;
  }
  if (mdChanged) fs.writeFileSync(mdPath, md, "utf8");
  return mdChanged;
}

function extractIssueIdsFromCommit(){
  const sha = execSync("git rev-parse --verify HEAD", {encoding: "utf8"}).trim();
  const msg = execSync("git log -1 --pretty=%B", {encoding: "utf8"});
  // common pattern: note-1769445034341-p0 or plain issue IDs present in pending-issues.json keys
  const candidates = Array.from(new Set([...(msg.match(/note-\d+-p\d+/g) || []), ...(msg.match(/note-\d+/g) || [])]));
  return {sha, msg, candidates};
}

function markFromLastCommit(){
  const {sha, msg, candidates} = extractIssueIdsFromCommit();
  if (candidates.length === 0){
    console.log("No issue IDs found in the last commit message — nothing to mark.");
    return 0;
  }
  const issues = readJSON(pendingPath);
  let changed = 0;
  for (const id of candidates){
    if (!issues[id]) continue;
    if (issues[id].fixed === true) continue;
    issues[id].fixed = true;
    issues[id].fixedAt = new Date().toISOString();
    issues[id].fixCommit = sha;
    changed++;
    console.log(`Marked ${id} fixed (commit ${sha.slice(0,7)})`);
  }
  if (changed) writeJSON(pendingPath, issues);
  return changed;
}

// ---- CLI ----
const args = process.argv.slice(2);
const markFromCommit = args.includes("--mark-from-commit") || args.includes("-m");

// safety: respect locks
if (hasLockFor(pendingPath) || hasLockFor(mdPath)){
  die(`A lock exists for ${path.basename(pendingPath)} or ${path.basename(mdPath)} — aborting.`);
}

let anyChange = false;
console.log("Syncing 'fixed' field into data/pending-issues.json (idempotent)...");
anyChange = syncFixedField() || anyChange;
console.log(anyChange ? "Updated JSON (missing fields added)." : "No JSON changes needed.");

console.log("Syncing WB-ISSUES-TODO.md Fixed column from JSON...");
const mdChanged = updateMdFromJson();
console.log(mdChanged ? "WB-ISSUES-TODO.md updated." : "WB-ISSUES-TODO.md already in sync.");

if (markFromCommit){
  console.log("Marking issues referenced in the most recent commit as fixed...");
  const n = markFromLastCommit();
  console.log(n ? `Marked ${n} issue(s) fixed.` : "No issues marked.");
}

if (!anyChange && !mdChanged && !markFromCommit) console.log("Everything already up-to-date.");
else console.log("Sync complete. Commit the updated files if any changes were made.");
