/**
 * WB Builder Workflow System
 * Guides users through: Intent → Type → Build → Export
 * Preserves work and allows workflow switching
 * Supports named workspaces
 * 
 * KEY PRINCIPLE: Workspace always loads first, workflow is an overlay
 */

// =============================================================================
// WORKFLOW DEFINITIONS
// =============================================================================

const WORKFLOWS = {
  page: {
    id: 'page',
    icon: '📄',
    title: 'A Page',
    subtitle: 'Landing, About, Contact, etc',
    color: '#6366f1',
    options: [
      { id: 'landing', icon: '🚀', name: 'Landing Page', templates: ['landing-saas', 'landing-agency', 'landing-app', 'landing-startup'] },
      { id: 'portfolio', icon: '💼', name: 'Portfolio', templates: ['portfolio-creative', 'portfolio-developer', 'portfolio-photo'] },
      { id: 'blog', icon: '📝', name: 'Blog Post', templates: ['blog-home', 'blog-personal', 'content-article'] },
      { id: 'contact', icon: '📞', name: 'Contact Page', templates: ['contact-page'] },
      { id: 'pricing', icon: '💰', name: 'Pricing Page', templates: ['pricing-page'] },
      { id: 'about', icon: '👋', name: 'About Page', templates: ['about-company'] },
      { id: 'other', icon: '✨', name: 'Something else', templates: 'all' }
    ]
  },
  
  website: {
    id: 'website',
    icon: '🌐',
    title: 'A Website',
    subtitle: 'Multi-page with navigation',
    color: '#10b981',
    options: [
      { id: 'business', icon: '🏢', name: 'Business Site', templates: ['full-company-site', 'cielo-vista-home'] },
      { id: 'store', icon: '🛍️', name: 'Online Store', templates: ['shop-storefront', 'shop-launch'] },
      { id: 'restaurant', icon: '🍽️', name: 'Restaurant', templates: ['restaurant-fine', 'restaurant-cafe', 'business-restaurant'] },
      { id: 'portfolio', icon: '💼', name: 'Portfolio', templates: ['portfolio-creative', 'portfolio-developer'] },
      { id: 'dashboard', icon: '📊', name: 'Dashboard', templates: ['dashboard-analytics', 'dashboard-admin'] }
    ]
  },
  
  component: {
    id: 'component',
    icon: '🧩',
    title: 'A Component',
    subtitle: 'Card, Hero, Form, etc',
    color: '#f59e0b',
    options: [
      { id: 'card', icon: '🃏', name: 'Card', sections: ['features-grid'] },
      { id: 'hero', icon: '🦸', name: 'Hero Section', sections: ['hero-simple', 'hero-split', 'hero-video'] },
      { id: 'form', icon: '📋', name: 'Form', sections: ['contact-section', 'newsletter'] },
      { id: 'pricing', icon: '💰', name: 'Pricing Table', sections: ['pricing-table'] },
      { id: 'testimonial', icon: '💬', name: 'Testimonials', sections: ['testimonials'] },
      { id: 'stats', icon: '📊', name: 'Stats', sections: ['stats-section'] },
      { id: 'cta', icon: '🎯', name: 'Call to Action', sections: ['cta-section'] },
      { id: 'footer', icon: '📋', name: 'Footer', sections: ['footer-simple', 'footer-columns'] }
    ]
  },
  
  style: {
    id: 'style',
    icon: '🎨',
    title: 'A Style',
    subtitle: 'Theme, Colors, Fonts',
    color: '#ec4899',
    action: 'openThemeEditor'
  },
  
  javascript: {
    id: 'javascript',
    icon: '⚡',
    title: 'JavaScript',
    subtitle: 'Effects & Behaviors',
    color: '#8b5cf6',
    options: [
      { id: 'confetti', icon: '🎆', name: 'Confetti', behavior: 'confetti' },
      { id: 'snow', icon: '❄️', name: 'Snow Effect', behavior: 'snow' },
      { id: 'animate', icon: '💫', name: 'Animations', behavior: 'animate' },
      { id: 'ripple', icon: '🌊', name: 'Ripple Effect', behavior: 'ripple' },
      { id: 'parallax', icon: '🎢', name: 'Parallax', behavior: 'parallax' },
      { id: 'lazy', icon: '⏳', name: 'Lazy Loading', behavior: 'lazy' },
      { id: 'carousel', icon: '🔄', name: 'Carousel', behavior: 'carousel' }
    ]
  },
  
  explore: {
    id: 'explore',
    icon: '🔍',
    title: 'Just Explore',
    subtitle: 'Browse & experiment',
    color: '#64748b',
    action: 'openFullBuilder'
  }
};

