import { readFlag, readAttr, readOption, authoredAttr } from '../core/read-attr.js';
import { READY_ATTRIBUTE } from '../core/ready-signal.js';
import { setRule, clearRules } from '../core/dynamic-style.js';
import { dragStartPoint } from '../core/drag-start.js';
/**
 * Card Behavior + Variants
 * -----------------------------------------------------------------------------
 * Comprehensive card system supporting various content types and layouts.
 * Handles extensive variants like heroes, profiles, pricing, and media cards.
 * 
 * Usage:
 *   <article variant="glass" title="Title">Content</article>
 *   <div x-cardhero variant="cosmic" title="Hero Title" ...></div>
 * -----------------------------------------------------------------------------
 * 
 * ARCHITECTURE:
 * - All card variants compose the shared card structure
 * - Variants CONTAIN specialized content (images, profiles, etc.)
 * - Shared structure changes propagate to ALL variants automatically
 * 
 * cardimage composes the shared card structure and adds a <figure>. It does
 * not inherit anything: composeCard() is a function this file calls, and
 * nothing here descends from it. (The IS-A / HAS-A wording that used to sit here
 * described a schema-layer inheritance model that no code ever implemented.)
 * 
 * SEMANTIC STANDARD (MANDATORY):
 * - Container: <article> (preferred) or <section>
 * - Header content (title, subtitle): <header>
 * - Body content: <div class="x-card__body"> -- never <main>, which is only
 *   valid under html/body/div/form, not inside an <article> (#945)
 * - Footer content (actions, buttons): <footer>
 * 
 * ALL text elements are EDITABLE via double-click in the builder
 */

import { attachVideoLoadRetry, attachImageLoadRetry } from './media-load-retry.js';
import { reportIfThirdPartyMedia } from './media-unreachable.js';
import { tooltip as tooltipBehavior } from './tooltip.js';

// Always-on, dedicated cardimage/cardvideo load tracing -- this exact failure
// ("video/image cards not rendering") keeps recurring, especially on the
// FIRST navigation to Components coming from Home/Behaviors, and needs to
// stay traceable rather than re-diagnosed from scratch each time. Separate
// from media-load-retry.js's own tracing (which only fires on a genuine
// 'error'/timeout) -- this ALSO catches the "built fine, then silently
// disappeared from the DOM" class of bug (a later re-scan/re-render wiping
// the card), which a load-retry listener alone can't see since it only
// watches the element it was attached to, not whether that element is still
// attached at all. [WB:card-media] is a fixed, greppable prefix.
function traceCardMedia(kind, cardEl, mediaEl, src) {
  const startedAt = Date.now();
  const id = cardEl.id ? `#${cardEl.id}` : '';
  const where = `${location.pathname}${location.search}`;
  console.log(`[WB:card-media] ${kind}${id} BUILD src=${src} page=${where}`);

  const isImg = mediaEl.tagName === 'IMG';
  const onLoad = () => {
    console.log(`[WB:card-media] ${kind}${id} PAINTED get=${Date.now() - startedAt}ms ${isImg ? `${mediaEl.naturalWidth}x${mediaEl.naturalHeight}` : `readyState=${mediaEl.readyState}`}`);
  };
  const onError = () => {
    console.warn(`[WB:card-media] ${kind}${id} ERROR src=${src} get=${Date.now() - startedAt}ms`);
  };
  mediaEl.addEventListener(isImg ? 'load' : 'loadeddata', onLoad, { once: true });
  mediaEl.addEventListener('error', onError, { once: true });

  // Post-hoc presence check: did this exact element survive, and did it
  // actually paint anything? Catches "silently wiped by a later re-render"
  // even when no error/timeout ever fired on the element itself.
  setTimeout(() => {
    const stillAttached = mediaEl.isConnected;
    const stillInCard = cardEl.contains(mediaEl);
    const painted = isImg
      ? (mediaEl.complete && mediaEl.naturalWidth > 0)
      : mediaEl.readyState >= 2;
    if (!stillAttached || !stillInCard || !painted) {
      console.warn(`[WB:card-media] ${kind}${id} STALE CHECK FAILED at +2000ms -- attached=${stillAttached} inCard=${stillInCard} painted=${painted} src=${src} page=${where}`);
    }
  }, 2000);
}

// Common card padding
const CARD_PADDING = '1rem';

// Helper to parse boolean values from options/dataset
const parseBoolean = (val) => {
  if (val === 'true') return true;
  if (val === 'false') return false;
  if (val === '') return true; // Handle boolean attributes (e.g. data-clickable="")
  return val;
};

// Helper to get attribute from options, dataset, or direct attribute
// Supports: options.src, readAttr(element, 'src') (data-src), element.getAttribute('src')
const getAttr = (element, options, name) => {
  return options[name] || element.dataset[name] || element.getAttribute(name) || '';
};

// #883: the shared helpers below replace blocks that were written out by hand
// in card after card -- the code audit counted 72 duplicate clusters in this
// file. Each one is the exact logic it replaced, so behavior is unchanged; a
// fix now lands once instead of in whichever copies someone remembered.

// An off-by-default boolean (clickable, elevated, autoplay, featured, ...):
// a parsed option wins; otherwise any truthy spelling of the attribute, or the
// bare attribute itself, turns it on.
const readOnFlag = (element, options, name) => parseBoolean(options[name])
  ?? (readAttr(element, name) === 'true'
    || (readFlag(element, name) && readAttr(element, name) !== 'false')
    || element.hasAttribute(name));

// An on-by-default boolean (hoverable, controls, overlay, ...): only an
// explicit "false" -- data-* or plain -- turns it off.
const readDefaultOnFlag = (element, options, name) => parseBoolean(options[name])
  ?? (readAttr(element, name) !== 'false' && element.getAttribute(name) !== 'false');

// Enter/Space activation for an element acting as a button.
const onActivateKey = (activate) => (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    activate(e);
  }
};

// Create one card part: <tag class="..."> with optional text, appended to
// `parent` when one is given. Text goes in as textContent -- authored values
// are text, not markup; cardHtmlPart() is the explicit markup variant.
function cardPart(parent, tag, className, text) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text !== undefined) el.textContent = text;
  if (parent) parent.appendChild(el);
  return el;
}

function cardHtmlPart(parent, tag, className, html) {
  const el = cardPart(null, tag, className);
  el.innerHTML = html;
  if (parent) parent.appendChild(el);
  return el;
}

// THE CARD BODY (#945). It used to be a <main>, built at eight sites. The spec
// only allows <main> under html, body, div or form, so every card body inside
// an <article>, <section> or <aside> was invalid HTML -- 273 of them on
// cards.html, each one also a "main" landmark competing with the page's own.
// John: "the main context should fit without needing a main tag."
//
// One element, one class, every card: <div class="x-card__body">. A typed card
// whose body has its own part class (x-notification__content, ...) keeps it as
// a second class; the body is still the same element everywhere.
const CARD_BODY_CLASS = 'x-card__body';

function cardBody(parent, partClass) {
  return cardPart(parent, 'div', partClass ? `${CARD_BODY_CLASS} ${partClass}` : CARD_BODY_CLASS);
}

/** The card's body, if it already has one: built, or still an authored <main>. */
function findCardBody(element) {
  return element.querySelector(`:scope > .${CARD_BODY_CLASS}, :scope > main`);
}

// An AUTHORED <main> inside a card (`<article><header>..</header><main>..
// </main></article>`, the shape card.md taught) is the card's body, and is
// invalid there for the same reason. It becomes the body element: the same
// attributes and the same live child nodes, moved rather than copied, so
// anything already holding a reference to a child keeps working.
function adoptAsCardBody(el) {
  if (el.tagName !== 'MAIN') {
    el.classList.add(CARD_BODY_CLASS);
    return el;
  }
  const body = document.createElement('div');
  for (const { name, value } of Array.from(el.attributes)) body.setAttribute(name, value);
  body.classList.add(CARD_BODY_CLASS);
  body.append(...el.childNodes);
  el.replaceWith(body);
  return body;
}

function cardImg(parent, className, src, alt) {
  const img = cardPart(null, 'img', className);
  img.src = src;
  img.alt = alt;
  if (parent) parent.appendChild(img);
  return img;
}

// A call-to-action link (cardpricing, cardportfolio): href, class, label.
function appendCtaLink(parent, className, href, label) {
  const link = document.createElement('a');
  link.href = href;
  link.className = className;
  link.textContent = label;
  parent.appendChild(link);
  return link;
}

// Title then subtitle from a card's config, each only when set -- the pair
// almost every card variant renders into its own content block.
function appendTitleAndSubtitle(parent, config, titleTag, titleClass, subtitleTag, subtitleClass) {
  if (config.title) cardPart(parent, titleTag, titleClass, config.title);
  if (config.subtitle) cardPart(parent, subtitleTag, subtitleClass, config.subtitle);
}

// CSS background-image has no load-failure signal of its own, so a probe
// Image() supplies one (#534 cardhero, cardoverlay). On failure, and only while
// the card is still in the document: undo the background (`onFail`), then
// report an unreachable third-party host on the card (#1115), or throw into
// the global error handler -- the same convention audio.js uses.
function probeBackgroundImage(element, src, tag, what, onFail) {
  const probe = new Image();
  probe.addEventListener('error', () => {
    if (!document.contains(element)) return;
    onFail();
    if (reportIfThirdPartyMedia(element, src, tag)) return;
    throw new Error(`${tag}: failed to load ${what} "${src}" -- the file is missing or unreachable. Falling back to the default gradient.`);
  });
  probe.src = src;
}

// A real <a> stretched over the whole card (.x-card__link-overlay in card.css)
// so the card keeps native link semantics -- cardimage href= and cardlink.
// target="_blank" also gets rel="noopener".
function appendLinkOverlay(element, href, label, target) {
  const link = cardPart(null, 'a', 'x-card__link-overlay');
  link.href = href;
  if (target === '_blank') {
    link.target = '_blank';
    link.rel = 'noopener';
  }
  link.setAttribute('aria-label', label);
  element.appendChild(link);
  return link;
}

// Shown in an expandable/minimizable body with nothing in it. card.css
// defines .x-card__expandable-placeholder (#943); both cards use it.
const CARD_CONTENT_PLACEHOLDER = '<div class="x-card__expandable-placeholder">Add content here...</div>';

// (The VAR_* colour constants that stood here were only ever written into
// inline styles. #779 moved the last of those into card.css, so they went
// with them: a dead style constant is a second, silently-diverging definition
// of a rule that already lives in one place.)


function validateSemanticContainer(element, behaviorName) {
  const tag = element.tagName;
  // MVVM: Allow standard containers OR any custom element (implied by hyphen)
  // We do not enforce specific tag names here, decoupling View from Logic.
  const isAllowed = ['ARTICLE', 'SECTION', 'DIV'].includes(tag) || tag.includes('-');
  
  if (!isAllowed) {
    console.error(`[WB:${behaviorName}] Invalid container tag <${tag.toLowerCase()}>. Use <article>, <section>, or a custom element.`);
    return false;
  }
  return true;
}

/**
 * Parts that legitimately repeat inside one card (measured over every card
 * schema's test setups, 2026-10-06): the primary and secondary buttons, a
 * portfolio's tag pills, a pricing card's features and their check marks.
 * They are numbered. Every other part appears once, so it gets a plain id.
 */
const REPEATING_CARD_PARTS = new Set(['btn', 'pill', 'feature', 'feature-check']);

/**
 * #940 -- give a card's built parts ids derived from its host:
 * `${hostId}__header`, `${hostId}__body`, `${hostId}__feature-2`.
 *
 * John: "if all elements on the page have an id then duplicate work would
 * have a run time error." #923 rendered a card twice into the same host --
 * two headers, two titles -- and nothing said so; it was found by eye.
 * With these ids the second copy repeats them, and duplicate-ids.js (#730)
 * logs it. That is why a non-repeating part is never numbered: numbering
 * would give the double render fresh ids and hide it again.
 *
 * Only when the host has an id: nothing invents ids for an anonymous card.
 * Only the card's own parts -- an element with an x-*__part class, or the
 * card's direct header, footer or figure -- and never inside a nested
 * behavior host, whose parts are its own. An id the
 * behavior already set (an aria-controls target) is kept.
 *
 * @param {HTMLElement} element the card host
 */
function stampCardPartIds(element) {
  const hostId = element.id;
  if (!hostId) return;
  const counts = new Map();
  const walk = (node) => {
    for (const child of node.children) {
      if ([...child.attributes].some((a) => a.name.startsWith('x-') && a.name !== READY_ATTRIBUTE)) continue;
      // A base card's own header, footer and figure carry no class (#964:
      // the element says what it is), so those are named by their tag.
      const part = [...child.classList].map((c) => c.match(/^x-[a-z-]+__([a-z0-9-]+)$/)?.[1]).find(Boolean)
        || (node === element && ['HEADER', 'FOOTER', 'FIGURE'].includes(child.tagName) ? child.tagName.toLowerCase() : null);
      if (part && !child.id) {
        if (REPEATING_CARD_PARTS.has(part)) {
          const n = (counts.get(part) || 0) + 1;
          counts.set(part, n);
          child.id = `${hostId}__${part}-${n}`;
        } else {
          child.id = `${hostId}__${part}`;
        }
      }
      walk(child);
    }
  };
  walk(element);
}

/**
 * Shared Card Composition
 * All variants compose this shared structure
 */
