/**
 * Regenerates src/core/version.js AND cache-busts every local <link>/<script>
 * reference in the HTML entry points, so a deploy is never at the mercy of
 * the CDN, a browser's disk cache, an old service worker, or a carrier's
 * transparent proxy — a changed query string is a URL nothing has cached
 * yet, so there is nothing to serve stale. Run automatically by the
 * pre-commit hook; never hand-edit src/core/version.js.
 */
import { execSync } from 'child_process';
import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const pkg = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'));

let commit = 'unknown';
try {
  commit = execSync('git rev-parse --short HEAD', { cwd: root, encoding: 'utf8' }).trim();
} catch {
  // no git available (e.g. fresh checkout without history) — leave 'unknown'
}

const builtAt = new Date().toISOString();

/**
 * #1002 -- John: "the version number is supposed to represent a specific code
 * set", and "everything running on 3000 is the latest code" plus "no surprises
 * like missing menu items".
 *
 * A bare version number cannot promise that. `4.0.1` was displayed while
 * serving a tree 24 commits behind main with 377 uncommitted files -- the same
 * string named the release AND something that was not the release, and nothing
 * said which. So the stamp now records what the tree actually IS, and the badge
 * shows it (src/wb-viewmodels/release.js).
 *
 * Measured cheaply: two git calls, only at stamp time.
 */
