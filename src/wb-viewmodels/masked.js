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
  // Walk the raw typed value against the sequence of SLOTS the mask expects
  // (ignoring literal separators entirely, rather than trying to stay
  // positionally in sync with the mask character-by-character). The old
  // position-synced version got stuck — and silently dropped every digit
  // after it — as soon as the mask started with a literal the user hadn't
  // typed yet (e.g. the "(" in "(999) 999-9999": value[0] is the user's
  // first digit, but mask[0] is "(", so it never matched and never advanced).
  const maskSlots = [...config.mask].filter(isSlot);
  function extractRaw(value) {
    let raw = '';
    let si = 0;
    for (let i = 0; i < value.length && si < maskSlots.length; i++) {
      const ch = value[i];
      if (matchesSlot(maskSlots[si], ch)) {
        raw += maskSlots[si] === 'A' ? ch.toUpperCase() : ch;
        si++;
      }
      // else: not a valid character for the next slot (a literal already in
      // the displayed value, or an invalid keystroke) — skip it, don't
      // advance si.
    }
    return raw;
  }
  function buildMasked(raw) {
    // Literal separators (the "-" in "999-999-9999") must appear as soon as
    // every slot BEFORE them is filled, not only once the NEXT slot after
    // them also has a character — otherwise typing exactly "599" against
    // "999-999-9999" showed "599" with no trailing dash until a 4th digit
    // was typed, instead of "599-" immediately.
    let result = '';
    let ri = 0;
    for (let i = 0; i < config.mask.length; i++) {
      if (isSlot(config.mask[i])) {
        if (ri >= raw.length) break;
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
  const applyMask = () => {
    const oldVal = element.value;
    const raw = extractRaw(oldVal);
    const newVal = buildMasked(raw);
    if (element.value !== newVal) element.value = newVal;
    // Place the cursor right after the last filled slot (raw.length), then
    // skip past any trailing literal separator to sit before the next slot.
    // This assumes forward/append typing (the common case) rather than
    // trying to preserve an exact mid-string edit position — the previous
    // version computed this from the pre-reformat cursor position and the
    // mask's literal positions independently, which could fall out of sync
    // and scramble/drop characters under fast sequential typing.
    let newCursor = getMaskedPos(raw.length);
    while (newCursor < newVal.length && newCursor < config.mask.length && !isSlot(config.mask[newCursor])) newCursor++;
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
