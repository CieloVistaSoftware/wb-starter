/**
 * Docs Component - User Documentation Viewer
 * -----------------------------------------------------------------------------
 * Allows users to display documentation from a manifest file.
 * Users can select which docs to show via the property panel.
 * 
 * Custom Tag: <wb-docs>
 * 
 * Usage:
 *   <wb-docs manifest="docs/manifest.json" show="builder,themes,testing"></wb-docs>
 *   <wb-docs manifest="my-docs.json"></wb-docs>
 * 
 * Properties:
 *   - manifest: Path to JSON manifest file (default: docs/manifest.json)
 *   - show: Comma-separated list of doc files to display
 *   - category: Show all docs from a specific category
 *   - layout: "tabs" | "accordion" | "sidebar" (default: tabs)
 *   - size: "xs" | "sm" | "md" | "lg" | "xl" (default: sm)
 * -----------------------------------------------------------------------------
 */

// Cache for loaded manifests
const manifestCache = {};

export async function docs(element, options = {}) {
  const config = {
    manifest: options.manifest || element.dataset.manifest || element.getAttribute('manifest') || 'docs/manifest.json',
    show: options.show || element.dataset.show || element.getAttribute('show') || '',
    category: options.category || element.dataset.category || element.getAttribute('category') || '',
    layout: options.layout || element.dataset.layout || element.getAttribute('layout') || 'tabs',
    size: options.size || element.dataset.size || element.getAttribute('size') || 'sm',
    ...options
  };

  element.classList.add('wb-docs');
  element.classList.add('wb-docs--loading');
  element.classList.add(`wb-docs--${config.layout}`);

  try {
    // Load manifest
    const manifest = await loadManifest(config.manifest);
    
    if (!manifest || !manifest.categories) {
      throw new Error('Invalid manifest format - missing categories');
    }

    // Get docs to display
    const docsToShow = getDocsToShow(manifest, config);
    
    if (docsToShow.length === 0) {
      element.innerHTML = `
        <div class="wb-docs__empty">
          <div class="wb-docs__empty-icon">📄</div>
          <div class="wb-docs__empty-text">No documentation selected</div>
          <div class="wb-docs__empty-hint">Use the property panel to select docs to display</div>
        </div>
      `;
      element.classList.remove('wb-docs--loading');
      return;
    }

    // Render based on layout
    switch (config.layout) {
      case 'accordion':
        await renderAccordion(element, docsToShow, config);
        break;
      case 'sidebar':
        await renderSidebar(element, docsToShow, config);
        break;
      case 'tabs':
      default:
        await renderTabs(element, docsToShow, config);
        break;
    }

    element.classList.remove('wb-docs--loading');
    element.classList.add('wb-docs--loaded');

    // Dispatch loaded event
    element.dispatchEvent(new CustomEvent('wb:docs:loaded', {
      bubbles: true,
      detail: { manifest: config.manifest, docsCount: docsToShow.length }
    }));

  } catch (err) {
    element.classList.remove('wb-docs--loading');
    element.classList.add('wb-docs--error');
    element.innerHTML = `
      <div class="wb-docs__error">
        <div class="wb-docs__error-icon">⚠️</div>
        <div class="wb-docs__error-text">Error loading documentation</div>
        <div class="wb-docs__error-detail">${err.message}</div>
      </div>
    `;
    console.error('[wb-docs] Error:', err);
  }

  // Store config for property panel
  element._docsConfig = config;
  element._docsManifest = manifestCache[config.manifest];

  // Expose API
  element.wbDocs = {
    reload: () => docs(element, options),
    loadDoc: async (file) => loadDocContent(file),
    getManifest: () => manifestCache[config.manifest],
    setShow: (showList) => {
      element.dataset.show = showList;
      return docs(element, { ...config, show: showList });
    }
  };

  return () => {
    element.classList.remove('wb-docs', 'wb-docs--loading', 'wb-docs--loaded', 'wb-docs--error');
    delete element.wbDocs;
    delete element._docsConfig;
    delete element._docsManifest;
  };
}

