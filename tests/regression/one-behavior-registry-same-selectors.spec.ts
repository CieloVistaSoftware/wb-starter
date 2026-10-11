/**
 * One behavior registry, and the same selectors reach the same behaviors (#831).
 *
 * Until #831 a selector could be bound in six maps across three files:
 * tag-map.js's elementMap / nativeMap / extensionMap, wb-lazy.js's
 * WB_LAZY_ONLY_ELEMENTS / WB_LAZY_ONLY_ATTRIBUTES, and semantic-attributes.js's
 * SEMANTIC_PROPERTY_ATTRIBUTES -- plus BEHAVIOR_ALIASES in attribute-aliases.js
 * and a [data-tooltip] literal in wb-lazy.js. All of them now live in
 * src/core/tag-map.js. Moving them was allowed to change WHERE a binding is
 * written, never WHAT a page does.
 *
 * The arrays below are the selector -> behavior bindings each runtime built
 * from those maps on main at e9921d31a (2026-10-10), before the move:
 *
 *   LAZY_ON_MAIN    wb-lazy.js's customElementMappings + autoInjectMappings:
 *                   elementMap, extensionMap and WB_LAZY_ONLY_ATTRIBUTES as
 *                   [x-name], BEHAVIOR_ALIASES as [x-old], the property
 *                   attributes with their card/header exclusions, nativeMap,
 *                   and [data-tooltip].
 *   ROUTED_ON_MAIN  the x- attributes that kept a behavior OFF wb-lazy's
 *                   computed [x-{name}] route (#1642). Same set, same route.
 *   WB_ON_MAIN      wb.js's table-driven bindings: the property attributes
 *                   and nativeMap. (wb.js's x-{name} route reads index.js,
 *                   which #831 does not touch.)
 *
 * Each is rebuilt here from tag-map.js alone, the way the runtimes now build
 * it, and must equal the snapshot exactly. On main this fails: tag-map.js
 * alone is missing the 42 wb-lazy attributes and the property attributes.
 */
import { test, expect } from '../fixtures/offline';
import path from 'path';
import { pathToFileURL } from 'url';

