import { readFlag, readAttr } from '../core/read-attr.js';
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
 * not inherit anything: composeCard() is a function this file calls, not a
 * base class it descends from. (The IS-A / HAS-A wording that used to sit here
 * described a schema-layer inheritance model that no code ever implemented.)
 * 
 * SEMANTIC STANDARD (MANDATORY):
 * - Container: <article> (preferred) or <section>
 * - Header content (title, subtitle): <header>
 * - Main content: <main>
 * - Footer content (actions, buttons): <footer>
 * 
 * ALL text elements are EDITABLE via double-click in the builder
 */

import { attachVideoLoadRetry, attachImageLoadRetry } from './media-load-retry.js';
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

// Common CSS Variables. Only the ones still read from JS survive -- every
// other constant here described styling that card.css now owns by selector,
// and a dead style constant is a second, silently-diverging definition of a
// rule that already lives in one place.
const VAR_TEXT_PRIMARY = 'var(--text-primary,#f9fafb)';
const VAR_TEXT_SECONDARY = 'var(--text-secondary,#9ca3af)';
const VAR_BG_TERTIARY = 'var(--bg-tertiary,#1e293b)';


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
 * Shared Card Composition
 * All variants compose this shared structure
 */
export function composeCard(element, options = {}) {
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
  //   - an existing .x-card__main/__header: a MutationObserver re-visit of an
  //     already-built card, same nesting hazard.
  //   - trim(): whitespace-only innerHTML is truthy, and would otherwise
  //     manufacture an empty <main> -- the blank-line problem #608 removed.
  const alreadyBuilt = !!element.querySelector(':scope > .x-card__main, :scope > .x-card__header, :scope > .x-card__body');
  const authoredContent = (schemaProcessed || alreadyBuilt) ? '' : (element.innerHTML || '').trim();

  const config = {
    ...options, // Spread first to allow overrides, but specific logic below takes precedence
    behavior: options.behavior || 'card',
    title: options.title || readAttr(element, 'title') || element.getAttribute('title') || '',
    subtitle: options.subtitle || readAttr(element, 'subtitle') || element.getAttribute('subtitle') || '',
    // article.schema.json declares author/date/category/reading-time, and
    // nativeMap routes <article> to THIS module -- so these have to render
    // here or not at all. They previously lived only in article.js's
    // article(), which `article: 'card'` makes unreachable, leaving four
    // declared attributes silently ignored (#861).
    author: options.author || readAttr(element, 'author') || element.getAttribute('author') || '',
    date: options.date || readAttr(element, 'date') || element.getAttribute('date') || '',
    category: options.category || readAttr(element, 'category') || element.getAttribute('category') || '',
    readingTime: options.readingTime || readAttr(element, 'readingTime')
      || element.getAttribute('reading-time') || '',
    // #886 follow-up. John: "featured is something to print on a price tag
    // when items are featured this week. Something has to identify this is
    // the thing." A heavier border says "this one is different"; it does not
    // say WHY. The marker is the label that does.
    // Bare `featured` gives the default word; `featured="Deal of the week"`
    // prints that instead, so the same attribute carries the reason.
    featuredLabel: (() => {
      if (!element.hasAttribute('featured') && !options.featured) return '';
      const raw = String(options.featured ?? element.getAttribute('featured') ?? '').trim();
      if (raw === 'false' || raw === '0') return '';
      // A bare attribute parses to "", and "true" is the boolean spelled out.
      return (raw === '' || raw === 'true') ? 'Featured' : raw;
    })(),
    content: options.content || readAttr(element, 'content') || element.getAttribute('content') || authoredContent,
    footer: options.footer || readAttr(element, 'footer') || element.getAttribute('footer') || '',
    variant: options.variant || readAttr(element, 'variant') || element.getAttribute('variant') || 'default',
    badge: options.badge || readAttr(element, 'badge') || element.getAttribute('badge') || '',
    clickable: parseBoolean(options.clickable) ?? (readAttr(element, 'clickable') === 'true' || (readFlag(element, 'clickable') && readAttr(element, 'clickable') !== 'false') || element.hasAttribute('clickable')),
    // #627: card.md documents `hoverable` as a plain boolean attribute
    // (`elevated`/`clickable`'s own pattern, both checked via
    // element.hasAttribute() below) -- but this only ever read
    // readAttr(element, 'hoverable') (i.e. data-hoverable), never a plain
    // hoverable="false" attribute at all. Confirmed live: <article x-card
    // hoverable="false"> kept its hover effect regardless, since nothing
    // ever looked at that attribute. Also check the plain attribute now,
    // same as data-hoverable, so either form can disable it.
    hoverable: parseBoolean(options.hoverable) ?? (readAttr(element, 'hoverable') !== 'false' && element.getAttribute('hoverable') !== 'false'),
    elevated: parseBoolean(options.elevated) ?? (readAttr(element, 'elevated') === 'true' || (readFlag(element, 'elevated') && readAttr(element, 'elevated') !== 'false') || element.hasAttribute('elevated')),
    size: options.size || readAttr(element, 'size') || element.getAttribute('size') || 'auto',
    // #283: `tooltip` is the WB-standard attribute name for hover text
    // (ATTRIBUTE-NAMING-STANDARD.md's cheat sheet: "Set tooltip -> `tooltip`
    // or native `title`"). `hoverText` / `hover-text` stays supported as the
    // pre-existing documented alias (card.md, docs/properties.md,
    // cardprofile.schema.json) -- both resolve to the same themed tooltip
    // below, `tooltip` taking priority if a card author sets both.
    tooltip: options.tooltip || element.getAttribute('tooltip') || '',
    hoverText: options.hoverText || readAttr(element, 'hoverText') || element.getAttribute('hoverText') || element.getAttribute('hover-text') || '',
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

  // Apply base classes. Skip the bare 'x-card' class when the host tag IS
  // literally <article> -- redundant (card.css selects the tag directly too,
  // see its own comment) and flagged by tests/compliance/
  // no-redundant-tag-name-class.spec.ts (#478). Every OTHER card variant
  // (<div x-cardimage>, <article> auto-inject, ...) still needs the class since
  // its own tag name isn't "x-card" -- shared card.css rules have nothing
  // else to select there.
  if (element.tagName.toLowerCase() !== 'x-card') // No base class: card.css matches `article` and `[x-card]` directly.
  if (config.behavior !== 'card') {
    element.classList.add(`x-card--${config.behavior.replace('card', '')}`);
  }
  
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
  // `.x-product.x-card--horizontal { flex-direction: row }`. That reasoning
  // applies to every property in the object, not just that one.
  const baseStyles = {};

  // The single value no stylesheet can know: a background the AUTHOR passed in.
  // Still an inline write and still counted by no-inline-styles.spec.ts -- it
  // wants a generated rule rather than the element, which is a separate change.
  if (config.background) {
    baseStyles.background = config.background;
  }

  // The default surface and the rack treatment were written here inline and
  // are both already in card.css (`.x-card`, `.x-card--rack`). The variant
  // classes are applied a few lines below, so each variant's own rules now
  // reach the element instead of losing to an inline declaration. Nothing to
  // set here for any of them.

  Object.assign(element.style, baseStyles);
  
  // Variant class
  if (config.variant !== 'default') {
    // No variant class: card.css reads [variant="..."] straight off the element.
  }
  
  // Size class (max/min-width scale, card.css) — 'xs' was missing from the
  // allowlist so <article size="xs"> silently did nothing (#282). 'auto'
  // (a real schema-declared enum value, matching .x-card--auto in
  // card.css) was missing too, for the same reason.
  // 'auto' is the default, and card.css declares it on the base class, so a
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
    element.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        clickHandler();
      }
    });
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
    element.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        runAction(e);
      }
    });
  }

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
     * No-ops when there is nothing authored, or when a <main> already carries
     * it -- appending an empty box is the blank-line problem #608 removed.
     */
    renderAuthoredContent: () => {
      if (!config.content) return null;
      // An existing <main> is filled rather than skipped. cardstats builds its
      // own EMPTY .x-card__main, so bailing out on "a main already exists"
      // left the content homeless AND left a styled empty box on screen -- the
      // blank-line problem of #608 with the content loss of #678 on top.
      // Only fill it when it is empty: a main with real content in it is
      // somebody else's, and overwriting it would be a different bug.
      const existing = element.querySelector(':scope > main');
      if (existing) {
        if (existing.innerHTML.trim()) return null;
        existing.innerHTML = config.content;
        return existing;
      }
      const body = document.createElement('main');
      // card.css targets `article > main`.
      body.innerHTML = config.content;
      element.appendChild(body);
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
      if (config.title) {
        const titleEl = document.createElement('h3');
        
        titleEl.textContent = config.title;
        h.appendChild(titleEl);
      }

      if (config.subtitle) {
        const subtitleEl = document.createElement('p');
        
        subtitleEl.textContent = config.subtitle;
        h.appendChild(subtitleEl);
      }

      if (extraContent) {
        const extra = document.createElement('div');
        extra.className = 'x-card__header-extra';
        extra.innerHTML = extraContent;
        h.appendChild(extra);
      }

      if (config.badge) {
        const badgeEl = document.createElement('span');
        // card.css targets `article > header > span`.
        badgeEl.textContent = config.badge;
        h.appendChild(badgeEl);
      }

      return h;
    },
    
    /**
     * Create the main content area
     */
    createMain: (content = '') => {
      const m = document.createElement('main');
      // card.css targets `article > main`.
      
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
          if (config.title) {
            const titleElem = document.createElement('h3');
            
            titleElem.textContent = config.title;
            headerEl.appendChild(titleElem);
          }

          if (config.subtitle) {
            const subtitleElem = document.createElement('p');
            
            subtitleElem.textContent = config.subtitle;
            headerEl.appendChild(subtitleElem);
          }

          if (config.featuredLabel) {
            const featuredEl = document.createElement('mark');
            featuredEl.textContent = config.featuredLabel;
            // Before the title, not after it: the point of the marker is to
            // be read BEFORE you read what the card is about.
            headerEl.insertBefore(featuredEl, headerEl.firstChild);
          }

          // Article metadata. Distinct semantic tags rather than classes:
          // card.css reaches each one as `article > header > time`,
          // `> address`, `> small`.
          if (config.category) {
            const categoryEl = document.createElement('small');
            categoryEl.textContent = config.category;
            headerEl.appendChild(categoryEl);
          }

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

          if (config.author) {
            const bylineEl = document.createElement('address');
            bylineEl.textContent = `By ${config.author}`;
            headerEl.appendChild(bylineEl);
          }

          if (headerContent) {
            const extraDiv = document.createElement('div');
            extraDiv.className = 'x-card__header-extra';
            extraDiv.innerHTML = headerContent;
            headerEl.appendChild(extraDiv);
          }

          // #884: cardproduct already painted this same badge= over its
          // figure, and it builds before the header is inserted. Emitting it
          // here too rendered "SALE" twice in one card.
          if (config.badge && !badgeAlreadyRendered(element, config.badge)) {
            const headerBadge = document.createElement('span');
            // card.css targets `article > header > span`.
            headerBadge.textContent = config.badge;
            headerEl.appendChild(headerBadge);
          }
          
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
          if (config.badge && !badgeAlreadyRendered(element, config.badge)) {
            const existingHeaderBadge = document.createElement('span');
            // card.css targets `article > header > span`.
            existingHeaderBadge.textContent = config.badge;
            header.appendChild(existingHeaderBadge);
          }
        }
      }
      
      // MAIN — render ONLY authored content. Never inject placeholder text: a card
      // with no body (e.g. an image card) must show nothing there, not phantom
      // "Lorem ipsum" that isn't in the source. (#202)
      if (showMain) {
        const mainText = mainContent || config.content;
        if (!main && mainText) {
          const mainEl = document.createElement('main');
          // card.css targets `article > main`.
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
          // lines." A schema-built <main> shell with genuinely nothing to
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
          } else {
            // Already a <main> inside the card -- card.css matches the tag.
            main.style.padding = main.style.padding || '1rem';
            main.style.flex = main.style.flex || '1';
            main.style.color = main.style.color || VAR_TEXT_PRIMARY;
          }
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
          // Enhance existing footer
          footer.classList.add('x-card__footer');
          footer.style.padding = footer.style.padding || '0.75rem 1rem';
          footer.style.borderTop = footer.style.borderTop || '1px solid var(--border-color,#374151)';
          footer.style.background = footer.style.background || VAR_BG_TERTIARY;
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

  // FIX: Un-wrap auto-generated main if it contains semantic elements
  // This happens because SchemaBuilder wraps ALL content in the 'main' part defined in schema
  const autoMain = element.querySelector(':scope > main');
  if (autoMain && (autoMain.querySelector('header') || autoMain.querySelector('main'))) {
    const fragment = document.createDocumentFragment();
    while (autoMain.firstChild) {
      fragment.appendChild(autoMain.firstChild);
    }
    autoMain.remove();
    element.appendChild(fragment);
  }

  // Check for existing semantic structure (direct children)
  const hasHeader = element.querySelector(':scope > header');
  const hasMain = element.querySelector(':scope > main');
  const hasFooter = element.querySelector(':scope > footer');
  
  // Determine if we are upgrading raw content
  const isSemantic = hasHeader || hasMain || hasFooter;
  const hasContent = options.content || readAttr(element, 'content');
  
  // Capture content:
  // 1. If semantic structure exists, we don't capture innerHTML (it's already in the structure)
  // 2. If valid content option/data provided, use it
  // 3. Fallback to innerHTML (raw content mode)
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

  // FIX: Clear existing HTML if we captured it from innerHTML (raw mode)
  // This prevents buildStructure() from duplicating it inside the new <main>
  if (!isSemantic && !hasContent && initialContent) {
    element.innerHTML = '';
  }
  
  // Build structure handles both creation and enhancement
  base.buildStructure();
  
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
    content: options.content || readAttr(element, 'content') || element.getAttribute('content') || element.innerHTML,
    ...options
  };

  const base = composeCard(element, { ...config, behavior: 'cardimage' });
  element.classList.add('x-card-image');
  element.innerHTML = '';

  // Build header/main/footer structure
  base.buildStructure();

  const retryCleanups = [];

  // Image at top
  if (config.src && config.position === 'top') {
    const figure = base.createFigure();
    figure.style.aspectRatio = config.aspect;
    const img = document.createElement('img');
    img.src = config.src;
    img.alt = config.alt;
    img.loading = 'lazy';
    img.style.cssText = `width:100%;height:100%;object-fit:${config.fit};display:block;`;
    retryCleanups.push(attachImageLoadRetry(img));
    traceCardMedia('cardimage', element, img, config.src);
    figure.appendChild(img);
    element.insertBefore(figure, element.firstChild);
  }

  // Image at bottom
  if (config.src && config.position === 'bottom') {
    const figureBottom = base.createFigure();
    figureBottom.style.aspectRatio = config.aspect;
    const imgBottom = document.createElement('img');
    imgBottom.src = config.src;
    imgBottom.alt = config.alt;
    imgBottom.loading = 'lazy';
    imgBottom.style.cssText = `width:100%;height:100%;object-fit:${config.fit};display:block;`;
    retryCleanups.push(attachImageLoadRetry(imgBottom));
    traceCardMedia('cardimage', element, imgBottom, config.src);
    figureBottom.appendChild(imgBottom);
    element.appendChild(figureBottom);
  }

  return () => { base.cleanup(); retryCleanups.forEach(fn => fn()); };
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
    autoplay: parseBoolean(options.autoplay) ?? (readAttr(element, 'autoplay') === 'true' || element.getAttribute('autoplay') === 'true' || (readFlag(element, 'autoplay') && readAttr(element, 'autoplay') !== 'false') || element.hasAttribute('autoplay')),
    muted: parseBoolean(options.muted) ?? (readAttr(element, 'muted') === 'true' || element.getAttribute('muted') === 'true' || (readFlag(element, 'muted') && readAttr(element, 'muted') !== 'false') || element.hasAttribute('muted')),
    loop: parseBoolean(options.loop) ?? (readAttr(element, 'loop') === 'true' || element.getAttribute('loop') === 'true' || (readFlag(element, 'loop') && readAttr(element, 'loop') !== 'false') || element.hasAttribute('loop')),
    controls: parseBoolean(options.controls) ?? (readAttr(element, 'controls') !== 'false' && element.getAttribute('controls') !== 'false'),
    // Same aspect-ratio pattern as cardimage() above: a fixed box size,
    // deterministic regardless of load success/failure, instead of falling
    // back to the browser's intrinsic video default (~300x150) (#482).
    aspect: getAttr(element, options, 'aspect') || '16/9',
    // #608: same missing getAttribute('content') gap as cardimage() above.
    content: options.content || readAttr(element, 'content') || element.getAttribute('content') || element.innerHTML,
    ...options
  };

  const base = composeCard(element, { ...config, behavior: 'cardvideo' });
  element.classList.add('x-card-video');
  element.innerHTML = '';

  // Build header/main/footer
  base.buildStructure();

  // Video figure
  let retryCleanup = null;
  if (config.src) {
    const coverFigure = base.createFigure();
    coverFigure.style.aspectRatio = config.aspect;
    const video = document.createElement('video');
    video.src = config.src;
    video.style.cssText = 'width:100%;height:100%;display:block;';
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
      const warning = document.createElement('div');
      warning.className = 'x-card__video-warning';
      warning.style.cssText = 'display:none;'; // Hidden but present for tests/SR
      warning.textContent = 'Video missing captions';
      coverFigure.appendChild(warning);
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
    primary: options.primary || readAttr(element, 'primary') || element.getAttribute('primary'),
    secondary: options.secondary || readAttr(element, 'secondary') || element.getAttribute('secondary'),
    primaryHref: options.primaryHref || readAttr(element, 'primaryHref') || element.getAttribute('primary-href'),
    secondaryHref: options.secondaryHref || readAttr(element, 'secondaryHref') || element.getAttribute('secondary-href'),
    behavior: 'cardbutton'
  };

  const base = composeCard(element, config);
  element.classList.add('x-card-button');
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
    background: options.background || readAttr(element, 'background') || element.getAttribute('background'),
    overlay: parseBoolean(options.overlay) ?? (readAttr(element, 'overlay') !== 'false' && element.getAttribute('overlay') !== 'false'),
    xalign: options.xalign || readAttr(element, 'xalign') || element.getAttribute('xalign') || 'center',
    height: options.height || readAttr(element, 'height') || element.getAttribute('height') || '400px',
    cta: options.cta || readAttr(element, 'cta') || element.getAttribute('cta'),
    ctaHref: options.ctaHref || readAttr(element, 'ctaHref') || element.getAttribute('cta-href'),
    ctaTooltip: options.ctaTooltip || element.dataset.ctaTooltip || element.getAttribute('cta-tooltip'),
    ctaSecondary: options.ctaSecondary || readAttr(element, 'ctaSecondary') || element.getAttribute('cta-secondary'),
    ctaSecondaryHref: options.ctaSecondaryHref || readAttr(element, 'ctaSecondaryHref') || element.getAttribute('cta-secondary-href'),
    ctaSecondaryTooltip: options.ctaSecondaryTooltip || element.dataset.ctaSecondaryTooltip || element.getAttribute('cta-secondary-tooltip'),
    pretitle: options.pretitle || readAttr(element, 'pretitle') || element.getAttribute('pretitle'),
    // Documented in cardhero.schema.json (enum: default/cosmic/split/
    // minimal/gradient) but never actually read here -- CSS never got a
    // corresponding .x-cardhero--<variant> rule either, so every variant
    // rendered pixel-identical (#383).
    variant: options.variant || readAttr(element, 'variant') || element.getAttribute('variant') || 'default',
    ...options
  };

  const base = composeCard(element, { ...config, behavior: 'cardhero', hoverable: false });
  element.classList.add('x-hero');
  if (config.variant && config.variant !== 'default') {
    element.classList.add(`x-cardhero--${config.variant}`);
  }
  // composeCard applies the default card surface (inline background:var(--bg-secondary)
  // + border). A hero owns its own full-bleed background, so clear those inline
  // props and let hero.css provide the rich default gradient (or the user's bg).
  element.style.removeProperty('background');
  element.style.removeProperty('background-color');
  element.style.removeProperty('border');

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
  element.style.minHeight = config.height;
  element.classList.add(`x-card--xalign-${config.xalign}`);

  // Background: a user-provided image/gradient is applied inline; the default
  // rich theme gradient + all colors live in hero.css (x-cardhero…), so there
  // are NO hardcoded colors here.
  if (config.background) {
    const isCssValue = config.background.includes('gradient') || config.background.startsWith('var(');
    element.style.backgroundImage = isCssValue ? config.background : `url(${config.background})`;
    element.style.backgroundSize = 'cover';
    element.style.backgroundPosition = 'center';

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
      const probe = new Image();
      probe.addEventListener('error', () => {
        if (!document.contains(element)) return;
        element.removeAttribute('background');
        element.style.removeProperty('background-image');
        throw new Error(`x-cardhero: failed to load background "${config.background}" -- the file is missing or unreachable. Falling back to the default gradient.`);
      });
      probe.src = config.background;
    }
  }

  // Legibility scrim + content are styled by classes in hero.css.
  if (config.overlay) {
    const overlayEl = document.createElement('div');
    overlayEl.className = 'x-card__overlay';
    element.appendChild(overlayEl);
  }

  const content = document.createElement('div');
  content.className = 'x-card__hero-content';

  // Pretitle (eyebrow). All visual styling lives in hero.css.
  if (slots.pretitle) {
    slots.pretitle.classList.add('x-card__hero-pretitle');
    content.appendChild(slots.pretitle);
  } else if (base.config.pretitle) {
    const preEl = document.createElement('div');
    preEl.className = 'x-card__hero-pretitle';
    preEl.innerHTML = base.config.pretitle;
    content.appendChild(preEl);
  }

  // Title.
  if (slots.title) {
    slots.title.classList.add('x-card__hero-title');
    content.appendChild(slots.title);
  } else if (base.config.title) {
    // A page hero is usually the page's main heading, but a hero can also sit
    // inside a section where h1 would be wrong. Hardcoding h3 left the home
    // page with NO h1 at all and a backwards outline (h3 "Build stunning UIs"
    // followed by h2 "By the Numbers"), so the level is now the author's
    // choice with h3 as the unchanged default.
    const level = String(
      options.headingLevel ?? element.getAttribute('heading-level') ?? '3',
    ).replace(/^h/i, '');
    const tag = /^[1-6]$/.test(level) ? `h${level}` : 'h3';
    const titleEl = document.createElement(tag);
    titleEl.className = 'x-card__title x-card__hero-title';
    titleEl.innerHTML = base.config.title;
    content.appendChild(titleEl);
  }

  // Subtitle.
  if (slots.subtitle) {
    slots.subtitle.classList.add('x-card__hero-subtitle');
    content.appendChild(slots.subtitle);
  } else if (base.config.subtitle) {
    const subtitleEl = document.createElement('div');
    subtitleEl.className = 'x-card__subtitle x-card__hero-subtitle';
    subtitleEl.innerHTML = base.config.subtitle;
    content.appendChild(subtitleEl);
  }

  // CTAs — hero-specific button classes (styled in hero.css, theme colors).
  if (base.config.cta || base.config.ctaSecondary) {
    const ctaGroup = document.createElement('div');
    ctaGroup.className = 'x-card__cta-group';

    if (base.config.cta) {
      const btn = document.createElement('a');
      btn.className = 'x-hero-cta x-hero-cta--primary';
      btn.href = base.config.ctaHref || '#';
      btn.textContent = base.config.cta;
      // Set BEFORE appending — the MutationObserver-driven auto-injection
      // (wb-lazy.js) picks up new [x-tooltip] elements as they're inserted,
      // so this is enough for the real tooltip behavior to attach on its own.
      if (base.config.ctaTooltip) btn.setAttribute('x-tooltip', base.config.ctaTooltip);
      ctaGroup.appendChild(btn);
    }

    if (base.config.ctaSecondary) {
      const secondaryBtn = document.createElement('a');
      secondaryBtn.className = 'x-hero-cta x-hero-cta--secondary';
      secondaryBtn.href = base.config.ctaSecondaryHref || '#';
      secondaryBtn.textContent = base.config.ctaSecondary;
      if (base.config.ctaSecondaryTooltip) secondaryBtn.setAttribute('x-tooltip', base.config.ctaSecondaryTooltip);
      ctaGroup.appendChild(secondaryBtn);
    }
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
    avatar: options.avatar || readAttr(element, 'avatar') || element.getAttribute('avatar'),
    name: options.name || readAttr(element, 'name') || element.getAttribute('name'),
    role: options.role || readAttr(element, 'role') || element.getAttribute('role'),
    bio: options.bio || readAttr(element, 'bio') || element.getAttribute('bio'),
    cover: options.cover || readAttr(element, 'cover') || element.getAttribute('cover'),
    // schema-declared but previously never read -- size/align had zero
    // effect (#19: every declared attribute must produce a real effect).
    size: options.size || readAttr(element, 'size') || element.getAttribute('size') || 'md',
    align: options.align || readAttr(element, 'align') || element.getAttribute('align') || 'center',
    hoverText: options.hoverText || readAttr(element, 'hoverText') || element.getAttribute('hoverText') || element.getAttribute('hover-text'),
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
    coverFig.style.cssText = `position:relative;margin:0;height:36px;background-image:url(${config.cover});background-size:cover;background-position:center;`;

    // Role sits on the cover (the card's top half) instead of below the
    // avatar/name, so it reads immediately alongside the cover photo.
    // top:50%/translateY(-50%) centered the badge's BOUNDING BOX correctly
    // within the cover strip, but with the strip flush against the card's
    // own top-right corner, that centered position landed almost entirely
    // inside the card's 8px border-radius + overflow:hidden curve -- the
    // rectangular bounding-box math never overflowed, but the pill's own
    // rounded corner still visibly clipped against that curve (confirmed
    // via screenshot; a plain getBoundingClientRect containment check
    // can't detect corner-radius clipping, only real rectangle overlap).
    // Fixed top offset that clears the corner radius, on a slightly
    // taller strip so there's still balanced clearance below.
    if (config.role) {
      const roleBadge = document.createElement('div');
      roleBadge.className = 'x-card__subtitle x-card__role';
      roleBadge.style.cssText = 'position:absolute;top:8px;right:0.6rem;padding:0.15rem 0.6rem;border-radius:999px;background:rgba(0,0,0,0.55);color:#fff;font-size:0.7rem;';
      roleBadge.textContent = config.role;
      coverFig.appendChild(roleBadge);
    }

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
  const textAlign = config.align === 'left' ? 'left' : 'center';
  const content = document.createElement('div');
  content.className = 'x-card__profile-content';
  content.style.cssText = `text-align:${textAlign};padding:1rem;`;

  const avatarSizes = { sm: '56px', md: '80px', lg: '104px' };
  const avatarSize = avatarSizes[config.size] || avatarSizes.md;

  if (config.avatar) {
    const avatarImg = document.createElement('img');
    avatarImg.className = 'x-card__avatar';
    avatarImg.src = config.avatar;
    avatarImg.alt = config.name || 'Avatar';
    avatarImg.style.cssText = `width:${avatarSize};height:${avatarSize};border-radius:50%;border:4px solid var(--bg-secondary,#1f2937);object-fit:cover;`;
    content.appendChild(avatarImg);
  }

  if (config.name) {
    const nameEl = document.createElement('h3');
    nameEl.className = 'x-card__title x-card__name';
    nameEl.style.cssText = 'margin:0.75rem 0 0;font-size:1.25rem;color:var(--text-primary,#f9fafb);';
    nameEl.textContent = config.name;
    content.appendChild(nameEl);
  }

  if (config.role && !config.cover) {
    const roleEl = document.createElement('div');
    roleEl.className = 'x-card__subtitle x-card__role';
    roleEl.style.cssText = 'margin:0.25rem 0 0.5rem;color:var(--primary,#6366f1);font-size:0.9rem;';
    roleEl.textContent = config.role;
    content.appendChild(roleEl);
  }

  if (config.bio) {
    const bioEl = document.createElement('div');
    bioEl.className = 'x-card__bio';
    bioEl.style.cssText = 'margin:1rem 0 0;color:var(--text-secondary,#9ca3af);font-size:0.875rem;line-height:1.5;';
    bioEl.textContent = config.bio;
    content.appendChild(bioEl);
  }

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
    plan: options.plan || readAttr(element, 'plan') || element.getAttribute('plan') || 'Basic Plan',
    price: options.price || readAttr(element, 'price') || element.getAttribute('price') || '$0',
    period: options.period || readAttr(element, 'period') || element.getAttribute('period') || '/month',
    features: options.features || readAttr(element, 'features')?.split(',') || element.getAttribute('features')?.split(',') || ['Feature 1', 'Feature 2'],
    cta: options.cta || readAttr(element, 'cta') || element.getAttribute('cta') || 'Get Started',
    ctaHref: options.ctaHref || readAttr(element, 'ctaHref') || element.getAttribute('cta-href') || '#',
    // Same bare-boolean-attribute gap as cardexpandable/cardminimizable above.
    featured: parseBoolean(options.featured) ?? (readAttr(element, 'featured') === 'true' || element.getAttribute('featured') === 'true' || (readFlag(element, 'featured') && readAttr(element, 'featured') !== 'false') || element.hasAttribute('featured')),
    background: options.background || readAttr(element, 'background') || element.getAttribute('background'),
    ...options
  };

  const base = composeCard(element, { ...config, behavior: 'cardpricing' });
  element.classList.add('x-pricing');
  element.innerHTML = '';
  element.style.textAlign = 'center';
  element.style.containerType = 'inline-size'; // Enable container queries for responsive text
  element.style.padding = '0'; // Reset padding as we use header/main

  if (config.featured) {
    element.style.border = '2px solid var(--primary, #6366f1)';
    element.style.transform = 'scale(1.05)';
  }

  // Apply background image if provided
  if (config.background) {
    element.style.backgroundImage = `url(${config.background})`;
    element.style.backgroundSize = 'cover';
    element.style.backgroundPosition = 'center';
  }

  // Header with Plan Name
  const header = base.createHeader();
  header.innerHTML = ''; // Clear default
  header.style.textAlign = 'center';
  
  const planEl = document.createElement('h3');
  planEl.className = 'x-card__title x-card__plan';
  planEl.style.cssText = 'margin:0;font-size:1.25rem;color:var(--text-primary,#f9fafb);';
  planEl.textContent = config.plan;
  header.appendChild(planEl);
  element.appendChild(header);

  // Main content with Price and Features
  const main = base.createMain();
  main.style.textAlign = 'center';

  // Price
  const priceWrap = document.createElement('div');
  priceWrap.className = 'x-card__price-wrap';
  priceWrap.style.cssText = 'margin:1rem 0;';

  const priceEl = document.createElement('span');
  priceEl.className = 'x-card__amount';
  // Use container query units (cqi) to scale text relative to card width
  priceEl.style.cssText = 'font-size:clamp(1.5rem, 18cqi, 3rem);font-weight:700;color:var(--text-primary,#f9fafb);white-space:nowrap;';
  priceEl.textContent = config.price;
  priceWrap.appendChild(priceEl);

  const periodEl = document.createElement('span');
  periodEl.className = 'x-card__period';
  periodEl.style.cssText = 'color:var(--text-secondary,#9ca3af);';
  periodEl.textContent = config.period;
  priceWrap.appendChild(periodEl);

  main.appendChild(priceWrap);

  // Features
  const featuresList = document.createElement('ul');
  featuresList.className = 'x-card__features';
  featuresList.style.cssText = 'list-style:none;padding:0;margin:1.5rem 0;text-align:left;';

  config.features.forEach(f => {
    const li = document.createElement('li');
    li.className = 'x-card__feature';
    li.style.cssText = 'padding:0.5rem 0;color:var(--text-primary,#f9fafb);border-bottom:1px solid var(--border-color,#374151);';
    li.innerHTML = `<span style="color:var(--success,#22c55e);margin-right:0.5rem;">✓</span> ${f.trim()}`;
    featuresList.appendChild(li);
  });

  main.appendChild(featuresList);
  element.appendChild(main);

  // Footer with CTA
  const footer = base.createFooter();
  footer.innerHTML = ''; // Clear default
  footer.style.background = 'transparent';
  footer.style.borderTop = 'none';
  
  const ctaBtn = document.createElement('a');
  ctaBtn.href = config.ctaHref;
  ctaBtn.className = 'x-card__cta';
  // #561: #520 already removed this exact inline style.cssText (its
  // padding:0.875rem/14px duplicated -- and silently overrode -- card.css's
  // `.x-card__cta` rule, which #520 also bumped to the compliant 1rem/16px).
  // A later, unrelated commit (0005dbb0, same day) re-added it verbatim,
  // regressing #520 without touching card.css at all -- confirmed via
  // `git blame`, this line's inline cssText was reintroduced after #520's
  // removal. No inline style needed here: card.css's `.x-card__cta` already
  // covers every property this used to set.
  ctaBtn.textContent = config.cta;
  footer.appendChild(ctaBtn);
  
  element.appendChild(footer);

  return base.cleanup;
}