/**
 * Load manifest JSON file
 */
async function loadManifest(path) {
  if (manifestCache[path]) {
    return manifestCache[path];
  }

  const fetchPath = path.startsWith('/') ? path : '/' + path;
  const response = await fetch(fetchPath);
  
  if (!response.ok) {
    throw new Error(`Failed to load manifest: ${response.status} ${response.statusText}`);
  }

  const manifest = await response.json();
  manifestCache[path] = manifest;
  return manifest;
}

/**
 * Get list of docs to display based on config
 */
function getDocsToShow(manifest, config) {
  const result = [];
  const showList = config.show ? config.show.split(',').map(s => s.trim().toLowerCase()) : [];
  const categoryFilter = config.category?.toLowerCase();

  for (const category of manifest.categories) {
    // Filter by category if specified
    if (categoryFilter && category.name.toLowerCase() !== categoryFilter) {
      continue;
    }

    if (category.docs) {
      for (const doc of category.docs) {
        // If show list is empty, show all (when no filter)
        // If show list has items, only show matching ones
        const docFile = doc.file.toLowerCase();
        const docTitle = doc.title.toLowerCase();
        
        if (showList.length === 0 && !categoryFilter) {
          // No filter - show first 5 by default
          if (result.length < 5) {
            result.push({ ...doc, category: category.name, icon: category.icon });
          }
        } else if (showList.length > 0) {
          // Check if this doc matches any in show list
          const matches = showList.some(s => 
            docFile.includes(s) || 
            docTitle.includes(s) ||
            doc.file === s ||
            doc.file.replace('.md', '') === s
          );
          if (matches) {
            result.push({ ...doc, category: category.name, icon: category.icon });
          }
        } else {
          // Category filter only
          result.push({ ...doc, category: category.name, icon: category.icon });
        }
      }
    }
  }

  return result;
}

/**
 * Load doc content from file
 */
async function loadDocContent(file) {
  const fetchPath = file.startsWith('/') ? file : '/docs/' + file;
  const response = await fetch(fetchPath);
  
  if (!response.ok) {
    throw new Error(`Failed to load doc: ${response.status}`);
  }

  return response.text();
}

/**
 * Render tabs layout
 */
async function renderTabs(element, docs, config) {
  const tabsHtml = docs.map((doc, i) => `
    <button class="wb-docs__tab ${i === 0 ? 'wb-docs__tab--active' : ''}" 
            index="${i}" 
            file="${doc.file}">
      <span class="wb-docs__tab-icon">${doc.icon || '📄'}</span>
      <span class="wb-docs__tab-title">${doc.title}</span>
    </button>
  `).join('');

  element.innerHTML = `
    <div class="wb-docs__tabs-nav">${tabsHtml}</div>
    <div class="wb-docs__content">
      <div class="wb-docs__loading-indicator">Loading...</div>
    </div>
  `;

  // Load first doc
  const contentEl = element.querySelector('.wb-docs__content');
  await renderDocContent(contentEl, docs[0].file, config);

  // Tab click handlers
  element.querySelectorAll('.wb-docs__tab').forEach(tab => {
    tab.addEventListener('click', async () => {
      // Update active state
      element.querySelectorAll('.wb-docs__tab').forEach(t => t.classList.remove('wb-docs__tab--active'));
      tab.classList.add('wb-docs__tab--active');
      
      // Load content
      const file = tab.dataset.file;
      contentEl.innerHTML = '<div class="wb-docs__loading-indicator">Loading...</div>';
      await renderDocContent(contentEl, file, config);
    });
  });
}

/**
 * Render accordion layout
 */