// =============================================================================
// STATE MANAGEMENT
// =============================================================================

const STORAGE_KEY = 'wb-builder-workflow';

function getWorkflowState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

function saveWorkflowState(state) {
  const existing = getWorkflowState() || {};
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    ...existing,
    ...state,
    lastModified: new Date().toISOString()
  }));
}

function clearWorkflowState() {
  localStorage.removeItem(STORAGE_KEY);
}

function hasExistingWork() {
  const canvas = document.getElementById('canvas');
  if (!canvas) return false;
  
  // Check localStorage first
  const savedPage = localStorage.getItem('wb-builder-page');
  if (savedPage) {
    try {
      const data = JSON.parse(savedPage);
      const components = data.components || data;
      return Array.isArray(components) && components.length > 0;
    } catch {
      return false;
    }
  }
  
  // Check canvas DOM
  return canvas.querySelectorAll('.dropped').length > 0;
}

function getWorkInfo() {
  const savedPage = localStorage.getItem('wb-builder-page');
  const workflowState = getWorkflowState();
  
  let componentCount = 0;
  let workspaceName = workflowState?.workspaceName || null;
  let lastModified = null;
  
  // Check canvas for actual count
  const canvas = document.getElementById('canvas');
  if (canvas) {
    componentCount = canvas.querySelectorAll('.dropped').length;
  }
  
  if (savedPage) {
    try {
      const data = JSON.parse(savedPage);
      if (componentCount === 0) {
        componentCount = (data.components || data).length;
      }
      // Use saved workspace name, or template name, or workflow type
      if (!workspaceName) {
        workspaceName = data.workspaceName || data.templateName || workflowState?.typeName || null;
      }
      lastModified = data.modified || workflowState?.lastModified;
    } catch {}
  }
  
  if (!lastModified && workflowState?.lastModified) {
    lastModified = workflowState.lastModified;
  }
  
  return {
    componentCount,
    workspaceName,
    lastModified,
    workflow: workflowState?.intent,
    subtype: workflowState?.subtype
  };
}

function formatTimeAgo(isoString) {
  if (!isoString) return 'recently';
  
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
}

// =============================================================================
// WORKSPACE NAMING
// =============================================================================

/**
 * Set workspace name
 */
function setWorkspaceName(name) {
  const trimmed = name?.trim() || '';
  saveWorkflowState({ workspaceName: trimmed });
  
  // Also save to page data for export
  const savedPage = localStorage.getItem('wb-builder-page');
  if (savedPage) {
    try {
      const data = JSON.parse(savedPage);
      data.workspaceName = trimmed;
      localStorage.setItem('wb-builder-page', JSON.stringify(data));
    } catch {}
  }
  
  // Update indicator
  updateIndicatorText();
}

/**
 * Prompt user for workspace name
 */
function promptWorkspaceName(currentName = '') {
  const overlay = createOverlay('nameWorkspace');
  overlay.innerHTML = `
    <div class="wf-container wf-name-workspace">
      <div class="wf-header">
        <h2>📝 Name Your Workspace</h2>
        <p>Give your project a name to remember it by</p>
      </div>
      
      <div class="wf-name-input-wrap">
        <input type="text" 
               id="wfWorkspaceName" 
               class="wf-name-input" 
               placeholder="My Awesome Project"
               value="${currentName}"
               maxlength="50"
               autocomplete="off"
               spellcheck="false">
      </div>
      
      <div class="wf-actions">
        <button class="wf-btn wf-btn-primary" onclick="window.wfSaveName()">
          Save Name
        </button>
        <button class="wf-btn wf-btn-ghost" onclick="window.wfSkipName()">
          Skip for now
        </button>
      </div>
    </div>
  `;
  
  document.body.appendChild(overlay);
  animateIn(overlay);
  
  // Focus input
  setTimeout(() => {
    const input = document.getElementById('wfWorkspaceName');
    if (input) {
      input.focus();
      input.select();
    }
  }, 100);
  
  // Enter key to save
  document.getElementById('wfWorkspaceName')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      window.wfSaveName();
    }
  });
}

