/**
 * Multi-Page Site Generator (Phase 4)
 * ====================================
 * Reads a .site.json schema and generates an entire set of showcase pages
 * plus an index page, using the existing pipeline (validate → compose → generate).
 *
 * Site Schema Format:
 *   {
 *     "title": "WB Component Library",
 *     "outputDir": "demos/site",          // where HTML goes
 *     "defaults": "x-page-defaults",     // $extends for all pages
 *     "generateIndex": true,              // create index.html with links
 *     "pages": [
 *       {
 *         "id": "cards",
 *         "title": "Card Components",
 *         "description": "All card variants",
 *         "icon": "🃏",
 *         "components": ["card", "cardbutton", ...],   // auto-showcase these
 *         "columns": 3
 *       },
 *       {
 *         "id": "custom",
 *         "title": "Custom Page",
 *         "schema": "path/to/custom.page.json"         // use existing page schema
 *       }
 *     ]
 *   }
 *
 * Usage:
 *   node scripts/generate-site.mjs <site-schema.json>
 *   node scripts/generate-site.mjs <site-schema.json> --dry-run     (validate only)
 *   node scripts/generate-site.mjs <site-schema.json> --index-only  (regenerate index)
 *   node scripts/generate-site.mjs <site-schema.json> --out-dir <dir> (pages and report into <dir>)
 *
 * The committed demos/site pages are exactly this script's output (#1530,
 * guarded by tests/compliance/site-pages-match-generator.spec.ts). To change
 * a page, change the site schema or this script and regenerate; an edit made
 * in the HTML is undone by the next run.
 *
 * Output:
 *   demos/site/{page-id}.html           — individual pages
 *   demos/site/index.html               — site index with links
 *   data/site-generator-result.json     — build report
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'fs';
import { resolve, join, basename, relative } from 'path';
import { execSync } from 'child_process';

const MODELS_DIR = resolve('src/wb-models');

// ─── Helpers ───

function loadJSON(path) {
  return JSON.parse(readFileSync(resolve(path), 'utf-8'));
}

/**
 * A stand-in value for a required prop that declares no `default`.
 *
 * Prose is the right answer for most props -- `message="Sample message"`
 * reads as a label and renders as one. It is the WRONG answer for a prop
 * whose value gets FETCHED: `image="Sample image"` is not a broken link, it
 * is a string that was never meant to reach the network, and the behavior
 * dutifully requests it and throws. That accounted for 38 of the 67 uncaught
 * errors on demos/site/cards.html (#838) -- enough on its own to blow the
 * "fewer than 10 errors" budget in site-generation.spec.ts.
 *
 * The stand-in is a REMOTE image (#1530). This said "Local, not
 * picsum.photos", so offline CI could assert on the page; the offline fixture
 * now serves picsum and pravatar from its cache (tests/fixtures/offline.ts),
 * and media sources are remote by ruling (#762, #1122). No local images
 * outside docs/behaviors (#1187): the pages had been hand-patched from this
 * default's '/images/...' file to picsum URLs, and the next regeneration
 * would have put the local file back.
 */
const URL_VALUED_PROPS = /^(image|background|src|avatar|poster|thumbnail|cover)$/i;
// #795: was '/images/wb.png' -- a 1.5 MB 1024x1024 bitmap, pulled in by every
// generated demo page that documents a `logo` prop, to draw a mark a few dozen
// pixels tall. The site's own icon is a 166-byte vector and is already served.
const PLACEHOLDER_LOGO = '/assets/icons/favicon.svg';

function samplePropValue(propName, propDef) {
  if (propDef && propDef.default) return propDef.default;
  if (/^logo$/i.test(propName)) return PLACEHOLDER_LOGO;
  // An image prop falls through to prose too; remoteImages() swaps it.
  return `Sample ${propName}`;
}

const REMOTE_URL = /^https?:\/\//i;
const IMAGE_FILE = /\.(svg|png|jpe?g|gif|webp|avif)$/i;

/**
 * #1530: every image a demo shows is remote, whatever the schema says. The
 * schemas still carry local files in their matrices and defaults
 * ('/images/avatar.svg', '/images/placeholder.svg', the dachshund photo --
 * #1187 tracks those) and "this is the background"-style defaults (#1102's
 * self-naming defaults, which John kept on purpose, but which as an image
 * source are a request for a page called "this is the background"). Both are
 * swapped for a remote stand-in here; a local path that is not an image
 * (mdhtml's src="../code.md") is the demo's subject and is left alone.
 *
 * Seeded by the behavior, so each card type keeps one stable picture: these
 * are the picsum URLs cards.html had been hand-patched to. An avatar is a
 * face, seeded by the person the demo names, so John and Jane differ.
 */
function remoteImages(schema, attrs) {
  const out = {};
  for (const [k, v] of Object.entries(attrs)) {
    const local = typeof v === 'string' && !REMOTE_URL.test(v) && (IMAGE_FILE.test(v) || !/[/.]/.test(v));
    if (!URL_VALUED_PROPS.test(k) || !local) { out[k] = v; continue; }
    out[k] = /^avatar$/i.test(k)
      ? `https://i.pravatar.cc/150?u=${slugify(attrs.author || attrs.name || schema.schemaFor)}`
      : `https://picsum.photos/seed/${schema.schemaFor}/600/400`;
  }
  return out;
}

function camelToKebab(str) {
  return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}

