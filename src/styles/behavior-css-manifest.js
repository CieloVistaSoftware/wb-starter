/**
 * Behavior → CSS file manifest, for just-in-time style loading.
 *
 * site.css used to `@import` all 50 files in src/styles/behaviors/*.css
 * unconditionally, so every page paid for every behavior's CSS regardless of
 * whether that page used it (a typical page uses a handful of behaviors, not
 * fifty). This manifest lets src/core/style-loader.js load only the CSS a
 * behavior actually needs, right when WB.inject() is about to run that
 * behavior for the first time on a page.
 *
 * Keyed by behaviorName (the same canonical name used throughout
 * src/core/tag-map.js and src/wb-viewmodels/index.js's `behaviors` object —
 * NOT the raw tag/attribute string), because behaviorName is the one thing
 * every dispatch path (wb-* tag, native auto-inject, x-* attribute, x-as-*
 * morph) already funnels down to before calling the behavior function.
 *
 * A behavior can map to more than one file — e.g. `cardhero` needs both
 * card.css (base card structure) and hero.css (the hero-specific bits it
 * also styles). card.css and notification.css both independently style
 * `.wb-notification*` for the `cardnotification` behavior (verified: real
 * duplication, not a mistake to fix here) — both must load together.
 *
 * Intentionally NOT in this manifest:
 *   - modal.css: dead/legacy CSS not exercised by the current dialog.js
 *     (`<dialog>` + showModal(), not the old `.wb-modal.open` toggle it
 *     defines). Never loading it is a strict improvement, not a gap.
 *   - stock.css: confirmed orphaned — no behavior, tag, or markup anywhere
 *     in the repo references `.wb-stock`/`data-wb="stock"`.
 *   - layout.css, ui-utils.css: kept as unconditional imports in site.css
 *     (see the comment there) rather than JIT-loaded — both are small
 *     (<1.5KB) and layout.css's real content (.wb-grid--alt-rows) is needed
 *     by <wb-grid>, a genuine custom element that never calls WB.inject()
 *     and so never passes through the hook this manifest feeds.
 */

export const BEHAVIOR_CSS_MAP = {
  // Cards — all 19 wb-card* behaviors share card.css's base structure.
  card: ['card.css'],
  cardbutton: ['card.css'],
  carddraggable: ['card.css'],
  cardexpandable: ['card.css'],
  cardfile: ['card.css'],
  cardhero: ['card.css', 'hero.css'],
  cardhorizontal: ['card.css'],
  cardimage: ['card.css'],
  cardlink: ['card.css'],
  cardminimizable: ['card.css'],
  cardnotification: ['card.css', 'notification.css'],
  cardoverlay: ['card.css'],
  cardportfolio: ['card.css'],
  cardpricing: ['card.css'],
  cardproduct: ['card.css'],
  cardprofile: ['card.css'],
  cardstats: ['card.css'],
  cardtestimonial: ['card.css'],
  cardvideo: ['card.css'],
  article: ['article.css'],
  articles: ['article.css'],

  hero: ['hero.css'],

  accordion: ['accordion.css'],
  alert: ['alert.css'],
  audio: ['audio.css'],
  autocomplete: ['autocomplete.css'],
  avatar: ['avatar.css'],
  badge: ['badge.css'],
  breadcrumb: ['breadcrumb.css'],
  button: ['button.css'],
  chip: ['chip.css'],
  code: ['code.css'],
  collapse: ['collapse.css'],
  counter: ['counter.css'],
  table: ['data.css'],
  demo: ['demo.css'],
  details: ['details.css'],
  dialog: ['dialog.css'], // also covers wb-modal (tag-map.js maps it to 'dialog')
  dropdown: ['dropdown.css'],
  footer: ['footer.css'],
  gallery: ['gallery.css'],
  header: ['header.css'],
  mark: ['inline.css'],

  // Native form controls + wb-input/wb-select/wb-textarea all share
  // input.css, including its unscoped native-fallback rules.
  input: ['input.css'],
  textarea: ['input.css'],
  select: ['input.css'],
  checkbox: ['input.css', 'checkbox.css'],
  radio: ['input.css'],
  range: ['input.css'],

  label: ['label.css'],
  mdhtml: ['mdhtml.css'],
  notes: ['notes.css'],
  otp: ['otp.css'],
  pagination: ['pagination.css'],
  popover: ['popover.css'],
  pre: ['pre.css'],
  progress: ['progress.css'],
  rating: ['rating.css'],
  search: ['search.css'],
  searchfield: ['search.css'],
  skeleton: ['skeleton.css'],
  stat: ['stat.css'],
  stepper: ['stepper.css'],
  steps: ['steps.css'],
  switch: ['switch.css'],
  tags: ['tags.css'],
  themecontrol: ['themecontrol.css'],
  timeline: ['timeline.css'],
  toast: ['toast.css'],
  notify: ['toast.css'],

  // Effects/utilities — all genuine WB.inject()-dispatched behaviors.
  ripple: ['effects.css'],
  sticky: ['effects.css'],
  confetti: ['effects.css'],
  fireworks: ['effects.css'],
  snow: ['effects.css'],
  stagelight: ['effects.css'],
  animate: ['effects.css'],
};
