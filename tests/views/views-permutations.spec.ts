/**
 * WB Views Permutation Tests
 * ==========================
 * Generates tests dynamically based on the views registry schema.
 * Verifies that all defined views and their attribute permutations render correctly.
 */

import { test, expect } from '@playwright/test';
import { readJson, PATHS } from '../base';
import * as path from 'path';

const VIEWS_REGISTRY_PATH = path.join(PATHS.src, 'wb-views/views-registry.json');

test.describe('Views Permutations', () => {
  let registry: any;

  test.beforeAll(() => {
    registry = readJson(VIEWS_REGISTRY_PATH);
    if (!registry || !registry.views) {
      throw new Error('Failed to load views registry');
    }
  });

  test.beforeEach(async ({ page }) => {
    // We use the demo page as a host for rendering views
    await page.goto('/demos/wb-views-demo.html');
    await page.waitForFunction(() => (window as any).WB?.views);
  });

  // Helper to render a view dynamically
  async function renderView(page: any, tagName: string, attributes: Record<string, string>) {
    return page.evaluate(({ tagName, attributes }) => {
      const el = document.createElement(tagName);
      for (const [key, value] of Object.entries(attributes)) {
        el.setAttribute(key, value as string);
      }
      document.body.appendChild(el);
      // Wait for next tick for processing
      return new Promise(resolve => setTimeout(() => resolve(el.outerHTML), 10));
    }, { tagName, attributes });
  }

  // Generate tests for each view in the registry
  test('generate and run permutation tests', async ({ page }) => {
    const views = registry.views;

    for (const [viewName, def] of Object.entries(views)) {
      const definition = def as any;
      const tagName = viewName.includes('-') ? viewName : `wb-${viewName}`;
      
      console.log(`Testing permutations for <${tagName}>...`);

      // 1. Test Required Attributes
      const requiredAttrs: Record<string, string> = {};
      const attributes = definition.attributes || {};
      
      for (const [attrName, attrDef] of Object.entries(attributes)) {
        if ((attrDef as any).required) {
          // Provide a dummy value for required attributes
          requiredAttrs[attrName] = 'test-value';
        }
      }

      // Render with just required attributes
      await renderView(page, tagName, requiredAttrs);
      const exists = await page.locator(tagName).last().isVisible();
      expect(exists, `<${tagName}> should render with required attributes`).toBe(true);

      // 2. Test Enum Permutations
      for (const [attrName, attrDef] of Object.entries(attributes)) {
        const ad = attrDef as any;
        if (ad.enum && Array.isArray(ad.enum)) {
          for (const enumValue of ad.enum) {
            const testAttrs = { ...requiredAttrs, [attrName]: enumValue };
            
            await renderView(page, tagName, testAttrs);
            
            // Verify the attribute was applied and likely resulted in a class or visual change
            // This is generic, so we check if the element exists and has the attribute
            const el = page.locator(tagName).last();
            await expect(el).toBeVisible();
            await expect(el).toHaveAttribute(attrName, enumValue);
            
            // For specific known patterns (like variant), we can check for classes
            if (attrName === 'variant') {
               // Most views map variant="foo" to class="...--foo"
               const html = await el.innerHTML();
               // We expect the class to be present in the inner HTML (template content)
               // e.g. alert--info, btn--primary
               expect(html).toContain(`--${enumValue}`);
            }
          }
        }
      }
    }
  });
});
