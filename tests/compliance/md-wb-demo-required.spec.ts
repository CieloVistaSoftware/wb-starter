/**
 * Rule 4 (docs/code-examples-standard.md, #307): a markdown code example
 * showing real wb-* / x-* markup must be a live wb-demo block, not a plain
 * static html fence.
 *
 * This is a focused policy gate for the issue's zero-demo corpus. The existing
 * legacy files remain an explicit migration baseline; a new all-static doc is
 * a failure, while partial conversions continue to be reported for follow-up.
 *
 * Heuristic: a fence "shows real component usage" if it contains a wb-*
 * custom tag or an x-* attribute. CSS/JS fences, reference tables, and
 * intentionally-invalid markup (no wb-* / x-* content) are not flagged.
 */
import { expect, test } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const DOCS_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../docs');

function mdFiles(dir: string, acc: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', '.git'].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) mdFiles(full, acc);
    else if (entry.name.endsWith('.md')) acc.push(full);
  }
  return acc;
}

const RENDERABLE = /<(wb-[a-z-]+)[\s>]|\sx-[a-z][a-z0-9-]*(=|[\s>])/;
const WB_DEMO_OPEN = String.fromCharCode(60) + 'wb-demo';

// These are the issue #423 legacy files. They remain visible in the audit
// report until their examples are migrated, but new zero-demo files are not
// allowed to accumulate alongside them.
const LEGACY_ZERO_DEMO_FILES = new Set([
  'architecture/standards/ATTRIBUTE-NAMING-STANDARD.md',
  'architecture/standards/SCHEMA-SPECIFICATION.md',
  'architecture/WBVIEWS.md',
  'Auto-Injection.md',
  'behaviors/autosize.md',
  'behaviors/label.md',
  'behaviors/wb-card.md',
  'behaviors/wb-control.md',
  'behaviors/wb-repeater.md',
  'behaviors/wb-search.md',
  'components/cards/cards.readme.md',
  'components/feedback/feedback.readme.md',
  'components/forms/forms.readme.md',
  'components/layout/layout.readme.md',
  'components/navigation/navigation.readme.md',
  'components/README.md',
  'components/semantic/semantic.readme.md',
  'components/semantics/dl.md',
  'components/semantics/figure.md',
  'components/semantics/list.md',
  'components/semantics/ol.md',
  'components/semantics/pre.md',
  'components/semantics/radio.md',
  'components/semantics/range.md',
  'components/semantics/table.md',
  'components/semantics/ul.md',
  'escape-hatches.md',
  'guides/search-index.md',
  'linkedin-standards-article.md',
  'MVVM-MIGRATION-PLAN.md',
  'MVVM-MIGRATION.md',
  'pce-candidates.md',
  'pricecard.md',
  'search.md',
  'semantic-standard.md',
  'themes.md',
  'wb-parts-spec.md',
  'wbservices.md',
  'WB_BEHAVIOR_SYSTEM.md',

  // Issue #554 (#307): these two are a different bucket than the #423 migration
  // debt above — not "not yet converted," but permanently exempt because their
  // fences are not real component usage:
  // - claude/TIER1-LAWS.md's Law 11 fence intentionally nests an unclosed
  //   "WRONG" wb-alert/x-stepper/x-toast example against a "CORRECT" one to
  //   teach AI agents the attribute-naming rule. Making a rule-violation
  //   example "live" would render broken/invalid markup and defeats the
  //   point — this is exactly the "intentionally-invalid markup demonstrating
  //   what NOT to do" exception carved out by code-examples-standard.md Rule 4.
  // - architecture/proposals/remove-wb-prefix-authoring-surface.md's "Today"
  //   vs "Proposed" fence contrasts current `<wb-card>` markup (shown with
  //   placeholder `...` content, not real attributes) against the `x-card`
  //   attribute-detection form the proposal is arguing for — which the
  //   proposal's own body confirms is NOT wired into schema-builder.js yet.
  //   A live demo can't render a mechanism that doesn't exist; this is a
  //   future-facing illustration, not current-state runnable markup.
  'claude/TIER1-LAWS.md',
  'architecture/proposals/remove-wb-prefix-authoring-surface.md',
]);

test('audit: markdown code fences that should be live wb-demo blocks (Rule 4, #307)', () => {
  const offenders: { file: string; count: number }[] = [];
  const unexpectedZeroDemoFiles: string[] = [];
  let totalFences = 0;

  for (const file of mdFiles(DOCS_DIR)) {
    const text = fs.readFileSync(file, 'utf8');
    const fenceRe = /```html\n([\s\S]*?)```/g;
    let m;
    let count = 0;
    while ((m = fenceRe.exec(text))) {
      if (RENDERABLE.test(m[1])) count++;
    }
    if (count > 0) {
      totalFences += count;
      offenders.push({ file: path.relative(DOCS_DIR, file), count });
      const relative = path.relative(DOCS_DIR, file).replace(/\\/g, '/');
      if (!text.includes(WB_DEMO_OPEN) && !LEGACY_ZERO_DEMO_FILES.has(relative)) {
        unexpectedZeroDemoFiles.push(relative);
      }
    }
  }

  offenders.sort((a, b) => b.count - a.count);
  const report = offenders.map((o) => `  ${o.file}: ${o.count}`).join('\n');
  console.log(
    `Rule 4 audit: ${totalFences} static fence(s) across ${offenders.length} file(s) still need wb-demo conversion:\n${report}`
  );
  expect(
    unexpectedZeroDemoFiles,
    'New markdown files with executable HTML examples must use wb-demo; add a live demo or explicitly migrate a named legacy file.'
  ).toEqual([]);
});