// #411: a property literally named `variant` (the common case -- buttons,
// cards, alerts...) produced the redundant "variant variants" heading.
// Special-case it to a natural "Variants"; other property names (e.g.
// `size`) keep the existing "{propName} variants" phrasing.
// #793: an option that positions something needs that something, or its
// demo shows nothing -- and input() now reports iconPosition-without-icon as a
// runtime error. Each variant demo of these props carries its companion.
//
// #1736: `target` only says WHERE an href opens -- on its own it does nothing,
// and button.js warns about exactly that. forms.html showed two buttons with
// target="_self"/"_blank" and no href. Each target demo now links to its own
// section, a destination that exists on every generated page and keeps a
// clicked demo on the site. A companion is only added to a schema that
// declares it (glow has an enum `target` and no href).
const DEMO_COMPANIONS = {
  iconPosition: { icon: '★' },
  target: { href: ({ sectionId }) => `#${sectionId}` },
};

/** The companion attributes for one enum demo, resolved for its section. */
function companionsFor(propName, props, context) {
  const out = {};
  for (const [key, value] of Object.entries(DEMO_COMPANIONS[propName] || {})) {
    if (!(key in props)) continue;
    out[key] = typeof value === 'function' ? value(context) : value;
  }
  return out;
}

function enumSectionHeading(propName) {
  return propName === 'variant' ? 'Variants' : `${propName} variants`;
}

