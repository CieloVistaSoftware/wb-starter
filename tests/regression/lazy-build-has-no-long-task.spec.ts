import { test, expect, Page } from '../fixtures/offline';
import { buildInView, settlePage } from '../base';

/**
 * #961 / the lazy runtime's build must not freeze the page.
 *
 * card-variant-surface.spec.ts failed 2-3 runs in 6, locally and on CI, and
 * every failure looked the same: `locator.evaluate()` never answered within
 * the poll's 5s. A PerformanceObserver('longtask') on the same flow showed ONE
 * main-thread task of 1.4s to 4.5s on tests/fixtures/cards-permutation-matrix.html,
 * while every other task was under 0.5s. The page could not paint or answer
 * anything until it ended.
 *
 * It was the lazy runtime (src/core/wb-lazy.js) building everything near the
 * viewport in one go. Each WB.inject() awaits its behavior module, and a cached
 * module resolves as a microtask, so hundreds of injections, the
 * MutationObserver deliveries they caused (each forcing a style recalc through
 * getComputedStyle), every demo's source parsing and doc links, and the
 * per-<pre> line-number measurements all ran inside a single microtask
 * checkpoint. The always-on flow() trace captured a stack per call on top.
 * The fix gives the task back in budgeted slices (src/core/main-thread-budget.js).
 *
 * THE BUDGETS, from measurements on a 4-core machine at load average ~11,
 * 4 workers (2026-10-08):
 *
 *   longest task, matrix fixture   main: 1366-4547ms (every run, ~20 runs)
 *                                  fixed: 113-445ms
 *   longest task, cards.html       main: 293-649ms   fixed: 116-481ms
 *   longest script entry (LoAF)    main: 356-880ms on cards.html, seconds on the matrix
 *                                  fixed: 56-110ms
 *
 * What remains above 100ms after the fix is the browser's own style and layout
 * of a page with thousands of elements ("(program)" in a CPU profile, no
 * script on the stack), which no runtime change can slice. Hence two budgets:
 *
 *   TASK_BUDGET_MS = 1000: a whole task, script plus the browser's rendering.
 *     Twice the worst fixed task, and still below the SMALLEST injection task
 *     main ever produced, so the matrix page fails on main every time.
 *   SCRIPT_BUDGET_MS = 500: one script entry point and the microtasks it ran,
 *     from the Long Animation Frames API, which attributes time to scripts.
 *     The runtime's slice is 50ms and the worst entry measured at 4 workers
 *     was ~110ms; at 6 workers on the same loaded machine, page-boot module
 *     evaluation (site-engine.js, index.js) reached 260-325ms with no
 *     injection loop involved, so 250ms would fail on the machine, not the
 *     code. 500ms still fails main's matrix checkpoint by seconds.
 *     (Skipped where the browser has no LoAF.)
 *   ANSWER_BUDGET_MS = 1000: every evaluate sent while the page builds is
 *     answered within this, the symptom the original test died of.
 */

const TASK_BUDGET_MS = 1000;
const SCRIPT_BUDGET_MS = 500;
const ANSWER_BUDGET_MS = 1000;

const PAGES = [
  { url: '/tests/fixtures/cards-permutation-matrix.html', card: '#card-variant-variants article[variant="bordered"]' },
  { url: '/demos/site/cards.html', card: 'article[variant="bordered"]' },
];

type Timing = { start: number; duration: number; what?: string };

async function recordMainThread(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const w = window as any;
    w.__longTasks = [];
    w.__longScripts = [];
    w.__loafSupported = PerformanceObserver.supportedEntryTypes.includes('long-animation-frame');
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) w.__longTasks.push({ start: Math.round(e.startTime), duration: Math.round(e.duration) });
    }).observe({ type: 'longtask', buffered: true });
    if (w.__loafSupported) {
      new PerformanceObserver((list) => {
        for (const frame of list.getEntries() as any[]) {
          for (const s of frame.scripts || []) {
            w.__longScripts.push({
              start: Math.round(s.startTime),
              duration: Math.round(s.duration),
              what: `${s.invoker} (${String(s.sourceURL || '').split('/').pop()})`,
            });
          }
        }
      }).observe({ type: 'long-animation-frame', buffered: true });
    }
  });
}

