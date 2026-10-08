import type { Page } from '@playwright/test';

import { settlePage } from '../base';
/**
 * Open demos/playground.html with the "inputs" example set loaded and every
 * input's behavior applied. Shared by playground-twenty-inputs.spec.ts and
 * its #1459 guard, so the guard drives exactly the setup the suite runs.
 */
export async function openPlaygroundInputs(page: Page): Promise<void> {
  await page.goto('/demos/playground.html', { waitUntil: 'networkidle' });
  await page.selectOption('#pg-examples', 'inputs');
  await page.waitForFunction(() => document.querySelectorAll('#pg-preview input').length > 0, { timeout: 15000 });
  // counter.js puts the "N/max" readout on a sibling <span class="[x-counter]">,
  // never on the input itself — wait for that span's text to confirm the
  // counter has finished enhancing.
  await page.waitForFunction(() => {
    const spans = document.querySelectorAll('#pg-preview .x-counter');
    return spans.length >= 2 && [...spans].some((el) => el.textContent === '0/50');
  }, { timeout: 20000 });
  // #1459: the counter proves only the counter. Test 13 hovered the tooltip
  // input before its behavior applied (no x-ready at hover, CI trace), so the
  // hover hit a plain input and no tooltip ever came. WB.settled() resolves
  // once every injection has called back (#962) -- every input, not one.
  await settlePage(page, { timeout: 15000 });
}
