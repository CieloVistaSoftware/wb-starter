/**
 * Every link in every tracked .md file, found and resolved.
 *
 * Shared by scripts/audit-md-links.mjs (the audit: finds, records, and with
 * --external checks web links) and tests/compliance/md-links-resolve.spec.ts
 * (the gate: no broken internal link may come back). Pure functions plus
 * file reads; no network here.
 *
 * WHAT COUNTS AS A LINK
 *   [text](dest)  ![alt](dest)  [label]: dest  <https://...>
 *   <a href="dest">  <img src="dest">
 * Fenced code blocks, inline code spans and HTML comments are skipped: a link
 * written as an EXAMPLE is not a link the reader can follow.
 *
 * HOW A DESTINATION RESOLVES (the way a reader's click does)
 *   http(s)://, //        external -- checked only by the audit's --external
 *   http://localhost...              the reader's own dev server, skipped
 *   mailto: tel: data: javascript:   not a document link, skipped
 *   ...doc-viewer.html?file=X        X against the repo root (what the viewer does)
 *   ?page=X  /?page=X                the site route: pages/X.html must exist
 *   /path                            the repo root (the site root)
 *   relative                         the linking file's own directory
 *   #anchor                          a heading or id in the target (or this) file
 *
 * ANCHORS
 * A heading's id is made by the doc viewer (src/wb-viewmodels/mdhtml.js) and,
 * when the file is read on GitHub, by GitHub. The two slug rules differ (the
 * viewer collapses runs of hyphens, GitHub does not), so an anchor is checked
 * against both and the result says which one it fails.
 */

import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { suiteEnv } from './suite-env.mjs';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

/**
 * Every tracked .md file, repo-relative with forward slashes.
 *
 * --cached --others --exclude-standard, as tests/compliance/repo-layout.spec.ts
 * does: the commit gate runs the suite in a `git worktree add --no-checkout`
 * copy whose index is empty, so the index alone listed 0 files there.
 * suiteEnv: never inherit the hook's GIT_DIR/GIT_INDEX_FILE (#1161).
 */
export function trackedMarkdown(root = ROOT) {
  const out = execFileSync('git', ['ls-files', '-z', '--cached', '--others', '--exclude-standard', '*.md'],
    { cwd: root, encoding: 'utf8', env: suiteEnv(process.env) });
  return [...new Set(out.split('\0').filter(Boolean))].sort();
}

