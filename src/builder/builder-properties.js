/**
 * Builder Properties - Properties panel functions
 * Uses Design by Contract from builder-contracts.js
 */

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

const ELEMENT_THEMES = [
  { id: '', name: 'Inherit', description: 'Use parent/page theme' },
  { id: 'dark', name: 'Dark', description: 'Standard dark theme' },
  { id: 'light', name: 'Light', description: 'Standard light theme' },
  { id: 'cyberpunk', name: 'Cyberpunk', description: 'Vibrant magenta/cyan' },
  { id: 'ocean', name: 'Ocean', description: 'Calm blues' },
  { id: 'sunset', name: 'Sunset', description: 'Warm oranges' },
  { id: 'forest', name: 'Forest', description: 'Natural greens' },
  { id: 'midnight', name: 'Midnight', description: 'Deep monochromatic blue' },
  { id: 'twilight', name: 'Twilight', description: 'Purple-blue with warm accents' },
  { id: 'sakura', name: 'Sakura', description: 'Elegant pink' },
  { id: 'arctic', name: 'Arctic', description: 'Ice blue' },
  { id: 'desert', name: 'Desert', description: 'Warm sand tones' },
  { id: 'neon-dreams', name: 'Neon Dreams', description: 'Purple neon' },
  { id: 'retro-wave', name: 'Retro Wave', description: 'Retro pink/purple' },
  { id: 'lavender', name: 'Lavender', description: 'Soft purple pastels' },
  { id: 'emerald', name: 'Emerald', description: 'Rich jewel-toned green' },
  { id: 'ruby', name: 'Ruby', description: 'Deep red elegance' },
  { id: 'golden', name: 'Golden', description: 'Luxurious gold and amber' },
  { id: 'slate', name: 'Slate', description: 'Professional gray tones' },
  { id: 'coffee', name: 'Coffee', description: 'Warm brown tones' },
  { id: 'mint', name: 'Mint', description: 'Fresh mint green' },
  { id: 'noir', name: 'Noir', description: 'High contrast black/white' },
  { id: 'aurora', name: 'Aurora', description: 'Northern lights inspired' },
  { id: 'grape', name: 'Grape', description: 'Deep purple vibes' }
];

const X_BEHAVIORS_LIST = [
  { attr: 'x-tooltip', name: 'Tooltip', icon: '💬', desc: 'Shows a tooltip with custom text when user hovers or focuses on the element', hasValue: true },
  { attr: 'x-copy', name: 'Copy', icon: '📋', desc: 'Copies the element\'s text content to clipboard when clicked' },
  { attr: 'x-toggle', name: 'Toggle', icon: '🔀', desc: 'Toggles a CSS class on/off when clicked (e.g., show/hide)' },
  { attr: 'x-collapse', name: 'Collapse', icon: '📂', desc: 'Makes content collapsible/expandable with smooth animation' },
  { attr: 'x-ripple', name: 'Ripple', icon: '💧', desc: 'Adds Material Design ripple effect animation on click' },
  { attr: 'x-sticky', name: 'Sticky', icon: '📌', desc: 'Sticks element to top of viewport when scrolling past it' },
  { attr: 'x-draggable', name: 'Drag', icon: '✋', desc: 'Makes element draggable with mouse/touch' },
  { attr: 'x-resizable', name: 'Resize', icon: '↔️', desc: 'Adds resize handles to element corners' },
  { attr: 'x-fade-in', name: 'Fade', icon: '🌟', desc: 'Fades in element when it scrolls into view' },
  { attr: 'x-parallax', name: 'Parallax', icon: '🌌', desc: 'Creates depth effect - element moves slower than scroll' },
  { attr: 'x-confetti', name: 'Confetti', icon: '🎉', desc: 'Triggers confetti particle burst when clicked' },
  { attr: 'x-share', name: 'Share', icon: '📤', desc: 'Opens native OS share dialog when clicked' },
  { attr: 'x-darkmode', name: 'Dark', icon: '🌙', desc: 'Forces dark theme on this element and children' }
];

// ═══════════════════════════════════════════════════════════════════════════
// HELPER: Get component with validation
// ═══════════════════════════════════════════════════════════════════════════

function getComponent(componentId, fnName) {
  const ctx = { fn: fnName, componentId };
  
  if (!componentId) {
    if (typeof warn === 'function') {
      warn(false, `${fnName}: componentId is falsy`, ctx);
    }
    return null;
  }
  
  // Try BuilderState first, then fallback
  const comp = (typeof BuilderState !== 'undefined' && BuilderState.findComponent)
    ? BuilderState.findComponent(componentId)
    : window.components?.find(c => c.id === componentId);
  
  if (!comp && typeof warn === 'function') {
    warn(false, `${fnName}: Component not found`, ctx);
  }
  
  return comp;
}

function getSelectedComponent(fnName) {
  const comp = getComponent(selectedComponent?.id, fnName);
  if (!comp) {
    warn(false, `${fnName}: No component selected`, { fn: fnName });
  }
  return comp;
}

// ═══════════════════════════════════════════════════════════════════════════
// THEME FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

function getThemeSelectorHtml(comp) {
  const currentTheme = comp?.data?.elementTheme || '';
  const options = ELEMENT_THEMES.map(t => 
    `<option value="${t.id}" ${currentTheme === t.id ? 'selected' : ''} title="${t.description}">${t.name}</option>`
  ).join('');
  
  return `
    <div class="properties-section">
      <h4>🎨 Element Theme</h4>
      <div class="property">
        <label>Theme Override</label>
        <select onchange="updateElementTheme('${comp?.id}', this.value)" style="width: 100%;">
          ${options}
        </select>
        <p style="font-size: 0.75rem; color: var(--text-secondary); margin: 0.5rem 0 0 0;">
          ${currentTheme ? `✅ Using: ${ELEMENT_THEMES.find(t => t.id === currentTheme)?.name || currentTheme}` : '📦 Inheriting from parent'}
        </p>
      </div>
    </div>
  `;
}

