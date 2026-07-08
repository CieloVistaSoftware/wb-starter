import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * #255: docs/architecture/standards/ATTRIBUTE-NAMING-STANDARD.md illustrated
 * its own naming conventions with invented, non-wb-prefixed custom-element
 * tags (`<price-card>`, `<alert-box>`, `<basic-card>`, `<card-el>`, ...) and
 * a "Migration from x-behavior" section whose "New Standard" examples
 * (`<basic-card heading="…">`) don't match actual v3 syntax (`<wb-card
 * title="…">`, verified against src/wb-models/card.schema.json). Rewrote
 * every example to use real `<wb-*>` tags (or the real `x-*` behavior
 * attribute / native element, verified against src/core/tag-map.js and
 * src/core/wb-lazy.js's autoInjectMappings) and replaced the migration
 * section with an accurate legacy-vs-v3 comparison.
 */
const DOC_PATH = path.join(process.cwd(), 'docs/architecture/standards/ATTRIBUTE-NAMING-STANDARD.md');

const NATIVE_HYPHENATED_TAGS = new Set(['x-behavior']); // not a real tag, appears only in prose/code as an attribute name

test.describe('ATTRIBUTE-NAMING-STANDARD.md uses only wb-* custom tags (#255)', () => {
  test('every hyphenated custom-element tag in the doc is wb-prefixed', () => {
    const md = fs.readFileSync(DOC_PATH, 'utf8');
    const tagPattern = /<([a-z][a-z0-9]*-[a-z0-9-]+)(?=[\s>/])/g;
    const found = new Set<string>();
    let match: RegExpExecArray | null;
    while ((match = tagPattern.exec(md)) !== null) {
      found.add(match[1]);
    }
    const offenders = [...found].filter(
      (tag) => !tag.startsWith('wb-') && !NATIVE_HYPHENATED_TAGS.has(tag)
    );
    expect(offenders, `non-wb-prefixed custom tags found: ${offenders.join(', ')}`).toEqual([]);
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
    await expect(page.locator('#content')).toContainText('WB-Starter Attribute Naming Standard');
    await expect(page.locator('#content')).not.toContainText('404');
    await expect(page.locator('#content')).toContainText('wb-cardpricing');
  });
});
