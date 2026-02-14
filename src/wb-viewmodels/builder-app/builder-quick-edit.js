/**
 * WB Builder Quick Edit Modal
 * ==========================
 * Shows a clean 3-field editor for link-like components:
 * - Header (title)
 * - Main/Description (content)
 * - Footer (URL/href)
 */

// =============================================================================
// INJECT STYLES
// =============================================================================
(function injectStyles() {
  if (document.getElementById('quick-edit-styles')) return;
  const style = document.createElement('style');
  style.id = 'quick-edit-styles';
  style.textContent = `
    /* Quick Edit Modal Overlay */
    .qe-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(4px);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      visibility: hidden;
      transition: opacity 0.2s, visibility 0.2s;
    }
    .qe-overlay.open {
      opacity: 1;
      visibility: visible;
    }
    
    /* Modal Container */
    .qe-modal {
      background: var(--bg-secondary, #1f2937);
      border: 1px solid var(--border-color, #374151);
      border-radius: 12px;
      width: 90%;
      max-width: 480px;
      box-shadow: 0 20px 50px rgba(0,0,0,0.5);
      transform: translateY(20px) scale(0.95);
      transition: transform 0.2s ease;
    }
    .qe-overlay.open .qe-modal {
      transform: translateY(0) scale(1);
    }
    
    /* Modal Header */
    .qe-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem 1.25rem;
      border-bottom: 1px solid var(--border-color, #374151);
    }
    .qe-header-left {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .qe-icon {
      font-size: 1.25rem;
    }
    .qe-title {
      font-size: 1rem;
      font-weight: 600;
      color: var(--text-primary, #f9fafb);
    }
    .qe-close {
      background: none;
      border: none;
      color: var(--text-muted, #9ca3af);
      font-size: 1.5rem;
      cursor: pointer;
      padding: 0.25rem;
      line-height: 1;
      border-radius: 4px;
    }
    .qe-close:hover {
      color: var(--text-primary, #f9fafb);
      background: var(--bg-tertiary, #374151);
    }
    
    /* Modal Body */
    .qe-body {
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    
    /* Field Groups */
    .qe-field {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    .qe-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--text-muted, #9ca3af);
    }
    .qe-label-icon {
      font-size: 0.9rem;
    }
    .qe-input {
      width: 100%;
      padding: 0.75rem 1rem;
      background: var(--bg-tertiary, #111827);
      border: 1px solid var(--border-color, #374151);
      border-radius: 8px;
      color: var(--text-primary, #f9fafb);
      font-size: 0.95rem;
      transition: border-color 0.15s, box-shadow 0.15s;
    }
    .qe-input:focus {
      outline: none;
      border-color: var(--primary, #6366f1);
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
    }
    .qe-input::placeholder {
      color: var(--text-muted, #6b7280);
    }
    
    /* Textarea for description */
    .qe-textarea {
      resize: vertical;
      min-height: 80px;
      max-height: 200px;
      font-family: inherit;
    }
    
    /* URL field with icon */
    .qe-url-wrapper {
      position: relative;
      display: flex;
      align-items: center;
    }
    .qe-url-icon {
      position: absolute;
      left: 12px;
      color: var(--text-muted, #6b7280);
      pointer-events: none;
    }
    .qe-url-input {
      padding-left: 2.5rem;
    }
    .qe-url-test {
      position: absolute;
      right: 8px;
      background: var(--bg-secondary, #1f2937);
      border: 1px solid var(--border-color, #374151);
      color: var(--text-muted, #9ca3af);
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.7rem;
      cursor: pointer;
    }
    .qe-url-test:hover {
      background: var(--primary, #6366f1);
      color: white;
      border-color: var(--primary, #6366f1);
    }
    
    /* Modal Footer */
    .qe-footer {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      padding: 1rem 1.25rem;
      border-top: 1px solid var(--border-color, #374151);
      background: var(--bg-tertiary, #111827);
      border-radius: 0 0 12px 12px;
    }
    .qe-btn {
      padding: 0.6rem 1.25rem;
      border-radius: 6px;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s;
    }
    .qe-btn-cancel {
      background: transparent;
      border: 1px solid var(--border-color, #374151);
      color: var(--text-secondary, #d1d5db);
    }
    .qe-btn-cancel:hover {
      background: var(--bg-secondary, #1f2937);
    }
    .qe-btn-save {
      background: var(--primary, #6366f1);
      border: none;
      color: white;
    }
    .qe-btn-save:hover {
      background: #4f46e5;
      transform: translateY(-1px);
    }
    
    /* Field hints */
    .qe-hint {
      font-size: 0.7rem;
      color: var(--text-muted, #6b7280);
      margin-top: -0.25rem;
    }
  `;
  document.head.appendChild(style);
})();

