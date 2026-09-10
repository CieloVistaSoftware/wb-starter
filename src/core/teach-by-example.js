/**
 * teach-by-example.js
 *
 * Shared by BOTH runtimes. wb.js and wb-lazy.js have drifted repeatedly (#333,
 * #1056) because the same idea got written twice; this one lives in a single
 * module so it cannot. doc-viewer.html imports wb.js, the demo pages import
 * wb-lazy.js, and an empty invocation must teach in both.
 */
import { Events } from './events.js';
import SchemaBuilder from './mvvm/schema-builder.js';

/**
 * An empty invocation is a cry for help. Answer it by demonstrating.
 *
 * `<div x-cardhero>…</div>` DOES apply the behavior — it builds x-card--hero,
 * three children, min-height 400px. It is simply empty, so the reader sees a
 * 400px blank box with three dots and concludes the behavior is broken. Nothing
 * threw, so nothing reported.
 *
 * John: "it should automatically fill in dummies to show the pattern", and "the
 * self documentation text should teach the user what to do."
 *
 * So the placeholder text is not filler — it IS the documentation. Each value
 * names its own attribute and says what that attribute is for, taken from the
 * schema's own description. Writing the behavior with nothing renders a working
 * example that reads:
 *
 *     title — Hero headline
 *     subtitle — Hero tagline/subheadline
 *
 * Generic across every behavior with a schema; no per-behavior curation.
 *
 * ONLY when the author supplied nothing. Any attribute or any real content and
 * this does not run — a deliberately minimal usage is never overwritten.
 */

/** Attributes that are plumbing, not authored content. */
const TEACH_IGNORED_ATTRS = /^(x-|class$|style$|id$|data-)/;

/** Properties whose value is a URL/asset — teaching text there renders broken. */
const TEACH_SKIP_PROPERTY = /url|href|src|image|background|icon|poster|thumb/i;

/**
 * Schemas are loaded on demand, so SchemaBuilder.getSchema() is null here for a
 * behaviour nothing has needed a schema for yet — checked, and it was null for
 * every spelling of cardhero. Fetch the file directly, once per behaviour.
 */
export const teachSchemaCache = new Map();

async function teachSchema(behaviorName) {
  if (teachSchemaCache.has(behaviorName)) { return teachSchemaCache.get(behaviorName); }

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
      schema = null;   // no schema is not an error; most hosts simply have none
    }
  }

  teachSchemaCache.set(behaviorName, schema);
  return schema;
}

export async function teachByExample(element, behaviorName) {
  // Cheap rejections BEFORE any fetch — this runs on every injection.
  const authoredEarly = Array.from(element.attributes)
    .some((a) => !TEACH_IGNORED_ATTRS.test(a.name));
  if (authoredEarly) { return false; }
  if (element.children.length) { return false; }
  if ((element.textContent || '').replace(/[….\s]/g, '')) { return false; }

  const schema = await teachSchema(behaviorName);
  if (!schema || !schema.properties) { return false; }
  if (!element.isConnected) { return false; }

  let filled = 0;
  for (const [name, prop] of Object.entries(schema.properties)) {
    if (!prop || prop.type !== 'string') { continue; }
    if (TEACH_SKIP_PROPERTY.test(name)) { continue; }

    // THE DEFAULT WINS WHEN THERE IS ONE.
    //
    // John: "we should fill in the default fields to show what gets rendered
    // when nothing is implemented". A default is the truth — it is literally
    // what this behavior does unconfigured — where invented prose is only a
    // description of it.
    //
    // It also settles the enums. variant is default|cosmic|split|minimal|
    // gradient and xalign is left|center|right; those values are styled on, and
    // a first pass wrote "variant — Visual style variant" into one, which threw
    // out of card.js: "Failed to execute 'add' on 'DOMTokenList': the token
    // contains HTML space characters". A constrained property gets its declared
    // default or nothing at all.
    const declared = typeof prop.default === 'string' ? prop.default.trim() : '';
    if (declared) {
      element.setAttribute(name, declared);
      filled++;
      continue;
    }
    if (Array.isArray(prop.enum) && prop.enum.length) { continue; }

    // No default to show, so teach instead: the schema's own description, named
    // by its attribute. Parenthetical asides are trimmed — useful in a table,
    // too long inside a rendered card.
    const description = String(prop.description || '').split('(')[0].trim();
    if (!description) { continue; }

    element.setAttribute(name, `${name} — ${description}`);
    filled++;
  }

  if (!filled) { return false; }

  // THE DOC LINK IS MANDATORY HERE.
  //
  // John: mandatory "when all the details are being filled in". Not on every
  // decorated element — a <div x-badge> on a production page must never render a
  // docs link at the reader. But a behavior that just filled itself in is a
  // DEVELOPER standing in front of a thing they did not write, at the one moment
  // the full reference is worth handing over.
  //
  // Resolution is #1098's rule: docs are named after the behavior. All 185
  // behaviors currently have one, so a miss means the doc was deleted or the
  // behavior was added without one — worth saying out loud rather than quietly
  // teaching half a lesson.
  const docPath = `docs/behaviors/${behaviorName}.md`;
  element.setAttribute('x-docs', docPath);
  element.setAttribute('x-teaching-example', behaviorName);

  // Put it where it is READ, not only where it is inspected. One field carries
  // it so every value does not end up with the same tail.
  const carrier = ['subtitle', 'content', 'description', 'title']
    .find((name) => element.hasAttribute(name));
  if (carrier) {
    element.setAttribute(carrier, `${element.getAttribute(carrier)} · see ${docPath}`);
  }

  Events.log('info', 'WB',
    `${behaviorName}: no attributes or content given — filled ${filled} from the schema `
    + `so the example shows what to set. Replace them with your own; full reference in ${docPath}.`);

  return true;
}
