import { test, expect } from '@playwright/test';

/**
 * REGRESSION (#344 schema/behavior completeness audit -- found while
 * renaming card.js's duplicate `footerEl` declarations in cardminimizable()):
 * the footer-building branch declared `const footerEl = base.createFooter()`
 * but then read/wrote a completely undefined `footer` variable
 * (`footer.style.display = ...; element.appendChild(footer);`) -- a real
 * ReferenceError, not just a lint nit. Any <wb-cardminimizable footer="...">
 * threw instead of rendering its footer at all. Fixed by using the
 * declared variable throughout (renamed to `minimizableFooterEl` to also
 * resolve the source-schema-compliance duplicate-variable finding).
 */
test('<wb-cardminimizable footer> renders its footer without throwing (#344)', async ({ page }) => {
  const pageErrors: string[] = [];
  page.on('pageerror', (err) => pageErrors.push(String(err)));

  await page.goto('/');
  await page.setContent(`
    <wb-cardminimizable id="card" title="Test Card" footer="Card Footer">
      Card body content
    </wb-cardminimizable>
    <script type="module">
      import WB from '/src/core/wb.js';
      window.__wbDone = false;
      WB.init({ autoInject: true }).then(() => WB.scan(document.body)).then(() => { window.__wbDone = true; });
    </script>
  `);
  await page.waitForFunction(() => (window as any).__wbDone === true, { timeout: 30000 });

  expect(pageErrors, `Uncaught page errors: ${pageErrors.join(' | ')}`).toEqual([]);

  const footer = page.locator('#card .wb-card__footer');
  await expect(footer).toBeVisible();
  await expect(footer).toContainText('Card Footer');
});