export function composeCard(element, options = {}) {
  // #940: every card builder runs synchronously after this call, so a
  // microtask stamps the parts once the whole card is built.
  queueMicrotask(() => stampCardPartIds(element));
  // v3.0: Check if schema builder already processed this element
  // When true, DOM structure is already built from $view - we only add interactivity
  const schemaProcessed = options.schemaProcessed || element.getAttribute('x-schema');
  
  // #678 -- John, on `<div x-cardbutton variant="elevated">Example x-cardbutton
  // content</div>`: "shouldn't all of this context be shown on the card".
  //
  // It was not shown, it was DESTROYED. Each card behavior runs
  // `element.innerHTML = ''` right after composing, so anything the author
  // wrote between the tags was gone before the body was built. card(),
  // cardimage(), cardvideo(), cardhorizontal() and three others already each
  // carried their own `|| element.innerHTML` fallback -- the #455 fix, applied
  // one function at a time -- while ELEVEN others never got it: cardbutton,
  // cardhero, cardprofile, cardpricing, cardstats, cardtestimonial,
  // cardproduct, cardnotification, cardfile, cardlink, cardoverlay,
  // cardportfolio.
  //
  // Capturing it here instead fixes all of them at once and stops the next
  // card behavior from being written without it. composeCard() always runs
  // BEFORE the wipe, so the authored markup is still intact at this point.
  //
  // Three guards, each for a real re-entry case:
  //   - schemaProcessed: the structure came from $view, so innerHTML is the
  //     BUILT markup, not the author's -- re-injecting it would nest the card
  //     inside itself.
  //   - an existing .x-card__body/__header: a MutationObserver re-visit of an
  //     already-built card, same nesting hazard.
  //   - trim(): whitespace-only innerHTML is truthy, and would otherwise
  //     manufacture an empty body -- the blank-line problem #608 removed.
  const alreadyBuilt = !!element.querySelector(`:scope > .x-card__header, :scope > .${CARD_BODY_CLASS}`);
  const authoredContent = (schemaProcessed || alreadyBuilt) ? '' : (element.innerHTML || '').trim();

  const config = {
    ...options, // Spread first to allow overrides, but specific logic below takes precedence
    behavior: options.behavior || 'card',
    title: readOption(element, options, 'title') || '',
    subtitle: readOption(element, options, 'subtitle') || '',
    // card.schema.json declares author/date/category/reading-time (merged
    // from the former article schema), and nativeMap routes <article> to
    // this module -- so these render here or not at all. They once lived
    // only in article.js's article(), which was unreachable and has been
    // deleted; that left four declared attributes silently ignored (#861).
    author: readOption(element, options, 'author') || '',
    date: readOption(element, options, 'date') || '',
    category: readOption(element, options, 'category') || '',
    readingTime: readOption(element, options, 'readingTime') || '',
    // #886 follow-up. John: "featured is something to print on a price tag
    // when items are featured this week. Something has to identify this is
    // the thing." A heavier border says "this one is different"; it does not
    // say WHY. The marker is the label that does.
    // Bare `featured` gives the default word; `featured="Deal of the week"`
    // prints that instead, so the same attribute carries the reason.
    // A featured-tone with no featured is a colour for a marker that is not
    // there; it was a silent no-op (every tone rendered the same plain card).
    // Naming a tone means "show the marker in this colour", so it implies it.
    featuredLabel: (() => {
      const toneOnly = !!(options.featuredTone || readAttr(element, 'featuredTone'));
      if (!element.hasAttribute('featured') && !options.featured) return toneOnly ? 'Featured' : '';
      const raw = String(options.featured ?? element.getAttribute('featured') ?? '').trim();
      if (raw === 'false' || raw === '0') return '';
      // A bare attribute parses to "", and "true" is the boolean spelled out.
      return (raw === '' || raw === 'true') ? 'Featured' : raw;
    })(),
    // #998 -- "we need ability to change color at will": a theme ROLE for the
    // marker (card.css maps each to that theme's variable). featured-tone and
    // featuredTone both read; anything else falls back to the default.
    featuredTone: (() => {
      const t = String(options.featuredTone || readAttr(element, 'featuredTone') || '').trim().toLowerCase();
      return ['primary', 'success', 'warning', 'danger', 'info', 'neutral'].includes(t) ? t : '';
    })(),
    content: readOption(element, options, 'content') || authoredContent,
    footer: readOption(element, options, 'footer') || '',
    variant: readOption(element, options, 'variant') || 'default',
    badge: readOption(element, options, 'badge') || '',
    clickable: readOnFlag(element, options, 'clickable'),
    // #627: card.md documents `hoverable` as a plain boolean attribute
    // (`elevated`/`clickable`'s own pattern, both checked via
    // element.hasAttribute() below) -- but this only ever read
    // readAttr(element, 'hoverable') (i.e. data-hoverable), never a plain
    // hoverable="false" attribute at all. Confirmed live: <article x-card
    // hoverable="false"> kept its hover effect regardless, since nothing
    // ever looked at that attribute. Also check the plain attribute now,
    // same as data-hoverable, so either form can disable it.
    hoverable: readDefaultOnFlag(element, options, 'hoverable'),
    elevated: readOnFlag(element, options, 'elevated'),
    size: readOption(element, options, 'size') || 'auto',
    // #283: `tooltip` is the WB-standard attribute name for hover text
    // (ATTRIBUTE-NAMING-STANDARD.md's cheat sheet: "Set tooltip -> `tooltip`
    // or native `title`"). `hoverText` / `hover-text` stays supported as the
    // pre-existing documented alias (card.md, docs/properties.md,
    // cardprofile.schema.json) -- both resolve to the same themed tooltip
    // below, `tooltip` taking priority if a card author sets both.
    tooltip: options.tooltip || element.getAttribute('tooltip') || '',
    hoverText: readOption(element, options, 'hoverText', 'hoverText') || authoredAttr(element, 'hover-text') || '',
    onClick: options.onClick || element.dataset.onClick || '',
    dataContext: options.dataContext || element.dataset.dataContext || '{}',
    // v3.0: Skip structure building if schema already did it
    skipStructure: parseBoolean(options.skipStructure) ?? schemaProcessed ?? false,
    schemaProcessed: schemaProcessed,
  };

  // Structure holders
  let header = options.existingHeader || null;
  let main = options.existingMain || null;
  let footer = options.existingFooter || null;
  let clickHandler = null;

  // Validate semantic container
  validateSemanticContainer(element, config.behavior);

  // Apply root classes. Skip the bare 'x-card' class when the host tag IS
  // literally <article> -- redundant (card.css selects the tag directly too,
  // see its own comment) and flagged by tests/compliance/
  // no-redundant-tag-name-class.spec.ts (#478). Every OTHER card variant
  // (<div x-cardimage>, <article> auto-inject, ...) still needs the class since
  // its own tag name isn't "x-card" -- shared card.css rules have nothing
  // else to select there.
  // No base class: card.css matches `article` and `[x-card]` directly.
  //
  // #925: an `if (element.tagName.toLowerCase() !== 'x-card')` used to sit on
  // the line above with NO BRACES, so its body was the `if` below and the whole
  // variant-class block hung off it. The condition could never be false (no
  // element can have tag name x-card since 4.0.0), so it always ran -- but it
  // read as a comment-only line, and the next statement anyone added after it
  // would have been silently swallowed into the dangling branch.
  //
  // #969: no variant class either. `x-card--${behavior}` was stamped here on
  // every typed card, and each typed function added a second spelling of the
  // same fact (x-card-expandable, x-stats, x-portfolio, ...). John:
  // "`x-cardexpandable` -- shouldn't this be enough to get rid of class
  // assignments?" It is: the attribute that applied the behavior is on the
  // element, and card.css / notification.css select [x-cardexpandable] etc.
  // with the same (0,1,0) weight the class had. Classes that say what STATE
  // a card is in (--expanded, --minimized, --dragging) stay; they are not
  // written anywhere else.

  // Apply hover text as a THEMED WB tooltip (x-tooltip / tooltip.js), not
  // the native browser `title` attribute -- native title tooltips are
  // unstyled, slow to appear, and inconsistent across browsers (#283). A
  // plain `title` attribute set independently by the author (not via
  // tooltip/hoverText) is left untouched and keeps working as a normal
  // native tooltip.
  //
  // Set x-tooltip for discoverability/consistency with the same marker
  // pattern cardhero's CTA buttons use (search "x-tooltip" in this file),
  // but don't rely on WB's scan/observer to pick it up -- an ATTRIBUTE
  // change on an element already in the DOM isn't covered by wb-lazy.js's
  // MutationObserver (it only watches childList + the `x-behavior`
  // attribute), so a card enhanced after the page's initial eager scan
  // would otherwise never get wired up. Call tooltip() directly instead;
  // it's idempotent (guards on element._wbTooltip), so a later scan/observer
  // pass finding the same [x-tooltip] element is a safe no-op, not a
  // double-attach.
  const hoverContent = config.tooltip || config.hoverText;
  let tooltipCleanup = null;
  if (hoverContent) {
    element.setAttribute('x-tooltip', hoverContent);
    const cleanupPromise = tooltipBehavior(element, { content: hoverContent });
    tooltipCleanup = () => { cleanupPromise.then((fn) => { if (typeof fn === 'function') fn(); }); };
  }
  
  // #779/#790 -- these used to be written INLINE, and card.css already
  // declared every one of them:
  //
  //   transition, border-radius, overflow, display, contain, overflow-wrap
  //     -> `.x-card` (card.css:24)
  //   the default background + border
  //     -> `.x-card { background: var(--card-bg-override, var(--bg-secondary));
  //                    border: 1px solid var(--border-color) }`
  //   the rack treatment
  //     -> `.x-card--rack`, which uses --rack-bg / --rack-border / --rack-side
  //        TOKENS where this code hardcoded #0f172a / #334155 / #1e293b
  //
  // An inline declaration beats every one of those rules regardless of
  // specificity, so the stylesheet has been dead here since #370 migrated it
  // (its comments say "now that the inline version is gone" -- it was not).
  //
  // The `ownsOwnSurface` allowlist that stood here existed ONLY to work around
  // that: glass, bordered, flat, rack, minimal and elevated were each added to
  // it after someone noticed the variant rendering pixel-identical to default.
  // Every future variant would have been born broken the same way. Removing
  // the inline write fixes all of them at once, retires the allowlist, and
  // lets rack be themed instead of hardcoded.
  //
  // flex-direction was already left out for exactly this reason -- the comment
  // that used to sit here explained that setting it inline would block
  // `[x-cardproduct][x-cardhorizontal] { flex-direction: row }`. That reasoning
  // applies to every property in the object, not just that one.
  // The single value no stylesheet can know: a background the AUTHOR passed
  // in. #779: a generated stylesheet rule, not the style attribute. Weight 3
  // (0,3,0) so it still outranks the compound variant rules in card.css
  // (`[variant="glass"][elevated]`, 0,2,0) the way the inline write did.
  if (config.background) {
    setRule(element, 'card-background', { background: config.background }, { weight: 3 });
  }

  // The default surface and the rack treatment were written here inline and
  // are both already in card.css (`.x-card`, `.x-card--rack`). The variant
  // classes are applied a few lines below, so each variant's own rules now
  // reach the element instead of losing to an inline declaration. Nothing to
  // set here for any of them.
  
  // Variant class
  if (config.variant !== 'default') {
    // No variant class: card.css reads [variant="..."] straight off the element.
  }
  
  // Size class (max/min-width scale, card.css) — 'xs' was missing from the
  // allowlist so <article size="xs"> silently did nothing (#282). 'auto'
  // (a real schema-declared enum value, matching .x-card--auto in
  // card.css) was missing too, for the same reason.
  // 'auto' is the default, and card.css declares it on the root class, so a
  // --auto modifier would appear on every card and mean nothing.
  if (config.size && config.size !== 'auto' && ['xs','sm','md','lg','xl','full'].includes(config.size)) {
    element.classList.add(`x-card--${config.size}`);
  }
  
  // Elevated -- `.x-card--elevated` (card.css) already declares the shadow,
  // the border-color and `background: var(--bg-elevated)`. That rule carries
  // !important solely because it had to beat the inline write that used to be
  // here; its own comment says so ("!important is the only way a stylesheet
  // rule can win against an inline style"). With the inline gone the class is
  // enough, and the !important can be dropped separately. (#779)
  if (config.elevated) {
    // No class: card.css reads the [elevated] attribute.
  }

  // Hoverable -- `.x-card--hoverable:hover` (card.css:520) declares exactly
  // the three properties the old JS handlers wrote inline (transform,
  // box-shadow, border-color). A :hover rule also does it without listeners,
  // without a mouseleave that had to guess what to restore, and it works for
  // keyboard focus and touch the way CSS decides rather than the way two
  // mouse events happened to fire.
  //
  // The `ownsOwnSurface` guards that stood in both handlers were the same
  // workaround as the base surface: mouseleave forcing the generic border
  // colour back overrode `flat`'s border:none and `glass`'s themed border on
  // the first hover. With no inline write there is nothing to override and
  // nothing to guard.
  // No --hoverable class: hover is the default, and the opt-out already lives
  // on the element as hoverable="false", which card.css reads directly.
  // Stamping a class onto 100% of cards restated a fact nothing had asked for.

  
  if (config.clickable) {
    // No class: card.css reads the [clickable] attribute.
    element.setAttribute('tabindex', '0');
    element.setAttribute('role', 'button');

    clickHandler = () => {
      element.classList.toggle('x-card--active');
    };
    element.addEventListener('click', clickHandler);
    
    // Also handle Enter/Space for accessibility
    element.addEventListener('keydown', onActivateKey(() => clickHandler()));
  }

  // LOGIC: Dynamic onClick handler (v3.1)
  if (config.onClick) {
    // Ensure element looks interactive
    if (!element.hasAttribute('role')) element.setAttribute('role', 'button');
    if (!element.hasAttribute('tabindex')) element.setAttribute('tabindex', '0');

    const runAction = (e) => {
      // Don't navigate if it's a hash link unless explicitly handled
      if (element.tagName === 'A' && element.getAttribute('href') === '#') {
        e.preventDefault();
      }

      try {
        // Parse local data context safely
        let data = {};
        try { 
          if (config.dataContext) data = JSON.parse(config.dataContext); 
        } catch(err) {
          console.warn('[WB:Logic] Invalid JSON in dataContext:', err);
        }

        // Execute script with context
        // Scope: this=element, e=event, config=config, data=localData
        const fn = new Function('e', 'config', 'data', 'element', config.onClick);
        fn.call(element, e, config, data, element);
      } catch (err) {
        console.error('[WB:Logic] Script error:', err);
        console.debug('Script Source:', config.onClick);
      }
    };

    element.addEventListener('click', runAction);
    
    // Accessibility support for enter/space
    element.addEventListener('keydown', onActivateKey(runAction));
  }

  // Header pieces shared by createHeader() and buildStructure() below, which
  // used to build each of them twice (#883). Title and subtitle are children
  // of the <header> itself -- see createHeader for why there is no wrapper.
  const appendTitles = (h) => appendTitleAndSubtitle(h, config, 'h3', '', 'p', '');
  const appendHeaderExtra = (h, html) => {
    if (html) cardHtmlPart(h, 'div', 'x-card__header-extra', html);
  };
  // card.css targets `article > header > span`.
  const appendBadge = (h) => cardPart(h, 'span', '', config.badge);

  // Return base context for variants to use
  return {
    element,
    config,
    header,
    main,
    footer,
    CARD_PADDING,

    /**
     * #678: render the author's own content into the card.
     *
     * Capturing it in config.content is only half the job. Eight behaviors --
     * cardhero, cardprofile, cardstats, cardproduct, cardfile, cardlink,
     * cardoverlay, cardportfolio -- never call buildStructure() and never read
     * config.content; they hand-build their DOM, so the captured text had
     * nowhere to go and stayed destroyed.
     *
     * Each of them calls this once after building, rather than growing eight
     * copies of the same six lines.
     *
     * No-ops when there is nothing authored, or when a body already carries
     * it -- appending an empty box is the blank-line problem #608 removed.
     */
    renderAuthoredContent: () => {
      if (!config.content) return null;
      // An existing body is filled rather than skipped. cardstats builds its
      // own EMPTY body, so bailing out on "a body already exists" left the
      // content homeless AND left a styled empty box on screen -- the
      // blank-line problem of #608 with the content loss of #678 on top.
      // Only fill it when it is empty: a body with real content in it is
      // somebody else's, and overwriting it would be a different bug.
      const found = findCardBody(element);
      if (found) {
        const existing = adoptAsCardBody(found);
        if (existing.innerHTML.trim()) return null;
        existing.innerHTML = config.content;
        return existing;
      }
      const body = cardBody(element);
      body.innerHTML = config.content;
      return body;
    },
    
    // =========================================
    // UTILITY METHODS FOR BUILDING CARD PARTS
    // =========================================
    
    /**
     * Create a header section with title and optional subtitle
     * ALWAYS renders title/subtitle if provided in config
     */
    createHeader: (extraContent = '') => {
      const h = document.createElement('header');
      // No class: card.css targets `article > header` / `[x-card] > header`.
      // The tag already says what this element is.
      
      // No wrapper div. John: "its sad that we have a div html tag to inject a
      // class and nothing else."
      //
      // .x-card__header-content existed only to keep title/subtitle stacked on
      // one side while the badge sat on the other -- a flexbox limitation, not
      // a piece of the card's meaning. card.css uses grid on the header now, so
      // the title and subtitle are children of the <header> itself and the
      // badge takes its own column. One less element, and the structure reads
      // as what it is.
      appendTitles(h);
      appendHeaderExtra(h, extraContent);
      if (config.badge) appendBadge(h);

      return h;
    },
    
    /**
     * Create the body content area (a <div class="x-card__body">, #945)
     */
    createMain: (content = '') => {
      const m = cardBody(null);
      
      // Use config.content if no content passed
      const finalContent = content || config.content;
      if (finalContent) {
        if (typeof finalContent === 'string') {
          m.innerHTML = finalContent;
        }
      }
      return m;
    },
    
    /**
     * Create footer section
     */
    createFooter: (content = '') => {
      const footEl = document.createElement('footer');
      footEl.className = 'x-card__footer';
      
      const footerText = content || config.footer;
      if (footerText) {
        if (typeof footerText === 'string') {
          footEl.textContent = footerText;
        }
      }
      return footEl;
    },
    
    /**
     * Create a figure element for images/media
     */
    createFigure: () => {
      const fig = document.createElement('figure');
    
      fig.className = 'x-card__figure';
      
      return fig;
    },
    
    /**
     * Build the complete card structure
     * Call this from variants to get header + main + footer
     */
    buildStructure: (options = {}) => {
      const { 
        headerContent = '', 
        mainContent = '', 
        footerContent = '',
        showHeader = true,
        showMain = true,
        showFooter = true
      } = options;
      
      // MVVM: Do NOT wipe innerHTML. We enhance what's there.
      // element.innerHTML = '';
      
      // HEADER - show if title/subtitle/badge config exists OR a semantic
      // <header> is already present (enhance it to x-card__header). (#159)
      if (showHeader && (header || config.title || config.subtitle || headerContent || config.badge
          || config.author || config.date || config.category || config.readingTime
          || config.featuredLabel)) {
        if (!header) {
          const headerEl = document.createElement('header');
          // See createHeader: the tag names it, card.css targets the tag.
          
          // Children of the <header> itself -- see createHeader above for why
          // the wrapper div is gone.
          appendTitles(headerEl);

          if (config.featuredLabel) {
            const featuredEl = cardPart(null, 'mark', '', config.featuredLabel);
            if (config.featuredTone) featuredEl.setAttribute('tone', config.featuredTone);
            // Before the title, not after it: the point of the marker is to
            // be read BEFORE you read what the card is about.
            headerEl.insertBefore(featuredEl, headerEl.firstChild);
          }

          // Article metadata. Distinct semantic tags rather than classes:
          // card.css reaches each one as `article > header > time`,
          // `> address`, `> small`.
          if (config.category) cardPart(headerEl, 'small', '', config.category);

          if (config.date) {
            const dateEl = document.createElement('time');
            dateEl.setAttribute('datetime', config.date);
            dateEl.textContent = config.date;
            headerEl.appendChild(dateEl);
          }

          if (config.readingTime) {
            // <data>, not a second <small>: category is already the <small>,
            // and two identical tags in the header make the order ambiguous
            // to CSS -- which is what selects these now.
            const readingEl = document.createElement('data');
            readingEl.setAttribute('value', String(config.readingTime));
            readingEl.textContent = config.readingTime;
            headerEl.appendChild(readingEl);
          }

          if (config.author) cardPart(headerEl, 'address', '', `By ${config.author}`);

          appendHeaderExtra(headerEl, headerContent);

          // #884: cardproduct already painted this same badge= over its
          // figure, and it builds before the header is inserted. Emitting it
          // here too rendered "SALE" twice in one card.
          if (config.badge && !badgeAlreadyRendered(element, config.badge)) appendBadge(headerEl);
          
          header = headerEl;
          if (element.firstChild) {
            element.insertBefore(headerEl, element.firstChild);
          } else {
            element.appendChild(headerEl);
          }
        } else {
          // Enhance existing header
          // Already a <header> inside the card -- card.css matches the tag.
          // Inject badge if missing
          if (config.badge && !badgeAlreadyRendered(element, config.badge)) appendBadge(header);
        }
      }
      
      // MAIN — render ONLY authored content. Never inject placeholder text: a card
      // with no body (e.g. an image card) must show nothing there, not phantom
      // "Lorem ipsum" that isn't in the source. (#202)
      //
      // An authored <main> handed in as the existing body becomes the body
      // element first (#945): a <main> is invalid inside the card.
      if (main) main = adoptAsCardBody(main);
      if (showMain) {
        const mainText = mainContent || config.content;
        if (!main && mainText) {
          const mainEl = cardBody(null);
          mainEl.innerHTML = mainText;
          main = mainEl;
          if (footer) {
            element.insertBefore(mainEl, footer);
          } else {
            element.appendChild(mainEl);
          }
        } else if (main) {
          // If main is empty (e.g. created by SchemaBuilder with empty slot)
          // but we have config.content, inject it.
          if (!main.innerHTML.trim() && config.content) {
             main.innerHTML = config.content;
          }
          // #608: John -- "if there is no content, then don't show blank
          // lines." A schema-built body shell with genuinely nothing to
          // show (no config.content, no authored innerHTML) used to get
          // enhanced anyway (padding/flex/color applied), leaving a
          // styled-but-empty box that reads as a blank line -- the same
          // "never inject placeholder, show nothing" rule the comment two
          // lines up already states for the create-a-new-main branch, just
          // not applied to the enhance-an-existing-one branch. Remove it
          // instead of styling emptiness.
          if (!main.innerHTML.trim()) {
            main.remove();
            main = null;
          }
          // The padding/flex/colour fallbacks once written onto an AUTHORED
          // body here were card.css's own body values; deleted (#779).
        }
      }
      
      // FOOTER - show if footer config text exists OR a semantic <footer> is
      // already present (enhance it to x-card__footer). (#159)
      if (showFooter && (footer || config.footer || footerContent)) {
        if (!footer) {
          const footerEl = document.createElement('footer');
          footerEl.className = 'x-card__footer';
          footerEl.textContent = footerContent || config.footer;
          
          footer = footerEl;
          element.appendChild(footerEl);
        } else {
          // Enhance existing footer. Its border-top / background come from
          // .x-card__footer in card.css; the tighter 0.75rem padding an
          // authored footer always got is .x-card__footer--authored (#779 --
          // all three used to be inline fallbacks written here).
          footer.classList.add('x-card__footer', 'x-card__footer--authored');
        }
      }
      
      return { header, main, footer };
    },
    
    // Cleanup function
    cleanup: () => {
      element.classList.remove('x-card', `x-card--${config.behavior.replace('card', '')}`,
        `x-card--${config.variant}`, `x-card--${config.size}`, 'x-card--hoverable', 'x-card--elevated', 
        'x-card--clickable', 'x-card--active');
      // No hover listeners to remove: hover is `.x-card--hoverable:hover` in
      // card.css now, and the class is removed above. (#779)
      if (clickHandler) {
        element.removeEventListener('click', clickHandler);
      }
      if (tooltipCleanup) {
        tooltipCleanup();
      }
    }
  };
}

