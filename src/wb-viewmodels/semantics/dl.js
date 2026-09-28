import { readFlag, readAttr } from '../../core/read-attr.js';
import { setRule, clearRules, onlyChanged } from '../../core/dynamic-style.js';
/**
 * DL - Enhanced <dl> element (Description List)
 * Adds styling variants, term/definition formatting
 * Helper Attribute: [x-behavior="dl"]
 */
export function dl(element, options = {}) {
  if (element.tagName !== 'DL') {
    console.warn('[dl] Element must be a <dl>');
    return () => {};
  }

  const config = {
    variant: options.variant || readAttr(element, 'variant') || 'vertical',
    gap: options.gap || readAttr(element, 'gap') || '0.5rem',
    bordered: options.bordered ?? readFlag(element, 'bordered'),
    striped: options.striped ?? readFlag(element, 'striped'),
    ...options
  };

  element.classList.add('x-dl');

  // Apply variant styling
  // #779: layout (vertical / horizontal), term and definition text, the
  // striped rows and the bordered box are .x-dl* rules in lists.css; only a
  // gap other than 0.5rem travels, as a generated rule.
  const horizontal = config.variant === 'horizontal';
  element.classList.toggle('x-dl--horizontal', horizontal);
  element.classList.toggle('x-dl--bordered', !!config.bordered);
  setRule(element, 'gap', onlyChanged({ gap: config.gap }, { gap: '0.5rem' }), { weight: 2 });

  const terms = element.querySelectorAll('dt');
  terms.forEach(dt => dt.classList.add('x-dl__term'));

  // Style dd (definition) elements
  const definitions = element.querySelectorAll('dd');
  definitions.forEach((dd, index) => {
    dd.classList.add('x-dl__definition');

    // Striped background on every other term/definition pair
    if (config.striped && horizontal && index % 2 === 0) {
      const term = terms[index];
      if (term) {
        term.classList.add('x-dl__term--striped');
        dd.classList.add('x-dl__definition--striped');
      }
    }
  });

  return () => {
    clearRules(element);
    element.classList.remove('x-dl', 'x-dl--horizontal', 'x-dl--bordered');
    terms.forEach(dt => dt.classList.remove('x-dl__term', 'x-dl__term--striped'));
    definitions.forEach(dd => dd.classList.remove('x-dl__definition', 'x-dl__definition--striped'));
  };
}

export default { dl };
