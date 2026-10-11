/**
 * doc-audience.mjs -- who each doc in docs/ is for (#1239).
 *
 * John: "I think we have way too many docs for casual users." Two audiences,
 * and no paid tier (decided 2026-10-10):
 *
 *   user        someone building a site. These, and only these, are listed in
 *               the Docs page catalog (docs/manifest.json and its "By date
 *               created" view).
 *   maintainer  everything else: status files, standards, agent docs,
 *               architecture, audits. Hidden from the catalog but NOT moved --
 *               sessions, CLAUDE.md, gates and scripts read them by path -- so
 *               each still opens by its direct doc-viewer URL.
 *
 * A doc is `user` when ANY of these holds:
 *
 *   1. it is in docs/guides/;
 *   2. it is docs/behaviors/<name>.md (or x-<name>.md) and <name> is a
 *      registered behavior -- a key of behaviorModules in
 *      src/wb-viewmodels/index.js, the registry the runtime loads from;
 *   3. a user-facing page in pages/ links to it. That covers the Introduction
 *      (#1244, pages/introduction.html), whose "where to go next" map IS the
 *      minimum set an evaluator needs. Every page in pages/ is user-facing
 *      except the ones in NON_USER_PAGES.
 *
 * Docs nothing references any more were moved to docs/archive/ (git mv, so
 * history survives). The archive is not a doc set: it is never scanned into a
 * manifest and never classified.
 *
 * Shared by scripts/update-docs-manifest.js (which writes `audience` onto every
 * entry of data/docs-manifest.json) and tests/compliance/docs-catalog-is-user-docs.spec.ts,
 * so the generator and the gate cannot disagree about the rule.
 */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

/** Archived docs live here; nothing under it is listed anywhere. */
export const ARCHIVE_DIR = 'docs/archive';

/**
 * Pages in pages/ that are not for a site builder, so their doc links do not
 * make a doc user-facing. Each with the reason.
 */
export const NON_USER_PAGES = {
  'ai-docs': 'how maintainers work with AI on the repo: it lists docs/claude/, which is maintainer material',
  'ai-permutation-test': 'test harness page',
  'newpage': 'page-builder template scaffold, not a page',
};

/** Every registered behavior name: the keys of behaviorModules. */
export async function registeredBehaviors(root) {
  const url = pathToFileURL(path.join(root, 'src', 'wb-viewmodels', 'index.js')).href;
  const { behaviorModules } = await import(url);
  return new Set(Object.keys(behaviorModules || {}));
}

/** The repo path (docs/....md) a page attribute value opens, or null. */
function docPathOf(value) {
  let target = value;
  try {
    const url = new URL(value, 'http://site.invalid/');
    const file = url.searchParams.get('file');
    target = file !== null ? file : decodeURIComponent(url.pathname);
  } catch { return null; }
  const rel = target.replace(/^(\.\/|\/)+/, '').replace(/^(\.\.\/)+/, '');
  return /^docs\/.+\.md$/.test(rel) ? rel : null;
}

/**
 * Doc -> the user-facing pages that link to it. Only real links count: an
 * href or src attribute, with HTML comments removed first (pages/introduction.html
 * NAMES docs/index.md in a comment; that is not a link).
 */
export function pageLinkedDocs(root) {
  const dir = path.join(root, 'pages');
  const out = new Map();
  for (const file of fs.readdirSync(dir).filter((f) => f.endsWith('.html')).sort()) {
    const page = file.replace(/\.html$/, '');
    if (Object.prototype.hasOwnProperty.call(NON_USER_PAGES, page)) continue;
    const html = fs.readFileSync(path.join(dir, file), 'utf8').replace(/<!--[\s\S]*?-->/g, '');
    for (const m of html.matchAll(/\b(?:href|src)\s*=\s*"([^"]*)"|\b(?:href|src)\s*=\s*'([^']*)'/g)) {
      const doc = docPathOf(m[1] ?? m[2]);
      if (!doc || !fs.existsSync(path.join(root, doc))) continue;
      if (!out.has(doc)) out.set(doc, new Set());
      out.get(doc).add(page);
    }
  }
  return out;
}

/** 'user' or 'maintainer' for one doc path (docs/...md), given the inputs above. */
export function audienceOf(docPath, behaviors, linked) {
  if (docPath.startsWith('docs/guides/')) return 'user';
  const behavior = docPath.match(/^docs\/behaviors\/([^/]+)\.md$/);
  if (behavior) {
    const name = behavior[1];
    if (behaviors.has(name) || behaviors.has(name.replace(/^x-/, ''))) return 'user';
  }
  if (linked.has(docPath)) return 'user';
  return 'maintainer';
}

/** docPath -> 'user' | 'maintainer' for every path given. */
export async function classifyDocs(root, docPaths) {
  const behaviors = await registeredBehaviors(root);
  const linked = pageLinkedDocs(root);
  return new Map(docPaths.map((p) => [p, audienceOf(p, behaviors, linked)]));
}
