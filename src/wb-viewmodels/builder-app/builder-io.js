/**
 * Save, Export, and Import functionality for the builder.
 * - LocalStorage persistence, HTML export, JSON import.
 */
export function cc() {}

import { toast, updCount, chkEmpty } from './builder-utils.js';
import { analyzeComponent, updateBadges } from './builder-incomplete.js';
import { renderTree } from './builder-tree.js';

/**
 * Save page to localStorage
 */
export function savePage() {
  const canvas = document.getElementById('canvas');
  const pageData = [];
  
  canvas.querySelectorAll('.dropped:not(.grid-child)').forEach(wrapper => {
    const item = { ...JSON.parse(wrapper.dataset.c), id: wrapper.id };
    // Include grid children
    if (wrapper.dataset.grid) {
      item.children = [];
      wrapper.querySelectorAll('.grid-child').forEach(gridChild => {
        item.children.push({ ...JSON.parse(gridChild.dataset.c), id: gridChild.id, span: gridChild.dataset.span });
      });
    }
    pageData.push(item);
  });

  const selectedTheme = document.getElementById('pageTheme').value;
  const templateName = document.body.dataset.templateName;
  localStorage.setItem('wb-builder-page', JSON.stringify({ theme: selectedTheme, templateName, components: pageData }));
  toast('Page saved!');
  document.getElementById('saveMenu')?.classList.remove('show');
}

/**
 * Save as HTML file for download
 */
export function saveAsHTML() {
  const canvas = document.getElementById('canvas');
  let headerContent = '';
  let mainContent = '';
  let footerContent = '';

  // Behaviors that regenerate content from data attributes
  const CONTENT_GENERATION_ATTRS = {
    'navbar': ['data-items'],
    'menu': ['data-items'],
    'sidebar': ['data-items'],
    'tabs': ['data-tabs'],
    'accordion': ['data-items'],
  };

  // Helper to clean the DOM tree
  function cleanForExport(node, parentWrapper = null) {
    if (node.nodeType === Node.COMMENT_NODE) return null;
    if (node.nodeType === Node.TEXT_NODE) return node.cloneNode(true);
    if (node.nodeType !== Node.ELEMENT_NODE) return null;

    // Skip controls and builder UI elements
    if (node.classList.contains('controls') || 
        node.classList.contains('ui-resizable-handle') ||
        node.classList.contains('wb-resize-handle') ||
        node.classList.contains('wb-width-indicator') ||
        node.classList.contains('wb-width-presets') ||
        node.classList.contains('incomplete-badge') ||
        node.classList.contains('span-btns')) {
      return null;
    }

    // Unwrap .dropped wrappers
    if (node.classList.contains('dropped')) {
      const contentEl = node.querySelector(':scope > [data-wb]') || 
                        node.querySelector(':scope > *:not(.controls)');
      return contentEl ? cleanForExport(contentEl, node) : null;
    }

    // Clone and clean element
    const clone = node.cloneNode(false);
    clone.removeAttribute('contenteditable');
    clone.removeAttribute('spellcheck');
    clone.removeAttribute('data-wb-id');
    clone.removeAttribute('data-editable-key');
    
    // Clean up builder-specific classes
    clone.classList.remove('canvas-editable', 'dropped', 'selected', 'container-child', 'grid-child', 'is-container');
    
    // If component has custom children, remove generation attrs
    if (parentWrapper && parentWrapper.querySelectorAll('.dropped').length > 0) {
      const behavior = clone.dataset.wb;
      if (behavior && CONTENT_GENERATION_ATTRS[behavior]) {
        CONTENT_GENERATION_ATTRS[behavior].forEach(attr => {
          clone.removeAttribute(attr);
        });
      }
    }
    
    // Remove builder-specific styles
    if (clone.style.border && clone.style.border.includes('dashed')) {
      clone.style.removeProperty('border');
    }
    if (clone.style.length === 0) {
      clone.removeAttribute('style');
    }
    
    // Remove empty class
    if (clone.classList.length === 0) {
      clone.removeAttribute('class');
    }

    // Recurse
    Array.from(node.childNodes).forEach(child => {
      const cleaned = cleanForExport(child);
      if (cleaned) clone.appendChild(cleaned);
    });

    return clone;
  }

  Array.from(canvas.children).forEach(wrapper => {
    if (!wrapper.classList.contains('dropped')) return;
    
    const cleanedEl = cleanForExport(wrapper);
    if (!cleanedEl) return;

    const tagName = cleanedEl.tagName.toLowerCase();
    const behavior = cleanedEl.dataset.wb || '';

    if (tagName === 'header' || tagName === 'nav' || behavior.includes('navbar')) {
      headerContent += cleanedEl.outerHTML + '\n';
    } else if (tagName === 'footer') {
      footerContent += cleanedEl.outerHTML + '\n';
    } else {
      mainContent += cleanedEl.outerHTML + '\n';
    }
  });

  const selectedTheme = document.getElementById('pageTheme')?.value || 'dark';
  const templateName = document.body.dataset.templateName || '';

  const fullHtml = `<!DOCTYPE html>
<html lang="en" data-theme="${selectedTheme}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Exported Page</title>
  <link rel="stylesheet" href="src/styles/themes.css">
  <link rel="stylesheet" href="src/styles/site.css">
  <link rel="stylesheet" href="src/styles/transitions.css">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <style>
    body { margin: 0; padding: 0; min-height: 100vh; display: flex; flex-direction: column; }
    main { flex: 1; display: flex; flex-direction: column; }
  </style>
</head>
<body${templateName ? ` data-templateName="${templateName}"` : ''}>
  ${headerContent}
  <main>
    ${mainContent}
  </main>
  ${footerContent}
  <script type="module">
    import WB from '/src/index.js';
  </script>
</body>
</html>`;

  // Create download
  const htmlBlob = new Blob([fullHtml], { type: 'text/html' });
  const downloadUrl = URL.createObjectURL(htmlBlob);
  const downloadLink = document.createElement('a');
  downloadLink.href = downloadUrl;
  downloadLink.download = 'page-export.html';
  downloadLink.click();
  URL.revokeObjectURL(downloadUrl);

  toast('Exported HTML!');
  document.getElementById('saveMenu')?.classList.remove('show');
}

