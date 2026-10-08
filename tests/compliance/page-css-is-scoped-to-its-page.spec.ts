import { test, expect } from '../fixtures/offline';
import * as fs from 'fs';
import * as path from 'path';

/**
 * #780: a page stylesheet never selects a bare element.
 *
 * src/styles/pages/<page>.css is linked from the page's own HTML, and the SPA
 * keeps it loaded after navigating away. So `header { ... }` in behaviors.css
 * styled every <header> on the site, not just the behaviors page's: 41.89px
 * (`--space-xl`) under the site header, under the behaviors panel strip and
 * under every card header, each found one at a time and "fixed" by zeroing
 * that one element. `footer { ... }` from the same file gave the SITE footer a
 * 42px top margin, centered text and rounded corners on the behaviors page.
 *
 * A page rule reaches only its page through the SPA's container:
 *
 *     :where(#mainPage-behaviors) section { ... }
 *
 * `:where()` adds no specificity, so the page renders as before and every
 * other page stops being reached.
 */

const PAGES_DIR = path.join(process.cwd(), 'src', 'styles', 'pages');

// Linked only from a standalone document, never loaded into the SPA, so its
// bare `body` / `section` / `h2` rules style that one page and nothing else.
const STANDALONE: Record<string, string> = {
  'frameworks.css': 'demos/frameworks.html only',
};

const BARE = /^(html|body|header|footer|nav|main|section|article|aside|h[1-6]|p|ul|ol|li|a|button|input|select|textarea|table|img|div|span|form|label|details|summary)\b(?![-\w])[^.#[]*$/;

/** Every selector in a stylesheet that starts at, and only names, bare elements. */
function bareSelectors(css: string): string[] {
  const stripped = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const out: string[] = [];
  const re = /([^{}@;]+)\{/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(stripped))) {
    for (const sel of m[1].split(',').map((s) => s.trim())) {
      if (BARE.test(sel)) out.push(sel);
    }
  }
  return out;
}

test('the scan finds a bare element rule and leaves scoped and classed ones alone', () => {
  expect(bareSelectors('header { margin: 0 }')).toEqual(['header']);
  expect(bareSelectors('/* note */\nfooter a:hover { color: red }')).toEqual(['footer a:hover']);
  expect(bareSelectors(':where(#mainPage-x) header { margin: 0 }')).toEqual([]);
  expect(bareSelectors('.site__header, header.x { margin: 0 }')).toEqual([]);
  expect(bareSelectors('@media (max-width: 600px) { .a { b: c } }')).toEqual([]);
});

test('no page stylesheet styles an element on every page (#780)', () => {
  const found: string[] = [];
  for (const file of fs.readdirSync(PAGES_DIR).filter((f) => f.endsWith('.css'))) {
    if (STANDALONE[file]) continue;
    for (const sel of bareSelectors(fs.readFileSync(path.join(PAGES_DIR, file), 'utf8'))) {
      found.push(`src/styles/pages/${file}: ${sel}`);
    }
  }
  expect(
    found,
    'These page-stylesheet rules select a bare element, so once the page has been\n' +
    'visited they style that element on EVERY page. Scope each to its page:\n' +
    '  :where(#mainPage-<page>) <selector>',
  ).toEqual([]);
});
