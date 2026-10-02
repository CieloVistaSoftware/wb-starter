#!/usr/bin/env node
/**
 * AUDIT: does every link in every tracked .md file work?
 *
 *   node scripts/audit-md-links.mjs              internal links only (files + anchors)
 *   node scripts/audit-md-links.mjs --external   also fetch every http(s) link
 *
 * Writes data/md-link-audit.json (Law 12: script output goes to data/) and
 * exits 1 when anything is broken, so a run is a verdict, not just a report.
 *
 * The rules for what a link is and how it resolves live in
 * scripts/lib/md-links.mjs, shared with tests/compliance/md-links-resolve.spec.ts,
 * so the audit and the gate cannot disagree. The gate checks internal links
 * only (the network does not belong in the compliance suite); this audit's
 * --external pass is how web links are checked, and its result is recorded.
 *
 * External verdicts:
 *   ok           2xx/3xx (redirects followed)
 *   broken       404/410, DNS failure, refused, or 5xx on both HEAD and GET
 *   unverifiable 401/403/429 or a timeout: the site refuses robots or is slow;
 *                a person must check it. Reported, not counted as broken.
 */

import { execFile } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { promisify } from 'node:util';
import { ROOT, auditInternal, externalLinks } from './lib/md-links.mjs';

const run = promisify(execFile);
const EXTERNAL = process.argv.includes('--external');
const OUT = path.join(ROOT, 'data', 'md-link-audit.json');

/** HTTP status for a URL via curl (honours the environment's proxy). */
async function status(url, method) {
  const args = ['-s', '-o', '/dev/null', '-w', '%{http_code}', '-L', '--max-time', '20',
    '-A', 'Mozilla/5.0 (wb-starter link audit)'];
  if (method === 'HEAD') args.push('-I');
  try {
    const { stdout } = await run('curl', [...args, url]);
    return Number(stdout.trim()) || 0;
  } catch (e) {
    const code = Number(String(e.stdout || '').trim());
    return code || (e.code === 28 ? -1 : 0); // -1 timeout, 0 no response
  }
}

async function checkExternal(url) {
  let code = await status(url, 'HEAD');
  // Many servers reject HEAD (405/403/501) but serve GET.
  if (!(code >= 200 && code < 400)) code = await status(url, 'GET');
  // One dropped connection is not a verdict: ui-avatars.com answered 200 on
  // its own but dropped a request from 8 in flight. Retry once, alone.
  if (code <= 0) { await new Promise((r) => setTimeout(r, 2000)); code = await status(url, 'GET'); }
  if (code >= 200 && code < 400) return { verdict: 'ok', code };
  if ([401, 403, 429].includes(code) || code === -1) return { verdict: 'unverifiable', code };
  return { verdict: 'broken', code };
}

async function pool(items, size, fn) {
  const out = new Array(items.length);
  let next = 0;
  await Promise.all(Array.from({ length: size }, async () => {
    while (next < items.length) { const i = next++; out[i] = await fn(items[i]); }
  }));
  return out;
}

const internal = auditInternal();
const report = {
  generated: new Date().toISOString().slice(0, 10),
  files: internal.files,
  internal: { links: internal.links, broken: internal.broken },
};

if (EXTERNAL) {
  const map = externalLinks();
  const urls = [...map.keys()].sort();
  const results = await pool(urls, 8, checkExternal);
  const rows = urls.map((url, i) => ({ url, ...results[i], usedIn: map.get(url) }));
  report.external = {
    links: urls.length,
    broken: rows.filter((r) => r.verdict === 'broken'),
    unverifiable: rows.filter((r) => r.verdict === 'unverifiable'),
    ok: rows.filter((r) => r.verdict === 'ok').length,
  };
}

mkdirSync(path.dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify(report, null, 2) + '\n');

console.log(`Markdown link audit — ${report.files} files`);
console.log(`  internal: ${internal.links} links, ${internal.broken.length} broken`);
for (const b of internal.broken) console.log(`    ✗ ${b.from}:${b.line}  ${b.dest}  — ${b.detail}`);
if (report.external) {
  const e = report.external;
  console.log(`  external: ${e.links} links, ${e.ok} ok, ${e.broken.length} broken, ${e.unverifiable.length} unverifiable`);
  for (const b of e.broken) console.log(`    ✗ ${b.code || 'no response'}  ${b.url}  (${b.usedIn.map((u) => `${u.from}:${u.line}`).join(', ')})`);
  for (const b of e.unverifiable) console.log(`    ? ${b.code === -1 ? 'timeout' : b.code}  ${b.url}`);
}
console.log(`  written: ${path.relative(ROOT, OUT)}`);

const failed = internal.broken.length + (report.external ? report.external.broken.length : 0);
process.exit(failed ? 1 : 0);
