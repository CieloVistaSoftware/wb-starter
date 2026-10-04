/**
 * ═══════════════════════════════════════════════════════════════════════════
 * `status:in-progress` must be releasable, and the release must be correct (#1330)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * John, looking at the issues page: "Add a new button to show current working
 * on issues." The button was already there — **In Progress**, reading
 * `status:in-progress` — and it listed twelve issues on which, measured the
 * same day, nobody was working at all. He could not recognise the feature
 * because it had never once shown him the truth.
 *
 * The label had an apply path and no release path. Every session that died
 * mid-work left its label on forever.
 *
 * Two things are guarded here, because fixing one without the other leaves the
 * tab wrong:
 *
 *   1. a release path EXISTS at all — the issue's own `detect`;
 *   2. the release DECIDES CORRECTLY — the sweep must not drop a label off an
 *      issue somebody is working on, which would be worse than the bug.
 *
 * The decision is tested as a pure function over synthetic timelines rather
 * than against GitHub: a test that needs the network cannot assert on "nobody
 * commented for seven hours" without waiting seven hours.
 */
import { test, expect } from '../fixtures/offline';
import { readFileSync, readdirSync } from 'node:fs';
import { freshestSignal, isStale, LABEL, DEFAULT_HOURS } from '../../scripts/sweep-in-progress.mjs';

const HOUR = 3600000;
const NOW = Date.parse('2026-10-03T22:00:00Z');
const THRESHOLD = 6 * HOUR;

/** A timeline event `h` hours before NOW. */
const at = (h: number) => new Date(NOW - h * HOUR).toISOString();

const claim = (h: number) => ({ event: 'labeled', label: { name: LABEL }, created_at: at(h) });
const otherLabel = (h: number) => ({ event: 'labeled', label: { name: 'priority:2' }, created_at: at(h) });
const comment = (h: number) => ({ event: 'commented', created_at: at(h) });
const commit = (h: number) => ({ event: 'committed', committer: { date: at(h) } });

/**
 * Every case is (timeline, expected) with a reason, so a failure names the
 * judgement that went wrong rather than an index.
 */
const CASES: Array<{ why: string; timeline: object[]; stale: boolean }> = [
  {
    why: 'just claimed, nothing else yet — the common case for work that has only just begun',
    timeline: [claim(0.5)],
    stale: false,
  },
  {
    why: 'claimed yesterday, silent ever since — the exact state of all twelve issues on 2026-10-03',
    timeline: [claim(30)],
    stale: true,
  },
  {
    why: 'claimed long ago but reported on an hour ago — a live session on a long job',
    timeline: [claim(30), comment(1)],
    stale: false,
  },
  {
    why: 'claimed and last commented long ago, but a commit landed two hours ago',
    timeline: [claim(30), comment(28), commit(2)],
    stale: false,
  },
  {
    why: 'an empty timeline cannot evidence a live session',
    timeline: [],
    stale: true,
  },
  {
    why: 'being given some OTHER label is housekeeping, not work, and must not keep a dead claim alive',
    timeline: [claim(30), otherLabel(0.1)],
    stale: true,
  },
  {
    why: 'exactly at the threshold is still alive — the boundary belongs to the session',
    timeline: [claim(6)],
    stale: false,
  },
  {
    why: 'a minute past the threshold is stale',
    timeline: [claim(6.1)],
    stale: true,
  },
];

for (const c of CASES) {
  test(`#1330 staleness: ${c.why}`, () => {
    const signal = freshestSignal(c.timeline);
    expect(isStale(signal, NOW, THRESHOLD), c.why).toBe(c.stale);
  });
}

test('#1330 a commit event is dated from its committer, not from a created_at it does not have', () => {
  // GitHub's timeline gives `committed` events no `created_at`. Reading only
  // created_at silently discards every commit, so an issue whose only sign of
  // life is landed code looks abandoned.
  const signal = freshestSignal([commit(2)]);
  expect(signal, 'a committed event produced no signal at all').not.toBeNull();
  expect(isStale(signal, NOW, THRESHOLD)).toBe(false);
});

test('#1330 the label has a release path, not only an apply path', () => {
  // The issue's own detect: before the fix this search returned nothing, and
  // an empty result WAS the bug.
  const roots = ['.github/workflows', 'scripts'];
  const hits: string[] = [];
  for (const dir of roots) {
    let names: string[] = [];
    try {
      names = readdirSync(dir);
    } catch {
      continue;
    }
    for (const f of names) {
      if (!/\.(ya?ml|mjs|js)$/.test(f)) continue;
      const text = readFileSync(`${dir}/${f}`, 'utf8');
      // An apply-only mention is not a release path: it must take the label OFF.
      if (text.includes(LABEL) && /--remove-label|removeLabel|remove-label/.test(text)) {
        hits.push(`${dir}/${f}`);
      }
    }
  }
  expect(
    hits,
    `nothing in .github/workflows or scripts removes ${LABEL}; the label can only accumulate`,
  ).not.toEqual([]);
});

test('#1330 the sweep is scheduled, so nobody has to remember to run it', () => {
  const wf = readFileSync('.github/workflows/in-progress-sweep.yml', 'utf8');
  expect(wf, 'the sweep has no schedule').toMatch(/schedule:/);
  expect(wf, 'the sweep cannot write labels').toMatch(/issues:\s*write/);
  // A sweep that two runs enter at once double-comments and races its own
  // label removals.
  expect(wf, 'concurrent runs are not prevented').toMatch(/concurrency:/);
});

test('#1330 the default threshold is hours, not days', () => {
  // A day-long threshold would have called every one of the twelve stale
  // issues alive for most of the day John was looking at them.
  expect(DEFAULT_HOURS).toBeGreaterThan(0);
  expect(DEFAULT_HOURS, 'a threshold of a day or more defeats the purpose').toBeLessThan(24);
});
