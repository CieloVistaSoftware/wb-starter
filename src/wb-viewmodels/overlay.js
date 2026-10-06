import { readFlag, readOption, authoredAttr } from '../core/read-attr.js';
import { setRule, clearRules, onlyChanged } from '../core/dynamic-style.js';
/**
 * Overlay Behaviors
 * -----------------------------------------------------------------------------
 * Full-screen or partial overlays like modals, drawers, and lightboxes.
 * Manages z-index, blocking backgrounds, and focus trapping.
 * 
 * Custom Tag: <div>
 * -----------------------------------------------------------------------------
 * 
 * Usage:
 *   <div x-drawer  data-target="#menu">Open Menu</button>
 *   <a href="https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Mountains_in_snow%2C_Mountain_lake%2C_Chola_Valley%2C_Nepal%2C_Himalayas.jpg/1280px-Mountains_in_snow%2C_Mountain_lake%2C_Chola_Valley%2C_Nepal%2C_Himalayas.jpg" x-lightbox>View Image</a>
 * -----------------------------------------------------------------------------
 * All overlays show visual feedback when their trigger is clicked
 */

// #779: the backdrop/dialog declarations confirm() and prompt() shared used to
// live here as cssText strings; they are .x-overlay-dialog and
// .x-overlay-dialog__box in src/styles/behaviors/overlays.css now.

/**
 * Popover - Click-triggered popup
 * Custom Tag: <div>
 */
export function popover(element, options = {}) {
  const config = {
    content: options.content || authoredAttr(element, 'popover-content') || element.getAttribute('description') || '',
    title: options.title || authoredAttr(element, 'popover-title') || element.getAttribute('heading') || '',
    trigger: options.trigger || element.getAttribute('trigger') || 'click',
    position: options.position || element.getAttribute('position') || 'top',
    ...options
  };

  element.classList.add('x-popover-trigger');
  // NOT '.x-popover' — that class is popover.css's styling for the
  // dynamically-created CONTENT PANEL (position:absolute; z-index:1000),
  // reused here by name collision on the TRIGGER too. That yanked the
  // trigger out of normal document flow onto whatever absolute position
  // its (unpositioned) ancestor computed, landing it on top of unrelated
  // nearby content — e.g. covering the very next sibling's click target.
  let popoverEl = null;
  const popoverId = `x-popover-${Math.random().toString(36).slice(2, 9)}`;

  // #209: a popover opening/closing was invisible to assistive tech — no
  // role, no announcement, no link between trigger and content. aria-haspopup
  // is static (always true, describes what clicking DOES); aria-expanded
  // reflects live open/closed state; aria-controls links trigger -> panel.
  element.setAttribute('aria-haspopup', 'dialog');
  element.setAttribute('aria-expanded', 'false');

  const show = () => {
    if (popoverEl) return;
    popoverEl = document.createElement('div');
    // x-popover--floating: popover.css's fixed, themed panel (#779 -- was
    // a style.cssText block here).
    popoverEl.className = `x-popover x-popover--floating x-popover--${config.position}`;
    popoverEl.id = popoverId;
    popoverEl.setAttribute('role', 'dialog');
    popoverEl.setAttribute('aria-label', config.title || config.content);
    popoverEl.innerHTML = `
      ${config.title ? `<div class="x-popover__title">${config.title}</div>` : ''}
      <div>${config.content}</div>
    `;
    document.body.appendChild(popoverEl);
    positionPopover(element, popoverEl, config.position);
    element.setAttribute('aria-expanded', 'true');
    element.setAttribute('aria-controls', popoverId);
  };

  const hide = () => {
    if (popoverEl) {
      clearRules(popoverEl);
      popoverEl.remove();
      popoverEl = null;
      element.setAttribute('aria-expanded', 'false');
      element.removeAttribute('aria-controls');
    }
  };

  if (config.trigger === 'click') {
    element.onclick = () => popoverEl ? hide() : show();
    document.addEventListener('click', (e) => {
      if (popoverEl && !element.contains(e.target) && !popoverEl.contains(e.target)) hide();
    });
  } else if (config.trigger === 'hover') {
    element.onmouseenter = show;
    element.onmouseleave = hide;
  }

  element.wbPopover = { show, hide, toggle: () => popoverEl ? hide() : show() };

  return () => {
    hide();
    element.classList.remove('x-popover-trigger');
    element.removeAttribute('aria-haspopup');
    element.removeAttribute('aria-expanded');
  };
}

