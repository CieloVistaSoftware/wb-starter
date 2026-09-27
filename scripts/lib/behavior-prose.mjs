/**
 * Where a behavior's one-line description may come from, and what does not count.
 *
 * The two generators (generate-behavior-schemas.mjs, generate-behavior-docs.mjs)
 * used to fill every gap with a template sentence: "Schema for x-error behavior
 * (error message)", "Behavior applied with x-clock.", and in every doc
 * "`x-foo` adds behavior that no HTML element implies. Nothing about a tag says
 * "ripple" or "tooltip"…". 89 docs carried that last paragraph with only the
 * token swapped. John: "remove all generic text like this from all .md docs.
 * replace with proper text."
 *
 * A template sentence is worse than a gap: it looks like documentation, so
 * nobody writes the real thing. So a generator takes prose only from a source
 * that is about THIS behavior — the schema's own description, or the JSDoc on
 * the behavior function — and when neither exists it says so and writes
 * nothing, instead of inventing a sentence.
 *
 * tests/compliance/no-boilerplate-docs.spec.ts is the gate.
 */

/** Descriptions that name the schema or the token and say nothing else. */
const FILLER = [
  /^Schema for\b/i,
  /^Behavior applied with\b/i,
  /^The `?x-[\w-]+`? behavior\.?$/i,
  /^Behavior for\b/i,
];

export function isFillerDescription(text) {
  const s = String(text || '').trim();
  if (!s) return true;
  return FILLER.some((re) => re.test(s));
}

/**
 * The summary line of the JSDoc block directly above `export function name(`.
 * `Error - Form error message` -> `Form error message.`
 */
export function jsdocSummary(source, name) {
  const re = new RegExp(`/\\*\\*([\\s\\S]*?)\\*/\\s*export\\s+(?:default\\s+)?(?:async\\s+)?function\\s+${name}\\s*\\(`);
  const m = re.exec(source);
  if (!m) return null;
  const lines = m[1].split('\n')
    .map((l) => l.replace(/^\s*\*\s?/, '').trim())
    .filter((l) => l && !l.startsWith('@'));
  if (!lines.length) return null;
  let first = lines[0].replace(/^[\w-]+\s+[-–—:]\s+/, '').trim();
  if (!first || isFillerDescription(first)) return null;
  first = first.charAt(0).toUpperCase() + first.slice(1);
  return /[.!?]$/.test(first) ? first : first + '.';
}
