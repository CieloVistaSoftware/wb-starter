/**
 * What counts as a stray control byte in source, and where to look (#888, #1049, #1162).
 *
 * One definition, used by both:
 *   - tests/compliance/no-control-characters-in-source.spec.ts, the full sweep
 *     that runs in the gate and CI
 *   - scripts/check-staged-control-bytes.mjs, the staged-file check in the fast
 *     part of .husky/pre-commit
 *
 * #1162: the sweep was the ONLY check, so a control byte written by an agent was
 * found 59 minutes later inside the 10th-commit gate, as one of 14 "new
 * failures". Two copies of this rule would drift the way #1049's roots did, so
 * the commit-time check reads the same lists.
 *
 * TAB, LF and CR are legitimate. Everything else below 0x20, plus DEL, is not.
 * The check is on BYTES: the character is invisible in an editor and in git diff.
 */
import path from 'node:path';

// #1049: scan where executable source IS, not where it was last found.
export const SCAN_ROOTS = ['src', 'scripts', 'tests', 'pages', 'demos'];
export const SCAN_EXTENSIONS = new Set(['.js', '.mjs', '.cjs', '.ts', '.tsx', '.css', '.json', '.html']);
export const SKIP_DIRS = new Set(['node_modules', '.git', 'out', 'dist', 'test-results', 'playwright-report', '.claude']);
/** Repo-root HTML entry points, which no root directory covers. */
export const ROOT_ENTRIES = ['index.html', 'project-index.html'];

const TAB = 0x09;
const LF = 0x0a;
const CR = 0x0d;
const DEL = 0x7f;
const SPACE = 0x20;

/** Name the ones that actually happen, so a failure explains itself. */
const NAMES = {
  0x00: 'NUL',
  0x07: 'BEL (\\a)',
  0x08: 'BACKSPACE (\\b — almost certainly a word-boundary escape that got eaten)',
  0x0b: 'VERTICAL TAB (\\v)',
  0x0c: 'FORM FEED (\\f)',
  0x1b: 'ESC (\\e — almost certainly an ANSI escape that got decoded)',
  0x7f: 'DEL',
};

export function isForbiddenByte(byte) {
  return (byte < SPACE && byte !== TAB && byte !== LF && byte !== CR) || byte === DEL;
}

export function byteName(byte) {
  return NAMES[byte] || `0x${byte.toString(16).padStart(2, '0').toUpperCase()}`;
}

/**
 * Every forbidden byte in `buf`, with its 1-based line and column.
 * @param {Buffer|Uint8Array} buf
 * @returns {{ line: number, column: number, byte: number, name: string }[]}
 */
export function findControlBytes(buf) {
  const found = [];
  let line = 1;
  let lineStart = 0;
  for (let i = 0; i < buf.length; i++) {
    const byte = buf[i];
    if (byte === LF) { line++; lineStart = i + 1; continue; }
    if (isForbiddenByte(byte)) found.push({ line, column: i - lineStart + 1, byte, name: byteName(byte) });
  }
  return found;
}

/**
 * Is this repo-relative path one the sweep covers? Forward or back slashes.
 * @param {string} relPath
 */
export function isScannedPath(relPath) {
  const parts = String(relPath).split(/[\\/]+/).filter(Boolean);
  if (!parts.length) return false;
  if (parts.length === 1) return ROOT_ENTRIES.includes(parts[0]);
  if (!SCAN_ROOTS.includes(parts[0])) return false;
  if (parts.slice(0, -1).some((d) => SKIP_DIRS.has(d))) return false;
  return SCAN_EXTENSIONS.has(path.extname(parts[parts.length - 1]));
}