function positionPopover(trigger, popover, position) {
  const rect = trigger.getBoundingClientRect();
  let popRect = popover.getBoundingClientRect();
  
  let top, left;
  switch (position) {
    case 'top':
      top = rect.top - popRect.height - 8;
      left = rect.left + (rect.width - popRect.width) / 2;
      break;
    case 'bottom':
      top = rect.bottom + 8;
      left = rect.left + (rect.width - popRect.width) / 2;
      break;
    case 'left':
      top = rect.top + (rect.height - popRect.height) / 2;
      left = rect.left - popRect.width - 8;
      break;
    case 'right':
      top = rect.top + (rect.height - popRect.height) / 2;
      left = rect.right + 8;
      break;
  }
  
  // Standard §15: a popover must never overflow its bounds. It is position:fixed,
  // so clamp top/left to the viewport (with an 8px margin) — a trigger near an edge
  // used to push the popover off-screen / past its card. Also cap its width so a
  // long popover can't be wider than the viewport.
  const margin = 8;
  const vw = document.documentElement.clientWidth;
  const vh = document.documentElement.clientHeight;
  const maxW = vw - margin * 2;
  if (popRect.width > maxW) {
    // Weight 2: outranks popover.css's own max-width on
    // .x-popover.x-popover--floating (0,2,0). A measured value, so a
    // generated rule rather than the style attribute (#779).
    setRule(popover, 'max-width', { maxWidth: `${maxW}px` }, { weight: 2 });
    popRect = popover.getBoundingClientRect();
  }
  left = Math.max(margin, Math.min(left, vw - popRect.width - margin));
  top = Math.max(margin, Math.min(top, vh - popRect.height - margin));

  // position:fixed is the --floating class's; only the computed spot is
  // runtime (#779).
  setRule(popover, 'position', { top: `${top}px`, left: `${left}px` });
}

/**
 * variant="push": translate the page's content aside by the panel's measured
 * size instead of dimming it. Returns what was pushed, for releasePushedPage().
 *
 * The target is the page's `body > .page` wrapper when it has one. Pages
 * without that wrapper (demos/site/*.html render straight into
 * <body class="demo-page">) used to get NO push at all -- the lookup came
 * back null and the variant silently behaved like a backdrop-less overlay.
 * There, every in-flow child of body is pushed instead. Never body or html
 * themselves: the panel is a position:fixed child of body, and a transform on
 * an ancestor becomes the containing block for fixed descendants, so the panel
 * would ride along with the page it is meant to push. Siblings are safe.
 */
function pushPageAside(panel, position, overlayParts) {
  const wrapper = document.querySelector('body > .page');
  const targets = wrapper
    ? [wrapper]
    : Array.from(document.body.children).filter((el) =>
        !overlayParts.includes(el) &&
        !/^(SCRIPT|STYLE|LINK|TEMPLATE)$/.test(el.tagName) &&
        getComputedStyle(el).position !== 'fixed');
  const vertical = position === 'top' || position === 'bottom';
  const rect = panel.getBoundingClientRect();
  const amount = vertical ? rect.height : rect.width;
  const sign = (position === 'right' || position === 'bottom') ? -1 : 1;
  for (const el of targets) {
    // A measured amount, so a generated rule rather than a custom property
    // on the element's style attribute (#779).
    setRule(el, 'drawer-push', { [vertical ? '--x-drawer-push-y' : '--x-drawer-push-x']: `${sign * amount}px` });
    el.classList.add('x-drawer-push-target', 'x-drawer-push-target--open');
  }
  return targets;
}

function releasePushedPage(targets) {
  for (const el of targets) {
    el.classList.remove('x-drawer-push-target--open');
    setRule(el, 'drawer-push', null);
  }
}

/**
 * The drawer's size custom property: height for a top/bottom edge, width for
 * left/right -- whichever the author set away from drawer.css's own default
 * (its var() fallbacks are 320px and auto), so a default is never pinned in a
 * generated rule (#779).
 */
function drawerSize(config) {
  const vertical = config.position === 'top' || config.position === 'bottom';
  return vertical
    ? onlyChanged({ '--x-drawer-height': config.height }, { '--x-drawer-height': 'auto' })
    : onlyChanged({ '--x-drawer-width': config.width }, { '--x-drawer-width': '320px' });
}

/**
 * Drawer - Slide-out panel (works on button click)
 * Custom Tag: <div x-drawer>
 *
 * Two competing DOM owners used to fight over the same <div x-drawer> element
 * (root-caused live): drawer.schema.json's $view builds a real
 * backdrop/panel/header/title/close/body structure INSIDE the host the
 * moment WB.scan() processes it (schema-builder.js), wiping out whatever
 * text the host had (its trigger label, e.g. "Left Drawer") in the process.
 * Separately, tag-map.js maps <div x-drawer> to this behavior, and wb.js's
 * scan() unconditionally calls WB.inject(el, 'drawer') for every x-drawer
 * tag regardless of whether schema already ran -- so this function ALSO
 * used to build its own second, independent backdrop+panel pair on click,
 * appended to document.body, while the schema's copy sat inertly (and
 * invisibly -- see layout.css's `x-drawer { visibility: hidden }` default)
 * inside the host. Result: an empty/malformed trigger box, and (had it ever
 * become visible) two overlays opening per click.
 *
 * Fix: when schema already processed this element (x-schema="drawer"), do
 * NOT build a second structure. Relocate the schema-built
 * .x-drawer__backdrop/.x-drawer__panel out to document.body (so the host
 * keeps its own visible label instead of showing the panel's internal
 * markup) and wire click-to-open/close to that existing DOM instead. Legacy
 * [x-drawer] usage (plain buttons, no x-drawer tag, no schema involved --
 * see tests/integration/drawer-behavior.spec.ts) is untouched: schemaProcessed
 * is never true for those, so they keep building their own DOM exactly as
 * before.
 */
