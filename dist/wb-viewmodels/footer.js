/**
 * Footer Behavior
 * -----------------------------------------------------------------------------
 * Generates a site/page footer with copyright, links, and optional elements.
 *
 * Custom Tag: <wb-footer>
 *
 * Usage:
 * <wb-footer  data-copyright="© 2025 Acme Inc"></footer>
 * <footer data-copyright="© 2025" data-links="Privacy,Terms,Contact"></footer>
 * -----------------------------------------------------------------------------
 */
// Auto-load CSS
const CSS_ID = 'wb-footer-css';
if (!document.getElementById(CSS_ID)) {
    const link = document.createElement('link');
    link.id = CSS_ID;
    link.rel = 'stylesheet';
    link.href = '/src/styles/behaviors/footer.css';
    document.head.appendChild(link);
}
export function footer(element) {
    // Add base class
    element.classList.add('wb-footer');
    // Get attributes
    const sticky = element.hasAttribute('data-sticky');
    // Apply sticky if requested
    if (sticky) {
        element.classList.add('wb-footer--sticky');
    }
    // API
    element.wbFooter = {
        setCopyright: (text) => {
            const copyrightEl = element.querySelector('.wb-footer__copyright');
            if (copyrightEl)
                copyrightEl.textContent = text;
        },
        setBrand: (text) => {
            const brandEl = element.querySelector('.wb-footer__brand');
            if (brandEl)
                brandEl.textContent = text;
        }
    };
}
//# sourceMappingURL=footer.js.map