/**
 * Export page as JSON
 */
export function exportJSON() {
  const canvas = document.getElementById('canvas');
  const exportData = [];

  // Check for incomplete components first
  const allWrappers = canvas.querySelectorAll('.dropped');
  let totalIssues = 0;
  let totalWarnings = 0;

  allWrappers.forEach(wrapper => {
    const analysis = analyzeComponent(wrapper);
    totalIssues += analysis.issues.length;
    totalWarnings += analysis.warnings.length;
  });

  // Warn user about incomplete items
  if (totalIssues > 0) {
    const proceed = confirm(`⚠️ ${totalIssues} required field${totalIssues > 1 ? 's are' : ' is'} missing.\n\nExport anyway?`);
    if (!proceed) {
      toast('Export cancelled - fix issues first');
      updateBadges();
      return;
    }
  } else if (totalWarnings > 0) {
    toast(`Note: ${totalWarnings} placeholder value${totalWarnings > 1 ? 's' : ''} detected`);
  }

  canvas.querySelectorAll('.dropped:not(.grid-child):not(.container-child)').forEach(wrapper => {
    const item = {
      ...JSON.parse(wrapper.dataset.c),
      id: wrapper.id
    };

    // Include grid children
    if (wrapper.dataset.grid) {
      item.children = [];
      wrapper.querySelectorAll('.grid-child').forEach(gridChild => {
        item.children.push({
          ...JSON.parse(gridChild.dataset.c),
          id: gridChild.id,
          span: gridChild.dataset.span
        });
      });
    }

    // Include container children
    const containerChildren = wrapper.querySelectorAll('.container-child');
    if (containerChildren.length > 0) {
      item.children = item.children || [];
      containerChildren.forEach(containerChild => {
        item.children.push({
          ...JSON.parse(containerChild.dataset.c),
          id: containerChild.id
        });
      });
    }

    exportData.push(item);
  });

  const jsonExport = {
    version: '1.0.0',
    exported: new Date().toISOString(),
    theme: document.getElementById('pageTheme')?.value || 'dark',
    components: exportData,
    metadata: {
      componentCount: exportData.length,
      source: 'WB Page Builder'
    }
  };

  // Create and download file
  const jsonBlob = new Blob([JSON.stringify(jsonExport, null, 2)], { type: 'application/json' });
  const downloadUrl = URL.createObjectURL(jsonBlob);
  const downloadLink = document.createElement('a');
  downloadLink.href = downloadUrl;
  downloadLink.download = `page-export-${Date.now()}.json`;
  downloadLink.click();
  URL.revokeObjectURL(downloadUrl);

  toast(`Exported ${exportData.length} components`);
}

