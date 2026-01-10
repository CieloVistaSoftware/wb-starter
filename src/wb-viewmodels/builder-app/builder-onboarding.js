/**
 * WB Builder Onboarding & Flow Polish
 * Guides new users through: Template → Edit → Export
 */

// =============================================================================
// STATE
// =============================================================================
let hintsShown = new Set(JSON.parse(localStorage.getItem('wb-hints-shown') || '[]'));
let currentStep = 'empty'; // empty | editing | ready
let hintQueue = [];
let hintTimeout = null;

// =============================================================================
// HINT DEFINITIONS
// =============================================================================
const HINTS = {
  templateLoaded: {
    id: 'template-loaded',
    message: '✨ Click any text to edit it directly on the canvas',
    duration: 4000,
    once: true
  },
  firstEdit: {
    id: 'first-edit',
    message: '🎯 Great! Keep customizing to make it yours',
    duration: 3000,
    once: true
  },
  propertiesPanel: {
    id: 'props-panel',
    message: '⚙️ Use the Properties panel on the right for more options',
    duration: 4000,
    once: true
  },
  readyToExport: {
    id: 'ready-export',
    message: '🚀 Looking good! Click "Export" when you\'re ready to save',
    duration: 5000,
    once: true
  },
  dragDrop: {
    id: 'drag-drop',
    message: '📦 Drag components from the sidebar to add more sections',
    duration: 4000,
    once: true
  }
};

// =============================================================================
// HINT DISPLAY
// =============================================================================

function showHint(hintKey) {
  const hint = HINTS[hintKey];
  if (!hint) return;
  
  // Skip if already shown and marked as once
  if (hint.once && hintsShown.has(hint.id)) return;
  
  // Add to queue
  hintQueue.push(hint);
  processHintQueue();
}

function processHintQueue() {
  if (hintTimeout || hintQueue.length === 0) return;
  
  const hint = hintQueue.shift();
  displayHintBanner(hint);
  
  // Mark as shown
  if (hint.once) {
    hintsShown.add(hint.id);
    localStorage.setItem('wb-hints-shown', JSON.stringify([...hintsShown]));
  }
  
  hintTimeout = setTimeout(() => {
    hideHintBanner();
    hintTimeout = null;
    // Process next hint after a small delay
    setTimeout(processHintQueue, 500);
  }, hint.duration);
}

function displayHintBanner(hint) {
  let banner = document.getElementById('onboardingHint');
  
  if (!banner) {
    banner = document.createElement('div');
    banner.id = 'onboardingHint';
    banner.className = 'onboarding-hint';
    document.body.appendChild(banner);
  }
  
  banner.innerHTML = `
    <span class="hint-message">${hint.message}</span>
    <button class="hint-dismiss" onclick="window.dismissHint()">✕</button>
  `;
  
  // Animate in
  requestAnimationFrame(() => {
    banner.classList.add('visible');
  });
}

function hideHintBanner() {
  const banner = document.getElementById('onboardingHint');
  if (banner) {
    banner.classList.remove('visible');
  }
}

window.dismissHint = () => {
  hideHintBanner();
  if (hintTimeout) {
    clearTimeout(hintTimeout);
    hintTimeout = null;
  }
  // Process next hint
  setTimeout(processHintQueue, 300);
};

// =============================================================================
// FLOW STATE TRACKING
// =============================================================================

function updateFlowState() {
  const canvas = document.getElementById('canvas');
  if (!canvas) return;
  
  const componentCount = canvas.querySelectorAll('.dropped').length;
  const hasEmpty = canvas.querySelector('#empty');
  
  let newStep = 'empty';
  
  if (componentCount === 0 || hasEmpty) {
    newStep = 'empty';
  } else if (componentCount >= 1) {
    newStep = 'editing';
    
    // Check if "ready" (has substantial content)
    if (componentCount >= 3) {
      newStep = 'ready';
    }
  }
  
  // Trigger hints based on state changes
  if (newStep !== currentStep) {
    if (newStep === 'editing' && currentStep === 'empty') {
      // Just loaded a template or added first component
      showHint('templateLoaded');
    }
    
    if (newStep === 'ready') {
      showHint('readyToExport');
    }
    
    currentStep = newStep;
  }
}



