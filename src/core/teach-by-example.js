/**
 * teach-by-example.js
 *
 * An empty invocation is a cry for help. Answer it with a working example.
 *
 * `<div x-cardhero></div>` DOES apply the behavior — x-card--hero, three
 * children, min-height 400px. It is simply empty, so a 400px blank box with an
 * ellipsis reads as broken, and nothing throws so nothing reports.
 *
 * WHAT IT FILLS, AND WHY THAT MATTERS
 *
 * The curated example in data/behavior-examples.json — real copy, on 157 of the
 * behaviors:
 *
 *     pretitle="Release 3.0"
 *     title="Zero build. Real components."
 *     subtitle="Light DOM, no shadow boundaries, no class hierarchy."
 *     cta="Read the guide"  cta-href="#"
 *
 * A first version filled each field with its own schema DESCRIPTION instead, so
 * the card rendered "title — Hero headline", "cta — Call-to-action button text".
 * John: "while this is better it does no teaching." He was right. Field names
 * printed inside a component are a labelled skeleton: a newcomer still cannot
 * see what a hero is FOR, and the result looks broken rather than desirable.
 * A real example shows the point of the behavior in one glance.
 *
 * It also fixes the spelling. The schema's property is `ctaSecondary`; the
 * attribute card.js actually reads is `cta-secondary` (card.js:1078). Filling
 * from schema property names taught a name that does not work. The curated
 * source is written as real markup, so its names are the ones to type.
 *
 * Schema descriptions remain the FALLBACK, for a behavior with no curated
 * example — a labelled skeleton beats an empty box.
 *
 * ONLY when the author supplied nothing: any attribute, any child, or any real
 * text and this does not run. An ellipsis counts as nothing, which is what the
 * generated docs use.
 *
 * Shared by BOTH runtimes. doc-viewer.html imports wb.js, the demo pages import
 * wb-lazy.js, and the same empty element has to teach in both. Written once so
 * the two cannot drift (#333, #1056).
 */
import { Events } from './events.js';
import SchemaBuilder from './mvvm/schema-builder.js';

/**
 * Attributes that are plumbing, not authored content.
 *
 * `data-` IS AUTHORED CONTENT, and treating it as plumbing overwrote people's
 * work. read-attr.js reads a value in three spellings — an options value, the
 * plain attribute, then `data-<plain>` — so `<div x-cardhero data-title="Big
 * Hero">` is an element whose title the author SET, in a spelling the framework
 * still honours (#752 exists because behaviors once read only that one).
 *
 * Ignoring it here made that element read as empty, so the fill ran and wrote
 * the curated title straight over it. The commit gate caught it on the staged
 * tree, across cardhero, cardprofile, cardlink and cardbutton:
 *
 *     Expected: "Hero Title"
 *     Received: "Zero build. Real components."
 *
 * Law 11 says not to write `data-` on a behavior in the first place, and these
 * were old specs doing exactly that. It does not matter: the rule for firing is
 * "did the author supply anything", and a `data-` attribute is something. Not
 * teaching costs a demonstration; teaching over authored content destroys it.
 */
const TEACH_IGNORED_ATTRS = /^(x-|class$|style$|id$)/;

/** Properties whose value is a URL/asset — teaching text there renders broken. */
const TEACH_SKIP_PROPERTY = /url|href|src|image|background|icon|poster|thumb/i;

let examplesPromise = null;

/** The curated examples, fetched once. */
async function curatedExamples() {
  if (!examplesPromise) {
    examplesPromise = (async () => {
      try {
        const url = new URL('../../data/behavior-examples.json', import.meta.url).href;
        const res = await fetch(url);
        if (!res.ok) { return {}; }
        const data = await res.json();
        return data.examples || data || {};
      } catch {
        return {};   // no catalogue is not an error; the schema fallback covers it
      }
    })();
  }
  return examplesPromise;
}