window.wfSaveName = () => {
  const input = document.getElementById('wfWorkspaceName');
  const name = input?.value?.trim() || '';
  
  if (name) {
    setWorkspaceName(name);
    if (window.toast) window.toast(`Workspace named: "${name}"`);
  }
  
  hideWorkflow();
  showWorkflowIndicator();
};

window.wfSkipName = () => {
  hideWorkflow();
  showWorkflowIndicator();
};

window.wfEditName = () => {
  document.getElementById('wfIndicatorMenu')?.classList.remove('visible');
  const info = getWorkInfo();
  promptWorkspaceName(info.workspaceName || '');
};

// =============================================================================
// WORKFLOW UI
// =============================================================================

let workflowVisible = false;

/**
 * Show the main workflow picker
 */
export function showWorkflowPicker() {
  if (workflowVisible) return;
  workflowVisible = true;
  
  // Check for existing work
  const hasWork = hasExistingWork();
  
  if (hasWork) {
    showWelcomeBack();
  } else {
    showIntentPicker();
  }
}

/**
 * Show "Welcome Back" for returning users with existing work
 */
function showWelcomeBack() {
  const info = getWorkInfo();
  const displayName = info.workspaceName || 'Untitled Workspace';
  const isUnnamed = !info.workspaceName;
  
  const overlay = createOverlay('welcomeBack');
  overlay.innerHTML = `
    <div class="wf-container wf-welcome-back">
      <div class="wf-header">
        <span class="wf-wave">👋</span>
        <h1>Welcome back!</h1>
      </div>
      
      <div class="wf-work-preview">
        <div class="wf-work-icon">📄</div>
        <div class="wf-work-info">
          <div class="wf-work-title">
            ${displayName}
            ${isUnnamed ? '<button class="wf-name-btn" onclick="window.wfNameFromWelcome()" title="Name this workspace">✏️</button>' : ''}
          </div>
          <div class="wf-work-meta">
            ${info.componentCount} component${info.componentCount !== 1 ? 's' : ''} • 
            Last edited ${formatTimeAgo(info.lastModified)}
          </div>
        </div>
      </div>
      
      <div class="wf-actions">
        <button class="wf-btn wf-btn-primary" onclick="window.wfContinue()">
          <span>▶</span> Continue Working
        </button>
        <button class="wf-btn wf-btn-secondary" onclick="window.wfStartNew()">
          <span>🔄</span> Start Something New
        </button>
      </div>
      
      <div class="wf-hint">
        Your work is already loaded on the canvas behind this dialog.
      </div>
    </div>
  `;
  
  document.body.appendChild(overlay);
  animateIn(overlay);
}

/**
 * Name workspace from welcome screen
 */
window.wfNameFromWelcome = () => {
  const info = getWorkInfo();
  
  // Replace the container content with name input
  const container = document.querySelector('.wf-container');
  if (!container) return;
  
  container.innerHTML = `
    <div class="wf-header">
      <h2>📝 Name Your Workspace</h2>
      <p>Give your project a name</p>
    </div>
    
    <div class="wf-name-input-wrap">
      <input type="text" 
             id="wfWorkspaceName" 
             class="wf-name-input" 
             placeholder="My Awesome Project"
             value=""
             maxlength="50"
             autocomplete="off"
             spellcheck="false">
    </div>
    
    <div class="wf-actions">
      <button class="wf-btn wf-btn-primary" onclick="window.wfSaveNameAndContinue()">
        Save & Continue
      </button>
      <button class="wf-btn wf-btn-ghost" onclick="window.wfBackToWelcome()">
        ← Back
      </button>
    </div>
  `;
  
  // Focus input
  setTimeout(() => {
    const input = document.getElementById('wfWorkspaceName');
    if (input) {
      input.focus();
    }
  }, 50);
  
  // Enter to save
  document.getElementById('wfWorkspaceName')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      window.wfSaveNameAndContinue();
    }
  });
};

window.wfSaveNameAndContinue = () => {
  const input = document.getElementById('wfWorkspaceName');
  const name = input?.value?.trim();
  
  if (name) {
    setWorkspaceName(name);
    if (window.toast) window.toast(`Named: "${name}"`);
  }
  
  hideWorkflow();
  showWorkflowIndicator();
};

