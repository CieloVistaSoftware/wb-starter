/**
 * generate-fixes.mjs -- write the Fix Viewer's table to data/fixes.json (#1861)
 *
 * John, 2026-10-13: "our fix viewer has not been maintained at all". The live
 * site is static, so it has no /api/fixes, and the viewer fell back to
 * data/fixes.json: 13 hand-written rows from 2026-02-16. The stamp workflow now
 * runs this after every push to main, so the file is the same table port 3000
 * serves (scripts/lib/fixes.mjs), traced from main's history.
 *
 *   node scripts/generate-fixes.mjs                    # from HEAD
 *   node scripts/generate-fixes.mjs --ref origin/main  # from another commit
 *
 * When GitHub cannot be reached the file is left as it is: an empty table is
 * worse than yesterday's.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { fetchIssues, traceFixes } from './lib/fixes.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'data', 'fixes.json');
const at = process.argv.indexOf('--ref');
const REF = at > -1 ? process.argv[at + 1] : 'HEAD';

const issues = await fetchIssues();
if (!issues) {
  console.warn('::warning::generate-fixes: GitHub did not answer; data/fixes.json left as it was.');
  process.exit(0);
}

const table = traceFixes({ root: ROOT, issues, ref: REF });
fs.writeFileSync(OUT, JSON.stringify(table) + '\n');
const c = table.counts;
console.log(`data/fixes.json: ${c.traced} issues traced (${c.closed} closed, ${c.open} open, ${c.released} released), `
  + `${Math.round(fs.statSync(OUT).size / 1024)} KB, from ${table.builtFrom.sha?.slice(0, 8)}`);
