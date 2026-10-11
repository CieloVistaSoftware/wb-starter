/**
 * declared-modifiers.js -- the declared-attribute applier (#770, #1147, #1831).
 *
 * The schema index (data/schema-index.json) already lists every behavior's
 * properties and its baseClass. Enum and boolean properties render as a
 * modifier class -- exactly what button(), input() and select() write by hand
 * -- so do it once, for every behavior, instead of 101 times or not at all.
 *
 * Shared by BOTH runtimes. It used to live only in wb.js, so on every page
 * that loads wb-lazy.js (the behaviors page stage, everything under demos/,
 * demos/test-harness.html) `variant="cosmic"` or `elevated` did nothing:
 * the attribute was declared, documented and ignored (#1831). One copy here,
 * imported by wb.js and wb-lazy.js, so the two cannot drift again.
 *
 * Loaded lazily and cached, never awaited: blocking every injection on a
 * fetch is not worth it. It used to be a no-op until the index arrived, on the
 * promise that "the next scan applies it" -- but a scan skips elements it has
 * already built, so everything built on page load before the fetch landed
 * never got its modifiers (<div x-hero variant="cosmic"> stayed plain x-hero,
 * #1147). Those calls are queued now and applied the moment it arrives.
 *
 * Deliberately NOT applied: string and number properties. Those are content
 * or configuration (title="Trail conditions"), and turning them into class
 * names produces garbage. They still need real handling.
 */

import { loadSchemaIndex, schemaIndexNow } from './schema-index.js';
import { styleSheetDefinesClass, classAddsNothing } from './style-registry.js';

// Elements built before the index arrived, applied the moment it lands.
const modifiersWaitingForIndex = [];

function flushWaiting() {
  for (const [element, behaviorName] of modifiersWaitingForIndex.splice(0)) {
    try { applyDeclaredModifiers(element, behaviorName); } catch { /* never break inject */ }
  }
}

/** `iconPosition` -> `icon-position`, which is what the DOM carries. */
function attrNameFor(prop) {
  return prop.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase());
}

/** Does an enum property other than `prop` also declare `value`? */
function claimedByAnotherProperty(props, prop, value) {
  for (const [other, def] of Object.entries(props)) {
    if (other === prop || !def || typeof def !== 'object') continue;
    if (Array.isArray(def.enum) && def.enum.includes(value)) return true;
  }
  return false;
}

/**
 * Add the `{baseClass}--{value}` class for each enum/boolean property the
 * behavior's schema declares and the element carries, when a stylesheet
 * defines that class. Queues the element if the index has not arrived yet.
 * @param {Element} element
 * @param {string} behaviorName
 */
export function applyDeclaredModifiers(element, behaviorName) {
  const schemaIndex = schemaIndexNow();
  if (!schemaIndex) {
    modifiersWaitingForIndex.push([element, behaviorName]);
    loadSchemaIndex().then(flushWaiting);
    return;
  }
  const schema = schemaIndex[behaviorName];
  const props = schema && schema.properties;
  if (!props) return;

  // Built, not written: the 4.0.0 prefix rename matched literal class
  // names and could not see a template hole. Left as `wb-`, every
  // behavior without an explicit baseClass emitted a class no stylesheet
  // matches -- no error, just unstyled.
  const base = schema.baseClass || `x-${behaviorName}`;
  for (const [prop, def] of Object.entries(props)) {
    if (!def || typeof def !== 'object') continue;
    const attr = attrNameFor(prop);
    const raw = element.getAttribute(attr) ?? element.getAttribute(prop);
    if (raw === null) continue;

    if (Array.isArray(def.enum) && def.enum.length) {
      // Only a declared value becomes a class. A typo must not mint a class
      // that silently matches no CSS and looks like it worked.
      if (!def.enum.includes(raw)) continue;
      // #1831: a value two properties both declare names the SAME class, so
      // the class cannot say which option asked for it. x-cardportfolio
      // size="full" minted .x-cardportfolio--full -- variant="full"'s whole
      // look (800px, larger header) -- and x-button icon="warning" painted
      // the button as variant="warning". The behaviors that own those
      // classes (card.js, button.js) stamp them from the right property.
      if (claimedByAnotherProperty(props, prop, raw)) continue;
      // #885: only if some stylesheet actually defines it. `size`/`variant`
      // do; `icon="star"` and `target="_self"` do not, and never did.
      const cls = `${base}--${raw}`;
      if (!styleSheetDefinesClass(cls)) continue;
      // a8a7362e: a class every rule already reaches by the attribute the
      // element carries (`.x-card--elevated, [elevated]`) is injection for
      // its own sake -- specificity does the job. See classAddsNothing().
      if (classAddsNothing(element, cls)) continue;
      element.classList.add(cls);
    } else if (def.type === 'boolean') {
      // "false"/"0" mean OFF (#747): a bare presence check reads the string
      // "false" as true, which is the opposite of what the markup says.
      if (raw === 'false' || raw === '0') continue;
      const boolCls = `${base}--${attr}`;
      if (!styleSheetDefinesClass(boolCls)) continue;
      if (classAddsNothing(element, boolCls)) continue;
      element.classList.add(boolCls);
    }
  }
}