const LAZY_ON_MAIN: string[] = [
  "[badge]:not(x-card):not(x-cardbutton):not(x-carddraggable):not(x-cardexpandable):not(x-cardfile):not(x-cardhero):not(x-cardhorizontal):not(x-cardimage):not(x-cardlink):not(x-card-link):not(x-cardminimizable):not(x-cardnotification):not(x-cardoverlay):not(x-cardportfolio):not(x-cardpricing):not(x-cardproduct):not(x-cardprofile):not(x-cardstats):not(x-cardtestimonial):not(x-cardvideo):not(article):not([x-behavior~=\"card\"]):not([x-card]):not(header) -> badge",
  "[data-tooltip] -> tooltip",
  "[ripple] -> ripple",
  "[toast-message] -> toast",
  "[tooltip]:not(x-card):not(x-cardbutton):not(x-carddraggable):not(x-cardexpandable):not(x-cardfile):not(x-cardhero):not(x-cardhorizontal):not(x-cardimage):not(x-cardlink):not(x-card-link):not(x-cardminimizable):not(x-cardnotification):not(x-cardoverlay):not(x-cardportfolio):not(x-cardpricing):not(x-cardproduct):not(x-cardprofile):not(x-cardstats):not(x-cardtestimonial):not(x-cardvideo):not(article):not([x-behavior~=\"card\"]):not([x-card]) -> tooltip",
  "[x-accordion] -> accordion",
  "[x-alert] -> alert",
  "[x-articles] -> articles",
  "[x-audio] -> audio",
  "[x-autocomplete] -> autocomplete",
  "[x-autosize] -> autosize",
  "[x-avatar] -> avatar",
  "[x-badge] -> badge",
  "[x-bounce] -> bounce",
  "[x-breadcrumb] -> breadcrumb",
  "[x-button] -> button",
  "[x-card] -> card",
  "[x-cardbutton] -> cardbutton",
  "[x-carddraggable] -> carddraggable",
  "[x-cardexpandable] -> cardexpandable",
  "[x-cardfile] -> cardfile",
  "[x-cardhero] -> cardhero",
  "[x-cardhorizontal] -> cardhorizontal",
  "[x-cardimage] -> cardimage",
  "[x-cardlink] -> cardlink",
  "[x-cardminimizable] -> cardminimizable",
  "[x-cardnotification] -> cardnotification",
  "[x-cardoverlay] -> cardoverlay",
  "[x-cardportfolio] -> cardportfolio",
  "[x-cardpricing] -> cardpricing",
  "[x-cardproduct] -> cardproduct",
  "[x-cardprofile] -> cardprofile",
  "[x-cardstats] -> cardstats",
  "[x-cardtestimonial] -> cardtestimonial",
  "[x-cardvideo] -> cardvideo",
  "[x-cart] -> cart",
  "[x-center] -> center",
  "[x-checkbox] -> checkbox",
  "[x-chip] -> chip",
  "[x-clock] -> clock",
  "[x-cluster] -> cluster",
  "[x-code] -> code",
  "[x-codecontrol] -> codetheme",
  "[x-codetheme] -> codetheme",
  "[x-collapse] -> collapse",
  "[x-colorpicker] -> colorpicker",
  "[x-confetti] -> confetti",
  "[x-confirm] -> confirm",
  "[x-container] -> container",
  "[x-control] -> control",
  "[x-copy] -> copy",
  "[x-copybutton] -> copybutton",
  "[x-countdown] -> countdown",
  "[x-counter] -> counter",
  "[x-cover] -> cover",
  "[x-darkmode] -> darkmode",
  "[x-demo] -> demo",
  "[x-details] -> details",
  "[x-dialog] -> dialog",
  "[x-dl] -> dl",
  "[x-draggable] -> draggable",
  "[x-drawer-layout] -> drawerLayout",
  "[x-drawer] -> drawer",
  "[x-dropdown] -> dropdown",
  "[x-error] -> error",
  "[x-fadein] -> fadein",
  "[x-fieldset] -> fieldset",
  "[x-figure] -> figure",
  "[x-file] -> file",
  "[x-fill] -> fill",
  "[x-fireworks] -> fireworks",
  "[x-fix-card] -> fix-card",
  "[x-flash] -> flash",
  "[x-flex] -> flex",
  "[x-flip] -> flip",
  "[x-floatinglabel] -> floatinglabel",
  "[x-footer] -> footer",
  "[x-form] -> form",
  "[x-formrow] -> formrow",
  "[x-frame] -> frame",
  "[x-fullscreen] -> fullscreen",
  "[x-gallery] -> gallery",
  "[x-glass] -> glass",
  "[x-globe] -> globe",
  "[x-glow] -> glow",
  "[x-grid] -> grid",
  "[x-header] -> header",
  "[x-heartbeat] -> heartbeat",
  "[x-help] -> help",
  "[x-hero] -> hero",
  "[x-icon] -> icon",
  "[x-img] -> img",
  "[x-input] -> input",
  "[x-inputgroup] -> inputgroup",
  "[x-jello] -> jello",
  "[x-kbd] -> kbd",
  "[x-label] -> label",
  "[x-lightbox] -> lightbox",
  "[x-mark] -> mark",
  "[x-masked] -> masked",
  "[x-masonry] -> masonry",
  "[x-mdhtml] -> mdhtml",
  "[x-modal] -> modal",
  "[x-move] -> move",
  "[x-nav] -> navbar",
  "[x-navbar] -> navbar",
  "[x-notes] -> notes",
  "[x-notify] -> notify",
  "[x-ol] -> ol",
  "[x-otp] -> otp",
  "[x-pagination] -> pagination",
  "[x-password] -> password",
  "[x-popover] -> popover",
  "[x-pre] -> pre",
  "[x-print] -> print",
  "[x-progress] -> progress",
  "[x-prompt] -> prompt",
  "[x-pulse] -> pulse",
  "[x-radio] -> radio",
  "[x-rainbow] -> rainbow",
  "[x-range] -> range",
  "[x-rating] -> rating",
  "[x-ratio] -> ratio",
  "[x-reel] -> reel",
  "[x-relativetime] -> relativetime",
  "[x-release] -> release",
  "[x-repeater] -> repeater",
  "[x-resizable] -> resizable",
  "[x-ripple] -> ripple",
  "[x-scrollalong] -> scrollalong",
  "[x-search] -> search",
  "[x-searchfield] -> searchfield",
  "[x-select] -> select",
  "[x-shake] -> shake",
  "[x-share] -> share",
  "[x-sidebarlayout] -> sidebarlayout",
  "[x-skeleton] -> skeleton",
  "[x-slidein] -> slidein",
  "[x-slider] -> slider",
  "[x-snow] -> snow",
  "[x-span] -> status",
  "[x-sparkle] -> sparkle",
  "[x-spinner] -> spinner",
  "[x-stack] -> stack",
  "[x-stagelight] -> stagelight",
  "[x-stat] -> stat",
  "[x-status] -> status",
  "[x-stepper] -> stepper",
  "[x-steps] -> steps",
  "[x-sticky] -> sticky",
  "[x-switch] -> switch",
  "[x-switcher] -> switcher",
  "[x-table] -> table",
  "[x-tabs] -> tabs",
  "[x-tada] -> tada",
  "[x-tags] -> tags",
  "[x-textarea] -> textarea",
  "[x-themecontrol] -> themecontrol",
  "[x-timeline] -> timeline",
  "[x-toast] -> toast",
  "[x-toggle] -> toggle",
  "[x-tooltip] -> tooltip",
  "[x-truncate] -> truncate",
  "[x-typewriter] -> typewriter",
  "[x-ul] -> ul",
  "[x-video] -> video",
  "[x-vimeo] -> vimeo",
  "[x-wobble] -> wobble",
  "[x-youtube] -> youtube",
  "[x-zoomin] -> zoomin",
  "article -> card",
  "audio -> audio",
  "button -> button",
  "code -> code",
  "details -> details",
  "dialog -> dialog",
  "fieldset -> fieldset",
  "figure -> figure",
  "footer -> footer",
  "form -> form",
  "header -> header",
  "img -> img",
  "input -> input",
  "input[type=\"checkbox\"] -> checkbox",
  "input[type=\"password\"] -> password",
  "input[type=\"radio\"] -> radio",
  "input[type=\"range\"] -> range",
  "kbd -> kbd",
  "label -> label",
  "mark -> mark",
  "nav -> navbar",
  "pre -> pre",
  "progress -> progress",
  "select -> select",
  "table -> table",
  "textarea -> textarea",
  "video -> video",
];

