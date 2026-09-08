/**
 * THE TEMPLATE IS A SNAPSHOT, AND NOTHING WAS COMPARING IT
 * =======================================================
 * #1052. `packages/create-wb-starter/template/` carries its own copy of the
 * documentation a new project starts with. Nothing checked those copies against
 * the originals, so they drifted — silently, and only visible to someone
 * creating a new project, which is the worst possible time and place to find it.
 *
 * Found via #1028: a `demo.mp4` that does not exist was fixed in
 * `docs/behavior-cross-reference.md` and not in the template's copy of the same
 * file, so a new project's doc-viewer logged two media-load-retry errors on
 * first open.
 *
 * Two things are wrong and they are different:
 *
 *   DRIFT      a document exists in both places and they disagree.
 *   STALENESS  a document exists ONLY in the template, describing an
 *              architecture the framework no longer has — the whole
 *              `components/` tree, which 4.0.0 removed.
 *
 * INTENTIONAL is deliberately empty. Any entry added here has to carry a reason
 * a person can disagree with; "it drifted and nobody reconciled it" is not one.
 * An allowlist that absorbs every failure is the same as no gate at all, which
 * is what this repo already had.
 */

import { test, expect } from '@playwright/test';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const TEMPLATE_DOCS = join(ROOT, 'packages/create-wb-starter/template/docs');
const REPO_DOCS = join(ROOT, 'docs');

/** doc path -> why it is allowed to differ. Must be a reason, not an excuse. */
const INTENTIONAL: Record<string, string> = {};

/** Trees the template has no business shipping at all: internal working notes. */
const NOT_FOR_A_NEW_PROJECT = ['_today/'];

function walk(dir: string, base = dir, out: string[] = []): string[] {
  let entries;
  try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return out; }
  for (const e of entries) {
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p, base, out);
    else out.push(relative(base, p).split('\\').join('/'));
  }
  return out;
}

/** Line endings and trailing whitespace are not drift. */
const norm = (s: string) => s.split('\r\n').join('\n').trimEnd();

test('every doc the template shares with the repo is identical', () => {
  const templateDocs = walk(TEMPLATE_DOCS).sort();

  expect(
    templateDocs.length,
    'No template docs were found at all — the derivation is broken, which would reduce ' +
    'this test to asserting nothing.',
  ).toBeGreaterThan(50);

  const drifted: string[] = [];
  for (const rel of templateDocs) {
    if (INTENTIONAL[rel]) continue;
    if (NOT_FOR_A_NEW_PROJECT.some((p) => rel.startsWith(p))) continue;
    const original = join(REPO_DOCS, rel);
    if (!existsSync(original)) continue; // staleness, asserted separately below
    if (norm(readFileSync(join(TEMPLATE_DOCS, rel), 'utf8')) !== norm(readFileSync(original, 'utf8'))) {
      drifted.push(rel);
    }
  }

  expect(
    drifted,
    `${drifted.length} document(s) exist in both docs/ and the template and disagree.\n` +
    'A new project starts from the template copy, so every one of these ships stale\n' +
    'documentation to someone who has no way to know it is stale. Reconcile by copying\n' +
    'the repo original over the template copy, or add it to INTENTIONAL with a reason.',
  ).toEqual([]);
});

test('the template ships no documentation for architecture the framework removed', () => {
  const templateDocs = walk(TEMPLATE_DOCS);

  // 4.0.0 removed components; everything is a behaviour. A doc tree describing
  // components teaches a new project an architecture its own dependency does
  // not have.
  const components = templateDocs.filter((f) => f.startsWith('components/'));

  expect(
    components,
    `${components.length} file(s) under template/docs/components/ describe components, which\n` +
    '4.0.0 removed. The repo itself has no docs/components/ at all. Delete the tree, or\n' +
    'replace it with the behaviours documentation that actually applies.',
  ).toEqual([]);
});
