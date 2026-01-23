/**
 * Builder Element Picker
 * Wide panel for adding HTML elements with keyboard shortcuts
 */

const ELEMENT_CATEGORIES = {
  layout: {
    icon: '📦',
    label: 'Layout',
    elements: [
      { tag: 'div', key: 'd', label: 'div' },
      { tag: 'section', key: 's', label: 'section' },
      { tag: 'article', key: 'a', label: 'article' },
      { tag: 'main', key: 'm', label: 'main' },
      { tag: 'header', key: 'h', label: 'header' },
      { tag: 'footer', key: 'f', label: 'footer' },
      { tag: 'nav', key: 'shift+n', label: 'nav' },
      { tag: 'aside', key: 'shift+a', label: 'aside' },
      { tag: 'figure', key: 'shift+f', label: 'figure' }
    ]
  },
  text: {
    icon: '📝',
    label: 'Text',
    elements: [
      { tag: 'p', key: 'p', label: 'p' },
      { tag: 'h1', key: '1', label: 'h1' },
      { tag: 'h2', key: '2', label: 'h2' },
      { tag: 'h3', key: '3', label: 'h3' },
      { tag: 'h4', key: '4', label: 'h4' },
      { tag: 'h5', key: '5', label: 'h5' },
      { tag: 'h6', key: '6', label: 'h6' },
      { tag: 'span', key: 'n', label: 'span' },
      { tag: 'pre', key: 'shift+p', label: 'pre' },
      { tag: 'blockquote', key: 'b', label: 'blockquote' },
      { tag: 'code', key: 'c', label: 'code' },
      { tag: 'address', key: 'shift+w', label: 'address' }
    ]
  },
  inline: {
    icon: '🔗',
    label: 'Inline',
    elements: [
      { tag: 'a', key: 'k', label: 'a (link)' },
      { tag: 'strong', key: 'shift+o', label: 'strong' },
      { tag: 'em', key: 'e', label: 'em' },
      { tag: 'mark', key: 'shift+m', label: 'mark' },
      { tag: 'time', key: 'shift+t', label: 'time' },
      { tag: 'abbr', key: 'shift+y', label: 'abbr' },
      { tag: 'cite', key: 'shift+c', label: 'cite' },
      { tag: 'small', key: 'shift+z', label: 'small' },
      { tag: 'sub', key: null, label: 'sub' },
      { tag: 'sup', key: null, label: 'sup' }
    ]
  },
  lists: {
    icon: '📋',
    label: 'Lists',
    elements: [
      { tag: 'ul', key: 'u', label: 'ul' },
      { tag: 'ol', key: 'o', label: 'ol' },
      { tag: 'li', key: 'l', label: 'li' },
      { tag: 'dl', key: 'shift+d', label: 'dl' },
      { tag: 'dt', key: null, label: 'dt' },
      { tag: 'dd', key: null, label: 'dd' }
    ]
  },
  table: {
    icon: '📊',
    label: 'Table',
    elements: [
      { tag: 'table', key: 't', label: 'table' },
      { tag: 'thead', key: null, label: 'thead' },
      { tag: 'tbody', key: null, label: 'tbody' },
      { tag: 'tfoot', key: null, label: 'tfoot' },
      { tag: 'tr', key: 'shift+r', label: 'tr' },
      { tag: 'th', key: 'shift+h', label: 'th' },
      { tag: 'td', key: 'shift+j', label: 'td' }
    ]
  },
  forms: {
    icon: '📝',
    label: 'Forms',
    elements: [
      { tag: 'form', key: 'r', label: 'form' },
      { tag: 'input', key: 'i', label: 'input' },
      { tag: 'button', key: 'shift+b', label: 'button' },
      { tag: 'select', key: 'shift+l', label: 'select' },
      { tag: 'textarea', key: 'shift+x', label: 'textarea' },
      { tag: 'label', key: 'shift+i', label: 'label' },
      { tag: 'fieldset', key: 'shift+q', label: 'fieldset' },
      { tag: 'legend', key: null, label: 'legend' },
      { tag: 'option', key: null, label: 'option' },
      { tag: 'optgroup', key: null, label: 'optgroup' }
    ]
  },
  media: {
    icon: '🖼️',
    label: 'Media',
    elements: [
      { tag: 'img', key: 'g', label: 'img' },
      { tag: 'video', key: 'v', label: 'video' },
      { tag: 'audio', key: 'shift+u', label: 'audio' },
      { tag: 'picture', key: null, label: 'picture' },
      { tag: 'source', key: null, label: 'source' },
      { tag: 'iframe', key: 'shift+v', label: 'iframe' },
      { tag: 'canvas', key: 'shift+k', label: 'canvas' },
      { tag: 'figcaption', key: null, label: 'figcaption' }
    ]
  },
  interactive: {
    icon: '🎯',
    label: 'Interactive',
    elements: [
      { tag: 'details', key: 'shift+e', label: 'details' },
      { tag: 'summary', key: 'shift+s', label: 'summary' },
      { tag: 'dialog', key: 'shift+g', label: 'dialog' },
      { tag: 'progress', key: null, label: 'progress' },
      { tag: 'meter', key: null, label: 'meter' },
      { tag: 'output', key: null, label: 'output' }
    ]
  }
};

