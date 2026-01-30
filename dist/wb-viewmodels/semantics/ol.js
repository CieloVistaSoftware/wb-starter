/**
 * OL - Enhanced <ol> element (Ordered List)
 * Adds numbering styles, custom start, variants
 * Helper Attribute: [x-behavior="ol"]
 */
export function ol(element, options = {}) {
    if (element.tagName !== 'OL') {
        console.warn('[ol] Element must be an <ol>');
        return () => { };
    }
    const config = {
        variant: options.variant || element.dataset.variant || 'default',
        numberType: options.numberType || element.dataset.numberType || 'decimal',
        gap: options.gap || element.dataset.gap || '0.5rem',
        indentSize: options.indentSize || element.dataset.indentSize || '1.5rem',
        start: options.start || element.dataset.start || element.start || 1,
        ...options
    };
    element.classList.add('wb-ol');
    // Apply variant
    element.classList.add(`wb-ol--${config.variant}`);
    // Base list styling
    element.style.listStyleType = config.numberType;
    element.style.paddingLeft = config.indentSize;
    // Set start value
    if (config.start !== 1) {
        element.start = config.start;
    }
    // Apply gap between items
    const items = element.querySelectorAll(':scope > li');
    items.forEach((li, index) => {
        li.classList.add('wb-ol__item');
        if (index < items.length - 1) {
            li.style.marginBottom = config.gap;
        }
    });
    // Variant-specific styling
    if (config.variant === 'stepped') {
        element.style.counterReset = `wb-step ${config.start - 1}`;
        element.style.listStyleType = 'none';
        element.style.paddingLeft = '0';
        items.forEach(li => {
            li.style.counterIncrement = 'wb-step';
            li.style.display = 'flex';
            li.style.alignItems = 'start';
            li.style.gap = '1rem';
            const stepNumber = document.createElement('span');
            stepNumber.className = 'wb-ol__step-number';
            stepNumber.style.cssText = `
        display: flex;
        align-items: center;
        justify-content: center;
        width: 2rem;
        height: 2rem;
        min-width: 2rem;
        border-radius: 50%;
        background: var(--primary, #6366f1);
        color: white;
        font-weight: 700;
        font-size: 0.875rem;
      `;
            stepNumber.textContent = `${parseInt(config.start) + index}`;
            li.insertBefore(stepNumber, li.firstChild);
        });
    }
    else if (config.variant === 'timeline') {
        element.style.listStyleType = 'none';
        element.style.paddingLeft = '2rem';
        element.style.borderLeft = '2px solid var(--border-color, #374151)';
        items.forEach(li => {
            li.style.position = 'relative';
            li.style.paddingLeft = '1.5rem';
            const marker = document.createElement('span');
            marker.className = 'wb-ol__timeline-marker';
            marker.style.cssText = `
        position: absolute;
        left: -0.5rem;
        top: 0.25rem;
        width: 0.75rem;
        height: 0.75rem;
        border-radius: 50%;
        background: var(--primary, #6366f1);
        border: 2px solid var(--bg-primary, #111827);
      `;
            li.insertBefore(marker, li.firstChild);
        });
    }
    element.dataset.wbReady = 'ol';
    return () => {
        element.classList.remove('wb-ol', `wb-ol--${config.variant}`);
        items.forEach(li => {
            li.classList.remove('wb-ol__item');
            li.querySelector('.wb-ol__step-number')?.remove();
            li.querySelector('.wb-ol__timeline-marker')?.remove();
        });
    };
}
export default { ol };
//# sourceMappingURL=ol.js.map