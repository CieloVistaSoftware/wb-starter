/**
 * Builder Incomplete Detection
 * ============================
 * Detects placeholder values, missing required fields, and incomplete components.
 * Shows visual warnings on canvas and in properties panel.
 */

// Placeholder patterns to detect
const PLACEHOLDER_PATTERNS = {
  href: [
    /^#$/,                          // Just "#"
    /^#[a-z0-9-]+$/i,               // #something (will verify if anchor exists)
    /^javascript:void/,             // javascript:void(0)
    /^#signup$/i,                   // Common template placeholders
    /^#features$/i,
    /^#pricing$/i,
    /^#contact$/i,
    /^#cta$/i,
  ],
  src: [
    /^https?:\/\/picsum\.photos/,   // Placeholder images
    /^https?:\/\/via\.placeholder/, // Placeholder.com
    /^https?:\/\/placehold/,        // Various placeholder services
    /^https?:\/\/dummyimage/,
    /^https?:\/\/placekitten/,
    /^https?:\/\/i\.pravatar\.cc/,  // Avatar placeholders
    /^https?:\/\/example\.com/,     // example.com
    /placeholder/i,                  // Contains "placeholder"
  ],
  url: [
    /^https?:\/\/example\.com/,
    /^#/,
  ],
  email: [
    /^test@/,
    /^example@/,
    /^user@example/,
    /@example\.com$/,
  ],
  text: [
    /^lorem ipsum/i,
    /^placeholder/i,
    /^your .+ here$/i,              // "Your text here", "Your name here"
    /^enter .+ here$/i,
    /^add .+ here$/i,
    /^click me$/i,
    /^button$/i,
    /^link$/i,
    /^heading$/i,
    /^title$/i,
    /^subtitle$/i,
  ]
};

// Required fields per behavior
const REQUIRED_FIELDS = {
  // Links & Navigation
  link: ['href'],
  backtotop: [],
  
  // Cards
  card: ['title'],
  cardimage: ['image'],
  cardvideo: ['video'],
  cardbutton: ['primary'],
  cardhero: ['title'],
  cardprofile: ['name'],
  cardpricing: ['plan', 'price'],
  cardstats: ['value', 'label'],
  cardtestimonial: ['quote', 'author'],
  cardproduct: ['title', 'price'],
  cardoverlay: ['title', 'image'],
  
  // Media
  image: ['src'],
  video: ['src'],
  audio: ['src'],
  youtube: ['id'],
  vimeo: ['id'],
  embed: ['src'],
  
  // Actions
  clipboard: ['clipboardText'],
  share: ['title'],
  print: [],
  fullscreen: [],
  
  // Interactive
  dialog: ['title'],
  tooltip: ['text'],
  
  // Forms
  input: ['placeholder'],
  textarea: ['placeholder'],
};

// Fields that commonly need user attention (warnings, not errors)
const ATTENTION_FIELDS = {
  card: ['subtitle', 'footer'],
  cardhero: ['subtitle', 'primary', 'primaryHref'],
  cardprofile: ['role', 'bio', 'avatar'],
  cardpricing: ['features', 'cta', 'ctaHref'],
  cardproduct: ['description', 'image', 'cta'],
  cardtestimonial: ['role', 'avatar'],
  hero: ['subtitle', 'cta', 'ctaHref'],
};

/**
 * Check if a value is a placeholder
 */
function isPlaceholder(value, fieldType = 'text') {
  if (!value || value === '') return { isPlaceholder: false, isEmpty: true };
  
  const str = String(value).trim();
  if (str === '') return { isPlaceholder: false, isEmpty: true };
  
  // Check patterns for this field type
  const patterns = PLACEHOLDER_PATTERNS[fieldType] || PLACEHOLDER_PATTERNS.text;
  
  for (const pattern of patterns) {
    if (pattern.test(str)) {
      return { isPlaceholder: true, isEmpty: false, pattern: pattern.toString() };
    }
  }
  
  // Also check text patterns for all fields
  if (fieldType !== 'text') {
    for (const pattern of PLACEHOLDER_PATTERNS.text) {
      if (pattern.test(str)) {
        return { isPlaceholder: true, isEmpty: false, pattern: pattern.toString() };
      }
    }
  }
  
  return { isPlaceholder: false, isEmpty: false };
}

