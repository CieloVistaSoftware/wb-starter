/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Every element in a rendered example carries an id (#748)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * John: "to be a good example for customers all elements must have id", and
 * "write a test to ensure all elements have an id where needed".
 *
 * These examples are the copy-paste source a customer starts from. An element
 * with no id cannot be scripted, tested, or referenced — and this project
 * relies on ids for exactly that: the event log names the element an event
 * came from (#755), the handler snippet is generated around a real id, and
 * #724/#730 made a DUPLICATE id a hard runtime error precisely because ids are
 * load-bearing here.
 *
 * WHERE NEEDED
 *
 * Not literally every node. Three exclusions, each for a reason:
 *
 *   - <option> / <optgroup>: addressed through their <select>'s value, never
 *     individually. Giving 200 options ids is noise, not utility.
 *   - <br>, <hr>, <source>, <track>: no content to reference.
 *   - Elements a BEHAVIOR builds and owns internally are still checked —
 *     assignExampleIds() runs after the upgrade specifically so they get one
 *     (#675). If a built element has no id, that is the bug this catches.
 *
 * Ids must also be UNIQUE. A test that only checks presence would pass while
 * the page trips its own duplicate-id error.
 */

import { test, expect, Page } from '@playwright/test';

const EXEMPT_TAGS = new Set(['OPTION', 'OPTGROUP', 'BR', 'HR', 'SOURCE', 'TRACK']);

async function openPanel(page: Page) {
  await page.goto('/?page=behaviors');
  await page.waitForSelector('#behaviors-search', { timeout: 30000 });
  await page.waitForFunction(
    () => document.querySelectorAll('.behaviors-search-results__row').length > 10,
    { timeout: 30000 },
  );
}

/**
 * Render every behavior in turn and collect elements with no id.
 *
 * Rows can contain links; a stray navigation destroys the page context
 * mid-sweep, so anchor defaults are suppressed for the duration (the same trap
 * that made an earlier sweep flaky).
 */
async function sweep(page: Page, limit: number) {
  return page.evaluate(async ({ exempt, max }) => {
    const noNav = (e: Event) => {
      const a = (e.target as HTMLElement)?.closest?.('a');
      if (a) e.preventDefault();
    };
    document.addEventListener('click', noNav, true);

    const missing: string[] = [];
    const duplicates: string[] = [];
    let checked = 0;

    try {
      const rows = [...document.querySelectorAll('.behaviors-search-results__row')].slice(0, max);
      const stage = document.getElementById('behaviors-live-example');

      for (const row of rows) {
        (row as HTMLElement).click();
        await new Promise((r) => setTimeout(r, 90));
        if (!stage) continue;

        const token = (row as HTMLElement).dataset.browseToken || '?';
        const variant = (row as HTMLElement).dataset.variant || '';
        const label = variant ? `${token} / ${variant}` : token;

        const seen = new Set<string>();
        for (const el of stage.querySelectorAll('*')) {
          if (exempt.includes(el.tagName)) continue;
          checked++;
          const id = el.getAttribute('id');
          if (!id) {
            missing.push(`${label}: <${el.tagName.toLowerCase()}> has no id`);
          } else if (seen.has(id)) {
            duplicates.push(`${label}: id="${id}" used more than once`);
          } else {
            seen.add(id);
          }
        }
      }
    } finally {
      document.removeEventListener('click', noNav, true);
    }
    return { missing, duplicates, checked };
  }, { exempt: [...EXEMPT_TAGS], max: limit });
}

test.describe('Rendered examples carry ids', () => {
  test('every element in every rendered example has an id', async ({ page }) => {
    test.setTimeout(180_000);
    await openPanel(page);
    const { missing, checked } = await sweep(page, 60);

    expect(checked, 'nothing was inspected — the sweep would pass vacuously')
      .toBeGreaterThan(50);

    const unique = [...new Set(missing)];
    expect(
      unique,
      `${unique.length} elements in rendered examples have no id ` +
      `(of ${checked} inspected). These are the markup a customer copies; ` +
      `without an id nothing can be scripted, tested or referenced.\n  ` +
      unique.slice(0, 40).join('\n  '),
    ).toEqual([]);
  });

  test('ids within one rendered example are unique', async ({ page }) => {
    test.setTimeout(180_000);
    await openPanel(page);
    const { duplicates } = await sweep(page, 60);

    const unique = [...new Set(duplicates)];
    expect(
      unique,
      `duplicate ids inside a single example — #724/#730 made this a runtime ` +
      `error, so the page reports its own markup as broken:\n  ` +
      unique.slice(0, 20).join('\n  '),
    ).toEqual([]);
  });
});
