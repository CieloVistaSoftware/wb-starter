import { test, expect } from '../fixtures/offline';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { extractDemoBlocks } from '../../scripts/lib/demo-blocks.mjs';

/**
 * Every documented example must actually render.
 *
 * John: "all of our .md docs with sample code must work" and, after finding a
 * table that rendered nothing: "run unit tests on all elements. They should
 * all work."
 *
 * Each docs/behaviors/<name>.md carries the example we tell people to copy.
 * This takes that exact markup -- not a simplified stand-in -- mounts it, and
 * asserts it produced something. A doc whose sample renders an empty box is
 * worse than no doc: it looks like the library is broken.
 *
 * WHAT COUNTS AS WORKING
 *
 *   the behavior attached (base class or built children), OR
 *   the host is visibly painted (real box with background/border/text)
 *
 * A behavior legitimately invisible until interaction (a toast trigger, a
 * dialog) still attaches, so attachment is the floor. What this catches is the
 * markup rendering as literally nothing -- the <table> case, where a JSON
 * `rows` attribute quoted with " inside a "-delimited attribute truncated at
 * the first inner quote and the element lost every attribute after it.
 */

const DOCS_DIR = 'docs/behaviors';

type Example = { name: string; html: string };

/**
 * The doc's first example: a live `<div x-demo>` block or a fenced html block,
 * whichever comes first. Docs lead with the live form now (a fence of plain
 * semantic HTML is never rendered by the viewer), so reading fences only would
 * silently skip every doc whose sample is the one a reader actually sees.
 */
function firstHtmlSample(md: string): string | null {
  const fence = /```html\n([\s\S]*?)```/.exec(md);
  const demo = extractDemoBlocks(md)[0] as { inner: string; start: number } | undefined;
  const useDemo = demo && (!fence || demo.start < fence.index);
  const raw = useDemo ? demo!.inner : fence?.[1];
  if (!raw) return null;
  const body = raw
    .split('\n')
    .filter((l) => !/^\s*<!--/.test(l))
    .join('\n')
    .trim();
  return body || null;
}

function loadExamples(): Example[] {
  const out: Example[] = [];
  let files: string[] = [];
  try { files = readdirSync(DOCS_DIR); } catch { return out; }
  for (const f of files) {
    if (!f.endsWith('.md')) continue;
    const name = f.replace(/\.md$/, '');
    let md: string;
    try { md = readFileSync(join(DOCS_DIR, f), 'utf8'); } catch { continue; }
    const html = firstHtmlSample(md);
    if (!html) continue;
    // Skip samples that are prose-about-markup rather than markup.
    if (!/<[a-z]/i.test(html)) continue;
    out.push({ name, html });
  }
  return out.sort((a, b) => a.name.localeCompare(b.name));
}

const EXAMPLES = loadExamples();

test('every documented behavior example renders something', async ({ page }) => {
  test.setTimeout(300_000);

  const pageErrors: string[] = [];
  page.on('pageerror', (e) => pageErrors.push(e.message));

  await page.goto('/demos/test-harness.html');
  await page.waitForFunction(() => (window as any).WB?.behaviors, { timeout: 20000 });

  const results = await page.evaluate(async (examples: Example[]) => {
    const WB = (window as any).WB;
    const out: any[] = [];

    for (const ex of examples) {
      const host = document.createElement('div');
      host.id = 'ex-probe';
      // Positioned and on-screen: the harness runs the LAZY runtime, and an
      // off-screen container never initializes, which reads as "broken".
      host.style.cssText = 'position:fixed;top:0;left:0;width:900px;z-index:9999';
      host.innerHTML = ex.html;
      document.body.appendChild(host);

      let threw = '';
      try {
        await WB.scan(host, { eager: true });
      } catch (e: any) {
        threw = String(e?.message || e);
      }
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      // #1383: judge the SETTLED look, not a frame of a transition. A bare
      // <input type="checkbox"> is already on screen when checkbox.js injects
      // its style, and `transition: all 0.2s` animates its border and
      // background in from 0 and transparent. Two frames on a busy CI runner
      // can land before any progress, so it measured 18x18 with no border and
      // no background -- "NOTHING" -- while passing everywhere else. Finite
      // transitions/animations are awaited; infinite ones (spinners, pulses)
      // never finish and are not waited on.
      const finite = host.getAnimations({ subtree: true })
        .filter((a) => a.effect?.getComputedTiming().iterations !== Infinity);
      await Promise.race([
        Promise.all(finite.map((a) => a.finished.catch(() => {}))),
        new Promise((r) => setTimeout(r, 3000)),
      ]);

      // The element the sample is really about: first child that carries an
      // x- attribute, else the first element.
      const els = Array.from(host.querySelectorAll<HTMLElement>('*'));
      const subject =
        els.find((e) => Array.from(e.attributes).some((a) => a.name.startsWith('x-'))) ||
        (host.firstElementChild as HTMLElement | null);

      if (!subject) {
        out.push({ name: ex.name, verdict: 'NO ELEMENT', threw });
        host.remove();
        continue;
      }

      const cs = getComputedStyle(subject);
      const r = subject.getBoundingClientRect();
      const text = (subject.textContent || '').trim();
      const attached =
        subject.className.includes('x-') ||
        subject.children.length > 0 ||
        subject.hasAttribute('x-schema');
      const painted =
        r.width > 0 && r.height > 0 &&
        (cs.backgroundColor !== 'rgba(0, 0, 0, 0)' ||
          parseFloat(cs.borderTopWidth) > 0 ||
          text.length > 0);

      out.push({
        name: ex.name,
        tag: subject.tagName.toLowerCase(),
        verdict: attached ? 'ATTACHED' : painted ? 'PAINTED' : 'NOTHING',
        kids: subject.children.length,
        w: Math.round(r.width),
        h: Math.round(r.height),
        threw,
      });
      host.remove();
    }
    return out;
  }, EXAMPLES);

  const dead = results.filter((r: any) => r.verdict === 'NOTHING' || r.verdict === 'NO ELEMENT');
  const threw = results.filter((r: any) => r.threw);

  writeFileSync(
    'data/documented-example-sweep.json',
    JSON.stringify({ total: results.length, dead: dead.length, threw: threw.length, results }, null, 2),
  );

  console.log(
    [
      '',
      `DOCUMENTED EXAMPLE SWEEP — ${results.length} behaviors`,
      `  working  ${results.length - dead.length}`,
      `  NOTHING  ${dead.length}`,
      `  threw    ${threw.length}`,
      '',
      ...dead.map((r: any) => `  ${r.name.padEnd(20)} <${r.tag}>  ${r.w}x${r.h}${r.threw ? '  ' + r.threw : ''}`),
      '',
    ].join('\n'),
  );

  // The sweep must have actually run.
  expect(EXAMPLES.length, 'no documented examples were parsed').toBeGreaterThan(40);

  expect(
    pageErrors,
    `mounting the documented examples raised page errors:\n${pageErrors.slice(0, 8).join('\n')}`,
  ).toHaveLength(0);

  expect(
    dead.map((r: any) => r.name),
    'these behaviors have a documented example that renders NOTHING — a reader ' +
    'copying it sees an empty box and concludes the library is broken',
  ).toEqual([]);
});
