import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

/**
 * TEST AUDIT — Dimension 1 of 4: "do all refs render properly?" (John,
 * docs/_today/test-audit-2026-08-14.md). "Refs" here means navigational
 * `<a href="...">` links (HTML) and Markdown `[text](url)` / raw `<a
 * href="...">` links (.md docs) — every OTHER src/href class already has
 * its own dedicated gate and is intentionally OUT of scope here:
 *   - `<img>`/`<audio>`/`<video>`/`<source>` src: docs-live-media-assets-
 *     exist.spec.ts (docs) and x-audio-has-resolvable-src.spec.ts (audio
 *     specifically, demos+pages+docs).
 *   - `<script src>`: es-modules.spec.ts / critical-scripts.spec.ts.
 *   - domain-absolute asset paths: no-absolute-asset-paths.spec.ts,
 *     no-absolute-nav-links.spec.ts, no-absolute-resource-paths.spec.ts.
 *
 * SCOPE: demos/**\/*.html, pages/**\/*.html, public/**\/*.html, docs/**\/*.md,
 * README.md, CONTRIBUTING.md.
 *
 * RESOLUTION RULES (mirrors docs-live-media-assets-exist.spec.ts's
 * convention for consistency across the two "does this ref exist" gates):
 *   - External refs (http(s)://, //, mailto:, tel:, javascript:, data:) are
 *     OUT OF SCOPE -- asserting on them puts the network in the compliance
 *     suite (flaky) or is meaningless (mailto/tel/js: aren't files).
 *   - `/public/doc-viewer.html?file=<encoded path>` (the doc-viewer's own
 *     linking convention, e.g. from demo.js's per-instance doc-link badges
 *     or a doc's own cross-references) resolves the decoded `file` param
 *     against the REPO ROOT (that's what doc-viewer.html itself does).
 *   - Any other relative path resolves against the SOURCE FILE's own
 *     directory (matches normal browser link resolution, and matches how
 *     docs-live-media-assets-exist.spec.ts resolves a doc's own relative
 *     media).
 *   - A `#fragment`-only href (same-page anchor) is NOT statically
 *     verified as a hard failure -- many target ids are generated at
 *     RUNTIME (mdhtml.js's heading-id generation from markdown headings
 *     doesn't exist in the raw .md source; JS-built component internals
 *     add ids after upgrade) and a static text scan would produce a wall
 *     of false positives. It's still worth surfacing as a signal, so
 *     fragment-only hrefs with no statically-findable id/name are reported
 *     as SOFT findings (see the audit report), not test failures. A
 *     `path#fragment` href still gets its PATH portion strictly resolved
 *     -- that's the failure mode that actually breaks navigation (a dead
 *     page), independent of whether the fragment itself can be verified.
 *   - Anchor tags with no `href` at all (e.g. a `<a name="x">` used purely
 *     as an anchor target, or JS-driven `<a>` with a click handler and no
 *     navigation) are skipped -- nothing to resolve.
 */

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const SKIP_DIRS = new Set([
  'node_modules', '.git', 'data', 'test-results', '.playwright-artifacts',
  'coverage', 'dist', 'out', '.claude',
]);

function collectFiles(dir: string, exts: string[], acc: string[] = []): string[] {
  let entries: fs.Dirent[];
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return acc; }
  for (const entry of entries) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) collectFiles(full, exts, acc);
    else if (exts.some((e) => entry.name.endsWith(e))) acc.push(full);
  }
  return acc;
}

function filesToCheck(): string[] {
  const acc: string[] = [];
  for (const root of ['demos', 'pages', 'public', 'docs']) {
    collectFiles(path.join(ROOT, root), root === 'docs' ? ['.md'] : ['.html'], acc);
  }
  for (const name of ['README.md', 'CONTRIBUTING.md']) {
    const p = path.join(ROOT, name);
    if (fs.existsSync(p)) acc.push(p);
  }
  return acc.map((f) => path.relative(ROOT, f).split(path.sep).join('/')).sort();
}

