#!/usr/bin/env node
/**
 * sweep-in-progress.mjs — give `status:in-progress` a release path (#1330)
 *
 * THE HOLE THIS CLOSES
 *
 * A session applies `status:in-progress` when it starts an issue. Removing it
 * depends on that same session surviving to the end. Sessions do not always:
 * context runs out, the machine reboots, the work is abandoned. Every session
 * that dies leaves its label behind, and nothing in the repo ever took one
 * off — thirteen workflows maintain other label hygiene, none touched this.
 *
 * Measured 2026-10-03: twelve issues carried the label, zero were being worked
 * on, seven had never had a status comment posted, and the newest commit
 * touching any of them was about 21 hours old. John read the In Progress tab,
 * saw twelve issues and nothing moving, and asked for a button to show what is
 * actually being worked on — the button was already there, and lying.
 *
 * WHAT COUNTS AS ALIVE
 *
 * A live session reports. `.claude/CLAUDE.md` requires a status comment at
 * every step, so silence across every channel is the signal:
 *
 *   - the moment the label itself went on       (just-started work has no comment yet)
 *   - the newest comment                        (the status posts)
 *   - the newest commit or PR referencing it    (work landing without a comment)
 *
 * The freshest of those is the issue's heartbeat. Older than the threshold and
 * the label is released.
 *
 * WHY IT COMMENTS WHEN IT RELEASES
 *
 * Removing a label silently reads as "someone finished". The sweep says what
 * it did and why, so a released issue is visibly un-owned rather than
 * mysteriously un-labelled, and whoever picks it up knows it was dropped, not
 * done.
 *
 * WHY IT ALSO CHECKS FOR A STATUS NOTE (#1583)
 *
 * A claim can be alive -- commits, PRs -- and still never say what it is
 * doing. `.claude/CLAUDE.md` requires a status comment (Now / Why / See it /
 * Next) when work starts; the Issues page paints a claim without one red, and
 * on 2026-10-05 six of twelve claims were red with nobody told. So a live
 * claim older than the grace period with no status note since the label went
 * on gets ONE comment saying so. It is a flag, not a release: the work may be
 * real. The flag carries a marker so it neither repeats nor counts as
 * activity -- otherwise the sweep's own comment would keep a dead claim alive.
 *
 * Usage:
 *   node scripts/sweep-in-progress.mjs                 release stale labels
 *   node scripts/sweep-in-progress.mjs --dry-run       report, change nothing
 *   node scripts/sweep-in-progress.mjs --hours 12      a different threshold
 *   node scripts/sweep-in-progress.mjs --note-minutes 30   a different grace for the note
 *   node scripts/sweep-in-progress.mjs --json          machine-readable report
 */
import { execFileSync } from 'node:child_process';

export const LABEL = 'status:in-progress';
export const DEFAULT_HOURS = 6;
export const DEFAULT_NOTE_MINUTES = 10;

/** Marks the sweep's own "no status note" comment (#1583). */
export const NO_NOTE_MARKER = '<!-- in-progress-sweep:no-status-note -->';

/** A status note, as the Issues page reads it: a bold "Now:" line. */
const STATUS_NOTE = /\*\*Now:\*\*/;

/**
 * The timeline event types that mean somebody did something about this issue.
 *
 * `labeled` is filtered to this label by the caller: being given some other
 * label is housekeeping, not work, and must not keep a dead claim alive.
 */
const WORK_EVENTS = new Set([
  'commented',
  'committed',
  'referenced',
  'cross-referenced',
  'connected',
  'head_ref_force_pushed',
  'review_requested',
  'renamed',
  'reopened',
]);

/**
 * The freshest moment anything happened on this issue, as epoch milliseconds,
 * or null when the timeline says nothing at all.
 *
 * Pure, so the decision can be tested without the network — the reason this is
 * exported rather than inlined into the sweep loop.
 *
 * @param {Array<object>} timeline  GitHub issue timeline events
 * @returns {{at: number, why: string}|null}
 */
export function freshestSignal(timeline) {
  let best = null;
  for (const ev of timeline || []) {
    const kind = String(ev.event || '');

    // Being labelled with THIS label is the claim being staked: it is the
    // heartbeat for work that has only just begun and has no comment yet.
    const isClaim = kind === 'labeled'
      && String(ev.label?.name || '').trim().toLowerCase() === LABEL;
    if (!isClaim && !WORK_EVENTS.has(kind)) continue;
    // The sweep's own flag is not somebody working (#1583).
    if (kind === 'commented' && String(ev.body || '').includes(NO_NOTE_MARKER)) continue;

    // A commit event carries its date on the committer, not on the event.
    const iso = ev.created_at || ev.committer?.date || ev.author?.date;
    const at = Date.parse(iso || '');
    if (!Number.isFinite(at)) continue;

    if (!best || at > best.at) {
      best = { at, why: isClaim ? 'the label went on' : describe(kind) };
    }
  }
  return best;
}

