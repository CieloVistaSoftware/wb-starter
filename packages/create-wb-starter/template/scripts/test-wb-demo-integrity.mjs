#!/usr/bin/env node
/**
 * WB Framework - <div x-demo> Markup Integrity Check
 * Runs as: npm run test:x-demo-integrity
 * Part of: npm test (compliance checks)
 *
 * FAST-FAIL: Exits with code 1 if any pages/*.html or demos/*.html file has
 * unbalanced <div x-demo>/</div> tags or a <div x-demo> with no content.
 *
 * Written after a real bug (#behaviors.html "Special Input Types" and
 * "Masked Inputs"): a stray self-closed <div x-demo></div> rendered as a
 * blank box, and an orphaned closing tag left three <input> elements as bare
 * siblings with no wrapper (no spacing). Nothing caught it — this does.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_DIR = path.resolve(__dirname, '..');
const SCAN_DIRS = ['pages', 'demos'];

const OPEN_RE = /<div x-demo(?:\s[^>]*)?>/g;
const CLOSE_RE = /<\/x-demo>/g;
const EMPTY_RE = /<div x-demo(?:\s[^>]*)?>\s*<\/x-demo>/g;

function stripHtmlComments(html) {
  return html.replace(/<!--[\s\S]*?-->/g, '');
}

// Characters after which a `/` is a regex-literal start rather than a
// division operator -- the standard heuristic (start-of-input, or the
// previous significant token is an operator/punctuator rather than an
// identifier, number, `)`, `]`, or closing string/template quote).
const REGEX_CONTEXT_RE = /[([{,;:!&|?+\-*%^~=<>]/;

/**
 * Scoped JS-comment stripper for the raw text of a single <script> block.
 * Walks the source char-by-char tracking string/template/regex literals so
 * `//` or `/*` inside a string, template literal, or regex is left alone --
 * a blind "strip to end of line on //" would wrongly truncate legitimate
 * content like `https://` URLs embedded in JS strings. Comments are
 * replaced with a single space (block) or nothing (line, up to but not
 * including the newline) so token boundaries aren't accidentally joined.
 */
function stripJsComments(code) {
  let out = '';
  let i = 0;
  const n = code.length;
  let lastSignificant = '';

  while (i < n) {
    const c = code[i];
    const c2 = i + 1 < n ? code[i + 1] : '';

    // Line comment: // ... up to (not including) the newline.
    if (c === '/' && c2 === '/') {
      i += 2;
      while (i < n && code[i] !== '\n') i++;
      continue;
    }

    // Block comment: /* ... */ (collapsed to a single space).
    if (c === '/' && c2 === '*') {
      i += 2;
      while (i < n && !(code[i] === '*' && code[i + 1] === '/')) i++;
      i = Math.min(i + 2, n);
      out += ' ';
      continue;
    }

    // String / template literals -- copy verbatim (respecting backslash
    // escapes) so any // or <div x-demo>-looking text inside is left intact
    // and never mistaken for a real tag or a comment.
    if (c === "'" || c === '"' || c === '`') {
      const quote = c;
      out += c;
      i++;
      while (i < n) {
        const cj = code[i];
        out += cj;
        if (cj === '\\' && i + 1 < n) {
          out += code[i + 1];
          i += 2;
          continue;
        }
        i++;
        if (cj === quote) break;
      }
      lastSignificant = quote;
      continue;
    }

    // Regex literal -- only when a `/` is plausible here syntactically;
    // otherwise it's division and falls through to the default case.
    if (c === '/' && (lastSignificant === '' || REGEX_CONTEXT_RE.test(lastSignificant))) {
      let j = i + 1;
      let inClass = false;
      let sawClose = false;
      let buf = '/';
      while (j < n) {
        const cj = code[j];
        if (cj === '\n') break; // regex literals can't span lines -- bail out
        buf += cj;
        if (cj === '\\' && j + 1 < n) {
          buf += code[j + 1];
          j += 2;
          continue;
        }
        if (cj === '[') inClass = true;
        else if (cj === ']') inClass = false;
        else if (cj === '/' && !inClass) {
          j++;
          sawClose = true;
          break;
        }
        j++;
      }
      if (sawClose) {
        while (j < n && /[a-z]/i.test(code[j])) {
          buf += code[j];
          j++;
        }
        out += buf;
        i = j;
        lastSignificant = '/';
        continue;
      }
      // Not actually a regex (no closing `/` before end of line) -- treat
      // the `/` as an ordinary character and keep scanning normally.
    }

    out += c;
    if (!/\s/.test(c)) lastSignificant = c;
    i++;
  }

  return out;
}

