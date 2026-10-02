import { test, expect } from '../fixtures/offline';
import * as fs from 'fs';
import * as path from 'path';

/**
 * #255: docs/architecture/standards/ATTRIBUTE-NAMING-STANDARD.md illustrated
 * its own naming conventions with invented, non-wb-prefixed custom-element
 * tags (`<price-card>`, `<alert-box>`, `<article>`, `<card-el>`, ...) and
 * a "Migration from x-behavior" section whose "New Standard" examples
 * (`<article heading="…">`) don't match actual v3 syntax (`<article
 * title="…">`, verified against src/wb-models/card.schema.json). Rewrote
 * every example to use real `<wb-*>` tags (or the real `x-*` behavior
 * attribute / native element, verified against src/core/tag-map.js and
 * src/core/wb-lazy.js's autoInjectMappings) and replaced the migration
 * section with an accurate legacy-vs-v3 comparison.
 */
const DOC_PATH = path.join(process.cwd(), 'docs/architecture/standards/ATTRIBUTE-NAMING-STANDARD.md');

const NATIVE_HYPHENATED_TAGS = new Set(['x-behavior']); // not a real tag, appears only in prose/code as an attribute name

// #1144: this demanded every custom tag be wb-prefixed. <wb-*> tags were
// retired in 4.0.0: there are no custom-element tags at all now, so the doc
// may show none -- only semantic elements and x-* attributes.
test.describe('ATTRIBUTE-NAMING-STANDARD.md shows no custom-element tags (#255, #1144)', () => {
  test('no hyphenated custom-element tag appears in the doc', () => {
    const md = fs.readFileSync(DOC_PATH, 'utf8');
    const tagPattern = /<([a-z][a-z0-9]*-[a-z0-9-]+)(?=[\s>/])/g;
    const found = new Set<string>();
    let match: RegExpExecArray | null;
    while ((match = tagPattern.exec(md)) !== null) {
      found.add(match[1]);
    }
    const offenders = [...found].filter(
      (tag) => !NATIVE_HYPHENATED_TAGS.has(tag)
    );
    expect(offenders, `custom-element tags found (retired; use the semantic element or x-*): ${offenders.join(', ')}`).toEqual([]);
  });

  test('legacy x-behavior="…" pattern only appears inside the "Migration from Legacy Syntax" section', () => {
    const md = fs.readFileSync(DOC_PATH, 'utf8');
    const lines = md.split('\n');
    let currentSection = '';
    lines.forEach((line, i) => {
      if (/^## /.test(line)) currentSection = line.trim();
      if (line.includes('x-behavior="')) {
        expect(
          currentSection,
          `line ${i + 1} uses x-behavior="…" outside the migration section:\n${line}`
        ).toBe('## Migration from Legacy Syntax');
      }
    });
  });

  test('doc-viewer renders the file without a 404 or missing-content error', async ({ page }) => {
    await page.goto('/public/doc-viewer.html?file=docs/architecture/standards/ATTRIBUTE-NAMING-STANDARD.md', {
      waitUntil: 'networkidle',
    });
    // The doc-viewer renders every hyphen in prose as U+2011 (non-breaking
    // hyphen) so a token like `x-toast` never splits across lines (#295) --
    // "WB-Starter" arrives as "WB‑Starter", and a literal-hyphen substring
    // match never matches. Compare the text with hyphens folded back.
    const text = async () => ((await page.locator('#content').textContent()) || '').replace(/\u2011/g, '-');
    await expect.poll(text).toContain('WB-Starter Attribute Naming Standard');
    expect(await text()).not.toContain('404');
    // The doc shows the attribute form on a neutral host (`<div x-cardpricing>`);
    // it no longer writes the bare `[x-cardpricing]` selector form this looked for.
    expect(await text()).toContain('<div x-cardpricing');
  });
});