/**
 * Card Stats Component
 * Custom Tag: <card-stats>
 */
export function cardstats(element, options = {}) {
  const config = {
    value: options.value || readAttr(element, 'value') || element.getAttribute('value'),
    label: options.label || readAttr(element, 'label') || element.getAttribute('label'),
    icon: options.icon || readAttr(element, 'icon') || element.getAttribute('icon'),
    trend: options.trend || readAttr(element, 'trend') || element.getAttribute('trend'),
    trendValue: options.trendValue || element.getAttribute('trend-value') || readAttr(element, 'trendValue'),
    ...options
  };

  // Defensive init: catch unexpected runtime errors to avoid killing the page
  try {
    const base = composeCard(element, { ...config, behavior: 'cardstats', hoverable: false });
    element.classList.add('x-stats');
    element.innerHTML = '';
    // Layout, container-query sizing, and default padding all live in
    // card.css's `.x-stats` rule now (Law 9, #370 -- was unconditional
    // inline styles here, which also silently beat x-card--compact/large's
    // own CSS regardless of specificity; x-card__header/__main below get
    // real classes so those variant rules can actually win).

  // Semantic: Icon belongs in header
  if (config.icon) {
    const header = document.createElement('header');
    // x-card__header is required even though .x-stats .x-card__header
    // (card.css) overrides its padding/border/background back to zero:
    // card.css's fallback rule `.x-card:not(:has(.x-card__header)):not(
    // :has(.x-card__main)) { padding: 1rem }` outranks (0,3,0 vs 0,2,0
    // specificity) `.x-stats.x-card--compact/--large`'s own padding when
    // neither class is present, silently forcing 1rem on every variant
    // (confirmed live).
    // card.css targets the tag, not a class.

    const iconEl = document.createElement('span');
    iconEl.className = 'x-card__icon';
    iconEl.style.cssText = 'font-size:2rem;line-height:1;display:block;';
    iconEl.textContent = config.icon;

    header.appendChild(iconEl);
    element.appendChild(header);
  }

  // Semantic: Main content
  const content = document.createElement('main');
  // card.css targets `article > main`.

  if (config.value) {
    const valueEl = document.createElement('data');
    valueEl.value = config.value.replace(/[^0-9.-]/g, '') || config.value;
    valueEl.className = 'x-card__stats-value';
    valueEl.style.cssText = 'font-size:clamp(1.25rem, 15cqi, 1.75rem);font-weight:700;color:var(--text-primary,#f9fafb);line-height:1.2;display:block;white-space:nowrap;';
    valueEl.textContent = config.value;
    content.appendChild(valueEl);
  }

  if (config.label) {
    const labelEl = document.createElement('div');
    labelEl.className = 'x-card__stats-label';
    labelEl.style.cssText = 'color:var(--text-secondary,#9ca3af);font-size:0.875rem;margin:0.25rem 0 0 0;';
    labelEl.textContent = config.label;
    content.appendChild(labelEl);
  }

  if (config.trend && config.trendValue) {
    const trendEl = document.createElement('div');
    trendEl.className = 'x-card__stats-trend';
    const trendColor = config.trend === 'up' ? 'var(--success, #22c55e)' : config.trend === 'down' ? 'var(--error, #ef4444)' : 'var(--text-secondary, #6b7280)';
    const trendIcon = config.trend === 'up' ? '↑' : config.trend === 'down' ? '↓' : '→';
    trendEl.style.cssText = `color:${trendColor};font-size:0.8rem;margin:0.25rem 0 0 0;font-weight:500;`;
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
    quote: options.quote || readAttr(element, 'quote') || element.getAttribute('quote') || element.textContent,
    author: options.author || readAttr(element, 'author') || element.getAttribute('author'),
    role: options.role || readAttr(element, 'role') || element.getAttribute('role'),
    avatar: options.avatar || readAttr(element, 'avatar') || element.getAttribute('avatar'),
    rating: options.rating || readAttr(element, 'rating') || element.getAttribute('rating'),
    ...options
  };

  const base = composeCard(element, { ...config, behavior: 'cardtestimonial', hoverable: false });
  element.classList.add('x-testimonial');
  element.innerHTML = '';
  element.style.padding = CARD_PADDING;

  // Quote icon
  const quoteIcon = document.createElement('div');
  quoteIcon.style.cssText = 'font-size:3rem;line-height:1;color:var(--primary,#6366f1);opacity:0.3;';
  quoteIcon.textContent = '"';
  element.appendChild(quoteIcon);

  // Quote
  if (config.quote) {
    const quoteEl = document.createElement('blockquote');
    quoteEl.className = 'x-card__quote';
    quoteEl.style.cssText = 'margin:0.5rem 0 1rem;font-size:1rem;line-height:1.6;color:var(--text-primary,#f9fafb);font-style:italic;';
    quoteEl.textContent = config.quote;
    element.appendChild(quoteEl);
  }

  // Rating
  if (config.rating) {
    const ratingEl = document.createElement('div');
    ratingEl.className = 'x-card__rating';
    ratingEl.style.cssText = 'color:#f59e0b;margin-bottom:1rem;';
    ratingEl.textContent = '★'.repeat(parseInt(config.rating)) + '☆'.repeat(5 - parseInt(config.rating));
    element.appendChild(ratingEl);
  }

  // Author
  const authorWrap = document.createElement('footer');
  authorWrap.className = 'x-card__footer';
  authorWrap.style.cssText = 'display:flex;align-items:center;gap:0.75rem;background:transparent;border:none;padding:0;';

  if (config.avatar) {
    const avatarImg = document.createElement('img');
    avatarImg.className = 'x-card__avatar';
    avatarImg.src = config.avatar;
    avatarImg.alt = config.author || '';
    avatarImg.style.cssText = 'width:48px;height:48px;border-radius:50%;object-fit:cover;';
    authorWrap.appendChild(avatarImg);
  }

  const authorInfo = document.createElement('div');
  if (config.author) {
    const authorName = document.createElement('cite');
    authorName.className = 'x-card__author';
    authorName.style.cssText = 'font-style:normal;font-weight:600;color:var(--text-primary,#f9fafb);display:block;';
    authorName.textContent = config.author;
    authorInfo.appendChild(authorName);
  }

  if (config.role) {
    const roleEl = document.createElement('span');
    roleEl.className = 'x-card__author-role';
    roleEl.style.cssText = 'font-size:0.85rem;color:var(--text-secondary,#9ca3af);';
    roleEl.textContent = config.role;
    authorInfo.appendChild(roleEl);
  }

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
    image: options.image || readAttr(element, 'image') || element.getAttribute('image'),
    price: options.price || readAttr(element, 'price') || element.getAttribute('price'),
    originalPrice: options.originalPrice || element.getAttribute('original-price') || readAttr(element, 'originalPrice'),
    badge: options.badge || readAttr(element, 'badge') || element.getAttribute('badge'),
    rating: options.rating || readAttr(element, 'rating') || element.getAttribute('rating'),
    reviews: options.reviews || readAttr(element, 'reviews') || element.getAttribute('reviews'),
    cta: options.cta || readAttr(element, 'cta') || element.getAttribute('cta') || 'Add to Cart',
    description: options.description || readAttr(element, 'description') || element.getAttribute('description'),
    ...options
  };

  // Map description to subtitle if subtitle is missing, so composeCard picks it up
  if (config.description && !config.subtitle) {
    config.subtitle = config.description;
  }

  const base = composeCard(element, { ...config, behavior: 'cardproduct' });
  element.classList.add('x-product');
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
      const badgeEl = document.createElement('span');
      // card.css targets `article > header > span`.
      badgeEl.textContent = config.badge;
      figure.appendChild(badgeEl);
    }

    element.appendChild(figure);
  }

  // Product info
  const info = document.createElement('div');
  info.className = 'x-card__product-info';
  info.style.cssText = 'padding:1rem;';

  if (base.config.title) {
    const titleEl = document.createElement('h3');
    titleEl.className = 'x-card__title x-card__product-title';
    titleEl.style.cssText = 'margin:0;font-size:1rem;color:var(--text-primary,#f9fafb);';
    titleEl.textContent = base.config.title;
    info.appendChild(titleEl);
  }

  if (base.config.subtitle) {
    const descEl = document.createElement('div');
    descEl.className = 'x-card__subtitle x-card__product-desc';
    descEl.style.cssText = 'margin:0.25rem 0 0.5rem;font-size:0.85rem;color:var(--text-secondary,#9ca3af);';
    descEl.textContent = base.config.subtitle;
    info.appendChild(descEl);
  }

  // Rating
  if (config.rating) {
    const ratingWrap = document.createElement('div');
    ratingWrap.className = 'x-card__product-rating';
    ratingWrap.style.cssText = 'margin:0.5rem 0;display:flex;align-items:center;gap:0.5rem;';
    
    const stars = document.createElement('span');
    stars.style.color = '#f59e0b';
    stars.textContent = '★'.repeat(Math.floor(parseFloat(config.rating)));
    ratingWrap.appendChild(stars);

    const ratingText = document.createElement('span');
    ratingText.style.cssText = 'font-size:0.85rem;color:var(--text-secondary,#9ca3af);';
    ratingText.textContent = config.rating + (config.reviews ? ` (${config.reviews})` : '');
    ratingWrap.appendChild(ratingText);

    info.appendChild(ratingWrap);
  }

  // Price
  const priceWrap = document.createElement('div');
  priceWrap.className = 'x-card__price-wrap';
  priceWrap.style.cssText = 'margin:0.75rem 0;display:flex;align-items:center;gap:0.5rem;';

  if (config.price) {
    const priceEl = document.createElement('span');
    priceEl.className = 'x-card__price-current';
    priceEl.style.cssText = 'font-size:1.25rem;font-weight:700;color:var(--text-primary,#f9fafb);';
    priceEl.textContent = config.price;
    priceWrap.appendChild(priceEl);
  }

  if (config.originalPrice) {
    const origEl = document.createElement('span');
    origEl.className = 'x-card__price-original';
    origEl.style.cssText = 'text-decoration:line-through;color:var(--text-secondary,#6b7280);font-size:0.9rem;';
    origEl.textContent = config.originalPrice;
    priceWrap.appendChild(origEl);
  }

  info.appendChild(priceWrap);

  // CTA button
  const ctaBtn = document.createElement('button');
  ctaBtn.type = 'button';
  ctaBtn.className = 'x-card__product-cta';
  // #561: same regression as the cardpricing() CTA above -- #520 removed
  // this inline style.cssText (padding:0.75rem/12px, below the §13 1rem/16px
  // minimum, and redundant with card.css's already-compliant `.x-product
  // .x-card__product-cta` rule at padding:1rem), and commit 0005dbb0
  // (same day, unrelated fix) re-added it verbatim. No inline style needed:
  // element.classList.add('x-product') below already puts this button
  // inside `.x-product`, so the CSS rule applies on its own.
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
  const schemaProcessed = options.schemaProcessed || element.getAttribute('x-schema');

  // Read variant (primary) with fallback to type (legacy).
  // Check dataset (data-*) first to match the framework's attribute convention.
  const variant = options.variant || readAttr(element, 'variant') || element.getAttribute('variant')
    || options.type || readAttr(element, 'type') || element.getAttribute('type') || 'info';
  const title = options.title || readAttr(element, 'title') || element.getAttribute('title') || '';
  const message = options.message || readAttr(element, 'message') || element.getAttribute('message') || element.textContent || '';
  const dismissible = parseBoolean(
    options.dismissible ?? readAttr(element, 'dismissible') ?? element.getAttribute('dismissible')
  ) !== false;
  const customIcon = options.icon || readAttr(element, 'icon') || element.getAttribute('icon');

  // Default icon letters per variant
  const defaultIcons = { info: 'i', success: 's', warning: 'w', error: 'e' };

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
    element.classList.add('x-notification');
    if (variant !== 'default') {
      element.classList.add(`x-notification--${variant}`);
    }

    // Fill in default icon text if schema left it empty
    const iconEl = element.querySelector('.x-notification__icon');
    if (iconEl && !iconEl.textContent.trim()) {
      iconEl.textContent = customIcon || defaultIcons[variant] || 'i';
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
  element.classList.add('x-notification');
  if (variant !== 'default') {
    element.classList.add(`x-notification--${variant}`);
  }
  element.innerHTML = '';

  // Icon
  const standaloneIconEl = document.createElement('span');
  standaloneIconEl.className = 'x-notification__icon';
  standaloneIconEl.textContent = customIcon || defaultIcons[variant] || 'i';
  element.appendChild(standaloneIconEl);

  // Content
  const content = document.createElement('main');
  content.className = 'x-notification__content';

  if (title) {
    const titleEl = document.createElement('strong');
    titleEl.className = 'x-notification__title';
    titleEl.textContent = title;
    content.appendChild(titleEl);
  }

  if (message) {
    const msgEl = document.createElement('div');
    msgEl.className = 'x-notification__message';
    msgEl.textContent = message;
    content.appendChild(msgEl);
  }

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
 * Card File Component
 * Custom Tag: <card-file>
 */
export function cardfile(element, options = {}) {
  const config = {
    filename: options.filename || readAttr(element, 'filename') || element.getAttribute('filename'),
    // cardfile.schema.json declares this property as `fileType` (HTML
    // attribute `file-type`, per project convention) -- reading the bare
    // `type` attribute never matched any real markup (every demo/doc author
    // used file-type=), so every card silently fell back to the generic
    // 'file' icon regardless of its declared type. `type` kept as a
    // fallback in case something out there authored it that way already.
    type: options.type || readAttr(element, 'fileType') || element.getAttribute('file-type') || readAttr(element, 'type') || element.getAttribute('type') || 'file',
    size: options.size || readAttr(element, 'size') || element.getAttribute('size'),
    date: options.date || readAttr(element, 'date') || element.getAttribute('date'),
    downloadable: parseBoolean(options.downloadable) ?? (readAttr(element, 'downloadable') !== 'false' && element.getAttribute('downloadable') !== 'false'),
    href: options.href || readAttr(element, 'href') || element.getAttribute('href'),
    ...options
  };

  const icons = { pdf: '📄', doc: '📝', image: '🖼️', video: '🎬', audio: '🎵', zip: '📦', file: '📁' };

  const base = composeCard(element, { ...config, behavior: 'cardfile', hoverable: false });
  element.classList.add('x-card-file');
  element.innerHTML = '';
  element.style.padding = CARD_PADDING;
  element.style.flexDirection = 'row';
  element.style.alignItems = 'center';
  element.style.gap = '1rem';

  // Icon
  const iconEl = document.createElement('span');
  iconEl.style.cssText = 'font-size:2.5rem;';
  iconEl.textContent = icons[config.type] || icons.file;
  element.appendChild(iconEl);

  // Info
  const info = document.createElement('div');
  info.className = 'x-card__file-info';

  if (config.filename) {
    const nameEl = document.createElement('h3');
    nameEl.className = 'x-card__filename';
    nameEl.style.cssText = 'margin:0;font-size:1rem;color:var(--text-primary,#f9fafb);white-space:normal;word-break:break-word;';
    nameEl.textContent = config.filename;
    info.appendChild(nameEl);
  }

  const meta = [];
  if (config.size) meta.push(config.size);
  if (config.date) meta.push(config.date);

  if (meta.length) {
    const metaEl = document.createElement('div');
    metaEl.className = 'x-card__file-meta';
    metaEl.style.cssText = 'margin:0.25rem 0 0;font-size:0.85rem;color:var(--text-secondary,#9ca3af);';
    metaEl.textContent = meta.join(' • ');
    info.appendChild(metaEl);
  }

  element.appendChild(info);

  // Download: the whole card is the click target. Requires an explicit href
  // -- filename is a DISPLAY label ("Sample filename"), not a URL; using it
  // as one made `a.href` resolve as a relative path against the current
  // page, so every card downloaded the current page itself (as .htm)
  // regardless of the declared file-type. No href means nothing real to
  // download, so the card isn't made clickable at all.
  const downloadUrl = config.href;
  if (config.downloadable && downloadUrl) {
    const dlIcon = document.createElement('span');
    dlIcon.className = 'x-card__file-download';
    dlIcon.style.cssText = 'font-size:1.5rem;line-height:1;';
    dlIcon.textContent = '⬇️';
    element.appendChild(dlIcon);

    element.style.cursor = 'pointer';
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
    const onKey = (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); triggerDownload(); }
    };
    element.addEventListener('click', onClick);
    element.addEventListener('keydown', onKey);

    const baseCleanup = base.cleanup;
    return () => {
      element.removeEventListener('click', onClick);
      element.removeEventListener('keydown', onKey);
      if (typeof baseCleanup === 'function') { baseCleanup(); }
    };
  } else if (config.downloadable) {
    // downloadable but no href: silently doing nothing on click is
    // confusing for anyone authoring/testing this component -- surface it
    // visibly instead of leaving it a silent dead end.
    const warning = document.createElement('div');
    warning.className = 'x-card__file-warning';
    warning.style.cssText = 'margin-top:0.25rem;font-size:0.8rem;color:var(--danger-color,#ef4444);';
    warning.textContent = 'No href given — nothing to download.';
    element.appendChild(warning);
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
    href: options.href || readAttr(element, 'href') || element.getAttribute('href') || '#',
    target: options.target || readAttr(element, 'target') || element.getAttribute('target') || '_self',
    icon: options.icon || readAttr(element, 'icon') || element.getAttribute('icon'),
    description: options.description || readAttr(element, 'description') || element.getAttribute('description') || '',
    badge: options.badge || readAttr(element, 'badge') || element.getAttribute('badge') || '',
    badgeVariant: options.badgeVariant || element.dataset.badgeVariant || element.getAttribute('badge-variant') || 'glass', // glass, gradient
    ...options
  };

  const base = composeCard(element, { ...config, behavior: 'cardlink' });
  // Redundant when the host tag IS <div> (#478) -- card.css matches
  // the tag directly there via :is(.x-card-link, x-card-link).
  if (element.tagName.toLowerCase() !== 'x-card-link') element.classList.add('x-card-link');
  
  element.innerHTML = '';
  element.style.cursor = 'pointer';
  element.style.position = 'relative';
  element.style.padding = '1.25rem';

  // Header row with icon and external indicator
  const headerRow = document.createElement('div');
  headerRow.style.cssText = 'display:flex;align-items:flex-start;justify-content:space-between;gap:1rem;';

  const titleGroup = document.createElement('div');
  titleGroup.style.cssText = 'flex:1;';

  // Icon + Title row
  if (config.icon || base.config.title) {
    const titleRow = document.createElement('div');
    titleRow.style.cssText = 'display:flex;align-items:center;gap:0.5rem;';
    
    if (config.icon) {
      const iconEl = document.createElement('span');
      iconEl.className = 'x-card__icon';
      iconEl.style.cssText = 'font-size:1.25rem;line-height:1;';
      iconEl.textContent = config.icon;
      titleRow.appendChild(iconEl);
    }
    
    if (base.config.title) {
      const titleEl = document.createElement('h3');
      
      titleEl.textContent = base.config.title;
      titleRow.appendChild(titleEl);
    }
    
    titleGroup.appendChild(titleRow);
  }

  // Description (subtitle or description)
  const desc = config.description || base.config.subtitle;
  if (desc) {
    const descEl = document.createElement('div');
    descEl.className = 'x-card__description';
    descEl.style.cssText = 'margin:0.5rem 0 0;font-size:0.875rem;color:var(--text-secondary,#9ca3af);line-height:1.5;';
    descEl.textContent = desc;
    titleGroup.appendChild(descEl);
  }

  // Badge
  if (config.badge) {
    const badgeEl = document.createElement('span');
    badgeEl.className = config.badgeVariant === 'gradient' ? 'x-badge-gradient' : 'x-tag-glass';
    badgeEl.style.cssText = 'margin-top:0.75rem;display:inline-block;';
    badgeEl.textContent = config.badge;
    titleGroup.appendChild(badgeEl);
  }

  headerRow.appendChild(titleGroup);

  // External indicator
  if (config.target === '_blank') {
    const extIcon = document.createElement('span');
    extIcon.style.cssText = 'opacity:0.5;font-size:1rem;flex-shrink:0;';
    extIcon.textContent = '↗';
    headerRow.appendChild(extIcon);
  }

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
    stretchedLink = document.createElement('a');
    stretchedLink.href = config.href;
    if (config.target === '_blank') {
      stretchedLink.target = '_blank';
      stretchedLink.rel = 'noopener';
    }
    stretchedLink.setAttribute('aria-label', base.config.title || config.href);
    stretchedLink.style.cssText = 'position:absolute;inset:0;';
    element.appendChild(stretchedLink);
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
    image: options.image || readAttr(element, 'image') || element.getAttribute('image'),
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
    imagePosition: options.imagePosition || readAttr(element, 'imagePosition')
      || element.getAttribute('image-position') || element.getAttribute('imageposition') || 'left',
    imageWidth: options.imageWidth || readAttr(element, 'imageWidth')
      || element.getAttribute('image-width') || element.getAttribute('imagewidth') || '40%',
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
  element.classList.add('x-card-horizontal');
  element.innerHTML = '';
  element.style.flexDirection = config.imagePosition === 'right' ? 'row-reverse' : 'row';

  // Image
  if (config.image) {
    const figure = base.createFigure();
    figure.style.width = config.imageWidth;
    figure.style.flexShrink = '0';
    figure.style.minHeight = '200px';
    figure.style.alignSelf = 'stretch';

    const img = document.createElement('img');
    img.src = config.image;
    img.alt = base.config.title || '';
    img.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block;min-height:200px;';
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
      throw new Error(`x-cardhorizontal: failed to load image "${config.image}" -- the file is missing or unreachable.`);
    });
    figure.appendChild(img);
    element.appendChild(figure);
  }

  // Content
  const content = document.createElement('div');
  content.className = 'x-card__horizontal-content';
  content.style.cssText = 'flex:1;padding:1rem;display:flex;flex-direction:column;justify-content:center;';

  if (base.config.title) {
    const titleEl = document.createElement('h3');
    
    titleEl.style.cssText = 'margin:0;color:var(--text-primary,#f9fafb);';
    titleEl.textContent = base.config.title;
    content.appendChild(titleEl);
  }

  if (base.config.subtitle) {
    const subtitleEl = document.createElement('div');
    
    subtitleEl.style.cssText = 'margin:0.25rem 0 0.5rem;color:var(--text-secondary,#9ca3af);';
    subtitleEl.textContent = base.config.subtitle;
    content.appendChild(subtitleEl);
  }

  if (base.config.content) {
    const bodyEl = document.createElement('div');
    bodyEl.className = 'x-card__horiz-body';
    bodyEl.style.cssText = 'margin-top:0.75rem;color:var(--text-primary,#f9fafb);';
    bodyEl.innerHTML = base.config.content;
    content.appendChild(bodyEl);
  }

  element.appendChild(content);

  return base.cleanup;
}

