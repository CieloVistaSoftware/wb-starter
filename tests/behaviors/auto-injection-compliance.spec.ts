import { test, expect } from '@playwright/test';

test.describe('Auto-Injection Compliance', () => {
  test.beforeEach(async ({ page }) => {
    // Setup with autoInject enabled
    await page.setContent(`
      <!DOCTYPE html>
      <html>
      <head>
        <script type="module">
          import WB from '/src/core/wb.js';
          WB.init({ autoInject: true });
        </script>
      </head>
      <body>
      </body>
      </html>
    `);
  });

  test('Article should NOT be auto-injected as Card', async ({ page }) => {
    await page.setContent(`
      <article id="plain-article">
        <header><h1>Title</h1></header>
        <p>Content</p>
      </article>
      <script type="module">
        import WB from '/src/core/wb.js';
        WB.init({ autoInject: true });
      </script>
    `);

    const article = page.locator('#plain-article');
    // Should NOT have wb-card class
    await expect(article).not.toHaveClass(/wb-card/);
  });

  test('Nav should be auto-injected as Navbar', async ({ page }) => {
    await page.setContent(`
      <nav id="auto-nav">
        <ul><li><a href="#">Link</a></li></ul>
      </nav>
      <script type="module">
        import WB from '/src/core/wb.js';
        WB.init({ autoInject: true });
      </script>
    `);

    const nav = page.locator('#auto-nav');
    // Should have wb-navbar class
    await expect(nav).toHaveClass(/wb-navbar/);
  });

  test('Dialog should be auto-injected as Dialog', async ({ page }) => {
    await page.setContent(`
      <dialog id="auto-dialog">
        Content
      </dialog>
      <script type="module">
        import WB from '/src/core/wb.js';
        WB.init({ autoInject: true });
      </script>
    `);

    const dialog = page.locator('#auto-dialog');
    // Should have wb-dialog class
    await expect(dialog).toHaveClass(/wb-dialog/);
  });

  test('Article with wb="card" SHOULD be a Card', async ({ page }) => {
    await page.setContent(`
      <article id="explicit-card" wb="card">
        <header><h1>Title</h1></header>
        <p>Content</p>
      </article>
      <script type="module">
        import WB from '/src/core/wb.js';
        WB.init({ autoInject: true });
      </script>
    `);

    const card = page.locator('#explicit-card');
    // Should have wb-card class
    await expect(card).toHaveClass(/wb-card/);
  });
});
