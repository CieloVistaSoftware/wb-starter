#!/usr/bin/env node
/**
 * Insert a `## Signature` block into existing issues (backfill).
 *
 * Reads a JSON map { "<issue number>": "<yaml body>" } and inserts the block
 * immediately after the issue's FIRST section, which is where the template puts
 * it — right under the plain-English description, before the mechanism.
 *
 *   node scripts/apply-issue-signatures.mjs sigs.json --dry
 *   node scripts/apply-issue-signatures.mjs sigs.json
 *
 * Idempotent: an issue that already has a Signature block is skipped, never
 * given a second one. Run with --dry first; it prints exactly what would be
 * written without touching anything.
 *
 * See docs/standards/ISSUE-SIGNATURE-BLOCK.md.
 */

import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const [, , mapPath, ...rest] = process.argv;
const dry = rest.includes('--dry');

if (!mapPath) {
  console.error('usage: apply-issue-signatures.mjs <signatures.json> [--dry]');
  process.exit(2);
}

const sigs = JSON.parse(fs.readFileSync(mapPath, 'utf8'));
const numbers = Object.keys(sigs).map(Number).sort((a, b) => a - b);

function ghJson(args) {
  return JSON.parse(execFileSync('gh', args, { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 }));
}

function buildBlock(yaml) {
  return ['## Signature', '', '```yaml', yaml.trimEnd(), '```', ''].join('\n');
}

/**
 * Insert after the first section. If the body opens with a heading, the block
 * goes before the SECOND heading; otherwise it goes at the top. Appending at
 * the end was the other option and is worse: the signature is the first thing
 * you want when triaging, not the last.
 */
function insert(body, block) {
  const headings = [...body.matchAll(/^#{1,4}\s+\S.*$/gm)];
  if (headings.length >= 2) {
    const at = headings[1].index;
    return body.slice(0, at) + block + '\n' + body.slice(at);
  }
  if (headings.length === 1) {
    return body.trimEnd() + '\n\n' + block;
  }
  return block + '\n' + body;
}

let applied = 0;
let skipped = 0;

for (const n of numbers) {
  const issue = ghJson(['issue', 'view', String(n), '--json', 'number,title,body,state']);
  if (/^#{1,4}\s*signature\s*$/im.test(issue.body || '')) {
    console.log(`  #${n}  SKIP — already has a Signature block`);
    skipped++;
    continue;
  }

  const next = insert(issue.body || '', buildBlock(sigs[n]));

  if (dry) {
    console.log(`\n══ #${n} [${issue.state}] ${issue.title.slice(0, 70)}`);
    console.log(buildBlock(sigs[n]).split('\n').map((l) => '   ' + l).join('\n'));
    applied++;
    continue;
  }

  const tmp = `${process.env.TEMP || '/tmp'}/issue-${n}-body.md`;
  fs.writeFileSync(tmp, next, 'utf8');
  execFileSync('gh', ['issue', 'edit', String(n), '--body-file', tmp], { stdio: 'inherit' });
  fs.unlinkSync(tmp);
  console.log(`  #${n}  updated`);
  applied++;
}

console.log(`\n${dry ? 'would update' : 'updated'}: ${applied}, skipped: ${skipped}`);
