import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { setupBehaviorTest, setupTestContainer } from '../base';

/**
 * Every schema.json may declare `semanticElement.tagName` -- a promise that
 * the live component is a superset of that real native element (the way
 * <wb-select> must be a superset of <select>, not a replacement for it --
 * see #360). Nothing has ever enforced that promise: found live via a
 * systemic audit (docs/audits/HOST-CHILD-DISPATCH-AUDIT.md) after #360 and
 * #361 both turned out to be a schema declaring native intent it never
 * delivered. wb-dialog and wb-table are CONFIRMED existing violations,
 * deferred pending a maintainer decision (rebuild vs. relax the schema
 * claim) rather than fixed here -- this test exists to make sure the list
 * of violations never grows past what's explicitly acknowledged below.
 *
 * Only checked against tags with no adequate ARIA-only substitute --
 * select/table/dialog/details/textarea get real browser behavior (keyboard
 * handling, native pickers, form participation) that role="..." alone
 * cannot replicate. Generic div/span semanticElement declarations are
 * skipped: virtually every component nests a div/span somewhere, so
 * checking for one is not a meaningful assertion.
 *
 * `button` and `progress` are deliberately NOT in this list even though
 * their schemas declare those tagNames: both ship a complete, documented
 * ARIA-widget reimplementation instead (role="progressbar" +
 * aria-valuenow/min/max for progress; role="button" + tabindex="0" for
 * button) rather than an accidental drift from the schema. progress's ARIA
 * pattern is complete and correct (a progress bar isn't focusable/
 * interactive, so aria-value* alone is the full WAI-ARIA contract).
 * button's is NOT complete -- confirmed live that a focused <wb-button>
 * does not respond to Enter/Space at all, which the ARIA button pattern
 * requires -- but that's a keyboard-activation bug, not a
 * declares-vs-delivers-the-tag bug, so it's tracked separately rather than
 * forcing it through this test's tag-presence check.
 */
const STRICT_TAGS = new Set(['select', 'table', 'dialog', 'details', 'textarea']);

// schemaFor -> tracking issue. Remove an entry only once the component is
// verified (via its own regression test) to actually deliver the tag.
const KNOWN_VIOLATIONS: Record<string, string> = {
  dialog: 'declares tagName:"dialog" but the live element stays a custom tag with no showModal() -- flagged in HOST-CHILD-DISPATCH-AUDIT.md, fix pending maintainer go-ahead',
  table: 'declares tagName:"table" but $view never builds one -- #see HOST-CHILD-DISPATCH-AUDIT.md',
};

const SCHEMA_DIR = path.join(process.cwd(), 'src/wb-models');

interface SchemaEntry {
  file: string;
  schemaFor: string;
  tagName: string;
  setupHtml: string;
}

function loadCandidates(): SchemaEntry[] {
  if (!fs.existsSync(SCHEMA_DIR)) return [];
  const results: SchemaEntry[] = [];
  for (const file of fs.readdirSync(SCHEMA_DIR)) {
    if (!file.endsWith('.schema.json') || file.includes('.base.')) continue;
    let schema: any;
    try {
      schema = JSON.parse(fs.readFileSync(path.join(SCHEMA_DIR, file), 'utf-8'));
    } catch {
      continue;
    }
    const tagName = schema?.semanticElement?.tagName;
    if (!tagName || !STRICT_TAGS.has(tagName)) continue;
    const setupHtml = schema?.test?.setup?.[0];
    if (!setupHtml) continue;
    results.push({ file, schemaFor: schema.schemaFor, tagName, setupHtml });
  }
  return results;
}

test.describe('schema-declared semanticElement.tagName is actually delivered in the rendered DOM', () => {
  test.beforeEach(async ({ page }) => {
    await setupBehaviorTest(page);
  });

  for (const entry of loadCandidates()) {
    const known = KNOWN_VIOLATIONS[entry.schemaFor];
    test(`${entry.file}: declares "${entry.tagName}" ${known ? '(KNOWN VIOLATION, tracked)' : ''}`, async ({ page }) => {
      const el = await setupTestContainer(page, entry.setupHtml);
      const isHostTheTag = await el.evaluate((node, tag) => node.tagName.toLowerCase() === tag, entry.tagName);
      const hasDescendantTag = await el.evaluate(
        (node, tag) => !!node.querySelector(tag),
        entry.tagName
      );
      const delivers = isHostTheTag || hasDescendantTag;

      if (known) {
        // Acknowledged, tracked violation -- assert it STAYS broken so this
        // test starts failing (forcing an update) the moment someone fixes
        // it without updating KNOWN_VIOLATIONS, instead of silently passing
        // on a fix nobody documented.
        expect(delivers, `${entry.schemaFor} now delivers "${entry.tagName}" -- remove it from KNOWN_VIOLATIONS in this test`).toBe(false);
      } else {
        expect(delivers, `${entry.schemaFor} declares semanticElement.tagName="${entry.tagName}" but no "${entry.tagName}" element (host or descendant) was found in the rendered output`).toBe(true);
      }
    });
  }
});
