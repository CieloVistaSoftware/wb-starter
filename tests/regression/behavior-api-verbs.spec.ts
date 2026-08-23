/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Behavior APIs use the canonical verbs (#782)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * John: "we need to standardize verbs and ensure we only use those verbs".
 *
 * Surveyed before writing this: 102 registered behaviors, 40 exposing an API
 * object, ~78 distinct member names between them. The same concept had up to
 * four names depending on which file you landed in — show/hide, open/close,
 * expand/collapse, minimize — so a reader who learned one behavior could not
 * guess the next.
 *
 * WHY THIS GATE EXISTS BEFORE THE RENAME
 *
 * The vocabulary drifted once already, silently, because nothing checked it.
 * Landing the gate first means the rename is verified as it happens rather
 * than described in prose that drifts again the same week.
 *
 * WHY show/hide AND NOT open/close
 *
 * `open` is a native ACCESSOR on <dialog> and <details>. A behavior assigning
 * a function to it hits the setter, gets a boolean, and silently does nothing —
 * that is #778, which existed for three releases while appearing fixed. The
 * canonical set steers away from native property names so the whole class of
 * bug cannot recur.
 *
 * STATIC, NOT RENDERED
 *
 * Reads the source rather than driving a browser: every behavior is covered
 * including ones that never render in a test, there is no server to be flaky
 * about, and a name is a fact about the file.
 */

import { test, expect } from '@playwright/test';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join, relative, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
// #782: the gate used to walk ONLY src/. packages/create-wb-starter/template
// carries a complete second copy of every behavior, so the canonical verbs
// landed here while expand()/close()/reanimate()/reload()/clearErrors() kept
// shipping to every new project -- and this gate passed the whole time.
// A gate's scope must cover every copy of the thing it governs.
const SRC_DIRS = [
  join(ROOT, 'src', 'wb-viewmodels'),
  join(ROOT, 'packages', 'create-wb-starter', 'template', 'src', 'wb-viewmodels'),
];

/**
 * The canonical verbs. Anything outside this list, and outside the typed
 * getter and setter shapes below, is a finding.
 */
const CANONICAL = new Set([
  // visibility
  'show', 'hide', 'toggle',
  // media
  'play', 'pause',
  // state
  'refresh', 'reset',
  // value
  'getValue', 'setValue',
  // lifecycle
  'destroy',
  // events
  'on', 'off',

  // Added after the first baseline run (#782). These came back as violations
  // but are real, unambiguous domain verbs with an exact platform counterpart,
  // and renaming them would have made the API worse rather than more uniform:
  //
  //   submit    HTMLFormElement.submit()
  //   validate  the check itself; 'refresh' would say nothing about validity
  //   load      fetching a document is not 'refresh', which implies re-reading
  //             something already loaded
  'submit', 'validate', 'load',
]);

/**
 * Typed accessors are allowed: getThemes() and getDuration() return specific
 * data rather than "the value", and collapsing them all into getValue() would
 * be worse than the inconsistency it removed.
 */
const TYPED_ACCESSOR = /^(get|set)[A-Z][A-Za-z0-9]*$/;

/**
 * Predicates answer a question about state; they do not command anything, so
 * they are not verbs and policing them as such produced nonsense renames
 * (isStuck -> getStuck). Allowed as their own shape.
 */
const PREDICATE = /^is[A-Z][A-Za-z0-9]*$/;

/**
 * Collection operations name what they act on, which is the clarity a bare
 * verb would lose: addRule() says more than add().
 */
const COLLECTION_OP = /^(add|remove)[A-Z][A-Za-z0-9]*$/;

/**
 * Read-only computed properties (declared `get foo()`) describe state rather
 * than commanding it, so they are not verbs and are not policed here.
 */
function collectApiMembers(source: string, file: string) {
  const found: { member: string; file: string; api: string }[] = [];

  // element.wbSomething = { ... }
  const re = /element\.(wb[A-Za-z0-9]*)\s*=\s*\{/g;
  let m: RegExpExecArray | null;

  while ((m = re.exec(source)) !== null) {
    const apiName = m[1];
    // Walk braces from the opening one so a nested object cannot end the block
    // early — a regex to the first '}' would stop inside the first method.
    let depth = 0;
    let i = m.index + m[0].length - 1;
    const start = i;
    for (; i < source.length; i++) {
      if (source[i] === '{') depth++;
      else if (source[i] === '}') { depth--; if (depth === 0) break; }
    }
    const body = source.slice(start + 1, i);

    // Members at depth 1 only: `foo: () =>`, `foo() {`, `get foo()`.
    let d = 0;
    for (const line of body.split('\n')) {
      const trimmed = line.trim();
      if (d === 0) {
        const member = trimmed.match(/^(?:get\s+)?([a-zA-Z_$][\w$]*)\s*(?::\s*(?:async\s*)?(?:\(|function)|\()/);
        if (member && !/^(if|for|while|switch|return|catch)$/.test(member[1])) {
          const isGetter = /^get\s/.test(trimmed);
          if (!isGetter) found.push({ member: member[1], file, api: apiName });
        }
      }
      for (const ch of line) {
        if (ch === '{') d++;
        else if (ch === '}') d--;
      }
    }
  }
  return found;
}

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (entry.endsWith('.js')) out.push(full);
  }
  return out;
}

test.describe('Behavior APIs use the canonical verbs', () => {
  test('no API member uses a non-canonical verb', () => {
    const offenders: string[] = [];
    let apiCount = 0;
    let memberCount = 0;

    for (const file of SRC_DIRS.flatMap((d) => walk(d))) {
      const source = readFileSync(file, 'utf8');
      const members = collectApiMembers(source, relative(ROOT, file));
      const apis = new Set(members.map((x) => x.api));
      apiCount += apis.size;

      for (const { member, file: f, api } of members) {
        memberCount++;
        if (CANONICAL.has(member)) continue;
        if (TYPED_ACCESSOR.test(member)) continue;
        if (PREDICATE.test(member)) continue;
        if (COLLECTION_OP.test(member)) continue;
        offenders.push(`${f}  ${api}.${member}()`);
      }
    }

    expect(memberCount, 'no API members were found — the gate would pass vacuously')
      .toBeGreaterThan(20);

    const unique = [...new Set(offenders)].sort();

    expect(
      unique,
      `${unique.length} API member(s) across ${apiCount} behavior APIs use a verb ` +
      `outside the canonical set (#782).\n\n` +
      `Canonical: ${[...CANONICAL].sort().join(', ')}\n` +
      `Also allowed: typed getX()/setX(), isX() predicates, addX()/removeX().\n\n` +
      `show/hide replace open/close deliberately — 'open' is a native accessor ` +
      `on <dialog> and <details>, and assigning to it silently does nothing (#778).\n\n` +
      unique.join('\n  '),
    ).toEqual([]);
  });
});