window.wfBackToWelcome = () => {
  workflowVisible = false;
  document.getElementById('wfOverlay')?.remove();
  showWelcomeBack();
};

/**
 * User chose to continue their work - just close the overlay
 */
window.wfContinue = () => {
  hideWorkflow();
  showWorkflowIndicator();
  
  // Trigger onboarding for returning users
  setTimeout(() => {
    if (window.updateFlowState) window.updateFlowState();
  }, 300);
};

/**
 * User wants to start something new (but has existing work)
 */
window.wfStartNew = () => {
  const overlay = document.getElementById('wfOverlay');
  if (!overlay) return;
  
  const info = getWorkInfo();
  const displayName = info.workspaceName || 'Your workspace';
  
  overlay.querySelector('.wf-container').outerHTML = `
    <div class="wf-container wf-confirm">
      <div class="wf-header">
        <h2>What about your current work?</h2>
        <p>"${displayName}" has ${info.componentCount} component${info.componentCount !== 1 ? 's' : ''}</p>
      </div>
      
      <div class="wf-actions wf-actions-vertical">
        <button class="wf-btn wf-btn-primary" onclick="window.wfSaveAndNew()">
          <span>💾</span> Save Backup & Start New
        </button>
        <button class="wf-btn wf-btn-danger" onclick="window.wfDiscardAndNew()">
          <span>🗑️</span> Discard & Start New
        </button>
        <button class="wf-btn wf-btn-ghost" onclick="window.wfCancel()">
          ← Keep Working
        </button>
      </div>
    </div>
  `;
};

/**
 * Save current work as JSON backup, then start fresh
 */
window.wfSaveAndNew = () => {
  // Trigger export
  if (window.exportJSON) {
    window.exportJSON();
  }
  
  // Clear and show intent picker after short delay
  setTimeout(() => {
    clearCanvas();
    showIntentPicker();
  }, 500);
};

/**
 * Discard current work and start fresh
 */
window.wfDiscardAndNew = () => {
  clearCanvas();
  showIntentPicker();
};

/**
 * Cancel - go back to canvas with existing work
 */
window.wfCancel = () => {
  hideWorkflow();
  showWorkflowIndicator();
};

/**
 * Clear the canvas completely
 */
function clearCanvas() {
  const canvas = document.getElementById('canvas');
  if (canvas) {
    canvas.innerHTML = `
      <div class="empty" id="empty">
        <div class="empty-icon">🎨</div>
        <h3>Ready to create</h3>
        <p>Pick a template or build from scratch</p>
      </div>
    `;
  }
  localStorage.removeItem('wb-builder-page');
  clearWorkflowState();
  
  if (window.upd) window.upd();
  if (window.renderTree) window.renderTree();
}

/**
 * Show the main intent picker - "What do you want to create?"
 */
function showIntentPicker() {
  const overlay = document.getElementById('wfOverlay') || createOverlay('intentPicker');
  
  overlay.innerHTML = `
    <div class="wf-container wf-intent">
      <div class="wf-header">
        <h1>🎨 What do you want to create?</h1>
      </div>
      
      <div class="wf-grid">
        ${Object.values(WORKFLOWS).map(wf => `
          <button class="wf-card" data-workflow="${wf.id}" style="--wf-color: ${wf.color}" onclick="window.wfSelectIntent('${wf.id}')">
            <span class="wf-card-icon">${wf.icon}</span>
            <span class="wf-card-title">${wf.title}</span>
            <span class="wf-card-subtitle">${wf.subtitle}</span>
          </button>
        `).join('')}
      </div>
    </div>
  `;
  
  if (!overlay.parentNode) {
    document.body.appendChild(overlay);
  }
  animateIn(overlay);
}

/**
 * User selected an intent (page, website, component, etc)
 */
window.wfSelectIntent = (intentId) => {
  const workflow = WORKFLOWS[intentId];
  if (!workflow) return;
  
  // Save intent
  saveWorkflowState({ intent: intentId, intentName: workflow.title });
  
  // Handle special actions
  if (workflow.action === 'openThemeEditor') {
    hideWorkflow();
    showWorkflowIndicator();
    openThemeEditor();
    return;
  }
  
  if (workflow.action === 'openFullBuilder') {
    hideWorkflow();
    showWorkflowIndicator();
    if (window.toast) window.toast('Explore mode! Drag components from the sidebar.');
    return;
  }
  
  // For website intent, enable site builder view
  if (intentId === 'website') {
    import('./builder-template-browser.js').then(module => {
      if (module.setViewMode) module.setViewMode('site');
    });
  }
  
  // Show type picker for this intent
  if (workflow.options) {
    showTypePicker(workflow);
  }
};

