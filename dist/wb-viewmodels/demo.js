/**
 * Demo Component Behavior
 * -----------------------------------------------------------------------------
 * Handles code visibility toggling and auto-population of code block
 *
 * Custom Tag: <wb-code-card>
 * Helper Attribute: [x-behavior="demo"]
 * -----------------------------------------------------------------------------
 */
import { cardBase } from './card.js';
export function demo(element, options = {}) {
    // If element is <wb-code-card>, apply card behavior first
    element.classList.add('wb-demo');
    let cleanupCard = null;
    if (element.tagName === 'WB-CODE-CARD' || element.classList.contains('wb-code-card')) {
        // Ensure card structure if missing
        if (!element.querySelector('header')) {
            const header = document.createElement('header');
            header.className = 'demo-header';
            header.style.display = 'flex';
            header.style.justifyContent = 'space-between';
            header.style.alignItems = 'center';
            const title = document.createElement('h3');
            title.style.margin = '0';
            title.style.fontSize = '1.1rem';
            title.textContent = options.title || element.getAttribute('title') || 'Demo';
            header.appendChild(title);
            const controls = document.createElement('div');
            controls.style.display = 'flex';
            controls.style.gap = '0.5rem';
            controls.style.alignItems = 'center';
            if (options.tag || element.getAttribute('tag')) {
                const tag = document.createElement('span');
                tag.className = 'demo-tag';
                tag.textContent = options.tag || element.getAttribute('tag');
                controls.appendChild(tag);
            }
            const btn = document.createElement('button');
            btn.className = 'toggle-code';
            btn.textContent = 'View Code';
            btn.style.fontSize = '0.85rem';
            btn.style.cursor = 'pointer';
            btn.style.background = 'transparent';
            btn.style.border = '1px solid var(--border-color)';
            btn.style.padding = '0.25rem 0.5rem';
            btn.style.borderRadius = '4px';
            controls.appendChild(btn);
            header.appendChild(controls);
            element.insertBefore(header, element.firstChild);
        }
        // Ensure main content wrapper
        let content = element.querySelector('.demo-content');
        if (!content) {
            content = document.createElement('main');
            content.className = 'demo-content';
            // Move non-header/footer children into content
            Array.from(element.children).forEach(child => {
                if (child.tagName !== 'HEADER' && child.tagName !== 'FOOTER') {
                    content.appendChild(child);
                }
            });
            if (element.querySelector('header')) {
                element.insertBefore(content, element.querySelector('header').nextSibling);
            }
            else {
                element.appendChild(content);
            }
        }
        // Ensure footer with code
        let footer = element.querySelector('footer');
        if (!footer) {
            footer = document.createElement('footer');
            footer.style.padding = '0';
            footer.style.borderTop = 'none';
            footer.style.background = 'transparent';
            const pre = document.createElement('pre');
            pre.style.margin = '0';
            pre.style.display = 'none';
            pre.style.background = '#1e1e1e';
            pre.style.padding = '1rem';
            pre.style.overflowX = 'auto';
            const code = document.createElement('code');
            pre.appendChild(code);
            footer.appendChild(pre);
            element.appendChild(footer);
        }
        // Apply card base styles
        const card = cardBase(element, { ...options, behavior: 'card' });
        card.buildStructure({ showHeader: false, showMain: false, showFooter: false }); // We built it manually
        cleanupCard = card.cleanup;
        element.style.width = '100%';
        element.style.marginBottom = '2rem';
    }
    const config = {
        ...options
    };
    // Find elements
    const toggleBtn = element.querySelector('.toggle-code');
    // Support both .demo-content and standard card main
    const content = element.querySelector('.demo-content') || element.querySelector('main');
    // Find pre block (could be in footer or direct child)
    const preBlock = element.querySelector('pre');
    const codeBlock = preBlock ? preBlock.querySelector('code') : null;
    // Populate code if empty and content exists
    if (content && codeBlock && !codeBlock.textContent.trim()) {
        let html = content.innerHTML;
        // Clean up indentation
        html = html.replace(/^\n+/, "").replace(/\n+$/, "");
        const lines = html.split("\n");
        if (lines.length > 0) {
            // Find first non-empty line to determine indentation
            const firstLine = lines.find(l => l.trim().length > 0);
            if (firstLine) {
                const match = firstLine.match(/^\s*/);
                const indent = match ? match[0].length : 0;
                if (indent > 0) {
                    const re = new RegExp(`^\\s{${indent}}`);
                    html = lines.map(line => line.replace(re, "")).join("\n");
                }
            }
        }
        // Set text content (escapes HTML)
        codeBlock.textContent = html;
    }
    // Toggle logic
    const handleToggle = () => {
        if (preBlock) {
            preBlock.classList.toggle('visible');
            if (preBlock.style.display === 'none') {
                preBlock.style.display = 'block';
            }
            else if (preBlock.style.display === 'block') {
                preBlock.style.display = 'none';
            }
            if (toggleBtn) {
                const isVisible = preBlock.classList.contains('visible') || preBlock.style.display === 'block';
                toggleBtn.textContent = isVisible ? "Hide Code" : "View Code";
            }
        }
    };
    if (toggleBtn) {
        toggleBtn.addEventListener('click', handleToggle);
    }
    element.dataset.wbReady = 'demo';
    return () => {
        if (toggleBtn) {
            toggleBtn.removeEventListener('click', handleToggle);
        }
        if (cleanupCard)
            cleanupCard();
    };
}
//# sourceMappingURL=demo.js.map