/**
 * Import page from JSON file
 * @param {Function} addFn - The add function to create components
 * @param {Function} addToGridFn - The addToGrid function
 * @param {Function} setSpanFn - The setSpan function
 * @param {Function} saveHistFn - The saveHist function
 */
export function importJSON(addFn, addToGridFn, setSpanFn, saveHistFn) {
  // Create file input
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = '.json';

  fileInput.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const fileText = await file.text();
      const importData = JSON.parse(fileText);

      // Validate structure
      if (!importData.components || !Array.isArray(importData.components)) {
        toast('Invalid file format');
        return;
      }

      // Confirm import
      const componentCount = importData.components.length;
      if (!confirm(`Import ${componentCount} components? This will clear the current canvas.`)) {
        return;
      }

      // Clear canvas
      document.getElementById('canvas').innerHTML = '';
      window.sel = null;

      // Set theme if present
      if (importData.theme) {
        const themeSelect = document.getElementById('pageTheme');
        if (themeSelect) {
          themeSelect.value = importData.theme;
          document.documentElement.dataset.theme = importData.theme;
          document.getElementById('canvas').dataset.theme = importData.theme;
        }
      }

      // Add components
      importData.components.forEach(comp => {
        addFn(comp);

        // Add grid children if present
        if (comp.children && comp.children.length > 0) {
          const gridWrapper = document.getElementById(comp.id);
          if (gridWrapper?.dataset.grid) {
            comp.children.forEach(gridChild => {
              addToGridFn(gridChild, gridWrapper);
              if (gridChild.span) setSpanFn(gridChild.id, parseInt(gridChild.span));
            });
          }
        }
      });

      saveHistFn();
      toast(`Imported ${componentCount} components`);

    } catch (err) {
      console.error('[Import Error]', err);
      toast('Failed to import: ' + err.message);
    }
  };

  fileInput.click();
}

/**
 * Reset the canvas
 * @param {Function} saveHistFn - Optional saveHist function
 */
export function resetCanvas(saveHistFn) {
  if (confirm('Reset canvas? This will clear all components.')) {
    document.getElementById('canvas').innerHTML = '<div class="empty" id="empty"><div class="empty-icon">+</div><h3>Drag components here</h3><p>Build your page visually</p></div>';
    localStorage.removeItem('wb-builder-page');
    delete document.body.dataset.templateName;
    window.sel = null;
    updCount();
    renderTree();
    
    // Clear properties panel
    const propsPanel = document.getElementById('propsPanel');
    if (propsPanel) propsPanel.innerHTML = '';
    const propsHeader = document.getElementById('propsHeader');
    if (propsHeader) {
       const subtitle = propsHeader.querySelector('span');
       if (subtitle) subtitle.style.display = '';
    }
  }
  document.getElementById('saveMenu')?.classList.remove('show');
}

/**
 * Toggle save menu dropdown
 */
export function toggleSaveMenu() {
  document.getElementById('saveMenu').classList.toggle('show');
}

// Expose globally
window.savePage = savePage;
window.saveAsHTML = saveAsHTML;
window.exportJSON = exportJSON;
window.exportCode = saveAsHTML;
window.toggleSaveMenu = toggleSaveMenu;
