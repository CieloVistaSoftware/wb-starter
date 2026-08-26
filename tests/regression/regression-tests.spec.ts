/**
 * REGRESSION TESTS - Bug Fix Verification
 * ========================================
 *
 * This file is the bug registry's own gate. It asserts that every entry in
 * data/bug-registry.json points at coverage that is REAL, and it carries the
 * one browser regression the registry names this file for.
 *
 * -------------------------------------------------------------------------
 * #869 -- what this file used to be
 * -------------------------------------------------------------------------
 * Commit d4278513 ("Consolidate demos, archive legacy behaviors files...",
 * Feb 17 2026) deleted builder.html and, in the same commit, stripped the
 * navigation out of all FIVE beforeEach hooks here while leaving every test
 * body behind:
 *
 *     -    await page.goto('http://localhost:3000/builder.html');
 *     -    await page.waitForFunction(() => typeof window['add'] === 'function');
 *     +    // TODO: Rewrite to use behaviors-showcase.html or standalone test page
 *
 * Every body drove the builder API -- document.getElementById('canvas') plus
 * window.add({ n, b, d }) -- so all 23 of them ran against about:blank, every
 * locator matched nothing, and every `if (await x.count() > 0)` guard silently
 * skipped its assertion. Six more were literally empty bodies.
 *
 * Worse, the contract they asserted is now INVERTED. They required `src` to
 * land in dataset.src and NOT be a native attribute on the container -- a
 * property of the removed builder's mkEl(). In v4 the native attribute IS the
 * supported authoring form: semantics/audio.js reads attr('src'),
 * semantics/video.js and feedback.js avatar() read element.getAttribute('src'),
 * and card.js's getAttr() reads options -> dataset -> getAttribute. So they
 * were deleted rather than revived, and the still-true half of what
 * BUG-2024-12-19-001 was about -- an authored src=/video-id= must actually
 * reach the media element the behavior renders -- was rewritten below against
 * a page that exists.
 *
 * -------------------------------------------------------------------------
 * RULE: Every bug fix MUST have a regression test. NO EXCEPTIONS.
 * -------------------------------------------------------------------------
 * A bug's test does NOT have to live in this file, and mostly should not --
 * one spec per bug is the pattern the repo has moved to. What must live here
 * is the cross-reference: BUG_SPEC_INDEX below names the spec for every bug,
 * and is asserted against the registry so neither can drift from the other.
 */

import { test, expect, type Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// ESM: no __dirname here (the repo is modules-only). Sibling regression specs
// (media-sources-are-remote.spec.ts) derive it the same way. Deriving it from
// this file rather than process.cwd() keeps it correct under -j8 workers.
const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, '..', '..');
const BUG_REGISTRY_PATH = path.join(ROOT, 'data/bug-registry.json');

interface Bug {
  id: string;
  title: string;
  dateFound: string;
  severity: string;
  status: string;
  component: string;
  function: string;
  description: string;
  rootCause: string;
  symptom: string;
  fix: { file: string; before: string; after: string };
  affectedComponents: string[];
  regressionTests: string[];
  testCases: string[];
}

interface BugRegistry {
  metadata: { totalBugs: number; testedBugs: number; untestedBugs: number };
  bugs: Bug[];
}

function loadBugRegistry(): BugRegistry {
  if (!fs.existsSync(BUG_REGISTRY_PATH)) {
    throw new Error('Bug registry not found! Create data/bug-registry.json');
  }
  return JSON.parse(fs.readFileSync(BUG_REGISTRY_PATH, 'utf-8'));
}

/**
 * Bug ID -> the spec files that actually exercise it.
 *
 * #869: this replaces six EMPTY test bodies -- each one declared with a title
 * like "lightbox: data-src reaches the rendered image" and a body of `{}`
 * -- whose comments claimed they existed "only to satisfy the bug-registry
 * cross-reference scan". They satisfied nothing: test-coverage-compliance.spec.ts
 * scans this file's TEXT for each bug ID, not for a test() call. A literal map
 * does that job, and unlike an empty test it can be CHECKED -- see the tests
 * below, which assert it matches the registry exactly and that every file it
 * names is real coverage (exists, asserts, and navigates if it drives a page).
 */
const BUG_SPEC_INDEX: Record<string, string[]> = {
  'BUG-2024-12-19-001': ['tests/components/audio.spec.ts', 'tests/regression/regression-tests.spec.ts'],
  'BUG-2025-12-26-001': ['tests/components/figure.spec.ts'],
  'BUG-2025-12-26-002': ['tests/components/audio.spec.ts'],
  'BUG-2026-07-27-001': ['tests/regression/lightbox-data-src.spec.ts'],
  'BUG-2026-07-27-002': ['tests/regression/alert-variant-class.spec.ts'],
  'BUG-2026-07-27-003': ['tests/regression/countdown-to-attribute.spec.ts'],
  'BUG-2026-07-27-004': ['tests/regression/youtube-id-attribute.spec.ts'],
  'BUG-2026-07-27-005': ['tests/regression/cardimage-lazy-load-false-negative.spec.ts'],
};