// =============================================================================
// FIELD MAPPINGS
// =============================================================================
/**
 * Maps component behaviors to their header/main/footer fields
 */
const FIELD_MAPPINGS = {
  // Card variants
  card: { header: 'title', main: 'subtitle', footer: 'footer' },
  cardlink: { header: 'title', main: 'description', footer: 'href' },
  cardbutton: { header: 'title', main: 'subtitle', footer: 'footer' },
  cardhero: { header: 'title', main: 'subtitle', footer: 'footer' },
  cardimage: { header: 'title', main: 'subtitle', footer: 'footer' },
  cardoverlay: { header: 'title', main: 'subtitle', footer: 'footer' },
  cardprofile: { header: 'name', main: 'bio', footer: 'role' },
  cardpricing: { header: 'plan', main: 'price', footer: 'features' },
  cardproduct: { header: 'title', main: 'description', footer: 'price' },
  cardstats: { header: 'label', main: 'value', footer: 'trendValue' },
  cardtestimonial: { header: 'author', main: 'quote', footer: 'role' },
  
  // Links
  link: { header: 'text', main: 'title', footer: 'href' },
  
  // Alerts
  alert: { header: 'title', main: 'message', footer: '' },
  
  // Hero
  hero: { header: 'title', main: 'subtitle', footer: 'cta' },
  
  // Details
  details: { header: 'summary', main: 'content', footer: '' },
  
  // Default fallback
  default: { header: 'title', main: 'content', footer: 'href' }
};

/**
 * Get field mapping for a behavior
 */
function getFieldMapping(behavior) {
  return FIELD_MAPPINGS[behavior] || FIELD_MAPPINGS.default;
}

// =============================================================================
// MODAL STATE
// =============================================================================
let currentWrapper = null;
let overlayEl = null;