async function renderAccordion(element, docs, config) {
  const accordionHtml = docs.map((doc, i) => `
    <div class="wb-docs__accordion-item ${i === 0 ? 'wb-docs__accordion-item--open' : ''}">
      <button class="wb-docs__accordion-header" file="${doc.file}">
        <span class="wb-docs__accordion-icon">${doc.icon || '📄'}</span>
        <span class="wb-docs__accordion-title">${doc.title}</span>
        <span class="wb-docs__accordion-arrow">▼</span>
      </button>
      <div class="wb-docs__accordion-content" file="${doc.file}">
        ${i === 0 ? '<div class="wb-docs__loading-indicator">Loading...</div>' : ''}
      </div>
    </div>
  `).join('');

  element.innerHTML = `<div class="wb-docs__accordion">${accordionHtml}</div>`;

  // Load first doc
  const firstContent = element.querySelector('.wb-docs__accordion-content');
  await renderDocContent(firstContent, docs[0].file, config);

  // Accordion click handlers
  element.querySelectorAll('.wb-docs__accordion-header').forEach(header => {
    header.addEventListener('click', async () => {
      const item = header.parentElement;
      const content = item.querySelector('.wb-docs__accordion-content');
      const isOpen = item.classList.contains('wb-docs__accordion-item--open');

      // Close all
      element.querySelectorAll('.wb-docs__accordion-item').forEach(i => {
        i.classList.remove('wb-docs__accordion-item--open');
      });

      // Toggle current
      if (!isOpen) {
        item.classList.add('wb-docs__accordion-item--open');
        
        // Load content if not loaded
        if (!content.dataset.loaded) {
          content.innerHTML = '<div class="wb-docs__loading-indicator">Loading...</div>';
          await renderDocContent(content, header.dataset.file, config);
          content.dataset.loaded = 'true';
        }
      }
    });
  });
}

/**
 * Render sidebar layout
 */
async function renderSidebar(element, docs, config) {
  const navHtml = docs.map((doc, i) => `
    <a class="wb-docs__sidebar-link ${i === 0 ? 'wb-docs__sidebar-link--active' : ''}" 
       href="#" 
       file="${doc.file}">
      <span class="wb-docs__sidebar-icon">${doc.icon || '📄'}</span>
      <span class="wb-docs__sidebar-title">${doc.title}</span>
    </a>
  `).join('');

  element.innerHTML = `
    <aside class="wb-docs__sidebar">
      <nav class="wb-docs__sidebar-nav">${navHtml}</nav>
    </aside>
    <main class="wb-docs__main">
      <div class="wb-docs__loading-indicator">Loading...</div>
    </main>
  `;

  // Load first doc
  const mainEl = element.querySelector('.wb-docs__main');
  await renderDocContent(mainEl, docs[0].file, config);

  // Nav click handlers
  element.querySelectorAll('.wb-docs__sidebar-link').forEach(link => {
    link.addEventListener('click', async (e) => {
      e.preventDefault();
      
      // Update active state
      element.querySelectorAll('.wb-docs__sidebar-link').forEach(l => l.classList.remove('wb-docs__sidebar-link--active'));
      link.classList.add('wb-docs__sidebar-link--active');
      
      // Load content
      mainEl.innerHTML = '<div class="wb-docs__loading-indicator">Loading...</div>';
      await renderDocContent(mainEl, link.dataset.file, config);
    });
  });
}

/**
 * Render doc content into container
 */
async function renderDocContent(container, file, config) {
  try {
    const content = await loadDocContent(file);
    
    // Create mdhtml element
    const mdEl = document.createElement('div');
    mdEl.dataset.src = file.startsWith('/') ? file : 'docs/' + file;
    mdEl.dataset.size = config.size;
    
    container.innerHTML = '';
    container.appendChild(mdEl);
    
    // Use mdhtml behavior if available
    if (window.WB && window.WB.behaviors?.mdhtml) {
      await window.WB.behaviors.mdhtml(mdEl);
    } else {
      // Fallback: import and use directly
      const { mdhtml } = await import('./mdhtml.js');
      await mdhtml(mdEl, { src: file.startsWith('/') ? file : 'docs/' + file });
    }
  } catch (err) {
    container.innerHTML = `
      <div class="wb-docs__error">
        <div class="wb-docs__error-text">Failed to load: ${file}</div>
        <div class="wb-docs__error-detail">${err.message}</div>
      </div>
    `;
  }
}

export default docs;
