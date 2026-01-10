/**
 * WB Builder Theme Panel
 * Light/Dark mode toggle and theme selection
 */

import { THEMES } from '../themecontrol.js';

// Storage keys
const STORAGE_KEY_MODE = 'wb-builder-mode';
const STORAGE_KEY_THEME = 'wb-builder-theme';

// Current state
let currentMode = 'dark';
let currentTheme = 'dark';

/**
 * Initialize theme panel
 */
export function initThemePanel() {
  // Load saved preferences
  currentMode = localStorage.getItem(STORAGE_KEY_MODE) || 'dark';
  currentTheme = localStorage.getItem(STORAGE_KEY_THEME) || 'dark';
  
  // Apply to canvas
  applyTheme(currentTheme, currentMode);
  
  // Inject styles
  injectThemePanelStyles();
  
  // Add theme button
  addThemeButton();
  
  console.log('[ThemePanel] Initialized:', { mode: currentMode, theme: currentTheme });
}

/**
 * Add floating theme button
 */
function addThemeButton() {
  // Remove existing button if present
  document.getElementById('themeToggleBtn')?.remove();
  
  // Create floating button (always visible in bottom-left)
  const floatBtn = document.createElement('button');
  floatBtn.id = 'themeToggleBtn';
  floatBtn.className = 'theme-toggle-float';
  floatBtn.innerHTML = '🎨';
  floatBtn.title = 'Theme Settings (Light/Dark Mode & Colors)';
  floatBtn.onclick = toggleThemePanel;
  document.body.appendChild(floatBtn);
}

/**
 * Toggle theme panel visibility
 */
export function toggleThemePanel() {
  let panel = document.getElementById('themePanel');
  
  if (panel) {
    panel.classList.toggle('visible');
    return;
  }
  
  // Create panel
  panel = document.createElement('div');
  panel.id = 'themePanel';
  panel.className = 'theme-panel';
  
  panel.innerHTML = `
    <div class="theme-panel-header">
      <h3>🎨 Theme Settings</h3>
      <button class="theme-panel-close" onclick="window.closeThemePanel()">✕</button>
    </div>
    
    <div class="theme-panel-content">
      <!-- Mode Toggle -->
      <div class="theme-section">
        <label class="theme-section-label">Mode</label>
        <div class="mode-toggle">
          <button class="mode-btn ${currentMode === 'light' ? 'active' : ''}" data-mode="light" onclick="window.setMode('light')">
            <span class="mode-icon">☀️</span>
            <span class="mode-label">Light</span>
          </button>
          <button class="mode-btn ${currentMode === 'dark' ? 'active' : ''}" data-mode="dark" onclick="window.setMode('dark')">
            <span class="mode-icon">🌙</span>
            <span class="mode-label">Dark</span>
          </button>
          <button class="mode-btn ${currentMode === 'auto' ? 'active' : ''}" data-mode="auto" onclick="window.setMode('auto')">
            <span class="mode-icon">💻</span>
            <span class="mode-label">Auto</span>
          </button>
        </div>
      </div>
      
      <!-- Theme Grid -->
      <div class="theme-section">
        <label class="theme-section-label">Color Theme (${THEMES.length} available)</label>
        <div class="theme-grid">
          ${THEMES.map(theme => `
            <button class="theme-card ${currentTheme === theme.id ? 'active' : ''}" 
                    data-theme="${theme.id}" 
                    onclick="window.setTheme('${theme.id}')"
                    title="${theme.description}">
              <span class="theme-preview theme-preview--${theme.id}"></span>
              <span class="theme-name">${theme.name}</span>
            </button>
          `).join('')}
        </div>
      </div>
      
      <!-- Export Theme Code -->
      <div class="theme-section">
        <label class="theme-section-label">Add to your page</label>
        <div class="theme-code">
          <code id="themeCode">&lt;html data-theme="${currentTheme}"${currentMode === 'dark' ? ' class="dark"' : ''}&gt;</code>
          <button class="theme-code-copy" onclick="window.copyThemeCode()" title="Copy to clipboard">📋</button>
        </div>
        <p class="theme-hint">Add this attribute to your &lt;html&gt; tag</p>
      </div>
    </div>
  `;
  
  document.body.appendChild(panel);
  
  // Animate in
  requestAnimationFrame(() => {
    panel.classList.add('visible');
  });
}