/**
 * Check if an anchor href points to a valid target
 */
function isValidAnchor(href) {
  if (!href || !href.startsWith('#')) return true;
  
  const targetId = href.slice(1);
  if (!targetId) return false;
  
  // Check if element exists
  return document.getElementById(targetId) !== null;
}

/**
 * Get field type for validation
 */
function getFieldType(fieldName) {
  if (['href', 'primaryHref', 'secondaryHref', 'ctaHref'].includes(fieldName)) return 'href';
  if (['src', 'image', 'imageSrc', 'avatar', 'cover', 'video', 'audio'].includes(fieldName)) return 'src';
  if (['url', 'shareUrl'].includes(fieldName)) return 'url';
  if (['email'].includes(fieldName)) return 'email';
  return 'text';
}

/**
 * Analyze a component for incomplete/placeholder values
 */
function analyzeComponent(wrapper) {
  const result = {
    id: wrapper.id,
    behavior: null,
    issues: [],      // Critical - must fix
    warnings: [],    // Should fix
    suggestions: [], // Nice to have
    isComplete: true
  };
  
  try {
    const c = JSON.parse(wrapper.dataset.c || '{}');
    const data = c.d || {};
    const behavior = c.b;
    
    result.behavior = behavior;
    
    if (!behavior) return result;
    
    // Check required fields
    const required = REQUIRED_FIELDS[behavior] || [];
    for (const field of required) {
      const value = data[field];
      const fieldType = getFieldType(field);
      const check = isPlaceholder(value, fieldType);
      
      if (check.isEmpty) {
        result.issues.push({
          field,
          type: 'missing',
          message: `${formatFieldName(field)} is required`,
          severity: 'error'
        });
        result.isComplete = false;
      } else if (check.isPlaceholder) {
        // Downgrade placeholder errors to warnings for better UX
        result.warnings.push({
          field,
          type: 'placeholder',
          message: `${formatFieldName(field)} has a placeholder value`,
          value: value,
          severity: 'warning'
        });
        // result.isComplete = false; // Don't mark as incomplete, just warn
      }
    }
    
    // Check href anchors
    const hrefFields = ['href', 'primaryHref', 'secondaryHref', 'ctaHref'];
    for (const field of hrefFields) {
      const value = data[field];
      if (value && value.startsWith('#') && !isValidAnchor(value)) {
        result.warnings.push({
          field,
          type: 'broken-anchor',
          message: `${formatFieldName(field)} points to "${value}" which doesn't exist`,
          value: value,
          severity: 'warning'
        });
      }
    }
    
    // Check attention fields (warnings)
    const attention = ATTENTION_FIELDS[behavior] || [];
    for (const field of attention) {
      const value = data[field];
      const fieldType = getFieldType(field);
      const check = isPlaceholder(value, fieldType);
      
      if (check.isEmpty) {
        result.suggestions.push({
          field,
          type: 'empty',
          message: `Consider adding ${formatFieldName(field)}`,
          severity: 'info'
        });
      } else if (check.isPlaceholder) {
        result.warnings.push({
          field,
          type: 'placeholder',
          message: `${formatFieldName(field)} appears to be a placeholder`,
          value: value,
          severity: 'warning'
        });
      }
    }
    
    // Check all src/image fields for placeholder images
    for (const [field, value] of Object.entries(data)) {
      if (!value) continue;
      
      const fieldType = getFieldType(field);
      if (fieldType === 'src' && !required.includes(field)) {
        const check = isPlaceholder(value, 'src');
        if (check.isPlaceholder) {
          result.warnings.push({
            field,
            type: 'placeholder-image',
            message: `${formatFieldName(field)} uses a placeholder image`,
            value: value,
            severity: 'warning'
          });
        }
      }
    }
    
  } catch (e) {
    console.warn('[Incomplete] Error analyzing component:', e);
  }
  
  return result;
}

/**
 * Format field name for display
 */
function formatFieldName(field) {
  return field
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, s => s.toUpperCase())
    .replace(/Href$/, ' Link')
    .replace(/Src$/, ' Source')
    .replace(/Cta/, 'CTA');
}

