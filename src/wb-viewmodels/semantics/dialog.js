import { readAttr, readFlag, hasAuthoredAttr } from '../../core/read-attr.js';
/**
 * WB Dialog Behavior - Semantic dialog modal
 * 
 * SEMANTIC STANDARD:
 * - Overlay: Creates <dialog> element (native HTML5 dialog)
 * - Header: <header>
 * - Body: <main>
 * - Footer: <footer>
 * 
 * The <dialog> element provides native accessibility features.
 * Helper Attribute: [x-behavior="dialog"]
 */
const SIZES = ['sm', 'md', 'lg', 'xl', 'full'];

/** dialog.schema.json: size appliesClass x-dialog--{{value}}; unknown -> md. */
function sizeClass(size) {
  return `x-dialog--${SIZES.includes(size) ? size : 'md'}`;
}

/**
 * Append the header's x close button when `show` is set, and return it (null
 * otherwise). Both the trigger-built and the authored path did this (#883).
 */
function addCloseButton(header, show) {
  if (!show) return null;
  const closeBtn = document.createElement('button');
  closeBtn.className = 'x-dialog__close';
  closeBtn.type = 'button';
  closeBtn.setAttribute('aria-label', 'Close dialog');
  closeBtn.innerHTML = '&times;';
  header.appendChild(closeBtn);
  return closeBtn;
}

/**
 * Every option this behavior accepts, read ONCE, under the name
 * dialog.schema.json declares (#747).
 *
 * The three booleans went through `readFlag` already (#1005), so `"false"`
 * parsed as false -- and `showClose="false"` still showed the close button,
 * because the NAME read was the dashed one. `readFlag(element, 'show-close')`
 * looked up `show-close` and `data-show-close`; the `showClose` the schema
 * declares and the issue's own markup uses was never looked for, so it fell
 * back to the default: ON. The name was the bug, not the value parse.
 *
 * The fallbacks below ARE the schema's defaults (all three booleans true), so
 * the reader and the schema cannot drift. The older dashed spellings keep
 * working: readAttr/readFlag read the kebab form too, by design.
 *
 * `modalTitle`/`modalContent`/`modalSize` are the legacy trigger names, kept
 * because docs/behaviors/modal.md and modal.schema.json still teach them; they
 * are read here under the camelCase spelling for the same reason.
 */
function optionsFrom(element, options = {}) {
  return {
    title: options.title || readAttr(element, 'title') || readAttr(element, 'modalTitle')
      || readAttr(element, 'dialogTitle') || 'Dialog',
    content: options.content || readAttr(element, 'content') || readAttr(element, 'modalContent')
      || readAttr(element, 'dialogContent') || '',
    size: options.size || readAttr(element, 'size') || readAttr(element, 'modalSize')
      || readAttr(element, 'dialogSize') || 'md',
    // Schema declares variant: default/centered/fullscreen (appliesClass:
    // x-dialog--{{value}}), but this was never read anywhere -- every
    // variant produced an identical dialog (confirmed live: "Centered" and
    // "Fullscreen" demo triggers opened the exact same default-positioned,
    // default-sized dialog).
    variant: options.variant || readAttr(element, 'variant') || 'default',
    closeOnBackdrop: options.closeOnBackdrop ?? readFlag(element, 'closeOnBackdrop', true),
    closeOnEscape: options.closeOnEscape ?? readFlag(element, 'closeOnEscape', true),
    showClose: options.showClose ?? readFlag(element, 'showClose', true),
    ...options
  };
}

