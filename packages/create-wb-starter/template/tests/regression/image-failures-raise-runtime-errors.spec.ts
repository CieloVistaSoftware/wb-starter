import { test, expect, type Page } from '@playwright/test';

/**
 * A media file that never loads must raise a real, loggable runtime error.
 *
 * John: "put in runtime errors on image fails."
 *
 * media-load-retry.js already retried, applied a `--load-failed` class and
 * dispatched a custom event — but it only ever `console.warn`ed. error-logger.js
 * listens on window.onerror, so a warning is invisible to it: an image that
 * never loaded left NO entry in the error log and never tripped CI's JS-errors
 * check. That is how ten broken `image="Sample image"` cards sat in a test
 * fixture unnoticed.
 *
 * Asserted through window.onerror — the same channel error-logger.js uses — so
 * this test fails if the error is ever downgraded back to a warning, or thrown
 * somewhere that never reaches the global handler.
 */

const FIXTURE = '/tests/fixtures/blank.html';

// maxAttempts=5 with 500ms exponential backoff, plus a 4s readiness timeout
// per attempt. Generous so a slow CI runner cannot fail this on timing alone.
const RETRY_BUDGET_MS = 20000;

async function renderAndCollect(page: Page, markup: string, waitMs: number) {
  await page.goto(FIXTURE, { waitUntil: 'domcontentloaded' });
  return page.evaluate(async ({ html, wait }) => {
    const caught: string[] = [];
    window.addEventListener('error', (e) => caught.push(e.message));

    const host = document.createElement('div');
    host.id = 'harness';
    host.style.cssText = 'width: 400px;';
    document.body.appendChild(host);
    host.innerHTML = html;

    const mod: any = await import('/src/core/wb-lazy.js');
    await (mod.default || mod.WB).scan(host, { eager: true });
    await new Promise((r) => setTimeout(r, wait));

    const img = host.querySelector('img');
    return { caught, className: img ? img.className : null };
  }, { html: markup, wait: waitMs });
}

test.describe('image load failures raise runtime errors', () => {
  test.setTimeout(RETRY_BUDGET_MS + 30000);

  test('a missing image throws once its retries are exhausted', async ({ page }) => {
    const { caught, className } = await renderAndCollect(
      page,
      '<img id="broken" src="/definitely-missing-image.png" alt="broken">',
      RETRY_BUDGET_MS
    );

    const loadErrors = caught.filter((m) => /failed to load/i.test(m));
    expect(loadErrors.length, `expected a runtime error, got: ${JSON.stringify(caught)}`)
      .toBeGreaterThan(0);
    expect(loadErrors[0], 'the error must name the file that failed')
      .toContain('definitely-missing-image.png');
    expect(loadErrors[0], 'and say how many attempts were made').toMatch(/attempt/i);
  });

  test('the visible fallback still applies — the error does not replace it', async ({ page }) => {
    // Throwing must not skip the fallback UI. Both have to happen: a reader
    // sees "unavailable", and the log gets an entry.
    const { className } = await renderAndCollect(
      page,
      '<img id="broken" src="/definitely-missing-image.png" alt="broken">',
      RETRY_BUDGET_MS
    );
    expect(className, 'the load-failed class must still be applied').toContain('load-failed');
  });

  test('an image that loads raises nothing', async ({ page }) => {
    // Guard against the opposite failure: a noisy error on a perfectly good
    // image would be worse than the silence this replaced.
    const { caught } = await renderAndCollect(
      page,
      '<img id="ok" src="https://picsum.photos/seed/x-load-ok/120/80" alt="ok">',
      3000
    );
    expect(caught.filter((m) => /failed to load/i.test(m)), 'a working image must stay silent')
      .toEqual([]);
  });

  test('a broken image WITH a broken fallback reports both', async ({ page }) => {
    // The fallback path bypasses the retry module entirely. It used to swap
    // src and say nothing, so a doubly-broken image left no trace at all.
    const { caught } = await renderAndCollect(
      page,
      '<img id="both" src="/missing-primary.png" fallback="/missing-fallback.png" alt="x">',
      6000
    );

    const both = caught.filter((m) => /fallback/i.test(m));
    expect(both.length, `expected an error naming both files, got: ${JSON.stringify(caught)}`)
      .toBeGreaterThan(0);
    expect(both[0]).toContain('missing-primary.png');
    expect(both[0]).toContain('missing-fallback.png');
  });
});
