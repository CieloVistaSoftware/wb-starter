/**
 * seed-behavior-examples.mjs (#715)
 *
 * Adds curated examples to data/behavior-examples.json for behaviors that would
 * otherwise render the generated placeholder — `<article variant="flat">Example
 * article content</article>`. The schema supplies the tag and the attribute; the
 * BODY was filler, and for a container-shaped behavior filler is exactly why
 * there is nothing to look at (the x-dropdown empty menu, #701).
 *
 * Every entry below is written by hand against that behavior's own schema
 * properties (src/wb-models/<name>.schema.json), in kebab-case per §31, with
 * real content — names, prices, labels — not lorem.
 *
 * NEVER overwrites an existing catalogue entry: the curated ones already there
 * are the source of truth (#666).
 *
 * Usage:
 *   node scripts/seed-behavior-examples.mjs           # merge in the missing ones
 *   node scripts/seed-behavior-examples.mjs --check   # report, write nothing
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const CATALOGUE = path.join(ROOT, 'data', 'behavior-examples.json');
const CHECK = process.argv.includes('--check');

const img = (seed, w, h) => `https://picsum.photos/seed/${seed}/${w}/${h}`;

/** token -> markup. Attribute names come from each behavior's schema. */
export const EXAMPLES = {
  // ── Card family ────────────────────────────────────────────────────────────
  'x-card': `<article x-card title="Trailhead access" subtitle="Updated this morning" elevated>
  The north gate is open. Parking fills by 9am on weekends — the overflow lot adds
  about ten minutes on foot.
</article>`,

  'x-cardbutton': `<article x-cardbutton
  title="Upgrade to Team"
  content="Shared workspaces, audit history and SSO."
  primary="Start free trial"
  secondary="Compare plans"></article>`,

  'x-carddraggable': `<article x-carddraggable title="Drag me" content="Pick this card up and move it — the position sticks." constrain axis="both"></article>`,

  'x-cardexpandable': `<article x-cardexpandable
  title="What changed in 3.0"
  content="Composition replaced inheritance: a tag maps to a behavior function that decorates the element in place, in light DOM. There is no component base class any more, and no shadow boundary to reach through."
  lines="2"></article>`,

  'x-cardfile': `<article x-cardfile filename="quarterly-report.pdf" file-type="pdf" size="2.4 MB" date="2026-08-14" href="#"></article>`,

  'x-cardhero': `<section x-cardhero
  pretitle="Release 3.0"
  title="Zero build. Real components."
  subtitle="Light DOM, no shadow boundaries, no class hierarchy."
  cta="Read the guide"
  cta-href="#"
  height="320px"></section>`,

  'x-cardhorizontal': `<article x-cardhorizontal
  image="${img('trail', 320, 240)}"
  image-alt="Pine trail at dawn"
  image-position="start"
  title="Ridge loop, 8km"
  subtitle="Moderate · 3h"></article>`,

  'x-cardimage': `<article x-cardimage
  src="${img('harbour', 480, 300)}"
  alt="Fishing boats at the harbour wall"
  title="Harbour at first light"
  caption="Shot on the 6am walk-around."></article>`,

  'x-cardlink': `<article x-cardlink
  href="#"
  title="Attribute naming standard"
  description="Why every attribute is kebab-case, and what breaks when it is not."
  badge="Standard"></article>`,

  'x-cardminimizable': `<article x-cardminimizable
  title="Build log"
  content="tsc --noEmit clean. 141 regression tests passed. Packaged in 4.2s."></article>`,

  'x-cardnotification': `<aside x-cardnotification
  variant="warning"
  title="Certificate expires in 6 days"
  message="Renew before 26 Aug or the staging domain will start failing TLS."
  dismissible></aside>`,

  'x-cardoverlay': `<article x-cardoverlay
  image="${img('city', 480, 320)}"
  title="Night shift"
  subtitle="City desk, 02:00"
  position="bottom"></article>`,

  'x-cardportfolio': `<article x-cardportfolio
  name="Ada Lovelace"
  title="Principal engineer"
  company="Analytical Engines"
  location="London"
  cover="${img('ada-cover', 480, 200)}"></article>`,

  'x-cardpricing': `<article x-cardpricing
  plan="Team"
  price="$18"
  period="per user / month"
  description="For teams that need shared history and SSO."
  features="Unlimited projects,Audit log,SSO,Priority support"></article>`,

  'x-cardproduct': `<article x-cardproduct
  image="${img('headphones', 400, 400)}"
  title="Field headphones"
  description="Closed-back, 32Ω, folds flat."
  price="$149"
  original-price="$189"></article>`,

  'x-cardprofile': `<article x-cardprofile
  name="Grace Hopper"
  role="Compiler pioneer"
  avatar="${img('grace', 96, 96)}"
  bio="Wrote the first compiler, then spent a career arguing that people should not have to write machine code."></article>`,

  'x-cardstats': `<article x-cardstats value="1,284" label="Builds this month" trend="up" trend-value="12%"></article>`,

  'x-cardtestimonial': `<article x-cardtestimonial
  quote="We deleted the build step and shipped faster the same week."
  author="Katherine Johnson"
  role="Platform lead"
  avatar="${img('katherine', 96, 96)}"
  rating="5"></article>`,

  'x-cardvideo': `<article x-cardvideo
  src="/demos/sample.mp4"
  poster="${img('screening', 480, 270)}"
  title="Behaviors in 90 seconds"
  description="What replaced the component base class, and why."></article>`,

  'x-fix-card': `<article x-fix-card title="Pinned note" content="This card keeps its place while the rest of the page scrolls."></article>`,

  // ── Core UI ────────────────────────────────────────────────────────────────
  'x-button': `<button x-button variant="primary" icon="download" size="md">Download report</button>`,

  'x-badge': `<span x-badge label="Beta" variant="warning" pill></span>`,

  'x-chip': `<span x-chip label="typescript" icon="check" dismissible></span>`,

  'x-avatar': `<div x-avatar src="${img('ada', 64, 64)}" alt="Ada Lovelace" name="Ada Lovelace" size="lg"></div>`,

  'x-spinner': `<div x-spinner size="md" variant="primary" label="Loading results…"></div>`,

  'x-skeleton': `<div x-skeleton variant="text" lines="3" animated></div>`,

  'x-progress': `<progress x-progress value="72" max="100" label="Uploading footage" show-value></progress>`,
  'x-progressbar': `<progress x-progressbar value="72" max="100" label="Uploading footage" show-value></progress>`,

  'x-rating': `<div x-rating value="4" max="5" half></div>`,

  'x-tabs': `<div x-tabs active-tab="0" variant="underline">
  <section title="Overview">Composition over inheritance, in light DOM.</section>
  <section title="Attributes">Every attribute is kebab-case (§31).</section>
  <section title="Events">Behaviors fire wb:&lt;name&gt;:&lt;action&gt;.</section>
</div>`,

  'x-header': `<header x-header title="Field notes" subtitle="Everything that happened this week" badge="New"></header>`,

  'x-footer': `<footer x-footer brand="Cielo Vista Software" copyright="2026" links="Privacy,Terms,Status"></footer>`,

  'x-navbar': `<nav x-navbar brand="wb-starter" brand-href="#" tagline="Zero build"></nav>`,

  'x-hero': `<div x-hero variant="centered">
  <h1>Ship the markup, not the toolchain</h1>
  <p>Behaviors decorate real elements in light DOM — no build, no shadow roots.</p>
</div>`,

  'x-dialog': `<button x-dialog title="Delete branch?" content="fix/706-dropdown will be removed. This cannot be undone." size="md">Delete branch…</button>`,

  'x-drawer': `<button x-drawer title="Filters" content="Status, owner, label and date range live here." position="end" width="320px">Open filters</button>`,

  'x-accordion': `<div x-accordion>
  <details summary="How do behaviors attach?"><p>WB scans for x-* attributes and calls the matching behavior function on the element, in place.</p></details>
  <details summary="Is there a shadow root?"><p>No. Light DOM only — you can style and query everything.</p></details>
  <details summary="What about a build step?"><p>There isn't one. The browser loads the modules directly.</p></details>
</div>`,

  // ── Forms ──────────────────────────────────────────────────────────────────
  'x-input': `<div x-input label="Repository" placeholder="owner/name" name="repo" input-type="text"></div>`,

  'x-textarea': `<div x-textarea label="Release notes" placeholder="What changed?" name="notes" rows="4"></div>`,

  'x-select': `<div x-select label="Branch" name="branch" options="main,develop,fix/706-dropdown" value="main"></div>`,

  'x-checkbox': `<div x-checkbox label="Run the full suite before pushing" name="full-suite" checked></div>`,

  'x-switch': `<div x-switch label="Publish to staging on merge" name="auto-deploy" checked></div>`,

  'x-otp': `<div x-otp length="6"></div>`,

  'x-counter': `<textarea x-counter max="280" warning="40" placeholder="What are you shipping?"></textarea>`,

  'x-form': `<form x-form validate ajax>
  <label>Email <input type="email" name="email" required placeholder="you@example.com"></label>
  <label>Message <textarea name="message" rows="3" required></textarea></label>
  <button type="submit">Send</button>
</form>`,

  'x-formrow': `<div x-formrow inline>
  <input type="text" placeholder="City">
  <input type="text" placeholder="ZIP code">
</div>`,

  'x-fieldset': `<fieldset x-fieldset collapsible>
  <legend>Notification settings</legend>
  <label><input type="checkbox" checked> Build finished</label>
  <label><input type="checkbox"> Nightly audit</label>
</fieldset>`,

  'x-inputgroup': `<div x-inputgroup>
  <span>https://</span>
  <input type="text" placeholder="your-site.io">
  <button type="button">Check</button>
</div>`,

  'x-floatinglabel': `<div x-floatinglabel>
  <input type="text" id="wb-ex-floating" placeholder=" ">
  <label for="wb-ex-floating">Project name</label>
</div>`,

  'x-searchfield': `<input x-searchfield type="search" placeholder="Search 143 behaviors…">`,

  'x-slider': `<input x-slider type="range" min="0" max="100" value="35">`,

  'x-file': `<input x-file type="file" accept="image/*">`,

  'x-label': `<label x-label required label-position="top">Deploy key</label>`,

  'x-autocomplete': `<input x-autocomplete items="main,develop,release/3.0,fix/706-dropdown,docs/behaviors" placeholder="Find a branch…">`,

  'x-autosize': `<textarea x-autosize rows="1" placeholder="This grows as you type — try three or four lines."></textarea>`,

  'x-control': `<div x-control label="Threshold">
  <input type="range" min="0" max="100" value="60">
</div>`,

  // ── Layout ─────────────────────────────────────────────────────────────────
  'x-flex': `<div x-flex gap="1rem">
  <div>First</div><div>Second</div><div>Third</div>
</div>`,

  'x-stack': `<div x-stack gap="0.75rem" pad="1rem" radius="8px">
  <div>Queued</div><div>Running</div><div>Passed</div>
</div>`,

  'x-cluster': `<div x-cluster gap="0.5rem">
  <span>typescript</span><span>playwright</span><span>light-dom</span><span>no-build</span>
</div>`,

  'x-masonry': `<div x-masonry columns="3" gap="0.75rem">
  <img src="${img('m1', 300, 220)}" alt="">
  <img src="${img('m2', 300, 320)}" alt="">
  <img src="${img('m3', 300, 180)}" alt="">
  <img src="${img('m4', 300, 260)}" alt="">
</div>`,

  'x-ratio': `<div x-ratio ratio="16:9">
  <img src="${img('wide', 640, 360)}" alt="Coastline from the air">
</div>`,

  'x-span': `<span x-span variant="muted">Last run 4 minutes ago</span>`,

  'x-repeater': `<div x-repeater>
  <div>Row template — add and remove copies of this block.</div>
</div>`,

  'x-demo': `<div x-demo columns="2">
  <button>One</button>
  <button>Two</button>
</div>`,

  // ── Media ──────────────────────────────────────────────────────────────────
  'x-audio': `<div x-audio src="/demos/sample.wav" volume="0.8"></div>`,

  'x-video': `<video x-video src="/demos/sample.mp4" poster="${img('screening', 640, 360)}" controls></video>`,

  'x-img': `<img x-img src="${img('lens', 480, 320)}" alt="Prime lens on a wooden desk">`,

  'x-image': `<img x-image src="${img('lens', 480, 320)}" alt="Prime lens on a wooden desk" lazy zoomable>`,

  'x-figure': `<figure x-figure>
  <img src="${img('bridge', 480, 300)}" alt="Suspension bridge in fog">
  <figcaption>The 6am crossing, before the fog lifted.</figcaption>
</figure>`,

  'x-gallery': `<div x-gallery columns="3">
  <img src="${img('g1', 240, 240)}" alt="">
  <img src="${img('g2', 240, 240)}" alt="">
  <img src="${img('g3', 240, 240)}" alt="">
</div>`,

  'x-vimeo': `<div x-vimeo video-id="76979871"></div>`,

  // ── Text & code ────────────────────────────────────────────────────────────
  'x-pre': `<pre x-pre>npm run test:compliance
  7591 passed
     82 failed</pre>`,

  'x-kbd': `<span x-kbd>Ctrl</span> <span x-kbd>Shift</span> <span x-kbd>P</span>`,

  'x-mark': `<p>Search matched <mark x-mark>light DOM</mark> in 12 documents.</p>`,

  'x-truncate': `<p x-truncate lines="2">Composition replaced inheritance in 3.0: a tag maps to a behavior function that decorates the element in place, in light DOM. There is no component base class any more, and no shadow boundary to reach through, so everything stays styleable and queryable.</p>`,

  'x-typewriter': `<p x-typewriter speed="45">Zero build. Real components. Light DOM only.</p>`,

  'x-mdhtml': `<div x-mdhtml src="/docs/behaviors/dropdown.md"></div>`,

  'x-notes': `<aside x-notes position="end" default-width="280px">
  <p>Notes stay pinned beside the content while you scroll.</p>
</aside>`,

  'x-error': `<div x-error>Build failed: 2 of 13 catalog-integrity checks.</div>`,

  'x-help': `<span x-help>Deploy key</span>`,

  'x-collapse': `<div x-collapse heading="Environment" expanded>
  <p>Node 24.13, Chrome 139, Windows 11.</p>
</div>`,

  'x-steps': `<div x-steps current="1">
  <div>Clone</div><div>Install</div><div>Run</div>
</div>`,

  'x-breadcrumb': `<nav x-breadcrumb>
  <a href="#">Docs</a>
  <a href="#">Behaviors</a>
  <span>Dropdown</span>
</nav>`,

  'x-pagination': `<nav x-pagination total="12" current="3"></nav>`,

  'x-timeline': `<div x-timeline>
  <div>3.0.44 — behaviors browse panel</div>
  <div>3.0.46 — dropdown examples</div>
  <div>3.0.48 — 143 behavior docs</div>
</div>`,

  // ── Utilities & effects ────────────────────────────────────────────────────
  'x-copybutton': `<button x-copybutton copy-target="#wb-ex-copy-source">Copy command</button>
<code id="wb-ex-copy-source">npm run test:compliance</code>`,

  'x-clock': `<span x-clock format="HH:mm:ss"></span>`,

  'x-countdown': `<span x-countdown to="2026-12-31T23:59:59"></span>`,

  'x-relativetime': `<time x-relativetime datetime="2026-08-20T09:15:00Z"></time>`,

  'x-share': `<button x-share title="wb-starter" text="Zero build. Real components." url="https://github.com/CieloVistaSoftware/wb-starter">Share</button>`,

  'x-print': `<button x-print>Print this page</button>`,

  'x-fullscreen': `<button x-fullscreen target="#wb-ex-fullscreen-stage">Go fullscreen</button>
<div id="wb-ex-fullscreen-stage">This panel is what expands.</div>`,

  'x-confirm': `<button x-confirm message="Delete this branch? This cannot be undone.">Delete branch</button>`,

  'x-prompt': `<button x-prompt message="Name the new branch" default-value="fix/">New branch…</button>`,

  'x-notify': `<button x-notify message="Deploy finished — staging is live." variant="success">Notify me</button>`,

  'x-popover': `<button x-popover content="Runs the full compliance suite. Takes about 12 minutes.">What does this do?</button>`,

  'x-toggle': `<button x-toggle target="#wb-ex-toggle-panel">Show details</button>
<div id="wb-ex-toggle-panel">The panel this button toggles.</div>`,

  'x-globe': `<div x-globe></div>`,

  'x-themecontrol': `<div x-themecontrol></div>`,

  'x-codecontrol': `<div x-codecontrol></div>`,

  // ── Positional / motion ────────────────────────────────────────────────────
  'x-article': `<article x-article title="Ridge loop, 8km" subtitle="Moderate · 3h" author="Ada Lovelace" date="2026-08-20" category="Trails">
  The north gate is open and the creek crossing is dry. Parking fills by 9am on
  weekends — the overflow lot adds about ten minutes on foot.
</article>`,

  'x-articles': `<section x-articles layout="grid" columns="2" limit="4">
  <article title="Ridge loop, 8km">Moderate, three hours, dry crossing.</article>
  <article title="Harbour wall at dawn">Flat, two hours, best before the fog lifts.</article>
  <article title="Pine gap traverse">Hard, six hours, carry water.</article>
  <article title="Old quarry circuit">Easy, ninety minutes, good in rain.</article>
</section>`,

  'x-draggable': `<div x-draggable axis="both">Drag me anywhere in the stage.</div>`,

  'x-drawer-layout': `<aside x-drawer-layout position="start" width="220px" min-width="64px">
  <nav><a href="#">Overview</a><a href="#">Runs</a><a href="#">Settings</a></nav>
</aside>`,

  'x-move': `<button x-move distance="120px" duration="0.6s">Move me</button>`,

  'x-release': `<div x-release version="3.0.48" date="2026-08-20">
  143 behavior docs, curated showcase examples, dropdown fixes.
</div>`,

  'x-resizable': `<div x-resizable handles="se">
  Grab the corner and resize this panel.
</div>`,

  'x-scrollalong': `<aside x-scrollalong offset="16">
  Keeps pace with the page as you scroll.
</aside>`,

  'x-stagelight': `<div x-stagelight variant="spotlight" color="#f59e0b" intensity="0.5" size="360px">
  The spotlight follows the pointer across this panel.
</div>`,

  'x-sticky': `<div x-sticky offset="0" stuck-class="is-stuck">
  Sticks to the top of its scroll container once you pass it.
</div>`,

  'x-tags': `<input x-tags value="light-dom,no-build,playwright" placeholder="Add a tag…">`,
};

// ── merge ─────────────────────────────────────────────────────────────────────
const raw = JSON.parse(fs.readFileSync(CATALOGUE, 'utf8'));
const existing = raw.examples || {};

const added = [];
const skipped = [];
for (const [token, source] of Object.entries(EXAMPLES)) {
  if (existing[token]) { skipped.push(token); continue; }
  added.push(token);
  if (!CHECK) existing[token] = { source, alternates: [] };
}

if (CHECK) {
  console.log(`[seed-examples] would add ${added.length}, leaving ${skipped.length} curated entries alone`);
  process.exit(0);
}

raw.examples = existing;
raw.count = Object.keys(existing).length;
fs.writeFileSync(CATALOGUE, JSON.stringify(raw, null, 2) + '\n', 'utf8');
console.log(`[seed-examples] added ${added.length} example(s); ${skipped.length} already curated and left alone. Catalogue now ${raw.count}.`);
