/**
 * Textarea - Enhanced <textarea> element
 * Adds autosize, character count, max length indicator
 * Helper Attribute: [x-behavior="textarea"]
 */
export function textarea(element, options = {}) {
    if (!element || typeof element.classList === 'undefined') {
        console.warn('[textarea] Invalid element provided');
        return () => { };
    }
    const config = {
        autosize: options.autosize ?? element.hasAttribute('data-autosize'),
        maxLength: parseInt(options.maxLength || element.dataset.maxLength || '0'),
        showCount: options.showCount ?? element.hasAttribute('data-show-count'),
        minRows: parseInt(options.minRows || element.dataset.minRows || '2'),
        maxRows: parseInt(options.maxRows || element.dataset.maxRows || '10'),
        size: options.size || element.dataset.size || 'md',
        ...options
    };
    element.classList.add('wb-textarea');
    // Basic styling
    Object.assign(element.style, {
        borderRadius: '6px',
        border: '1px solid var(--border-color, #374151)',
        background: 'var(--bg-secondary, #1f2937)',
        color: 'var(--text-primary, #f9fafb)',
        resize: config.autosize ? 'none' : 'vertical',
        minHeight: `${config.minRows * 1.5}rem`
    });
    // Apply size
    const paddings = {
        xs: '0.125rem 0.5rem',
        sm: '0.25rem 0.75rem',
        md: '0.5rem 0.75rem',
        lg: '0.75rem 1rem',
        xl: '1rem 1.25rem'
    };
    element.style.padding = paddings[config.size] || paddings.md;
    if (config.size !== 'md') {
        element.classList.add(`wb-textarea--${config.size}`);
    }
    if (config.autosize) {
        element.classList.add('wb-textarea--autosize');
        const resize = () => {
            element.style.height = 'auto';
            const lineHeight = parseFloat(getComputedStyle(element).lineHeight) || 24;
            const maxHeight = config.maxRows * lineHeight;
            const newHeight = Math.min(element.scrollHeight, maxHeight);
            element.style.height = newHeight + 'px';
            element.style.overflowY = element.scrollHeight > maxHeight ? 'auto' : 'hidden';
        };
        element.addEventListener('input', resize);
        resize();
    }
    let counter = null;
    if (config.showCount) {
        element.classList.add('wb-textarea--has-counter');
        // Create wrapper to hold counter
        const counterWrapper = document.createElement('div');
        counterWrapper.className = 'wb-textarea-wrapper';
        counterWrapper.style.cssText = 'position:relative;width:100%;';
        if (element.parentNode) {
            element.parentNode.insertBefore(counterWrapper, element);
        }
        counterWrapper.appendChild(element);
        counter = document.createElement('div');
        counter.className = 'wb-textarea__counter';
        Object.assign(counter.style, {
            fontSize: '0.75rem',
            color: 'var(--text-secondary, #9ca3af)',
            textAlign: 'right',
            marginTop: '0.25rem'
        });
        const update = () => {
            const len = (element.value || '').length;
            counter.textContent = config.maxLength ? `${len}/${config.maxLength}` : `${len}`;
            if (config.maxLength && len > config.maxLength) {
                counter.style.color = 'var(--danger-color, #ef4444)';
            }
            else {
                counter.style.color = 'var(--text-secondary, #9ca3af)';
            }
        };
        element.addEventListener('input', update);
        counterWrapper.appendChild(counter);
        update();
    }
    element.dataset.wbReady = 'textarea';
    return () => {
        element.classList.remove('wb-textarea');
        if (config.size !== 'md') {
            element.classList.remove(`wb-textarea--${config.size}`);
        }
        if (counter && counter.parentNode) {
            // Unwrap
            const cleanupWrapper = counter.parentNode;
            if (cleanupWrapper.parentNode) {
                cleanupWrapper.parentNode.insertBefore(element, cleanupWrapper);
                cleanupWrapper.remove();
            }
        }
    };
}
export default { textarea };
//# sourceMappingURL=textarea.js.map