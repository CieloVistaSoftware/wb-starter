/**
 * A FIELDSET IS A GROUP, NOT A DISCLOSURE WIDGET
 * ==============================================
 * #999 — John, on `fieldset · collapsible`: "this is 10th times I told you this
 * doesn't work. I've never heard of a collapsible field set."
 *
 * He was right twice. It did not work, and it should not exist. `<fieldset>`
 * groups form controls; it has no disclosure semantics. The element for
 * disclosure is `<details>`/`<summary>`, which this framework already
 * auto-injects (Law 0 — the tag IS the behavior).
 *
 * WHY IT SURVIVED THREE "FIXES". Measured before removal, clicking the legend:
 *
 *   classes           x-fieldset x-fieldset--collapsed   (on a fieldset that
 *                                                         was NOT collapsed)
 *   legend cursor     auto        (nothing said it was clickable)
 *   height            73 -> 73    (the click did nothing)
 *   body visible      [true,true] -> [true,true]
 *
 * Three causes, each hidden behind the last:
 *   1. Implemented TWICE — fieldset.js and enhancements.js — both assigning
 *      `legend.onclick`. That is a property, not a listener, so whichever
 *      module ran second silently erased the first.
 *   2. `fieldset` had NO entry in src/styles/behavior-css-manifest.js, so
 *      src/styles/behaviors/fieldset.css was never loaded. The class was
 *      applied and the stylesheet that acts on it never arrived.
 *   3. #697 and #752 each fixed the attribute *reading* and declared victory —
 *      What's New announced it working twice — because a class-name assertion
 *      passes whether or not anything visibly collapses.
 *
 * This test asserts the removal, and asserts it by BEHAVIOR, not by class name.
 */

import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { ROOT } from '../base';

test.describe('fieldset is not collapsible (#999)', () => {
  test('the schema declares no collapse attributes', () => {
    const schema = JSON.parse(
      fs.readFileSync(path.join(ROOT, 'src/wb-models/fieldset.schema.json'), 'utf8')
    );
    const text = JSON.stringify(schema).toLowerCase();
    expect(
      text.includes('collaps'),
      'fieldset.schema.json still mentions collapsing — the attribute was removed in #999'
    ).toBe(false);
  });

  test('neither implementation still toggles a collapse class', () => {
    for (const file of ['src/wb-viewmodels/fieldset.js', 'src/wb-viewmodels/enhancements.js']) {
      const src = fs.readFileSync(path.join(ROOT, file), 'utf8');
      // Comments explaining the removal are fine; live code is not.
      const code = src
        .split('\n')
        .filter((l) => !l.trim().startsWith('//') && !l.trim().startsWith('*'))
        .join('\n');
      expect(
        code.includes('x-fieldset--collapsed'),
        `${file} still toggles x-fieldset--collapsed — it was removed in #999`
      ).toBe(false);
      expect(
        code.includes('legend.onclick'),
        `${file} still assigns legend.onclick — that property assignment is why two ` +
          `implementations silently erased each other`
      ).toBe(false);
    }
  });

  test('no demo page offers a collapsible fieldset', () => {
    const offenders: string[] = [];
    const walk = (dir: string) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(full);
        else if (entry.name.endsWith('.html')) {
          const html = fs.readFileSync(full, 'utf8');
          if (/<fieldset[^>]*\bcollapsible\b/i.test(html)) {
            offenders.push(path.relative(ROOT, full).split(path.sep).join('/'));
          }
        }
      }
    };
    walk(path.join(ROOT, 'demos'));
    walk(path.join(ROOT, 'pages'));

    expect(
      offenders,
      offenders.length
        ? `these pages still author <fieldset collapsible>, which now does nothing:\n  ${offenders.join('\n  ')}`
        : ''
    ).toEqual([]);
  });

  test('a fieldset renders its contents and nothing hides them', async ({ page }) => {
    // Asserted by BEHAVIOR. The old tests checked for a class name, which is
    // exactly why an inert toggle passed as fixed twice.
    await page.goto('/?page=behaviors', { waitUntil: 'domcontentloaded' });

    const result = await page.evaluate(async () => {
      const host = document.createElement('div');
      host.style.cssText = 'position:fixed;left:-9999px;top:0;width:400px';
      host.innerHTML =
        '<fieldset id="probe-fs" collapsible><legend>Group</legend>' +
        '<label><input type="checkbox"> One</label>' +
        '<label><input type="checkbox"> Two</label></fieldset>';
      document.body.appendChild(host);
      await new Promise((r) => setTimeout(r, 900));
      const fs = host.querySelector('fieldset')!;
      const legend = fs.querySelector('legend')! as HTMLElement;
      const rows = Array.from(fs.children).filter((c) => c.tagName !== 'LEGEND');
      const visibleBefore = rows.every((r) => r.getBoundingClientRect().height > 0);
      legend.click();
      await new Promise((r) => setTimeout(r, 400));
      const visibleAfter = rows.every((r) => r.getBoundingClientRect().height > 0);
      const classes = fs.className;
      host.remove();
      return { visibleBefore, visibleAfter, classes };
    });

    expect(result.visibleBefore, 'the fieldset must render its controls').toBe(true);
    // The attribute is now inert by design: it must not half-work — no class
    // claiming a collapsed state, and no content disappearing.
    expect(
      result.classes.includes('x-fieldset--collapsed'),
      `a collapsed class was applied (${result.classes}) — the removal is incomplete`
    ).toBe(false);
    expect(
      result.visibleAfter,
      'clicking the legend must not hide the controls — fieldset has no disclosure behavior'
    ).toBe(true);
  });
});
