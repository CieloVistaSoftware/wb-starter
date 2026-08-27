/**
 * Click Confirm — every clickable button/card shows a toast confirming
 * the action, site-wide. John: "every clickable button/cards must show a
 * toast message confirming who did it." Confirmed scope: site-wide, all
 * demo pages. (#456)
 *
 * A single delegated document-level listener, not per-element auto-inject
 * registration -- card CTAs render as real <button>/<a> elements inside
 * dozens of different x-card-family behaviors (card.js builds them
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

const CLICKABLE_SELECTOR = 'button, x-button, x-switch, .x-card--clickable, [clickable]';

// John: "make the toast message same as variant" -- every click-confirm
// toast used a flat, always-blue 'info' style regardless of what was
// clicked, so a Warning/Error button's confirmation looked identical to a
// Success one. toast.css only has real rules for these 7 -- anything else
// (e.g. a button's 'ghost'/'outline' variant) has no matching toast style,
// so fall back to 'info' rather than emit a toast with no CSS behind it.
const TOAST_VARIANTS = new Set(['primary', 'secondary', 'success', 'warning', 'error', 'danger', 'info']);

function toastVariantFor(el) {
  // A `variant="warning"` attribute in SOURCE markup doesn't survive onto
  // the live element -- schema-builder.js consumes it to build the
  // x-button--warning CLASS during processSchema(), but never reflects
  // the attribute itself back (confirmed live: a rendered <button>'s
  // variant attribute is gone, only its class survives). Read the variant
  // out of the wb-*--{variant} class instead of the (absent) attribute.
  const withVariant = el.hasAttribute('variant') ? el : el.closest('[variant]');
  const attrVariant = withVariant?.getAttribute('variant');
  if (attrVariant && TOAST_VARIANTS.has(attrVariant)) return attrVariant;

  const classed = el.closest('[class*="--"]');
  const classMatch = classed?.className.match(/\bwb-\w+--(\w+)\b/);
  const classVariant = classMatch?.[1];
  return classVariant && TOAST_VARIANTS.has(classVariant) ? classVariant : 'info';
}

function labelFor(el) {
  // Some elements (e.g. a <button class="x-alert__close">, which has
  // position:relative) end up hosting an unrelated overlay as a real DOM
  // CHILD rather than a sibling (a x-demo "Docs:" badge, in the confirmed
  // live case) -- el.textContent would fold that in too ("×📖" instead of
  // "×"). Strip known overlay/badge children before reading text.
  const clone = el.cloneNode(true);
  clone.querySelectorAll('.x-demo__card-doc-link, .x-demo__links').forEach((n) => n.remove());
  const text = (clone.textContent || '').trim().replace(/\s+/g, ' ');
  if (text) return text.length > 60 ? text.slice(0, 57) + '…' : text;
  return el.getAttribute('title') || el.getAttribute('aria-label') || el.tagName.toLowerCase();
}

if (typeof document !== 'undefined') {
  // CAPTURE phase, not bubble -- must run BEFORE the target's own click
  // handlers (bubble-phase, incl. card.js's built-in createToast() calls)
  // fire, so `toastCountBefore` below is captured prior to this click's
  // own side effects. A bubble-phase document listener would run AFTER
  // the target's handlers already executed, making the before/after
  // comparison always equal (always "already has a toast") -- confirmed
  // this the hard way while building the dedup check itself.
  document.addEventListener('click', (e) => {
    if (!getConfig('autoInject')) return;
    const target = e.target.closest(CLICKABLE_SELECTOR);
    if (!target) return;
    // Already has its own explicit toast wired (many demos deliberately
    // showcase x-toast itself) -- don't stack a second, redundant one.
    if (target.hasAttribute('x-toast') || target._wbToastInit) return;
    // Never confirm a click that landed on the toast UI itself.
    if (target.closest('.x-toast, .x-toast-container')) return;
    // Demo TOOLING chrome, not the content being demonstrated -- a "Docs:"
    // link / theme switcher isn't a demo "action" a confirmation is
    // meaningful for.
    if (target.closest('.x-demo__links, .x-demo__card-doc-link, x-themecontrol')) return;

    // Most x-card-family behaviors (cardbutton, cardproduct, cardfile,
    // cardexpandable, cardminimizable, a plain clickable card, ...) already
    // call createToast() directly inside their own click handling
    // (card.js) -- NOT via the x-toast attribute, so the check above never
    // catches them. Confirmed live: clicking x-cardbutton's primary
    // button fired both its own toast (the button's own label, e.g. "OK")
    // AND this generic one ("Clicked: OK") stacked on top.
    //
    // Click listeners run synchronously in registration/bubble order, so
    // by the time THIS document-level bubble listener's callback body
    // executes, the target's own (element-level, earlier-run) handler has
    // already finished -- but createToast()'s DOM insertion is itself
    // synchronous, so a toast it just created already exists in the DOM
    // RIGHT NOW too. Defer one tick (setTimeout 0) and re-check: if the
    // toast count grew since this click started, something else already
    // confirmed it -- skip, rather than maintain a brittle per-behavior
    // exclusion list that has to be updated every time a new card variant
    // adds its own toast.
    const toastCountBefore = document.querySelectorAll('.x-toast').length;
    setTimeout(() => {
      if (document.querySelectorAll('.x-toast').length > toastCountBefore) return;
      createToast(`Clicked: ${labelFor(target)}`, toastVariantFor(target), 2000);
    }, 0);
  }, true);
}
