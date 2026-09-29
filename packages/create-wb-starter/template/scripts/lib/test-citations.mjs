/**
 * test-citations.mjs — which issues a spec CLAIMS to prove
 *
 * #1090. Lives here, apart from issue-state.mjs, for one concrete reason:
 * issue-state.mjs runs its report at module scope, so importing it EXECUTES it.
 * A spec that imported it collected zero tests and Playwright reported that as
 * a pass — the same silent-pass shape as #975. A pure function has to be
 * importable without starting a program.
 */

/**
 * Issue numbers named in a spec's `test(...)` / `describe(...)` TITLES.
 *
 * TITLES ONLY, and that is the whole design.
 *
 * The first draft matched `#NNNN` anywhere in the file. It credited #1080 with
 * a spec whose author had explicitly failed to diagnose it, because the file
 * contained:
 *
 *   // awaiting what it starts and whenIdle() reporting it. Filed as #1080 so
 *
 * A comment saying an issue was FILED is the opposite of a test proving it
 * fixed. That is #1041 (a file containing "#1234" counted as work on it) and
 * #1085 (a comment reading "zero <x-demo>" counted as an <x-demo>) for the third
 * time — prose read as source truth.
 *
 * A test title is the assertion surface: naming an issue there is a claim about
 * what is being proven, made by the person proving it.
 *
 * @param {string} text a spec file's source
 * @returns {Set<number>}
 */
export function issuesNamedInTestTitles(text) {
  const out = new Set();
  // test( / test.skip( / test.describe( / describe( — then the title string.
  const TITLE = /\b(?:test|describe)(?:\.\w+)*\s*\(\s*(['"`])((?:(?!\1).)*)\1/g;
  for (const t of String(text ?? '').matchAll(TITLE)) {
    for (const m of t[2].matchAll(/#(\d{2,5})(?!\d)/g)) out.add(Number(m[1]));
  }
  return out;
}