/**
 * Analyze all components on canvas
 */
function analyzeCanvas() {
  const results = [];
  const canvas = document.getElementById('canvas');
  if (!canvas) return results;
  
  canvas.querySelectorAll('.dropped').forEach(wrapper => {
    const analysis = analyzeComponent(wrapper);
    if (analysis.issues.length > 0 || analysis.warnings.length > 0) {
      results.push(analysis);
    }
  });
  
  return results;
}

/**
 * Log issues to server
 */
let logTimeout;
function logIssuesToServer(issues) {
  // Always log, even if empty, to clear previous errors if fixed? 
  // The server appends, so maybe only log if there are issues?
  // If we want to track "current state", we might want to overwrite.
  // But the server implementation appends to a list (or overwrites? let's check server.js later, assuming append or overwrite).
  // Actually, the user said "issues are bugs and require a fix", implying a log of active bugs.
  
  clearTimeout(logTimeout);
  logTimeout = setTimeout(() => {
    // Only send if there are issues, or maybe send empty to clear?
    // For now, let's send whatever analyzeCanvas returns.
    
    fetch('/api/log-issues', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        timestamp: new Date().toISOString(),
        issues: issues
      })
    })
    .then(res => res.json())
    .then(data => {
        // Silent success
    })
    .catch(err => console.warn('[Builder] Failed to log issues:', err));
  }, 3000); // 3 second debounce
}

/**
 * Update visual badges on components
 */
function updateBadges() {
  const canvas = document.getElementById('canvas');
  if (!canvas) return;
  
  // Remove existing badges
  canvas.querySelectorAll('.incomplete-badge').forEach(b => b.remove());
  
  // Get analysis results
  const results = analyzeCanvas();
  
  // Track totals for footer
  let totalIssues = 0;
  let totalWarnings = 0;
  
  results.forEach(analysis => {
    totalIssues += analysis.issues.length;
    totalWarnings += analysis.warnings.length;
    
    const wrapper = document.getElementById(analysis.id);
    if (wrapper) {
      if (analysis.issues.length > 0) {
        addBadge(wrapper, 'error', analysis.issues.length);
      } else if (analysis.warnings.length > 0) {
        addBadge(wrapper, 'warning', analysis.warnings.length);
      }
    }
  });
  
  // Update footer status
  updateFooterStatus(totalIssues, totalWarnings);
  
  // Log to server
  logIssuesToServer(results);
}

/**
 * Update the footer status indicator
 */
function updateFooterStatus(issueCount, warningCount) {
  const statusEl = document.getElementById('issueStatus');
  const countEl = document.getElementById('issueCount');
  const dotEl = statusEl?.querySelector('.status-dot');
  
  if (!statusEl || !countEl) return;
  
  if (issueCount > 0) {
    statusEl.style.display = 'flex';
    statusEl.classList.remove('warning');
    countEl.textContent = `${issueCount} issue${issueCount > 1 ? 's' : ''}`;
    if (dotEl) {
      dotEl.classList.remove('status-dot--warning');
      dotEl.classList.add('status-dot--error');
    }
    statusEl.onclick = () => showAllIssues();
  } else if (warningCount > 0) {
    statusEl.style.display = 'flex';
    statusEl.classList.add('warning');
    countEl.textContent = `${warningCount} warning${warningCount > 1 ? 's' : ''}`;
    if (dotEl) {
      dotEl.classList.remove('status-dot--error');
      dotEl.classList.add('status-dot--warning');
    }
    statusEl.onclick = () => showAllIssues();
  } else {
    statusEl.style.display = 'none';
  }
}

/**
 * Show all issues in a modal
 */
