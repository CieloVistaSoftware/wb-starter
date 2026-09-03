// fieldset — a group of form controls. Nothing more.
//
// #999 — John: "I've never heard of a collapsible field set." Nor has the
// platform. <fieldset> groups controls; it has no disclosure semantics. The
// element for disclosure is <details>/<summary>, which this framework already
// auto-injects (Law 0 — the tag IS the behavior).
//
// `collapsible` / `collapsed` were removed here. They were implemented TWICE —
// this file and enhancements.js — both assigning `legend.onclick`, which is a
// property rather than a listener, so whichever module ran second silently
// erased the first. Measured before removal: the class `x-fieldset--collapsed`
// was applied to a fieldset that was not collapsed, the legend had
// `cursor: auto`, and clicking it changed the height not at all (73px -> 73px,
// both rows still visible). #697 and #752 each "fixed" the attribute reading
// and left the behavior inert; What's New announced it working twice.
//
// If a group genuinely needs to collapse, wrap it: <details><fieldset>…
export function fieldset(element) {
  element.classList.add('x-fieldset');
  return () => element.classList.remove('x-fieldset');
}