// Build shortcut lookup map
const SHORTCUT_MAP = new Map();
Object.values(ELEMENT_CATEGORIES).forEach(cat => {
  cat.elements.forEach(el => {
    if (el.key) {
      SHORTCUT_MAP.set(el.key.toLowerCase(), el.tag);
    }
  });
});

let currentPicker = null;
let currentSection = null;
let searchQuery = '';

/**
 * Format shortcut key for display
 */
function formatShortcut(key) {
  if (!key) return '';
  if (key.startsWith('shift+')) {
    return `⇧${key.slice(6)}`;
  }
  return key;
}

/**
 * Create the element picker panel HTML
 */
function createPickerHTML() {
  let categoriesHTML = '';
  
  Object.entries(ELEMENT_CATEGORIES).forEach(([catKey, cat]) => {
    const elementsHTML = cat.elements.map(el => `
      <button class="element-btn" tag="${el.tag}" title="${el.tag}">
        <span class="element-name">${el.label}</span>
        ${el.key ? `<span class="element-key">(${formatShortcut(el.key)})</span>` : ''}
      </button>
    `).join('');
    
    categoriesHTML += `
      <div class="element-category">
        <div class="element-category-header">
          <span class="element-category-icon">${cat.icon}</span>
          <span class="element-category-label">${cat.label}</span>
        </div>
        <div class="element-category-items">
          ${elementsHTML}
        </div>
      </div>
    `;
  });
  
  return `
    <div class="element-picker-backdrop"></div>
    <div class="element-picker-panel">
      <div class="element-picker-header">
        <span class="element-picker-title">+ Add Element</span>
        <div class="element-picker-search">
          <input type="text" placeholder="Search elements..." class="element-search-input" autofocus>
        </div>
        <button class="element-picker-close" title="Close (Esc)">×</button>
      </div>
      <div class="element-picker-body">
        ${categoriesHTML}
      </div>
      <div class="element-picker-footer">
        <span class="element-picker-hint">⇧ = shift</span>
        <span class="element-picker-hint">esc to close</span>
      </div>
    </div>
  `;
}

/**
 * Filter elements based on search query
 */
function filterElements(query) {
  if (!currentPicker) return;
  
  const buttons = currentPicker.querySelectorAll('.element-btn');
  const categories = currentPicker.querySelectorAll('.element-category');
  const q = query.toLowerCase().trim();
  
  buttons.forEach(btn => {
    const tag = btn.dataset.tag.toLowerCase();
    const matches = !q || tag.includes(q);
    btn.style.display = matches ? '' : 'none';
  });
  
  // Hide empty categories
  categories.forEach(cat => {
    const visibleButtons = cat.querySelectorAll('.element-btn:not([style*="display: none"])');
    cat.style.display = visibleButtons.length > 0 ? '' : 'none';
  });
  
  // Highlight first visible result
  const firstVisible = currentPicker.querySelector('.element-btn:not([style*="display: none"])');
  currentPicker.querySelectorAll('.element-btn.highlighted').forEach(el => el.classList.remove('highlighted'));
  if (firstVisible) {
    firstVisible.classList.add('highlighted');
  }
}

/**
 * Handle keyboard shortcuts
 */
