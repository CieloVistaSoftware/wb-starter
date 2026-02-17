// Standalone masked behavior extracted from enhancements.js
export function masked(element, options = {}) {
  const config = {
    mask: options.mask || element.getAttribute('mask') || '',
    placeholder: options.placeholder || element.getAttribute('mask-placeholder') || '_',
    ...options
  };
  element.classList.add('wb-masked');
  if (!config.mask) return () => element.classList.remove('wb-masked');
  if (!element.placeholder) {
    element.placeholder = config.mask.replace(/9/g, config.placeholder).replace(/A/g, config.placeholder);
  }
  function isSlot(c) { return c === '9' || c === 'A'; }
  function matchesSlot(m, c) {
    if (m === '9') return /\d/.test(c);
    if (m === 'A') return /[a-zA-Z]/.test(c);
    return false;
  }
  function extractRaw(value) {
    let raw = '';
    let mi = 0;
    for (let i = 0; i < value.length && mi < config.mask.length; i++) {
      if (isSlot(config.mask[mi])) {
        if (matchesSlot(config.mask[mi], value[i])) {
          raw += config.mask[mi] === 'A' ? value[i].toUpperCase() : value[i];
          mi++;
        }
      } else {
        if (value[i] === config.mask[mi]) mi++;
      }
    }
    return raw;
  }
  function buildMasked(raw) {
    let result = '';
    let ri = 0;
    for (let i = 0; i < config.mask.length && ri < raw.length; i++) {
      if (isSlot(config.mask[i])) {
        result += raw[ri++];
      } else {
        result += config.mask[i];
      }
    }
    return result;
  }
  function getMaskedPos(rawIndex) {
    let rc = 0;
    for (let i = 0; i < config.mask.length; i++) {
      if (isSlot(config.mask[i])) {
        if (rc === rawIndex) return i;
        rc++;
      }
    }
    return config.mask.length;
  }
  function getRawCount(masked, pos) {
    let count = 0;
    let mi = 0;
    for (let i = 0; i < pos && i < masked.length && mi < config.mask.length; i++) {
      if (isSlot(config.mask[mi])) count++;
      mi++;
    }
    return count;
  }
  const applyMask = () => {
    const cursor = element.selectionStart;
    const oldVal = element.value;
    const raw = extractRaw(oldVal);
    const newVal = buildMasked(raw);
    if (element.value !== newVal) element.value = newVal;
    const rawBefore = getRawCount(oldVal, cursor);
    let newCursor = getMaskedPos(rawBefore);
    if (newCursor < config.mask.length && !isSlot(config.mask[newCursor]) && rawBefore > 0) {
      while (newCursor < newVal.length && newCursor < config.mask.length && !isSlot(config.mask[newCursor])) newCursor++;
    }
    newCursor = Math.min(newCursor, newVal.length);
    element.setSelectionRange(newCursor, newCursor);
  };
  element.addEventListener('input', applyMask);
  element.addEventListener('paste', (e) => {
    e.preventDefault();
    const pasted = (e.clipboardData || window.clipboardData).getData('text');
    element.value = element.value.substring(0, element.selectionStart) + pasted + element.value.substring(element.selectionEnd);
    applyMask();
  });
  if (element.value) applyMask();
  return () => { element.classList.remove('wb-masked'); };
}
