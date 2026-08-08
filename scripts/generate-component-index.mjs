/**
 * COMPONENT INDEX GENERATOR
 * =========================
 * Generates data/component-index.json — one entry per real, documented
 * component (docs/components/**\/*.md), cross-referenced against its
 * schema (title/description/category) and checked against pages/
 * components.html + pages/behaviors.html for a live demo location.
 *
 * Powers the sortable component table at the top of pages/components.html.
 *
 * Usage:
 *   node scripts/generate-component-index.mjs [--verbose]
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const VERBOSE = process.argv.includes('--verbose');

// Overview/index docs that describe a CATEGORY, not a single component —
// excluded from the list.
const OVERVIEW_FILES = new Set([
  'README.md', 'components.md', 'cards.index.md', 'cards.readme.md',
  'feedback.readme.md', 'forms.readme.md', 'layout.readme.md',
  'navigation.readme.md', 'semantic.index.md', 'semantic.readme.md',
]);

function walk(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, acc);
    else if (entry.name.endsWith('.md')) acc.push(full);
  }
  return acc;
}

function readSchema(name) {
  const p = path.join(ROOT, 'src/wb-models', `${name}.schema.json`);
  if (!fs.existsSync(p)) return null;
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return null;
  }
}

/** Strip markdown emphasis/code syntax -- titles/descriptions render as plain text in the table, not markdown. */
function stripMd(s) {
  return s ? s.replace(/`([^`]*)`/g, '$1').replace(/\*\*([^*]*)\*\*/g, '$1').replace(/\*([^*]*)\*/g, '$1') : s;
}

/** Fallback when no schema exists: pull the first H1 + first paragraph from the .md itself. */
function readMdFallback(mdPath) {
  const src = fs.readFileSync(mdPath, 'utf8');
  const h1 = src.match(/^#\s+(.+)$/m);
  const afterH1 = h1 ? src.slice(src.indexOf(h1[0]) + h1[0].length) : src;
  const firstPara = afterH1.split(/\n\s*\n/).map((s) => s.trim()).find((s) => s && !s.startsWith('#'));
  return {
    title: h1 ? h1[1].trim() : null,
    description: firstPara ? firstPara.replace(/\s+/g, ' ').slice(0, 160) : '',
  };
}

const componentsHtml = fs.readFileSync(path.join(ROOT, 'pages/components.html'), 'utf8');
const behaviorsHtml = fs.readFileSync(path.join(ROOT, 'pages/behaviors.html'), 'utf8');

/**
 * Blank out HTML comments (replacing their content with spaces, so every
 * character offset in the result still lines up with the original string --
 * required since matched positions are later used to splice the ORIGINAL
 * file). Several source comments in this codebase illustrate markup inline
 * (e.g. "one <wb-demo> per element") -- without this, that literal text
 * inside a comment matches the same regex a real tag does, and both
 * mis-identifies a "block" spanning from the comment to the next real
 * </wb-demo> AND skips the actual real block the comment was describing.
 */
function blankComments(html) {
  return html.replace(/<!--[\s\S]*?-->/g, (m) => ' '.repeat(m.length));
}

/** Every <wb-demo ...> block on the page, with its tag-open position (for id injection) and inner content. */
function demoBlocks(html) {
  const searchable = blankComments(html);
  const blocks = [];
  const re = /<wb-demo([^>]*)>([\s\S]*?)<\/wb-demo>/g;
  let m;
  while ((m = re.exec(searchable))) {
    blocks.push({ openStart: m.index, openAttrs: m[1], inner: m[2] });
  }
  return blocks;
}

const componentsDemoBlocks = demoBlocks(componentsHtml);
const behaviorsDemoBlocks = demoBlocks(behaviorsHtml);

/**
 * Which <wb-demo> block (if any) on which page demonstrates this component?
 * A block counts as a match on two signals, either is good evidence:
 *   1. A `<wb-{name}>` custom element or `x-{name}` attribute ANYWHERE
 *      inside it -- both are unambiguous, deliberate markers.
 *   2. A bare native tag (e.g. `<button>`, `<table>`) as the block's FIRST
 *      real element -- auto-injected elements (button, input, table, ...)
 *      carry no attribute marker at all, so a bare-tag check is the only
 *      signal for them. Requiring "first element" (not "anywhere in the
 *      block") matters: confirmed live, a Tabs demo's panel content
 *      happened to include an unrelated `<ul>` bullet list several levels
 *      deep, which an "anywhere" search wrongly credited as the `ul`
 *      component's demo. Every real demo in this codebase puts the
 *      component being demonstrated first in its block.
 * `claimed` excludes blocks another component already matched -- two
 * component names should never point at the same one block.
 */
function findDemoBlock(blocks, name, claimed) {
  const explicit = [new RegExp(`<wb-${name}[ >]`), new RegExp(`\\bx-${name}\\b`)];
  const bareFirst = new RegExp(`^\\s*<${name}[ >]`);
  return blocks.find(
    (b) =>
      !claimed.has(b.openStart) &&
      (explicit.some((re) => re.test(b.inner) || re.test(b.openAttrs)) || bareFirst.test(b.inner))
  );
}

const claimedComponentsBlocks = new Set();
const claimedBehaviorsBlocks = new Set();

function findDemoLocation(name) {
  const inComponents = findDemoBlock(componentsDemoBlocks, name, claimedComponentsBlocks);
  if (inComponents) {
    claimedComponentsBlocks.add(inComponents.openStart);
    return { page: 'components', block: inComponents };
  }
  const inBehaviors = findDemoBlock(behaviorsDemoBlocks, name, claimedBehaviorsBlocks);
  if (inBehaviors) {
    claimedBehaviorsBlocks.add(inBehaviors.openStart);
    return { page: 'behaviors' };
  }
  return null;
}

const docs = walk(path.join(ROOT, 'docs/components'))
  .filter((p) => !OVERVIEW_FILES.has(path.basename(p)));

const components = [];
// Positions (in componentsHtml) where an id needs injecting into the
// matched <wb-demo ...> opening tag. Collected during the loop, applied
// afterward (in one pass, position-descending) so earlier injections don't
// shift the offsets of later ones.
const idInjections = [];

for (const docPath of docs) {
  const relDoc = path.relative(ROOT, docPath).split(path.sep).join('/');
  const name = path.basename(docPath, '.md');
  const category = path.basename(path.dirname(docPath));

  const schema = readSchema(name);
  const fallback = schema ? null : readMdFallback(docPath);

  const title = stripMd(schema?.title || fallback?.title || name);
  const description = stripMd(schema?.description || fallback?.description || '');
  const tag = category === 'semantic' || category === 'semantics' ? name : `wb-${schema?.schemaFor || name}`;

  const demo = findDemoLocation(name);
  // Only components.html gets a precise scroll-to anchor -- it's the page
  // hosting this table, so the common case (same-page scroll) needs no SPA
  // page transition at all. A behaviors.html match still gets a real link,
  // just to the page as a whole (existing SPA nav handles that link type
  // already); adding cross-page anchor-after-transition handling wasn't
  // worth the added surface for the less common case. findDemoLocation()
  // already guarantees each block is claimed by at most one component, so
  // an id is injected (and therefore promised in the JSON) for every
  // components.html match, no further dedup needed here.
  const getsAnchor = demo?.page === 'components' && !demo.block.openAttrs.includes(' id=');
  if (getsAnchor) {
    idInjections.push({ pos: demo.block.openStart, name });
  }

  components.push({
    name,
    title,
    description,
    category,
    tag,
    docPath: relDoc,
    demoPage: demo?.page || null,
    demoAnchor: getsAnchor ? `component-${name}` : null,
  });
}

components.sort((a, b) => a.name.localeCompare(b.name));

if (idInjections.length) {
  idInjections.sort((a, b) => b.pos - a.pos); // descending, so splicing doesn't shift earlier offsets
  let html = componentsHtml;
  for (const { pos, name } of idInjections) {
    const insertAt = pos + '<wb-demo'.length;
    html = html.slice(0, insertAt) + ` id="component-${name}"` + html.slice(insertAt);
  }
  fs.writeFileSync(path.join(ROOT, 'pages/components.html'), html);
  console.log(`Injected ${idInjections.length} anchor id(s) into pages/components.html.`);
}

const withDemo = components.filter((c) => c.demoPage).length;
const output = {
  generated: new Date().toISOString(),
  total: components.length,
  withDemo,
  withoutDemo: components.length - withDemo,
  components,
};

fs.writeFileSync(path.join(ROOT, 'data/component-index.json'), JSON.stringify(output, null, 2) + '\n');

console.log(`component-index: ${components.length} components, ${withDemo} with a live demo, ${components.length - withDemo} without.`);
if (VERBOSE) {
  console.log('Without a demo:', components.filter((c) => !c.demoPage).map((c) => c.name).join(', '));
}
