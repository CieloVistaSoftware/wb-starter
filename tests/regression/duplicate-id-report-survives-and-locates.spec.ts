import { test, expect } from '../fixtures/offline';

/**
 * #1340 -- a duplicate-id report reaches the log even if the page goes away,
 * and says where each copy lives.
 *
 * John saw "#app x2, #error-template x2" in the error viewer -- the whole site
 * shell mounted twice, #724's failure -- and no log anywhere retained it. The
 * POST that writes an entry was a plain fetch, which the browser cancels when
 * the page navigates or closes; and the entry named only ids and counts, so
 * even a retained one could not tell a second mount from a framed probe.
 *
 * window.fetch is stubbed before the page loads, so nothing reaches the real
 * error log (a planted duplicate there would fail error-log-empty).
 */
test.use({ serviceWorkers: 'block' });

test('the duplicate-id report is sent keepalive and names each copy\'s location', async ({ page }) => {
  test.setTimeout(60_000);
  await page.addInitScript(() => {
    const real = window.fetch.bind(window);
    (window as any).__logPosts = [];
    window.fetch = (input: any, init?: any) => {
      const url = typeof input === 'string' ? input : input?.url || '';
      if (url.includes('api/error-log/append')) {
        (window as any).__logPosts.push({ keepalive: !!init?.keepalive, body: String(init?.body || '') });
        return Promise.resolve(new Response('{"ok":true}', { status: 200, headers: { 'Content-Type': 'application/json' } }));
      }
      return real(input, init);
    };
  });
  await page.goto('/?page=behaviors');
  await page.waitForSelector('#behaviors-search', { timeout: 30_000 });
  await page.evaluate(() => (window as any).WB?.whenIdle?.({ timeout: 20_000 }));

  await page.evaluate(async () => {
    const mod: any = await import('/src/core/duplicate-ids.js');
    const a = document.createElement('section'); a.id = 'probe-1340';
    const b = document.createElement('aside'); b.id = 'probe-1340';
    document.body.append(a, b);
    mod.reportDuplicateIds('1340-probe');
    a.remove(); b.remove();
  });

  await expect.poll(() => page.evaluate(() =>
    (window as any).__logPosts.filter((p: any) => p.body.includes('probe-1340')).length,
  ), { message: 'the duplicate report was never sent to the log' }).toBeGreaterThan(0);

  const post = await page.evaluate(() => (window as any).__logPosts.find((p: any) => p.body.includes('probe-1340')));
  expect(post.keepalive, 'a plain fetch is cancelled when the page goes away; the entry must outlive it').toBe(true);
  const details = JSON.parse(post.body).error.details;
  const copy = details.copies.find((c: any) => c.id === 'probe-1340');
  expect(copy.at, 'each copy is located').toHaveLength(2);
  expect(copy.at[0]).toContain('section#probe-1340');
  expect(copy.at[1]).toContain('aside#probe-1340');
  expect(details.framed, 'the page says whether it was framed').toBe(false);
});