function showAllIssues() {
  const results = analyzeCanvas();
  
  if (results.length === 0) {
    window.toast?.('No issues found!');
    return;
  }
  
  // Create modal
  const modal = document.createElement('div');
  modal.id = 'allIssuesModal';
  modal.className = 'template-checklist-modal';
  
  const totalIssues = results.reduce((sum, r) => sum + r.issues.length, 0);
  const totalWarnings = results.reduce((sum, r) => sum + r.warnings.length, 0);
  
  // Prepare text for copy
  const headerText = `📋 Page Issues\n${totalIssues + totalWarnings} item${(totalIssues + totalWarnings) !== 1 ? 's' : ''} need attention\nIssues have been logged to the server (/api/log-issues)\n\n`;
  
  const bodyText = results.map(r => {
    let text = `Component: ${r.behavior} (${r.id})\n`;
    r.issues.forEach(i => text += `  [ERROR] ${i.message}\n`);
    r.warnings.forEach(w => text += `  [WARN] ${w.message}\n`);
    return text;
  }).join('\n');

  const copyText = headerText + bodyText;

  modal.innerHTML = `
    <div class="checklist-content">
      <div class="checklist-header">
        <h3>📋 Page Issues</h3>
        <p>${totalIssues + totalWarnings} item${(totalIssues + totalWarnings) > 1 ? 's' : ''} need attention</p>
        <p style="font-size:0.75rem;opacity:0.6;margin-top:0.25rem;margin-bottom:1rem;display:block;">Issues have been logged to the server (/api/log-issues)</p>
      </div>
      
      <div class="checklist-summary">
        ${totalIssues > 0 ? `<span class="summary-item summary-error">${totalIssues} required</span>` : ''}
        ${totalWarnings > 0 ? `<span class="summary-item summary-warning">${totalWarnings} recommended</span>` : ''}
      </div>
      
      <div class="checklist-items">
        ${results.map(analysis => `
          <div class="checklist-component" data-id="${analysis.id}">
            <div class="checklist-component-name" onclick="document.getElementById('allIssuesModal').remove(); window.selComp?.(document.getElementById('${analysis.id}'))" style="cursor:pointer">
              ${analysis.behavior || 'Component'} <span style="opacity:0.5">→</span>
            </div>
            ${analysis.issues.map(issue => `
              <div class="checklist-item checklist-item--error" onclick="document.getElementById('allIssuesModal').remove(); window.selComp?.(document.getElementById('${analysis.id}'), '${issue.field}')" style="cursor:pointer">
                <span class="issue-icon">●</span>
                <span>${issue.message}</span>
              </div>
            `).join('')}
            ${analysis.warnings.map(warning => `
              <div class="checklist-item checklist-item--warning" onclick="document.getElementById('allIssuesModal').remove(); window.selComp?.(document.getElementById('${analysis.id}'), '${warning.field}')" style="cursor:pointer">
                <span class="issue-icon">●</span>
                <span>${warning.message}</span>
              </div>
            `).join('')}
          </div>
        `).join('')}
      </div>
      
      <div class="checklist-actions">
        <button class="checklist-btn checklist-btn--secondary" id="copyIssuesBtn">📋 Copy Issues</button>
        <button class="checklist-btn checklist-btn--primary" onclick="document.getElementById('allIssuesModal').remove()">Close</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Bind copy button
  document.getElementById('copyIssuesBtn').onclick = () => {
    navigator.clipboard.writeText(copyText).then(() => {
      const btn = document.getElementById('copyIssuesBtn');
      const originalText = btn.textContent;
      btn.textContent = '✅ Copied!';
      setTimeout(() => btn.textContent = originalText, 2000);
      window.toast?.('Issues copied to clipboard');
    });
  };
  
  // Close on backdrop click
  modal.onclick = (e) => {
    if (e.target === modal) modal.remove();
  };
}

/**
 * Add a badge to a component
 */
function addBadge(wrapper, type, count) {
  const badge = document.createElement('div');
  badge.className = `incomplete-badge incomplete-badge--${type}`;
  badge.innerHTML = type === 'error' ? '!' : '?';
  badge.title = `${count} ${type === 'error' ? 'issue' : 'warning'}${count > 1 ? 's' : ''} - click to view`;
  
  badge.onclick = (e) => {
    e.stopPropagation();
    window.selComp?.(wrapper);
    showIssuesPanel(wrapper);
  };
  
  wrapper.appendChild(badge);
}

/**
 * Show issues panel for a component
 */
function showIssuesPanel(wrapper) {
  const analysis = analyzeComponent(wrapper);
  
  if (analysis.issues.length === 0 && analysis.warnings.length === 0) {
    return;
  }
  
  // Find or create issues container in properties panel
  let issuesContainer = document.getElementById('propsIssues');
  
  if (!issuesContainer) {
    const propsPanel = document.getElementById('propsPanel');
    if (!propsPanel) return;
    
    issuesContainer = document.createElement('div');
    issuesContainer.id = 'propsIssues';
    issuesContainer.className = 'props-issues';
    
    // Insert at top of props panel content
    const propsContent = propsPanel.querySelector('.props-panel-content');
    if (propsContent) {
      propsContent.insertBefore(issuesContainer, propsContent.firstChild);
    }
  }
  
  // Build issues HTML
  let html = '';
  
  if (analysis.issues.length > 0) {
    html += `<div class="issues-section issues-section--error">
      <div class="issues-header">⚠️ ${analysis.issues.length} Issue${analysis.issues.length > 1 ? 's' : ''}</div>
      ${analysis.issues.map(issue => `
        <div class="issue-item issue-item--error" data-field="${issue.field}">
          <span class="issue-icon">●</span>
          <span class="issue-message">${issue.message}</span>
          <button class="issue-goto" onclick="scrollToProperty('${wrapper.id}', '${issue.field}')" title="Go to field">→</button>
        </div>
      `).join('')}
    </div>`;
  }
  
  if (analysis.warnings.length > 0) {
    html += `<div class="issues-section issues-section--warning">
      <div class="issues-header">⚡ ${analysis.warnings.length} Warning${analysis.warnings.length > 1 ? 's' : ''}</div>
      ${analysis.warnings.map(warning => `
        <div class="issue-item issue-item--warning" data-field="${warning.field}">
          <span class="issue-icon">●</span>
          <span class="issue-message">${warning.message}</span>
          <button class="issue-goto" onclick="scrollToProperty('${wrapper.id}', '${warning.field}')" title="Go to field">→</button>
        </div>
      `).join('')}
    </div>`;
  }
  
  issuesContainer.innerHTML = html;
  issuesContainer.style.display = html ? 'block' : 'none';
}

/**
 * Scroll to and highlight a property field
 */
window.scrollToProperty = (wrapperId, fieldName) => {
  const input = document.querySelector(`[data-prop-field="${fieldName}"]`) ||
                document.getElementById(`prop-${wrapperId}-${fieldName}`);
  
  if (input) {
    input.scrollIntoView({ behavior: 'smooth', block: 'center' });
    input.focus();
    input.classList.add('prop-highlight');
    setTimeout(() => input.classList.remove('prop-highlight'), 2000);
  }
};

/**
 * Show post-template checklist
 */
function showTemplateChecklist(templateName, componentIds) {
  const allIssues = [];
  
  componentIds.forEach(id => {
    const wrapper = document.getElementById(id);
    if (!wrapper) return;
    
    const analysis = analyzeComponent(wrapper);
    if (analysis.issues.length > 0 || analysis.warnings.length > 0) {
      allIssues.push(analysis);
    }
  });
  
  if (allIssues.length === 0) return;
  
  // Count totals
  const totalIssues = allIssues.reduce((sum, a) => sum + a.issues.length, 0);
  const totalWarnings = allIssues.reduce((sum, a) => sum + a.warnings.length, 0);
  
  // Create checklist modal
  const modal = document.createElement('div');
  modal.id = 'templateChecklist';
  modal.className = 'template-checklist-modal';
  modal.innerHTML = `
    <div class="checklist-content">
      <div class="checklist-header">
        <h3>📋 Complete Your Template</h3>
        <p>"${templateName}" needs your attention</p>
      </div>
      
      <div class="checklist-summary">
        ${totalIssues > 0 ? `<span class="summary-item summary-error">${totalIssues} required</span>` : ''}
        ${totalWarnings > 0 ? `<span class="summary-item summary-warning">${totalWarnings} recommended</span>` : ''}
      </div>
      
      <div class="checklist-items">
        ${allIssues.map(analysis => `
          <div class="checklist-component">
            <div class="checklist-component-name">${analysis.behavior}</div>
            ${analysis.issues.map(issue => `
              <label class="checklist-item checklist-item--error">
                <input type="checkbox" data-id="${analysis.id}" data-field="${issue.field}">
                <span>${issue.message}</span>
              </label>
            `).join('')}
            ${analysis.warnings.map(warning => `
              <label class="checklist-item checklist-item--warning">
                <input type="checkbox" data-id="${analysis.id}" data-field="${warning.field}">
                <span>${warning.message}</span>
              </label>
            `).join('')}
          </div>
        `).join('')}
      </div>
      
      <div class="checklist-actions">
        <button class="checklist-btn checklist-btn--primary" onclick="startChecklistFlow()">Fix Now</button>
        <button class="checklist-btn checklist-btn--secondary" onclick="closeChecklist()">Later</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Handle checkbox clicks - navigate to component
  modal.querySelectorAll('.checklist-item input').forEach(checkbox => {
    checkbox.addEventListener('change', (e) => {
      if (e.target.checked) {
        const wrapper = document.getElementById(e.target.dataset.id);
        if (wrapper) {
          window.selComp?.(wrapper, e.target.dataset.field);
        }
      }
    });
  });
}

