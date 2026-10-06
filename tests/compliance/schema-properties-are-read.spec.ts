import { test, expect } from '@playwright/test';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

/**
 * EVERY PROPERTY A SCHEMA DECLARES IS READ BY ITS BEHAVIOR (#669)
 * ===============================================================
 * A schema is a promise. The Behaviors page, IntelliSense and the docs all
 * repeat it, so a declared property the behavior never reads is an option that
 * silently does nothing. John hit it twice: "audio showdisplay shows nothing"
 * and "none of the dialogs work". The last one this gate found was
 * sticky.animated: the schema, docs and demo said `animated`, sticky.js read
 * `animate`, and nothing used even that.
 *
 * The audit resolves each schema the way the runtime does -- through the
 * behavior registry in src/wb-viewmodels/index.js -- and counts a property as
 * read when the module names it, the schema builder applies it, or a
 * stylesheet styles it on the behavior's host. See
 * scripts/lib/schema-behavior-reads.mjs; `node scripts/audit-schema-vs-behavior.mjs`
 * prints the same result.
 *
 * Static: it reads files, no browser.
 */

test('every declared schema property is read by the behavior that declares it (#669)', async () => {
  const lib = pathToFileURL(path.join(process.cwd(), 'scripts', 'lib', 'schema-behavior-reads.mjs')).href;
  const { auditSchemaReads } = await import(lib);
  const { checked, unresolved, unread } = await auditSchemaReads(process.cwd());

  // The first audit matched by filename and skipped 78 schemas while
  // reporting the rest clean. A resolver that finds nothing passes vacuously.
  expect(checked, 'the audit resolved almost no schemas -- it is broken, not clean').toBeGreaterThan(100);

  expect(
    unresolved,
    'these component schemas resolve to no behavior in src/wb-viewmodels/index.js. Register the ' +
    'behavior, set the schema\'s schemaFor to the registered name, or (if it is not a component) ' +
    'add it to NOT_COMPONENTS in scripts/lib/schema-behavior-reads.mjs',
  ).toEqual([]);

  expect(
    unread.map((r) => `${r.schema} (${r.module}): ${r.unread.join(', ')}`),
    'these schemas declare properties their behavior never reads, so setting them does nothing. ' +
    'Implement the property, or remove it from the schema -- a schema that lies is worse than a ' +
    'smaller one',
  ).toEqual([]);
});
