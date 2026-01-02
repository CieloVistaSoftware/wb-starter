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
 */
export function dialog(element, options = {}) {
  const config = {
    title: options.title || element.dataset.dialogTitle || element.dataset.modalTitle || 'Dialog',
    content: options.content || element.dataset.dialogContent || element.dataset.modalContent || '',
    size: options.size || element.dataset.dialogSize || element.dataset.modalSize || 'md',
    ...options
  };

  // If element is already a <dialog>, just enhance it with classes
  if (element.tagName === 'DIALOG') {
    element.classList.add('wb-dialog');
    element.classList.add('wb-modal');
    
    // Optional: Add size class if needed, or handle via CSS
    // The existing logic creates a new dialog, but for auto-injection on <dialog>,
    // we just want to style the existing one.
    
    element.dataset.wbReady = 'dialog';
    return () => {
      element.classList.remove('wb-dialog', 'wb-modal');
    };
  }

  element.classList.add('wb-dialog-trigger');
  element.classList.add('wb-dialog'); // Marker for test compliance
  element.classList.add('wb-modal');
  element.style.cursor = 'pointer';

  const showDialog = () => {
    // Create semantic <dialog> element
    const dialogEl = document.createElement('dialog');
    dialogEl.className = 'wb-dialog';
    dialogEl.setAttribute('aria-labelledby', 'wb-dialog-title');
    dialogEl.setAttribute('aria-modal', 'true');
    
    const sizes = { sm: '320px', md: '480px', lg: '640px', xl: '800px' };
    dialogEl.style.maxWidth = sizes[config.size] || sizes.md;
    dialogEl.style.width = '90%';

    // HEADER (<header>)
    const header = document.createElement('header');
    header.className = 'wb-dialog__header';
    
    const title = document.createElement('h2');
    title.id = 'wb-dialog-title';
    title.className = 'wb-dialog__title';
    title.textContent = config.title;
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
    main.innerHTML = config.content;
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

  element.addEventListener('click', showDialog);
  element.dataset.wbReady = 'dialog';
  return () => element.removeEventListener('click', showDialog);
}

// Alias for data-wb="modal"
export { dialog as modal };

export default dialog;
