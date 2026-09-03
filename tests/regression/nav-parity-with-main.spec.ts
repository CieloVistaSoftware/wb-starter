/**
 * NO MENU ITEM DISAPPEARS QUIETLY
 * ===============================
 * #1002 — John: "no surprises like missing menu items".
 *
 * The Error Log item vanished from the working tree and nobody noticed until
 * John went looking for it. Then, when the branch was finally merged, it
 * vanished a SECOND time: `config/site.json` auto-merged cleanly and the
 * deletion won silently. A clean merge removed a menu item and reported
 * success.
 *
 * Two guards, because they fail differently:
 *
 *   1. Every nav entry declared in config/site.json actually renders. Catches a
 *      route that stops resolving.
 *   2. Every nav entry present on origin/main is still present here. Catches
 *      the silent-deletion case above — the one that actually happened, twice.
 *
 * (2) reads git rather than a hardcoded list, so it keeps working as the menu
 * legitimately changes. Deleting an item deliberately is fine; it just has to
 * be deliberate on main too.
 */

import { test, expect } from '@playwright/test';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { ROOT } from '../base';

interface NavItem { menuItemId?: string; menuItemText?: string; href?: string }

function navFrom(json: string): NavItem[] {
  try {
    const cfg = JSON.parse(json);
    return Array.isArray(cfg.navigationMenu) ? cfg.navigationMenu : [];
  } catch {
    return [];
  }
}

function localNav(): NavItem[] {
  return navFrom(fs.readFileSync(path.join(ROOT, 'config/site.json'), 'utf8'));
}

function mainNav(): NavItem[] | null {
  try {
    return navFrom(
      execSync('git show origin/main:config/site.json', {
        cwd: ROOT,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      })
    );
  } catch {
    return null; // no git, or no origin/main fetched — see the skip below
  }
}

test.describe('navigation parity (#1002)', () => {
  test('every declared menu item renders on the page', async ({ page }) => {
    const declared = localNav().filter((i) => i.menuItemText);
    expect(declared.length, 'config/site.json declares no navigation').toBeGreaterThan(0);

    await page.goto('/?page=home', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1200);

    const rendered = await page.evaluate(() =>
      Array.from(document.querySelectorAll('nav a, aside a, .site__nav a')).map(
        (a) => (a.textContent || '').replace(/\s+/g, ' ').trim()
      )
    );

    const missing = declared
      .map((i) => i.menuItemText!)
      .filter((text) => !rendered.some((r) => r.includes(text)));

    expect(
      missing,
      missing.length
        ? `declared in config/site.json but not rendered: ${missing.join(', ')}`
        : ''
    ).toEqual([]);
  });

  test('no menu item present on main has gone missing here', () => {
    const onMain = mainNav();
    test.skip(onMain === null, 'origin/main not available in this checkout');

    const here = new Set(localNav().map((i) => i.menuItemId || i.menuItemText));
    const lost = onMain!
      .filter((i) => i.menuItemId || i.menuItemText)
      .filter((i) => !here.has(i.menuItemId || i.menuItemText))
      .map((i) => `${i.menuItemText} (${i.menuItemId})`);

    expect(
      lost,
      lost.length
        ? `these menu items exist on origin/main but not here: ${lost.join(', ')}\n` +
            `If the removal is deliberate, remove them on main too — a menu item ` +
            `must never disappear as a side effect of a merge.`
        : ''
    ).toEqual([]);
  });

  test('every menu item points somewhere that resolves', async ({ page, request }) => {
    const items = localNav().filter((i) => i.href || i.menuItemId);
    const broken: string[] = [];

    for (const item of items) {
      // A bare href is a real file (Error Log); otherwise it is a ?page= route.
      const url = item.href ? `/${item.href}` : `/?page=${item.menuItemId}`;
      const res = await request.get(url, { maxRedirects: 5 }).catch(() => null);
      if (!res || res.status() >= 400) {
        broken.push(`${item.menuItemText} -> ${url} (${res ? res.status() : 'no response'})`);
      }
    }

    expect(
      broken,
      broken.length ? `menu items pointing at nothing:\n  ${broken.join('\n  ')}` : ''
    ).toEqual([]);
  });
});
