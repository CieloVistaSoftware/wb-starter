// Compatibility shim: keep <wb-note> working but forward to <wb-issue>
// - preserves attributes and children
// - emits a one-time deprecation warning to console
(function(){
  let warned = false;
  class WBNoteCompat extends HTMLElement {
    connectedCallback(){
      if (!warned) {
        console.warn('DEPRECATION: <wb-note> is deprecated — use <wb-issue> instead. <wb-note> will be removed in a future release.');
        warned = true;
      }
      // If wb-issue is already defined, replace; otherwise leave DOM intact (CSS will still apply)
      if (customElements.get('wb-issue')) {
        const issue = document.createElement('wb-issue');
        // copy attributes
        for (const attr of Array.from(this.attributes || [])) issue.setAttribute(attr.name, attr.value);
        // move children
        while (this.firstChild) issue.appendChild(this.firstChild);
        this.replaceWith(issue);
      } else {
        // ensure styling parity by mirroring class
        this.classList.add('wb-issue', 'wb-note--compat');
      }
    }
  }
  if (!customElements.get('wb-note')) {
    customElements.define('wb-note', WBNoteCompat);
  }
})();
