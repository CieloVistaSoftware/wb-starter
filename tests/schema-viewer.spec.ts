import { test, expect } from './fixtures/offline';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const MODELS = join(dirname(fileURLToPath(import.meta.url)), '../src/wb-models');

/** The heading shows the schema's own `title`, read from the file itself. */
const titleOf = (name: string): string =>
  JSON.parse(readFileSync(join(MODELS, `${name}.schema.json`), 'utf8')).title;

const schemas = [
  'alert', 'audio', 'avatar', 'badge', 'button', 'card', 'checkbox', 'chip',
  'confetti', 'details', 'dialog', 'drawer', 'drawerLayout', 'dropdown',
  'fireworks', 'input', 'notes', 'progress', 'rating', 'select', 'skeleton',
  'snow', 'spinner', 'switch', 'table', 'tabs', 'textarea', 'toast', 'tooltip'
];

test.describe('Schema Viewer Rendering Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Listen for console errors
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Store errors for later check
    await page.context().addInitScript(() => {
      (window as any).testErrors = [];
      const originalError = console.error;
      console.error = (...args) => {
        (window as any).testErrors.push(args.join(' '));
        originalError.apply(console, args);
      };
    });

    await page.goto('/public/schema-viewer.html');
    await page.waitForLoadState('networkidle');
    await page.waitForFunction(() => (window as any).WB);
  });

  for (const schemaName of schemas) {
    test(`renders ${schemaName} schema correctly`, async ({ page }) => {
      // Wait for schema selector to be populated
      await page.waitForFunction(() => document.querySelectorAll('#schemaSelector option').length > 1);

      // Select the schema
      await page.selectOption('#schemaSelector', { label: schemaName.charAt(0).toUpperCase() + schemaName.slice(1) });

      // Wait for the preview to update
      await page.waitForTimeout(2000); // Give time for async loading

      // Check that preview panel has content
      const previewPanel = page.locator('#previewPanel');
      await expect(previewPanel).not.toHaveClass('sv-empty');

      // Check that live preview has content
      const livePreview = page.locator('#livePreview');
      await expect(livePreview).toBeVisible();
      // An ELEMENT, not text. This was not.toBeEmpty(), which is a text check,
      // and a spinner, a switch and an input render correctly with no text at
      // all -- those three failed while working. What has to be true is that
      // the example was rendered into the preview.
      await expect(livePreview.locator(':scope > *')).not.toHaveCount(0);

      // Check that code example has content and is rendered as code block
      const codeExample = page.locator('#codeExample');
      await expect(codeExample).toBeVisible();
      await expect(codeExample).not.toBeEmpty();
      // Check that it contains a code element from mdhtml rendering
      await expect(codeExample.locator('code')).toBeVisible();

      // Check that JSON editor has content
      const jsonEditor = page.locator('#jsonEditor');
      const jsonValue = await jsonEditor.inputValue();
      expect(jsonValue).not.toBe('');
      expect(() => JSON.parse(jsonValue)).not.toThrow();

      // Check for console errors
      const errors = await page.evaluate(() => (window as any).testErrors || []);
      expect(errors.length).toBe(0);

      // Check that the component info is displayed
      const componentInfo = page.locator('.sv-info h2');
      await expect(componentInfo).toBeVisible();
      // The schema's title, not the capitalised file name: the page shows
      // `title`, and drawerLayout's is "Drawer Layout" -- the file name never
      // was the heading, it only happened to match for single-word names.
      await expect(componentInfo).toHaveText(titleOf(schemaName));

      // Check that properties are listed
      const propsList = page.locator('.sv-prop');
      const propCount = await propsList.count();
      expect(propCount).toBeGreaterThan(0);
    });
  }
});