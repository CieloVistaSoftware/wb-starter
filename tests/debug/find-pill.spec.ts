import { test } from '@playwright/test';

test('debug: list elements causing legacy pill error on /', async ({ page }) => {
  page.on('console', m => console.log('PAGE:', m.text()));
  await page.goto('/');
  await page.waitForFunction(() => (window as any).WB);
  await page.waitForTimeout(300);

  const results = await page.evaluate(() => {
    const nodes = Array.from(document.querySelectorAll('[data-wb], [data-wb-error], [data-pill], [data-dot]'));
    return nodes
      .filter(n => n.getAttribute('data-wb') === 'pill' || n.getAttribute('data-wb-error') === 'legacy' || (n.hasAttribute('data-pill') && n.tagName.toLowerCase() !== 'wb-badge'))
      .map(n => ({ outer: n.outerHTML, attrs: Array.from(n.attributes).map(a=>({ name: a.name, value: a.value })) }));
  });

  console.log('FOUND', results.length, 'matches');
  for (const r of results) console.log(r.outer);
});
