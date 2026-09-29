#!/usr/bin/env node
/**
 * Print a compact evidence digest for a batch of issues, so a Signature block
 * can be written from what the issue actually says rather than from its title.
 *
 *   node scripts/issue-evidence-digest.mjs 945 946 947
 *   node scripts/issue-evidence-digest.mjs --from-file nums.json --skip 0 --take 12
 *
 * Prints, per issue: title, the first fenced code block (usually the measured
 * evidence), any measured table rows, and the first prose paragraph. The point
 * is to see the observed/expected pair without paging through the whole body.
 */

import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const argv = process.argv.slice(2);
let numbers = [];

const fromIdx = argv.indexOf('--from-file');
if (fromIdx >= 0) {
  const all = JSON.parse(fs.readFileSync(argv[fromIdx + 1], 'utf8'));
  const skipIdx = argv.indexOf('--skip');
  const takeIdx = argv.indexOf('--take');
  const skip = skipIdx >= 0 ? Number(argv[skipIdx + 1]) : 0;
  const take = takeIdx >= 0 ? Number(argv[takeIdx + 1]) : 12;
  numbers = all.slice(skip, skip + take);
} else {
  numbers = argv.filter((a) => /^\d+$/.test(a)).map(Number);
}

const CAP = 340; // enough for the measurement, short enough to scan

for (const n of numbers) {
  let issue;
  try {
    issue = JSON.parse(
      execFileSync('gh', ['issue', 'view', String(n), '--json', 'number,title,body,state'], {
        encoding: 'utf8',
        maxBuffer: 16 * 1024 * 1024,
      })
    );
  } catch {
    console.log(`══ #${n}  (could not fetch)\n`);
    continue;
  }

  const body = (issue.body || '').replace(/\r\n/g, '\n');
  console.log(`══ #${issue.number} [${issue.state}] ${issue.title}`);

  // The first fenced block is nearly always the measured evidence.
  const fence = body.match(/```[a-z]*\n([\s\S]*?)```/);
  if (fence) {
    const code = fence[1].trim().split('\n').slice(0, 9).join('\n');
    console.log('  CODE: ' + code.slice(0, CAP).replace(/\n/g, '\n        '));
  }

  // Measured tables carry the numbers.
  const rows = body.split('\n').filter((l) => /^\|/.test(l) && !/^\|\s*-+/.test(l)).slice(0, 5);
  if (rows.length) console.log('  TBL:  ' + rows.join('\n        ').slice(0, CAP));

  // First real prose line, for intent.
  const prose = body
    .split('\n')
    .find((l) => l.trim() && !/^[#|`>\-*]/.test(l.trim()));
  if (prose) console.log('  TEXT: ' + prose.trim().slice(0, CAP));

  // A quoted requirement from John is often the expected half.
  const quote = body.split('\n').find((l) => /^>/.test(l.trim()) && l.length > 12);
  if (quote) console.log('  QUOTE:' + quote.replace(/^>\s*/, '').trim().slice(0, 200));

  console.log('');
}