function slugify(str) {
  return String(str).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function findSchema(name) {
  const candidates = [
    join(MODELS_DIR, `${name}.schema.json`),
    join(MODELS_DIR, `${name.replace(/-/g, '')}.schema.json`)
  ];
  for (const c of candidates) {
    if (existsSync(c)) return loadJSON(c);
  }
  return null;
}

// ─── Generate sections for a single component (same logic as auto-showcase) ───

// Every generated instance needs SOME children, regardless of whether its
// behavior self-generates content (avatar/badge/chip clear+rebuild
// textContent anyway, so a placeholder there is harmlessly overwritten) --
// without it, a custom element with no CSS default size (most of them; only
// a handful of behaviors have a dedicated .css file) collapses to
// offsetHeight:0 and is completely invisible despite being correctly
// "enhanced" (confirmed live: <div x-draggable axis="both"></div>,
// zero height, on the deployed interactive.html page).
//
// The whole POINT of these demos is showing what each attribute combo does
// (#268/#279 and onward) -- a single static placeholder shared by every
// instance defeats that just as badly as being invisible: four <dialog>
// triggers with title="Basic Dialog"/"Large"/"No Close"/"Centered" all just
// said "Dialog", indistinguishable at a glance (confirmed live).
//
// #413: building that placeholder FROM the instance's own attrs
// (`variant=info, message=Sample message`) went too far the other way --
// the element's opening tag already shows those exact attrs, and the code
// sample rendered below the demo shows them again, so the body text was a
// third, word-for-word repetition of information already on screen twice.
// Per docs/architecture/standards/ATTRIBUTE-NAMING-STANDARD.md ("Content
// (Children)"), body content should be genuinely distinct copy, not an
// echo of the attributes -- e.g. `<div x-alert variant="warning"><strong>
// Warning:</strong> This is the alert content.</div>`. A generator
// can't hand-write per-component prose, but it can stay non-empty (still
// solving the original 0-height problem) without parroting the attrs.
function placeholderChildren(schema, host) {
  // A <table> cannot hold text: the parser foster-parents it OUT, in front of
  // the table, leaving an empty 0x0 <table> -- every table demo on
  // content.html rendered as a blank box with its sentence floating above.
  // Tables get rows instead, enough for sortable/filterable/paginated to act on.
  if (host === 'table') return TABLE_SAMPLE;
  // tabs() builds one tab per CHILD ELEMENT and does nothing for bare text
  // (no children -> early return), so the generic sentence left every tabs
  // demo on layout.html unbuilt: no tab buttons, and active-tab/variant/size/
  // vertical had nothing to act on. Several panels also make active-tab="1"
  // demonstrable at all.
  if (schema.schemaFor === 'tabs') return TABS_SAMPLE;
  // A <nav> holds links (#958). A loose sentence in one sat against the
  // navbar's 8px padding (the 1rem-from-the-edge standard) and is nothing a
  // nav ever contains; links are what navbar() styles and lays out.
  if (host === 'nav') return NAV_SAMPLE;
  const label = (schema.title || schema.schemaFor || 'component').toLowerCase();
  return `This is example ${label} content.`;
}

const NAV_SAMPLE = '<a href="#home">Home</a> <a href="#docs">Docs</a> <a href="#pricing">Pricing</a>';
const TABS_SAMPLE = '<div tab-title="Overview">This is the overview panel.</div>'
  + '<div tab-title="Details">This is the details panel.</div>'
  + '<div tab-title="Settings">This is the settings panel.</div>';

const TABLE_SAMPLE = '<thead><tr><th>Name</th><th>Role</th><th>Status</th></tr></thead>'
  + '<tbody><tr><td>Ada Lovelace</td><td>Engineer</td><td>Active</td></tr>'
  + '<tr><td>Grace Hopper</td><td>Admiral</td><td>Active</td></tr>'
  + '<tr><td>Alan Turing</td><td>Researcher</td><td>Away</td></tr></tbody>';

// #490: components whose resting render is a CLOSED trigger -- the
// position/variant-differentiated panel only exists after a click
// (src/wb-viewmodels/overlay.js show(), dialog.js, dropdown.js). With the
// generic shared placeholder above, every demo box on a showcase page is
// pixel-identical at rest (John, live: "There is no difference in these
// three elements, why?"). For these components the children text doubles as
// the trigger's visible label AND the panel body, so echo the instance's
// own attrs (e.g. "position=left") to make each box legible without
// clicking it. This is the documented exception to #413's "don't parrot the
// attrs" rule: #413 assumed the component's resting render already shows
// its difference, which is true for every normally-visible component but
// definitionally false for a closed overlay trigger.
const TRIGGER_COMPONENTS = new Set(['dialog', 'drawer', 'dropdown', 'popover', 'offcanvas', 'sheet']);

// Functional attrs a demo instance NEEDS to actually work when opened, but
// which no schema property default or matrix combo supplies. dropdown: a
// menu with no items= attribute and no element children opens as an empty
// 150x2px sliver (root-caused in tests/regression/
// dropdown-position-and-content.spec.ts; the items= attrs that fix added to
// overlays.html by hand were wiped by the next site regeneration -- this
// puts them in the generator so they survive). Excluded from the #490
// attr-echo label: they are plumbing, not the permutation being showcased.
const DEMO_EXTRA_ATTRS = {
  dropdown: { items: 'Profile,Settings,Logout' }
};

// Build one demo instance: attr-echo children for closed-trigger components
// (#490), generic placeholder for everything else (#413), plus any
// functional extra attrs (which never override the showcased attrs and
// never appear in the label).

/**
 * element -> behavior, read from src/core/tag-map.js's nativeMap. Read rather
 * than duplicated: a copied table drifts from the registry silently, and this
 * decides whether a demo carries its behavior attribute at all.
 */
const NATIVE_MAP = (() => {
  try {
    // This module imports NAMED exports from fs/path -- there is no `fs`
    // namespace here. Calling fs.readFileSync threw, the catch swallowed it,
    // NATIVE_MAP came back {} and every lookup failed, so EVERY demo got an
    // attribute -- including <button x-button>, the redundant form that can
    // suppress the behavior (#746). A silent catch turned a typo into wrong
    // output rather than a crash.
    const src = readFileSync(resolve('src/core/tag-map.js'), 'utf8');
    const i = src.indexOf('nativeMap');
    const o = src.indexOf('{', i);
    let d = 0, e = -1;
    for (let k = o; k < src.length; k++) {
      if (src[k] === '{') d++;
      else if (src[k] === '}' && --d === 0) { e = k + 1; break; }
    }
    return new Function(`return ${src.slice(o, e)}`)();
  } catch (err) {
    // Fail loudly. An empty map does not degrade gracefully -- it changes
    // what every generated demo says.
    throw new Error(`could not read nativeMap from tag-map.js: ${err.message}`);
  }
})();

if (!Object.keys(NATIVE_MAP).length) {
  throw new Error('nativeMap parsed empty — refusing to generate demos that would all carry a redundant attribute');
}

function buildDemo(schema, tag, rawAttrs) {
  const attrs = remoteImages(schema, rawAttrs);
  const isTrigger = TRIGGER_COMPONENTS.has(schema.schemaFor);
  // Skip the values generatePageHtml's attr emitter drops (false/null/
  // undefined) -- the label must never claim an attribute that isn't
  // actually rendered on the tag (e.g. showClose:false).
  const label = Object.entries(attrs)
    .filter(([, v]) => v !== false && v !== null && v !== undefined)
    .map(([k, v]) => `${k}=${v}`).join(', ');
  const extras = DEMO_EXTRA_ATTRS[schema.schemaFor] || {};

  // Components are gone, but "no component tag" does not mean "always a div".
  // There are two kinds of behavior and the demo must show the right one:
  //
  //   decorates a semantic element  ->  <button variant="primary">
  //   new capability                ->  <div x-ripple>
  //
  // Emitting `<div x-button …>` for the first kind teaches readers to reach
  // for a div where <button> is the answer -- losing the implicit role, the
  // keyboard behavior and the point of a semantic-first framework. Worse,
  // for an element that auto-injects, the redundant attribute can suppress
  // the behavior outright (#746), so the demo must omit it.
  const declared = schema.semanticElement;
  const semanticTag = typeof declared === 'string' ? declared : declared?.tagName;
  // div/span are neutral hosts, not semantic elements -- naming one means the
  // behavior is new capability, not decoration.
  const isSemantic = semanticTag && semanticTag !== 'div' && semanticTag !== 'span';

  // Naming a semantic element is NOT permission to drop the attribute. The
  // attribute may only be omitted when that element auto-injects THIS
  // behavior. cardimage declares semanticElement `article`, but nativeMap
  // maps article -> the `article` behavior, so `<article src=…>` injects a
  // plain article and the card never renders -- ~30 generated sections came
  // out as bare placeholder text (#844).
  //
  // nativeMap is the authority for what a bare tag actually becomes.
  const autoInjectsThis = isSemantic && NATIVE_MAP[semanticTag] === schema.schemaFor;

  // A closed <dialog> is display:none -- as the demo's subject it renders
  // nothing at all, so a showcase of dialog variants was a column of empty
  // boxes (overlays.html). A trigger component's resting render must be its
  // TRIGGER (#490), and dialog.js's trigger mode is x-dialog on any element
  // other than <dialog>: a <button> is the semantic one.
  const dialogTrigger = isTrigger && isSemantic && semanticTag === 'dialog';
  const host = dialogTrigger ? 'button' : (isSemantic ? semanticTag : tag);
  const behavior = (autoInjectsThis && !dialogTrigger) ? {} : { [`x-${schema.schemaFor}`]: true };
  const children = (isTrigger && label) ? label : placeholderChildren(schema, host);

  return { tag: host, attrs: { ...behavior, ...extras, ...attrs }, children };
}

function generateComponentSections(schema) {
  const sections = [];
  const tag = 'div';   // was `wb-${schema.schemaFor}` -- components removed
  const props = schema.properties || {};

  // Matrix combinations
  if (schema.test?.matrix?.combinations?.length) {
    const demos = schema.test.matrix.combinations.map(combo => {
      const attrs = {};
      for (const [key, val] of Object.entries(combo)) {
        // #1525: a false matrix value is a combination demonstrating an option
        // turned OFF. Dropping it (the emitter's rule for false) rendered
        // dialog's "No Close" with a close button. When the option is on by
        // default, OFF must be written out -- name="false", which the behaviors
        // read as off since #747. When it is off by default, false IS the
        // default, so it stays unwritten and {x:false} still dedupes with {}.
        // Written in the schema's own camelCase (#1125), as every attribute
        // this generator writes is now.
        if (val === false) {
          if (props[key]?.default === true) attrs[key] = 'false';
          continue;
        }
        attrs[key] = val;
      }
      return buildDemo(schema, tag, attrs);
    });
    const columns = demos.length <= 2 ? demos.length : demos.length <= 4 ? 2 : 3;
    sections.push({
      heading: `${schema.schemaFor} — Combinations`,
      component: schema.schemaFor,
      tag,
      columns,
      demos
    });
  }

  // Enum variants
  const enumProps = Object.entries(props).filter(([, def]) =>
    def.enum && Array.isArray(def.enum) && def.enum.length > 1
  );
  for (const [propName, propDef] of enumProps) {
    // #1125: the attribute is the schema's camelCase name; only the section
    // id stays dashed, because pages and specs link to it.
    const attrName = camelToKebab(propName);
    const sectionId = slugify(`${schema.schemaFor}-${attrName}-variants`);
    const demos = propDef.enum.map(val => {
      const attrs = { [propName]: val, ...companionsFor(propName, props, { sectionId }) };
      for (const [rk, rv] of Object.entries(props)) {
        if (rv.required && rk !== propName) {
          attrs[rk] = samplePropValue(rk, rv);
        }
      }
      return buildDemo(schema, tag, attrs);
    });
    const columns = demos.length <= 2 ? demos.length : demos.length <= 4 ? 2 : 3;
    sections.push({
      heading: enumSectionHeading(propName),
      // Stable anchor id, decoupled from the display heading. #411's
      // heading rephrase ("variant variants" -> "Variants") silently
      // changed the derived section id from {comp}-variant-variants to
      // {comp}-variants on regeneration, breaking every test that anchors
      // on the long-established {comp}-{prop}-variants ids (e.g.
      // tests/regression/drawer-path-b-content-position-variant.spec.ts's
      // #drawer-variant-variants). Ids are API; headings are copy.
      id: sectionId,
      component: schema.schemaFor,
      tag,
      columns,
      demos
    });
  }

  // Boolean toggles
  const boolProps = Object.entries(props).filter(([, def]) =>
    def.type === 'boolean' && def.default !== true
  );
  if (boolProps.length > 0) {
    const demos = boolProps.map(([propName]) => {
      const attrs = { [propName]: true };
      for (const [rk, rv] of Object.entries(props)) {
        if (rv.required && rk !== propName) {
          attrs[rk] = samplePropValue(rk, rv);
        }
      }
      return buildDemo(schema, tag, attrs);
    });
    // Always one per row: a boolean toggle's whole point is showing its own
    // effect (e.g. `full-width`), which a multi-column grid cell clips.
    const columns = 1;
    sections.push({
      // #412: replace the disliked "Boolean toggles" literal with a
      // shorter heading that matches the one-word style used elsewhere
      // ("Variants").
      heading: `Toggles`,
      component: schema.schemaFor,
      tag,
      columns,
      demos
    });
  }

  // Defaults fallback (only if no matrix)
  if (!schema.test?.matrix?.combinations?.length) {
    const defaultAttrs = {};
    for (const [propName, propDef] of Object.entries(props)) {
      if (propDef.default !== undefined && propDef.default !== '' && propDef.default !== false) {
        defaultAttrs[propName] = propDef.default;
      } else if (propDef.required) {
        defaultAttrs[propName] = samplePropValue(propName, propDef);
      }
    }
    if (Object.keys(defaultAttrs).length > 0) {
      sections.push({
        heading: `${schema.schemaFor} — Defaults`,
        component: schema.schemaFor,
        tag,
        columns: 1,
        demos: [buildDemo(schema, tag, defaultAttrs)]
      });
    }
  }

  return sections;
}

// A section's anchor id: its own, or one derived from component + heading.
function sectionIdOf(section) {
  return section.id || slugify(section.component ? `${section.component}-${section.heading}` : section.heading);
}

// ─── Deduplicate demos across sections ───

function deduplicateSections(sections) {
  const seen = new Set();
  for (const section of sections) {
    section.demos = section.demos.filter(demo => {
      // Key on what is RENDERED, not on the attrs object: generatePageHtml
      // drops false/null/undefined attributes, so snow's matrix combo
      // { repeat: false } and the empty combo {} were different keys that
      // emitted the byte-identical <div x-snow> -- the same demo twice on
      // effects.html (#657).
      const rendered = Object.fromEntries(
        Object.entries(demo.attrs).filter(([, v]) => v !== false && v !== null && v !== undefined)
      );
      const key = JSON.stringify({ tag: demo.tag, attrs: rendered });
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
  return sections.filter(s => s.demos.length > 0);
}

// ─── Build a multi-component page schema ───

function buildMultiComponentPage(pageDef, defaults) {
  const allSections = [];
  const componentResults = [];

  for (const componentName of (pageDef.components || [])) {
    const schema = findSchema(componentName);
    if (!schema) {
      console.warn(`  ⚠️ Schema not found: ${componentName} — skipping`);
      componentResults.push({ name: componentName, status: 'not_found', sections: 0, demos: 0 });
      continue;
    }

    const sections = generateComponentSections(schema);
    const demoCount = sections.reduce((sum, s) => sum + s.demos.length, 0);
    componentResults.push({
      name: componentName,
      status: 'ok',
      sections: sections.length,
      demos: demoCount
    });

    // Add a component separator heading
    const icon = schema._metadata?.icon || '📦';
    if (sections.length > 0) {
      // Prefix the first section heading with the component name
      sections[0].heading = `${icon} ${schema.title || schema.schemaFor}`;
    }
    allSections.push(...sections);
  }

  const deduplicated = deduplicateSections(allSections);

  // Hand-authored sections for schema-less x-* behaviors and narrative content
  // the auto-generator can't produce (prose, RTL examples, multi-instance
  // showcases). Passed through verbatim — heading + raw html, no attrs/demos
  // shape, since these don't come from a schema. `position: 'start'` pins a
  // section before the auto-generated ones (e.g. a curated gallery that
  // page-level tests target via .first()/.nth(0)); default is append.
  //
  // #1530: `replaces: "<generated section id>"` puts a hand-authored section
  // in the place of a generated one -- the curated articles #426 wrote on
  // content.html, the #682 <select> samples, the #1598 expandable cards whose
  // text has to overflow. Those had been typed into the HTML output, so the
  // next regeneration silently threw them away. A `replaces` naming no
  // generated section throws: the schema moved on and the override is stale.
  // `before` is raw markup between the section's numbered comment and its
  // <section> tag (the comment that says why the section is hand-authored).
  const manualStart = [];
  const manualEnd = [];
  for (const manual of (pageDef.manualSections || [])) {
    const section = { heading: manual.heading, raw: manual.html, script: manual.script, id: manual.id, before: manual.before };
    if (manual.replaces) {
      const at = deduplicated.findIndex(s => sectionIdOf(s) === manual.replaces);
      if (at < 0) throw new Error(`${pageDef.id}: manual section "${manual.heading}" replaces "${manual.replaces}", which is not a generated section`);
      deduplicated[at] = section;
      continue;
    }
    (manual.position === 'start' ? manualStart : manualEnd).push(section);
  }
  deduplicated.unshift(...manualStart);
  deduplicated.push(...manualEnd);

  const pageSchema = {
    title: pageDef.title,
    description: pageDef.description || `Showcase for: ${(pageDef.components || []).join(', ')}`,
    schemaFor: pageDef.id,
    page: {
      lang: 'en',
      theme: 'dark',
      title: pageDef.title,
      stylesheets: [
        '../../src/styles/themes.css',
        '../../src/styles/site.css',
        '../../src/styles/pages/showcase.css'
      ],
      scripts: [{
        type: 'module',
        src: '../../src/core/wb-lazy.js',
        init: 'WB.init({ autoInject: true })',
        // #1598: page-specific lines run once the scan is done (cards.html
        // re-jumps to its #hash). Hand-typed into the output before #1530.
        afterScan: pageDef.afterScan
      }]
    },
    header: {
      tag: 'h1',
      content: `${pageDef.icon || '📦'} ${pageDef.title}`,
      subtitle: {
        tag: 'p',
        content: pageDef.description || `Showcasing ${(pageDef.components || []).length} behaviors`
      }
    },
    sections: deduplicated
  };

  return { pageSchema, componentResults };
}

/**
 * The scan every page (and the index) runs after init. No { eager: true }:
 * it overrode x-demo's IntersectionObserver, so cards.html built all 293
 * demos before the page could be used -- 13,680ms of main-thread blocking,
 * one task 9,110ms long. 4278fcf7 (#987) dropped it from all twelve pages by
 * hand (952ms total, 48 demos at load, the rest on scroll) and never told
 * this template, so a regeneration put it back (#1530).
 */
const SCAN_LINE = '    await WB.scan(document.body);';

// ─── Generate index page HTML ───

function generateIndexHtml(siteSchema, pageResults) {
  const lines = [];
  lines.push('<!DOCTYPE html>');
  lines.push(`<html lang="en" data-theme="dark">`);
  lines.push('');
  lines.push('<head>');
  lines.push('  <meta charset="UTF-8">');
  lines.push('  <meta name="viewport" content="width=device-width, initial-scale=1.0">');
  lines.push(`  <title>${siteSchema.title} — Index</title>`);
  lines.push('  <link rel="stylesheet" href="../../src/styles/themes.css">');
  lines.push('  <link rel="stylesheet" href="../../src/styles/site.css">');
  lines.push('  <style>');
  // #628: padding was hand-added to the generated index.html (2f7076d) but
  // never backfilled into this template, so the next regen (0e3f3b2) silently
  // dropped it back to zero inner padding again. Baking it in here so a future
  // regen can't repeat that regression.
  lines.push('    .site-index { max-width: 960px; margin: 2rem auto; padding: var(--space-xl); }');
  lines.push('    .page-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.5rem; margin-top: 2rem; }');
  lines.push('    .page-card { background: var(--surface-color, #1e1e1e); border: 1px solid var(--border-color, #333); border-radius: 12px; padding: 1.5rem; transition: transform 0.2s, box-shadow 0.2s; }');
  lines.push('    .page-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.3); }');
  lines.push('    .page-card a { color: var(--text-primary, #fff); text-decoration: none; display: block; }');
  lines.push('    .page-card h3 { margin: 0 0 0.5rem 0; font-size: 1.25rem; }');
  lines.push('    .page-card p { margin: 0 0 0.75rem 0; color: var(--text-secondary, #aaa); font-size: 0.875rem; }');
  lines.push('    .page-card .stats { font-size: 0.75rem; color: var(--text-tertiary, #666); }');
  lines.push('    .site-header { text-align: center; margin-bottom: 2rem; }');
  lines.push('    .site-header h1 { font-size: 2.5rem; margin: 0; }');
  lines.push('    .site-header p { color: var(--text-secondary, #aaa); margin: 0.5rem 0 0; }');
  lines.push('    .site-stats { text-align: center; color: var(--text-secondary, #aaa); font-size: 0.875rem; margin-bottom: 2rem; }');
  lines.push('  </style>');
  lines.push('</head>');
  lines.push('');
  lines.push('<body>');
  lines.push('  <div class="site-index">');
  lines.push('    <div class="site-header">');
  lines.push(`      <h1>${siteSchema.title}</h1>`);
  if (siteSchema.description) {
    lines.push(`      <p>${siteSchema.description}</p>`);
  }
  lines.push('    </div>');

  // Stats
  const totalPages = pageResults.filter(p => p.status === 'ok').length;
  const totalComponents = pageResults.reduce((s, p) => s + (p.componentCount || 0), 0);
  const totalDemos = pageResults.reduce((s, p) => s + (p.totalDemos || 0), 0);
  // #1530: "behaviors", the word the committed index had been hand-corrected
  // to. There are no components (217cf1c7, John: "Get rid of the word
  // components, rename to behaviors in entire project").
  lines.push(`    <div class="site-stats">${totalPages} pages · ${totalComponents} behaviors · ${totalDemos} demos</div>`);

  lines.push('    <div class="page-grid">');
  for (const page of pageResults) {
    if (page.status !== 'ok') continue;
    lines.push('      <div class="page-card">');
    lines.push(`        <a href="${page.filename}">`);
    lines.push(`          <h3>${page.icon || '📦'} ${page.title}</h3>`);
    if (page.description) {
      lines.push(`          <p>${page.description}</p>`);
    }
    lines.push(`          <span class="stats">${page.componentCount || 0} behaviors · ${page.sectionCount || 0} sections · ${page.totalDemos || 0} demos</span>`);
    lines.push('        </a>');
    lines.push('      </div>');
  }
  lines.push('    </div>');
  lines.push('  </div>');

  // Scripts
  lines.push('  <script type="module">');
  lines.push("    import WB from '../../src/core/wb-lazy.js';");
  lines.push('    window.WB = WB;');
  lines.push('    await WB.init({ autoInject: true });');
  lines.push(SCAN_LINE);
  lines.push(`    console.log('${siteSchema.title} index initialized');`);
  // Same readiness flag every generated page sets (see the page template
  // below): the index never had it, so demos-site-page-padding.spec.ts waited
  // out its whole timeout on index.html alone.
  lines.push('    window.__WB_DEMO_INITIALIZED__ = true;');
  lines.push('  </script>');

  lines.push('</body>');
  lines.push('');
  lines.push('</html>');

  return lines.join('\n');
}

// ─── Generate a single page HTML (inline, no temp file dance) ───

function generatePageHtml(pageSchema) {
  const lines = [];

  lines.push('<!DOCTYPE html>');
  lines.push(`<html lang="${pageSchema.page?.lang || 'en'}"${pageSchema.page?.theme ? ` data-theme="${pageSchema.page.theme}"` : ''}>`);
  lines.push('');
  lines.push('<head>');
  lines.push('  <meta charset="UTF-8">');
  lines.push('  <meta name="viewport" content="width=device-width, initial-scale=1.0">');
  lines.push(`  <title>${pageSchema.page?.title || pageSchema.title || 'Generated Page'}</title>`);
  if (pageSchema.page?.stylesheets) {
    for (const href of pageSchema.page.stylesheets) {
      lines.push(`  <link rel="stylesheet" href="${href}">`);
    }
  }
  lines.push('');
  lines.push('</head>');
  lines.push('');
  // #274/live report: was a bare <body> -- these standalone pages aren't
  // routed through the .site/.site__body app shell (see components.html),
  // so with no page-level padding class their content sat flush against
  // the viewport edge (headings, code blocks, everything at x=0). site.css
  // already declares `.demo-page` for exactly this; it just never got
  // wired onto this generator's actual output.
  lines.push('<body class="demo-page">');

  // Nav back to index
  // #779: no inline styles; showcase.css styles the nav and link.
  lines.push('  <nav class="site-demo__nav">');
  lines.push('    <a href="index.html" class="site-demo__back">← Back to Index</a>');
  lines.push('  </nav>');

  if (pageSchema.header) {
    const h = pageSchema.header;
    lines.push(`  <${h.tag || 'h1'}>${h.content}</${h.tag || 'h1'}>`);
    if (h.subtitle) {
      lines.push(`  <${h.subtitle.tag || 'p'}>${h.subtitle.content}</${h.subtitle.tag || 'p'}>`);
    }
    lines.push('');
  }

  if (pageSchema.sections) {
    const seenIds = new Set();
    for (let i = 0; i < pageSchema.sections.length; i++) {
      const section = pageSchema.sections[i];
      let sectionId = sectionIdOf(section);
      if (seenIds.has(sectionId)) sectionId = `${sectionId}-${i}`;
      seenIds.add(sectionId);
      lines.push(`  <!-- ${i + 1}. ${section.heading} -->`);
      if (section.before) lines.push(section.before);
      lines.push(`  <section id="${sectionId}">`);
      lines.push(`  <h2>${section.heading}</h2>`);
      if (section.raw) {
        lines.push(section.raw);
        if (section.script) {
          lines.push('  <script type="module">');
          lines.push(section.script);
          lines.push('  </script>');
        }
        lines.push('  </section>');
        lines.push('');
        continue;
      }
      const demos = section.demos || [];
      const pushDemoTag = (demo, indent) => {
        const attrs = Object.entries(demo.attrs || {})
          .map(([k, v]) => {
            if (v === true) return ` ${k}`;
            if (v === false || v === null || v === undefined) return '';
            return ` ${k}="${String(v).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}"`;
          })
          .join('');
        if (demo.children) {
          lines.push(`${indent}<${demo.tag}${attrs}>`);
          lines.push(`${indent}  ${demo.children}`);
          lines.push(`${indent}</${demo.tag}>`);
        } else {
          lines.push(`${indent}<${demo.tag}${attrs}>`);
          lines.push(`${indent}</${demo.tag}>`);
        }
      };
      if (demos.length > 1) {
        // §2 "one code sample per rendered element (strict 1:1)": a section
        // sweeping several differently-configured instances of the same
        // component (enum variants, boolean toggles, matrix combinations)
        // must not bundle them all under one shared <div x-demo> code sample --
        // that's the exact "permutation matrix" anti-pattern §2 forbids. One
        // <div x-demo> per instance instead, each with its own code sample.
        // Fixes #538. Stacked vertically, NOT grid-wrapped side by side --
        // §3 "demos are vertical, never side-by-side" forbids placing two
        // rendered demos on the same row. An earlier version of this fix
        // wrapped the instances in `.demo-section__grid--cols-N`, which
        // violated §3 and was a likely root cause of recurring shrink-to-fit
        // layout failures (mismatched natural widths forced into shared grid
        // tracks). Fixes #563.
        for (const demo of demos) {
          lines.push('  <div x-demo columns="1">');
          pushDemoTag(demo, '    ');
          lines.push('  </div>');
        }
      } else {
        lines.push(`  <div x-demo columns="${section.columns || 3}">`);
        for (const demo of demos) {
          pushDemoTag(demo, '    ');
        }
        lines.push('  </div>');
      }
      lines.push('  </section>');
      lines.push('');
    }
  }

  if (pageSchema.page?.scripts) {
    for (const script of pageSchema.page.scripts) {
      lines.push('  <script type="module">');
      lines.push(`    import WB from '${script.src}';`);
      lines.push('    window.WB = WB;');
      lines.push(`    await ${script.init};`);
      lines.push(SCAN_LINE);
      if (script.afterScan) lines.push(script.afterScan);
      lines.push(`    console.log('${pageSchema.title} initialized');`);
      // #628: hand-added to 7 of 8 demos/site/*.html pages by 5e57bc0 (missed
      // feedback.html) but never backfilled here -- a regen from this template
      // would silently drop it again, the same way 0e3f3b2's regen dropped
      // .site-index's padding. tests/regression/demos-site-page-padding.spec.ts
      // polls this flag to know the page is ready.
      lines.push('    window.__WB_DEMO_INITIALIZED__ = true;');
      lines.push('  </script>');
    }
  }

  lines.push('</body>');
  lines.push('');
  lines.push('</html>');

  return lines.join('\n');
}

// ─── Main ───

// --out-dir <dir> (#1530) writes the pages AND the build report into <dir>
// instead of the schema's outputDir and data/: the guard spec
// (tests/compliance/site-pages-match-generator.spec.ts) regenerates into a
// temp directory and compares, leaving the tracked files alone.
const argv = process.argv.slice(2);
const outDirAt = argv.indexOf('--out-dir');
const outDirArg = outDirAt >= 0 ? argv[outDirAt + 1] : undefined;
const rest = outDirAt >= 0 ? argv.filter((_, i) => i !== outDirAt && i !== outDirAt + 1) : argv;
const args = rest.filter(a => !a.startsWith('--'));
const flags = rest.filter(a => a.startsWith('--'));
const siteSchemaPath = args[0];
const dryRun = flags.includes('--dry-run');
const indexOnly = flags.includes('--index-only');

if (!siteSchemaPath) {
  console.error('Usage:');
  console.error('  node scripts/generate-site.mjs <site-schema.json>');
  console.error('  node scripts/generate-site.mjs <site-schema.json> --dry-run');
  console.error('  node scripts/generate-site.mjs <site-schema.json> --index-only');
  console.error('  node scripts/generate-site.mjs <site-schema.json> --out-dir <dir>');
  process.exit(1);
}

console.log(`\n🌐 Site Generator — Phase 4`);
console.log(`   Schema: ${siteSchemaPath}`);
console.log(`   Mode: ${dryRun ? 'DRY RUN (validate only)' : indexOnly ? 'INDEX ONLY' : 'FULL BUILD'}\n`);

const siteSchema = loadJSON(siteSchemaPath);
const outputDir = resolve(outDirArg || siteSchema.outputDir || 'demos/site');
const resultPath = outDirArg ? join(outputDir, 'site-generator-result.json') : resolve('data/site-generator-result.json');

// Ensure output directory exists
mkdirSync(outputDir, { recursive: true });

const pageResults = [];
const startTime = Date.now();

for (const pageDef of (siteSchema.pages || [])) {
  const pageId = pageDef.id;
  console.log(`\n─── Page: ${pageDef.icon || '📦'} ${pageDef.title} (${pageId}) ───`);

  // Option A: Components list → auto-generate multi-component page
  if (pageDef.components && pageDef.components.length > 0) {
    const { pageSchema, componentResults } = buildMultiComponentPage(pageDef, siteSchema.defaults);

    const foundCount = componentResults.filter(c => c.status === 'ok').length;
    const missingCount = componentResults.filter(c => c.status === 'not_found').length;
    const sectionCount = pageSchema.sections.length;
    const totalDemos = pageSchema.sections.reduce((s, sec) => s + (sec.demos?.length || 0), 0);

    console.log(`  Components: ${foundCount} found, ${missingCount} missing`);
    console.log(`  Sections: ${sectionCount}, Demos: ${totalDemos}`);

    if (missingCount > 0) {
      const missing = componentResults.filter(c => c.status === 'not_found').map(c => c.name);
      console.warn(`  ⚠️ Missing: ${missing.join(', ')}`);
    }

    if (dryRun) {
      console.log(`  ✅ [DRY RUN] Would generate ${pageId}.html`);
      pageResults.push({
        id: pageId,
        title: pageDef.title,
        description: pageDef.description,
        icon: pageDef.icon,
        status: 'ok',
        filename: `${pageId}.html`,
        componentCount: foundCount,
        sectionCount,
        totalDemos,
        components: componentResults
      });
      continue;
    }

    if (indexOnly) {
      // Just collect metadata, don't regenerate
      const htmlPath = join(outputDir, `${pageId}.html`);
      pageResults.push({
        id: pageId,
        title: pageDef.title,
        description: pageDef.description,
        icon: pageDef.icon,
        status: existsSync(htmlPath) ? 'ok' : 'missing',
        filename: `${pageId}.html`,
        componentCount: foundCount,
        sectionCount,
        totalDemos,
        components: componentResults
      });
      continue;
    }

    // Generate HTML directly (inline — avoids temp file pipeline overhead).
    // #1530: a copy of pageSchema used to be written to
    // src/wb-models/pages/_site-<id>.page.json here and deleted after; nothing
    // read it, and the guard spec runs this script, so it is gone.
    const html = generatePageHtml(pageSchema);
    const htmlPath = join(outputDir, `${pageId}.html`);
    writeFileSync(htmlPath, html, 'utf-8');
    console.log(`  ✅ Generated: ${htmlPath}`);

    pageResults.push({
      id: pageId,
      title: pageDef.title,
      description: pageDef.description,
      icon: pageDef.icon,
      status: 'ok',
      filename: `${pageId}.html`,
      componentCount: foundCount,
      sectionCount,
      totalDemos,
      components: componentResults
    });
  }
  // Option B: Reference an existing page schema
  else if (pageDef.schema) {
    const schemaPath = resolve(pageDef.schema);
    if (!existsSync(schemaPath)) {
      console.error(`  ❌ Page schema not found: ${pageDef.schema}`);
      pageResults.push({ id: pageId, title: pageDef.title, status: 'error', error: 'schema_not_found' });
      continue;
    }

    if (dryRun) {
      const schema = loadJSON(schemaPath);
      const sectionCount = schema.sections?.length || 0;
      const totalDemos = schema.sections?.reduce((s, sec) => s + (sec.demos?.length || 0), 0) || 0;
      console.log(`  ✅ [DRY RUN] Would generate ${pageId}.html from ${pageDef.schema}`);
      pageResults.push({
        id: pageId,
        title: pageDef.title,
        description: pageDef.description,
        icon: pageDef.icon,
        status: 'ok',
        filename: `${pageId}.html`,
        sectionCount,
        totalDemos
      });
      continue;
    }

    // Use generate-page.mjs for existing schemas (handles composition + validation)
    const htmlPath = join(outputDir, `${pageId}.html`);
    try {
      execSync(
        `node scripts/generate-page.mjs ${schemaPath} ${htmlPath} --skip-validation`,
        { encoding: 'utf-8', cwd: resolve('.') }
      );
      const schema = loadJSON(schemaPath);
      const sectionCount = schema.sections?.length || 0;
      const totalDemos = schema.sections?.reduce((s, sec) => s + (sec.demos?.length || 0), 0) || 0;
      console.log(`  ✅ Generated: ${htmlPath}`);
      pageResults.push({
        id: pageId,
        title: pageDef.title,
        description: pageDef.description,
        icon: pageDef.icon,
        status: 'ok',
        filename: `${pageId}.html`,
        sectionCount,
        totalDemos
      });
    } catch (e) {
      console.error(`  ❌ Generation failed: ${e.message}`);
      pageResults.push({ id: pageId, title: pageDef.title, status: 'error', error: e.message });
    }
  }
  else {
    console.warn(`  ⚠️ Page "${pageId}" has no components or schema — skipping`);
    pageResults.push({ id: pageId, title: pageDef.title, status: 'skipped' });
  }
}

// ─── Generate Index Page ───

if (siteSchema.generateIndex !== false) {
  console.log('\n─── Generating Index Page ───');
  const indexHtml = generateIndexHtml(siteSchema, pageResults);
  const indexPath = join(outputDir, 'index.html');
  writeFileSync(indexPath, indexHtml, 'utf-8');
  console.log(`  ✅ Index: ${indexPath}`);
}

// ─── Write Results ───

const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
const okCount = pageResults.filter(p => p.status === 'ok').length;
const errCount = pageResults.filter(p => p.status === 'error').length;
const skipCount = pageResults.filter(p => p.status === 'skipped').length;

// #1530: the report is committed, so it holds only what the inputs decide.
// generatedAt and elapsed changed on every run, and outputDir was the absolute
// path of whoever ran it last (C:\Users\jwpmi\...), so a regeneration that
// changed nothing still rewrote the file. Time is printed below instead.
const result = {
  siteSchema: siteSchemaPath.replace(/\\/g, '/'),
  outputDir: relative(resolve('.'), outputDir).replace(/\\/g, '/'),
  summary: {
    totalPages: siteSchema.pages?.length || 0,
    generated: okCount,
    errors: errCount,
    skipped: skipCount,
    totalComponents: pageResults.reduce((s, p) => s + (p.componentCount || 0), 0),
    totalSections: pageResults.reduce((s, p) => s + (p.sectionCount || 0), 0),
    totalDemos: pageResults.reduce((s, p) => s + (p.totalDemos || 0), 0)
  },
  pages: pageResults
};

writeFileSync(resultPath, JSON.stringify(result, null, 2), 'utf-8');

console.log(`\n══════════════════════════════════════════`);
console.log(`  🌐 Site Generation Complete`);
console.log(`  Pages: ${okCount}/${siteSchema.pages?.length || 0} generated`);
if (errCount > 0) console.log(`  Errors: ${errCount}`);
console.log(`  Components: ${result.summary.totalComponents}`);
console.log(`  Sections: ${result.summary.totalSections}`);
console.log(`  Demos: ${result.summary.totalDemos}`);
console.log(`  Time: ${elapsed}s`);
console.log(`  Output: ${outputDir}/`);
console.log(`══════════════════════════════════════════`);

if (errCount > 0) process.exit(1);