/**
 * Behavior named in some bug's affectedComponents -> a spec that exercises it.
 *
 * #869: test-coverage-compliance.spec.ts's "affected components have test
 * coverage" was passing for alert/avatar/cardimage/cardvideo/countdown/img/
 * lightbox/video/vimeo/youtube ONLY because its isInRegressionTests() found the
 * quoted behavior name somewhere in this file's text -- and the only place those
 * strings appeared was inside the dead builder test bodies. That is coverage by
 * coincidence. This map states the claim explicitly and the test below checks it.
 */
const COMPONENT_SPEC_INDEX: Record<string, string> = {
  'alert': 'tests/regression/alert-variant-class.spec.ts',
  'audio': 'tests/components/audio.spec.ts',
  'avatar': 'tests/regression/avatar-shape-and-size.spec.ts',
  'cardimage': 'tests/regression/cardimage-lazy-load-false-negative.spec.ts',
  'cardvideo': 'tests/cards/cards-comprehensive.spec.ts',
  'countdown': 'tests/regression/countdown-to-attribute.spec.ts',
  'figure': 'tests/components/figure.spec.ts',
  'img': 'tests/regression/image-failures-raise-runtime-errors.spec.ts',
  'lightbox': 'tests/regression/lightbox-data-src.spec.ts',
  'video': 'tests/behaviors/media-custom-tags-mapping.spec.ts',
  'vimeo': 'tests/regression/regression-tests.spec.ts',
  'youtube': 'tests/regression/youtube-id-attribute.spec.ts',
};

