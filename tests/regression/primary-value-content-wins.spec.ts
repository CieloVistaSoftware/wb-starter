import { test, expect, type Page } from '../fixtures/offline';
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * #417 — a behavior's PRIMARY value can be written two ways, and when both are
 * given the CONTENT between the tags wins. The attribute is the fallback.
 *
 * Two opposite rules were shipping: x-badge let the text win over `label`,
 * x-cardtestimonial let `quote` win over the text, and many behaviors (x-stat,
 * x-empty, x-divider, x-avatar, x-spinner, x-stepper, x-radio, ...) wiped the
 * text unread. The rule is now one rule, written in
 * docs/architecture/standards/ATTRIBUTE-NAMING-STANDARD.md ("Primary Value:
 * Content Wins") and implemented through src/core/author-content.js.
 *
 * PRIMARY_VALUES below is the table this spec is driven by. The doc carries the
 * same table; the last test fails when the two drift apart.
 *
 * For every row, in a real browser on the wb-lazy runtime:
 *   attribute only -> shows the attribute
 *   text only      -> shows the text
 *   both           -> shows the text, and the attribute's value is not shown
 */

type Row = {
  /** behavior name: the host carries `x-<behavior>` */
  behavior: string;
  /** its primary attribute */
  attr: string;
  /** host tag (default div) */
  tag?: string;
  /** other attributes the host needs */
  extra?: string;
  /** numeric primary: sample values are numbers */
  numeric?: boolean;
  /** JS expression over the host `h` giving what the reader sees (default: h.innerText) */
  read?: string;
  /** markup for the text form, given the text (default: the text itself) */
  body?: (text: string) => string;
  /** markup the attribute-only form still needs inside the host */
  empty?: string;
  /** the value animates in (typewriter, countup): wait until each host shows its final value */
  animated?: boolean;
};

const text = (sel: string) => `(h.querySelector(${JSON.stringify(sel)})?.innerText ?? '')`;

const PRIMARY_VALUES: Row[] = [
  { behavior: 'badge', attr: 'label', tag: 'span' },
  { behavior: 'pill', attr: 'label', tag: 'span' },
  { behavior: 'button', attr: 'label', tag: 'button' },
  { behavior: 'chip', attr: 'label', tag: 'span', read: text('.x-chip__label') },
  { behavior: 'alert', attr: 'message', read: text('.x-alert__message') },
  { behavior: 'spinner', attr: 'label', read: `h.getAttribute('aria-label')` },
  { behavior: 'avatar', attr: 'initials', tag: 'span' },
  { behavior: 'divider', attr: 'text' },
  { behavior: 'stat', attr: 'value', extra: 'label="Users"', read: text('.x-stat__value') },
  { behavior: 'empty', attr: 'message', read: text('.x-empty__message') },
  { behavior: 'link', attr: 'text', tag: 'a', extra: 'href="#top"' },
  // typewriter, countup, confetti, fireworks, snow and stagelight moved to WB Pro (#1953).
  { behavior: 'print', attr: 'label', tag: 'button' },
  { behavior: 'share', attr: 'label', tag: 'button' },
  { behavior: 'fullscreen', attr: 'label', tag: 'button' },
  { behavior: 'clipboard', attr: 'label', tag: 'button' },
  { behavior: 'scroll', attr: 'label', tag: 'button' },
  { behavior: 'checkbox', attr: 'label', read: text('.x-checkbox__label') },
  { behavior: 'switch', attr: 'label', read: text('[class*="x-switch__label"]') },
  { behavior: 'radio', attr: 'label' },
  { behavior: 'input', attr: 'value', read: `h.querySelector('input')?.value` },
  { behavior: 'textarea', attr: 'value', read: `h.querySelector('textarea')?.value` },
  { behavior: 'progress', attr: 'value', numeric: true, read: `h.closest('[role=progressbar]')?.getAttribute('aria-valuenow') ?? h.parentElement.querySelector('[role=progressbar]')?.getAttribute('aria-valuenow')` },
  { behavior: 'rating', attr: 'value', numeric: true, tag: 'span', read: `String(h.wbRating?.getValue())` },
  { behavior: 'stepper', attr: 'value', numeric: true, read: text('.x-stepper__value') },
  {
    behavior: 'floatinglabel', attr: 'label', read: text('label'),
    body: (t) => `<label>${t}</label><input>`, empty: '<input>',
  },
  { behavior: 'cardtestimonial', attr: 'quote', read: text('.x-card__quote') },
  { behavior: 'cardnotification', attr: 'message', read: text('.x-cardnotification__message') },
  // Every card's body: #968's `content`, the content between the tags.
  ...[
    'card', 'cardbutton', 'carddraggable', 'cardexpandable', 'cardfile', 'cardhero',
    'cardhorizontal', 'cardimage', 'cardlink', 'cardminimizable', 'cardoverlay',
    'cardportfolio', 'cardpricing', 'cardproduct', 'cardprofile', 'cardstats', 'cardvideo',
  ].map((behavior): Row => ({ behavior, attr: 'content' })),
];

const FIXTURE = '/tests/fixtures/blank.html';

type Seen = { attrOnly: string; textOnly: string; both: string; bothAll: string };

/** Both runtimes: wb-lazy.js (the site) and wb.js; several behaviors build differently under each. */
const RUNTIMES = ['wb-lazy', 'wb'] as const;
type Runtime = typeof RUNTIMES[number];

async function render(page: Page, runtime: Runtime, row: Row, a: string, t: string): Promise<Seen> {
  const tag = row.tag || 'div';
  const open = (attrs: string) => `<${tag} x-${row.behavior} ${row.extra || ''} ${attrs}>`;
  const close = `</${tag}>`;
  const body = row.body ? row.body(t) : t;
  const markup = {
    attrOnly: `${open(`${row.attr}="${a}"`)}${row.empty || ''}${close}`,
    textOnly: `${open('')}${body}${close}`,
    both: `${open(`${row.attr}="${a}"`)}${body}${close}`,
  };
  await page.goto(FIXTURE, { waitUntil: 'domcontentloaded' });
  return page.evaluate(async ({ runtime, markup, read, animated, a, t }) => {
    const mod: any = await import(`/src/core/${runtime}.js`);
    const WB = mod.default || mod.WB;
    if (runtime === 'wb') await WB.init({ autoInject: true });
    const reader = new Function('h', `return ${read}`) as (h: HTMLElement) => unknown;
    const stage = document.createElement('div');
    stage.style.cssText = 'width: 640px;';
    document.body.prepend(stage);
    const hosts: Record<string, HTMLElement> = {};
    for (const [k, html] of Object.entries(markup)) {
      const wrap = document.createElement('div');
      wrap.innerHTML = html;
      stage.appendChild(wrap);
      hosts[k] = wrap.firstElementChild as HTMLElement;
    }
    await WB.scan(stage, { eager: true });
    await WB.settled({ timeout: 10000 });
    // A behavior may replace or wrap its host (x-switch, x-radio, x-progress);
    // read the wrapper the host now lives in when it left the page.
    const live = (k: string) => (hosts[k].isConnected ? hosts[k] : stage.children[Object.keys(hosts).indexOf(k)] as HTMLElement);
    const see = (k: string) => String(reader(live(k)) ?? '').trim();
    if (animated) {
      // The value types or counts in after the behavior settles. Wait for the
      // condition itself -- each host showing the value it should end on --
      // frame by frame, up to a deadline; a broken behavior never gets there
      // and the assertions below report what it showed instead.
      const deadline = performance.now() + 5000;
      const done = () => see('attrOnly').includes(a) && see('textOnly').includes(t) && see('both').includes(t);
      while (!done() && performance.now() < deadline) {
        await new Promise((r) => requestAnimationFrame(() => r(null)));
      }
    }
    const out = {
      attrOnly: see('attrOnly'),
      textOnly: see('textOnly'),
      both: see('both'),
      bothAll: ((live('both').parentElement as HTMLElement).innerText || '').trim(),
    };
    stage.remove();
    return out;
  }, { runtime, markup, read: row.read || 'h.innerText', animated: !!row.animated, a, t });
}

test.describe('primary value: content wins, the attribute is the fallback (#417)', () => {
  for (const runtime of RUNTIMES) for (const row of PRIMARY_VALUES) {
    test(`${runtime}: x-${row.behavior} ${row.attr}`, async ({ page }) => {
      const A = row.numeric ? '3' : 'FROMATTR';
      const T = row.numeric ? '4' : 'FROMTEXT';
      const seen = await render(page, runtime, row, A, T);

      expect(seen.attrOnly, `x-${row.behavior}: ${row.attr}="${A}" alone must show it`).toContain(A);
      expect(seen.textOnly, `x-${row.behavior}: text alone must show it`).toContain(T);
      expect(seen.both, `x-${row.behavior}: with both, the text wins`).toContain(T);
      expect(seen.both, `x-${row.behavior}: with both, the ${row.attr} attribute must not be shown`).not.toContain(A);
      if (!row.numeric) {
        expect(seen.bothAll, `x-${row.behavior}: the losing ${row.attr} must not render anywhere`).not.toContain(A);
      }
    });
  }

  test('a re-scan does not take what the behavior built for author content', async ({ page }) => {
    // The trap the issue names: a behavior that builds children must not read
    // them back as the author's text when it runs again on the same element.
    await page.goto(FIXTURE, { waitUntil: 'domcontentloaded' });
    const after = await page.evaluate(async () => {
      const mod: any = await import('/src/core/wb-lazy.js');
      const WB = mod.default || mod.WB;
      const stage = document.createElement('div');
      // The text form: after the first run the host holds the built parts
      // (the quote mark, the author line, the label, the icon), and a naive
      // re-read of textContent takes all of them for the author's text.
      stage.innerHTML =
        '<div id="t" x-cardtestimonial author="Ada" role="Engineer">Q</div>' +
        '<div id="s" x-stat label="Users">7</div>' +
        '<div id="e" x-empty>Nothing here</div>' +
        '<span id="c" x-chip icon="*" dismissible>Tag</span>';
      document.body.appendChild(stage);
      await WB.scan(stage, { eager: true });
      await WB.settled({ timeout: 10000 });
      for (const [id, name] of [['t', 'cardtestimonial'], ['s', 'stat'], ['e', 'empty'], ['c', 'chip']]) {
        const el = document.getElementById(id)!;
        WB.remove(el, name);
        await WB.inject(el, name);
      }
      await WB.settled({ timeout: 10000 });
      const q = (s: string) => (document.querySelector(s) as HTMLElement | null)?.innerText.trim();
      return {
        quote: q('#t .x-card__quote'), stat: q('#s .x-stat__value'),
        empty: q('#e .x-empty__message'), chip: q('#c .x-chip__label'),
      };
    });
    expect(after.quote, 'the second run must quote the author, not its own built card').toBe('Q');
    expect(after.stat).toBe('7');
    expect(after.empty).toBe('Nothing here');
    expect(after.chip).toBe('Tag');
  });

  test('the doc table and PRIMARY_VALUE_ATTRIBUTE list exactly the behaviors this spec checks', async () => {
    const { PRIMARY_VALUE_ATTRIBUTE } = await import('../../src/core/author-content.js');
    const doc = readFileSync(join(process.cwd(), 'docs/architecture/standards/ATTRIBUTE-NAMING-STANDARD.md'), 'utf8');
    const start = doc.indexOf('## Primary Value: Content Wins');
    expect(start, 'ATTRIBUTE-NAMING-STANDARD.md must have a "Primary Value: Content Wins" section').toBeGreaterThan(-1);
    const section = doc.slice(start, doc.indexOf('\n## ', start + 5));
    // Rows look like: | `x-badge` | `label` |
    const inDoc = new Set<string>();
    for (const m of section.matchAll(/^\|\s*([^|]+?)\s*\|\s*`([a-z]+)`[^|]*\|/gm)) {
      for (const b of m[1].matchAll(/`x-([a-z]+)`/g)) inDoc.add(`${b[1]}:${m[2]}`);
    }
    const inSpec = new Set(PRIMARY_VALUES.map((r) => `${r.behavior}:${r.attr}`));
    expect([...inSpec].filter((k) => !inDoc.has(k)), 'checked here but missing from the doc table').toEqual([]);
    expect([...inDoc].filter((k) => !inSpec.has(k)), 'in the doc table but not checked here').toEqual([]);
    // The runtime's copy (scripts/generate-site.mjs reads it to keep demo
    // placeholders from overriding a demo's primary attribute).
    const inModule = new Set(Object.entries(PRIMARY_VALUE_ATTRIBUTE).map(([b, a]) => `${b}:${a}`));
    expect([...inSpec].filter((k) => !inModule.has(k)), 'missing from PRIMARY_VALUE_ATTRIBUTE').toEqual([]);
    expect([...inModule].filter((k) => !inSpec.has(k)), 'in PRIMARY_VALUE_ATTRIBUTE but not checked here').toEqual([]);
  });
});
