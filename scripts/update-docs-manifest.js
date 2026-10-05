import fs from 'fs';
import path from 'path';
import { readGitDates as readGitDatesFrom, readGitCreated } from './lib/git-dates.mjs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT = path.resolve(__dirname, '..');
const DOCS_DIR = path.join(ROOT, 'docs');
const OUTPUT_FILE = path.join(ROOT, 'data', 'docs-manifest.json');

// #1452: an order that does not depend on the machine. readdirSync() returns the
// filesystem's order -- case-insensitive on NTFS, byte order on Linux -- and
// byCategory inherits it, so a Windows `npm start` reordered 168 lines of a
// tracked file in which nothing had changed. Directory entries are sorted by
// code point (what CI's Linux already produced); the flat list keeps its
// committed collation, named explicitly so no default locale can change it.
const byCodePoint = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

// #1452: write only when the content really differs. The comparison ignores
// line endings: a Windows checkout holds CRLF, this script emits LF, and a
// plain !== called every file changed -- git status then reported it modified
// although git diff showed nothing.
function writeIfChanged(file, text) {
  const current = fs.existsSync(file) ? fs.readFileSync(file, 'utf-8').replace(/\r\n/g, '\n') : null;
  if (current === text) return false;
  fs.writeFileSync(file, text);
  return true;
}

function getMarkdownFiles(dir, basePath = '') {
  const results = [];
  
  if (!fs.existsSync(dir)) return results;
  
  const entries = fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => byCodePoint(a.name, b.name));
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relativePath = basePath ? `${basePath}/${entry.name}` : entry.name;
    
    if (entry.isDirectory()) {
      // Skip hidden directories and node_modules
      if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
      results.push(...getMarkdownFiles(fullPath, relativePath));
    } else if (entry.name.endsWith('.md')) {
      // Read first line for title
      const content = fs.readFileSync(fullPath, 'utf-8');
      const firstLine = content.split('\n')[0];
      const title = firstLine.replace(/^#\s*/, '').trim() || entry.name.replace('.md', '');
      
      results.push({
        path: `docs/${relativePath}`,
        title,
        name: entry.name.replace('.md', ''),
        category: basePath.split('/')[0] || 'root'
      });
    }
  }
  
  return results;
}

const CURATED_MANIFEST = path.join(DOCS_DIR, 'manifest.json');

// docs/manifest.json -- the curated index pages/docs.html renders -- carries a
// `modified` date (YYYY-MM-DD) on every entry, for the docs page's "Newest
// first" order. This script keeps those dates current on every `npm start`.
//
// The date is the file's last COMMIT, never its mtime: a fresh clone stamps
// every mtime with the checkout time, and an mtime changes on every save, so
// the tracked manifest would churn exactly the way #1071 removed the
// `generated` timestamp to stop. A commit date changes only when the doc
// itself is committed again.
//
// Returns null when git cannot give a true answer -- no git, not a repo, or a
// shallow clone, where every file older than the cut-off would wrongly carry
// the newest commit's date. The recorded dates are then left as they are.
// #1503: the git-history read is shared with generate-search-index.js.
const readGitDates = () => readGitDatesFrom(ROOT, ['docs', 'pages']);

// The repo path an entry of docs/manifest.json points at, or null for an
// external link. Mirrors how pages/docs.html builds each card's link.
function curatedEntryPath(entry) {
  if (entry.page) return `pages/${entry.page}.html`;
  if (!entry.file || /^https?:/i.test(entry.file)) return null;
  const file = entry.file.replace(/^\/+/, '');
  return /^docs\//.test(file) ? file : `docs/${file}`;
}

function stampCuratedDates() {
  const gitDates = readGitDates();
  if (!gitDates) {
    console.log('No full git history: docs/manifest.json dates left as recorded');
    return;
  }
  const text = fs.readFileSync(CURATED_MANIFEST, 'utf-8');
  const curated = JSON.parse(text);
  for (const category of curated.categories || []) {
    for (const entry of [...(category.docs || []), ...(category.pages || [])]) {
      const repoPath = curatedEntryPath(entry);
      // A file not committed yet has no git date; it keeps any date it had.
      const modified = repoPath && gitDates.get(repoPath);
      if (modified) entry.modified = modified;
    }
  }
  const updated = JSON.stringify(curated, null, 2) + '\n';
  // Written only on a real change, so an unchanged tree stays clean (#1071, #1452).
  if (writeIfChanged(CURATED_MANIFEST, updated)) {
    console.log('Updated doc dates in docs/manifest.json');
  }
}

function generateManifest() {
  console.log('Scanning docs directory...');
  
  const files = getMarkdownFiles(DOCS_DIR);

  // #1226: every doc's creation date, for the Docs page's "By date created"
  // view. From git (the commit that first added it); without full history the
  // dates already recorded are kept, so a shallow clone never rewrites them.
  const created = readGitCreated(ROOT, ['docs']);
  let recorded = new Map();
  try {
    recorded = new Map(JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf-8')).files.map((f) => [f.path, f.created]));
  } catch { /* first run: nothing recorded yet */ }
  for (const file of files) {
    const date = (created && created.get(file.path)) || recorded.get(file.path);
    if (date) file.created = date;
  }
  
  // Group by category
  const byCategory = {};
  for (const file of files) {
    if (!byCategory[file.category]) {
      byCategory[file.category] = [];
    }
    byCategory[file.category].push(file);
  }
  
  // #1071: NO `generated` timestamp.
  //
  // This file is tracked, because src/wb-viewmodels/demo.js reads it from the
  // deployed site. It is also rewritten on every `npm start`. With a timestamp
  // in it, every start produced a diff even when not one document had changed,
  // so the working tree was permanently dirty and the version badge's "*"
  // (uncommitted changes) could never clear.
  //
  // A manifest describes what the docs ARE. When it was built is a fact about
  // the build, not about the contents, and it is already recoverable from git.
  // Dropping it makes the file change only when the docs actually change, which
  // is also what makes a stale-manifest check possible: regenerate, and a diff
  // now MEANS something.
  const manifest = {
    totalFiles: files.length,
    categories: Object.keys(byCategory).sort(),
    byCategory,
    files: files.sort((a, b) => a.path.localeCompare(b.path, 'en'))
  };
  
  // Ensure data directory exists
  const dataDir = path.dirname(OUTPUT_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  writeIfChanged(OUTPUT_FILE, JSON.stringify(manifest, null, 2));
  
  console.log(`Generated manifest with ${files.length} files in ${Object.keys(byCategory).length} categories`);
  console.log(`Output: ${OUTPUT_FILE}`);
}

generateManifest();
stampCuratedDates();