export function drawer(element, options = {}) {
  // v3.0: matches the schemaProcessed-aware pattern used by composeCard()/
  // cardnotification() (card.js) -- options.schemaProcessed is set when
  // WB.inject() is called directly from schema-builder.js's own post-build
  // hook; the x-schema attribute fallback covers the (more common, for this
  // tag) case where scan()'s separate unconditional tag-map injection loop
  // calls WB.inject() without that option, after schema already ran and
  // stamped x-schema="drawer" on the element.
  const schemaProcessed = options.schemaProcessed || element.getAttribute('x-schema');

  // Captured BEFORE the config object below, and before either path runs --
  // neither PATH A nor PATH B ever writes into the host's own textContent
  // (PATH A only relocates the schema-BUILT panel/backdrop out of the host;
  // PATH B never touches `element` at all, it only appends its own
  // drawerEl/backdropEl to document.body) -- confirmed by reading both
  // branches below, so it's safe to read once, up front.
  //
  // Except when the schema has ALREADY run: then the host's textContent is
  // the schema-built panel's own text (title + close glyph + the schema's
  // "this is the content" default), not anything the author wrote. The
  // pre-wipe authored content is what schema-builder.js stashed on
  // _wbOriginalContent, so read that instead -- otherwise PATH A's content
  // fallback below is the panel describing itself.
  const originalText = schemaProcessed && element._wbOriginalContent !== undefined
    ? String(element._wbOriginalContent).trim()
    : (element.textContent || '').trim();

  const authoredContent = options.content || element.getAttribute('content') || authoredAttr(element, 'drawer-content') || element.getAttribute('description') || originalText;

  const config = {
    // Plain title/content match drawer.schema.json's actual property names.
    // drawer-title/drawer-content stay as a fallback for the legacy
    // [x-drawer] attribute usage (plain <button x-drawer drawer-title="…">,
    // e.g. pages/components.html) which predates the schema and never used
    // the schema's naming.
    //
    // No more hardcoded 'Drawer'/'Drawer content' placeholders (#overlays.html
    // live bug: "WTF where did this text come from?"). PATH B builds its own
    // panel from scratch and never reads the host's own text, so every
    // attribute-less demo like `<div x-drawer position="left">position=left</div>`
    // popped open showing the literal, unrelated words "Drawer"/"Drawer
    // content" instead of "position=left". Title now defaults to '' (matches
    // drawer.schema.json's own `"default": ""` and its $view's
    // `"createdWhen": "title"` -- PATH B's show() below skips rendering a
    // header title line entirely when it's empty, same as PATH A already
    // does via the schema). Content falls back to the host's own original
    // text before falling back to the old hardcoded string, so a bare-text
    // demo shows its own words instead of a generic placeholder.
    title: options.title || element.getAttribute('title') || authoredAttr(element, 'drawer-title') || element.getAttribute('heading') || '',
    content: authoredContent || 'Drawer content',
    position: options.position || element.getAttribute('position') || 'right',
    width: options.width || element.getAttribute('width') || '320px',
    // height backs top/bottom positions (drawer.schema.json's `height`
    // property) the same way width backs left/right -- was missing
    // entirely before, so PATH B had no way to size a top/bottom panel.
    height: options.height || element.getAttribute('height') || 'auto',
    // variant was never read anywhere in this function (confirmed by grep
    // across the whole file before this fix) despite drawer.schema.json
    // declaring a real default/overlay/push enum -- live bug: "These
    // variants are all the same?" because nothing ever looked at the
    // attribute. Default matches the schema's own `"default": "overlay"`.
    variant: options.variant || element.getAttribute('variant') || 'overlay',
    // Declared in drawer.schema.json / docs/behaviors/drawer.md (all default
    // true) and read by nothing until now. readFlag: `show-close="false"`
    // must mean off, not "present, so on" (#747).
    closeOnBackdrop: options.closeOnBackdrop ?? readFlag(element, 'close-on-backdrop', true),
    closeOnEscape: options.closeOnEscape ?? readFlag(element, 'close-on-escape', true),
    showClose: options.showClose ?? readFlag(element, 'show-close', true),
    ...options
  };
  // Read once for both paths: PATH A (schema-built panel) and PATH B (built
  // here) each decide backdrop-vs-push from it, and config never changes after
  // this point, so two copies could only ever drift.
  const isPush = config.variant === 'push';

  element.classList.add('x-drawer-trigger');
  // #448: no classList.add('x-drawer') here -- it just duplicated this
  // element's own <div x-drawer> tag name (the "Marker for test compliance"
  // comment predates #448's compliance test, which now flags exactly this
  // pattern). No CSS selector depends on the bare class -- layout.css's
  // visibility rule already selects the x-drawer TAG plus the OTHER real
  // classes here (x-drawer.x-drawer-trigger, x-drawer.x-drawer-layout).
  // #448 removed this class outright; restored WITH the tag-name guard.
  // permutation-compliance requires compliance.baseClass to cover the host
  // (classList.contains(cls) || tagName === cls), and on an attribute host
  // like <div x-drawer> the tag is "div" -- so without the class nothing covers
  // it. Guarded so a literal <x-drawer> tag does not get a redundant class.
  element.classList.add('x-drawer');

  // ═══════════════════════════════════════════════════════
  // PATH A: Schema already built the panel/backdrop — enhance, don't rebuild
  // ═══════════════════════════════════════════════════════
  if (schemaProcessed) {
    const builtPanel = element.querySelector(':scope > .x-drawer__panel');
    const builtBackdrop = element.querySelector(':scope > .x-drawer__backdrop');

    if (builtPanel) {
      // Move the schema-built structure out of the host and into
      // document.body: it must render as a fixed overlay, not as inline
      // content replacing the host's own trigger label.
      builtPanel.remove();
      if (builtBackdrop) builtBackdrop.remove();
      document.body.appendChild(builtPanel);
      if (builtBackdrop) document.body.appendChild(builtBackdrop);

      // The host is now empty (schema's $view build replaced its original
      // text with the backdrop/panel we just moved out). Restore its own
      // visible label: the pre-wipe slot content schema-builder.js stashed
      // on _wbOriginalContent, falling back to the configured title for
      // markup that predates that stash (defensive, shouldn't normally hit).
      if (!element.textContent.trim()) {
        element.innerHTML = element._wbOriginalContent || config.title;
      }

      builtPanel.classList.add(`x-drawer--${config.position}`);
      // variant and width/height were PATH B-only: the schema build is the path
      // every page takes now (wb-lazy.js builds schemas for attribute hosts
      // since #884), so on demos/site/overlays.html all three variants opened
      // identically and `width="400px"` was ignored. Same classes and $cssAPI
      // custom properties PATH B applies, so drawer.css styles both alike.
      builtPanel.classList.add(`x-drawer--${config.variant}`);
      // Through a generated rule, not the style attribute (#779); only a
      // non-default size travels, drawer.css's var() fallbacks carry the rest.
      setRule(builtPanel, 'size', drawerSize(config));

      // The schema fills title/body from attributes (and their registered
      // synonyms, attribute-aliases.js) or, failing those, from its own
      // "this is the title"/"this is the content" defaults. It never sees the
      // host's own text on the wb.js runtime, which has no keepAuthoredText
      // step, so a bare `<aside x-drawer>position=left</aside>` opened on the
      // placeholder body there. Write what the author actually supplied (an
      // option passed to drawer() included) over the schema's output; an
      // empty invocation keeps the schema's self-describing defaults.
      if (config.title) {
        let builtTitle = builtPanel.querySelector('.x-drawer__title');
        if (!builtTitle) {
          const header = builtPanel.querySelector('.x-drawer__header');
          if (header) {
            builtTitle = document.createElement('h2');
            builtTitle.className = 'x-drawer__title';
            header.insertBefore(builtTitle, header.firstChild);
          }
        }
        if (builtTitle) builtTitle.textContent = config.title;
      }
      const builtBody = builtPanel.querySelector('.x-drawer__body');
      if (builtBody && authoredContent) {
        builtBody.innerHTML = config.content;
      }

      // $view's "close" part has no default content (drawer.schema.json
      // never gives it a label) -- give it one only if still empty, so an
      // author-supplied close label (via a future schema change) isn't
      // clobbered.
      const builtCloseBtn = builtPanel.querySelector('.x-drawer__close');
      if (builtCloseBtn && !builtCloseBtn.textContent.trim()) builtCloseBtn.innerHTML = '&times;';
      if (builtCloseBtn && !config.showClose) builtCloseBtn.hidden = true;

      let pushed = null;
      const isOpen = () => builtPanel.classList.contains('x-drawer__panel--open');
      const show = () => {
        builtPanel.classList.add('x-drawer__panel--open');
        // push has no dimming backdrop -- see PATH B's show() for the pattern.
        if (builtBackdrop && !isPush) builtBackdrop.classList.add('x-drawer__backdrop--open');
        if (isPush) pushed = pushPageAside(builtPanel, config.position, [builtPanel, builtBackdrop]);
        document.body.classList.add('x-scroll-lock');
      };
      const hide = () => {
        builtPanel.classList.remove('x-drawer__panel--open');
        if (builtBackdrop) builtBackdrop.classList.remove('x-drawer__backdrop--open');
        if (pushed) { releasePushedPage(pushed); pushed = null; }
        document.body.classList.remove('x-scroll-lock');
      };
      const toggle = () => (isOpen() ? hide() : show());

      const onBuiltEscape = (e) => { if (config.closeOnEscape && e.key === 'Escape' && isOpen()) hide(); };
      const onBackdrop = () => { if (config.closeOnBackdrop) hide(); };

      element.addEventListener('click', toggle);
      if (builtCloseBtn) builtCloseBtn.addEventListener('click', hide);
      if (builtBackdrop) builtBackdrop.addEventListener('click', onBackdrop);
      document.addEventListener('keydown', onBuiltEscape);

      // Matches the wbPopover/wbOffcanvas/wbSheet naming convention already
      // used by this file's sibling overlay functions -- not element.open/
      // element.close/element.toggle, which schema-builder.js's generic
      // $methods binder already stubbed onto the element (unimplemented
      // warns for open/close; toggle is bound to a viewModel.toggle() that
      // toggles `element.hidden` on the HOST, which is not what a visible
      // trigger button wants). Leaving those alone; this is a parallel API.
      element.wbDrawer = { show, hide, toggle, isOpen };

      return () => {
        hide();
        element.removeEventListener('click', toggle);
        if (builtCloseBtn) builtCloseBtn.removeEventListener('click', hide);
        if (builtBackdrop) builtBackdrop.removeEventListener('click', onBackdrop);
        document.removeEventListener('keydown', onBuiltEscape);
        clearRules(builtPanel);
        builtPanel.remove();
        if (builtBackdrop) builtBackdrop.remove();
        element.classList.remove('x-drawer-trigger');
      };
    }
    // No .x-drawer__panel found despite schemaProcessed being true --
    // shouldn't happen (drawer.schema.json's "panel" $view part is
    // required: true), but fall through to the self-building path below
    // rather than leaving the trigger with no click behavior at all.
  }

  // ═══════════════════════════════════════════════════════
  // PATH B: No schema involved (legacy [x-drawer] usage) — build our own DOM
  // ═══════════════════════════════════════════════════════
  //
  // Rewritten (live bugs on demos/site/overlays.html, wb-lazy.js path --
  // PATH A never runs there, see the big comment above this function): this
  // used to build a totally separate, hand-rolled inline-style panel that
  // (a) always showed hardcoded 'Drawer'/'Drawer content' placeholder text
  // instead of the host's own content, (b) only branched on
  // `position === 'right'`, silently rendering top/bottom as a left
  // sidebar, and (c) never read `variant` at all, so
  // default/overlay/push were pixel-identical. Now builds its DOM with the
  // SAME `.x-drawer__backdrop`/`.x-drawer__panel`/`.x-drawer--{position}`/
  // `.x-drawer__panel--open` classes src/styles/behaviors/drawer.css
  // already defines for PATH A (Tier-1 Law 9 -- reuse real CSS instead of
  // a second hand-rolled inline-style implementation that can drift out of
  // sync with it), so position support is defined in exactly one place.
  let panelEl = null;
  let backdropEl = null;
  let pushTarget = null;

  const show = () => {
    if (panelEl) return;

    // 'push' has no dimming backdrop -- it shoves the page's own content
    // aside instead of overlaying it (Material Design's "push" navigation
    // drawer is the reference pattern; drawerLayout() in layouts.js is a
    // different, persistent sidebar primitive with no page-push behavior to
    // borrow from, confirmed by reading it). 'default' and 'overlay' both
    // use the dimming backdrop -- docs/components/drawer.md documents no
    // distinct treatment for 'default', and the schema's own declared
    // default IS 'overlay', so 'default' is treated as an explicit alias
    // for 'overlay' rather than inventing a third undocumented interaction.
    if (!isPush) {
      backdropEl = document.createElement('div');
      backdropEl.className = 'x-drawer__backdrop';
      if (config.closeOnBackdrop) backdropEl.onclick = hide;
      document.body.appendChild(backdropEl);
    }

    panelEl = document.createElement('div');
    panelEl.className = `x-drawer__panel x-drawer--${config.position} x-drawer--${config.variant}`;
    // --x-drawer-width/--x-drawer-height are drawer.schema.json's own
    // declared $cssAPI custom properties (drawer.css already reads them) --
    // setting them per-instance is the documented override mechanism. They
    // go through a generated rule, not the style attribute (#779).
    setRule(panelEl, 'size', drawerSize(config));
    panelEl.innerHTML = `
      <div class="x-drawer__header">
        ${config.title ? `<h2 class="x-drawer__title">${config.title}</h2>` : ''}
        ${config.showClose ? '<button type="button" class="x-drawer__close" aria-label="Close">&times;</button>' : ''}
      </div>
      <div class="x-drawer__body">${config.content}</div>
    `;
    const closeBtn = panelEl.querySelector('.x-drawer__close');
    if (closeBtn) closeBtn.onclick = hide;
    document.body.appendChild(panelEl);
    if (config.closeOnEscape) document.addEventListener('keydown', onEscape);
    document.body.classList.add('x-scroll-lock');

    // Panel/backdrop must exist in the DOM with their CLOSED transform for
    // at least one frame before `--open` is added, or the browser paints
    // the open state directly with no visible slide-in transition.
    requestAnimationFrame(() => {
      if (backdropEl) backdropEl.classList.add('x-drawer__backdrop--open');
      panelEl.classList.add('x-drawer__panel--open');
      // Measured after append (not config.width/height) so an 'auto' height
      // still yields a real pixel push amount for top/bottom.
      if (isPush) pushTarget = pushPageAside(panelEl, config.position, [panelEl, backdropEl]);
    });
  };

  // PATH B had no Escape handling at all; close-on-escape (default true)
  // gives it the documented one, attached only while the panel is open.
  const onEscape = (e) => { if (e.key === 'Escape') hide(); };

  const hide = () => {
    document.removeEventListener('keydown', onEscape);
    if (backdropEl) { backdropEl.remove(); backdropEl = null; }
    if (panelEl) { clearRules(panelEl); panelEl.remove(); panelEl = null; }
    if (pushTarget) { releasePushedPage(pushTarget); pushTarget = null; }
    document.body.classList.remove('x-scroll-lock');
  };

  const toggle = () => panelEl ? hide() : show();
  element.addEventListener('click', toggle);
  element.wbDrawer = { show, hide, toggle };

  return () => {
    hide();
    element.removeEventListener('click', toggle);
    element.classList.remove('x-drawer-trigger');
  };
}

