import { test, expect } from '../fixtures/offline';
import { allSleeps, sleepsIn, specFiles, MARKER } from '../../scripts/lib/test-sleeps.mjs';

/**
 * A test waits on the condition it needs, not on a clock (#1516).
 *
 * A fixed sleep is a guess about how fast the machine is: it passes on an idle
 * box and fails on a loaded one, which is #961's signature ("passes alone,
 * fails under load"). On 2026-10-06, 202 of 798 spec files held 426 sleeps;
 * the first pass (#1516) took that to 345 and the positive ones from 88 to 68.
 * scripts/audit-test-sleeps.mjs classifies every one by what follows it
 * (scripts/lib/test-sleeps.mjs):
 *
 *   positive   sleep, then a one-time check that something IS true -- the defect
 *   redundant  sleep, then a retrying assertion that already waits -- delete it
 *   setup      a "let it settle" sleep before an action or in a helper
 *   negative   sleep, then a check that nothing happened
 *   marked     `// sleep-proves-negative: <reason>` -- a reviewed negative proof
 *
 * RATCHET, NOT A CLIFF. The counts below are today's, and they may only go
 * down: lower a ceiling in the commit that removes sleeps; never raise one to
 * go green. A sleep that genuinely has to wait (proving something does NOT
 * happen, where there is no event to wait for) carries the marker with its
 * reason, on its own line or the line above, and is not counted.
 *
 * Fix patterns, all already in the suite:
 *   - a retrying matcher: `await expect(locator).toHaveClass(/is-open/)`
 *   - `await expect.poll(read).toBe(true)`, where read() asks the browser for the state
 *   - `elementReady(locator)` / `buildInView(locator)` in tests/base.ts
 */
const CEILING = {
  positive: 68,
  redundant: 0,
  setup: 213,
  negative: 64,
};

test.describe('no new fixed sleeps (#1516)', () => {
  const sleeps = allSleeps(process.cwd());
  const count = (cls: string) => sleeps.filter((s) => s.class === cls).length;

  test('the scan reads the suite', () => {
    // An audit that reads nothing meets every ceiling.
    expect(specFiles(process.cwd()).length, 'spec files found').toBeGreaterThan(500);
    expect(sleeps.length, 'sleeps found').toBeGreaterThan(50);
  });

  for (const [cls, ceiling] of Object.entries(CEILING)) {
    test(`${cls} sleeps do not grow past ${ceiling}`, () => {
      const now = count(cls);
      const where = sleeps.filter((s) => s.class === cls).slice(-10).map((s) => `${s.file}:${s.line}`).join('\n  ');
      expect(now, `${cls} sleeps rose to ${now}, above the ${ceiling} ceiling. Wait on the condition instead `
        + `(run node scripts/audit-test-sleeps.mjs --class ${cls} --list). If it is a negative proof, mark it `
        + `"// ${MARKER} <reason>". Do not raise the ceiling to go green.\n  ${where}`).toBeLessThanOrEqual(ceiling);
    });
  }

  test('every marked sleep says why', () => {
    const bare = sleeps.filter((s) => s.class === 'marked' && String(s.reason || '').length < 10).map((s) => `${s.file}:${s.line}`);
    expect(bare, `"${MARKER}" needs a reason of at least a few words`).toEqual([]);
  });

  test('the classifier sorts each shape', () => {
    // The fixture's page is named "p": tests-must-assert reads a spec's text,
    // and would take sample "page.<locator>" calls for a spec that never navigates.
    const src = `
      test('t', async ({ page: p }) => {
        await p.click('#a');
        await p.waitForTimeout(300);
        const open = await p.evaluate(() => !!document.querySelector('.open'));
        expect(open).toBe(true);
        await p.waitForTimeout(300);
        await expect(p.locator('.open')).toBeVisible();
        await p.waitForTimeout(300);
        await p.click('#b');
        await expect(p.locator('.b')).toBeVisible();
        await p.waitForTimeout(300);
        await expect(p.locator('.err')).not.toBeVisible();
        // ${MARKER} nothing may fire within the debounce window
        await p.waitForTimeout(300);
        await p.evaluate(() => new Promise((r) => setTimeout(r, 50)));
      });
      // await p.waitForTimeout(999) in a comment is not a sleep
      const s = 'p.waitForTimeout(999)';
    `;
    expect(sleepsIn('fixture.spec.ts', src).map((s) => s.class))
      .toEqual(['positive', 'redundant', 'setup', 'negative', 'marked', 'setup']);
  });
});
