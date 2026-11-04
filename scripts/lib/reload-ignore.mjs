// Which changed files must NOT reload the browser (server.js's file watcher).
//
// Directories whose changes must never trigger a live reload: generated
// reports, runtime status files, test artifacts, build output. The recursive
// root watch would otherwise reload on every data/ write, e.g. data/bg-health.json
// is rewritten every ~30s by the CieloVista Tools extension, causing an endless
// "Reloading clients..." loop (#221).
const RELOAD_IGNORE_DIRS = new Set([
  '.git', 'node_modules', '.vscode',
  // 'tests' itself, not just its output dirs: Windows' recursive fs.watch fires
  // spurious 'change' events for files that were merely read, and a Playwright
  // discovery pass reads every spec, so each test run reloaded the page once
  // per spec file.
  'tests',
  'data', 'test-results', 'playwright-report', '.playwright-artifacts',
  'coverage', 'dist', 'out',
  // The local Worker's build output and its database and trace files, written
  // while `npm run pro:local` runs (#1963).
  '.wrangler',
  // Other sessions' worktrees, which are not the page being viewed.
  '.claude',
]);

/** @param {string} filename path relative to the watched directory */
export function isReloadIgnored(filename) {
  // Normalize separators so the checks work identically on Windows + POSIX.
  const normalized = filename.replace(/\\/g, '/');
  if (normalized.includes('.tmp')) return true;
  // A captured log grows on every request, so it would reload on each page load (#1963).
  if (normalized.endsWith('.log')) return true;
  return normalized.split('/').some(seg => RELOAD_IGNORE_DIRS.has(seg));
}
