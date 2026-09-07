import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

/**
 * #970 — the runtime behind every unstable test must be the one we can see into.
 *
 * John: "this is most definitely an internal state issue. Put in trace points on
 * entry to functions, print the entry point to console along with parameter
 * values. Start from the point of failure and work backwards, then save the
 * trace (workflow) of each run; when there is a subsequent failure, compare a
 * good run's workflow with the failure. This will point us one step deeper into
 * the root cause."
 *
 * `wb.js` had 22 `dlog()` call sites. `wb-lazy.js` had ZERO — and wb-lazy is the
 * runtime driving the demo pages and the behaviors page, where every unstable
 * test lives. The one we most needed to see inside was the only one blind, and
 * its own `dlog` was sitting unused (the lint ratchet had been reporting it).
 *
 * What makes this testable rather than decorative is `WB.flowTrace()`: the trace
 * is a VALUE the page can hand back, not just console noise. That is what lets a
 * failing run be diffed against a good one, which is the whole point.
 */

const LAZY = 'src/core/wb-lazy.js';
const DEMO = '/demos/site/layout.html';

test.describe('#970: the lazy runtime records its own workflow', () => {
  test('trace points sit on entry points, not scattered', () => {
    const src = readFileSync(LAZY, 'utf8');
    const traced = [...src.matchAll(/^\s*flow\('([A-Za-z_$][\w$]*)'/gm)].map((m) => m[1]);

    expect(
      traced.length,
      `${LAZY} has no flow() trace points. It had zero for a long time while wb.js had 22,\n` +
      'and it is the runtime the unstable tests actually run against.',
    ).toBeGreaterThan(0);

    // The entry points that decide what gets built. If injection goes wrong,
    // the answer is in the sequence of these.
    for (const fn of ['scan', 'inject', 'lazyInject', 'observe']) {
      expect(traced, `no trace point on ${fn}() — a failing run cannot be followed through it`)
        .toContain(fn);
    }
  });

  test('the trace is a value the page returns, not only console output', () => {
    const src = readFileSync(LAZY, 'utf8');
    expect(
      /flowTrace\s*\(\s*\)\s*\{/.test(src),
      `${LAZY} no longer exposes flowTrace(). Console-only tracing cannot be captured, saved\n` +
      'or diffed, which is the entire ask: compare a good run against a failing one.',
    ).toBe(true);
  });

  test('a real page load produces a trace naming entry points and parameter values', async ({ page }) => {
    await page.goto(DEMO, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => (window as any).WB);

    const trace = await page.evaluate(() => {
      const WB = (window as any).WB;
      return typeof WB.flowTrace === 'function' ? WB.flowTrace() : null;
    });

    expect(trace, 'WB.flowTrace() is not callable on the running page').not.toBeNull();
    expect(
      Array.isArray(trace) && trace.length,
      'the page loaded and built behaviors but recorded no workflow — the runtime is blind again',
    ).toBeTruthy();

    // "entry point with parameter values", per the ask: `fn(args) <- caller`.
    const shaped = (trace as string[]).filter((l) => /^\w+\(.*\)\s*<-\s*\S+/.test(l));
    expect(
      shaped.length,
      'no trace line carries the fn(params) <- caller shape, so a diff between two runs\n' +
      `would not say WHAT differed. Sample: ${JSON.stringify((trace as string[]).slice(0, 3))}`,
    ).toBeGreaterThan(0);

    // The caller matters as much as the callee — the first version of
    // callerFrame() reported scan's own frame, so all 295 calls looked like they
    // came from one place and the trace said nothing about who asked.
    const distinctCallers = new Set(
      (trace as string[]).map((l) => (l.split('<-')[1] || '').trim()).filter(Boolean),
    );
    expect(
      distinctCallers.size,
      'every trace line reports the same caller, so the trace cannot distinguish call paths —\n' +
      'that is the bug callerFrame() was written to avoid.',
    ).toBeGreaterThan(1);
  });

  test('two loads of the same page produce comparable traces', async ({ page }) => {
    // The premise of the whole feature: a good run and a bad run are diffable.
    // If the shape were nondeterministic between identical loads, a diff would
    // be noise and the trace would be useless for the thing it exists for.
    const capture = async () => {
      await page.goto(DEMO, { waitUntil: 'domcontentloaded' });
      await page.waitForFunction(() => (window as any).WB?.flowTrace);
      return page.evaluate(() => (window as any).WB.flowTrace() as string[]);
    };

    const a = await capture();
    const b = await capture();

    const fnsOf = (t: string[]) => t.map((l) => l.split('(')[0]).filter(Boolean);
    const setA = new Set(fnsOf(a));
    const setB = new Set(fnsOf(b));

    expect(setA.size, 'the first load traced nothing').toBeGreaterThan(0);
    const onlyA = [...setA].filter((f) => !setB.has(f));
    const onlyB = [...setB].filter((f) => !setA.has(f));
    expect(
      [...onlyA, ...onlyB],
      'two identical loads traced DIFFERENT entry points, so a diff between a good run and a\n' +
      'failing one would report differences that mean nothing.',
    ).toEqual([]);
  });
});