/**
 * Start guided checklist flow
 */
window.startChecklistFlow = () => {
  const modal = document.getElementById('templateChecklist');
  if (!modal) return;
  
  // Get first unchecked item
  const firstItem = modal.querySelector('.checklist-item input:not(:checked)');
  if (firstItem) {
    const wrapper = document.getElementById(firstItem.dataset.id);
    if (wrapper) {
      window.selComp?.(wrapper, firstItem.dataset.field);
      firstItem.checked = true;
    }
  }
  
  closeChecklist();
};

/**
 * Close checklist modal
 */
window.closeChecklist = () => {
  document.getElementById('templateChecklist')?.remove();
};

/**
 * Mark property field with warning/error state
 */
function markPropertyField(wrapper, fieldName, severity) {
  const input = document.querySelector(`[data-prop-field="${fieldName}"]`);
  if (input) {
    input.classList.add(`prop-${severity}`);
  }
}

/**
 * Clear property field markers
 */
function clearPropertyMarkers() {
  document.querySelectorAll('.prop-error, .prop-warning').forEach(el => {
    el.classList.remove('prop-error', 'prop-warning');
  });
}

/**
 * Inject CSS for incomplete detection UI
 */
function injectStyles() {
  if (document.getElementById('incomplete-styles')) return;
  
  const style = document.createElement('style');
  style.id = 'incomplete-styles';
  style.textContent = `
    /* Badge on canvas components */
    .incomplete-badge {
      position: absolute;
      top: -6px;
      right: -6px;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      font-weight: bold;
      cursor: pointer;
      z-index: 100;
      animation: badge-pulse 2s infinite;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    }
    
    .incomplete-badge--error {
      background: #ef4444;
      color: white;
    }
    
    .incomplete-badge--warning {
      background: #f59e0b;
      color: white;
    }
    
    @keyframes badge-pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.1); }
    }
    
    /* Issues panel in properties */
    .props-issues {
      margin-bottom: 1rem;
      border-radius: 8px;
      overflow: hidden;
    }
    
    .issues-section {
      padding: 0.75rem;
    }
    
    .issues-section--error {
      background: rgba(239, 68, 68, 0.1);
      border-left: 3px solid #ef4444;
    }
    
    .issues-section--warning {
      background: rgba(245, 158, 11, 0.1);
      border-left: 3px solid #f59e0b;
    }
    
    .issues-header {
      font-weight: 600;
      font-size: 0.875rem;
      margin-bottom: 0.5rem;
    }
    
    .issue-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.25rem 0;
      font-size: 0.8125rem;
    }
    
    .issue-icon {
      font-size: 8px;
    }
    
    .issue-item--error .issue-icon { color: #ef4444; }
    .issue-item--warning .issue-icon { color: #f59e0b; }
    
    .issue-message {
      flex: 1;
    }
    
    .issue-goto {
      background: none;
      border: none;
      color: var(--primary);
      cursor: pointer;
      padding: 0.25rem;
      opacity: 0.7;
    }
    
    .issue-goto:hover {
      opacity: 1;
    }
    
    /* Property field states */
    .prop-error {
      border-color: #ef4444 !important;
      box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.2) !important;
    }
    
    .prop-warning {
      border-color: #f59e0b !important;
      box-shadow: 0 0 0 2px rgba(245, 158, 11, 0.2) !important;
    }
    
    .prop-highlight {
      animation: prop-flash 0.5s ease 3;
    }
    
    @keyframes prop-flash {
      0%, 100% { background: var(--bg-tertiary); }
      50% { background: rgba(99, 102, 241, 0.3); }
    }
    
    /* Template checklist modal */
    .template-checklist-modal {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      animation: fadeIn 0.2s ease;
    }
    
    .checklist-content {
      background: var(--bg-secondary);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 1.5rem;
      max-width: 480px;
      width: 90%;
      max-height: 80vh;
      overflow-y: auto;
    }
    
    .checklist-header h3 {
      margin: 0 0 0.25rem 0;
      font-size: 1.25rem;
    }
    
    .checklist-header p {
      margin: 0;
      opacity: 0.7;
      font-size: 0.875rem;
    }
    
    .checklist-summary {
      display: flex;
      gap: 0.75rem;
      margin: 1rem 0;
    }
    
    .summary-item {
      padding: 0.25rem 0.75rem;
      border-radius: 999px;
      font-size: 0.8125rem;
      font-weight: 500;
    }
    
    .summary-error {
      background: rgba(239, 68, 68, 0.2);
      color: #f87171;
    }
    
    .summary-warning {
      background: rgba(245, 158, 11, 0.2);
      color: #fbbf24;
    }
    
    .checklist-items {
      margin: 1rem 0;
    }
    
    .checklist-component {
      margin-bottom: 1rem;
    }
    
    .checklist-component-name {
      font-weight: 600;
      font-size: 0.875rem;
      margin-bottom: 0.5rem;
      text-transform: capitalize;
    }
    
    .checklist-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.375rem 0;
      cursor: pointer;
      font-size: 0.875rem;
    }
    
    .checklist-item input {
      accent-color: var(--primary);
    }
    
    .checklist-item--error span {
      color: #f87171;
    }
    
    .checklist-item--warning span {
      color: #fbbf24;
    }
    
    .checklist-actions {
      display: flex;
      gap: 0.75rem;
      margin-top: 1.5rem;
    }
    
    .checklist-btn {
      flex: 1;
      padding: 0.75rem 1rem;
      border-radius: 8px;
      font-weight: 500;
      cursor: pointer;
      border: none;
    }
    
    .checklist-btn--primary {
      background: var(--primary);
      color: white;
    }
    
    .checklist-btn--secondary {
      background: var(--bg-tertiary);
      color: var(--text-primary);
    }
    
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
  `;
  
  document.head.appendChild(style);
}

