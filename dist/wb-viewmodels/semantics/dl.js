/**
 * DL - Enhanced <dl> element (Description List)
 * Adds styling variants, term/definition formatting
 * Helper Attribute: [x-behavior="dl"]
 */
export function dl(element, options = {}) {
    if (element.tagName !== 'DL') {
        console.warn('[dl] Element must be a <dl>');
        return () => { };
    }
    const config = {
        variant: options.variant || element.dataset.variant || 'vertical',
        gap: options.gap || element.dataset.gap || '0.5rem',
        bordered: options.bordered ?? element.hasAttribute('data-bordered'),
        striped: options.striped ?? element.hasAttribute('data-striped'),
        ...options
    };
    element.classList.add('wb-dl');
    // Apply variant styling
    if (config.variant === 'horizontal') {
        element.style.display = 'grid';
        element.style.gridTemplateColumns = 'auto 1fr';
        element.style.gap = config.gap;
        element.style.alignItems = 'start';
    }
    else {
        element.style.display = 'flex';
        element.style.flexDirection = 'column';
        element.style.gap = config.gap;
    }
    // Style dt (term) elements
    const terms = element.querySelectorAll('dt');
    terms.forEach(dt => {
        dt.classList.add('wb-dl__term');
        dt.style.fontWeight = '600';
        dt.style.color = 'var(--text-primary, #f9fafb)';
        if (config.variant === 'horizontal') {
            dt.style.paddingRight = '1rem';
        }
    });
    // Style dd (definition) elements
    const definitions = element.querySelectorAll('dd');
    definitions.forEach((dd, index) => {
        dd.classList.add('wb-dl__definition');
        dd.style.margin = '0';
        dd.style.color = 'var(--text-secondary, #9ca3af)';
        // Striped background
        if (config.striped && config.variant === 'horizontal' && index % 2 === 0) {
            const term = terms[index];
            if (term) {
                term.style.backgroundColor = 'var(--bg-secondary, rgba(255,255,255,0.05))';
                dd.style.backgroundColor = 'var(--bg-secondary, rgba(255,255,255,0.05))';
                term.style.padding = '0.5rem';
                dd.style.padding = '0.5rem';
            }
        }
    });
    // Bordered variant
    if (config.bordered) {
        element.style.border = '1px solid var(--border-color, #374151)';
        element.style.borderRadius = 'var(--radius-md, 6px)';
        element.style.padding = '1rem';
    }
    element.dataset.wbReady = 'dl';
    return () => {
        element.classList.remove('wb-dl');
        terms.forEach(dt => dt.classList.remove('wb-dl__term'));
        definitions.forEach(dd => dd.classList.remove('wb-dl__definition'));
    };
}
export default { dl };
//# sourceMappingURL=dl.js.map