// =============================================================================
// CREATE MODAL
// =============================================================================
function createModal() {
  if (overlayEl) return overlayEl;
  
  overlayEl = document.createElement('div');
  overlayEl.className = 'qe-overlay';
  overlayEl.id = 'quickEditOverlay';
  overlayEl.innerHTML = `
    <div class="qe-modal" role="dialog" aria-modal="true" aria-labelledby="qe-modal-title">
      <div class="qe-header">
        <div class="qe-header-left">
          <span class="qe-icon" id="qeIcon">📝</span>
          <span class="qe-title" id="qe-modal-title">Quick Edit</span>
        </div>
        <button class="qe-close" id="qeClose" aria-label="Close">×</button>
      </div>
      <div class="qe-body">
        <!-- Header Field -->
        <div class="qe-field">
          <label class="qe-label" for="qeHeader">
            <span class="qe-label-icon">📌</span>
            <span id="qeLabelHeader">Header</span>
          </label>
          <input type="text" class="qe-input" id="qeHeader" placeholder="Enter title...">
        </div>
        
        <!-- Main/Description Field -->
        <div class="qe-field">
          <label class="qe-label" for="qeMain">
            <span class="qe-label-icon">📝</span>
            <span id="qeLabelMain">Description</span>
          </label>
          <textarea class="qe-input qe-textarea" id="qeMain" placeholder="Enter description..."></textarea>
        </div>
        
        <!-- Footer/URL Field -->
        <div class="qe-field" id="qeFooterField">
          <label class="qe-label" for="qeFooter">
            <span class="qe-label-icon">🔗</span>
            <span id="qeLabelFooter">URL</span>
          </label>
          <div class="qe-url-wrapper">
            <span class="qe-url-icon">🌐</span>
            <input type="text" class="qe-input qe-url-input" id="qeFooter" placeholder="https://...">
            <button class="qe-url-test" id="qeTestUrl" title="Test URL">Test</button>
          </div>
          <div class="qe-hint">Enter URL, anchor (#section), or leave empty</div>
        </div>
      </div>
      <div class="qe-footer">
        <button class="qe-btn qe-btn-cancel" id="qeCancel">Cancel</button>
        <button class="qe-btn qe-btn-save" id="qeSave">Save Changes</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(overlayEl);
  
  // Bind events
  document.getElementById('qeClose').addEventListener('click', closeQuickEdit);
  document.getElementById('qeCancel').addEventListener('click', closeQuickEdit);
  document.getElementById('qeSave').addEventListener('click', saveQuickEdit);
  document.getElementById('qeTestUrl').addEventListener('click', testUrl);
  
  // Close on overlay click
  overlayEl.addEventListener('click', (e) => {
    if (e.target === overlayEl) closeQuickEdit();
  });
  
  // Close on Escape
  document.addEventListener('keydown', handleKeydown);
  
  return overlayEl;
}

// =============================================================================
// OPEN/CLOSE
// =============================================================================
export function openQuickEdit(wrapper) {
  if (!wrapper) return;
  
  currentWrapper = wrapper;
  const overlay = createModal();
  
  // Get component data
  const c = JSON.parse(wrapper.dataset.c || '{}');
  const behavior = c.b || 'default';
  const data = c.d || {};
  const mapping = getFieldMapping(behavior);
  
  // Update modal title & icon
  document.getElementById('qeIcon').textContent = c.i || '📝';
  document.getElementById('qe-modal-title').textContent = `Edit ${c.n || behavior}`;
  
  // Update labels
  document.getElementById('qeLabelHeader').textContent = mapping.header || 'Header';
  document.getElementById('qeLabelMain').textContent = mapping.main || 'Description';
  document.getElementById('qeLabelFooter').textContent = mapping.footer || 'Footer';
  
  // Populate fields
  document.getElementById('qeHeader').value = data[mapping.header] || '';
  document.getElementById('qeMain').value = data[mapping.main] || '';
  document.getElementById('qeFooter').value = data[mapping.footer] || '';
  
  // Show/hide footer field based on mapping
  const footerField = document.getElementById('qeFooterField');
  if (mapping.footer) {
    footerField.style.display = '';
    // Change URL styling based on field type
    const isUrl = ['href', 'url', 'src'].includes(mapping.footer);
    const urlIcon = footerField.querySelector('.qe-url-icon');
    const testBtn = document.getElementById('qeTestUrl');
    const hint = footerField.querySelector('.qe-hint');
    
    if (isUrl) {
      urlIcon.style.display = '';
      testBtn.style.display = '';
      hint.textContent = 'Enter URL, anchor (#section), or leave empty';
    } else {
      urlIcon.style.display = 'none';
      testBtn.style.display = 'none';
      hint.textContent = '';
    }
  } else {
    footerField.style.display = 'none';
  }
  
  // Open modal
  overlay.classList.add('open');
  
  // Focus first field
  setTimeout(() => {
    document.getElementById('qeHeader').focus();
    document.getElementById('qeHeader').select();
  }, 100);
}

export function closeQuickEdit() {
  if (overlayEl) {
    overlayEl.classList.remove('open');
  }
  currentWrapper = null;
}

// =============================================================================
// SAVE
// =============================================================================
function saveQuickEdit() {
  if (!currentWrapper) return;
  
  try {
    const c = JSON.parse(currentWrapper.dataset.c || '{}');
    const mappedBehavior = c.b || 'default';
    const behaviorMapping = getFieldMapping(behavior);
    
    if (!c.d) c.d = {};
    
    // Get values
    const headerVal = document.getElementById('qeHeader').value.trim();
    const mainVal = document.getElementById('qeMain').value.trim();
    const footerVal = document.getElementById('qeFooter').value.trim();
    
    // Update data
    if (mapping.header) c.d[mapping.header] = headerVal;
    if (mapping.main) c.d[mapping.main] = mainVal;
    if (mapping.footer) c.d[mapping.footer] = footerVal;
    
    // Save back to wrapper
    currentWrapper.dataset.c = JSON.stringify(c);
    
    // Update the rendered component
    const wbEl = currentWrapper.querySelector('');
    if (wbEl) {
      if (mapping.header) wbEl.dataset[mapping.header] = headerVal;
      if (mapping.main) wbEl.dataset[mapping.main] = mainVal;
      if (mapping.footer) wbEl.dataset[mapping.footer] = footerVal;
      
      // Re-render via WB
      if (window.WB) {
        wbEl.classList.remove('wb-ready');
        window.WB.remove(wbEl);
        window.WB.scan(currentWrapper);
      }
    }
    
    // Update properties panel if open
    if (window.sel === currentWrapper && window.renderPropertiesPanel) {
      const propsPanel = document.getElementById('propsPanel');
      if (propsPanel) {
        window.renderPropertiesPanel(currentWrapper, propsPanel);
      }
    }
    
    // Save to history
    if (window.saveHist) window.saveHist();
    
    // Show feedback
    if (window.toast) window.toast('Changes saved!');
    
    closeQuickEdit();
    
  } catch (e) {
    console.error('Quick edit save error:', e);
    if (window.toast) window.toast('Error saving changes');
  }
}

// =============================================================================
// TEST URL
// =============================================================================
function testUrl() {
  const url = document.getElementById('qeFooter').value.trim();
  if (!url) {
    if (window.toast) window.toast('Enter a URL first');
    return;
  }
  
  // Handle anchor links
  if (url.startsWith('#')) {
    if (window.toast) window.toast('Anchor link: ' + url);
    return;
  }
  
  // Open in new tab
  window.open(url, '_blank', 'noopener');
}

// =============================================================================
// KEYBOARD HANDLER
// =============================================================================
function handleKeydown(e) {
  if (!overlayEl?.classList.contains('open')) return;
  
  if (e.key === 'Escape') {
    e.preventDefault();
    closeQuickEdit();
  }
  
  // Ctrl+Enter to save
  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
    e.preventDefault();
    saveQuickEdit();
  }
}

// =============================================================================
// CHECK IF QUICK EDIT SHOULD APPLY
// =============================================================================
export function shouldShowQuickEdit(wrapper) {
  if (!wrapper) return false;
  
  try {
    const c = JSON.parse(wrapper.dataset.c || '{}');
    const activeBehavior = c.b || '';
    
    // Quick edit applies to these behaviors
    const quickEditBehaviors = [
      'card', 'cardlink', 'cardbutton', 'cardhero', 'cardimage', 
      'cardoverlay', 'cardprofile', 'cardpricing', 'cardproduct',
      'cardstats', 'cardtestimonial', 'link', 'alert', 'hero', 'details'
    ];
    
    return quickEditBehaviors.some(b => behavior.includes(b));
  } catch {
    return false;
  }
}

// =============================================================================
// GLOBAL EXPORT
// =============================================================================
window.openQuickEdit = openQuickEdit;
window.closeQuickEdit = closeQuickEdit;
window.shouldShowQuickEdit = shouldShowQuickEdit;

export default {
  openQuickEdit,
  closeQuickEdit,
  shouldShowQuickEdit
};