/**
 * Show type picker (e.g., Landing, Portfolio, Blog for "Page")
 */
function showTypePicker(workflow) {
  const overlay = document.getElementById('wfOverlay');
  if (!overlay) return;
  
  overlay.querySelector('.wf-container').outerHTML = `
    <div class="wf-container wf-types">
      <button class="wf-back" onclick="window.wfBack()">← Back</button>
      
      <div class="wf-header">
        <span class="wf-header-icon">${workflow.icon}</span>
        <h2>What kind of ${workflow.title.toLowerCase()}?</h2>
      </div>
      
      <div class="wf-grid wf-grid-small">
        ${workflow.options.map(opt => `
          <button class="wf-card wf-card-small" onclick="window.wfSelectType('${workflow.id}', '${opt.id}')">
            <span class="wf-card-icon">${opt.icon}</span>
            <span class="wf-card-title">${opt.name}</span>
          </button>
        `).join('')}
      </div>
    </div>
  `;
}

/**
 * Go back to intent picker
 */
window.wfBack = () => {
  showIntentPicker();
};

/**
 * User selected a specific type - show templates or take action
 */
window.wfSelectType = (intentId, typeId) => {
  const workflow = WORKFLOWS[intentId];
  const option = workflow?.options?.find(o => o.id === typeId);
  if (!option) return;
  
  // Save state
  saveWorkflowState({
    intent: intentId,
    intentName: workflow.title,
    subtype: typeId,
    typeName: option.name
  });
  
  // Handle based on intent type
  if (intentId === 'component' && option.sections) {
    hideWorkflow();
    showWorkflowIndicator();
    if (window.toast) window.toast(`Browse ${option.name} components in the sidebar`);
    return;
  }
  
  if (intentId === 'javascript' && option.behavior) {
    hideWorkflow();
    showWorkflowIndicator();
    showBehaviorDemo(option.behavior, option.name);
    return;
  }
  
  // Close workflow and let user pick from template browser
  hideWorkflow();
  showWorkflowIndicator();
  
  // Open template browser with filter hint
  if (window.toast) window.toast(`Showing ${option.name} templates`);
  
  // Open templates modal
  if (window.openTemplates) {
    setTimeout(() => window.openTemplates(), 200);
  }
};

/**
 * Show a behavior demo on the canvas
 */
function showBehaviorDemo(behavior, name) {
  // Remove empty state
  document.getElementById('empty')?.remove();
  
  const demoHtml = `
    <div style="padding: 40px; text-align: center; background: var(--bg-secondary); border-radius: 16px; max-width: 500px; margin: 2rem auto;">
      <h3 style="margin: 0 0 8px; font-size: 1.5rem;">${name}</h3>
      <p style="color: #888; margin: 0 0 24px;">Click the button to see the effect!</p>
      <button style="padding: 12px 24px; font-size: 1rem; border-radius: 8px; background: var(--primary); color: white; border: none; cursor: pointer;">
        Try ${name}
      </button>
      <div style="margin-top: 24px; padding: 16px; background: var(--bg-primary); border-radius: 8px; display: flex; align-items: center; justify-content: space-between; gap: 16px;">
        <code style="font-family: monospace; font-size: 13px; color: #10b981;">&lt;button&gt;Click me&lt;/button&gt;</code>
        <button onclick="navigator.clipboard.writeText('<button x-legacy=\\'${behavior}\\'>Click me</button>'); window.toast && window.toast('Copied!')" style="background: none; border: 1px solid var(--border-color); color: #888; padding: 6px 12px; border-radius: 6px; font-size: 12px; cursor: pointer;">📋 Copy</button>
      </div>
    </div>
  `;
  
  if (window.addHTML) {
    window.addHTML(demoHtml);
  }
}

/**
 * Open theme editor
 */
