import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

/**
 * #1062: scripts/generate-site.mjs filled every generated demo with the same
 * sentence, "This is example table content.". Text is not allowed directly
 * inside <table>: the parser foster-parents it OUT, in front of the table, so
 * the <table> left behind had no rows and rendered 0x0 -- 12 table demos on
 * demos/site/content.html, the emptiness the placeholder exists to prevent.
 * dfda643c gave tables real rows (TABLE_SAMPLE). This holds the whole class:
 * no generated page may put bare text directly inside an element whose
 * content model forbids it, whichever element the next schema hosts on.
 */
const NO_TEXT_HOSTS = ['table', 'thead', 'tbody', 'tfoot', 'tr', 'colgroup', 'ul', 'ol', 'dl', 'select', 'datalist', 'optgroup', 'menu'];
const BARE_TEXT = new RegExp(`<(${NO_TEXT_HOSTS.join('|')})\\b[^>]*>\\s*([^<\\s][^<]*)`, 'g');

test('no generated demo puts bare text where the parser would throw it out (#1062)', () => {
  const dir = path.join(process.cwd(), 'demos', 'site');
  const pages = fs.readdirSync(dir).filter((f) => f.endsWith('.html'));
  expect(pages.length, 'the generated pages are where the generator writes them').toBeGreaterThan(5);

  const offenders: string[] = [];
  for (const page of pages) {
    const html = fs.readFileSync(path.join(dir, page), 'utf8').replace(/<!--[\s\S]*?-->/g, '');
    for (const m of html.matchAll(BARE_TEXT)) {
      offenders.push(`demos/site/${page}: <${m[1]}> holds the text "${m[2].trim().slice(0, 50)}"`);
    }
  }
  expect(offenders, 'bare text inside a host that cannot hold it renders as an empty element').toEqual([]);
});
