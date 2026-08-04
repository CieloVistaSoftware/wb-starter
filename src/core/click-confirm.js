/**
 * Click Confirm — every clickable button/card shows a toast confirming
 * the action, site-wide. John: "every clickable button/cards must show a
 * toast message confirming who did it." Confirmed scope: site-wide, all
 * demo pages. (#456)
 *
 * A single delegated document-level listener, not per-element auto-inject
 * registration -- card CTAs render as real <button>/<a> elements inside
 * dozens of different wb-card-family components (card.js builds them
 * internally), so matching the resulting DOM shape at click time (a
 * button, or an element marked clickable) covers every card type without
 * enumerating each one by name.
 *
 * Gated on the SAME `autoInject` config flag every other auto-enhancement
 * in this codebase already uses to distinguish "demo/example page wanting
 * auto-enhancement" from the main SPA's own production chrome (nav,
 * header controls, etc., which never turn autoInject on) -- so this
 * doesn't fire on real site navigation, only demo content.
 */
import { createToast } from '../wb-viewmodels/feedback.js';
import { getConfig } from './config.js';

const CLICKABLE_SELECTOR = 'button, wb-button, .wb-card--clickable, [clickable]';

function labelFor(el) {
  const text = (el.textContent || '').trim().replace(/\s+/g, ' ');
  if (text) return text.length > 60 ? text.slice(0, 57) + '…' : text;
  return el.getAttribute('title') || el.getAttribute('aria-label') || el.tagName.toLowerCase();
}

if (typeof document !== 'undefined') {
  document.addEventListener('click', (e) => {
    if (!getConfig('autoInject')) return;
    const target = e.target.closest(CLICKABLE_SELECTOR);
    if (!target) return;
    // Already has its own explicit toast wired (many demos deliberately
    // showcase x-toast itself) -- don't stack a second, redundant one.
    if (target.hasAttribute('x-toast') || target._wbToastInit) return;
    // Never confirm a click that landed on the toast UI itself.
    if (target.closest('.wb-toast, .wb-toast-container')) return;
    // Demo TOOLING chrome, not the content being demonstrated -- the code
    // panel's own copy button already shows its own "Code copied to
    // clipboard" toast via a direct createToast() call (not x-toast, so
    // the check above misses it), and a "Docs:" link / theme switcher
    // isn't a demo "action" a confirmation is meaningful for. Confirmed
    // live: without this, clicking a wb-demo code panel's copy button
    // fired BOTH its own toast and this generic one.
    if (target.closest('.x-pre-wrapper, .wb-demo__links, .wb-demo__card-doc-link, wb-themecontrol')) return;
    createToast(`Clicked: ${labelFor(target)}`, 'info', 2000);
  });
}
