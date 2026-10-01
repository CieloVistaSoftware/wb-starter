import { test, expect } from '../fixtures/offline';
// @ts-ignore -- plain ESM helper shared with scripts/audit-md-links.mjs
import { auditInternal } from '../../scripts/lib/md-links.mjs';

/**
 * GATE: every internal link in every tracked .md file works.
 *
 * "write a test that proves all links in all of our .md documents work,
 * consider it an audit" -- John. The audit is scripts/audit-md-links.mjs; this
 * spec is its internal half as a gate, so a broken link cannot come back.
 * Both use scripts/lib/md-links.mjs, so they cannot disagree about what a
 * link is or where it points.
 *
 * Checked, for every `git ls-files '*.md'` (inline, image, reference,
 * autolink, <a href>, <img src>; code blocks and inline code are skipped):
 *   - the target file exists (relative to the doc, `/` = repo root,
 *     doc-viewer `?file=` = repo root, `?page=x` = pages/x.html);
 *   - a `#fragment` exists in the target: for .md under BOTH the doc viewer's
 *     slugs (mdhtml.js) and GitHub's, because docs are read in both places;
 *     for .html as an id/name. `#top` is always valid.
 *
 * Web links are NOT checked here: the network does not belong in the
 * compliance suite. `node scripts/audit-md-links.mjs --external` checks them.
 *
 * Law 5: with the 2026-10-01 doc fixes reverted this fails with 69 broken
 * links (4 wrong anchors, 65 dead routes in demo markup).
 */
test('every internal link in every .md document resolves', () => {
  const { files, links, broken } = auditInternal();
  expect(files, 'found the tracked markdown').toBeGreaterThan(100);
  expect(links, 'found the links').toBeGreaterThan(100);
  const report = broken.map(
    (b: { from: string; line: number; dest: string; detail: string }) =>
      `${b.from}:${b.line}  ${b.dest}  -- ${b.detail}`,
  );
  expect(report, `${broken.length} broken link(s) of ${links} in ${files} files`).toEqual([]);
});