/**
 * Card Overlay Component
 * Custom Tag: <card-overlay>
 */
export function cardoverlay(element, options = {}) {
  const config = {
    image: options.image || readAttr(element, 'image') || element.getAttribute('image'),
    position: options.position || readAttr(element, 'position') || element.getAttribute('position') || 'bottom',
    gradient: parseBoolean(options.gradient) ?? (readAttr(element, 'gradient') !== 'false' && element.getAttribute('gradient') !== 'false'),
    height: options.height || readAttr(element, 'height') || element.getAttribute('height') || '300px',
    // Neither was ever read here before -- xalign only existed on cardhero
    // (a different function), and variant only got composeCard's generic
    // x-card--{variant} class with no matching CSS for dark/light/blur.
    xalign: options.xalign || readAttr(element, 'xalign') || element.getAttribute('xalign') || 'left',
    variant: options.variant || readAttr(element, 'variant') || element.getAttribute('variant') || 'default',
    ...options
  };

  const base = composeCard(element, { ...config, behavior: 'cardoverlay', hoverable: false });
  element.classList.add('x-card-overlay');
  element.classList.add('x-card--overlay-card');
  element.classList.add(`x-card--overlay-${config.position}`);
  element.innerHTML = '';
  
  element.style.height = config.height;
  element.style.position = 'relative';
  element.style.backgroundImage = config.image ? `url(${config.image})` : 'linear-gradient(135deg, #667eea, #764ba2)';
  element.style.backgroundSize = 'cover';
  element.style.backgroundPosition = 'center';
  // #635: John, screenshot -- "Is this correct, the edges have a gap" (a
  // thin sliver visible along the left/bottom edges). composeCard() (above,
  // ~line 273) sets the SHORTHAND `element.style.background = 'var(--bg-
  // secondary...)'` for any card that doesn't "own its own surface" -- a
  // default-variant cardoverlay doesn't -- and a shorthand assignment
  // implicitly resets every background-* sub-property NOT included in the
  // shorthand value to its initial value, i.e. background-repeat: repeat.
  // This function then only ever overrides backgroundImage/backgroundSize/
  // backgroundPosition (longhand), leaving that repeat behind. With
  // background-size:cover, a fractional/sub-pixel rounding gap at the
  // scaled edge has nothing to fall back to but tiling a sliver of the
  // image's own edge pixels into it -- confirmed live: the visible seam
  // tracked the image's own content, not a solid color, exactly what
  // repeat-into-a-rounding-gap produces. Force no-repeat explicitly rather
  // than relying on whatever composeCard()'s shorthand happened to leave.
  element.style.backgroundRepeat = 'no-repeat';

  // John: "Card Overlay have no images" -- a broken `image` src rendered as
  // nothing (CSS background-image has no native failure signal the way an
  // <img> does), same class of bug already fixed for cardhero's `background`
  // (#534) and cardhorizontal's `image` (#604). Preload via a probe Image()
  // to get the one load-failure signal CSS background-image lacks; on
  // failure, fall back to the same gradient a missing image already uses,
  // and throw so the global error handler (error-logger.js) catches and
  // logs it -- same convention as audio.js/cardhero/cardhorizontal.
  if (config.image) {
    const probe = new Image();
    probe.addEventListener('error', () => {
      if (!document.contains(element)) return;
      element.style.backgroundImage = 'linear-gradient(135deg, #667eea, #764ba2)';
      throw new Error(`x-cardoverlay: failed to load image "${config.image}" -- the file is missing or unreachable. Falling back to the default gradient.`);
    });
    probe.src = config.image;
  }
  
  // Use row direction so align-items controls vertical position (as expected by tests)
  element.style.flexDirection = 'row';
  
  if (config.position === 'top') {
    element.style.alignItems = 'flex-start';
  } else if (config.position === 'center') {
    element.style.alignItems = 'center';
  } else {
    element.style.alignItems = 'flex-end';
  }

  // Content
  const content = document.createElement('div');
  content.className = 'x-card__overlay-content';
  content.style.cssText = `padding:1.5rem;color:white;width:100%;text-align:${config.xalign};`;

  if (config.gradient) {
    content.style.background = config.position === 'top'
      ? 'linear-gradient(to bottom, rgba(0,0,0,0.7), transparent)'
      : 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)';
  }

  // Variant tint -- applied after the gradient so a non-default variant's
  // tint (or backdrop-filter, for blur) always wins over the plain gradient.
  if (config.variant === 'dark') {
    content.style.background = 'rgba(0,0,0,0.65)';
  } else if (config.variant === 'light') {
    content.style.background = 'rgba(255,255,255,0.85)';
    content.style.color = '#111827';
  } else if (config.variant === 'blur') {
    content.style.background = 'rgba(0,0,0,0.35)';
    content.style.backdropFilter = 'blur(8px)';
    content.style.webkitBackdropFilter = 'blur(8px)';
  }

  if (base.config.title) {
    const titleEl = document.createElement('h3');
    titleEl.className = 'x-card__title x-card__overlay-title';
    titleEl.style.cssText = 'margin:0;font-size:1.5rem;text-shadow:0 2px 4px rgba(0,0,0,0.5);';
    titleEl.textContent = base.config.title;
    content.appendChild(titleEl);
  }

  if (base.config.subtitle) {
    const subtitleEl = document.createElement('div');
    subtitleEl.className = 'x-card__subtitle x-card__overlay-subtitle';
    subtitleEl.style.cssText = 'margin:0.5rem 0;opacity:0.9;text-shadow:0 1px 2px rgba(0,0,0,0.5);';
    subtitleEl.textContent = base.config.subtitle;
    content.appendChild(subtitleEl);
  }

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
    expanded: parseBoolean(options.expanded) ?? (readAttr(element, 'expanded') === 'true' || element.getAttribute('expanded') === 'true' || (readFlag(element, 'expanded') && readAttr(element, 'expanded') !== 'false') || element.hasAttribute('expanded')),
    maxHeight: options.maxHeight || readAttr(element, 'maxHeight') || element.getAttribute('max-height') || '100px',
    // #435: a pixel maxHeight truncates text mid-line, which looks broken
    // for arbitrary content -- `lines` clamps to exactly N full lines via
    // CSS line-clamp instead. An alternative to maxHeight, not a
    // replacement: maxHeight still applies as-is for non-text/mixed content
    // where line-clamp doesn't make sense (images, nested cards, ...). When
    // both are set, `lines` wins for the collapsed state.
    lines: options.lines || readAttr(element, 'lines') || element.getAttribute('lines') || null,
    ...options
  };

  const base = composeCard(element, { ...config, behavior: 'cardexpandable' });
  element.classList.add('x-card-expandable');
  element.innerHTML = '';

  // Build header
  if (base.config.title || base.config.subtitle) {
    element.appendChild(base.createHeader());
  }

  // Applies/removes a line-clamp on `el` -- shared by initial render and toggle().
  const applyLineClamp = (el, lineCount) => {
    if (lineCount) {
      el.style.display = '-webkit-box';
      el.style.webkitBoxOrient = 'vertical';
      el.style.webkitLineClamp = String(lineCount);
      el.style.overflow = 'hidden';
    } else {
      el.style.display = 'block';
      el.style.webkitBoxOrient = '';
      el.style.webkitLineClamp = '';
      el.style.overflow = 'visible';
    }
  };

  // Content
  const contentWrap = document.createElement('main');
  contentWrap.className = 'x-card__expandable-content';
  if (config.lines) {
    contentWrap.style.cssText = 'padding:1rem;';
    applyLineClamp(contentWrap, config.expanded ? null : config.lines);
  } else {
    contentWrap.style.cssText = `padding:1rem;overflow:hidden;transition:max-height 0.3s ease;max-height:${config.expanded ? '1000px' : config.maxHeight};`;
  }
  contentWrap.innerHTML = base.config.content || rawContent || '<div style="margin:0;color:var(--text-secondary);">Add content here...</div>';
  // Generate ID for aria-controls
  const contentId = 'expandable-content-' + Math.random().toString(36).substr(2, 9);
  contentWrap.id = contentId;
  element.appendChild(contentWrap);

  // Expand button
  const btnWrap = document.createElement('footer');
  btnWrap.className = 'x-card__footer';
  btnWrap.style.cssText = 'padding:0.75rem 1rem;border-top:1px solid var(--border-color,#374151);';

  const btn = document.createElement('button');
  btn.className = 'x-card__expand-btn';
  btn.style.cssText = 'width:100%;padding:0.5rem;background:var(--bg-tertiary,#374151);border:none;border-radius:6px;color:var(--text-primary,#f9fafb);cursor:pointer;display:flex;align-items:center;justify-content:center;gap:0.5rem;';
  btn.setAttribute('aria-expanded', config.expanded);
  btn.setAttribute('aria-controls', contentId);
  
  const icon = document.createElement('span');
  icon.className = 'x-card__expand-icon';
  if (config.expanded) icon.classList.add('x-card__expand-icon--expanded');
  icon.textContent = '▼';
  icon.style.display = 'inline-block';
  icon.style.transition = 'transform 0.3s ease';
  if (config.expanded) icon.style.transform = 'rotate(180deg)';
  btn.appendChild(icon);

  const text = document.createElement('span');
  text.className = 'x-card__expand-text';
  text.textContent = config.expanded ? 'Show Less' : 'Show More';
  btn.appendChild(text);

  let isExpanded = config.expanded;
  if (isExpanded) element.classList.add('x-card--expanded');
  
  const toggle = () => {
    isExpanded = !isExpanded;
    if (config.lines) {
      applyLineClamp(contentWrap, isExpanded ? null : config.lines);
    } else {
      contentWrap.style.maxHeight = isExpanded ? '1000px' : config.maxHeight;
    }
    icon.style.transform = isExpanded ? 'rotate(180deg)' : 'rotate(0deg)';
    icon.classList.toggle('x-card__expand-icon--expanded', isExpanded);
    text.textContent = isExpanded ? 'Show Less' : 'Show More';
    element.classList.toggle('x-card--expanded', isExpanded);
    btn.setAttribute('aria-expanded', isExpanded);
    element.dispatchEvent(new CustomEvent('wb:cardexpandable:toggle', { 
      bubbles: true, 
      detail: { expanded: isExpanded } 
    }));
  };

  btn.onclick = toggle;
  
  // Keyboard support
  btn.onkeydown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggle();
    }
  };

  btnWrap.appendChild(btn);
  element.appendChild(btnWrap);

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

  return base.cleanup;
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
    minimized: parseBoolean(options.minimized) ?? (readAttr(element, 'minimized') === 'true' || element.getAttribute('minimized') === 'true' || (readFlag(element, 'minimized') && readAttr(element, 'minimized') !== 'false') || element.hasAttribute('minimized')),
    ...options
  };

  const base = composeCard(element, { ...config, behavior: 'cardminimizable' });
  element.classList.add('x-card-minimizable');
  element.classList.add('x-card--minimizable'); // Explicitly add for compliance
  element.innerHTML = '';

  // Header with minimize button
  const header = document.createElement('header');
  // card.css targets the tag, not a class.
  header.style.cssText = 'padding:1rem;border-bottom:1px solid var(--border-color,#374151);background:var(--bg-tertiary,#1e293b);display:flex;align-items:center;gap:0.75rem;';

  const titleWrap = document.createElement('div');
  titleWrap.className = 'x-card__title-wrap';

  if (base.config.title) {
    const titleEl = document.createElement('h3');
    
    titleEl.style.cssText = 'margin:0;color:var(--text-primary,#f9fafb);';
    titleEl.textContent = base.config.title;
    titleWrap.appendChild(titleEl);
  }

  if (base.config.subtitle) {
    const subtitleEl = document.createElement('div');
    
    subtitleEl.style.cssText = 'margin:0.25rem 0 0.5rem;color:var(--text-secondary,#9ca3af);font-size:0.85rem;';
    subtitleEl.textContent = base.config.subtitle;
    titleWrap.appendChild(subtitleEl);
  }

  header.appendChild(titleWrap);

  // Minimize button
  const minBtn = document.createElement('button');
  minBtn.className = 'x-card__minimize-btn';
  minBtn.style.cssText = 'width:32px;height:32px;background:var(--bg-secondary,#1f2937);border:1px solid var(--border-color,#374151);border-radius:6px;color:var(--text-primary,#f9fafb);font-size:1.25rem;cursor:pointer;display:flex;align-items:center;justify-content:center;';
  minBtn.textContent = config.minimized ? '+' : '−';
  header.appendChild(minBtn);

  element.appendChild(header);

  // Content
  const content = document.createElement('main');
  content.className = 'x-card__minimizable-content';
  content.style.cssText = `padding:1rem;overflow:hidden;transition:all 0.3s ease;${config.minimized ? 'max-height:0;padding:0 1rem;opacity:0;' : ''}`;
  content.innerHTML = base.config.content || rawContent || '<div style="margin:0;color:var(--text-secondary);">Add content here...</div>';
  element.appendChild(content);

  // Toggle
  let isMinimized = config.minimized;
  if (isMinimized) element.classList.add('x-card--minimized');

  const toggle = () => {
    isMinimized = !isMinimized;
    content.style.maxHeight = isMinimized ? '0' : '1000px';
    content.style.padding = isMinimized ? '0 1rem' : '1rem';
    content.style.opacity = isMinimized ? '0' : '1';
    minBtn.textContent = isMinimized ? '+' : '−';
    minBtn.setAttribute('aria-expanded', !isMinimized);
    minBtn.setAttribute('aria-label', isMinimized ? 'Expand' : 'Minimize');
    element.classList.toggle('x-card--minimized', isMinimized);
    
    // Update footer visibility if it exists
    const footerEl = element.querySelector('.x-card__footer');
    if (footerEl) {
      footerEl.style.display = isMinimized ? 'none' : '';
    }

    element.dispatchEvent(new CustomEvent('wb:cardminimizable:toggle', { 
      bubbles: true, 
      detail: { minimized: isMinimized } 
    }));
  };

  minBtn.setAttribute('aria-expanded', !config.minimized);
  minBtn.setAttribute('aria-label', config.minimized ? 'Expand' : 'Minimize');
  minBtn.onclick = toggle;
  
  // Keyboard support
  minBtn.onkeydown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggle();
    }
  };

  // Footer
  if (base.config.footer) {
    const minimizableFooterEl = base.createFooter();
    minimizableFooterEl.style.display = isMinimized ? 'none' : '';
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
    constrain: options.constrain || readAttr(element, 'constrain') || element.getAttribute('constrain') || 'none',
    axis: options.axis || readAttr(element, 'axis') || element.getAttribute('axis') || 'both',
    snapToGrid: parseInt(options.snapToGrid || readAttr(element, 'snapToGrid') || element.getAttribute('snap-to-grid') || 0),
    content: options.content || readAttr(element, 'content') || rawContent,
    ...options
  };

  const base = composeCard(element, { ...config, behavior: 'carddraggable', hoverable: false });
  element.classList.add('x-card-draggable');
  
  element.innerHTML = '';
  // Only set position if not already positioned (absolute/fixed)
  const computed = window.getComputedStyle(element);
  if (computed.position === 'static') {
    element.style.position = 'relative';
  }
  element.classList.add('x-card--draggable');

  // Header with drag handle
  const headerEl = document.createElement('header');
  headerEl.className = 'x-card__header x-card__drag-handle';
  headerEl.style.cssText = 'padding:1rem;border-bottom:1px solid var(--border-color,#374151);background:var(--bg-tertiary,#1e293b);cursor:grab;display:flex;align-items:center;gap:0.5rem;';
  headerEl.setAttribute('aria-label', 'Drag to move card');
  headerEl.setAttribute('role', 'button');

  const handleIcon = document.createElement('span');
  handleIcon.style.cssText = 'opacity:0.5;';
  handleIcon.textContent = '⋮⋮';
  headerEl.appendChild(handleIcon);

  if (base.config.title) {
    const titleEl = document.createElement('h3');
    
    titleEl.style.cssText = 'margin:0;flex:1;color:var(--text-primary,#f9fafb);';
    titleEl.textContent = base.config.title;
    headerEl.appendChild(titleEl);
  }

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

  // Read current CSS left/top (works for both relative and absolute positioning)
  const getCurrentLeft = () => parseInt(element.style.left, 10) || 0;
  const getCurrentTop = () => parseInt(element.style.top, 10) || 0;

  const onMouseDown = (e) => {
    if (e.button !== 0) return; // Left click only
    e.preventDefault(); // Prevent text selection
    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
    // Read the current CSS left/top values, NOT offsetLeft/offsetTop
    // offsetLeft includes the element's normal flow position which causes
    // a massive jump when applied back as left/top on a relative element
    initialLeft = getCurrentLeft();
    initialTop = getCurrentTop();
    
    headerEl.style.cursor = 'grabbing';
    element.classList.add('x-card--dragging');
    element.style.opacity = '0.8';
    element.style.zIndex = '1000';
    
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
    
    element.style.left = newX + 'px';
    element.style.top = newY + 'px';
    
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
      headerEl.style.cursor = 'grab';
      element.classList.remove('x-card--dragging');
      element.style.opacity = '';
      element.style.zIndex = '';
      
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
    setPosition: (x, y) => {
      element.style.left = x + 'px';
      element.style.top = y + 'px';
    },
    getPosition: () => ({
      x: parseInt(element.style.left || 0),
      y: parseInt(element.style.top || 0)
    }),
    reset: () => {
      element.style.left = '';
      element.style.top = '';
    }
  };

  // Cleanup
  const originalCleanup = base.cleanup;
  return () => {
    originalCleanup();
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
    name: options.name || readAttr(element, 'name') || element.getAttribute('name'),
    title: options.title || readAttr(element, 'title') || element.getAttribute('title'),
    company: options.company || readAttr(element, 'company') || element.getAttribute('company'),
    location: options.location || readAttr(element, 'location') || element.getAttribute('location'),
    tagline: options.tagline || readAttr(element, 'tagline') || element.getAttribute('tagline'),
    availability: options.availability || readAttr(element, 'availability') || element.getAttribute('availability') || 'available',
    
    // Media
    avatar: options.avatar || readAttr(element, 'avatar') || element.getAttribute('avatar'),
    cover: options.cover || readAttr(element, 'cover') || element.getAttribute('cover'),
    bio: options.bio || readAttr(element, 'bio') || element.getAttribute('bio'),
    
    // Contact
    email: options.email || readAttr(element, 'email') || element.getAttribute('email'),
    phone: options.phone || readAttr(element, 'phone') || element.getAttribute('phone'),
    website: options.website || readAttr(element, 'website') || element.getAttribute('website'),
    
    // Social
    linkedin: options.linkedin || readAttr(element, 'linkedin') || element.getAttribute('linkedin'),
    twitter: options.twitter || readAttr(element, 'twitter') || element.getAttribute('twitter'),
    github: options.github || readAttr(element, 'github') || element.getAttribute('github'),
    dribbble: options.dribbble || readAttr(element, 'dribbble') || element.getAttribute('dribbble'),
    
    // Skills & Experience
    skills: options.skills || readAttr(element, 'skills') || element.getAttribute('skills'),
    skillLevels: parseJSON(options.skillLevels || readAttr(element, 'skillLevels') || element.getAttribute('skill-levels')),
    experience: parseJSON(options.experience || readAttr(element, 'experience') || element.getAttribute('experience')),
    education: parseJSON(options.education || readAttr(element, 'education') || element.getAttribute('education')),
    projects: parseJSON(options.projects || readAttr(element, 'projects') || element.getAttribute('projects')),
    certifications: options.certifications || readAttr(element, 'certifications') || element.getAttribute('certifications'),
    languages: options.languages || readAttr(element, 'languages') || element.getAttribute('languages'),
    stats: parseJSON(options.stats || readAttr(element, 'stats') || element.getAttribute('stats')),
    
    // CTA
    cta: options.cta || readAttr(element, 'cta') || element.getAttribute('cta'),
    ctaHref: options.ctaHref || readAttr(element, 'ctaHref') || element.getAttribute('cta-href'),
    
    // Variant
    variant: options.variant || readAttr(element, 'variant') || element.getAttribute('variant') || 'default',
    size: options.size || readAttr(element, 'size') || element.getAttribute('size') || 'auto',
    ...options
  };

  const base = composeCard(element, { ...config, behavior: 'cardportfolio', hoverable: false });
  element.classList.add('x-portfolio');
  if (config.variant !== 'default') {
    element.classList.add(`x-portfolio--${config.variant}`);
  }
  element.innerHTML = '';
  
  // Size handling. compact/horizontal have their own CSS-driven max-width
  // (card.css `.x-portfolio.x-portfolio--compact` / `--horizontal`,
  // specificity 0,2,0) -- setting an inline default here for those variants
  // would force !important to let that CSS win (same "inline always beats
  // class" issue documented throughout this file), so skip the inline
  // default for them and let card.css own their width.
  if (config.variant === 'full') {
    element.style.maxWidth = '800px';
  } else if (config.size === 'auto' && config.variant !== 'compact' && config.variant !== 'horizontal') {
    element.style.maxWidth = '400px';
  }

  // Availability colors
  const availabilityConfig = {
    'available': { color: '#22c55e', label: 'Available for work', icon: '🟢' },
    'busy': { color: '#f59e0b', label: 'Currently busy', icon: '🟡' },
    'not-available': { color: '#ef4444', label: 'Not available', icon: '🔴' },
    'open-to-opportunities': { color: '#3b82f6', label: 'Open to opportunities', icon: '🔵' }
  };

  // ==================== COVER ====================
  if (config.cover) {
    const coverFigure = document.createElement('figure');
    coverFigure.className = 'x-portfolio__cover';
    coverFigure.style.cssText = `margin:0;height:150px;background-image:url(${config.cover});background-size:cover;background-position:center;position:relative;`;
    element.appendChild(coverFigure);
  }

  // ==================== HEADER ====================
  const header = document.createElement('header');
  header.className = 'x-portfolio__header';
  // The <header> also inherits the generic .x-header navbar rule
  // (display:flex; height:60px; fixed bg + border-bottom + 0.8em font). The
  // flex squeezed the avatar into a column and the fixed 60px height clipped
  // the header so its 120px avatar + text overflowed onto the sections below.
  // display/text-align/padding now live in card.css's compound
  // `.x-portfolio__header.x-header` rule (0,2,0 always outranks the plain
  // .x-header selector's 0,1,0 -- same pattern as .x-card__footer.x-footer
  // above) instead of being forced inline, so the compact/horizontal/full/
  // size-scaling CSS below can override the default padding/display without
  // needing !important. Only the properties nothing else needs to override
  // (height/background/border-bottom/font-size, plus the cover offset) stay
  // inline.
  header.style.cssText = `height:auto;min-height:0;background:transparent;border-bottom:none;font-size:1rem;${config.cover ? 'margin-top:-60px;' : ''}`;

  // Avatar (real image, OR a fallback initials placeholder). This block used
  // to be gated on `config.avatar` alone, which meant the availability dot
  // -- built inside it -- silently never rendered for the (very common) case
  // of a portfolio card with no avatar image, even though `availability`
  // defaults to 'available' (cardportfolio.schema.json) and is meant to
  // always be visible. Build the wrap whenever there's an avatar image OR an
  // availability status to show, and fall back to an initials circle so the
  // dot always has something to attach to.
  if (config.avatar || (config.availability && availabilityConfig[config.availability])) {
    const avatarWrap = document.createElement('figure');
    avatarWrap.className = 'x-portfolio__avatar-wrap';
    // margin/position/display now live in card.css's `.x-portfolio__avatar-wrap`
    // base rule -- kept out of inline so the horizontal variant's own margin
    // override (card.css) can win by normal cascade instead of !important.

    if (config.avatar) {
      const avatarImg = document.createElement('img');
      avatarImg.className = 'x-portfolio__avatar';
      avatarImg.src = config.avatar;
      avatarImg.alt = config.name || 'Avatar';
      // width/height/border-radius/border/object-fit/display now live in
      // card.css's `.x-portfolio__avatar` base rule -- see the comment on
      // avatarWrap above; same reason (lets compact/full/size-scaling CSS
      // resize the avatar without !important).
      // #556: deliberately overlaps .x-portfolio__cover -- the `header`
      // above gets `margin-top:-60px` exactly when config.cover is set,
      // pulling this avatar up to straddle the cover photo's bottom edge
      // (the standard social-profile "avatar over cover" layout, same
      // pattern LinkedIn/Twitter/Facebook headers use). no-element-overlap
      // .spec.ts (#540) already flagged this pair on demos/site/cards.html
      // as "probable-but-unconfirmed intentional" without a source read to
      // confirm it; the -60px margin above confirms it's deliberate, not a
      // layout bug.
      if (config.cover) avatarImg.setAttribute('data-allow-overlap', '');
      avatarWrap.appendChild(avatarImg);
    } else {
      // No avatar image supplied — render initials (or a generic mark) in a
      // themed circle (styling in card.css: .x-portfolio__avatar-placeholder,
      // Law 9) so the availability dot below still has a visible anchor.
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

    // Availability indicator
    if (config.availability && availabilityConfig[config.availability]) {
      const availDot = document.createElement('span');
      availDot.className = 'x-portfolio__availability';
      availDot.title = availabilityConfig[config.availability].label;
      // position/size/border/cursor now live in card.css's
      // `.x-portfolio__availability` base rule -- only `background` stays
      // inline since it's the one genuinely per-instance value (the status
      // color), matching the same only-inline-what's-dynamic pattern
      // `setAvailability()` below already uses. Keeping the rest out of
      // inline lets the compact variant's smaller-dot CSS override them
      // without !important.
      availDot.style.background = availabilityConfig[config.availability].color;
      avatarWrap.appendChild(availDot);
    }

    header.appendChild(avatarWrap);
  }

  // Name
  if (config.name) {
    const nameEl = document.createElement('h2');
    nameEl.className = 'x-portfolio__name';
    // margin/font-size/color/white-space/overflow/max-width now live in
    // card.css's `.x-portfolio__name` base rule -- see the avatarWrap
    // comment above; lets compact/horizontal/full/size-scaling CSS resize
    // or rewrap the name without !important.
    nameEl.textContent = config.name;
    header.appendChild(nameEl);
  }

  // Title & Company
  if (config.title) {
    const titleEl = document.createElement('div');
    titleEl.className = 'x-portfolio__title';
    titleEl.style.cssText = 'margin:0.25rem 0 0;color:var(--primary,#6366f1);font-weight:600;font-size:1.1rem;';
    titleEl.textContent = config.title + (config.company ? ` at ${config.company}` : '');
    header.appendChild(titleEl);
  } else if (config.company) {
    const companyEl = document.createElement('div');
    companyEl.className = 'x-portfolio__company';
    companyEl.style.cssText = 'margin:0.25rem 0 0;color:var(--text-secondary,#9ca3af);';
    companyEl.textContent = config.company;
    header.appendChild(companyEl);
  }

  // Location
  if (config.location) {
    const locEl = document.createElement('div');
    locEl.className = 'x-portfolio__location';
    locEl.style.cssText = 'margin:0.5rem 0 0;color:var(--text-secondary,#9ca3af);font-size:0.9rem;';
    locEl.textContent = `📍 ${config.location}`;
    header.appendChild(locEl);
  }

  // Tagline
  if (config.tagline) {
    const tagEl = document.createElement('div');
    tagEl.className = 'x-portfolio__tagline';
    tagEl.style.cssText = 'margin:0.75rem 0 0;color:var(--text-secondary,#9ca3af);font-style:italic;font-size:0.95rem;';
    tagEl.textContent = `"${config.tagline}"`;
    header.appendChild(tagEl);
  }

  element.appendChild(header);

  // ==================== MAIN CONTENT ====================
  const main = document.createElement('main');
  main.className = 'x-portfolio__main';
  // padding now lives in card.css's `.x-portfolio__main` base rule -- see
  // the avatarWrap comment above; lets the compact variant's own padding
  // override win without !important.

  // Bio Section
  if (config.bio) {
    const bioSection = document.createElement('section');
    bioSection.className = 'x-portfolio__bio';
    bioSection.style.cssText = 'margin-bottom:1.5rem;';
    
    const bioText = document.createElement('div');
    bioText.style.cssText = 'margin:0;color:var(--text-primary,#f9fafb);font-size:0.95rem;line-height:1.7;';
    bioText.textContent = config.bio;
    bioSection.appendChild(bioText);
    main.appendChild(bioSection);
  }

  // Stats Section
  if (config.stats && config.stats.length > 0) {
    const statsSection = document.createElement('section');
    statsSection.className = 'x-portfolio__stats';
    statsSection.style.cssText = 'display:flex;flex-direction:column;gap:0.5rem;padding:1rem;background:var(--bg-tertiary,#374151);border-radius:8px;margin-bottom:1.5rem;';
    
    config.stats.forEach(stat => {
      const statItem = document.createElement('div');
      statItem.style.cssText = 'display:flex;align-items:baseline;gap:0.5rem;';
      
      const valueEl = document.createElement('span');
      valueEl.style.cssText = 'font-size:1.25rem;font-weight:700;color:var(--primary,#6366f1);';
      valueEl.textContent = stat.value;
      statItem.appendChild(valueEl);
      
      const labelEl = document.createElement('span');
      labelEl.style.cssText = 'font-size:0.85rem;color:var(--text-secondary,#9ca3af);';
      labelEl.textContent = stat.label;
      statItem.appendChild(labelEl);
      
      statsSection.appendChild(statItem);
    });
    main.appendChild(statsSection);
  }

  // Skills Section
  if (config.skills || config.skillLevels) {
    const skillsSection = document.createElement('section');
    skillsSection.className = 'x-portfolio__skills';
    skillsSection.style.cssText = 'margin-bottom:1.5rem;';
    
    const skillsTitle = document.createElement('h3');
    skillsTitle.style.cssText = 'margin:0 0 0.75rem;font-size:0.9rem;font-weight:600;color:var(--text-secondary,#9ca3af);text-transform:uppercase;letter-spacing:0.05em;';
    skillsTitle.textContent = '🛠️ Skills';
    skillsSection.appendChild(skillsTitle);

    // Skill pills (from comma-separated string)
    if (config.skills) {
      const skillPills = document.createElement('div');
      skillPills.style.cssText = 'display:flex;flex-wrap:wrap;gap:0.5rem;';
      
      config.skills.split(',').forEach(skill => {
        const pill = document.createElement('span');
        pill.style.cssText = 'padding:0.35rem 0.75rem;background:var(--bg-tertiary,#374151);color:var(--text-primary,#f9fafb);border-radius:999px;font-size:0.85rem;';
        pill.textContent = skill.trim();
        skillPills.appendChild(pill);
      });
      skillsSection.appendChild(skillPills);
    }

    // Skill bars (from JSON array)
    if (config.skillLevels && config.skillLevels.length > 0) {
      const skillBars = document.createElement('div');
      skillBars.style.cssText = 'margin-top:0.75rem;';
      
      config.skillLevels.forEach(skill => {
        const skillRow = document.createElement('div');
        skillRow.style.cssText = 'margin-bottom:0.5rem;';
        
        const skillHeader = document.createElement('div');
        skillHeader.style.cssText = 'display:flex;justify-content:space-between;margin-bottom:0.25rem;font-size:0.85rem;';
        skillHeader.innerHTML = `<span style="color:var(--text-primary,#f9fafb);">${skill.name}</span><span style="color:var(--text-secondary,#9ca3af);">${skill.level}%</span>`;
        skillRow.appendChild(skillHeader);
        
        const barBg = document.createElement('div');
        barBg.style.cssText = 'height:6px;background:var(--bg-tertiary,#374151);border-radius:3px;overflow:hidden;';
        
        const barFill = document.createElement('div');
        barFill.style.cssText = `width:${skill.level}%;height:100%;background:var(--primary,#6366f1);border-radius:3px;transition:width 0.5s ease;`;
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
    const expSection = document.createElement('section');
    expSection.className = 'x-portfolio__experience';
    expSection.style.cssText = 'margin-bottom:1.5rem;';
    
    const expTitle = document.createElement('h3');
    expTitle.style.cssText = 'margin:0 0 0.75rem;font-size:0.9rem;font-weight:600;color:var(--text-secondary,#9ca3af);text-transform:uppercase;letter-spacing:0.05em;';
    expTitle.textContent = '💼 Experience';
    expSection.appendChild(expTitle);

    config.experience.forEach((exp, i) => {
      const expItem = document.createElement('div');
      expItem.style.cssText = `padding:0.75rem 0;${i > 0 ? 'border-top:1px solid var(--border-color,#374151);' : ''}`;
      
      const expHeader = document.createElement('div');
      expHeader.style.cssText = 'display:flex;justify-content:space-between;align-items:flex-start;gap:0.5rem;flex-wrap:wrap;';
      
      const expRole = document.createElement('strong');
      expRole.style.cssText = 'color:var(--text-primary,#f9fafb);';
      expRole.textContent = exp.role || exp.title;
      expHeader.appendChild(expRole);
      
      if (exp.period) {
        const expPeriod = document.createElement('span');
        expPeriod.style.cssText = 'color:var(--text-secondary,#9ca3af);font-size:0.85rem;';
        expPeriod.textContent = exp.period;
        expHeader.appendChild(expPeriod);
      }
      expItem.appendChild(expHeader);
      
      if (exp.company) {
        const expCompany = document.createElement('div');
        expCompany.style.cssText = 'color:var(--primary,#6366f1);font-size:0.9rem;margin-top:0.25rem;';
        expCompany.textContent = exp.company;
        expItem.appendChild(expCompany);
      }
      
      if (exp.description) {
        const expDesc = document.createElement('div');
        expDesc.style.cssText = 'margin:0.5rem 0 0;color:var(--text-secondary,#9ca3af);font-size:0.9rem;line-height:1.5;';
        expDesc.textContent = exp.description;
        expItem.appendChild(expDesc);
      }
      
      expSection.appendChild(expItem);
    });
    main.appendChild(expSection);
  }

  // Education Section
  if (config.education && config.education.length > 0) {
    const eduSection = document.createElement('section');
    eduSection.className = 'x-portfolio__education';
    eduSection.style.cssText = 'margin-bottom:1.5rem;';
    
    const eduTitle = document.createElement('h3');
    eduTitle.style.cssText = 'margin:0 0 0.75rem;font-size:0.9rem;font-weight:600;color:var(--text-secondary,#9ca3af);text-transform:uppercase;letter-spacing:0.05em;';
    eduTitle.textContent = '🎓 Education';
    eduSection.appendChild(eduTitle);

    config.education.forEach(edu => {
      const eduItem = document.createElement('div');
      eduItem.style.cssText = 'padding:0.5rem 0;';
      
      const eduDegree = document.createElement('strong');
      eduDegree.style.cssText = 'color:var(--text-primary,#f9fafb);display:block;';
      eduDegree.textContent = edu.degree;
      eduItem.appendChild(eduDegree);
      
      const eduSchool = document.createElement('span');
      eduSchool.style.cssText = 'color:var(--text-secondary,#9ca3af);font-size:0.9rem;';
      eduSchool.textContent = edu.school + (edu.year ? ` • ${edu.year}` : '');
      eduItem.appendChild(eduSchool);
      
      eduSection.appendChild(eduItem);
    });
    main.appendChild(eduSection);
  }

  // Projects Section
  if (config.projects && config.projects.length > 0) {
    const projSection = document.createElement('section');
    projSection.className = 'x-portfolio__projects';
    projSection.style.cssText = 'margin-bottom:1.5rem;';
    
    const projTitle = document.createElement('h3');
    projTitle.style.cssText = 'margin:0 0 0.75rem;font-size:0.9rem;font-weight:600;color:var(--text-secondary,#9ca3af);text-transform:uppercase;letter-spacing:0.05em;';
    projTitle.textContent = '🚀 Projects';
    projSection.appendChild(projTitle);

    const projGrid = document.createElement('div');
    projGrid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:1rem;';

    config.projects.forEach(proj => {
      const projCard = document.createElement('a');
      projCard.href = proj.url || '#';
      projCard.target = proj.url ? '_blank' : '_self';
      projCard.style.cssText = 'display:block;background:var(--bg-tertiary,#374151);border-radius:8px;overflow:hidden;text-decoration:none;transition:transform 0.2s,box-shadow 0.2s;';
      projCard.onmouseenter = () => { projCard.style.transform = 'translateY(-2px)'; projCard.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)'; };
      projCard.onmouseleave = () => { projCard.style.transform = ''; projCard.style.boxShadow = ''; };
      
      if (proj.image) {
        const projImg = document.createElement('img');
        projImg.src = proj.image;
        projImg.alt = proj.name;
        projImg.style.cssText = 'width:100%;height:100px;object-fit:cover;';
        projCard.appendChild(projImg);
      }
      
      const projInfo = document.createElement('div');
      projInfo.style.cssText = 'padding:0.75rem;';
      
      const projName = document.createElement('strong');
      projName.style.cssText = 'color:var(--text-primary,#f9fafb);display:block;margin-bottom:0.25rem;';
      projName.textContent = proj.name;
      projInfo.appendChild(projName);
      
      if (proj.description) {
        const projDesc = document.createElement('span');
        projDesc.style.cssText = 'color:var(--text-secondary,#9ca3af);font-size:0.8rem;';
        projDesc.textContent = proj.description;
        projInfo.appendChild(projDesc);
      }
      
      projCard.appendChild(projInfo);
      projGrid.appendChild(projCard);
    });
    
    projSection.appendChild(projGrid);
    main.appendChild(projSection);
  }

  // Certifications
  if (config.certifications) {
    const certSection = document.createElement('section');
    certSection.className = 'x-portfolio__certifications';
    certSection.style.cssText = 'margin-bottom:1.5rem;';
    
    const certTitle = document.createElement('h3');
    certTitle.style.cssText = 'margin:0 0 0.75rem;font-size:0.9rem;font-weight:600;color:var(--text-secondary,#9ca3af);text-transform:uppercase;letter-spacing:0.05em;';
    certTitle.textContent = '🏆 Certifications';
    certSection.appendChild(certTitle);
    
    const certList = document.createElement('ul');
    certList.style.cssText = 'margin:0;padding-left:1.25rem;color:var(--text-primary,#f9fafb);font-size:0.9rem;';
    
    config.certifications.split(',').forEach(cert => {
      const li = document.createElement('li');
      li.style.cssText = 'margin-bottom:0.25rem;';
      li.textContent = cert.trim();
      certList.appendChild(li);
    });
    certSection.appendChild(certList);
    main.appendChild(certSection);
  }

  // Languages
  if (config.languages) {
    const langSection = document.createElement('section');
    langSection.className = 'x-portfolio__languages';
    langSection.style.cssText = 'margin-bottom:1.5rem;';
    
    const langTitle = document.createElement('h3');
    langTitle.style.cssText = 'margin:0 0 0.75rem;font-size:0.9rem;font-weight:600;color:var(--text-secondary,#9ca3af);text-transform:uppercase;letter-spacing:0.05em;';
    langTitle.textContent = '🌐 Languages';
    langSection.appendChild(langTitle);
    
    const langPills = document.createElement('div');
    langPills.style.cssText = 'display:flex;flex-wrap:wrap;gap:0.5rem;';
    
    config.languages.split(',').forEach(lang => {
      const langPill = document.createElement('span');
      langPill.style.cssText = 'padding:0.35rem 0.75rem;background:var(--bg-tertiary,#374151);color:var(--text-primary,#f9fafb);border-radius:999px;font-size:0.85rem;';
      langPill.textContent = lang.trim();
      langPills.appendChild(langPill);
    });
    langSection.appendChild(langPills);
    main.appendChild(langSection);
  }

  element.appendChild(main);

  // ==================== CONTACT ====================
  if (config.email || config.phone || config.website) {
    const contact = document.createElement('address');
    contact.className = 'x-portfolio__contact';
    contact.style.cssText = 'padding:1rem 1.5rem;border-top:1px solid var(--border-color,#374151);font-style:normal;display:flex;flex-wrap:wrap;gap:1rem;justify-content:center;';

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
        contactLink.style.cssText = 'color:var(--text-primary,#f9fafb);text-decoration:none;font-size:0.9rem;display:flex;align-items:center;gap:0.25rem;';
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
    social.style.cssText = 'padding:1rem 1.5rem;border-top:1px solid var(--border-color,#374151);display:flex;justify-content:center;gap:0.75rem;';

    socialLinks.forEach(({ url, icon, label }) => {
      const socialLink = document.createElement('a');
      socialLink.href = url;
      socialLink.target = '_blank';
      socialLink.title = label;
      socialLink.setAttribute('aria-label', label);
      socialLink.style.cssText = 'width:44px;height:44px;display:flex;align-items:center;justify-content:center;background:var(--bg-tertiary,#374151);border-radius:50%;text-decoration:none;font-size:1.25rem;transition:transform 0.2s,background 0.2s;';
      socialLink.onmouseenter = () => { socialLink.style.transform = 'scale(1.1)'; socialLink.style.background = 'var(--primary,#6366f1)'; };
      socialLink.onmouseleave = () => { socialLink.style.transform = ''; socialLink.style.background = 'var(--bg-tertiary,#374151)'; };
      socialLink.textContent = icon;
      social.appendChild(socialLink);
    });

    element.appendChild(social);
  }

  // ==================== CTA FOOTER ====================
  if (config.cta) {
    const footer = document.createElement('footer');
    footer.className = 'x-portfolio__footer';
    footer.style.cssText = 'padding:1rem 1.5rem;border-top:1px solid var(--border-color,#374151);';
    
    const ctaBtn = document.createElement('a');
    ctaBtn.href = config.ctaHref || '#';
    ctaBtn.className = 'x-portfolio__cta';
    // #561: static layout/padding now lives in card.css's `.x-portfolio__cta`
    // rule (padding:1rem, was inline at 0.875rem/14px -- below the §13
    // minimum). Only the genuinely dynamic hover-state background/transform
    // stay inline, since those are set by JS pointer handlers, not CSS.
    ctaBtn.onmouseenter = () => { ctaBtn.style.background = 'var(--primary-hover,#4f46e5)'; ctaBtn.style.transform = 'translateY(-1px)'; };
    ctaBtn.onmouseleave = () => { ctaBtn.style.background = 'var(--primary,#6366f1)'; ctaBtn.style.transform = ''; };
    ctaBtn.textContent = config.cta;
    footer.appendChild(ctaBtn);
    
    element.appendChild(footer);
  }

  // API
  element.wbPortfolio = {
    setAvailability: (status) => {
      const dot = element.querySelector('.x-portfolio__availability');
      if (dot && availabilityConfig[status]) {
        dot.style.background = availabilityConfig[status].color;
        dot.title = availabilityConfig[status].label;
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
