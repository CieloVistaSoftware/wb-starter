/**
 * Documentation viewer for component help and schemas.
 * - Modal display of behavior docs and schema info.
 */
export function cc() {}

// Cache for loaded docs
const docsCache = {};

// Known categories for doc paths
const DOC_CATEGORIES = [
  'cards',
  'semantic',
  'layout',
  'effects',
  'feedback',
  'forms',
  'media',
  'navigation'
];

/**
 * Show documentation modal for a specific behavior
 */
export async function showDocs(behavior, initialTab = 'docs') {
  const modal = document.getElementById('docsModal');
  const titleEl = document.getElementById('docsModalTitle');
  const bodyEl = document.getElementById('docsModalBody');
  const iconEl = document.getElementById('docsModalIcon');
  
  if (!modal || !titleEl || !bodyEl) return;
  
  // Set title
  titleEl.textContent = behavior.charAt(0).toUpperCase() + behavior.slice(1);
  
  // Find icon from component list if possible
  const compItem = document.querySelector(`.comp-item[data-c*='"b":"${behavior}"']`);
  if (compItem) {
    const icon = compItem.querySelector('.comp-icon')?.textContent;
    if (icon && iconEl) iconEl.textContent = icon;
  }
  
  // Show modal
  modal.classList.add('open');
  // document.body.style.overflow = 'hidden'; // Don't block body for drawer
  
  // Initialize resizer if not already done
  initDocsResizer();
  
  // Reset to docs tab
  switchDocsTab(initialTab);
  
  // Show loading state
  bodyEl.innerHTML = '<div class="docs-loading">Loading documentation...</div>';
  
  // Store current behavior on modal for tab switching
  modal.dataset.behavior = behavior;
  
  // Load content
  await loadDocsContent(behavior, initialTab);
}

let resizerInitialized = false;

function initDocsResizer() {
  if (resizerInitialized) return;
  
  const modal = document.getElementById('docsModal');
  if (!modal) return;
  
  // Inject handle
  let handle = document.getElementById('docsResizeHandle');
  if (!handle) {
    handle = document.createElement('div');
    handle.id = 'docsResizeHandle';
    handle.className = 'docs-resize-handle';
    modal.appendChild(handle);
  }
  
  let isResizing = false;
  let startX = 0;
  let startWidth = 0;
  
  handle.addEventListener('mousedown', (e) => {
    e.preventDefault();
    isResizing = true;
    startX = e.clientX;
    startWidth = modal.offsetWidth;
    modal.classList.add('resizing');
    document.body.style.cursor = 'ew-resize';
    document.body.style.userSelect = 'none';
  });
  
  document.addEventListener('mousemove', (e) => {
    if (!isResizing) return;
    // Drag left = wider (since it's on the right)
    const deltaX = startX - e.clientX;
    const newWidth = Math.max(320, Math.min(window.innerWidth * 0.9, startWidth + deltaX));
    modal.style.width = `${newWidth}px`;
  });
  
  document.addEventListener('mouseup', () => {
    if (isResizing) {
      isResizing = false;
      modal.classList.remove('resizing');
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }
  });
  
  resizerInitialized = true;
}

/**
 * Close documentation modal
 */
export function closeDocsModal() {
  const modal = document.getElementById('docsModal');
  if (modal) {
    modal.classList.remove('open');
    document.body.style.overflow = '';
  }
}

/**
 * Switch between Docs and Schema tabs
 */
export function switchDocsTab(tab) {
  const modal = document.getElementById('docsModal');
  if (!modal) return;
  
  // Update buttons
  document.querySelectorAll('.docs-tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tab);
  });
  
  // Load content if behavior is set
  const behavior = modal.dataset.behavior;
  if (behavior) {
    loadDocsContent(behavior, tab);
  }
}

/**
 * Load content for the current tab
 */
async function loadDocsContent(behavior, tab = 'docs') {
  const bodyEl = document.getElementById('docsModalBody');
  if (!bodyEl) return;
  
  const cacheKey = `${behavior}:${tab}`;
  
  // Check cache first
  if (docsCache[cacheKey]) {
    bodyEl.innerHTML = docsCache[cacheKey];
    return;
  }
  
  try {
    let content = '';
    
    if (tab === 'schema') {
      // Load JSON Schema
      const response = await fetch(`src/behaviors/schema/${behavior}.schema.json?caller=builder-docs`);
      if (response.ok) {
        const schema = await response.json();
        content = renderSchema(schema);
      } else {
        content = `<div class="docs-error">
          <h3>Schema not found</h3>
          <p>No schema definition found for <code>${behavior}</code>.</p>
        </div>`;
      }
    } else {
      // Load Markdown Docs
      // Try multiple paths
      const paths = [
        `docs/components/${behavior}.md`,
        `docs/${behavior}.md`
      ];
      
      // Add category paths
      // Ensure behavior is lowercase for file paths
      const lowerBehavior = behavior.toLowerCase();
      
      DOC_CATEGORIES.forEach(cat => {
        paths.unshift(`docs/components/${cat}/${lowerBehavior}.md`);
      });
      
      // Also try direct path with lowercase
      paths.push(`docs/components/${lowerBehavior}.md`);
      paths.push(`docs/${lowerBehavior}.md`);
      
      let docResponse = null;
      let foundPath = '';
      
      for (const path of paths) {
        try {
          const r = await fetch(path + '?caller=builder-docs');
          if (r.ok) {
            docResponse = r;
            foundPath = path;
            break;
          }
        } catch (e) { continue; }
      }
      
      if (docResponse && docResponse.ok) {
        const text = await docResponse.text();
        content = mdhtml(text);
        content += `<div class="docs-source">Source: ${foundPath}</div>`;
      } else {
        // Fallback: Generate docs from schema if available
        const schemaResponse = await fetch(`src/behaviors/schema/${behavior}.schema.json?caller=builder-docs-fallback`);
        if (schemaResponse.ok) {
          const fallbackSchema = await schemaResponse.json();
          content = generateDocsFromSchema(behavior, fallbackSchema);
          content += `<div class="docs-source">Generated from Schema</div>`;
        } else {
          content = `<div class="docs-error">
            <h3>Documentation not found</h3>
            <p>No documentation available for <code>${behavior}</code>.</p>
            <p>Checked paths:</p>
            <ul>${paths.map(p => `<li>${p}</li>`).join('')}</ul>
          </div>`;
        }
      }
    }
    
    // Cache and render
    docsCache[cacheKey] = content;
    bodyEl.innerHTML = content;
    
  } catch (err) {
    console.error('Error loading docs:', err);
    bodyEl.innerHTML = `<div class="docs-error">
      <h3>Error loading content</h3>
      <p>${err.message}</p>
    </div>`;
  }
}