function handleKeyDown(e) {
  if (!currentPicker) return;
  
  // Escape to close
  if (e.key === 'Escape') {
    closePicker();
    return;
  }
  
  // Enter to select highlighted
  if (e.key === 'Enter') {
    const highlighted = currentPicker.querySelector('.element-btn.highlighted');
    if (highlighted) {
      selectElement(highlighted.dataset.tag);
    }
    return;
  }
  
  // Arrow keys to navigate
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
    e.preventDefault();
    navigateElements(e.key === 'ArrowDown' ? 1 : -1);
    return;
  }
  
  // Check for element shortcuts (only if not typing in search)
  const searchInput = currentPicker.querySelector('.element-search-input');
  if (document.activeElement !== searchInput) {
    const key = e.shiftKey ? `shift+${e.key.toLowerCase()}` : e.key.toLowerCase();
    const tag = SHORTCUT_MAP.get(key);
    if (tag) {
      e.preventDefault();
      selectElement(tag);
    }
  }
}

/**
 * Navigate through visible elements
 */
function navigateElements(direction) {
  const buttons = Array.from(currentPicker.querySelectorAll('.element-btn:not([style*="display: none"])'));
  if (buttons.length === 0) return;
  
  const currentIndex = buttons.findIndex(btn => btn.classList.contains('highlighted'));
  let newIndex = currentIndex + direction;
  
  if (newIndex < 0) newIndex = buttons.length - 1;
  if (newIndex >= buttons.length) newIndex = 0;
  
  buttons.forEach(btn => btn.classList.remove('highlighted'));
  buttons[newIndex].classList.add('highlighted');
  buttons[newIndex].scrollIntoView({ block: 'nearest' });
}

/**
 * Select an element and add it to the section
 */
function selectElement(tag) {
  if (!currentSection) return;
  
  console.log(`[ElementPicker] Adding <${tag}> to section:`, currentSection);
  
  // Create the element
  const element = createElementForTag(tag);
  
  // Add to section
  if (typeof addNativeElementToSection === 'function') {
    addNativeElementToSection(currentSection, element);
  } else {
    // Fallback: directly append
    const container = document.getElementById(`${currentSection}-container`);
    if (container) {
      // Hide drop zone if present
      const dropZone = container.querySelector('.canvas-drop-zone');
      if (dropZone) dropZone.style.display = 'none';
      
      // Create wrapper
      const wrapper = document.createElement('div');
      wrapper.className = 'canvas-component';
      wrapper.id = `native-${Date.now()}`;
      wrapper.innerHTML = `
        <div class="component-overlay">
          <span class="component-label">&lt;${tag}&gt;</span>
          <button class="component-delete-btn" onclick="this.closest('.canvas-component').remove()">🗑️</button>
        </div>
        <div class="component-content" contenteditable="true"></div>
      `;
      wrapper.querySelector('.component-content').appendChild(element);
      container.appendChild(wrapper);
    }
  }
  
  closePicker();
  
  // Update status
  if (typeof updateStatus === 'function') {
    updateStatus(`Added <${tag}> element`);
  }
}

/**
 * Create an HTML element with appropriate defaults
 */
