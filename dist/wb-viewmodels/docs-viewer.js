/**
 * Docs Viewer
 * -----------------------------------------------------------------------------
 * Documentation navigation handler
 *
 * Helper Attribute: [x-behavior="docsviewer"]
 * -----------------------------------------------------------------------------
 */
export function docsviewer(element) {
    // Handle doc links
    const links = element.querySelectorAll('.docs-link');
    const viewer = element.querySelector('#doc-viewer');
    links.forEach(btn => {
        btn.onclick = () => {
            const src = btn.dataset.src;
            // Update active state
            links.forEach(b => {
                b.classList.remove('btn-primary');
                b.classList.add('btn-secondary');
            });
            btn.classList.remove('btn-secondary');
            btn.classList.add('btn-primary');
            // Reload viewer
            if (viewer && viewer.wbMdhtml) {
                viewer.wbMdhtml.load(src);
            }
            else if (viewer) {
                // Fallback if behavior not ready
                viewer.dataset.src = src;
                if (window.WB) {
                    // Force re-init if needed
                    window.WB.remove(viewer);
                    window.WB.scan(viewer.parentElement);
                }
            }
        };
    });
    // Set initial active
    const firstBtn = element.querySelector('.docs-link[data-src="docs/behaviors-reference.md"]');
    if (firstBtn) {
        firstBtn.classList.remove('btn-secondary');
        firstBtn.classList.add('btn-primary');
    }
}
//# sourceMappingURL=docs-viewer.js.map