export function dialog(element, options = {}) {
  const config = optionsFrom(element, options);

  // Internal function to create and show the dialog
  const createAndShowDialog = (titleText, contentHtml, sizeVal, variantVal = 'default') => {
    // Create semantic <dialog> element
    const dialogEl = document.createElement('dialog');
    dialogEl.className = 'x-dialog';
    if (variantVal && variantVal !== 'default') {
      dialogEl.classList.add(`x-dialog--${variantVal}`);
    }
    // Unique per instance — a hardcoded id here would collide the moment two
    // dialogs exist in the DOM at once, leaving aria-labelledby pointing at
    // whichever dialog's title happens to come first for every OTHER instance.
    const titleId = `x-dialog-title-${Math.random().toString(36).slice(2, 9)}`;
    dialogEl.setAttribute('aria-labelledby', titleId);
    dialogEl.setAttribute('aria-modal', 'true');

    // The width comes from dialog.css's x-dialog--{size} (the schema's
    // appliesClass), shared with the authored-<dialog> path below. This used
    // to be an inline max-width table with no `full` entry, which only this
    // path ever read -- so an authored <dialog size="xl"> stayed default-sized.
    dialogEl.classList.add(sizeClass(sizeVal));
    // The attribute too: this <dialog> is itself upgraded by the authored path
    // once it is in the document, and with no size there that pass added
    // x-dialog--md beside --sm and the later rule won.
    dialogEl.setAttribute('size', sizeVal);

    // HEADER (<header>)
    const header = document.createElement('header');
    header.className = 'x-dialog__header';

    const title = document.createElement('h2');
    title.id = titleId;
    title.className = 'x-dialog__title';
    title.textContent = titleText;
    header.appendChild(title);
    
    const closeBtn = addCloseButton(header, config.showClose);

    dialogEl.appendChild(header);

    // MAIN (<main>) - body content
    const main = document.createElement('main');
    main.className = 'x-dialog__body';
    main.innerHTML = contentHtml;
    dialogEl.appendChild(main);

    // FOOTER (<footer>)
    const footer = document.createElement('footer');
    footer.className = 'x-dialog__footer';
    
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'x-dialog__cancel x-button x-button--secondary x-button--sm';
    cancelBtn.type = 'button';
    cancelBtn.textContent = 'Cancel';
    footer.appendChild(cancelBtn);
    
    const okBtn = document.createElement('button');
    okBtn.className = 'x-dialog__ok x-button x-button--primary x-button--sm';
    okBtn.type = 'button';
    okBtn.textContent = 'OK';
    footer.appendChild(okBtn);
    
    dialogEl.appendChild(footer);

    // Add to document
    document.body.appendChild(dialogEl);

    // Show using native dialog API
    dialogEl.showModal();

    // Close handlers
    const close = () => {
      dialogEl.close();
      dialogEl.remove();
    };

    if (closeBtn) closeBtn.onclick = close;
    cancelBtn.onclick = close;
    okBtn.onclick = () => {
      element.dispatchEvent(new CustomEvent('wb:dialog:ok', { bubbles: true }));
      close();
    };
    
    // Click outside to close (on backdrop)
    if (config.closeOnBackdrop) {
      dialogEl.addEventListener('click', (e) => {
        if (e.target === dialogEl) close();
      });
    }
    
    // ESC key handled automatically by <dialog>; `closeOnEscape="false"`
    // cancels the native 'cancel' event so Escape leaves it open.
    if (!config.closeOnEscape) {
      dialogEl.addEventListener('cancel', (e) => e.preventDefault());
    }
    dialogEl.addEventListener('close', () => {
      dialogEl.remove();
    });
  };

  // Gate widened from tagName==='WB-MODAL' to also cover x-modal on any
  // element (e.g. <button x-modal modal-title="…">) -- attribute presence,
  // not tag identity, is what actually distinguishes trigger vs definition
  // mode below, and x-modal on a non-wb-modal element used to silently fall
  // through both branches with no click handler attached at all. (#279)
  //
  // hasTriggerAttrs also checks the data-modal-* spelling: this used to be
  // JUST the plain names, so a <dialog data-modal-title="…"> matched the
  // OUTER gate via tagName (entering this if) but failed THIS check, silently
  // falling into DEFINITION mode -- element.style.display='none', hiding the
  // visible trigger button entirely with no error. config.title/content
  // above already tolerated the data- spelling via dataset fallback; the
  // gate itself did not, which is the actual bug (Law 11 violation in the
  // MARKUP is the root cause, but the gate should degrade gracefully too,
  // matching audio.js/lightbox.js's established plain-first/data-fallback
  // pattern rather than silently hiding the element).
  //
  // hasAuthoredAttr asks only whether the author wrote the attribute, in any
  // accepted spelling -- which is the actual question here, and the reason
  // this is not readFlag: a gate that calls readFlag reads `modal-title` as a
  // FLAG, so `modal-title="false"` would have meant "no title attribute".
  // It also covers the camelCase spelling, which neither the plain nor the
  // data- lookup did: <button x-dialog modalTitle="…" modalContent="…"> fell
  // straight through this gate and opened a dialog titled "Dialog" with the
  // trigger's own label as its body (#747, #1125).
  const hasTriggerAttrs = hasAuthoredAttr(element, 'modalContent') || hasAuthoredAttr(element, 'modalTitle');
  if (hasTriggerAttrs) {
    // TRIGGER mode: <dialog modal-title="…" modal-content="…">Open Modal</dialog>
    // is a visible button — its text is the label and clicking it opens a dialog
    // built from the attributes. (Previously x-modal was always hidden with only a
    // showModal() method and no click handler, so "Open Modal" did nothing. #251)
    if (hasTriggerAttrs) {
      // cursor: pointer is .x-dialog-trigger in dialog.css (#779).
      element.classList.add('x-modal-trigger', 'x-dialog-trigger');
      const open = () => createAndShowDialog(config.title, config.content, config.size, config.variant);
      // .open() alongside .showModal(): the docs teach an external trigger
      // calling document.getElementById(id).open() (matching the native
      // <dialog>-adjacent naming this framework uses elsewhere), but only
      // .showModal was ever assigned here -- that call always threw
      // "open is not a function". Both names now resolve to the same
      // function rather than picking one and leaving the other undocumented
      // or unimplemented. (#531)
      element.showModal = open;
      element.open = open;
      element.addEventListener('click', open);
      return () => element.removeEventListener('click', open);
    }

    // DEFINITION mode: no trigger attributes — the children are the modal content,
    // the element is hidden, and a caller invokes element.open() (or .showModal()).
    // Hidden by .x-modal-definition in dialog.css, not element.style (#779).
    element.classList.add('x-modal-definition');
    const slots = {};
    const titleSlot = element.querySelector('[slot="title"]');
    slots.title = titleSlot ? titleSlot.textContent : config.title;
    const contentContainer = document.createElement('div');
    Array.from(element.childNodes).forEach(node => {
      if (node.nodeType === 1 && node.getAttribute('slot') === 'title') return;
      contentContainer.appendChild(node.cloneNode(true));
    });
    const slotsContent = contentContainer.innerHTML;
    const openDefined = () => createAndShowDialog(slots.title, slotsContent, config.size, config.variant);
    element.showModal = openDefined;
    element.open = openDefined; // (#531) same rationale as the TRIGGER branch above
    return;
  }

  // An authored <dialog>, enhanced IN PLACE (#1005).
  //
  // This branch used to add two classes and stop -- "we just want to style the
  // existing one". Two things were wrong with that, both visible the moment a
  // sample was opened:
  //
  //   1. NO WAY OUT YOU CAN SEE. John: "all dialog samples must have a close
  //      button showing." Escape and the backdrop are not visible affordances.
  //      The other dialog path (createAndShowDialog, for `x-dialog` on a
  //      trigger) has always built a .x-dialog__close; an authored <dialog>
  //      got nothing, so half the samples on the Behaviors page opened as
  //      traps.
  //   2. TEXT FLUSH AGAINST THE EDGE. `.x-dialog` is `padding: 0` on purpose --
  //      the padding lives on `.x-dialog__body` -- so raw children sat at 0px
  //      from the frame, breaking DEMOS-AND-DOCS-STANDARDS.md 13 (>=1rem of
  //      breathing room). Adding the class without adding the structure the
  //      class assumes is what produced that.
  //
  // The authored markup is the source of truth, so nothing here is rebuilt from
  // attributes: the heading is MOVED into the header (keeping its id, its text
  // and any listeners on it) and the remaining children are MOVED into the
  // body. Moving, not cloning -- cloning would leave every id duplicated and
  // every handler bound to a node no longer in the document, the same trap that
  // made the fieldset toggle dead in #999.
  if (element.tagName === 'DIALOG') {
    element.classList.add('x-dialog');
    element.classList.add('x-modal');
    // size and variant were read into config and then dropped on this path:
    // every size=… sample on the behaviors page opened at the same width.
    const sizeCls = sizeClass(config.size);
    const variantCls = config.variant && config.variant !== 'default' ? `x-dialog--${config.variant}` : null;
    element.classList.add(sizeCls);
    if (variantCls) element.classList.add(variantCls);

    // Idempotent: behaviors can be re-run over the same DOM, and a second pass
    // must not nest a header inside a header.
    if (element.querySelector(':scope > .x-dialog__header')) {
      return () => {
        element.classList.remove('x-dialog', 'x-modal', sizeCls);
        if (variantCls) element.classList.remove(variantCls);
      };
    }

    const authored = Array.from(element.childNodes);
    const heading = authored.find(
      (n) => n.nodeType === 1 && /^H[1-6]$/.test(n.tagName)
    );

    const header = document.createElement('header');
    header.className = 'x-dialog__header';

    if (heading) {
      heading.classList.add('x-dialog__title');
      if (!heading.id) {
        heading.id = `x-dialog-title-${Math.random().toString(36).slice(2, 9)}`;
      }
      element.setAttribute('aria-labelledby', heading.id);
      header.appendChild(heading);
    }

    const closeBtn = addCloseButton(header, config.showClose);

    const body = document.createElement('main');
    body.className = 'x-dialog__body';
    for (const node of authored) {
      if (node === heading) continue;
      body.appendChild(node);
    }

    element.prepend(body);
    element.prepend(header);

    const closeDialog = () => element.close();
    if (closeBtn) closeBtn.addEventListener('click', closeDialog);

    // #1005: closeOnBackdrop / closeOnEscape / showClose are now read
    // (config above), so the `closeOnBackdrop="false"` sample stays inert
    // while the default gets the documented backdrop-close. A click whose
    // target is the <dialog> itself landed on the ::backdrop, since every
    // child sits inside header/body.
    const onBackdrop = (e) => { if (e.target === element) element.close(); };
    if (config.closeOnBackdrop) element.addEventListener('click', onBackdrop);
    const onCancel = (e) => e.preventDefault();
    if (!config.closeOnEscape) element.addEventListener('cancel', onCancel);

    return () => {
      if (closeBtn) closeBtn.removeEventListener('click', closeDialog);
      element.removeEventListener('click', onBackdrop);
      element.removeEventListener('cancel', onCancel);
      if (heading) {
        heading.classList.remove('x-dialog__title');
        element.prepend(heading);
      }
      while (body.firstChild) element.appendChild(body.firstChild);
      header.remove();
      body.remove();
      element.classList.remove('x-dialog', 'x-modal', sizeCls);
      if (variantCls) element.classList.remove(variantCls);
    };
  }

  element.classList.add('x-dialog-trigger');
  // #448: no classList.add('x-dialog') here -- it just duplicated this
  // element's own <dialog> tag name (the "Marker for test compliance"
  // comment predates #448's compliance test, which now flags exactly this
  // pattern). dialog.css's `.x-dialog`/`::backdrop`/`[open]` rules select
  // the tag directly; the class stays load-bearing for the OTHER two
  // branches above (a dynamically-created native <dialog> popup, and an
  // in-place-enhanced pre-existing native <dialog>), neither of which is
  // this <dialog>-as-its-own-trigger case.
  element.classList.add('x-modal');

  // config.content only ever reads a `content`/`modal-content` attribute --
  // this element's real content is its light-DOM children (e.g.
  // <dialog id="x"><p>...</p></dialog>), same as DEFINITION mode
  // above. Captured once, up front, before the element's markup is used
  // for anything else, mirroring that branch's own approach. (#531)
  const childContent = (() => {
    const container = document.createElement('div');
    Array.from(element.childNodes).forEach(node => container.appendChild(node.cloneNode(true)));
    return container.innerHTML;
  })();

  const showDialog = () => {
    createAndShowDialog(config.title, config.content || childContent, config.size, config.variant);
  };

  // A bare <dialog id="x"> with no trigger attributes previously only
  // ever opened itself on click -- no method was assigned at all, so an
  // external `document.getElementById('x').open()` (the pattern this
  // component's own docs teach) threw "open is not a function". Both names
  // are exposed for the same reason the other two branches expose them.
  // (#531)
  element.open = showDialog;
  element.showModal = showDialog;

  element.addEventListener('click', showDialog);
  return () => element.removeEventListener('click', showDialog);
}

// Alias for
export { dialog as modal };

export default dialog;