/** Strip fenced code blocks + inline code spans in .md (illustrative, never
 * rendered as a real link), HTML comments in either file type, and (for
 * .html) the CONTENTS of `<script>` blocks. Several pages build `<a href>`
 * markup at runtime via string concatenation (e.g. pages/docs.html: `'<a
 * href="public/doc-viewer.html?file=' + encodeURIComponent(filePath) +
 * '"...'`) -- the literal quoted text in the SOURCE is only the static
 * PREFIX of the real href, so matching it as if it were the complete,
 * final href produces a guaranteed false "dead link" (confirmed live:
 * "public/doc-viewer.html?file=" and "pages/" alone, both JS-built). A
 * template-literal `${...}` href is excluded separately in extractRefs()
 * for the same reason; stripping <script> content entirely also covers
 * the plain string-concatenation form template-literal detection misses. */
function liveTextOnly(src: string, isMd: boolean): string {
  let out = src.replace(/<!--[\s\S]*?-->/g, (m) => m.replace(/[^\n]/g, ' '));
  if (isMd) {
    out = out
      .replace(/^[ \t]*(```|~~~)[\s\S]*?^[ \t]*\1[ \t]*$/gm, (m) => m.replace(/[^\n]/g, ' '))
      .replace(/`[^`\n]*`/g, (m) => m.replace(/[^\n]/g, ' '));
  } else {
    out = out.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, (m) => m.replace(/[^\n]/g, ' '));
  }
  return out;
}

const HTML_A_HREF = /<a\b[^>]*\shref\s*=\s*["']([^"']*)["'][^>]*>/gi;
const MD_LINK = /\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;

const EXTERNAL_OR_INERT = /^(?:[a-z][a-z0-9+.-]*:|\/\/|#$)/i;
// NOT_REPO_LOCAL below intentionally allows a leading '#' through (handled
// separately) -- this only screens out scheme-based/protocol-relative refs.

interface Ref {
  raw: string;
  kind: 'a-href' | 'md-link';
}

function extractRefs(liveSrc: string, isMd: boolean): Ref[] {
  const out: Ref[] = [];
  for (const m of liveSrc.matchAll(HTML_A_HREF)) {
    // JS template-literal hrefs (`href="${link.url}"`, built at runtime by
    // an inline <script>, e.g. pages/links.html's/errors-viewer.html's
    // dynamically-rendered lists) aren't a static ref at all -- nothing to
    // resolve against the filesystem.
    if (m[1].includes('${')) continue;
    out.push({ raw: m[1], kind: 'a-href' });
  }
  // Markdown-link syntax `[text](url)` is only meaningful in .md source --
  // in an .html file's inline <script>, the same bracket/paren shape shows
  // up coincidentally in ordinary JS (array/function-call syntax) and even
  // in comments illustrating markdown syntax as prose (confirmed live:
  // public/doc-viewer.html's own comment mentioning "[text](path)").
  if (isMd) {
    for (const m of liveSrc.matchAll(MD_LINK)) out.push({ raw: m[1], kind: 'md-link' });
  }
  return out;
}

/** Resolve the doc-viewer's own `file=` query param, repo-root-relative. */
function docViewerFileTarget(href: string): string | null {
  const qIndex = href.indexOf('?');
  if (qIndex === -1) return null;
  if (!/doc-viewer\.html$/i.test(href.slice(0, qIndex).split('/').pop() || '')) return null;
  const query = href.slice(qIndex + 1).split('#')[0];
  const params = new URLSearchParams(query);
  const file = params.get('file');
  if (!file) return null;
  return path.posix.normalize(decodeURIComponent(file));
}

test.describe('Links resolve to real files (#refs-render-properly audit)', () => {
  for (const rel of filesToCheck()) {
    test(`${rel}: <a href> / markdown links resolve`, () => {
      const isMd = rel.endsWith('.md');
      const raw = fs.readFileSync(path.join(ROOT, rel), 'utf8');
      const live = liveTextOnly(raw, isMd);
      const srcDir = path.posix.dirname(rel);

      const hardOffenders: string[] = [];
      const softFragmentNotes: string[] = [];
      const seen = new Set<string>();

      for (const { raw: href, kind } of extractRefs(live, isMd)) {
        const trimmed = href.trim();
        if (!trimmed || trimmed === '#') continue;
        if (/^(mailto:|tel:|javascript:|data:)/i.test(trimmed)) continue;

        const dedupeKey = `${kind}:${trimmed}`;
        if (seen.has(dedupeKey)) continue;
        seen.add(dedupeKey);

        // doc-viewer.html?file=... -- resolve the ENCODED file param against
        // repo root, regardless of whether the href itself is absolute or
        // relative (the file param is always repo-root-relative).
        const docViewerTarget = docViewerFileTarget(trimmed);
        if (docViewerTarget) {
          if (docViewerTarget.startsWith('..')) {
            hardOffenders.push(`href="${href}" -> doc-viewer file param "${docViewerTarget}" escapes the repo root`);
            continue;
          }
          const abs = path.join(ROOT, docViewerTarget);
          if (!fs.existsSync(abs)) {
            hardOffenders.push(`href="${href}" -> doc-viewer file param resolves to ${docViewerTarget}, which does not exist`);
          }
          continue;
        }

        if (EXTERNAL_OR_INERT.test(trimmed) || /^https?:/i.test(trimmed)) continue; // external, out of scope

        // Domain-absolute path (leading single '/', not '//' protocol-
        // relative) -- OUT OF SCOPE here on purpose. Resolving it correctly
        // depends on the deploy base path (site root vs. a GitHub Pages
        // sub-path), which is exactly what no-absolute-nav-links.spec.ts
        // (#226) already governs for the known internal dirs. It is also
        // the class of ref most likely to be a deliberately fake
        // illustrative example rather than a real target -- confirmed live:
        // docs/behavior-cross-reference.md uses dozens of placeholder
        // routes (`/terms`, `/dashboard`, `/admin/users`, ...) to
        // illustrate a routing/breadcrumb pattern, none of which are meant
        // to resolve to a real file in THIS repo.
        if (/^\/(?!\/)/.test(trimmed)) continue;

        // Split off any fragment; the PATH portion (if any) still needs to
        // resolve even when a fragment is present.
        const [pathPart, ...fragParts] = trimmed.split('#');
        const fragment = fragParts.join('#');

        if (!pathPart) {
          // Fragment-only same-page anchor -- soft, not a hard failure (see
          // header comment). Best-effort static check: does this file's raw
          // source contain a matching id/name anywhere? Only meaningful for
          // .html (mdhtml doc headings generate ids at runtime, not present
          // in raw markdown, so skip .md to avoid false positives).
          if (!isMd && fragment) {
            const idRe = new RegExp(`\\b(?:id|name)\\s*=\\s*["']${fragment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["']`);
            if (!idRe.test(raw)) {
              softFragmentNotes.push(`href="${href}" -- no static id="${fragment}"/name="${fragment}" found in this file (may be added at runtime; not a hard failure)`);
            }
          }
          continue;
        }

        // Query strings on a relative path (e.g. "components.html?tab=x")
        // don't change which FILE it targets -- strip before resolving.
        const pathOnly = pathPart.split('?')[0];
        if (!pathOnly) continue;

        const target = path.posix.normalize(path.posix.join(srcDir === '.' ? '' : srcDir, pathOnly));
        if (target.startsWith('..')) {
          hardOffenders.push(`href="${href}" -> ${target} escapes the repo root`);
          continue;
        }

        const abs = path.join(ROOT, target);
        const existsAsFile = fs.existsSync(abs) && fs.statSync(abs).isFile();
        const existsAsDirIndex = fs.existsSync(abs) && fs.statSync(abs).isDirectory() && fs.existsSync(path.join(abs, 'index.html'));
        if (!existsAsFile && !existsAsDirIndex) {
          hardOffenders.push(`href="${href}" -> ${target}${fragment ? '#' + fragment : ''} does not exist`);
        }
      }

      const message =
        `${rel}:\n` +
        (hardOffenders.length ? `HARD (dead link -- path does not resolve):\n  ${hardOffenders.join('\n  ')}\n` : '') +
        (softFragmentNotes.length ? `SOFT (fragment not statically verifiable, informational only):\n  ${softFragmentNotes.join('\n  ')}\n` : '');

      test.info().annotations.push({ type: 'refs-soft-fragment-count', description: String(softFragmentNotes.length) });
      expect(hardOffenders, message).toHaveLength(0);
    });
  }
});
