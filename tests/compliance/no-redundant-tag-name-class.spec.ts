import { test, expect } from '../fixtures/offline';
import { globSync } from 'glob';

import { settlePage } from '../base';
/**
 * #447: <div x-demo> carried a class="[x-demo]" that just repeated its own tag
 * name -- no CSS anywhere selected the bare class (every real rule targets
 * the `[x-demo]` TAG itself, or a `.x-demo__*`/`.x-demo--*` BEM sub-part or
 * modifier). Enforced site-wide so the same redundant pattern can't creep
 * back in on this or any other <wb-*> component: if a component's styling
 * ever seems to need "class == own tag name", the fix is to select the TAG
 * in the stylesheet instead of adding a same-named class at runtime.
 */

const FILES = [
  ...globSync('demos/**/*.html', { cwd: process.cwd(), posix: true }),
  ...globSync('pages/**/*.html', { cwd: process.cwd(), posix: true }),
].sort();

for (const file of FILES) {
  test(`${file}: no <wb-*> element carries a class matching its own tag name`, async ({ page }) => {
    const urlPath = '/' + file.replace(/\\/g, '/');
    await page.goto(urlPath, { waitUntil: 'domcontentloaded' });
    // Everything that could warn or fail has run once WB settles, where the page boots it (#1516: no fixed sleep).
    await settlePage(page, { timeout: 15000 }).catch(() => {});

    const violations = await page.evaluate(() => {
      const problems: string[] = [];
      document.querySelectorAll('*').forEach((el) => {
        const tag = el.tagName.toLowerCase();
        if (!tag.startsWith('wb-')) return;
        if (el.classList.contains(tag)) {
          problems.push(`<${tag}> carries class="${tag}" -- redundant, select the tag in CSS instead`);
        }
      });
      return problems;
    });

    expect(violations, `${file}:\n${violations.join('\n')}`).toHaveLength(0);
  });
}
