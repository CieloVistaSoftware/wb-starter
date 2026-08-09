/**
 * <wb-accordion> must be a working, accessible disclosure: collapsed by default,
 * expands on click/Enter (body visible + aria-expanded=true), collapses again.
 * Asserts the user-visible STATE TRANSITION, not mere presence.
 */
import { test, expect, Page } from '@playwright/test';

const BASE = process.env.WB_BASE || 'http://localhost:3000';
const URL = `${BASE.replace(/\/$/, '')}/?page=behaviors`;

async function load(page: Page) {
  await page.goto(URL, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('wb-accordion', { timeout: 25000 });
  await page.waitForTimeout(1500);
}

function state(page: Page) {
  return page.evaluate(() => {
    const acc = document.querySelector('wb-accordion')!;
    const head = acc.querySelector('.wb-accordion-head') as HTMLElement | null;
    const body = acc.querySelector('.wb-accordion-body') as HTMLElement | null;
    return {
      hasHead: !!head,
      hasBody: !!body,
      title: acc.querySelector('.wb-accordion-title')?.textContent || '',
      ariaExpanded: head?.getAttribute('aria-expanded') ?? null,
      bodyVisible: body ? getComputedStyle(body).display !== 'none' && body.getBoundingClientRect().height > 0 : false,
    };
  });
}

test.describe('Accordion — disclosure behavior', () => {
  test.beforeEach(async ({ page }) => load(page));

  test('renders the title as a clickable head and a hidden body', async ({ page }) => {
    const s = await state(page);
    expect(s.hasHead, 'accordion built no clickable head').toBe(true);
    expect(s.hasBody, 'accordion built no body panel').toBe(true);
    expect(s.title.length, 'accordion title attribute not rendered').toBeGreaterThan(0);
    expect(s.bodyVisible, 'accordion body should start collapsed').toBe(false);
    expect(s.ariaExpanded, 'head should expose aria-expanded=false when collapsed').toBe('false');
  });

  test('clicking the head expands, clicking again collapses', async ({ page }) => {
    await page.click('wb-accordion .wb-accordion-head');
    await page.waitForTimeout(150);
    const opened = await state(page);
    expect(opened.bodyVisible, 'accordion did not expand on click').toBe(true);
    expect(opened.ariaExpanded, 'aria-expanded not updated to true').toBe('true');

    await page.click('wb-accordion .wb-accordion-head');
    await page.waitForTimeout(150);
    const closed = await state(page);
    expect(closed.bodyVisible, 'accordion did not collapse on second click').toBe(false);
    expect(closed.ariaExpanded, 'aria-expanded not updated to false').toBe('false');
  });

  test('keyboard: Enter on a focused head toggles it', async ({ page }) => {
    await page.focus('wb-accordion .wb-accordion-head');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(150);
    const s = await state(page);
    expect(s.bodyVisible, 'Enter key did not expand the accordion').toBe(true);
  });
});
