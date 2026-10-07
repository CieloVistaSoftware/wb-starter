/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Every variant renders differently (#773)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * John, looking at the showcase's variant list — article: flat, bordered,
 * glass, default, clickable, elevated, size=xs, size=sm…:
 *
 *   "Make sure every variant actually is different at the gui layer."
 *
 * A variant row promises a visibly distinct rendering. When two rows render
 * identically the variant is a no-op, and the list is advertising options that
 * do nothing. That is the same defect class as #754 (input variants and sizes
 * were dead) and #746 (x-button suppressed the button behavior for three
 * releases): registered, documented, inert.
 *
 * WHY COMPUTED STYLE AND NOT THE CLASS LIST
 *
 * Every existing test asserts a variant applies its CLASS. None asserts the
 * class changes anything a reader can see — so a variant whose CSS was never
 * written passes today. `x-card--glass` being present proves nothing if no
 * rule matches `.x-card--glass`. The fingerprint below is therefore taken
 * from getComputedStyle and layout, which is what actually reached the screen.
 *
 * WHAT COUNTS AS "DIFFERENT"
 *
 * Only what a reader could notice, across the WHOLE rendered example -- not
 * just its root element. A variant very often lands on a child (a card's
 * header, a badge's dot, an input's inner field), and a root-only fingerprint
 * reported those as identical when they were not. Per element, in DOM order:
 *   - its tag, and its box: size AND position relative to the example's root.
 *     Position matters -- xalign, label-position and iconPosition move content
 *     without changing any element's size, and a reader sees that at once;
 *   - where its own text sits (a text-align change moves the words, not the
 *     box), and for a form field the text it shows (value or placeholder);
 *   - the VISUAL_PROPS below, and the same for its ::before/::after (icons
 *     are usually drawn there);
 *   - for an <input> Chromium paints as its own widget (a date picker, a
 *     checkbox, a range slider…), which widget -- see NATIVE_WIDGETS; for a
 *     visible <audio>/<video>, whether its native controls are drawn and
 *     whether they show it muted.
 * Every element on the stage counts, not only the first: an example can be a
 * trigger AND the <dialog> it opens, or a filter box AND its <table>.
 * Deliberately NOT the class attribute, and not ids.
 *
 * Animations are frozen at their start before reading, so a spinner's
 * rotation cannot make one option look different from itself.
 *
 * WHICH ROWS ARE COMPARED (#997)
 *
 * Every row the list offers: enum values, booleans, the sample values a
 * free-form property declares in JSON Schema's `examples`, and the authored
 * examples in data/behavior-examples.json (`examples: [{ label, source }]`,
 * optionally for one authoring `form`). John asked for at least five varied
 * examples per behavior; this is what holds "varied" to mean "looks
 * different", not "is labelled differently".
 *
 * WHICH ROWS ARE EXPECTED TO LOOK LIKE ANOTHER ONE
 *
 * Exactly three kinds, all read from the behavior's schema -- never listed
 * here by behavior:
 *
 *   1. The DEFAULT. A row whose value is the property's declared `default`
 *      (size=md when the schema says md), or the literal `default`, renders
 *      the behavior as it would with the attribute left off -- which is what
 *      its sibling rows already show. It may match another row; two options
 *      that are NOT the default may not.
 *
 *   2. A property the schema marks `"visual": false`, with its reason next to
 *      it in the schema (`"visualReason"`). Autoplay, loop, AJAX submission,
 *      a drag axis: real options whose whole effect is behaviour, so there is
 *      no static rendering in which they could differ. Such a row is still
 *      clicked and must still render; it is only left out of the comparison.
 *      The marker is the schema's claim, so a visual option cannot be waved
 *      through here without someone writing "this is not visual" into the
 *      behavior's own contract. When only SOME values of a visual property
 *      are behaviour (input's inputType: date draws a picker, email draws the
 *      same empty box as text), the schema lists just those in
 *      `"nonVisualValues"`, and the rest are compared as usual.
 *
 *   3. An ALIAS. A property whose schema says `"aliasOf": "<other>"` is the
 *      other option under a second name (table's searchable is filterable),
 *      so it renders exactly like that option and may.
 *
 * ONE TEST PER BEHAVIOR AND FORM
 *
 * This used to be a single test that clicked all ~500 rows of the list with a
 * fixed 110ms sleep after each, pooled every behavior's semantic and attribute
 * forms together, and ran into its 300s budget on every run. The sleep was
 * also a race: 110ms is a guess at how long a render takes, so a slow render
 * was fingerprinted as the PREVIOUS option. Now each behavior's semantic and
 * attribute rows are their own tests -- a failure names them -- and each row is
 * read only once its own render has finished (the same barrier as
 * tests/helpers/behaviors-page.ts: a freshly highlighted code panel, a changed
 * example, the runtime idle).
 */

import { test, expect, type Page } from '../fixtures/offline';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { extensionMap, nativeMap } from '../../src/core/tag-map.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');

/** Style properties a person could actually see a difference in. */
const VISUAL_PROPS = [
  'background-color', 'background-image',
  'color',
  'border-top-width', 'border-top-style', 'border-top-color',
  'border-radius',
  'box-shadow',
  'padding-top', 'padding-left',
  'margin-top',
  'font-size', 'font-weight', 'font-style',
  'text-transform', 'letter-spacing',
  'opacity', 'transform', 'filter',
  'display', 'flex-direction', 'gap',
  'width', 'height',
  // A resize grip is painted in the corner of a textarea; resize=none removes it.
  'resize',
  // How an image fills its frame is the whole of what fit= changes.
  'object-fit', 'object-position',
  'visibility',
  // What is drawn through a mask (checkbox.css's tick and indeterminate dash
  // are one element with two masks).
  'mask-image',
  // Animations are frozen before reading (below), so a frame of motion cannot
  // tell two options apart -- but WHICH motion runs, and how fast, is what a
  // reader sees: a spinner's speed, a shimmer switched off.
  'animation-name', 'animation-duration',
  // The colour of a checked radio's dot, a checkbox's tick and a range's
  // fill: all a radio's variants change (#1154).
  'accent-color',
  // The pointer over an element is what zoomable= and clickable options
  // change: the zoom-in cursor is the whole of x-img's zoomable (#1187).
  'cursor',
];

/**
 * <input> types Chromium paints as a distinct built-in widget at rest. The
 * type is part of the fingerprint only for these: text, email, tel, url,
 * search, number and an empty password field are the same empty box on
 * screen, so their type is not something a reader can see.
 */
const NATIVE_WIDGETS = [
  'checkbox', 'radio', 'range', 'color', 'file',
  'date', 'time', 'datetime-local', 'month', 'week',
];

type PropDef = {
  enum?: unknown[]; type?: string; default?: unknown; examples?: unknown[];
  visual?: boolean; nonVisualValues?: unknown[]; visualReason?: string; aliasOf?: string;
  visibleWhen?: 'open';
};
/**
 * `same`: the label of the option this one is declared identical to.
 * `open`: the option styles an overlay, so it is read with the overlay open.
 */
type OptionInfo = { label: string; exempt: '' | 'default' | 'non-visual'; same?: string; open?: boolean };

/** How pages/behaviors.html labels a row -- the spec's own copy of optionLabel(). */
function labelFor(prop: string, value: string): string {
  return prop && prop !== 'variant' ? `${prop}=${value}` : value;
}

/**
 * The (behavior, authoring form) pairs the showcase lists with more than one
 * option -- computed from the same sources pages/behaviors.html builds its list
 * from (tag-map's extensionMap and nativeMap, wb-lazy's
 * WB_LAZY_ONLY_ATTRIBUTES, data/schema-index.json and
 * data/behavior-examples.json), by the same rules, so the tests are known when
 * the file is collected. Each test checks the page really lists that many rows,
 * so a drift between this and the page fails loudly instead of comparing
 * nothing.
 *
 * Split by FORM as well as by behavior: the semantic rows (<button>) and the
 * attribute rows (<div x-button>) are different markup, compared separately,
 * and x-button alone is 82 rows -- too many for one test's budget.
 */
function behaviorsWithOptions(): { token: string; form: 'semantic' | 'attribute'; options: OptionInfo[] }[] {
  // wb-lazy.js is a browser module with a large import graph; its table is a
  // plain object literal, so it is read as text rather than imported.
  const lazySrc = readFileSync(join(ROOT, 'src/core/wb-lazy.js'), 'utf8');
  const start = lazySrc.indexOf('export const WB_LAZY_ONLY_ATTRIBUTES = {');
  const block = lazySrc.slice(start, lazySrc.indexOf('\n};', start));
  const lazyOnly: Record<string, string> = {};
  for (const m of block.matchAll(/^\s*'(x-[\w-]+)':\s*'([\w-]+)'/gm)) lazyOnly[m[1]] = m[2];
  const all: Record<string, string> = { ...lazyOnly, ...(extensionMap as Record<string, string>) };

  const index = JSON.parse(readFileSync(join(ROOT, 'data/schema-index.json'), 'utf8'));
  const byName = new Map<string, { properties?: Record<string, PropDef> }>(
    index.schemas.map((s: { name: string }) => [s.name, s]),
  );
  const examples: Record<string, { source?: string; examples?: { label?: string; source?: string; form?: string; visual?: boolean; visibleWhen?: string }[] }> =
    JSON.parse(readFileSync(join(ROOT, 'data/behavior-examples.json'), 'utf8')).examples || {};

  // behaviors.html: the first native selector for a behavior is its host.
  const autoHost: Record<string, string> = {};
  for (const [selector, beh] of Object.entries(nativeMap as Record<string, string>)) {
    if (!autoHost[beh]) autoHost[beh] = selector;
  }
  // behaviors.html's relabelByExample(): a semantic row survives only when the
  // behavior's curated example is written on its host.
  const usesHost = (attr: string, host: string) => {
    const src = examples[attr]?.source;
    if (!src) return true;
    const at = src.indexOf('<' + host);
    const after = at === -1 ? '' : src.charAt(at + host.length + 1);
    return at !== -1 && (after === '' || /[\s>/]/.test(after));
  };

  const out: { token: string; form: 'semantic' | 'attribute'; options: OptionInfo[] }[] = [];
  const seen = new Set<string>();
  for (const [attr, behavior] of Object.entries(all)) {
    const host = autoHost[behavior];
    const key = host ? 'native:' + behavior : attr;
    if (seen.has(key)) continue;
    seen.add(key);
    const options: OptionInfo[] = [];
    const props = byName.get(behavior)?.properties || {};
    for (const [prop, def] of Object.entries(props)) {
      if (!def) continue;
      const nonVisual = (value: string) =>
        def.visual === false || (def.nonVisualValues || []).map(String).includes(value);
      if (Array.isArray(def.enum) && def.enum.length) {
        // An empty enum value renders as a row with no option (the bare
        // behavior), which is not one of the options compared here.
        for (const v of def.enum) {
          if (v === '' || v == null) continue;
          const value = String(v);
          const isDefault = value === 'default' || (def.default !== undefined && String(def.default) === value);
          options.push({
            label: labelFor(prop, value),
            exempt: nonVisual(value) ? 'non-visual' : isDefault ? 'default' : '',
            open: def.visibleWhen === 'open',
          });
        }
      } else if (def.type === 'boolean') {
        // behaviors.html demonstrates a default-true flag by switching it OFF
        // -- except showDisplay, which John asked to see demonstrated ON, i.e.
        // AT its default (behaviors.html's DEMO_AS_TRUE). That row is the
        // default like any other.
        const shown = def.default === true && prop !== 'showDisplay' ? 'false' : 'true';
        const isDefault = def.default !== undefined && String(def.default) === shown;
        // A property the schema declares an alias of another (table's
        // searchable is filterable) is the SAME option under a second name, so
        // it must render exactly like that option -- and may.
        const target = def.aliasOf && props[def.aliasOf];
        const same = target && target.type === 'boolean'
          ? labelFor(def.aliasOf!, target.default === true ? 'false' : 'true') : undefined;
        options.push({
          label: labelFor(prop, shown),
          exempt: nonVisual(shown) ? 'non-visual' : isDefault ? 'default' : '',
          same,
          open: def.visibleWhen === 'open',
        });
      } else if (Array.isArray(def.examples) && def.examples.length) {
        // #997: a free-form property's sample values (JSON Schema `examples`)
        // are rows too, and promise a distinct look like any enum value.
        for (const v of def.examples) {
          if (v === '' || v == null) continue;
          const value = String(v);
          const isDefault = def.default !== undefined && String(def.default) === value;
          options.push({
            label: labelFor(prop, value),
            exempt: nonVisual(value) ? 'non-visual' : isDefault ? 'default' : '',
            open: def.visibleWhen === 'open',
          });
        }
      }
    }
    // #997: authored examples (data/behavior-examples.json `examples`) are
    // labelled by their own label and must look different from every other row.
    // One may be written for a single authoring form (`form`), as on the page.
    const withAuthored = (form: 'semantic' | 'attribute'): OptionInfo[] => [
      ...options,
      ...(examples[attr]?.examples || [])
        .filter((ex) => ex && ex.label && ex.source && (!ex.form || ex.form === form))
        .map((ex) => ({ label: ex.label!, exempt: (ex.visual === false ? 'non-visual' : '') as OptionInfo['exempt'], open: ex.visibleWhen === 'open' })),
    ];
    for (const form of ['semantic', 'attribute'] as const) {
      if (form === 'semantic' && !(host && usesHost(attr, host))) continue;
      const forForm = withAuthored(form);
      if (forForm.length >= 2) out.push({ token: attr, form, options: forForm });
    }
  }
  return out.sort((a, b) => a.token.localeCompare(b.token) || a.form.localeCompare(b.form));
}

async function openPanel(page: Page) {
  await page.goto('/?page=behaviors');
  await page.waitForSelector('#behaviors-search', { timeout: 20_000 });
  // The list fills from two fetches; the second rebuilds it, so wait for the
  // full list rather than the first handful of rows.
  await page.waitForFunction(
    () => document.querySelectorAll('.behaviors-search-results__row').length > 100,
    undefined,
    { timeout: 20_000 },
  );
}

type Finding = { clashes: string[]; unrendered: string[]; labels: string[] };

/** Render every option row of `token` and fingerprint what reached the screen. */
async function fingerprintOptions(page: Page, token: string, form: string, options: OptionInfo[]): Promise<Finding> {
  return page.evaluate(async ({ tok, frm, props, widgets, exempt, same, opens }) => {
    const WB = (window as unknown as { WB?: { whenIdle?: (o?: { timeout?: number }) => Promise<void> } }).WB;
    const frame = () => new Promise<void>((r) => requestAnimationFrame(() => r()));
    const stage = document.getElementById('behaviors-live-example')!;
    const codeNow = () => document.querySelector('#behaviors-live-code pre code');

    // Rows can contain links; a stray navigation destroys the page context
    // mid-sweep, which is the trap that made an earlier sweep flaky.
    const noNav = (e: Event) => {
      const a = (e.target as HTMLElement)?.closest?.('a');
      if (a) e.preventDefault();
    };
    document.addEventListener('click', noNav, true);

    /** Resolve once `cond` holds, checked every frame; false on timeout. */
    const until = async (cond: () => boolean, ms: number) => {
      const end = performance.now() + ms;
      while (!cond()) {
        if (performance.now() > end) return false;
        await frame();
      }
      return true;
    };

    const fingerprint = (root: Element, includeRoot = false) => {
      const parts: string[] = [];
      const origin = root.getBoundingClientRect();
      const at = (r: DOMRect) =>
        `${Math.round(r.left - origin.left)},${Math.round(r.top - origin.top)},${Math.round(r.width)}x${Math.round(r.height)}`;
      // Only what is ON SCREEN. getComputedStyle answers for a closed
      // <dialog> or a collapsed <details> body as readily as for anything
      // visible, so without this an option that only restyles something
      // hidden -- a dialog nobody has opened -- counted as a difference the
      // reader cannot see. checkVisibility() is false for display:none, for
      // content Chromium skips (a closed <details>), for visibility:hidden and
      // for opacity:0 (a closed drawer's backdrop).
      const els = ([...(includeRoot ? [root] : []), ...Array.from(root.querySelectorAll('*'))] as HTMLElement[])
        .filter((el) => el.checkVisibility({ visibilityProperty: true, opacityProperty: true }));
      for (const el of els) {
        const cs = getComputedStyle(el);
        const textNodes = Array.from(el.childNodes).filter((n) => n.nodeType === Node.TEXT_NODE && (n.textContent || '').trim());
        const text = textNodes.map((n) => (n.textContent || '').trim()).join(' ');
        // Where the words themselves sit: text-align moves them inside an
        // unchanged box.
        const textAt = textNodes.map((n) => {
          const range = document.createRange();
          range.selectNodeContents(n);
          return at(range.getBoundingClientRect());
        }).join(';');
        // A form field's visible text is its value or placeholder, not a
        // child text node.
        const field = el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement
          ? `${el.value}/${el.placeholder}` : '';
        const widget = el instanceof HTMLInputElement && widgets.includes(el.type)
          ? `${el.type}${el.checked ? ':checked' : ''}${el.indeterminate ? ':mixed' : ''}`
          // A media element's own controls are drawn by Chromium inside its
          // shadow root, out of getComputedStyle's reach: whether they are
          // shown, and the speaker they show muted or not.
          : el instanceof HTMLMediaElement && cs.display !== 'none'
            ? `${el.controls ? 'controls' : 'bare'}${el.controls && el.muted ? ':muted' : ''}` : '';
        const pseudo = ['::before', '::after'].map((p) => {
          const ps = getComputedStyle(el, p);
          return ps.content === 'none' || ps.content === 'normal'
            ? ''
            : [ps.content, ...props.map((q) => ps.getPropertyValue(q))].join(',');
        });
        parts.push([
          el.tagName, at(el.getBoundingClientRect()), text, textAt, field, widget,
          ...props.map((p) => cs.getPropertyValue(p)), ...pseudo,
        ].join('|'));
      }
      return parts.join('\n');
    };

    const rows = Array.from(document.querySelectorAll('.behaviors-search-results__row'))
      .filter((r) => (r as HTMLElement).dataset.browseToken === tok && (r as HTMLElement).dataset.variant
        && ((r as HTMLElement).dataset.form || 'attribute') === frm) as HTMLElement[];
    // fingerprint -> option labels
    const seen = new Map<string, string[]>();
    const unrendered: string[] = [];
    const labels: string[] = [];
    // #997: see the semantic-host wait below.
    let semanticRootReports = true;

    try {
      for (const row of rows) {
        const value = row.dataset.variant || '';
        const label = row.dataset.prop && row.dataset.prop !== 'variant'
          ? `${row.dataset.prop}=${value}` : value;
        labels.push(label);

        const prevCode = codeNow();
        row.click();
        // The render barrier: renderSource() builds a NEW code panel for every
        // selection (a superseded render drops out before building one) and
        // highlights it only after the stage has been scanned, so a new code
        // element carrying .hljs means THIS row's render is on screen.
        const rendered = await until(() => {
          const code = codeNow();
          return !!code && code !== prevCode && code.classList.contains('hljs')
            && stage.children.length > 0;
        }, 10_000);
        if (!rendered) { unrendered.push(label); continue; }
        // Idle means "nothing in flight", not "built": a host the runtime has
        // deferred to its viewport observer is not in flight YET, so under load
        // whenIdle() resolved before x-mdhtml had even started, and gfm=false
        // and sanitize=false both read as the same empty <div>. The row's own
        // hosts carry x-ready once their behavior has finished, so wait for
        // that first, then for whatever those behaviors started in turn.
        if (frm === 'attribute') {
          const hosts = Array.from(stage.querySelectorAll(`[${CSS.escape(tok)}]`));
          if (!(await until(() => hosts.every((h) => h.hasAttribute('x-ready')), 10_000))) {
            unrendered.push(`${label} (its ${tok} host never reported x-ready)`);
            continue;
          }
        } else {
          // #997: a semantic host carries no x-* attribute to wait on, and
          // rows that only change TEXT (header's title, footer's links) read
          // as identical when fingerprinted before the behavior had built
          // anything. Wait briefly for the root to report x-ready. Some roots
          // never carry it (an <input> the behavior wraps): the first time
          // the wait runs out, stop waiting for this behavior's other rows,
          // or a 30-row behavior spends its whole budget here.
          const root = stage.firstElementChild;
          if (root && semanticRootReports) {
            semanticRootReports = await until(() => root.hasAttribute('x-ready'), 3_000);
          }
        }
        // Behaviors attach asynchronously (module + stylesheet on first use).
        // #1246: on Windows CI (and on main's own CI, 6bb465df) x-progress never
        // settles: "progress (awaiting viewport)" -- the lazy runtime is still
        // waiting for an IntersectionObserver report that does not come. It
        // does not reproduce on Linux, so when it happens the failure carries
        // what the page looked like, to find the cause from the CI log alone.
        if (WB?.whenIdle) {
          try {
            await WB.whenIdle({ timeout: 20_000 });
          } catch (err) {
            const lazies = Array.from(stage.querySelectorAll('progress, [x-progress]')).map((el) => {
              const cs = getComputedStyle(el);
              const r = el.getBoundingClientRect();
              let hiddenBy = '';
              for (let a = el.parentElement; a; a = a.parentElement) {
                const acs = getComputedStyle(a);
                if (acs.display === 'none' || acs.contentVisibility === 'hidden') { hiddenBy = `${a.tagName.toLowerCase()}#${a.id}.${a.className}`; break; }
              }
              return `<${el.tagName.toLowerCase()} ${Array.from(el.attributes).map((x) => `${x.name}="${x.value}"`).join(' ')}> connected=${el.isConnected} display=${cs.display} visibility=${cs.visibility} cv=${cs.contentVisibility} rect=${Math.round(r.x)},${Math.round(r.y)},${Math.round(r.width)}x${Math.round(r.height)} ready=${el.hasAttribute('x-ready')} hiddenBy=${hiddenBy || '-'}`;
            });
            throw new Error(`${(err as Error).message}\n  [#1246 diagnostics] label=${label} visibility=${document.visibilityState} focus=${document.hasFocus()} viewport=${innerWidth}x${innerHeight} scrollY=${Math.round(scrollY)}\n  ${lazies.join('\n  ') || '(no progress elements in the stage)'}`);
          }
        }
        // And the example's images have arrived (loaded or failed). An image
        // still in flight is a 0x0 box, which is how x-cardimage's aspect=4/3
        // and aspect=21/9 once read as the same card: neither had its picture
        // yet. `complete` is the browser's own "done, either way" signal.
        const images = Array.from(stage.querySelectorAll('img')) as HTMLImageElement[];
        if (!(await until(() => images.every((img) => img.complete), 10_000))) {
          unrendered.push(`${label} (an image never finished loading)`);
          continue;
        }
        // Likewise its <video>/<audio> have reached the look they rest at. An
        // autoplay video is drawn at its poster's size until playback starts and
        // at its own frame's size after, so read before that and autoplay=true
        // is the same box as loop=true (Windows CI, #962: once whenIdle() lost
        // its 50ms quiet window, nothing else happened to cover the gap).
        // Autoplay rests once playing; any other media once its metadata is in;
        // either one once the browser has given up on it.
        const media = Array.from(stage.querySelectorAll('video, audio')) as HTMLMediaElement[];
        const atRest = (m: HTMLMediaElement) => !!m.error || m.networkState === HTMLMediaElement.NETWORK_NO_SOURCE
          || (m.autoplay ? !m.paused && m.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA
            : m.readyState >= HTMLMediaElement.HAVE_METADATA);
        if (!(await until(() => media.every(atRest), 10_000))) {
          unrendered.push(`${label} (a video or audio never loaded, played or failed)`);
          continue;
        }
        // x-typewriter types with timers, not animations, so finish() below
        // cannot end it: read early, "custom cursor" and "long sentence" were
        // both still near-empty and fingerprinted alike. Wait until no
        // typewriter's text has grown across 400ms (the slowest example types
        // a character every 150ms).
        const typed = () => Array.from(stage.querySelectorAll('.x-typewriter')).map((el) => (el.textContent || '').length).join(',');
        let lastTyped = typed();
        let typingSettled = !lastTyped;
        for (const end = performance.now() + 15_000; !typingSettled && performance.now() < end;) {
          await new Promise((r) => setTimeout(r, 400));
          const now = typed();
          typingSettled = now === lastTyped;
          lastTyped = now;
        }
        if (!typingSettled) {
          unrendered.push(`${label} (a typewriter never finished typing)`);
          continue;
        }
        // Freeze every animation at its start and let finite transitions end,
        // so the reading is the option's look, not a moment in its motion.
        const anims = stage.getAnimations({ subtree: true });
        await Promise.all(anims
          .filter((a) => a.effect?.getTiming().iterations !== Infinity)
          .map((a) => { a.finish(); return a.finished.catch(() => undefined); }));
        // Only the INFINITE ones are rewound. A finished animation that fills
        // forwards (x-cardhero's fade-in, `both`) is still listed, and
        // rewinding it put the hero's whole content back at opacity 0.
        stage.getAnimations({ subtree: true })
          .filter((a) => a.effect?.getTiming().iterations === Infinity)
          .forEach((a) => { a.pause(); a.currentTime = 0; });
        await frame();

        if (!stage.firstElementChild) { unrendered.push(label); continue; }
        // A non-visual option is rendered (it must still work) but has no
        // look to compare -- see the header.
        if (exempt[label] === 'non-visual') continue;
        // An option the schema marks `visibleWhen: "open"` styles an overlay
        // (a dialog's size, a menu's position) that is on screen only once
        // the example is used. Use it the way a reader does -- activate its
        // trigger -- and read what opens. A modal <dialog> is in the stage's
        // DOM but a trigger-mode one is not, so open dialogs are read
        // wherever they are.
        let opened = '';
        if (opens.includes(label)) {
          // Its visible trigger when it has one (a dialog's button, a menu's
          // toggle). A drawer opened from elsewhere on a real page -- x-notes
          // is toggled from the site's navbar -- has none in the example, so
          // its documented imperative API is the opener instead: show(), the
          // canonical verb (#782 retired open()).
          const trigger = (Array.from(stage.querySelectorAll('[aria-haspopup], button, [role="button"]')) as HTMLElement[])
            .find((el) => el.checkVisibility({ visibilityProperty: true, opacityProperty: true }));
          if (trigger) trigger.click();
          else {
            for (const el of Array.from(stage.querySelectorAll('*'))) {
              const api = Object.entries(el).find(([k, v]) => /^wb[A-Z]/.test(k) && typeof (v as { show?: unknown })?.show === 'function');
              if (api) { (api[1] as { show: () => void }).show(); break; }
            }
          }
          await frame();
          if (WB?.whenIdle) await WB.whenIdle({ timeout: 10_000 });
          await Promise.all(document.getAnimations()
            .filter((a) => a.effect?.getTiming().iterations !== Infinity)
            .map((a) => { a.finish(); return a.finished.catch(() => undefined); }));
          await frame();
          opened = Array.from(document.querySelectorAll('dialog[open]'))
            .filter((d) => !stage.contains(d))
            .map((d) => fingerprint(d, true)).join('\n--\n');
        }
        // The whole stage, not its first child: an example is often more than
        // one element (a trigger and its <dialog>; a filter box inserted
        // before its <table> or <select>), and the option may land on any of
        // them.
        const fp = fingerprint(stage) + (opened ? '\n--\n' + opened : '');
        // Close whatever was opened, so the next row starts from a page with
        // no modal over it.
        document.querySelectorAll('dialog[open]').forEach((d) => (d as HTMLDialogElement).close());
        if (!seen.has(fp)) seen.set(fp, []);
        seen.get(fp)!.push(label);
      }
    } finally {
      document.removeEventListener('click', noNav, true);
    }

    // A fingerprint shared by two or more REAL options is the defect; the
    // default collapsing onto one real option is expected.
    const clashes: string[] = [];
    for (const [, group] of seen) {
      // An alias counts once, as the option it names.
      const real = [...new Set(group.filter((l) => exempt[l] !== 'default').map((l) => same[l] || l))];
      if (real.length >= 2) clashes.push(`${tok} (${frm}): ${real.join(' = ')} render identically`);
    }
    return { clashes, unrendered, labels };
  }, {
    tok: token,
    frm: form,
    props: VISUAL_PROPS,
    widgets: NATIVE_WIDGETS,
    exempt: Object.fromEntries(options.map((o) => [o.label, o.exempt])),
    same: Object.fromEntries(options.filter((o) => o.same).map((o) => [o.label, o.same!])),
    opens: options.filter((o) => o.open).map((o) => o.label),
  });
}

test.describe('Showcase variants are visually distinct', () => {
  for (const { token, form, options } of behaviorsWithOptions()) {
    test(`${token} (${form}): no two options render identically`, async ({ page }) => {
      // Room for the 20s idle ceiling above on a starved CI runner (#1246).
      test.setTimeout(60_000);
      await openPanel(page);
      const findings = await fingerprintOptions(page, token, form, options);

      // One row per option, or the page and this file disagree about what the
      // behavior offers, and the comparison would pass vacuously -- and the
      // exemptions above would be looked up under the wrong labels.
      expect([...findings.labels].sort(), `${token} (${form}) should list exactly its schema's options`)
        .toEqual(options.map((o) => o.label).sort());
      expect(findings.unrendered, `${token}: these options never finished rendering`).toEqual([]);
      expect(
        findings.clashes,
        `${findings.clashes.length} option group(s) of ${token} render identically. Each is a ` +
        `row in the showcase promising a distinct look and delivering another row's -- ` +
        `the option's CSS is missing or never matched:\n  ` + findings.clashes.join('\n  '),
      ).toEqual([]);
    });
  }
});
