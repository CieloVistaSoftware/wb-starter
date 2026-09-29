/**
 * Remove every surviving <wb-*> component tag.
 *
 * Components were removed in 4.0.0, so these tags register nowhere. A
 * hyphenated tag with no registration is an HTMLUnknownElement: it parses,
 * renders inline and unstyled, attaches no behavior, and throws no error.
 * Nothing announces them, which is why 1,166 survived the migration that was
 * supposed to remove them.
 *
 * WHY THIS IS SAFE WHERE THE CLASS RENAME WAS NOT
 *
 * An earlier blanket pass rewrote every `x-foo` string it could find and
 * turned `classList.add('x-card')` into `classList.add('.x-card')` across
 * 203 sites, because a class name and a selector are textually identical.
 *
 * A `<` followed by the prefix cannot be anything but a tag. That leading
 * angle bracket is
 * the disambiguator, so this pass has no equivalent failure mode -- it is
 * matching syntax, not guessing intent.
 *
 * WHAT EACH TAG BECOMES
 *
 *   A behavior that maps to a real semantic element gets that element, read
 *   from src/core/tag-map.js's nativeMap at runtime rather than hardcoded --
 *   so this cannot drift from the registry the way a copied table would.
 *   <article> -> <article>, <dialog> -> <dialog>.
 *
 *   Everything else gets a neutral host carrying the behavior as an
 *   attribute: <div x-alert> -> <div x-alert>. Behaviors that are inline by
 *   nature get <span>, so a block element never lands mid-sentence.
 *
 * Usage:
 *   node scripts/migrate-wb-tags.mjs                  dry run
 *   node scripts/migrate-wb-tags.mjs --apply          write
 *   node scripts/migrate-wb-tags.mjs --apply --dir X  a downstream site
 */
import fs from 'fs';
import path from 'path';

const ARGS = process.argv.slice(2);
const APPLY = ARGS.includes('--apply');
const ROOT = (() => {
  const i = ARGS.indexOf('--dir');
  return i >= 0 && ARGS[i + 1] ? path.resolve(ARGS[i + 1]) : process.cwd();
})();

const SKIP_DIRS = new Set([
  'node_modules', '.git', 'out', 'dist', 'coverage', 'test-results',
  'playwright-report', '.claude', 'vendor', 'lib',
]);
const EXT = /\.(js|mjs|cjs|ts|tsx|css|html|json|md|yml|yaml)$/;

/** Behaviors that are inline by nature -- a <div> would break the line. */
const INLINE = new Set([
  'badge', 'tag', 'chip', 'icon', 'tooltip', 'ripple', 'kbd', 'mark',
  'code', 'spinner', 'avatar', 'pill', 'label',
]);

/** Read every `key: 'behavior'` pair out of tag-map.js, across all its maps. */
function loadRegistry() {
  const src = fs.readFileSync(path.join(ROOT, 'src/core/tag-map.js'), 'utf8');
  const pairs = new Map();
  const re = /['"]([a-z0-9-]+)['"]\s*:\s*['"]([a-z0-9-]+)['"]/g;
  let m;
  while ((m = re.exec(src))) pairs.set(m[1], m[2]);
  return pairs;
}

const REGISTRY = loadRegistry();

/**
 * behavior -> the semantic HTML element that injects it.
 * Only bare element names qualify; `x-card` is a marker, `article` is an
 * element. Inverting gives us "what should this have been written as".
 */
const SEMANTIC = (() => {
  const out = new Map();
  for (const [key, behavior] of REGISTRY) {
    if (key.includes('-')) continue;
    if (!out.has(behavior)) out.set(behavior, key);
  }
  return out;
})();

/** Names that resolve to no behavior at all -- tags that never existed. */
const dead = new Map();

function hostFor(name) {
  // <article>: `x-card` maps to the `article` behavior, and `article` is a
  // real element, so the honest replacement is <article> -- the semantic
  // element whose injection renders a card. Not <div x-card>.
  const behavior = REGISTRY.get(name) || REGISTRY.get(`x-${name}`);

  if (behavior) {
    const semantic = SEMANTIC.get(behavior);
    if (semantic) return { open: semantic, close: semantic, attr: '' };
    const el = INLINE.has(name) ? 'span' : 'div';
    return { open: el, close: el, attr: ` x-${behavior}` };
  }

  // No registration anywhere. <div> was already inert; rewriting it
  // to <div x-card-link> would only move the dead vocabulary into an
  // attribute, which is the thing 4.0.0 set out to stop. Emit a plain host
  // and report it, so what got dropped is visible rather than renamed.
  dead.set(name, (dead.get(name) || 0) + 1);
  const el = INLINE.has(name) ? 'span' : 'div';
  return { open: el, close: el, attr: '' };
}

function walk(dir, out = []) {
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return out; }
  for (const e of entries) {
    if (SKIP_DIRS.has(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (EXT.test(e.name)) out.push(p);
  }
  return out;
}

let files = 0, opens = 0, closes = 0;
const perTag = new Map();
const perFile = [];

for (const file of walk(ROOT)) {
  let raw;
  try { raw = fs.readFileSync(file, 'utf8'); } catch { continue; }
  if (!raw.includes('wb-')) continue;

  let n = 0;

  // Closing tags first: </div> -> </div>. Done before opens so the
  // rewritten opens cannot be re-matched.
  let s = raw.replace(/<\/wb-([a-z0-9-]+)\s*>/g, (_m, name) => {
    n++; closes++;
    perTag.set(name, (perTag.get(name) || 0) + 1);
    return `</${hostFor(name).close}>`;
  });

  // Opening tags, preserving whatever attributes follow.
  s = s.replace(/<wb-([a-z0-9-]+)(?=[\s/>])/g, (_m, name) => {
    n++; opens++;
    perTag.set(name, (perTag.get(name) || 0) + 1);
    const h = hostFor(name);
    return `<${h.open}${h.attr}`;
  });

  if (s !== raw) {
    files++;
    perFile.push([path.relative(ROOT, file).split(path.sep).join('/'), n]);
    if (APPLY) {
      const crlf = /\r\n/.test(raw);
      fs.writeFileSync(file, crlf ? s.replace(/(?<!\r)\n/g, '\r\n') : s);
    }
  }
}

console.log(`\n${APPLY ? 'APPLIED' : 'DRY RUN'} — ${opens} opening + ${closes} closing tag(s) in ${files} file(s)`);
console.log(`semantic mappings loaded from tag-map.js: ${SEMANTIC.size}\n`);

if (dead.size) {
  console.log(`TAGS RESOLVING TO NO BEHAVIOR (${dead.size} distinct) -- already inert.`);
  console.log(`Emitted as a plain host rather than renamed into a dead attribute.`);
  [...dead].sort((a, b) => b[1] - a[1]).slice(0, 20)
    .forEach(([t, n]) => console.log(`  ${String(n).padStart(4)}  wb-${t}`));
  console.log('');
}

console.log('BY TAG');
[...perTag].sort((a, b) => b[1] - a[1]).slice(0, 20).forEach(([t, n]) => {
  const h = hostFor(t);
  console.log(`  ${String(n).padStart(4)}  wb-${t.padEnd(18)} -> <${h.open}${h.attr}>`);
});

console.log('\nWORST FILES');
perFile.sort((a, b) => b[1] - a[1]).slice(0, 15).forEach(([f, n]) => {
  console.log(`  ${String(n).padStart(4)}  ${f}`);
});
