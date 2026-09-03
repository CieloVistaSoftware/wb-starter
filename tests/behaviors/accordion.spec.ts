/**
 * <div x-accordion> must be a working, accessible disclosure: collapsed by
 * default, expands on click/Enter (body visible + aria-expanded=true),
 * collapses again. Asserts the user-visible STATE TRANSITION, not mere presence.
 *
 * FIXTURE REWRITTEN (#910).
 *
 * This used to load /?page=behaviors and wait for `[x-accordion]`. That page is
 * a searchable browser now -- nothing is in the DOM until a behaviour is
 * searched for and selected -- so all three tests timed out in setup and never
 * reached the assertions.
 *
 * Revealing the behaviour there fixed the setup and exposed a second, worse
 * problem: the stage is ~32,000px tall and renders lazily, so the accordion
 * head sat at top:32370 and Playwright's click never found a STABLE element
 * (it auto-scrolls, then waits for the box to stop moving, on a page still
 * growing underneath). The page also renders FOUR [x-accordion] hosts of two
 * different shapes -- three with `.x-accordion-head`, one built from
 * `.x-details` with no head -- so `.first()` was a coin toss.
 *
 * None of that is what this spec is about. It tests one behaviour's state
 * machine, so it now builds exactly one accordion on the small test harness:
 * deterministic, fast, and immune to how the showcase page is laid out.
 *
 * Authoring form per collapse.js:115-118 (accordion routes to collapse):
 *   <div x-accordion>
 *     <div accordion-title="Q1">answer 1</div>
 *   </div>
 */
import { test, expect, Page } from '@playwright/test';

const MARKUP = `
  <div x-accordion id="acc">
    <div accordion-title="What is wb-starter?">A zero-build website starter.</div>
    <div accordion-title="Does it need a bundler?">No bundler, no build step.</div>
  </div>`;

async function load(page: Page) {
  await page.goto('/demos/test-harness.html');
  await page.waitForFunction(() => (window as any).WB?.behaviors, { timeout: 15000 });
  await page.evaluate(async (html: string) => {
    document.getElementById('acc-host')?.remove();
    const host = document.createElement('div');
    host.id = 'acc-host';
    host.innerHTML = html;
    document.body.appendChild(host);
    // eager: this harness loads wb-lazy.js, which otherwise defers injection to
    // an IntersectionObserver and would leave the markup unupgraded.
    await (window as any).WB.scan(host, { eager: true });
  }, MARKUP);
  await page.waitForSelector('#acc .x-accordion-head', { timeout: 10000 });
}

function state(page: Page) {
  return page.locator('#acc').evaluate((acc: Element) => {
    const head = acc.querySelector('.x-accordion-head') as HTMLElement | null;
    const body = acc.querySelector('.x-accordion-body') as HTMLElement | null;
    return {
      hasHead: !!head,
      hasBody: !!body,
      title: acc.querySelector('.x-accordion-title')?.textContent || '',
      bodyVisible: !!body && body.getBoundingClientRect().height > 0,
      ariaExpanded: head?.getAttribute('aria-expanded') ?? null,
    };
  });
}

const head = (page: Page) => page.locator('#acc .x-accordion-head').first();

test.describe('Accordion — disclosure behavior', () => {
  test.beforeEach(async ({ page }) => { await load(page); });

  test('renders the title as a clickable head and a collapsed body', async ({ page }) => {
    const s = await state(page);
    expect(s.hasHead, 'accordion built no clickable head').toBe(true);
    expect(s.hasBody, 'accordion built no body panel').toBe(true);
    expect(s.title, 'accordion-title not rendered').toContain('What is wb-starter?');
    expect(s.bodyVisible, 'accordion body should start collapsed').toBe(false);
    expect(s.ariaExpanded, 'head should expose aria-expanded=false when collapsed').toBe('false');
  });

  test('clicking the head expands, clicking again collapses', async ({ page }) => {
    await head(page).click();
    await page.waitForTimeout(250);
    const opened = await state(page);
    expect(opened.bodyVisible, 'accordion did not expand on click').toBe(true);
    expect(opened.ariaExpanded, 'aria-expanded not updated to true').toBe('true');

    await head(page).click();
    await page.waitForTimeout(250);
    const closed = await state(page);
    expect(closed.bodyVisible, 'accordion did not collapse on second click').toBe(false);
    expect(closed.ariaExpanded, 'aria-expanded not updated to false').toBe('false');
  });

  test('keyboard: Enter on a focused head toggles it', async ({ page }) => {
    await head(page).focus();
    await page.keyboard.press('Enter');
    await page.waitForTimeout(250);
    const s = await state(page);
    expect(s.bodyVisible, 'Enter key did not expand the accordion').toBe(true);
    expect(s.ariaExpanded, 'aria-expanded not updated on Enter').toBe('true');
  });
});
