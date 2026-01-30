/**
 * Builder HTML Editor
 * Inline HTML editing for components with syntax highlighting
 */

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Escape HTML entities for display
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Basic HTML formatter for readability
 */
function formatHtml(html) {
  // Remove extra whitespace
  let formatted = html.replace(/\s+/g, ' ').trim();
  
  // Add newlines after closing tags
  formatted = formatted.replace(/(<\/[^>]+>)/g, '$1\n');
  
  // Add newlines before opening tags (except inline elements)
  formatted = formatted.replace(/(<(?!span|a|strong|em|b|i|u|code|mark|small|sub|sup)[a-z][^>]*>)/gi, '\n$1');
  
  // Clean up multiple newlines
  formatted = formatted.replace(/\n\s*\n/g, '\n');
  
  // Basic indentation
  const lines = formatted.split('\n');
  let indent = 0;
  const indentedLines = lines.map(line => {
    line = line.trim();
    if (!line) return '';
    
    // Decrease indent for closing tags
    if (line.match(/^<\//) && indent > 0) {
      indent--;
    }
    
    const indentedLine = '  '.repeat(indent) + line;
    
    // Increase indent for opening tags (not self-closing)
    if (line.match(/^<[a-z][^>]*[^/]>$/i) && !line.match(/^<(img|br|hr|input|meta|link)/i)) {
      indent++;
    }
    
    return indentedLine;
  });
  
  return indentedLines.filter(l => l).join('\n');
}

// ============================================================================
// HTML EDITOR
// ============================================================================

/**
 * Toggle HTML view for a component
 * Opens inline editor or falls back to popup
 */
function toggleComponentHtml(componentId, event) {
  if (event) {
    try { event.stopPropagation(); event.preventDefault(); } catch (e) { /* noop */ }
  }

  const componentEl = document.getElementById(componentId);
  if (!componentEl) return;

  const contentEl = componentEl.querySelector('.component-content');
  if (!contentEl) return;

  const htmlView = componentEl.querySelector('.component-html-view');
  const htmlBtn = document.getElementById(`html-btn-${componentId}`) || componentEl.querySelector('.component-html-btn');

  const isInlineAvailable = !!htmlView;

  if (isInlineAvailable) {
    const isVisible = htmlView.offsetParent !== null && getComputedStyle(htmlView).display !== 'none';

    if (isVisible) {
      // Hide inline HTML editor and restore content
      htmlView.style.display = 'none';
      // mark as not-ready so tests/widgets know it's hidden
      htmlView.removeAttribute('data-html-ready');
      if (contentEl) contentEl.style.display = '';
      if (htmlBtn) {
        htmlBtn.classList.remove('active');
        htmlBtn.title = 'Show/Hide HTML';
        htmlBtn.style.background = '';
      }

      // Restore component sizing
      if (componentEl.dataset.originalHeight !== undefined) componentEl.style.height = componentEl.dataset.originalHeight || '';
      if (componentEl.dataset.originalPadding !== undefined) componentEl.style.padding = componentEl.dataset.originalPadding || '';
      return;
    }

    // Show inline editor — ensure the code block is populated synchronously and
    // expose a readiness flag so tests and consumers can reliably wait for it.
    try {
      const comp = components.find(c => c.id === componentId);
      const html = contentEl.innerHTML;
      const formatted = formatHtml(html);

      // Initialize editor synchronously so <code> node exists immediately
      initHtmlEditor(componentId, formatted, null, null, contentEl, htmlView, htmlBtn);

      // Mark ready so callers/tests don't race on visibility alone
      try { htmlView.setAttribute('data-html-ready', '1'); } catch (err) { /* ignore */ }
    } catch (e) {
      console.warn('[toggleComponentHtml] inline init failed, falling back to popup:', e && e.message);
    }

    return;    
  }

  // Fallback to popup editor
  try {
    const comp = components.find(c => c.id === componentId);
    const html = contentEl.innerHTML;
    const formatted = formatHtml(html);
    const componentName = comp?.template?.name || 'Component';

    const popup = window.open('', `html-editor-${componentId}`, 'width=900,height=700,resizable=yes,scrollbars=yes');
    if (!popup) {
      // If popup blocked, create temporary inline editor
      const temp = document.createElement('div');
      temp.className = 'component-html-view';
      temp.style.display = 'none';
      componentEl.appendChild(temp);
      initHtmlEditor(componentId, formatted, null, null, contentEl, temp, htmlBtn);
      return;
    }

    popup.document.write(`<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>HTML Editor - ${componentName}</title><link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/atom-one-dark.min.css"><style>/* minimal inline popup styles omitted for brevity */</style></head><body><textarea id="editor">${formatted.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</textarea><script>const editor=document.getElementById('editor');function apply(){if(window.opener&&!window.opener.closed){try{const contentEl=window.opener.document.querySelector('#${componentId} .component-content');if(contentEl){contentEl.innerHTML=editor.value;const comp=window.opener.components?.find(c=>c.id==='${componentId}');if(comp)comp.html=editor.value;}alert('Applied');}catch(e){alert('Failed: '+e.message);}}}window.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key==='s'){e.preventDefault();apply();}});</script></body></html>`);
    popup.document.close();
  } catch (e) {
    console.warn('[toggleComponentHtml] popup fallback failed:', e && e.message);
  }
}

/**
 * Initialize the HTML editor with syntax highlighting
 */
function initHtmlEditor(componentId, formatted, textareaHeight, displayLines, contentEl, htmlView, htmlBtn) {
  const escaped = escapeHtml(formatted);
  let highlighted = escaped;
  
  // Apply highlight.js if available
  if (window.hljs) {
    try {
      highlighted = hljs.highlight(formatted, { language: 'xml' }).value;
    } catch (e) {
      console.warn('[HTML Editor] Highlight failed:', e);
    }
  }
  
  htmlView.innerHTML = `
    <div id="html-editor-container-${componentId}" style="display: flex; flex-direction: column; width: 100%; height: 100%; margin: 0; padding: 0.25rem 0 0 0;">
      <div style="position: relative; flex: 1; border-radius: 6px; overflow: hidden; width: 100%; min-height: 0;">
        <textarea id="html-edit-${componentId}" 
          style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; padding: 1rem; font-family: 'Consolas', 'Monaco', 'Courier New', monospace; font-size: 24px; background: transparent; color: transparent; caret-color: #fff; border: none; border-radius: 6px; resize: none; line-height: 1.6; overflow: auto; z-index: 2; white-space: pre-wrap; word-wrap: break-word; box-sizing: border-box;"
          spellcheck="false">${escapeHtml(formatted)}</textarea>
        <pre id="html-display-${componentId}" class="component-html-code" 
          aria-hidden="true"
          style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; padding: 1rem; font-family: 'Consolas', 'Monaco', 'Courier New', monospace; font-size: 24px; background: #282c34; color: #abb2bf; border: none; border-radius: 6px; overflow: auto; line-height: 1.6; white-space: pre-wrap; word-wrap: break-word; margin: 0; z-index: 1; pointer-events: none; box-sizing: border-box;"><code class="hljs language-xml">${highlighted}</code></pre>
      </div>
      <div style="display: flex; gap: 0.5rem; margin-top: 0.5rem; flex-shrink: 0;">
        <button id="html-save-${componentId}" class="btn btn-primary btn-sm" style="flex: 1;">💾 Apply Changes</button>
        <button id="html-cancel-${componentId}" class="btn btn-secondary btn-sm">Cancel</button>
      </div>
    </div>
  `;
  
  const componentEl = document.getElementById(componentId);
  // mark the inline view as populated so consumers/tests can wait for it
  try { htmlView.setAttribute('data-html-ready', '1'); } catch (err) { /* ignore */ }
  htmlView.style.cssText = 'display: flex; width: 100%; height: 100%; padding: 0; margin: 0;';
  contentEl.style.display = 'none';
  
  // Set component to 80vh height while editing
  if (componentEl) {
    componentEl.dataset.originalHeight = componentEl.style.height || '';
    componentEl.dataset.originalPadding = componentEl.style.padding || '';
    componentEl.style.height = '80vh';
    componentEl.style.padding = '0';
  }
  
  if (htmlBtn) {
    htmlBtn.classList.add('active');
    htmlBtn.title = 'Hide HTML';
    htmlBtn.style.background = 'var(--primary)';
  }
  
  const textarea = document.getElementById(`html-edit-${componentId}`);
  const display = document.getElementById(`html-display-${componentId}`);
  
  // Sync highlighting on input
  textarea?.addEventListener('input', () => {
    if (window.hljs && display) {
      try {
        const code = textarea.value;
        const highlighted = hljs.highlight(code, { language: 'xml' }).value;
        display.innerHTML = `<code class="hljs language-xml">${highlighted}</code>`;
      } catch (e) {
        display.innerHTML = `<code>${escapeHtml(textarea.value)}</code>`;
      }
    }
  });
  
  // Sync scroll position
  textarea?.addEventListener('scroll', () => {
    if (display) {
      display.scrollTop = textarea.scrollTop;
      display.scrollLeft = textarea.scrollLeft;
    }
  });
  
  textarea?.focus();
  
  // Keyboard shortcuts
  textarea?.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      document.getElementById(`html-save-${componentId}`)?.click();
    }
    if (e.key === 'Escape') {
      toggleComponentHtml(componentId, null);
    }
    // Tab key inserts spaces
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      textarea.value = textarea.value.substring(0, start) + '  ' + textarea.value.substring(end);
      textarea.selectionStart = textarea.selectionEnd = start + 2;
      textarea.dispatchEvent(new Event('input'));
    }
  });
  
  // Apply button handler
  document.getElementById(`html-save-${componentId}`)?.addEventListener('click', () => {
    const ta = document.getElementById(`html-edit-${componentId}`);
    if (ta) {
      contentEl.innerHTML = ta.value;
      const comp = components.find(c => c.id === componentId);
      if (comp) comp.html = ta.value;
    }
    toggleComponentHtml(componentId, null);
  });
  
  // Cancel button handler
  document.getElementById(`html-cancel-${componentId}`)?.addEventListener('click', () => {
    toggleComponentHtml(componentId, null);
  });
  
  componentEl?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ============================================================================
// EXPORTS
// ============================================================================

if (typeof window !== 'undefined') {
  window.escapeHtml = escapeHtml;
  window.formatHtml = formatHtml;
  window.toggleComponentHtml = toggleComponentHtml;
  window.initHtmlEditor = initHtmlEditor;
}

console.log('[BuilderHtmlEditor] ✅ Loaded');