function describe(kind) {
  if (kind === 'commented') return 'the last comment';
  if (kind === 'committed') return 'the last commit';
  if (kind === 'referenced' || kind === 'cross-referenced' || kind === 'connected') {
    return 'the last commit or PR referencing it';
  }
  return 'the last activity (' + kind + ')';
}

/**
 * When the current claim was staked: the newest time THIS label went on, as
 * epoch ms, or null when the timeline does not show it.
 *
 * @param {Array<object>} timeline
 */
export function latestClaimAt(timeline) {
  let at = null;
  for (const ev of timeline || []) {
    if (ev.event !== 'labeled') continue;
    if (String(ev.label?.name || '').trim().toLowerCase() !== LABEL) continue;
    const t = Date.parse(ev.created_at || '');
    if (Number.isFinite(t) && (at === null || t > at)) at = t;
  }
  return at;
}

/**
 * Does this claim need the "no status note" flag (#1583)?
 *
 * Yes when the claim is older than the grace period and no comment since the
 * claim is a status note -- and the sweep has not already flagged this claim.
 * A claim the timeline cannot date is measured from the beginning: the label
 * is on, so some note should exist.
 *
 * @param {Array<object>} timeline
 * @param {number} now          epoch ms
 * @param {number} graceMs
 * @returns {{claimAt: number|null, minutes: number|null}|null}  null = nothing to flag
 */
export function missingStatusNote(timeline, now, graceMs) {
  const claimAt = latestClaimAt(timeline);
  if (claimAt !== null && now - claimAt < graceMs) return null;
  const since = claimAt === null ? -Infinity : claimAt;
  for (const ev of timeline || []) {
    if (ev.event !== 'commented') continue;
    const t = Date.parse(ev.created_at || '');
    if (!Number.isFinite(t) || t < since) continue;
    const body = String(ev.body || '');
    if (body.includes(NO_NOTE_MARKER)) return null;   // already flagged this claim
    if (STATUS_NOTE.test(body)) return null;          // a note exists
  }
  return { claimAt, minutes: claimAt === null ? null : Math.round((now - claimAt) / 60000) };
}

/**
 * Should the label come off?
 *
 * A timeline with no signal at all is stale: the label is on the issue, so
 * SOMETHING put it there, and a timeline that cannot show even that is not
 * evidence of a live session.
 *
 * @param {{at: number}|null} signal  from freshestSignal()
 * @param {number} now                epoch ms
 * @param {number} thresholdMs
 */
export function isStale(signal, now, thresholdMs) {
  if (!signal) return true;
  return now - signal.at > thresholdMs;
}

/** Hours, rounded to one decimal, for the report. */
export function hoursSince(at, now) {
  return Math.round(((now - at) / 3600000) * 10) / 10;
}

// ── everything below talks to GitHub ────────────────────────────────────────