/**
 * Lightbox - Full-screen image viewer
 * Helper Attribute: [x-lightbox]
 */
export function lightbox(element, options = {}) {
  const config = {
    // dataset.src checked before the native src/href fallbacks: elements
    // with no native src (e.g. <button x-lightbox data-src="...">, the
    // form scripts/generate-behaviors-page.js emits) have no getAttribute
    // ('src')/element.src to fall back to, so config.src silently resolved
    // to '' and the lightbox <img> rendered with an empty src (#374). Same
    // class of bug as BUG-2024-12-19-001 in data/bug-registry.json.
    src: readOption(element, options, 'src') || element.src || element.href || '',
    ...options
  };

  element.classList.add('x-lightbox-trigger');
  element.classList.add('x-lightbox');
  // cursor: pointer comes from .x-lightbox-trigger in overlays.css (#779).

  element.onclick = (e) => {
    e.preventDefault();
    
    const overlay = document.createElement('div');
    // x-lightbox stays for anything that already selects the open viewer;
    // x-lightbox__overlay carries the look, which was a style.cssText block
    // here (#779). Not .x-lightbox alone: the trigger carries that class too.
    overlay.className = 'x-lightbox x-lightbox__overlay';

    const img = document.createElement('img');
    img.className = 'x-lightbox__image';
    img.src = config.src;

    const closeBtn = document.createElement('button');
    closeBtn.className = 'x-lightbox__close';
    closeBtn.innerHTML = '×';
    // The hover background is a :hover rule now, not a mouseenter/mouseleave
    // pair writing style.background.

    const close = () => {
      overlay.classList.add('x-lightbox__overlay--closing');
      setTimeout(() => overlay.remove(), 200);
    };
    
    closeBtn.onclick = close;
    overlay.onclick = (e) => { if (e.target === overlay) close(); };
    
    document.addEventListener('keydown', function escHandler(e) {
      if (e.key === 'Escape') { close(); document.removeEventListener('keydown', escHandler); }
    });
    
    overlay.appendChild(img);
    overlay.appendChild(closeBtn);
    document.body.appendChild(overlay);
  };

  return () => element.classList.remove('x-lightbox-trigger');
}

