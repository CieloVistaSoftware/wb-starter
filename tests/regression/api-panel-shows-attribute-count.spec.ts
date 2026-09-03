/**
 * THE API PANEL ANNOUNCES HOW MUCH IT HOLDS
 * =========================================
 * #993 — John, on `article` showing a single row in the behaviors list:
 * "This isn't right only one Article example".
 *
 * The list is a list of OPTIONS: `variantsFor()` emits a row per enum value and
 * one per boolean, so a behavior whose attributes are plain strings gets a
 * single bare row. `article` declares nine attributes and eight are strings, so
 * the framework's flagship element — `<article>` IS the card (Law 0 / 4b) —
 * looked like it had one knob, while the code panel beside it demonstrated
 * `title=` and `subtitle=`, attributes the list did not offer.
 *
 * Systemic, not an article problem: 650 option rows across 156 schemas against
 * 1032 declared attributes.
 *
 * The full set was never missing. This panel already listed every property via
 * `Object.keys(props)` with no filtering. What was missing was any way to KNOW
 * that — the chip read "API" whether it held nine attributes or none, so
 * nothing suggested looking. John chose the API panel as the home for the full
 * attribute set, so the chip now states its size.
 */

import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { ROOT } from '../base';

const LIST = '#behaviors-search-results';
const ROW = '.behaviors-search-results__row';

function declaredAttributes(behavior: string): string[] {
  const p = path.join(ROOT, 'src/wb-models', `${behavior}.schema.json`);
  if (!fs.existsSync(p)) return [];
  const schema = JSON.parse(fs.readFileSync(p, 'utf8'));
  return Object.keys(schema.properties || {});
}

async function select(page, token: string) {
  await page.goto('/?page=behaviors', { waitUntil: 'domcontentloaded' });
  await expect.poll(() => page.locator(`${LIST} ${ROW}`).count(), { timeout: 25_000 }).toBeGreaterThan(0);
  await page.waitForSelector('#behaviors-workspace[x-ready]', { timeout: 20_000 });
  await page.evaluate(
    ({ LIST, ROW, token }) => {
      const row = Array.from(document.querySelectorAll(`${LIST} ${ROW}`)).find(
        (r) => (r as HTMLElement).dataset.browseToken === token
      ) as HTMLElement | undefined;
      row?.click();
    },
    { LIST, ROW, token }
  );
  await page.waitForTimeout(600);
}

test.describe('the API panel states its attribute count (#993)', () => {
  test('article: the chip says 9, and the panel lists all 9', async ({ page }) => {
    const declared = declaredAttributes('article');
    expect(declared.length, 'article.schema.json should declare nine attributes').toBe(9);

    await select(page, 'x-article');

    const result = await page.evaluate(async () => {
      const summary = document.querySelector('#behaviors-live-api .behaviors-live__api-summary');
      const label = summary?.textContent?.trim() ?? '';
      (summary as HTMLElement | null)?.click();
      await new Promise((r) => setTimeout(r, 700));
      const names = Array.from(
        document.querySelectorAll('#behaviors-live-api-body .behaviors-live__api-name code')
      ).map((c) => c.textContent);
      return { label, names };
    });

    expect(
      result.label,
      'the chip must state how many attributes are behind it, or nothing suggests opening it'
    ).toBe(`API (${declared.length})`);

    expect(
      result.names.sort(),
      'the panel must list every declared attribute, string-typed ones included'
    ).toEqual(declared.sort());
  });

  test('the panel holds attributes the option list does not offer', async ({ page }) => {
    // The point of #993: string attributes never reach the list. This asserts
    // the gap the API panel exists to close, so a future change that starts
    // emitting string rows does not silently make this test meaningless.
    await select(page, 'x-article');

    const listRows = await page.evaluate(
      ({ LIST, ROW }) =>
        Array.from(document.querySelectorAll(`${LIST} ${ROW}`)).filter(
          (r) => (r as HTMLElement).dataset.browseToken === 'x-article'
        ).length,
      { LIST, ROW }
    );

    const declared = declaredAttributes('article').length;
    expect(listRows, 'article should still produce few option rows').toBeLessThan(declared);
    expect(declared, 'the API panel is where the rest live').toBeGreaterThan(listRows);
  });

  test('a behavior with no schema keeps a bare chip, not "API (0)"', async ({ page }) => {
    // "API (0)" would advertise an empty panel. Absence should read as absence.
    await select(page, 'x-code');
    const label = await page.evaluate(
      () =>
        document
          .querySelector('#behaviors-live-api .behaviors-live__api-summary')
          ?.textContent?.trim() ?? ''
    );
    expect(label === 'API' || /^API \(\d+\)$/.test(label)).toBe(true);
    expect(label, 'an empty panel must not advertise a count').not.toBe('API (0)');
  });
});
