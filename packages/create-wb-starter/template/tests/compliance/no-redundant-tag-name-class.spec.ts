import { test, expect } from '@playwright/test';
import { globSync } from 'glob';

/**
 * #447: <div x-demo> carried a class="x-demo" that just repeated its own tag
 * name -- no CSS anywhere selected the bare class (every real rule targets
 * the `x-demo` TAG itself, or a `.x-demo__*`/`.x-demo--*` BEM sub-part or
 * modifier). Enforced site-wide so the same redundant pattern can't creep
 * back in on this or any other <wb-*> behavior: if a behavior's styling
 * ever seems to need "class == own tag name", the fix is to select the TAG
 * in the stylesheet instead of adding a same-named class at runtime.
 */

const FILES = [
  ...globSync('demos/**/*.html', { cwd: process.cwd() }),
  ...globSync('pages/**/*.html', { cwd: process.cwd() }),
].sort();

for (const file of FILES) {
  test(`${file}: no <wb-*> element carries a class matching its own tag name`, async ({ page }) => {
    const urlPath = '/' + file.replace(/\\/g, '/');
    await page.goto(urlPath, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(800); // settle lazy/eager scan

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
