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
 * every dispatch path (wb-* tag, native auto-inject, x-* attribute
 * morph) already funnels down to before calling the behavior function.
 *
 * A behavior can map to more than one file — e.g. `cardhero` needs both
 * card.css (shared card structure) and hero.css (the hero-specific bits it
 * also styles). card.css and notification.css both independently style
 * `.x-notification*` for the `cardnotification` behavior (verified: real
 * duplication, not a mistake to fix here) — both must load together.
 *
 * Intentionally NOT in this manifest:
 *   - layout.css, ui-utils.css: kept as unconditional imports in site.css
 *     (see the comment there) rather than JIT-loaded — both are small
 *     (<1.5KB) and layout.css's real content (.x-grid--alt-rows) is needed
 *     by <div x-grid>, a genuine custom element that never calls WB.inject()
 *     and so never passes through the hook this manifest feeds.
 */

export const BEHAVIOR_CSS_MAP = {
  // Cards — all 19 x-card* behaviors share card.css's base structure.
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
  // An <article> IS a card: index.js routes the `article` behavior to card.js,
  // so the element gets card markup and needs card.css. Mapping it to
  // article.css alone meant an auto-injected <article> ran card() while
  // loading the wrong stylesheet -- .x-card__header-content had no rule at
  // all, which is why card.js was setting `flex:1;min-width:0` inline to
  // compensate for a stylesheet that was never fetched.
  article: ['card.css', 'article.css'],
  articles: ['article.css'],

  hero: ['hero.css'],

  accordion: ['accordion.css'],
  alert: ['alert.css'],
  audio: ['audio.css'],
  autocomplete: ['autocomplete.css'],
  avatar: ['avatar.css'],
  badge: ['badge.css'],
  // pill() is badge() with pill:true -- it stamps the same .x-badge /
  // .x-badge--pill classes, so it needs badge.css. Unmapped, an x-pill on a
  // page with no other badge rendered as a square, unstyled div.
  pill: ['badge.css'],
  breadcrumb: ['breadcrumb.css'],
  button: ['button.css'],
  chip: ['chip.css'],
  code: ['code.css'],
  collapse: ['collapse.css'],
  fill: ['fill.css'],
  glass: ['glass.css'],
  // x-copybutton (#291) — copy() itself (x-copy) is pure JS with nothing to
  // style, but copyButton() injects a real positioned button, so it needs
  // its own CSS file loaded.
  copybutton: ['copybutton.css'],
  counter: ['counter.css'],
  floatinglabel: ['floatinglabel.css'],
  table: ['data.css'],
  demo: ['demo.css'],
  'fix-card': ['fix-card.css'],
  details: ['details.css'],
  navbar: ['navbar.css'],
  tabs: ['tabs.css'],
  form: ['form.css'], // #751: the ajax success/error message
  dialog: ['dialog.css'], // also covers x-modal (tag-map.js maps it to 'dialog')
  drawer: ['drawer.css'],
  dropdown: ['dropdown.css'],
  footer: ['footer.css'],
  gallery: ['gallery.css'],
  header: ['header.css'],
  mark: ['inline.css'],
  // #779: youtube.js/vimeo.js's host, iframe and poster, formerly inline.
  youtube: ['embed.css'],
  vimeo: ['embed.css'],

  // Native form controls + x-input/x-select/x-textarea all share
  // input.css, including its unscoped native-fallback rules.
  input: ['input.css'],
  textarea: ['input.css'],
  select: ['input.css'],
  checkbox: ['input.css', 'checkbox.css'],
  radio: ['input.css'],
  range: ['input.css'],

  label: ['label.css'],
  // #773: span()'s status variants (x-span--primary, --success...) had no
  // stylesheet at all, so every one rendered as plain text.
  span: ['span.css'],
  mdhtml: ['mdhtml.css'],
  notes: ['notes.css'],
  otp: ['otp.css'],
  pagination: ['pagination.css'],
  popover: ['popover.css'],
  // #779: overlay.js's other panels, formerly built with style.cssText.
  lightbox: ['overlays.css'],
  offcanvas: ['overlays.css'],
  sheet: ['overlays.css'],
  confirm: ['overlays.css'],
  prompt: ['overlays.css'],
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

  // The five decorated trigger buttons, whose shared chrome stopped being an
  // inline style in helpers.js with #1003. A behavior stylesheet that is not
  // listed here never loads at all -- that is how fieldset.css shipped dead
  // (#999), so these entries are as much the fix as the file is.
  print: ['trigger-buttons.css'],
  share: ['trigger-buttons.css'],
  fullscreen: ['trigger-buttons.css'],
  clipboard: ['trigger-buttons.css'],
  scroll: ['trigger-buttons.css'],

  // #1008: release.css existed on disk and was reachable from nothing. When
  // site.css stopped @import-ing every behaviour stylesheet, each one had to be
  // named here instead, and this one was not — so the three classes it defines
  // (.x-release, .x-release--clickable, .x-release--stale) had no rules at all,
  // and the version badge in the navbar rendered unstyled on every page.
  //
  // Silent by construction: a stylesheet that never loads produces no error, and
  // an unstyled badge still shows its text.
  release: ['release.css'],

  // Effects/utilities — all genuine WB.inject()-dispatched behaviors.
  ripple: ['effects.css'],
  sticky: ['effects.css'],
  confetti: ['effects.css'],
  fireworks: ['effects.css'],
  snow: ['effects.css'],
  stagelight: ['effects.css'],
  animate: ['effects.css'],
  // #779: every other effects.js behavior. Their declarations moved from
  // element.style into effects.css, so a behavior missing here would load
  // with no styling at all -- the #999 failure, silently.
  fadein: ['effects.css'], fadeout: ['effects.css'], slidein: ['effects.css'],
  slideout: ['effects.css'], zoomin: ['effects.css'], zoomout: ['effects.css'],
  flip: ['effects.css'], rotate: ['effects.css'], bounce: ['effects.css'],
  shake: ['effects.css'], pulse: ['effects.css'], flash: ['effects.css'],
  tada: ['effects.css'], wobble: ['effects.css'], jello: ['effects.css'],
  swing: ['effects.css'], rubberband: ['effects.css'], heartbeat: ['effects.css'],
  typewriter: ['effects.css'], countup: ['effects.css'], parallax: ['effects.css'],
  reveal: ['effects.css'], marquee: ['effects.css'], sparkle: ['effects.css'],
  glow: ['effects.css'], rainbow: ['effects.css'], particle: ['effects.css'],

  // #779: stylesheets that exist because these behaviors stopped writing
  // their declarations onto element.style.
  draggable: ['draggable.css'],
  resizable: ['resizable.css'],
  scrollalong: ['scrollalong.css'],
  codetheme: ['codetheme.css'],
  ratio: ['ratio.css'],
  video: ['video.css'],
  toggle: ['toggle.css'],
  sidebar: ['navigation.css'],
  menu: ['navigation.css'],
  treeview: ['navigation.css'],
  backtotop: ['navigation.css'],
  link: ['navigation.css'],
  statusbar: ['navigation.css'],
  lazy: ['helpers.css'],
  hotkey: ['helpers.css'],
  truncate: ['helpers.css'],
  highlight: ['helpers.css'],
  external: ['helpers.css'],
  countdown: ['helpers.css'],
  clock: ['helpers.css'],
  offline: ['helpers.css'],
  visible: ['helpers.css'],
  debug: ['helpers.css'],
  ul: ['lists.css'],
  ol: ['lists.css'],
  dl: ['lists.css'],
  // Not a behavior: src/core/notes-modal.js's legacy dialog loads this itself
  // through ensureBehaviorCss('notes-modal') (#779).
  'notes-modal': ['notes-modal.css'],
  password: ['password.css'],
  move: ['move.css'],
  moveup: ['move.css'],
  movedown: ['move.css'],
  moveleft: ['move.css'],
  moveright: ['move.css'],
  moveall: ['move.css'],
  img: ['image.css'],
  figure: ['image.css'],
  json: ['json.css'],
  validator: ['validator.css'],
};