// Strip JS-style comments, but only inside real <script>...</script>
// blocks -- and only when the block is JS (no type attribute, or a
// JS-ish type like "module"/"text/javascript"). Content outside <script>
// tags is left untouched, so a `//` inside an href/URL in plain markup
// is never affected.
const SCRIPT_BLOCK_RE = /(<script\b[^>]*>)([\s\S]*?)(<\/script>)/gi;
const JS_SCRIPT_TYPES = new Set(['', 'module', 'text/javascript', 'application/javascript', 'text/babel']);

function stripJsCommentsInScripts(html) {
  return html.replace(SCRIPT_BLOCK_RE, (match, openTag, body, closeTag) => {
    const typeMatch = openTag.match(/\btype\s*=\s*(?:"([^"]*)"|'([^']*)'|(\S+))/i);
    const type = typeMatch ? (typeMatch[1] ?? typeMatch[2] ?? typeMatch[3] ?? '').toLowerCase() : '';
    if (!JS_SCRIPT_TYPES.has(type)) return match;
    return openTag + stripJsComments(body) + closeTag;
  });
}

function stripComments(html) {
  return stripJsCommentsInScripts(stripHtmlComments(html));
}

function getAllHtmlFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...getAllHtmlFiles(full));
    else if (entry.name.endsWith('.html')) out.push(full);
  }
  return out;
}

/**
 * Pure function, no filesystem access — scans an HTML string for <div x-demo>
 * markup issues. Exported so tests/compliance/x-demo-integrity.spec.ts can
 * exercise it directly against example fixtures, independent of which real
 * files currently exist on disk.
 */
export function scanHtml(rawHtml) {
  const html = stripComments(rawHtml);
  const issues = [];

  const opens = (html.match(OPEN_RE) || []).length;
  const closes = (html.match(CLOSE_RE) || []).length;
  if (opens !== closes) {
    issues.push(`unbalanced <div x-demo> tags: ${opens} open vs ${closes} close`);
  }

  const emptyMatches = html.match(EMPTY_RE) || [];
  if (emptyMatches.length > 0) {
    issues.push(`${emptyMatches.length} empty <div x-demo></div> block(s) — renders as a blank box`);
  }

  return issues;
}

function scanFile(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const relativePath = path.relative(PROJECT_DIR, filePath);
  return { relativePath, issues: scanHtml(raw) };
}

function main() {
  console.log('\n🔍 WB Framework - <div x-demo> Markup Integrity Check\n');

  const files = SCAN_DIRS.flatMap((dir) => getAllHtmlFiles(path.join(PROJECT_DIR, dir)));
  console.log(`📊 Scanning ${files.length} page/demo HTML files...\n`);

  const results = files.map(scanFile).filter((r) => r.issues.length > 0);

  if (results.length === 0) {
    console.log('✅ All <div x-demo> tags are balanced and non-empty!\n');
    process.exit(0);
  }

  console.error(`❌ Found <div x-demo> markup issues in ${results.length} file(s):\n`);
  results.forEach(({ relativePath, issues }) => {
    console.error(`   ${relativePath}`);
    issues.forEach((issue) => console.error(`      ⚠️  ${issue}`));
  });
  console.error('\n   Fix: each <div x-demo> needs exactly one matching </div>, with content between them.\n');
  process.exit(1);
}

// Only run the CLI scan (and its process.exit calls) when this file is
// executed directly — not when tests/compliance/x-demo-integrity.spec.ts
// imports scanHtml() for fixture-based assertions. Resolve both sides to
// real filesystem paths before comparing — raw import.meta.url vs
// process.argv[1] string comparison silently mismatches on Windows
// (drive-letter casing, backslash vs forward-slash).
const isMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (isMain) {
  main();
}