/**
 * The attributes of the example's ROOT element, as authored.
 *
 * Read off the opening tag rather than by parsing into a DOM: the point is the
 * names and values a person would type, and a round trip through the parser
 * lower-cases and re-orders them.
 */
function attributesFromSource(source) {
  const open = String(source).match(/<[a-zA-Z][\w-]*([\s\S]*?)\/?>/);
  if (!open) { return []; }

  const pairs = [];
  const attr = /([a-zA-Z_:][-\w:.]*)\s*=\s*"([^"]*)"/g;
  let m;
  while ((m = attr.exec(open[1])) !== null) {
    if (m[1].startsWith('x-')) { continue; }   // the behavior token itself
    pairs.push([m[1], m[2]]);
  }
  return pairs;
}

const schemaCache = new Map();

async function schemaFor(behaviorName) {
  if (schemaCache.has(behaviorName)) { return schemaCache.get(behaviorName); }

  let schema = null;
  try {
    schema = SchemaBuilder.getSchema(behaviorName) || null;
  } catch { /* fall through to the fetch */ }

  if (!schema) {
    try {
      const url = new URL(`../wb-models/${behaviorName}.schema.json`, import.meta.url).href;
      const res = await fetch(url);
      schema = res.ok ? await res.json() : null;
    } catch {
      schema = null;
    }
  }

  schemaCache.set(behaviorName, schema);
  return schema;
}

/** Fallback: name each field and say what it is for. */
function fillFromSchema(element, schema) {
  let filled = 0;
  for (const [name, prop] of Object.entries(schema.properties || {})) {
    if (!prop || prop.type !== 'string') { continue; }
    if (TEACH_SKIP_PROPERTY.test(name)) { continue; }

    // A declared default is the truth about what renders unconfigured. It also
    // settles the enums — variant is default|cosmic|split|minimal|gradient and
    // those values are styled on, so writing prose into one threw out of
    // card.js ("Failed to execute 'add' on 'DOMTokenList'").
    const declared = typeof prop.default === 'string' ? prop.default.trim() : '';
    if (declared) { element.setAttribute(name, declared); filled++; continue; }
    if (Array.isArray(prop.enum) && prop.enum.length) { continue; }

    const description = String(prop.description || '').split('(')[0].trim();
    if (!description) { continue; }
    element.setAttribute(name, `${name} — ${description}`);
    filled++;
  }
  return filled;
}

export async function teachByExample(element, behaviorName) {
  // Cheap rejections BEFORE any fetch — this runs on every injection.
  if (Array.from(element.attributes).some((a) => !TEACH_IGNORED_ATTRS.test(a.name))) { return false; }
  if (element.children.length) { return false; }
  if ((element.textContent || '').replace(/[….\s]/g, '')) { return false; }

  const examples = await curatedExamples();
  if (!element.isConnected) { return false; }

  let filled = 0;
  let source = 'the curated example';

  const curated = examples[`x-${behaviorName}`] || examples[behaviorName];
  for (const [name, value] of attributesFromSource(curated?.source || '')) {
    element.setAttribute(name, value);
    filled++;
  }

  if (!filled) {
    const schema = await schemaFor(behaviorName);
    if (!element.isConnected) { return false; }
    if (schema) { filled = fillFromSchema(element, schema); }
    source = 'the schema';
  }

  if (!filled) { return false; }

  // THE DOC LINK IS MANDATORY HERE, and only here. Not on every decorated
  // element — a <div x-badge> on a production page must never render a docs link
  // at a user — but a behavior that just filled itself in has a DEVELOPER in
  // front of it, at the one moment the full reference is worth handing over.
  const docPath = `docs/behaviors/${behaviorName}.md`;
  element.setAttribute('x-docs', docPath);
  element.setAttribute('x-teaching-example', behaviorName);

  Events.log('info', 'WB',
    `${behaviorName}: nothing was given, so it is showing ${source} — ${filled} attributes. `
    + `Copy them and replace the values; full reference in ${docPath}.`);

  return true;
}
