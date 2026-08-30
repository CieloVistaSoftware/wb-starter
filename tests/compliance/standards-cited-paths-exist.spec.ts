import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Every file path a standards doc cites actually exists.
 *
 * A standard that names its own enforcing test is only as good as that name.
 * `DEMOS-AND-DOCS-STANDARDS.md` cited four tests that no longer existed under
 * the names given:
 *
 *   §1/§2  tests/integration/doc-viewer-x-demo.spec.ts
 *   §3/§5  tests/integration/demo-compare-code-blocks.spec.ts
 *   §4     demo-compare-code-blocks.spec.ts
 *   §9     tests/compliance/no-legacy-behavior-inheritance-docs.spec.ts
 *
 * Two were renamed and one never existed. §9's is the sharpest: the
 * component→behavior rename rewrote the doc's TEXT but not the FILE, so the
 * doc cited `no-legacy-behavior-inheritance-docs` while the file on disk is
 * still `no-legacy-component-inheritance-docs`. The rule looked enforced and
 * the citation pointed at nothing — worse than no citation, because a reader
 * checking the rule stops at a name that reads plausible.
 *
 * Checked mechanically because it cannot be checked by eye: the names are
 * long, similar, and correct-looking when wrong.
 */

const STANDARDS_DIR = 'docs/standards';

/** A repo-relative path with a source-file extension. */
const PATH_RE = /(?:tests|src|docs|demos|pages|scripts|packages|public)\/[A-Za-z0-9_./-]+\.(?:ts|js|mjs|md|css|html|json)/g;

/** Inside a fenced code block a path is often illustrative, not a citation. */
function stripFences(md: string): string {
  return md.replace(/```[\s\S]*?```/g, '');
}

function markdownFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .map((f) => path.join(dir, f));
}

test.describe('standards docs cite real files', () => {
  const docs = markdownFiles(STANDARDS_DIR);

  test('the sweep actually ran', () => {
    // An empty directory would report perfect compliance forever.
    expect(docs.length, `no markdown found in ${STANDARDS_DIR}`).toBeGreaterThan(0);
  });

  test('every cited path resolves', () => {
    const broken: string[] = [];
    let checked = 0;

    for (const doc of docs) {
      const text = stripFences(fs.readFileSync(doc, 'utf8'));
      const cited = new Set(text.match(PATH_RE) || []);
      for (const rel of cited) {
        checked++;
        if (!fs.existsSync(rel)) {
          broken.push(`${doc.split(path.sep).join('/')} cites ${rel}, which does not exist`);
        }
      }
    }

    // A doc that cites nothing would pass the check below trivially.
    expect(checked, 'no citations were found to check').toBeGreaterThan(10);
    expect(
      broken,
      'a standard that names its enforcing test must name one that exists',
    ).toEqual([]);
  });
});