const worst = (list: Timing[]): Timing => list.reduce((a, b) => (b.duration > a.duration ? b : a), { start: 0, duration: 0 });

async function expectWithinBudgets(page: Page, answers: number[]): Promise<void> {
  const { tasks, scripts, loaf } = await page.evaluate(() => ({
    tasks: (window as any).__longTasks as Timing[],
    scripts: (window as any).__longScripts as Timing[],
    loaf: (window as any).__loafSupported as boolean,
  }));

  const task = worst(tasks);
  expect(
    task.duration,
    `a single main-thread task ran ${task.duration}ms (budget ${TASK_BUDGET_MS}ms) at ${task.start}ms. ` +
    `The page can neither paint nor answer anything for that long. All long tasks: ${JSON.stringify(tasks.map((t) => t.duration))}`,
  ).toBeLessThanOrEqual(TASK_BUDGET_MS);

  if (loaf) {
    const script = worst(scripts);
    expect(
      script.duration,
      `one script entry point ran ${script.duration}ms (budget ${SCRIPT_BUDGET_MS}ms): ${script.what}. ` +
      'Work resumed by cached promises runs in one microtask checkpoint unless it yields ' +
      '(src/core/main-thread-budget.js).',
    ).toBeLessThanOrEqual(SCRIPT_BUDGET_MS);
  }

  expect(answers.length, 'no evaluate was answered while the page built').toBeGreaterThan(0);
  expect(
    Math.max(...answers),
    `an evaluate sent while the page built took ${Math.max(...answers)}ms to answer (budget ${ANSWER_BUDGET_MS}ms)`,
  ).toBeLessThanOrEqual(ANSWER_BUDGET_MS);
}

/** Ask the page a trivial question, back to back, until `work` finishes. */
async function answersDuring(page: Page, work: () => Promise<void>): Promise<number[]> {
  const answers: number[] = [];
  let building = true;
  const pinger = (async () => {
    while (building) {
      const sent = Date.now();
      // A redirect destroys the context mid-question; that is not an answer.
      const ok = await page.evaluate(() => 1).then(() => true, () => false);
      if (ok) answers.push(Date.now() - sent);
    }
  })();
  try {
    await work();
  } finally {
    building = false;
    await pinger;
  }
  return answers;
}

for (const { url, card } of PAGES) {
  test(`building a card in view on ${url} never blocks the main thread past budget`, async ({ page }) => {
    await recordMainThread(page);
    await page.goto(url);
    const answers = await answersDuring(page, async () => {
      await buildInView(page.locator(card).first());
      await page.evaluate(async () => { await (window as any).WB.whenIdle(); });
    });
    await expectWithinBudgets(page, answers);
  });
}

// The SPA's demos page runs the OTHER runtime (src/core/wb.js, not wb-lazy.js)
// and builds its x-cardlink grid on load. A CI run of no-runtime-warning-leaks
// timed out waiting for `body` there (PR #1726), so it is held to the same
// budgets, both directly and through the /pages/demos.html redirect. Measured
// on main and with this fix: longest task 50-213ms, longest script entry
// under 175ms -- no long injection task on this page, so this is a guard, not
// a reproduction.
for (const url of ['/?page=demos', '/pages/demos.html']) {
  test(`loading the demos page via ${url} never blocks the main thread past budget`, async ({ page }) => {
    await recordMainThread(page);
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    const answers = await answersDuring(page, async () => {
      await settlePage(page, { timeout: 15000 });
      await expect(page.locator('#demos-hero')).toBeAttached();
      await expect(page.locator('[x-cardlink]').first()).toBeAttached();
      await settlePage(page, { timeout: 15000 });
    });
    await expectWithinBudgets(page, answers);
  });
}