/**
 * Close theme panel
 */
window.closeThemePanel = () => {
  const panel = document.getElementById('themePanel');
  if (panel) {
    panel.classList.remove('visible');
    setTimeout(() => panel.remove(), 300);
  }
};

/**
 * Set light/dark mode
 */
window.setMode = (mode) => {
  currentMode = mode;
  localStorage.setItem(STORAGE_KEY_MODE, mode);
  
  // Update UI
  document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.mode === mode);
  });
  
  // Apply theme
  applyTheme(currentTheme, currentMode);
  
  // Update code preview
  updateCodePreview();
  
  if (window.toast) window.toast(`Mode: ${mode === 'auto' ? 'System' : mode.charAt(0).toUpperCase() + mode.slice(1)}`);
};

/**
 * Set theme
 */
window.setTheme = (themeId) => {
  currentTheme = themeId;
  localStorage.setItem(STORAGE_KEY_THEME, themeId);
  
  // Update UI
  document.querySelectorAll('.theme-card').forEach(card => {
    card.classList.toggle('active', card.dataset.theme === themeId);
  });
  
  // Apply theme
  applyTheme(currentTheme, currentMode);
  
  // Update code preview
  updateCodePreview();
  
  const theme = THEMES.find(t => t.id === themeId);
  if (window.toast) window.toast(`Theme: ${theme?.name || themeId}`);
};

/**
 * Apply theme to canvas and document
 */