/**
 * Offcanvas - Off-canvas panel
 * Custom Tag: <div>
 */
export function offcanvas(element, options = {}) {
  const config = {
    title: options.title || authoredAttr(element, 'offcanvas-title') || element.getAttribute('heading') || 'Panel',
    content: options.content || authoredAttr(element, 'offcanvas-content') || element.getAttribute('description') || 'Panel content',
    position: options.position || element.getAttribute('position') || 'left',
    ...options
  };

  element.classList.add('x-offcanvas-trigger');
  let panelEl = null;
  let backdropEl = null;

  const show = () => {
    if (panelEl) return;
    
    // #779: every declaration below used to be style.cssText / style="" --
    // they are the .x-offcanvas__* rules in overlays.css.
    backdropEl = document.createElement('div');
    backdropEl.className = 'x-offcanvas__backdrop';
    backdropEl.onclick = hide;
    document.body.appendChild(backdropEl);
    
    panelEl = document.createElement('div');
    const isLeft = config.position === 'left' || config.position === 'start';
    panelEl.className = `x-offcanvas__panel x-offcanvas__panel--${isLeft ? 'left' : 'right'}`;
    panelEl.innerHTML = `
      <div class="x-offcanvas__header">
        <h3 class="x-offcanvas__title">${config.title}</h3>
        <button class="x-offcanvas__close">&times;</button>
      </div>
      <div class="x-offcanvas__body">${config.content}</div>
    `;
    panelEl.querySelector('button').onclick = hide;
    document.body.appendChild(panelEl);
    document.body.classList.add('x-scroll-lock');
  };

  const hide = () => {
    if (backdropEl) { backdropEl.remove(); backdropEl = null; }
    if (panelEl) { panelEl.remove(); panelEl = null; }
    document.body.classList.remove('x-scroll-lock');
  };

  element.onclick = () => panelEl ? hide() : show();
  element.wbOffcanvas = { show, hide, toggle: () => panelEl ? hide() : show() };

  return () => { hide(); element.classList.remove('x-offcanvas-trigger'); };
}