/**
 * Render JSON Schema as readable HTML
 */
function renderSchema(schema) {
  let html = `<div class="schema-viewer">`;
  
  if (schema.description) {
    html += `<p class="schema-desc">${schema.description}</p>`;
  }
  
  if (schema.properties) {
    html += `<table class="schema-table">
      <thead>
        <tr>
          <th>Property</th>
          <th>Type</th>
          <th>Default</th>
          <th>Description</th>
        </tr>
      </thead>
      <tbody>`;
      
    for (const [key, prop] of Object.entries(schema.properties)) {
      const isRequired = schema.required?.includes(key);
      html += `<tr>
        <td><code class="prop-name">${key}</code>${isRequired ? '<span class="required">*</span>' : ''}</td>
        <td><span class="prop-type">${prop.type || 'any'}</span></td>
        <td>${prop.default !== undefined ? `<code>${JSON.stringify(prop.default)}</code>` : '-'}</td>
        <td>${prop.description || '-'}</td>
      </tr>`;
    }
    
    html += `</tbody></table>`;
  }
  
  html += `<div class="schema-raw">
    <h4>Raw JSON</h4>
    <pre><code>${JSON.stringify(schema, null, 2)}</code></pre>
  </div>`;
  
  html += `</div>`;
  return html;
}

/**
 * mdhtml Component - Robust Markdown to HTML converter
 */
function mdhtml(markdown) {
  if (!markdown) return '';
  
  let html = markdown;
  
  // Escape HTML characters to prevent injection (basic)
  // html = html.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  
  // Headers
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^#### (.*$)/gim, '<h4>$1</h4>');
  
  // Blockquotes
  html = html.replace(/^\> (.*$)/gim, '<blockquote>$1</blockquote>');
  
  // Code blocks (```code```)
  html = html.replace(/```([a-z]*)\n([\s\S]*?)```/gim, '<pre><code class="language-$1">$2</code></pre>');
  
  // Inline code (`code`)
  html = html.replace(/`([^`]+)`/gim, '<code>$1</code>');
  
  // Bold (**text**)
  html = html.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>');
  
  // Italic (*text*)
  html = html.replace(/\*(.*?)\*/gim, '<em>$1</em>');
  
  // Links [text](url)
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/gim, (match, text, url) => {
    // Check if it's an internal markdown link
    if (url.match(/\.md$/i) && !url.match(/^https?:\/\//i)) {
      return `<a href="#" onclick="return window.openDocLink('${url}')">${text}</a>`;
    }
    return `<a href="${url}" target="_blank">${text}</a>`;
  });
  
  // Lists (unordered)
  // This is a simple implementation. Nested lists might need more complex logic.
  html = html.replace(/^\s*-\s+(.*$)/gim, '<ul><li>$1</li></ul>');
  html = html.replace(/<\/ul>\s*<ul>/gim, ''); // Merge adjacent lists
  
  // Tables
  // | Header | Header |
  // | --- | --- |
  // | Cell | Cell |
  // Very basic table support
  // html = html.replace(/\|(.+)\|/gim, '<tr><td>$1</td></tr>');
  
  // Paragraphs (double newline)
  html = html.replace(/\n\n/gim, '<br><br>');
  
  // Single newlines that aren't tags
  // html = html.replace(/([^>])\n/g, '$1<br>');
  
  return `<div class="markdown-body">${html}</div>`;
}

/**
 * Generate documentation from schema if no markdown exists
 */
function generateDocsFromSchema(behavior, schema) {
  return `
    <div class="markdown-body">
      <h1>${schema.title || behavior}</h1>
      <p>${schema.description || 'No description available.'}</p>
      
      <h2>Properties</h2>
      ${renderSchema(schema)}
    </div>
  `;
}

// Handle internal doc links
window.openDocLink = (path) => {
  // Remove extension
  let name = path.replace(/\.md$/i, '');
  showDocs(name);
  return false;
};

// Expose functions globally
window.showDocs = showDocs;
window.closeDocsModal = closeDocsModal;
window.switchDocsTab = switchDocsTab;
window.mdhtml = mdhtml;

