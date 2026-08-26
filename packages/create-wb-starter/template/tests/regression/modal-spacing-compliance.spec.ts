/**
 * Modal/Dialog Spacing Compliance Test
 * =====================================
 * Validates that modal dialogs follow Standard §13:
 * - ≥ 1rem internal padding
 * - ≥ 0.5rem gap between buttons and elements
 * - Consistent spacing that prevents cramped layouts
 */

import { test, expect } from '@playwright/test';

test.describe('Modal Spacing Compliance', () => {
  test('native dialog has proper internal padding', async ({ page }) => {
    // Create a test dialog element
    await page.evaluate(() => {
      const dialog = document.createElement('dialog');
      dialog.id = 'test-dialog';
      dialog.style.padding = '0.75rem'; // FAIL: less than 1rem
      dialog.innerHTML = `
        <h2>Test Dialog</h2>
        <p>Dialog content</p>
        <div style="display: flex; gap: 0.25rem;">
          <button>Cancel</button>
          <button>Confirm</button>
        </div>
      `;
      document.body.appendChild(dialog);
      dialog.showModal();
    });

    const dialog = page.locator('dialog#test-dialog');
    const computedStyle = await dialog.evaluate(el => {
      const styles = window.getComputedStyle(el);
      return {
        paddingTop: styles.paddingTop,
        paddingRight: styles.paddingRight,
        paddingBottom: styles.paddingBottom,
        paddingLeft: styles.paddingLeft,
      };
    });

    // Convert rem to px for testing (1rem = 16px by default)
    const paddingValue = (val: string) => parseFloat(val);
    const minPadding = 16; // 1rem in pixels

    expect(paddingValue(computedStyle.paddingTop), 'Top padding should be ≥ 1rem').toBeGreaterThanOrEqual(minPadding);
    expect(paddingValue(computedStyle.paddingRight), 'Right padding should be ≥ 1rem').toBeGreaterThanOrEqual(minPadding);
    expect(paddingValue(computedStyle.paddingBottom), 'Bottom padding should be ≥ 1rem').toBeGreaterThanOrEqual(minPadding);
    expect(paddingValue(computedStyle.paddingLeft), 'Left padding should be ≥ 1rem').toBeGreaterThanOrEqual(minPadding);
  });

  test('dialog buttons have minimum gap spacing', async ({ page }) => {
    // Create a test dialog with buttons
    await page.evaluate(() => {
      const dialog = document.createElement('dialog');
      dialog.id = 'button-test-dialog';
      dialog.style.padding = '1rem';

      const buttonContainer = document.createElement('div');
      buttonContainer.style.display = 'flex';
      buttonContainer.style.gap = '0.25rem'; // FAIL: less than 0.5rem

      const cancelBtn = document.createElement('button');
      cancelBtn.textContent = 'Cancel';

      const confirmBtn = document.createElement('button');
      confirmBtn.textContent = 'Confirm';

      buttonContainer.appendChild(cancelBtn);
      buttonContainer.appendChild(confirmBtn);
      dialog.appendChild(buttonContainer);

      document.body.appendChild(dialog);
      dialog.showModal();
    });

    const buttonContainer = page.locator('dialog#button-test-dialog div[style*="flex"]');
    const gap = await buttonContainer.evaluate(el => {
      return window.getComputedStyle(el).gap;
    });

    const gapValue = parseFloat(gap);
    const minGap = 8; // 0.5rem in pixels

    expect(gapValue, 'Button gap should be ≥ 0.5rem').toBeGreaterThanOrEqual(minGap);
  });

  test('dialog heading has proper spacing below it', async ({ page }) => {
    // Create a test dialog with heading
    await page.evaluate(() => {
      const dialog = document.createElement('dialog');
      dialog.id = 'heading-test-dialog';
      dialog.style.padding = '1rem';

      const heading = document.createElement('h2');
      heading.textContent = 'Dialog Title';
      heading.style.marginBottom = '0.5rem'; // FAIL: should be 1rem minimum for content separation

      const content = document.createElement('p');
      content.textContent = 'Dialog content goes here.';

      dialog.appendChild(heading);
      dialog.appendChild(content);

      document.body.appendChild(dialog);
      dialog.showModal();
    });

    const heading = page.locator('dialog#heading-test-dialog h2');
    const marginBottom = await heading.evaluate(el => {
      return window.getComputedStyle(el).marginBottom;
    });

    const marginValue = parseFloat(marginBottom);
    const minMargin = 16; // 1rem minimum for content separation

    expect(marginValue, 'Heading bottom margin should be ≥ 1rem for content separation').toBeGreaterThanOrEqual(minMargin);
  });

  test('all dialog elements respect minimum spacing values', async ({ page }) => {
    const spacingErrors: string[] = [];

    // Check any x-dialog or modal elements on the page
    const modals = await page.locator('dialog, .modal, [role="dialog"]').count();

    for (let i = 0; i < modals; i++) {
      const modal = page.locator('dialog, .modal, [role="dialog"]').nth(i);
      const styles = await modal.evaluate(el => {
        const computed = window.getComputedStyle(el);
        return {
          padding: computed.padding,
          paddingTop: computed.paddingTop,
          paddingBottom: computed.paddingBottom,
          paddingLeft: computed.paddingLeft,
          paddingRight: computed.paddingRight,
        };
      });

      // Check that padding exists and is reasonable
      const paddingValues = [
        parseFloat(styles.paddingTop),
        parseFloat(styles.paddingBottom),
        parseFloat(styles.paddingLeft),
        parseFloat(styles.paddingRight),
      ];

      // At least one padding should be >= 1rem (16px)
      const hasAdequatePadding = paddingValues.some(p => p >= 16);
      if (!hasAdequatePadding && styles.padding !== '0px') {
        spacingErrors.push(`Modal ${i}: Padding values too small: ${JSON.stringify(styles)}`);
      }
    }

    expect(spacingErrors, 'All modals should have adequate spacing').toHaveLength(0);
  });
});
