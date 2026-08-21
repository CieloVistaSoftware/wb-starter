import { readAttr } from '../core/read-attr.js';
/**
 * Overlay Behaviors
 * -----------------------------------------------------------------------------
 * Full-screen or partial overlays like modals, drawers, and lightboxes.
 * Manages z-index, blocking backgrounds, and focus trapping.
 * 
 * Custom Tag: <wb-overlay>
 * -----------------------------------------------------------------------------
 * 
 * Usage:
 *   <wb-drawer  data-target="#menu">Open Menu</button>
 *   <a href="img.jpg" x-lightbox>View Image</a>
 * -----------------------------------------------------------------------------
 * All overlays show visual feedback when their trigger is clicked
 */

// Shared overlay styles
const OVERLAY_STYLES = `
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  animation: wb-fade-in 0.2s ease;
`;

const DIALOG_STYLES = `
  background: var(--bg-primary, #1f2937);
  border-radius: 12px;
  padding: 1.5rem;
  min-width: 300px;
  max-width: 90vw;
  max-height: 80vh;
  overflow: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
  color: var(--text-primary, #f9fafb);
  border: 1px solid var(--border-color, #374151);
`;

/**
 * Popover - Click-triggered popup
 * Custom Tag: <wb-popover>
 */
export function popover(element, options = {}) {
  const config = {
    content: options.content || element.getAttribute('popover-content') || element.getAttribute('description') || '',
    title: options.title || element.getAttribute('popover-title') || element.getAttribute('heading') || '',
    trigger: options.trigger || element.getAttribute('trigger') || 'click',
    position: options.position || element.getAttribute('position') || 'top',
    ...options
  };

  element.classList.add('wb-popover-trigger');
  // NOT '.wb-popover' — that class is popover.css's styling for the
  // dynamically-created CONTENT PANEL (position:absolute; z-index:1000),
  // reused here by name collision on the TRIGGER too. That yanked the
  // trigger out of normal document flow onto whatever absolute position
  // its (unpositioned) ancestor computed, landing it on top of unrelated
  // nearby content — e.g. covering the very next sibling's click target.
  let popoverEl = null;
  const popoverId = `wb-popover-${Math.random().toString(36).slice(2, 9)}`;

  // #209: a popover opening/closing was invisible to assistive tech — no
  // role, no announcement, no link between trigger and content. aria-haspopup
  // is static (always true, describes what clicking DOES); aria-expanded
  // reflects live open/closed state; aria-controls links trigger -> panel.
  element.setAttribute('aria-haspopup', 'dialog');
  element.setAttribute('aria-expanded', 'false');

  const show = () => {
    if (popoverEl) return;
    popoverEl = document.createElement('div');
    popoverEl.className = `wb-popover wb-popover--${config.position}`;
    popoverEl.id = popoverId;
    popoverEl.setAttribute('role', 'dialog');
    popoverEl.setAttribute('aria-label', config.title || config.content);
    popoverEl.style.cssText = `
      position: fixed;
      background: var(--bg-primary, #1f2937);
      border: 1px solid var(--border-color, #374151);
      border-radius: 8px;
      padding: 0.75rem 1rem;
      box-shadow: 0 10px 40px rgba(0,0,0,0.3);
      z-index: 10000;
      animation: wb-fade-in 0.15s ease;
      color: var(--text-primary, #f9fafb);
      max-width: 300px;
    `;
    popoverEl.innerHTML = `
      ${config.title ? `<div style="font-weight:600;margin-bottom:0.5rem;color:var(--primary,#6366f1);">${config.title}</div>` : ''}
      <div>${config.content}</div>
    `;
    document.body.appendChild(popoverEl);
    positionPopover(element, popoverEl, config.position);
    element.setAttribute('aria-expanded', 'true');
    element.setAttribute('aria-controls', popoverId);
  };

  const hide = () => {
    if (popoverEl) {
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
    element.classList.remove('wb-popover-trigger');
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
    popover.style.maxWidth = `${maxW}px`;
    popRect = popover.getBoundingClientRect();
  }
  left = Math.max(margin, Math.min(left, vw - popRect.width - margin));
  top = Math.max(margin, Math.min(top, vh - popRect.height - margin));

  popover.style.position = 'fixed';
  popover.style.top = `${top}px`;
  popover.style.left = `${left}px`;
}

/**
 * Drawer - Slide-out panel (works on button click)
 * Custom Tag: <wb-drawer>
 *
 * Two competing DOM owners used to fight over the same <wb-drawer> element
 * (root-caused live): drawer.schema.json's $view builds a real
 * backdrop/panel/header/title/close/body structure INSIDE the host the
 * moment WB.scan() processes it (schema-builder.js), wiping out whatever
 * text the host had (its trigger label, e.g. "Left Drawer") in the process.
 * Separately, tag-map.js maps <wb-drawer> to this behavior, and wb.js's
 * scan() unconditionally calls WB.inject(el, 'drawer') for every wb-drawer
 * tag regardless of whether schema already ran -- so this function ALSO
 * used to build its own second, independent backdrop+panel pair on click,
 * appended to document.body, while the schema's copy sat inertly (and
 * invisibly -- see layout.css's `wb-drawer { visibility: hidden }` default)
 * inside the host. Result: an empty/malformed trigger box, and (had it ever
 * become visible) two overlays opening per click.
 *
 * Fix: when schema already processed this element (x-schema="drawer"), do
 * NOT build a second structure. Relocate the schema-built
 * .wb-drawer__backdrop/.wb-drawer__panel out to document.body (so the host
 * keeps its own visible label instead of showing the panel's internal
 * markup) and wire click-to-open/close to that existing DOM instead. Legacy
 * [x-drawer] usage (plain buttons, no wb-drawer tag, no schema involved --
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
  const originalText = (element.textContent || '').trim();

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
    // attribute-less demo like `<wb-drawer position="left">position=left</wb-drawer>`
    // popped open showing the literal, unrelated words "Drawer"/"Drawer
    // content" instead of "position=left". Title now defaults to '' (matches
    // drawer.schema.json's own `"default": ""` and its $view's
    // `"createdWhen": "title"` -- PATH B's show() below skips rendering a
    // header title line entirely when it's empty, same as PATH A already
    // does via the schema). Content falls back to the host's own original
    // text before falling back to the old hardcoded string, so a bare-text
    // demo shows its own words instead of a generic placeholder.
    title: options.title || element.getAttribute('title') || element.getAttribute('drawer-title') || element.getAttribute('heading') || '',
    content: options.content || element.getAttribute('content') || element.getAttribute('drawer-content') || element.getAttribute('description') || originalText || 'Drawer content',
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
    ...options
  };

  element.classList.add('wb-drawer-trigger');
  // #448: no classList.add('wb-drawer') here -- it just duplicated this
  // element's own <wb-drawer> tag name (the "Marker for test compliance"
  // comment predates #448's compliance test, which now flags exactly this
  // pattern). No CSS selector depends on the bare class -- layout.css's
  // visibility rule already selects the wb-drawer TAG plus the OTHER real
  // classes here (wb-drawer.wb-drawer-trigger, wb-drawer.wb-drawer-layout).

  // ═══════════════════════════════════════════════════════
  // PATH A: Schema already built the panel/backdrop — enhance, don't rebuild
  // ═══════════════════════════════════════════════════════
  if (schemaProcessed) {
    const builtPanel = element.querySelector(':scope > .wb-drawer__panel');
    const builtBackdrop = element.querySelector(':scope > .wb-drawer__backdrop');

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
      // on _wbOriginalSlot, falling back to the configured title for
      // markup that predates that stash (defensive, shouldn't normally hit).
      if (!element.textContent.trim()) {
        element.innerHTML = element._wbOriginalSlot || config.title;
      }

      builtPanel.classList.add(`wb-drawer--${config.position}`);

      // $view's "close" part has no default content (drawer.schema.json
      // never gives it a label) -- give it one only if still empty, so an
      // author-supplied close label (via a future schema change) isn't
      // clobbered.
      const closeBtn = builtPanel.querySelector('.wb-drawer__close');
      if (closeBtn && !closeBtn.textContent.trim()) closeBtn.innerHTML = '&times;';

      const isOpen = () => builtPanel.classList.contains('wb-drawer__panel--open');
      const show = () => {
        builtPanel.classList.add('wb-drawer__panel--open');
        if (builtBackdrop) builtBackdrop.classList.add('wb-drawer__backdrop--open');
        document.body.classList.add('wb-scroll-lock');
      };
      const hide = () => {
        builtPanel.classList.remove('wb-drawer__panel--open');
        if (builtBackdrop) builtBackdrop.classList.remove('wb-drawer__backdrop--open');
        document.body.classList.remove('wb-scroll-lock');
      };
      const toggle = () => (isOpen() ? hide() : show());

      const onEscape = (e) => { if (e.key === 'Escape' && isOpen()) hide(); };

      element.addEventListener('click', toggle);
      if (closeBtn) closeBtn.addEventListener('click', hide);
      if (builtBackdrop) builtBackdrop.addEventListener('click', hide);
      document.addEventListener('keydown', onEscape);

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
        if (closeBtn) closeBtn.removeEventListener('click', hide);
        if (builtBackdrop) builtBackdrop.removeEventListener('click', hide);
        document.removeEventListener('keydown', onEscape);
        builtPanel.remove();
        if (builtBackdrop) builtBackdrop.remove();
        element.classList.remove('wb-drawer-trigger');
      };
    }
    // No .wb-drawer__panel found despite schemaProcessed being true --
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
  // SAME `.wb-drawer__backdrop`/`.wb-drawer__panel`/`.wb-drawer--{position}`/
  // `.wb-drawer__panel--open` classes src/styles/behaviors/drawer.css
  // already defines for PATH A (Tier-1 Law 9 -- reuse real CSS instead of
  // a second hand-rolled inline-style implementation that can drift out of
  // sync with it), so position support is defined in exactly one place.
  let panelEl = null;
  let backdropEl = null;
  let pushTarget = null;

  const isHorizontalEdge = () => config.position === 'top' || config.position === 'bottom';

  const show = () => {
    if (panelEl) return;

    const isPush = config.variant === 'push';

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
      backdropEl.className = 'wb-drawer__backdrop';
      backdropEl.onclick = hide;
      document.body.appendChild(backdropEl);
    }

    panelEl = document.createElement('div');
    panelEl.className = `wb-drawer__panel wb-drawer--${config.position} wb-drawer--${config.variant}`;
    // --wb-drawer-width/--wb-drawer-height are drawer.schema.json's own
    // declared $cssAPI custom properties (drawer.css already reads them) --
    // setting them per-instance is the documented override mechanism, not a
    // one-off inline style (Law 9).
    if (isHorizontalEdge()) {
      panelEl.style.setProperty('--wb-drawer-height', config.height);
    } else {
      panelEl.style.setProperty('--wb-drawer-width', config.width);
    }
    panelEl.innerHTML = `
      <div class="wb-drawer__header">
        ${config.title ? `<h2 class="wb-drawer__title">${config.title}</h2>` : ''}
        <button type="button" class="wb-drawer__close" aria-label="Close">&times;</button>
      </div>
      <div class="wb-drawer__body">${config.content}</div>
    `;
    panelEl.querySelector('.wb-drawer__close').onclick = hide;
    document.body.appendChild(panelEl);
    document.body.classList.add('wb-scroll-lock');

    if (isPush) {
      // Push the page's own content wrapper (`body > .page`, the standard
      // top-level wrapper every demos/site/*.html page renders into) --
      // NEVER document.body itself: panelEl is `position: fixed` and is
      // also a direct child of body, so a transform on body would make body
      // the fixed-position containing block for its own panel child,
      // breaking the panel's fixed-to-viewport positioning the instant the
      // push page-content animates. Measuring after append (not using
      // config.width/height directly) so an 'auto' height still produces a
      // real pixel push amount for top/bottom.
      pushTarget = document.querySelector('body > .page');
    }

    // Panel/backdrop must exist in the DOM with their CLOSED transform for
    // at least one frame before `--open` is added, or the browser paints
    // the open state directly with no visible slide-in transition.
    requestAnimationFrame(() => {
      if (backdropEl) backdropEl.classList.add('wb-drawer__backdrop--open');
      panelEl.classList.add('wb-drawer__panel--open');
      if (pushTarget) {
        const rect = panelEl.getBoundingClientRect();
        const amount = isHorizontalEdge() ? rect.height : rect.width;
        const sign = (config.position === 'right' || config.position === 'bottom') ? -1 : 1;
        pushTarget.style.setProperty(isHorizontalEdge() ? '--wb-drawer-push-y' : '--wb-drawer-push-x', `${sign * amount}px`);
        pushTarget.classList.add('wb-drawer-push-target');
        pushTarget.classList.add('wb-drawer-push-target--open');
      }
    });
  };

  const hide = () => {
    if (backdropEl) { backdropEl.remove(); backdropEl = null; }
    if (panelEl) { panelEl.remove(); panelEl = null; }
    if (pushTarget) {
      pushTarget.classList.remove('wb-drawer-push-target--open');
      pushTarget.style.removeProperty('--wb-drawer-push-x');
      pushTarget.style.removeProperty('--wb-drawer-push-y');
      pushTarget = null;
    }
    document.body.classList.remove('wb-scroll-lock');
  };

  const toggle = () => panelEl ? hide() : show();
  element.addEventListener('click', toggle);
  element.wbDrawer = { show, hide, toggle };

  return () => {
    hide();
    element.removeEventListener('click', toggle);
    element.classList.remove('wb-drawer-trigger');
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
    src: options.src || readAttr(element, 'src') || element.getAttribute('src') || element.src || element.href || '',
    ...options
  };

  element.classList.add('wb-lightbox-trigger');
  element.classList.add('wb-lightbox');
  element.style.cursor = 'pointer';

  element.onclick = (e) => {
    e.preventDefault();
    
    const overlay = document.createElement('div');
    overlay.className = 'wb-lightbox';
    overlay.style.cssText = `
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0, 0, 0, 0.9);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: wb-fade-in 0.2s ease;
      cursor: zoom-out;
    `;
    
    const img = document.createElement('img');
    img.src = config.src;
    img.style.cssText = `
      max-width: 90vw;
      max-height: 90vh;
      object-fit: contain;
      border-radius: 4px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
      animation: wb-zoom-in 0.3s ease;
    `;
    
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '×';
    closeBtn.style.cssText = `
      position: absolute;
      top: 1rem; right: 1rem;
      background: rgba(255,255,255,0.1);
      border: none;
      color: white;
      font-size: 2rem;
      width: 48px; height: 48px;
      border-radius: 50%;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.2s;
    `;
    closeBtn.onmouseenter = () => closeBtn.style.background = 'rgba(255,255,255,0.2)';
    closeBtn.onmouseleave = () => closeBtn.style.background = 'rgba(255,255,255,0.1)';
    
    const close = () => {
      overlay.style.animation = 'wb-fade-out 0.2s ease';
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

  return () => element.classList.remove('wb-lightbox-trigger');
}

/**
 * Offcanvas - Off-canvas panel
 * Custom Tag: <wb-offcanvas>
 */
export function offcanvas(element, options = {}) {
  const config = {
    title: options.title || element.getAttribute('offcanvas-title') || element.getAttribute('heading') || 'Panel',
    content: options.content || element.getAttribute('offcanvas-content') || element.getAttribute('description') || 'Panel content',
    position: options.position || element.getAttribute('position') || 'left',
    ...options
  };

  element.classList.add('wb-offcanvas-trigger');
  let panelEl = null;
  let backdropEl = null;

  const show = () => {
    if (panelEl) return;
    
    backdropEl = document.createElement('div');
    backdropEl.style.cssText = `
      position: fixed; top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.5); z-index: 9999;
      animation: wb-fade-in 0.2s ease;
    `;
    backdropEl.onclick = hide;
    document.body.appendChild(backdropEl);
    
    panelEl = document.createElement('div');
    const isLeft = config.position === 'left' || config.position === 'start';
    panelEl.style.cssText = `
      position: fixed; top: 0; ${isLeft ? 'left' : 'right'}: 0; bottom: 0;
      width: 280px; background: var(--bg-primary, #1f2937);
      border-${isLeft ? 'right' : 'left'}: 1px solid var(--border-color, #374151);
      z-index: 10000; display: flex; flex-direction: column;
      animation: wb-slide-in 0.3s ease;
      box-shadow: ${isLeft ? '' : '-'}10px 0 30px rgba(0,0,0,0.3);
    `;
    panelEl.innerHTML = `
      <div style="padding:1rem;border-bottom:1px solid var(--border-color);display:flex;justify-content:space-between;align-items:center;background:var(--bg-secondary,#1e293b);">
        <h3 style="margin:0;color:var(--primary,#6366f1);">${config.title}</h3>
        <button style="background:none;border:none;font-size:1.5rem;cursor:pointer;color:var(--text-secondary);">&times;</button>
      </div>
      <div style="padding:1rem;flex:1;overflow:auto;color:var(--text-primary);">${config.content}</div>
    `;
    panelEl.querySelector('button').onclick = hide;
    document.body.appendChild(panelEl);
    document.body.classList.add('wb-scroll-lock');
  };

  const hide = () => {
    if (backdropEl) { backdropEl.remove(); backdropEl = null; }
    if (panelEl) { panelEl.remove(); panelEl = null; }
    document.body.classList.remove('wb-scroll-lock');
  };

  element.onclick = () => panelEl ? hide() : show();
  element.wbOffcanvas = { show, hide, toggle: () => panelEl ? hide() : show() };

  return () => { hide(); element.classList.remove('wb-offcanvas-trigger'); };
}

/**
 * Sheet - Notes panel from left side with resizable width
 * Custom Tag: <wb-sheet>
 */
export function sheet(element, options = {}) {
  const config = {
    title: options.title || element.getAttribute('sheet-title') || element.getAttribute('heading') || 'Notes',
    content: options.content || element.getAttribute('sheet-content') || element.getAttribute('description') || '',
    width: options.width || element.getAttribute('width') || '320px',
    minWidth: options.minWidth || element.getAttribute('min-width') || '200px',
    maxWidth: options.maxWidth || element.getAttribute('max-width') || '600px',
    ...options
  };

  element.classList.add('wb-sheet-trigger');
  let sheetEl = null;
  let backdropEl = null;
  let isResizing = false;

  const show = () => {
    if (sheetEl) return;
    
    backdropEl = document.createElement('div');
    backdropEl.style.cssText = `
      position: fixed; top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.5); z-index: 9999;
      animation: wb-fade-in 0.2s ease;
    `;
    backdropEl.onclick = hide;
    document.body.appendChild(backdropEl);
    
    sheetEl = document.createElement('div');
    sheetEl.style.cssText = `
      position: fixed; top: 0; left: 0; bottom: 0;
      width: ${config.width}; min-width: ${config.minWidth}; max-width: ${config.maxWidth};
      background: var(--bg-primary, #1f2937);
      border-right: 1px solid var(--border-color, #374151);
      z-index: 10000; display: flex; flex-direction: column;
      animation: wb-slide-in 0.3s ease;
      box-shadow: 10px 0 30px rgba(0,0,0,0.3);
    `;
    
    sheetEl.innerHTML = `
      <div style="padding:1rem;border-bottom:1px solid var(--border-color);display:flex;justify-content:space-between;align-items:center;background:var(--bg-secondary,#1e293b);">
        <h3 style="margin:0;color:var(--primary,#6366f1);display:flex;align-items:center;gap:0.5rem;">
          <span style="font-size:1.25rem;">📝</span> ${config.title}
        </h3>
        <button style="background:none;border:none;font-size:1.5rem;cursor:pointer;color:var(--text-secondary);">&times;</button>
      </div>
      <div class="wb-sheet__content" style="padding:1rem;flex:1;overflow:auto;color:var(--text-primary);">
        ${config.content || '<textarea style="width:100%;height:100%;background:transparent;border:none;color:inherit;resize:none;font-family:inherit;font-size:0.875rem;outline:none;" placeholder="Type your notes here..."></textarea>'}
      </div>
      <div class="wb-sheet__resize" style="position:absolute;top:0;right:0;bottom:0;width:6px;cursor:ew-resize;background:transparent;"></div>
    `;
    
    sheetEl.querySelector('button').onclick = hide;
    
    // Resize handle
    const resizeHandle = sheetEl.querySelector('.wb-sheet__resize');
    resizeHandle.onmousedown = (e) => {
      isResizing = true;
      document.body.classList.add('wb-resizing');
    };
    
    document.addEventListener('mousemove', (e) => {
      if (!isResizing || !sheetEl) return;
      const newWidth = e.clientX;
      const min = parseInt(config.minWidth);
      const max = parseInt(config.maxWidth);
      if (newWidth >= min && newWidth <= max) {
        sheetEl.style.width = newWidth + 'px';
      }
    });
    
    document.addEventListener('mouseup', () => {
      isResizing = false;
      document.body.classList.remove('wb-resizing');
    });
    
    document.body.appendChild(sheetEl);
    document.body.classList.add('wb-scroll-lock');
    
    // Focus textarea if present
    const textarea = sheetEl.querySelector('textarea');
    if (textarea) textarea.focus();
  };

  const hide = () => {
    if (backdropEl) { backdropEl.remove(); backdropEl = null; }
    if (sheetEl) { sheetEl.remove(); sheetEl = null; }
    document.body.classList.remove('wb-scroll-lock');
  };

  const toggle = () => sheetEl ? hide() : show();
  element.addEventListener('click', toggle);
  element.wbSheet = { show, hide, toggle };

  return () => { 
    hide(); 
    element.removeEventListener('click', toggle);
    element.classList.remove('wb-sheet-trigger'); 
  };
}

/**
 * Helper Attribute: [x-confirm]
 * Confirm - Confirmation dialog
 */
export function confirm(element, options = {}) {
  const config = {
    title: options.title || element.getAttribute('confirm-title') || element.getAttribute('heading') || 'Confirm',
    message: options.message || element.getAttribute('confirm-message') || element.getAttribute('message') || 'Are you sure?',
    confirmText: options.confirmText || element.getAttribute('confirm-text') || 'OK',
    cancelText: options.cancelText || element.getAttribute('cancel-text') || 'Cancel',
    ...options
  };

  element.classList.add('wb-confirm-trigger');

  element.onclick = (e) => {
    e.preventDefault();
    
    const overlay = document.createElement('div');
    overlay.style.cssText = OVERLAY_STYLES;
    overlay.innerHTML = `
      <div style="${DIALOG_STYLES}">
        <h3 style="margin:0 0 0.5rem;font-size:1.1rem;color:var(--primary,#6366f1);">${config.title}</h3>
        <div style="margin:0 0 1.5rem;color:var(--text-secondary);">${config.message}</div>
        <div style="display:flex;gap:0.75rem;justify-content:flex-end;">
          <button class="cancel" style="padding:0.5rem 1rem;border:1px solid var(--border-color);background:var(--bg-tertiary);color:var(--text-primary);border-radius:6px;cursor:pointer;">${config.cancelText}</button>
          <button class="ok" style="padding:0.5rem 1rem;border:none;background:var(--primary,#6366f1);color:white;border-radius:6px;cursor:pointer;">${config.confirmText}</button>
        </div>
      </div>
    `;
    
    overlay.querySelector('.cancel').onclick = () => {
      overlay.remove();
      element.dispatchEvent(new CustomEvent('wb:confirm:cancel', { bubbles: true }));
    };
    
    overlay.querySelector('.ok').onclick = () => {
      overlay.remove();
      element.dispatchEvent(new CustomEvent('wb:confirm:ok', { bubbles: true }));
    };
    
    overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
    document.body.appendChild(overlay);
  };

  return () => element.classList.remove('wb-confirm-trigger');
}

/**
 * Helper Attribute: [x-prompt]
 * Prompt - Input prompt dialog
 */
export function prompt(element, options = {}) {
  const config = {
    title: options.title || element.getAttribute('prompt-title') || element.getAttribute('heading') || 'Input',
    message: options.message || element.getAttribute('prompt-message') || element.getAttribute('message') || '',
    placeholder: options.placeholder || element.getAttribute('placeholder') || '',
    defaultValue: options.defaultValue || element.getAttribute('default-value') || '',
    ...options
  };

  element.classList.add('wb-prompt-trigger');

  element.onclick = (e) => {
    e.preventDefault();
    
    const overlay = document.createElement('div');
    overlay.style.cssText = OVERLAY_STYLES;
    overlay.innerHTML = `
      <div style="${DIALOG_STYLES}">
        <h3 style="margin:0 0 0.5rem;font-size:1.1rem;color:var(--primary,#6366f1);">${config.title}</h3>
        ${config.message ? `<div style="margin:0 0 1rem;color:var(--text-secondary);">${config.message}</div>` : ''}
        <input type="text" style="width:100%;padding:0.75rem;border:1px solid var(--border-color);background:var(--bg-tertiary);color:var(--text-primary);border-radius:6px;margin-bottom:1rem;box-sizing:border-box;" placeholder="${config.placeholder}" value="${config.defaultValue}">
        <div style="display:flex;gap:0.75rem;justify-content:flex-end;">
          <button class="cancel" style="padding:0.5rem 1rem;border:1px solid var(--border-color);background:var(--bg-tertiary);color:var(--text-primary);border-radius:6px;cursor:pointer;">Cancel</button>
          <button class="ok" style="padding:0.5rem 1rem;border:none;background:var(--primary,#6366f1);color:white;border-radius:6px;cursor:pointer;">OK</button>
        </div>
      </div>
    `;
    
    const input = overlay.querySelector('input');
    
    overlay.querySelector('.cancel').onclick = () => {
      overlay.remove();
      element.dispatchEvent(new CustomEvent('wb:prompt:cancel', { bubbles: true }));
    };
    
    overlay.querySelector('.ok').onclick = () => {
      const value = input.value;
      overlay.remove();
      element.dispatchEvent(new CustomEvent('wb:prompt:ok', { bubbles: true, detail: { value } }));
    };
    
    input.onkeydown = (e) => {
      if (e.key === 'Enter') overlay.querySelector('.ok').click();
      if (e.key === 'Escape') overlay.querySelector('.cancel').click();
    };
    
    overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
    document.body.appendChild(overlay);
    input.focus();
    input.select();
  };

  return () => element.classList.remove('wb-prompt-trigger');
}

export default { popover, drawer, lightbox, offcanvas, sheet, confirm, prompt };