function createElementForTag(tag) {
  const el = document.createElement(tag);
  
  // Add default content/attributes based on tag
  switch (tag) {
    case 'p':
    case 'span':
    case 'div':
    case 'section':
    case 'article':
    case 'main':
    case 'header':
    case 'footer':
    case 'nav':
    case 'aside':
      el.textContent = `${tag} content`;
      break;
    case 'h1':
    case 'h2':
    case 'h3':
    case 'h4':
    case 'h5':
    case 'h6':
      el.textContent = `Heading ${tag.slice(1)}`;
      break;
    case 'a':
      el.href = '#';
      el.textContent = 'Link text';
      break;
    case 'img':
      el.src = 'https://via.placeholder.com/300x200';
      el.alt = 'Placeholder image';
      break;
    case 'button':
      el.textContent = 'Button';
      el.type = 'button';
      break;
    case 'input':
      el.type = 'text';
      el.placeholder = 'Enter text...';
      break;
    case 'textarea':
      el.placeholder = 'Enter text...';
      el.rows = 3;
      break;
    case 'select':
      el.innerHTML = '<option>Option 1</option><option>Option 2</option>';
      break;
    case 'ul':
    case 'ol':
      el.innerHTML = '<li>Item 1</li><li>Item 2</li><li>Item 3</li>';
      break;
    case 'li':
      el.textContent = 'List item';
      break;
    case 'table':
      el.innerHTML = '<thead><tr><th>Header 1</th><th>Header 2</th></tr></thead><tbody><tr><td>Cell 1</td><td>Cell 2</td></tr></tbody>';
      break;
    case 'dl':
      el.innerHTML = '<dt>Term</dt><dd>Definition</dd>';
      break;
    case 'figure':
      el.innerHTML = '<img src="https://via.placeholder.com/300x200" alt="Figure"><figcaption>Figure caption</figcaption>';
      break;
    case 'blockquote':
      el.innerHTML = '<p>Quote text here...</p><cite>— Author</cite>';
      break;
    case 'details':
      el.innerHTML = '<summary>Click to expand</summary><p>Hidden content here...</p>';
      break;
    case 'form':
      el.innerHTML = '<label>Name: <input type="text"></label><button type="submit">Submit</button>';
      break;
    case 'fieldset':
      el.innerHTML = '<legend>Group Title</legend><label>Field: <input type="text"></label>';
      break;
    case 'video':
      el.controls = true;
      el.innerHTML = '<source src="" type="video/mp4">Your browser does not support video.';
      break;
    case 'audio':
      el.controls = true;
      el.innerHTML = '<source src="" type="audio/mpeg">Your browser does not support audio.';
      break;
    case 'progress':
      el.value = 50;
      el.max = 100;
      break;
    case 'meter':
      el.value = 0.6;
      el.min = 0;
      el.max = 1;
      break;
    case 'code':
    case 'pre':
      el.textContent = 'code { display: block; }';
      break;
    case 'time':
      el.dateTime = new Date().toISOString();
      el.textContent = new Date().toLocaleDateString();
      break;
    case 'address':
      el.innerHTML = 'Contact: <a href="mailto:example@example.com">email@example.com</a>';
      break;
    case 'mark':
      el.textContent = 'highlighted text';
      break;
    case 'abbr':
      el.title = 'Abbreviation explanation';
      el.textContent = 'ABBR';
      break;
    case 'cite':
      el.textContent = 'Source Title';
      break;
    case 'dialog':
      el.innerHTML = '<p>Dialog content</p><button onclick="this.closest(\'dialog\').close()">Close</button>';
      break;
    default:
      el.textContent = tag;
  }
  
  return el;
}

/**
 * Open the element picker
 */
function openPicker(section) {
  closePicker(); // Close any existing picker
  
  currentSection = section;
  searchQuery = '';
  
  // Create picker element
  const pickerContainer = document.createElement('div');
  pickerContainer.id = 'elementPicker';
  pickerContainer.innerHTML = createPickerHTML();
  document.body.appendChild(pickerContainer);
  
  currentPicker = pickerContainer;
  
  // Setup event listeners
  const backdrop = pickerContainer.querySelector('.element-picker-backdrop');
  const closeBtn = pickerContainer.querySelector('.element-picker-close');
  const searchInput = pickerContainer.querySelector('.element-search-input');
  const elementBtns = pickerContainer.querySelectorAll('.element-btn');
  
  backdrop.addEventListener('click', closePicker);
  closeBtn.addEventListener('click', closePicker);
  
  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    filterElements(searchQuery);
  });
  
  elementBtns.forEach(btn => {
    btn.addEventListener('click', () => selectElement(btn.dataset.tag));
  });
  
  document.addEventListener('keydown', handleKeyDown);
  
  // Focus search input
  setTimeout(() => searchInput.focus(), 50);
  
  // Highlight first element
  const firstBtn = pickerContainer.querySelector('.element-btn');
  if (firstBtn) firstBtn.classList.add('highlighted');
}

/**
 * Close the element picker
 */
function closePicker() {
  if (currentPicker) {
    document.removeEventListener('keydown', handleKeyDown);
    currentPicker.remove();
    currentPicker = null;
    currentSection = null;
    searchQuery = '';
  }
}

/**
 * Initialize element picker - attach to add buttons
 */
function initElementPicker() {
  console.log('[ElementPicker] Initializing...');
  
  // Find all add element buttons/zones
  document.querySelectorAll('.canvas-add-element-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const section = btn.dataset.section || 'main';
      openPicker(section);
    });
  });
}

// Export for use in builder
window.ElementPicker = {
  open: openPicker,
  close: closePicker,
  init: initElementPicker,
  CATEGORIES: ELEMENT_CATEGORIES,
  SHORTCUTS: SHORTCUT_MAP
};

// Auto-init when DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initElementPicker);
} else {
  initElementPicker();
}