function openThemeEditor() {
  const themeSelect = document.getElementById('pageTheme');
  if (themeSelect) {
    themeSelect.focus();
    if (window.toast) window.toast('Pick a theme from the dropdown');
  }
}

// =============================================================================
// WORKFLOW INDICATOR (persistent widget in corner)
// =============================================================================

function updateIndicatorText() {
  const textEl = document.querySelector('.wf-indicator-text');
  if (textEl) {
    const info = getWorkInfo();
    const state = getWorkflowState();
    const workflow = state?.intent ? WORKFLOWS[state.intent] : null;
    textEl.textContent = info.workspaceName || state?.typeName || workflow?.title || 'Builder';
  }
}

function showWorkflowIndicator() {
  let indicator = document.getElementById('wfIndicator');
  if (indicator) return; // Already showing
  
  const state = getWorkflowState();
  const info = getWorkInfo();
  const workflow = state?.intent ? WORKFLOWS[state.intent] : null;
  const displayName = info.workspaceName || state?.typeName || workflow?.title || 'Builder';
  
  indicator = document.createElement('div');
  indicator.id = 'wfIndicator';
  indicator.className = 'wf-indicator';
  indicator.innerHTML = `
    <button class="wf-indicator-btn" onclick="window.wfShowMenu()" title="Workspace options">
      <span class="wf-indicator-icon">${workflow?.icon || '🎨'}</span>
      <span class="wf-indicator-text">${displayName}</span>
      <span class="wf-indicator-arrow">▼</span>
    </button>
    <div class="wf-indicator-menu" id="wfIndicatorMenu">
      <button onclick="window.wfEditName()">✏️ Rename workspace</button>
      <button onclick="window.wfChangeWorkflow()">🔄 Start something new</button>
      <hr class="wf-menu-divider">
      <button onclick="window.wfShowShortcuts()">⌨️ Keyboard shortcuts</button>
      <button onclick="window.wfShowHelp()">❓ Help & tips</button>
    </div>
  `;
  
  document.body.appendChild(indicator);
}

function hideWorkflowIndicator() {
  document.getElementById('wfIndicator')?.remove();
}

window.wfShowMenu = () => {
  const menu = document.getElementById('wfIndicatorMenu');
  if (menu) {
    menu.classList.toggle('visible');
    
    // Close on click outside
    if (menu.classList.contains('visible')) {
      setTimeout(() => {
        const closeMenu = (e) => {
          if (!e.target.closest('.wf-indicator')) {
            menu.classList.remove('visible');
            document.removeEventListener('click', closeMenu);
          }
        };
        document.addEventListener('click', closeMenu);
      }, 0);
    }
  }
};

window.wfChangeWorkflow = () => {
  document.getElementById('wfIndicatorMenu')?.classList.remove('visible');
  workflowVisible = false;
  showWorkflowPicker();
};

window.wfShowShortcuts = () => {
  document.getElementById('wfIndicatorMenu')?.classList.remove('visible');
  if (window.showShortcuts) window.showShortcuts();
};

window.wfShowHelp = () => {
  document.getElementById('wfIndicatorMenu')?.classList.remove('visible');
  if (window.toast) window.toast('Tip: Drag components from the sidebar to build your page!');
};

// =============================================================================
// OVERLAY HELPERS
// =============================================================================

function createOverlay(id) {
  document.getElementById('wfOverlay')?.remove();
  
  const overlay = document.createElement('div');
  overlay.id = 'wfOverlay';
  overlay.className = 'wf-overlay';
  overlay.dataset.screen = id;
  
  return overlay;
}

function animateIn(overlay) {
  requestAnimationFrame(() => {
    overlay.classList.add('visible');
  });
}

function hideWorkflow() {
  const overlay = document.getElementById('wfOverlay');
  if (overlay) {
    overlay.classList.remove('visible');
    setTimeout(() => overlay.remove(), 300);
  }
  workflowVisible = false;
}

// =============================================================================
// STYLES
// =============================================================================