/**
 * Sheet - Notes panel from left side with resizable width
 * Custom Tag: <div>
 */
export function sheet(element, options = {}) {
  const config = {
    title: options.title || authoredAttr(element, 'sheet-title') || element.getAttribute('heading') || 'Notes',
    content: options.content || authoredAttr(element, 'sheet-content') || element.getAttribute('description') || '',
    width: options.width || element.getAttribute('width') || '320px',
    minWidth: options.minWidth || authoredAttr(element, 'min-width') || '200px',
    maxWidth: options.maxWidth || authoredAttr(element, 'max-width') || '600px',
    ...options
  };

  element.classList.add('x-sheet-trigger');
  // Only what differs from overlays.css's .x-sheet defaults travels in the
  // generated rule, plus a width the user dragged to.
  const sheetSize = (width = config.width) => onlyChanged(
    { width, minWidth: config.minWidth, maxWidth: config.maxWidth },
    { width: '320px', minWidth: '200px', maxWidth: '600px' },
  );
  let sheetEl = null;
  let backdropEl = null;
  let isResizing = false;

  const show = () => {
    if (sheetEl) return;
    
    // #779: the declarations below used to be style.cssText / style="" --
    // they are the .x-sheet* rules in overlays.css.
    backdropEl = document.createElement('div');
    backdropEl.className = 'x-sheet__backdrop';
    backdropEl.onclick = hide;
    document.body.appendChild(backdropEl);
    
    sheetEl = document.createElement('div');
    sheetEl.className = 'x-sheet';
    // overlays.css holds the default 320/200/600px; an authored width,
    // min-width or max-width is a runtime value (#779).
    setRule(sheetEl, 'size', sheetSize());
    
    sheetEl.innerHTML = `
      <div class="x-sheet__header">
        <h3 class="x-sheet__title">
          <span class="x-sheet__icon">📝</span> ${config.title}
        </h3>
        <button class="x-sheet__close">&times;</button>
      </div>
      <div class="x-sheet__content">
        ${config.content || '<textarea class="x-sheet__notes" placeholder="Type your notes here..."></textarea>'}
      </div>
      <div class="x-sheet__resize"></div>
    `;
    
    sheetEl.querySelector('button').onclick = hide;
    
    // Resize handle
    const resizeHandle = sheetEl.querySelector('.x-sheet__resize');
    resizeHandle.onmousedown = (e) => {
      isResizing = true;
      document.body.classList.add('x-resizing');
    };
    
    document.addEventListener('mousemove', (e) => {
      if (!isResizing || !sheetEl) return;
      const newWidth = e.clientX;
      const min = parseInt(config.minWidth);
      const max = parseInt(config.maxWidth);
      if (newWidth >= min && newWidth <= max) {
        setRule(sheetEl, 'size', sheetSize(`${newWidth}px`));
      }
    });
    
    document.addEventListener('mouseup', () => {
      isResizing = false;
      document.body.classList.remove('x-resizing');
    });
    
    document.body.appendChild(sheetEl);
    document.body.classList.add('x-scroll-lock');
    
    // Focus textarea if present
    const textarea = sheetEl.querySelector('textarea');
    if (textarea) textarea.focus();
  };

  const hide = () => {
    if (backdropEl) { backdropEl.remove(); backdropEl = null; }
    if (sheetEl) { clearRules(sheetEl); sheetEl.remove(); sheetEl = null; }
    document.body.classList.remove('x-scroll-lock');
  };

  const toggle = () => sheetEl ? hide() : show();
  element.addEventListener('click', toggle);
  element.wbSheet = { show, hide, toggle };

  return () => { 
    hide(); 
    element.removeEventListener('click', toggle);
    element.classList.remove('x-sheet-trigger'); 
  };
}

