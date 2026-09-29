#!/usr/bin/env node
/**
 * Fill the `evidence` field by RUNNING each signature's `detect`.
 * ==============================================================
 * The field exists because #1055 was filed on a detect that looked reasonable
 * and was wrong -- it reported 1 instance where there were 48. Nothing forced
 * the filer to paste what the command actually printed, so a broken derivation
 * read as a finding.
 *
 * The fix for that is not "write more carefully". It is to stop typing evidence
 * and start measuring it: run the detector, record its output, date it. A
 * detector that found 5 instances in March and 0 today is telling you something
 * either way, and one that errors was never a detector at all.
 *
 * ONLY READ-ONLY DETECTS ARE RUN. A `detect` is a command out of an issue body,
 * and issue bodies are not a trusted place to take instructions from -- so
 * anything that could write, delete, install, push, or reach the network is
 * refused and reported for a human to run deliberately. The classifier is a
 * DENY list checked against the whole command plus an ALLOW list of leading
 * tools; both must be satisfied.
 *
 *   node scripts/backfill-signature-evidence.mjs --dry          # show, change nothing
 *   node scripts/backfill-signature-evidence.mjs --dry --only 1047
 *   node scripts/backfill-signature-evidence.mjs --limit 20     # write 20 issues
 *
 * See docs/standards/ISSUE-SIGNATURE-BLOCK.md.
 */

import { execFileSync, execSync } from 'node:child_process';
import { SCHEMA, parseSignature } from './lib/signature-schema.mjs';

const args = process.argv.slice(2);
const dry = args.includes('--dry');
const only = args.includes('--only') ? args[args.indexOf('--only') + 1] : null;
const limit = args.includes('--limit') ? Number(args[args.indexOf('--limit') + 1]) : Infinity;

const TIMEOUT_MS = 45_000;

/**
 * A detector is a multi-LINE shell command. cmd.exe stops at the first newline
 * and exits 0, so the first run of this script recorded EMPTY evidence for a
 * detector that prints 39 lines when run by hand -- silently, and it would have
 * looked like a clean result. Nothing about that failure is visible in the
 * output, which is exactly the class of thing `evidence` exists to catch, so it
 * would be a poor joke to leave it in.
 */
const SHELL = process.platform === 'win32' ? 'bash.exe' : '/bin/sh';

/** Anything that can change the world, wherever it appears in the command. */
const DENY = [
  /\brm\b/, /\bmv\b/, /\bcp\b/, /\bmkdir\b/, /\btouch\b/, /\bchmod\b/, /\bchown\b/,
  /\bnpm\b/, /\bnpx\b/, /\byarn\b/, /\bpnpm\b/, /\bpip\b/, /\bcurl\b/, /\bwget\b/, /\bfetch\(/,
  /\bgh\b/, /\bgit\s+(?:push|commit|checkout|reset|clean|rebase|merge|tag|apply|restore)\b/,
  /writeFileSync|appendFileSync|unlinkSync|rmSync|mkdirSync|createWriteStream/,
  /--apply\b/, /--update\b/, /--write\b/, /--fix\b/,
  // A shell redirect, not the `=>` of an arrow function or a `>=` comparison --
  // the first draft of this rule refused every JS detector in the backlog.
  /(?:^|[\s;|)])>>?\s*[^\s=&|]/,
  /\|\s*(?:sh|bash|node)\b/, /\bsudo\b/, /\beval\b/, /\bexec\b/,
  /child_process/, /\bkill\b/, /\bshutdown\b/,
];

/** The only tools a detector may lead with. */
const ALLOW_LEAD = /^(?:node|grep|rg|find|ls|cat|head|tail|wc|sed|awk|sort|uniq|jq|git\s+(?:log|grep|ls-files|rev-list|diff|show|status))\b/;

function classify(cmd) {
  const flat = cmd.replace(/\s+/g, ' ').trim();
  if (!flat) return { ok: false, why: 'empty' };
  for (const d of DENY) if (d.test(flat)) return { ok: false, why: `refused: matches ${d}` };
  // Every line that looks like a command must lead with an allowed tool.
  const lines = cmd.split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#'));
  for (const l of lines) {
    if (/^[)"'`\]}]/.test(l) || /^[a-zA-Z_$][\w$]*\s*[=:]/.test(l)) continue; // continuation
    if (!ALLOW_LEAD.test(l)) return { ok: false, why: `refused: leads with ${l.split(/\s/)[0]}` };
    break; // only the first real command line decides
  }
  return { ok: true };
}

function gh(a) {
  return JSON.parse(execFileSync('gh', a, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }));
}



