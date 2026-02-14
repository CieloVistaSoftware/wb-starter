import { test, expect } from '@playwright/test';

// This test will visit the kitchen sink page and verify all wb-demo doc links are valid

test.describe('Kitchen Sink Doc Links', () => {
  test('all wb-demo doc links are reachable', async ({ page, request }) => {
    await page.goto('/demos/kitchen-sink.html');
    // Wait for all wb-demo to render
    await page.waitForSelector('wb-demo .wb-demo__links a');
    const links = await page.$$eval('wb-demo .wb-demo__links a', els => els.map(a => a.getAttribute('href')));
    expect(links.length).toBeGreaterThan(0);
    for (const href of links) {
      // Only test local doc links
      if (href && href.startsWith('/docs/')) {
        const res = await request.get(href);
        expect(res.status(), `Broken link: ${href}`).toBe(200);
      }
    }
  });
});
