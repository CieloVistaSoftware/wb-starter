/**
 * Classify every .md doc as CURRENT, FIXABLE, or ARCHIVE.
 *
 * John: "we need to analyze all .md docs and archive any which are not current
 * or fixable."
 *
 * Reading 263 files by hand is the thing to avoid, so this decides from
 * evidence a machine can check:
 *
 *   DEAD SUBJECT   the doc is ABOUT something that no longer exists --
 *                  components, wb-views, pages/components.html. Not fixable:
 *                  there is nothing left to describe. Archive.
 *
 *   BROKEN LINKS   relative links whose target file is gone. A few are a
 *                  repair job (FIXABLE). Mostly-broken means the doc was
 *                  written against a tree that no longer exists (ARCHIVE).
 *
 *   DEAD SYMBOLS   names the codebase no longer contains. Cheap staleness
 *                  signal that does not depend on links at all.
 *
 * A doc is only archived on the STRONGEST signal -- a dead subject, or links
 * that are more broken than not. Being merely old is not evidence: a doc that
 * has not needed a change in a year may simply be right.
 *
 * Generated docs are reported separately and never archived: they are rebuilt
 * from schemas, so staleness in them is a build problem, not a content one.
 *
 * Usage:
 *   node scripts/audit-docs.mjs               classify, print a report
 *   node scripts/audit-docs.mjs --archive     move ARCHIVE docs to docs/archive/
 *   node scripts/audit-docs.mjs --list ARCHIVE  just the paths, one per line
 */
import fs from 'fs';
import path from 'path';

const ARGS = process.argv.slice(2);
const ARCHIVE = ARGS.includes('--archive');
const LIST = (() => {
  const i = ARGS.indexOf('--list');
  return i >= 0 ? (ARGS[i + 1] || 'ARCHIVE').toUpperCase() : null;
})();

const ROOT = process.cwd();
const DOCS = path.join(ROOT, 'docs');
const ARCHIVE_DIR = path.join(DOCS, 'archive');

/**
 * Systems removed in 4.0.0. A doc ABOUT one of these has no subject left.
 *
 * The tag patterns are ASSEMBLED rather than written out: this file is
 * itself scanned by scripts/audit-wb-prefix.mjs, and a literal component
 * tag here reads as a surviving tag in the markup -- the detector tripping
 * its own detection string. migrate-wb-tags.mjs hit the same trap.
 */
const OLD_OPEN = '<' + 'wb-';
const DEAD_SUBJECTS = [
  {
    name: 'components',
    re: /\bcomponents?\b/i,
    strong: new RegExp(OLD_OPEN + '[a-z-]+|pages/components\.html|docs/components/'),
  },
  {
    name: 'wb-views',
    re: /wb-views/,
    strong: new RegExp('src/wb-views|wb-views\.js|' + OLD_OPEN + 'view\b'),
  },
];

/** Symbols the codebase no longer defines. */
const DEAD_SYMBOLS = [
  'customElements.define', 'wb-views.js', 'pages/components.html',
  'docs/components/', 'src/wb-views/', 'WBDemo', 'registerViewAsElement',
];

const GENERATED_MARK = 'by `scripts/generate-behavior-docs.mjs`';

/**
 * Docs that are alive by definition and must never be archived, however much
 * removed vocabulary they contain. CURRENT-STATUS.md tracks the work IN
 * PROGRESS -- it names components precisely because it is recording their
 * removal, and CLAUDE.md instructs every session to read it first.
 */
const PROTECTED = [
  /^docs\/_today\/CURRENT-STATUS\.md$/,
  /^docs\/claude\//,
  /^docs\/standards\//,
  /^docs\/architecture\/proposals\//,
];

function walk(dir, out = []) {
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return out; }
  for (const e of entries) {
    if (e.name === 'archive' || e.name === 'node_modules') continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.name.endsWith('.md')) out.push(p);
  }
  return out;
}

