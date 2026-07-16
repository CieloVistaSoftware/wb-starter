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
export function dialog(element, options = {}) {
  const config = {
    title: options.title || element.getAttribute('title') || element.getAttribute('modal-title') || element.dataset.dialogTitle || element.dataset.modalTitle || 'Dialog',
    content: options.content || element.getAttribute('content') || element.getAttribute('modal-content') || element.dataset.dialogContent || element.dataset.modalContent || '',
    size: options.size || element.getAttribute('size') || element.getAttribute('modal-size') || element.dataset.dialogSize || element.dataset.modalSize || 'md',
    // Schema declares variant: default/centered/fullscreen (appliesClass:
    // wb-dialog--{{value}}), but this was never read anywhere -- every
    // variant produced an identical dialog (confirmed live: "Centered" and
    // "Fullscreen" demo triggers opened the exact same default-positioned,
    // default-sized dialog).
    variant: options.variant || element.getAttribute('variant') || 'default',
    ...options
  };

  // Internal function to create and show the dialog
  const createAndShowDialog = (titleText, contentHtml, sizeVal, variantVal = 'default') => {
    // Create semantic <dialog> element
    const dialogEl = document.createElement('dialog');
    dialogEl.className = 'wb-dialog';
    if (variantVal && variantVal !== 'default') {
      dialogEl.classList.add(`wb-dialog--${variantVal}`);
    }
    // Unique per instance — a hardcoded id here would collide the moment two
    // dialogs exist in the DOM at once, leaving aria-labelledby pointing at
    // whichever dialog's title happens to come first for every OTHER instance.
    const titleId = `wb-dialog-title-${Math.random().toString(36).slice(2, 9)}`;
    dialogEl.setAttribute('aria-labelledby', titleId);
    dialogEl.setAttribute('aria-modal', 'true');

    const sizes = { sm: '320px', md: '480px', lg: '640px', xl: '800px' };
    dialogEl.style.maxWidth = sizes[sizeVal] || sizes.md;
    dialogEl.style.width = '90%';

    // HEADER (<header>)
    const header = document.createElement('header');
    header.className = 'wb-dialog__header';

    const title = document.createElement('h2');
    title.id = titleId;
    title.className = 'wb-dialog__title';
    title.textContent = titleText;
    header.appendChild(title);
    
    const closeBtn = document.createElement('button');
    closeBtn.className = 'wb-dialog__close';
    closeBtn.type = 'button';
    closeBtn.setAttribute('aria-label', 'Close dialog');
    closeBtn.innerHTML = '&times;';
    header.appendChild(closeBtn);
    
    dialogEl.appendChild(header);

    // MAIN (<main>) - body content
    const main = document.createElement('main');
    main.className = 'wb-dialog__body';
    main.innerHTML = contentHtml;
    dialogEl.appendChild(main);

    // FOOTER (<footer>)
    const footer = document.createElement('footer');
    footer.className = 'wb-dialog__footer';
    
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'wb-dialog__cancel wb-button wb-button--secondary wb-button--sm';
    cancelBtn.type = 'button';
    cancelBtn.textContent = 'Cancel';
    footer.appendChild(cancelBtn);
    
    const okBtn = document.createElement('button');
    okBtn.className = 'wb-dialog__ok wb-button wb-button--primary wb-button--sm';
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

    closeBtn.onclick = close;
    cancelBtn.onclick = close;
    okBtn.onclick = () => {
      element.dispatchEvent(new CustomEvent('wb:dialog:ok', { bubbles: true }));
      close();
    };
    
    // Click outside to close (on backdrop)
    dialogEl.addEventListener('click', (e) => {
      if (e.target === dialogEl) close();
    });
    
    // ESC key handled automatically by <dialog>
    dialogEl.addEventListener('close', () => {
      dialogEl.remove();
    });
  };

  // Gate widened from tagName==='WB-MODAL' to also cover x-modal on any
  // element (e.g. <button x-modal modal-title="…">) -- attribute presence,
  // not tag identity, is what actually distinguishes trigger vs definition
  // mode below, and x-modal on a non-wb-modal element used to silently fall
  // through both branches with no click handler attached at all. (#279)
  if (element.tagName === 'WB-MODAL' || element.hasAttribute('modal-content') || element.hasAttribute('modal-title')) {
    // TRIGGER mode: <wb-modal modal-title="…" modal-content="…">Open Modal</wb-modal>
    // is a visible button — its text is the label and clicking it opens a dialog
    // built from the attributes. (Previously wb-modal was always hidden with only a
    // showModal() method and no click handler, so "Open Modal" did nothing. #251)
    if (element.hasAttribute('modal-content') || element.hasAttribute('modal-title')) {
      element.classList.add('wb-modal-trigger', 'wb-dialog-trigger');
      element.style.cursor = 'pointer';
      const open = () => createAndShowDialog(config.title, config.content, config.size, config.variant);
      element.showModal = open;
      element.addEventListener('click', open);
      return () => element.removeEventListener('click', open);
    }

    // DEFINITION mode: no trigger attributes — the children are the modal content,
    // the element is hidden, and a caller invokes element.showModal().
    element.style.display = 'none';
    const slots = {};
    const titleSlot = element.querySelector('[slot="title"]');
    slots.title = titleSlot ? titleSlot.textContent : config.title;
    const contentContainer = document.createElement('div');
    Array.from(element.childNodes).forEach(node => {
      if (node.nodeType === 1 && node.getAttribute('slot') === 'title') return;
      contentContainer.appendChild(node.cloneNode(true));
    });
    const slotsContent = contentContainer.innerHTML;
    element.showModal = () => createAndShowDialog(slots.title, slotsContent, config.size, config.variant);
    return;
  }

  // If element is already a <dialog>, just enhance it with classes
  if (element.tagName === 'DIALOG') {
    element.classList.add('wb-dialog');
    element.classList.add('wb-modal');
    
    // Optional: Add size class if needed, or handle via CSS
    // The existing logic creates a new dialog, but for auto-injection on <dialog>,
    // we just want to style the existing one.
    
    return () => {
      element.classList.remove('wb-dialog', 'wb-modal');
    };
  }

  element.classList.add('wb-dialog-trigger');
  element.classList.add('wb-dialog'); // Marker for test compliance
  element.classList.add('wb-modal');
  element.style.cursor = 'pointer';

  const showDialog = () => {
    createAndShowDialog(config.title, config.content, config.size, config.variant);
  };

  element.addEventListener('click', showDialog);
  return () => element.removeEventListener('click', showDialog);
}

// Alias for
export { dialog as modal };

export default dialog;