const ROUTED_ON_MAIN: string[] = [
  "x-accordion",
  "x-alert",
  "x-articles",
  "x-audio",
  "x-autocomplete",
  "x-autosize",
  "x-avatar",
  "x-badge",
  "x-bounce",
  "x-breadcrumb",
  "x-button",
  "x-card",
  "x-cardbutton",
  "x-carddraggable",
  "x-cardexpandable",
  "x-cardfile",
  "x-cardhero",
  "x-cardhorizontal",
  "x-cardimage",
  "x-cardlink",
  "x-cardminimizable",
  "x-cardnotification",
  "x-cardoverlay",
  "x-cardportfolio",
  "x-cardpricing",
  "x-cardproduct",
  "x-cardprofile",
  "x-cardstats",
  "x-cardtestimonial",
  "x-cardvideo",
  "x-cart",
  "x-center",
  "x-checkbox",
  "x-chip",
  "x-clock",
  "x-cluster",
  "x-code",
  "x-codecontrol",
  "x-codetheme",
  "x-collapse",
  "x-colorpicker",
  "x-confetti",
  "x-confirm",
  "x-container",
  "x-control",
  "x-copy",
  "x-copybutton",
  "x-countdown",
  "x-counter",
  "x-cover",
  "x-darkmode",
  "x-demo",
  "x-details",
  "x-dialog",
  "x-dl",
  "x-draggable",
  "x-drawer",
  "x-drawer-layout",
  "x-dropdown",
  "x-error",
  "x-fadein",
  "x-fieldset",
  "x-figure",
  "x-file",
  "x-fill",
  "x-fireworks",
  "x-fix-card",
  "x-flash",
  "x-flex",
  "x-flip",
  "x-floatinglabel",
  "x-footer",
  "x-form",
  "x-formrow",
  "x-frame",
  "x-fullscreen",
  "x-gallery",
  "x-glass",
  "x-globe",
  "x-glow",
  "x-grid",
  "x-header",
  "x-heartbeat",
  "x-help",
  "x-hero",
  "x-icon",
  "x-img",
  "x-input",
  "x-inputgroup",
  "x-jello",
  "x-kbd",
  "x-label",
  "x-lightbox",
  "x-mark",
  "x-masked",
  "x-masonry",
  "x-mdhtml",
  "x-modal",
  "x-move",
  "x-nav",
  "x-navbar",
  "x-notes",
  "x-notify",
  "x-ol",
  "x-otp",
  "x-pagination",
  "x-password",
  "x-popover",
  "x-pre",
  "x-print",
  "x-progress",
  "x-prompt",
  "x-pulse",
  "x-radio",
  "x-rainbow",
  "x-range",
  "x-rating",
  "x-ratio",
  "x-reel",
  "x-relativetime",
  "x-release",
  "x-repeater",
  "x-resizable",
  "x-ripple",
  "x-scrollalong",
  "x-search",
  "x-searchfield",
  "x-select",
  "x-shake",
  "x-share",
  "x-sidebarlayout",
  "x-skeleton",
  "x-slidein",
  "x-slider",
  "x-snow",
  "x-span",
  "x-sparkle",
  "x-spinner",
  "x-stack",
  "x-stagelight",
  "x-stat",
  "x-status",
  "x-stepper",
  "x-steps",
  "x-sticky",
  "x-switch",
  "x-switcher",
  "x-table",
  "x-tabs",
  "x-tada",
  "x-tags",
  "x-textarea",
  "x-themecontrol",
  "x-timeline",
  "x-toast",
  "x-toggle",
  "x-tooltip",
  "x-truncate",
  "x-typewriter",
  "x-ul",
  "x-video",
  "x-vimeo",
  "x-wobble",
  "x-youtube",
  "x-zoomin",
];