// =============================================================================
// EXPORT MODAL
// =============================================================================

window.showExportModal = () => {
  // Remove existing
  document.getElementById('exportModal')?.remove();
  
  const modal = document.createElement('div');
  modal.id = 'exportModal';
  modal.className = 'export-modal';
  
  const componentCount = document.querySelectorAll('.dropped').length;
  
  modal.innerHTML = `
    <div class="export-modal-backdrop" onclick="window.closeExportModal()"></div>
    <div class="export-modal-content">
      <div class="export-modal-header">
        <h2>🎉 Your Page is Ready!</h2>
        <p>${componentCount} component${componentCount !== 1 ? 's' : ''} built</p>
        <button class="export-modal-close" onclick="window.closeExportModal()">✕</button>
      </div>
      
      <div class="export-modal-body">
        <div class="export-options">
          <button class="export-option" onclick="window.togglePreview(); window.closeExportModal();">
            <span class="export-option-icon">👁️</span>
            <span class="export-option-title">Preview</span>
            <span class="export-option-desc">See your page in action</span>
          </button>
          
          <button class="export-option export-option--primary" onclick="window.saveAsHTML(); window.closeExportModal();">
            <span class="export-option-icon">📄</span>
            <span class="export-option-title">Download HTML</span>
            <span class="export-option-desc">Ready to publish anywhere</span>
          </button>
          
          <button class="export-option" onclick="window.exportJSON(); window.closeExportModal();">
            <span class="export-option-icon">📦</span>
            <span class="export-option-title">Export JSON</span>
            <span class="export-option-desc">Save for later editing</span>
          </button>
          
          <button class="export-option" onclick="window.copyAsHTML(); window.closeExportModal();">
            <span class="export-option-icon">📋</span>
            <span class="export-option-title">Copy HTML</span>
            <span class="export-option-desc">Paste into your project</span>
          </button>
        </div>
      </div>
      
      <div class="export-modal-footer">
        <button class="export-later-btn" onclick="window.closeExportModal()">
          Keep Editing
        </button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  requestAnimationFrame(() => {
    modal.classList.add('visible');
  });
};

window.closeExportModal = () => {
  const modal = document.getElementById('exportModal');
  if (modal) {
    modal.classList.remove('visible');
    setTimeout(() => modal.remove(), 300);
  }
};

// =============================================================================
// EDITABLE ELEMENT HIGHLIGHTING
// =============================================================================

function initEditableHighlights() {
  const canvas = document.getElementById('canvas');
  if (!canvas) return;
  
  // Add hover effect for editable elements
  canvas.addEventListener('mouseover', (e) => {
    const editable = e.target.closest('[contenteditable="true"], .canvas-editable');
    if (editable && !editable.classList.contains('editing')) {
      editable.classList.add('hover-highlight');
      
      // Show edit tooltip on first hover
      if (!hintsShown.has('edit-tooltip-shown')) {
        showEditTooltip(editable);
      }
    }
  });
  
  canvas.addEventListener('mouseout', (e) => {
    const editable = e.target.closest('[contenteditable="true"], .canvas-editable');
    if (editable) {
      editable.classList.remove('hover-highlight');
      hideEditTooltip();
    }
  });
  
  // Track first edit
  canvas.addEventListener('focus', (e) => {
    if (e.target.closest('[contenteditable="true"]')) {
      if (!hintsShown.has('first-edit')) {
        setTimeout(() => showHint('firstEdit'), 500);
      }
    }
  }, true);
}

let editTooltip = null;

function showEditTooltip(el) {
  if (editTooltip) return;
  
  editTooltip = document.createElement('div');
  editTooltip.className = 'edit-tooltip';
  editTooltip.textContent = 'Click to edit';
  
  const rect = el.getBoundingClientRect();
  editTooltip.style.left = rect.left + rect.width / 2 + 'px';
  editTooltip.style.top = rect.top - 30 + 'px';
  
  document.body.appendChild(editTooltip);
  
  // Mark as shown
  hintsShown.add('edit-tooltip-shown');
  localStorage.setItem('wb-hints-shown', JSON.stringify([...hintsShown]));
  
  // Auto-hide
  setTimeout(() => {
    hideEditTooltip();
  }, 2000);
}

function hideEditTooltip() {
  if (editTooltip) {
    editTooltip.remove();
    editTooltip = null;
  }
}

// =============================================================================
// FIRST-TIME WELCOME OVERLAY
// =============================================================================

function showFirstTimeWelcome() {
  if (hintsShown.has('first-time-welcome')) return;
  
  const canvas = document.getElementById('canvas');
  const hasContent = canvas && canvas.querySelectorAll('.dropped').length > 0;
  if (hasContent) return; // Don't show if already has content
  
  // For now, just mark as shown - the template browser serves as the welcome
  hintsShown.add('first-time-welcome');
  localStorage.setItem('wb-hints-shown', JSON.stringify([...hintsShown]));
}

// =============================================================================
// RESET HINTS (for testing)
// =============================================================================

window.resetOnboardingHints = () => {
  hintsShown.clear();
  localStorage.removeItem('wb-hints-shown');
  console.log('[Onboarding] Hints reset');
  if (window.toast) window.toast('Onboarding hints reset');
};

// =============================================================================
// STYLES
// =============================================================================

function injectOnboardingStyles() {
  if (document.getElementById('onboardingStyles')) return;
  
  const style = document.createElement('style');
  style.id = 'onboardingStyles';
  style.textContent = `
    /* Hint Banner */
    .onboarding-hint {
      position: fixed;
      bottom: 60px;
      left: 50%;
      transform: translateX(-50%) translateY(20px);
      background: var(--bg-secondary, #252542);
      border: 1px solid var(--primary, #6366f1);
      border-radius: 12px;
      padding: 12px 20px;
      display: flex;
      align-items: center;
      gap: 16px;
      z-index: 10001;
      box-shadow: 0 8px 32px rgba(99, 102, 241, 0.3);
      opacity: 0;
      transition: all 0.3s ease;
      pointer-events: none;
    }
    
    .onboarding-hint.visible {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
      pointer-events: auto;
    }
    
    .hint-message {
      font-size: 14px;
      color: #fff;
      font-weight: 500;
    }
    
    .hint-dismiss {
      background: none;
      border: none;
      color: #888;
      cursor: pointer;
      padding: 4px;
      font-size: 14px;
      line-height: 1;
      transition: color 0.2s;
    }
    
    .hint-dismiss:hover {
      color: #fff;
    }
    

    
    /* Export Modal */
    .export-modal {
      position: fixed;
      inset: 0;
      z-index: 10002;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.3s;
    }
    
    .export-modal.visible {
      opacity: 1;
      pointer-events: auto;
    }
    
    .export-modal-backdrop {
      position: absolute;
      inset: 0;
      background: rgba(0, 0, 0, 0.8);
      backdrop-filter: blur(4px);
    }
    
    .export-modal-content {
      position: relative;
      background: var(--bg-primary, #1a1a2e);
      border: 1px solid var(--border-color, #333);
      border-radius: 20px;
      width: 90%;
      max-width: 500px;
      overflow: hidden;
      transform: translateY(20px) scale(0.95);
      transition: transform 0.3s;
    }
    
    .export-modal.visible .export-modal-content {
      transform: translateY(0) scale(1);
    }
    
    .export-modal-header {
      text-align: center;
      padding: 32px 24px 16px;
      position: relative;
    }
    
    .export-modal-header h2 {
      margin: 0 0 8px;
      font-size: 24px;
      color: #fff;
    }
    
    .export-modal-header p {
      margin: 0;
      color: #888;
      font-size: 14px;
    }
    
    .export-modal-close {
      position: absolute;
      top: 16px;
      right: 16px;
      background: none;
      border: none;
      color: #888;
      font-size: 20px;
      cursor: pointer;
      padding: 4px;
      line-height: 1;
      transition: color 0.2s;
    }
    
    .export-modal-close:hover {
      color: #fff;
    }
    
    .export-modal-body {
      padding: 16px 24px;
    }
    
    .export-options {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }
    
    .export-option {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: 20px 16px;
      background: var(--bg-secondary, #252542);
      border: 1px solid var(--border-color, #444);
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.2s;
      text-align: center;
    }
    
    .export-option:hover {
      border-color: var(--primary, #6366f1);
      background: var(--bg-tertiary, #2a2a4a);
      transform: translateY(-2px);
    }
    
    .export-option--primary {
      background: linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(139, 92, 246, 0.2));
      border-color: var(--primary, #6366f1);
    }
    
    .export-option--primary:hover {
      background: linear-gradient(135deg, rgba(99, 102, 241, 0.3), rgba(139, 92, 246, 0.3));
    }
    
    .export-option-icon {
      font-size: 28px;
    }
    
    .export-option-title {
      font-size: 14px;
      font-weight: 600;
      color: #fff;
    }
    
    .export-option-desc {
      font-size: 11px;
      color: #888;
    }
    
    .export-modal-footer {
      padding: 16px 24px 24px;
      text-align: center;
    }
    
    .export-later-btn {
      background: none;
      border: 1px solid var(--border-color, #444);
      color: #888;
      padding: 10px 24px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
      transition: all 0.2s;
    }
    
    .export-later-btn:hover {
      border-color: #666;
      color: #fff;
    }
    
    /* Editable Highlight */
    .hover-highlight {
      outline: 2px dashed rgba(99, 102, 241, 0.5) !important;
      outline-offset: 2px;
      transition: outline 0.15s;
    }
    
    .hover-highlight:hover {
      outline-color: rgba(99, 102, 241, 0.8) !important;
    }
    
    /* Edit Tooltip */
    .edit-tooltip {
      position: fixed;
      background: var(--primary, #6366f1);
      color: #fff;
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 500;
      pointer-events: none;
      transform: translateX(-50%);
      z-index: 10003;
      animation: tooltip-fade 0.2s ease;
    }
    
    .edit-tooltip::after {
      content: '';
      position: absolute;
      top: 100%;
      left: 50%;
      transform: translateX(-50%);
      border: 6px solid transparent;
      border-top-color: var(--primary, #6366f1);
    }
    
    @keyframes tooltip-fade {
      from { opacity: 0; transform: translateX(-50%) translateY(-5px); }
      to { opacity: 1; transform: translateX(-50%) translateY(0); }
    }
    
    /* Progress indicator in footer */
    .builder-footer .component-count {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .builder-footer .progress-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--primary, #6366f1);
      animation: pulse 1.5s infinite;
    }
    
    @keyframes pulse {
      0%, 100% { opacity: 0.5; transform: scale(1); }
      50% { opacity: 1; transform: scale(1.2); }
    }
  `;
  
  document.head.appendChild(style);
}

// =============================================================================
// GLOBAL EXPORTS
// =============================================================================

window.updateFlowState = updateFlowState;
window.showOnboardingHint = showHint;

// =============================================================================
// INITIALIZATION
// =============================================================================

export function initOnboarding() {
  injectOnboardingStyles();
  initEditableHighlights();
  
  // Watch for canvas changes
  const canvas = document.getElementById('canvas');
  if (canvas) {
    const observer = new MutationObserver(() => {
      updateFlowState();
    });
    
    observer.observe(canvas, {
      childList: true,
      subtree: true
    });
    
    // Initial state check
    updateFlowState();
  }
  
  // Show first-time welcome
  showFirstTimeWelcome();
  
  console.log('[Onboarding] Initialized');
}

// Auto-init when DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initOnboarding);
} else {
  // Small delay to let builder initialize first
  setTimeout(initOnboarding, 500);
}

// Named exports for ES module imports
export { showHint, updateFlowState };

export default {
  init: initOnboarding,
  showHint,
  updateFlowState
};