function injectWorkflowStyles() {
  if (document.getElementById('wfStyles')) return;
  
  const style = document.createElement('style');
  style.id = 'wfStyles';
  style.textContent = `
    /* Overlay */
    .wf-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.85);
      backdrop-filter: blur(8px);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity 0.3s ease;
    }
    
    .wf-overlay.visible {
      opacity: 1;
    }
    
    /* Container */
    .wf-container {
      background: var(--bg-primary, #1a1a2e);
      border: 1px solid var(--border-color, #333);
      border-radius: 20px;
      padding: 40px;
      max-width: 720px;
      width: 90%;
      max-height: 85vh;
      overflow-y: auto;
      transform: translateY(20px) scale(0.95);
      transition: transform 0.3s ease;
      position: relative;
    }
    
    .wf-overlay.visible .wf-container {
      transform: translateY(0) scale(1);
    }
    
    /* Header */
    .wf-header {
      text-align: center;
      margin-bottom: 28px;
    }
    
    .wf-header h1 {
      font-size: 1.75rem;
      margin: 0;
      color: #fff;
    }
    
    .wf-header h2 {
      font-size: 1.4rem;
      margin: 0;
      color: #fff;
    }
    
    .wf-header p {
      color: #888;
      margin: 8px 0 0;
      font-size: 0.95rem;
    }
    
    .wf-header-icon {
      font-size: 2rem;
      display: block;
      margin-bottom: 8px;
    }
    
    .wf-wave {
      display: inline-block;
      font-size: 2.5rem;
      animation: wave 1s ease-in-out;
    }
    
    @keyframes wave {
      0%, 100% { transform: rotate(0deg); }
      25% { transform: rotate(20deg); }
      75% { transform: rotate(-20deg); }
    }
    
    /* Back button */
    .wf-back {
      position: absolute;
      top: 16px;
      left: 16px;
      background: none;
      border: none;
      color: #888;
      font-size: 14px;
      cursor: pointer;
      padding: 8px 12px;
      border-radius: 8px;
      transition: all 0.2s;
    }
    
    .wf-back:hover {
      color: #fff;
      background: var(--bg-secondary, #252542);
    }
    
    /* Grid */
    .wf-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 14px;
    }
    
    .wf-grid-small {
      grid-template-columns: repeat(4, 1fr);
    }
    
    @media (max-width: 600px) {
      .wf-grid { grid-template-columns: repeat(2, 1fr); }
      .wf-grid-small { grid-template-columns: repeat(3, 1fr); }
    }
    
    /* Cards */
    .wf-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
      padding: 28px 20px;
      background: var(--bg-secondary, #252542);
      border: 2px solid transparent;
      border-radius: 14px;
      cursor: pointer;
      transition: all 0.2s;
      text-align: center;
    }
    
    .wf-card:hover {
      border-color: var(--wf-color, var(--primary, #6366f1));
      background: var(--bg-tertiary, #2a2a4a);
      transform: translateY(-3px);
      box-shadow: 0 8px 24px -4px rgba(0, 0, 0, 0.3);
    }
    
    .wf-card-small {
      padding: 18px 14px;
      gap: 6px;
    }
    
    .wf-card-icon {
      font-size: 2.2rem;
      line-height: 1;
    }
    
    .wf-card-small .wf-card-icon {
      font-size: 1.8rem;
    }
    
    .wf-card-title {
      font-size: 0.95rem;
      font-weight: 600;
      color: #fff;
    }
    
    .wf-card-subtitle {
      font-size: 0.75rem;
      color: #888;
      line-height: 1.3;
    }
    
    /* Work preview */
    .wf-work-preview {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 18px;
      background: var(--bg-secondary, #252542);
      border: 1px solid var(--border-color, #444);
      border-radius: 12px;
      margin-bottom: 28px;
    }
    
    .wf-work-icon {
      font-size: 2.2rem;
      opacity: 0.8;
    }
    
    .wf-work-info { flex: 1; }
    
    .wf-work-title {
      font-size: 1rem;
      font-weight: 600;
      color: #fff;
      margin-bottom: 4px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .wf-name-btn {
      background: none;
      border: none;
      padding: 2px 6px;
      cursor: pointer;
      opacity: 0.5;
      transition: opacity 0.2s;
      font-size: 14px;
    }
    
    .wf-name-btn:hover {
      opacity: 1;
    }
    
    .wf-work-meta {
      font-size: 0.8rem;
      color: #888;
    }
    
    /* Name input */
    .wf-name-input-wrap {
      margin-bottom: 24px;
    }
    
    .wf-name-input {
      width: 100%;
      padding: 14px 18px;
      font-size: 1.1rem;
      background: var(--bg-secondary, #252542);
      border: 2px solid var(--border-color, #444);
      border-radius: 10px;
      color: #fff;
      outline: none;
      transition: border-color 0.2s;
    }
    
    .wf-name-input:focus {
      border-color: var(--primary, #6366f1);
    }
    
    .wf-name-input::placeholder {
      color: #666;
    }
    
    /* Hint text */
    .wf-hint {
      text-align: center;
      font-size: 0.8rem;
      color: #666;
      margin-top: 20px;
    }
    
    /* Actions */
    .wf-actions {
      display: flex;
      gap: 14px;
      justify-content: center;
    }
    
    .wf-actions-vertical {
      flex-direction: column;
      align-items: center;
    }
    
    .wf-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 24px;
      border: none;
      border-radius: 10px;
      font-size: 0.95rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }
    
    .wf-btn span { font-size: 1.1rem; }
    
    .wf-btn-primary {
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: #fff;
    }
    
    .wf-btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(99, 102, 241, 0.35);
    }
    
    .wf-btn-secondary {
      background: var(--bg-secondary, #252542);
      color: #fff;
      border: 1px solid var(--border-color, #444);
    }
    
    .wf-btn-secondary:hover {
      border-color: var(--primary, #6366f1);
      background: var(--bg-tertiary, #2a2a4a);
    }
    
    .wf-btn-danger {
      background: rgba(239, 68, 68, 0.15);
      color: #f87171;
      border: 1px solid rgba(239, 68, 68, 0.25);
    }
    
    .wf-btn-danger:hover {
      background: rgba(239, 68, 68, 0.25);
      border-color: #ef4444;
    }
    
    .wf-btn-ghost {
      background: none;
      color: #888;
    }
    
    .wf-btn-ghost:hover { color: #fff; }
    
    /* Indicator widget */
    .wf-indicator {
      position: fixed;
      bottom: 70px;
      left: 16px;
      z-index: 1000;
    }
    
    .wf-indicator-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      background: var(--bg-secondary, #252542);
      border: 1px solid var(--border-color, #444);
      border-radius: 8px;
      color: #fff;
      font-size: 12px;
      cursor: pointer;
      transition: all 0.2s;
    }
    
    .wf-indicator-btn:hover {
      border-color: var(--primary, #6366f1);
      background: var(--bg-tertiary, #2a2a4a);
    }
    
    .wf-indicator-icon { font-size: 14px; }
    
    .wf-indicator-text {
      max-width: 150px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    
    .wf-indicator-arrow {
      font-size: 9px;
      opacity: 0.5;
      margin-left: 2px;
    }
    
    .wf-indicator-menu {
      position: absolute;
      bottom: 100%;
      left: 0;
      margin-bottom: 6px;
      background: var(--bg-secondary, #252542);
      border: 1px solid var(--border-color, #444);
      border-radius: 8px;
      padding: 6px 0;
      min-width: 200px;
      opacity: 0;
      visibility: hidden;
      transform: translateY(6px);
      transition: all 0.2s;
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25);
    }
    
    .wf-indicator-menu.visible {
      opacity: 1;
      visibility: visible;
      transform: translateY(0);
    }
    
    .wf-indicator-menu button {
      display: block;
      width: 100%;
      padding: 8px 14px;
      background: none;
      border: none;
      color: #fff;
      font-size: 12px;
      text-align: left;
      cursor: pointer;
      transition: background 0.15s;
    }
    
    .wf-indicator-menu button:hover {
      background: var(--bg-tertiary, #2a2a4a);
    }
    
    .wf-menu-divider {
      border: none;
      border-top: 1px solid var(--border-color, #444);
      margin: 4px 0;
    }
  `;
  
  document.head.appendChild(style);
}

// =============================================================================
// INITIALIZATION
// =============================================================================

export function initWorkflow() {
  injectWorkflowStyles();
  
  // Don't auto-show workflow picker - user can access via File menu
  // The indicator is also hidden by default now
  // Users go straight to the builder canvas
}

// Expose globally
window.showWorkflowPicker = showWorkflowPicker;
window.hideWorkflow = hideWorkflow;
window.setWorkspaceName = setWorkspaceName;

export default {
  init: initWorkflow,
  show: showWorkflowPicker,
  hide: hideWorkflow,
  getState: getWorkflowState,
  setName: setWorkspaceName
};
