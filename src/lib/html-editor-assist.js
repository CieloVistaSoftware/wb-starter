/**
 * html-editor-assist.js -- makes a plain <textarea> behave like an HTML
 * editor for wb-starter markup (#265): Tab indents, and typing offers
 * completions for x-* behaviors and their options.
 *
 * Used by demos/playground.html. The textarea stays a textarea (x-ignore keeps
 * WB's own textarea enhancement off it); this only adds keys and a popup.
 *
 *   - Tab inserts two spaces; Shift+Tab takes up to two off the line.
 *     Escape, then Tab, leaves the editor, so a keyboard user is never trapped.
 *   - Inside a start tag, typing `x-` lists every registered behavior
 *     attribute (x-card, x-tooltip, ...).
 *   - Inside a tag that already carries a behavior, typing an attribute name
 *     lists that behavior's options from its schema (variant, size, ...).
 *   - ArrowUp/ArrowDown move through the list, Enter or Tab accepts it,
 *     Escape closes it.
 *
 * The two pure functions, completionContext() and suggest(), hold all the
 * judgement and are exported so they can be read and tested apart from the
 * DOM.
 */

import { setRule, clearRules } from '../core/dynamic-style.js';

const MAX_ITEMS = 8;

const KEBAB = (p) => p.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);

/**
 * What is being typed at `pos`, or null when nothing should be completed.
 * Only inside a start tag (after `<name`, before its `>`) and only while
 * typing an attribute name.
 * @param {string} text
 * @param {number} pos caret offset
 * @returns {{ prefix: string, start: number, tagText: string } | null}
 */
