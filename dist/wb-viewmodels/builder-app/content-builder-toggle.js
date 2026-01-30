/**
 * Content Builder Toggle
 * Simple, trustworthy toggle for showing/hiding content builder panel
 */
// Main toggle function
function toggleContentBuilder() {
    const panel = document.getElementById('contentBuilderPanel');
    if (!panel) {
        console.error('❌ ERROR: #contentBuilderPanel not found in DOM');
        return false;
    }
    const isVisible = panel.style.display !== 'none';
    const newDisplay = isVisible ? 'none' : 'block';
    panel.style.display = newDisplay;
    if (!isVisible) {
        console.log('✓ Content builder SHOWN');
        return true;
    }
    else {
        console.log('✗ Content builder HIDDEN');
        return false;
    }
}
// Helper: show
function showContentBuilder() {
    const panel = document.getElementById('contentBuilderPanel');
    if (panel) {
        panel.style.display = 'block';
        console.log('✓ Content builder SHOWN');
    }
}
// Helper: hide
function hideContentBuilder() {
    const panel = document.getElementById('contentBuilderPanel');
    if (panel) {
        panel.style.display = 'none';
        console.log('✗ Content builder HIDDEN');
    }
}
// Expose globally IMMEDIATELY (not async)
if (typeof window !== 'undefined') {
    window.toggleContentBuilder = toggleContentBuilder;
    window.showContentBuilder = showContentBuilder;
    window.hideContentBuilder = hideContentBuilder;
    console.log('✓ Content Builder toggle functions loaded');
    console.log('  - window.toggleContentBuilder()');
    console.log('  - window.showContentBuilder()');
    console.log('  - window.hideContentBuilder()');
}
// Also export as ES module
export { toggleContentBuilder, showContentBuilder, hideContentBuilder };
export default { toggleContentBuilder, showContentBuilder, hideContentBuilder };
//# sourceMappingURL=content-builder-toggle.js.map