/**
 * Card Component
 * Custom Tag: <article>
 */
/**
 * Has this card already painted its badge= somewhere of its own?
 *
 * #884: several card variants (cardproduct on its figure, cardlink in its
 * title group) build a badge themselves and run BEFORE the shared header is
 * inserted, so the header builder would render the same value a second time.
 * Matching on the rendered TEXT rather than on a class or a position keeps
 * this true for any variant that grows its own badge later.
 */
function badgeAlreadyRendered(element, badge) {
  if (!badge) return false;
  const wanted = String(badge).trim();
  if (!wanted) return false;
  return Array.from(element.querySelectorAll('*')).some(
    (node) => node.children.length === 0 && (node.textContent || '').trim() === wanted,
  );
}

/** Bodies card() built around loose body content (see card()). */
const gatheredBodies = new WeakSet();

export function card(element, options = {}) {
  // #202: a legacy MVVM template (schema $view / views-registry / partial) may
  // have ALREADY wrapped our content in a competing `.card` structure
  // (.card__header/.card__title/.card__body). card.js is the SOLE renderer of the
  // card (.x-card__*), so unwrap that legacy chrome — keep only its body content
  // — before we build. Title/subtitle/footer come from attributes; the body is the
  // real slotted content. This is what produced 2–4× duplicate title/footer.
  const legacyCard = element.querySelector(':scope > .card, :scope > article.card, :scope > div.card');
  if (legacyCard) {
    const legacyBody = legacyCard.querySelector('.card__body, .card__main');
    element.innerHTML = legacyBody ? legacyBody.innerHTML : '';
  }

  // FIX: Un-wrap an auto-generated body if it contains semantic elements
  // This happens because SchemaBuilder wraps ALL content in the body part defined in schema
  const autoMain = findCardBody(element);
  if (autoMain && autoMain.querySelector(`header, main, .${CARD_BODY_CLASS}`)) {
    const fragment = document.createDocumentFragment();
    while (autoMain.firstChild) {
      fragment.appendChild(autoMain.firstChild);
    }
    autoMain.remove();
    element.appendChild(fragment);
  }

  // Check for existing semantic structure (direct children)
  const hasHeader = element.querySelector(':scope > header');
  // A built body, or an authored <main> (buildStructure adopts it, #945).
  let hasMain = findCardBody(element);
  const hasFooter = element.querySelector(':scope > footer');
  
  // Determine if we are upgrading raw content
  const isSemantic = hasHeader || hasMain || hasFooter;

  // A semantic card with no body but loose body content between its
  // header/footer -- <article><div x-demo>…</div><footer></footer></article>
  // (pages/offshoring.html). Nothing below captures that content (semantic
  // mode passes content ''), so composeCard() fell back to the WHOLE
  // innerHTML and buildStructure() pasted it, as a string, into a new body
  // while the originals stayed put: the body rendered twice, and the copy was
  // a frozen snapshot of whatever the behaviors inside had built so far -- a
  // <div x-demo> copied mid-measurement kept `x-demo--measuring` forever.
  // MOVE the loose nodes into the body instead: one body, live elements.
  if (isSemantic && !hasMain) {
    const loose = Array.from(element.childNodes).filter((n) => n !== hasHeader && n !== hasFooter
      && n.nodeType !== Node.COMMENT_NODE
      && !(n.nodeType === Node.ELEMENT_NODE && /^(HEADER|FOOTER)$/.test(n.tagName)));
    if (loose.some((n) => n.nodeType === Node.ELEMENT_NODE || (n.textContent || '').trim())) {
      const bodyEl = cardBody(null);
      loose.forEach((n) => bodyEl.appendChild(n));
      // Styled by card.css like any body this file creates.
      gatheredBodies.add(bodyEl);
      element.insertBefore(bodyEl, hasFooter || null);
      hasMain = bodyEl;
    }
  }
  const hasContent = options.content || readAttr(element, 'content');
  
  // Capture content:
  // 1. If semantic structure exists, we don't capture innerHTML (it's already in the structure)
  // 2. If valid content option/data provided, use it
  // 3. Fallback to innerHTML (raw content mode)
  //
  // #683: the precedence rule, one for every card path -- an explicit
  // content="..." attribute WINS over the text between the tags, the same
  // order composeCard() and the typed cards (cardimage, ...) already use.
  // The children used to be left in place beside the attribute's body, so
  // both rendered: the attribute in the body and the children loose above it.
  const initialContent = isSemantic ? '' : (hasContent || element.innerHTML);

  const base = composeCard(element, { 
    ...element.dataset, 
    ...options, 
    behavior: 'card',
    content: initialContent,
    existingHeader: hasHeader,
    existingMain: hasMain,
    existingFooter: hasFooter
  });

  // Clear the authored children once they are accounted for: in raw mode
  // they were captured above and buildStructure() rebuilds them inside the
  // new body (clearing stops it duplicating them); when the attribute wins
  // (#683) they are the losing side of the precedence rule above.
  if (!isSemantic && element.innerHTML.trim()) {
    element.innerHTML = '';
  }
  
  // Build structure handles both creation and enhancement. A semantic card
  // with no body keeps none: its authored header/footer are not body content,
  // and building a body from innerHTML would paste copies of them.
  // #683: nor does a card with no content at all -- a whitespace-only
  // <div x-card> got an empty padded body, the blank line #608 removed
  // from the schema-built path.
  base.buildStructure({ showMain: isSemantic ? !!hasMain : !!String(initialContent || '').trim() });
  
  return base.cleanup;
}

/**
 * Card Image Component
 * Custom Tag: <card-image>
 */
export function cardimage(element, options = {}) {
  const config = {
    src: getAttr(element, options, 'src'),
    alt: getAttr(element, options, 'alt'),
    aspect: getAttr(element, options, 'aspect') || '16/9',
    position: getAttr(element, options, 'position') || 'top',
    fit: getAttr(element, options, 'fit') || 'cover',
    title: getAttr(element, options, 'title'),
    subtitle: getAttr(element, options, 'subtitle'),
    // #608: was missing the getAttribute('content') check every other card
    // variant's own content resolution already has (see composeCard/card()
    // line ~155) -- a plain content="..." ATTRIBUTE (the form every
    // cardimage.md example uses) was silently ignored, falling through to
    // innerHTML, which is empty for a self-closing-style <div x-cardimage
    // src="..." content="...">. Confirmed live: "Optional content below the
    // image." never rendered, just an empty content area.
    content: readOption(element, options, 'content') || element.innerHTML,
    // caption / href / loading were declared in cardimage.schema.json and read
    // nowhere: no caption ever rendered, href never made the card clickable,
    // and every image was hard-wired to loading="lazy".
    caption: options.caption || readAttr(element, 'caption'),
    href: options.href || readAttr(element, 'href'),
    loading: (options.loading || readAttr(element, 'loading')) === 'eager' ? 'eager' : 'lazy',
    ...options
  };

  const base = composeCard(element, { ...config, behavior: 'cardimage' });
  element.innerHTML = '';

  // Caption under the image, inside the same <figure> so it is announced
  // with it. textContent: the caption is authored text, not markup.
  const addCaption = (figure) => {
    if (!config.caption) return;
    cardPart(figure, 'figcaption', 'x-card__caption', config.caption);
  };

  // Build header/main/footer structure
  base.buildStructure();

  const retryCleanups = [];

  // One figure for every position. top/bottom used to be two verbatim copies
  // of this, and left/right -- declared in cardimage.schema.json's enum --
  // matched neither branch, so those cards rendered with no image at all.
  const buildFigure = () => {
    const figure = base.createFigure();
    // #1003: the property card.css already reads. #779: a generated rule.
    setRule(figure, 'aspect', { '--card-image-aspect': config.aspect });
    const img = document.createElement('img');
    img.src = config.src;
    img.alt = config.alt;
    img.loading = config.loading;
    // #1003: only `fit` varies; card.css reads it from --card-image-fit. An
    // inline object-fit/width/height here would make the image unthemeable.
    if (config.fit) setRule(img, 'fit', { '--card-image-fit': config.fit });
    retryCleanups.push(attachImageLoadRetry(img));
    traceCardMedia('cardimage', element, img, config.src);
    figure.appendChild(img);
    addCaption(figure);
    return figure;
  };

  if (config.src) {
    const figure = buildFigure();
    // bottom goes last; top, left and right go first -- card.css puts the
    // side positions in their own grid column, keyed on the host's
    // `position` attribute, so DOM order only decides top vs bottom.
    if (config.position === 'bottom') element.appendChild(figure);
    else element.insertBefore(figure, element.firstChild);
    // position given via options only: reflect it so card.css can select it.
    if ((config.position === 'left' || config.position === 'right') && !element.hasAttribute('position')) {
      element.setAttribute('position', config.position);
    }
  }

  // href: the whole card becomes the link target. A real <a> stretched over
  // the card (same approach as cardlink) rather than a click handler, so it
  // keeps native link semantics. Positioning lives in card.css.
  let stretchedLink = null;
  if (config.href && config.href !== '#') {
    element.classList.add('x-card-image--linked');
    stretchedLink = appendLinkOverlay(element, config.href, config.title || config.alt || config.href);
  }

  return () => {
    base.cleanup();
    retryCleanups.forEach(fn => fn());
    if (stretchedLink) stretchedLink.remove();
    element.classList.remove('x-card-image--linked');
  };
}

/**
 * Card Video Component
 * Custom Tag: <card-video>
 */
export function cardvideo(element, options = {}) {
  const config = {
    src: getAttr(element, options, 'src'),
    poster: getAttr(element, options, 'poster'),
    title: getAttr(element, options, 'title'),
    subtitle: getAttr(element, options, 'subtitle'),
    // Same bare-boolean-attribute gap as cardexpandable/cardminimizable above.
    autoplay: readOnFlag(element, options, 'autoplay'),
    muted: readOnFlag(element, options, 'muted'),
    loop: readOnFlag(element, options, 'loop'),
    controls: readDefaultOnFlag(element, options, 'controls'),
    // Same aspect-ratio pattern as cardimage() above: a fixed box size,
    // deterministic regardless of load success/failure, instead of falling
    // back to the browser's intrinsic video default (~300x150) (#482).
    aspect: getAttr(element, options, 'aspect') || '16/9',
    // #608: same missing getAttribute('content') gap as cardimage() above.
    content: readOption(element, options, 'content') || element.innerHTML,
    // cardvideo.schema.json declares `description`, not `subtitle`; it was
    // never read. Render it where cardproduct renders its own description:
    // as the header subtitle, unless an explicit subtitle already fills it.
    description: getAttr(element, options, 'description'),
    ...options
  };
  if (config.description && !config.subtitle) config.subtitle = config.description;

  const base = composeCard(element, { ...config, behavior: 'cardvideo' });
  element.innerHTML = '';

  // Build header/main/footer
  base.buildStructure();

  // Video figure
  let retryCleanup = null;
  if (config.src) {
    const coverFigure = base.createFigure();
    // #1003: the property card.css already reads. #779: a generated rule.
    setRule(coverFigure, 'aspect', { '--card-image-aspect': config.aspect });
    const video = document.createElement('video');
    video.src = config.src;
    // Fills the figure: `.x-card__figure video` in card.css already says
    // width/height 100% and display:block -- the inline copy is gone (#779).
    if (config.poster) video.poster = config.poster;
    if (config.autoplay) video.autoplay = true;
    if (config.muted) video.muted = true;
    if (config.loop) video.loop = true;
    if (config.controls) video.controls = true;
    video.playsInline = true;
    retryCleanup = attachVideoLoadRetry(video);
    traceCardMedia('cardvideo', element, video, config.src);

    // Check for tracks/captions
    const hasTracks = element.querySelector('track') || config.tracks;
    if (!hasTracks) {
      element.dataset.needsCaptions = "For accessibility, consider adding captions";
      element.setAttribute('data-captions-missing', 'true');
      // Add accessibility warning
      // Hidden but present for tests/SR: `.x-card__video-warning { display:
      // none }` in card.css (#779 -- was also written inline).
      cardPart(coverFigure, 'div', 'x-card__video-warning', 'Video missing captions');
    }

    coverFigure.appendChild(video);
    element.insertBefore(coverFigure, element.firstChild);
  }

  return () => { base.cleanup(); if (retryCleanup) retryCleanup(); };
}

/**
 * Card Button Component
 * Custom Tag: <card-button>
 */
export function cardbutton(element, options = {}) {
  // Compose shared card fields, then add cardbutton-specific fields.
  const config = {
    ...element.dataset,
    ...options,
    primary: readOption(element, options, 'primary'),
    secondary: readOption(element, options, 'secondary'),
    primaryHref: readOption(element, options, 'primaryHref'),
    secondaryHref: readOption(element, options, 'secondaryHref'),
    behavior: 'cardbutton'
  };

  const base = composeCard(element, config);
  element.innerHTML = '';
  base.buildStructure();

  // Add button footer if needed
  if (config.primary || config.secondary) {
    const btnFooter = document.createElement('footer');
    btnFooter.className = 'x-card__btn-footer';
    // #561: this and the two button inline style.cssText assignments below
    // duplicated card.css's `.x-card__btn-footer` / `.x-card__btn.x-card__
    // btn--secondary` / `.x-card__btn.x-card__btn--primary` rules property
    // for property -- and being inline, silently overrode them, so bumping
    // the CSS class alone (the button's own padding was 0.625rem/10px,
    // below the §13 1rem/16px minimum) would never have changed what
    // actually rendered. card.css's own comment on `.x-card__btn-footer
    // .x-card__btn` already said "the buttons only ever appear inside
    // .x-card__btn-footer... so this costs nothing" -- that migration was
    // written but never finished; these three inline styles were the reason.
    // Buttons with no *Href just sat inert -- no click handler at all, so
    // clicking e.g. "Confirm Delete" did visibly nothing. A component
    // library button can't know the app's confirm/save logic, but it must
    // signal the click happened -- same bubbling wb:{behavior}:{action}
    // convention as cardnotification/cardproduct/etc (card.js) -- so a real
    // consumer (or this project's own demo pages) has something to listen for.
    // One builder, two kinds. These were two 13-line blocks differing only in
    // the words "secondary" and "primary" -- a NEAR duplicate flagged by the
    // code auditor (#883). Two copies of one piece of logic is two places for
    // a fix to land in only one, which is exactly how this project's dispatch
    // and prefix bugs happened.
    const addActionButton = (kind) => {
      const label = config[kind];
      if (!label) return;
      const href = config[`${kind}Href`];
      const btn = document.createElement(href ? 'a' : 'button');
      btn.className = `x-card__btn x-card__btn--${kind}`;
      btn.textContent = label;
      if (href) {
        btn.href = href;
      } else {
        // A component-library button cannot know the app's save/confirm logic,
        // but it must signal that the click happened -- the same bubbling
        // wb:{behavior}:{action} convention the other card variants use.
        btn.addEventListener('click', () => {
          element.dispatchEvent(new CustomEvent(`wb:cardbutton:${kind}`, {
            bubbles: true,
            detail: { label },
          }));
        });
      }
      btnFooter.appendChild(btn);
    };

    // Order matters: secondary renders before primary.
    addActionButton('secondary');
    addActionButton('primary');
    element.appendChild(btnFooter);
  }
  return base.cleanup;
}