function drift() {
  const git = (cmd, fallback = '') => {
    try {
      return execSync(cmd, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    } catch {
      return fallback;
    }
  };

  // WHERE THE CODE LIVES, not where it happened to be authored.
  //
  // This used to be a bare `rev-parse --abbrev-ref HEAD`, so a release commit
  // made on a feature branch kept that name after merging. 4.0.2 shipped to
  // production stamped `branch: "spec/needs-test-coverage"` — a branch no
  // visitor to the deployed site has any way to interpret, on an artifact that
  // was very much on main.
  //
  // If the commit is reachable from the remote default branch, that is its home
  // and that is what gets stamped. Otherwise the working branch is still the
  // honest answer, because the code genuinely is only there.
  const localBranch = git('git rev-parse --abbrev-ref HEAD', 'unknown');
  const containing = git('git branch -r --contains HEAD --format=%(refname:short)')
    .split('\n')
    .map((b) => b.trim())
    .filter(Boolean);
  const home = containing.find((b) => b === 'origin/main' || b === 'origin/master');
  const branch = home ? home.replace(/^origin\//, '') : localBranch;

  // #1071: the stamp must not count ITS OWN OUTPUT as a dirty tree.
  //
  // This was a bare `git status --porcelain`, and this script rewrites
  // src/core/version.js every time it runs (`npm start`, every commit) with a
  // fresh `builtAt`. So the file it had just written made the tree dirty, which
  // it then recorded as `dirty: true` -- circular, and permanent. The badge's
  // "*" means "you have uncommitted changes"; it was really saying "this script
  // ran", which is always.
  //
  // Everything else the suite regenerates (data/test-results.json,
  // test-status.json, bg-health.json) is now gitignored, so `--porcelain` no
  // longer lists it. version.js cannot be ignored -- the deployed badge reads
  // it -- so it is excluded here instead.
  //
  // The flag now means what #1002 asked it to mean: real, uncommitted work.
  const GENERATED = ['src/core/version.js'];
  const dirty = git('git status --porcelain')
    .split('\n')
    .map((l) => l.slice(3).trim())
    .filter(Boolean)
    .some((f) => !GENERATED.includes(f.split('\\').join('/')));

  // Compare against the remote this branch tracks; fall back to origin/main,
  // which is what "latest code" means for this project.
  const upstream = git('git rev-parse --abbrev-ref --symbolic-full-name @{u}') || 'origin/main';
  let behind = 0;
  let ahead = 0;
  const counts = git(`git rev-list --left-right --count HEAD...${upstream}`);
  if (counts) {
    const [a, b] = counts.split(/\s+/).map(Number);
    ahead = a || 0;
    behind = b || 0;
  }

  return { branch, dirty, ahead, behind, upstream };
}

const tree = drift();

// #1071: keep the PREVIOUS builtAt when nothing else changed.
//
// This file is tracked (the deployed badge reads it) and was rewritten with a
// fresh `builtAt` on every `npm start` and every commit. So starting the dev
// server produced a diff when not one line of source had changed, the working
// tree was permanently dirty, and "do we have uncommitted work?" could never be
// answered. John: "why do we still have uncommitted work? we've lost track of
// what we have and where we are going?"
//
// `builtAt` cannot simply be dropped -- release.js renders it in the badge
// tooltip and the {built} format, and main.js logs it. So it is kept, and only
// refreshed when something REAL differs: version, commit, branch, drift.
//
// That also makes it more honest. It now means "when this state was first
// stamped" rather than "the last time anyone ran npm start", which is what a
// reader looking at a build timestamp actually wants to know.
const versionPath = path.join(root, 'src', 'core', 'version.js');
const next = { version: pkg.version, commit, builtAt, ...tree };

let previous = null;
try {
  const prevText = readFileSync(versionPath, 'utf8');
  const m = prevText.match(/export const VERSION = ({[\s\S]*?});/);
  if (m) previous = JSON.parse(m[1]);
} catch { /* first run, or unreadable - stamp fresh */ }

const sameExceptTime = previous
  && Object.keys(next).every((k) => k === 'builtAt' || JSON.stringify(previous[k]) === JSON.stringify(next[k]))
  && Object.keys(previous).every((k) => k === 'builtAt' || k in next);

if (sameExceptTime) next.builtAt = previous.builtAt;

const out = `/**
 * AUTO-GENERATED by scripts/stamp-version.js — do not hand-edit.
 * Regenerated on every commit via .husky/pre-commit, AND on npm start
 * so what the badge says is always what is being served (#1002).
 *
 * builtAt only moves when something else does (#1071) — otherwise re-running
 * this would dirty the working tree for no reason.
 */
export const VERSION = ${JSON.stringify(next, null, 2)};
`;

// Skip the write entirely when the bytes would be identical: a no-op write
// still updates mtime, which is enough to make some watchers rebuild.
let unchanged = false;
try { unchanged = readFileSync(versionPath, 'utf8') === out; } catch { /* no file yet */ }
if (!unchanged) writeFileSync(versionPath, out);

const flags = [
  tree.behind ? `${tree.behind} BEHIND ${tree.upstream}` : '',
  tree.ahead ? `${tree.ahead} ahead` : '',
  tree.dirty ? 'dirty' : '',
].filter(Boolean).join(', ');
console.log(`[stamp-version] v${pkg.version} (${commit}) @ ${builtAt}${flags ? ` — ${flags}` : ''}`);
if (tree.behind) {
  console.log(`[stamp-version] ⚠  This tree is ${tree.behind} commits behind ${tree.upstream}.`);
  console.log(`[stamp-version] ⚠  What you see on :3000 is NOT the latest code.`);
}

// Cache-bust local resource references (src/… and config/…) in every HTML
// entry point. Leaves external URLs (fonts, CDNs) and already-anchored hash
// links alone — only same-origin src/config paths get a ?v= stamp.
// #783: only these two were ever cache-busted, so every standalone page under
// demos/ was served from the browser cache indefinitely. Fix the playground,
// reload, see the old page -- repeatedly, which reads as "still broken" and is
// indistinguishable from a fix that did not work. Any HTML entry point that
// loads local assets needs the stamp, not just the two SPA shells.
const ENTRY_HTML = ['index.html', 'project-index.html', ...standaloneEntries()];

function standaloneEntries() {
  const out = [];
  for (const dir of ['demos', 'pages']) {
    let names;
    try { names = readdirSync(path.join(root, dir)); } catch { continue; }
    for (const name of names) {
      if (name.endsWith('.html')) out.push(`${dir}/${name}`);
    }
  }
  return out;
}
// #783: `(?:\.\/)?` matched "src/..." and "./src/..." but NOT "../src/...",
// which is how every page under demos/ and pages/ reaches the same files.
// Those pages were therefore never stamped, and a browser held their CSS and
// modules indefinitely -- a fix would ship and the page would look unchanged,
// repeatedly. Allow any number of leading "../".
const ATTR_RE = /((?:href|src)=")((?:\.\.?\/)*(?:src|config)\/[^"?]+)(?:\?[^"]*)?(")/g;

for (const file of ENTRY_HTML) {
  const filePath = path.join(root, file);
  let html;
  try {
    html = readFileSync(filePath, 'utf8');
  } catch {
    continue; // entry point doesn't exist in this checkout
  }
  // Cache-bust on the VERSION, not the commit hash. `git rev-parse HEAD` here
  // reads the PARENT commit — this runs before the commit being made exists —
  // so the token was always one commit behind the change it exists to bust.
  // A CSS-only release therefore shipped with an unchanged ?v= and never
  // reached any browser holding the old file (measured: 3.0.63 deployed with
  // ?v=80d6768, the 3.0.62 commit). pkg.version is known before the commit,
  // changes exactly when a release ships, and is what the release is named
  // after. See #743.
  const stamped = html.replace(ATTR_RE, (_match, pre, url, post) => `${pre}${url}?v=${pkg.version}${post}`);
  if (stamped !== html) {
    writeFileSync(filePath, stamped);
    console.log(`[stamp-version] cache-busted ${file}`);
  }
}
