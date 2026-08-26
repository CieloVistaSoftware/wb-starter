import { test, expect } from '@playwright/test';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { findVoidClosingTags } from '../../scripts/lib/markdown-html.mjs';

/**
 * Live HTML in a .md doc must be parseable.
 *
 * John: "remember all of our .md docs with sample code must work."
 *
 * docs/behaviors-reference.md closed three <div> elements with </input>:
 *
 *     <div x-demo>
 *     <div x-input label="Email" ...>
 *     </input>          <- the parser DISCARDS this
 *     </div>
 *
 * A void element has no closing tag, so `</input>` closes nothing. The
 * <div x-input> stayed open, the next </div> closed THAT, and the outer
 * <div x-demo> was never closed -- so every later section nested inside it.
 * One demo ended up containing 29 other demos and 1.19MB of HTML. The page
 * rendered 8x oversized and hung the renderer outright.
 *
 * Nothing caught it because the markup is valid-LOOKING and the failure is a
 * silent reparent, not an error.
 *
 * Fenced ``` samples are excluded: that text is displayed, never parsed. A
 * wrong closing tag there is a docs-quality issue, not a rendering one, and
 * conflating the two is how three of my own scans miscounted this file.
 */

const DOC_ROOTS = ['docs', 'pages', 'demos'];

function markdownFiles(dir: string, out: string[] = []): string[] {
  let entries: string[];
  try { entries = readdirSync(dir); } catch { return out; }
  for (const name of entries) {
    if (name === 'node_modules' || name.startsWith('.')) continue;
    const p = join(dir, name);
    let s;
    try { s = statSync(p); } catch { continue; }
    if (s.isDirectory()) markdownFiles(p, out);
    else if (name.endsWith('.md')) out.push(p);
  }
  return out;
}

const DOCS = DOC_ROOTS.flatMap((d) => markdownFiles(d));

test.describe('docs: live HTML is parseable', () => {
  test('the sweep actually found docs', () => {
    // A glob that matches nothing reports perfect compliance forever (#863).
    expect(DOCS.length, 'no markdown docs were scanned').toBeGreaterThan(50);
  });

  test('no doc closes a void element', () => {
    const findings: string[] = [];
    for (const file of DOCS) {
      let md: string;
      try { md = readFileSync(file, 'utf8'); } catch { continue; }
      for (const hit of findVoidClosingTags(md)) {
        findings.push(`  ${file.replace(/\\/g, '/')}:${hit.line}  </${hit.tag}>`);
      }
    }
    expect(
      findings.length,
      `\n${findings.join('\n')}\n\n` +
      `<${'input'}>, <img>, <br> and friends are VOID -- they have no closing tag. ` +
      `Writing one does not close the element you meant; the parser drops it and ` +
      `whatever was actually open stays open and absorbs the rest of the page. ` +
      `Close the real element instead (usually </div>).`,
    ).toBe(0);
  });
});