/**
 * Open the modal dialog confirm() and prompt() share (#883 -- each built it by
 * hand): a box with a title, `bodyHTML`, and Cancel/OK buttons. Cancel and OK
 * close it and fire wb:{kind}:cancel / wb:{kind}:ok on `element`; OK's detail
 * is getDetail(), read before the dialog closes. A backdrop click just closes.
 */
function openDialog(element, kind, { title, bodyHTML, cancelText, okText, getDetail }) {
  const overlay = document.createElement('div');
  // .x-overlay-dialog* in overlays.css -- formerly cssText + style="" (#779).
  overlay.className = 'x-overlay-dialog';
  overlay.innerHTML = `
      <div class="x-overlay-dialog__box">
        <h3 class="x-overlay-dialog__title">${title}</h3>
        ${bodyHTML}
        <div class="x-overlay-dialog__actions">
          <button class="cancel x-overlay-dialog__cancel">${cancelText}</button>
          <button class="ok x-overlay-dialog__ok">${okText}</button>
        </div>
      </div>
    `;

  overlay.querySelector('.cancel').onclick = () => {
    overlay.remove();
    element.dispatchEvent(new CustomEvent(`wb:${kind}:cancel`, { bubbles: true }));
  };

  overlay.querySelector('.ok').onclick = () => {
    const detail = getDetail ? getDetail() : undefined;
    overlay.remove();
    element.dispatchEvent(new CustomEvent(`wb:${kind}:ok`, { bubbles: true, detail }));
  };

  overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
  document.body.appendChild(overlay);
  return overlay;
}

