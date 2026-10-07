import { test, expect } from '../fixtures/offline';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Every behavior survives having its example buttons clicked (#778)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * John, from the site's own error log:
 *
 *   Uncaught TypeError: document.getElementById(...).open is not a function
 *     at HTMLButtonElement.onclick
 *
 * `open` on <dialog> and <details> is a boolean PROPERTY, not a method.
 * `el.open()` throws; `el.open = true` is the accessor. Two docs ship the
 * broken call and render it live in the showcase:
 *
 *   docs/behaviors-reference.md:226
 *   docs/behaviors/dialog.md:48
 *
 * Every other gate passed while this shipped, because nothing CLICKED anything.
 * The example renders, the behavior applies, the markup is correct — the error
 * only exists once a person presses the button. That is the gap this closes.
 *
 * WHAT IS ASSERTED
 *
 * For every behavior in the showcase: render its example, press every button
 * inside it, and require that no uncaught exception reaches the page. Nothing
 * about what the button should DO — only that pressing it is not an error.
 * A behavior whose button silently does nothing is a different failure
 * (no-inert-behaviors.spec.ts, #781); this one catches the buttons that throw.
 *
 * WHY THE CLICK IS PROGRAMMATIC
 *
 * `el.click()` rather than a pointer click. A real pointer click can be
 * intercepted by an overlay a previous example left open, which would report a
 * Playwright timeout instead of the behavior's own error. Programmatic clicks
 * still fire inline `onclick` handlers — which is exactly the code path that
 * threw here — without depending on what is painted on top.
 */

/** Buttons pressed per behavior. Enough to reach the trigger in every example
 *  on the page today; a cap so one pathological example cannot dominate. */
const MAX_BUTTONS_PER_BEHAVIOR = 4;

/**
 * The sweep runs as PARTS tests, part p taking every row i with i % PARTS === p.
 * As one test it outgrew its 15-minute budget on the Windows CI runner once
 * every behavior gained 5+ examples (#997): 6 minutes locally, past 15 on CI.
 * The parts run in parallel (fullyParallel) and each has the full budget. Two,
 * not more: CI runs 4 workers, and four of these heavy pages at once starved
 * the other tests sharing the runner (#1290).
 */
const PARTS = 2;

type Failure = { behavior: string; button: string; message: string };

test.describe('Behavior examples handle button clicks (#778)', () => {
  for (let part = 0; part < PARTS; part++) {
    test(`no button in any behavior example throws when pressed (part ${part + 1} of ${PARTS})`, async ({ page }) => {
      test.setTimeout(900_000);

      const failures: Failure[] = [];
      let currentBehavior = '(before first selection)';
      let currentButton = '(none)';

      page.on('pageerror', (err) => {
        failures.push({
          behavior: currentBehavior,
          button: currentButton,
          message: String(err && err.message ? err.message : err),
        });
      });

      // Load (or reload) the showcase. A form an example submits would
      // navigate away mid-sweep, so submits are stopped at the document.
      const loadShowcase = async () => {
        await page.goto('/?page=behaviors');
        await page.waitForFunction(() => Boolean((window as any).WB), { timeout: 30_000 });
        await page.waitForFunction(
          () => document.querySelectorAll('.behaviors-search-results__row').length > 100,
          { timeout: 30_000 },
        );
        await page.evaluate(() => document.addEventListener('submit', (e) => e.preventDefault(), true));
      };
      await loadShowcase();

      const rowCount = await page.evaluate(
        () => document.querySelectorAll('.behaviors-search-results__row').length,
      );
      expect(rowCount, 'showcase listed no behaviors — the sweep would pass vacuously')
        .toBeGreaterThan(100);

      let clicked = 0;
      let examined = 0;

      for (let i = part; i < rowCount; i += PARTS) {
        try {
          // Select the behavior. Its example renders into #behaviors-live-example.
          const label = await page.evaluate((index) => {
            const rows = [...document.querySelectorAll('.behaviors-search-results__row')] as HTMLElement[];
            const row = rows[index];
            if (!row) return null;
            row.click();
            return (row.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 60);
          }, i);

          if (label === null) continue;
          currentBehavior = label;
          currentButton = '(rendering)';

          // Wait for the example to build rather than guessing a duration —
          // behaviors lazy-load their module, so a fixed frame count measures
          // before the behavior has run (the mistake that produced 26 false
          // positives on #781).
          await page
            .waitForFunction(
              () => {
                const host = document.getElementById('behaviors-live-example');
                return Boolean(host && host.firstElementChild);
              },
              { timeout: 5_000 },
            )
            .catch(() => { /* an example that never renders is #781's finding, not this test's */ });

          const buttonCount = await page.evaluate(() => {
            const host = document.getElementById('behaviors-live-example');
            return host ? host.querySelectorAll('button').length : 0;
          });
          if (buttonCount === 0) continue;
          examined++;

          for (let b = 0; b < Math.min(buttonCount, MAX_BUTTONS_PER_BEHAVIOR); b++) {
            currentButton = await page.evaluate((index) => {
              const host = document.getElementById('behaviors-live-example');
              const btn = host ? (host.querySelectorAll('button')[index] as HTMLElement | undefined) : undefined;
              if (!btn) return '(gone)';
              return (btn.id || btn.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 40) || '(unlabelled)';
            }, b);

            // Fire it. A throwing inline onclick surfaces through page.on('pageerror'),
            // not as a rejection here, so this await succeeding proves nothing on
            // its own — the listener above is the assertion.
            await page.evaluate((index) => {
              const host = document.getElementById('behaviors-live-example');
              const btn = host ? (host.querySelectorAll('button')[index] as HTMLElement | undefined) : undefined;
              btn?.click();
            }, b);
            clicked++;

            // Let a handler that defers to a microtask/frame actually run before
            // the next click, so its error is attributed to the right button.
            await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));

            // Close anything the click opened. An open <dialog> is modal and would
            // otherwise swallow every later interaction on the page.
            await page.evaluate(() => {
              document.querySelectorAll('dialog[open]').forEach((d) => {
                try { (d as HTMLDialogElement).close(); } catch { /* not all dialogs are closable */ }
              });
            });
          }
        } catch (err) {
          // A button that navigates (a link, a location change) is not an
          // error in the behavior -- it just takes the page away. Come back
          // and carry on with the next behavior; anything else is a real failure.
          if (!/Execution context was destroyed|navigat/i.test(String(err))) throw err;
          await loadShowcase();
        }
      }

      expect(examined, 'no behavior example in this part contained a button — nothing was actually tested')
        .toBeGreaterThan(1);

      const summary = failures
        .map((f) => `  ${f.behavior} — button "${f.button}"\n      ${f.message}`)
        .join('\n');

      expect(
        failures,
        `${failures.length} uncaught error(s) from pressing buttons in behavior examples ` +
        `(${clicked} buttons clicked across ${examined} behaviors):\n${summary}`,
      ).toEqual([]);
    });
  }
});
