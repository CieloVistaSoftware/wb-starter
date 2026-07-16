import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * semantics-forms.html must have well-formed custom-element tags.
 *
 * The demo had <wb-switch> tags with no closing tag and <wb-rating>/<wb-themecontrol>
 * closed with </div>. Unknown custom elements have no auto-close rules, so these
 * nest/swallow each other instead of rendering as siblings — the switch and rating
 * sections don't render correctly. (The all-demos smoke test misses this: malformed
 * tags throw no JS error.)
 */
const html = fs.readFileSync(path.join(process.cwd(), 'demos', 'site', 'forms.html'), 'utf8');

function balance(tag: string) {
  const open = (html.match(new RegExp(`<${tag}[\\s>]`, 'g')) || []).length;
  const close = (html.match(new RegExp(`</${tag}>`, 'g')) || []).length;
  return { open, close };
}

test.describe('semantics-forms.html — well-formed custom elements', () => {
  for (const tag of ['wb-switch', 'wb-rating', 'wb-themecontrol']) {
    test(`<${tag}> is properly closed (open count === </${tag}> count)`, () => {
      const b = balance(tag);
      expect(
        b.close,
        `${tag}: ${b.open} opened but only ${b.close} closed with </${tag}> — the rest are unclosed or wrongly closed with </div>`,
      ).toBe(b.open);
    });
  }
});