function updateElementTheme(componentId, themeId) {
  // ═══ PRECONDITIONS ═══
  const ctx = { fn: 'updateElementTheme', componentId, themeId };
  console.log('[updateElementTheme] called', ctx);
  
  // Defensive: check if contracts are loaded
  if (typeof require === 'function' && typeof is !== 'undefined') {
    require(is.nonEmptyString(componentId), 'componentId required', ctx);
  } else if (!componentId) {
    console.error('updateElementTheme: componentId required', ctx);
    return;
  }
  
  const comp = getComponent(componentId, 'updateElementTheme');
  if (!comp) {
    console.warn('updateElementTheme: Component not found', ctx);
    return;
  }
  
  // ═══ EXECUTE ═══
  // Update state via BuilderState if available, otherwise direct
  if (typeof window.BuilderState !== 'undefined' && window.BuilderState.updateComponentData) {
    const res = window.BuilderState.updateComponentData(componentId, 'elementTheme', themeId);
    console.log('[updateElementTheme] BuilderState.updateComponentData result for', componentId, res && typeof res === 'object' ? { id: res.id, data: res.data } : res);
  } else {
    // Fallback: update directly
    comp.data = comp.data || {};
    comp.data.elementTheme = themeId;
    console.log('[updateElementTheme] fallback comp.data set', comp.id, comp.data);
  }
  
  // Apply to DOM element
  const content = comp.element?.querySelector('.component-content');
  if (content) {
    const firstChild = content.firstElementChild;
    if (firstChild) {
      if (themeId) {
        firstChild.setAttribute('data-theme', themeId);
      } else {
        firstChild.removeAttribute('data-theme');
      }
      comp.html = content.innerHTML;
      console.log('[updateElementTheme] DOM updated for', comp.id, 'firstChild=', firstChild?.tagName);
    }
  }
  
  // ═══ POSTCONDITIONS ═══
  if (typeof ensure === 'function') {
    const verifyComp = typeof window.BuilderState !== 'undefined' 
      ? window.BuilderState.findComponent(componentId) 
      : comp;
    console.log('[updateElementTheme] verifyComp.data.elementTheme =', verifyComp?.data?.elementTheme);
    ensure(verifyComp?.data?.elementTheme === themeId, 
      `Theme not persisted: expected "${themeId}", got "${verifyComp?.data?.elementTheme}"`, ctx);
  }
  
  // Refresh UI
  if (comp.template && typeof showProperties === 'function') {
    showProperties(comp.template);
  }
  
  const themeName = ELEMENT_THEMES.find(t => t.id === themeId)?.name || 'Inherit';
  if (typeof updateStatus === 'function') {
    updateStatus(`Element theme: ${themeName}`);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// X-BEHAVIORS FUNCTIONS  
// ═══════════════════════════════════════════════════════════════════════════

function getXBehaviorsPickerHtml(comp) {
  const contentEl = comp?.element?.querySelector('.component-content');
  const targetEl = contentEl?.firstElementChild;
  
  let tooltipInput = '';
  const tooltipBehavior = X_BEHAVIORS_LIST.find(b => b.attr === 'x-tooltip');
  if (tooltipBehavior && targetEl?.hasAttribute('x-tooltip')) {
    const currentValue = targetEl.getAttribute('x-tooltip') || '';
    tooltipInput = `
      <div style="grid-column: 1 / -1; margin-top: 0.25rem;">
        <input type="text" 
          value="${currentValue.replace(/"/g, '&quot;')}" 
          placeholder="Tooltip text..."
          onchange="updateXBehaviorValue('${comp?.id}', 'x-tooltip', this.value)"
          style="width: 100%; font-size: 0.8rem; padding: 0.4rem 0.5rem; background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 4px; color: var(--text-primary);">
      </div>
    `;
  }
  
  const behaviorsHtml = X_BEHAVIORS_LIST.map(b => {
    const isEnabled = targetEl?.hasAttribute(b.attr);
    return `
      <label class="xb-chip ${isEnabled ? 'xb-chip--active' : ''}" title="${b.desc}" style="
        display: inline-flex; align-items: center; gap: 0.25rem; padding: 0.3rem 0.5rem;
        background: ${isEnabled ? 'var(--primary)' : 'var(--bg-tertiary)'};
        color: ${isEnabled ? 'white' : 'var(--text-primary)'};
        border-radius: 4px; cursor: pointer; font-size: 0.75rem; transition: all 0.15s;
        border: 1px solid ${isEnabled ? 'var(--primary)' : 'transparent'}; white-space: nowrap;">
        <input type="checkbox" ${isEnabled ? 'checked' : ''}
          onchange="toggleXBehavior('${comp?.id}', '${b.attr}', this.checked)" style="display: none;">
        <span>${b.icon}</span>
        <span style="font-weight: 500;">${b.name}</span>
      </label>
    `;
  }).join('');
  
  return `
    <div class="properties-section">
      <h4 style="margin-bottom: 0.5rem;">⚡ x-Behaviors</h4>
      <div style="display: flex; flex-wrap: wrap; gap: 0.35rem;">${behaviorsHtml}</div>
      ${tooltipInput}
    </div>
  `;
}

function toggleXBehavior(componentId, behaviorAttr, enabled) {
  // ═══ PRECONDITIONS ═══
  const ctx = { fn: 'toggleXBehavior', componentId, behaviorAttr, enabled };
  
  // Defensive validation
  if (!componentId || !behaviorAttr || typeof enabled !== 'boolean') {
    console.error('toggleXBehavior: invalid parameters', ctx);
    return;
  }
  
  const comp = getComponent(componentId, 'toggleXBehavior');
  if (!comp) return;
  
  const contentEl = comp.element?.querySelector('.component-content');
  const targetEl = contentEl?.firstElementChild;
  if (!targetEl) {
    console.warn('toggleXBehavior: Target element not found', ctx);
    return;
  }
  
  // ═══ EXECUTE ═══
  if (enabled) {
    targetEl.setAttribute(behaviorAttr, '');
    if (window.WB?.scan) {
      try { window.WB.scan(targetEl); } catch (e) { 
        console.warn(`WB.scan failed for ${behaviorAttr}`, e.message); 
      }
    }
  } else {
    const behaviorName = behaviorAttr.replace('x-', '');
    const cleanupProp = `_wb${behaviorName.charAt(0).toUpperCase() + behaviorName.slice(1)}`;
    if (targetEl[cleanupProp]?.cleanup) {
      try { targetEl[cleanupProp].cleanup(); } catch (e) { /* ignore */ }
    }
    targetEl.removeAttribute(behaviorAttr);
  }
  
  comp.html = contentEl.innerHTML;
  
  // ═══ POSTCONDITIONS ═══
  const hasAttr = targetEl.hasAttribute(behaviorAttr);
  if (hasAttr !== enabled) {
    console.error(`toggleXBehavior: Behavior ${behaviorAttr} should be ${enabled ? 'enabled' : 'disabled'}`, ctx);
  }
  
  if (comp.template && typeof showProperties === 'function') {
    showProperties(comp.template);
  }
  if (typeof updateStatus === 'function') {
    updateStatus(`${behaviorAttr} ${enabled ? 'enabled' : 'disabled'}`);
  }
}

function updateXBehaviorValue(componentId, behaviorAttr, value) {
  // ═══ PRECONDITIONS ═══
  const ctx = { fn: 'updateXBehaviorValue', componentId, behaviorAttr, value };
  
  if (!componentId || !behaviorAttr) {
    console.error('updateXBehaviorValue: componentId and behaviorAttr required', ctx);
    return;
  }
  
  const comp = getComponent(componentId, 'updateXBehaviorValue');
  if (!comp) return;
  
  const contentEl = comp.element?.querySelector('.component-content');
  const targetEl = contentEl?.firstElementChild;
  if (!targetEl) return;
  
  // ═══ EXECUTE ═══
  const behaviorName = behaviorAttr.replace('x-', '');
  const cleanupProp = `_wb${behaviorName.charAt(0).toUpperCase() + behaviorName.slice(1)}`;
  if (targetEl[cleanupProp]?.cleanup) {
    try { targetEl[cleanupProp].cleanup(); delete targetEl[cleanupProp]; } catch (e) { /* ignore */ }
  }
  
  targetEl.setAttribute(behaviorAttr, value);
  comp.html = contentEl.innerHTML;
  
  if (window.WB?.scan) {
    try { window.WB.scan(targetEl); } catch (e) { 
      console.warn('WB.scan failed', e.message); 
    }
  }
  
  // ═══ POSTCONDITIONS ═══
  if (targetEl.getAttribute(behaviorAttr) !== value) {
    console.error(`updateXBehaviorValue: value not set: expected "${value}"`, ctx);
  }
  
  if (typeof updateStatus === 'function') {
    updateStatus(`Updated ${behaviorAttr}`);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SPACING FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

function getSpacingControlsHtml(comp) {
  const spacing = comp?.data?.spacing || {};
  return `
    <div class="properties-section">
      <h4>📐 Spacing</h4>
      <div class="property">
        <label>Margin Top</label>
        <input type="range" min="0" max="100" value="${spacing.marginTop || 0}" 
          oninput="this.nextElementSibling.textContent = this.value + 'px'; updateSpacing('${comp?.id}', 'marginTop', this.value)">
        <span>${spacing.marginTop || 0}px</span>
      </div>
      <div class="property">
        <label>Margin Bottom</label>
        <input type="range" min="0" max="100" value="${spacing.marginBottom || 0}" 
          oninput="this.nextElementSibling.textContent = this.value + 'px'; updateSpacing('${comp?.id}', 'marginBottom', this.value)">
        <span>${spacing.marginBottom || 0}px</span>
      </div>
      <div class="property">
        <label>Padding</label>
        <input type="range" min="0" max="100" value="${spacing.padding || 0}" 
          oninput="this.nextElementSibling.textContent = this.value + 'px'; updateSpacing('${comp?.id}', 'padding', this.value)">
        <span>${spacing.padding || 0}px</span>
      </div>
      <div class="property">
        <label>Gap (for flex/grid)</label>
        <input type="range" min="0" max="50" value="${spacing.gap || 0}" 
          oninput="this.nextElementSibling.textContent = this.value + 'px'; updateSpacing('${comp?.id}', 'gap', this.value)">
        <span>${spacing.gap || 0}px</span>
      </div>
    </div>
  `;
}

function updateSpacing(componentId, property, value) {
  // ═══ PRECONDITIONS ═══
  const ctx = { fn: 'updateSpacing', componentId, property, value };
  
  if (!componentId || !property) {
    console.error('updateSpacing: componentId and property required', ctx);
    return;
  }
  
  const comp = getComponent(componentId, 'updateSpacing');
  if (!comp) return;
  
  // ═══ EXECUTE ═══
  comp.data = comp.data || {};
  comp.data.spacing = comp.data.spacing || {};
  comp.data.spacing[property] = parseInt(value);
  
  const content = comp.element?.querySelector('.component-content');
  if (content) {
    const firstChild = content.firstElementChild;
    if (firstChild) {
      const styleMap = {
        marginTop: 'marginTop',
        marginBottom: 'marginBottom', 
        padding: 'padding',
        gap: 'gap'
      };
      if (styleMap[property]) {
        firstChild.style[styleMap[property]] = value + 'px';
      }
    }
  }
  
  if (typeof updateStatus === 'function') {
    updateStatus(`Updated spacing ${property}: ${value}px`);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// INLINE STYLES TOGGLE
// ═══════════════════════════════════════════════════════════════════════════

function getInlineStyleToggleHtml(comp) {
  const useInlineStyles = comp?.data?.useInlineStyles !== false;
  return `
    <div class="properties-section">
      <h4>🎨 Style Output</h4>
      <div class="property">
        <label style="display: flex; align-items: center; gap: 0.75rem; cursor: pointer;">
          <input type="checkbox" ${useInlineStyles ? 'checked' : ''}
            onchange="toggleInlineStyles('${comp?.id}', this.checked)"
            style="width: 18px; height: 18px; accent-color: var(--primary);">
          <span style="flex: 1;">Include inline styles</span>
        </label>
        <p style="font-size: 0.75rem; color: var(--text-secondary); margin: 0.5rem 0 0 0;">
          ${useInlineStyles ? '✅ Styles will be embedded in the HTML' : '⚠️ Styles will use CSS classes only'}
        </p>
      </div>
    </div>
  `;
}

function toggleInlineStyles(componentId, enabled) {
  // ═══ PRECONDITIONS ═══
  const ctx = { fn: 'toggleInlineStyles', componentId, enabled };
  
  if (!componentId) {
    console.error('toggleInlineStyles: componentId required', ctx);
    return;
  }
  
  const comp = getComponent(componentId, 'toggleInlineStyles');
  if (!comp) return;
  
  // ═══ EXECUTE ═══
  comp.data = comp.data || {};
  comp.data.useInlineStyles = enabled;
  
  if (!enabled) {
    const content = comp.element?.querySelector('.component-content');
    if (content) {
      content.querySelectorAll('*').forEach(el => {
        if (el.hasAttribute('style')) el.removeAttribute('style');
      });
      comp.html = content.innerHTML;
    }
  }
  
  if (comp.template && typeof showProperties === 'function') {
    showProperties(comp.template);
  }
  if (typeof updateStatus === 'function') {
    updateStatus(`Inline styles ${enabled ? 'enabled' : 'disabled'}`);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SHOW PROPERTIES (Main Entry Point)
// ═══════════════════════════════════════════════════════════════════════════

function showProperties(template) {
  const ctx = { fn: 'showProperties', templateName: template?.name };
  
  const panel = document.getElementById('propertiesPanel');
  if (!panel) {
    warn(false, 'propertiesPanel not found', ctx);
    return;
  }
  
  const type = selectedComponent?.type;
  const comp = getSelectedComponent('showProperties');
  
  // Handle semantic elements
  if (type?.startsWith('semantic-') && comp) {
    showSemanticProperties(comp);
    return;
  }
  
  // Handle specific component types
  if (type === 'features' && comp?.data?.cards) {
    showFeatureGridProperties(comp, comp.data.selectedCard || 0);
    setupFeatureGridClickHandlers(comp.id);
    return;
  }
  
  if (type === 'pricing' && comp?.data?.cards) {
    showPricingGridProperties(comp, comp.data.selectedCard || 0);
    setupPricingGridClickHandlers(comp.id);
    return;
  }
  
  if (type === 'card' && comp?.data) {
    showCardProperties(comp);
    return;
  }
  
  if (type === 'cta' && comp?.data) {
    showCTAProperties(comp);
    return;
  }
  
  // Property panels for known types
  const propertyPanels = {
    navbar: generateNavbarPanel(template, comp),
    'header-logo': generateHeaderLogoPanel(template, comp),
    hero: generateHeroPanel(template, comp),
    footer: generateFooterPanel(template, comp)
  };
  
  const defaultPanel = `
    <div class="properties-section">
      <h4>${template?.icon || '📦'} ${template?.name || 'Component'}</h4>
      <p style="color: var(--text-secondary); font-size: 0.85rem;">
        Edit this component directly on the canvas.
      </p>
      <div class="property">
        <label>HTML</label>
        <wb-html-editor target-id="${comp?.id}" class="wb-html-editor--inline"></wb-html-editor>
        <p style="color: var(--text-secondary); font-size: 0.75rem; margin-top:0.5rem;">
          💡 Edit the element's HTML or its attributes. Use <kbd>Ctrl/Cmd</kbd>+<kbd>S</kbd> to save.
        </p>
      </div>
    </div>
  `;

  panel.innerHTML = `
    ${propertyPanels[type] || defaultPanel}
    ${getXBehaviorsPickerHtml(comp)}
    ${getThemeSelectorHtml(comp)}
    ${getInlineStyleToggleHtml(comp)}
    ${getSpacingControlsHtml(comp)}
    <button class="btn btn-danger" style="width: 100%; margin-top: 1rem;" 
      onclick="deleteComponent('${selectedComponent?.id}')">🗑️ Delete</button>
  `;

  // Ensure theme select changes are handled even when widgets/enhancements replace or wrap the select
  try {
    // Find the theme section header safely (avoid non-standard :contains selector)
    const themeHeader = Array.from(panel.querySelectorAll('h4')).find(h => h.textContent && h.textContent.includes('Element Theme'));
    const select = themeHeader?.parentElement?.querySelector('select') || null;

    if (select) {
      // Add a safe change handler to persist theme reliably
      select.addEventListener('change', () => {
        const compId = selectedComponent?.id || (function(){
          const attr = select.getAttribute('onchange') || '';
          const m = attr.match(/updateElementTheme\('([^']+)'/); return m ? m[1] : null;
        })();
        if (compId) setTimeout(() => updateElementTheme(compId, select.value), 0);
      });

      // MutationObserver fallback to catch non-dispatching changes (some widgets mutate attributes)
      const mo = new MutationObserver(() => {
        const compId = selectedComponent?.id || (function(){
          const attr = select.getAttribute('onchange') || '';
          const m = attr.match(/updateElementTheme\('([^']+)'/); return m ? m[1] : null;
        })();
        if (compId) updateElementTheme(compId, select.value);
      });
      mo.observe(select, { attributes: true, attributeFilter: ['value'] });
    }
  } catch (err) {
    // Defensive: do not fail the whole panel render for observer failures
    console.error('Error attaching theme select handler:', err);
  }

  if (selectedComponent?.element) {
    selectedComponent.element.focus();
  }
}

// Robust event delegation for properties panel
// Ensures theme <select> changes are always handled (covers enhanced widgets)
(function initPropertyPanelListeners() {
  function onChange(e) {
    const el = e.target;
    if (!el || !el.matches) return;
    if (el.matches('select')) {
      const section = el.closest('.properties-section');
      const heading = section?.querySelector('h4')?.textContent || '';
      if (heading.includes('Element Theme')) {
        const compId = window.selectedComponent?.id;
        if (compId) {
          try {
            // Delay slightly to ensure any enhanced widgets have finished internal updates
            setTimeout(() => {
              try { updateElementTheme(compId, el.value); } catch (err) { console.error('Error in delayed theme handler:', err); }
            }, 50);
          } catch (err) {
            console.error('Error in delegated theme handler:', err);
          }
        }
      }
    }
  }

  document.addEventListener('builder:views-loaded', () => {
    const panel = document.getElementById('propertiesPanel');
    if (panel) {
      panel.addEventListener('change', onChange);
      panel.addEventListener('input', onChange);

      // Observe the panel for dynamic widget replacements and attribute-only updates.
      // If a theme select is replaced or its value changes without firing events, persist the value.
      if (!panel.__themeObserverAttached) {
        const mo = new MutationObserver(mutations => {
          for (const m of mutations) {
            // If nodes were added, check for a theme select
            if (m.addedNodes && m.addedNodes.length) {
              const sel = panel.querySelector('h4') && Array.from(panel.querySelectorAll('h4')).find(h => h.textContent && h.textContent.includes('Element Theme'))?.parentElement.querySelector('select');
              if (sel && window.selectedComponent?.id) {
                try { updateElementTheme(window.selectedComponent.id, sel.value); } catch (err) { console.error('mo: failed updateElementTheme', err); }
              }
            }

            // If attributes changed on a select (some widgets update attributes only)
            if (m.type === 'attributes' && m.target && m.target.matches && m.target.matches('select')) {
              const sel = m.target;
              if (sel && window.selectedComponent?.id) {
                try { updateElementTheme(window.selectedComponent.id, sel.value); } catch (err) { console.error('mo attr: failed updateElementTheme', err); }
              }
            }
          }
        });

        mo.observe(panel, { childList: true, subtree: true, attributes: true, attributeFilter: ['value'] });
        panel.__themeObserverAttached = true;
      }

      // Canvas-level observer: persist theme changes that happen on the canvas DOM
      const canvas = document.querySelector('.canvas-area') || document.getElementById('canvas-content');
      if (canvas && !canvas.__themeObserverAttached) {
        const canvasMo = new MutationObserver(mutations => {
          for (const m of mutations) {
            if (m.type === 'attributes' && m.target && m.target.getAttribute) {
              const el = m.target;
              if (el.hasAttribute && el.hasAttribute('data-theme')) {
                const theme = el.getAttribute('data-theme') || '';
                const wrapper = el.closest && el.closest('.canvas-component');
                if (wrapper) {
                  // Find matching component by comparing element references
                  const comp = (window.BuilderState && Array.isArray(window.BuilderState.components))
                    ? window.BuilderState.components.find(c => c.element === wrapper)
                    : (window.components || []).find(c => c.element === wrapper);
                  if (comp) {
                    try {
                      console.log('[canvasMo] persisting theme from DOM ->', comp.id, theme);
                      if (window.BuilderState && window.BuilderState.updateComponentData) {
                        window.BuilderState.updateComponentData(comp.id, 'elementTheme', theme);
                      } else {
                        comp.data = comp.data || {};
                        comp.data.elementTheme = theme;
                      }

                      // Also persist the component's HTML snapshot so exports/tests reflect the DOM
                      const currentHtml = wrapper.querySelector('.component-content')?.innerHTML || '';
                      comp.html = currentHtml;
                      // keep DOM and comp.element consistent
                      if (comp.element && comp.element.querySelector('.component-content')) {
                        comp.element.querySelector('.component-content').innerHTML = currentHtml;
                      }
                      console.log('[canvasMo] persisted comp.html length=', (comp.html || '').length);
                    } catch (err) {
                      console.error('canvasMo: failed to persist theme', err);
                    }
                  }
                }
              }
            }
          }
        });
        canvasMo.observe(canvas, { subtree: true, attributes: true, attributeFilter: ['data-theme'] });
        canvas.__themeObserverAttached = true;
      }
    } else {
      // Fallback: attach to document
      document.addEventListener('change', onChange);
      document.addEventListener('input', onChange);
    }
  });
})();

// ═══════════════════════════════════════════════════════════════════════════
// PANEL GENERATORS
// ═══════════════════════════════════════════════════════════════════════════

function generateNavbarPanel(template, comp) {
  return `
    <div class="properties-section">
      <h4>${template?.icon} ${template?.name}</h4>
      <div class="property">
        <label>Logo Text</label>
        <textarea onchange="updateNavbar('logo', this.value)">${comp?.data?.logo || 'Logo'}</textarea>
      </div>
      <p style="color: var(--text-secondary); font-size: 0.8rem; margin-top: 0.5rem;">
        💡 Links are auto-generated from pages.
      </p>
    </div>
  `;
}

function generateHeaderLogoPanel(template, comp) {
  return `
    <div class="properties-section">
      <h4>${template?.icon} ${template?.name}</h4>
      <div class="property">
        <label>Brand Name</label>
        <textarea onchange="updateHeaderLogo('brandName', this.value)">${comp?.data?.brandName || 'Your Brand'}</textarea>
      </div>
      <div class="property">
        <label>Tagline</label>
        <textarea onchange="updateHeaderLogo('tagline', this.value)">${comp?.data?.tagline || 'Tagline goes here'}</textarea>
      </div>
      <div class="property">
        <label>Icon/Emoji</label>
        <textarea onchange="updateHeaderLogo('icon', this.value)">${comp?.data?.icon || '▯'}</textarea>
      </div>
    </div>
  `;
}

function generateHeroPanel(template, comp) {
  const angle = comp?.data?.gradientAngle || 135;
  const start = comp?.data?.gradientStart || '#667eea';
  const end = comp?.data?.gradientEnd || '#764ba2';
  
  return `
    <div class="properties-section">
      <h4>${template?.icon} ${template?.name}</h4>
      <div class="property">
        <label>Headline</label>
        <textarea onchange="updateHero('headline', this.value)">${comp?.data?.headline || 'Welcome to Your Site'}</textarea>
      </div>
      <div class="property">
        <label>Subheadline</label>
        <textarea onchange="updateHero('subheadline', this.value)">${comp?.data?.subheadline || 'Your value proposition goes here'}</textarea>
      </div>
      <details class="gradient-details" style="margin-top: 0.75rem; background: var(--bg-tertiary); border-radius: 6px; padding: 0.5rem;">
        <summary style="cursor: pointer; font-weight: 600; font-size: 0.85rem; color: var(--text-secondary); display: flex; align-items: center; gap: 0.5rem; user-select: none;">
          <span style="width: 16px; height: 16px; border-radius: 3px; background: linear-gradient(${angle}deg, ${start}, ${end});"></span>
          🎨 Gradient
        </summary>
        <div style="padding-top: 0.75rem; display: flex; flex-direction: column; gap: 0.75rem;">
          <div class="property" style="margin: 0;">
            <label style="font-size: 0.8rem; margin-bottom: 0.25rem;">Angle</label>
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <input type="range" min="0" max="360" value="${angle}" style="flex: 1;"
                oninput="this.nextElementSibling.textContent = this.value + '°'; updateHero('gradientAngle', this.value)">
              <span style="min-width: 36px; text-align: right; font-size: 0.8rem; font-family: monospace;">${angle}°</span>
            </div>
          </div>
          <div style="display: flex; gap: 0.75rem;">
            <div class="property" style="margin: 0; flex: 1;">
              <label style="font-size: 0.8rem; margin-bottom: 0.25rem;">Start</label>
              <div style="display: flex; align-items: center; gap: 0.4rem;">
                <input type="color" value="${start}" onchange="updateHero('gradientStart', this.value)" style="width: 32px; height: 24px; padding: 0; border: none; cursor: pointer;">
                <code style="font-size: 0.7rem; color: var(--text-muted);">${start}</code>
              </div>
            </div>
            <div class="property" style="margin: 0; flex: 1;">
              <label style="font-size: 0.8rem; margin-bottom: 0.25rem;">End</label>
              <div style="display: flex; align-items: center; gap: 0.4rem;">
                <input type="color" value="${end}" onchange="updateHero('gradientEnd', this.value)" style="width: 32px; height: 24px; padding: 0; border: none; cursor: pointer;">
                <code style="font-size: 0.7rem; color: var(--text-muted);">${end}</code>
              </div>
            </div>
          </div>
        </div>
      </details>
    </div>
  `;
}

function generateFooterPanel(template, comp) {
  return `
    <div class="properties-section">
      <h4>${template?.icon} ${template?.name}</h4>
      <div class="property">
        <label>Copyright Text</label>
        <textarea onchange="updateFooter('copyright', this.value)">${comp?.data?.copyright || '© 2025 Your Company. All rights reserved.'}</textarea>
      </div>
    </div>
  `;
}

// ═══════════════════════════════════════════════════════════════════════════
// UPDATE FUNCTIONS FOR SPECIFIC TYPES
// ═══════════════════════════════════════════════════════════════════════════

function updateNavbar(property, value) {
  const ctx = { fn: 'updateNavbar', property, value };
  const comp = getSelectedComponent('updateNavbar');
  if (!comp) return;
  
  comp.data = comp.data || { logo: 'Logo' };
  comp.data[property] = value;
  
  const links = (window.pages || []).slice(0, 4).map(p => 
    `<a href="${p.slug}" style="color: var(--text-secondary); text-decoration: none;">${p.name}</a>`
  ).join('');
  
  comp.html = `<div style="display: flex; gap: 2rem; padding: 1rem; background: var(--bg-tertiary); border-radius: 6px; align-items: center;">
    <span style="font-weight: 700;">${comp.data.logo}</span>
    ${links}
  </div>`;
  
  comp.element.querySelector('.component-content').innerHTML = comp.html;
  updateStatus(`Updated navbar ${property}`);
}

function updateHeaderLogo(property, value) {
  const comp = getSelectedComponent('updateHeaderLogo');
  if (!comp) return;
  
  comp.data = comp.data || { brandName: 'Your Brand', tagline: 'Tagline goes here', icon: '▯' };
  comp.data[property] = value;
  
  comp.html = `<div style="display: flex; align-items: center; gap: 1.5rem; padding: 1.5rem; background: var(--bg-tertiary); border-radius: 8px;">
    <div style="font-size: 2.5rem; width: 60px; height: 60px; background: var(--primary); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; font-weight: 700;">${comp.data.icon}</div>
    <div>
      <h1 style="margin: 0; font-size: 1.8rem; font-weight: 800;">${comp.data.brandName}</h1>
      <p style="margin: 0.25rem 0 0 0; color: var(--text-secondary); font-size: 0.95rem;">${comp.data.tagline}</p>
    </div>
  </div>`;
  
  comp.element.querySelector('.component-content').innerHTML = comp.html;
  updateStatus(`Updated header ${property}`);
}

function updateHero(property, value) {
  const comp = getSelectedComponent('updateHero');
  if (!comp) return;
  
  const defaults = { 
    headline: 'Welcome to Your Site', 
    subheadline: 'Your value proposition', 
    gradientAngle: 135,
    gradientStart: '#667eea', 
    gradientEnd: '#764ba2' 
  };
  comp.data = { ...defaults, ...(comp.data || {}) };
  comp.data[property] = value;
  
  const { headline, subheadline, gradientAngle, gradientStart, gradientEnd } = comp.data;
  
  comp.html = `<div style="background: linear-gradient(${gradientAngle}deg, ${gradientStart} 0%, ${gradientEnd} 100%); padding: 4rem 2rem; text-align: center; color: white; border-radius: 8px;">
    <h2 style="font-size: 2.5rem; margin: 0 0 1rem 0;">${headline}</h2>
    <p style="font-size: 1.1rem; margin: 0;">${subheadline}</p>
  </div>`;
  
  comp.element.querySelector('.component-content').innerHTML = comp.html;
  updateStatus(`Updated hero ${property}`);
}

function updateFooter(property, value) {
  const comp = getSelectedComponent('updateFooter');
  if (!comp) return;
  
  comp.data = comp.data || { copyright: '© 2025 Your Company. All rights reserved.' };
  comp.data[property] = value;
  
  comp.html = `<div style="padding: 2rem; text-align: center; border-top: 1px solid var(--border-color);">
    <p style="margin: 0; color: var(--text-secondary);">${comp.data.copyright}</p>
  </div>`;
  
  comp.element.querySelector('.component-content').innerHTML = comp.html;
  updateStatus(`Updated footer ${property}`);
}

// ═══════════════════════════════════════════════════════════════════════════
// SEMANTIC ELEMENTS
// ═══════════════════════════════════════════════════════════════════════════
// NOTE: showSemanticProperties is defined in builder-components.js
// DO NOT add a duplicate here - it will overwrite the full version that
// includes the tooltip input field and WB Behaviors panel

// ═══════════════════════════════════════════════════════════════════════════
// FEATURE GRID
// ═══════════════════════════════════════════════════════════════════════════

function showFeatureGridProperties(comp, cardIndex) {
  const card = comp.data.cards[cardIndex];
  const panel = document.getElementById('propertiesPanel');
  
  panel.innerHTML = `
    <div class="properties-section">
      <h4>✨ Features Grid</h4>
      <div style="display: flex; gap: 0.5rem; margin-bottom: 1rem;">
        ${comp.data.cards.map((c, i) => `
          <button onclick="selectFeatureCard('${comp.id}', ${i})"
            style="flex: 1; padding: 0.5rem; border: 2px solid ${i === cardIndex ? 'var(--primary)' : 'var(--border-color)'}; background: ${i === cardIndex ? 'var(--primary)' : 'var(--bg-tertiary)'}; color: ${i === cardIndex ? 'white' : 'var(--text-primary)'}; border-radius: 4px; cursor: pointer; font-size: 1.2rem;">
            ${c.icon}
          </button>
        `).join('')}
      </div>
      <p style="font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 1rem;">Editing Card ${cardIndex + 1}</p>
      <div class="property">
        <label>Icon/Emoji</label>
        <textarea onchange="updateFeatureGridCard('${comp.id}', ${cardIndex}, 'icon', this.value)">${card.icon}</textarea>
      </div>
      <div class="property">
        <label>Title</label>
        <textarea onchange="updateFeatureGridCard('${comp.id}', ${cardIndex}, 'title', this.value)">${card.title}</textarea>
      </div>
      <div class="property">
        <label>Description</label>
        <textarea onchange="updateFeatureGridCard('${comp.id}', ${cardIndex}, 'description', this.value)">${card.description}</textarea>
      </div>
    </div>
    ${getXBehaviorsPickerHtml(comp)}
    ${getThemeSelectorHtml(comp)}
    ${getInlineStyleToggleHtml(comp)}
    ${getSpacingControlsHtml(comp)}
    <button class="btn btn-danger" style="width: 100%; margin-top: 1rem;" onclick="deleteComponent('${comp.id}')">🗑️ Delete Features Grid</button>
  `;
}

function selectFeatureCard(componentId, cardIndex) {
  const comp = getComponent(componentId, 'selectFeatureCard');
  if (!comp) return;
  
  comp.data.selectedCard = cardIndex;
  
  const cardItems = comp.element.querySelectorAll('.feature-card-item');
  cardItems.forEach((card, i) => {
    card.style.borderColor = i === cardIndex ? 'var(--primary)' : 'transparent';
  });
  
  showFeatureGridProperties(comp, cardIndex);
}

function updateFeatureGridCard(componentId, cardIndex, property, value) {
  const comp = getComponent(componentId, 'updateFeatureGridCard');
  if (!comp?.data?.cards) return;
  
  comp.data.cards[cardIndex][property] = value;
  const newHtml = componentTemplates.features.getHtml(comp.data);
  comp.html = newHtml;
  comp.element.querySelector('.component-content').innerHTML = newHtml;
  
  setupFeatureGridClickHandlers(componentId);
  const cardItems = comp.element.querySelectorAll('.feature-card-item');
  if (cardItems[cardIndex]) cardItems[cardIndex].style.borderColor = 'var(--primary)';
  
  updateStatus(`Updated card ${cardIndex + 1} ${property}`);
}

function setupFeatureGridClickHandlers(componentId) {
  const comp = getComponent(componentId, 'setupFeatureGridClickHandlers');
  if (!comp) return;
  
  const cardItems = comp.element.querySelectorAll('.feature-card-item');
  cardItems.forEach((card, index) => {
    card.addEventListener('click', (e) => {
      e.stopPropagation();
      cardItems.forEach(c => c.style.borderColor = 'transparent');
      card.style.borderColor = 'var(--primary)';
      comp.data.selectedCard = index;
      showFeatureGridProperties(comp, index);
    });
  });
  if (cardItems[0]) cardItems[0].style.borderColor = 'var(--primary)';
}

// ═══════════════════════════════════════════════════════════════════════════
// PRICING GRID
// ═══════════════════════════════════════════════════════════════════════════

function showPricingGridProperties(comp, cardIndex) {
  const card = comp.data.cards[cardIndex];
  const panel = document.getElementById('propertiesPanel');
  
  panel.innerHTML = `
    <div class="properties-section">
      <h4>💰 Pricing Table</h4>
      <div style="display: flex; gap: 0.5rem; margin-bottom: 1rem;">
        ${comp.data.cards.map((c, i) => `
          <button onclick="selectPricingCard('${comp.id}', ${i})"
            style="flex: 1; padding: 0.5rem; border: 2px solid ${i === cardIndex ? 'var(--primary)' : 'var(--border-color)'}; background: ${i === cardIndex ? 'var(--primary)' : 'var(--bg-tertiary)'}; color: ${i === cardIndex ? 'white' : 'var(--text-primary)'}; border-radius: 4px; cursor: pointer; font-size: 0.75rem;">
            ${c.name}
          </button>
        `).join('')}
      </div>
      <p style="font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 1rem;">Editing: ${card.name} Plan</p>
      <div class="property">
        <label>Plan Name</label>
        <textarea onchange="updatePricingGridCard('${comp.id}', ${cardIndex}, 'name', this.value)">${card.name}</textarea>
      </div>
      <div class="property">
        <label>Price</label>
        <textarea onchange="updatePricingGridCard('${comp.id}', ${cardIndex}, 'price', this.value)">${card.price}</textarea>
      </div>
      <div class="property">
        <label>Period</label>
        <textarea onchange="updatePricingGridCard('${comp.id}', ${cardIndex}, 'period', this.value)">${card.period}</textarea>
      </div>
      <div class="property">
        <label>Features (one per line)</label>
        <textarea rows="4" onchange="updatePricingGridCard('${comp.id}', ${cardIndex}, 'features', this.value.split('\\n').filter(f => f.trim()))">${card.features.join('\n')}</textarea>
      </div>
      <div class="property">
        <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
          <input type="checkbox" ${card.highlighted ? 'checked' : ''} onchange="updatePricingGridCard('${comp.id}', ${cardIndex}, 'highlighted', this.checked)" style="width: auto;">
          Highlight this plan
        </label>
      </div>
    </div>
    ${getXBehaviorsPickerHtml(comp)}
    ${getThemeSelectorHtml(comp)}
    ${getInlineStyleToggleHtml(comp)}
    ${getSpacingControlsHtml(comp)}
    <button class="btn btn-danger" style="width: 100%; margin-top: 1rem;" onclick="deleteComponent('${comp.id}')">🗑️ Delete Pricing Table</button>
  `;
}

function selectPricingCard(componentId, cardIndex) {
  const comp = getComponent(componentId, 'selectPricingCard');
  if (!comp) return;
  
  comp.data.selectedCard = cardIndex;
  showPricingGridProperties(comp, cardIndex);
}

function updatePricingGridCard(componentId, cardIndex, property, value) {
  const comp = getComponent(componentId, 'updatePricingGridCard');
  if (!comp?.data?.cards) return;
  
  comp.data.cards[cardIndex][property] = value;
  const newHtml = componentTemplates.pricing.getHtml(comp.data);
  comp.html = newHtml;
  comp.element.querySelector('.component-content').innerHTML = newHtml;
  
  setupPricingGridClickHandlers(componentId);
  updateStatus(`Updated ${comp.data.cards[cardIndex].name} plan ${property}`);
}

function setupPricingGridClickHandlers(componentId) {
  const comp = getComponent(componentId, 'setupPricingGridClickHandlers');
  if (!comp) return;
  
  const cardItems = comp.element.querySelectorAll('.pricing-card-item');
  cardItems.forEach((card, index) => {
    card.addEventListener('click', (e) => {
      e.stopPropagation();
      comp.data.selectedCard = index;
      showPricingGridProperties(comp, index);
    });
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// CARD & CTA
// ═══════════════════════════════════════════════════════════════════════════

function showCardProperties(comp) {
  const panel = document.getElementById('propertiesPanel');
  const cardTypes = componentTemplates.card.cardTypes;
  const currentType = comp.data.cardType || 'basic';
  
  const typeOptions = Object.entries(cardTypes).map(([key, val]) => 
    `<option value="${key}" ${key === currentType ? 'selected' : ''}>${val.name}</option>`
  ).join('');
  
  let extraFields = '';
  if (currentType === 'basic' || currentType === 'feature') {
    extraFields = `
      <div class="property">
        <label>Icon/Emoji</label>
        <textarea onchange="updateCard('${comp.id}', 'icon', this.value)">${comp.data.icon || '🖼️'}</textarea>
      </div>
      <div class="property">
        <label>Title</label>
        <textarea onchange="updateCard('${comp.id}', 'title', this.value)">${comp.data.title || 'Card Title'}</textarea>
      </div>
      <div class="property">
        <label>Description</label>
        <textarea onchange="updateCard('${comp.id}', 'description', this.value)">${comp.data.description || ''}</textarea>
      </div>
    `;
  }
  
  panel.innerHTML = `
    <div class="properties-section">
      <h4>🃏 Card</h4>
      <div class="property">
        <label>Card Type</label>
        <select onchange="updateCardType('${comp.id}', this.value)">${typeOptions}</select>
      </div>
      ${extraFields}
    </div>
    ${getXBehaviorsPickerHtml(comp)}
    ${getThemeSelectorHtml(comp)}
    ${getInlineStyleToggleHtml(comp)}
    ${getSpacingControlsHtml(comp)}
    <button class="btn btn-danger" style="width: 100%; margin-top: 1rem;" onclick="deleteComponent('${comp.id}')">🗑️ Delete Card</button>
  `;
}

function updateCardType(componentId, newType) {
  const comp = getComponent(componentId, 'updateCardType');
  if (!comp) return;
  
  comp.data.cardType = newType;
  const newHtml = componentTemplates.card.getHtml(comp.data);
  comp.html = newHtml;
  comp.element.querySelector('.component-content').innerHTML = newHtml;
  
  showCardProperties(comp);
  updateStatus(`Changed card type to ${componentTemplates.card.cardTypes[newType].name}`);
}

function updateCard(componentId, property, value) {
  const comp = getComponent(componentId, 'updateCard');
  if (!comp) return;
  
  comp.data[property] = value;
  const newHtml = componentTemplates.card.getHtml(comp.data);
  comp.html = newHtml;
  comp.element.querySelector('.component-content').innerHTML = newHtml;
  
  updateStatus(`Updated card ${property}`);
}

function showCTAProperties(comp) {
  const panel = document.getElementById('propertiesPanel');
  const contactType = comp.data.contactType || 'phone';
  
  let contactFields = contactType === 'phone' ? `
    <div class="property">
      <label>Phone Number</label>
      <textarea onchange="updateCTAField('${comp.id}', 'phoneNumber', this.value)">${comp.data.phoneNumber || '(555) 123-4567'}</textarea>
    </div>
  ` : `
    <div class="property">
      <label>Email Address</label>
      <textarea onchange="updateCTAField('${comp.id}', 'email', this.value)">${comp.data.email || 'contact@example.com'}</textarea>
    </div>
    <div class="property">
      <label>Email Subject</label>
      <textarea onchange="updateCTAField('${comp.id}', 'emailSubject', this.value)">${comp.data.emailSubject || 'Contact Request'}</textarea>
    </div>
    <div class="property">
      <label>Button Text</label>
      <textarea onchange="updateCTAField('${comp.id}', 'buttonText', this.value)">${comp.data.buttonText || 'Send Us an Email'}</textarea>
    </div>
  `;
  
  const start = comp.data.gradientStart || '#667eea';
  const end = comp.data.gradientEnd || '#764ba2';
  
  panel.innerHTML = `
    <div class="properties-section">
      <h4>📞 Call to Action</h4>
      <div class="property">
        <label>Headline</label>
        <textarea onchange="updateCTAField('${comp.id}', 'title', this.value)">${comp.data.title || 'Ready to get started?'}</textarea>
      </div>
      <div class="property">
        <label>Description</label>
        <textarea onchange="updateCTAField('${comp.id}', 'description', this.value)">${comp.data.description || 'Contact us today!'}</textarea>
      </div>
      <div class="property">
        <label>Contact Type</label>
        <select onchange="updateCTAField('${comp.id}', 'contactType', this.value); showCTAProperties(BuilderState.findComponent('${comp.id}'))">
          <option value="phone" ${contactType === 'phone' ? 'selected' : ''}>📞 Phone Number</option>
          <option value="email" ${contactType === 'email' ? 'selected' : ''}>✉️ Email</option>
        </select>
      </div>
      ${contactFields}
      <details class="gradient-details" style="margin-top: 0.75rem; background: var(--bg-tertiary); border-radius: 6px; padding: 0.5rem;">
        <summary style="cursor: pointer; font-weight: 600; font-size: 0.85rem; color: var(--text-secondary); display: flex; align-items: center; gap: 0.5rem; user-select: none;">
          <span style="width: 16px; height: 16px; border-radius: 3px; background: linear-gradient(135deg, ${start}, ${end});"></span>
          🎨 Gradient
        </summary>
        <div style="padding-top: 0.75rem; display: flex; gap: 0.75rem;">
          <div class="property" style="margin: 0; flex: 1;">
            <label style="font-size: 0.8rem; margin-bottom: 0.25rem;">Start</label>
            <div style="display: flex; align-items: center; gap: 0.4rem;">
              <input type="color" value="${start}" onchange="updateCTAField('${comp.id}', 'gradientStart', this.value)" style="width: 32px; height: 24px; padding: 0; border: none; cursor: pointer;">
              <code style="font-size: 0.7rem; color: var(--text-muted);">${start}</code>
            </div>
          </div>
          <div class="property" style="margin: 0; flex: 1;">
            <label style="font-size: 0.8rem; margin-bottom: 0.25rem;">End</label>
            <div style="display: flex; align-items: center; gap: 0.4rem;">
              <input type="color" value="${end}" onchange="updateCTAField('${comp.id}', 'gradientEnd', this.value)" style="width: 32px; height: 24px; padding: 0; border: none; cursor: pointer;">
              <code style="font-size: 0.7rem; color: var(--text-muted);">${end}</code>
            </div>
          </div>
        </div>
      </details>
    </div>
    ${getXBehaviorsPickerHtml(comp)}
    ${getThemeSelectorHtml(comp)}
    ${getInlineStyleToggleHtml(comp)}
    ${getSpacingControlsHtml(comp)}
    <button class="btn btn-danger" style="width: 100%; margin-top: 1rem;" onclick="deleteComponent('${comp.id}')">🗑️ Delete CTA</button>
  `;
}

function updateCTAField(componentId, property, value) {
  const comp = getComponent(componentId, 'updateCTAField');
  if (!comp) return;
  
  comp.data[property] = value;
  const newHtml = componentTemplates.cta.getHtml(comp.data);
  comp.html = newHtml;
  comp.element.querySelector('.component-content').innerHTML = newHtml;
  
  updateStatus(`Updated CTA ${property}`);
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

if (typeof window !== 'undefined') {
  window.getSpacingControlsHtml = getSpacingControlsHtml;
  window.updateSpacing = updateSpacing;
  window.getInlineStyleToggleHtml = getInlineStyleToggleHtml;
  window.toggleInlineStyles = toggleInlineStyles;
  window.getThemeSelectorHtml = getThemeSelectorHtml;
  window.updateElementTheme = updateElementTheme;
  window.ELEMENT_THEMES = ELEMENT_THEMES;
  window.getXBehaviorsPickerHtml = getXBehaviorsPickerHtml;
  window.toggleXBehavior = toggleXBehavior;
  window.updateXBehaviorValue = updateXBehaviorValue;
  window.X_BEHAVIORS_LIST = X_BEHAVIORS_LIST;
  window.showProperties = showProperties;
  // NOTE: showSemanticProperties is exported from builder-components.js - do not duplicate here
  window.showFeatureGridProperties = showFeatureGridProperties;
  window.selectFeatureCard = selectFeatureCard;
  window.updateFeatureGridCard = updateFeatureGridCard;
  window.setupFeatureGridClickHandlers = setupFeatureGridClickHandlers;
  window.showPricingGridProperties = showPricingGridProperties;
  window.selectPricingCard = selectPricingCard;
  window.updatePricingGridCard = updatePricingGridCard;
  window.setupPricingGridClickHandlers = setupPricingGridClickHandlers;
  window.showCardProperties = showCardProperties;
  window.updateCardType = updateCardType;
  window.updateCard = updateCard;
  window.showCTAProperties = showCTAProperties;
  window.updateCTAField = updateCTAField;
  window.updateNavbar = updateNavbar;
  window.updateHeaderLogo = updateHeaderLogo;
  window.updateHero = updateHero;
  window.updateFooter = updateFooter;
}

console.log('[BuilderProperties] ✅ Loaded with Design by Contract');
