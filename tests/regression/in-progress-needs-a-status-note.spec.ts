/**
 * ═══════════════════════════════════════════════════════════════════════════
 * A live in-progress claim with no status note is flagged (#1583)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * John, 2026-10-06: "add the check for in-progress issues with no note".
 * On 2026-10-05 six of twelve `status:in-progress` issues had no status
 * comment; the Issues page showed each as "No status posted" and nothing told
 * the claimer. The sweep (#1330) read every one of those timelines hourly and
 * only asked "silent for 6 hours?" -- so a claim with commits and PRs but no
 * note was "alive" and never mentioned.
 *
 * Tested as pure functions over synthetic timelines, as the release decision
 * is in in-progress-label-has-a-release-path.spec.ts: a test that needs
 * GitHub cannot assert on "ten minutes after the claim".
 */
import { test, expect } from '../fixtures/offline';
import {
  missingStatusNote, freshestSignal, latestClaimAt, NO_NOTE_MARKER, LABEL,
} from '../../scripts/sweep-in-progress.mjs';

const MIN = 60000;
const NOW = Date.parse('2026-10-06T02:00:00Z');
const GRACE = 10 * MIN;

/** A timeline event `m` minutes before NOW. */
const at = (m: number) => new Date(NOW - m * MIN).toISOString();
const claim = (m: number) => ({ event: 'labeled', label: { name: LABEL }, created_at: at(m) });
const unclaim = (m: number) => ({ event: 'unlabeled', label: { name: LABEL }, created_at: at(m) });
const comment = (m: number, body: string) => ({ event: 'commented', body, created_at: at(m) });
const commit = (m: number) => ({ event: 'committed', committer: { date: at(m) } });
const NOTE = '**Now:** step 1 done\n**Why:** x\n**See it:** y\n**Next:** z';

const CASES: Array<{ why: string; timeline: object[]; flag: boolean }> = [
  { why: 'claimed 3 minutes ago, no note yet -- inside the grace period', timeline: [claim(3)], flag: false },
  { why: 'claimed 12 minutes ago, no note -- the case #1583 exists for', timeline: [claim(12)], flag: true },
  { why: 'claimed 12 minutes ago with a note -- nothing to flag', timeline: [claim(12), comment(11, NOTE)], flag: false },
  {
    why: 'commits but no note -- alive to the release check, still unflagged before #1583',
    timeline: [claim(40), commit(20), commit(5)],
    flag: true,
  },
  {
    why: 'a plain comment that is not a status note does not count',
    timeline: [claim(30), comment(20, 'looking into it')],
    flag: true,
  },
  {
    why: 'a note from an OLDER claim does not cover the current one',
    timeline: [claim(300), comment(290, NOTE), unclaim(200), claim(30)],
    flag: true,
  },
  {
    why: 'already flagged for this claim -- one comment per claim, not one per hour',
    timeline: [claim(90), comment(80, NO_NOTE_MARKER + '\n### No status note')],
    flag: false,
  },
  {
    why: 'flagged for an older claim; the new claim gets its own flag',
    timeline: [claim(500), comment(490, NO_NOTE_MARKER), unclaim(400), claim(30)],
    flag: true,
  },
  { why: 'claim time not on the timeline and no note anywhere', timeline: [], flag: true },
];

test.describe('#1583 -- a live claim with no status note is flagged', () => {
  for (const c of CASES) {
    test(c.why, () => {
      expect(missingStatusNote(c.timeline, NOW, GRACE) !== null).toBe(c.flag);
    });
  }

  test('the flag reports how long ago the claim was staked', () => {
    expect(missingStatusNote([claim(12)], NOW, GRACE)).toEqual({ claimAt: NOW - 12 * MIN, minutes: 12 });
    expect(latestClaimAt([claim(300), unclaim(200), claim(30)])).toBe(NOW - 30 * MIN);
  });

  test("the sweep's own flag is not activity -- it must not keep a dead claim alive", () => {
    // Claimed 10 hours ago; the only later event is the sweep's flag. The
    // release check must still see 10 hours of silence, not a fresh comment.
    const signal = freshestSignal([claim(600), comment(5, NO_NOTE_MARKER + '\n### No status note')]);
    expect(signal?.why).toBe('the label went on');
    expect(signal?.at).toBe(NOW - 600 * MIN);
  });

  test('the flag comment cannot itself read as a status note', async () => {
    // If it contained the bold "Now:" label, the Issues page would paint the
    // flag as the issue's status, and the next sweep would count it as one.
    const src = (await import('node:fs')).readFileSync('scripts/sweep-in-progress.mjs', 'utf8');
    const body = src.slice(src.indexOf('function noNoteComment'), src.indexOf('function describeWhen'));
    expect(body).not.toMatch(/\*\*Now:\*\*/);
    expect(body).toContain('NO_NOTE_MARKER');
  });
});
