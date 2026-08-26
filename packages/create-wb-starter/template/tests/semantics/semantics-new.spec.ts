import { test, expect } from '@playwright/test';

test.describe('New Semantic Behaviors', () => {
  test.beforeEach(async ({ page }) => {
    // Basic setup with WB loaded
    await page.setContent(`
      <!DOCTYPE html>
      <html>
      <head>
        <script src="/src/index.js" type="module"></script>
        <link rel="stylesheet" href="/src/styles/site.css">
      </head>
      <body>
      </body>
      </html>
    `);
  });

  test('List behavior renders items correctly', async ({ page }) => {
    await page.setContent(`
      <div id="test-list" items="Item 1, Item 2, Item 3"></ul>
      <script src="/src/index.js" type="module"></script>
    `);

    const list = page.locator('#test-list');
    await expect(list).toHaveClass(/x-list/);
    await expect(list.locator('li')).toHaveCount(3);
    await expect(list.locator('li').first()).toHaveText('Item 1');
  });

  test('List behavior handles JSON items', async ({ page }) => {
    await page.setContent(`
      <div id="test-list-json" items='["Item A", "Item B, with comma"]'></ul>
      <script src="/src/index.js" type="module"></script>
    `);

    const list = page.locator('#test-list-json');
    await expect(list.locator('li')).toHaveCount(2);
    await expect(list.locator('li').nth(1)).toHaveText('Item B, with comma');
  });

  test('Description List behavior renders items correctly', async ({ page }) => {
    await page.setContent(`
      <div id="test-dl" items='[{"term":"Term 1","desc":"Desc 1"},{"term":"Term 2","desc":"Desc 2"}]'></dl>
      <script src="/src/index.js" type="module"></script>
    `);

    const dl = page.locator('#test-dl');
    await expect(dl).toHaveClass(/x-dl/);
    await expect(dl.locator('dt')).toHaveCount(2);
    await expect(dl.locator('dd')).toHaveCount(2);
    await expect(dl.locator('dt').first()).toHaveText('Term 1');
    await expect(dl.locator('dd').first()).toHaveText('Desc 1');
  });

  test('Empty state behavior renders correctly', async ({ page }) => {
    await page.setContent(`
      <div id="test-empty" icon="∅" message="No Data"></div>
      <script src="/src/index.js" type="module"></script>
    `);

    const empty = page.locator('#test-empty');
    await expect(empty).toHaveClass(/x-empty/);
    await expect(empty.locator('.x-empty__icon')).toHaveText('∅');
    await expect(empty.locator('.x-empty__message')).toHaveText('No Data');
  });

  test('Code behavior works on PRE tag', async ({ page }) => {
    await page.setContent(`
      <code id="test-pre" language="javascript"><code>const a = 1;</code></pre>
      <script src="/src/index.js" type="module"></script>
    `);

    const pre = page.locator('#test-pre');
    // Should have pre behavior applied (copy button, etc)
    await expect(pre).toHaveClass(/x-pre/);
    await expect(pre.locator('.x-pre__copy')).toBeVisible();
    
    // Should have code behavior applied (highlighting)
    const code = pre.locator('code');
    await expect(code).toHaveClass(/language-javascript/);
    // hljs adds 'hljs' class when highlighted
    await expect(code).toHaveClass(/hljs/);
  });

  test('Stat behavior renders correctly', async ({ page }) => {
    await page.setContent(`
      <div x-stat id="test-stat" value="100" label="Users"></div>
      <script src="/src/index.js" type="module"></script>
    `);

    const stat = page.locator('#test-stat');
    await expect(stat).toHaveClass(/x-stat/);
    await expect(stat.locator('.x-stat__value')).toHaveText('100');
    await expect(stat.locator('.x-stat__label')).toHaveText('Users');
  });

  test('Timeline behavior renders correctly', async ({ page }) => {
    await page.setContent(`
      <div x-timeline id="test-timeline" items="Step 1, Step 2"></div>
      <script src="/src/index.js" type="module"></script>
    `);

    const timeline = page.locator('#test-timeline');
    await expect(timeline).toHaveClass(/x-timeline/);
    await expect(timeline.locator('.x-timeline__item')).toHaveCount(2);
  });

  test('JSON behavior renders correctly', async ({ page }) => {
    await page.setContent(`
      <div id="test-json">{"a":1}</div>
      <script src="/src/index.js" type="module"></script>
    `);

    const json = page.locator('#test-json');
    await expect(json).toHaveClass(/x-json/);
    // Should be highlighted
    await expect(json.locator('code')).toHaveClass(/language-json/);
  });
});
