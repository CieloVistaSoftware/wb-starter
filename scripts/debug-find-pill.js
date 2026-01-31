import { chromium } from 'playwright';

export default async function findPillMatches(url = 'http://localhost:3000/') {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    page.on('console', m => console.log('PAGE:', m.type(), m.text()));
    await page.goto(url);
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
    return results;
  } finally {
    await browser.close();
  }
}

if (import.meta.url === process.argv[1] || import.meta.url === `file://${process.argv[1]}`) {
  // allow running directly with: node --input-type=module scripts/debug-find-pill.js
  findPillMatches().catch(err => { console.error(err); process.exit(1); });
}