const WB_ON_MAIN: string[] = [
  "[badge]:not(x-card):not(x-cardbutton):not(x-carddraggable):not(x-cardexpandable):not(x-cardfile):not(x-cardhero):not(x-cardhorizontal):not(x-cardimage):not(x-cardlink):not(x-card-link):not(x-cardminimizable):not(x-cardnotification):not(x-cardoverlay):not(x-cardportfolio):not(x-cardpricing):not(x-cardproduct):not(x-cardprofile):not(x-cardstats):not(x-cardtestimonial):not(x-cardvideo):not(article):not([x-behavior~=\"card\"]):not([x-card]):not(header) -> badge",
  "[ripple] -> ripple",
  "[toast-message] -> toast",
  "[tooltip]:not(x-card):not(x-cardbutton):not(x-carddraggable):not(x-cardexpandable):not(x-cardfile):not(x-cardhero):not(x-cardhorizontal):not(x-cardimage):not(x-cardlink):not(x-card-link):not(x-cardminimizable):not(x-cardnotification):not(x-cardoverlay):not(x-cardportfolio):not(x-cardpricing):not(x-cardproduct):not(x-cardprofile):not(x-cardstats):not(x-cardtestimonial):not(x-cardvideo):not(article):not([x-behavior~=\"card\"]):not([x-card]) -> tooltip",
  "article -> card",
  "audio -> audio",
  "button -> button",
  "code -> code",
  "details -> details",
  "dialog -> dialog",
  "fieldset -> fieldset",
  "figure -> figure",
  "footer -> footer",
  "form -> form",
  "header -> header",
  "img -> img",
  "input -> input",
  "input[type=\"checkbox\"] -> checkbox",
  "input[type=\"password\"] -> password",
  "input[type=\"radio\"] -> radio",
  "input[type=\"range\"] -> range",
  "kbd -> kbd",
  "label -> label",
  "mark -> mark",
  "nav -> navbar",
  "pre -> pre",
  "progress -> progress",
  "select -> select",
  "table -> table",
  "textarea -> textarea",
  "video -> video",
];

type Registry = {
  elementMap: Record<string, string>;
  nativeMap: Record<string, string>;
  extensionMap: Record<string, string>;
  BEHAVIOR_ALIASES?: Record<string, string>;
  propertyMappings?: { selector: string; behavior: string }[];
  legacyLazyMap?: Record<string, string>;
};

async function registry(): Promise<Registry> {
  return import(pathToFileURL(path.join(process.cwd(), 'src/core/tag-map.js')).href);
}

const pair = (selector: string, behavior: string) => `${selector} -> ${behavior}`;
const sorted = (list: string[]) => [...new Set(list)].sort();

