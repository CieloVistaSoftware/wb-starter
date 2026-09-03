import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { setupBehaviorTest, setupTestContainer } from '../base';

/**
 * Every schema.json may declare `semanticElement.tagName` -- a promise that
 * the live component is a superset of that real native element (the way
 * <select> must be a superset of <select>, not a replacement for it --
 * see #360). Nothing has ever enforced that promise: found live via a
 * systemic audit (docs/audits/HOST-CHILD-DISPATCH-AUDIT.md) after #360 and
 * #361 both turned out to be a schema declaring native intent it never
 * delivered. x-dialog and x-table are CONFIRMED existing violations,
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
 * button's is NOT complete -- confirmed live that a focused <button>
 * does not respond to Enter/Space at all, which the ARIA button pattern
 * requires -- but that's a keyboard-activation bug, not a
 * declares-vs-delivers-the-tag bug, so it's tracked separately rather than
 * forcing it through this test's tag-presence check.
 */
const STRICT_TAGS = new Set(['select', 'table', 'dialog', 'details', 'textarea']);

// schemaFor -> tracking issue. Remove an entry only once the component is
// verified (via its own regression test) to actually deliver the tag.
const KNOWN_VIOLATIONS: Record<string, string> = {
  // Emptied in #920. `dialog` and `table` both lived here and both were
  // stale: verified on the dev server, running each schema's own
  // test.setup[0] through WB.scan() exactly as tests/base.ts does --
  //   <table>...</table>   -> table.x-table.x-table--hover
  //   <dialog>...</dialog> -> dialog.x-dialog.x-modal
  //                           instanceof HTMLDialogElement === true
  //                           typeof showModal === 'function'
  // The recorded dialog claim ("stays a custom tag with no showModal()")
  // describes the retired wb-dialog custom element, not this code.
  //
  // CAUTION when adding an entry here, and when reading a PASS from this
  // spec: a schema whose test.setup[0] HAND-WRITES the asserted tag makes
  // `isHostTheTag` true by construction. Both entries above were exactly
  // that shape, so the check could never have failed for the reason it was
  // written to catch. A green result here is evidence of delivery only when
  // the setup markup does not already contain the tag. #920 tracks giving
  // this spec a case the setup does not pre-satisfy.
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