export function completionContext(text, pos) {
  const before = text.slice(0, pos);
  const open = before.lastIndexOf('<');
  if (open < 0 || before.lastIndexOf('>') > open) return null;
  const tagText = before.slice(open);
  // Not a start tag: a closing tag, a comment or a doctype.
  if (!/^<[a-zA-Z]/.test(tagText)) return null;
  // Inside a quoted value: an odd number of quotes so far.
  if (((tagText.match(/"/g) || []).length % 2) || ((tagText.match(/'/g) || []).length % 2)) return null;
  // The attribute name being typed: after whitespace, letters/digits/dashes.
  const m = tagText.match(/\s([a-zA-Z][\w-]*)$/);
  if (!m) return null;
  return { prefix: m[1], start: pos - m[1].length, tagText };
}

/**
 * The completions for a context.
 * @param {{ prefix: string, tagText: string }} ctx
 * @param {{ behaviors: Record<string, string>, schemas: Record<string, { properties?: Record<string, { description?: string }> }> }} data
 *   behaviors: attribute (x-card) -> behavior name (card); schemas: behavior name -> schema index entry
 * @returns {{ label: string, detail: string }[]}
 */
export function suggest(ctx, data) {
  const prefix = ctx.prefix.toLowerCase();
  const typed = new Set((ctx.tagText.match(/\s([a-zA-Z][\w-]*)(?==|\s|$)/g) || []).map((s) => s.trim().toLowerCase()));
  typed.delete(prefix);

  if (prefix.startsWith('x-')) {
    return Object.keys(data.behaviors)
      .filter((attr) => attr.startsWith(prefix) && !typed.has(attr))
      .sort()
      .slice(0, MAX_ITEMS)
      .map((attr) => ({ label: attr, detail: describe(data, data.behaviors[attr]) }));
  }

  // An option of a behavior this tag already carries.
  const options = new Map();
  for (const attr of typed) {
    const behavior = data.behaviors[attr];
    const props = behavior && data.schemas[behavior] && data.schemas[behavior].properties;
    if (!props) continue;
    for (const [name, def] of Object.entries(props)) {
      if (name.startsWith('$') || name.startsWith('_') || name.startsWith('x-')) continue;
      if (!name.toLowerCase().startsWith(prefix) || typed.has(name.toLowerCase()) || options.has(name)) continue;
      options.set(name, `${attr}: ${firstSentence((def && def.description) || '')}`);
    }
  }
  return [...options].sort(([a], [b]) => a.localeCompare(b))
    .slice(0, MAX_ITEMS)
    .map(([label, detail]) => ({ label, detail }));
}

function describe(data, behavior) {
  const sc = data.schemas[behavior];
  return firstSentence((sc && sc.description) || behavior || '');
}

function firstSentence(s) {
  const t = String(s).trim();
  const cut = t.search(/[.:;](\s|$)/);
  const one = cut > 0 ? t.slice(0, cut) : t;
  return one.length > 70 ? one.slice(0, 69) + '…' : one;
}

/**
 * Where the caret is drawn, relative to the textarea's padding box, found by
 * laying the text out in a hidden copy with the same font and wrapping.
 */
function caretPoint(textarea, pos) {
  const cs = getComputedStyle(textarea);
  const mirror = document.createElement('div');
  // The copy's layout comes from a generated rule, never its style attribute
  // (no inline styles, #779): the textarea's own font, padding and wrapping.
  const decls = { position: 'absolute', visibility: 'hidden', top: '0', left: '-9999px', width: `${textarea.clientWidth}px` };
  for (const p of ['fontFamily', 'fontSize', 'fontWeight', 'lineHeight', 'letterSpacing', 'tabSize',
    'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft', 'borderTopWidth', 'borderLeftWidth',
    'boxSizing', 'whiteSpace', 'overflowWrap']) {
    decls[KEBAB(p)] = cs[p];
  }
  setRule(mirror, 'mirror', decls);
  mirror.textContent = textarea.value.slice(0, pos);
  const mark = document.createElement('span');
  mark.textContent = '​';
  mirror.appendChild(mark);
  document.body.appendChild(mirror);
  const point = { x: mark.offsetLeft, y: mark.offsetTop + mark.offsetHeight };
  clearRules(mirror);
  mirror.remove();
  return point;
}

/**
 * Attach the editor keys and the completion popup to a textarea.
 * @param {HTMLTextAreaElement} textarea
 * @param {() => Promise<{ behaviors: Record<string, string>, schemas: Record<string, object> }>} loadData
 * @param {{ popupClass?: string }} [opts]
 * @returns {() => void} detach
 */
export function attachEditorAssist(textarea, loadData, opts = {}) {
  const cls = opts.popupClass || 'html-assist';
  let data = { behaviors: {}, schemas: {} };
  loadData().then((d) => { if (d) data = d; }).catch(() => {});

  const list = document.createElement('ul');
  list.className = cls;
  list.id = `${textarea.id || 'editor'}-completions`;
  list.setAttribute('role', 'listbox');
  list.hidden = true;
  textarea.insertAdjacentElement('afterend', list);
  textarea.parentElement.classList.add(`${cls}-host`);
  textarea.setAttribute('aria-autocomplete', 'list');
  textarea.setAttribute('aria-controls', list.id);

  let items = [];
  let active = 0;
  let ctx = null;
  let tabLeaves = false;

  const close = () => {
    list.hidden = true;
    items = [];
    ctx = null;
    textarea.removeAttribute('aria-activedescendant');
  };

  const paint = () => {
    list.replaceChildren(...items.map((it, i) => {
      const li = document.createElement('li');
      li.id = `${list.id}-${i}`;
      li.setAttribute('role', 'option');
      li.setAttribute('aria-selected', String(i === active));
      li.className = `${cls}__item${i === active ? ` ${cls}__item--active` : ''}`;
      const label = document.createElement('span');
      label.className = `${cls}__label`;
      label.textContent = it.label;
      const detail = document.createElement('span');
      detail.className = `${cls}__detail`;
      detail.textContent = it.detail;
      li.append(label, detail);
      li.addEventListener('mousedown', (e) => { e.preventDefault(); active = i; accept(); });
      return li;
    }));
    textarea.setAttribute('aria-activedescendant', `${list.id}-${active}`);
  };

  const open = () => {
    const c = completionContext(textarea.value, textarea.selectionStart);
    const found = c && textarea.selectionStart === textarea.selectionEnd ? suggest(c, data) : [];
    // Nothing to offer, or the only offer is exactly what is already typed.
    if (!found.length || (found.length === 1 && found[0].label === c.prefix)) { close(); return; }
    ctx = c;
    items = found;
    active = 0;
    paint();
    const p = caretPoint(textarea, textarea.selectionStart);
    const top = `${textarea.offsetTop + p.y - textarea.scrollTop}px`;
    const x = textarea.offsetLeft + p.x - textarea.scrollLeft;
    setRule(list, 'at', { left: `${x}px`, top });
    list.hidden = false;
    // Under the caret, but never past the editor's right edge.
    const room = textarea.offsetLeft + textarea.clientWidth - list.offsetWidth;
    if (x > room) setRule(list, 'at', { left: `${Math.max(0, room)}px`, top });
  };

  const accept = () => {
    const it = items[active];
    if (!it || !ctx) { close(); return; }
    textarea.focus();
    textarea.setSelectionRange(ctx.start, textarea.selectionStart);
    document.execCommand('insertText', false, it.label);
    close();
  };

  const onKeydown = (e) => {
    if (!list.hidden) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        active = (active + (e.key === 'ArrowDown' ? 1 : items.length - 1)) % items.length;
        paint();
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        e.stopImmediatePropagation();
        accept();
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        close();
        return;
      }
    }
    if (e.key === 'Escape') { tabLeaves = true; return; }
    if (e.key === 'Tab' && !e.ctrlKey && !e.altKey && !e.metaKey) {
      if (tabLeaves) { tabLeaves = false; return; } // let focus move on
      e.preventDefault();
      const val = textarea.value;
      const pos = textarea.selectionStart;
      if (e.shiftKey) {
        const lineStart = val.lastIndexOf('\n', pos - 1) + 1;
        const lead = (val.slice(lineStart).match(/^ {1,2}/) || [''])[0];
        if (!lead) return;
        textarea.setSelectionRange(lineStart, lineStart + lead.length);
        document.execCommand('delete');
        const back = Math.max(lineStart, pos - lead.length);
        textarea.setSelectionRange(back, back);
        return;
      }
      document.execCommand('insertText', false, '  ');
      return;
    }
    tabLeaves = false;
  };

  const onInput = () => open();
  const onBlur = () => close();
  const onClickCaret = () => close();

  // Capture, so an open list takes Enter before the page's own Enter handler.
  textarea.addEventListener('keydown', onKeydown, true);
  textarea.addEventListener('input', onInput);
  textarea.addEventListener('blur', onBlur);
  textarea.addEventListener('click', onClickCaret);

  return () => {
    textarea.removeEventListener('keydown', onKeydown, true);
    textarea.removeEventListener('input', onInput);
    textarea.removeEventListener('blur', onBlur);
    textarea.removeEventListener('click', onClickCaret);
    clearRules(list);
    list.remove();
  };
}
