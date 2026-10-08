import { test, expect } from '../fixtures/offline';

/**
 * src/core/latest-wins.js — only the newest run of an async job may write.
 *
 * The router (#1519), the Behaviors panel render (#950/#771) and its doc panel
 * (#1488) each guarded "a slower, older run must not paint over a newer one"
 * with their own counter. They now share this guard; these checks pin down
 * what all three rely on. The user-facing races themselves stay covered by
 * navigation-latest-wins, doc-panel-never-shows-a-stale-doc and
 * behaviors-live-selector.
 */

test.beforeEach(async ({ page }) => {
  await page.goto('/tests/fixtures/blank.html');
});

test('a newer run makes every earlier run stale and aborts its signal', async ({ page }) => {
  const r = await page.evaluate(async () => {
    const { latestWins } = await import('/src/core/latest-wins.js');
    const job = latestWins();
    const first = job.begin();
    const before = { firstCurrent: first.isCurrent(), aborted: first.signal!.aborted };
    const second = job.begin();
    return {
      before,
      firstCurrent: first.isCurrent(),
      firstAborted: first.signal!.aborted,
      secondCurrent: second.isCurrent(),
      secondAborted: second.signal!.aborted,
      currentIsSecond: job.current() === second,
      ids: [first.id, second.id],
    };
  });
  expect(r.before).toEqual({ firstCurrent: true, aborted: false });
  expect(r.firstCurrent, 'an older run must stop being current').toBe(false);
  expect(r.firstAborted, "an older run's fetch must be aborted").toBe(true);
  expect(r.secondCurrent).toBe(true);
  expect(r.secondAborted).toBe(false);
  expect(r.currentIsSecond).toBe(true);
  expect(r.ids).toEqual([1, 2]);
});

test('the slower, older run finishing last does not win', async ({ page }) => {
  const painted = await page.evaluate(async () => {
    const { latestWins } = await import('/src/core/latest-wins.js');
    const job = latestWins();
    let screen = '';
    // Each run "fetches" for as long as it is told, then paints if still current.
    const show = async (name: string, wait: Promise<void>) => {
      const run = job.begin();
      await wait;
      if (run.isCurrent()) screen = name;
    };
    let releaseOld!: () => void;
    const oldDone = new Promise<void>((r) => { releaseOld = r; });
    const older = show('older', oldDone);
    const newer = show('newer', Promise.resolve());
    await newer;
    releaseOld(); // the older one finishes LAST
    await older;
    return screen;
  });
  expect(painted).toBe('newer');
});

test('a fetch passed a superseded signal is cancelled, and isAbort() says so', async ({ page }) => {
  const r = await page.evaluate(async () => {
    const { latestWins, isAbort } = await import('/src/core/latest-wins.js');
    const job = latestWins();
    const run = job.begin();
    const pending = fetch('/package.json', { signal: run.signal! }).then(() => 'loaded', (e) => (isAbort(e) ? 'aborted' : 'other'));
    job.begin();
    return { outcome: await pending, notAbort: isAbort(new Error('x')) };
  });
  expect(r.outcome).toBe('aborted');
  expect(r.notAbort).toBe(false);
});

test('cancel() supersedes every run without starting one', async ({ page }) => {
  const r = await page.evaluate(async () => {
    const { latestWins } = await import('/src/core/latest-wins.js');
    const job = latestWins();
    const run = job.begin();
    job.cancel();
    return { current: run.isCurrent(), aborted: run.signal!.aborted, latest: job.current() };
  });
  expect(r).toEqual({ current: false, aborted: true, latest: null });
});

test('both runtimes expose WB.latestWins() for page scripts', async ({ page }) => {
  const r = await page.evaluate(async () => {
    const lazy = (await import('/src/core/wb-lazy.js')).default;
    const full = (await import('/src/core/wb.js')).default;
    const a = lazy.latestWins();
    const b = full.latestWins();
    const ra = a.begin();
    b.begin();
    // Separate guards: one job's run does not supersede another's.
    return { lazy: typeof lazy.latestWins, full: typeof full.latestWins, independent: ra.isCurrent() };
  });
  expect(r).toEqual({ lazy: 'function', full: 'function', independent: true });
});