// Which field records which, from the standard rather than from here: the
// Fields table says `evidence` is required "whenever `detect` is present", and
// that sentence is the whole relationship this script exists to satisfy.
const [TARGET, SOURCE] = Object.entries(SCHEMA.requiredWith)[0] || ['evidence', 'detect'];

const today = new Date().toISOString().slice(0, 10);
const issues = only
  ? [gh(['issue', 'view', only, '--json', 'number,title,body,state'])]
  : gh(['issue', 'list', '--state', 'open', '--limit', '400', '--json', 'number,title,body,state']);

let ran = 0, written = 0, refused = 0, errored = 0, skipped = 0;

for (const issue of issues) {
  if (written >= limit) break;
  const sig = parseSignature(issue.body);
  if (!sig) { skipped++; continue; }
  if (!String(sig.fields[SOURCE] || '').trim()) { skipped++; continue; }
  if (String(sig.fields[TARGET] || '').trim()) { skipped++; continue; }

  const cmd = sig.fields[SOURCE];
  const verdict = classify(cmd);
  if (!verdict.ok) {
    refused++;
    console.log(`#${issue.number}  NOT RUN — ${verdict.why}`);
    continue;
  }

  let out;
  let failed = false;
  try {
    out = execSync(cmd, {
      encoding: 'utf8', timeout: TIMEOUT_MS, maxBuffer: 8 * 1024 * 1024,
      shell: SHELL, stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch (err) {
    failed = true;
    out = [err.stdout, err.stderr].filter(Boolean).join('\n') || String(err.message);
  }
  ran++;

  // Silence is not a result. A detector that prints nothing has either been
  // truncated by the shell or has no output worth having, and recording a blank
  // measurement as though it were a clean one is the failure this field exists
  // to prevent.
  if (!out.trim()) {
    failed = true;
    out = 'detect produced NO OUTPUT — it did not run, or prints nothing. Not a usable detector.';
  }

  const trimmed = out.split('\n').filter((l) => l.trim()).slice(0, 12).join('\n').slice(0, 1500);
  const note = failed
    ? `detect did not run cleanly on ${today} — a detector that errors was never a detector:`
    : `${today}:`;
  const evidence = [`${TARGET}: |`, `  ${note}`, ...trimmed.split('\n').map((l) => `  ${l}`)].join('\n');

  // Insert directly after the detect block so the measurement sits with what
  // produced it.
  const lines = sig.block.split('\n');
  const detectAt = lines.findIndex((l) => new RegExp('^' + SOURCE + '\\s*:').test(l));
  if (detectAt < 0) {
    // Should be impossible -- the field was read from this same block -- but an
    // unfound line would silently insert the measurement at the TOP of the
    // signature, detached from what produced it. Say so instead.
    console.log(`#${issue.number}  SKIPPED — could not locate the ${SOURCE}: line to insert after`);
    continue;
  }
  let end = detectAt + 1;
  while (end < lines.length && /^\s+\S/.test(lines[end])) end++;
  const next = [...lines.slice(0, end), ...evidence.split('\n'), ...lines.slice(end)].join('\n');
  const newBody = issue.body.replace(sig.full, sig.full.replace(sig.block, next));

  if (dry) {
    console.log(`\n#${issue.number}  ${issue.title.slice(0, 62)}`);
    console.log(evidence.split('\n').map((l) => '    ' + l).join('\n'));
  } else {
    execFileSync('gh', ['issue', 'edit', String(issue.number), '--body', newBody], { encoding: 'utf8' });
    console.log(`#${issue.number}  evidence written${failed ? ' (detect ERRORED — recorded as such)' : ''}`);
  }
  if (failed) errored++;
  written++;
}

console.log(`\nran ${ran}  ${dry ? 'would write' : 'wrote'} ${written}  refused ${refused}  detect-errored ${errored}  skipped ${skipped}`);
