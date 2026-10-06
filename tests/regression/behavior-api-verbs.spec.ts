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

import { test, expect } from '../fixtures/offline';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join, relative, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
// #782: the gate used to walk ONLY src/. packages/create-wb-starter/template
// carries a complete second copy of every behavior, so the canonical verbs
// landed here while expand()/close()/reanimate()/reload()/clearErrors() kept
// shipping to every new project -- and this gate passed the whole time.
// A gate's scope must cover every copy of the thing it governs.
//
// #813/#771: there is only one copy now. A new site depends on the wb-starter
// package instead of carrying the behaviors, so the template has no src/ --
// create-wb-starter-new-site.spec.ts pins its exact file list, which is what
// keeps a second copy from coming back.
const SRC_DIRS = [
  join(ROOT, 'src', 'wb-viewmodels'),
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
 * Domain verbs, allowed ONLY on the API they are listed under. Each names an
 * action the canonical set has no word for; folding it into one would lose
 * meaning (fire() is not play() -- a confetti burst has nothing to pause).
 * Scoped per API so a domain verb cannot spread into a general second
 * vocabulary. A RETIRED verb can never be listed here: the test below
 * enforces that.
 */
const DOMAIN: Record<string, string[]> = {
  // HTMLElement.focus()/blur(), and the search the field exists to run.
  wbSearch: ['focus', 'blur', 'search'],
  // The notes panel's own file operations.
  wbNotes: ['save', 'copy', 'newNote', 'lookup'],
  // Pin or release the element; show/hide would say it disappears.
  wbSticky: ['stick', 'unstick'],
  // One-shot effects, and the repeat loop two of them run.
  wbConfetti: ['fire'],
  wbSparkle: ['fire'],
  wbFireworks: ['fire', 'startRepeat', 'stopRepeat'],
  wbSnow: ['fire', 'startRepeat', 'stopRepeat'],
  wbTypewriter: ['type'],
  wbCountup: ['count'],
};

/** The verbs #782 retired, each with its replacement. */
const RETIRED: Record<string, string> = {
  open: 'show', expand: 'show',
  close: 'hide', collapse: 'hide', minimize: 'hide',
  reanimate: 'play', reload: 'refresh',
  clear: 'reset', clearErrors: 'reset',
  cleanup: 'destroy', toggleMute: 'toggle',
};

/** Blank comments and string contents so neither can open or close a block. */
function blankNoise(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, (c) => c.replace(/[^\n]/g, ' '))
    .replace(/\/\/[^\n]*/g, (c) => ' '.repeat(c.length))
    .replace(/(['"`])(?:\\.|(?!\1)[^\\])*\1/g, (q) => q[0] + ' '.repeat(q.length - 2) + q[0]);
}

/**
 * Every member of every `element.wbX = { ... }` object, in EVERY form a member
 * can take at depth 1:
 *
 *   foo: () => {}     foo: function () {}     foo() {}     async foo() {}
 *   foo: api.foo      foo: someFn             foo          (shorthand)
 *
 * #782: the first version matched only the first three, by line. A member
 * assigned by reference (`clear: api.clear`) or written shorthand
 * (`open, close, toggle`) was invisible, so wbSearch.clear and wbNotes.open
 * shipped past a gate that reported green. Accessors (`get foo()`,
 * `set foo(v)`) describe state, not commands, and are not policed.
 */
function collectApiMembers(source: string, file: string) {
  const found: { member: string; file: string; api: string }[] = [];
  const text = blankNoise(source);
  const re = /element\.(wb[A-Za-z0-9]*)\s*=\s*\{/g;
  let m: RegExpExecArray | null;

  while ((m = re.exec(text)) !== null) {
    const api = m[1];
    // Split the object body at depth-1 commas; nested (), [] and {} are
    // skipped whole, so a method body cannot end the object early.
    const parts: string[] = [];
    let depth = 0;
    let cur = '';
    let i = m.index + m[0].length;
    for (; i < text.length; i++) {
      const ch = text[i];
      if ('([{'.includes(ch)) depth++;
      else if (')]}'.includes(ch)) {
        if (depth === 0) break;
        depth--;
      } else if (ch === ',' && depth === 0) {
        parts.push(cur);
        cur = '';
        continue;
      }
      cur += ch;
    }
    parts.push(cur);

    for (const raw of parts) {
      const part = raw.trim();
      if (!part || part.startsWith('...')) continue;
      if (/^(get|set)\s+[A-Za-z_$]/.test(part)) continue;
      const name = part.match(/^(?:async\s+)?([A-Za-z_$][\w$]*)/);
      if (name) found.push({ member: name[1], file, api });
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
        if (DOMAIN[api]?.includes(member)) continue;
        const instead = RETIRED[member] ? `  -> ${RETIRED[member]}` : '';
        offenders.push(`${f}  ${api}.${member}()${instead}`);
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

  test('no domain verb is a retired verb', () => {
    const bad = Object.entries(DOMAIN).flatMap(([api, verbs]) =>
      verbs.filter((v) => v in RETIRED).map((v) => `${api}.${v} -> ${RETIRED[v]}`));
    expect(bad, 'a retired verb was allowed back in as a domain verb').toEqual([]);
  });

  test('the member scan sees every form a member can take', () => {
    const probe = `
      element.wbProbe = {
        arrow: () => { const inner = { nope: 1 }; return inner; },
        fn: function () {},
        method() { if (x) { y(); } },
        async later() {},
        byRef: api.byRef,
        shorthand, other,
        get value() { return 1; },
        set value(v) {},
        ...rest,
        // commented: () => {},
        str: 'a, b: c',
        last
      };`;
    const names = collectApiMembers(probe, 'probe.js').map((x) => x.member);
    expect(names).toEqual(['arrow', 'fn', 'method', 'later', 'byRef', 'shorthand', 'other', 'str', 'last']);
  });
});