function gh(args) {
  return execFileSync('gh', args, { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
}

function repoSlug() {
  return gh(['repo', 'view', '--json', 'nameWithOwner', '-q', '.nameWithOwner']).trim();
}

function openInProgress(slug) {
  const raw = gh([
    'issue', 'list', '--repo', slug, '--state', 'open',
    '--label', LABEL, '--limit', '200', '--json', 'number,title',
  ]);
  return JSON.parse(raw);
}

function timelineFor(slug, number) {
  try {
    return JSON.parse(gh([
      'api', '--paginate', `repos/${slug}/issues/${number}/timeline`,
      '-H', 'Accept: application/vnd.github+json',
    ]));
  } catch {
    return [];
  }
}

function releaseNote(signal, now, hours) {
  const when = signal
    ? `The freshest signal on this issue is ${describeWhen(signal, now)}.`
    : 'This issue has no recorded activity at all since the label went on.';
  return [
    '### `status:in-progress` released automatically',
    '',
    'Nobody is working on this. It is **not** finished — the label was dropped, not the work.',
    '',
    when,
    '',
    `A session working an issue posts a status at every step, so ${hours} hours of silence`,
    'across comments, commits and references means the session that claimed this one ended',
    'without releasing it. Leaving the label on makes the **In Progress** tab claim work that',
    'is not happening (#1330).',
    '',
    'Anyone picking this up: re-apply the label when you start.',
  ].join('\n');
}

function noNoteComment(missing) {
  const when = missing.minutes === null
    ? 'The label is on, but the timeline does not show when it went on.'
    : `The label went on ${missing.minutes} minutes ago.`;
  return [
    NO_NOTE_MARKER,
    '### No status note on this in-progress issue',
    '',
    `${when} Since then, no comment has said what is being done. The Issues page shows this`,
    'row in red as "No status posted" (#1583).',
    '',
    'Whoever is working this: post a status comment with four bold-label lines, as',
    '`.claude/CLAUDE.md` describes -- **Now** (what has been done), **Why**, **See it**',
    '(exactly what to open or click to see the fix, or "nothing to see yet") and **Next**.',
    'If nobody is working it, take `status:in-progress` off.',
    '',
    'This is a flag, not a release: the label stays on.',
  ].join('\n');
}

function describeWhen(signal, now) {
  return `${signal.why}, ${hoursSince(signal.at, now)} hours ago`;
}

async function main() {
  const argv = process.argv.slice(2);
  const dryRun = argv.includes('--dry-run');
  const asJson = argv.includes('--json');
  const hoursArg = argv.indexOf('--hours');
  const hours = hoursArg >= 0 ? Number(argv[hoursArg + 1]) : DEFAULT_HOURS;
  if (!Number.isFinite(hours) || hours <= 0) {
    console.error('--hours needs a positive number');
    process.exit(2);
  }
  const thresholdMs = hours * 3600000;
  const noteArg = argv.indexOf('--note-minutes');
  const noteMinutes = noteArg >= 0 ? Number(argv[noteArg + 1]) : DEFAULT_NOTE_MINUTES;
  if (!Number.isFinite(noteMinutes) || noteMinutes < 0) {
    console.error('--note-minutes needs a number of minutes');
    process.exit(2);
  }
  const now = Date.now();

  const slug = repoSlug();
  const issues = openInProgress(slug);
  const report = { repo: slug, hours, noteMinutes, scanned: issues.length, released: [], alive: [], noNote: [] };

  for (const issue of issues) {
    const timeline = timelineFor(slug, issue.number);
    const signal = freshestSignal(timeline);
    const row = {
      number: issue.number,
      title: issue.title,
      quietHours: signal ? hoursSince(signal.at, now) : null,
      signal: signal ? signal.why : 'nothing on the timeline',
    };

    if (!isStale(signal, now, thresholdMs)) {
      report.alive.push(row);
      const missing = missingStatusNote(timeline, now, noteMinutes * 60000);
      if (missing) {
        const flag = { number: issue.number, title: issue.title, claimedMinutesAgo: missing.minutes };
        report.noNote.push(flag);
        if (!dryRun) {
          try {
            gh(['issue', 'comment', String(issue.number), '--repo', slug, '--body', noNoteComment(missing)]);
          } catch (err) {
            flag.error = String(err.message || err).split('\n')[0];
          }
        }
      }
      continue;
    }

    report.released.push(row);
    if (dryRun) continue;

    // Comment BEFORE removing, so the issue never sits un-labelled with no
    // explanation — a reader arriving between the two calls still sees why.
    try {
      gh(['issue', 'comment', String(issue.number), '--repo', slug,
        '--body', releaseNote(signal, now, hours)]);
      gh(['issue', 'edit', String(issue.number), '--repo', slug, '--remove-label', LABEL]);
    } catch (err) {
      row.error = String(err.message || err).split('\n')[0];
    }
  }

  if (asJson) {
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  const verb = dryRun ? 'would release' : 'released';
  console.log(`${LABEL}: ${report.scanned} labelled, ${report.alive.length} alive, ${verb} ${report.released.length}`);
  for (const r of report.released) {
    const quiet = r.quietHours === null ? 'no signal' : `${r.quietHours}h quiet`;
    console.log(`  #${r.number}  ${quiet} (${r.signal})${r.error ? '  FAILED: ' + r.error : ''}`);
  }
  for (const r of report.alive) {
    console.log(`  #${r.number}  alive, ${r.quietHours}h since ${r.signal}`);
  }
  const flagVerb = dryRun ? 'would flag' : 'flagged';
  console.log(`no status note: ${flagVerb} ${report.noNote.length}`);
  for (const r of report.noNote) {
    const age = r.claimedMinutesAgo === null ? 'claim time unknown' : `claimed ${r.claimedMinutesAgo} min ago`;
    console.log(`  #${r.number}  ${age}${r.error ? '  FAILED: ' + r.error : ''}`);
  }
}

// Importable for tests; only sweeps when run directly.
if (process.argv[1] && process.argv[1].endsWith('sweep-in-progress.mjs')) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
