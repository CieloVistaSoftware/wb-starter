import { test, expect } from '../fixtures/offline';
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

/**
 * #1169: a doc example went live only with a wb- tag or an x-* attribute, so
 * an example written the 4.x way -- plain semantic HTML -- was never shown
 * working, and a doc with only such markup never loaded the runtime.
 * isLiveExample() (src/core/behavior-markup.js) now answers from the registry.
 *
 * #1197: that same rule would have run every BAD / WRONG / "DOM becomes"
 * illustration, so those fences are html-static: highlighted, never run
 * (DEMOS-AND-DOCS-STANDARDS section 1a).
 */
const FENCE = String.fromCharCode(96).repeat(3);
const ILLUSTRATION = /\bBAD\b|WRONG|NEVER|DOM becomes|❌/;

async function behaviorMarkup() {
  return import(pathToFileURL(path.resolve('src/core/behavior-markup.js')).href);
}

function fences(doc: string) {
  const out: { line: number; lang: string; source: string }[] = [];
  let open: { line: number; lang: string } | null = null;
  let buf: string[] = [];
  fs.readFileSync(doc, 'utf8').split(/\r?\n/).forEach((l, i) => {
    const t = l.trim();
    if (!open && t.startsWith(FENCE)) { open = { line: i + 1, lang: t.slice(3).trim().split(/\s+/)[0] }; buf = []; }
    else if (open && t === FENCE) { out.push({ ...open, source: buf.join('\n') }); open = null; }
    else if (open) buf.push(l);
  });
  return out;
}

test('no illustration fence in the docs renders live (#1197)', async () => {
  const { isLiveExample } = await behaviorMarkup();
  const docs = execSync('git ls-files "*.md"', { encoding: 'utf8' }).split(/\n/).filter((f) => f && !f.startsWith('archive/'));
  const live: string[] = [];
  for (const doc of docs) {
    for (const f of fences(doc)) {
      if (ILLUSTRATION.test(f.source) && isLiveExample({ language: f.lang, source: f.source })) {
        live.push(`${doc}:${f.line} (${f.source.match(ILLUSTRATION)![0]})`);
      }
    }
  }
  expect(live, 'BAD/WRONG/DOM-becomes fences that would run; fence them html-static').toEqual([]);
});

test('the registry decides what is live (#1169)', async () => {
  const { isLiveExample, highlightLanguage, UNREADABLE_NATIVE_SELECTORS } = await behaviorMarkup();
  expect(UNREADABLE_NATIVE_SELECTORS, 'every nativeMap selector is understood').toEqual([]);
  expect(isLiveExample({ language: 'html', source: '<article title="Hi">Body</article>' }), 'a semantic tag').toBe(true);
  expect(isLiveExample({ language: 'html', source: '<details><summary>More</summary>Text</details>' })).toBe(true);
  expect(isLiveExample({ language: 'html', source: '<div x-ripple>Tap</div>' }), 'an x-* behavior').toBe(true);
  expect(isLiveExample({ language: 'html', source: '<p>Just text</p>' }), 'markup reaching no behavior').toBe(false);
  expect(isLiveExample({ language: 'js', source: 'const a = 1;' })).toBe(false);
  expect(isLiveExample({ language: 'html-static', source: '<article>Bad</article>' }), 'an illustration').toBe(false);
  expect(highlightLanguage('html-static')).toBe('html');
});

test('a doc whose only live markup is a semantic tag renders it live and boots WB (#1169)', async ({ page }) => {
  // docs/ authors its examples as x-demo blocks now (#307), so this fixture
  // carries the plain html fences the doc viewer turns into live demos.
  const doc = 'tests/fixtures/doc-viewer-semantic-fences.md';
  const semanticOnly = fences(doc).find((f) => f.lang === 'html' && /<article\b/.test(f.source) && !/\sx-/.test(f.source));
  expect(semanticOnly, `${doc} has an html fence that is a plain <article>`).toBeTruthy();

  await page.goto(`/public/doc-viewer.html?file=${encodeURIComponent(doc)}`);
  await page.waitForFunction(() => Boolean((window as any).WB), null, { timeout: 20000 });
  // Every html fence holding an <article> is a live demo -- the plain one too,
  // not only the one that also carries an x-* attribute.
  const articleFences = fences(doc).filter((f) => f.lang === 'html' && /<article\b/.test(f.source)).length;
  expect(articleFences, 'the doc still has both article fences').toBeGreaterThanOrEqual(2);
  const liveArticleDemos = page.locator('#content [x-demo]').filter({ has: page.locator('article') });
  await expect(liveArticleDemos, 'each <article> fence renders as a live demo').toHaveCount(articleFences, { timeout: 15000 });
});