// =============================================================================
// META-TEST: Ensure all bugs have tests
// =============================================================================
test.describe('Bug Registry Compliance', () => {
  test('all bugs in registry have regression tests listed', () => {
    const registry = loadBugRegistry();
    const issues: string[] = [];

    for (const bug of registry.bugs) {
      if (!bug.regressionTests || bug.regressionTests.length === 0) {
        issues.push(`${bug.id}: No regression tests listed`);
      }
      if (!bug.testCases || bug.testCases.length === 0) {
        issues.push(`${bug.id}: No test cases documented`);
      }
    }

    expect(issues, `Bugs without tests:\n${issues.join('\n')}`).toEqual([]);
  });

  test('bug registry metadata is accurate', () => {
    const registry = loadBugRegistry();

    const actualTotal = registry.bugs.length;
    const actualTested = registry.bugs.filter(b =>
      b.regressionTests && b.regressionTests.length > 0
    ).length;
    const actualUntested = actualTotal - actualTested;

    expect(registry.metadata.totalBugs).toBe(actualTotal);
    expect(registry.metadata.testedBugs).toBe(actualTested);
    expect(registry.metadata.untestedBugs).toBe(actualUntested);
  });

  test('no untested bugs allowed', () => {
    const registry = loadBugRegistry();
    expect(registry.metadata.untestedBugs, 'All bugs must have tests').toBe(0);
  });

  test('BUG_SPEC_INDEX names every bug in the registry, and nothing else', () => {
    const registry = loadBugRegistry();
    const inRegistry = registry.bugs.map(b => b.id).sort();
    const indexed = Object.keys(BUG_SPEC_INDEX).sort();

    expect(
      indexed,
      'BUG_SPEC_INDEX has drifted from data/bug-registry.json. Add the new bug ID\n'
      + 'here with the spec that covers it (or drop the stale one). The literal IDs\n'
      + 'in this file are also what test-coverage-compliance.spec.ts scans for.',
    ).toEqual(inRegistry);

    for (const bug of registry.bugs) {
      expect(
        BUG_SPEC_INDEX[bug.id].slice().sort(),
        `${bug.id}: BUG_SPEC_INDEX disagrees with the registry's regressionTests`,
      ).toEqual(bug.regressionTests.slice().sort());
    }
  });

  /**
   * The check that would have caught THIS file (#869, and all-components.spec.ts
   * before it in #863). A registry entry pointing at a spec is worth exactly as
   * much as that spec's ability to fail.
   */
  test('every spec a bug names is real coverage, not an empty shell', () => {
    const registry = loadBugRegistry();
    const problems: string[] = [];

    for (const bug of registry.bugs) {
      for (const spec of bug.regressionTests) {
        const abs = path.join(ROOT, spec);
        if (!fs.existsSync(abs)) {
          problems.push(`${bug.id}: ${spec} does not exist`);
          continue;
        }
        const src = fs.readFileSync(abs, 'utf-8');

        // expect.poll( / expect.soft( count too -- poll is the CORRECT form for
        // anything that hydrates asynchronously.
        if (!/expect\s*[.(]/.test(src)) {
          problems.push(`${bug.id}: ${spec} contains no expect() -- it cannot fail`);
        }

        // A spec that drives a page but never navigates runs on about:blank.
        const drivesPage = /\bpage\.(locator|getByRole|getByText|getByTestId|evaluate|click)\b/.test(src);
        if (drivesPage && !/\.goto\s*\(|setContent\s*\(/.test(src)) {
          problems.push(`${bug.id}: ${spec} drives a page but never navigates (about:blank)`);
        }
      }
    }

    expect(
      problems,
      'A bug is only "tested" if the spec named for it can actually fail:\n\n'
      + problems.join('\n'),
    ).toEqual([]);
  });

  test('every component a bug affects is named by a spec that exists and exercises it', () => {
    const registry = loadBugRegistry();
    const problems: string[] = [];
    const affected = new Set<string>();
    for (const bug of registry.bugs) for (const c of bug.affectedComponents || []) affected.add(c);

    for (const behavior of [...affected].sort()) {
      const spec = COMPONENT_SPEC_INDEX[behavior];
      if (!spec) {
        problems.push(`"${behavior}" is affected by a registered bug but has no COMPONENT_SPEC_INDEX entry`);
        continue;
      }
      const abs = path.join(ROOT, spec);
      if (!fs.existsSync(abs)) {
        problems.push(`"${behavior}" -> ${spec} does not exist`);
        continue;
      }
      if (!fs.readFileSync(abs, 'utf-8').includes(behavior)) {
        problems.push(`"${behavior}" -> ${spec} never mentions "${behavior}"`);
      }
    }

    expect(problems, `Affected components without real coverage:\n${problems.join('\n')}`).toEqual([]);
  });
});

// =============================================================================
// BUG-2024-12-19-001: an authored src=/video-id= must reach the rendered media
// =============================================================================
/**
 * RESTORED (#869). The registry names this file as one of this bug's
 * regressionTests, so the browser coverage lives here rather than being pushed
 * into a new spec.
 *
 * The original tests asserted the removed builder's routing rule (src into
 * dataset, never a native attribute). That rule died with builder.html. What
 * survives -- and is what the bug's SYMPTOM actually was, a media element that
 * renders empty because the value never arrived -- is: whatever you author on
 * the host has to end up on the element the behavior builds.
 *
 * Vehicle: demos/test-harness.html, the same one tests/regression/
 * youtube-id-attribute.spec.ts uses. It boots WB, and carries
 * data-x-expected-errors so an unreachable media URL cannot pollute the shared
 * error log for whatever else is running alongside it under -j8.
 */

// A 1x1 data-URI GIF, the same fixture tests/behaviors/media-custom-tags-mapping.spec.ts
// uses. It always decodes, instantly, with no network involved -- and that
// matters here specifically: attachImageLoadRetry()
// (src/wb-viewmodels/media-load-retry.js) cache-busts a FAILED image by
// rewriting src to `<src>?_retry=<timestamp>`, i.e. it mutates the very
// attribute under assertion. A remote host having a bad minute would surface
// as a mysterious flake in this file rather than as the network problem it is.
const IMAGE_SRC =
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBTAA7';
// Audio/video keep remote URLs per #762 (media-sources-are-remote). Safe to do
// here where an image is not: attachVideoLoadRetry() retries via el.load(),
// which does not touch src, and audio() has no retry that rewrites it either.
const AUDIO_SRC = 'https://www.w3schools.com/html/horse.mp3';
const VIDEO_SRC = 'https://www.w3schools.com/html/mov_bbb.mp4';
const VIMEO_ID = '76979871';

interface RoutingCase {
  /** behavior name, as it appears in a bug's affectedComponents */
  behavior: string;
  /** what an author writes */
  markup: string;
  /** the element the behavior is expected to build (relative to the host) */
  rendered: string;
  /** the value that must arrive on it */
  expected: string | RegExp;
  /** attribute to read on the rendered element */
  attribute: string;
  why: string;
}

const ROUTING_CASES: RoutingCase[] = [
  {
    behavior: 'audio',
    markup: `<div x-audio src="${AUDIO_SRC}"></div>`,
    rendered: 'audio',
    attribute: 'src',
    expected: AUDIO_SRC,
    why: 'semantics/audio.js builds a real <audio> child for a non-<audio> host',
  },
  {
    behavior: 'video',
    markup: `<div x-video src="${VIDEO_SRC}"></div>`,
    rendered: 'video',
    attribute: 'src',
    expected: VIDEO_SRC,
    why: 'semantics/video.js builds a real <video> child for a non-<video> host',
  },
  {
    behavior: 'avatar',
    markup: `<span x-avatar src="${IMAGE_SRC}" name="John Peters"></span>`,
    rendered: 'img',
    attribute: 'src',
    expected: IMAGE_SRC,
    why: 'feedback.js avatar() renders an <img> when a src is present, initials when it is not',
  },
  {
    behavior: 'cardimage',
    markup: `<article x-cardimage src="${IMAGE_SRC}" title="Routing"></article>`,
    rendered: 'img',
    attribute: 'src',
    expected: IMAGE_SRC,
    why: "card.js cardimage() reads src via getAttr() (options -> dataset -> getAttribute)",
  },
  {
    behavior: 'cardvideo',
    markup: `<article x-cardvideo src="${VIDEO_SRC}" title="Routing"></article>`,
    rendered: 'video',
    attribute: 'src',
    expected: VIDEO_SRC,
    why: 'card.js cardvideo() reads src via the same getAttr() chain',
  },
  {
    behavior: 'vimeo',
    // video-id, not id: semantics/vimeo.js reads ONLY getAttribute('video-id').
    // The plain id= spelling that #377 fixed for youtube is still unhandled
    // here -- filed separately, noted in #869.
    markup: `<div x-vimeo video-id="${VIMEO_ID}"></div>`,
    rendered: 'iframe',
    attribute: 'src',
    expected: new RegExp(`player\\.vimeo\\.com/video/${VIMEO_ID}\\b`),
    why: 'semantics/vimeo.js embeds the id into the player URL',
  },
  {
    behavior: 'img',
    // The one case the deleted tests had right: a REAL media element keeps its
    // native src. semantics/img.js enhances the <img> in place.
    markup: `<img x-img src="${IMAGE_SRC}" alt="Routing">`,
    rendered: '',
    attribute: 'src',
    expected: IMAGE_SRC,
    why: 'semantics/img.js enhances the host <img> itself -- no child is built',
  },
];

/**
 * WB.scan() is async, and under -j8 the module graph can take a while to
 * settle. Everything after this uses retrying matchers -- a one-shot
 * `await locator.count()` does not retry and is exactly how a loaded machine
 * turns a real assertion into a coin flip.
 */
async function injectAndScan(page: Page, containerId: string, markup: string): Promise<void> {
  await page.goto('/demos/test-harness.html');
  await page.waitForFunction(
    () => {
      const wb = (window as any).WB;
      return wb && wb.behaviors && Object.keys(wb.behaviors).length > 0;
    },
    { timeout: 30000 },
  );
  await page.evaluate(({ id, html }) => {
    const container = document.createElement('div');
    container.id = id;
    container.innerHTML = html;
    document.body.appendChild(container);
  }, { id: containerId, html: markup });
  await page.evaluate(
    async (id) => await (window as any).WB.scan(document.getElementById(id), { eager: true }),
    containerId,
  );
}

test.describe('BUG-2024-12-19-001: an authored src reaches the rendered media element', () => {
  for (const c of ROUTING_CASES) {
    test(`${c.behavior}: authored ${c.attribute} arrives on the rendered <${c.rendered || 'host'}>`, async ({ page }) => {
      const containerId = `routing-${c.behavior}`;
      await injectAndScan(page, containerId, c.markup);

      const host = page.locator(`#${containerId} [x-${c.behavior}]`);
      await expect(host, `${c.behavior}: the host element should still be in the DOM after scan`).toHaveCount(1);

      const target = c.rendered ? host.locator(c.rendered) : host;
      await expect(
        target,
        `${c.behavior}: ${c.why}. An empty box here is the exact symptom BUG-2024-12-19-001 reported.`,
      ).toHaveCount(1);

      await expect(
        target,
        `${c.behavior}: the authored ${c.attribute}="${String(c.expected)}" never reached the rendered element.`,
      ).toHaveAttribute(c.attribute, c.expected);
    });
  }

  /**
   * The negative half of the same contract, and the reason the old
   * "src must NOT be a native attribute" assertion existed at all: a container
   * that merely COPIES the attribute onto itself, without building anything,
   * looks identical to a working one in a shallow test. Assert the host is not
   * left empty.
   */
  test('a container behavior builds real media, it does not just hold the attribute', async ({ page }) => {
    await injectAndScan(page, 'routing-container', `<div x-video src="${VIDEO_SRC}"></div>`);

    const host = page.locator('#routing-container [x-video]');
    await expect(host).toHaveClass(/\bx-video\b/);

    // A <div> is not a media element: the value on the host alone plays nothing.
    // The behavior must have produced a real <video> child.
    await expect(host.locator('video'), 'a <div x-video> must build a real <video> child').toHaveCount(1);
    await expect
      .poll(
        async () => host.evaluate(el => el.querySelector('video') instanceof HTMLVideoElement),
        { message: 'the child must be a genuine HTMLVideoElement, not a lookalike div' },
      )
      .toBe(true);
  });
});