/**
 * Card Hero Component
 * Custom Tag: <card-hero>
 */
export function cardhero(element, options = {}) {
  const config = {
    background: readOption(element, options, 'background'),
    overlay: readDefaultOnFlag(element, options, 'overlay'),
    xalign: readOption(element, options, 'xalign') || 'center',
    height: readOption(element, options, 'height') || '400px',
    cta: readOption(element, options, 'cta'),
    ctaHref: readOption(element, options, 'ctaHref'),
    ctaTooltip: options.ctaTooltip || element.dataset.ctaTooltip || authoredAttr(element, 'cta-tooltip'),
    ctaSecondary: readOption(element, options, 'ctaSecondary'),
    ctaSecondaryHref: readOption(element, options, 'ctaSecondaryHref'),
    ctaSecondaryTooltip: options.ctaSecondaryTooltip || element.dataset.ctaSecondaryTooltip || authoredAttr(element, 'cta-secondary-tooltip'),
    pretitle: readOption(element, options, 'pretitle'),
    // Documented in cardhero.schema.json (enum: default/cosmic/split/
    // minimal/gradient) but never actually read here -- CSS never got a
    // corresponding .x-cardhero--<variant> rule either, so every variant
    // rendered pixel-identical (#383).
    variant: readOption(element, options, 'variant') || 'default',
    // Declared in cardhero.schema.json ("Make hero full viewport height") and
    // read nowhere, so <x-cardhero full-height> rendered at the default 400px.
    fullHeight: parseBoolean(options.fullHeight) ?? readFlag(element, 'fullHeight'),
    // Read with the rest of the config (#1124 explains why readAttr, not
    // getAttribute). Applied to the title element below.
    headingLevel: options.headingLevel ?? readAttr(element, 'headingLevel', '3'),
    ...options
  };

  const base = composeCard(element, { ...config, behavior: 'cardhero', hoverable: false });
  // Kept by #969, unlike the typed cards' own classes: `x-hero` is not a
  // restatement of [x-cardhero]. It is the HERO behavior's class (hero.js
  // adds it to <div x-hero>), and the hero rules in site.css, hero.css and
  // x-signature.css reach a card hero through it.
  element.classList.add('x-hero');
  if (config.variant && config.variant !== 'default') {
    element.classList.add(`x-cardhero--${config.variant}`);
  }
  // composeCard turns an author background= into a generated `background`
  // rule. A hero owns its own full-bleed background (set below from the same
  // attribute, as background-image), so drop that shorthand and let hero.css
  // provide the rich default gradient (or the user's bg). #779: this used to
  // be removeProperty() calls on the style attribute.
  setRule(element, 'card-background', null);

  // CHECK FOR SLOTS/CHILDREN BEFORE CLEARING
  // ----------------------------------------
  // If the user provided content inside the tag, we want to preserve specific pieces
  // marked with slot="..." or data-slot="..." to avoid putting HTML in attributes.
  
  const slots = {};
  ['pretitle', 'title', 'subtitle'].forEach(slotName => {
    // Check standard ShadowDOM-like slot syntax
    let slotEl = element.querySelector(`[slot="${slotName}"]`);
    // Fallback to data-slot
    if (!slotEl) slotEl = element.querySelector(`[data-slot="${slotName}"]`);
    
    if (slotEl) {
      slots[slotName] = slotEl.cloneNode(true);
      // Remove slot attribute for cleaner DOM in result
      slots[slotName].removeAttribute('slot');
      slots[slotName].removeAttribute('data-slot');
    }
  });

  element.innerHTML = '';
  // full-height: the viewport-height rule lives in hero.css; the height
  // default would beat it, so it is only set otherwise. #779: height and a
  // user background are author values, so they travel as generated rules --
  // weight 3, since hero.css/card.css set both through compound selectors
  // that the inline style they replace always outranked.
  if (config.fullHeight) element.classList.add('x-cardhero--full-height');
  else setRule(element, 'hero-height', { minHeight: config.height }, { weight: 3 });
  element.classList.add(`x-card--xalign-${config.xalign}`);

  // Background: a user-provided image/gradient; the default rich theme
  // gradient + all colors live in hero.css (x-cardhero…), so there are NO
  // hardcoded colors here.
  if (config.background) {
    const isCssValue = config.background.includes('gradient') || config.background.startsWith('var(');
    setRule(element, 'hero-background', {
      backgroundImage: isCssValue ? config.background : `url(${config.background})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    }, { weight: 3 });

    // A broken image src previously failed completely silently: CSS
    // background-image has no failure signal of its own, hero.css's default
    // gradient is gated on `:not([background])` (so it never applies while
    // the attribute is still present, even if what it points to 404s), and
    // config.overlay's legibility scrim (built to sit over a real photo)
    // keeps rendering regardless -- the net result was a bare dark scrim
    // that read as an unintentional "glass" effect, with nothing telling
    // the author their image never loaded (confirmed live via cardhero.md's
    // own "Basic Hero" example, which pointed at a non-existent asset).
    // Preloading via a plain Image() gives the one load-failure signal CSS
    // background-image lacks; on failure, clear the broken background so
    // hero.css's themed gradient fallback can take over, and throw into the
    // global error handler -- same convention audio.js already uses for a
    // failed <audio> src -- so it surfaces in the app's own error viewer
    // instead of silently rendering broken. (#534)
    if (!isCssValue) {
      probeBackgroundImage(element, config.background, 'x-cardhero', 'background', () => {
        element.removeAttribute('background');
        // Only the image goes; the cover/center sizing stays, as it did when
        // this was a removeProperty('background-image') on the style attribute.
        setRule(element, 'hero-background', { backgroundSize: 'cover', backgroundPosition: 'center' }, { weight: 3 });
      });
    }
  }

  // Legibility scrim + content are styled by classes in hero.css.
  if (config.overlay) cardPart(element, 'div', 'x-card__overlay');

  const content = cardPart(null, 'div', 'x-card__hero-content');

  // Pretitle, title and subtitle each come from an authored slot when there
  // is one, otherwise from config. Config values may carry markup, so they go
  // in as innerHTML. All visual styling lives in hero.css.
  const placeHeroPart = (slotEl, slotClass, value, tag, className) => {
    if (slotEl) {
      slotEl.classList.add(slotClass);
      content.appendChild(slotEl);
    } else if (value) {
      cardHtmlPart(content, tag, className, value);
    }
  };

  // Pretitle (eyebrow).
  placeHeroPart(slots.pretitle, 'x-card__hero-pretitle', base.config.pretitle, 'div', 'x-card__hero-pretitle');

  // Title.
  // A page hero is usually the page's main heading, but a hero can also sit
  // inside a section where h1 would be wrong. Hardcoding h3 left the home
  // page with NO h1 at all and a backwards outline (h3 "Build stunning UIs"
  // followed by h2 "By the Numbers"), so the level is now the author's
  // choice with h3 as the unchanged default.
  // readAttr, not getAttribute (#1124). The schema declares headingLevel,
  // the HTML parser lowercases it to headinglevel, and a literal
  // getAttribute('heading-level') can never match that -- so all six
  // declared values silently rendered h3 and the six demo rows were
  // identical. readAttr tries every spelling. John: no attribute name
  // carries a dash; the only dash is the x- behavior prefix (#1125).
  // Now read once into config.headingLevel above.
  const level = String(config.headingLevel).replace(/^h/i, '');
  const titleTag = /^[1-6]$/.test(level) ? `h${level}` : 'h3';
  placeHeroPart(slots.title, 'x-card__hero-title', base.config.title, titleTag, 'x-card__title x-card__hero-title');

  // Subtitle.
  placeHeroPart(slots.subtitle, 'x-card__hero-subtitle', base.config.subtitle, 'div', 'x-card__subtitle x-card__hero-subtitle');

  // CTAs — hero-specific button classes (styled in hero.css, theme colors).
  if (base.config.cta || base.config.ctaSecondary) {
    const ctaGroup = cardPart(null, 'div', 'x-card__cta-group');

    // Attributes are set BEFORE appending — the MutationObserver-driven
    // auto-injection (wb-lazy.js) picks up new [x-tooltip] / [x-glass]
    // elements as they're inserted, so that is enough for the real behaviors
    // to attach on their own.
    const addCta = (kind, label, href, tooltip, glass) => {
      if (!label) return;
      const btn = cardPart(null, 'a', `x-hero-cta x-hero-cta--${kind}`);
      if (glass) btn.setAttribute('x-glass', '');
      btn.href = href || '#';
      btn.textContent = label;
      if (tooltip) btn.setAttribute('x-tooltip', tooltip);
      ctaGroup.appendChild(btn);
    };

    addCta('primary', base.config.cta, base.config.ctaHref, base.config.ctaTooltip, false);
    // #1236: the secondary CTA carries the hero's scene -- the wave runs
    // through it. That is x-glass, applied as the behavior, not a private
    // copy of the recipe in hero.css.
    addCta('secondary', base.config.ctaSecondary, base.config.ctaSecondaryHref, base.config.ctaSecondaryTooltip, true);
    content.appendChild(ctaGroup);
  }

  element.appendChild(content);

  // #678: show the author's own content -- see renderAuthoredContent().
  base.renderAuthoredContent();
  return base.cleanup;
}

/**
 * Card Profile Component
 * Custom Tag: <card-profile>
 */
export function cardprofile(element, options = {}) {
  const config = {
    avatar: readOption(element, options, 'avatar'),
    name: readOption(element, options, 'name'),
    role: readOption(element, options, 'role'),
    bio: readOption(element, options, 'bio'),
    cover: readOption(element, options, 'cover'),
    // schema-declared but previously never read -- size/align had zero
    // effect (#19: every declared attribute must produce a real effect).
    size: readOption(element, options, 'size') || 'md',
    align: readOption(element, options, 'align') || 'center',
    hoverText: readOption(element, options, 'hoverText', 'hoverText') || authoredAttr(element, 'hover-text'),
    ...options
  };

  // #283: hoverText/tooltip -> themed WB tooltip is handled once, generically,
  // by composeCard() (it reads config.hoverText/config.tooltip straight off this
  // same `config` object via the spread below) -- don't also set a native
  // `title` here, that would silently re-add the plain browser tooltip
  // composeCard just wired the themed one to replace.
  const base = composeCard(element, { ...config, behavior: 'cardprofile' });
  element.innerHTML = '';

  // Cover
  if (config.cover) {
    const coverFig = base.createFigure();
    coverFig.className = 'x-card__figure x-card__cover';
    // Only the cover photo is per-instance. The strip's height, positioning
    // and background sizing are `.x-card__cover` in card.css (Law 9, #370);
    // writing them inline here too pinned the strip at 36px while card.css
    // said 44px, and the inline value always won. #779: the photo itself now
    // travels as a generated rule, not the style attribute.
    setRule(coverFig, 'cover', { backgroundImage: `url(${config.cover})` }, { weight: 2 });

    // Role sits on the cover (the card's top half) instead of below the
    // avatar/name, so it reads immediately alongside the cover photo.
    //
    // Its placement is card.css's `.x-card__role--badge`: vertically centred
    // on the strip (top:50% / translateY(-50%)) and 0.75rem in from the right,
    // which clears the card's 8px corner radius. John asked for exactly that
    // ("center this vertically and put it on the right side") and card.css
    // records the change -- but this function kept writing the OLD placement
    // inline (top:8px; right:0.6rem) and never emitted the class, so the
    // badge sat above centre on every profile card.
    if (config.role) cardPart(coverFig, 'div', 'x-card__subtitle x-card__role x-card__role--badge', config.role);

    element.appendChild(coverFig);
  }

  // Profile content
  // A <div>, not <header> -- a literal <header> tag is auto-injected as the
  // SITE header behavior (tag-map.js maps native 'header' -> 'header'),
  // which forces display:flex/flex-direction:row via .x-header (header.css)
  // and made avatar/name/bio render side-by-side instead of stacked.
  // No overlap with the cover -- a fixed -40px pull-up was calibrated for the
  // old 100px cover; against the current thin cover strip it dragged the
  // avatar up into the cover image instead of sitting cleanly below it.
  // #779: padding and alignment are `.x-card__profile-content` and its
  // `--left` modifier in card.css, and the avatar's box is `.x-card__avatar`
  // plus `--sm/--md/--lg` -- the cssText copies of those rules are gone.
  const content = cardPart(null, 'div', 'x-card__profile-content');
  if (config.align === 'left') content.classList.add('x-card__profile-content--left');

  const avatarSize = ['sm', 'md', 'lg'].includes(config.size) ? config.size : 'md';

  if (config.avatar) cardImg(content, `x-card__avatar x-card__avatar--${avatarSize}`, config.avatar, config.name || 'Avatar');
  if (config.name) cardPart(content, 'h3', 'x-card__title x-card__name', config.name);
  if (config.role && !config.cover) cardPart(content, 'div', 'x-card__subtitle x-card__role', config.role);
  if (config.bio) cardPart(content, 'div', 'x-card__bio', config.bio);

  element.appendChild(content);

  // Footer from base config
  if (base.config.footer) {
    element.appendChild(base.createFooter());
  }

  // #678: show the author's own content -- see renderAuthoredContent().
  base.renderAuthoredContent();
  return base.cleanup;
}

/**
 * Card Pricing Component
 * Custom Tag: <card-pricing>
 */
export function cardpricing(element, options = {}) {
  const config = {
    plan: readOption(element, options, 'plan') || 'Basic Plan',
    price: readOption(element, options, 'price') || '$0',
    period: readOption(element, options, 'period') || '/month',
    // Declared in cardpricing.schema.json ("Short plan description"), read nowhere.
    description: options.description || readAttr(element, 'description'),
    features: options.features || readAttr(element, 'features')?.split(',') || element.getAttribute('features')?.split(',') || ['Feature 1', 'Feature 2'],
    cta: readOption(element, options, 'cta') || 'Get Started',
    ctaHref: readOption(element, options, 'ctaHref') || '#',
    // Same bare-boolean-attribute gap as cardexpandable/cardminimizable above.
    featured: readOnFlag(element, options, 'featured'),
    background: readOption(element, options, 'background'),
    ...options
  };

  const base = composeCard(element, { ...config, behavior: 'cardpricing' });
  // #779: text-align / container-type / padding:0 (and background-size/
  // position) are the `[x-cardpricing]` rule in card.css, and `featured` is its
  // `.x-pricing--featured` modifier -- every one of these used to be written
  // inline as well. Only the author's background image travels, as a
  // generated rule (weight 3: card.css sets the card surface through
  // compound selectors the inline style always outranked).
  element.innerHTML = '';

  if (config.featured) element.classList.add('x-pricing--featured');

  if (config.background) {
    setRule(element, 'pricing-background', { backgroundImage: `url(${config.background})` }, { weight: 3 });
  }

  // Header with Plan Name (centred by [x-cardpricing], #779)
  const header = base.createHeader();
  header.innerHTML = ''; // Clear default

  cardPart(header, 'h3', 'x-card__title x-card__plan', config.plan);
  // Plan description under the name; .x-card__description is styled in card.css.
  if (config.description) cardPart(header, 'p', 'x-card__description', config.description);
  element.appendChild(header);

  // Main content with Price and Features
  // #779: every element below is styled by its class in card.css
  // (.x-card__price-wrap, .x-card__amount with its cqi scaling,
  // .x-card__period, .x-card__features, .x-card__feature,
  // .x-card__feature-check) -- the cssText duplicates are gone.
  const main = base.createMain();

  // Price
  const priceWrap = cardPart(main, 'div', 'x-card__price-wrap');
  cardPart(priceWrap, 'span', 'x-card__amount', config.price);
  cardPart(priceWrap, 'span', 'x-card__period', config.period);

  // Features
  const featuresList = cardPart(main, 'ul', 'x-card__features');
  config.features.forEach(f => {
    cardHtmlPart(featuresList, 'li', 'x-card__feature', `<span class="x-card__feature-check">✓</span> ${f.trim()}`);
  });
  element.appendChild(main);

  // Footer with CTA
  // Transparent, borderless: `[x-cardpricing] .x-card__footer` in card.css (#779).
  const footer = base.createFooter();
  footer.innerHTML = ''; // Clear default

  // #561: #520 already removed this CTA's inline style.cssText (its
  // padding:0.875rem/14px duplicated -- and silently overrode -- card.css's
  // `.x-card__cta` rule, which #520 also bumped to the compliant 1rem/16px).
  // A later, unrelated commit (0005dbb0, same day) re-added it verbatim,
  // regressing #520 without touching card.css at all -- confirmed via
  // `git blame`, this line's inline cssText was reintroduced after #520's
  // removal. No inline style needed here: card.css's `.x-card__cta` already
  // covers every property this used to set.
  appendCtaLink(footer, 'x-card__cta', config.ctaHref, config.cta);

  element.appendChild(footer);

  return base.cleanup;
}

/**
 * Card Stats Component
 * Custom Tag: <card-stats>
 */
export function cardstats(element, options = {}) {
  const config = {
    value: readOption(element, options, 'value'),
    label: readOption(element, options, 'label'),
    icon: readOption(element, options, 'icon'),
    trend: readOption(element, options, 'trend'),
    trendValue: options.trendValue || authoredAttr(element, 'trend-value') || readAttr(element, 'trendValue'),
    // Declared in cardstats.schema.json ("Accent color"), read nowhere.
    color: options.color || readAttr(element, 'color'),
    ...options
  };

  // Defensive init: catch unexpected runtime errors to avoid killing the page
  try {
    const base = composeCard(element, { ...config, behavior: 'cardstats', hoverable: false });
    element.innerHTML = '';
    // Accent color: an author-supplied, per-instance value, so it travels as a
    // custom property (same convention as --card-image-aspect); what it
    // colors is card.css's .x-stats--accent rule. #779: set by a generated
    // rule, not written onto the style attribute.
    if (config.color) {
      element.classList.add('x-stats--accent');
      setRule(element, 'accent', { '--x-stats-accent': config.color });
    }
    // Layout, container-query sizing, and default padding all live in
    // card.css's `[x-cardstats]` rule now (Law 9, #370 -- was unconditional
    // inline styles here, which also silently beat x-card--compact/large's
    // own CSS regardless of specificity; x-card__header/__main below get
    // real classes so those variant rules can actually win).

  // Semantic: Icon belongs in header
  if (config.icon) {
    const header = document.createElement('header');
    // x-card__header is required even though [x-cardstats] .x-card__header
    // (card.css) overrides its padding/border/background back to zero:
    // card.css's fallback rule `.x-card:not(:has(.x-card__header)):not(
    // :has(.x-card__main)) { padding: 1rem }` outranks (0,3,0 vs 0,2,0
    // specificity) `[x-cardstats].x-card--compact/--large`'s own padding when
    // neither class is present, silently forcing 1rem on every variant
    // (confirmed live).
    // card.css targets the tag, not a class.

    const iconEl = document.createElement('span');
    iconEl.className = 'x-card__icon';
    // #946: the inline copy of .x-card__icon is gone. It duplicated the rule
    // exactly, which made the stylesheet unable to fix the centring bug.
    // #779: its 2rem size is the rule's own --x-card-icon-size default, so
    // nothing is written here at all.
    iconEl.textContent = config.icon;

    header.appendChild(iconEl);
    element.appendChild(header);
  }

  // Semantic: Main content
  const content = cardBody(null);

  if (config.value) {
    const valueEl = document.createElement('data');
    valueEl.value = config.value.replace(/[^0-9.-]/g, '') || config.value;
    // #779: value / label / trend are .x-card__stats-* in card.css; the
    // cssText copies of those rules are gone, and the trend colour is the
    // --up / --down / --neutral modifier card.css already defines.
    valueEl.className = 'x-card__stats-value';
    valueEl.textContent = config.value;
    content.appendChild(valueEl);
  }

  if (config.label) cardPart(content, 'div', 'x-card__stats-label', config.label);

  if (config.trend && config.trendValue) {
    const trendEl = document.createElement('div');
    const trendKind = config.trend === 'up' ? 'up' : config.trend === 'down' ? 'down' : 'neutral';
    trendEl.className = `x-card__stats-trend x-card__stats-trend--${trendKind}`;
    const trendIcon = config.trend === 'up' ? '↑' : config.trend === 'down' ? '↓' : '→';
    trendEl.textContent = `${trendIcon} ${config.trendValue}`;
    content.appendChild(trendEl);
  }

  element.appendChild(content);

  // Runtime/test hook: mark cardstats as hydrated so tests can wait on it
  try { element.setAttribute('x-hydrated', '1'); element.dispatchEvent(new CustomEvent('wb:cardstats:hydrated', { bubbles: true })); } catch (e) { /* best-effort */ }

  // #678: show the author's own content -- see renderAuthoredContent().
  base.renderAuthoredContent();
  return base.cleanup;
  } catch (err) {
    // Prevent unhandled errors from closing the test page; surface diagnostics instead.
    try { console.error('[cardstats] init error:', err && err.message ? err.message : err); element.setAttribute('x-error', (err && err.message) || 'init-failed'); element.classList.add('x-cardstats--error'); } catch (e) { /* best-effort */ }
    return () => {};
  }
}

/**
 * Card Testimonial Component
 * Custom Tag: <card-testimonial>
 */
export function cardtestimonial(element, options = {}) {
  const config = {
    quote: readOption(element, options, 'quote') || element.textContent,
    author: readOption(element, options, 'author'),
    role: readOption(element, options, 'role'),
    avatar: readOption(element, options, 'avatar'),
    rating: readOption(element, options, 'rating'),
    ...options
  };

  const base = composeCard(element, { ...config, behavior: 'cardtestimonial', hoverable: false });
  element.innerHTML = '';
  // #779: the 1rem padding is `[x-cardtestimonial]` in card.css, and every
  // part below is styled by its class there -- the cssText copies are gone.

  // Quote icon -- decorative only (#941).
  //
  // This wrote its styling INLINE while card.css already carried a
  // `.x-card__quote-icon` rule that was never applied to anything: the Law 9
  // migration (#370) moved the rule out but left the JS writing cssText, and
  // an inline style beats any stylesheet, so the class was dead and the CSS
  // could not be fixed without touching this line.
  //
  // aria-hidden because the glyph is ornament: the quote's meaning is in the
  // <blockquote> below, and a screen reader announcing a bare `"` is noise.
  const quoteIcon = cardPart(null, 'div', 'x-card__quote-icon');
  quoteIcon.setAttribute('aria-hidden', 'true');
  quoteIcon.textContent = '"';
  element.appendChild(quoteIcon);

  // Quote
  if (config.quote) cardPart(element, 'blockquote', 'x-card__quote', config.quote);

  // Rating
  if (config.rating) {
    cardPart(element, 'div', 'x-card__rating', '★'.repeat(parseInt(config.rating)) + '☆'.repeat(5 - parseInt(config.rating)));
  }

  // Author
  const authorWrap = cardPart(null, 'footer', 'x-card__footer');
  if (config.avatar) cardImg(authorWrap, 'x-card__avatar x-card__avatar--testimonial', config.avatar, config.author || '');

  const authorInfo = cardPart(null, 'div');
  if (config.author) cardPart(authorInfo, 'cite', 'x-card__author', config.author);
  if (config.role) cardPart(authorInfo, 'span', 'x-card__author-role', config.role);

  authorWrap.appendChild(authorInfo);
  element.appendChild(authorWrap);

  return base.cleanup;
}

/**
 * Card Product Component
 * Custom Tag: <card-product>
 */
export function cardproduct(element, options = {}) {
  const config = {
    image: readOption(element, options, 'image'),
    price: readOption(element, options, 'price'),
    originalPrice: options.originalPrice || authoredAttr(element, 'original-price') || readAttr(element, 'originalPrice'),
    badge: readOption(element, options, 'badge'),
    rating: readOption(element, options, 'rating'),
    reviews: readOption(element, options, 'reviews'),
    cta: readOption(element, options, 'cta') || 'Add to Cart',
    description: readOption(element, options, 'description'),
    ...options
  };

  // Map description to subtitle if subtitle is missing, so composeCard picks it up
  if (config.description && !config.subtitle) {
    config.subtitle = config.description;
  }

  const base = composeCard(element, { ...config, behavior: 'cardproduct' });
  element.innerHTML = '';

  // Product image
  if (config.image) {
    const figure = base.createFigure();
    
    const img = document.createElement('img');
    img.src = config.image;
    img.alt = base.config.title || 'Product';
    figure.appendChild(img);

    if (config.badge) {
      // cardproduct builds its own layout independently of
      // composeCard().buildStructure() (which owns the shared header-badge
      // logic elsewhere in this file) -- it never calls that path, so the
      // badge has to render here or not at all (#380).
      // card.css targets `article > header > span`.
      cardPart(figure, 'span', '', config.badge);
    }

    element.appendChild(figure);
  }

  // Product info
  const info = document.createElement('div');
  // #779: every part below is styled by its class in card.css (product-info,
  // product-title/-desc/-rating, price-wrap/-current/-original under
  // [x-cardproduct]); the cssText copies are gone.
  info.className = 'x-card__product-info';

  appendTitleAndSubtitle(info, base.config, 'h3', 'x-card__title x-card__product-title', 'div', 'x-card__subtitle x-card__product-desc');

  // Rating
  if (config.rating) {
    const ratingWrap = cardPart(null, 'div', 'x-card__product-rating');
    cardPart(ratingWrap, 'span', 'x-card__product-stars', '★'.repeat(Math.floor(parseFloat(config.rating))));
    cardPart(ratingWrap, 'span', 'x-card__product-rating-text', config.rating + (config.reviews ? ` (${config.reviews})` : ''));
    info.appendChild(ratingWrap);
  }

  // Price
  const priceWrap = cardPart(null, 'div', 'x-card__price-wrap');
  if (config.price) cardPart(priceWrap, 'span', 'x-card__price-current', config.price);
  if (config.originalPrice) cardPart(priceWrap, 'span', 'x-card__price-original', config.originalPrice);
  info.appendChild(priceWrap);

  // CTA button
  const ctaBtn = document.createElement('button');
  ctaBtn.type = 'button';
  ctaBtn.className = 'x-card__product-cta';
  // #561: same regression as the cardpricing() CTA above -- #520 removed
  // this inline style.cssText (padding:0.75rem/12px, below the §13 1rem/16px
  // minimum, and redundant with card.css's already-compliant `[x-cardproduct]
  // .x-card__product-cta` rule at padding:1rem), and commit 0005dbb0
  // (same day, unrelated fix) re-added it verbatim. No inline style needed:
  // the button sits inside the [x-cardproduct] host, so the CSS rule applies
  // on its own.
  ctaBtn.textContent = config.cta;

  const addToCart = () => {
    const detail = {
      title: base.config.title,
      price: config.price,
      id: element.id
    };

    element.dispatchEvent(new CustomEvent('wb:cardproduct:addtocart', {
      bubbles: true,
      detail
    }));

    return detail;
  };

  ctaBtn.onclick = (e) => {
    e.stopPropagation();
    addToCart();
  };

  element.wbCardProduct = { addToCart };

  info.appendChild(ctaBtn);

  element.appendChild(info);

  // #678: show the author's own content -- see renderAuthoredContent().
  base.renderAuthoredContent();
  return base.cleanup;
}

/**
 * Card Notification Component
 * Custom Tag: <div x-cardnotification>
 *
 * v3.0 MVVM:
 *   Schema  → owns DOM structure + CSS class-based variant colors
 *   Behavior → owns interactivity (dismiss, keyboard, aria, default icon text)
 *
 * Attribute: variant="info|success|warning|error" (NOT "type")
 */
export function cardnotification(element, options = {}) {
  // #940: the one card that does not go through composeCard().
  queueMicrotask(() => stampCardPartIds(element));
  const schemaProcessed = options.schemaProcessed || element.getAttribute('x-schema');

  // Read variant (primary) with fallback to type (legacy).
  // Check dataset (data-*) first to match the framework's attribute convention.
  const variant = readOption(element, options, 'variant')
    || readOption(element, options, 'type') || 'info';
  const title = readOption(element, options, 'title') || '';
  const message = readOption(element, options, 'message') || element.textContent || '';
  const dismissible = parseBoolean(
    options.dismissible ?? readAttr(element, 'dismissible') ?? element.getAttribute('dismissible')
  ) !== false;
  const customIcon = readOption(element, options, 'icon');

  // Default icon letters per variant
  const defaultIcons = { info: 'i', success: 's', warning: 'w', error: 'e' };
  const iconText = customIcon || defaultIcons[variant] || 'i';

  // Variant class: both paths below need it. Only the modifier: the base
  // `x-notification` restated [x-cardnotification], which notification.css
  // and card.css select directly (#969).
  const applyVariantClass = () => {
    if (variant !== 'default') {
      element.classList.add(`x-notification--${variant}`);
    }
  };

  // ── Accessibility (always) ──
  element.setAttribute('role', 'alert');

  // ── Dismiss handler (shared by both paths) ──
  const dismiss = () => {
    element.dispatchEvent(new CustomEvent('wb:cardnotification:dismiss', {
      bubbles: true,
      detail: { variant, title }
    }));
    element.remove();
  };

  const keyHandler = (e) => {
    if (e.key === 'Escape') dismiss();
  };

  // ═══════════════════════════════════════════════════════
  // PATH A: Schema already built the DOM — enhance only
  // ═══════════════════════════════════════════════════════
  if (schemaProcessed) {
    // Ensure variant class is present (schema should have added it,
    // but belt-and-suspenders for edge cases)
    applyVariantClass();

    // Fill in default icon text if schema left it empty
    const iconEl = element.querySelector('.x-notification__icon');
    if (iconEl && !iconEl.textContent.trim()) {
      iconEl.textContent = iconText;
    }

    // Wire up dismiss button
    const dismissBtn = element.querySelector('.x-notification__dismiss');
    if (dismissBtn) {
      dismissBtn.setAttribute('aria-label', 'Dismiss notification');
      dismissBtn.addEventListener('click', dismiss);
    }

    // Keyboard: Escape to dismiss
    if (dismissible) {
      element.setAttribute('tabindex', '0');
      element.addEventListener('keydown', keyHandler);
    }

    return () => {
      if (dismissBtn) dismissBtn.removeEventListener('click', dismiss);
      element.removeEventListener('keydown', keyHandler);
    };
  }

  // ═══════════════════════════════════════════════════════
  // PATH B: No schema — build DOM from scratch (standalone)
  // Uses CSS classes, no inline color styles
  // ═══════════════════════════════════════════════════════
  applyVariantClass();
  element.innerHTML = '';

  // Icon
  cardPart(element, 'span', 'x-notification__icon', iconText);

  // Content
  const content = cardBody(null, 'x-notification__content');
  if (title) cardPart(content, 'strong', 'x-notification__title', title);
  if (message) cardPart(content, 'div', 'x-notification__message', message);
  element.appendChild(content);

  // Dismiss button
  if (dismissible) {
    const closeBtn = document.createElement('button');
    closeBtn.className = 'x-notification__dismiss';
    closeBtn.textContent = '\u2715';
    closeBtn.setAttribute('aria-label', 'Dismiss notification');
    closeBtn.addEventListener('click', dismiss);
    element.appendChild(closeBtn);

    element.setAttribute('tabindex', '0');
    element.addEventListener('keydown', keyHandler);
  }

  return () => {
    element.removeEventListener('keydown', keyHandler);
  };
}

/**
 * Extension -> icon family (#1117).
 *
 * John: "Why do we need filetype, can't it come from the filename?" It can.
 * `fileType`'s only job was picking one of the seven emoji below, and
 * "quarterly-report.pdf" already says it is a PDF. Restating that in a second
 * attribute is duplicated truth, and duplicated truth drifts -- which is
 * exactly what #1114 caught: six of seven cardfile permutations declared
 * doc/image/video/audio/zip while rendering a filename ending `.pdf`.
 *
 * Deriving also matches the project's semantic-first rule: the name already
 * carries the meaning, so the framework reads it rather than making an author
 * write the same fact twice.
 *
 * Anything not listed here is a plain file, which is the honest answer -- a
 * `.xyz` we cannot classify gets the generic icon rather than a guess.
 */
const CARD_FILE_TYPE_BY_EXT = {
  pdf: 'pdf',
  doc: 'doc', docx: 'doc', rtf: 'doc', odt: 'doc', txt: 'doc', md: 'doc',
  png: 'image', jpg: 'image', jpeg: 'image', gif: 'image', svg: 'image', webp: 'image', avif: 'image',
  mp4: 'video', mov: 'video', webm: 'video', mkv: 'video',
  mp3: 'audio', wav: 'audio', m4a: 'audio', ogg: 'audio', flac: 'audio',
  zip: 'zip', tar: 'zip', gz: 'zip', '7z': 'zip', rar: 'zip'
};

/**
 * "architecture-diagram.png" -> "image". A name with no dot, or one whose
 * extension is not in the table, falls back to the generic file icon.
 */
const cardFileTypeFromName = (name) => {
  const parts = String(name || '').split('.');
  const ext = parts.length > 1 ? parts.pop().toLowerCase() : '';
  return CARD_FILE_TYPE_BY_EXT[ext] || 'file';
};

/**
 * Card File Component
 * Custom Tag: <card-file>
 */
export function cardfile(element, options = {}) {
  const filename = readOption(element, options, 'filename');
  const config = {
    filename,
    // #1119 -- John: "why are you keeping file-type? get rid of it. use only
    // filenames." #1117 derived the icon from the filename but kept
    // `fileType` as an override, which left two ways to say one thing -- and
    // the override is what let an example contradict itself (#1113: "WHY ARE
    // THERE TWO FILETYPES"). The filename decides, full stop: no fileType,
    // file-type or type attribute is read. A name the table cannot classify
    // gets the generic file icon, which is the honest answer.
    type: cardFileTypeFromName(filename),
    size: readOption(element, options, 'size'),
    date: readOption(element, options, 'date'),
    downloadable: readDefaultOnFlag(element, options, 'downloadable'),
    href: readOption(element, options, 'href'),
    ...options
  };

  const icons = { pdf: '📄', doc: '📝', image: '🖼️', video: '🎬', audio: '🎵', zip: '📦', file: '📁' };

  const base = composeCard(element, { ...config, behavior: 'cardfile', hoverable: false });
  element.innerHTML = '';
  // #779: the row layout is `[x-cardfile]`, and each part below is styled by
  // its class in card.css (file-icon, filename, file-meta, file-download) --
  // the cssText copies are gone. #773: the inline copies had also outranked
  // card.css, which is why variant="compact" could never be styled.

  // Icon
  cardPart(element, 'span', 'x-card__file-icon', icons[config.type] || icons.file);

  // Info
  const info = cardPart(null, 'div', 'x-card__file-info');
  if (config.filename) cardPart(info, 'h3', 'x-card__filename', config.filename);

  const meta = [];
  if (config.size) meta.push(config.size);
  if (config.date) meta.push(config.date);

  if (meta.length) cardPart(info, 'div', 'x-card__file-meta', meta.join(' • '));

  element.appendChild(info);

  // Download: the whole card is the click target. Requires an explicit href
  // -- filename is a DISPLAY label ("Sample filename"), not a URL; using it
  // as one made `a.href` resolve as a relative path against the current
  // page, so every card downloaded the current page itself (as .htm)
  // regardless of the declared file-type. No href means nothing real to
  // download, so the card isn't made clickable at all.
  const downloadUrl = config.href;
  if (config.downloadable && downloadUrl) {
    cardPart(element, 'span', 'x-card__file-download', '⬇️');

    // The whole card is the click target: .x-card-file--downloadable (#779).
    element.classList.add('x-card-file--downloadable');
    element.setAttribute('role', 'button');
    element.setAttribute('tabindex', '0');
    element.setAttribute('aria-label', `Download ${config.filename || 'file'}`);

    const triggerDownload = () => {
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = config.filename || '';
      a.rel = 'noopener';
      document.body.appendChild(a);
      a.click();
      a.remove();
    };
    const onClick = () => triggerDownload();
    const onKey = onActivateKey(() => triggerDownload());
    element.addEventListener('click', onClick);
    element.addEventListener('keydown', onKey);

    const baseCleanup = base.cleanup;
    return () => {
      element.removeEventListener('click', onClick);
      element.removeEventListener('keydown', onKey);
      if (typeof baseCleanup === 'function') { baseCleanup(); }
    };
  } else if (config.downloadable && element.hasAttribute('downloadable')) {
    // NO href AND `downloadable` WRITTEN OUT: a contradiction the author can
    // fix, so say so — in the console, where every other framework diagnostic
    // goes.
    //
    // This used to append visible text reading "No href given — nothing to
    // download.", reasoning that a silent dead end is worse. Two things were
    // wrong with that. It rendered author-facing prose at visitors, which
    // compliance/no-runtime-warning-leaks.spec.ts forbids and which caught it
    // on demos/site/cards.html. And it fired on the DEFAULT: `downloadable`
    // defaults to true, so all 15 cardfile demos on that page — each
    // demonstrating a file type or a variant, none claiming to download
    // anything — were told they were broken. A check that fires on correct
    // markup is one people learn to ignore (#1101).
    //
    // A card with no href is not a download card, and that is not an error.
    // Only the author who typed `downloadable` and left out the target has
    // stated an intention the markup cannot satisfy.
    console.warn(
      `[WB] x-cardfile "${config.filename || '(unnamed)'}" declares downloadable `
      + 'with no href — there is nothing to download. Add href, or drop downloadable.'
    );
  }

  // #678: show the author's own content -- see renderAuthoredContent().
  base.renderAuthoredContent();
  return base.cleanup;
}

/**
 * Card Link Component
 * Custom Tag: <card-link>
 */
export function cardlink(element, options = {}) {
  const config = {
    href: readOption(element, options, 'href') || '#',
    target: readOption(element, options, 'target') || '_self',
    icon: readOption(element, options, 'icon'),
    description: readOption(element, options, 'description') || '',
    badge: readOption(element, options, 'badge') || '',
    badgeVariant: options.badgeVariant || element.dataset.badgeVariant || authoredAttr(element, 'badge-variant') || 'glass', // glass, gradient
    ...options
  };

  const base = composeCard(element, { ...config, behavior: 'cardlink' });
  element.innerHTML = '';
  // #779: the host (cursor/position/1.25rem padding) and every part below
  // are the "Link card parts" rules in card.css, which #370 moved there from
  // this function's cssText -- the cssText stayed and always won. The parts
  // now carry the classes those rules were written for.

  // Header row with icon and external indicator
  const headerRow = cardPart(null, 'div', 'x-card__link-header');
  const titleGroup = cardPart(null, 'div', 'x-card__link-title-group');

  // Icon + Title row
  if (config.icon || base.config.title) {
    const titleRow = cardPart(null, 'div', 'x-card__link-title-row');

    // .x-card__link-icon sets the 1.25rem size .x-card__icon would
    // otherwise take from --x-card-icon-size.
    if (config.icon) cardPart(titleRow, 'span', 'x-card__icon x-card__link-icon', config.icon);
    if (base.config.title) cardPart(titleRow, 'h3', '', base.config.title);

    titleGroup.appendChild(titleRow);
  }

  // Description (subtitle or description)
  const desc = config.description || base.config.subtitle;
  if (desc) cardPart(titleGroup, 'div', 'x-card__description', desc);

  // Badge
  if (config.badge) {
    cardPart(titleGroup, 'span', `${config.badgeVariant === 'gradient' ? 'x-badge-gradient' : 'x-tag-glass'} x-card__link-badge`, config.badge);
  }

  headerRow.appendChild(titleGroup);

  // External indicator
  if (config.target === '_blank') cardPart(headerRow, 'span', 'x-card__link-external', '↗');

  element.appendChild(headerRow);

  // A REAL anchor, stretched to cover the whole card (position:relative set
  // above), instead of a JS window.open() on click. window.open() triggered
  // from a plain element's click handler isn't a native link tap — some
  // mobile browsers (confirmed: Samsung Internet) open it in a
  // desktop-viewport window context that ignores the target page's own
  // <meta viewport>, regardless of what that page declares. A real <a
  // target="_blank"> is standard link navigation the browser handles
  // exactly like any other tap — plus native accessibility (screen readers
  // announce it as a link; right-click "open in new tab" works; middle-click
  // opens in a background tab) that a div + role="link" only approximates.
  let stretchedLink = null;
  if (config.href && config.href !== '#') {
    stretchedLink = appendLinkOverlay(element, config.href, base.config.title || config.href, config.target);
  }

  // #678: show the author's own content -- see renderAuthoredContent().
  base.renderAuthoredContent();
  return () => {
    base.cleanup();
    if (stretchedLink) stretchedLink.remove();
  };
}

/**
 * Card Horizontal Component
 * Custom Tag: <card-horizontal>
 */
export function cardhorizontal(element, options = {}) {
  const config = {
    image: readOption(element, options, 'image'),
    // #602: the schema's property name (imagePosition) is camelCase, but an
    // author writing that same casing directly into HTML markup
    // (imagePosition="right") gets it silently parsed down to "imageposition"
    // (attribute names lowercase on parse -- no hyphen ever gets inserted),
    // which doesn't match a getAttribute('image-position') lookup either.
    // Confirmed live (John): even the "correctly" hyphenated docs example
    // this session shipped still got typo'd to "imageposition" moments
    // later -- dropping the hyphen from a camelCase mental model is the
    // natural, expected mistake here, not a one-off. Accept both forms
    // rather than expect every author to always get one exact spelling
    // right.
    imagePosition: readOption(element, options, 'imagePosition') || element.getAttribute('imageposition') || 'left',
    imageWidth: readOption(element, options, 'imageWidth') || element.getAttribute('imagewidth') || '40%',
    // Declared in cardhorizontal.schema.json but never read: the <img> always
    // took its alt from the title. The author's alt text wins; title stays
    // the fallback.
    imageAlt: options.imageAlt ?? readAttr(element, 'imageAlt', null),
    // #455: unlike card()/cardimage()/cardvideo(), this never fell back to
    // element.innerHTML -- only a `content="..."` ATTRIBUTE worked (via
    // composeCard's own generic getAttribute('content') fallback below). Any
    // instance authored with plain inner text as its body (every example in
    // the permutation-matrix's "variant variants" / "imagePosition variants"
    // sections, tests/fixtures/cards-permutation-matrix.html) silently lost
    // that text the instant `element.innerHTML = ''` ran a few lines down --
    // confirmed live, zero .x-card__horiz-body elements ever got created.
    content: options.content || readAttr(element, 'content') || element.innerHTML,
    ...options
  };

  const base = composeCard(element, { ...config, behavior: 'cardhorizontal' });
  element.innerHTML = '';
  // The Law 9 migration (#370) moved every one of these declarations into
  // card.css -- `[x-cardhorizontal]`, `.x-card-horizontal--reverse`, `.x-card__horizontal-figure`,
  // `.x-card__horizontal-image`, `.x-card__horizontal-content` -- but left the
  // inline writes here AND never emitted the classes those rules select. The
  // stylesheet was dead and the card unthemeable: an inline declaration beats
  // any rule. Now the classes carry the layout, and the one per-instance value
  // (image-width) arrives as the custom property card.css already reads.
  element.classList.toggle('x-card-horizontal--reverse', config.imagePosition === 'right');

  // Image
  if (config.image) {
    const figure = base.createFigure();
    figure.classList.add('x-card__horizontal-figure');
    // #779: a generated rule, not the style attribute; only a width other
    // than the 40% card.css already falls back to.
    if (config.imageWidth !== '40%') {
      setRule(figure, 'image-width', { '--horizontal-image-width': config.imageWidth });
    }

    const img = document.createElement('img');
    img.className = 'x-card__horizontal-image';
    img.src = config.image;
    img.alt = config.imageAlt ?? (base.config.title || '');
    // #604. John: "cardhorizontal is failing now on images. I want a runtime
    // error that says that, it should log and error" -- a broken `image`
    // src previously failed completely silently: the <img>'s native
    // 'error' event had no listener at all, so a 404/unreachable image
    // rendered as nothing but the browser's own broken-image icon, with
    // zero console/error-log signal (confirmed live:
    // docs/components/cards/cardhorizontal.md's own examples pointed at
    // nonexistent /images/feature.jpg and /images/wide.jpg). Same
    // fail-loud pattern already used elsewhere in THIS file for a broken
    // image-like resource -- cardhero's background-image probe just above
    // (search "x-cardhero: failed to load background") -- and the same
    // "throw so the global error handler (error-logger.js's
    // setupGlobalErrorHandler) catches and logs it" convention audio.js
    // uses for its own broken src (#433). A real <img> already shows its
    // own native broken-image icon on failure (unlike a CSS
    // background-image, which fails invisibly), so there's no DOM
    // fallback to apply here -- just the loud signal that was missing.
    img.addEventListener('error', () => {
      if (!document.contains(img)) return;
      // #1115: an unreachable third-party host is reported on the img, not thrown.
      if (reportIfThirdPartyMedia(img, config.image, 'x-cardhorizontal')) return;
      throw new Error(`x-cardhorizontal: failed to load image "${config.image}" -- the file is missing or unreachable.`);
    });
    figure.appendChild(img);
    element.appendChild(figure);
  }

  // Content
  const content = cardPart(null, 'div', 'x-card__horizontal-content');

  // Title and subtitle are named by tag, like every other card's header
  // (a8a7362e): card.css reaches them as `.x-card__horizontal-content > h3`
  // and `> p`. The subtitle was a bare <div>, which gave CSS nothing to
  // select it by; a <p> is what it is.
  appendTitleAndSubtitle(content, base.config, 'h3', '', 'p', '');
  if (base.config.content) cardHtmlPart(content, 'div', 'x-card__horiz-body', base.config.content);

  element.appendChild(content);

  return base.cleanup;
}

/**
 * Card Overlay Component
 * Custom Tag: <card-overlay>
 */
export function cardoverlay(element, options = {}) {
  const config = {
    image: readOption(element, options, 'image'),
    position: readOption(element, options, 'position') || 'bottom',
    gradient: readDefaultOnFlag(element, options, 'gradient'),
    height: readOption(element, options, 'height') || '300px',
    // Neither was ever read here before -- xalign only existed on cardhero
    // (a different function), and variant only got composeCard's generic
    // x-card--{variant} class with no matching CSS for dark/light/blur.
    xalign: readOption(element, options, 'xalign') || 'left',
    variant: readOption(element, options, 'variant') || 'default',
    ...options
  };

  const base = composeCard(element, { ...config, behavior: 'cardoverlay', hoverable: false });
  element.classList.add(`x-card--overlay-${config.position}`);
  element.innerHTML = '';
  
  // #779: the card's box (position, cover sizing, the default gradient, the
  // row direction and the per-position alignment) is `[x-cardoverlay]`
  // and its `--overlay-top/-center` modifiers in card.css, which #370 wrote
  // for exactly these declarations -- the inline copies that kept beating
  // them are gone. What varies per card travels as generated rules: the
  // height (as the --overlay-height that rule reads) and the image.
  //
  // #635 still holds: the shorthand `background` composeCard used to write
  // reset background-repeat to `repeat`, and a sub-pixel gap at a cover-
  // scaled edge then tiled a sliver of the image into it. No-repeat is part
  // of the overlay rule now (card.css, #779 section).
  if (config.height !== '300px') setRule(element, 'overlay-height', { '--overlay-height': config.height });
  if (config.image) {
    setRule(element, 'overlay-image', { backgroundImage: `url(${config.image})` }, { weight: 3 });
  }

  // John: "Card Overlay have no images" -- a broken `image` src rendered as
  // nothing (CSS background-image has no native failure signal the way an
  // <img> does), same class of bug already fixed for cardhero's `background`
  // (#534) and cardhorizontal's `image` (#604). Preload via a probe Image()
  // to get the one load-failure signal CSS background-image lacks; on
  // failure, fall back to the same gradient a missing image already uses,
  // and throw so the global error handler (error-logger.js) catches and
  // logs it -- same convention as audio.js/cardhero/cardhorizontal.
  if (config.image) {
    // Dropping the image lets card.css's default gradient show (#779).
    probeBackgroundImage(element, config.image, 'x-cardoverlay', 'image', () => setRule(element, 'overlay-image', null));
  }

  // Content. Its box, the gradient (`--gradient-top/-bottom`) and the
  // variant tints (`--dark/-light/-blur`, declared after the gradients so a
  // tint wins, as the old write order did) are card.css classes (#779).
  const content = cardPart(null, 'div', 'x-card__overlay-content');
  if (config.gradient) {
    content.classList.add(`x-card__overlay-content--gradient-${config.position === 'top' ? 'top' : 'bottom'}`);
  }
  if (['dark', 'light', 'blur'].includes(config.variant)) {
    content.classList.add(`x-card__overlay-content--${config.variant}`);
  }
  // The author's xalign: the --overlay-xalign card.css reads (left default).
  if (config.xalign !== 'left') setRule(content, 'xalign', { '--overlay-xalign': config.xalign });

  appendTitleAndSubtitle(content, base.config, 'h3', 'x-card__title x-card__overlay-title', 'div', 'x-card__subtitle x-card__overlay-subtitle');

  element.appendChild(content);

  // #678: show the author's own content -- see renderAuthoredContent().
  base.renderAuthoredContent();
  return base.cleanup;
}

/**
 * Card Expandable Component
 * Custom Tag: <card-expandable>
 */
export function cardexpandable(element, options = {}) {
  // Capture existing content as fallback before clearing
  const rawContent = element.innerHTML.trim();

  const config = {
    // Bare `expanded` (no value) is the codebase's boolean-attribute convention
    // (see clickable/elevated above) -- this only checked expanded="true",
    // so <div x-cardexpandable expanded> (what every demo actually writes) was
    // silently ignored and always rendered collapsed.
    expanded: readOnFlag(element, options, 'expanded'),
    maxHeight: readOption(element, options, 'maxHeight') || '100px',
    // #435: a pixel maxHeight truncates text mid-line, which looks broken
    // for arbitrary content -- `lines` clamps to exactly N full lines via
    // CSS line-clamp instead. An alternative to maxHeight, not a
    // replacement: maxHeight still applies as-is for non-text/mixed content
    // where line-clamp doesn't make sense (images, nested cards, ...). When
    // both are set, `lines` wins for the collapsed state.
    lines: readOption(element, options, 'lines') || null,
    ...options
  };

  const base = composeCard(element, { ...config, behavior: 'cardexpandable' });
  element.innerHTML = '';

  // Build header
  if (base.config.title || base.config.subtitle) {
    element.appendChild(base.createHeader());
  }

  // Applies/removes a line-clamp on `el` -- shared by initial render and
  // toggle(). #779: the clamp is `.x-card__expandable-content--clamped` in
  // card.css, reading the author's line count from --x-card-expandable-lines
  // (a generated rule); the released state is `--unclamped`.
  const applyLineClamp = (el, lineCount) => {
    el.classList.toggle('x-card__expandable-content--clamped', !!lineCount);
    el.classList.toggle('x-card__expandable-content--unclamped', !lineCount);
    setRule(el, 'lines', lineCount ? { '--x-card-expandable-lines': String(lineCount) } : null);
  };
  // The collapsed/expanded height travels the same way: a generated rule
  // setting the --x-card-expandable-max-height card.css consumes (#779).
  const applyMaxHeight = (el, value) => setRule(el, 'max-height', { '--x-card-expandable-max-height': value });

  // Content
  const contentWrap = cardBody(null, 'x-card__expandable-content');
  // #943: padding / overflow / transition are ALL already in card.css's
  // `.x-card__expandable-content` -- the audit classified them COVERED
  // (removing the inline declaration changed nothing on the live element).
  // Only max-height varies per instance, so it travels as a custom property
  // and a rule consumes it, which is the sanctioned shape for a dynamic value.
  if (config.lines) {
    applyLineClamp(contentWrap, config.expanded ? null : config.lines);
  } else {
    applyMaxHeight(contentWrap, config.expanded ? '1000px' : config.maxHeight);
  }
  contentWrap.innerHTML = base.config.content || rawContent || CARD_CONTENT_PLACEHOLDER;
  // Generate ID for aria-controls
  const contentId = 'expandable-content-' + Math.random().toString(36).substr(2, 9);
  contentWrap.id = contentId;
  element.appendChild(contentWrap);

  // Expand button
  const btnWrap = document.createElement('footer');
  btnWrap.className = 'x-card__footer';
  // (styling: .x-card__footer in card.css -- #943)

  const btn = document.createElement('button');
  btn.className = 'x-card__expand-btn';
  // (styling: [x-cardexpandable] .x-card__expand-btn in card.css -- #943)
  btn.setAttribute('aria-expanded', config.expanded);
  btn.setAttribute('aria-controls', contentId);
  
  const icon = cardPart(null, 'span', 'x-card__expand-icon');
  icon.textContent = '▼';
  // display / transition live in .x-card__expand-icon. Rotation is STATE, so
  // it is a modifier class rather than an inline transform (#943).
  if (config.expanded) icon.classList.add('x-card__expand-icon--expanded');
  btn.appendChild(icon);

  const text = cardPart(btn, 'span', 'x-card__expand-text', config.expanded ? 'Show Less' : 'Show More');

  let isExpanded = config.expanded;
  if (isExpanded) element.classList.add('x-card--expanded');
  
  const toggle = () => {
    isExpanded = !isExpanded;
    if (config.lines) {
      applyLineClamp(contentWrap, isExpanded ? null : config.lines);
    } else {
      applyMaxHeight(contentWrap, isExpanded ? '1000px' : config.maxHeight);
    }
    icon.classList.toggle('x-card__expand-icon--expanded', isExpanded);
    text.textContent = isExpanded ? 'Show Less' : 'Show More';
    element.classList.toggle('x-card--expanded', isExpanded);
    btn.setAttribute('aria-expanded', isExpanded);
    element.dispatchEvent(new CustomEvent('wb:cardexpandable:toggle', {
      bubbles: true,
      detail: { expanded: isExpanded }
    }));
    // A collapse that leaves the height unchanged fires no ResizeObserver
    // callback, so re-measure once the new state has laid out (#1598).
    requestAnimationFrame(updateNothingToExpand);
  };

  btn.onclick = toggle;

  // Keyboard support
  btn.onkeydown = onActivateKey(() => toggle());

  btnWrap.appendChild(btn);
  element.appendChild(btnWrap);

  // #1598: a toggle with nothing behind it. When the collapsed content already
  // fits (short text, or a card wide enough that it wraps to fewer lines than
  // the clamp), Show More flipped its label and revealed nothing -- every
  // Behaviors page example did exactly that. Collapsed and fitting, the card
  // is marked x-card--nothing-to-expand and card.css hides the toggle. A
  // ResizeObserver re-measures when the width or content changes, so the
  // toggle comes back once there is something to reveal. Expanded, the button
  // stays: it is how the card collapses again.
  const updateNothingToExpand = () => {
    if (isExpanded) return;
    element.classList.toggle('x-card--nothing-to-expand', contentWrap.scrollHeight <= contentWrap.clientHeight + 1);
  };
  const overflowObserver = typeof ResizeObserver === 'function' ? new ResizeObserver(updateNothingToExpand) : null;
  overflowObserver?.observe(contentWrap);
  updateNothingToExpand();

  // Footer (extra footer if needed, though we just added one)
  if (base.config.footer) {
    const extraFooter = base.createFooter();
    // Merge content if possible or append
    element.appendChild(extraFooter);
  }

  // API
  element.wbCardExpandable = {
    show: () => { if (!isExpanded) toggle(); },
    hide: () => { if (isExpanded) toggle(); },
    toggle: toggle,
    get expanded() { return isExpanded; }
  };

  return () => {
    overflowObserver?.disconnect();
    if (typeof base.cleanup === 'function') base.cleanup();
  };
}

/**
 * Card Minimizable Component
 * Custom Tag: <card-minimizable>
 */
export function cardminimizable(element, options = {}) {
  // Capture existing content as fallback before clearing
  const rawContent = element.innerHTML.trim();

  const config = {
    // Same bare-boolean-attribute gap as cardexpandable's `expanded` had --
    // <div x-cardminimizable minimized> (the only form any demo writes) was
    // never detected without this hasAttribute check.
    minimized: readOnFlag(element, options, 'minimized'),
    ...options
  };

  const base = composeCard(element, { ...config, behavior: 'cardminimizable' });
  element.innerHTML = '';

  // Header with minimize button. card.css targets the tag, not a class; the
  // header's row layout, the title/subtitle and the button are the
  // minimizable-card rules there (#779 -- all of it was cssText here).
  const header = document.createElement('header');

  const titleWrap = cardPart(null, 'div', 'x-card__title-wrap');
  appendTitleAndSubtitle(titleWrap, base.config, 'h3', '', 'div', '');
  header.appendChild(titleWrap);

  // Minimize button
  const minBtn = cardPart(header, 'button', 'x-card__minimize-btn', config.minimized ? '+' : '−');

  element.appendChild(header);

  // Content
  // Box and the collapsed state (`.x-card--minimized ...`) are card.css.
  const content = cardBody(null, 'x-card__minimizable-content');
  // Same placeholder as cardexpandable's.
  content.innerHTML = base.config.content || rawContent || CARD_CONTENT_PLACEHOLDER;
  element.appendChild(content);

  // Toggle
  let isMinimized = config.minimized;
  if (isMinimized) element.classList.add('x-card--minimized');

  const toggle = () => {
    isMinimized = !isMinimized;
    // The collapsed max-height/padding/opacity follow the x-card--minimized
    // class toggled below. Once toggled, an open body is capped at 1000px so
    // the height transition has an end value to animate to (#779: this was
    // three inline writes).
    content.classList.add('x-card__minimizable-content--toggled');
    minBtn.textContent = isMinimized ? '+' : '−';
    minBtn.setAttribute('aria-expanded', !isMinimized);
    minBtn.setAttribute('aria-label', isMinimized ? 'Expand' : 'Minimize');
    element.classList.toggle('x-card--minimized', isMinimized);
    
    // Footer visibility follows `.x-card--minimized .x-card__footer` (#779).

    element.dispatchEvent(new CustomEvent('wb:cardminimizable:toggle', { 
      bubbles: true, 
      detail: { minimized: isMinimized } 
    }));
  };

  minBtn.setAttribute('aria-expanded', !config.minimized);
  minBtn.setAttribute('aria-label', config.minimized ? 'Expand' : 'Minimize');
  minBtn.onclick = toggle;

  // Keyboard support
  minBtn.onkeydown = onActivateKey(() => toggle());

  // Footer
  if (base.config.footer) {
    const minimizableFooterEl = base.createFooter();
    element.appendChild(minimizableFooterEl);
  }

  // API
  element.wbCardMinimizable = {
    toggle,
    hide: () => { if (!isMinimized) toggle(); },
    show: () => { if (isMinimized) toggle(); },
    get minimized() { return isMinimized; }
  };

  return base.cleanup;
}

/**
 * Card Draggable Component
 * Custom Tag: <card-draggable>
 */
export function carddraggable(element, options = {}) {
  // Same root cause as #455 (cardhorizontal): composeCard's own generic
  // `content` resolution (card.js line ~155) only reads a `content="..."`
  // ATTRIBUTE, never element.innerHTML -- so a demo relying on plain inner
  // text as the body (every carddraggable example in cards.html: "This is
  // example draggable card content.") silently lost it the instant
  // `element.innerHTML = ''` ran a few lines down. Captured here, before
  // that clear, same fix pattern as cardhorizontal.
  const rawContent = element.innerHTML.trim();

  const config = {
    constrain: readOption(element, options, 'constrain') || 'none',
    axis: readOption(element, options, 'axis') || 'both',
    snapToGrid: parseInt(readOption(element, options, 'snapToGrid') || 0),
    content: options.content || readAttr(element, 'content') || rawContent,
    ...options
  };

  const base = composeCard(element, { ...config, behavior: 'carddraggable', hoverable: false });
  
  element.innerHTML = '';
  // Only set position if not already positioned (absolute/fixed) -- a class
  // (card.css), not element.style (#779).
  const computed = window.getComputedStyle(element);
  if (computed.position === 'static') {
    element.classList.add('x-card--draggable-positioned');
  }

  // Header with drag handle. Its look, the grip icon and the title are the
  // `.x-card__drag-handle*` / `.x-card__drag-title` rules card.css has had
  // since #370; the cssText that shadowed them is gone (#779).
  const headerEl = document.createElement('header');
  headerEl.className = 'x-card__header x-card__drag-handle';
  headerEl.setAttribute('aria-label', 'Drag to move card');
  headerEl.setAttribute('role', 'button');

  cardPart(headerEl, 'span', 'x-card__drag-handle-icon', '⋮⋮');
  if (base.config.title) cardPart(headerEl, 'h3', 'x-card__drag-title', base.config.title);

  element.appendChild(headerEl);

  // Content
  const contentArea = base.createMain();
  element.appendChild(contentArea);

  // Footer
  if (base.config.footer) {
    element.appendChild(base.createFooter());
  }

  // Drag behavior
  let isDragging = false;
  let startX, startY, initialLeft, initialTop;

  // The applied left/top. #779: the position is a generated stylesheet rule
  // now, not element.style, so it is tracked here rather than read back off
  // the style attribute; place() is the one writer.
  let posX = 0;
  let posY = 0;
  const getCurrentLeft = () => posX;
  const getCurrentTop = () => posY;
  const place = (x, y) => {
    posX = x;
    posY = y;
    setRule(element, 'drag-position', { left: x + 'px', top: y + 'px' });
  };

  const onMouseDown = (e) => {
    const point = dragStartPoint(e);
    if (!point) return;
    isDragging = true;
    ({ x: startX, y: startY } = point);
// Read the current CSS left/top values, NOT offsetLeft/offsetTop
    // offsetLeft includes the element's normal flow position which causes
    // a massive jump when applied back as left/top on a relative element
    initialLeft = getCurrentLeft();
    initialTop = getCurrentTop();
    
    // Cursor, opacity and z-index while dragging: `.x-card--dragging` (#779).
    element.classList.add('x-card--dragging');
    
    element.dispatchEvent(new CustomEvent('wb:carddraggable:dragstart', {
      bubbles: true,
      detail: { x: initialLeft, y: initialTop }
    }));
  };

  headerEl.addEventListener('mousedown', onMouseDown);

  // Touch support
  const onTouchStart = (e) => {
    const touch = e.touches[0];
    onMouseDown({ clientX: touch.clientX, clientY: touch.clientY, button: 0, preventDefault: () => e.preventDefault() });
  };
  headerEl.addEventListener('touchstart', onTouchStart, { passive: false });

  const onMouseMove = (e) => {
    if (!isDragging) return;
    
    let deltaX = e.clientX - startX;
    let deltaY = e.clientY - startY;
    
    // Axis constraint
    if (config.axis === 'x') deltaY = 0;
    if (config.axis === 'y') deltaX = 0;
    
    let newX = initialLeft + deltaX;
    let newY = initialTop + deltaY;
    
    // Snap to grid
    if (config.snapToGrid > 0) {
      newX = Math.round(newX / config.snapToGrid) * config.snapToGrid;
      newY = Math.round(newY / config.snapToGrid) * config.snapToGrid;
    }
    
    // Parent constraint
    if (config.constrain === 'parent' && element.parentElement) {
      const parentRect = element.parentElement.getBoundingClientRect();
      const elemRect = element.getBoundingClientRect();
      // Calculate bounds relative to current CSS left/top
      const currentLeft = getCurrentLeft();
      const currentTop = getCurrentTop();
      const minX = currentLeft - (elemRect.left - parentRect.left);
      const minY = currentTop - (elemRect.top - parentRect.top);
      const maxX = currentLeft + (parentRect.right - elemRect.right);
      const maxY = currentTop + (parentRect.bottom - elemRect.bottom);
      
      newX = Math.max(minX, Math.min(maxX, newX));
      newY = Math.max(minY, Math.min(maxY, newY));
    }
    
    // Viewport constraint
    if (config.constrain === 'viewport') {
      const vpElemRect = element.getBoundingClientRect();
      const vpCurrentLeft = getCurrentLeft();
      const vpCurrentTop = getCurrentTop();
      const vpMinX = vpCurrentLeft - vpElemRect.left;
      const vpMinY = vpCurrentTop - vpElemRect.top;
      const vpMaxX = vpCurrentLeft + (window.innerWidth - vpElemRect.right);
      const vpMaxY = vpCurrentTop + (window.innerHeight - vpElemRect.bottom);

      newX = Math.max(vpMinX, Math.min(vpMaxX, newX));
      newY = Math.max(vpMinY, Math.min(vpMaxY, newY));
    }
    
    place(newX, newY);

    element.dispatchEvent(new CustomEvent('wb:carddraggable:drag', {
      bubbles: true,
      detail: { 
        x: newX, 
        y: newY,
        deltaX: deltaX,
        deltaY: deltaY
      }
    }));
  };

  const onTouchMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const moveTouch = e.touches[0];
    onMouseMove({ clientX: moveTouch.clientX, clientY: moveTouch.clientY });
  };

  const onMouseUp = () => {
    if (isDragging) {
      isDragging = false;
      element.classList.remove('x-card--dragging');
      
      element.dispatchEvent(new CustomEvent('wb:carddraggable:dragend', {
        bubbles: true,
        detail: { 
          x: getCurrentLeft(), 
          y: getCurrentTop() 
        }
      }));
    }
  };

  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseup', onMouseUp);
  document.addEventListener('touchmove', onTouchMove, { passive: false });
  document.addEventListener('touchend', onMouseUp);

  // API
  element.wbCardDraggable = {
    setPosition: (x, y) => place(x, y),
    getPosition: () => ({ x: posX, y: posY }),
    reset: () => {
      posX = 0;
      posY = 0;
      setRule(element, 'drag-position', null);
    }
  };

  // Cleanup
  const originalCleanup = base.cleanup;
  return () => {
    originalCleanup();
    clearRules(element);
    element.classList.remove('x-card--draggable-positioned');
    headerEl.removeEventListener('mousedown', onMouseDown);
    headerEl.removeEventListener('touchstart', onTouchStart);
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
    document.removeEventListener('touchmove', onTouchMove);
    document.removeEventListener('touchend', onMouseUp);
  };
}

// ============================================
// PORTFOLIO CARD - FULL-FEATURED
// Custom Tag: <div x-cardportfolio>
// ============================================
export function cardportfolio(element, options = {}) {
  // Parse JSON attributes safely
  const parseJSON = (val) => {
    if (!val) return null;
    try { return JSON.parse(val); } catch { return null; }
  };

  const config = {
    // Identity
    name: readOption(element, options, 'name'),
    title: readOption(element, options, 'title'),
    company: readOption(element, options, 'company'),
    location: readOption(element, options, 'location'),
    tagline: readOption(element, options, 'tagline'),
    availability: readOption(element, options, 'availability') || 'available',
    
    // Media
    avatar: readOption(element, options, 'avatar'),
    cover: readOption(element, options, 'cover'),
    bio: readOption(element, options, 'bio'),
    
    // Contact
    email: readOption(element, options, 'email'),
    phone: readOption(element, options, 'phone'),
    website: readOption(element, options, 'website'),
    
    // Social
    linkedin: readOption(element, options, 'linkedin'),
    twitter: readOption(element, options, 'twitter'),
    github: readOption(element, options, 'github'),
    dribbble: readOption(element, options, 'dribbble'),
    
    // Skills & Experience
    skills: readOption(element, options, 'skills'),
    skillLevels: parseJSON(readOption(element, options, 'skillLevels')),
    experience: parseJSON(readOption(element, options, 'experience')),
    education: parseJSON(readOption(element, options, 'education')),
    projects: parseJSON(readOption(element, options, 'projects')),
    certifications: readOption(element, options, 'certifications'),
    languages: readOption(element, options, 'languages'),
    stats: parseJSON(readOption(element, options, 'stats')),
    
    // CTA
    cta: readOption(element, options, 'cta'),
    ctaHref: readOption(element, options, 'ctaHref'),
    
    // Variant
    variant: readOption(element, options, 'variant') || 'default',
    size: readOption(element, options, 'size') || 'auto',
    ...options
  };

  const base = composeCard(element, { ...config, behavior: 'cardportfolio', hoverable: false });
  if (config.variant !== 'default') {
    element.classList.add(`x-portfolio--${config.variant}`);
  }
  element.innerHTML = '';
  
  // Width is card.css's job, not an inline write. This used to set
  // `max-width: 400px` (or 800px for variant="full") on the element, and an
  // inline declaration outranks every stylesheet rule -- so size="sm"/"lg"/...
  // (composeCard's `.x-card--{size}` classes) could never change the width of
  // a default-variant card. The defaults now live in card.css's
  // `[x-cardportfolio]` / `.x-portfolio--full` rules, which the size classes beat.

  // Availability. The colour of each status is a THEME value (card.css maps
  // `x-portfolio__availability--{status}` onto --success-color etc.), not a
  // hex baked in here -- the dot used to carry `style="background:#22c55e"`,
  // which no theme could restyle. The label is shown as visible text next to
  // the name, not only as a hover title on a 24px dot: "busy" vs
  // "not-available" is information, and colour alone does not carry it.
  const availabilityConfig = {
    'available': { label: 'Available for work' },
    'busy': { label: 'Currently busy' },
    'not-available': { label: 'Not available' },
    'open-to-opportunities': { label: 'Open to opportunities' }
  };
  const AVAILABILITY_STATES = Object.keys(availabilityConfig);
  const hasAvailability = Boolean(config.availability && availabilityConfig[config.availability]);

  // ==================== COVER ====================
  // A banner strip ABOVE the identity block -- never under it. It used to be
  // an EMPTY <figure> painted with an inline background-image, and the header
  // below it carried `margin-top:-60px` to pull the avatar up over it. Three
  // things went wrong at once on the behaviors page:
  //   - the figure is `position: relative` (card.css `article figure`), the
  //     header is not, so the cover PAINTED OVER the header: the avatar was
  //     invisible and the name/title sat half under the image;
  //   - an empty <figure> is auto-injected with the figure behavior, and
  //     teach-by-example fills an element the author left empty -- so the
  //     cover grew caption="this is the caption" and printed it on the image;
  //   - John: "the image hides the rest of the card".
  // A real <img> makes the figure a real figure (and non-empty, so nothing
  // "teaches" into it), lightbox="false" is the figure behavior's own opt-out
  // (a decorative banner is not something to zoom), and sizing lives in
  // card.css so compact/horizontal/full can reshape it.
  if (config.cover) {
    const coverFigure = document.createElement('figure');
    coverFigure.className = 'x-portfolio__cover';
    coverFigure.setAttribute('lightbox', 'false');
    // Decorative (empty alt): the card's name/title already say who this is.
    cardImg(coverFigure, 'x-portfolio__cover-img', config.cover, '');
    element.appendChild(coverFigure);
  }

  // ==================== HEADER ====================
  const header = document.createElement('header');
  header.className = 'x-portfolio__header';
  // No inline styles. The header also picks up the generic card header rule
  // (`article > header`: grid, tinted background, border-bottom) and, via
  // tag-map.js, the page navbar's `.x-header` (flex, 60px height). card.css's
  // `[x-cardportfolio] > .x-portfolio__header` (0,2,0) outranks both, so the
  // resets that used to be forced inline here live there -- where the
  // compact/horizontal/full/size rules can still override them.

  // Avatar (real image, OR a fallback initials placeholder), built whenever
  // there's an avatar image OR an availability status to show, so the status
  // dot always has something to attach to (availability defaults to
  // 'available' -- cardportfolio.schema.json).
  //
  // A <div>, not a <figure>: card.css styles `article figure > span` as an
  // absolutely-positioned overlay BADGE (the cardimage "New" pill). With a
  // <figure> wrap, the initials <span> and the status-dot <span> both became
  // position:absolute badges, the wrap collapsed to 0x0, and the avatar
  // vanished behind the cover. It holds an image and a status dot -- a
  // layout wrapper, not a self-contained figure.
  if (config.avatar || hasAvailability) {
    const avatarWrap = cardPart(null, 'div', 'x-portfolio__avatar-wrap');

    if (config.avatar) {
      cardImg(avatarWrap, 'x-portfolio__avatar', config.avatar, config.name || 'Avatar');
    } else {
      // No avatar image supplied -- render initials in a themed circle
      // (card.css: .x-portfolio__avatar-placeholder) so the availability dot
      // still has a visible anchor.
      const placeholder = document.createElement('span');
      placeholder.className = 'x-portfolio__avatar x-portfolio__avatar-placeholder';
      const initials = (config.name || '')
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map(word => word[0].toUpperCase())
        .join('') || '?';
      placeholder.textContent = initials;
      placeholder.setAttribute('aria-hidden', 'true');
      avatarWrap.appendChild(placeholder);
    }

    if (hasAvailability) {
      const availDot = document.createElement('span');
      availDot.className = `x-portfolio__availability x-portfolio__availability--${config.availability}`;
      availDot.title = availabilityConfig[config.availability].label;
      // The visible label below says the same thing in words.
      availDot.setAttribute('aria-hidden', 'true');
      avatarWrap.appendChild(availDot);
    }

    header.appendChild(avatarWrap);
  }

  // Name
  // margin/font-size/color/white-space/overflow/max-width live in card.css's
  // `.x-portfolio__name` base rule -- see the avatarWrap comment above; lets
  // compact/horizontal/full/size-scaling CSS resize or rewrap the name
  // without !important.
  if (config.name) cardPart(header, 'h2', 'x-portfolio__name', config.name);

  // Title & Company
  if (config.title) {
    // Styled by card.css `.x-portfolio__title`. The inline
    // `color: var(--primary)` it replaced measured rgb(38,38,217) on the
    // card's dark surface -- the same unreadable accent-on-dark #887 fixed
    // for card titles.
    cardPart(header, 'div', 'x-portfolio__title', config.title + (config.company ? ` at ${config.company}` : ''));
  } else if (config.company) {
    cardPart(header, 'div', 'x-portfolio__company', config.company);
  }

  // Location
  if (config.location) cardPart(header, 'div', 'x-portfolio__location', `📍 ${config.location}`);

  // Availability, in words. Same modifier class as the dot, so one theme
  // rule colours both.
  if (hasAvailability) {
    cardPart(header, 'div', `x-portfolio__status x-portfolio__status--${config.availability}`, availabilityConfig[config.availability].label);
  }

  // Tagline
  if (config.tagline) cardPart(header, 'div', 'x-portfolio__tagline', `"${config.tagline}"`);

  element.appendChild(header);

  // ==================== MAIN CONTENT ====================
  const main = cardBody(null, 'x-portfolio__main');
  // padding now lives in card.css's `.x-portfolio__main` base rule -- see
  // the avatarWrap comment above; lets the compact variant's own padding
  // override win without !important.

  // Every section below is a <section class="x-portfolio__{name}">, most
  // with an <h3 class="x-portfolio__section-title"> heading. Each is
  // appended to main by its caller once it is filled.
  const portfolioSection = (name, heading) => {
    const section = cardPart(null, 'section', `x-portfolio__${name}`);
    if (heading) cardPart(section, 'h3', 'x-portfolio__section-title', heading);
    return section;
  };

  // Pills from a comma-separated string (skills, languages).
  const appendPills = (parent, csv) => {
    const pills = cardPart(null, 'div', 'x-portfolio__pills');
    csv.split(',').forEach(item => cardPart(pills, 'span', 'x-portfolio__pill', item.trim()));
    parent.appendChild(pills);
  };

  // Bio Section
  if (config.bio) {
    const bioSection = portfolioSection('bio');
    cardPart(bioSection, 'div', 'x-portfolio__bio-text', config.bio);
    main.appendChild(bioSection);
  }

  // Stats Section
  if (config.stats && config.stats.length > 0) {
    const statsSection = portfolioSection('stats');
    config.stats.forEach(stat => {
      const statItem = cardPart(null, 'div', 'x-portfolio__stat');
      cardPart(statItem, 'span', 'x-portfolio__stat-value', stat.value);
      cardPart(statItem, 'span', 'x-portfolio__stat-label', stat.label);
      statsSection.appendChild(statItem);
    });
    main.appendChild(statsSection);
  }

  // Skills Section
  if (config.skills || config.skillLevels) {
    const skillsSection = portfolioSection('skills', '🛠️ Skills');

    // Skill pills (from comma-separated string)
    if (config.skills) appendPills(skillsSection, config.skills);

    // Skill bars (from JSON array)
    if (config.skillLevels && config.skillLevels.length > 0) {
      const skillBars = cardPart(null, 'div', 'x-portfolio__skill-bars');

      config.skillLevels.forEach(skill => {
        const skillRow = cardPart(null, 'div', 'x-portfolio__skill-row');
        cardHtmlPart(skillRow, 'div', 'x-portfolio__skill-header',
          `<span class="x-portfolio__skill-name">${skill.name}</span><span class="x-portfolio__skill-level">${skill.level}%</span>`);

        const barBg = cardPart(null, 'div', 'x-portfolio__skill-bar');
        const barFill = cardPart(null, 'div', 'x-portfolio__skill-fill');
        // The level is per-skill data: a generated rule, not the style attribute.
        setRule(barFill, 'level', { width: `${skill.level}%` });
        barBg.appendChild(barFill);
        skillRow.appendChild(barBg);

        skillBars.appendChild(skillRow);
      });
      skillsSection.appendChild(skillBars);
    }

    main.appendChild(skillsSection);
  }

  // Experience Section
  if (config.experience && config.experience.length > 0) {
    const expSection = portfolioSection('experience', '💼 Experience');

    config.experience.forEach((exp, i) => {
      const expItem = cardPart(null, 'div', 'x-portfolio__exp-item');
      // Every entry after the first is divided from the one above it.
      if (i > 0) expItem.classList.add('x-portfolio__exp-item--divided');

      const expHeader = cardPart(null, 'div', 'x-portfolio__exp-header');
      cardPart(expHeader, 'strong', 'x-portfolio__exp-role', exp.role || exp.title);
      if (exp.period) cardPart(expHeader, 'span', 'x-portfolio__exp-period', exp.period);
      expItem.appendChild(expHeader);

      if (exp.company) cardPart(expItem, 'div', 'x-portfolio__exp-company', exp.company);
      if (exp.description) cardPart(expItem, 'div', 'x-portfolio__exp-desc', exp.description);

      expSection.appendChild(expItem);
    });
    main.appendChild(expSection);
  }

  // Education Section
  if (config.education && config.education.length > 0) {
    const eduSection = portfolioSection('education', '🎓 Education');

    config.education.forEach(edu => {
      const eduItem = cardPart(null, 'div', 'x-portfolio__edu-item');
      cardPart(eduItem, 'strong', 'x-portfolio__edu-degree', edu.degree);
      cardPart(eduItem, 'span', 'x-portfolio__edu-school', edu.school + (edu.year ? ` • ${edu.year}` : ''));
      eduSection.appendChild(eduItem);
    });
    main.appendChild(eduSection);
  }

  // Projects Section
  if (config.projects && config.projects.length > 0) {
    const projSection = portfolioSection('projects', '🚀 Projects');
    const projGrid = cardPart(null, 'div', 'x-portfolio__project-grid');

    config.projects.forEach(proj => {
      const projCard = document.createElement('a');
      projCard.href = proj.url || '#';
      projCard.target = proj.url ? '_blank' : '_self';
      projCard.classList.add('x-portfolio__project');
      // Hover lift: `.x-portfolio__project:hover` in card.css (#779).

      if (proj.image) {
        const projImg = document.createElement('img');
        projImg.src = proj.image;
        projImg.alt = proj.name;
        projImg.classList.add('x-portfolio__project-image');
        projCard.appendChild(projImg);
      }

      const projInfo = cardPart(null, 'div', 'x-portfolio__project-info');
      cardPart(projInfo, 'strong', 'x-portfolio__project-name', proj.name);
      if (proj.description) cardPart(projInfo, 'span', 'x-portfolio__project-desc', proj.description);

      projCard.appendChild(projInfo);
      projGrid.appendChild(projCard);
    });

    projSection.appendChild(projGrid);
    main.appendChild(projSection);
  }

  // Certifications
  if (config.certifications) {
    const certSection = portfolioSection('certifications', '🏆 Certifications');
    const certList = cardPart(null, 'ul', 'x-portfolio__cert-list');
    config.certifications.split(',').forEach(cert => cardPart(certList, 'li', 'x-portfolio__cert', cert.trim()));
    certSection.appendChild(certList);
    main.appendChild(certSection);
  }

  // Languages
  if (config.languages) {
    const langSection = portfolioSection('languages', '🌐 Languages');
    appendPills(langSection, config.languages);
    main.appendChild(langSection);
  }

  element.appendChild(main);

  // ==================== CONTACT ====================
  if (config.email || config.phone || config.website) {
    const contact = document.createElement('address');
    contact.className = 'x-portfolio__contact';

    const contactItems = [
      { value: config.email, href: `mailto:${config.email}`, icon: '📧' },
      { value: config.phone, href: `tel:${config.phone}`, icon: '📱' },
      { value: config.website, href: config.website, icon: '🌐', external: true }
    ];

    contactItems.forEach(item => {
      if (item.value) {
        const contactLink = document.createElement('a');
        contactLink.href = item.href;
        if (item.external) contactLink.target = '_blank';
        contactLink.classList.add('x-portfolio__contact-link');
        contactLink.innerHTML = `${item.icon} <span>${item.value}</span>`;
        contact.appendChild(contactLink);
      }
    });

    element.appendChild(contact);
  }

  // ==================== SOCIAL ====================
  const socialLinks = [
    { url: config.linkedin, icon: '💼', label: 'LinkedIn' },
    { url: config.twitter, icon: '🐦', label: 'Twitter' },
    { url: config.github, icon: '🐙', label: 'GitHub' },
    { url: config.dribbble, icon: '🏀', label: 'Dribbble' }
  ].filter(s => s.url);

  if (socialLinks.length > 0) {
    const social = document.createElement('nav');
    social.className = 'x-portfolio__social';
    social.setAttribute('aria-label', 'Social links');

    socialLinks.forEach(({ url, icon, label }) => {
      const socialLink = document.createElement('a');
      socialLink.href = url;
      socialLink.target = '_blank';
      socialLink.title = label;
      socialLink.setAttribute('aria-label', label);
      socialLink.classList.add('x-portfolio__social-link');
      // Hover: `.x-portfolio__social-link:hover` in card.css (#779).
      socialLink.textContent = icon;
      social.appendChild(socialLink);
    });

    element.appendChild(social);
  }

  // ==================== CTA FOOTER ====================
  if (config.cta) {
    const footer = cardPart(null, 'footer', 'x-portfolio__footer');
    // #561: static layout/padding lives in card.css's `.x-portfolio__cta`
    // rule (padding:1rem, was inline at 0.875rem/14px -- below the §13
    // minimum). #779: the hover state is a :hover rule there too, not a pair
    // of pointer handlers writing element.style.
    appendCtaLink(footer, 'x-portfolio__cta', config.ctaHref || '#', config.cta);
    element.appendChild(footer);
  }

  // API
  element.wbPortfolio = {
    // Swaps the modifier class on the dot AND the label -- the colour comes
    // from card.css, so there is no inline background to rewrite.
    setAvailability: (status) => {
      if (!availabilityConfig[status]) return;
      const dot = element.querySelector('.x-portfolio__availability');
      const label = element.querySelector('.x-portfolio__status');
      for (const state of AVAILABILITY_STATES) {
        dot?.classList.remove(`x-portfolio__availability--${state}`);
        label?.classList.remove(`x-portfolio__status--${state}`);
      }
      if (dot) {
        dot.classList.add(`x-portfolio__availability--${status}`);
        dot.title = availabilityConfig[status].label;
      }
      if (label) {
        label.classList.add(`x-portfolio__status--${status}`);
        label.textContent = availabilityConfig[status].label;
      }
    }
  };

  // #678: show the author's own content -- see renderAuthoredContent().
  base.renderAuthoredContent();
  return base.cleanup;
}

// ============================================
// EXPORTED CONSTANTS
// ============================================
export const CARD_TYPES = [
  'card', 'cardimage', 'cardvideo', 'cardbutton', 'cardhero', 
  'cardprofile', 'cardpricing', 'cardstats', 'cardtestimonial', 
  'cardproduct', 'cardnotification', 'cardfile', 'cardlink', 
  'cardhorizontal', 'carddraggable', 'cardexpandable', 
  'cardminimizable', 'cardoverlay', 'cardportfolio'
];

export default card;
