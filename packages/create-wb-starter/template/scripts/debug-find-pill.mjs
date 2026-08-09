import { chromium } from 'playwright';
(async () => {
  const b = await chromium.launch();
  const page = await b.newPage();
  page.on('console', m => console.log('PAGE:', m.type(), m.text()));
  await page.goto('http://localhost:3000/');
  await page.waitForFunction(() => !!window.WB);
  await page.waitForTimeout(300);
  const results = await page.evaluate(() => {
    const nodes = Array.from(document.querySelectorAll('[data-wb], [data-wb-error], [data-pill], [data-dot]'));
    return nodes
      .filter(n => n.getAttribute('data-wb') === 'pill' || n.getAttribute('data-wb-error') === 'legacy' || (n.hasAttribute('data-pill') && n.tagName.toLowerCase() !== 'wb-badge'))
      .map(n => ({ outer: n.outerHTML, attrs: Array.from(n.attributes).map(a=>({ name: a.name, value: a.value })) }));
  });
  console.log('FOUND', results.length, 'matches');
  for (const r of results) console.log(r.outer, JSON.stringify(r.attrs));
  await b.close();
})();