// Initialize
function init() {
  injectStyles();
  
  // Update badges when canvas changes
  const observer = new MutationObserver((mutations) => {
    // Ignore mutations that are just badge updates to prevent infinite loops
    const isBadgeUpdate = mutations.every(m => {
      const addedNodes = Array.from(m.addedNodes);
      const removedNodes = Array.from(m.removedNodes);
      
      const addedAreBadges = addedNodes.length === 0 || addedNodes.every(n => 
        n.nodeType === 1 && n.classList.contains('incomplete-badge')
      );
      
      const removedAreBadges = removedNodes.length === 0 || removedNodes.every(n => 
        n.nodeType === 1 && n.classList.contains('incomplete-badge')
      );

      return m.type === 'childList' && addedAreBadges && removedAreBadges;
    });

    if (isBadgeUpdate) return;

    requestAnimationFrame(updateBadges);
  });
  
  const canvas = document.getElementById('canvas');
  if (canvas) {
    observer.observe(canvas, { childList: true, subtree: true });
    updateBadges();
  }
}

// Run on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// Exports
export {
  analyzeComponent,
  analyzeCanvas,
  updateBadges,
  showTemplateChecklist,
  showIssuesPanel,
  showAllIssues,
  updateFooterStatus,
  isPlaceholder,
  REQUIRED_FIELDS,
  PLACEHOLDER_PATTERNS
};

export default {
  analyzeComponent,
  analyzeCanvas,
  updateBadges,
  showTemplateChecklist,
  showIssuesPanel,
  showAllIssues
};
