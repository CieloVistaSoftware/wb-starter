/**
 * Builder Snap Grid Module
 * Snap-to-grid functionality for positioning
 * @module builder-snap
 */
let snapEnabled = false;
/**
 * Toggle snap grid on/off
 */
export function toggleSnapGrid(enabled, options = {}) {
    const { toast } = options;
    snapEnabled = enabled;
    const frame = document.getElementById('canvas');
    const checkbox = document.getElementById('snapGrid');
    if (frame) {
        frame.classList.toggle('snap-enabled', enabled);
    }
    if (checkbox) {
        checkbox.checked = enabled;
    }
    localStorage.setItem('wb-snap-grid', enabled);
    if (toast)
        toast(enabled ? 'Snap grid enabled' : 'Snap grid disabled');
}
/**
 * Check if snap grid is enabled
 */
export function isSnapEnabled() {
    return snapEnabled;
}
/**
 * Set snap enabled state (used internally)
 */
export function setSnapEnabled(value) {
    snapEnabled = value;
}
/**
 * Restore snap grid setting from localStorage
 */
export function restoreSnapGridSetting(options = {}) {
    if (localStorage.getItem('wb-snap-grid') === 'true') {
        setTimeout(() => toggleSnapGrid(true, options), 100);
    }
}
/**
 * Inject snap grid styles
 */
export function injectSnapGridStyles() {
    const existing = document.getElementById('snap-grid-styles');
    if (existing)
        return;
    const style = document.createElement('style');
    style.id = 'snap-grid-styles';
    style.textContent = `
    .snap-enabled {
      background-image: 
        linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px);
      background-size: 20px 20px;
    }
    
    .snap-guide-lines {
      position: absolute;
      width: 20px;
      height: 20px;
      border: 2px dashed var(--primary, #6366f1);
      pointer-events: none;
      z-index: 9999;
    }
  `;
    document.head.appendChild(style);
}
// Expose globally for backward compatibility
window.toggleSnapGrid = toggleSnapGrid;
//# sourceMappingURL=builder-snap.js.map