/**
 * Helper Attribute: [x-confirm]
 * Confirm - Confirmation dialog
 */
export function confirm(element, options = {}) {
  const config = {
    title: options.title || authoredAttr(element, 'confirm-title') || element.getAttribute('heading') || 'Confirm',
    message: options.message || authoredAttr(element, 'confirm-message') || element.getAttribute('message') || 'Are you sure?',
    confirmText: options.confirmText || authoredAttr(element, 'confirm-text') || 'OK',
    cancelText: options.cancelText || authoredAttr(element, 'cancel-text') || 'Cancel',
    ...options
  };

  element.classList.add('x-confirm-trigger');

  element.onclick = (e) => {
    e.preventDefault();
    openDialog(element, 'confirm', {
      title: config.title,
      bodyHTML: `<div class="x-overlay-dialog__message">${config.message}</div>`,
      cancelText: config.cancelText,
      okText: config.confirmText
    });
  };

  return () => element.classList.remove('x-confirm-trigger');
}

/**
 * Helper Attribute: [x-prompt]
 * Prompt - Input prompt dialog
 */
export function prompt(element, options = {}) {
  const config = {
    title: options.title || authoredAttr(element, 'prompt-title') || element.getAttribute('heading') || 'Input',
    message: options.message || authoredAttr(element, 'prompt-message') || element.getAttribute('message') || '',
    placeholder: options.placeholder || element.getAttribute('placeholder') || '',
    defaultValue: options.defaultValue || authoredAttr(element, 'default-value') || '',
    ...options
  };

  element.classList.add('x-prompt-trigger');

  element.onclick = (e) => {
    e.preventDefault();

    let input;
    const overlay = openDialog(element, 'prompt', {
      title: config.title,
      bodyHTML: `${config.message ? `<div class="x-overlay-dialog__message x-overlay-dialog__message--prompt">${config.message}</div>` : ''}
        <input type="text" class="x-overlay-dialog-input" placeholder="${config.placeholder}" value="${config.defaultValue}">`,
      cancelText: 'Cancel',
      okText: 'OK',
      getDetail: () => ({ value: input.value })
    });
    input = overlay.querySelector('input');

    input.onkeydown = (e) => {
      if (e.key === 'Enter') overlay.querySelector('.ok').click();
      if (e.key === 'Escape') overlay.querySelector('.cancel').click();
    };

    input.focus();
    input.select();
  };

  return () => element.classList.remove('x-prompt-trigger');
}

export default { popover, drawer, lightbox, offcanvas, sheet, confirm, prompt };