test('wb-lazy.js binds the same selectors to the same behaviors, all read from tag-map.js', async () => {
  const r = await registry();
  const now = [
    ...Object.entries(r.elementMap).map(([s, b]) => pair(s, b)),
    ...Object.entries(r.extensionMap).map(([a, b]) => pair(`[${a}]`, b)),
    ...Object.entries(r.BEHAVIOR_ALIASES || {}).map(([old, b]) => pair(`[x-${old}]`, b)),
    ...(r.propertyMappings || []).map(({ selector, behavior }) => pair(selector, behavior)),
    ...Object.entries(r.nativeMap).map(([s, b]) => pair(s, b)),
    ...Object.entries(r.legacyLazyMap || {}).map(([s, b]) => pair(s, b)),
  ];
  expect(now.length, 'a selector is bound twice in tag-map.js').toBe(new Set(now).size);
  expect(sorted(now)).toEqual(LAZY_ON_MAIN);
});

test('the computed [x-{name}] route skips exactly the attributes it skipped before', async () => {
  const r = await registry();
  const routed = [
    ...Object.keys(r.extensionMap),
    ...Object.keys(r.BEHAVIOR_ALIASES || {}).map((old) => `x-${old}`),
  ];
  expect(sorted(routed)).toEqual(ROUTED_ON_MAIN);
});

test('wb.js binds the same table-driven selectors, all read from tag-map.js', async () => {
  const r = await registry();
  const now = [
    ...(r.propertyMappings || []).map(({ selector, behavior }) => pair(selector, behavior)),
    ...Object.entries(r.nativeMap).map(([s, b]) => pair(s, b)),
  ];
  expect(sorted(now)).toEqual(WB_ON_MAIN);
});

/**
 * The 42 attributes that came from wb-lazy.js's own table. wb-lazy schema-builds
 * an attribute it finds in extensionMap, and these were never in it, so moving
 * them must not start building their schemas: measured before the guard,
 * <div x-pre> gained class="x-pre" and x-schema on the host and
 * <div x-search>Text</div> lost its text to an attribute.
 */
const FROM_WB_LAZY_TABLE = [
  'pre', 'code', 'breadcrumb', 'notify', 'typewriter', 'bounce', 'pulse', 'copybutton',
  'fadein', 'shake', 'slidein', 'zoomin', 'wobble', 'tada', 'jello', 'heartbeat', 'flip',
  'flash', 'relativetime', 'password', 'ul', 'ol', 'dl', 'stepper', 'otp', 'search',
  'clock', 'countdown', 'pagination', 'steps', 'kbd', 'img', 'popover', 'confirm', 'prompt',
  'lightbox', 'share', 'print', 'fullscreen', 'truncate', 'masonry', 'autosize',
];

test('wb-lazy.js still runs the moved attributes as behaviors, never as schema builds', async ({ page }) => {
  test.setTimeout(120_000);
  const r = await registry();
  for (const name of FROM_WB_LAZY_TABLE) expect(r.extensionMap[`x-${name}`], `x-${name}`).toBe(name);

  await page.goto('/tests/fixtures/blank.html', { waitUntil: 'domcontentloaded' });
  const result = await page.evaluate(async (names) => {
    document.documentElement.setAttribute('data-x-expected-errors', '');
    const mod: any = await import('/src/core/wb-lazy.js');
    const WB = mod.default || mod.WB;
    const host = document.createElement('section');
    host.innerHTML = names.map((n) => `<div x-${n}>Text</div>`).join('');
    document.body.appendChild(host);
    await WB.scan(host, { eager: true });
    await WB.settled?.({ timeout: 10000 });
    const els = Array.from(host.querySelectorAll(names.map((n) => `[x-${n}]`).join(','))) as HTMLElement[];
    const nameOf = (el: HTMLElement) => names.find((n) => el.hasAttribute(`x-${n}`)) as string;
    return {
      schemaBuilt: els.filter((el) => el.hasAttribute('x-schema')).map(nameOf),
      ran: els.filter((el) => el.hasAttribute('x-ready')).map(nameOf).sort(),
    };
  }, FROM_WB_LAZY_TABLE);
  expect(result.schemaBuilt, 'wb-lazy built these schemas; before #831 it never did').toEqual([]);
  expect(result.ran, 'every moved attribute still injects its behavior').toEqual([...FROM_WB_LAZY_TABLE].sort());
});