/** Blank out code fences, inline code and HTML comments, keeping line numbers. */
export function stripNonLinks(src) {
  const blank = (m) => m.replace(/[^\n]/g, ' ');
  return src
    .replace(/<!--[\s\S]*?-->/g, blank)
    .replace(/^( {0,3})(`{3,}|~{3,})[^\n]*\n[\s\S]*?\n {0,3}\2[^\n]*$/gm, blank)
    // Inline code stays on one line: a stray `` (an empty pair) once
    // blanked twenty lines up to the next backticks and hid real headings.
    .replace(/(`+)(?!`)[^\n]*?[^`\n]\1(?!`)/g, blank);
}

/** All links in one markdown source: [{ dest, line, kind }]. */
export function extractLinks(src) {
  const text = stripNonLinks(src);
  const lineAt = (i) => text.slice(0, i).split('\n').length;
  const out = [];
  const push = (dest, i, kind) => {
    let d = String(dest).trim();
    if (d.startsWith('<') && d.endsWith('>')) d = d.slice(1, -1);
    if (!d) return;
    out.push({ dest: d, line: lineAt(i), kind });
  };
  // [text](dest "title") and ![alt](dest). dest may contain balanced parens.
  for (const m of text.matchAll(/!?\[(?:[^[\]]|\[[^[\]]*\])*\]\(\s*(<[^>]*>|(?:[^()\s]|\([^()\s]*\))+)(?:\s+(?:"[^"]*"|'[^']*'|\([^)]*\)))?\s*\)/g)) {
    push(m[1], m.index, m[0].startsWith('!') ? 'image' : 'link');
  }
  // [label]: dest   (reference definitions)
  for (const m of text.matchAll(/^ {0,3}\[[^\]]+\]:\s*(<[^>]*>|\S+)/gm)) push(m[1], m.index, 'reference');
  // <https://...> autolinks
  for (const m of text.matchAll(/<(https?:\/\/[^>\s]+)>/g)) push(m[1], m.index, 'autolink');
  // <a href="..."> and <img src="...">
  for (const m of text.matchAll(/<a\b[^>]*?\shref\s*=\s*(["'])(.*?)\1/gi)) push(m[2], m.index, 'html-href');
  for (const m of text.matchAll(/<img\b[^>]*?\ssrc\s*=\s*(["'])(.*?)\1/gi)) push(m[2], m.index, 'html-src');
  return out;
}

/** The doc viewer's heading slug (mdhtml.js). */
export function viewerSlug(text) {
  return String(text).toLowerCase()
    .replace(/<[^>]*>/g, '').replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

/** GitHub's heading slug (github-slugger): keeps runs of hyphens. */
export function githubSlug(text) {
  return String(text).toLowerCase().trim()
    .replace(/<[^>]*>/g, '')
    .replace(/[^\p{L}\p{M}\p{N}\p{Pc}\s-]/gu, '')
    .replace(/\s/g, '-');
}

/** Heading text with inline markdown removed, as both renderers see it. */
function headingText(raw) {
  return raw
    .replace(/\s+#+\s*$/, '')                    // closing hashes
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')    // images -> alt
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')     // links -> text
    .replace(/`([^`]*)`/g, '$1')                 // code spans -> text
    .replace(/(\*\*|__|\*|_|~~)(.+?)\1/g, '$2')  // emphasis
    .trim();
}

/** Every anchor a file offers: { viewer:Set, github:Set }. Headings get the
 *  -1/-2 suffix for repeats (both renderers); explicit ids/names count for both. */
export function anchorsOf(src, isMarkdown = true) {
  const viewer = new Set(), github = new Set();
  const explicit = [...src.matchAll(/\s(?:id|name)\s*=\s*(["'])([^"']+)\1/gi)].map((m) => m[2]);
  for (const id of explicit) { viewer.add(id); github.add(id); }
  if (!isMarkdown) return { viewer, github };
  const text = stripNonLinks(src);
  const seenV = new Map(), seenG = new Map();
  const add = (set, seen, slug) => {
    const n = seen.get(slug) || 0;
    seen.set(slug, n + 1);
    set.add(n ? `${slug}-${n}` : slug);
  };
  const lines = text.split('\n');
  for (let i = 0; i < lines.length; i++) {
    let h = null;
    const atx = /^ {0,3}#{1,6}\s+(.*)$/.exec(lines[i]);
    if (atx) h = atx[1];
    else if (i + 1 < lines.length && lines[i].trim() && /^ {0,3}(=+|-+)\s*$/.test(lines[i + 1])
      && !/^\s*([-*+]|\d+\.)\s/.test(lines[i]) && !/^\s*\|/.test(lines[i])) h = lines[i];
    if (h == null) continue;
    const t = headingText(h);
    add(viewer, seenV, viewerSlug(t));
    add(github, seenG, githubSlug(t));
  }
  return { viewer, github };
}

const SKIP_SCHEMES = /^(mailto:|tel:|data:|javascript:|about:|vscode:|file:)/i;
const isPlaceholder = (d) => /\{\{|\}\}|\$\{|<%|%>|\bTODO\b/.test(d) || /^(url|path|link|#?\.\.\.)$/i.test(d);

/**
 * Resolve one link from `fromFile` (repo-relative).
 * Returns { type: 'external'|'skip'|'internal', url?, file?, anchor?, reason? }
 */
export function resolveLink(dest, fromFile) {
  if (SKIP_SCHEMES.test(dest) || isPlaceholder(dest)) return { type: 'skip' };
  // A dev-server address ("open http://localhost:3000 after npm start") is an
  // instruction about the reader's own machine, not a web link to fetch.
  if (/^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0)([:/]|$)/i.test(dest)) return { type: 'local' };
  if (/^(https?:)?\/\//i.test(dest)) return { type: 'external', url: dest.startsWith('//') ? 'https:' + dest : dest };

  let [beforeHash, ...hashParts] = dest.split('#');
  const anchor = hashParts.length ? decodeURIComponent(hashParts.join('#')) : null;
  let [pathPart, query = ''] = beforeHash.split('?');
  const params = new URLSearchParams(query);

  // The doc viewer's convention: ?file= resolves against the repo root.
  if (/doc-viewer\.html$/.test(pathPart) && params.get('file')) {
    return { type: 'internal', file: params.get('file').replace(/^\/+/, ''), anchor };
  }
  // A site route: ?page=X is pages/X.html.
  if ((pathPart === '' || pathPart === '/' || /(^|\/)index\.html$/.test(pathPart)) && params.get('page')) {
    return { type: 'internal', file: `pages/${params.get('page')}.html`, anchor };
  }
  if (pathPart === '') return { type: 'internal', file: fromFile, anchor };

  let decoded;
  try { decoded = decodeURIComponent(pathPart); } catch { decoded = pathPart; }
  const file = decoded.startsWith('/')
    ? decoded.replace(/^\/+/, '')
    : path.posix.normalize(path.posix.join(path.posix.dirname(fromFile), decoded));
  return { type: 'internal', file, anchor };
}

/** Check an internal link. Returns null when it works, else { problem, detail }. */
export function checkInternal(resolved, root = ROOT, cache = new Map()) {
  const abs = path.join(root, resolved.file);
  if (resolved.file.startsWith('..')) return { problem: 'outside-repo', detail: `points outside the repo: ${resolved.file}` };
  if (!existsSync(abs)) return { problem: 'missing-file', detail: `no such file: ${resolved.file}` };
  if (!resolved.anchor) return null;
  if (statSync(abs).isDirectory()) return { problem: 'anchor-on-directory', detail: `#${resolved.anchor} on a directory` };
  if (!/\.(md|html?)$/i.test(abs)) return null; // an anchor into code/json: not a document anchor
  if (!cache.has(abs)) cache.set(abs, anchorsOf(readFileSync(abs, 'utf8'), /\.md$/i.test(abs)));
  const { viewer, github } = cache.get(abs);
  const a = resolved.anchor;
  // HTML: the fragment "top" scrolls to the top of the document even when no
  // element has that id, so #top always works.
  if (a.toLowerCase() === 'top') return null;
  const inViewer = viewer.has(a), inGithub = github.has(a);
  if (inViewer && inGithub) return null;
  // An .html target is only read on the site; GitHub's slugs do not apply.
  if (!/\.md$/i.test(abs) && inViewer) return null;
  if (!inViewer && !inGithub) return { problem: 'missing-anchor', detail: `no heading or id "#${a}" in ${resolved.file}` };
  return { problem: inViewer ? 'anchor-github-only-broken' : 'anchor-viewer-only-broken',
    detail: `#${a} works ${inViewer ? 'in the doc viewer but not on GitHub' : 'on GitHub but not in the doc viewer'} (${resolved.file})` };
}

/** Line ranges inside live demo blocks (<div|figure|section x-demo> ... </tag>):
 *  links there are rendered and clickable, so they count, but a fix may differ. */
export function demoLines(src) {
  const ranges = [];
  const lines = src.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const open = /<(div|figure|section)\b[^>]*\bx-demo\b/.exec(lines[i]);
    if (!open) continue;
    const tag = open[1];
    let depth = 0;
    for (let j = i; j < lines.length; j++) {
      depth += (lines[j].match(new RegExp(`<${tag}\\b`, 'g')) || []).length;
      depth -= (lines[j].match(new RegExp(`</${tag}>`, 'g')) || []).length;
      if (depth <= 0) { ranges.push([i + 1, j + 1]); i = j; break; }
    }
  }
  return ranges;
}

/** Audit every internal link: { files, links, broken: [...] } */
export function auditInternal(root = ROOT) {
  const cache = new Map();
  const broken = [];
  let links = 0;
  const files = trackedMarkdown(root);
  for (const from of files) {
    const src = readFileSync(path.join(root, from), 'utf8');
    const demos = demoLines(src);
    for (const l of extractLinks(src)) {
      const r = resolveLink(l.dest, from);
      if (r.type !== 'internal') continue;
      links++;
      const bad = checkInternal(r, root, cache);
      const inDemo = demos.some(([a, b]) => l.line >= a && l.line <= b);
      if (bad) broken.push({ from, line: l.line, dest: l.dest, inDemo, ...bad });
    }
  }
  return { files: files.length, links, broken };
}

/** Every external URL with where it is used: Map(url -> [{from, line}]) */
export function externalLinks(root = ROOT) {
  const map = new Map();
  for (const from of trackedMarkdown(root)) {
    const src = readFileSync(path.join(root, from), 'utf8');
    for (const l of extractLinks(src)) {
      const r = resolveLink(l.dest, from);
      if (r.type !== 'external') continue;
      const url = r.url.replace(/[).,;]+$/, '');
      if (!map.has(url)) map.set(url, []);
      map.get(url).push({ from, line: l.line });
    }
  }
  return map;
}