/** Relative markdown links, excluding anchors, urls and mailto. */
function linksIn(text) {
  const out = [];
  const re = /\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
  let m;
  while ((m = re.exec(text))) {
    const href = m[1];
    if (/^(https?:|mailto:|#|data:)/i.test(href)) continue;
    out.push(href.split('#')[0]);
  }
  return out.filter(Boolean);
}

const rows = [];

for (const file of walk(DOCS)) {
  const rel = path.relative(ROOT, file).split(path.sep).join('/');
  let text;
  try { text = fs.readFileSync(file, 'utf8'); } catch { continue; }

  const generated = text.includes(GENERATED_MARK);

  // -- link health ---------------------------------------------------------
  const links = linksIn(text);
  const broken = links.filter((href) => {
    const target = path.resolve(path.dirname(file), href);
    return !fs.existsSync(target);
  });
  const brokenRatio = links.length ? broken.length / links.length : 0;

  // -- dead subject --------------------------------------------------------
  // "Mentions X" is not the same as "is about X". Require the strong marker
  // AND enough hits that the doc's subject is plausibly the dead thing.
  // The first heading is the doc's declared subject. Hit-count alone is not
  // evidence: TIER2-DOMAIN-GUIDES.md and guides/search-index.md both mention
  // the removed vocabulary while being entirely current, and a count-based
  // rule archived both. A doc is only ABOUT a dead thing if it says so in its
  // filename or its title.
  const heading = (/^#\s+(.+)$/m.exec(text) || [, ''])[1];
  const deadSubjects = [];
  for (const s of DEAD_SUBJECTS) {
    if (!s.strong.test(text)) continue;
    const titled = s.re.test(path.basename(file)) || s.re.test(heading);
    if (!titled) continue;
    const hits = (text.match(new RegExp(s.strong.source, 'g')) || []).length;
    deadSubjects.push(`${s.name}(${hits})`);
  }

  const deadSyms = DEAD_SYMBOLS.filter((sym) => text.includes(sym));

  // -- verdict -------------------------------------------------------------
  let verdict = 'CURRENT';
  let why = '';

  const protectedDoc = PROTECTED.some((re) => re.test(rel));

  // docs/_today/ is a working-notes folder: dated plans, audits and
  // retrospectives written for a task that is now over. Several announce it
  // themselves -- "Merge Plan - Completed", "(closed 2026-07-15)". They are
  // not wrong, they are SPENT, which is what an archive is for. The standing
  // files there (CURRENT-STATUS, TODO, QUESTIONS, ANSWERS, AI-COORDINATION)
  // are the living ones and stay.
  const LIVING_TODAY = /(CURRENT-STATUS|TODO|QUESTIONS|ANSWERS|AI-COORDINATION)\.md$/i;
  const SPENT_SHAPE = /(audit|plan|report|retrospective|\d{6,8})/i;
  const spentNote = rel.startsWith('docs/_today/')
    && !LIVING_TODAY.test(rel)
    && (SPENT_SHAPE.test(path.basename(rel)) || /\b(completed|closed)\b/i.test(heading));

  if (generated) {
    verdict = 'GENERATED';
    why = 'rebuilt from schema; never archive';
  } else if (spentNote) {
    verdict = 'ARCHIVE';
    why = 'spent working note in docs/_today/';
  } else if (deadSubjects.length && !protectedDoc) {
    verdict = 'ARCHIVE';
    why = `subject removed: ${deadSubjects.join(', ')}`;
  } else if (links.length >= 3 && brokenRatio > 0.5 && !protectedDoc) {
    verdict = 'ARCHIVE';
    why = `${broken.length}/${links.length} links dead — written against a tree that is gone`;
  } else if (broken.length) {
    verdict = 'FIXABLE';
    why = `${broken.length}/${links.length} link(s) broken`;
  } else if (deadSyms.length) {
    verdict = 'FIXABLE';
    why = `mentions removed symbol(s): ${deadSyms.slice(0, 2).join(', ')}`;
  }

  rows.push({ rel, verdict, why, broken: broken.length, links: links.length });
}

if (LIST) {
  rows.filter((r) => r.verdict === LIST).forEach((r) => console.log(r.rel));
  process.exit(0);
}

const by = (v) => rows.filter((r) => r.verdict === v);
const pad = (s, n) => String(s).padEnd(n);

console.log(`\ndocs audit — ${rows.length} markdown file(s)\n`);
for (const v of ['CURRENT', 'GENERATED', 'FIXABLE', 'ARCHIVE']) {
  console.log(`  ${pad(v, 10)} ${by(v).length}`);
}

for (const v of ['ARCHIVE', 'FIXABLE']) {
  const list = by(v);
  if (!list.length) continue;
  console.log(`\n${v}`);
  list.sort((a, b) => b.broken - a.broken).slice(0, 30)
    .forEach((r) => console.log(`  ${pad(r.rel, 56)} ${r.why}`));
  if (list.length > 30) console.log(`  ... and ${list.length - 30} more`);
}

if (ARCHIVE) {
  const list = by('ARCHIVE');
  fs.mkdirSync(ARCHIVE_DIR, { recursive: true });
  let moved = 0;
  for (const r of list) {
    const from = path.join(ROOT, r.rel);
    // Keep the original shape under archive/ so a path in an old link or
    // commit message still tells you where the file used to live.
    const to = path.join(ARCHIVE_DIR, path.relative(DOCS, from));
    fs.mkdirSync(path.dirname(to), { recursive: true });
    fs.renameSync(from, to);
    moved++;
  }
  console.log(`\nARCHIVED ${moved} doc(s) -> docs/archive/ (structure preserved)`);
}