function applyTheme(themeId, mode) {
  const canvas = document.getElementById('canvas');
  const html = document.documentElement;
  const preview = document.getElementById('previewFrame')?.contentDocument?.documentElement;
  
  // Determine actual mode
  let actualMode = mode;
  if (mode === 'auto') {
    actualMode = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  
  // Apply to html root (for builder UI)
  html.setAttribute('data-theme', themeId);
  html.classList.remove('dark', 'light');
  html.classList.add(actualMode);
  
  // Apply to canvas (for page content)
  if (canvas) {
    canvas.setAttribute('data-theme', themeId);
    canvas.classList.remove('dark', 'light');
    canvas.classList.add(actualMode);
  }
  
  // Apply to preview iframe if exists
  if (preview) {
    preview.setAttribute('data-theme', themeId);
    preview.classList.remove('dark', 'light');
    preview.classList.add(actualMode);
  }
  
  // Update page theme dropdown if exists
  const pageThemeSelect = document.getElementById('pageTheme');
  if (pageThemeSelect && pageThemeSelect.value !== themeId) {
    pageThemeSelect.value = themeId;
  }
  
  // Store in page data for export
  updatePageData(themeId, actualMode);
}

/**
 * Update page data with theme info
 */
function updatePageData(themeId, mode) {
  try {
    const savedPage = localStorage.getItem('wb-builder-page');
    if (savedPage) {
      const data = JSON.parse(savedPage);
      data.theme = themeId;
      data.mode = mode;
      localStorage.setItem('wb-builder-page', JSON.stringify(data));
    }
  } catch (e) {
    // Ignore
  }
}

/**
 * Update the code preview
 */
function updateCodePreview() {
  const codeEl = document.getElementById('themeCode');
  if (codeEl) {
    const modeClass = currentMode === 'dark' ? ' class="dark"' : (currentMode === 'light' ? '' : ' class="auto"');
    codeEl.textContent = `<html data-theme="${currentTheme}"${modeClass}>`;
  }
}

/**
 * Copy theme code to clipboard
 */
window.copyThemeCode = () => {
  const modeClass = currentMode === 'dark' ? ' class="dark"' : (currentMode === 'light' ? '' : '');
  const code = `<html data-theme="${currentTheme}"${modeClass}>`;
  
  navigator.clipboard.writeText(code).then(() => {
    if (window.toast) window.toast('Copied to clipboard!');
  });
};

/**
 * Get current theme settings
 */
export function getThemeSettings() {
  return {
    theme: currentTheme,
    mode: currentMode
  };
}

/**
 * Inject styles
 */
function injectThemePanelStyles() {
  if (document.getElementById('themePanelStyles')) return;
  
  const style = document.createElement('style');
  style.id = 'themePanelStyles';
  style.textContent = `
    /* Floating theme button */
    .theme-toggle-float {
      position: fixed;
      bottom: 180px;
      left: 16px;
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      border: 2px solid rgba(255,255,255,0.2);
      color: #fff;
      font-size: 22px;
      cursor: pointer;
      z-index: 9999;
      box-shadow: 0 4px 16px rgba(99, 102, 241, 0.5);
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .theme-toggle-float:hover {
      transform: scale(1.1) rotate(15deg);
      box-shadow: 0 6px 24px rgba(99, 102, 241, 0.6);
    }
    
    .theme-toggle-float:active {
      transform: scale(0.95);
    }
    
    /* Theme panel */
    .theme-panel {
      position: fixed;
      bottom: 80px;
      left: 80px;
      width: 380px;
      max-height: 80vh;
      background: var(--bg-primary, #1a1a2e);
      border: 1px solid var(--border-color, #333);
      border-radius: 16px;
      box-shadow: 0 16px 48px rgba(0, 0, 0, 0.5);
      z-index: 10001;
      opacity: 0;
      transform: translateY(20px) scale(0.95);
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      overflow: hidden;
      pointer-events: none;
    }
    
    .theme-panel.visible {
      opacity: 1;
      transform: translateY(0) scale(1);
      pointer-events: auto;
    }
    
    .theme-panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 20px;
      border-bottom: 1px solid var(--border-color, #333);
      background: rgba(99, 102, 241, 0.1);
    }
    
    .theme-panel-header h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      color: #fff;
    }
    
    .theme-panel-close {
      background: none;
      border: none;
      color: #888;
      font-size: 20px;
      cursor: pointer;
      padding: 4px 8px;
      line-height: 1;
      transition: all 0.15s;
      border-radius: 6px;
    }
    
    .theme-panel-close:hover {
      color: #fff;
      background: rgba(255,255,255,0.1);
    }
    
    .theme-panel-content {
      padding: 20px;
      max-height: calc(80vh - 60px);
      overflow-y: auto;
    }
    
    /* Sections */
    .theme-section {
      margin-bottom: 24px;
    }
    
    .theme-section:last-child {
      margin-bottom: 0;
    }
    
    .theme-section-label {
      display: block;
      font-size: 11px;
      font-weight: 700;
      color: #888;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      margin-bottom: 12px;
    }
    
    /* Mode toggle */
    .mode-toggle {
      display: flex;
      gap: 10px;
    }
    
    .mode-btn {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      padding: 14px 10px;
      background: var(--bg-secondary, #252542);
      border: 2px solid transparent;
      border-radius: 12px;
      color: #888;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    
    .mode-btn:hover {
      border-color: var(--border-color, #444);
      color: #fff;
      background: var(--bg-tertiary, #2a2a4a);
    }
    
    .mode-btn.active {
      border-color: var(--primary, #6366f1);
      background: rgba(99, 102, 241, 0.2);
      color: #fff;
      box-shadow: 0 0 20px rgba(99, 102, 241, 0.3);
    }
    
    .mode-icon {
      font-size: 24px;
    }
    
    .mode-label {
      font-size: 12px;
      font-weight: 600;
    }
    
    /* Theme grid */
    .theme-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
      max-height: 280px;
      overflow-y: auto;
      padding-right: 6px;
    }
    
    .theme-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      padding: 10px 6px;
      background: var(--bg-secondary, #252542);
      border: 2px solid transparent;
      border-radius: 10px;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    
    .theme-card:hover {
      border-color: var(--border-color, #555);
      transform: translateY(-2px);
    }
    
    .theme-card.active {
      border-color: var(--primary, #6366f1);
      background: rgba(99, 102, 241, 0.2);
      box-shadow: 0 0 16px rgba(99, 102, 241, 0.3);
    }
    
    .theme-preview {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      border: 2px solid rgba(255,255,255,0.15);
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    }
    
    .theme-name {
      font-size: 10px;
      font-weight: 500;
      color: #999;
      text-align: center;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      width: 100%;
    }
    
    .theme-card.active .theme-name {
      color: #fff;
    }
    
    /* Theme preview colors */
    .theme-preview--dark { background: linear-gradient(135deg, #1a1a2e, #252542); }
    .theme-preview--light { background: linear-gradient(135deg, #f8fafc, #e2e8f0); }
    .theme-preview--cyberpunk { background: linear-gradient(135deg, #ff00ff, #00ffff); }
    .theme-preview--ocean { background: linear-gradient(135deg, #0077b6, #00b4d8); }
    .theme-preview--sunset { background: linear-gradient(135deg, #f97316, #fbbf24); }
    .theme-preview--forest { background: linear-gradient(135deg, #15803d, #22c55e); }
    .theme-preview--midnight { background: linear-gradient(135deg, #1e3a5f, #2d5a87); }
    .theme-preview--twilight { background: linear-gradient(135deg, #7c3aed, #f59e0b); }
    .theme-preview--sakura { background: linear-gradient(135deg, #ec4899, #f9a8d4); }
    .theme-preview--arctic { background: linear-gradient(135deg, #0ea5e9, #a5f3fc); }
    .theme-preview--desert { background: linear-gradient(135deg, #d97706, #fcd34d); }
    .theme-preview--neon-dreams { background: linear-gradient(135deg, #8b5cf6, #c084fc); }
    .theme-preview--retro-wave { background: linear-gradient(135deg, #db2777, #9333ea); }
    .theme-preview--lavender { background: linear-gradient(135deg, #a78bfa, #ddd6fe); }
    .theme-preview--emerald { background: linear-gradient(135deg, #047857, #34d399); }
    .theme-preview--ruby { background: linear-gradient(135deg, #b91c1c, #f87171); }
    .theme-preview--golden { background: linear-gradient(135deg, #b45309, #fcd34d); }
    .theme-preview--slate { background: linear-gradient(135deg, #475569, #94a3b8); }
    .theme-preview--coffee { background: linear-gradient(135deg, #78350f, #a16207); }
    .theme-preview--mint { background: linear-gradient(135deg, #10b981, #6ee7b7); }
    .theme-preview--noir { background: linear-gradient(135deg, #000000, #ffffff); }
    .theme-preview--aurora { background: linear-gradient(135deg, #06b6d4, #8b5cf6, #ec4899); }
    .theme-preview--grape { background: linear-gradient(135deg, #6b21a8, #a855f7); }
    
    /* Code preview */
    .theme-code {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 14px;
      background: #0d1117;
      border-radius: 10px;
      border: 1px solid var(--border-color, #333);
    }
    
    .theme-code code {
      flex: 1;
      font-family: 'JetBrains Mono', 'Monaco', 'Menlo', monospace;
      font-size: 12px;
      color: #7ee787;
      overflow-x: auto;
      white-space: nowrap;
    }
    
    .theme-code-copy {
      background: rgba(255,255,255,0.1);
      border: none;
      padding: 6px 8px;
      border-radius: 6px;
      cursor: pointer;
      opacity: 0.7;
      transition: all 0.15s;
      font-size: 14px;
    }
    
    .theme-code-copy:hover {
      opacity: 1;
      background: rgba(255,255,255,0.2);
    }
    
    .theme-hint {
      margin: 10px 0 0;
      font-size: 11px;
      color: #666;
    }
    
    /* Scrollbar */
    .theme-grid::-webkit-scrollbar,
    .theme-panel-content::-webkit-scrollbar {
      width: 6px;
    }
    
    .theme-grid::-webkit-scrollbar-track,
    .theme-panel-content::-webkit-scrollbar-track {
      background: transparent;
    }
    
    .theme-grid::-webkit-scrollbar-thumb,
    .theme-panel-content::-webkit-scrollbar-thumb {
      background: #444;
      border-radius: 3px;
    }
    
    .theme-grid::-webkit-scrollbar-thumb:hover,
    .theme-panel-content::-webkit-scrollbar-thumb:hover {
      background: #555;
    }
  `;
  
  document.head.appendChild(style);
}

// Listen for system theme changes
if (window.matchMedia) {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (currentMode === 'auto') {
      applyTheme(currentTheme, currentMode);
    }
  });
}

// Expose globally
window.toggleThemePanel = toggleThemePanel;
window.initThemePanel = initThemePanel;

export default {
  init: initThemePanel,
  toggle: toggleThemePanel,
  getSettings: getThemeSettings
};
