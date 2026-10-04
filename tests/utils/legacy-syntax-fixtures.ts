/**
 * The pages that carry retired syntax ON PURPOSE, by repo-relative path.
 *
 * #1173: specs used to exempt "legacy-syntax-check.html" by file name, and two
 * different files carry that name, so an exemption meant for one silently
 * covered the other (the same collision as #910). Every spec that must look
 * away from these pages asks this module, by path, and
 * tests/compliance/exemptions-name-one-file.spec.ts fails if an entry stops
 * naming a real file or a spec goes back to matching the bare name.
 */
export const LEGACY_SYNTAX_FIXTURES: Readonly<Record<string, string>> = {
  'demos/legacy-syntax-check.html':
    'the legacy-syntax demo: shows the runtime rejecting data-wb (expected-error-log-suppression.spec.ts loads it)',
  'tests/compliance/legacy-syntax-check.html':
    'the strict-mode fixture: carries data-wb so strict-mode-runtime.spec.ts can prove the runtime rejects it',
};

/** True for a repo-relative path (either slash) that is one of the fixtures above. */
export function isLegacySyntaxFixture(repoRelativePath: string): boolean {
  return Object.hasOwn(LEGACY_SYNTAX_FIXTURES, repoRelativePath.replace(/\\/g, '/').replace(/^\.?\//, ''));
}

/** True for a page URL (absolute or root-relative) that serves one of the fixtures. */
export function isLegacySyntaxFixtureUrl(url: string | undefined): boolean {
  if (!url) return false;
  let pathname: string;
  try { pathname = new URL(url, 'http://localhost').pathname; } catch { return false; }
  return isLegacySyntaxFixture(decodeURIComponent(pathname));
}
